#!/usr/bin/env python3
"""THE VIDEO STUDIO'S EDITING ROOM: a timeline (lst-app docs/STUDIO.md) -> a finished MP4 + cover JPG.

    python3 studio/render.py --file studio/sample-episode.json --out studio/out
    python3 studio/render.py --id 2026-11-05-episode --out studio/out        (reads Supabase)

How it is made (so a 10-minute, 60-shot episode renders on a GitHub runner):
  1. every clip becomes its own short segment, frame-exact: a picture moves with smooth sub-pixel camera
     motion (Pillow, eased), a video is trimmed and fitted, a missing picture is a navy "Picture to come"
     card; segments are made side by side on every core.
  2. the segments are joined in chunks of CHUNK clips with ffmpeg xfade (the transition names of STUDIO.md)
     or a plain cut;
  3. the chunks are joined the same way (so a transition across a chunk join is still exact), the words
     (titles, hooks, captions; an .ass file in the brand fonts) are burned in, and the sound is mixed:
     voices on top, music ducked under them, everything levelled to about -14 LUFS.
Clip times follow the contract: start(i+1) = start(i) + dur(i) - trans(i).dur, rounded to whole frames.
"""
import os, sys, json, math, argparse, tempfile, subprocess, hashlib
from concurrent.futures import ProcessPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (defaults, starts, total, fetch, run, duration_of, log, XFADE, FONTS, NAVY, GOLD, HERE,
                    load_project)
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

SFONTS = os.path.join(HERE, "fonts")   # static brand faces for the burned-in words (libass cannot pick a weight from a variable font)
CHUNK = int(os.environ.get("STUDIO_CHUNK", "10"))
SEG_CRF = os.environ.get("STUDIO_SEG_CRF", "14")


def hex_rgb(h, default=(27, 45, 95)):
    try:
        h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    except Exception:
        return default


def font(size, face="Fredoka.ttf", weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, face), size)
    if weight:
        try: f.set_variation_by_axes([weight])
        except Exception: pass
    return f


# ------------------------------------------------------------------ frame-exact plan
def frame_plan(tl):
    """For each clip: (first frame, frame count, overlap frames into the next clip)."""
    fps = tl["size"]["fps"]; st = starts(tl); out = []
    for i, c in enumerate(tl["clips"]):
        f0 = round(st[i] * fps); f1 = round((st[i] + float(c["dur"])) * fps)
        out.append([f0, max(2, f1 - f0), 0])
    for i in range(len(out) - 1):
        out[i][2] = max(0, out[i][0] + out[i][1] - out[i + 1][0])
        if tl["clips"][i]["trans"]["type"] == "cut":
            out[i][2] = 0
    return out


