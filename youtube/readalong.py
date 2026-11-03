#!/usr/bin/env python3
"""
Daily read-along video: the Morning Lantern's story of the day as a page-flip book video.

Levi, 3 Nov 2026: "I want this to become a recurring [task] that happens each day with the morning
lantern's scripture of the day that automatically gets uploaded to YouTube."

What it does (python3 youtube/readalong.py --date YYYY-MM-DD):
  1. Finds the night the Morning Lantern published for that date (lantern/*/night.json, publish_date).
  2. Finds that night's five printed pages: the PDF (app.littlescripturetravelers.com/stories/pdf/<mon>/)
     and its words (lantern/book-text/<mon>/<Text File>).
  3. Narrates every page from those words (Kokoro voice, free, runs here). The grown-up
     "Parent Experience" box stays on screen and is not read aloud.
  4. Renders the book: the month's cover opens, the camera reads each page, and the page flips
     by itself the moment its narration ends; the book closes on the back cover.
  5. Adds the end card (Amazon paperback, app, website, like/share/subscribe) in Levi's own
     ElevenLabs voice, made once per month and kept in youtube/endcard-audio/<mon>/.
Output: youtube/out/<slug>.mp4, <slug>-thumb.jpg, <slug>-meta.json (upload_youtube.py sends them).
"""
import argparse, io, json, math, os, re, subprocess, sys, glob, urllib.request, shutil
from datetime import datetime, timedelta, timezone
import numpy as np, soundfile as sf
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
FPS, W, H, SR = 30, 1920, 1080, 48000
PDF_BASE = 'https://app.littlescripturetravelers.com/stories/pdf'
APP_URL = 'https://apps.apple.com/app/little-scripture-travelers/id6793999173'
SITE_URL = 'https://littlescripturetravelers.com'
LEVI_VOICE = 'Nz2AS3P86Xwn1ptANiRG'          # ElevenLabs "Levi" (professional clone)
KOKORO_VOICE = 'af_heart'

def log(*a): print('[readalong]', *a, flush=True)

# ---------------------------------------------------------------- 1. which night
def find_night(date):
    hits = []
    for p in glob.glob(os.path.join(REPO, 'lantern', '*', 'night.json')):
        try: d = json.load(open(p, encoding='utf-8'))
        except Exception: continue
        if d.get('publish_date') == date: hits.append(d)
    if not hits: return None
    if len(hits) > 1: log('more than one night for', date, [h['slug'] for h in hits], '- taking the first')
    return hits[0]

def find_book(book_no, night_no):
    for p in glob.glob(os.path.join(REPO, 'lantern', 'book-text', '*', 'index.json')):
        idx = json.load(open(p, encoding='utf-8'))
        if int(idx.get('book', -1)) != int(book_no): continue
        for row in idx['nights']:
            if int(row['Night']) == int(night_no):
                return os.path.basename(os.path.dirname(p)), idx, row
    return None, None, None

# ---------------------------------------------------------------- 2. words -> narration script
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()
def words(n):
    n = int(n)
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + ('' if n % 10 == 0 else '-' + ONES[n % 10])
    return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + words(n % 100))
ORD = {'1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth'}

