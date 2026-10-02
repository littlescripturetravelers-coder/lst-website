#!/usr/bin/env python3
"""TEMPLES AND MISSIONARY WORK, FROM THE CHURCH'S OWN PAGES, KEPT UP TO DATE.

    python3 lantern/church_watch.py            # gather, write data/temples.js and data/missions.js
    SUPABASE_SERVICE_ROLE_KEY=... python3 lantern/church_watch.py   # ...and send both to the account

Levi, 2 Oct 2026: on the timeline, the missionary work of The Church of Jesus
Christ of Latter-day Saints - when missionaries first went to each country and
state, the history of each place and its membership, where missionaries serve
today, how many members are in each area of the world, and which countries
have none - and every temple, when it was built, with facts and history. Both
kept up to date as temples are announced and dedicated and as places open or
close to missionary work.

EVERY FIGURE AND EVERY HISTORY HERE IS THE CHURCH'S OWN, read from its pages;
nothing is invented. Where a fact is worked out (the third temple in Brazil,
the first in Africa, forty years from groundbreaking to dedication) it is
worked out from those same figures. The sources:

  temples   https://www.churchofjesuschrist.org/temples/list        every temple and its status
            https://www.churchofjesuschrist.org/temples/details/<id> its milestones: announced,
                                                                    groundbreaking, dedicated, rededicated
  places    https://www.churchofjesuschrist.org/learn/facts-statistics/<place>   (dated figures)
            https://newsroom.churchofjesuschrist.org/facts-and-statistics/...    (the rest, and the
                                                                    Church's own list of places)

What changed since the last run (a temple announced, dedicated or closed for
renovation; a place newly listed, or no longer; a mission opened or closed)
is kept in the files' "changes", newest first, so the timeline can show it.

Nothing here costs anything: no AI, no credits. Run by .github/workflows/church-watch.yml.
"""
import datetime
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT_TEMPLES = os.path.join(SITE, "data", "temples.js")
OUT_MISSIONS = os.path.join(SITE, "data", "missions.js")
CACHE = os.environ.get("CHURCH_CACHE", "")          # a folder to keep pages in while developing
UA = {"User-Agent": "Mozilla/5.0 (compatible; LittleScriptureTravelers-timeline/1.0; +https://littlescripturetravelers.com)"}
CHURCH = "https://www.churchofjesuschrist.org"
NEWSROOM = "https://newsroom.churchofjesuschrist.org/facts-and-statistics/"
TODAY = datetime.date.today().isoformat()


# ----------------------------------------------------------------------------- fetching
MEM = {}


def prefetch(urls, workers=8):
    """Read many pages at once (eight at a time), so the daily run takes minutes, not an hour."""
    import concurrent.futures
    todo = [u for u in dict.fromkeys(urls) if u not in MEM]
    with concurrent.futures.ThreadPoolExecutor(workers) as ex:
        for u, b in zip(todo, ex.map(lambda u: get(u), todo)):
            if b is not None:
                MEM[u] = b


def get(url, tries=3):
    """The page, '' when it does not exist, None when it could not be had."""
    if url in MEM:
        return MEM[url]
    key = re.sub(r"[^a-z0-9]+", "_", url.lower())[-150:]
    if CACHE:
        p = os.path.join(CACHE, key + ".html")
        if os.path.exists(p):
            return open(p, encoding="utf-8").read()
    for i in range(tries):
        try:
            b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45).read().decode("utf-8", "ignore")
            if CACHE:
                os.makedirs(CACHE, exist_ok=True)
                open(os.path.join(CACHE, key + ".html"), "w", encoding="utf-8").write(b)
            time.sleep(0.25)
            return b
        except urllib.error.HTTPError as e:
            if e.code == 404:
                if CACHE:
                    os.makedirs(CACHE, exist_ok=True)
                    open(os.path.join(CACHE, key + ".html"), "w", encoding="utf-8").write("")
                return ""
            time.sleep(3 * (i + 1))
        except Exception:
            time.sleep(3 * (i + 1))
    return None


def next_data(b):
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', b or "", re.S)
    return json.loads(m.group(1)) if m else None


def plain(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or ""))).strip()


def num(s):
    s = re.sub(r"[^0-9]", "", str(s or ""))
    return int(s) if s else None


