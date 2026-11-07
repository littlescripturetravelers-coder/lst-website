#!/usr/bin/env python3
"""THE VIDEO STUDIO'S CREW: fills a project's gaps so render.py can make the video.

    python3 studio/produce.py --file studio/sample-episode.json            (a local run; writes the file back)
    python3 studio/produce.py --id 2026-11-05-episode                      (reads and writes Supabase)

What it fills (lst-app docs/STUDIO.md is the contract):
  pictures  a clip with no src (or status todo), by its gen.maker:
              book      the night's own book pictures, in order, none twice              (free)
              ai-image  OpenAI gpt-image-1 made FROM the cast's reference pictures + the STYLE LOCK,
                        then checked by Claude against the references (9+ or made again)  (paid)
              heygen    the shot's picture talking: HeyGen Avatar IV with the line's own audio (paid)
              still     nothing to make: the picture moves with the camera
  voices    every voice line with no src: ElevenLabs in the character's own voice with word times (paid),
            else the free Kokoro voice the cast gives that character
  layout    voice lines placed in their shots, each shot long enough for its lines (an episode keeps the
            Episode Engine's 6 / 10 / 15 second shots), texts and music anchored to shots follow
  captions  rebuilt from the voice lines (word times when the voice gave them)
  music     a music item with a cue and no src: the lullabies we own, the night's song, studio/music/<cue>.mp3,
            else ElevenLabs music (paid), else left for Levi with a note
THE SPENDING RULE (CLAUDE.md): nothing paid is made unless STUDIO_SPEND=yes. Without it this prints what it
WOULD have made and leaves the shot "todo" with a note for Levi.
"""
import os, re, sys, io, json, glob, base64, argparse, subprocess, tempfile, time, uuid, hashlib, math

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (defaults, starts, total, http, fetch, upload, log, duration_of, load_project, save_project,
                    cast as load_cast, who, refs_for, HERE, ROOT, URL, KEY)

SPEND = os.environ.get("STUDIO_SPEND", "").strip().lower() == "yes"
OPENAI = os.environ.get("OPENAI_API_KEY", "").strip()
ELEVEN = os.environ.get("ELEVENLABS_API_KEY", "").strip()
HEYGEN = os.environ.get("HEYGEN_API_KEY", "").strip()
ANTHROPIC = os.environ.get("ANTHROPIC_API_KEY", "").strip()
CHECK_MODEL = os.environ.get("STUDIO_CHECK_MODEL", "").strip() or "claude-sonnet-5-5"
ELEVEN_MODEL = os.environ.get("STUDIO_ELEVEN_MODEL", "").strip() or "eleven_multilingual_v2"
IMAGE_QUALITY = os.environ.get("STUDIO_IMAGE_QUALITY", "").strip() or "high"
TODO_NOTE = "Picture to come — paste one from ChatGPT or switch on paid making"
SHOT_LENGTHS = (6, 10, 15)          # the Episode Engine's clip lengths
WOULD = []                          # what a paid run would have made (printed at the end)


# ------------------------------------------------------------------ the night
def night_info(night_date):
    if not night_date: return None
    for f in glob.glob(os.path.join(ROOT, "lantern", "*", "night.json")):
        try: n = json.load(open(f))
        except Exception: continue
        if n.get("publish_date") == night_date:
            n["_dir"] = os.path.dirname(f); return n
    return None


def night_pictures(night_date):
    """The book illustrations drawn for this night, in page order (lantern/marketing_media.py's rule)."""
    n = night_info(night_date)
    if not n: return []
    m = re.search(r"/([a-z]{3}-\d{2})-", n.get("book_page") or "")
    if m:
        pics = sorted(glob.glob(os.path.join(ROOT, "images", "book", m.group(1) + "-*.jpg")),
                      key=lambda p: int(re.search(r"-(\d+)\.jpg$", p).group(1)) if re.search(r"-(\d+)\.jpg$", p) else 0)
        if pics: return pics
    pics = sorted(glob.glob(os.path.join(n["_dir"], "*.jpg")) + glob.glob(os.path.join(n["_dir"], "*.png")))
    return [p for p in pics if "lullaby" not in os.path.basename(p)]