def speak_ref(ref):
    """'Jeremiah 31:12–13' -> 'Jeremiah, chapter thirty-one, verses twelve and thirteen'."""
    out = []; last = ''
    for part in re.split(r';\s*', ref.strip()):
        if re.match(r'^\d+(:.*)?$', part.strip()) and last: part = last + ' ' + part.strip()
        mb = re.match(r'^((?:[1-4]\s+)?[A-Za-z][A-Za-z .&]*?)\s+\d', part.strip())
        if mb: last = mb.group(1)
        m = re.match(r'^(?:([1-4])\s+)?([A-Za-z][A-Za-z .&]*?)\s+(\d+)(?::(.+))?$', part.strip())
        if not m:
            out.append(part); continue
        num, name, ch, vs = m.groups()
        book = (ORD[num] + ' ' if num else '') + name.strip()
        psalm = name.strip().lower().startswith('psalm')
        s = f"{book}{'' if psalm else ', chapter'} {words(ch)}"
        if vs:
            items = [v.strip() for v in vs.split(',') if v.strip()]
            spoken = []; many = len(items) > 1
            for it in items:
                r = re.split(r'\s*[–—-]\s*', it)
                if len(r) == 2 and r[0].isdigit() and r[1].isdigit():
                    a, b = int(r[0]), int(r[1]); many = True
                    spoken.append(f"{words(a)} and {words(b)}" if b == a + 1 else f"{words(a)} through {words(b)}")
                elif it.isdigit(): spoken.append(words(it))
                else: spoken.append(it)
            s += f", verse{'s' if many else ''} " + ' and '.join(spoken)
        out.append(s)
    return '; '.join(out)

def clean(t):
    t = t.replace('&', 'and').replace('~', '').replace('·', ',')
    return re.sub(r'\s+', ' ', t).strip()

def join_wrapped(lines):
    """Layout text wraps sentences across lines; glue lines until one ends a sentence."""
    paras, cur = [], ''
    for ln in lines:
        ln = ln.strip()
        if not ln:
            if cur: paras.append(cur); cur = ''
            continue
        cur = (cur + ' ' + ln).strip()
        if re.search(r'[.!?]["”’\')]*$', cur): paras.append(cur); cur = ''
    if cur: paras.append(cur)
    return paras

def parse_pages(txt):
    pages = {}
    for m in re.finditer(r'=== page (\d+) ===\n(.*?)(?==== page|\Z)', txt, re.S):
        pages[int(m.group(1))] = [l.rstrip() for l in m.group(2).strip('\n').split('\n')]
    return pages

def script_for_night(txt, title, scripture, story_no):
    P = parse_pages(txt); S = {}
    # page 1 - title page
    S['p1'] = [(f"Story {words(story_no)}.", 0.5), (clean(title) + '.', 0.5), (speak_ref(scripture) + '.', 0.6)]
    # page 2 - the story (skip running header + repeated title)
    body = [l for l in P.get(2, [])[1:] if clean(l) and clean(l).lower() != clean(title).lower()]
    S['p2'] = [(clean(p), 0.6) for p in join_wrapped(body)]
    if S['p2']: S['p2'][-1] = (S['p2'][-1][0], 0.4)
    # page 3 - Traveler of the Night
    L = [l for l in P.get(3, [])[1:] if l.strip()]
    s3 = []
    if L and 'traveler of the night' in L[0].lower(): s3.append(("Scripture Traveler of the Night.", 0.4)); L = L[1:]
    if L: s3.append((clean(L[0]) + '.', 0.4)); L = L[1:]                      # name
    if L and not re.search(r'[.!?]', L[0]) and len(L[0]) < 60: s3.append((clean(L[0]) + '.', 0.3)); L = L[1:]   # virtue
    if L and L[0].strip().startswith(('“', '"')): s3.append((clean(L[0]).strip('“”"'), 0.6)); L = L[1:]          # motto
    s3 += [(clean(p), 0.5) for p in join_wrapped(L)]
    S['p3'] = s3
    # page 4 - Feeling Moment, Five Stones, Remember This
    L = [l for l in P.get(4, [])[1:]]
    s4 = []; i = 0; stones = []; mode = None; buf = []
    def flush():
        nonlocal buf
        if mode == 'move' and buf: s4.append((clean(' '.join(buf)), 1.6))
        buf = []
    remember = []
    while i < len(L):
        ln = L[i].strip(); low = ln.lower()
        if not ln: i += 1; continue
        if low == 'a feeling moment': s4.append(("A Feeling Moment.", 0.4))
        elif low.startswith('an activity'): s4.append((clean(ln) + '.', 0.6))
        elif re.match(r'^1\.\s*move', low): s4.append(("Move and imagine.", 0.4)); mode = 'move'
        elif re.match(r'^2\.\s*the five stones', low): flush(); s4.append(("The Five Stones.", 0.5)); mode = 'stones'
        elif low.startswith('remember this'):
            if mode == 'stones': pass
            mode = 'remember'
        elif mode == 'move': buf.append(ln)
        elif mode == 'stones':
            m = re.match(r'^(SPOT|NAME|FIND|FORK|CALM)\b\s*(.*)$', ln)
            if m: stones.append([m.group(1), m.group(2)])
            elif stones: stones[-1][1] += ' ' + ln
        elif mode == 'remember':
            if low.startswith('sweet boys'): pass
            else: remember.append(ln)
        i += 1
    if mode == 'move': flush()
    # stones were collected in order; put them right after "The Five Stones."
    for lab, t in stones:
        s4.append((lab.capitalize() + '.', 0.3))
        s4.append((clean(t), 1.2 if lab == 'FIND' else (1.0 if lab == 'CALM' else 0.5)))
    if remember:
        s4.append(("Remember this, sweet boys and girls.", 0.3)); s4.append((clean(' '.join(remember)), 0.4))
    S['p4'] = s4
    # page 5 - Parent Prompt questions only
    L = P.get(5, []); qs = []
    if L:
        seg = []; on = False
        for ln in L:
            low = ln.strip().lower()
            if low.startswith('question for the child'): on = True; continue
            if low.startswith('parent experience'): break
            if on: seg.append(ln.strip())
        joined = ' '.join(seg)
        qs = [clean(q) for q in re.findall(r'[“"]([^”"]+)[”"]', joined)] or [clean(q) for q in join_wrapped(seg)]
    S['p5'] = [("Question time!", 0.5)] + [(q, 2.0) for q in qs] if qs else []
    if S['p5']: S['p5'][-1] = (S['p5'][-1][0], 1.8)
    S['sweet'] = [("Sweet dreams, little traveler.", 0.6),
                  ("Until our next adventure, may these stories tuck themselves gently into your heart, like the warmth of a hug at the end of the day.", 0.5)]
    return S

