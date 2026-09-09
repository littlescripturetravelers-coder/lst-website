# -*- coding: utf-8 -*-
"""Put a finished night into the account, so nobody has to paste it.

The website and the app read the same table - daily_content in Supabase. Until
now the only way a night got there was Levi opening Admin and pasting five boxes
by hand, every night. This is that paste, done by the GitHub Action instead.

A night is a folder,  lantern/<slug>/ , holding:

  night.json                       what the night is (see NIGHT_KEYS below)   required
  morning-lantern-lds.html         the Latter-day Saint edition               required
  morning-lantern-christian.html   the Christian edition                      optional
  <slug>-lullaby.html              tonight's song page                        optional
  <slug>-lullaby.mp3               sung by the step before this one           optional
  lullaby.json                     the words, for the step that sings them    optional

Each folder is published once per change: a fingerprint of the inputs is kept in
.published.json beside them, and a folder whose fingerprint has not moved is left
alone. Change any file - a corrected edition, a new mp3 - and it goes again.
Upserts on publish_date, exactly as the app's own Admin does, so re-publishing a
date replaces that night rather than doubling it.

Needs SUPABASE_SERVICE_ROLE_KEY in the environment. Without it, it says so and
does nothing - it never fails the run over a missing secret.
"""
import glob, hashlib, html, json, os, re, sys, time, urllib.error, urllib.request

DEST      = os.environ.get("DEST", "lantern")
URL       = os.environ.get("SUPABASE_URL", "https://rdbvktqgrwhjucocobua.supabase.co").rstrip("/")
KEY       = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SITE_BASE = os.environ.get("SITE_BASE", "https://littlescripturetravelers.com").rstrip("/")
APP_BASE  = os.environ.get("APP_BASE", "https://app.littlescripturetravelers.com").rstrip("/")
NARRATE   = os.environ.get("NARRATE", "1") != "0"

# night.json -> daily_content. Left column is the key in night.json.
NIGHT_KEYS = {
    "publish_date": "publish_date",   # YYYY-MM-DD - the day this night is for
    "title": "title", "scripture": "scripture",
    "traveler": "traveler",           # beau | scout | willow | wren
    "traveler_why": "traveler_why", "traveler_about": "traveler_about",
    "story_link": "story_link",       # a page to open instead of a book, if there is no book
    "book": "book", "week": "week", "night": "night",
}

def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()

def sha(*parts):
    h = hashlib.sha256()
    for p in parts:
        h.update(p.encode("utf-8") if isinstance(p, str) else p)
        h.update(b"\x00")
    return h.hexdigest()

