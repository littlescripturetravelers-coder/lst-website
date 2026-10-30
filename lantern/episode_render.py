#!/usr/bin/env python3
"""episode_render.py - THE EPISODE BUILDER (Levi, 30 Oct 2026: "start doing my excellent YouTube videos
that should work and look like a modern Disney movie with modern Disney characters. I have the entire
production made out").

An episode kit from the LST Episode Engine (shots with IMAGE and VIDEO prompts, voice lines, voice cast,
music cues, YouTube package) is read by the app (www/js/episode-kit.js) into a Studio project
(video_projects, timeline.mode = 'episode'). studio_render.py hands it here, one stage at a time:

  pictures  - every shot's still drawn by ChatGPT's picture maker (OpenAI gpt-image-1, 1536x1024) FROM the
              owner's reference pictures (the Travelers' sheet for the scene's outfit, the playroom, the
              Travel Chest at that time of day, the sky, a family, Grandma, a bedroom, the episode's own new
              sheet such as Jeremiah), a "start from the last frame" shot also from the shot before it.
              REUSE shots come from the reuse library once made. The episode's new reference sheets are
              drawn first from their prompts if the owner did not upload one. -> stage 'storyboard'.
  trial     - one shot made by several clip makers side by side, so the owner can choose by eye.
  clips     - every voice line read in its speaker's ElevenLabs voice (eleven_v3 understands the kit's
              [warm] [whispers] tags; ALL lines are the four Travelers layered), every shot made into a
              moving clip by the chosen clip maker through fal.ai (Kling, Seedance, Veo, Grok, Hailuo) or
              xAI directly, a "start from the last frame" shot starting from the real last frame of the
              clip before it, the music cues from the owner's library (missing scores composed once by
              ElevenLabs Music and kept for every later episode), then the whole episode cut together:
              cuts and dissolves as the kit says, each line at its shot, the music under the voices
              (ducked), the YouTube thumbnail with its title. -> stage 'final'.
Nothing already made is made again: a picture, clip or voice line is kept until the owner changes its
words or asks for a new one. The owner's tap on "Make the pictures" / "Make the clips" is the go for
spending; the app shows the estimate first.
"""
import os, re, io, json, time, math, base64, hashlib, shutil, tempfile, subprocess, urllib.parse

import marketing_media as mm

FAL = os.environ.get("FAL_KEY", "").strip()
XAI = os.environ.get("XAI_API_KEY", "").strip()
W, H, FPS = 1920, 1080, 30
NEG = "blurry, distorted faces, extra fingers, deformed hands, morphing, flicker, text, letters, captions, watermark, logo changes"

# THE CLIP MAKERS (fal.ai queue API; one FAL_KEY reaches them all). price = dollars a second, for the estimate.
CLIP_MODELS = {
    "kling":    {"name": "Kling 3.0 Pro", "id": "fal-ai/kling-video/v3/pro/image-to-video", "image": "start_image_url", "max": 15, "price": 0.112,
                 "dur": lambda s: str(int(min(15, max(3, round(s))))), "extra": {"generate_audio": False, "negative_prompt": NEG}},
    "seedance": {"name": "Seedance 2.0", "id": "bytedance/seedance-2.0/image-to-video", "image": "image_url", "max": 15, "price": 0.30,
                 "dur": lambda s: str(int(min(15, max(4, round(s))))), "extra": {"resolution": "720p", "aspect_ratio": "16:9", "generate_audio": False}},
    "veo":      {"name": "Veo 3.1 Fast", "id": "fal-ai/veo3.1/fast/image-to-video", "image": "image_url", "max": 8, "price": 0.10,
                 "dur": lambda s: "8s" if s > 6 else ("6s" if s > 4 else "4s"), "extra": {"aspect_ratio": "16:9", "resolution": "720p", "generate_audio": False}},
    "grok":     {"name": "Grok Imagine 1.5", "id": "xai/grok-imagine-video/v1.5/image-to-video", "image": "image_url", "max": 15, "price": 0.14,
                 "dur": lambda s: int(min(15, max(3, round(s)))), "extra": {"resolution": "720p"}},
    "hailuo":   {"name": "Hailuo 2.3", "id": "fal-ai/minimax/hailuo-2.3/standard/image-to-video", "image": "image_url", "max": 10, "price": 0.047,
                 "dur": lambda s: "10" if s > 6 else "6", "extra": {}},
}
DEFAULT_MODEL = "kling"

def log(*a): print("   ", *a, flush=True)
def hsh(*p): return hashlib.sha1("|".join(str(x) for x in p).encode()).hexdigest()[:14]
def norm(speaker): return re.sub(r"[^A-Z]", "", re.sub(r"['’]S\b", "", str(speaker or "").upper()))

# ---------------------------------------------------------------- files
class Files:
    """Fetches what the timeline names (a web address or a brand-kit file) once per run."""
    def __init__(self, tmp): self.tmp, self.got = tmp, {}
    def path(self, src, ext=".bin"):
        if not src: return None
        if os.path.exists(src): return src
        if src in self.got: return self.got[src]
        local = src.replace(mm.SITE, mm.ROOT) if src.startswith(mm.SITE) else None
        if local and os.path.exists(local): self.got[src] = local; return local
        s, b = mm.http("GET", src, timeout=300)
        if s != 200: raise RuntimeError(f"could not fetch {src[:90]} ({s})")
        p = os.path.join(self.tmp, "f-" + hsh(src) + (os.path.splitext(urllib.parse.urlparse(src).path)[1] or ext))
        open(p, "wb").write(b); self.got[src] = p; return p