# ---------------------------------------------------------------- 3. voices
_kokoro = None
def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        md = os.environ.get('KOKORO_DIR', os.path.join(HERE, '.models'))
        _kokoro = Kokoro(os.path.join(md, 'kokoro-v1.0.onnx'), os.path.join(md, 'voices-v1.0.bin'))
    return _kokoro

def tts_kokoro(segs, path, speed=0.86):
    k = kokoro(); parts = []; cues = []; t = 0.0
    for text, pause in segs:
        s, sr = k.create(text, voice=KOKORO_VOICE, speed=speed, lang='en-us')
        cues.append(t); s = s.astype(np.float32)
        parts += [s, np.zeros(int(pause * sr), np.float32)]; t += len(s) / sr + pause
    a = np.concatenate(parts); a = a / max(1e-6, np.abs(a).max()) * 0.89
    sf.write(path, a, sr); return cues, t

def tts_levi(segs, path):
    """Levi's own ElevenLabs voice, one request per sentence so each part of the card knows when it starts."""
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if not key: raise RuntimeError('no ELEVENLABS_API_KEY')
    parts = []; cues = []; t = 0.0; texts = [s for s, _ in segs]
    for i, (text, pause) in enumerate(segs):
        body = {'text': text, 'model_id': 'eleven_multilingual_v2',
                'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.15, 'use_speaker_boost': True},
                'previous_text': ' '.join(texts[:i])[-500:] or None, 'next_text': ' '.join(texts[i+1:])[:500] or None}
        req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{LEVI_VOICE}?output_format=mp3_44100_128',
                                     data=json.dumps(body).encode(), headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        mp3 = urllib.request.urlopen(req, timeout=120).read()
        tmp = path + f'.{i}.mp3'; open(tmp, 'wb').write(mp3)
        wav = tmp + '.wav'; subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-ar', '24000', wav], check=True)
        s, sr = sf.read(wav, dtype='float32'); os.remove(tmp); os.remove(wav)
        # trim leading/trailing silence so pauses are ours
        nz = np.where(np.abs(s) > 0.01)[0]
        if len(nz): s = s[max(0, nz[0] - 240): nz[-1] + 2400]
        cues.append(t); parts += [s, np.zeros(int(pause * sr), np.float32)]; t += len(s) / sr + pause
    a = np.concatenate(parts); a = a / max(1e-6, np.abs(a).max()) * 0.89
    sf.write(path, a, 24000); return cues, t

