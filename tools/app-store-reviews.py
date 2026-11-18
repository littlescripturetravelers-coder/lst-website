#!/usr/bin/env python3
"""THE APP STORE'S RATING AND REVIEWS, KEPT UP TO DATE ON THEIR OWN.

Levi, 18 Nov 2026: "I would like to include the ratings and reviews in the Apple App Store
on my website."

Once a day (.github/workflows/app-store-reviews.yml) this asks Apple's public pages, which need
no key and cost nothing, for
  - the app's star rating and how many people gave one, in each storefront below (Apple counts
    ratings per country, so the numbers are added up and the average is weighted by them);
  - the most recent written reviews from the same storefronts. (They are the English-speaking ones, so
    the reviews read in English and the page can say exactly what the number covers.)
and writes data/app-store-reviews.js, which the home page reads (js/app-store-reviews.js).

THE RULES THIS KEEPS
  - Nothing is chosen, polished or left out: the reviews shown are the latest ones, whatever
    their stars, word for word (only cut to a sensible length). A page of hand-picked praise
    labelled "reviews" is not honest, and in a few places is against the law.
  - A day when nothing changed writes nothing, so it makes no commit and no new deploy.
  - A read that fails, or that finds fewer ratings or reviews than last time (a storefront that
    suddenly has none, a count that drops by a fifth), is a broken read: the last good file is kept,
    the run goes RED (so GitHub emails the owner) and says why. It never writes a half answer, and a
    broken read can never sit quietly for weeks with the page frozen.
  - No credits, no keys, no AI. Only Apple's own numbers and words.

    python3 tools/app-store-reviews.py            # read Apple, write data/app-store-reviews.js
    python3 tools/app-store-reviews.py --test     # check the reading against built-in samples
Env: APP_STORE_ID, APP_STORE_COUNTRIES, APP_STORE_PAUSE, OUT.
"""
import datetime, http.client, json, os, re, sys, time, urllib.error, urllib.request

APP_ID = os.environ.get("APP_STORE_ID", "6793999173")
STORE_URL = f"https://apps.apple.com/us/app/little-scripture-travelers/id{APP_ID}"
# The English-speaking App Stores: the ratings are added up from these, and so are the reviews, which
# therefore read in English. The page says so ("in English-speaking App Stores").
COUNTRIES = [c.strip().lower() for c in os.environ.get("APP_STORE_COUNTRIES", "us,ca,gb,au,nz,ie,za,ph,sg").split(",") if c.strip()]
PAUSE = float(os.environ.get("APP_STORE_PAUSE", "3.5"))   # Apple allows about twenty questions a minute
KEEP = 12                  # the newest reviews kept in the file; the page shows the first few
MAX_TEXT = 600             # characters of one review kept
OUT = os.environ.get("OUT", "data/app-store-reviews.js")
HEAD = ("/* Written by tools/app-store-reviews.py once a day from Apple's public pages. Do not edit by hand:\n"
        "   the next run writes it again. The home page reads it (js/app-store-reviews.js). */\n")


class ReadFailed(Exception):
    pass


BACKOFF = 4   # seconds, times the try number (the tests set it to 0)


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
        except (urllib.error.URLError, http.client.HTTPException, OSError, TimeoutError, ValueError) as e:
            # a dropped or reset connection, a half-read answer, a timeout, a page that is not JSON
            last = f"{type(e).__name__}: {str(e)[:100]}"
        if n + 1 < tries:
            time.sleep(BACKOFF * (n + 1))
    raise ReadFailed(f"{url} -> {last}")


def read_lookup(d):
    """(average, count) from Apple's lookup answer; (0, 0) when the app is not in that storefront."""
    res = d.get("results") if isinstance(d, dict) else None
    if not isinstance(res, list) or not res or not isinstance(res[0], dict):
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
    feed = d.get("feed") if isinstance(d, dict) else None
    ent = feed.get("entry") if isinstance(feed, dict) else None
    if isinstance(ent, dict):
        ent = [ent]
    if not isinstance(ent, list):
        return []
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
            "author": clean(_label(e["author"].get("name")) if isinstance(e.get("author"), dict) else "", 60),
            "date": m.group(0) if m else "",
            "version": clean(_label(e.get("im:version")), 20),
        })
    return out


