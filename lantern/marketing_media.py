#!/usr/bin/env python3
"""marketing_media.py - turn the Marketing Desk's drafts into finished media.

THE PICTURE RULE (the owner's brand, every time):
  Kids-audience pieces are built from the night's OWN book illustrations - the
  pictures already drawn for that story, with Beau, Scout, Willow and Wren as
  they really look. Nothing is invented. When a piece has no night (an idea) or
  the night has no pictures, a picture is generated WITH the brand kit as
  reference images (lantern/brand/: the four Travelers and the cast sheet), so
  the characters stay the same from one day to the next.
  Parents-audience pieces use one fixed presenter (lantern/brand/presenter.png,
  made once from the kit and kept), so the "face" of the parent videos never
  changes either.

For every fresh draft in marketing_items that has no media yet:
  image  - a brand panel: the illustration framed on navy with the hook in gold,
           in the shape the platform wants (2:3 for Pinterest, 4:5 for the feeds).
  video  - for reels / shorts / videos: the script's spoken lines are read by
           ElevenLabs; each line becomes a captioned frame (a different story
           picture each line, the on-screen text large, the spoken words as
           burned-in captions), and ffmpeg stitches frames + voice + a brand
           end card into a 1080x1920 mp4.
Both land in the public "marketing" bucket and the row gets media_url. The
poster (marketing-post) only sends pieces that have media.

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY (generated pictures),
     ELEVENLABS_API_KEY (voice), ELEVENLABS_VOICE_ID (optional), MEDIA_LIMIT (default 8).
Runs on the Action's Ubuntu runner (ffmpeg installed by the workflow, DejaVu fonts present).
"""
import os, re, io, json, glob, base64, subprocess, tempfile, urllib.request, urllib.error, uuid, sys

URL   = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY   = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OPENAI = os.environ.get("OPENAI_API_KEY", "")
ELEVEN = os.environ.get("ELEVENLABS_API_KEY", "")
# The Action passes this variable even when the secret is empty, so an empty
# string must fall through to the default - `.get(..., default)` did not, and
# the voice URL ended in nothing, which ElevenLabs answered with 404.
VOICE  = os.environ.get("ELEVENLABS_VOICE_ID", "").strip() or "21m00Tcm4TlvDq8ikWAM"   # Rachel - warm, clear
LIMIT  = int(os.environ.get("MEDIA_LIMIT", "8"))
HERE   = os.path.dirname(os.path.abspath(__file__))
ROOT   = os.path.abspath(os.path.join(HERE, ".."))
LOGO   = os.path.join(ROOT, "images", "logo-badge.jpg")
BRAND  = os.path.join(HERE, "brand")
CAST   = os.path.join(BRAND, "travelers-cast.jpg")
TRAVELERS = ["beau", "scout", "willow", "wren"]
PRESENTER = os.path.join(BRAND, "presenter.png")
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
NAVY, GOLD, CREAM, TEAL = (27, 45, 95), (245, 197, 24), (251, 247, 234), (91, 211, 220)
SOCIAL = {"instagram", "facebook", "tiktok", "pinterest", "youtube"}
VIDEO_FORMATS = {"reel", "short", "video"}

# How the Travelers really look - sent with every generated picture so the
# model draws THESE children, not new ones.
CAST_TEXT = ("The four Little Scripture Travelers, exactly as in the reference images: "
             "Beau the Brave (boy, dark curly hair, brown tunic with rope belt), "
             "Scout the Seeker (boy, blond spiky hair, green tunic), "
             "Willow the Warm (girl, long red curly hair, purple headband, purple dress), "
             "Wren the Wonderer (girl, black curly hair, gold headband, coral-red dress). "
             "Bright storybook cartoon, warm rounded faces, big eyes, sandals; "
             "navy night sky with gold stars where a sky shows. Same faces, same clothes, same style as the references.")
PRESENTER_TEXT = ("A warm, real-looking mother in her thirties, natural smile, soft brown hair, "
                  "simple cream sweater, photoreal, sitting on the edge of a child's bed in soft evening lamplight, "
                  "a children's storybook in her lap. Not a cartoon. Portrait framing, calm and kind.")

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