# ---------------------------------------------------------------- 4. pages
def render_pdf_pages(pdf_path, outdir):
    import pymupdf
    d = pymupdf.open(pdf_path); os.makedirs(outdir, exist_ok=True)
    if d.page_count < 5: raise SystemExit(f'{pdf_path} has {d.page_count} pages, expected 5')
    for i in range(5):
        p = d[i]; r = p.rect
        bleed = 9 if abs(r.width - 630) < 2 else 0          # 8.75in page = 8.5in trim + 0.125in bleed
        clip = pymupdf.Rect(r.x0 + bleed, r.y0 + bleed, r.x1 - bleed, r.y1 - bleed)
        pix = p.get_pixmap(dpi=200, clip=clip)
        im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples).resize((1720, 1720), Image.LANCZOS)
        im.save(os.path.join(outdir, f'p{i+1}.png'))

def month_cover(mon, idx):
    own = os.path.join(HERE, 'assets', mon, 'front.png')
    if os.path.exists(own): return own
    month = idx.get('month', '').lower()
    name = ('nt-' + month) if mon.startswith('n') and len(mon) == 4 else month
    web = os.path.join(REPO, 'images', f'book-cover-{name}.jpg')
    if os.path.exists(web): return web
    raise SystemExit(f'no cover for {mon}: add youtube/assets/{mon}/front.png or images/book-cover-{name}.jpg')

def amazon_link(book_title):
    try: html = open(os.path.join(REPO, 'books.html'), encoding='utf-8').read()
    except Exception: return ''
    m = re.search(r"title:\s*'" + re.escape(book_title.replace("'", "\\'")) + r"'\s*,\s*amazonHardcover:\s*'([^']*)'", html)
    if m and m.group(1): return m.group(1)
    m = re.search(r'title:\s*"' + re.escape(book_title) + r'"\s*,\s*amazonHardcover:\s*"([^"]*)"', html)
    return m.group(1) if m else ''

# ---------------------------------------------------------------- 5. video
def ease(x): x = max(0, min(1, x)); return x * x * (3 - 2 * x)