MONTHS = {m: i for i, m in enumerate(["january", "february", "march", "april", "may", "june", "july", "august",
                                      "september", "october", "november", "december"], 1)}


def iso(d):
    """'April 6, 1893' -> '1893-04-06'; anything else -> ''."""
    m = re.match(r"\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})", str(d or ""))
    if not m or m.group(1).lower() not in MONTHS:
        return ""
    return "%s-%02d-%02d" % (m.group(3), MONTHS[m.group(1).lower()], int(m.group(2)))


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", str(s).lower().replace("'", "")).strip("-")


# ----------------------------------------------------------------------------- temples
def temples(previous):
    lst = next_data(get(CHURCH + "/temples/list?lang=eng"))
    if not lst:
        raise SystemExit("church-watch: the temple list could not be read - nothing written")
    rows = lst["props"]["pageProps"]["templeList"]
    old = {t["id"]: t for t in (previous or {}).get("items", [])}
    out = []
    full = os.environ.get("FULL") == "1" or datetime.date.today().day == 1
    prefetch([CHURCH + "/temples/details/" + (r.get("templeNameId") or slug(r.get("name", ""))) + "?lang=eng" for r in rows
              if full or not old.get(r.get("templeNameId")) or old[r.get("templeNameId")].get("status") != (r.get("status") or "").upper()
              or old[r.get("templeNameId")].get("listed") != (r.get("date") or "")])
    rows = [r for r in rows if (r.get("templeNameId") or "") != "other" and (r.get("name") or "").strip().lower() not in ("", "other")]
    for r in rows:
        tid = r.get("templeNameId") or slug(r.get("name", ""))
        status = (r.get("status") or "").upper()
        t = {"id": tid, "name": r.get("name", "").strip(), "status": status,
             "city": (r.get("city") or "").strip(), "region": (r.get("stateRegion") or "").strip(),
             "country": (r.get("country") or "").strip(), "location": (r.get("location") or "").strip(),
             "url": CHURCH + "/temples/details/" + tid + "?lang=eng"}
        prev = old.get(tid)
        # the milestones change rarely; a temple is read again when its status or date moved,
        # when it is new, or once a month for every temple
        fresh = (not prev) or prev.get("status") != status or prev.get("listed") != (r.get("date") or "") \
            or os.environ.get("FULL") == "1" or datetime.date.today().day == 1
        if fresh:
            d = next_data(get(t["url"]))
            ms = []
            if d:
                for m in ((d["props"]["pageProps"].get("historicalMilestones") or {}).get("dates") or []):
                    ms.append({"what": (m.get("milestone") or "").strip(), "date": (m.get("date") or "").strip(),
                               "iso": m.get("dedicationDate") or iso(m.get("date"))})
            elif prev:
                ms = prev.get("milestones", [])
            t["milestones"] = ms
        else:
            t["milestones"] = prev.get("milestones", [])
        t["listed"] = r.get("date") or ""
        def first(what):
            for m in t["milestones"]:
                if m["what"].lower() == what and m["iso"]:
                    return m["iso"]
            return ""
        t["announced"] = first("announced")
        t["groundbreaking"] = first("groundbreaking")
        t["dedicated"] = first("dedicated") or (iso(r.get("date")) if status in ("OPERATING", "RENOVATION", "HISTORICAL") else "")
        if t["dedicated"] and t["dedicated"] > TODAY:
            t["scheduled"], t["dedicated"] = t["dedicated"], ""
        t["rededicated"] = [m["iso"] for m in t["milestones"] if m["what"].lower() == "rededicated" and m["iso"]]
        out.append(t)
    # the first temples of this dispensation, no longer on the list of temples in use
    have = {t["id"] for t in out}
    for h in HISTORIC:
        if h["id"] not in have:
            out.append(dict(h))
    return out


