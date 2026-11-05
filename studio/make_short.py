#!/usr/bin/env python3
"""A 9:16 Short (45-60 s) cut from an episode: the hook, then the key shots with their own voice lines,
reframed for a phone (cover-crop with a gentle pan so the wide picture is seen), new captions, a music
bed under the voices, and an end card that points to the whole episode.

    python3 studio/make_short.py --file studio/sample-episode.json --out studio/out/short.json
    python3 studio/make_short.py --id 2026-11-05-episode --save      (a new studio_projects row <id>-short)

The episode is the main video (Levi, 4 Nov 2026); a Short is always a cut-down of one.
"""
import os, sys, json, copy, argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import defaults, starts, total, load_project, http, sb_headers, URL, log
from produce import rebuild_captions, plain

MIN_S, MAX_S = 45.0, 60.0
SKIP_SCENES = ("S01", "S03", "S04", "S05", "S07")     # theme, chest, chant, fly-through, return: the same every episode


def score(c, voices, catch):
    shot = (c.get("shot") or "").upper(); s = 0.0
    if shot.startswith(SKIP_SCENES) or "END" in shot: return -1
    if shot.startswith("S06"): s += 3
    if shot.startswith(("S02", "S08")): s += 2
    if shot.startswith("S09"): s += 1
    lines = [voices[l] for l in (c.get("lines") or []) if l in voices]
    if lines: s += 1
    if any(any(k.lower() in (l.get("text") or "").lower() for k in catch) for l in lines): s += 2
    if c.get("status") in ("todo", "failed") or not c.get("src"): return -1   # never a "Picture to come" card in a Short
    return s


def make_short(ep, title=None):
    ep = defaults(copy.deepcopy(ep))
    voices = {a["id"]: a for a in ep["audio"] if a.get("kind") == "voice"}
    catch = ["Big heart, brave start", "Look and see", "Warm hugs, warm hearts", "Pause and ponder"]
    st = starts(ep)
    cands = [(score(c, voices, catch), i, c) for i, c in enumerate(ep["clips"])]
    cands = [x for x in cands if x[0] >= 0]
    # the best shots, kept in story order, until the Short is full
    pick, secs = [], 0.0
    for sc, i, c in sorted(cands, key=lambda x: (-x[0], x[1])):
        d = min(float(c["dur"]), 10.0)
        lines = [voices[l] for l in (c.get("lines") or []) if l in voices]
        if lines:   # a shot is kept long enough for its lines, no longer
            need = max(float(l["start"]) + float(l.get("dur") or 2) for l in lines) - st[i] + 0.4
            d = max(min(d, need), 3.0) if need <= d else min(float(c["dur"]), need)
        if secs + d > MAX_S - 4: continue
        pick.append((i, d)); secs += d
        if secs >= MIN_S - 4: break
    pick.sort()
    W, H = 1080, 1920
    clips, audio = [], []
    t = 0.0
    trans_cycle = ["crossfade", "slide-up", "crossfade", "zoom-in", "wipe-left"]
    for k, (i, d) in enumerate(pick):
        c = copy.deepcopy(ep["clips"][i]); c["id"] = f"c{k+1}"; c["dur"] = round(d, 2); c["fit"] = "cover"
        if c.get("type") == "image" and c.get("motion") in ("none", "push-in", "pull-out"):
            c["motion"] = "pan-right" if k % 2 == 0 else "pan-left"
        c["trans"] = {"type": trans_cycle[k % len(trans_cycle)], "dur": 0.35}
        c["from"] = ep["clips"][i]["id"]
        newl = []
        for l in (ep["clips"][i].get("lines") or []):
            if l in voices and "start" in voices[l]:
                a = copy.deepcopy(voices[l]); a["start"] = round(t + float(voices[l]["start"]) - st[i], 3)
                if a["start"] + float(a.get("dur") or 2) <= t + d + 0.05:
                    audio.append(a); newl.append(l)
        c["lines"] = newl
        clips.append(c); t += d - 0.35
    # the end card: points to the whole episode
    clips.append({"id": f"c{len(clips)+1}", "shot": "SHORT-END", "type": "color", "color": "#1B2D5F", "dur": 4.5,
                  "motion": "none", "trans": {"type": "cut", "dur": 0}, "status": "ready", "gen": {}})
    tl = {"v": 1, "title": title or ("Short: " + (ep.get("title") or "")), "kind": "short", "size": {"w": W, "h": H, "fps": ep["size"].get("fps", 30)},
          "night": ep.get("night"), "audience": ep.get("audience"), "bg": ep.get("bg", "#1B2D5F"), "from_episode": ep.get("title"),
          "clips": clips, "audio": audio, "texts": [], "captions": dict(copy.deepcopy(ep.get("captions") or {}), size=66, pos="bottom", lines=[])}
    tl = defaults(tl)
    T = total(tl)
    hook = (ep.get("post") or {}).get("hook") or ep.get("title") or ""
    tl["texts"] = [
        {"id": "t1", "start": 0.15, "dur": 3.2, "text": hook, "style": "hook", "pos": "top", "anim": "pop"},
        {"id": "t2", "start": round(T - 4.3, 2), "dur": 4.1, "text": "Watch the whole episode", "style": "title", "pos": "middle", "anim": "pop"},
        {"id": "t3", "start": round(T - 3.6, 2), "dur": 3.4, "text": "Little Scripture Travelers", "style": "end", "pos": "bottom", "anim": "fade"},
    ]
    bed = next((a for a in ep["audio"] if a.get("kind") == "music" and a.get("cue") in ("lantern-song", "theme") and a.get("src")), None)
    music = {"id": "m-bed", "kind": "music", "cue": (bed or {}).get("cue", "lantern-song"), "src": (bed or {}).get("src", ""),
             "start": 0, "dur": T, "vol": 0.3, "fadeIn": 0.4, "fadeOut": 2.0, "duck": True}
    tl["audio"].append(music)
    rebuild_captions(tl)
    p = copy.deepcopy(ep.get("post") or {})
    p["platforms"] = ["instagram", "facebook", "tiktok", "youtube", "pinterest"]; p.setdefault("when", "10:00")
    tl["post"] = p
    log(f"Short: {len(clips)} shots, {T:.1f} s")
    return tl


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id"); ap.add_argument("--file"); ap.add_argument("--out"); ap.add_argument("--save", action="store_true")
    a = ap.parse_args()
    row, ep = load_project(a.id, a.file)
    tl = make_short(ep)
    sid = f"{row['id']}-short"
    if a.out:
        json.dump({"id": sid, "title": tl["title"], "kind": "short", "night": tl.get("night"), "status": "making", "timeline": tl},
                  open(a.out, "w"), indent=1, ensure_ascii=False)
    if a.save:
        s, b = http("POST", f"{URL}/rest/v1/studio_projects", {"id": sid, "title": tl["title"], "kind": "short", "night": tl.get("night"),
                    "status": "making", "timeline": tl}, sb_headers({"Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}))
        log("saved" if s in (200, 201, 204) else f"could not save: {s} {b[:200]!r}")
    print(json.dumps({"id": sid, "seconds": total(tl), "shots": len(tl["clips"])}))


if __name__ == "__main__":
    main()
