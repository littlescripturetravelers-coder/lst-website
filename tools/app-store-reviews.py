#!/usr/bin/env python3
"""THE APP STORE'S RATING AND REVIEWS, KEPT UP TO DATE ON THEIR OWN.

Levi, 18 Nov 2026: "I would like to include the ratings and reviews in the Apple App Store
on my website."

Once a day (.github/workflows/app-store-reviews.yml) this asks Apple's public pages, which need
no key and cost nothing, for
  - the app's star rating and how many people gave one, in each storefront below (Apple counts
    ratings per country, so the numbers are added up and the average is weighted by them);
  - the most recent written reviews in the English-speaking storefronts.
and writes data/app-store-reviews.js, which the home page reads (js/app-store-reviews.js).

THE RULES THIS KEEPS
  - Nothing is chosen, polished or left out: the reviews shown are the latest ones, whatever
    their stars, word for word (only cut to a sensible length). A page of hand-picked praise
    labelled "reviews" is not honest, and in a few places is against the law.
  - A day when nothing changed writes nothing, so it makes no commit and no new deploy.
  - A read that fails, or that finds far fewer ratings than last time, is a broken read: the
    last good file is kept and a warning is printed. It never writes a half answer.
  - No credits, no keys, no AI. Only Apple's own numbers and words.

    python3 tools/app-store-reviews.py            # read Apple, write data/app-store-reviews.js
    python3 tools/app-store-reviews.py --test     # check the reading against built-in samples
Env: APP_STORE_ID, APP_STORE_COUNTRIES, APP_STORE_REVIEW_COUNTRIES, APP_STORE_PAUSE, OUT.
"""
import datetime, json, os, re, sys, time, urllib.error, urllib.request

APP_ID = os.environ.get("APP_STORE_ID", "6793999173")
STORE_URL = f"https://apps.apple.com/us/app/little-scripture-travelers/id{APP_ID}"
# Ratings: where the app's families are. Reviews: only the storefronts whose reviews are written in English.
COUNTRIES = [c.strip().lower() for c in os.environ.get("APP_STORE_COUNTRIES", "us,ca,gb,au,nz,ie,za,ph,sg,mx,br,cl").split(",") if c.strip()]
REVIEW_COUNTRIES = [c.strip().lower() for c in os.environ.get("APP_STORE_REVIEW_COUNTRIES", "us,ca,gb,au,nz,ie,za,ph,sg").split(",") if c.strip()]
PAUSE = float(os.environ.get("APP_STORE_PAUSE", "3.5"))   # Apple allows about twenty questions a minute
KEEP = 12                  # the newest reviews kept in the file; the page shows the first few
MAX_TEXT = 600             # characters of one review kept
OUT = os.environ.get("OUT", "data/app-store-reviews.js")
HEAD = ("/* Written by tools/app-store-reviews.py once a day from Apple's public pages. Do not edit by hand:\n"
        "   the next run writes it again. The home page reads it (js/app-store-reviews.js). */\n")


class ReadFailed(Exception):
    pass


def get_json(url, tries=3):
    last = None
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "LittleScriptureTravelers-site/1.0 (+https://littlescripturetravelers.com)", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}"
            if e.code not in (403, 429, 500, 502, 503, 504):
                break
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            last = str(e)[:100]
        time.sleep(4 * (n + 1))
    raise ReadFailed(f"{url} -> {last}")


def read_lookup(d):
    """(average, count) from Apple's lookup answer; (0, 0) when the app is not in that storefront."""
    res = (d or {}).get("results") or []
    if not res:
        return 0.0, 0
    r = res[0]
    try:
        count = int(r.get("userRatingCount") or 0)
        avg = float(r.get("averageUserRating") or 0)
    except (TypeError, ValueError):
        return 0.0, 0
    return (avg, count) if count > 0 and 0 < avg <= 5 else (0.0, 0)


def _label(x):
    return x.get("label") if isinstance(x, dict) else (x if isinstance(x, str) else "")


