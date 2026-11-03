"""9:16 social cut of the day's read-along: title page, the story page read aloud (camera on the words),
then Levi's like/share/subscribe line over a call-to-action card. Burned-in captions (most watch muted)."""
import json, subprocess, sys, numpy as np, soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# usage: vertical.py WORK OUT.mp4 LEVI.wav LEVI_CUES.json TITLE REF
#   WORK holds pages/p1.png p2.png front.png, p1.wav p2.wav, script.json and blocks2.json (the story
#   page's text boxes, in page pixels) written by readalong.py.
import os
WORK = sys.argv[1]; OUT = sys.argv[2]; LEVI = sys.argv[3]; LEVI_CUES = sys.argv[4]
TITLE, REF = sys.argv[5], sys.argv[6]
W, H, FPS, SR = 1080, 1920, 30, 48000
FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts') + '/'
def font(name, size, wght):
    f = ImageFont.truetype(FD + name, size)
    axes = f.get_variation_axes(); vals = [a['default'] for a in axes]
    for i, a in enumerate(axes):
        if a['name'] in (b'Weight', 'Weight'): vals[i] = wght
    f.set_variation_by_axes(vals); return f
F_TITLE = font('Fredoka.ttf', 78, 600); F_PILL = font('Fredoka.ttf', 38, 600); F_REF = font('Nunito.ttf', 42, 800)
F_CAP = font('Fredoka.ttf', 66, 600); F_BRAND = font('Fredoka.ttf', 36, 500); F_CTA = font('Fredoka.ttf', 50, 600); F_CTA2 = font('Nunito.ttf', 38, 700)
NAVY, GOLD, TEAL, CREAM = (20, 32, 74), (245, 197, 66), (127, 214, 201), (251, 247, 234)

# ---- background
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H * 0.42) / H) ** 2)
bg = np.zeros((H, W, 3), np.float32)
for c, (a, b) in enumerate(zip((38, 56, 110), (10, 16, 40))): bg[..., c] = a + (b - a) * np.clip(r / 0.75, 0, 1)
glow = np.exp(-(((xx - W / 2) / (W * 0.55)) ** 2 + ((yy - H * 0.52) / (H * 0.3)) ** 2))
bg[..., 0] += 60 * glow; bg[..., 1] += 45 * glow; bg[..., 2] += 20 * glow
rng = np.random.default_rng(4)
BG = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(BG)
for _ in range(140):
    x, y, s = rng.random() * W, rng.random() * H, rng.random() * 2.4 + 0.6; a = int(90 + rng.random() * 140)
    d.ellipse([x, y, x + s, y + s], fill=(255, 246, 216))

def text_center(dr, y, txt, f, fill, stroke=0, sfill=(0, 0, 0)):
    dr.text((W / 2, y), txt, font=f, fill=fill, anchor='mm', stroke_width=stroke, stroke_fill=sfill)

def wrap(txt, f, maxw, dr):
    words = txt.split(); lines = []; cur = ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if dr.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

# ---- top band drawn once
TOP = BG.copy(); dt = ImageDraw.Draw(TOP)
pill = 'Bedtime Scripture Story'; pw = dt.textlength(pill, font=F_PILL) + 56
dt.rounded_rectangle([W / 2 - pw / 2, 120, W / 2 + pw / 2, 186], radius=33, fill=GOLD)
text_center(dt, 153, pill, F_PILL, NAVY)
tl = wrap(TITLE, F_TITLE, 960, dt)
for i, l in enumerate(tl): text_center(dt, 262 + i * 86, l, F_TITLE, (255, 255, 255), 3, (10, 16, 40))
ref_y = 262 + len(tl) * 86 + 6; text_center(dt, ref_y, REF, F_REF, TEAL)
text_center(dt, H - 70, 'Little Scripture Travelers', F_BRAND, (207, 214, 245))
PANEL = (40, ref_y + 60, W - 40, ref_y + 60 + 1000)     # page window

