"""The Video Studio's shared pieces: the timeline contract (lst-app docs/STUDIO.md), loading a project
from a file or from Supabase, fetching media (local path or https, cached by the URL's hash), and the
clip start math every part of the studio agrees on:

    start(0) = 0,  start(i+1) = start(i) + dur(i) - trans(i).dur      (trans.dur 0 when type "cut")
    total     = start(last) + dur(last)
"""
import os, json, hashlib, subprocess, time, urllib.request, urllib.error, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
FONTS = os.path.join(ROOT, "lantern", "brand", "fonts")
CACHE = os.environ.get("STUDIO_CACHE", os.path.join(HERE, ".cache"))
URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET = "studio"

NAVY, GOLD, TEAL, AMBER, WHITE = "#1B2D5F", "#F5C518", "#5BD3DC", "#D9A227", "#FFFFFF"

# STUDIO.md transition names -> ffmpeg xfade transitions
XFADE = {
    "crossfade": "fade", "dissolve": "dissolve", "fade-black": "fadeblack", "fade-white": "fadewhite",
    "slide-left": "slideleft", "slide-right": "slideright", "slide-up": "slideup", "slide-down": "slidedown",
    "wipe-left": "wipeleft", "wipe-right": "wiperight", "wipe-up": "wipeup", "wipe-down": "wipedown",
    "zoom-in": "fade",          # the zoom itself is drawn into the two shots (render.py); ffmpeg 6.1's zoomin tints pink
    "circle-open": "circleopen", "circle-close": "circleclose", "radial": "radial",
    "smooth-left": "smoothleft", "smooth-right": "smoothright", "smooth-up": "smoothup",
}
MOTIONS = ("none", "push-in", "pull-out", "pan-left", "pan-right", "pan-up", "pan-down")


def log(*a):
    print("[studio]", *a, flush=True)


# ------------------------------------------------------------------ the contract
def defaults(tl):
    """Fill what a timeline may leave out. An episode (the main video) is 16:9 1920x1080 at 30 fps."""
    tl.setdefault("v", 1)
    tl.setdefault("kind", "episode")
    if not tl.get("size"):
        tl["size"] = {"w": 1080, "h": 1920, "fps": 30} if tl["kind"] == "short" else {"w": 1920, "h": 1080, "fps": 30}
    tl["size"].setdefault("fps", 30)
    tl.setdefault("bg", NAVY)
    tl.setdefault("clips", []); tl.setdefault("texts", []); tl.setdefault("audio", [])
    cap = tl.setdefault("captions", {})
    cap.setdefault("on", True); cap.setdefault("style", "karaoke"); cap.setdefault("pos", "bottom")
    cap.setdefault("size", 64 if tl["size"]["h"] > tl["size"]["w"] else 54); cap.setdefault("lines", [])
    for i, c in enumerate(tl["clips"]):
        c.setdefault("id", f"c{i+1}"); c.setdefault("type", "image"); c.setdefault("src", "")
        c.setdefault("dur", 6); c.setdefault("in", 0); c.setdefault("fit", "cover")
        c.setdefault("motion", "push-in" if c["type"] == "image" else "none"); c.setdefault("vol", 0)
        t = c.get("trans") or {}
        t.setdefault("type", "cut"); t.setdefault("dur", 0 if t["type"] == "cut" else 0.5)
        if t["type"] == "cut": t["dur"] = 0
        c["trans"] = t
        c.setdefault("gen", {}); c.setdefault("status", "ready" if c["src"] or c["type"] == "color" else "todo")
    # the last clip has nothing to go into
    if tl["clips"]:
        tl["clips"][-1]["trans"] = {"type": "cut", "dur": 0}
    # a transition can never be longer than either clip it joins
    for i in range(len(tl["clips"]) - 1):
        a, b = tl["clips"][i], tl["clips"][i + 1]
        a["trans"]["dur"] = round(min(a["trans"]["dur"], a["dur"] * 0.45, b["dur"] * 0.45), 3)
    for i, a in enumerate(tl["audio"]):
        a.setdefault("id", f"a{i+1}"); a.setdefault("kind", "voice"); a.setdefault("vol", 1.0)
        a.setdefault("in", 0); a.setdefault("fadeIn", 0); a.setdefault("fadeOut", 0)
    for i, t in enumerate(tl["texts"]):
        t.setdefault("id", f"t{i+1}"); t.setdefault("style", "title"); t.setdefault("pos", "middle"); t.setdefault("anim", "fade")
    return tl


def starts(tl):
    s, out = 0.0, []
    for c in tl["clips"]:
        out.append(round(s, 4))
        s += float(c["dur"]) - float(c["trans"]["dur"])
    return out


def total(tl):
    if not tl["clips"]:
        ends = [float(a.get("start", 0)) + float(a.get("dur", 0)) for a in tl["audio"]]
        return max(ends or [1.0])
    st = starts(tl)
    return round(st[-1] + float(tl["clips"][-1]["dur"]), 4)


# ------------------------------------------------------------------ http + supabase
def http(method, url, body=None, headers=None, raw=None, timeout=300, tries=4):
    data = raw if raw is not None else (None if body is None else json.dumps(body).encode("utf-8"))
    last = None
    for k in range(tries):
        req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return res.status, res.read()
        except urllib.error.HTTPError as e:
            if e.code < 500 and e.code != 429:
                return e.code, e.read()
            last = (e.code, e.read())
        except Exception as e:  # network
            last = (0, str(e).encode())
        time.sleep(2 * (2 ** k))
    return last


