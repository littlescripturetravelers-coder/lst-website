#!/usr/bin/env python3
"""marketing_media.py - turn the Marketing Desk's drafts into finished media.

For every fresh draft in marketing_items that has no media yet:
  image  - made from the draft's own image_prompt with OpenAI's image model, in
           the shape the platform wants (2:3 for Pinterest, 9:16 for the rest).
  video  - for reels / shorts / videos: the script's spoken lines are read by
           ElevenLabs, each line becomes a captioned frame over the image (the
           on-screen text large, the spoken words as burned-in captions), and
           ffmpeg stitches frames + voice + a brand end card into a 1080x1920 mp4.
Both land in the public "marketing" bucket and the row gets media_url. The
poster (marketing-post) only sends pieces that have media.

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY (images),
     ELEVENLABS_API_KEY (voice), ELEVENLABS_VOICE_ID (optional), MEDIA_LIMIT (default 8).
Runs on the Action's Ubuntu runner (ffmpeg, DejaVu fonts present).
"""
import os, re, io, json, base64, subprocess, tempfile, urllib.request, urllib.error, time, sys

URL   = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY   = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OPENAI = os.environ.get("OPENAI_API_KEY", "")
ELEVEN = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE  = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")   # Rachel - warm, clear
LIMIT  = int(os.environ.get("MEDIA_LIMIT", "8"))
LOGO   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images", "logo-badge.jpg")
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
NAVY, GOLD, CREAM, TEAL = (27, 45, 95), (245, 197, 24), (251, 247, 234), (91, 211, 220)
SOCIAL = {"instagram", "facebook", "tiktok", "pinterest", "youtube"}
VIDEO_FORMATS = {"reel", "short", "video"}

def http(method, url, body=None, headers=None, raw=None, timeout=180):
    data = raw if raw is not None else (None if body is None else json.dumps(body).encode("utf-8"))
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, res.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()

