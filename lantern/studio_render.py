#!/usr/bin/env python3
"""studio_render.py - THE STUDIO's editor's hands (Levi, 23 Oct 2026: "my own tool that is like
CapCut ... high end videos ... AI ... real life human avatars and also have transitions and
everything ... without actually touching any of it").

Claude (the app's Edge Function `studio`) writes a video as a TIMELINE in video_projects; this
makes it real:
  1. BUILD - every scene's picture or clip the timeline asks for and does not have yet:
       book       the night's own book illustration (media.index)
       traveler   Beau, Scout, Willow or Wren's portrait (media.who)
       presenter  the mom or dad presenter's still (lantern/brand/presenter*.png)
       avatar     the mom or dad presenter SPEAKING the scene's narration, lip-synced:
                  HeyGen (HEYGEN_API_KEY, the presenter picture as a talking photo, our ElevenLabs
                  voice file as the audio); else the old talker (Replicate / D-ID); else the still
       grok-image a new picture from Grok Imagine (XAI_API_KEY), the brand's style rules added
       grok-video a moving clip from Grok Imagine, started from the scene's picture when it has one
       card       a Morning Lantern card, photographed as the app shows it
       brand      a navy brand card with the on-screen words
       upload     the owner's own picture or clip (already a url)
     and every scene's VOICE (ElevenLabs, with each word's timing for the captions), kept by a
     hash of its words so an unchanged line is never paid for twice.
     THE CAPS: marketing_settings.studio.caps (Grok pictures, Grok clips, avatars per day) - past
     the cap a scene falls back to the free picture (the book, the still presenter).
  2. RENDER - ffmpeg: each still moves (zoom, pan), each scene runs as long as its words, the
     transitions between them (fade, slide, wipe, zoom, circle ... ffmpeg's xfade), the on-screen
     words, word-by-word captions in the brand's face (karaoke: the word said lights gold; pop;
     line), the brand intro and the closing card, the music under the voice (ducked while the
     narrator speaks), a thumbnail.
  3. The mp4 goes to the public marketing bucket (studio/<id>/v<n>.mp4), the row turns "ready" and
     the owner sees it in the app (menu, Owner, Studio).

Run by .github/workflows/studio-render.yml (on demand, the moment the app asks) and by the nightly
lantern-sync. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ELEVENLABS_API_KEY, XAI_API_KEY,
HEYGEN_API_KEY, OPENAI_API_KEY, REPLICATE_API_TOKEN, DID_API_KEY, STUDIO_ID (one project first).
Local check (no network): python3 lantern/studio_render.py --local timeline.json out.mp4
"""
import os, re, io, sys, json, time, math, base64, hashlib, shutil, tempfile, subprocess, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import marketing_media as mm                                    # the brand kit, fonts, voice, uploads, cards

XAI = os.environ.get("XAI_API_KEY", "").strip()
HEYGEN = os.environ.get("HEYGEN_API_KEY", "").strip()
LIMIT = int(os.environ.get("STUDIO_LIMIT", "3"))
FONTS = mm.FONTS
NAVY, GOLD, TEAL, CREAM = mm.NAVY, mm.GOLD, mm.TEAL, mm.CREAM
SIZES = {"9:16": (1080, 1920), "1:1": (1080, 1080), "4:5": (1080, 1350), "16:9": (1920, 1080)}
XFADE = {"fade", "dissolve", "slideleft", "slideright", "slideup", "slidedown", "wipeleft", "wiperight", "circleopen",
         "circleclose", "zoomin", "smoothleft", "smoothright", "radial", "fadeblack", "fadewhite"}
FPS = 30
LOCAL = False                                                    # --local: no network, nothing paid for

def log(*a): print(" ", *a, flush=True)

# ---------------------------------------------------------------- the row and the settings
def settings():
    if LOCAL: return {}
    rows = mm.sb_get("marketing_settings?key=eq.studio&select=value")
    return (rows[0].get("value") if rows else {}) or {}

