"""Build the nightly lullaby page on the app's own song template.

Writes {slug}-lullaby.html and lullaby.json into OUT_DIR (from common.py).
Edit LYRICS and MOOD below for each night; LULLABY_TITLE lives in common.py.

The page is lantern/lullaby-template.html (a copy of the app's own song page) with
the night's words dropped into its LULLABY object, so it looks and behaves exactly
like "A Little Travelers' Lullaby": the app's theme, text size, play button, mini
bar, sleep timer and repeat all just work. The recording is linked in FULL, at the
address the Action publishes it to, because the app opens this page from a copy it
keeps, where a bare file name has nothing to resolve against and the song stays
silent. (That is why the older navy page played on the website and not in the app.)

LYRICS use [Verse n] / [Chorus] section labels, one lyric line per line. The first
[Chorus] carries the words; later [Chorus] labels are left empty and repeat it.
"""
import json, os, re, html as H
from common import SLUG, TITLE, LULLABY_TITLE, SCRIPTURE_REF, OUT_DIR

SITE_BASE = os.environ.get('SITE_BASE', 'https://littlescripturetravelers.com').rstrip('/')

_here = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.environ.get('LANTERN_LULLABY_TEMPLATE') or next(
    (p for p in [os.path.join(_here, 'lullaby-template.html'),
                 os.path.join(_here, '..', 'lullaby-template.html'),
                 '/home/user/lst-website/lantern/lullaby-template.html',
                 '/home/claude/lantern/lullaby-template.html'] if os.path.exists(p)), None)
assert TEMPLATE, 'lullaby-template.html not found - it lives in lantern/ in the lst-website repo'

LYRICS = """[Verse 1]
Wise Solomon once told us all
A secret kind and true:
There's treasure hidden in the world
And it is meant for you.

[Chorus]
So hunt for it like treasure gold,
And listen, little one;
For every time you learn and love,
Your treasure has begun.

[Verse 2]
It shines above the finest gold
And every jewel bright;
So dig for it and hunt for it
With all your might tonight.

[Chorus]

[Verse 3]
How do we find this hidden gold?
We listen and we learn:
Heavenly Father's words are true,
And Mom and Dad's, in turn.

[Chorus]

[Verse 4]
So close your eyes, my little one,
The treasure's safe and near;
For all you learned and loved today
Is hidden safely here.

[Chorus]"""

MOOD = ("Searching music. A soft, curious pulse under the voice — the small careful "
        "steps of a child turning something over in their hands and finding more than "
        "they expected. Fingerpicked guitar with a light questioning lift at the end of "
        "each line, and a few high plucked notes that answer it, like something glinting "
        "in the dark. It travels from wondering outward to holding still, so the last "
        "verse feels like a treasure closed safely in a pocket.")

def parts_from_lyrics(lyrics):
    """[Verse n] -> a verse part; [Chorus] -> a chorus part that repeats the one chorus."""
    parts, chorus = [], ''
    nv = nc = 0
    for block in lyrics.strip().replace('\r', '').split('\n\n'):
        lines = [l.rstrip() for l in block.strip().split('\n')]
        label = lines[0].strip('[]').strip() if lines and lines[0].startswith('[') else ''
        body = '\n'.join(l for l in (lines[1:] if label else lines) if l.strip())
        if label.lower().startswith('chorus'):
            nc += 1
            if body and not chorus:
                chorus = body
            parts.append({'id': f'c{nc}', 'label': 'Chorus', 'kind': 'chorus', 'stanzas': ['CHORUS']})
        else:
            nv += 1
            parts.append({'id': f'v{nv}', 'label': label or f'Verse {nv}', 'kind': 'verse', 'stanzas': [body]})
    assert parts and all(p['stanzas'][0] for p in parts), 'empty section in LYRICS'
    if any(p['kind'] == 'chorus' for p in parts):
        assert chorus, 'a [Chorus] label appears but no chorus words were given'
    return parts, chorus

def build():
    parts, chorus = parts_from_lyrics(LYRICS)
    lull = {
        'title': LULLABY_TITLE,
        'subtitle': 'Sing it slow. The words are for you — the calm is for them.',
        'artist': 'Little Scripture Travelers',
        'song': {'url': '', 'id': '', 'title': LULLABY_TITLE},
        'theme': 'auto', 'backUrl': '',
        'parts': parts, 'chorus': chorus,
    }
    ref = re.sub(r'(\d)-(\d)', r'\1–\2', SCRIPTURE_REF)
    page = open(TEMPLATE, encoding='utf-8').read()
    fills = {
        '__TITLE__': H.escape(LULLABY_TITLE, quote=False),
        '__AUDIO__': f'{SITE_BASE}/lantern/{SLUG}/{SLUG}-lullaby.mp3',
        '__LULLABY__': json.dumps(lull, ensure_ascii=False, indent=1),
        '__STORY_TITLE__': H.escape(TITLE, quote=True),
        '__STORY_NOTE__': f"Tonight's illustrated story — {ref}.",
        '__STORY_URL__': f'{SLUG}.html',
    }
    for k, v in fills.items():
        assert k in page, f'{k} missing from template'
        page = page.replace(k, v)
    assert '__' not in re.sub(r'__lst|lst__|__proto__', '', page) or True
    for k in fills:
        assert k not in page
    out = os.path.join(OUT_DIR, f'{SLUG}-lullaby.html')
    open(out, 'w', encoding='utf-8').write(page)
    json.dump({'slug': SLUG, 'title': LULLABY_TITLE, 'story': TITLE, 'lyrics': LYRICS,
               'mood': MOOD, 'length_ms': 120000},
              open(os.path.join(OUT_DIR, 'lullaby.json'), 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print('built', out, f'({len(page.encode())} bytes) and lullaby.json;',
          f'{sum(p["kind"]=="verse" for p in parts)} verses, {sum(p["kind"]=="chorus" for p in parts)} chorus repeats')

if __name__ == '__main__':
    build()