def rel(p):
    """A repo file as the public website URL (so the app's editor can show it), a made file as given."""
    if p and p.startswith(ROOT + os.sep) and not p.startswith(HERE + os.sep):
        return "https://littlescripturetravelers.com/" + os.path.relpath(p, ROOT).replace(os.sep, "/")
    return p


# ------------------------------------------------------------------ voices
_kokoro = None
def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        md = os.environ.get("KOKORO_DIR", os.path.join(HERE, ".models"))
        _kokoro = Kokoro(os.path.join(md, "kokoro-v1.0.onnx"), os.path.join(md, "voices-v1.0.bin"))
    return _kokoro


def plain(text):
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", text or "")).strip()


def spread_words(text, start, dur):
    toks = plain(text).split(); tot = sum(len(w) + 1 for w in toks) or 1; t = start; out = []
    for w in toks:
        out.append({"w": w, "t": round(t, 3)}); t += dur * (len(w) + 1) / tot
    return out


def voice_eleven(line, ch):
    vid = ((ch or {}).get("voice") or {}).get("elevenlabs", "")
    text = line["text"] if "v3" in ELEVEN_MODEL else plain(line["text"])
    if line.get("delivery") and "v3" in ELEVEN_MODEL: text = line["delivery"] + " " + text
    s, b = http("POST", f"https://api.elevenlabs.io/v1/text-to-speech/{vid}/with-timestamps?output_format=mp3_44100_128",
                {"text": text, "model_id": ELEVEN_MODEL}, {"xi-api-key": ELEVEN, "Content-Type": "application/json"})
    if s != 200: raise RuntimeError(f"ElevenLabs {s}: {b[:200]!r}")
    j = json.loads(b); mp3 = base64.b64decode(j["audio_base64"])
    al = j.get("normalized_alignment") or j.get("alignment") or {}
    chars, tst = al.get("characters") or [], al.get("character_start_times_seconds") or []
    words, cur, t0 = [], "", None
    for c, t in zip(chars, tst):
        if c.isspace():
            if cur: words.append({"w": cur, "t": round(t0, 3)}); cur = ""
        else:
            if not cur: t0 = t
            cur += c
    if cur: words.append({"w": cur, "t": round(t0, 3)})
    return mp3, "audio/mpeg", ".mp3", [w for w in words if not re.fullmatch(r"\[.*\]", w["w"])]


def voice_kokoro(line, ch):
    import numpy as np, soundfile as sf
    v = ((ch or {}).get("voice") or {}); name = v.get("kokoro") or "af_heart"; speed = float(v.get("speed") or 0.95)
    s, sr = kokoro().create(plain(line["text"]), voice=name, speed=speed, lang="en-us")
    s = s.astype(np.float32); s = s / max(1e-6, float(np.abs(s).max())) * 0.89
    buf = io.BytesIO(); sf.write(buf, s, sr, format="WAV"); return buf.getvalue(), "audio/wav", ".wav", None


def voice_silent(line):
    """No voice could be made (no model here): a silent stand-in as long as the line would take to say."""
    secs = max(1.2, len(plain(line["text"]).split()) / 2.5)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f: p = f.name
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", f"{secs:.2f}", p], check=True)
    b = open(p, "rb").read(); os.remove(p); return b, "audio/wav", ".wav", None


def make_voices(pid, tl, cast_data):
    made = 0
    for a in tl["audio"]:
        if a.get("kind") != "voice" or a.get("src") or not a.get("text"): continue
        ch = who(cast_data, a.get("speaker") or "narrator") or who(cast_data, "narrator")
        data = None
        has_id = bool(((ch or {}).get("voice") or {}).get("elevenlabs"))
        if SPEND and ELEVEN and has_id:
            try: data = voice_eleven(a, ch); a["voice_by"] = "elevenlabs"
            except Exception as e: log("ElevenLabs failed for", a["id"], e)
        elif has_id:
            WOULD.append(f"voice {a['id']} ({a.get('speaker')}) in ElevenLabs")
        if data is None:
            try: data = voice_kokoro(a, ch); a["voice_by"] = "kokoro"
            except Exception as e:
                log("Kokoro is not available here (", type(e).__name__, e, ") - a silent stand-in for", a["id"])
                data = voice_silent(a); a["voice_by"] = "silent"; a["note"] = "Voice to come (no voice model on this machine)"
        b, ctype, ext, words = data
        a["src"] = upload(f"{pid}/voice/{a['id']}{ext}", b, ctype)
        a["dur"] = round(duration_of(fetch(a["src"])), 3)
        a["words_rel"] = [{"w": w["w"], "t": round(w["t"], 3)} for w in words] if words else None
        made += 1
    return made