# ---------------------------------------------------------------- the night's own pictures
def night_pictures(night_date):
    """The book illustrations drawn for this night, in page order. [] if none."""
    if not night_date: return []
    for f in glob.glob(os.path.join(HERE, "*", "night.json")):
        try: n = json.load(open(f))
        except Exception: continue
        if n.get("publish_date") != night_date: continue
        page = n.get("book_page") or ""                      # stories/sep-12-a-time-for-everything.html
        m = re.search(r"/([a-z]{3}-\d{2})-", page)
        if m:
            pics = sorted(glob.glob(os.path.join(ROOT, "images", "book", m.group(1) + "-*.jpg")))
            if pics: return pics
        # a night with no book page yet: any pictures kept in its own folder
        pics = sorted(glob.glob(os.path.join(os.path.dirname(f), "*.jpg")) + glob.glob(os.path.join(os.path.dirname(f), "*.png")))
        return [p for p in pics if "lullaby" not in os.path.basename(p)]
    return []

# ---------------------------------------------------------------- generated pictures (with the kit as reference)
def _multipart(fields, files):
    bnd = "----lst" + uuid.uuid4().hex
    out = io.BytesIO()
    for k, v in fields.items():
        out.write(f"--{bnd}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode("utf-8"))
    for k, (fname, data, ctype) in files:
        out.write(f"--{bnd}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{fname}\"\r\nContent-Type: {ctype}\r\n\r\n".encode("utf-8"))
        out.write(data); out.write(b"\r\n")
    out.write(f"--{bnd}--\r\n".encode("utf-8"))
    return out.getvalue(), "multipart/form-data; boundary=" + bnd

def _image_result(s, b, what):
    if s != 200: raise RuntimeError(f"OpenAI {what}: {s} {b[:200]!r}")
    d = json.loads(b)["data"][0]
    if d.get("b64_json"): return base64.b64decode(d["b64_json"])
    s2, b2 = http("GET", d["url"]); return b2

def generate(prompt, size="1024x1536"):
    """A picture from words alone (only for the presenter's first sitting)."""
    if not OPENAI: raise RuntimeError("OPENAI_API_KEY is not set")
    body = {"model": "gpt-image-1", "prompt": prompt[:3500], "n": 1, "size": size, "quality": "medium"}
    s, b = http("POST", "https://api.openai.com/v1/images/generations", body,
                {"Authorization": "Bearer " + OPENAI, "Content-Type": "application/json"}, timeout=300)
    return _image_result(s, b, "images")

def generate_with_refs(prompt, ref_paths, size="1024x1536"):
    """A picture drawn from reference images - the way to keep the same characters."""
    if not OPENAI: raise RuntimeError("OPENAI_API_KEY is not set")
    files = []
    for p in ref_paths:
        if os.path.exists(p):
            ctype = "image/png" if p.lower().endswith(".png") else "image/jpeg"
            files.append(("image[]", (os.path.basename(p), open(p, "rb").read(), ctype)))
    if not files: return generate(prompt, size)
    body, ctype = _multipart({"model": "gpt-image-1", "prompt": prompt[:3500], "n": "1", "size": size, "quality": "medium"}, files)
    s, b = http("POST", "https://api.openai.com/v1/images/edits", raw=body,
                headers={"Authorization": "Bearer " + OPENAI, "Content-Type": ctype}, timeout=400)
    return _image_result(s, b, "images/edits")

def kids_picture(prompt):
    refs = [CAST] + [os.path.join(BRAND, t + ".jpg") for t in TRAVELERS]
    return generate_with_refs(f"{CAST_TEXT}\n\nScene: {prompt}", refs)

def presenter_picture(prompt):
    """The one presenter, every time. Made once, kept in the brand kit (the Action commits it)."""
    if not os.path.exists(PRESENTER):
        os.makedirs(BRAND, exist_ok=True)
        open(PRESENTER, "wb").write(generate(PRESENTER_TEXT))
        print("  presenter: made the brand kit's presenter picture (kept for every future piece)")
    return generate_with_refs(f"The same woman as in the reference image - same face, hair and warmth - photoreal, not cartoon.\n\nScene: {prompt}", [PRESENTER])

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
    print(f"  voice: {ids.get(_VOICE, _VOICE)} ({len(voices)} in the account, list status {s})")
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

# ---------------------------------------------------------------- drawing
def font(bold, size):
    from PIL import ImageFont
    p = FONT_B if bold else FONT_R
    return ImageFont.truetype(p, size) if os.path.exists(p) else ImageFont.load_default()

def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= max_w: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def load_rgb(src):
    from PIL import Image
    return (Image.open(io.BytesIO(src)) if isinstance(src, (bytes, bytearray)) else Image.open(src)).convert("RGB")

def cover(im, W, H):
    r = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1))
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))