def sb_headers(extra=None):
    h = {"apikey": KEY, "Authorization": "Bearer " + KEY}
    h.update(extra or {})
    return h


def load_project(pid=None, file=None):
    """Returns (row, timeline). A file may hold a whole row ({id, title, timeline, ...}) or just a timeline."""
    if file:
        d = json.load(open(file))
        if "timeline" in d:
            row = d
        else:
            row = {"id": d.get("id") or os.path.splitext(os.path.basename(file))[0], "title": d.get("title", ""),
                   "kind": d.get("kind"), "night": d.get("night"), "timeline": d}
        return row, defaults(row["timeline"])
    s, b = http("GET", f"{URL}/rest/v1/studio_projects?id=eq.{pid}&select=*", headers=sb_headers())
    rows = json.loads(b.decode("utf-8", "ignore")) if s == 200 else []
    if not rows:
        raise SystemExit(f"no studio project {pid} ({s} {b[:200]!r})")
    row = rows[0]
    tl = row.get("timeline") or {}
    tl.setdefault("title", row.get("title") or ""); tl.setdefault("kind", row.get("kind") or "episode")
    tl.setdefault("night", row.get("night"))
    return row, defaults(tl)


def save_project(row, tl, file=None, **patch):
    if file:
        out = dict(row); out["timeline"] = tl; out.update(patch)
        json.dump(out if "timeline" in json.load(open(file)) else tl, open(file, "w"), indent=1, ensure_ascii=False)
        return True
    body = {"timeline": tl}; body.update(patch)
    s, b = http("PATCH", f"{URL}/rest/v1/studio_projects?id=eq.{row['id']}", body,
                sb_headers({"Content-Type": "application/json", "Prefer": "return=minimal"}))
    if s not in (200, 204):
        log("could not save the project:", s, b[:200])
    return s in (200, 204)


def set_status(pid, status, **patch):
    body = {"status": status}; body.update(patch)
    s, b = http("PATCH", f"{URL}/rest/v1/studio_projects?id=eq.{pid}", body,
                sb_headers({"Content-Type": "application/json", "Prefer": "return=minimal"}))
    return s in (200, 204)


def upload(path_in_bucket, data, content_type):
    """Into the public `studio` bucket; returns the public URL. With no Supabase key (a local run) the
    file stays on disk and its local path is returned."""
    if not (URL and KEY):
        dst = os.path.join(HERE, "out", "uploads", path_in_bucket)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(data)
        return dst
    s, b = http("POST", f"{URL}/storage/v1/object/{BUCKET}/{path_in_bucket}", raw=data,
                headers=sb_headers({"Content-Type": content_type, "x-upsert": "true"}), timeout=600)
    if s not in (200, 201):
        raise RuntimeError(f"upload {path_in_bucket}: {s} {b[:200]!r}")
    return f"{URL}/storage/v1/object/public/{BUCKET}/{path_in_bucket}"


def fetch(src):
    """A local path for any src: a repo path, an absolute path, or an https URL (cached by its hash).
    The website's own URLs are read from this checkout when the file is here."""
    if not src:
        return None
    if src.startswith(("http://", "https://")):
        for site in ("https://littlescripturetravelers.com/", "https://www.littlescripturetravelers.com/"):
            if src.startswith(site):
                p = os.path.join(ROOT, src[len(site):].split("?")[0])
                if os.path.exists(p):
                    return p
        os.makedirs(CACHE, exist_ok=True)
        ext = os.path.splitext(src.split("?")[0])[1][:6] or ".bin"
        p = os.path.join(CACHE, hashlib.sha1(src.encode()).hexdigest()[:20] + ext)
        if not os.path.exists(p) or os.path.getsize(p) == 0:
            s, b = http("GET", src, headers={"User-Agent": "lst-studio"}, timeout=600)
            if s != 200:
                raise RuntimeError(f"could not fetch {src}: {s}")
            open(p, "wb").write(b)
        return p
    p = src if os.path.isabs(src) else os.path.join(ROOT, src)
    if not os.path.exists(p) and os.path.exists(os.path.join(HERE, src)):
        p = os.path.join(HERE, src)
    return p if os.path.exists(p) else None


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError("command failed: " + " ".join(map(str, cmd[:6])) + " ...\n" + (r.stderr or "")[-2500:])
    return r


def duration_of(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
                       capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except Exception:
        return 0.0


def have(binary):
    return shutil.which(binary) is not None


def cast():
    return json.load(open(os.path.join(HERE, "cast.json")))


def who(cast_data, cid):
    for c in cast_data["characters"] + cast_data["places"]:
        if c["id"] == cid:
            return c
    return None


def refs_for(cast_data, cid):
    """Every reference picture for a character or place: those listed in cast.json plus anything Levi
    has dropped into studio/refs/<id>.* or studio/refs/<id>/."""
    c = who(cast_data, cid)
    out = []
    for r in (c or {}).get("refs", []):
        p = os.path.join(ROOT, r)
        if os.path.exists(p): out.append(p)
    rd = os.path.join(HERE, "refs")
    if os.path.isdir(rd):
        for f in sorted(os.listdir(rd)):
            if os.path.splitext(f)[0] == cid and f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                out.append(os.path.join(rd, f))
        sub = os.path.join(rd, cid)
        if os.path.isdir(sub):
            out += [os.path.join(sub, f) for f in sorted(os.listdir(sub)) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))]
    return out