pages = {k: Image.open(f'{WORK}/pages/{k}.png').convert('RGB') for k in ('p1', 'p2', 'front')}
def ease(x): x = max(0, min(1, x)); return x * x * (3 - 2 * x)
def page_view(img, cx, cy, z):
    """window onto the 1720px page: centre (cx,cy) in page px, zoom z (1 = whole page)."""
    pw_, ph_ = PANEL[2] - PANEL[0], PANEL[3] - PANEL[1]
    s = 1720 / z; half = s / 2
    cx = min(max(cx, half), 1720 - half); cy = min(max(cy, half * ph_ / pw_), 1720 - half * ph_ / pw_)
    box = (cx - half, cy - half * ph_ / pw_, cx + half, cy + half * ph_ / pw_)
    return img.resize((pw_, ph_), Image.LANCZOS, box=box)

# ---- audio pieces and their caption timing
def segments_from_silence(wav, n):
    a, sr = sf.read(wav, dtype='float32'); win = int(0.02 * sr)
    e = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, 'same')); q = e < 0.01 * e.max()
    gaps = []; i = 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if i > 0 and j < len(q): gaps.append((j - i, i / sr, j / sr))
            i = j
        else: i += 1
    cuts = sorted(sorted(gaps, reverse=True)[:n - 1], key=lambda g: g[1])
    bounds = []; st = 0.0
    for _, a0, b0 in cuts: bounds.append((st, a0)); st = b0
    bounds.append((st, len(a) / sr)); return bounds, len(a) / sr