def keep(pid, name, data, ctype): return mm.upload(f"studio/{pid}/{name}", data, ctype)
def duration(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", p], capture_output=True, text=True).stdout.strip()
    try: return float(out)
    except Exception: return 0.0
def ff(*a, cwd=None):
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], capture_output=True, text=True, cwd=cwd)
    if r.returncode != 0: raise RuntimeError("ffmpeg: " + (r.stderr or "")[-700:])

# ---------------------------------------------------------------- the reference pictures
DEFAULT_REFS = {   # used until the owner uploads his own
    "portraits": [os.path.join(mm.BRAND, "travelers-cast.jpg")] + [os.path.join(mm.BRAND, t + ".jpg") for t in mm.TRAVELERS],
    "logo": [os.path.join(mm.BRAND, "logo.png")],
    "sky": [os.path.join(mm.ROOT, "images", "sky-star.jpg")],
}
def ref_paths(keys, st, files):
    lib = {r.get("key"): r for r in (st.get("refs") or []) if r.get("url")}
    out = []
    for k in keys or []:
        if k in lib:
            try: out.append(files.path(lib[k]["url"], ".jpg"))
            except Exception as e: log(f"reference {k}: {e}")
        else: out += [p for p in DEFAULT_REFS.get(k, []) if os.path.exists(p)]
    seen, uniq = set(), []
    for p in out:
        if p and p not in seen: seen.add(p); uniq.append(p)
    return uniq[:8]

def gpt_image(prompt, refs, quality="medium", size="1536x1024"):
    """ChatGPT's picture maker, drawing from the reference pictures (OpenAI images/edits)."""
    if not mm.OPENAI: raise RuntimeError("OPENAI_API_KEY is not set")
    model = os.environ.get("OPENAI_IMAGE_MODEL", "").strip() or "gpt-image-1"
    if not refs:
        body = {"model": model, "prompt": prompt[:30000], "n": 1, "size": size, "quality": quality}
        s, b = mm.http("POST", "https://api.openai.com/v1/images/generations", body, {"Authorization": "Bearer " + mm.OPENAI, "Content-Type": "application/json"}, timeout=400)
        return mm._image_result(s, b, "images")
    files = []
    for p in refs:
        ctype = "image/png" if p.lower().endswith(".png") else ("image/webp" if p.lower().endswith(".webp") else "image/jpeg")
        files.append(("image[]", (os.path.basename(p), open(p, "rb").read(), ctype)))
    body, ctype = mm._multipart({"model": model, "prompt": prompt[:30000], "n": "1", "size": size, "quality": quality, "input_fidelity": "high"}, files)
    s, b = mm.http("POST", "https://api.openai.com/v1/images/edits", raw=body, headers={"Authorization": "Bearer " + mm.OPENAI, "Content-Type": ctype}, timeout=500)
    if s == 400 and b"input_fidelity" in b:      # an older model without the high-fidelity switch
        body, ctype = mm._multipart({"model": model, "prompt": prompt[:30000], "n": "1", "size": size, "quality": quality}, files)
        s, b = mm.http("POST", "https://api.openai.com/v1/images/edits", raw=body, headers={"Authorization": "Bearer " + mm.OPENAI, "Content-Type": ctype}, timeout=500)
    return mm._image_result(s, b, "images/edits")

def picture_prompt(shot, keys, names):
    told = "; ".join(f"picture {i + 1}: {names.get(k, k)}" for i, k in enumerate(keys)) if keys else ""
    extra = ("\n\nThe attached reference pictures are, in order: " + told + ". Match every character, outfit and place to them exactly; "
             "do not copy any text or labels from the reference sheets into the picture.") if told else ""
    cont = f"\nContinue straight on from the attached frame of shot {shot['from']}: same place, light, clothes and positions." if shot.get("from") else ""
    return (shot.get("image_prompt") or "") + cont + extra + BRAND_LIGHT + "\nOne single 16:9 frame, no panels, no borders, no text anywhere."

# THE BRAND SHEET (v2.0, section 04): the look every picture keeps
BRAND_LIGHT = ("\nBrand look (Little Scripture Travelers style sheet): premium 2D animated storybook, soft painterly textures, glossy "
               "expressive eyes with bright catchlights, rounded toddler proportions, bright high-key preschool-animation lighting about "
               "30-40% brighter than typical storybook art, even at night; soft, feathered, warm, transparent shadows, never black, harsh "
               "or dark-cinematic; emotionally warm and safe. Never photoreal, 3D-render, anime or flat-vector. No crosses or modern "
               "objects in ancient scenes; never show Heavenly Father's face.")