def sb_get(path):
    s, b = http("GET", f"{URL}/rest/v1/{path}", headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    return json.loads(b.decode("utf-8", "ignore")) if s == 200 else []

def sb_patch(item_id, patch):
    s, b = http("PATCH", f"{URL}/rest/v1/marketing_items?id=eq.{item_id}", patch,
                {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json", "Prefer": "return=minimal"})
    return s in (200, 204)

def upload(path_in_bucket, data, content_type):
    s, b = http("POST", f"{URL}/storage/v1/object/marketing/{path_in_bucket}", raw=data,
                headers={"Authorization": "Bearer " + KEY, "Content-Type": content_type, "x-upsert": "true"}, timeout=300)
    if s not in (200, 201):
        raise RuntimeError(f"upload {path_in_bucket}: {s} {b[:200]!r}")
    return f"{URL}/storage/v1/object/public/marketing/{path_in_bucket}"

# ---------------------------------------------------------------- the image
def make_image(prompt, portrait=True):
    """OpenAI image from the draft's own prompt. Returns PNG bytes."""
    if not OPENAI: raise RuntimeError("OPENAI_API_KEY is not set")
    body = {"model": "gpt-image-1", "prompt": prompt[:3500], "n": 1,
            "size": "1024x1536" if portrait else "1024x1024", "quality": "medium"}
    s, b = http("POST", "https://api.openai.com/v1/images/generations", body,
                {"Authorization": "Bearer " + OPENAI, "Content-Type": "application/json"}, timeout=300)
    if s != 200: raise RuntimeError(f"OpenAI images: {s} {b[:200]!r}")
    d = json.loads(b)["data"][0]
    if d.get("b64_json"): return base64.b64decode(d["b64_json"])
    s2, b2 = http("GET", d["url"]); return b2

# ---------------------------------------------------------------- the voice
_VOICE = None
PREFERRED = ["Rachel", "Sarah", "Matilda", "Lily", "Alice", "Bella", "Jessica", "Charlotte", "Laura", "Aria"]
def resolve_voice():
    """A voice this account can actually use. The owner's ELEVENLABS_VOICE_ID if
    it is in the account; else the first warm premade voice we know by name;
    else whatever the account lists first. (A hard-coded id came back 404.)"""
    global _VOICE
    if _VOICE: return _VOICE
    s, b = http("GET", "https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": ELEVEN}, timeout=60)
    voices = json.loads(b).get("voices", []) if s == 200 else []
    ids = {v.get("voice_id"): v.get("name", "") for v in voices}
    env = os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    if env and env in ids: _VOICE = env
    else:
        by_name = {v.get("name", ""): v.get("voice_id") for v in voices}
        pick = next((by_name[n] for n in PREFERRED if n in by_name), None)
        _VOICE = pick or (voices[0].get("voice_id") if voices else env or VOICE)
    print(f"  voice: {ids.get(_VOICE, _VOICE)}")
    return _VOICE

def tts(text):
    """ElevenLabs reads one line. Returns mp3 bytes."""
    if not ELEVEN: raise RuntimeError("ELEVENLABS_API_KEY is not set")
    body = {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.2}}
    s, b = http("POST", f"https://api.elevenlabs.io/v1/text-to-speech/{resolve_voice()}?output_format=mp3_44100_128", body,
                {"xi-api-key": ELEVEN, "Content-Type": "application/json", "Accept": "audio/mpeg"}, timeout=180)
    if s != 200: raise RuntimeError(f"ElevenLabs: {s} {b[:200]!r}")
    return b

def duration_of(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
                         capture_output=True, text=True).stdout.strip()
    try: return max(0.8, float(out))
    except ValueError: return 3.0

# ---------------------------------------------------------------- the script
LINE_RE = re.compile(r"^\s*(?:\d+[.)]\s*|[-*]\s*)?(.*?)\s*(?:\[(.*?)\])?\s*$")
def parse_lines(body):
    """'1. spoken words [ON-SCREEN TEXT]' -> [(spoken, overlay)]. Lines with only an
    overlay keep it; empty lines are skipped; labels like HOOK: are stripped."""
    out = []
    for raw in (body or "").splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#"): continue
        raw = re.sub(r"^(HOOK|SCRIPT|CAPTION|CTA|LINE\s*\d+|SCENE\s*\d+)\s*:\s*", "", raw, flags=re.I)
        m = LINE_RE.match(raw)
        spoken, overlay = (m.group(1) or "").strip(), (m.group(2) or "").strip()
        spoken = re.sub(r"\s*\(.*?\)\s*$", "", spoken)          # trailing stage directions
        if not spoken and not overlay: continue
        out.append((spoken, overlay))
    return out[:14]

# ---------------------------------------------------------------- the frames
def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= max_w: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def frame(bg, overlay, caption, W=1080, H=1920):
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    im = bg.copy()
    # soft dark band top and bottom for readable text
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shade)
    for y in range(0, 620):  sd.line([(0, y), (W, y)], fill=(10, 18, 40, int(170 * (1 - y / 620))))
    for y in range(H - 760, H): sd.line([(0, y), (W, y)], fill=(10, 18, 40, int(200 * ((y - (H - 760)) / 760))))
    im = Image.alpha_composite(im.convert("RGBA"), shade)
    d = ImageDraw.Draw(im)
    fb = ImageFont.truetype(FONT_B, 72) if os.path.exists(FONT_B) else ImageFont.load_default()
    fr = ImageFont.truetype(FONT_R, 50) if os.path.exists(FONT_R) else ImageFont.load_default()
    if overlay:
        y = 300
        for ln in wrap(d, overlay.upper(), fb, W - 160)[:4]:
            d.text((W / 2, y), ln, font=fb, fill=GOLD, anchor="mm", stroke_width=4, stroke_fill=(15, 25, 55)); y += 88
    if caption:
        lines = wrap(d, caption, fr, W - 200)[:5]
        y = H - 560 - (len(lines) - 1) * 32
        for ln in lines:
            d.text((W / 2, y), ln, font=fr, fill=CREAM, anchor="mm", stroke_width=3, stroke_fill=(15, 25, 55)); y += 64
    d.text((W / 2, H - 300), "Little Scripture Travelers", font=fr, fill=TEAL, anchor="mm", stroke_width=2, stroke_fill=(15, 25, 55))
    return im.convert("RGB")

def cover(img_bytes, W=1080, H=1920):
    from PIL import Image
    im = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    r = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1))
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))