def chunks(text, t0, t1, n=6):
    import re as _re
    parts = []
    for sent in _re.split(r'(?<=[.!?])\s+|(?<=[.!?][”"’])\s+', text.strip()):
        w = sent.split(); k = max(1, -(-len(w) // n)); per = -(-len(w) // k)
        parts += [' '.join(w[i:i + per]) for i in range(0, len(w), per)]
    tot = sum(len(p) for p in parts); out = []; t = t0
    for p in parts:
        d_ = (t1 - t0) * len(p) / tot; out.append((t, t + d_, p)); t += d_
    return out

S = json.load(open(f'{WORK}/script.json'))
caps = []
b1, d1 = segments_from_silence(f'{WORK}/p1.wav', len(S['p1']))
b2, d2 = segments_from_silence(f'{WORK}/p2.wav', len(S['p2']))
T1 = 0.4; T2 = T1 + d1 + 0.5
for (a0, a1), (txt, _) in zip(b1, S['p1']): caps += chunks(txt, T1 + a0, T1 + a1)
for (a0, a1), (txt, _) in zip(b2, S['p2']): caps += chunks(txt, T2 + a0, T2 + a1)
lc = json.load(open(LEVI_CUES)); la, lsr = sf.read(LEVI, dtype='float32')
l0 = lc['cues']['like']; levi = la[int(l0 * lsr):]
T3 = T2 + d2 + 1.2; d3 = len(levi) / lsr
like_txt = "If you enjoyed tonight's story, please give it a like, share it with a friend, and subscribe for more bedtime scripture stories."
bye0 = lc['cues']['bye'] - l0
caps += chunks(like_txt, T3, T3 + bye0 - 0.4); caps += [(T3 + bye0, T3 + d3, 'See you next time!')]
TOTAL = T3 + d3 + 1.0

# camera: for each paragraph, the box on the page that holds its words (from the PDF), in reading order
import re as _re
def _norm(w): return _re.sub(r"[^a-z0-9]", "", w.lower().replace("ﬂ", "fl").replace("ﬁ", "fi").replace("’", "'"))
try: BLOCKS = json.load(open(f'{WORK}/blocks2.json'))
except Exception: BLOCKS = []
stream = []                                   # (word, block index)
for bi, bl in enumerate(BLOCKS):
    for w_ in bl['text'].split():
        n_ = _norm(w_)
        if n_: stream.append((n_, bi))
words_only = [w_ for w_, _ in stream]
FULLP = (860, 860, 1.0)
def para_target(text, start_hint):
    ws = [_norm(w_) for w_ in text.split() if _norm(w_)]
    if len(ws) < 3 or not stream: return None, start_hint
    for i in range(start_hint, len(words_only) - 2):
        if words_only[i:i + 3] == ws[:3]:
            j = min(len(stream) - 1, i + len(ws) - 1)
            bis = sorted(set(b for _, b in stream[i:j + 1]))
            x0 = min(BLOCKS[b]['x0'] for b in bis); y0 = min(BLOCKS[b]['y0'] for b in bis)
            x1 = max(BLOCKS[b]['x1'] for b in bis); y1 = max(BLOCKS[b]['y1'] for b in bis)
            span = max(x1 - x0, y1 - y0) * 1.18
            z = max(1.0, min(2.1, 1720 / max(1, span)))
            return ((x0 + x1) / 2, (y0 + y1) / 2, z), j + 1
    return None, start_hint
TARGETS = []; hint = 0
for (a0, a1), (txt, _) in zip(b2, S['p2']):
    tg, hint = para_target(txt, hint)
    TARGETS.append((T2 + a0, T2 + a1, tg or FULLP))
def cam_story(t):
    if t < T2: return FULLP
    prev = FULLP
    for k, (s0, s1, tg) in enumerate(TARGETS):
        nxt_start = TARGETS[k + 1][0] if k + 1 < len(TARGETS) else T2 + d2 + 0.6
        if t < nxt_start - 0.0:
            u = ease((t - (s0 - 0.5)) / 0.9) if k > 0 else ease((t - T2) / 0.7)
            drift = 18 * ease((t - s0) / max(1, s1 - s0))            # a slow drift down the lines
            cur = (tg[0], tg[1] - 9 + drift, tg[2])
            return tuple(prev[i] + (cur[i] - prev[i]) * u for i in range(3))
        prev = (tg[0], tg[1] + 9, tg[2])
    u = ease((t - (T2 + d2)) / 1.0); return tuple(prev[i] + (FULLP[i] - prev[i]) * u for i in range(3))

# ---- CTA card (drawn once)
CTA = BG.copy(); dc = ImageDraw.Draw(CTA)
cov = pages['front'].resize((560, 560), Image.LANCZOS)
sh = Image.new('RGBA', (640, 640), (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle([40, 50, 600, 610], fill=(0, 0, 0, 170))
CTA.paste(sh.filter(ImageFilter.GaussianBlur(18)), (220, 160), sh.filter(ImageFilter.GaussianBlur(18)))
CTA.paste(cov, (260, 180))
text_center(dc, 820, 'Watch the full read-along', F_CTA, (255, 255, 255)); text_center(dc, 880, 'on YouTube', F_CTA, GOLD)
rows = ['📖  Paperback: Morning by Morning on Amazon', '📱  Every story in the Little Scripture Travelers app', '🌙  littlescripturetravelers.com']
rows = ['Paperback: Morning by Morning on Amazon', 'Every night\'s story in our app', 'littlescripturetravelers.com']
for i, rw in enumerate(rows):
    y = 975 + i * 78; dc.rounded_rectangle([110, y - 32, W - 110, y + 32], radius=32, fill=(34, 50, 100), outline=(245, 197, 66), width=2)
    text_center(dc, y, rw, F_CTA2, CREAM)
for i, (lab, col) in enumerate([('Like', (60, 74, 120)), ('Share', (60, 74, 120)), ('Subscribe', (230, 33, 23))]):
    x0 = [150, 410, 670][i]; dc.rounded_rectangle([x0, 1240, x0 + (230 if i < 2 else 280), 1316], radius=38, fill=col)
    dc.text((x0 + (115 if i < 2 else 140), 1278), lab, font=F_CTA2, fill=(255, 255, 255), anchor='mm')
text_center(dc, 1400, 'Link in bio', F_CTA2, TEAL)

# ---- frames
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', OUT + '.video.mp4'], stdin=subprocess.PIPE)
n = int(TOTAL * FPS)
def caption_at(t):
    for a0, a1, txt in caps:
        if a0 <= t < a1 + 0.15: return txt
    return ''
for i in range(n):
    t = i / FPS
    if t < T3 - 0.5:
        fr = TOP.copy()
        if t < T2 - 0.25:
            z = 1.0 + 0.06 * ease(t / max(1, T2)); view = page_view(pages['p1'], 860, 860, z)
        else:
            view = page_view(pages['p2'], *cam_story(t))
        # page turn: quick slide between p1 and p2
        if T2 - 0.5 <= t < T2:
            u = ease((t - (T2 - 0.5)) / 0.5); a_ = page_view(pages['p1'], 860, 860, 1.06); b_ = page_view(pages['p2'], 860, 860, 1.0)
            view = Image.new('RGB', a_.size); dx = int(a_.width * u); view.paste(b_, (0, 0)); view.paste(a_.crop((dx, 0, a_.width, a_.height)), (0, 0))
        m = Image.new('L', view.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, view.width - 1, view.height - 1], radius=26, fill=255)
        fr.paste(view, (PANEL[0], PANEL[1]), m)
    else:
        fr = CTA.copy()
    cap = caption_at(t)
    if cap:
        dr = ImageDraw.Draw(fr); lines = wrap(cap, F_CAP, 940, dr)
        y0 = (1620 if t < T3 - 0.5 else 1560) - (len(lines) - 1) * 40
        for k, l in enumerate(lines): text_center(dr, y0 + k * 80, l, F_CAP, (255, 255, 255), 6, (10, 16, 40))
    a = np.asarray(fr)
    if i < 8: a = (a * (i / 8)).astype(np.uint8)
    if i > n - 20: a = (a * ((n - i) / 20)).astype(np.uint8)
    ff.stdin.write(a.tobytes())
ff.stdin.close(); ff.wait()

# ---- audio
track = np.zeros(int((TOTAL + 1) * SR), np.float32)
def place(sig, sr, t0):
    s = np.interp(np.arange(int(len(sig) * SR / sr)) * sr / SR, np.arange(len(sig)), sig).astype(np.float32)
    i = int(t0 * SR); track[i:i + len(s)] += s[:len(track) - i]
for k, t0 in (('p1', T1), ('p2', T2)):
    a, sr = sf.read(f'{WORK}/{k}.wav', dtype='float32'); place(a * 0.92, sr, t0)
place(levi * 0.92, lsr, T3)
nf = int(0.8 * SR); x = rng.standard_normal(nf); f = np.fft.rfftfreq(nf, 1 / SR)
band = np.exp(-((np.log(f + 1) - np.log(2600)) ** 2) / (2 * 0.7 ** 2)); y = np.fft.irfft(np.fft.rfft(x) * band, nf)
tt = np.arange(nf) / SR; y = y / np.abs(y).max() * np.exp(-((tt - 0.3) / 0.13) ** 2) * 0.3
track[int((T2 - 0.5) * SR):int((T2 - 0.5) * SR) + nf] += y.astype(np.float32)
sf.write(OUT + '.wav', np.clip(track[:int(TOTAL * SR)], -0.98, 0.98), SR)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', OUT + '.video.mp4', '-i', OUT + '.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                '-shortest', '-movflags', '+faststart', OUT], check=True)
# cover frame for Reels / TikTok / Pinterest
cv = TOP.copy(); v = page_view(pages['p1'], 860, 860, 1.0)
m = Image.new('L', v.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, v.width - 1, v.height - 1], radius=26, fill=255); cv.paste(v, (PANEL[0], PANEL[1]), m)
cv.save(OUT.replace('.mp4', '-cover.jpg'), quality=92)
print('total', round(TOTAL, 1), 's; captions', len(caps))
