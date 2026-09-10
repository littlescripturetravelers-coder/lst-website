"""Christian edition quote bank: read verbatim off ccel.org.
 - Spurgeon, Morning and Evening: one standalone devotional paragraph per day (every other day).
 - Thomas a Kempis, The Imitation of Christ: the numbered paragraphs of each chapter.
"""
import re, json, html as H, subprocess, os, sys, time
from themes import THEMES, clean, standalone
out = []
def fetch(url, fn):
    if not os.path.exists(fn) or os.path.getsize(fn) < 5000:
        for _ in range(2):
            subprocess.run(['curl','-sS','-L','--max-time','40',url,'-o',fn], check=False)
            if os.path.exists(fn) and os.path.getsize(fn) >= 5000: break
            time.sleep(1.5)
        time.sleep(0.25)
    try: return open(fn, encoding='utf-8').read()
    except Exception: return ''
def add(speaker, role, title, source, url, paras, per=2):
    picks = []
    for p in paras:
        w = len(p.split())
        if w < 22 or w > 70: continue
        if not standalone(p): continue
        if not p[0].isupper() and p[0] not in '“"': continue
        if re.search(r'\s\d{1,2}\s', p): continue      # a footnote number left in the words
        low = p.lower()
        themes = [t for t, kws in THEMES.items() if any(k in low for k in kws)]
        if not themes: continue
        picks.append({'quote': p, 'themes': themes})
    picks.sort(key=lambda x: -len(x['themes']))
    for pk in picks[:per]:
        out.append({'id': f'chr-{len(out)}', 'edition': 'christian', 'speaker': speaker, 'role': role, 'title': title,
                    'source': source, 'url': url, 'quote': pk['quote'], 'themes': pk['themes']})
    return len(picks)
# Morning and Evening - every other day, morning readings
import calendar
for m in range(1, 13):
    for d in range(1, calendar.monthrange(2023, m)[1] + 1, 2):
        for ap in ('am',):
            key = f'd{m:02d}{d:02d}{ap}'
            url = f'https://ccel.org/ccel/spurgeon/morneve.{key}.html'
            page = fetch(url, f'me-{key}.html')
            if not page: continue
            verse = re.search(r'<p class="passage"[^>]*>(.*?)</p>', page, re.S)
            vt = clean(verse.group(1)).strip('“”"') if verse else ''
            paras = [clean(x) for x in re.findall(r'<p class="normal"[^>]*>(.*?)</p>', page, re.S)]
            # the devotion is one long paragraph; split it into sentences groups of standalone length
            units = []
            for p in paras:
                sents = re.split(r'(?<=[.!?”])\s+(?=[A-Z“])', p)
                buf = ''
                for s in sents:
                    buf = (buf + ' ' + s).strip()
                    if len(buf.split()) >= 28:
                        units.append(buf); buf = ''
                if buf and len(buf.split()) >= 22: units.append(buf)
            title = f'Morning and Evening, {calendar.month_name[m]} {d} (on “{vt}”)' if vt else f'Morning and Evening, {calendar.month_name[m]} {d}'
            n = add('Charles H. Spurgeon', 'Morning and Evening', title, 'Spurgeon, Morning and Evening (ccel.org)', url, units, per=1)
            print(key, n, file=sys.stderr)
# The Imitation of Christ
toc = fetch('https://ccel.org/ccel/kempis/imitation.toc.html', 'imitation.toc.html')
chaps = sorted(set(re.findall(r'href="(imitation\.(?:ONE|TWO|THREE|FOUR)\.\d+)\.html"', toc)))
for c in chaps:
    url = f'https://ccel.org/ccel/kempis/{c}.html'
    page = fetch(url, f'im-{c}.html')
    if not page: continue
    t = re.search(r'<h3[^>]*>(.*?)</h3>', page, re.S); title = clean(t.group(1)) if t else c
    cid = c.replace('imitation.', '')
    paras = [clean(x) for x in re.findall(r'<p[^>]*id="' + re.escape(cid) + r'-p\d+"[^>]*>(.*?)</p>', page, re.S)]
    n = add('Thomas à Kempis', 'The Imitation of Christ', title, 'The Imitation of Christ (ccel.org)', url, paras, per=2)
    print(c, title[:40], n, file=sys.stderr)
json.dump(out, open('chr-bank.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('quotes:', len(out), file=sys.stderr)