def build_story_video(work, leaves, spreads, audio_keys, out_mp4, out_wav):
    from playwright.sync_api import sync_playwright
    nleaves = len(leaves); FLIP_PAPER, FLIP_COVER = 54, 60
    shutil.copy(os.path.join(HERE, 'book.html'), os.path.join(work, 'book.html'))
    stills, flips = {}, {}
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
        pg.add_init_script(f'window.BOOK_LEAVES = {json.dumps(leaves)};')
        pg.goto('file://' + os.path.join(work, 'book.html')); pg.wait_for_timeout(2500)
        def snap(c, t):
            pg.evaluate(f'setState({c},{t})')
            return Image.open(io.BytesIO(pg.screenshot(type='png'))).convert('RGB')
        for c in range(nleaves + 1): stills[c] = snap(c, 0)
        for c in range(nleaves):
            n = FLIP_COVER if c in (0, nleaves - 1) else FLIP_PAPER
            flips[c] = [snap(c, (i + 1) / (n + 1)).resize((W, H), Image.LANCZOS) for i in range(n)]
            log('flip', c, 'rendered')
        b.close()
    FULL = (960, 540, 1.0)
    def page_cam(side, closed=False):
        if closed: return (960, 540, 1.18)
        return ((530 if side == 'L' else 1390), 540, 1.22)
    alen = lambda k: sf.info(os.path.join(work, f'{k}.wav')).duration
    segs, narr, fsnd = [], [], []; t = 0.0
    def cam(state, dur, a, b_, pan=False):
        nonlocal t; segs.append(('cam', state, dur, a, b_, pan)); t += dur
    def flip(c):
        nonlocal t; fsnd.append((t, 'cover' if c in (0, nleaves - 1) else 'paper')); segs.append(('flip', c)); t += len(flips[c]) / FPS
    cam(0, 1.2, FULL, FULL); cv = page_cam('L', True); cam(0, 1.4, FULL, cv)
    narr.append((t, 'cover')); cam(0, alen('cover'), cv, cv, True); cam(0, 1.0, cv, FULL); cam(0, 0.3, FULL, FULL); flip(0)
    for s in range(1, nleaves):
        Lk, Rk = spreads[s]
        cam(s, 0.6, FULL, FULL); a = page_cam('L'); cam(s, 1.3, FULL, a)
        narr.append((t, Lk)); cam(s, alen(Lk), a, a, True)
        b_ = page_cam('R'); cam(s, 1.4, a, b_)
        narr.append((t, Rk)); cam(s, alen(Rk), b_, b_, True)
        cam(s, 1.2, b_, FULL); cam(s, 0.3, FULL, FULL); flip(s)
    cam(nleaves, 3.0, FULL, FULL)
    total = t; log('story length', round(total, 1), 's')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out_mp4], stdin=subprocess.PIPE)
    fade_in, fade_out = FPS, int(1.2 * FPS); nf = int(round(total * FPS)); fi = 0
    def emit(arr):
        nonlocal fi
        if fi < fade_in: arr = (arr.astype(np.float32) * (fi / fade_in)).astype(np.uint8)
        if fi > nf - fade_out: arr = (arr.astype(np.float32) * max(0, (nf - fi) / fade_out)).astype(np.uint8)
        ff.stdin.write(arr.tobytes()); fi += 1
    def camera(img, cx, cy, s):
        a = 2 / s
        return img.transform((W, H), Image.AFFINE, (a, 0, 2 * cx - a * W / 2, 0, a, 2 * cy - a * H / 2), resample=Image.BICUBIC)
    acc = 0.0
    for sg in segs:
        if sg[0] == 'flip':
            for im in flips[sg[1]]: emit(np.asarray(im)); acc += 1 / FPS
            continue
        _, state, dur, a, b_, pan = sg
        n = int(round((acc + dur) * FPS)) - int(round(acc * FPS)); acc += dur
        img = stills[state]; last = None; lastkey = None
        for i in range(n):
            u = ease((i + 0.5) / max(1, n))
            cx = a[0] + (b_[0] - a[0]) * u; cy = a[1] + (b_[1] - a[1]) * u; s = a[2] + (b_[2] - a[2]) * u
            if pan: v = (i + 0.5) / n; s *= (1 + 0.06 * ease(v)); cy = cy - 6 + 12 * ease(v)
            key = (round(cx, 2), round(cy, 2), round(s, 4))
            if key != lastkey:
                last = np.asarray(img.resize((W, H), Image.LANCZOS)) if (s == 1.0 and cx == 960 and cy == 540) else np.asarray(camera(img, cx, cy, s))
                lastkey = key
            emit(last)
    ff.stdin.close(); ff.wait()
    # audio: narration at its cue + page-turn sounds
    rng = np.random.default_rng(3)
    def flip_sound(kind):
        d = 0.9 if kind == 'paper' else 1.2; n = int(d * SR); x = rng.standard_normal(n)
        f = np.fft.rfftfreq(n, 1 / SR)
        band = np.exp(-((np.log(f + 1) - np.log(2600 if kind == 'paper' else 1400)) ** 2) / (2 * 0.7 ** 2))
        y = np.fft.irfft(np.fft.rfft(x) * band, n); tt = np.arange(n) / SR
        env = np.exp(-((tt - 0.35 * d) / (0.16 * d)) ** 2)
        crk = (rng.random(n) < 0.0009) * rng.random(n) * 3; crk = np.convolve(crk, np.exp(-np.arange(200) / 40), 'same')
        y = y / np.abs(y).max() * env * 0.5 + np.fft.irfft(np.fft.rfft(crk) * band, n) * 0.25 * env
        if kind == 'cover': y = y + np.sin(2 * np.pi * 90 * tt) * np.exp(-np.maximum(0, tt - 0.75 * d) / 0.06) * (tt > 0.75 * d) * 0.35
        return (y / np.abs(y).max() * (0.32 if kind == 'paper' else 0.38)).astype(np.float32)
    track = np.zeros(int((total + 1) * SR), np.float32)
    def place(sig, t0):
        i = int(t0 * SR); track[i:i + len(sig)] += sig[:len(track) - i]
    for t0, k in narr:
        a, sr = sf.read(os.path.join(work, f'{k}.wav'), dtype='float32')
        a = np.interp(np.arange(int(len(a) * SR / sr)) * sr / SR, np.arange(len(a)), a).astype(np.float32)
        place(a * 0.92, t0)
    for t0, k in fsnd: place(flip_sound(k), t0)
    sf.write(out_wav, np.clip(track[:int(total * SR)], -0.98, 0.98), SR)
    return total, narr, fsnd