def clean(text, limit):
    t = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", str(text or ""))
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) > limit:
        t = t[:limit].rsplit(" ", 1)[0].rstrip(" ,.;:-") + "…"
    return t


def read_reviews(d, country=""):
    """The written reviews in one storefront's feed, as plain dicts. The feed holds a single review
    as an object rather than a list, and none at all as no 'entry'; the app's own record (no rating)
    is skipped."""
    ent = ((d or {}).get("feed") or {}).get("entry") or []
    if isinstance(ent, dict):
        ent = [ent]
    out = []
    for e in ent:
        if not isinstance(e, dict):
            continue
        try:
            stars = int(_label(e.get("im:rating")))
        except (TypeError, ValueError):
            continue
        if not 1 <= stars <= 5:
            continue
        body = e.get("content")
        if isinstance(body, list):
            body = next((b for b in body if isinstance(b, dict) and (b.get("attributes") or {}).get("type") == "text"), body[0] if body else {})
        text, title = clean(_label(body), MAX_TEXT), clean(_label(e.get("title")), 120)
        if not (text or title):
            continue
        m = re.match(r"\d{4}-\d{2}-\d{2}", _label(e.get("updated")) or "")
        out.append({
            "id": str(_label(e.get("id")) or f"{country}:{title}:{text[:40]}"),
            "stars": stars,
            "title": title,
            "text": text,
            "author": clean(_label((e.get("author") or {}).get("name")), 60),
            "date": m.group(0) if m else "",
            "version": clean(_label(e.get("im:version")), 20),
        })
    return out


def combine(ratings, reviews):
    """ratings: [(average, count)]; reviews: lists of review dicts. -> the object the page reads."""
    total = sum(c for _, c in ratings)
    avg = round(sum(a * c for a, c in ratings) / total, 1) if total else None
    seen, merged = set(), []
    for r in sorted((r for lst in reviews for r in lst), key=lambda r: (r["date"], r["id"]), reverse=True):
        if r["id"] in seen:
            continue
        seen.add(r["id"])
        merged.append({k: v for k, v in r.items() if k != "id" and v != ""})
    return {"appId": APP_ID, "url": STORE_URL, "reviewsUrl": STORE_URL + "?see-all=reviews",
            "rating": avg, "count": total, "reviews": merged[:KEEP]}


def load_old(path):
    try:
        s = open(path, encoding="utf-8").read()
        return json.loads(s[s.index("window.LST_APP_STORE =") + len("window.LST_APP_STORE ="):].strip().rstrip(";"))
    except Exception:
        return None


def same(a, b):
    strip = lambda d: {k: v for k, v in (d or {}).items() if k != "updated"}
    return strip(a) == strip(b)


def main():
    old = load_old(OUT)
    ratings, reviews, n = [], [], 0
    try:
        for cc in COUNTRIES:
            if n: time.sleep(PAUSE)
            n += 1
            ratings.append(read_lookup(get_json(f"https://itunes.apple.com/lookup?id={APP_ID}&country={cc}")))
        for cc in REVIEW_COUNTRIES:
            if n: time.sleep(PAUSE)
            n += 1
            reviews.append(read_reviews(get_json(f"https://itunes.apple.com/{cc}/rss/customerreviews/page=1/id={APP_ID}/sortby=mostrecent/json"), cc))
    except ReadFailed as e:
        print(f"::warning::App Store read failed, last good file kept: {e}")
        return 0
    new = combine(ratings, reviews)
    if old and old.get("count", 0) >= 10 and new["count"] < old["count"] / 2:
        print(f"::warning::App Store read found {new['count']} ratings where there were {old['count']}; treated as a broken read, last good file kept")
        return 0
    new["updated"] = datetime.date.today().isoformat()
    if same(new, old):
        print(f"nothing changed: {new['count']} ratings, {len(new['reviews'])} reviews kept")
        return 0
    os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(HEAD + "window.LST_APP_STORE = " + json.dumps(new, ensure_ascii=True, indent=1) + ";\n")
    print(f"wrote {OUT}: rating {new['rating']} from {new['count']} ratings, {len(new['reviews'])} reviews kept")
    return 0