def rounded(im, radius):
    from PIL import Image, ImageDraw
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=radius, fill=255)
    out = im.convert("RGBA"); out.putalpha(mask); return out

def panel(pic, W, H, pic_top=None, pic_w=None):
    """The brand backdrop: the picture itself blurred and darkened behind, the
    picture framed in gold in front. Returns (RGB image, (top, bottom) of the frame)."""
    from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
    im = load_rgb(pic)
    bg = cover(im, W, H).filter(ImageFilter.GaussianBlur(28))
    bg = ImageEnhance.Brightness(bg).enhance(0.42)
    tint = Image.new("RGB", (W, H), NAVY)
    bg = Image.blend(bg, tint, 0.35)
    pw = pic_w or (W - 80)
    ph = int(im.height * pw / im.width)
    if ph > int(H * 0.62):                                     # a tall picture: fit the height instead
        ph = int(H * 0.62); pw = int(im.width * ph / im.height)
    top = pic_top if pic_top is not None else (H - ph) // 2
    left = (W - pw) // 2
    frame_ = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(frame_).rounded_rectangle([left - 8, top - 8, left + pw + 8, top + ph + 8], radius=38, fill=GOLD + (255,))
    bg = Image.alpha_composite(bg.convert("RGBA"), frame_)
    bg.alpha_composite(rounded(im.resize((pw, ph)), 30), (left, top))
    return bg.convert("RGB"), (top, top + ph)

def text_block(d, text, fnt, cx, y, max_w, fill, max_lines, step, stroke=(15, 25, 55), sw=3):
    for ln in wrap(d, text, fnt, max_w)[:max_lines]:
        d.text((cx, y), ln, font=fnt, fill=fill, anchor="mm", stroke_width=sw, stroke_fill=stroke); y += step
    return y

def still_image(pic, hook, W, H):
    """A feed picture: the illustration framed, the hook in gold above, the brand below."""
    from PIL import ImageDraw
    im, (top, bottom) = panel(pic, W, H, pic_top=int(H * 0.30))
    d = ImageDraw.Draw(im)
    fb = font(True, int(W * 0.062)); fr = font(False, int(W * 0.036))
    if hook: text_block(d, hook, fb, W / 2, int(H * 0.09), W - 140, GOLD, 4, int(W * 0.078))
    d.text((W / 2, bottom + int(H * 0.06)), "A new story every night - free in the app", font=fr, fill=CREAM, anchor="mm", stroke_width=2, stroke_fill=(15, 25, 55))
    d.text((W / 2, bottom + int(H * 0.105)), "Little Scripture Travelers", font=font(True, int(W * 0.04)), fill=TEAL, anchor="mm", stroke_width=2, stroke_fill=(15, 25, 55))
    return im

def frame(pic, overlay, caption, W=1080, H=1920):
    """One video frame: the picture framed mid-screen, on-screen text above, the spoken words below."""
    from PIL import ImageDraw
    im, (top, bottom) = panel(pic, W, H, pic_top=560, pic_w=1000)
    d = ImageDraw.Draw(im)
    fb, fr = font(True, 72), font(False, 50)
    if overlay:
        lines = wrap(d, overlay.upper(), fb, W - 160)[:3]
        y = 250 - (len(lines) - 1) * 44
        for ln in lines:
            d.text((W / 2, y), ln, font=fb, fill=GOLD, anchor="mm", stroke_width=4, stroke_fill=(15, 25, 55)); y += 88
    if caption:
        text_block(d, caption, fr, W / 2, bottom + 110, W - 200, CREAM, 4, 64)
    d.text((W / 2, H - 120), "Little Scripture Travelers", font=fr, fill=TEAL, anchor="mm", stroke_width=2, stroke_fill=(15, 25, 55))
    return im