# the first temples, as the scriptures and the Church's history record them
HISTORIC = [
    {"id": "kirtland-temple", "name": "Kirtland Temple", "status": "HISTORICAL", "city": "Kirtland", "region": "Ohio",
     "country": "United States", "location": "Kirtland, Ohio, United States", "dedicated": "1836-03-27", "announced": "", "groundbreaking": "",
     "milestones": [{"what": "Cornerstones laid", "date": "July 23, 1833", "iso": "1833-07-23"}, {"what": "Dedicated", "date": "March 27, 1836", "iso": "1836-03-27"}],
     "rededicated": [], "listed": "", "url": "https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/109?lang=eng"},
    {"id": "nauvoo-temple-1846", "name": "Nauvoo Temple (the first)", "status": "HISTORICAL", "city": "Nauvoo", "region": "Illinois",
     "country": "United States", "location": "Nauvoo, Illinois, United States", "dedicated": "1846-05-01", "announced": "", "groundbreaking": "",
     "milestones": [{"what": "Cornerstones laid", "date": "April 6, 1841", "iso": "1841-04-06"}, {"what": "Dedicated", "date": "May 1, 1846", "iso": "1846-05-01"}],
     "rededicated": [], "listed": "", "url": "https://www.churchofjesuschrist.org/study/history/topics/nauvoo-temple?lang=eng"},
]


# ----------------------------------------------------------------------------- places
def newsroom_lists():
    """The Church's own list of places: countries by continent, and the states."""
    b = get(NEWSROOM + "state/utah") or ""
    lists = {}
    for m in re.finditer(r'id="(fas-countries-([a-z-]+)|fas-states-provinces)"', b):
        seg = b[m.end():m.end() + 60000]
        end = seg.find('id="fas-')
        seg = seg[:end] if end > 0 else seg
        lists[m.group(2) or "states"] = [(h, plain(t)) for h, t in
                                         re.findall(r'href="[^"]*facts-and-statistics/([^"]+)"[^>]*>\s*([^<]+?)\s*<', seg)]
    return lists


CONTINENT = {"north-america": "North America", "south-america": "South America", "europe": "Europe",
             "asia": "Asia", "oceania": "Oceania (Pacific)", "africa": "Africa"}


def newsroom_place(path):
    b = get(NEWSROOM + path) or ""
    m = re.search(r'id="fas-(country|state)-stats"', b)
    if not m:
        return None
    seg = b[m.start():]
    stop = re.search(r'id="fas-(?!country-stats|state-stats)', seg[20:])
    if stop:
        seg = seg[:stop.start() + 20]
    nm = re.search(r'<name itemprop="name">([^<]+)</name>', seg) or re.search(r'itemprop="name">([^<]+)</h2>', seg)
    mem = re.search(r'class="stat-value">([\d,]+)</h3>\s*<p itemprop="name">Total Church Membership', seg)
    wb = re.search(r'data-congregation-data="(\d+),(\d+)"', seg)
    def tag(t):
        x = re.search(r"<" + t + r">\s*([\d,]+)\s*</" + t + ">", seg)
        return num(x.group(1)) if x else None
    tm = re.search(r'class="stat-value">(?:<temple-count>)?([\d,]+)(?:</temple-count>)?</h3>\s*<p itemprop="name">\s*(?:<span>)?\s*Temples', seg)
    hist = []
    h = re.search(r'class="stat-write-up"[^>]*>(.*?)</div>', seg, re.S)
    if h:
        hist = [plain(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", h.group(1), re.S)]
    cong = tag("congregation-count")
    if cong is None and wb:
        cong = int(wb.group(1)) + int(wb.group(2))
    return {"name": plain(nm.group(1)) if nm else "", "members": num(mem.group(1)) if mem else None,
            "congregations": cong, "wards": int(wb.group(1)) if wb else None, "branches": int(wb.group(2)) if wb else None,
            "missions": tag("mission-count"), "stakes": tag("stake-count"), "districts": tag("district-count"),
            "familySearchCenters": tag("family-history-center-count"), "temples": num(tm.group(1)) if tm else None,
            "history": [p for p in hist if p], "source": NEWSROOM + path, "asOf": ""}


def learn_place(s):
    """The newer pages: dated figures, a summary and a history."""
    b = get(CHURCH + "/learn/facts-statistics/" + s + "?lang=eng")
    if not b:
        return None
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", b, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", "\n", t))
    t = re.sub(r"[ \t\xa0]+", " ", t)
    t = re.sub(r"\n\s*\n+", "\n", t)
    def field(label):
        m = re.search(r"\n" + re.escape(label) + r"\n([^\n]+)", t)
        return m.group(1).strip() if m else None
    if not field("Church Membership"):
        return None
    cg = field("Congregations") or ""
    wb = re.search(r"\(([\d,]+) Wards?, ([\d,]+) Branch", cg)
    asof = re.search(r"Last Updated On ([^\n]+)", t)
    name = field("Name") or ""
    summ, hist = [], []
    m = re.search(r"\nThe Church in [^\n]+\n(.*?)\n(?:Visit the|History of the Church)", t, re.S)
    if m:
        summ = [x.strip() for x in m.group(1).split("\n") if len(x.strip()) > 40]
    m = re.search(r"\nHistory of the Church in [^\n]+\n(.*?)\n(?:Read more in|Stories of Faith|More Areas|Notes\n)", t, re.S)
    if m:
        hist = [x.strip() for x in m.group(1).split("\n") if len(x.strip()) > 40]
    d = None
    if asof:
        try:
            d = datetime.datetime.strptime(asof.group(1).strip(), "%d %b %Y").date().isoformat()
        except ValueError:
            d = asof.group(1).strip()
    return {"name": name, "members": num(field("Church Membership")), "congregations": num(cg.split("(")[0]),
            "wards": num(wb.group(1)) if wb else None, "branches": num(wb.group(2)) if wb else None,
            "missions": num(field("Number of Missions")), "temples": num(field("Operating Temples")),
            "capital": field("Capital") or "", "languages": field("Official Languages") or "",
            "continent": field("Continent") or "", "summary": summ, "history": hist,
            "source": CHURCH + "/learn/facts-statistics/" + s + "?lang=eng", "asOf": d or ""}