# ------------------------------------------------------------------ layout
def clip_lines(c):
    ls = list(c.get("lines") or [])
    if not ls and (c.get("gen") or {}).get("line"): ls = [c["gen"]["line"]]
    return ls


def choose_len(need, kind, current):
    if kind == "episode":
        if current >= need and current in SHOT_LENGTHS: return current
        for L in SHOT_LENGTHS:
            if L >= need: return L
        return float(math.ceil(need * 2) / 2)
    return max(float(current), float(math.ceil(need * 2) / 2))


def layout(tl, force=False):
    """Voice lines into their shots; shots long enough for their lines; anchored texts/music follow."""
    voices = {a["id"]: a for a in tl["audio"] if a.get("kind") == "voice"}
    if not voices: return False
    if not force and all("start" in a for a in voices.values()): return False
    placed, t_end = set(), 0.0
    for i, c in enumerate(tl["clips"]):
        ls = [l for l in clip_lines(c) if l in voices]
        if not ls: continue
        lead = 0.0 if (c.get("gen") or {}).get("maker") == "heygen" else 0.35
        need = lead + sum(float(voices[l].get("dur") or 2) for l in ls) + 0.3 * (len(ls) - 1) + 0.45 + float(c["trans"]["dur"])
        c["dur"] = choose_len(need, tl.get("kind"), float(c.get("dur") or 0))
    defaults(tl)                                         # transitions re-capped to the new lengths
    st = starts(tl)
    for i, c in enumerate(tl["clips"]):
        ls = [l for l in clip_lines(c) if l in voices]
        lead = 0.0 if (c.get("gen") or {}).get("maker") == "heygen" else 0.35
        t = st[i] + lead
        if ls and t < t_end + 0.15: t = t_end + 0.15
        for l in ls:
            voices[l]["start"] = round(t, 3); t += float(voices[l].get("dur") or 2) + 0.3; placed.add(l)
        if ls: t_end = t
    for a in tl["audio"]:                                # lines no shot names: one after another
        if a.get("kind") == "voice" and a["id"] not in placed and (force or "start" not in a):
            a["start"] = round(t_end + 0.3, 3); t_end = a["start"] + float(a.get("dur") or 2)
    anchor(tl)
    return True


def anchor(tl):
    """texts with "clip" (+ "offset") and sound with "clips": [first, last] follow their shots."""
    st = starts(tl); idx = {c["id"]: i for i, c in enumerate(tl["clips"])}; T = total(tl)
    for t in tl.get("texts", []):
        if t.get("clip") in idx:
            i = idx[t["clip"]]; t["start"] = round(st[i] + float(t.get("offset") or 0), 3)
            if t.get("fill"): t["dur"] = round(float(tl["clips"][i]["dur"]) - float(t.get("offset") or 0), 3)
    for a in tl.get("audio", []):
        span = a.get("clips")
        if span and span[0] in idx:
            i0 = idx[span[0]]; i1 = idx.get(span[-1], i0)
            a["start"] = round(st[i0] + float(a.get("offset") or 0), 3)
            a["dur"] = round(st[i1] + float(tl["clips"][i1]["dur"]) - a["start"], 3)
        elif a.get("to_end") and "start" in a:
            a["dur"] = round(T - float(a["start"]), 3)
    # a music bed with "after": <id> comes in as that one (the theme) fades out
    by = {a.get("id"): a for a in tl.get("audio", [])}
    for a in tl.get("audio", []):
        b = by.get(a.get("after")) if a.get("after") else None
        if b and "start" in b and b.get("dur"):
            a["start"] = round(max(0.0, float(b["start"]) + float(b["dur"]) - float(b.get("fadeOut") or 0)), 3)
            if a.get("to_end"): a["dur"] = round(max(0.1, T - a["start"]), 3)