def end_card(W=1080, H=1920):
    from PIL import Image, ImageDraw, ImageFont
    im = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(im)
    try:
        logo = Image.open(LOGO).convert("RGB").resize((620, 620)); im.paste(logo, ((W - 620) // 2, 480))
    except Exception: pass
    fb = ImageFont.truetype(FONT_B, 60) if os.path.exists(FONT_B) else ImageFont.load_default()
    fr = ImageFont.truetype(FONT_R, 44) if os.path.exists(FONT_R) else ImageFont.load_default()
    d.text((W / 2, 1220), "A new story every night", font=fb, fill=GOLD, anchor="mm")
    d.text((W / 2, 1310), "littlescripturetravelers.com", font=fr, fill=CREAM, anchor="mm")
    return im

# ---------------------------------------------------------------- the video
def make_video(img_bytes, lines, item_id):
    tmp = tempfile.mkdtemp(prefix="mkt-")
    bg = cover(img_bytes)
    concat, audio_parts = [], []
    for i, (spoken, overlay) in enumerate(lines):
        fpath = os.path.join(tmp, f"f{i:02d}.png"); frame(bg, overlay, spoken).save(fpath)
        if spoken:
            apath = os.path.join(tmp, f"a{i:02d}.mp3"); open(apath, "wb").write(tts(spoken)); dur = duration_of(apath) + 0.35
            audio_parts.append(apath)
        else:
            dur = 2.2
        concat.append((fpath, dur))
    ep = os.path.join(tmp, "end.png"); end_card().save(ep); concat.append((ep, 2.5))
    # frames -> video
    lst = os.path.join(tmp, "frames.txt")
    with open(lst, "w") as fh:
        for p, dur in concat: fh.write(f"file '{p}'\nduration {dur:.2f}\n")
        fh.write(f"file '{concat[-1][0]}'\n")
    silent = os.path.join(tmp, "silent.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-vf", "scale=1080:1920,format=yuv420p", "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", silent], check=True)
    out = os.path.join(tmp, "out.mp4")
    if audio_parts:
        # voice lines in order, with the same gaps the frames have
        alist = os.path.join(tmp, "audio.txt")
        with open(alist, "w") as fh:
            for p in audio_parts: fh.write(f"file '{p}'\n")
        voice = os.path.join(tmp, "voice.mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", alist, "-c", "copy", voice], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", voice, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out], check=True)
    else:
        out = silent
    thumb = os.path.join(tmp, "thumb.jpg"); frame(bg, lines[0][1] if lines else "", "").save(thumb, quality=88)
    return open(out, "rb").read(), open(thumb, "rb").read()

# ---------------------------------------------------------------- the run
def main():
    if not (URL and KEY): print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing"); return 1
    rows = sb_get("marketing_items?select=*&media_url=is.null&status=in.(ready,approved)&order=created_at.desc&limit=40")
    todo = [r for r in rows if r.get("platform") in SOCIAL][:LIMIT]
    if not todo: print("marketing media: nothing waiting"); return 0
    done = 0
    for it in todo:
        iid = it["id"]; plat = it["platform"]; fmt = (it.get("format") or "").lower()
        try:
            prompt = it.get("image_prompt") or f"Storybook cartoon in the Little Scripture Travelers style: warm rounded characters, night sky, gold stars, navy and gold. {it.get('title','')}"
            img = make_image(prompt, portrait=True)
            image_url = upload(f"{iid}/image.png", img, "image/png")
            patch = {"media_url": image_url, "media_type": "image", "thumb_url": image_url, "post_error": None}
            if fmt in VIDEO_FORMATS or plat in ("tiktok", "youtube"):
                lines = parse_lines(it.get("body") or "")
                if not lines: lines = [(it.get("hook") or it.get("title") or "", it.get("hook") or "")]
                mp4, thumb = make_video(img, lines, iid)
                patch = {"media_url": upload(f"{iid}/video.mp4", mp4, "video/mp4"), "media_type": "video",
                         "thumb_url": upload(f"{iid}/thumb.jpg", thumb, "image/jpeg"), "post_error": None}
            sb_patch(iid, patch); done += 1
            print(f"  {plat:9s} {fmt:9s} {patch['media_type']:5s} {it.get('title','')[:50]}")
        except Exception as e:
            print(f"  {plat:9s} {it.get('title','')[:40]}: {e}")
            sb_patch(iid, {"post_error": f"media: {str(e)[:200]}"})
    print(f"marketing media: {done}/{len(todo)} rendered")
    return 0

if __name__ == "__main__":
    sys.exit(main())