# ── a check of the reading, with samples shaped like Apple's own answers ──────────────────────────
def _test():
    bad = 0
    def ok(cond, what):
        nonlocal bad
        print(("ok   " if cond else "FAIL ") + what)
        bad += 0 if cond else 1
    ok(read_lookup({"resultCount": 1, "results": [{"averageUserRating": 4.5, "userRatingCount": 12}]}) == (4.5, 12), "lookup: average and count")
    ok(read_lookup({"resultCount": 0, "results": []}) == (0.0, 0), "lookup: app not in that storefront -> nothing")
    ok(read_lookup({"results": [{"trackName": "x"}]}) == (0.0, 0), "lookup: no ratings yet -> nothing")
    ok(read_lookup({"results": [{"averageUserRating": "junk", "userRatingCount": "x"}]}) == (0.0, 0), "lookup: junk values -> nothing")
    one = {"id": {"label": "111"}, "author": {"name": {"label": "Mama of 4"}}, "updated": {"label": "2026-11-10T10:12:00-07:00"},
           "im:rating": {"label": "5"}, "im:version": {"label": "1.4"}, "title": {"label": "Bedtime is calm now"},
           "content": {"label": "My kids ask for it\n\n every   night.", "attributes": {"type": "text"}}}
    appinfo = {"id": {"label": "app"}, "title": {"label": "Little Scripture Travelers"}}
    r = read_reviews({"feed": {"entry": [appinfo, one]}}, "us")
    ok(len(r) == 1 and r[0]["stars"] == 5 and r[0]["text"] == "My kids ask for it every night." and r[0]["date"] == "2026-11-10" and r[0]["author"] == "Mama of 4",
       "reviews: the app's own record skipped; spaces and breaks tidied; date, stars, author read")
    ok(len(read_reviews({"feed": {"entry": one}}, "us")) == 1, "reviews: a single review arrives as an object, not a list")
    ok(read_reviews({"feed": {}}, "us") == [] and read_reviews({}, "us") == [] and read_reviews(None, "us") == [], "reviews: none at all is fine")
    ok(read_reviews({"feed": {"entry": [{**one, "im:rating": {"label": "9"}}]}}) == [], "reviews: a rating outside 1-5 is dropped")
    long = {**one, "content": {"label": "word " * 400}}
    t = read_reviews({"feed": {"entry": [long]}})[0]["text"]
    ok(len(t) <= MAX_TEXT + 1 and t.endswith("…"), "reviews: a very long one is cut at a word, with an ellipsis")
    two = {**one, "id": {"label": "222"}, "updated": {"label": "2026-11-12T08:00:00-07:00"}, "im:rating": {"label": "2"}}
    c = combine([(5.0, 2), (4.0, 3)], [[read_reviews({"feed": {"entry": [one]}})[0]], [read_reviews({"feed": {"entry": [two, one]}})[1], read_reviews({"feed": {"entry": [two]}})[0]]])
    ok(c["count"] == 5 and c["rating"] == 4.4, "combine: weighted average (5.0x2 + 4.0x3) / 5 = 4.4")
    ok([x["stars"] for x in c["reviews"]] == [2, 5], "combine: newest first, the same review from two storefronts once, low stars kept")
    ok(combine([], [])["rating"] is None and combine([(0.0, 0)], [[]])["count"] == 0, "combine: no ratings -> no average, count 0")
    ok(same({"a": 1, "updated": "x"}, {"a": 1, "updated": "y"}) and not same({"a": 1}, {"a": 2}), "same: the date alone is not a change")
    print("ALL PASS" if not bad else f"{bad} FAILED")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(_test() if "--test" in sys.argv else main())
