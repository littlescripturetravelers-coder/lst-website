#!/usr/bin/env python3
"""
THE WORLD TIMELINE LEARNS ON ITS OWN.

Two jobs, one script (JOB=tech or JOB=discoveries):

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

The guide's current copy is read from the account (table timeline_feed), the
model is asked - with web search - for additions only, the additions are
checked and merged, the version is bumped, and the result is written back to
the account and into lantern/timeline-feed/ in this repo (its history).

Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY.
"""
import json, os, re, sys, time, datetime, urllib.request, urllib.error

JOB        = os.environ.get("JOB", "tech").strip()
MODEL      = os.environ.get("TIMELINE_WATCH_MODEL", "gpt-4.1").strip()
SB_URL     = os.environ.get("SUPABASE_URL", "").rstrip("/")
SB_KEY     = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
OA_KEY     = os.environ.get("OPENAI_API_KEY", "").strip()
HERE       = os.path.dirname(os.path.abspath(__file__))
FEED_DIR   = os.path.join(HERE, "timeline-feed")
ROW        = {"tech": "tech", "discoveries": "discoveries"}[JOB]
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
    return body

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
            m = re.search(r"\{[\s\S]*\}", out or "")
            if not m: raise ValueError("no JSON in the answer: " + (out or "")[:300])
            return json.loads(m.group(0))
        except Exception as e:
            last = e; print("attempt", attempt + 1, "failed:", e); time.sleep(20 * (attempt + 1))
    die("the model did not answer usably: %s" % last)

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
                "learned": [], "added": TODAY}
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

# ── run ─────────────────────────────────────────────────────────────────────
body = read_row()
changed = run_tech(body) if JOB == "tech" else run_discoveries(body)
if changed or os.environ.get("FORCE_WRITE") == "1" or int(body.get("version") or 0) < 1:
    body["version"] = int(body.get("version") or 0) + 1
    body["updated"] = TODAY
    write_row(body)
    print("written: version", body["version"], "with", len(body.get("items", [])), "items")
else:
    print("nothing new today; the row stays at version", body.get("version"))
