# -*- coding: utf-8 -*-
"""Put a finished night into the account, so nobody has to paste it.

The website and the app read the same table - daily_content in Supabase. Until
now the only way a night got there was Levi opening Admin and pasting five boxes
by hand, every night. This is that paste, done by the GitHub Action instead.

A night is a folder,  lantern/<slug>/ , holding:

  night.json                       what the night is (see NIGHT_KEYS below)   required
  morning-lantern-lds.html         the Latter-day Saint edition               required
  morning-lantern-christian.html   the Christian edition                      optional
  <slug>.html                      the illustrated story (the picture book)  optional
  <slug>-lullaby.html              tonight's song page                        optional
  <slug>-lullaby.mp3               sung by the step before this one           optional
  lullaby.json                     the words, for the step that sings them    optional

Each folder is published once per change: a fingerprint of the inputs is kept in
.published.json beside them, and a folder whose fingerprint has not moved is left
alone. Change any file - a corrected edition, a new mp3 - and it goes again.
Upserts on publish_date, exactly as the app's own Admin does, so re-publishing a
date replaces that night rather than doubling it.

A save from the app's Admin screen writes only the boxes Admin has, so it wipes
the pieces only this publisher sends - the song page, the sung mp3, the book,
the Traveler. So an unchanged folder is still checked against the account, and
if a piece it carries has gone missing from the row, the night goes again.

The song and story links are written the way Admin writes them - the bare file
name (you-know-me-lullaby.html), which is what the Morning Lantern's own
resource buttons point at and what the app opens by name.

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
# The illustrated story, on its way to the account. A book is mostly photographs;
# these are the size the phone actually shows them at. 0 leaves them alone.
BOOK_MAX_SIDE = int(os.environ.get("BOOK_MAX_SIDE", "1200"))
BOOK_QUALITY  = int(os.environ.get("BOOK_QUALITY", "78"))
# Bumped whenever this file changes what a published night contains, so that
# every folder goes again instead of being skipped as unchanged. The
# fingerprint below only watches the files; it cannot see a new rule here.
PUBLISH_REV = "2"   # 2: artwork re-encoded, the story addressed in full

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

def quick_text(page, limit=4400):   # under the narrate function's 4,500 with room for the count to differ
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

def shrink_book(html):
    """The illustrated story, small enough for a phone to keep.

    The app saves tonight's book in the browser so it opens again without a
    signal, and a browser will not hold much more than five megabytes. A book of
    full-size photographs is three, so it was never kept - and the story went
    from being in the family's hand to being a page away on the website.

    The pictures are re-encoded once, here, on the way to the account. The copy
    in this repository is untouched and stays the master; the website goes on
    serving it at full size.

    Returns the book and a line to print. Without Pillow the book goes exactly as
    it is - a heavy book beats no book, and this never fails the run.
    """
    if not html or not BOOK_MAX_SIDE:
        return html, ""
    try:
        from PIL import Image
    except ImportError:
        return html, "Pillow is not installed - the book goes at full size"
    import base64, io
    tally = [0, 0, 0]        # pictures re-encoded, bytes before, bytes after

    def one(m):
        b64 = m.group(2)
        try:
            raw = base64.b64decode(b64 + "=" * (-len(b64) % 4))
            im = Image.open(io.BytesIO(raw)); im.load()
        except Exception:
            return m.group(0)                      # not a picture we understand
        if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
            return m.group(0)                      # see-through parts, leave it be
        w, h = im.size
        scale = min(1.0, float(BOOK_MAX_SIDE) / max(w, h))
        if scale < 1:
            im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
        buf = io.BytesIO()
        try:
            im.convert("RGB").save(buf, "JPEG", quality=BOOK_QUALITY,
                                   optimize=True, progressive=True)
        except Exception:
            return m.group(0)
        if buf.tell() >= len(raw):
            return m.group(0)                      # already smaller than ours
        tally[0] += 1; tally[1] += len(raw); tally[2] += buf.tell()
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    out = re.sub(r"data:image/([a-z+]+);base64,([A-Za-z0-9+/=]+)", one, html)
    if not tally[0]:
        return html, ""
    mb = lambda n: n / 1048576.0
    return out, (f"artwork {tally[0]} picture(s), {mb(tally[1]):.1f} MB -> {mb(tally[2]):.1f} MB; "
                 f"book {mb(len(html)):.1f} MB -> {mb(len(out)):.1f} MB")

URL_COLS = ("story_link", "narration_url", "lantern_url", "song_url", "lyrics_url", "song_audio_url")

def url_only(row):
    """A URL column gets a URL, never the file itself. For a while the app's Admin
    put whole MP3s - megabytes of base64 - into song_audio_url, and every list
    that asked for that column paid for it. Nothing this publisher builds does
    that, but the rule belongs at the door, not in one caller."""
    for k in URL_COLS:
        v = row.get(k)
        if isinstance(v, str) and re.match(r"(?i)^(data:|idb:|blob:)", v.strip()):
            print(f"    {k} held a file, not an address ({len(v)} chars) - dropped")
            row[k] = None
    return row

def upsert(row):
    """One night into daily_content. Postgres refuses the whole row for one
    column it does not know, so drop the one it names and try again - the
    app does the same on its reads."""
    hdr = {"apikey": KEY, "Authorization": "Bearer " + KEY,
           "Content-Type": "application/json",
           "Prefer": "resolution=merge-duplicates,return=minimal"}
    row = url_only(dict(row))
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

# THE MARKETING RULE. The moment a night is in the account, its marketing is
# drafted from it - one piece each for Instagram, Facebook, TikTok, Pinterest,
# YouTube and email, written from the night's story and its Morning Lantern
# study - and filed as "ready" for the owner to approve in the app's Marketing
# Desk. Nothing is posted by this. The function itself skips a night that
# already has its tree, so a re-publish never doubles the queue.
MARKET = os.environ.get("MARKET", "1") != "0"
# THE BACKFILL LINE (7 Oct 2026). Levi asked for a devotional night for every story back to
# June, the first book - nights from before the app's first night (24 Aug 2026) published now.
# Those get no voices recorded (ElevenLabs credits need Levi's go) and no marketing drafted (they
# are not news): only a night on or after FIRST_LIVE_NIGHT does. The phone's own voice still
# reads a backfilled night aloud.
FIRST_LIVE_NIGHT = os.environ.get("FIRST_LIVE_NIGHT", "2026-08-24")
def live_night(date):
    return str(date or "") >= FIRST_LIVE_NIGHT
def market(date):
    """Ask the drafter for the night's three slots (morning, midday, evening):
    each call writes the first slot still missing and says how many remain."""
    hdr = {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
    status, body = 0, b""
    for _ in range(3):
        status, body = http("POST", URL + "/functions/v1/marketing-draft", {"date": date}, hdr, timeout=300)
        if status != 200: break
        try:
            if int(json.loads(body).get("remaining", 0)) <= 0: break
        except Exception:
            break
    return status, body[:300]

def missing_in_account(date, expect):
    """The pieces this folder carries that the row for `date` no longer has.

    `expect` maps a column to whether the folder has it. Only small columns
    are read (never the HTML), so this costs one tiny request per night."""
    cols = ",".join(sorted(expect))
    hdr = {"apikey": KEY, "Authorization": "Bearer " + KEY}
    status, body = http("GET", f"{URL}/rest/v1/daily_content?publish_date=eq.{date}&select={cols}", headers=hdr)
    if status != 200:
        return []          # cannot tell - do not republish on a guess
    try:
        rows = json.loads(body)
    except Exception:
        return []
    if not rows:
        return ["the whole night"]
    row = rows[0]
    return [c for c, have in expect.items() if have and row.get(c) in (None, "")]

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
        book_path = os.path.join(folder, f"{slug}.html")
        song_path = os.path.join(folder, f"{slug}-lullaby.html")
        mp3_path  = os.path.join(folder, f"{slug}-lullaby.mp3")
        if not os.path.exists(lds_path):
            print(f"{slug}: no morning-lantern-lds.html yet - waiting"); continue

        lds  = read(lds_path)
        chr_ = read(chr_path) if os.path.exists(chr_path) else ""
        song = read(song_path) if os.path.exists(song_path) else ""
        has_mp3 = os.path.exists(mp3_path)

        # THE SONG RULE. A night's song is a page - the words with their own Play
        # button - never the bare recording. The app opens song_url (the page)
        # first and falls back to song_audio_url only for a night with no page,
        # so a night that ships a recording without its page lands families on
        # a player with no words. Say so loudly; the words are the deliverable.
        if has_mp3 and not song:
            print(f"{slug}: SONG RULE - {slug}-lullaby.mp3 is here but {slug}-lullaby.html is not; "
                  f"the app will fall back to the bare player until the song page is pushed")
        if song and ('id="player"' not in song or 'playBtn' not in song):
            print(f"{slug}: SONG RULE - {slug}-lullaby.html has no player of its own "
                  f"(expected <audio id=\"player\"> and #playBtn from lantern/lullaby-template.html)")

        # The illustrated story: the copy in this folder when the night brought
        # one, otherwise the page the app already has, one per night.
        book_html, book_link = "", ""
        if os.path.exists(book_path):
            book_html = read(book_path)
            # In full, not by name. The app matches the Lantern's own "Tonight's
            # Story" button to this by file name either way, and when the book is
            # too big for the phone to keep, this address is the only way back to
            # it - a bare name sends the app to the top of the website, where no
            # book has ever lived.
            book_link = f"{SITE_BASE}/lantern/{slug}/{slug}.html"
        elif night.get("book_page"):
            book_html = fetch(APP_BASE + "/" + str(night["book_page"]).lstrip("/"))
            book_link = APP_BASE + "/" + str(night["book_page"]).lstrip("/")
            if not book_html:
                print(f"{slug}: could not fetch the story page {night['book_page']} - publishing without the book")

        stamp = sha(PUBLISH_REV, json.dumps(night, sort_keys=True), lds, chr_, song, book_html,
                    "mp3" if has_mp3 else "")
        marker = os.path.join(folder, ".published.json")
        if os.path.exists(marker):
            try:
                if json.load(open(marker)).get("sha") == stamp:
                    gone = missing_in_account(date, {
                        "song_url": bool(song), "song_audio_url": has_mp3,
                        "story_link": bool(book_html), "traveler": bool(night.get("traveler")),
                    })
                    if not gone:
                        print(f"{slug}: unchanged since it was published - nothing to do"); continue
                    print(f"{slug}: the account has lost {', '.join(gone)} (an Admin save?) - publishing again")
            except Exception:
                pass

        # A night already in the account that only lacks its Christian edition (Aug 24, 26 and 27
        # went out before there were two editions): night.json says "christian_only": true, and
        # only that one column is written. Its words, song, book, voices and published date stay
        # exactly as they are, so nothing is recorded or drafted again and no credit is spent.
        if night.get("christian_only"):
            if not chr_:
                print(f"{slug}: christian_only, but no morning-lantern-christian.html yet - waiting"); continue
            ok, why = upsert({"publish_date": date, "story_html_nondenom": chr_})
            if not ok:
                print(f"{slug}: Christian edition NOT published - {why}"); failures += 1; continue
            print(f"{slug}: Christian edition added for {date} (nothing else touched)")
            with open(marker, "w", encoding="utf-8") as fh:
                json.dump({"sha": stamp, "date": date, "christian_only": True}, fh, indent=2)
            continue

        row = {NIGHT_KEYS[k]: night[k] for k in NIGHT_KEYS if night.get(k) not in (None, "")}
        row.update({
            "story_html": lds,
            "story_text": quick_text(lds),
            "published_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })
        if chr_:      row["story_html_nondenom"] = chr_
        if song:
            # By name, as Admin writes it: the Morning Lantern's own "Tonight's
            # Lullaby" button points at this file name, and the app opens the
            # song page it holds when the two match.
            row["song_html"]  = song
            row["song_url"]   = f"{slug}-lullaby.html"
            row["lyrics_url"] = row["song_url"]
        if has_mp3:   row["song_audio_url"] = f"{SITE_BASE}/lantern/{slug}/{slug}-lullaby.mp3"
        # song_url is the page and only ever the page; the recording has its own column.
        assert not str(row.get("song_url", "")).lower().endswith((".mp3", ".m4a", ".wav")), "song_url must be the song page, never the recording"
        if book_html:
            small, note = shrink_book(book_html)
            if note: print(f"    {note}")
            row["book_html"] = small
            # The same by name, so the app can match the devotional's own
            # "Tonight's Story" button to the book it holds.
            row.setdefault("story_link", book_link)

        ok, why = upsert(row)
        if not ok:
            print(f"{slug}: NOT published - {why}"); failures += 1; continue
        pieces = ["devotional"] + (["Christian edition"] if chr_ else []) + (["song page"] if song else []) \
                 + (["sung lullaby"] if has_mp3 else []) + (["story book"] if book_html else [])
        print(f"{slug}: published for {date} - {', '.join(pieces)}")

        if not live_night(date):
            print(f"    a night from before the app began: no recording, no marketing (the backfill line)")
        elif NARRATE and row["story_text"]:
            status, body = narrate(date)
            if status == 200: print(f"    narration: recorded")
            else:             print(f"    narration: not recorded ({status}) {body}")

        if MARKET and live_night(date):
            status, body = market(date)
            if status == 200: print(f"    marketing: drafted for the owner to approve")
            else:             print(f"    marketing: not drafted ({status}) {body}")

        with open(marker, "w", encoding="utf-8") as fh:
            json.dump({"sha": stamp, "date": date, "at": row["published_at"]}, fh, indent=2)

    # The voices. Every night in the account that has words to read but no
    # recording yet gets asked for one - not only tonight's. For a while the
    # narrate function refused the Action's key and every night went out silent,
    # so a night that missed its turn is picked up on the next run, a few at a
    # time, rather than staying silent for good.
    if NARRATE:
        sweep_voices()
    return 1 if failures else 0

def sweep_voices(limit=6):
    hdr = {"apikey": KEY, "Authorization": "Bearer " + KEY}
    status, body = http("GET", URL + "/rest/v1/daily_content?select=publish_date,narration_urls,story_text"
                        "&published_at=not.is.null&order=publish_date.desc&limit=60", None, hdr)
    if status != 200:
        print(f"voices: could not list nights ({status})"); return
    try:
        rows = json.loads(body)
    except Exception:
        print("voices: could not read the list"); return
    todo = [r for r in rows if (r.get("story_text") or "").strip() and live_night(r.get("publish_date"))
            and not (isinstance(r.get("narration_urls"), dict) and any(r["narration_urls"].values()))]
    if not todo:
        print("voices: every night with words has its recording"); return
    print(f"voices: {len(todo)} night(s) without a recording; asking for up to {limit}")
    for r in todo[:limit]:
        st, resp = narrate(r["publish_date"])
        print(f"    {r['publish_date']}: {'recorded' if st == 200 else f'not recorded ({st}) {resp}'}")

if __name__ == "__main__":
    sys.exit(main())