def combine(ratings, reviews):
    """ratings: {storefront: (average, count)}; reviews: lists of review dicts. -> the object the page reads."""
    total = sum(c for _, c in ratings.values())
    avg = round(sum(a * c for a, c in ratings.values()) / total, 1) if total else None
    seen, merged = set(), []
    for r in sorted((r for lst in reviews for r in lst), key=lambda r: (r["date"], r["id"]), reverse=True):
        if r["id"] in seen:
            continue
        seen.add(r["id"])
        merged.append({k: v for k, v in r.items() if k != "id" and v != ""})
    return {"appId": APP_ID, "url": STORE_URL, "reviewsUrl": STORE_URL + "?see-all=reviews",
            "rating": avg, "count": total, "byCountry": {cc: c for cc, (_, c) in sorted(ratings.items()) if c},
            "reviews": merged[:KEEP]}


def load_old(path):
    try:
        s = open(path, encoding="utf-8").read()
        d = json.loads(s[s.index("window.LST_APP_STORE =") + len("window.LST_APP_STORE ="):].strip().rstrip(";"))
        return d if isinstance(d, dict) else None
    except Exception:
        return None


def same(a, b):
    strip = lambda d: {k: v for k, v in (d or {}).items() if k != "updated"}
    return strip(a) == strip(b)


def suspicious(old, new):
    """Why this read should not replace the last good file, or '' when it can. Ratings do not honestly
    fall by a fifth in a day, a storefront with ratings does not lose them all, and written reviews
    do not all vanish: a read that says so is a broken read."""
    if not isinstance(old, dict):
        return ""
    oc = old.get("count")
    oc = oc if isinstance(oc, int) and not isinstance(oc, bool) else 0
    if oc >= 5 and new["count"] < oc * 0.8:
        return f"{new['count']} ratings where there were {oc}"
    oby = old.get("byCountry") if isinstance(old.get("byCountry"), dict) else {}
    for cc, n in oby.items():
        if isinstance(n, int) and n >= 5 and new["byCountry"].get(cc, 0) == 0:
            return f"the {cc} storefront gave no ratings where it had {n}"
    if isinstance(old.get("reviews"), list) and old["reviews"] and not new["reviews"]:
        return "no written reviews where there were some"
    return ""


def run():
    old = load_old(OUT)
    ratings, reviews, n = {}, [], 0
    for cc in COUNTRIES:
        if n: time.sleep(PAUSE)
        n += 1
        ratings[cc] = read_lookup(get_json(f"https://itunes.apple.com/lookup?id={APP_ID}&country={cc}"))
    for cc in COUNTRIES:                       # only where the app has ratings; a review always comes with one
        if not ratings[cc][1]:
            continue
        time.sleep(PAUSE)
        reviews.append(read_reviews(get_json(f"https://itunes.apple.com/{cc}/rss/customerreviews/page=1/id={APP_ID}/sortby=mostrecent/json"), cc))
    new = combine(ratings, reviews)
    why = suspicious(old, new)
    if why:
        print(f"::error::App Store read looks broken ({why}); last good file kept. If it is real, delete {OUT}'s old numbers by hand and run again.")
        return 1
    new["updated"] = datetime.date.today().isoformat()
    if same(new, old):
        print(f"nothing changed: {new['count']} ratings, {len(new['reviews'])} reviews kept")
        return 0
    os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:       # written whole, then put in place: never a half file
        f.write(HEAD + "window.LST_APP_STORE = " + json.dumps(new, ensure_ascii=True, indent=1) + ";\n")
    os.replace(tmp, OUT)
    print(f"wrote {OUT}: rating {new['rating']} from {new['count']} ratings, {len(new['reviews'])} reviews kept")
    return 0


def main():
    try:
        return run()
    except ReadFailed as e:
        print(f"::error::App Store read failed, last good file kept: {e}")
    except Exception as e:                         # anything unforeseen is named, never a bare traceback, and writes nothing
        print(f"::error::App Store reader stopped on {type(e).__name__}: {str(e)[:200]}; last good file kept")
    return 1