YEAR = r"\b(18[3-9]\d|19\d\d|20[0-2]\d)\b"
# a sentence ends at . ! or ? after a word of two or more small letters or a number - not after an initial like "B."
SENT = r"(?<=[a-z0-9)”\"'][a-z0-9)”\"'][.!?])\s+(?=[A-Z“\"])"


def first_missionaries(history):
    """The earliest year the Church's own history names for missionaries in a place,
    with the sentence that says so. Only what the page says; never a guess."""
    best = None
    for para in history or []:
        for sent in re.split(SENT, para):
            if not re.search(r"missionar|elders? (?:arrived|began|came|preached|were sent)|preach", sent, re.I):
                continue
            ys = [int(y) for y in re.findall(YEAR, sent)]
            if not ys:
                continue
            y = min(ys)
            if best is None or y < best["year"]:
                best = {"year": y, "said": sent.strip()}
    return best


def church_began(history):
    best = None
    for para in history or []:
        for sent in re.split(SENT, para):
            ys = [int(y) for y in re.findall(YEAR, sent)]
            if ys and (best is None or min(ys) < best["year"]):
                best = {"year": min(ys), "said": sent.strip()}
    return best


def places(previous):
    lists = newsroom_lists()
    if not lists:
        raise SystemExit("church-watch: the Church's list of places could not be read - nothing written")
    out = []
    prefetch([NEWSROOM + path for rows in lists.values() for path, _ in rows]
             + [CHURCH + "/learn/facts-statistics/" + path.split("/")[-1] + "?lang=eng" for rows in lists.values() for path, _ in rows])
    for cont, rows in lists.items():
        for path, name in rows:
            kind = "state" if path.startswith("state/") else "country"
            s = path.split("/")[-1]
            p = learn_place(s) if kind == "country" or s in ("alabama",) else None
            if kind == "state":
                p = learn_place(s) or None
            q = newsroom_place(path)
            if not p and not q:
                continue
            r = p or q
            if p and q:
                # the dated page's figures; the Newsroom's history when it tells more
                if len(" ".join(q.get("history") or [])) > len(" ".join(p.get("history") or [])):
                    r["history"] = q["history"]
                for k in ("stakes", "districts", "familySearchCenters"):
                    r[k] = q.get(k)
            r["id"] = s
            r["kind"] = kind
            r["name"] = name or r.get("name", "")
            r["continent"] = CONTINENT.get(cont, "") if kind == "country" else "North America"
            if kind == "state":
                r["country"] = "United States"
            fm = first_missionaries((r.get("summary") or []) + (r.get("history") or []))
            r["firstMissionaries"] = fm
            r["began"] = church_began((r.get("summary") or []) + (r.get("history") or [])) if not fm else None
            out.append(r)
    return out


