#!/usr/bin/env python3
"""Put one book's nights into `book_nights` - the only thing that writes there.

    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python3 apply-book-nights.py beats.json 10

Reads the file tools/sync-book-nights.py wrote, keeps the nights of the one
book asked for, and upserts them (a re-run updates rather than duplicating).
The id is the catalog id the website and the app share: b<book>-w<week>-n<night>.
Nothing here decides who may read a night: Postgres does (is_free or a
subscriber), and a new night is not free.
"""
import json, os, re, sys, urllib.request

URL = os.environ.get("SUPABASE_URL", "https://rdbvktqgrwhjucocobua.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

def rest(method, path, body=None):
    req = urllib.request.Request(URL + "/rest/v1/" + path, method=method,
        data=None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e: return e.code, e.read().decode("utf-8", "ignore")

def main(path, book):
    if not KEY: sys.exit("SUPABASE_SERVICE_ROLE_KEY is not set")
    book = int(book)
    rows = []
    for n in json.load(open(path, encoding="utf-8")):
        if int(n.get("book") or 0) != book: continue
        m = re.search(r"Week\s*(\d+).*?Night\s*(\d+)", n.get("night") or "")
        if not m: sys.exit("cannot read week/night from %r" % n.get("night"))
        rows.append({"id": "b%d-w%d-n%d" % (book, int(m.group(1)), int(m.group(2))), "book": book,
                     "night": n["night"], "title": n.get("title"), "reference": n.get("reference"),
                     "beats": n["beats"]})
    if not rows: sys.exit("no nights of book %d in %s" % (book, path))
    rows.sort(key=lambda r: r["id"])
    for i in range(0, len(rows), 7):
        batch = rows[i:i+7]
        status, body = rest("POST", "book_nights?on_conflict=id", batch)
        if status not in (200, 201, 204): sys.exit("upsert failed (%s): %s" % (status, body[:400]))
        print("  put", ", ".join(r["id"] for r in batch))
    status, body = rest("GET", "book_nights?select=id&book=eq.%d" % book)
    print("book %d: %d nights sent, %d now in book_nights" % (book, len(rows), len(json.loads(body)) if status == 200 else -1))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