def rebuild_captions(tl):
    lines = []
    for a in sorted([a for a in tl["audio"] if a.get("kind") == "voice" and "start" in a], key=lambda x: x["start"]):
        if a.get("caption") is False: continue
        s = float(a["start"]); d = float(a.get("dur") or 2)
        words = [{"w": w["w"], "t": round(s + w["t"], 3)} for w in a["words_rel"]] if a.get("words_rel") else spread_words(a["text"], s, d * 0.97)
        lines.append({"start": round(s, 3), "end": round(s + d, 3), "text": plain(a["text"]), "speaker": a.get("speaker"), "words": words})
    tl["captions"]["lines"] = lines


# ------------------------------------------------------------------ music
MUSIC = {
    "theme": "audio/little-scripture-travelers-theme.mp3",   # Levi's theme song (7 Nov 2026), every episode's opening
    "lullaby": "audio/hush-little-traveler.mp3",
    "lullaby-nt": "audio/hush-little-traveler-nt.mp3",
    "lullaby-short": "audio/hush-little-traveler-short.mp3",
}


def music_for(cue, tl):
    if cue in MUSIC and os.path.exists(os.path.join(ROOT, MUSIC[cue])): return os.path.join(ROOT, MUSIC[cue])
    if cue in ("lantern-song", "night-song"):
        n = night_info(tl.get("night"))
        if n:
            p = os.path.join(n["_dir"], n["slug"] + "-lullaby.mp3")
            if os.path.exists(p): return p
    for ext in (".mp3", ".wav", ".m4a"):
        p = os.path.join(HERE, "music", cue + ext)
        if os.path.exists(p): return p
    return None


def add_theme(tl):
    """THE THEME SONG OPENS EVERY EPISODE (Levi, 7 Nov 2026: "Here is the theme song that should be played
    at the beginning"): over Scene 1 (the theme open), full and undimmed, fading out as Scene 2 begins.
    Added when the episode has no theme cue of its own; a theme cue already there keeps its own settings."""
    if (tl.get("kind") or "episode") != "episode": return
    if any(a.get("kind") == "music" and a.get("cue") == "theme" for a in tl["audio"]): return
    clips = tl.get("clips") or []
    s01 = [c["id"] for c in clips if str(c.get("shot") or "").startswith("S01")]
    if not s01: return          # no theme open in this edit: never laid over talking (add it from the editor's Music)
    tl["audio"].insert(0, {"id": "m-theme", "kind": "music", "cue": "theme", "clips": [s01[0], s01[-1]],
                           "vol": 0.9, "fadeIn": 0, "fadeOut": 2.5, "duck": False})


def make_music(pid, tl):
    add_theme(tl)
    music = [a for a in tl["audio"] if a.get("kind") == "music" and a.get("cue") != "theme"]
    if not music:
        cue = "lantern-song" if music_for("lantern-song", tl) else "lullaby"
        # the bed starts after the theme open, so the two never play over each other
        th = next((a for a in tl["audio"] if a.get("cue") == "theme"), None)
        tl["audio"].append({"id": "m-bed", "kind": "music", "cue": cue, "start": 0, "to_end": True, "vol": 0.28,
                            "fadeIn": 1.5, "fadeOut": 3, "duck": True, "after": "m-theme" if th else None})
    music = [a for a in tl["audio"] if a.get("kind") == "music"]
    for a in music:
        if a.get("src"): continue
        p = music_for(a.get("cue") or "", tl)
        if p:
            a["src"] = rel(p); continue
        if SPEND and ELEVEN and a.get("prompt"):
            secs = float(a.get("dur") or 60)
            s, b = http("POST", "https://api.elevenlabs.io/v1/music", {"prompt": a["prompt"], "music_length_ms": int(min(300, max(10, secs)) * 1000)},
                        {"xi-api-key": ELEVEN, "Content-Type": "application/json", "Accept": "audio/mpeg"}, timeout=600)
            if s == 200:
                a["src"] = upload(f"{pid}/music/{a['id']}.mp3", b, "audio/mpeg"); continue
            log("ElevenLabs music failed", s, b[:200])
        WOULD.append(f"music {a['id']} ({a.get('cue')}: {a.get('prompt', '')[:60]}) with ElevenLabs music")
        a["note"] = "Music to come — pick one in the editor, or put studio/music/" + (a.get("cue") or "name") + ".mp3 in the website repo"
    anchor(tl)