def areas():
    out = []
    for s, name in [("africa", "Africa"), ("asia", "Asia"), ("europe", "Europe"), ("north-america", "North America"),
                    ("oceania", "Oceania (Pacific)"), ("south-america", "South America")]:
        b = get(CHURCH + "/learn/facts-statistics/" + s + "?lang=eng") or ""
        t = html.unescape(re.sub(r"<[^>]+>", "\n", re.sub(r"<script.*?</script>|<style.*?</style>", "", b, flags=re.S)))
        t = re.sub(r"\n\s*\n+", "\n", re.sub(r"[ \t\xa0]+", " ", t))
        def field(label):
            m = re.search(r"\n" + re.escape(label) + r"\n([^\n]+)", t)
            return m.group(1).strip() if m else None
        asof = re.search(r"Last Updated On ([^\n]+)", t)
        summ = ""
        nd = next_data(b)
        if nd:
            for m in re.finditer(r'"description": ?"(<p>.*?</p>)"', json.dumps(nd)):
                pass
        d = ""
        if asof:
            try:
                d = datetime.datetime.strptime(asof.group(1).strip(), "%d %b %Y").date().isoformat()
            except ValueError:
                d = asof.group(1).strip()
        out.append({"id": s, "name": name, "members": num(field("Church Membership") or field("Total Church Membership")),
                    "congregations": num((field("Congregations") or "").split("(")[0]),
                    "missions": num(field("Number of Missions")), "temples": num(field("Operating Temples")),
                    "asOf": d, "source": CHURCH + "/learn/facts-statistics/" + s + "?lang=eng"})
    return out


def world():
    b = get(NEWSROOM) or ""
    def stat(label):
        m = re.search(r'class="stat-value">([\d,]+)</h3>\s*<p itemprop="name">' + re.escape(label), b)
        return num(m.group(1)) if m else None
    # the page keeps its figures as data (since 2026); the older page kept them in the markup
    i = b.find('"worldwideStatistics":{')
    if i >= 0:
        try:
            d = json.JSONDecoder().raw_decode(b[i + len('"worldwideStatistics":'):])[0]
            n = lambda k: num(d.get(k)) if d.get(k) not in (None, "") else None
            w = {"members": n("churchMembership"), "congregations": n("congregations"), "missionaries": n("missionaries"),
                 "seniorServiceMissionaries": n("seniorServiceMissionaries"), "youngServiceMissionaries": n("youngServiceMissionaries"),
                 "missions": n("missions"), "stakes": n("stakes"), "temples": n("temples"),
                 "asOf": ("End of " + str(d["year"])) if d.get("year") else "", "source": NEWSROOM}
            if w["members"]:
                return w
        except Exception:
            pass
    w = {"members": stat("Total Church Membership"), "congregations": stat("Congregations"),
         "missionaries": stat("Full-Time Teaching Missionaries"), "seniorServiceMissionaries": stat("Senior Service Missionaries"),
         "languages": stat("Published Languages"), "source": NEWSROOM}
    for label, key in (("Missions", "missions"), ("Temples", "temples")):
        m = re.search(r"\n" + label + r"\n([\d,]+)", html.unescape(re.sub(r"<[^>]+>", "\n", b)))
        if m:
            w[key] = num(m.group(1))
    gd = re.search(r'data-growth-data="([^"]+)"', b)
    if gd:
        vals = [num(x) for x in gd.group(1).split(",")]
        if vals and all(v is not None for v in vals):
            # one figure a year from 1830, as the page's own chart lays them out
            w["growth"] = [[1830 + i, v] for i, v in enumerate(vals)]
    return w