REF_NAMES = {"sheet_modern": "the four Travelers' character sheet in their modern clothes", "sheet_biblical": "the four Travelers' sheet in their scripture-story clothes",
             "sheet_pajamas": "the four Travelers' sheet in their pajamas", "portraits": "the four Travelers' portraits", "playroom": "the playroom",
             "chest_day": "the Travel Chest in the day", "chest_sunset": "the Travel Chest at sunset", "chest_dusk": "the Travel Chest at dusk",
             "chest_night": "the Travel Chest at night", "sky": "the starry sky background", "logo": "the Little Scripture Travelers logo",
             "grandma": "Grandma Lewis", "family_beau": "Beau's family", "family_scout": "Scout's family", "family_willow": "Willow's family", "family_wren": "Wren's family",
             "room_beau": "Beau's bedroom", "room_scout": "Scout's bedroom", "room_willow": "Willow's bedroom", "room_wren": "Wren's bedroom"}

# ---------------------------------------------------------------- the clip makers
def fal_clip(model_key, prompt, image_url, seconds):
    if not FAL: raise RuntimeError("FAL_KEY is not set")
    m = CLIP_MODELS[model_key]
    body = {"prompt": prompt[:2400], m["image"]: image_url, "duration": m["dur"](seconds), **m["extra"]}
    auth = {"Authorization": "Key " + FAL, "Content-Type": "application/json"}
    s, b = mm.http("POST", "https://queue.fal.run/" + m["id"], body, auth, timeout=120)
    if s not in (200, 201, 202): raise RuntimeError(f"{m['name']}: {s} {b[:240]!r}")
    sub = json.loads(b); status_url, response_url = sub.get("status_url"), sub.get("response_url")
    if not (status_url and response_url): raise RuntimeError(f"{m['name']}: no request came back")
    for _ in range(240):                                 # up to twenty minutes
        time.sleep(5)
        s, b = mm.http("GET", status_url, headers=auth, timeout=60)
        if s not in (200, 202): continue
        st = (json.loads(b) or {}).get("status")
        if st == "COMPLETED": break
    else: raise RuntimeError(f"{m['name']}: did not finish in time")
    s, b = mm.http("GET", response_url, headers=auth, timeout=120)
    j = json.loads(b) if b else {}
    url = ((j.get("video") or {}).get("url")) if isinstance(j, dict) else None
    if s != 200 or not url: raise RuntimeError(f"{m['name']}: {str(j.get('detail') if isinstance(j, dict) else j)[:240]}")
    s, mp4 = mm.http("GET", url, timeout=300)
    if s != 200: raise RuntimeError(f"{m['name']}: could not fetch the clip")
    return mp4

def make_clip(model_key, prompt, image_url, seconds):
    if model_key == "grok-direct":
        import studio_render as sr
        sr.XAI = XAI
        return sr.grok_video(prompt, image_url, seconds, "16:9")
    return fal_clip(model_key, prompt, image_url, seconds)

def last_frame(clip_path, out):
    ff("-sseof", "-0.15", "-i", clip_path, "-frames:v", "1", "-q:v", "2", out)
    return out

# ---------------------------------------------------------------- the voices
def account_voices():
    s, b = mm.http("GET", "https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": mm.ELEVEN}, timeout=60)
    if s != 200: return []
    out = []
    for v in json.loads(b).get("voices", []):
        lb = v.get("labels") or {}
        out.append({"id": v.get("voice_id"), "name": v.get("name", ""), "gender": (lb.get("gender") or "").lower(), "age": (lb.get("age") or "").lower(),
                    "desc": (lb.get("description") or lb.get("descriptive") or v.get("description") or "")[:80], "category": v.get("category", "")})
    return out[:120]

KIDS = {"BEAU": "male", "SCOUT": "male", "WILLOW": "female", "WREN": "female"}
def pick_voice(speaker, cast, voices, used):
    """The speaker's voice: the owner's choice (kept for every episode), else a sensible one from the account."""
    k = norm(speaker)
    if cast.get(k): return cast[k]
    if not voices: return None
    def best(gender=None, ages=(), words=()):
        pool = [v for v in voices if (not gender or v["gender"] == gender)]
        scored = sorted(pool, key=lambda v: (-(v["age"] in ages) * 2 - sum(w in (v["desc"] + v["name"]).lower() for w in words), v["id"] in used))
        return scored[0]["id"] if scored else voices[0]["id"]
    if k == "NARRATOR": vid = os.environ.get("ELEVENLABS_VOICE_ID", "").strip() or best("female", ("middle_aged", "middle aged"), ("warm", "calm", "narrat", "story"))
    elif k in KIDS: vid = best(KIDS[k], ("young",), ("child", "kid", "young", "playful", "cheerful", "cute"))
    elif "LORD" in k or k in ("GOD", "VOICE"): vid = best("male", ("old", "middle_aged"), ("deep", "calm", "warm", "narrat"))
    elif k.endswith("MOM") or "MOTHER" in k or "GRANDMA" in k or "NANNA" in k: vid = best("female", ("middle_aged",), ("warm", "soft"))
    elif k.endswith("DAD") or "FATHER" in k or "POPPA" in k: vid = best("male", ("middle_aged",), ("warm", "friendly"))
    else: vid = best("male", ("young", "middle_aged"), ("calm", "soft"))
    used.add(vid); cast[k] = vid
    return vid

def tts(text, voice):
    """One line in one voice. eleven_v3 reads the kit's [tags]; the steady model reads it without them if v3 refuses."""
    hdr = {"xi-api-key": mm.ELEVEN, "Content-Type": "application/json", "Accept": "audio/mpeg"}
    s, b = mm.http("POST", f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                   {"text": text, "model_id": os.environ.get("EPISODE_TTS_MODEL", "eleven_v3")}, hdr, timeout=180)
    if s == 200 and b: return b
    plain = re.sub(r"\[[^\]]*\]", "", text).replace("  ", " ").strip()
    s, b = mm.http("POST", f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                   {"text": plain, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35}}, hdr, timeout=180)
    if s != 200: raise RuntimeError(f"ElevenLabs: {s} {b[:200]!r}")
    return b