def quick_text(page, limit=4500):
    """The words a voice should read: the Quick section, as plain text.

    Mirrors narrationDraft() in the app - the Quick reading only, furniture
    removed, cut at the last whole sentence that fits Google's ceiling."""
    m = re.search(r'id="tab-quick"[^>]*>', page)
    if not m:
        return ""
    start = m.end()
    end = page.find("<!-- /quick -->", start)
    if end < 0:
        end = page.find('<div class="edition"', start)
    frag = page[start: end if end > 0 else None]
    frag = re.sub(r"<(script|style|button|nav)\b.*?</\1>", " ", frag, flags=re.S | re.I)
    frag = re.sub(r'<[^>]+class="[^"]*(toolkit-btn|weekly-pill|chip|float-menu|save-bar)[^"]*"[^>]*>.*?</[a-z0-9]+>',
                  " ", frag, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", frag)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > limit:
        cut = text[:limit]
        stop = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
        text = (cut[:stop + 1] if stop > 2000 else cut).strip()
    return text

def http(method, url, body=None, headers=None, timeout=90):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, res.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")

def fetch(url):
    status, body = http("GET", url, headers={"User-Agent": "lantern-publish"})
    return body if status == 200 else ""

def upsert(row):
    """One night into daily_content. Postgres refuses the whole row for one
    column it does not know, so drop the one it names and try again - the
    app does the same on its reads."""
    hdr = {"apikey": KEY, "Authorization": "Bearer " + KEY,
           "Content-Type": "application/json",
           "Prefer": "resolution=merge-duplicates,return=minimal"}
    row = dict(row)
    for _ in range(8):
        status, body = http("POST", URL + "/rest/v1/daily_content?on_conflict=publish_date", row, hdr)
        if status in (200, 201, 204):
            return True, ""
        m = re.search(r"Could not find the '([A-Za-z0-9_]+)' column", body) \
            or re.search(r'column "?([A-Za-z0-9_]+)"? (?:of relation "daily_content" )?does not exist', body)
        if m and m.group(1) in row:
            print(f"    the database has no {m.group(1)} column - publishing without it")
            del row[m.group(1)]
            continue
        return False, f"{status}: {body[:300]}"
    return False, "gave up after dropping eight columns"

def narrate(date):
    hdr = {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
    status, body = http("POST", URL + "/functions/v1/narrate", {"date": date}, hdr, timeout=300)
    return status, body[:300]

def main():
    folders = sorted(glob.glob(os.path.join(DEST, "*", "night.json")))
    if not folders:
        print("No night.json anywhere - nothing to publish."); return 0
    if not KEY:
        print(f"{len(folders)} night(s) have a night.json, but SUPABASE_SERVICE_ROLE_KEY is not set - "
              "add it under Settings > Secrets and variables > Actions, and this step will publish them."); return 0

    failures = 0
    for manifest_path in folders:
        folder = os.path.dirname(manifest_path); slug = os.path.basename(folder)
        try:
            night = json.load(open(manifest_path, encoding="utf-8"))
        except Exception as e:
            print(f"{slug}: night.json is not valid JSON ({e}) - skipped"); failures += 1; continue
        date = night.get("publish_date", "")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date or ""):
            print(f"{slug}: night.json has no publish_date (YYYY-MM-DD) - skipped"); failures += 1; continue

        lds_path  = os.path.join(folder, "morning-lantern-lds.html")
        chr_path  = os.path.join(folder, "morning-lantern-christian.html")
        song_path = os.path.join(folder, f"{slug}-lullaby.html")
        mp3_path  = os.path.join(folder, f"{slug}-lullaby.mp3")
        if not os.path.exists(lds_path):
            print(f"{slug}: no morning-lantern-lds.html yet - waiting"); continue

        lds  = read(lds_path)
        chr_ = read(chr_path) if os.path.exists(chr_path) else ""
        song = read(song_path) if os.path.exists(song_path) else ""
        has_mp3 = os.path.exists(mp3_path)

        # The illustrated story lives in the app already, one page per night. Ask
        # the web app for it rather than carrying a copy of every picture here.
        book_html = ""
        if night.get("book_page"):
            book_html = fetch(APP_BASE + "/" + str(night["book_page"]).lstrip("/"))
            if not book_html:
                print(f"{slug}: could not fetch the story page {night['book_page']} - publishing without the book")

        stamp = sha(json.dumps(night, sort_keys=True), lds, chr_, song, book_html, "mp3" if has_mp3 else "")
        marker = os.path.join(folder, ".published.json")
        if os.path.exists(marker):
            try:
                if json.load(open(marker)).get("sha") == stamp:
                    print(f"{slug}: unchanged since it was published - nothing to do"); continue
            except Exception:
                pass

        row = {NIGHT_KEYS[k]: night[k] for k in NIGHT_KEYS if night.get(k) not in (None, "")}
        row.update({
            "story_html": lds,
            "story_text": quick_text(lds),
            "published_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })
        if chr_:      row["story_html_nondenom"] = chr_
        if song:
            row["song_html"]  = song
            row["song_url"]   = f"{SITE_BASE}/lantern/{slug}/{slug}-lullaby.html"
            row["lyrics_url"] = row["song_url"]
        if has_mp3:   row["song_audio_url"] = f"{SITE_BASE}/lantern/{slug}/{slug}-lullaby.mp3"
        if book_html:
            row["book_html"] = book_html
            # The same page by address, for anyone reading outside the app - the
            # website's Tonight page, the emailed night - and so the app can match
            # the devotional's own story link to it by name.
            row.setdefault("story_link", APP_BASE + "/" + str(night["book_page"]).lstrip("/"))

        ok, why = upsert(row)
        if not ok:
            print(f"{slug}: NOT published - {why}"); failures += 1; continue
        pieces = ["devotional"] + (["Christian edition"] if chr_ else []) + (["song page"] if song else []) \
                 + (["sung lullaby"] if has_mp3 else []) + (["story book"] if book_html else [])
        print(f"{slug}: published for {date} - {', '.join(pieces)}")

        if NARRATE and row["story_text"]:
            status, body = narrate(date)
            if status == 200: print(f"    narration: recorded")
            else:             print(f"    narration: not recorded ({status}) {body}")

        with open(marker, "w", encoding="utf-8") as fh:
            json.dump({"sha": stamp, "date": date, "at": row["published_at"]}, fh, indent=2)

    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
