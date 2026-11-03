#!/usr/bin/env python3
"""
The read-along video's YouTube thumbnail (Levi, 3 Nov 2026: "I need a thumbnail for the video according to
YouTube SEO ... added to the daily automation"). Made like the approved "Mourning Turned Into Joy" one:
the feeling BEFORE on the left (soft, cool), the feeling AFTER on the right (bright), big words
"Before ➜ After!", a gold "Bedtime Bible Story for Kids" pill and the reference in the corner.

usage:
  thumb_seo.py --before "Sad" --after "JOY!" --left feeling.jpg --right scene.jpg --ref "Jeremiah 31" --out thumb.jpg
               [--left-focus 0.5,0.3] [--right-focus 0.55,0.3] [--left-zoom 1.0] [--right-zoom 1.0]
  focus = the point (0-1 across, 0-1 down) of the picture to keep in view (put a face there);
  zoom > 1 crops in closer.
"""
import argparse, base64, html, json, os, tempfile
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))

def data_uri(path):
    ext = os.path.splitext(path)[1].lower().lstrip('.') or 'jpeg'
    ext = 'jpeg' if ext == 'jpg' else ext
    return f'data:image/{ext};base64,' + base64.b64encode(open(path, 'rb').read()).decode()

def font_uri(name):
    return 'data:font/ttf;base64,' + base64.b64encode(open(os.path.join(HERE, 'fonts', name), 'rb').read()).decode()

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fredoka;src:url(%(fredoka)s)}
@font-face{font-family:Nunito;src:url(%(nunito)s)}
html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#1B2D5F;font-family:Nunito}
.pan{position:absolute;top:0;height:720px;overflow:hidden}
.pan img{position:absolute;inset:0;width:100%%;height:100%%;object-fit:cover}
.left{left:0;width:560px;clip-path:polygon(0 0,100%% 0,82%% 100%%,0 100%%)}
.left img{object-position:%(lfx)s%% %(lfy)s%%;transform:scale(%(lz)s);transform-origin:%(lfx)s%% %(lfy)s%%;filter:saturate(.55) brightness(.92)}
.left::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(40,60,110,.25),rgba(20,32,74,.55))}
.right{right:0;width:820px}
.right img{object-position:%(rfx)s%% %(rfy)s%%;transform:scale(%(rz)s);transform-origin:%(rfx)s%% %(rfy)s%%;filter:saturate(1.15) brightness(1.05)}
.right::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,32,74,.35),rgba(0,0,0,0) 40%%)}
.seam{position:absolute;left:0;top:0;width:560px;height:720px;clip-path:polygon(97%% 0,100%% 0,82.5%% 100%%,79.5%% 100%%);background:#F5C518}
.word{position:absolute;font-family:Fredoka;font-weight:600;line-height:.9;white-space:nowrap}
.w1{left:44px;top:56px;color:#fff;text-shadow:0 6px 0 #0d1530,0 0 30px rgba(0,0,0,.55)}
.w2{right:40px;top:26px;color:#F5C518;text-shadow:0 7px 0 #0d1530,0 0 40px rgba(0,0,0,.5)}
.arrow{position:absolute;left:400px;top:260px;font:600 150px Fredoka;color:#F5C518;text-shadow:0 6px 0 #0d1530}
.pill{position:absolute;left:44px;bottom:44px;background:#F5C518;color:#1B2D5F;font:600 38px Fredoka;padding:10px 26px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.ref{position:absolute;right:46px;bottom:48px;color:#fff;font:800 40px Nunito;background:rgba(20,32,74,.78);padding:8px 22px;border-radius:14px}
</style></head><body>
<div class="pan right"><img src="%(right)s"></div>
<div class="pan left"><img src="%(left)s"></div>
<div class="seam"></div>
<div class="word w1" id="w1">%(before)s</div>
<div class="arrow">&#10140;</div>
<div class="word w2" id="w2">%(after)s</div>
<div class="pill">%(pill)s</div>
<div class="ref">%(ref)s</div>
<script>
function fit(id,size,maxw){const e=document.getElementById(id);e.style.fontSize=size+'px';
  while(e.getBoundingClientRect().width>maxw&&size>60){size-=4;e.style.fontSize=size+'px'}}
fit('w1',150,380); fit('w2',185,700);
</script></body></html>"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--before', required=True); ap.add_argument('--after', required=True)
    ap.add_argument('--left', required=True); ap.add_argument('--right', required=True)
    ap.add_argument('--ref', required=True); ap.add_argument('--pill', default='Bedtime Bible Story for Kids')
    ap.add_argument('--left-focus', default='0.5,0.3'); ap.add_argument('--right-focus', default='0.5,0.3')
    ap.add_argument('--left-zoom', default='1.0'); ap.add_argument('--right-zoom', default='1.0')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    lfx, lfy = [float(v) * 100 for v in a.left_focus.split(',')]
    rfx, rfy = [float(v) * 100 for v in a.right_focus.split(',')]
    page = PAGE % {'fredoka': font_uri('Fredoka.ttf'), 'nunito': font_uri('Nunito.ttf'),
                   'left': data_uri(a.left), 'right': data_uri(a.right),
                   'lfx': f'{lfx:.1f}', 'lfy': f'{lfy:.1f}', 'rfx': f'{rfx:.1f}', 'rfy': f'{rfy:.1f}',
                   'lz': a.left_zoom, 'rz': a.right_zoom,
                   'before': html.escape(a.before), 'after': html.escape(a.after),
                   'pill': html.escape(a.pill), 'ref': html.escape(a.ref)}
    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False) as f: f.write(page); tmp = f.name
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.goto('file://' + tmp); pg.wait_for_timeout(800)
        png = tmp + '.png'; pg.screenshot(path=png); b.close()
    from PIL import Image
    Image.open(png).convert('RGB').save(a.out, quality=92)
    os.remove(tmp); os.remove(png); print('thumbnail:', a.out)

if __name__ == '__main__':
    main()