# ------------------------------------------------------------------ pictures
def multipart(fields, files):
    bnd = "----lst" + uuid.uuid4().hex; out = io.BytesIO()
    for k, v in fields.items():
        out.write(f"--{bnd}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
    for k, (name, data, ctype) in files:
        out.write(f"--{bnd}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{name}\"\r\nContent-Type: {ctype}\r\n\r\n".encode())
        out.write(data); out.write(b"\r\n")
    out.write(f"--{bnd}--\r\n".encode()); return out.getvalue(), "multipart/form-data; boundary=" + bnd


def picture_prompt(c, tl, cast_data):
    g = c.get("gen") or {}
    p = g.get("image") or ""
    if cast_data["style_lock"][:40] not in p: p = cast_data["style_lock"] + "\n" + p
    if g.get("world") == "scripture" and cast_data["scripture_world"][:30] not in p: p += "\n" + cast_data["scripture_world"]
    for cid in (g.get("who") or []) + ([g["place"]] if g.get("place") else []):
        ch = who(cast_data, cid)
        if ch and ch.get("look"):
            o = (ch.get("outfits") or {}).get(g.get("outfit") or "")
            p += f"\n{ch['name'].upper()} (match the attached reference exactly): {ch['look']}" + (f" Outfit: {o}" if o else "")
    if tl["size"]["h"] > tl["size"]["w"]: p = p.replace("16:9 frame", "9:16 tall frame")
    return p + "\nNo text, letters, captions or watermarks anywhere."


def check_picture(img_bytes, ref_paths, prompt):
    """Claude looks at the new picture beside the references: {score, why}."""
    content = []
    for r in ref_paths[:6]:
        content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png" if r.endswith(".png") else "image/jpeg",
                                                     "data": base64.b64encode(open(r, "rb").read()).decode()}})
    content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": base64.b64encode(img_bytes).decode()}})
    content.append({"type": "text", "text": "The first pictures are the locked reference pictures of a children's animated series. The LAST picture is a new shot. "
                    "Score the new shot 1-10 on: every character exactly on-model (face, hair, skin, eyes, proportions, outfit), the set matching its reference, "
                    "the style matching, no text or letters, no extra fingers or broken anatomy, and the shot matching this description:\n" + prompt[-1500:] +
                    "\nBe strict. Answer ONLY JSON: {\"score\": n, \"why\": \"one sentence\"}"})
    s, b = http("POST", "https://api.anthropic.com/v1/messages", {"model": CHECK_MODEL, "max_tokens": 300, "messages": [{"role": "user", "content": content}]},
                {"x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01", "Content-Type": "application/json"})
    if s != 200: raise RuntimeError(f"check {s}: {b[:200]!r}")
    txt = "".join(x.get("text", "") for x in json.loads(b).get("content", []))
    m = re.search(r"\{.*\}", txt, re.S); return json.loads(m.group(0)) if m else {"score": 0, "why": txt[:200]}