# ---------------------------------------------------------------- the music
OWN_CUES = ("THEME", "LANTERN SONG", "TUNNEL", "RETURN CHANT", "FLY-THROUGH", "FLY THROUGH", "CHANT BED", "SING-ALONG", "SING ALONG")
def cue_name(c): return re.sub(r"\s*\(.*$", "", str(c or "")).replace(" SCORE", "").strip().upper()
def music_track(cue, st, files, tmp, pid, make):
    name = cue_name(cue["cue"])
    for t in st.get("music") or []:
        c = str(t.get("cue") or "").upper()
        if t.get("url") and c and (c == name or c in name or name in c): return files.path(t["url"], ".mp3"), None
    if "LULLABY" in name:
        p = os.path.join(mm.ROOT, "audio", "hush-little-traveler.mp3")
        if os.path.exists(p): return p, None
    own = any(w in name for w in OWN_CUES) or re.search(r"\b(your|saved)\b", cue.get("mood", ""), re.I)
    if own: return None, f"music {name}: add your own track for it (The look, music library, cue {name})"
    if not (make and mm.ELEVEN): return None, f"music {name}: no track yet"
    length = int(max(10, min(240, (cue.get("end") or cue["start"] + 30) - cue["start"])) * 1000)
    prompt = (f"Instrumental score for a warm, premium children's animated film, no vocals, no singing, no lyrics. Cue: {name}. "
              f"{cue.get('mood', '')} Gentle, cinematic, family-friendly, clean mix.")[:4000]
    s, b = mm.http("POST", "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {"prompt": prompt, "music_length_ms": length, "model_id": "music_v1"},
                   {"xi-api-key": mm.ELEVEN, "Content-Type": "application/json", "Accept": "audio/mpeg"}, timeout=400)
    if s != 200 or not b: return None, f"music {name}: ElevenLabs Music said {s}"
    url = keep("library", f"music-{hsh(name, length)}.mp3", b, "audio/mpeg")
    st.setdefault("music", []).append({"title": name.title() + " (made for the episodes)", "url": url, "mood": "episode", "cue": name})
    p = os.path.join(tmp, f"m-{hsh(name)}.mp3"); open(p, "wb").write(b)
    return p, f"music {name}: composed by ElevenLabs Music and kept in your library"

# ---------------------------------------------------------------- stage 1: the pictures
def stage_pictures(p, st, tmp, notes, spend):
    tl = p["timeline"]; pid = p["id"]; files = Files(tmp); q = (st.get("episode") or {}).get("quality") or "medium"
    reuse = st.setdefault("reuse", {})
    names = dict(REF_NAMES); [names.__setitem__(r["key"], r.get("name") or r["key"]) for r in (st.get("refs") or []) if r.get("key")]
    # the episode's own new sheets first (Jeremiah, Wren's kitchen): drawn from their prompts unless uploaded
    lib = {r.get("key"): r for r in (st.get("refs") or [])}
    for need in tl.get("needs") or []:
        key = "x_" + re.sub(r"[^a-z0-9]+", "_", need["name"].lower()).strip("_")
        if lib.get(key, {}).get("url"): continue
        refs = ref_paths(["sheet_modern", "sheet_biblical", "portraits"], st, files)
        data = gpt_image(need["prompt"] + "\nNo words, letters or labels anywhere.", refs, "high"); spend["images"] += 1
        url = keep("library", f"ref-{key}-{hsh(need['prompt'])}.jpg", mm.to_bytes(mm.load_rgb(data)), "image/jpeg")
        st.setdefault("refs", []).append({"key": key, "name": need["name"].title(), "url": url, "extra": True}); lib[key] = st["refs"][-1]
        notes.append(f"made the new reference sheet: {need['name'].title()} (kept in your reference pictures)")
    shots = tl.get("scenes") or []; byid = {s["id"]: s for s in shots}
    for s in shots:
        m = s.setdefault("media", {"source": "episode"})
        if m.get("image"): continue
        if s.get("reuse") and reuse.get(s["id"], {}).get("image"):
            m["image"] = reuse[s["id"]]["image"]; m.pop("url", None); continue
        keys = list(s.get("refs") or [])
        refs = ref_paths(keys, st, files)
        prev = byid.get(s.get("from") or "")
        if prev and (prev.get("media") or {}).get("image"):
            try: refs = [files.path(prev["media"]["image"], ".jpg")] + refs[:7]
            except Exception: pass
        try:
            data = gpt_image(picture_prompt(s, keys, names), refs, q); spend["images"] += 1
            m["image"] = keep(pid, f"shot-{s['id']}-{hsh(s.get('image_prompt'), time.time())}.jpg", mm.to_bytes(mm.load_rgb(data)), "image/jpeg")
            m.pop("url", None); m.pop("kind", None)
            if s.get("reuse"): reuse[s["id"]] = {"image": m["image"]}
            log(f"{s['id']} picture made")
        except Exception as e:
            notes.append(f"{s['id']}: the picture was not made ({str(e)[:140]})")
    tl["stage"] = "storyboard"