# ----------------------------------------------------------------------------- the world's countries
WORLD = """Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cabo Verde|Cambodia|Cameroon|Canada|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo|Costa Rica|Cote d'Ivoire|Croatia|Cuba|Cyprus|Czechia|Democratic Republic of the Congo|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kosovo|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Mexico|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|Sao Tome and Principe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Vatican City|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe""".split("|")
SAME = {"cabo-verde": ["cape-verde"], "czechia": ["czech-republic"], "cote-divoire": ["ivory-coast", "cote-d-ivoire", "cote-divoire"],
        "congo": ["republic-of-the-congo", "congo-brazzaville", "republic-of-congo"],
        "democratic-republic-of-the-congo": ["democratic-republic-of-congo", "dr-congo", "congo-democratic-republic", "congo-kinshasa"],
        "eswatini": ["swaziland"], "micronesia": ["federated-states-of-micronesia", "micronesia-federated-states-of"],
        "north-macedonia": ["macedonia"], "myanmar": ["burma"], "south-korea": ["korea", "korea-south", "republic-of-korea", "south-korea"],
        "russia": ["russian-federation"], "timor-leste": ["east-timor"], "united-states": ["united-states-of-america", "united-states"],
        "gambia": ["the-gambia"], "bahamas": ["the-bahamas"], "palestine": ["palestinian-territories", "west-bank"],
        "taiwan": ["taiwan"], "laos": ["lao"], "vietnam": ["viet-nam"], "moldova": ["republic-of-moldova"]}


def unlisted(listed_ids, listed_names):
    # the United States is reported state by state
    have = set(listed_ids) | {slug(n) for n in listed_names} | {"united-states"}
    out = []
    for n in WORLD:
        s = slug(n)
        if s in have or any(a in have for a in SAME.get(s, [])):
            continue
        out.append(n)
    return out


# ----------------------------------------------------------------------------- facts worked out from the figures
CURATED = {
    # a few temples whose history is well known, each with the Church's own page for it
    "kirtland-temple": [
        ["The first temple of this dispensation, dedicated March 27, 1836. Its dedicatory prayer is Doctrine and Covenants 109.",
         CHURCH + "/study/scriptures/dc-testament/dc/109?lang=eng"],
        ["On April 3, 1836, Joseph Smith and Oliver Cowdery saw the Savior in this temple, and Moses, Elias and Elijah restored priesthood keys (Doctrine and Covenants 110).",
         CHURCH + "/study/scriptures/dc-testament/dc/110?lang=eng"]],
    "nauvoo-illinois-temple": [
        ["The first Nauvoo Temple was dedicated in 1846 as the Saints were leaving the city; it was later destroyed by fire and storm. This temple was rebuilt on the same site.",
         CHURCH + "/study/history/topics/nauvoo-temple?lang=eng"]],
    "salt-lake-temple": [
        ["Brigham Young marked the site on July 28, 1847, four days after the pioneers reached the Salt Lake Valley.",
         CHURCH + "/temples/details/salt-lake-temple?lang=eng"]],
}
AREA_FIRSTS = {"Europe": "Europe", "Asia": "Asia", "Africa": "Africa", "South America": "South America", "Oceania (Pacific)": "the Pacific"}


def facts(ts, place_by_name):
    dedicated = sorted([t for t in ts if t.get("dedicated")], key=lambda t: t["dedicated"])
    for i, t in enumerate(dedicated, 1):
        t["order"] = i
    seen_country, seen_state, seen_area = {}, {}, {}
    for t in dedicated:
        c = t.get("country") or ""
        a = (place_by_name.get(c) or {}).get("continent", "")
        t["area"] = a
        f = []
        if not seen_country.get(c):
            seen_country[c] = 1
            if c and c != "United States":
                f.append("The first temple in " + c + ".")
        else:
            seen_country[c] += 1
        if c == "United States" and t.get("region"):
            if not seen_state.get(t["region"]):
                seen_state[t["region"]] = 1
                f.append("The first temple in " + t["region"] + ".")
            else:
                seen_state[t["region"]] += 1
        if a in AREA_FIRSTS and not seen_area.get(a):
            seen_area[a] = 1
            f.insert(0, "The first temple in " + AREA_FIRSTS[a] + ".")
        f.append("The %s temple to be dedicated." % ordinal(t["order"]))
        y0 = t.get("announced") or t.get("groundbreaking")
        if t.get("groundbreaking") and t.get("dedicated"):
            yrs = int(t["dedicated"][:4]) - int(t["groundbreaking"][:4])
            if yrs >= 2:
                f.append("%d years from groundbreaking to dedication." % yrs)
        if t.get("rededicated"):
            f.append("Rededicated " + ", ".join(nice(d) for d in t["rededicated"]) + ".")
        t["facts"] = f
    for t in ts:
        if not t.get("dedicated"):
            f = []
            if t["status"] == "CONSTRUCTION":
                f.append("Under construction" + (" since " + nice(t["groundbreaking"]) if t.get("groundbreaking") else "") + ".")
            elif t["status"] == "ANNOUNCED":
                f.append("Announced" + (" " + nice(t["announced"]) if t.get("announced") else "") + ".")
            elif t["status"] == "OPENING SOON":
                f.append("Nearly finished: open house and dedication are coming.")
            c = t.get("country") or ""
            if c and not any(x.get("country") == c for x in dedicated):
                f.append("When dedicated, it will be the first temple in " + c + ".")
            t["facts"] = f
        t["history"] = [{"said": s, "url": u} for s, u in CURATED.get(t["id"], [])]