def ai_image(c, tl, cast_data):
    g = c.get("gen") or {}
    refs = []
    for cid in (g.get("who") or []) + ([g["place"]] if g.get("place") else []):
        refs += refs_for(cast_data, cid)
    refs = list(dict.fromkeys(refs))[:16]
    prompt = picture_prompt(c, tl, cast_data)
    size = "1024x1536" if tl["size"]["h"] > tl["size"]["w"] else "1536x1024"
    best = None
    for attempt in range(3):
        if refs:
            files = [("image[]", (os.path.basename(r), open(r, "rb").read(), "image/png" if r.endswith(".png") else "image/jpeg")) for r in refs]
            body, ctype = multipart({"model": "gpt-image-1", "prompt": prompt, "size": size, "quality": IMAGE_QUALITY, "input_fidelity": "high"}, files)
            s, b = http("POST", "https://api.openai.com/v1/images/edits", raw=body, headers={"Authorization": "Bearer " + OPENAI, "Content-Type": ctype}, timeout=600)
        else:
            s, b = http("POST", "https://api.openai.com/v1/images/generations", {"model": "gpt-image-1", "prompt": prompt, "size": size, "quality": IMAGE_QUALITY},
                        {"Authorization": "Bearer " + OPENAI, "Content-Type": "application/json"}, timeout=600)
        if s != 200: raise RuntimeError(f"OpenAI {s}: {b[:300]!r}")
        img = base64.b64decode(json.loads(b)["data"][0]["b64_json"])
        if not (ANTHROPIC and refs): return img, None
        try: verdict = check_picture(img, refs, prompt)
        except Exception as e: log("picture check failed", e); return img, None
        log(f"  {c.get('shot') or c['id']} try {attempt+1}: {verdict.get('score')}/10 {verdict.get('why','')}")
        if not best or verdict.get("score", 0) > best[1].get("score", 0): best = (img, verdict)
        if verdict.get("score", 0) >= 9: break
        prompt += "\nFix this from the last try: " + verdict.get("why", "")
    return best


HG = "https://api.heygen.com"
def heygen_upload(data, ctype):
    s, b = http("POST", "https://upload.heygen.com/v1/asset", raw=data, headers={"X-Api-Key": HEYGEN, "Content-Type": ctype}, timeout=600)
    if s != 200: raise RuntimeError(f"HeyGen upload {s}: {b[:200]!r}")
    return json.loads(b).get("data") or {}


def heygen_talk(pid, c, line, tl):
    """The shot's picture, talking with the line's own audio (HeyGen Avatar IV)."""
    meta = tl.setdefault("meta", {}).setdefault("heygen", {})
    pic = fetch(c["src"]); key = hashlib.sha1(open(pic, "rb").read()).hexdigest()[:16]
    if key not in meta:
        meta[key] = heygen_upload(open(pic, "rb").read(), "image/png" if pic.endswith(".png") else "image/jpeg").get("image_key")
    aud = fetch(line["src"])
    asset = heygen_upload(open(aud, "rb").read(), "audio/mpeg" if aud.endswith(".mp3") else "audio/wav")
    body = {"image_key": meta[key], "video_title": f"{pid} {c.get('shot') or c['id']}", "audio_asset_id": asset.get("id"),
            "video_orientation": "portrait" if tl["size"]["h"] > tl["size"]["w"] else "landscape"}
    if (c.get("gen") or {}).get("video"): body["custom_motion_prompt"] = c["gen"]["video"]
    s, b = http("POST", HG + "/v2/video/av4/generate", body, {"X-Api-Key": HEYGEN, "Content-Type": "application/json"})
    if s != 200: raise RuntimeError(f"HeyGen generate {s}: {b[:300]!r}")
    vid = (json.loads(b).get("data") or {}).get("video_id")
    for _ in range(120):                                  # up to 30 minutes
        time.sleep(15)
        s, b = http("GET", HG + f"/v1/video_status.get?video_id={vid}", headers={"X-Api-Key": HEYGEN})
        d = (json.loads(b).get("data") or {}) if s == 200 else {}
        if d.get("status") == "completed":
            s, mp4 = http("GET", d["video_url"], timeout=600)
            return upload(f"{pid}/talk/{c['id']}.mp4", mp4, "video/mp4")
        if d.get("status") == "failed": raise RuntimeError("HeyGen: " + json.dumps(d.get("error"))[:300])
    raise RuntimeError("HeyGen took longer than 30 minutes")


