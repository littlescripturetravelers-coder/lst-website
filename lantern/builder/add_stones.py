#!/usr/bin/env python3
"""THE FIVE STONES ON EVERY STORY (Levi, 20 Nov 2026: "Every single scripture story on the website needs to have the
5 stones").

Forty-four nights of June and July 2026 were published before the Five Stones were part of every story, so their
picture books (lantern/<slug>/<slug>.html) have A Feeling Moment with no stones. Each of them already tells the words of
a rewritten June or July book story (lantern/child-stories/<slug>.json, "from": "June book, night 17 (Five Smooth
Stones)"), and that story's Five Stones were written and reviewed with it; they live in the account's `book_nights`
(id b<book>-w<week>-n<night>). This puts that story's own stones into the night's Feeling Moment, nothing else.

Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the Action "Add the Five Stones" passes them).
    python3 lantern/builder/add_stones.py            # add them
    python3 lantern/builder/add_stones.py --check    # list the nights still without stones, change nothing
"""
import json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
LAN = os.path.normpath(os.path.join(HERE, ".."))
BOOK = {"June": 6, "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12}

def span(html):
    mark = "const STORY = "; a = html.index(mark) + len(mark); d = 0; ins = False; esc = False
    for i in range(a, len(html)):
        c = html[i]
        if ins:
            if esc: esc = False
            elif c == "\\": esc = True
            elif c == '"': ins = False
            continue
        if c == '"': ins = True
        elif c == "{": d += 1
        elif c == "}":
            d -= 1
            if d == 0: return a, i + 1
    raise ValueError("STORY never closes")

def missing():
    out = []
    for d in sorted(os.listdir(LAN)):
        f = os.path.join(LAN, d, d + ".html")
        if not (os.path.isfile(os.path.join(LAN, d, "night.json")) and os.path.isfile(f)): continue
        html = open(f, encoding="utf-8").read()
        if "const STORY = " not in html: continue
        a, z = span(html); st = json.loads(html[a:z])
        if not any(b.get("stones") for b in st.get("beats", [])): out.append((d, f, html, a, z, st))
    return out

def fetch(ids):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/book_nights?select=id,title,beats&id=in.(" + ",".join(ids) + ")"
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    req = urllib.request.Request(url, headers={"apikey": key, "Authorization": "Bearer " + key})
    return {r["id"]: r for r in json.load(urllib.request.urlopen(req, timeout=60))}

def main():
    todo = missing()
    print(f"{len(todo)} night(s) without the Five Stones")
    if "--check" in sys.argv:
        for t in todo: print("  " + t[0])
        sys.exit(1 if todo else 0)
    want = {}
    for d, *_ in todo:
        cs = os.path.join(LAN, "child-stories", d + ".json")
        fr = json.load(open(cs, encoding="utf-8")).get("from", "") if os.path.isfile(cs) else ""
        m = re.match(r"(\w+) book, night (\d+) \((.+)\)", fr)
        if not m or m.group(1) not in BOOK: print(f"  {d}: no book story to take its stones from ({fr!r})"); continue
        n = int(m.group(2)); want[d] = (f"b{BOOK[m.group(1)]}-w{(n - 1) // 7 + 1}-n{(n - 1) % 7 + 1}", m.group(3))
    rows = fetch(sorted({v[0] for v in want.values()})) if want else {}
    done = 0
    for d, f, html, a, z, st in todo:
        if d not in want: continue
        bid, title = want[d]; r = rows.get(bid)
        if not r: print(f"  {d}: {bid} is not in the account"); continue
        if r["title"].replace("’", "'") != title.replace("’", "'"): print(f"  {d}: {bid} is \"{r['title']}\", not \"{title}\" - left alone"); continue
        stones = next((b.get("stones") for b in r["beats"] if b.get("stones")), None)
        if not stones or len(stones) != 5: print(f"  {d}: {bid} has no five stones"); continue
        feel = next((b for b in st["beats"] if b.get("heading") == "A Feeling Moment"), None)
        if not feel: print(f"  {d}: no A Feeling Moment page"); continue
        feel["stones"] = stones
        open(f, "w", encoding="utf-8").write(html[:a] + json.dumps(st, ensure_ascii=False) + html[z:])
        done += 1; print(f"  {d}: the stones of {bid} ({title})")
    print(f"{done} night(s) given their Five Stones")
    sys.exit(0 if done == len(todo) else 1)

if __name__ == "__main__":
    main()