def end_card(W=1080, H=1920):
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(im)
    try:
        logo = Image.open(LOGO).convert("RGB").resize((620, 620)); im.paste(logo, ((W - 620) // 2, 480))
    except Exception: pass
    d.text((W / 2, 1220), "A new story every night", font=font(True, 60), fill=GOLD, anchor="mm")
    d.text((W / 2, 1310), "littlescripturetravelers.com", font=font(False, 44), fill=CREAM, anchor="mm")
    return im

# ---------------------------------------------------------------- the video
def make_video(pics, lines):
    tmp = tempfile.mkdtemp(prefix="mkt-")
    concat, audio_parts = [], []
    for i, (spoken, overlay) in enumerate(lines):
        pic = pics[i % len(pics)]
        fpath = os.path.join(tmp, f"f{i:02d}.png"); frame(pic, overlay, spoken).save(fpath)
        if spoken:
            apath = os.path.join(tmp, f"a{i:02d}.mp3"); open(apath, "wb").write(tts(spoken)); dur = duration_of(apath) + 0.35
            audio_parts.append(apath)
        else:
            dur = 2.2
        concat.append((fpath, dur))
    ep = os.path.join(tmp, "end.png"); end_card().save(ep); concat.append((ep, 2.5))
    lst = os.path.join(tmp, "frames.txt")
    with open(lst, "w") as fh:
        for p, dur in concat: fh.write(f"file '{p}'\nduration {dur:.2f}\n")
        fh.write(f"file '{concat[-1][0]}'\n")
    silent = os.path.join(tmp, "silent.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-vf", "scale=1080:1920,format=yuv420p", "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", silent], check=True)
    out = os.path.join(tmp, "out.mp4")
    if audio_parts:
        alist = os.path.join(tmp, "audio.txt")
        with open(alist, "w") as fh:
            for p in audio_parts: fh.write(f"file '{p}'\n")
        voice = os.path.join(tmp, "voice.mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", alist, "-c", "copy", voice], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", voice, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out], check=True)
    else:
        out = silent
    thumb = os.path.join(tmp, "thumb.jpg"); frame(pics[0], lines[0][1] if lines else "", "").save(thumb, quality=88)
    return open(out, "rb").read(), open(thumb, "rb").read()

# ---------------------------------------------------------------- the pictures for one piece
def pictures_for(it):
    """The pictures a piece is built from, and where they came from."""
    audience = (it.get("audience") or "kids").lower()
    prompt = it.get("image_prompt") or it.get("title") or "a bedtime scripture story"
    if audience.startswith("parent"):
        return [presenter_picture(prompt)], "presenter"
    pics = night_pictures(it.get("night_date"))
    if pics: return pics, "the night's own illustrations"
    return [kids_picture(prompt)], "drawn from the brand kit"

def to_bytes(im, fmt="PNG"):
    buf = io.BytesIO(); im.save(buf, fmt, quality=90); return buf.getvalue()

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
            pics, source = pictures_for(it)
            hook = it.get("hook") or it.get("title") or ""
            if fmt in VIDEO_FORMATS or plat in ("tiktok", "youtube"):
                lines = parse_lines(it.get("body") or "")
                if not lines: lines = [(hook, hook)]
                mp4, thumb = make_video(pics, lines)
                patch = {"media_url": upload(f"{iid}/video.mp4", mp4, "video/mp4"), "media_type": "video",
                         "thumb_url": upload(f"{iid}/thumb.jpg", thumb, "image/jpeg"), "post_error": None}
            else:
                W, H = (1000, 1500) if plat == "pinterest" else (1080, 1350)
                png = to_bytes(still_image(pics[0], hook, W, H))
                image_url = upload(f"{iid}/image.png", png, "image/png")
                patch = {"media_url": image_url, "media_type": "image", "thumb_url": image_url, "post_error": None}
            sb_patch(iid, patch); done += 1
            print(f"  {plat:9s} {fmt:9s} {patch['media_type']:5s} {it.get('title','')[:44]}  [{source}]")
        except Exception as e:
            print(f"  {plat:9s} {it.get('title','')[:40]}: {e}")
            sb_patch(iid, {"post_error": f"media: {str(e)[:200]}"})
    print(f"marketing media: {done}/{len(todo)} rendered")
    return 0

if __name__ == "__main__":
    sys.exit(main())
