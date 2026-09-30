#!/usr/bin/env python3
"""
THE WORLD TIMELINE LEARNS ON ITS OWN.

Three jobs, one script (JOB=tech, JOB=discoveries or JOB=studies):

  tech         every day: for each technology in the Technology for Good guide,
               look for what the world has learned lately about its effects on
               children, families and society, and add a dated, sourced note;
               and look for any new technology families should know about, and
               add a full card for it. Nothing is ever removed.

  discoveries  once a month: look for new archaeological, historical and
               scientific finds that bear on the Bible, the Book of Mormon and
               Christ, published recently, each with its source and an honest
               confidence label (confirmed / believed / debated). Hoaxes and
               claims with no credible source are left out.

  studies      several times a day until every event has one: for each event in
               the Study Library that has no in-depth study yet (the list is
               lantern/timeline-feed/events-index.json, exported from the
               timeline), write one - what happened, the world it happened in,
               why it matters, what the scriptures say, what the evidence shows
               with an honest label, what we can learn, a word for a child, a
               question for tonight - with web search and at least two sources
               that can be opened. Bedtime stories, the technology guide and
               the discoveries have their own studies and are skipped.

The guide's current copy is read from the account (table timeline_feed), the
model is asked - with web search - for additions only, the additions are
checked and merged, the version is bumped, and the result is written back to
the account and into lantern/timeline-feed/ in this repo (its history).

Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY.
"""
import json, os, re, sys, time, datetime, html, urllib.request, urllib.error

JOB        = os.environ.get("JOB", "tech").strip()
MODEL      = os.environ.get("TIMELINE_WATCH_MODEL", "gpt-4.1").strip()
SB_URL     = os.environ.get("SUPABASE_URL", "").rstrip("/")
SB_KEY     = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
OA_KEY     = os.environ.get("OPENAI_API_KEY", "").strip()
HERE       = os.path.dirname(os.path.abspath(__file__))
FEED_DIR   = os.path.join(HERE, "timeline-feed")
ROW        = {"tech": "tech", "discoveries": "discoveries", "studies": "studies"}[JOB]
INDEX_FILE = os.path.join(FEED_DIR, "events-index.json")
PER_RUN    = int(os.environ.get("STUDIES_PER_RUN") or "80")
SEED_FILE  = os.path.join(FEED_DIR, ROW + ".json")
TODAY      = datetime.date.today().isoformat()

def die(msg):
    print("timeline-watch: " + msg, file=sys.stderr); sys.exit(1)

def http(url, method="GET", body=None, headers=None, timeout=180):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    if data is not None: req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read().decode("utf-8")