# ---------------------------------------------------------------- the trial: one shot by several clip makers
def stage_trial(p, st, tmp, notes, spend):
    tl = p["timeline"]; pid = p["id"]; tr = tl.get("trial") or {}
    shot = next((s for s in tl.get("scenes") or [] if s["id"] == tr.get("shot")), None)
    if not shot or not (shot.get("media") or {}).get("image"): notes.append("the trial shot has no picture yet"); tl["stage"] = "storyboard"; return
    out = []
    for key in tr.get("models") or ["kling", "seedance", "grok"]:
        if key not in CLIP_MODELS: continue
        try:
            data = make_clip(key, shot.get("video_prompt") or "", shot["media"]["image"], shot.get("min_dur") or 6); spend["seconds"] += shot.get("min_dur") or 6
            out.append({"model": key, "name": CLIP_MODELS[key]["name"], "url": keep(pid, f"trial-{shot['id']}-{key}.mp4", data, "video/mp4")})
        except Exception as e:
            out.append({"model": key, "name": CLIP_MODELS[key]["name"], "error": str(e)[:200]})
    tl["trials"] = out; tl["stage"] = tr.get("back") or "storyboard"

# ---------------------------------------------------------------- stage 2: voices, clips, music, the cut
def stage_clips(p, st, tmp, notes, spend):
    tl = p["timeline"]; pid = p["id"]; files = Files(tmp)
    cfg = st.get("episode") or {}; model = cfg.get("clip_model") or DEFAULT_MODEL
    reuse = st.setdefault("reuse", {})
    shots = tl.get("scenes") or []; byid = {s["id"]: s for s in shots}
    if any(not (s.get("media") or {}).get("image") for s in shots):
        stage_pictures(p, st, tmp, notes, spend); tl["stage"] = "clips"
    # 1. the voices
    cast = st.setdefault("cast", {}); voices = st.get("voices") or []; used = set(cast.values())
    for ln in tl.get("lines") or []:
        spk = norm(ln.get("speaker"))
        who = ["BEAU", "SCOUT", "WILLOW", "WREN"] if spk == "ALL" else [ln.get("speaker")]
        vids = [pick_voice(w, cast, voices, used) for w in who]
        key = hsh(ln.get("text"), *vids)
        if ln.get("key") == key and ln.get("url"): continue
        if not mm.ELEVEN or not all(vids): notes.append(f"line {ln.get('n')}: no ElevenLabs voice"); continue
        try:
            parts = []
            for i, v in enumerate(vids):
                fp = os.path.join(tmp, f"l{ln['n']}-{i}.mp3"); open(fp, "wb").write(tts(ln["text"], v)); parts.append(fp)
            out = parts[0]
            if len(parts) > 1:                       # the chant: the four Travelers together
                out = os.path.join(tmp, f"l{ln['n']}-all.mp3")
                ff(*sum((["-i", x] for x in parts), []), "-filter_complex", "".join(f"[{i}:a]" for i in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,volume=0.8", "-b:a", "160k", out)
            ln.update({"key": key, "url": keep(pid, f"line-{ln['n']:03d}-{key}.mp3", open(out, "rb").read(), "audio/mpeg"), "dur": round(duration(out), 3)})
            spend["chars"] += len(ln["text"]) * len(vids)
        except Exception as e:
            notes.append(f"line {ln.get('n')}: {str(e)[:140]}")
    # 2. the clips
    for s in shots:
        m = s.setdefault("media", {"source": "episode"})
        if m.get("url") and m.get("kind") == "video": continue
        if s.get("reuse") and reuse.get(s["id"], {}).get("clip"): m.update({"url": reuse[s["id"]]["clip"], "kind": "video"}); continue
        if not m.get("image"): continue
        start = m["image"]
        prev = byid.get(s.get("from") or "")
        if prev and (prev.get("media") or {}).get("kind") == "video":
            try:
                fr = last_frame(files.path(prev["media"]["url"], ".mp4"), os.path.join(tmp, f"last-{prev['id']}.jpg"))
                start = keep(pid, f"start-{s['id']}-{hsh(prev['media']['url'])}.jpg", open(fr, "rb").read(), "image/jpeg")
            except Exception as e: log(f"{s['id']}: last frame: {e}")
        try:
            data = make_clip(model, s.get("video_prompt") or "", start, s.get("min_dur") or 6); spend["seconds"] += s.get("min_dur") or 6
            m.update({"url": keep(pid, f"clip-{s['id']}-{model}-{hsh(s.get('video_prompt'), start)}.mp4", data, "video/mp4"), "kind": "video", "model": model})
            if s.get("reuse"): reuse[s["id"]] = {**reuse.get(s["id"], {}), "image": m["image"], "clip": m["url"]}
            log(f"{s['id']} clip made ({CLIP_MODELS.get(model, {}).get('name', model)})")
        except Exception as e:
            notes.append(f"{s['id']}: the clip was not made ({str(e)[:160]}); the picture moves gently instead")
    # 3. the cut
    out, thumb, total = assemble(p, st, files, tmp, notes, cfg)
    v = int(p.get("version") or 1)
    p["render_url"] = keep(pid, f"episode-v{v}.mp4", open(out, "rb").read(), "video/mp4")
    p["thumb_url"] = keep(pid, f"episode-v{v}.jpg", open(thumb, "rb").read(), "image/jpeg")
    tl["total"] = round(total, 2); tl["stage"] = "final"

def segment(s, files, tmp, i, length):
    m = s.get("media") or {}; out = os.path.join(tmp, f"seg{i:03d}.mp4")
    enc = ["-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-an"]
    if m.get("kind") == "video" and m.get("url"):
        clip = files.path(m["url"], ".mp4")
        ff("-i", clip, "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1,tpad=stop_mode=clone:stop_duration={length:.2f}",
           "-t", f"{length:.3f}", *enc, out)
    elif m.get("image"):
        img = os.path.join(tmp, f"img{i:03d}.png"); mm.cover(mm.load_rgb(files.path(m["image"], ".jpg")), int(W * 1.25), int(H * 1.25)).save(img)
        frames = max(2, int(round(length * FPS))); N = frames - 1
        ff("-i", img, "-vf", f"zoompan=z='1+0.06*on/{N}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d={frames}:s={W}x{H}:fps={FPS},setsar=1,format=yuv420p", "-frames:v", str(frames), *enc, out)
    else:
        ff("-f", "lavfi", "-i", f"color=c=0x1B2D5F:s={W}x{H}:r={FPS}", "-t", f"{length:.3f}", *enc, out)
    return out

SCRIPTURE_VOICES = ("LORD", "JESUS", "SAVIOR", "SAVIOUR")
def is_scripture_speaker(sp, cast):
    """A scripture character speaks only scripture words (the Engine's rule), so their caption is scripture: Nunito Italic."""
    k = norm(sp)
    if k in ("NARRATOR", "ALL", "BEAU", "SCOUT", "WILLOW", "WREN") or any(x in k for x in ("MOM", "DAD", "GRANDMA", "POPPA", "NANNA")): return False
    return True

def word_card(kind, title, sub=""):
    """THE BRAND SHEET's words, drawn once as a clear sheet: the episode title in Scripture Gold Fredoka Bold with the
    reference beneath in Nunito Italic (white), or the scripture reference alone as a lower third, on a soft navy band."""
    from PIL import Image, ImageDraw, ImageFilter
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if kind == "title":
        tf = mm.font(True, 92, "fredoka"); sf = mm.font(False, 44, "nunito-italic")
        lines = mm.wrap(d, title, tf, 1500)[:2]
        band_h = 110 * len(lines) + (80 if sub else 0) + 70; top = H - band_h - 90
        band = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(band).rounded_rectangle([110, top, W - 110, top + band_h], radius=44, fill=(27, 45, 95, 205))
        band = band.filter(ImageFilter.GaussianBlur(1)); im = Image.alpha_composite(im, band); d = ImageDraw.Draw(im)
        ImageDraw.Draw(im).line([(W / 2 - 120, top + 26), (W / 2 + 120, top + 26)], fill=mm.AMBER + (255,), width=5)   # Frame Amber divider
        y = top + 50
        for ln in lines:
            d.text((W / 2, y + 46), ln, font=tf, fill=mm.GOLD + (255,), anchor="mm"); y += 110
        if sub: d.text((W / 2, y + 30), sub, font=sf, fill=(255, 255, 255, 255), anchor="mm")
    else:
        sf = mm.font(False, 46, "nunito-italic"); w = d.textlength(title, font=sf) + 90
        d.rounded_rectangle([90, H - 200, 90 + w, H - 116], radius=40, fill=(27, 45, 95, 215))
        d.rectangle([90, H - 200, 98, H - 116], fill=mm.TEAL + (255,))
        d.text((90 + 50, H - 158), title, font=sf, fill=(255, 255, 255, 255), anchor="lm")
    return im

def episode_ass(tl, path):
    """Captions for an episode (when the owner turns them on): Nunito, a line at a time, white on the navy outline;
    a scripture character's words in Nunito Italic (italics for scripture only)."""
    import studio_render as sr
    cast = tl.get("cast") or {}
    head = ("[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n\n[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
            "Style: Cap,Nunito,58,&H00FFFFFF&,&H00FFFFFF&,&H005F2D1B&,&H96000000&,-1,0,0,0,100,100,0,0,1,5,1,2,160,160,70,1\n"
            "Style: Scr,Nunito,58,&H00FFFFFF&,&H00FFFFFF&,&H005F2D1B&,&H96000000&,-1,-1,0,0,100,100,0,0,1,5,1,2,160,160,70,1\n\n"
            "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
    ev = []
    for l in sorted([x for x in tl.get("lines") or [] if x.get("at") is not None], key=lambda x: x["at"]):
        words = re.sub(r"\[[^\]]*\]", "", l.get("text") or "").replace("{", "(").replace("}", ")").strip()
        words = re.sub(r"\s+", " ", words)
        if not words: continue
        style = "Scr" if is_scripture_speaker(l.get("speaker"), cast) else "Cap"
        ws = words.split(); dur = float(l.get("dur") or 2); chunks = [ws[i:i + 9] for i in range(0, len(ws), 9)]
        tot = sum(len(" ".join(c)) for c in chunks) or 1; t = float(l["at"])
        for c in chunks:
            d = dur * len(" ".join(c)) / tot
            ev.append((t, t + d, style, " ".join(c))); t += d
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(head)
        for k, (a, z, sty, txt) in enumerate(ev):
            z = min(z, ev[k + 1][0]) if k + 1 < len(ev) else z
            fh.write(f"Dialogue: 0,{sr.ass_time(a)},{sr.ass_time(z)},{sty},,0,0,0,,{txt}\n")

def assemble(p, st, files, tmp, notes, cfg):
    tl = p["timeline"]; shots = tl.get("scenes") or []
    t, starts, segs = 0.0, {}, []
    for i, s in enumerate(shots):
        nxt = shots[i + 1] if i + 1 < len(shots) else None
        td = 0.8 if (nxt and nxt.get("cont") == "dissolve") else 0.0     # a dissolve INTO the next shot
        L = float(s.get("min_dur") or 6)
        starts[s["id"]] = t; s["_start"], s["_len"], s["_td"] = t, L, td
        segs.append(segment(s, files, tmp, i, L + td)); t += L
    total = t
    fc = [f"[{i}:v]fps={FPS},settb=1/{FPS},setpts=PTS-STARTPTS[s{i}]" for i in range(len(segs))]; last = "[s0]"
    for i in range(1, len(segs)):
        prev = shots[i - 1]; lab = f"[x{i}]"
        if prev["_td"] > 0: fc.append(f"{last}[s{i}]xfade=transition=dissolve:duration={prev['_td']:.2f}:offset={shots[i]['_start']:.3f}{lab}")
        else: fc.append(f"{last}[s{i}]concat=n=2:v=1:a=0,settb=1/{FPS}{lab}")
        last = lab
    # the voices at their shots, one after another, never over each other
    lines = sorted([l for l in tl.get("lines") or [] if l.get("url")], key=lambda l: l["n"])
    placed, end = [], 0.0
    for l in lines:
        s0 = starts.get(l.get("shot"), end)
        at = max(s0 + 0.4, end + 0.25); placed.append((at, files.path(l["url"], ".mp3"))); end = at + float(l.get("dur") or 2)
        l["at"] = round(at, 2)
    # THE WORDS ON SCREEN, in the brand: the title card as the story opens (the first playroom shot), the scripture
    # reference as the scripture story begins, and (if turned on) captions
    extra_in, n_in = [], len(segs)
    card = tl.get("card") or {}; title = (p.get("title") or card.get("title") or "").strip(); ref = (card.get("scripture") or "").split(",")[0].strip()
    if cfg.get("titles", True) and title:
        firsts = {}
        for s in shots: firsts.setdefault(s.get("scene"), s)
        cards = []
        s2 = firsts.get("S02") or (shots[1] if len(shots) > 1 else shots[0])
        cards.append((word_card("title", title, ref), s2["_start"] + 0.6, 5.0))
        s6 = firsts.get("S06")
        if s6 and ref: cards.append((word_card("verse", ref), s6["_start"] + 1.0, 5.0))
        for k, (im, a, dur) in enumerate(cards):
            pth = os.path.join(tmp, f"words{k}.png"); im.save(pth); extra_in += ["-loop", "1", "-t", f"{a + dur + 1:.2f}", "-i", pth]
            fi = n_in + k; lab = f"[w{k}]"
            fc.append(f"[{fi}:v]format=rgba,fade=t=in:st={a:.2f}:d=0.6:alpha=1,fade=t=out:st={a + dur - 0.6:.2f}:d=0.6:alpha=1{lab}")
            fc.append(f"{last}{lab}overlay=0:0:eof_action=pass[o{k}]"); last = f"[o{k}]"
    vf_tail = "format=yuv420p"
    if cfg.get("captions"):
        episode_ass(tl, os.path.join(tmp, "episode.ass")); vf_tail = f"ass=episode.ass:fontsdir={mm.FONTS},format=yuv420p"
    fc.append(f"{last}{vf_tail}[vout]")
    video = os.path.join(tmp, "video.mp4")
    ff(*sum((["-i", x] for x in segs), []), *extra_in, "-filter_complex", ";".join(fc), "-map", "[vout]", "-t", f"{total:.3f}", "-r", str(FPS),
       "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", video, cwd=tmp)
    voice = os.path.join(tmp, "voice.wav")
    if placed:
        ins = sum((["-i", f] for _a, f in placed), [])
        mix = ";".join(f"[{k}:a]aresample=44100,adelay={int(a * 1000)}|{int(a * 1000)}[v{k}]" for k, (a, _f) in enumerate(placed))
        mix += ";" + "".join(f"[v{k}]" for k in range(len(placed))) + f"amix=inputs={len(placed)}:normalize=0:dropout_transition=0,apad,atrim=0:{max(total, end):.3f}[o]"
        ff(*ins, "-filter_complex", mix, "-map", "[o]", "-ac", "2", voice)
    # the music cues under them
    music = os.path.join(tmp, "music.wav"); parts = []
    for c in tl.get("music_cues") or []:
        try:
            path, note = music_track(c, st, files, tmp, p["id"], cfg.get("make_music", True))
            if note: notes.append(note)
            if path: parts.append((c, path))
        except Exception as e: notes.append(f"music {cue_name(c.get('cue'))}: {str(e)[:120]}")
    if parts:
        ins, mix = [], []
        for k, (c, path) in enumerate(parts):
            a = float(c["start"]); b = float(c.get("end") or min(total, a + 60)); dur = max(1.0, min(b, total) - a)
            ins += ["-stream_loop", "-1", "-i", path]
            mix.append(f"[{k}:a]aresample=44100,atrim=0:{dur:.3f},afade=t=in:d=1,afade=t=out:st={max(0, dur - 1.5):.3f}:d=1.5,adelay={int(a * 1000)}|{int(a * 1000)}[m{k}]")
        mix.append("".join(f"[m{k}]" for k in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{total:.3f}[o]")
        ff(*ins, "-filter_complex", ";".join(mix), "-map", "[o]", "-ac", "2", music)
    out = os.path.join(tmp, "episode.mp4")
    vol = float(((st.get("episode") or {}).get("music_volume")) or 0.32)
    if placed and parts:
        ff("-i", video, "-i", voice, "-i", music, "-filter_complex",
           f"[2:a]volume={vol:.2f}[mu];[1:a]asplit=2[vo][sc];[mu][sc]sidechaincompress=threshold=0.035:ratio=5:attack=30:release=500[duck];[vo][duck]amix=inputs=2:normalize=0:duration=first[a]",
           "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart", out)
    elif placed or parts:
        ff("-i", video, "-i", voice if placed else music, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart", out)
    else: shutil.copy(video, out)
    thumb = make_thumb(p, st, files, tmp, notes, video)
    for s in shots:
        s["start"], s["dur"] = round(s.pop("_start"), 2), round(s.pop("_len"), 2); s.pop("_td", None)
    return out, thumb, total

def make_thumb(p, st, files, tmp, notes, video):
    """THE THUMBNAIL: the kit's thumbnail picture (drawn from the references), the title in big brand letters."""
    tl = p["timeline"]; yt = tl.get("youtube") or {}; out = os.path.join(tmp, "thumb.jpg")
    pic = None
    if yt.get("thumb") and not tl.get("thumb_image") and mm.OPENAI:
        try:
            import json as _j
            keys = [k for k in ("sheet_modern", "sheet_biblical", "portraits") if any(r.get("key") == k for r in st.get("refs") or [])] or ["portraits"]
            data = gpt_image(yt["thumb"] + "\nNo text anywhere.", ref_paths(keys, st, files), "high")
            tl["thumb_image"] = keep(p["id"], f"thumb-art-{hsh(yt['thumb'])}.jpg", mm.to_bytes(mm.load_rgb(data)), "image/jpeg")
        except Exception as e: notes.append(f"thumbnail picture: {str(e)[:120]}")
    if tl.get("thumb_image"): pic = mm.load_rgb(files.path(tl["thumb_image"], ".jpg"))
    else:
        fr = os.path.join(tmp, "fr.jpg"); ff("-ss", "40", "-i", video, "-frames:v", "1", "-q:v", "2", fr); pic = mm.load_rgb(fr)
    from PIL import ImageDraw
    im = mm.cover(pic, 1280, 720); d = ImageDraw.Draw(im)
    words = (tl.get("thumb_text") or (yt.get("title_pick") or (yt.get("titles") or [p.get("title") or ""])[0]).split("|")[0]).strip()
    if words:
        fnt = mm.font(True, 96, "fredoka"); lines = mm.wrap(d, words, fnt, 780)[:3]; y = 720 - 70 - len(lines) * 104
        for ln in lines:
            d.text((60, y), ln, font=fnt, fill=mm.GOLD, stroke_width=9, stroke_fill=mm.NAVY); y += 104
    im.save(out, quality=92)
    return out

# ---------------------------------------------------------------- the run
def run(p, st, notes):
    """One stage of one episode. Returns the patch for the row."""
    tmp = tempfile.mkdtemp(prefix="ep-")
    tl = p["timeline"]; stage = tl.get("stage") or "pictures"
    spend = {"images": 0, "seconds": 0, "chars": 0}
    if mm.ELEVEN and not st.get("voices"):
        try: st["voices"] = account_voices()
        except Exception: pass
    try:
        if stage == "pictures": stage_pictures(p, st, tmp, notes, spend)
        elif stage == "trial": stage_trial(p, st, tmp, notes, spend)
        elif stage == "clips": stage_clips(p, st, tmp, notes, spend)
        else: notes.append(f"nothing to do at stage {stage}")
    finally:
        model = (st.get("episode") or {}).get("clip_model") or DEFAULT_MODEL
        cost = spend["images"] * (0.25 if (st.get("episode") or {}).get("quality") == "high" else 0.07) + spend["seconds"] * CLIP_MODELS.get(model, {}).get("price", 0.12)
        notes.append(f"this run: {spend['images']} pictures, {spend['seconds']} seconds of clips, {spend['chars']} characters of voice (about ${cost:.2f} before ElevenLabs)")
        shutil.rmtree(tmp, ignore_errors=True)
    patch = {"timeline": tl, "status": "ready", "render_error": None}
    if tl.get("stage") == "final": patch.update({"render_url": p.get("render_url"), "thumb_url": p.get("thumb_url"), "version": int(p.get("version") or 1) + 1})
    elif tl.get("stage") == "storyboard":
        first = next((s.get("media", {}).get("image") for s in tl.get("scenes") or [] if s.get("media", {}).get("image")), None)
        if first and not p.get("thumb_url"): patch["thumb_url"] = first
    return patch
