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
  THE TRAVELER RULE: when a piece names a Traveler (Beau, Scout, Willow, Wren),
  that Traveler's own portrait is shown - a video line that names one shows the
  portrait for that line, a hook that names one puts the portrait in the frame,
  and every other frame of such a piece carries the Traveler as a round badge.
  THE FULL-FRAME RULE: a story picture fills the whole social frame, edge to
  edge. The book pictures are landscape, so each is extended once to a tall
  2:3 picture (OpenAI images/edits with a mask - the original pixels are kept
  exactly, only the scene is continued beyond the edges) and kept under
  images/book/portrait/ (the Action commits it) - never cropped into a small box.
  THE CARDS RULE: the night's Morning Lantern cards (A Parent's Heart, Verse of
  the Day, Why This Story Matters, The Line to Carry, Conversation Starter,
  Apply It ...) go out exactly as the app shows them: card_shot.mjs opens the
  night's Lantern page in Chromium and photographs each card - the real card,
  fonts and colors - and the card sits by itself on the app's navy. A "card"
  piece is one card; a "carousel" piece is the hook slide, the cards, and a
  closing card. Never paraphrased, never redrawn. (If Chromium is not there,
  the card's words are set over the night's picture instead.)

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
PORTRAIT_DIR = os.path.join(ROOT, "images", "book", "portrait")
EXTEND_TEXT = ("Extend this children's storybook illustration outward to fill the whole tall frame. Continue the same "
               "scene, setting, lighting and painting style seamlessly beyond the current edges - more of the sky, "
               "ground, room or landscape. Do not add new characters, text or objects. Keep everything already in "
               "the picture exactly as it is.")
# The Lantern cards worth a slide, in the order they go out
CARD_PICKS = ["A Parent's Heart", "Verse of the Day", "The Heart of Tonight", "Why This Story Matters",
              "The Line to Carry", "Conversation Starter", "Apply It", "One Invitation", "Tonight's Story Connection"]
TRAVELER_RE = {t: re.compile(r"\b" + t + r"\b", re.I) for t in TRAVELERS}
def travelers_in(text):
    """Which Travelers a piece of text names, in cast order."""
    return [t for t in TRAVELERS if TRAVELER_RE[t].search(text or "")]
def portrait(named):
    """The picture for the Travelers named: one portrait, or the cast sheet for several."""
    return os.path.join(BRAND, named[0] + ".jpg") if len(named) == 1 else CAST
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

def night_folder(night_date):
    for f in glob.glob(os.path.join(HERE, "*", "night.json")):
        try:
            if json.load(open(f)).get("publish_date") == night_date: return os.path.dirname(f)
        except Exception: continue
    return None

def _plain(fragment):
    """HTML -> lines of plain text (paragraphs, list items and breaks kept as lines)."""
    import html as _h
    t = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", fragment)
    t = re.sub(r"<br\s*/?>", "\n", t, flags=re.I)
    t = re.sub(r"<li[^>]*>", "\n- ", t, flags=re.I)
    t = re.sub(r"</(p|li|h\d|div|blockquote|tr)>", "\n", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = _h.unescape(t).replace("\xa0", " ")
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in t.split("\n")]
    return [ln for ln in lines if ln]

def lantern_cards(night_date, edition="christian"):
    """The night's Morning Lantern cards as (label, text). The deep read holds
    every card of the quick and medium reads too. Public marketing reads the
    Christian edition (it speaks to every Christian family)."""
    folder = night_folder(night_date)
    if not folder: return []
    f = os.path.join(folder, f"morning-lantern-{edition}.html")
    if not os.path.exists(f): f = os.path.join(folder, "morning-lantern-lds.html")
    if not os.path.exists(f): return []
    html_ = open(f, encoding="utf-8", errors="ignore").read()
    m = re.search(r'id="tab-heavenly">(.*?)<!-- /heavenly -->', html_, re.S)
    part = m.group(1) if m else html_
    out = []
    for _cls, body in re.findall(r'<div class="card ([^"]*)">(.*?)</div>\s*(?=<div class="card |<!-- /heavenly|$)', part, re.S):
        lab = re.search(r'<div class="card-label[^"]*">(.*?)</div>', body, re.S)
        if lab:
            label = " ".join(_plain(lab.group(1))); rest = body[lab.end():]
        else:
            lines = _plain(body); label = lines[0] if lines else ""; rest = body
            rest = rest.replace(label, "", 1)
        label = re.sub(r"^[^A-Za-z0-9]+", "", label).strip()          # drop the star / emoji marks
        lines = _plain(rest)
        if label and lines: out.append((label, lines))
    return out

