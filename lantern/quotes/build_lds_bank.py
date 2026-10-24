import re, json, html as H, subprocess, os, sys, time
CONFS = ['2024/04','2024/10','2025/04','2025/10','2026/04','2026/10']
from themes import THEMES, clean, standalone
out = []
for c in CONFS:
    idx = open('idx-'+c.replace('/','-')+'.html', encoding='utf-8').read()
    talks = {}
    for m in re.finditer(r'href="/study/general-conference/'+c+r'/([0-9a-z-]+)\?lang=eng"[^>]*><div class="itemTitle[^"]*"><p><span>([^<]*)</span></p><p class="subtitle[^"]*">([^<]*)</p>', idx):
        slug, title, speaker = m.group(1), H.unescape(m.group(2)), H.unescape(m.group(3))
        if re.match(r'^\d\d', slug): talks[slug] = (title, speaker)
    print(c, len(talks), 'talks', file=sys.stderr)
    for slug, (title, speaker) in talks.items():
        if re.search(r'^(Introduction|Sustaining|Church Auditing|Statistical|Welcome)', title, re.I) or 'Auditing' in title or 'Sustaining of' in title: continue
        url = f'https://www.churchofjesuschrist.org/study/general-conference/{c}/{slug}?lang=eng'
        fn = f'talk-{c.replace("/","-")}-{slug}.html'
        if not os.path.exists(fn):
            subprocess.run(['curl','-sS','-L','--max-time','40',url,'-o',fn], check=False)
            time.sleep(0.4)
        try: page = open(fn, encoding='utf-8').read()
        except Exception: continue
        if len(page) < 20000: continue
        an = re.search(r'<p class="author-name"[^>]*>([^<]*)', page); role = re.search(r'<p class="author-role"[^>]*>([^<]*)', page)
        name = clean(an.group(1)) if an else speaker; name = re.sub(r'^By\s+', '', name)
        role_t = clean(role.group(1)) if role else ''
        body = re.search(r'<div class="body-block"[^>]*>(.*?)</div>\s*</div>\s*<footer', page, re.S) or re.search(r'<div class="body-block"[^>]*>(.*)', page, re.S)
        if not body: continue
        paras = [clean(p) for p in re.findall(r'<p[^>]*id="p[_A-Za-z0-9]+"[^>]*>(.*?)</p>', body.group(1), re.S)]
        picks = []
        for p in paras:
            w = len(p.split())
            if w < 22 or w > 75: continue
            if not standalone(p): continue
            low = p.lower()
            if 'welcome to general conference' in low or 'brothers and sisters, welcome' in low: continue
            themes = [t for t, kws in THEMES.items() if any(k in low for k in kws)]
            if len(themes) < 1: continue
            picks.append({'quote': p, 'themes': themes, 'words': w})
        # keep the two richest paragraphs by theme count, spaced apart
        picks.sort(key=lambda x: -len(x['themes']))
        for pk in picks[:2]:
            month = 'April' if c.endswith('/04') else 'October'
            out.append({'id': f'{c.replace("/","-")}-{slug}-{len(out)}', 'edition': 'lds', 'speaker': name, 'role': role_t,
                        'title': title, 'source': f'{month} {c[:4]} General Conference', 'url': url,
                        'quote': pk['quote'], 'themes': pk['themes']})
json.dump(out, open('lds-bank.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('quotes:', len(out), file=sys.stderr)