# ------------------------------------------------------------------ one clip -> one segment
def placeholder(c, W, H):
    im = Image.new("RGB", (W, H), hex_rgb(NAVY))
    g = Image.linear_gradient("L").resize((W, H)); top = Image.new("RGB", (W, H), (38, 64, 127))
    im = Image.composite(im, top, g)
    d = ImageDraw.Draw(im); s = min(W, H)
    d.ellipse([W / 2 - s * .09, H * .30 - s * .09, W / 2 + s * .09, H * .30 + s * .09], outline=hex_rgb(GOLD), width=max(4, s // 120))
    R, r = s * .055, s * .022
    pts = [(W / 2 + (R if k % 2 == 0 else r) * math.sin(k * math.pi / 5), H * .30 - (R if k % 2 == 0 else r) * math.cos(k * math.pi / 5)) for k in range(10)]
    d.polygon(pts, fill=hex_rgb(GOLD))
    d.text((W / 2, H * .46), "Picture to come", font=font(int(s * .085), weight=700), fill=hex_rgb(GOLD), anchor="mm")
    sub = (c.get("shot") or c.get("id") or "")
    d.text((W / 2, H * .55), sub, font=font(int(s * .045), "Nunito.ttf", 800), fill=(220, 228, 245), anchor="mm")
    p = (c.get("gen") or {}).get("image", "")
    if "SHOT" in p: p = p[p.find("SHOT"):]
    p = p[:220] + ("…" if len(p) > 220 else "")
    f = font(int(s * .03), "Nunito.ttf", 600); words = p.split(); lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) > W * .8 and cur: lines.append(cur); cur = w
        else: cur = t
    if cur: lines.append(cur)
    for k, ln in enumerate(lines[:5]):
        d.text((W / 2, H * .64 + k * s * .045), ln, font=f, fill=(170, 182, 214), anchor="mm")
    return im


def plate_for(img, W, H, fit, M, bg):
    PW, PH = int(math.ceil(W * M)), int(math.ceil(H * M))
    img = ImageOps.exif_transpose(img).convert("RGB")
    cover = ImageOps.fit(img, (PW, PH), Image.LANCZOS)
    if fit != "contain":
        return cover
    back = cover.filter(ImageFilter.GaussianBlur(max(8, PW // 40)))
    back = Image.blend(back, Image.new("RGB", (PW, PH), hex_rgb(bg)), 0.45)
    inner = ImageOps.contain(img, (int(W * .96), int(H * .96)), Image.LANCZOS)
    back.paste(inner, ((PW - inner.width) // 2, (PH - inner.height) // 2))
    return back


def ease(p):
    return p * p * (3 - 2 * p)


def motion_at(motion, p, PW, PH, W, H):
    """(zoom, centre x, centre y) on the plate at progress p."""
    e = ease(p); cx, cy = PW / 2, PH / 2
    if motion == "push-in": return 1.0 + 0.13 * e, cx, cy
    if motion == "pull-out": return 1.13 - 0.13 * e, cx, cy
    if motion in ("pan-left", "pan-right", "pan-up", "pan-down"):
        z = 1.03
        dx = (PW - W / z) / 2 * 0.92; dy = (PH - H / z) / 2 * 0.92
        if motion == "pan-left": return z, cx + dx - 2 * dx * e, cy
        if motion == "pan-right": return z, cx - dx + 2 * dx * e, cy
        if motion == "pan-up": return z, cx, cy + dy - 2 * dy * e
        return z, cx, cy - dy + 2 * dy * e
    return 1.0, cx, cy


def encoder(W, H, fps, out, crf=SEG_CRF):
    return subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps),
                             "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", crf, "-pix_fmt", "yuv420p", out],
                            stdin=subprocess.PIPE)


def render_still(img_or_none, c, W, H, fps, n, out, bg, zin=0, zout=0):
    img = img_or_none if img_or_none is not None else placeholder(c, W, H)
    motion = c.get("motion") or "none"
    M = 1.0 if (motion == "none" and not zin) else 1.18
    plate = plate_for(img, W, H, c.get("fit", "cover"), M, bg)
    PW, PH = plate.size
    enc = encoder(W, H, fps, out)
    for k in range(n):
        p = k / max(1, n - 1)
        z, cx, cy = motion_at(motion, p, PW, PH, W, H)
        if zout and k >= n - zout:                      # zoom-in transition: rush in as it leaves
            q = (k - (n - zout) + 1) / zout; z *= 1 + 0.9 * q * q
        if zin and k < zin:                             # ... and arrive a little big, settling
            q = 1 - k / zin; z *= 1 + 0.35 * q * q
        a = 1 / z
        fr = plate.transform((W, H), Image.AFFINE, (a, 0, cx - W * a / 2, 0, a, cy - H * a / 2), resample=Image.BILINEAR)
        enc.stdin.write(fr.tobytes())
    enc.stdin.close()
    if enc.wait() != 0: raise RuntimeError("encoding a picture clip failed")


def render_video(path, c, W, H, fps, n, out, bg):
    dur = n / fps
    if c.get("fit") == "contain":
        vf = (f"split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:3,eq=brightness=-0.15[bg];"
              f"[b]scale={int(W*.96)}:{int(H*.96)}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2")
    else:
        vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"
    vf += f",fps={fps},setsar=1,tpad=stop_mode=clone:stop_duration={dur:.3f},format=yuv420p"
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{float(c.get('in', 0)):.3f}", "-i", path, "-t", f"{dur + 0.5:.3f}",
         "-filter_complex", vf, "-frames:v", str(n), "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", SEG_CRF, out])


def render_clip(args):
    c, W, H, fps, n, out, bg, zin, zout = args
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return out
    typ = c.get("type", "image")
    if typ == "color":
        run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"color=c=0x{(c.get('color') or bg).lstrip('#')}:s={W}x{H}:r={fps}",
             "-frames:v", str(n), "-c:v", "libx264", "-preset", "veryfast", "-crf", SEG_CRF, "-pix_fmt", "yuv420p", out])
        return out
    path = None
    try: path = fetch(c.get("src") or "")
    except Exception as e: log("could not fetch", c.get("src"), e)
    if typ == "video" and path:
        render_video(path, c, W, H, fps, n, out, bg); return out
    img = None
    if path:
        try: img = Image.open(path)
        except Exception as e: log("not a picture:", path, e)
    render_still(img, c, W, H, fps, n, out, bg, zin, zout)
    return out