def card_shots(night_date, names, edition="christian"):
    """Photograph the named cards from the night's Lantern page, as the app shows
    them. [(label, png path)], skipping any card that was not found."""
    folder = night_folder(night_date)
    if not folder or not names: return []
    f = os.path.join(folder, f"morning-lantern-{edition}.html")
    if not os.path.exists(f): f = os.path.join(folder, "morning-lantern-lds.html")
    if not os.path.exists(f): return []
    out_dir = tempfile.mkdtemp(prefix="cards-")
    try:
        r = subprocess.run(["node", os.path.join(HERE, "card_shot.mjs"), f, out_dir, json.dumps(list(names))],
                           capture_output=True, text=True, timeout=240)
        if r.returncode != 0: raise RuntimeError((r.stderr or r.stdout).strip()[-300:])
        data = json.loads(r.stdout.strip().splitlines()[-1])
    except Exception as e:
        print(f"  card photos: {e} - falling back to set words"); return []
    return [(c["label"], c["file"]) for c in data.get("cards", []) if c.get("file")]

def card_picture(png, W, H):
    """One photographed card by itself on the app's navy, the brand line beneath."""
    from PIL import Image, ImageDraw
    card = Image.open(png).convert("RGBA")
    im = Image.new("RGB", (W, H), (10, 18, 40))
    max_w, max_h = W - 80, H - 230
    r = min(max_w / card.width, max_h / card.height, 1.25)
    card = card.resize((int(card.width * r), int(card.height * r)))
    x, y = (W - card.width) // 2, max(70, (H - 90 - card.height) // 2)
    shadow = Image.new("RGBA", (card.width + 60, card.height + 60), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([20, 34, card.width + 40, card.height + 50], radius=40, fill=(0, 0, 0, 110))
    from PIL import ImageFilter
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    im.paste(shadow, (x - 30, y - 30), shadow)
    im.paste(card, (x, y), card)
    d = ImageDraw.Draw(im)
    d.text((W / 2, H - 58), "Little Scripture Travelers  -  tonight's Morning Lantern", font=font(True, 30), fill=TEAL, anchor="mm")
    return im

def pick_cards(cards, body_text="", n=6):
    """Which cards go on the slides: the ones the writer named in the body (by
    name, one per line), else the standing picks, in order."""
    def find(name):
        key = name.lower()
        return next((c for c in cards if key in c[0].lower()), None)
    chosen = []
    for ln in (body_text or "").splitlines():
        ln = re.sub(r"^\s*(slide\s*\d+\s*[:.)-]\s*|\d+[.)]\s*|[-*]\s*)", "", ln, flags=re.I).strip()
        c = find(ln) if len(ln) > 5 else None
        if c and c not in chosen: chosen.append(c)
    if not chosen:
        for name in CARD_PICKS:
            c = find(name)
            if c and c not in chosen: chosen.append(c)
    return chosen[:n]

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

def portrait_of(pic):
    """A tall 2:3 (1024x1536) version of a picture with the scene continued
    beyond its edges, so it fills a social frame edge to edge. Made once
    (OpenAI images/edits with a mask; the original pixels are pasted back
    exactly), kept under images/book/portrait/. Without a key, or if the
    extension fails, the picture sits on a blurred, darkened copy of itself
    (not cached, so a later run can still extend it properly)."""
    from PIL import Image, ImageFilter, ImageEnhance
    src = pic if isinstance(pic, str) else None
    name = (os.path.splitext(os.path.basename(src))[0] if src else "gen-" + uuid.uuid4().hex[:8]) + ".jpg"
    cached = os.path.join(PORTRAIT_DIR, name)
    if src and os.path.exists(cached): return cached
    im = load_rgb(pic)
    W, H = 1024, 1536
    if im.height >= im.width * 1.4: return pic                 # already tall - nothing to extend
    r = 864 / im.width; iw, ih = 864, int(im.height * r)
    if ih > 1300: r = 1300 / im.height; iw, ih = int(im.width * r), 1300
    small = im.resize((iw, ih)); x, y = (W - iw) // 2, (H - ih) // 2
    out = None
    if OPENAI and src:
        try:
            canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0)); canvas.paste(small, (x, y))
            data = to_bytes(canvas, "PNG")
            body, ctype = _multipart({"model": "gpt-image-1", "prompt": EXTEND_TEXT, "n": "1", "size": f"{W}x{H}", "quality": "medium"},
                                     [("image", ("scene.png", data, "image/png")), ("mask", ("mask.png", data, "image/png"))])
            st, b = http("POST", "https://api.openai.com/v1/images/edits", raw=body,
                         headers={"Authorization": "Bearer " + OPENAI, "Content-Type": ctype}, timeout=400)
            out = load_rgb(_image_result(st, b, "images/edits")).resize((W, H))
            out.paste(small, (x, y))                            # the original, untouched
            os.makedirs(PORTRAIT_DIR, exist_ok=True); out.save(cached, quality=92)
            print(f"  extended {name} to fill the frame")
            return cached
        except Exception as e:
            print(f"  extend {name}: {e} - using a blurred fill this time")
    bg = cover(im, W, H).filter(ImageFilter.GaussianBlur(30))
    bg = ImageEnhance.Brightness(bg).enhance(0.55); bg.paste(small, (x, y))
    tmp = os.path.join(tempfile.gettempdir(), "lst-fill-" + name); bg.save(tmp, quality=92)
    return tmp