def ordinal(n):
    return str(n) + ("th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th"))


def nice(d):
    try:
        x = datetime.date.fromisoformat(d)
        return x.strftime("%B ") + str(x.day) + x.strftime(", %Y")
    except Exception:
        return d


# ----------------------------------------------------------------------------- what changed
def changes_temples(prev, now):
    out = list((prev or {}).get("changes", []))
    old = {t["id"]: t for t in (prev or {}).get("items", [])}
    if not old:
        return out
    for t in now:
        o = old.get(t["id"])
        if not o:
            out.insert(0, {"on": TODAY, "id": t["id"], "what": "announced", "note": t["name"] + " was announced."})
        elif o.get("status") != t["status"]:
            word = {"CONSTRUCTION": "is now under construction", "OPENING SOON": "is opening soon",
                    "OPERATING": "was dedicated" if not o.get("dedicated") else "is open again",
                    "RENOVATION": "has closed for renovation"}.get(t["status"], "is now " + t["status"].lower())
            out.insert(0, {"on": TODAY, "id": t["id"], "what": t["status"].lower(), "note": t["name"] + " " + word + "."})
    for tid, o in old.items():
        if tid not in {t["id"] for t in now}:
            out.insert(0, {"on": TODAY, "id": tid, "what": "removed", "note": o["name"] + " is no longer on the Church's temple list."})
    return out[:200]


def changes_places(prev, now):
    out = list((prev or {}).get("changes", []))
    old = {p["id"]: p for p in (prev or {}).get("places", [])}
    if not old:
        return out
    ids = {p["id"] for p in now}
    for p in now:
        o = old.get(p["id"])
        if not o:
            out.insert(0, {"on": TODAY, "id": p["id"], "what": "opened", "note": p["name"] + " is now listed among the places the Church reports."})
            continue
        a, b = o.get("missions"), p.get("missions")
        if a is not None and b is not None and a != b:
            if not a and b:
                out.insert(0, {"on": TODAY, "id": p["id"], "what": "opened", "note": "A mission now serves from " + p["name"] + "."})
            elif a and not b:
                out.insert(0, {"on": TODAY, "id": p["id"], "what": "closed", "note": "No mission is based in " + p["name"] + " any longer."})
            else:
                out.insert(0, {"on": TODAY, "id": p["id"], "what": "missions", "note": "%s now has %d missions (it had %d)." % (p["name"], b, a)})
    for pid, o in old.items():
        if pid not in ids:
            out.insert(0, {"on": TODAY, "id": pid, "what": "closed", "note": o["name"] + " is no longer listed among the places the Church reports."})
    return out[:200]


# ----------------------------------------------------------------------------- reading and writing the files
def read_js(path, name):
    try:
        s = open(path, encoding="utf-8").read()
        m = re.search(r"window\." + name + r"\s*=\s*(\{.*\});\s*$", s, re.S)
        return json.loads(m.group(1)) if m else None
    except Exception:
        return None


HEAD = """/* %s
   Written by lantern/church_watch.py from the Church's own pages (see the
   sources inside). Do not edit by hand: the next run would write over it.
   Copied into the app as www/data/%s; the account's timeline_feed row "%s"
   carries any newer copy to phones without a new build. */
"""