def build_endcard(work, card, audio_wav, cues, out_mp4):
    from playwright.sync_api import sync_playwright
    import qrcode
    for k in ('amazon', 'app', 'web'):
        url = card.get(k)
        if not url: continue
        q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=2); q.add_data(url); q.make(fit=True)
        q.make_image(fill_color='#14204a', back_color='white').save(os.path.join(work, f'qr_{k}.png'))
    shutil.copy(os.path.join(HERE, 'endcard.html'), os.path.join(work, 'endcard.html'))
    dur = cues['total'] + 1.2; n = int(dur * FPS); fade_in = FPS; fade_out = int(1.2 * FPS)
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-i', audio_wav, '-af', f'adelay=600|600,apad,afade=t=out:st={dur-1.0}:d=1.0', '-t', f'{dur}',
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', out_mp4],
                          stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': W, 'height': H})
        pg.add_init_script(f'window.CARD = {json.dumps(card)};')
        pg.goto('file://' + os.path.join(work, 'endcard.html')); pg.wait_for_timeout(1500)
        Cj = json.dumps({k: v + 0.6 for k, v in cues.items()})
        for i in range(n):
            pg.evaluate(f'render({i / FPS},{Cj})')
            a = np.asarray(Image.open(io.BytesIO(pg.screenshot(type='png'))).convert('RGB'))
            if i < fade_in: a = (a * (i / fade_in)).astype(np.uint8)
            if i > n - fade_out: a = (a * ((n - i) / fade_out)).astype(np.uint8)
            ff.stdin.write(a.tobytes())
        b.close()
    ff.stdin.close(); ff.wait()

