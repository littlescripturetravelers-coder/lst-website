#!/usr/bin/env python3
"""A quick check of the Video Studio's crew, no internet needed:  python3 studio/test_render.py
Builds a tiny 16:9 episode and a tiny 9:16 short from local pictures (silent voices, a local lullaby),
renders both, and checks size, frame rate, length (the STUDIO.md start math), sound, the transition
colours (ffmpeg 6.1's zoomin once tinted pink) and the Short cutter."""
import os, sys, json, subprocess, tempfile, shutil, copy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ.pop("SUPABASE_URL", None); os.environ.pop("SUPABASE_SERVICE_ROLE_KEY", None)
os.environ["STUDIO_SPEND"] = "no"
import common, produce, render, make_short   # noqa: E402

fails = 0
def ok(name, cond, extra=""):
    global fails
    print(("  ok   " if cond else "  FAIL ") + name + ("" if cond else "  " + str(extra)))
    if not cond: fails += 1

def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", p],
                       capture_output=True, text=True)
    return json.loads(r.stdout)

def avg_rgb(p, t):
    b = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", p, "-frames:v", "1", "-vf", "scale=1:1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       capture_output=True).stdout
    return tuple(b[:3])

# 1. the start math
tl = common.defaults({"clips": [{"dur": 6, "trans": {"type": "crossfade", "dur": 0.5}}, {"dur": 10, "trans": {"type": "cut"}}, {"dur": 6}]})
ok("start math", common.starts(tl) == [0, 5.5, 15.5] and common.total(tl) == 21.5, (common.starts(tl), common.total(tl)))
ok("an episode is 16:9 1920x1080 by default", tl["size"] == {"w": 1920, "h": 1080, "fps": 30})
ok("shot lengths follow the Episode Engine", produce.choose_len(7.1, "episode", 6) == 10 and produce.choose_len(3, "episode", 15) == 15 and produce.choose_len(16.2, "episode", 6) == 16.5)

work = tempfile.mkdtemp(prefix="studio-test-")
ROOT = common.ROOT
pics = sorted(f for f in os.listdir(os.path.join(ROOT, "images", "book")) if f.startswith("nov-07-"))[:4]
pics = ["images/book/" + p for p in pics]
os.environ["KOKORO_DIR"] = "/nonexistent"     # force the silent stand-in so the test needs nothing downloaded
produce._kokoro = None
ep = {"title": "Test", "kind": "episode", "size": {"w": 640, "h": 360, "fps": 24}, "night": None,
      "clips": [
          {"id": "c1", "shot": "S02-01", "src": pics[0], "dur": 6, "motion": "push-in", "trans": {"type": "zoom-in", "dur": 0.5}, "lines": ["l1"]},
          {"id": "c2", "shot": "S06-01", "src": pics[1], "dur": 6, "motion": "pan-left", "trans": {"type": "slide-left", "dur": 0.5}, "lines": ["l2"]},
          {"id": "c3", "shot": "S06-02", "src": "", "dur": 6, "gen": {"maker": "ai-image", "image": "SHOT S06-02: a test"}, "trans": {"type": "cut"}},
          {"id": "c4", "shot": "S08-01", "src": pics[2], "dur": 6, "motion": "pull-out", "trans": {"type": "fade-black", "dur": 0.5}, "lines": ["l3"]},
          {"id": "c5", "shot": "S10-01", "src": pics[3], "dur": 6, "motion": "pan-up"}],
      "texts": [{"id": "t1", "clip": "c1", "offset": 0.3, "dur": 3, "text": "Test Title", "style": "title", "anim": "pop"}],
      "audio": [{"id": "l1", "kind": "voice", "speaker": "narrator", "text": "One golden evening, four friends were building."},
                {"id": "l2", "kind": "voice", "speaker": "beau", "text": "Big heart, brave start!"},
                {"id": "l3", "kind": "voice", "speaker": "wren", "text": "Pause and ponder, what a wonder."},
                {"id": "m1", "kind": "music", "cue": "lullaby", "clips": ["c1", "c5"], "vol": 0.3, "fadeIn": 1, "fadeOut": 1}],
      "captions": {"on": True, "style": "karaoke", "lines": []}}
ep = common.defaults(ep)
cwd = os.getcwd(); os.chdir(work)
try:
    ep, todo = produce.produce("test", ep)
finally:
    os.chdir(cwd)
ok("the shot with no picture waits for one (no money spent)", todo == ["S06-02"] and any("S06-02" in w for w in produce.WOULD), (todo, produce.WOULD))
ok("every voice line has a start inside the video", all("start" in a and a["start"] < common.total(ep) for a in ep["audio"] if a["kind"] == "voice"))
ok("captions rebuilt from the voices", len(ep["captions"]["lines"]) == 3)
ok("music follows its shots", abs(ep["audio"][-1]["dur"] - common.total(ep)) < 0.01 and ep["audio"][-1]["src"])

mp4, cover = render.render(copy.deepcopy(ep), work, "ep", jobs=2)
p = probe(mp4); v = [s for s in p["streams"] if s["codec_type"] == "video"][0]
ok("episode size and frame rate", (v["width"], v["height"], v["r_frame_rate"]) == (640, 360, "24/1"), v)
ok("episode length = the start math", abs(float(p["format"]["duration"]) - common.total(ep)) < 0.15, (p["format"]["duration"], common.total(ep)))
ok("episode has sound", any(s["codec_type"] == "audio" for s in p["streams"]))
ok("a cover was made", os.path.getsize(cover) > 1000)
st = common.starts(ep)
r, g, b = avg_rgb(mp4, st[1] + 0.2)                  # inside the zoom-in transition
ok("the zoom transition keeps true colours (no pink)", not (r > 150 and g < 90), (r, g, b))

short = make_short.make_short(ep)
ok("the Short is 9:16", short["size"]["w"] == 1080 and short["size"]["h"] == 1920)
ok("the Short never uses a 'Picture to come' shot", all(c.get("src") or c.get("type") == "color" for c in short["clips"]))
ok("the Short keeps its voices and captions", sum(1 for a in short["audio"] if a["kind"] == "voice") >= 2 and short["captions"]["lines"])
short["size"] = {"w": 360, "h": 640, "fps": 24}
mp4s, _ = render.render(short, work, "short", jobs=2)
p = probe(mp4s); v = [s for s in p["streams"] if s["codec_type"] == "video"][0]
ok("the Short renders tall", (v["width"], v["height"]) == (360, 640), v)

shutil.rmtree(work, ignore_errors=True)
shutil.rmtree(os.path.join(HERE, "out", "uploads", "test"), ignore_errors=True)
print("\n" + ("all clear" if not fails else f"{fails} FAILED"))
sys.exit(1 if fails else 0)