def write_js(path, name, title, row, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    open(path, "w", encoding="utf-8").write(HEAD % (title, os.path.basename(path), row) +
                                             "window." + name + "=" + body + ";\n")


def account_updated(row):
    """The date on the account's copy of a row ('' when it has none or cannot be asked)."""
    url, key = os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not (url and key):
        return "9999"          # no key: nothing can be sent anyway
    try:
        req = urllib.request.Request(url.rstrip("/") + "/rest/v1/timeline_feed?select=u:body->>updated&id=eq." + row,
                                     headers={"apikey": key, "Authorization": "Bearer " + key})
        rows = json.loads(urllib.request.urlopen(req, timeout=60).read())
        return (rows[0].get("u") or "") if rows else ""
    except Exception as e:
        print("   could not ask the account about", row, "-", e)
        return ""


def send(row, body):
    url, key = os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not (url and key):
        print("   no account key - the files are written, the account is not told")
        return
    req = urllib.request.Request(url.rstrip("/") + "/rest/v1/timeline_feed?on_conflict=id",
                                 data=json.dumps({"id": row, "body": body}).encode(), method="POST",
                                 headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json",
                                          "Prefer": "resolution=merge-duplicates,return=minimal"})
    try:
        urllib.request.urlopen(req, timeout=60)
        print("   sent to the account as", row)
    except urllib.error.HTTPError as e:
        print("   the account refused", row, e.code, e.read()[:200])


def main():
    prev_t = read_js(OUT_TEMPLES, "LST_TEMPLES")
    prev_m = read_js(OUT_MISSIONS, "LST_MISSIONS")
    print("temples...", flush=True)
    ts = temples(prev_t)
    print("  %d temples" % len(ts), flush=True)
    print("places...", flush=True)
    ps = places(prev_m)
    print("  %d places" % len(ps), flush=True)
    by_name = {p["name"]: p for p in ps if p["kind"] == "country"}
    by_name["United States"] = by_name.get("United States of America") or by_name.get("United States") or {"continent": "North America"}
    facts(ts, by_name)
    countries = [p for p in ps if p["kind"] == "country"]
    no_place = unlisted([p["id"] for p in countries], [p["name"] for p in countries])
    w = world()
    ar = areas()
    T = {"updated": TODAY, "source": CHURCH + "/temples/list?lang=eng",
         "counts": {k: sum(1 for t in ts if t["status"] == k) for k in ("OPERATING", "RENOVATION", "OPENING SOON", "CONSTRUCTION", "ANNOUNCED", "HISTORICAL")},
         "items": ts, "changes": changes_temples(prev_t, ts)}
    M = {"updated": TODAY, "world": w, "areas": ar, "places": ps, "notListed": no_place,
         "noMissionBased": sorted(p["name"] for p in countries if p.get("missions") == 0),
         "changes": changes_places(prev_m, ps),
         "sources": [NEWSROOM, CHURCH + "/learn/facts-statistics?lang=eng"]}
    # a run that read far less than last time is a broken read, not a world that shrank
    if prev_t and len(ts) < 0.8 * len(prev_t.get("items", [])):
        raise SystemExit("church-watch: only %d temples read (last time %d) - nothing written" % (len(ts), len(prev_t["items"])))
    if prev_m and len(ps) < 0.8 * len(prev_m.get("places", [])):
        raise SystemExit("church-watch: only %d places read (last time %d) - nothing written" % (len(ps), len(prev_m["places"])))
    # a day when nothing changed writes nothing: no commit, no redeploy, and the date keeps
    # saying when the Church's figures last moved
    same = lambda a, b: a is not None and {k: v for k, v in a.items() if k != "updated"} == {k: v for k, v in b.items() if k != "updated"}
    for path, name, title, row, data, prev in ((OUT_TEMPLES, "LST_TEMPLES", "EVERY TEMPLE OF THE CHURCH OF JESUS CHRIST OF LATTER-DAY SAINTS", "temples", T, prev_t),
                                                (OUT_MISSIONS, "LST_MISSIONS", "MISSIONARY WORK AND MEMBERSHIP, PLACE BY PLACE", "missions", M, prev_m)):
        if same(prev, data) and os.environ.get("FORCE_SEND") != "1":
            print("   %s: nothing changed since %s" % (row, prev.get("updated")))
            # the account is given the copy if it has none, or an older one
            if account_updated(row) < prev.get("updated", ""):
                send(row, prev)
            continue
        write_js(path, name, title, row, data)
        print("   %s written: %s" % (row, os.path.relpath(path, SITE)))
        send(row, data)
    print("temples %d, places %d (%d not listed)" % (len(ts), len(ps), len(no_place)))


if __name__ == "__main__":
    main()