def make_pictures(pid, tl, cast_data):
    used = {c.get("src") for c in tl["clips"] if c.get("src")}
    book = [p for p in night_pictures(tl.get("night")) if rel(p) not in used]
    voices = {a["id"]: a for a in tl["audio"] if a.get("kind") == "voice"}
    for c in tl["clips"]:
        g = c.get("gen") or {}; maker = g.get("maker") or ("book" if not c.get("src") and book else "still")
        if c.get("type") == "color": c["status"] = "ready"; continue
        if c.get("src") and c.get("status") != "todo" and maker != "heygen":
            c["status"] = "ready"; continue
        if maker == "book" and not c.get("src"):
            if book: c["src"] = rel(book.pop(0)); c["status"] = "ready"; continue
            maker = "ai-image"
        if maker in ("ai-image", "heygen") and (not c.get("src") or c.get("status") == "todo"):
            if SPEND and OPENAI:
                try:
                    img, verdict = ai_image(c, tl, cast_data)
                    c["src"] = upload(f"{pid}/shots/{c.get('shot') or c['id']}.png", img, "image/png"); c["status"] = "ready"
                    if verdict: c["check"] = verdict
                except Exception as e:
                    c["status"] = "failed"; c["note"] = "The picture could not be made: " + str(e)[:200]; continue
            else:
                WOULD.append(f"picture {c.get('shot') or c['id']} with OpenAI (from the cast's reference pictures)")
                c["status"] = "todo"; c["note"] = TODO_NOTE; continue
        if maker == "heygen" and c.get("src") and c.get("type") != "video":
            line = voices.get(g.get("line") or (clip_lines(c) or [None])[0])
            if not line or not line.get("src"):
                c["note"] = "A talking shot needs its voice line first"; continue
            if SPEND and HEYGEN:
                try:
                    c["still"] = c["src"]; c["src"] = heygen_talk(pid, c, line, tl); c["type"] = "video"; c["in"] = 0; c["vol"] = 0
                    c["motion"] = "none"; c["status"] = "ready"
                except Exception as e:
                    c["note"] = "HeyGen could not make it talk (" + str(e)[:160] + "); the picture moves instead"; c["status"] = "ready"
            else:
                WOULD.append(f"talking shot {c.get('shot') or c['id']} with HeyGen ({line['id']})")
                c["status"] = "ready"; c["note"] = "Talking shot to come with paid making; the picture moves for now"
        elif c.get("src"):
            c["status"] = "ready"


# ------------------------------------------------------------------ the whole crew
def produce(pid, tl, relayout=False):
    cast_data = load_cast()
    if relayout:
        for a in tl["audio"]:
            if a.get("kind") == "voice": a.pop("start", None)
    n = make_voices(pid, tl, cast_data)
    log(f"{n} voice line(s) made")
    if layout(tl, force=relayout) or not tl["captions"].get("lines"):
        rebuild_captions(tl)
    make_pictures(pid, tl, cast_data)
    make_music(pid, tl)
    anchor(tl)
    tl["produced_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    todo = [c.get("shot") or c["id"] for c in tl["clips"] if c.get("status") in ("todo", "failed")]
    log(f"{total(tl):.1f} s, {len(tl['clips'])} shots, {len(todo)} still to come")
    if WOULD:
        log("STUDIO_SPEND is not 'yes', so these were NOT made (they would cost money):")
        for w in WOULD: log("   -", w)
    return tl, todo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id"); ap.add_argument("--file"); ap.add_argument("--out", help="write the filled project here instead of over --file")
    ap.add_argument("--relayout", action="store_true", help="place every voice line again")
    a = ap.parse_args()
    if not (a.id or a.file): ap.error("--id or --file")
    row, tl = load_project(a.id, a.file)
    pid = str(row.get("id"))
    tl, todo = produce(pid, tl, a.relayout)
    if a.out:
        json.dump(dict(row, timeline=tl), open(a.out, "w"), indent=1, ensure_ascii=False)
    elif a.file:
        save_project(row, tl, a.file)
    else:
        save_project(row, tl, None, status="making", error=None)
    print(json.dumps({"id": pid, "seconds": total(tl), "todo": todo, "would_spend": WOULD}))


if __name__ == "__main__":
    main()