def bands(im, top_h, bottom_h):
    """Soft navy fades at the top and bottom so words read over any picture."""
    from PIL import Image, ImageDraw
    W, H = im.size
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shade)
    for y in range(0, top_h):    sd.line([(0, y), (W, y)], fill=(12, 20, 48, int(215 * (1 - y / top_h) ** 1.2)))
    for y in range(H - bottom_h, H): sd.line([(0, y), (W, y)], fill=(12, 20, 48, int(230 * ((y - (H - bottom_h)) / bottom_h) ** 1.2)))
    return Image.alpha_composite(im.convert("RGBA"), shade).convert("RGB")

def full(pic, W, H):
    """The picture filling the whole frame."""
    return cover(load_rgb(portrait_of(pic)), W, H)

def badge(im, who, cx, cy, size):
    """A Traveler's face in a round gold ring, centred on (cx, cy)."""
    from PIL import Image, ImageDraw
    if not who: return im
    face = load_rgb(os.path.join(BRAND, who + ".jpg"))
    side = min(face.width, face.height)
    face = face.crop(((face.width - side) // 2, 0, (face.width - side) // 2 + side, side)).resize((size, size))
    mask = Image.new("L", (size, size), 0); ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    out = im.convert("RGBA")
    ring = Image.new("RGBA", out.size, (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([cx - size // 2 - 7, cy - size // 2 - 7, cx + size // 2 + 7, cy + size // 2 + 7], fill=GOLD + (255,))
    out = Image.alpha_composite(out, ring)
    out.paste(face, (cx - size // 2, cy - size // 2), mask)
    return out.convert("RGB")

def text_block(d, text, fnt, cx, y, max_w, fill, max_lines, step, stroke=(15, 25, 55), sw=3):
    for ln in wrap(d, text, fnt, max_w)[:max_lines]:
        d.text((cx, y), ln, font=fnt, fill=fill, anchor="mm", stroke_width=sw, stroke_fill=stroke); y += step
    return y

def still_image(pic, hook, W, H, who=None):
    """A feed picture: the illustration edge to edge, the hook in gold at the top, the brand at the bottom."""
    from PIL import ImageDraw
    im = bands(full(pic, W, H), int(H * 0.34), int(H * 0.22))
    if who: im = badge(im, who, W - 130, int(H * 0.40), 200)
    d = ImageDraw.Draw(im)
    fb = font(True, int(W * 0.064)); fr = font(False, int(W * 0.034))
    if hook: text_block(d, hook, fb, W / 2, int(H * 0.075), W - 120, GOLD, 4, int(W * 0.08), sw=4)
    d.text((W / 2, H - int(H * 0.085)), "A new story every night - free in the app", font=fr, fill=CREAM, anchor="mm", stroke_width=2, stroke_fill=(15, 25, 55))
    d.text((W / 2, H - int(H * 0.045)), "Little Scripture Travelers", font=font(True, int(W * 0.038)), fill=TEAL, anchor="mm", stroke_width=2, stroke_fill=(15, 25, 55))
    return im

def frame(pic, overlay, caption, W=1080, H=1920, who=None):
    """One video frame: the picture edge to edge, the on-screen text at the top, the spoken words at the bottom."""
    from PIL import ImageDraw
    im = bands(full(pic, W, H), 640, 760)
    if who: im = badge(im, who, W - 150, 760, 240)
    d = ImageDraw.Draw(im)
    fb, fr = font(True, 74), font(False, 50)
    if overlay:
        lines = wrap(d, overlay.upper(), fb, W - 140)[:3]
        y = 250 - (len(lines) - 1) * 45
        for ln in lines:
            d.text((W / 2, y), ln, font=fb, fill=GOLD, anchor="mm", stroke_width=4, stroke_fill=(15, 25, 55)); y += 90
    if caption:
        lines = wrap(d, caption, fr, W - 180)[:5]
        y = H - 470 - (len(lines) - 1) * 32
        for ln in lines:
            d.text((W / 2, y), ln, font=fr, fill=CREAM, anchor="mm", stroke_width=3, stroke_fill=(15, 25, 55)); y += 64
    d.text((W / 2, H - 150), "Little Scripture Travelers", font=fr, fill=TEAL, anchor="mm", stroke_width=2, stroke_fill=(15, 25, 55))
    return im

def trim_lines(lines, limit):
    """The first lines of a card up to `limit` characters, the last one cut at a sentence end."""
    out, used = [], 0
    for ln in lines:
        if used + len(ln) <= limit: out.append(ln); used += len(ln) + 1; continue
        room = limit - used
        if room > 60:
            cut = ln[:room]
            m = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "), cut.rfind('." '), cut.rfind('!" '), cut.rfind('?" '))
            if m > 40: out.append(cut[:m + 1])
            elif len(out) < 2: out.append(cut.rsplit(" ", 1)[0] + "...")
        break
    return out or lines[:1]

def card_slide(pic, label, lines, W=1080, H=1350):
    """One Morning Lantern card over the night's picture: the label in gold, the card's own words in cream."""
    from PIL import Image, ImageDraw, ImageEnhance
    im = ImageEnhance.Brightness(full(pic, W, H)).enhance(0.42)
    im = Image.blend(im, Image.new("RGB", (W, H), NAVY), 0.30)
    d = ImageDraw.Draw(im)
    d.text((W / 2, 96), "Tonight's Morning Lantern", font=font(False, 34), fill=TEAL, anchor="mm")
    y = text_block(d, label, font(True, 58), W / 2, 176, W - 140, GOLD, 2, 68, sw=3) + 20
    # the words: a slide holds one thought - the card's first ~420 characters, cut at a sentence end
    lines = trim_lines(lines, 420)
    for size, step in ((48, 62), (44, 57), (40, 52), (36, 47)):
        fnt = font(False, size); wrapped = []
        for ln in lines:
            wrapped += wrap(d, ln, fnt, W - 150) or [""]
        if y + len(wrapped) * step <= H - 150: break
    for ln in wrapped[:int((H - 150 - y) / step)]:
        d.text((W / 2, y), ln, font=fnt, fill=CREAM, anchor="mm", stroke_width=2, stroke_fill=(10, 16, 40)); y += step
    d.text((W / 2, H - 70), "Little Scripture Travelers", font=font(True, 34), fill=TEAL, anchor="mm")
    return im

def end_card(W=1080, H=1920):
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(im)
    size = int(W * 0.57); top = int(H * 0.22)
    try:
        logo = Image.open(LOGO).convert("RGB").resize((size, size)); im.paste(logo, ((W - size) // 2, top))
    except Exception: pass
    d.text((W / 2, top + size + int(H * 0.06)), "A new story every night", font=font(True, int(W * 0.055)), fill=GOLD, anchor="mm")
    d.text((W / 2, top + size + int(H * 0.11)), "littlescripturetravelers.com", font=font(False, int(W * 0.04)), fill=CREAM, anchor="mm")
    return im

# ---------------------------------------------------------------- the video
def make_video(pics, lines, who=None):
    """who: the Traveler this piece is about (badge on story frames). A line that
    names a Traveler shows that Traveler's portrait instead of a story picture."""
    tmp = tempfile.mkdtemp(prefix="mkt-")
    concat, audio_parts, story_i = [], [], 0
    for i, (spoken, overlay) in enumerate(lines):
        named = travelers_in(spoken + " " + overlay)
        if named: pic, mark = portrait(named), None
        else: pic, mark = pics[story_i % len(pics)], who; story_i += 1
        fpath = os.path.join(tmp, f"f{i:02d}.png"); frame(pic, overlay, spoken, who=mark).save(fpath)
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
    first = travelers_in(" ".join(lines[0]) if lines else "")
    thumb = os.path.join(tmp, "thumb.jpg"); frame(portrait(first) if first else pics[0], lines[0][1] if lines else "", "", who=None if first else who).save(thumb, quality=88)
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
            kids = not (it.get("audience") or "kids").lower().startswith("parent")
            # THE TRAVELER RULE: a piece that names a Traveler shows that Traveler
            about = travelers_in(" ".join(str(it.get(k) or "") for k in ("title", "hook", "body", "caption"))) if kids else []
            who = about[0] if len(about) == 1 else None
            if fmt in VIDEO_FORMATS or plat in ("tiktok", "youtube"):
                lines = parse_lines(it.get("body") or "")
                if not lines: lines = [(hook, hook)]
                mp4, thumb = make_video(pics, lines, who=who)
                patch = {"media_url": upload(f"{iid}/video.mp4", mp4, "video/mp4"), "media_type": "video",
                         "thumb_url": upload(f"{iid}/thumb.jpg", thumb, "image/jpeg"), "post_error": None}
            else:
                W, H = (1000, 1500) if plat == "pinterest" else (1080, 1350)
                in_hook = travelers_in(hook) if kids else []
                first = still_image(portrait(in_hook) if in_hook else pics[0], hook, W, H, who=None if in_hook else who)
                cards = pick_cards(lantern_cards(it.get("night_date")), it.get("body") or "", n=1 if fmt == "card" else 6) if fmt in ("carousel", "card") else []
                if cards:
                    # THE CARDS RULE: the Lantern's own cards, photographed as the app shows them
                    shots = card_shots(it.get("night_date"), [lab for lab, _ in cards])
                    if shots: card_imgs = [card_picture(png, W, H) for _lab, png in shots]
                    else:
                        backs = night_pictures(it.get("night_date")) or pics
                        card_imgs = [card_slide(backs[(i + 1) % len(backs)], lab, lines, W, H) for i, (lab, lines) in enumerate(cards)]
                    if fmt == "card":
                        image_url = upload(f"{iid}/image.png", to_bytes(card_imgs[0]), "image/png")
                        patch = {"media_url": image_url, "media_type": "image", "thumb_url": image_url, "post_error": None}
                        source = "the Lantern card: " + cards[0][0]
                    else:
                        slides = [first] + card_imgs + [end_card(W, H)]
                        urls = [upload(f"{iid}/slide-{n + 1:02d}.png", to_bytes(sl), "image/png") for n, sl in enumerate(slides[:10])]
                        patch = {"media_url": urls[0], "media_type": "image", "thumb_url": urls[0], "post_error": None,
                                 "meta": {**(it.get("meta") or {}), "slides": urls}}
                        source += f" + {len(card_imgs)} Lantern cards" + ("" if shots else " (set words)")
                else:
                    image_url = upload(f"{iid}/image.png", to_bytes(first), "image/png")
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