def build_thumbnail(work, title, scripture, traveler, out_jpg):
    from playwright.sync_api import sync_playwright
    shutil.copy(os.path.join(HERE, 'thumb.html'), os.path.join(work, 'thumb.html'))
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.add_init_script(f'window.THUMB = {json.dumps({"title": title, "scripture": scripture, "traveler": traveler})};')
        pg.goto('file://' + os.path.join(work, 'thumb.html')); pg.wait_for_timeout(1500)
        pg.screenshot(path=out_jpg, type='jpeg', quality=90); b.close()

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--date', help='publish date YYYY-MM-DD (default: today in America/Denver)')
    ap.add_argument('--pdf', help='use this local PDF instead of downloading it')
    ap.add_argument('--out', default=os.path.join(HERE, 'out'))
    args = ap.parse_args()
    if args.date: date = args.date
    else:
        try:
            from zoneinfo import ZoneInfo; date = datetime.now(ZoneInfo('America/Denver')).strftime('%Y-%m-%d')
        except Exception: date = (datetime.now(timezone.utc) - timedelta(hours=7)).strftime('%Y-%m-%d')
    if os.path.exists(os.path.join(HERE, 'PAUSED')): log('youtube/PAUSED is present - nothing made'); return 3
    night = find_night(date)
    if not night: log(f'no Morning Lantern night has publish_date {date} - nothing to make'); return 2
    slug = night['slug']; title = night['title']; scripture = night['scripture']
    mon, idx, row = find_book(night['book'], night['night'] if 'night' in night else 0)
    # night.json's "night" is night-in-week; the index's Night is the story number - match on title as the truth
    if idx is None or clean(row['Title']).lower() != clean(title).lower():
        mon = idx = row = None
        for p in glob.glob(os.path.join(REPO, 'lantern', 'book-text', '*', 'index.json')):
            ix = json.load(open(p, encoding='utf-8'))
            if int(ix.get('book', -1)) != int(night['book']): continue
            for r in ix['nights']:
                if clean(r['Title']).lower() == clean(title).lower():
                    mon, idx, row = os.path.basename(os.path.dirname(p)), ix, r
    if row is None: raise SystemExit(f'night "{title}" (book {night["book"]}) is not in any lantern/book-text/*/index.json')
    story_no = int(row['Night']); log(f'{date}: {idx["bookTitle"]} story {story_no} "{title}" ({scripture}) [{mon}]')
    os.makedirs(args.out, exist_ok=True)
    work = os.path.join(args.out, f'work-{slug}'); pages = os.path.join(work, 'pages'); os.makedirs(pages, exist_ok=True)
    pdf = args.pdf or os.path.join(work, 'night.pdf')
    if not args.pdf:
        url = f'{PDF_BASE}/{mon}/{urllib.request.quote(row["PDF File"])}'; log('downloading', url)
        open(pdf, 'wb').write(urllib.request.urlopen(url, timeout=120).read())
    render_pdf_pages(pdf, pages)
    shutil.copy(month_cover(mon, idx), os.path.join(pages, 'front' + os.path.splitext(month_cover(mon, idx))[1]))
    front = 'front' + os.path.splitext(month_cover(mon, idx))[1]
    Image.open(os.path.join(pages, front)).convert('RGB').resize((1720, 1720), Image.LANCZOS).save(os.path.join(pages, 'front.png'))
    for n in ('back', 'sweet'): shutil.copy(os.path.join(HERE, 'assets', 'common', f'{n}.png'), os.path.join(pages, f'{n}.png'))
    shutil.copytree(os.path.join(HERE, 'fonts'), os.path.join(work, 'fonts'), dirs_exist_ok=True)
    # narration
    txt = open(os.path.join(REPO, 'lantern', 'book-text', mon, row['Text File']), encoding='utf-8').read()
    S = script_for_night(txt, title, scripture, story_no)
    S['cover'] = [("Little Scripture Travelers.", 0.5), (clean(idx['bookTitle']) + '.', 0.5), ("By Levi Lewis.", 0.4)]
    for k in ('p2', 'p3', 'p4', 'p5'):
        if not S[k]: raise SystemExit(f'page {k[1]} of {row["Text File"]} gave no words to read - check the text file')
    json.dump(S, open(os.path.join(work, 'script.json'), 'w'), indent=1, ensure_ascii=False)
    for k, segs in S.items(): tts_kokoro(segs, os.path.join(work, f'{k}.wav')); log('narrated', k)
    # the book: cover | p1, p2 | p3, p4 | p5, sweet | back
    leaves = [['front', 'p1', True], ['p2', 'p3', False], ['p4', 'p5', False], ['sweet', 'back', True]]
    spreads = {1: ('p1', 'p2'), 2: ('p3', 'p4'), 3: ('p5', 'sweet')}
    story_mp4 = os.path.join(work, 'story.mp4'); story_wav = os.path.join(work, 'story.wav')
    total, narr, fsnd = build_story_video(work, leaves, spreads, None, story_mp4, story_wav)
    story_av = os.path.join(work, 'story_av.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', story_mp4, '-i', story_wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-shortest', story_av], check=True)
    # end card (Levi's voice, once per month)
    amazon = amazon_link(idx['bookTitle'])
    book_no = int(idx['book']); label = f"Book {book_no if book_no <= 12 else book_no - 12} of 12 · {idx['month']}"
    lines = [("Thank you for joining us tonight!", 0.5, 'intro')]
    if amazon: lines.append((f"You can find the {clean(idx['bookTitle'])} paperback on Amazon, with a story for every day that lines up with Come, Follow Me.", 0.5, 'amazon'))
    lines += [("You can also read every story in the Little Scripture Travelers app, or on our website." if amazon else
               "You can read every story in the Little Scripture Travelers app, or on our website, with a story for every day that lines up with Come, Follow Me.", 0.4, 'app'),
              ("The links are in the description.", 0.6, 'links'),
              ("If you enjoyed tonight's story, please give it a like, share it with a friend, and subscribe for more bedtime scripture stories.", 0.5, 'like'),
              ("See you next time!", 0.8, 'bye')]
    cache = os.path.join(HERE, 'endcard-audio', mon); os.makedirs(cache, exist_ok=True)
    ec_wav = os.path.join(cache, 'endcard.wav'); ec_json = os.path.join(cache, 'cues.json')
    want = [l[0] for l in lines]
    have = json.load(open(ec_json)) if os.path.exists(ec_json) else {}
    if not (os.path.exists(ec_wav) and have.get('lines') == want):
        try:
            cues, tot = tts_levi([(l[0], l[1]) for l in lines], ec_wav); voice = 'levi'
        except Exception as e:
            log('Levi voice not available (', e, ') - using the Kokoro voice for the end card this time')
            cues, tot = tts_kokoro([(l[0], l[1]) for l in lines], ec_wav, speed=0.9); voice = 'kokoro'
        have = {'lines': want, 'voice': voice, 'cues': dict(zip([l[2] for l in lines], cues)), 'total': tot}
        if voice == 'levi': json.dump(have, open(ec_json, 'w'), indent=1)
    cues = dict(have['cues']); cues['total'] = have['total']
    for k in ('amazon',):
        cues.setdefault(k, cues.get('app', 2.0))
    card = {'title': idx['bookTitle'], 'label': label, 'cover': 'pages/front.png', 'amazon': amazon, 'app': APP_URL, 'web': SITE_URL}
    end_mp4 = os.path.join(work, 'endcard.mp4'); build_endcard(work, card, ec_wav, cues, end_mp4)
    final = os.path.join(args.out, f'{slug}.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', story_av, '-i', end_mp4, '-filter_complex',
                    '[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];[1:a]aresample=48000,aformat=channel_layouts=stereo[a1];[0:v][a0][1:v][a1]concat=n=2:v=1:a=1[v][a]',
                    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                    '-movflags', '+faststart', final], check=True)
    thumb = os.path.join(args.out, f'{slug}-thumb.jpg')
    shutil.copy(os.path.join(pages, 'p1.png'), os.path.join(work, 'title.png'))
    trav = row.get('Traveler') or night.get('traveler', '')
    build_thumbnail(work, title, scripture, trav, thumb)
    meta = {'date': date, 'slug': slug, 'title': title, 'scripture': scripture, 'story': story_no,
            'traveler': trav, 'book_title': idx['bookTitle'], 'month': idx['month'], 'amazon': amazon,
            'app': APP_URL, 'site': SITE_URL, 'endcard_voice': have.get('voice'),
            'story_text': ' '.join(t for t, _ in S['p2'])}
    json.dump(meta, open(os.path.join(args.out, f'{slug}-meta.json'), 'w'), indent=1, ensure_ascii=False)
    log('done:', final); return 0

if __name__ == '__main__':
    sys.exit(main())