def save_settings(v):
    if LOCAL: return
    mm.http("POST", f"{mm.URL}/rest/v1/marketing_settings", {"key": "studio", "value": v, "updated_at": datetime.datetime.utcnow().isoformat() + "Z"},
            {"apikey": mm.KEY, "Authorization": "Bearer " + mm.KEY, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"})

def patch(pid, p):
    if LOCAL: return
    s, b = mm.http("PATCH", f"{mm.URL}/rest/v1/video_projects?id=eq.{pid}", p,
                   {"apikey": mm.KEY, "Authorization": "Bearer " + mm.KEY, "Content-Type": "application/json", "Prefer": "return=minimal"})
    if s not in (200, 204): raise RuntimeError(f"could not save the project: {s} {b[:160]!r}")

class Spend:
    """Today's paid pieces against the owner's caps (marketing_settings.studio.caps)."""
    def __init__(self, st):
        self.st = st; caps = st.get("caps") or {}
        self.caps = {"grok_images": int(caps.get("grok_images", 12)), "grok_videos": int(caps.get("grok_videos", 2)), "avatars": int(caps.get("avatars", 1))}
        today = datetime.date.today().isoformat(); sp = st.get("spent") or {}
        self.spent = sp if sp.get("date") == today else {"date": today}
    def may(self, what): return not LOCAL and self.spent.get(what, 0) < self.caps.get(what, 0)
    def took(self, what): self.spent[what] = self.spent.get(what, 0) + 1

# ---------------------------------------------------------------- fetching and keeping media
def fetch(url):
    if os.path.exists(url): return open(url, "rb").read()
    s, b = mm.http("GET", url, timeout=300)
    if s != 200: raise RuntimeError(f"could not fetch {url[:80]}: {s}")
    return b

def keep(pid, name, data, ctype):
    if LOCAL:
        p = os.path.join(tempfile.gettempdir(), f"studio-{pid}-{name}"); open(p, "wb").write(data); return p
    return mm.upload(f"studio/{pid}/{name}", data, ctype)

def h(*parts): return hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()[:14]

# ---------------------------------------------------------------- pictures that are free
def book_picture(night_date, index):
    pics = mm.night_pictures(night_date) if night_date else []
    if not pics: return None
    return pics[int(index or 0) % len(pics)]

def presenter_path(who): return mm.PRESENTER_DAD if who == "dad" else mm.PRESENTER

def brand_card(W, H, text, sub=""):
    """A navy card, the star motif, the words large in gold (Fredoka), a teal line under them."""
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(im); m = min(W, H)
    for cx, cy, r in ((.12, .16, .022), (.88, .13, .016), (.84, .84, .02), (.15, .86, .014)):
        R = int(m * r); x, y = int(W * cx), int(H * cy)
        pts = [(x + (R if i % 2 == 0 else R * .45) * math.sin(i * math.pi / 5), y - (R if i % 2 == 0 else R * .45) * math.cos(i * math.pi / 5)) for i in range(10)]
        d.polygon(pts, fill=GOLD)
    size = int(m * (0.085 if len(text) < 40 else 0.065)); fnt = mm.font(True, size)
    lines = mm.wrap(d, text, fnt, int(W * 0.84))[:6]
    y = H / 2 - (len(lines) - 1) * size * 0.62 - (size * 0.5 if sub else 0)
    for ln in lines:
        d.text((W / 2, y), ln, font=fnt, fill=GOLD, anchor="mm"); y += size * 1.24
    if sub: d.text((W / 2, y + size * 0.3), sub, font=mm.font(False, int(size * 0.55)), fill=TEAL, anchor="mm")
    return im

def intro_card(W, H):
    from PIL import Image
    if (W, H) == (1080, 1920): return mm.intro_card()
    im = brand_card(W, H, "")
    try:
        lg = mm.logo_rgba(int(min(W, H) * 0.55)); im.paste(lg, ((W - lg.width) // 2, (H - lg.height) // 2), lg)
    except Exception: pass
    return im

def outro_card(W, H, cover):
    if (W, H) == (1080, 1920): return mm.end_card(cover=cover)
    from PIL import ImageDraw
    im = brand_card(W, H, ""); d = ImageDraw.Draw(im); m = min(W, H)
    try:
        lg = mm.logo_rgba(int(m * 0.42)); im.paste(lg, ((W - lg.width) // 2, int(H * 0.12)), lg); y = int(H * 0.12) + lg.height
    except Exception: y = int(H * 0.4)
    d.text((W / 2, y + m * 0.08), "A new story every night", font=mm.font(True, int(m * 0.07)), fill=GOLD, anchor="mm")
    d.text((W / 2, y + m * 0.16), "littlescripturetravelers.com", font=mm.font(False, int(m * 0.048)), fill=CREAM, anchor="mm")
    return im

# ---------------------------------------------------------------- pictures that cost (Grok, HeyGen)
def grok_image(prompt, aspect, kids):
    style = mm.STYLE_LOCK if kids else ("Photoreal, warm natural light, a real modern home, cinematic shallow depth of field. " + getattr(mm, "PEOPLE_RULE", ""))
    full = f"{prompt}\n\n{style}\n{mm.locks_for(prompt) if hasattr(mm, 'locks_for') else ''}".strip()
    s, b = mm.http("POST", "https://api.x.ai/v1/images/generations",
                   {"model": os.environ.get("XAI_IMAGE_MODEL", "grok-imagine-image"), "prompt": full[:4000], "n": 1,
                    "aspect_ratio": aspect if aspect in ("9:16", "16:9", "1:1") else "3:4", "response_format": "b64_json"},
                   {"Authorization": "Bearer " + XAI, "Content-Type": "application/json"}, timeout=240)
    if s != 200: raise RuntimeError(f"Grok image: {s} {b[:200]!r}")
    d = (json.loads(b).get("data") or [{}])[0]
    if d.get("b64_json"): return base64.b64decode(d["b64_json"])
    if d.get("url"): return fetch(d["url"])
    raise RuntimeError("Grok image: nothing came back")

def _find_url(j):
    """The video's address, wherever xAI put it in the answer."""
    for path in (("video", "url"), ("url",), ("output", "url"), ("result", "url"), ("data", 0, "url")):
        v = j
        try:
            for k in path: v = v[k]
            if isinstance(v, str) and v.startswith("http"): return v
        except Exception: continue
    return None

def grok_video(prompt, image_url, seconds, aspect):
    body = {"model": os.environ.get("XAI_VIDEO_MODEL", "grok-imagine-video-1.5-lite"), "prompt": prompt[:2000],
            "duration": int(max(3, min(10, round(seconds)))), "resolution": "720p"}
    if image_url: body["image"] = {"url": image_url}
    else: body["aspect_ratio"] = aspect
    auth = {"Authorization": "Bearer " + XAI, "Content-Type": "application/json"}
    s, b = mm.http("POST", "https://api.x.ai/v1/videos/generations", body, auth, timeout=120)
    if s not in (200, 201, 202): raise RuntimeError(f"Grok video: {s} {b[:200]!r}")
    rid = json.loads(b).get("request_id") or json.loads(b).get("id")
    for _ in range(120):                                         # up to ten minutes
        time.sleep(5)
        s, b = mm.http("GET", f"https://api.x.ai/v1/videos/{rid}", headers=auth, timeout=60)
        if s != 200: continue
        j = json.loads(b); st = str(j.get("status") or "").lower()
        url = _find_url(j)
        if url and st in ("done", "completed", "succeeded", ""): return fetch(url)
        if st in ("failed", "expired", "error"): raise RuntimeError(f"Grok video: {st} {str(j.get('error') or '')[:160]}")
    raise RuntimeError("Grok video: did not finish in time")

def heygen_talk(image_path, audio_url, W, H, cache):
    """The presenter's picture speaking our voice file, lip-synced (HeyGen talking photo)."""
    auth = {"X-Api-Key": HEYGEN}
    key = "heygen_photo_" + h(os.path.getsize(image_path), os.path.basename(image_path))
    photo = cache.get(key)
    if not photo:
        ext = "image/png" if image_path.endswith(".png") else "image/jpeg"
        s, b = mm.http("POST", "https://upload.heygen.com/v1/talking_photo", raw=open(image_path, "rb").read(), headers={**auth, "Content-Type": ext}, timeout=120)
        if s != 200: raise RuntimeError(f"HeyGen photo: {s} {b[:200]!r}")
        d = json.loads(b).get("data") or {}; photo = d.get("talking_photo_id") or d.get("id")
        if not photo: raise RuntimeError("HeyGen photo: no id came back")
        cache[key] = photo
    portrait = H > W
    dim = {"width": 720, "height": 1280} if portrait else ({"width": 1280, "height": 720} if W > H else {"width": 720, "height": 720})
    body = {"video_inputs": [{"character": {"type": "talking_photo", "talking_photo_id": photo},
                              "voice": {"type": "audio", "audio_url": audio_url}, "background": {"type": "color", "value": "#1B2D5F"}}], "dimension": dim}
    s, b = mm.http("POST", "https://api.heygen.com/v2/video/generate", body, {**auth, "Content-Type": "application/json"}, timeout=120)
    if s != 200: raise RuntimeError(f"HeyGen: {s} {b[:200]!r}")
    vid = (json.loads(b).get("data") or {}).get("video_id")
    for _ in range(150):
        time.sleep(6)
        s, b = mm.http("GET", f"https://api.heygen.com/v1/video_status.get?video_id={vid}", headers=auth, timeout=60)
        if s != 200: continue
        d = json.loads(b).get("data") or {}
        if d.get("status") == "completed" and d.get("video_url"): return fetch(d["video_url"])
        if d.get("status") == "failed": raise RuntimeError(f"HeyGen: {str(d.get('error') or 'failed')[:160]}")
    raise RuntimeError("HeyGen: did not finish in time")

def talk(image_path, audio_url, W, H, cache):
    if HEYGEN: return heygen_talk(image_path, audio_url, W, H, cache)
    if mm.REPLICATE: return mm.replicate_talk(f"{mm.SITE}/lantern/brand/{os.path.basename(image_path)}", audio_url)
    raise RuntimeError("no avatar key (HEYGEN_API_KEY or REPLICATE_API_TOKEN)")

# ---------------------------------------------------------------- the voice, with each word's time
def words_even(text, dur):
    ws = text.split()
    if not ws: return []
    total = sum(len(w) + 2 for w in ws); t, out = 0.0, []
    for w in ws:
        d = dur * (len(w) + 2) / total; out.append({"w": w, "s": round(t, 3), "e": round(t + d, 3)}); t += d
    return out

def words_from_alignment(al):
    chars = al.get("characters") or []; st = al.get("character_start_times_seconds") or []; en = al.get("character_end_times_seconds") or []
    out, cur, s0, e0 = [], "", None, None
    for i, c in enumerate(chars):
        if c.isspace():
            if cur: out.append({"w": cur, "s": round(s0, 3), "e": round(e0, 3)}); cur = ""
            continue
        if not cur: s0 = st[i] if i < len(st) else 0
        cur += c; e0 = en[i] if i < len(en) else s0
    if cur: out.append({"w": cur, "s": round(s0, 3), "e": round(e0, 3)})
    return out

def speak(text, who):
    """(mp3 bytes, [{w,s,e}]) - ElevenLabs with timestamps; the plain voice if that endpoint balks."""
    male = who == "dad"
    voice = mm.resolve_voice(male)
    body = {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.2}}
    s, b = mm.http("POST", f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128", body,
                   {"xi-api-key": mm.ELEVEN, "Content-Type": "application/json"}, timeout=180)
    if s == 200:
        j = json.loads(b); audio = base64.b64decode(j.get("audio_base64") or "")
        words = words_from_alignment(j.get("alignment") or j.get("normalized_alignment") or {})
        if audio: return audio, words, voice
    audio = mm.tts(text, male)
    return audio, None, voice

def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path], capture_output=True, text=True).stdout.strip()
    try: return float(out)
    except Exception: return 0.0

# ---------------------------------------------------------------- 1. BUILD
def build(p, tmp, spend, st):
    tl = p["timeline"]; W, H = SIZES.get(p.get("aspect") or tl.get("aspect") or "9:16", (1080, 1920))
    kids = (p.get("audience") or "parents") == "kids"; pid = p["id"]; night = p.get("night_date")
    who_default = (tl.get("voice") or {}).get("who") or "narrator"
    cache = st.setdefault("cache", {})
    notes = []
    for i, sc in enumerate(tl.get("scenes") or []):
        m = sc.setdefault("media", {}); src = m.get("source") or "book"
        nar = sc.setdefault("narration", {}); text = (nar.get("text") or "").strip()
        speaker = m.get("who") if src == "avatar" and m.get("who") in ("mom", "dad") else who_default
        # the voice
        if text:
            key = h(text, speaker)
            local = os.path.join(tmp, f"n{i:02d}.mp3")
            if nar.get("key") == key and nar.get("url"):
                open(local, "wb").write(fetch(nar["url"]))
            elif LOCAL or not mm.ELEVEN:
                nar.update({"key": key, "url": None, "dur": round(max(1.0, len(text.split()) / 2.6), 2)}); nar["words"] = words_even(text, nar["dur"]); local = None
            else:
                audio, words, _v = speak(text, speaker); open(local, "wb").write(audio)
                d = duration(local); nar.update({"key": key, "dur": round(d, 3), "url": keep(pid, f"voice-{key}.mp3", audio, "audio/mpeg"),
                                                 "words": words or words_even(text, d)})
            sc["_voice"] = local
        else:
            nar.update({"dur": 0, "words": []}); sc["_voice"] = None
        # the picture
        try:
            if m.get("url") and not (src == "avatar" and m.get("for") != nar.get("key")): continue
            if src == "upload" and m.get("url"): continue
            if src == "book":
                pic = book_picture(night, m.get("index"))
                if pic: m.update({"path": pic, "kind": "image"}); continue
                src = "brand"
            if src == "traveler":
                m.update({"path": mm.portrait([m.get("who") if m.get("who") in mm.TRAVELERS else "beau"]), "kind": "image"}); continue
            if src == "presenter":
                m.update({"path": presenter_path(m.get("who")), "kind": "image"}); continue
            if src == "card" and night:
                shots = mm.card_shots(night, [m.get("card") or "Verse of the Day"])
                if shots:
                    im = mm.card_picture(shots[0][1], W, H); pth = os.path.join(tmp, f"card{i}.jpg"); im.save(pth, quality=92)
                    m.update({"url": keep(pid, f"card-{h(m.get('card'))}.jpg", open(pth, "rb").read(), "image/jpeg"), "kind": "image"}); continue
                src = "brand"
            if src == "grok-image":
                if XAI and spend.may("grok_images"):
                    data = grok_image(m.get("prompt") or text, p.get("aspect") or "9:16", kids); spend.took("grok_images")
                    m.update({"url": keep(pid, f"grok-{h(m.get('prompt'), i)}.jpg", data, "image/jpeg"), "kind": "image"}); continue
                notes.append(f"scene {i+1}: no Grok key or today's Grok pictures are used - the book picture instead")
                pic = book_picture(night, i)
                if pic: m.update({"path": pic, "kind": "image"}); continue
                src = "brand"
            if src == "grok-video":
                if XAI and spend.may("grok_videos"):
                    start = None; frm = m.get("from")
                    if frm == "book": start = book_picture(night, m.get("index"))
                    elif frm == "traveler": start = mm.portrait([m.get("who") or "beau"])
                    elif frm == "presenter": start = presenter_path(m.get("who"))
                    start_url = None
                    if start:
                        im = mm.cover(mm.load_rgb(start), *((720, 1280) if H > W else (1280, 720)))
                        start_url = keep(pid, f"start-{i}.jpg", mm.to_bytes(im), "image/jpeg")
                    data = grok_video(m.get("prompt") or text, start_url, max(sc.get("min_dur", 3), nar.get("dur") or 0), p.get("aspect") or "9:16")
                    spend.took("grok_videos")
                    m.update({"url": keep(pid, f"clip-{h(m.get('prompt'), i)}.mp4", data, "video/mp4"), "kind": "video"}); continue
                notes.append(f"scene {i+1}: no Grok key or today's Grok clips are used - a still that moves instead")
                pic = book_picture(night, m.get("index") or i)
                if pic: m.update({"path": pic, "kind": "image"}); continue
                src = "brand"
            if src == "avatar":
                still = presenter_path(m.get("who"))
                if (HEYGEN or mm.REPLICATE) and nar.get("url") and spend.may("avatars"):
                    data = talk(still, nar["url"], W, H, cache); spend.took("avatars")
                    m.update({"url": keep(pid, f"avatar-{nar['key']}.mp4", data, "video/mp4"), "kind": "video", "for": nar["key"]}); continue
                notes.append(f"scene {i+1}: no avatar key or today's avatars are used - the presenter's still")
                m.update({"path": still, "kind": "image"}); continue
            # brand (and anything that fell through)
            im = brand_card(W, H, sc.get("onscreen") or text[:90] or p.get("title") or "")
            pth = os.path.join(tmp, f"brand{i}.jpg"); im.save(pth, quality=92); m.update({"path": pth, "kind": "image", "brand": True})
        except Exception as e:
            notes.append(f"scene {i+1}: {str(e)[:160]} - a brand card instead")
            im = brand_card(W, H, sc.get("onscreen") or text[:90] or p.get("title") or "")
            pth = os.path.join(tmp, f"brand{i}.jpg"); im.save(pth, quality=92); m.update({"path": pth, "kind": "image", "brand": True})
    return notes

# ---------------------------------------------------------------- 2. RENDER
def overlay_png(W, H, onscreen, who, path):
    """The scene's on-screen words (gold, upper third) and a Traveler badge, on a clear sheet."""
    from PIL import Image, ImageDraw
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov); m = min(W, H)
    if onscreen:
        size = int(m * (0.085 if len(onscreen) < 28 else 0.068)); fnt = mm.font(True, size, "anton" if len(onscreen) < 22 else None)
        y = int(H * (0.15 if H > W else 0.14))
        for ln in mm.wrap(d, onscreen.upper(), fnt, int(W * 0.86))[:3]:
            d.text((W / 2, y), ln, font=fnt, fill=GOLD + (255,), anchor="mm", stroke_width=max(3, size // 14), stroke_fill=(15, 25, 55, 255)); y += int(size * 1.15)
    if who in mm.TRAVELERS:
        sz = int(m * 0.16)
        try:
            face = mm.load_rgb(os.path.join(mm.BRAND, who + ".jpg")); side = min(face.width, face.height)
            face = face.crop(((face.width - side) // 2, 0, (face.width - side) // 2 + side, side)).resize((sz, sz))
            mask = Image.new("L", (sz, sz), 0); ImageDraw.Draw(mask).ellipse([0, 0, sz - 1, sz - 1], fill=255)
            cx, cy = W - sz // 2 - int(m * 0.05), H - sz // 2 - int(H * 0.05) if H <= W else int(H * 0.06) + sz // 2
            ImageDraw.Draw(ov).ellipse([cx - sz // 2 - 7, cy - sz // 2 - 7, cx + sz // 2 + 7, cy + sz // 2 + 7], fill=GOLD + (255,))
            ov.paste(face, (cx - sz // 2, cy - sz // 2), mask)
        except Exception: pass
    ov.save(path)

def motion_filter(motion, W, H, frames):
    N = max(1, frames - 1); z = "1.0"; x = "(iw-iw/zoom)/2"; y = "(ih-ih/zoom)/2"
    if motion == "zoom-in": z = f"1+0.13*on/{N}"
    elif motion == "zoom-out": z = f"1.13-0.13*on/{N}"
    elif motion in ("pan-left", "pan-right", "pan-up", "pan-down"):
        z = "1.14"
        if motion == "pan-left": x = f"(iw-iw/zoom)*(1-on/{N})"
        if motion == "pan-right": x = f"(iw-iw/zoom)*on/{N}"
        if motion == "pan-up": y = f"(ih-ih/zoom)*(1-on/{N})"
        if motion == "pan-down": y = f"(ih-ih/zoom)*on/{N}"
    return f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s={W}x{H}:fps={FPS}"

def ff(*args):
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], capture_output=True, text=True)
    if r.returncode != 0: raise RuntimeError("ffmpeg: " + (r.stderr or "")[-600:])

def segment(sc, W, H, length, tmp, i):
    """One scene as its own silent clip, `length` seconds (its time plus the transition after it)."""
    m = sc["media"]; frames = max(2, int(round(length * FPS))); out = os.path.join(tmp, f"seg{i:03d}.mp4")
    ovp = os.path.join(tmp, f"ov{i:03d}.png"); overlay_png(W, H, "" if m.get("brand") else sc.get("onscreen") or "", sc.get("badge"), ovp)
    enc = ["-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-an"]
    src = m.get("path") or m.get("url")
    if m.get("kind") == "video":
        clip = os.path.join(tmp, f"clip{i:03d}.mp4"); open(clip, "wb").write(fetch(src))
        vf = f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1[b];[b][1:v]overlay=0:0,format=yuv420p[v]"
        ff("-stream_loop", "-1", "-i", clip, "-loop", "1", "-i", ovp, "-filter_complex", vf, "-map", "[v]", "-t", f"{length:.3f}", *enc, out)
    else:
        img = os.path.join(tmp, f"img{i:03d}.png")
        mm.cover(mm.load_rgb(fetch(src) if not os.path.exists(str(src)) else src), int(W * 1.5), int(H * 1.5)).save(img)
        vf = f"[0:v]{motion_filter(sc.get('motion') or 'zoom-in', W, H, frames)},setsar=1[b];[b][1:v]overlay=0:0,format=yuv420p[v]"
        ff("-i", img, "-loop", "1", "-i", ovp, "-filter_complex", vf, "-map", "[v]", "-frames:v", str(frames), *enc, out)
    return out

def ass_color(hexs):
    hexs = (hexs or "#FFFFFF").lstrip("#"); return f"&H00{hexs[4:6]}{hexs[2:4]}{hexs[0:2]}&".upper()

def ass_time(t):
    t = max(0, t); hh = int(t // 3600); mi = int(t % 3600 // 60); s = t % 60
    return f"{hh}:{mi:02d}:{s:05.2f}"

def chunks(words, most, chars):
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= most or sum(len(x["w"]) + 1 for x in cur) >= chars or re.search(r"[.!?;:,]$", w["w"]):
            out.append(cur); cur = []
    if cur: out.append(cur)
    return out

def captions_ass(scenes, W, H, style, path):
    kind = style.get("captions") or "karaoke"
    m = min(W, H); portrait = H > W
    size = int(m * (0.085 if kind == "pop" else 0.066)) if portrait else int(H * (0.058 if kind != "line" else 0.05))
    marg = int(H * 0.2) if portrait else int(H * 0.07)
    if style.get("position") == "middle": marg = int(H * 0.42)
    white, gold = ass_color(style.get("color") or "#FFFFFF"), ass_color(style.get("highlight") or "#F5C518")
    head = (f"[Script Info]\nScriptType: v4.00+\nPlayResX: {W}\nPlayResY: {H}\nWrapStyle: 0\n\n[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
            f"Style: Cap,Fredoka,{size},{white},{white},&H00371B0F&,&H96000000&,-1,0,0,0,100,100,0,0,1,{max(3, size // 14)},2,2,{int(W*0.07)},{int(W*0.07)},{marg},1\n\n"
            "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
    ev = []
    esc = lambda s: s.replace("{", "(").replace("}", ")").replace("\\", "/")
    for sc in scenes:
        if kind == "none": break
        words = (sc.get("narration") or {}).get("words") or []; t0 = sc.get("_start", 0)
        if not words: continue
        if kind == "line":
            for c in chunks(words, 12, 64):
                ev.append((t0 + c[0]["s"], t0 + c[-1]["e"] + 0.15, esc(" ".join(w["w"] for w in c))))
        elif kind == "pop":
            for c in chunks(words, 3, 16):
                ev.append((t0 + c[0]["s"], t0 + c[-1]["e"] + 0.05, "{\\fscx70\\fscy70\\t(0,110,\\fscx100\\fscy100)}" + esc(" ".join(w["w"] for w in c).upper())))
        else:
            for c in chunks(words, 5, 28):
                end = t0 + c[-1]["e"] + 0.12
                for k, w in enumerate(c):
                    a = t0 + w["s"]; z = t0 + c[k + 1]["s"] if k + 1 < len(c) else end
                    txt = " ".join((f"{{\\c{gold}}}{esc(x['w'])}{{\\c{white}}}" if j == k else esc(x["w"])) for j, x in enumerate(c))
                    ev.append((a, z, txt))
    ev.sort(key=lambda e: e[0])
    ev = [(a, min(z, ev[k + 1][0]) if k + 1 < len(ev) else z, txt) for k, (a, z, txt) in enumerate(ev)]   # never two lines at once
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(head)
        for a, z, txt in ev:
            if z - a < 0.04: continue
            fh.write(f"Dialogue: 0,{ass_time(a)},{ass_time(z)},Cap,,0,0,0,,{txt}\n")

def music_for(tl, st):
    mu = tl.get("music") or {}
    if mu.get("mood") == "none": return None
    if mu.get("url"): return mu["url"]
    lib = [t for t in (st.get("music") or []) if t.get("url")]
    for t in lib:
        if t.get("mood") == mu.get("mood"): return t["url"]
    return lib[0]["url"] if lib else None

def render(p, tmp, st, cover):
    tl = p["timeline"]; W, H = SIZES.get(p.get("aspect") or tl.get("aspect") or "9:16", (1080, 1920))
    scenes = [s for s in (tl.get("scenes") or []) if s.get("media")]
    kids = (p.get("audience") or "parents") == "kids"
    seq = []
    if tl.get("intro", True):
        ip = os.path.join(tmp, "intro.jpg"); intro_card(W, H).save(ip, quality=92)
        seq.append({"media": {"path": ip, "kind": "image", "brand": True}, "motion": "zoom-in", "_len": 1.3, "transition": {"type": "fade", "dur": 0.4}, "narration": {}})
    for sc in scenes:
        nd = float((sc.get("narration") or {}).get("dur") or 0)
        sc["_len"] = round(max(float(sc.get("min_dur") or 2.0), nd + (0.35 if nd else 0)), 3)
        if kids and not sc.get("badge"):
            named = mm.travelers_in((sc.get("narration") or {}).get("text", "") + " " + (sc.get("onscreen") or ""))
            if len(named) == 1 and sc["media"].get("source") != "traveler": sc["badge"] = named[0]
        seq.append(sc)
    if tl.get("outro", True):
        op = os.path.join(tmp, "outro.jpg"); outro_card(W, H, cover).save(op, quality=92)
        seq.append({"media": {"path": op, "kind": "image", "brand": True}, "motion": "none", "_len": 2.8, "transition": {"type": "cut", "dur": 0}, "narration": {}})
    # the times: scene i starts at S_i; its clip runs its own time plus the transition into the next
    t, segs, offs = 0.0, [], []
    for i, sc in enumerate(seq):
        tr = sc.get("transition") or {}; typ = tr.get("type") or "fade"
        nxt = seq[i + 1] if i + 1 < len(seq) else None
        td = 0.0 if (typ == "cut" or typ not in XFADE or not nxt) else min(float(tr.get("dur") or 0.5), sc["_len"] / 2, nxt["_len"] / 2, 1.2)
        sc["_start"], sc["_td"], sc["_typ"] = t, td, typ
        segs.append(segment(sc, W, H, sc["_len"] + td, tmp, i))
        t += sc["_len"]
    total = t
    # join with the transitions, captions burned on top
    ass = os.path.join(tmp, "captions.ass"); captions_ass(seq, W, H, tl.get("style") or {}, ass)
    inputs = sum((["-i", s] for s in segs), [])
    fc = [f"[{i}:v]fps={FPS},settb=1/{FPS},setpts=PTS-STARTPTS[s{i}]" for i in range(len(segs))]
    last = "[s0]"
    for i in range(1, len(segs)):
        prev = seq[i - 1]; lab = f"[x{i}]"
        if prev["_td"] > 0: fc.append(f"{last}[s{i}]xfade=transition={prev['_typ']}:duration={prev['_td']:.3f}:offset={seq[i]['_start']:.3f}{lab}")
        else: fc.append(f"{last}[s{i}]concat=n=2:v=1:a=0,settb=1/{FPS}{lab}")
        last = lab
    fc.append(f"{last}ass={os.path.basename(ass)}:fontsdir={FONTS},format=yuv420p[vout]")
    silent = os.path.join(tmp, "video.mp4")
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(fc), "-map", "[vout]", "-t", f"{total:.3f}",
                        "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", silent], cwd=tmp, capture_output=True, text=True)
    if r.returncode != 0: raise RuntimeError("ffmpeg join: " + r.stderr[-800:])
    # the voice: each scene's words placed at its start
    voiced = [(sc["_start"], sc.get("_voice")) for sc in seq if sc.get("_voice")]
    out = os.path.join(tmp, "out.mp4")
    aud_in, mixes = [], []
    for k, (start, f) in enumerate(voiced):
        aud_in += ["-i", f]; ms = int(start * 1000); mixes.append(f"[{k + 1}:a]aresample=44100,adelay={ms}|{ms}[n{k}]")
    music = music_for(tl, st)
    mpath = None
    if music:
        try: mpath = os.path.join(tmp, "music.mp3"); open(mpath, "wb").write(fetch(music))
        except Exception as e: log(f"music: {e}"); mpath = None
    if not voiced and not mpath:
        shutil.copy(silent, out)
    else:
        fc = list(mixes); n = len(voiced)
        if n: fc.append("".join(f"[n{k}]" for k in range(n)) + f"amix=inputs={n}:normalize=0:dropout_transition=0,apad,atrim=0:{total:.3f}[narr]")
        args = ["-i", silent, *aud_in]
        if mpath:
            args += ["-stream_loop", "-1", "-i", mpath]; mi = n + 1
            vol = float((tl.get("music") or {}).get("volume") or 0.16)
            fc.append(f"[{mi}:a]aresample=44100,volume={vol:.3f},atrim=0:{total:.3f},afade=t=out:st={max(0, total - 2.5):.3f}:d=2.5[mus]")
            if n:
                fc.append("[narr]asplit=2[narr1][side]")
                if (tl.get("music") or {}).get("duck", True): fc.append("[mus][side]sidechaincompress=threshold=0.04:ratio=6:attack=25:release=450[duck]")
                else: fc.append("[side]anullsink;[mus]anull[duck]")
                fc.append("[narr1][duck]amix=inputs=2:normalize=0:duration=first[aout]")
            else: fc.append("[mus]anull[aout]")
        else: fc.append("[narr]anull[aout]")
        ff(*args, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart", out)
    thumb = os.path.join(tmp, "thumb.jpg")
    first = seq[1] if len(seq) > 1 and tl.get("intro", True) else seq[0]
    ff("-ss", f"{first['_start'] + min(1.0, first['_len'] / 2):.2f}", "-i", out, "-frames:v", "1", "-q:v", "3", thumb)
    # what the editor needs to play it in step: where each scene starts and how long it is
    for sc in scenes:
        sc["start"], sc["dur"] = round(sc["_start"], 3), round(sc["_len"], 3)
    tl["total"] = round(total, 3); tl["intro_dur"] = seq[0]["_len"] if tl.get("intro", True) else 0
    return out, thumb

def clean(tl, pid):
    """Keep only what the editor can open: every picture as a web address (a book picture or brand
    kit file the website serves, a made card uploaded beside the video)."""
    for sc in tl.get("scenes") or []:
        for k in [k for k in sc if k.startswith("_")]: sc.pop(k, None)
        m = sc.get("media") or {}
        p = m.pop("path", None)
        if p and not m.get("url"):
            if p.startswith(mm.ROOT + os.sep): m["url"] = mm.SITE + p[len(mm.ROOT):]
            else:
                try: m["url"] = keep(pid, f"pic-{h(p, os.path.getsize(p))}.jpg", mm.to_bytes(mm.load_rgb(p)), "image/jpeg")
                except Exception: pass
            if m.get("brand"): m["made"] = True                               # remade on the next render from the words
    return tl

# ---------------------------------------------------------------- the run
def one(p, st, spend):
    tmp = tempfile.mkdtemp(prefix="studio-"); pid = p["id"]
    patch(pid, {"status": "building", "render_error": None})
    t0 = time.time()
    notes = build(p, tmp, spend, st)
    cover = mm.month_cover(p.get("night_date")) if p.get("night_date") else None
    out, thumb = render(p, tmp, st, cover)
    v = int(p.get("version") or 1)
    if LOCAL: return out, thumb, notes
    url = keep(pid, f"v{v}.mp4", open(out, "rb").read(), "video/mp4")
    turl = keep(pid, f"v{v}.jpg", open(thumb, "rb").read(), "image/jpeg")
    patch(pid, {"status": "ready", "render_url": url, "thumb_url": turl, "version": v + 1, "timeline": clean(p["timeline"], pid),
                "rendered_at": datetime.datetime.utcnow().isoformat() + "Z",
                "render_log": "\n".join(notes + [f"rendered in {int(time.time() - t0)} s, {p['timeline'].get('total')} s long"])[:4000]})
    shutil.rmtree(tmp, ignore_errors=True)
    return url, turl, notes

def main():
    global LOCAL
    if len(sys.argv) >= 4 and sys.argv[1] == "--local":
        LOCAL = True
        tl = json.load(open(sys.argv[2])); p = {"id": "local", "timeline": tl, "aspect": tl.get("aspect", "9:16"), "audience": tl.get("audience", "kids"), "night_date": tl.get("night_date")}
        out, thumb, notes = one(p, {}, Spend({}))
        shutil.copy(out, sys.argv[3]); shutil.copy(thumb, re.sub(r"\.mp4$", ".jpg", sys.argv[3]))
        for n in notes: log(n)
        print(json.dumps({"total": tl.get("total"), "scenes": [(s.get("start"), s.get("dur")) for s in tl["scenes"]]})); return 0
    if not (mm.URL and mm.KEY): print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing"); return 1
    st = settings()
    st["env"] = {"elevenlabs": bool(mm.ELEVEN), "grok": bool(XAI), "heygen": bool(HEYGEN), "openai": bool(mm.OPENAI),
                 "replicate": bool(mm.REPLICATE), "at": datetime.datetime.utcnow().isoformat() + "Z"}
    spend = Spend(st)
    first = os.environ.get("STUDIO_ID", "").strip()
    rows = mm.sb_get("video_projects?select=*&status=in.(queued,building)&order=created_at.asc&limit=10")
    if first: rows = sorted(rows, key=lambda r: r["id"] != first)
    stale = datetime.datetime.utcnow() - datetime.timedelta(minutes=40)
    todo = [r for r in rows if r["status"] == "queued" or r["id"] == first or
            datetime.datetime.fromisoformat(str(r["updated_at"]).replace("Z", "+00:00")).replace(tzinfo=None) < stale][:LIMIT]
    if not todo: print("studio: nothing waiting"); st["spent"] = spend.spent; save_settings(st); return 0
    for p in todo:
        try:
            url, _t, notes = one(p, st, spend)
            print(f"  studio: {p['title'][:50]} -> {url}"); [log(n) for n in notes]
        except Exception as e:
            print(f"  studio: {p['title'][:50]}: {e}")
            try: patch(p["id"], {"status": "failed", "render_error": str(e)[:600]})
            except Exception: pass
        st["spent"] = spend.spent; save_settings(st)
    return 0

if __name__ == "__main__":
    sys.exit(main())