# ------------------------------------------------------------------ joining
def join(files, counts, overlaps, trans, fps, out, extra_vf="", audio=None, crf="18", preset="veryfast", total_frames=None):
    """files[i] holds counts[i] frames; overlaps[i] frames of it blend into files[i+1] with trans[i]."""
    cmd = ["ffmpeg", "-y", "-v", "error"]
    for f in files: cmd += ["-i", f]
    if audio: cmd += ["-i", audio]
    parts = [f"[{i}:v]fps={fps},settb=AVTB,format=yuv420p[v{i}]" for i in range(len(files))]
    cur, acc = "v0", counts[0]
    for i in range(1, len(files)):
        ov = overlaps[i - 1]; nxt = f"j{i}"
        if ov <= 0:
            parts.append(f"[{cur}][v{i}]concat=n=2:v=1:a=0,settb=AVTB[{nxt}]")
        else:
            off = (acc - ov) / fps
            xf = XFADE.get(trans[i - 1], "fade")
            parts.append(f"[{cur}][v{i}]xfade=transition={xf}:duration={ov / fps:.4f}:offset={off:.4f},settb=AVTB[{nxt}]")
        acc = acc - max(0, ov) + counts[i]; cur = nxt
    tail = f"[{cur}]" + (extra_vf + "," if extra_vf else "") + "format=yuv420p[vout]"
    parts.append(tail)
    cmd += ["-filter_complex", ";".join(parts), "-map", "[vout]"]
    if audio: cmd += ["-map", f"{len(files)}:a", "-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    if total_frames: cmd += ["-frames:v", str(total_frames)]
    cmd += ["-c:v", "libx264", "-preset", preset, "-crf", crf, "-pix_fmt", "yuv420p", "-r", str(fps), "-movflags", "+faststart"]
    if audio: cmd += ["-shortest"]
    cmd += [out]
    run(cmd)
    return acc


# ------------------------------------------------------------------ words on screen (.ass)
def ass_color(h, alpha=0):
    r, g, b = hex_rgb(h); return f"&H{alpha:02X}{b:02X}{g:02X}{r:02X}"


def ass_time(t):
    t = max(0.0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def esc(s):
    return (s or "").replace("\\", "/").replace("{", "(").replace("}", ")").replace("\n", "\\N")


def caption_chunks(line, max_words):
    """A spoken line split into short screen pages, each with its words' times."""
    text = line.get("text", "").strip()
    st, en = float(line.get("start", 0)), float(line.get("end", line.get("start", 0) + 2))
    words = line.get("words") or []
    toks = text.split()
    if not words or len(words) != len(toks):
        tot = sum(len(w) + 1 for w in toks) or 1; t = st; words = []
        for w in toks:
            words.append({"w": w, "t": t}); t += (en - st) * (len(w) + 1) / tot
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= max_words or w["w"][-1:] in ".!?;:" and len(cur) >= 2:
            chunks.append(cur); cur = []
    if cur:
        if chunks and len(cur) <= 2 and len(chunks[-1]) + len(cur) <= max_words + 2: chunks[-1] += cur
        else: chunks.append(cur)
    out = []
    for k, ch in enumerate(chunks):
        c_end = chunks[k + 1][0]["t"] if k + 1 < len(chunks) else en
        out.append((ch, ch[0]["t"], max(c_end, ch[0]["t"] + 0.3)))
    return out


def build_ass(tl, path):
    W, H = tl["size"]["w"], tl["size"]["h"]; tall = H > W
    cap = tl["captions"]; csize = int(cap.get("size") or (66 if tall else 58)) * H // (1920 if tall else 1080)
    navy, gold, teal, white = ass_color(NAVY), ass_color(GOLD), ass_color("#5BD3DC"), ass_color("#FFFFFF")
    safe_top = int(H * (0.12 if tall else 0.07)); safe_bot = int(H * (0.21 if tall else 0.075))
    def style(name, face, size, prim, outline, border=1, back=None, bold=-1, al=2, mv=0, ol=None, sh=None):
        ol = ol if ol is not None else max(2, size // 11); sh = sh if sh is not None else max(1, size // 26)
        return (f"Style: {name},{face},{size},{prim},{white},{outline},{back or ass_color('#0B1226', 0x60)},0,0,0,0,100,100,0,0,"
                f"{border},{ol},{sh},{al},{int(W*.06)},{int(W*.06)},{mv},1")
    styles = [
        style("Cap", "LST Fredoka", csize, white, navy, mv=safe_bot, ol=max(4, csize // 8), sh=max(2, csize // 18)),
        style("CapBox", "LST Fredoka", csize, white, navy, border=3, back=ass_color("#1B2D5F", 0x30), mv=safe_bot, ol=max(6, csize // 5), sh=0),
        style("hook", "LST Fredoka", int(H * (0.062 if tall else 0.085)), ass_color(GOLD), navy, ol=int(H * .006) + 3),
        style("title", "LST Fredoka", int(H * (0.07 if tall else 0.095)), white, navy, ol=int(H * .006) + 3),
        style("end", "LST Fredoka", int(H * (0.058 if tall else 0.08)), ass_color(GOLD), navy, ol=int(H * .005) + 3),
        style("lower-third", "LST Nunito", int(H * (0.032 if tall else 0.042)), white, navy, border=3, back=ass_color(NAVY, 0x10), al=1, ol=int(H * .012), sh=0),
        style("label", "LST Nunito", int(H * (0.026 if tall else 0.032)), ass_color("#0B1226"), teal, border=3, back=teal, al=7, ol=int(H * .008), sh=0),
    ]
    ev = []
    def add(layer, a, b, st, txt):
        if b - a > 0.02: ev.append(f"Dialogue: {layer},{ass_time(a)},{ass_time(b)},{st},,0,0,0,,{txt}")
    # captions
    if cap.get("on", True):
        pos = cap.get("pos", "bottom"); mw = 5 if tall else 8
        anchor = {"bottom": (2, W / 2, H - safe_bot), "middle": (5, W / 2, H * .5), "top": (8, W / 2, safe_top + H * .1)}[pos if pos in ("top", "middle") else "bottom"]
        an, x, y = anchor
        sty = "CapBox" if cap.get("style") == "block" else "Cap"
        for ln in cap.get("lines", []):
            for words, a, b in caption_chunks(ln, mw):
                base = f"{{\\an{an}\\pos({x:.0f},{y:.0f})}}"
                if cap.get("style", "karaoke") == "karaoke":
                    for k, w in enumerate(words):
                        wa = w["t"]; wb = words[k + 1]["t"] if k + 1 < len(words) else b
                        if k == 0: wa = a
                        txt = " ".join(("{\\c" + ass_color(GOLD) + "\\fscx108\\fscy108}" + esc(o["w"]) + "{\\c" + white + "\\fscx100\\fscy100}") if j == k else esc(o["w"]) for j, o in enumerate(words))
                        add(1, wa, wb, sty, base + txt)
                elif cap.get("style") == "pop":
                    add(1, a, b, sty, base + "{\\fscx70\\fscy70\\t(0,120,\\fscx104\\fscy104)\\t(120,200,\\fscx100\\fscy100)}" + esc(" ".join(o["w"] for o in words)))
                else:
                    add(1, a, b, sty, base + esc(" ".join(o["w"] for o in words)))
    # titles, hooks, lower thirds, labels, end words
    for t in tl.get("texts", []):
        a = float(t.get("start", 0)); b = a + float(t.get("dur", 3)); st = t.get("style", "title")
        if st not in ("hook", "title", "end", "lower-third", "label"): st = "title"
        pos = t.get("pos", "middle")
        if st == "lower-third": an, x, y = 1, W * .06, H - safe_bot - H * .12
        elif st == "label": an, x, y = 7, W * .06, safe_top
        else:
            an = {"top": 8, "middle": 5, "bottom": 2}.get(pos, 5)
            y = {"top": safe_top, "middle": H * .5, "bottom": H - safe_bot - H * .08}.get(pos, H * .5); x = W / 2
        anim = t.get("anim", "fade"); txt = esc(t.get("text", ""))
        if anim == "pop":
            add(2, a, b, st, f"{{\\an{an}\\pos({x:.0f},{y:.0f})\\fad(0,250)\\fscx30\\fscy30\\t(0,170,\\fscx112\\fscy112)\\t(170,300,\\fscx100\\fscy100)}}" + txt)
        elif anim == "slide-up":
            add(2, a, b, st, f"{{\\an{an}\\move({x:.0f},{y + H*.05:.0f},{x:.0f},{y:.0f},0,380)\\fad(200,300)}}" + txt)
        elif anim == "type":
            raw = t.get("text", ""); steps = min(len(raw), 24) or 1; span = min(1.2, (b - a) * .5)
            for k in range(1, steps + 1):
                cut = round(len(raw) * k / steps)
                s0 = a + span * (k - 1) / steps; s1 = a + span * k / steps if k < steps else b
                add(2, s0, s1, st, f"{{\\an{an}\\pos({x:.0f},{y:.0f})}}" + esc(raw[:cut]) + "{\\alpha&HFF&}" + esc(raw[cut:]))
        elif anim == "none":
            add(2, a, b, st, f"{{\\an{an}\\pos({x:.0f},{y:.0f})}}" + txt)
        else:
            add(2, a, b, st, f"{{\\an{an}\\pos({x:.0f},{y:.0f})\\fad(350,350)}}" + txt)
    head = (f"[Script Info]\nScriptType: v4.00+\nPlayResX: {W}\nPlayResY: {H}\nWrapStyle: 0\nScaledBorderAndShadow: yes\n\n"
            "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
            "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
            + "\n".join(styles) + "\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n" + "\n".join(ev) + "\n")
    open(path, "w", encoding="utf-8").write(head)
    return len(ev)


# ------------------------------------------------------------------ sound
def mix_audio(tl, out, T):
    items = []
    st = starts(tl)
    for i, c in enumerate(tl["clips"]):
        if c.get("type") == "video" and float(c.get("vol") or 0) > 0 and c.get("src"):
            items.append({"kind": "sfx", "src": c["src"], "start": st[i], "in": c.get("in", 0), "dur": c["dur"], "vol": c["vol"], "fadeIn": .15, "fadeOut": .3})
    items += [a for a in tl.get("audio", []) if a.get("src")]
    cmd = ["ffmpeg", "-y", "-v", "error"]; parts = []; groups = {"voice": [], "music": [], "sfx": []}; duck = False; n = 0
    for a in items:
        try: p = fetch(a["src"])
        except Exception as e: p = None; log("could not fetch sound", a.get("src"), e)
        if not p: log("sound missing, skipped:", a.get("id"), a.get("src")); continue
        start = float(a.get("start", 0) or 0)
        if start >= T: continue
        sdur = max(0.05, duration_of(p) - float(a.get("in", 0)))
        dur = min(float(a.get("dur") or sdur), sdur, T - start)
        fi, fo = float(a.get("fadeIn") or 0), float(a.get("fadeOut") or 0)
        chain = (f"[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=start={float(a.get('in',0)):.3f}:duration={dur:.3f},"
                 f"asetpts=PTS-STARTPTS,volume={float(a.get('vol', 1)):.3f}")
        if fi > 0: chain += f",afade=t=in:d={min(fi, dur/2):.3f}"
        if fo > 0: chain += f",afade=t=out:st={max(0, dur - fo):.3f}:d={min(fo, dur):.3f}"
        chain += f",adelay=delays={int(start*1000)}:all=1[s{n}]"
        parts.append(chain); cmd += ["-i", p]
        k = a.get("kind", "voice"); k = k if k in groups else "sfx"
        groups[k].append(f"[s{n}]")
        if k == "music" and a.get("duck", True): duck = True
        n += 1
    if n == 0:
        run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{T:.3f}", out]); return out
    labels = {}
    for k, g in groups.items():
        if not g: continue
        parts.append("".join(g) + (f"amix=inputs={len(g)}:normalize=0:dropout_transition=0[{k}]" if len(g) > 1 else f"anull[{k}]"))
        labels[k] = f"[{k}]"
    if "voice" in labels and "music" in labels and duck:
        parts.append("[voice]asplit=2[vox][voxsc]")
        parts.append("[music][voxsc]sidechaincompress=threshold=0.02:ratio=9:attack=25:release=450:makeup=1[musd]")
        labels["voice"] = "[vox]"; labels["music"] = "[musd]"
    fin = list(labels.values())
    parts.append("".join(fin) + (f"amix=inputs={len(fin)}:normalize=0:dropout_transition=0," if len(fin) > 1 else "anull,")
                 + f"apad=whole_dur={T:.3f},atrim=0:{T:.3f},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]")
    cmd += ["-filter_complex", ";".join(parts), "-map", "[aout]", "-ar", "48000", "-ac", "2", out]
    run(cmd)
    return out


# ------------------------------------------------------------------ the whole thing
def render(tl, out_dir, name="video", jobs=None):
    tl = defaults(tl)
    W, H, fps = int(tl["size"]["w"]), int(tl["size"]["h"]), int(tl["size"]["fps"])
    os.makedirs(out_dir, exist_ok=True)
    work = os.path.join(out_dir, ".work-" + name); os.makedirs(work, exist_ok=True)
    plan = frame_plan(tl); T = total(tl)
    if not tl["clips"]:
        raise SystemExit("the timeline has no clips")
    log(f"{len(tl['clips'])} clips, {T:.1f} s, {W}x{H}@{fps}")
    # 1. segments (a segment is re-used when its clip and size have not changed)
    jobsl = []
    for i, c in enumerate(tl["clips"]):
        zout = plan[i][2] if c["trans"]["type"] == "zoom-in" else 0
        zin = plan[i - 1][2] if i and tl["clips"][i - 1]["trans"]["type"] == "zoom-in" else 0
        key = hashlib.sha1(json.dumps([c.get(k) for k in ("type", "src", "color", "in", "fit", "motion", "shot")] + [plan[i][1], W, H, fps, tl["bg"], zin, zout], sort_keys=True).encode()).hexdigest()[:16]
        jobsl.append((c, W, H, fps, plan[i][1], os.path.join(work, f"seg-{i:03d}-{key}.mp4"), tl["bg"], zin, zout))
    with ProcessPoolExecutor(max_workers=jobs or os.cpu_count() or 2) as ex:
        segs = list(ex.map(render_clip, jobsl))
    log("segments made")
    counts = [p[1] for p in plan]; overlaps = [p[2] for p in plan]
    trans = [c["trans"]["type"] for c in tl["clips"]]
    # 2. chunks
    chunks, ccounts, covl, ctrans = [], [], [], []
    for a in range(0, len(segs), CHUNK):
        b = min(len(segs), a + CHUNK)
        f = os.path.join(work, f"chunk-{a//CHUNK:03d}.mp4")
        frames = join(segs[a:b], counts[a:b], overlaps[a:b - 1], trans[a:b - 1], fps, f, crf=SEG_CRF)
        chunks.append(f); ccounts.append(frames); covl.append(overlaps[b - 1] if b < len(segs) else 0); ctrans.append(trans[b - 1])
    log(f"{len(chunks)} chunk(s) joined")
    # 3. words + sound + the final join
    ass = os.path.join(work, "words.ass"); nev = build_ass(tl, ass)
    wav = os.path.join(work, "sound.wav"); mix_audio(tl, wav, T)
    total_frames = round(T * fps)
    vf = f"subtitles=filename='{ass}':fontsdir='{SFONTS}'" if nev else ""
    mp4 = os.path.join(out_dir, name + ".mp4")
    join(chunks, ccounts, covl[:-1], ctrans[:-1], fps, mp4, extra_vf=vf, audio=wav, crf="18",
         preset="medium" if T <= 240 else "faster", total_frames=total_frames)
    # the cover: the hook's moment, else one second in
    hook = next((t for t in tl.get("texts", []) if t.get("style") in ("hook", "title")), None)
    at = min(T - 0.1, (float(hook["start"]) + 0.7) if hook else min(1.0, T / 2))
    cover = os.path.join(out_dir, name + "-cover.jpg")
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{at:.2f}", "-i", mp4, "-frames:v", "1", "-q:v", "2", cover])
    log("made", mp4, cover)
    return mp4, cover


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id"); ap.add_argument("--file"); ap.add_argument("--out", default=os.path.join(HERE, "out"))
    ap.add_argument("--name"); ap.add_argument("--jobs", type=int)
    a = ap.parse_args()
    if not (a.id or a.file): ap.error("--id or --file")
    row, tl = load_project(a.id, a.file)
    mp4, cover = render(tl, a.out, a.name or str(row.get("id") or "video"), a.jobs)
    print(json.dumps({"mp4": mp4, "cover": cover, "seconds": total(tl)}))


if __name__ == "__main__":
    main()