# ── a check of the reading, with samples shaped like Apple's own answers ──────────────────────────
def _test():
    import contextlib, io, tempfile
    bad = 0
    def ok(cond, what):
        nonlocal bad
        print(("ok   " if cond else "FAIL ") + what)
        bad += 0 if cond else 1
    globals()["BACKOFF"] = 0
    globals()["PAUSE"] = 0

    # reading Apple's answers
    ok(read_lookup({"resultCount": 1, "results": [{"averageUserRating": 4.5, "userRatingCount": 12}]}) == (4.5, 12), "lookup: average and count")
    ok(read_lookup({"resultCount": 0, "results": []}) == (0.0, 0), "lookup: app not in that storefront -> nothing")
    ok(read_lookup({"results": [{"trackName": "x"}]}) == (0.0, 0), "lookup: no ratings yet -> nothing")
    ok(read_lookup({"results": [{"averageUserRating": "junk", "userRatingCount": "x"}]}) == (0.0, 0), "lookup: junk values -> nothing")
    ok(all(read_lookup(x) == (0.0, 0) for x in ([1], "text", None, {"results": {"a": 1}}, {"results": [5]})), "lookup: any odd shape -> nothing, never a crash")
    one = {"id": {"label": "111"}, "author": {"name": {"label": "Mama of 4"}}, "updated": {"label": "2026-11-10T10:12:00-07:00"},
           "im:rating": {"label": "5"}, "im:version": {"label": "1.4"}, "title": {"label": "Bedtime is calm now"},
           "content": {"label": "My kids ask for it\n\n every   night.", "attributes": {"type": "text"}}}
    appinfo = {"id": {"label": "app"}, "title": {"label": "Little Scripture Travelers"}}
    r = read_reviews({"feed": {"entry": [appinfo, one]}}, "us")
    ok(len(r) == 1 and r[0]["stars"] == 5 and r[0]["text"] == "My kids ask for it every night." and r[0]["date"] == "2026-11-10" and r[0]["author"] == "Mama of 4",
       "reviews: the app's own record skipped; spaces and breaks tidied; date, stars, author read")
    ok(len(read_reviews({"feed": {"entry": one}}, "us")) == 1, "reviews: a single review arrives as an object, not a list")
    ok(read_reviews({"feed": {}}, "us") == [] and read_reviews({}, "us") == [] and read_reviews(None, "us") == [], "reviews: none at all is fine")
    ok(read_reviews([1, 2]) == [] and read_reviews({"feed": [1]}) == [] and read_reviews({"feed": {"entry": "x"}}) == [], "reviews: any odd shape -> none, never a crash")
    ok(read_reviews({"feed": {"entry": [{**one, "author": "bob"}, "junk", 7]}})[0]["author"] == "", "reviews: an author that is not an object, and junk entries, are survived")
    ok(read_reviews({"feed": {"entry": [{**one, "im:rating": {"label": "9"}}]}}) == [], "reviews: a rating outside 1-5 is dropped")
    t = read_reviews({"feed": {"entry": [{**one, "content": {"label": "word " * 400}}]}})[0]["text"]
    ok(len(t) <= MAX_TEXT + 1 and t.endswith("…"), "reviews: a very long one is cut at a word, with an ellipsis")

    # putting storefronts together
    two = {**one, "id": {"label": "222"}, "updated": {"label": "2026-11-12T08:00:00-07:00"}, "im:rating": {"label": "2"}}
    c = combine({"us": (5.0, 2), "ca": (4.0, 3), "nz": (0.0, 0)},
                [[read_reviews({"feed": {"entry": [one]}})[0]], [read_reviews({"feed": {"entry": [two, one]}})[1], read_reviews({"feed": {"entry": [two]}})[0]]])
    ok(c["count"] == 5 and c["rating"] == 4.4 and c["byCountry"] == {"ca": 3, "us": 2}, "combine: weighted average (5.0x2 + 4.0x3) / 5 = 4.4; per-storefront counts kept, empty ones left out")
    ok([x["stars"] for x in c["reviews"]] == [2, 5], "combine: newest first, the same review from two storefronts once, low stars kept")
    ok(combine({}, [])["rating"] is None and combine({"us": (0.0, 0)}, [[]])["count"] == 0, "combine: no ratings -> no average, count 0")
    ok(same({"a": 1, "updated": "x"}, {"a": 1, "updated": "y"}) and not same({"a": 1}, {"a": 2}), "same: the date alone is not a change")

    # a read that looks broken must not replace the last good file
    old = {"count": 50, "byCountry": {"us": 40, "ca": 10}, "reviews": [{"stars": 5}]}
    good = {"count": 52, "byCountry": {"us": 41, "ca": 11}, "reviews": [{"stars": 5}]}
    ok(suspicious(old, good) == "" and suspicious(None, good) == "" and suspicious([1], good) == "", "guard: a normal day, a first run and a corrupt old file all pass")
    ok("ratings where there were" in suspicious(old, {**good, "count": 30, "byCountry": {"us": 20, "ca": 10}}), "guard: ratings down by more than a fifth -> refused")
    ok("ca storefront" in suspicious(old, {**good, "count": 41, "byCountry": {"us": 41}}), "guard: one storefront suddenly empty -> refused (the flaky-day case)")
    ok("no written reviews" in suspicious(old, {**good, "reviews": []}), "guard: all reviews vanish -> refused")
    ok(suspicious({"count": "12", "byCountry": "x", "reviews": "y"}, good) == "", "guard: a hand-edited old file with odd types does not crash it")

    # reaching Apple: dropped connections are retried; what cannot be read is named
    class Boom:
        def __init__(self, errs, body): self.errs, self.body, self.n = errs, body, 0
        def __call__(self, req, timeout=0):
            self.n += 1
            if self.errs:
                raise self.errs.pop(0)
            return contextlib.nullcontext(io.BytesIO(self.body))
    real = urllib.request.urlopen
    try:
        b = Boom([ConnectionResetError("reset"), http.client.IncompleteRead(b"x")], b'{"a": 1}')
        urllib.request.urlopen = b
        ok(get_json("https://x/") == {"a": 1} and b.n == 3, "network: a reset and a half-read answer are retried, then it works")
        b = Boom([http.client.RemoteDisconnected("gone")] * 5, b"{}")
        urllib.request.urlopen = b
        try: get_json("https://x/"); named = ""
        except ReadFailed as e: named = str(e)
        ok("RemoteDisconnected" in named and b.n == 3, "network: it gives up after three tries and says what happened")
        urllib.request.urlopen = Boom([urllib.error.HTTPError("u", 404, "nf", {}, None)], b"{}")
        try: get_json("https://x/"); named = ""
        except ReadFailed as e: named = str(e)
        ok("HTTP 404" in named, "network: a 404 is not retried")
    finally:
        urllib.request.urlopen = real

    # the whole run, with Apple's answers faked
    def run_main(answers, out):
        globals()["OUT"] = out
        real_get = globals()["get_json"]
        def fake(url, tries=3):
            v = answers(url)
            if isinstance(v, Exception): raise v
            return v
        globals()["get_json"] = fake
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                code = main()
        finally:
            globals()["get_json"] = real_get
        return code, buf.getvalue()
    lk = lambda avg, n: {"resultCount": 1, "results": [{"averageUserRating": avg, "userRatingCount": n}]}
    def apple(url, us=(4.5, 40), ca=(5.0, 10), reviews=True):
        if "/lookup" in url:
            cc = re.search(r"country=(\w+)", url).group(1)
            return lk(*us) if cc == "us" else lk(*ca) if cc == "ca" else {"resultCount": 0, "results": []}
        return {"feed": {"entry": [one]}} if reviews else {"feed": {}}
    with tempfile.TemporaryDirectory() as td:
        f = os.path.join(td, "data", "app-store-reviews.js")
        globals()["COUNTRIES"] = ["us", "ca", "nz"]
        code, out = run_main(apple, f)
        txt = open(f).read()
        ok(code == 0 and "wrote" in out and txt.startswith("/*") and '"count": 50' in txt and '"rating": 4.6' in txt and "Bedtime is calm now" in txt and not os.path.exists(f + ".tmp"),
           "run: first read writes the file whole (50 ratings, 4.6, the review)")
        code, out = run_main(apple, f)
        ok(code == 0 and "nothing changed" in out and open(f).read() == txt, "run: the same read the next day changes nothing")
        code, out = run_main(lambda u: ConnectionResetError("reset") if "country=us" in u else apple(u), f)
        ok(code == 1 and "::error::" in out and open(f).read() == txt, "run: Apple unreachable -> RED, named, last good file untouched")
        code, out = run_main(lambda u: apple(u, ca=(0, 0)), f)
        ok(code == 1 and "ca storefront" in out and open(f).read() == txt, "run: a storefront that drops out -> RED, file untouched")
        code, out = run_main(lambda u: apple(u, reviews=False), f)
        ok(code == 1 and "no written reviews" in out and open(f).read() == txt, "run: reviews all missing -> RED, file untouched")
        code, out = run_main(lambda u: ["not", "a", "dict"], f)
        ok(code == 1 and "::error::" in out and open(f).read() == txt, "run: nonsense from Apple -> RED, file untouched, no traceback")
        code, out = run_main(lambda u: apple(u, us=(4.0, 60)), f)
        ok(code == 0 and "wrote" in out and '"count": 70' in open(f).read(), "run: real growth is written")
        open(f, "w").write("this is not a data file")
        code, out = run_main(apple, f)
        ok(code == 0 and "wrote" in out and '"count": 50' in open(f).read(), "run: a damaged old file is simply replaced")
    print("ALL PASS" if not bad else f"{bad} FAILED")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(_test() if "--test" in sys.argv else main())