# ── the current copy ────────────────────────────────────────────────────────
def read_row():
    if not (SB_URL and SB_KEY): die("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing")
    st, txt = http(SB_URL + "/rest/v1/timeline_feed?select=body&id=eq." + ROW,
                   headers={"apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY})
    rows = json.loads(txt or "[]")
    body = rows[0]["body"] if rows else {}
    if not body.get("items") or int(body.get("version") or 0) < 1:
        with open(SEED_FILE, encoding="utf-8") as f: body = json.load(f)
        print("seeded from the repo copy, version", body.get("version"))
    elif isinstance(body.get("items"), list):
        merge_seed(body)
    return body

def merge_seed(body):
    """The repo's seed copy may have grown fields the account's copy never had (the
    age guide, harm, avoid, bless, ages...). Anything the account lacks is taken
    from the seed; nothing the account has is touched. Returns True if it changed."""
    try:
        with open(SEED_FILE, encoding="utf-8") as f: seed = json.load(f)
    except Exception:
        return False
    changed = False
    for k, v in seed.items():
        if k in ("items", "version", "updated") or k in body: continue
        body[k] = v; changed = True
    mine = {it.get("id"): it for it in body["items"] if isinstance(it, dict)}
    for sit in seed.get("items") or []:
        if not isinstance(sit, dict) or not sit.get("id"): continue
        it = mine.get(sit["id"])
        if it is None:
            body["items"].append(sit); mine[sit["id"]] = sit; changed = True; continue
        for k, v in sit.items():
            if k == "learned" or k in it: continue
            it[k] = v; changed = True
    if changed:
        body["_seed_merged"] = TODAY
        print("took from the repo seed the fields the account's copy lacked")
    return changed

def write_row(body):
    st, txt = http(SB_URL + "/rest/v1/timeline_feed?on_conflict=id", method="POST",
                   body=[{"id": ROW, "body": body, "updated_at": datetime.datetime.utcnow().isoformat() + "Z"}],
                   headers={"apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Prefer": "resolution=merge-duplicates,return=minimal"})
    if st not in (200, 201, 204): die("could not write the row: HTTP %s %s" % (st, txt[:200]))
    with open(SEED_FILE, "w", encoding="utf-8") as f: json.dump(body, f, indent=1, ensure_ascii=False)

# ── the model, with web search ──────────────────────────────────────────────
def ask(instructions, prompt):
    if not OA_KEY: die("OPENAI_API_KEY is missing")
    body = {"model": MODEL, "tools": [{"type": "web_search_preview"}], "instructions": instructions, "input": prompt,
            "max_output_tokens": 6000}
    last = None
    for attempt in range(3):
        try:
            st, txt = http("https://api.openai.com/v1/responses", method="POST", body=body,
                           headers={"Authorization": "Bearer " + OA_KEY}, timeout=300)
            res = json.loads(txt)
            out = res.get("output_text")
            if not out:
                parts = []
                for item in res.get("output", []):
                    if item.get("type") == "message":
                        for c in item.get("content", []):
                            if c.get("type") == "output_text": parts.append(c.get("text", ""))
                out = "\n".join(parts)
            # the first complete JSON object in the answer; anything the model wrote after it is ignored
            out = re.sub(r"^\s*```(?:json)?|```\s*$", "", (out or "").strip())
            start = out.find("{")
            if start < 0: raise ValueError("no JSON in the answer: " + out[:300])
            obj, _end = json.JSONDecoder().raw_decode(out[start:])
            if not isinstance(obj, dict): raise ValueError("the answer is not an object")
            return obj
        except Exception as e:
            last = e; print("attempt", attempt + 1, "failed:", e); time.sleep(20 * (attempt + 1))
    raise RuntimeError("the model did not answer usably: %s" % last)   # one bad answer must not end a whole run

TEXT_RULES = ("Write in plain, warm words a child of eight could follow, and a parent would trust. No hype, no fear-mongering, "
              "no politics. Every note must rest on a real, credible, recent source (a study, a government or medical body, a "
              "reputable news report) with a working URL. Never invent a source. If nothing credible and new was found, return empty lists. "
              "Faith framing: this is for families who believe technology is given by Heavenly Father so His work can go forward, "
              "and that the same tool can bless or harm. Keep that frame gentle and never preachy.")

def slug(s):
    s = re.sub(r"[^a-z0-9]+", "-", str(s or "").lower()).strip("-")
    return s[:40] or "item"

def clean_str(v, n=600):
    return re.sub(r"\s+", " ", str(v or "")).strip()[:n]

def clean_list(v, n=6, m=220):
    if not isinstance(v, list): return []
    return [clean_str(x, m) for x in v if clean_str(x, m)][:n]

# ── tech ────────────────────────────────────────────────────────────────────
def run_tech(body):
    items = body.get("items", [])
    ids = [it["id"] for it in items]
    listing = "\n".join("- %s (%s, %s): last noted %s" % (it["id"], it.get("name"), it.get("date"),
              max([n.get("on", "") for n in it.get("learned", [])] or ["never"])) for it in items)
    instructions = ("You keep a family guide called Technology for Good current. " + TEXT_RULES)
    prompt = ("Today is %s. Here are the technologies in the guide, with the date each was last noted:\n%s\n\n"
              "Do two things, using web search:\n"
              "1. NOTES: find what the world has learned in roughly the last 30 days about any of these technologies' effects on "
              "children, families, sleep, learning, safety, mental health or society - new studies, official warnings, new laws, "
              "notable events. At most 5 notes, each about one technology, each 1-3 sentences, each with a real source name and URL.\n"
              "2. NEW: if a genuinely new technology has come into wide family use in the last year that is NOT in the list "
              "(not a new version of one that is), give ONE full card for it. Fields: id (short slug), name, y (year, number), "
              "date (text), loc, lat, lng, em (a single emoji as an HTML numeric entity like &#128241;), what (one line), "
              "why (the deeper purpose, 2 sentences), builtOn (ids from the list above that had to exist first, 1-4), good (3), "
              "bad (2-3), dangers (2-3), kids (3 short rules), talk (one question for a parent to ask tonight), "
              "learned (one note with on, note, source, url). If nothing truly new, new_items is [].\n\n"
              "Answer with JSON only, exactly: {\"notes\":[{\"tech\":\"id\",\"on\":\"YYYY-MM-DD\",\"note\":\"...\",\"source\":\"...\",\"url\":\"https://...\"}],"
              "\"new_items\":[{...}]}") % (TODAY, listing)
    ans = ask(instructions, prompt)
    added_notes = 0; added_items = 0
    for n in (ans.get("notes") or [])[:5]:
        tid = str(n.get("tech", "")); it = next((x for x in items if x["id"] == tid), None)
        note = clean_str(n.get("note"), 500); url = clean_str(n.get("url"), 300); src = clean_str(n.get("source"), 120)
        if not it or not note or not re.match(r"^https?://", url): continue
        if any(x.get("url") == url or x.get("note") == note for x in it.get("learned", [])): continue
        it.setdefault("learned", []).append({"on": TODAY, "note": note, "source": src or "source", "url": url}); added_notes += 1
    for ni in (ans.get("new_items") or [])[:1]:
        nid = slug(ni.get("id") or ni.get("name"))
        if not nid or nid in ids or not clean_str(ni.get("name")): continue
        card = {"id": nid, "y": int(float(ni.get("y") or datetime.date.today().year)), "date": clean_str(ni.get("date"), 40) or str(datetime.date.today().year),
                "loc": clean_str(ni.get("loc"), 80), "lat": float(ni.get("lat") or 0), "lng": float(ni.get("lng") or 0),
                "em": ni.get("em") if re.match(r"^&#\d{2,7};$", str(ni.get("em") or "")) else "&#128161;",
                "name": clean_str(ni.get("name"), 60), "ev": "", "what": clean_str(ni.get("what"), 240), "why": clean_str(ni.get("why"), 500),
                "builtOn": [x for x in (ni.get("builtOn") or []) if x in ids][:4], "good": clean_list(ni.get("good")), "bad": clean_list(ni.get("bad")),
                "dangers": clean_list(ni.get("dangers")), "kids": clean_list(ni.get("kids"), 3, 140), "talk": clean_str(ni.get("talk"), 200),
                "learned": [], "added": TODAY, "modern": True}
        for n in (ni.get("learned") or [])[:1]:
            url = clean_str(n.get("url"), 300)
            if re.match(r"^https?://", url): card["learned"].append({"on": TODAY, "note": clean_str(n.get("note"), 500), "source": clean_str(n.get("source"), 120) or "source", "url": url})
        if card["what"] and card["good"] and card["dangers"]:
            items.append(card); ids.append(nid); added_items += 1
    print("tech: %d notes, %d new technologies" % (added_notes, added_items))
    return added_notes + added_items

# ── discoveries ─────────────────────────────────────────────────────────────
def run_discoveries(body):
    items = body.get("items", [])
    known = "\n".join("- %s (%s)" % (it.get("t"), it.get("url", "")) for it in items[-60:]) or "(none yet)"
    instructions = ("You keep a family list of new discoveries that bear on the Bible, the Book of Mormon and Jesus Christ. " + TEXT_RULES +
                    " Be honest about strength: 'confirmed' only when the find and its reading are widely accepted; 'believed' when the "
                    "evidence is good but not settled; 'debated' when serious scholars disagree. Leave out hoaxes, sensational claims and "
                    "anything without a credible source. Include finds that support scripture, and label fairly any that complicate it.")
    prompt = ("Today is %s. Already listed (do not repeat):\n%s\n\nUsing web search, find discoveries reported in roughly the last 45 days: "
              "archaeology (digs, inscriptions, seals, cities, tombs), manuscripts and texts, and scientific or historical findings, that bear on "
              "the Bible, the Book of Mormon, or the life of Jesus Christ. At most 8. For each give: id (short slug), t (title, plain), y (the year "
              "the thing itself dates from, as a number, negative for BC), date (text like 'c. 700 BC'), loc, lat, lng, em (one emoji as an HTML "
              "numeric entity), conf (confirmed | believed | debated), de (what was found, 2-3 sentences), gospel (why it matters for faith, 1-2 "
              "sentences, gentle), forkids (one sentence a child could follow), source (name), url (https://...). "
              "Answer with JSON only: {\"items\":[...]}") % (TODAY, known)
    ans = ask(instructions, prompt)
    added = 0; urls = {it.get("url") for it in items}; ids = {it.get("id") for it in items}
    for d in (ans.get("items") or [])[:8]:
        url = clean_str(d.get("url"), 300); did = slug(d.get("id") or d.get("t"))
        if not re.match(r"^https?://", url) or url in urls or did in ids or not clean_str(d.get("t")): continue
        conf = d.get("conf") if d.get("conf") in ("confirmed", "believed", "debated") else "believed"
        try: y = int(float(d.get("y")))
        except Exception: y = 0
        items.append({"id": did, "t": clean_str(d.get("t"), 90), "y": y, "date": clean_str(d.get("date"), 40), "loc": clean_str(d.get("loc"), 80),
                      "lat": float(d.get("lat") or 0), "lng": float(d.get("lng") or 0),
                      "em": d.get("em") if re.match(r"^&#\d{2,7};$", str(d.get("em") or "")) else "&#127963;",
                      "conf": conf, "de": clean_str(d.get("de"), 600), "gospel": clean_str(d.get("gospel"), 400), "forkids": clean_str(d.get("forkids"), 200),
                      "source": clean_str(d.get("source"), 120) or "source", "url": url, "added": TODAY})
        urls.add(url); ids.add(did); added += 1
    print("discoveries: %d new" % added)
    return added

# ── studies ─────────────────────────────────────────────────────────────────
STUDY_FIELDS = ("happened", "background", "matters", "scripture", "evidence", "learn", "child", "talk")

def scrub(t):
    """Prose for a parent, not a web page: the model's inline citations like
    ([site](https://...)) and markdown links come out; the sources list carries the links."""
    t = str(t or "")
    t = re.sub(r"\s*\(\[[^\]]*\]\([^)]*\)\)", "", t)
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"\s*\(\s*https?://[^)]*\)", "", t)
    t = re.sub(r"[*_#`]+", "", t)
    return re.sub(r"\s+", " ", t).strip()

def scrub_url(u):
    u = re.sub(r"[?&]utm_source=openai\b", "", str(u or ""))
    return u[:-1] if u.endswith("?") else u

def scrub_study(st):
    changed = False
    for f in STUDY_FIELDS:
        if f not in st: continue
        v = scrub(st.get(f))
        if v != st.get(f): st[f] = v; changed = True
    for src in st.get("sources") or []:
        if isinstance(src, dict):
            u = scrub_url(src.get("url"))
            if u != src.get("url"): src["url"] = u; changed = True
    return changed
CAT_ORDER = ["gospel", "bom", "church", "arch", "xian", "seeds", "scifaith", "faith", "empire", "famous", "world", "city", "war",
             "explore", "migrate", "trade", "lang", "pop", "freedom", "faithfree", "socfam", "child", "health", "socio", "prop",
             "work", "slave", "escape", "drugs", "counter", "disaster", "invent", "family"]

def study_one(ev):
    plain = lambda v: html.unescape(re.sub(r"<[^>]+>", "", str(v or "")))   # the index carries the page's own markup
    blocks = "\n".join("%s: %s" % (plain(b.get("l")), plain(b.get("t"))) for b in (ev.get("blocks") or []) if b.get("t"))
    instructions = ("You write in-depth studies for a family study library that sits beside a world timeline. " + TEXT_RULES +
                    " The reader is a parent, often a member of The Church of Jesus Christ of Latter-day Saints, who will teach a child from it. "
                    "Be accurate first. Where history and scripture meet, say plainly what is known, what is believed, and what is debated, "
                    "and never overstate. Use web search to check dates, names and claims, and to find sources a parent could open. "
                    "Write whole paragraphs, not lists. Do not use markdown, headings or bullet characters in any field.")
    prompt = ("Today is %s. Write the in-depth study for this event from the timeline's topic '%s':\n"
              "Title: %s\nWhen: %s (year %s)\nWhere / who: %s\nThe timeline's short note: %s\n%s\n\n"
              "Give these fields, each 1-3 paragraphs of plain prose unless told otherwise:\n"
              "happened - what happened, told well, 220-350 words;\n"
              "background - the world it happened in: what came before, who the people were, what daily life was like, 120-220 words;\n"
              "matters - why it matters, for the world and for a family of faith, 100-180 words;\n"
              "scripture - what the scriptures say that touches this event (Bible, Book of Mormon, Doctrine and Covenants, Pearl of Great Price), "
              "naming the passages, 80-160 words; if none touch it directly, say what principle in scripture speaks to it;\n"
              "evidence - what the historical, archaeological or scientific evidence shows, honestly, 100-200 words;\n"
              "conf - one word for how settled the event itself is as history: confirmed, believed, or debated;\n"
              "learn - what we can learn, 80-150 words;\n"
              "child - two or three sentences a child of six could follow;\n"
              "talk - one question a parent could ask a child tonight;\n"
              "sources - 2 to 4 real, openable https sources with name and url (encyclopedias, museums, universities, churchofjesuschrist.org, "
              "reputable histories). Never invent a URL. Put no links, citations or brackets inside the prose fields; the sources list is where links go.\n\n"
              "Answer with JSON only: {\"happened\":\"...\",\"background\":\"...\",\"matters\":\"...\",\"scripture\":\"...\",\"evidence\":\"...\","
              "\"conf\":\"...\",\"learn\":\"...\",\"child\":\"...\",\"talk\":\"...\",\"sources\":[{\"name\":\"...\",\"url\":\"https://...\"}]}") % (
              TODAY, plain(ev.get("catName") or ev.get("cat")), plain(ev.get("t")), plain(ev.get("date")), ev.get("y"), plain(ev.get("meta")),
              plain(ev.get("de")), blocks)
    ans = ask(instructions, prompt)
    st = {}
    for f in STUDY_FIELDS:
        st[f] = scrub(ans.get(f))[:3000]
    st["conf"] = ans.get("conf") if ans.get("conf") in ("confirmed", "believed", "debated") else "believed"
    st["sources"] = []
    for src in (ans.get("sources") or [])[:4]:
        if not isinstance(src, dict): continue
        url = scrub_url(clean_str(src.get("url"), 300))
        if re.match(r"^https://[^\s\"'<>]+$", url):
            st["sources"].append({"name": clean_str(src.get("name"), 120) or url, "url": url})
    ok = len(st["happened"]) >= 600 and len(st["background"]) >= 200 and len(st["matters"]) >= 150 and len(st["learn"]) >= 120 and len(st["sources"]) >= 1
    if not ok:
        print("  rejected (too thin or no source):", ev.get("key"), {f: len(st[f]) for f in STUDY_FIELDS}, len(st["sources"]))
        return None
    st["v"] = 1; st["on"] = TODAY; st["t"] = clean_str(plain(ev.get("t")), 120); st["cat"] = ev.get("cat")
    return st

def run_studies(body):
    with open(INDEX_FILE, encoding="utf-8") as f: index = json.load(f)
    items = body.setdefault("items", {})
    if not isinstance(items, dict): items = body["items"] = {}
    cleaned = sum(1 for st in items.values() if isinstance(st, dict) and scrub_study(st))   # studies written before the scrub
    if cleaned: print("studies: cleaned citations out of %d earlier studies" % cleaned); body["_seed_merged"] = TODAY
    todo = [ev for ev in index if ev.get("key") and ev["key"] not in items]
    rank = {c: i for i, c in enumerate(CAT_ORDER)}
    todo.sort(key=lambda ev: (rank.get(ev.get("cat"), 99), ev.get("y") or 0))
    print("studies: %d of %d events still want a study; writing up to %d now" % (len(todo), len(index), PER_RUN))
    written = 0
    for ev in todo[:PER_RUN]:
        try:
            st = study_one(ev)
        except Exception as e:
            print("  failed:", ev.get("key"), str(e)[:160]); continue
        if st:
            items[ev["key"]] = st; written += 1
            print("  wrote:", ev["key"], "-", st["t"], "(%d sources)" % len(st["sources"]))
            if written % 10 == 0:   # keep what is done so far, in case the run is cut off
                body["version"] = int(body.get("version") or 0) + 1; body["updated"] = TODAY; write_row(body)
    print("studies: %d written this run; %d still to go" % (written, len(todo) - written))
    return written

# ── run ─────────────────────────────────────────────────────────────────────
body = read_row()
seeded = body.pop("_seed_merged", None) is not None
changed = run_tech(body) if JOB == "tech" else run_studies(body) if JOB == "studies" else run_discoveries(body)
if changed or seeded or os.environ.get("FORCE_WRITE") == "1" or int(body.get("version") or 0) < 1:
    body["version"] = int(body.get("version") or 0) + 1
    body["updated"] = TODAY
    write_row(body)
    print("written: version", body["version"], "with", len(body.get("items") or []), "items")
else:
    print("nothing new today; the row stays at version", body.get("version"))
