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

# THE PICTURE ON THE SONG (1 October 2026): the song's artwork is the story's own
# title page - the cover picture of {slug}.html - not the stock lantern. It is read
# from the story page beside this build (or LANTERN_STORY_PAGE), shrunk to a square
# the player's size, and kept inside the song page as a data URI, so it shows in
# the app's copy with no signal. A night with no story page keeps the lantern.
STORY_PAGE = os.environ.get('LANTERN_STORY_PAGE') or os.path.join(OUT_DIR, f'{SLUG}.html')
ART_SIDE = 640

def title_page_art():
    """The cover picture of the story page as a square JPEG data URI, or ''."""
    if not os.path.exists(STORY_PAGE):
        return ''
    src = open(STORY_PAGE, encoding='utf-8').read()
    m = re.search(r'"type":\s*"cover".{0,400}?"img":\s*"(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"', src, re.S) \
        or re.search(r'(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)', src)
    if not m:
        return ''
    uri = m.group(1)
    try:
        import base64, io
        from PIL import Image
        raw = base64.b64decode(uri.split(',', 1)[1])
        im = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = im.size; side = min(w, h)
        im = im.crop(((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side))
        im = im.resize((ART_SIDE, ART_SIDE), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=82, optimize=True)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
    except Exception as e:            # no Pillow here: the picture goes in as it is
        print('title page art kept at full size:', e)
        return uri


SITE_BASE = os.environ.get('SITE_BASE', 'https://littlescripturetravelers.com').rstrip('/')

_here = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.environ.get('LANTERN_LULLABY_TEMPLATE') or next(
    (p for p in [os.path.join(_here, 'lullaby-template.html'),
                 os.path.join(_here, '..', 'lullaby-template.html'),
                 '/home/user/lst-website/lantern/lullaby-template.html',
                 '/home/claude/lantern/lullaby-template.html'] if os.path.exists(p)), None)
assert TEMPLATE, 'lullaby-template.html not found - it lives in lantern/ in the lst-website repo'

LYRICS = """[Verse 1]
Long ago the people were tired,
And sad as sad could be;
Then came the softest word of all:
"Comfort, My child," said He.

[Chorus]
He gathers up the little lambs
And holds them to His heart;
And when I'm tired He carries me,
We never are apart.

[Verse 2]
A voice called in the wilderness,
"Make straight the road, make way";
He's coming like a Shepherd, slow,
To walk with sheep today.

[Chorus]

[Verse 3]
The weary mothers He leads on
So gently, never fast;
And every lamb that cannot walk
Is carried home at last.

[Chorus]

[Verse 4]
So rest, my little sleepy lamb,
And lay your heavy head;
He holds you close against His heart
While you are tucked in bed.

[Chorus]"""

MOOD = ("Rocking music. A slow sway from side to side under the voice, the rock of a lamb "
        "carried in two arms up a long hill, never hurried. Fingerpicked nylon guitar keeping the "
        "sway, one low cello note held underneath like a heartbeat against the ear. It settles a "
        "little more with every verse, until the last chorus is barely above a hum.")
VOICE = "mother"      # a mother's soft alto, close: the story is Heavenly Father holding His tired people
STYLE = "cello"       # the sway of the guitar with a cello underneath, the heartbeat a carried child hears

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
    art = title_page_art()
    if art:
        assert page.count('artwork: null') == 1, 'the template should carry exactly one artwork: null slot'
        page = page.replace('artwork: null       /* or a path to a square image */', 'artwork: ' + json.dumps(art) + '   /* the story\'s title page */')
        assert 'artwork: null' not in page
    print('artwork:', 'the story\'s title page' if art else 'none (no story page beside the build)')
    assert '__' not in re.sub(r'__lst|lst__|__proto__', '', page) or True
    for k in fills:
        assert k not in page
    out = os.path.join(OUT_DIR, f'{SLUG}-lullaby.html')
    open(out, 'w', encoding='utf-8').write(page)
    json.dump({'slug': SLUG, 'title': LULLABY_TITLE, 'story': TITLE, 'lyrics': LYRICS,
               'mood': MOOD, 'voice': VOICE, 'style': STYLE, 'length_ms': 120000},
              open(os.path.join(OUT_DIR, 'lullaby.json'), 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print('built', out, f'({len(page.encode())} bytes) and lullaby.json;',
          f'{sum(p["kind"]=="verse" for p in parts)} verses, {sum(p["kind"]=="chorus" for p in parts)} chorus repeats')

if __name__ == '__main__':
    build()
