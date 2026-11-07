"""THE PLAIN-TITLES CHECK (Levi, 7 Nov 2026).

A title is ordinary text wherever it is stored: night.json, lullaby.json, the song page's
JSON, the app's window.LST_NIGHT. HTML entity code (&rsquo; &amp; ...) belongs only in the
page markup that common.py writes. On 6 Nov a song title saved as 'The Watchman&rsquo;s Call'
was escaped a second time, and the song page showed the code itself.

    python3 lantern/builder/title_check.py                  # every night under lantern/
    python3 lantern/builder/title_check.py lantern/<slug>   # one night folder

Prints one line per problem and exits 1 if there is any (a folder that does not exist is a
problem too). audit.py runs it on the night being built (`check_night`); the sweep with no
argument also lists older editions whose window.LST_NIGHT storyTitle carries entity code
(they pre-date the rule and are only listed).
"""
import glob, json, os, re, sys

CODE = r'&(?:#\d+|#[xX][0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]{1,31});'
ENTITY = re.compile(CODE)                                   # entity code in a plain-text slot
ESCAPED = re.compile(r'&amp;' + CODE[1:])                   # code escaped twice: shows on the page
JSON_TITLE = re.compile(r'"(?:title|story)"\s*:\s*"((?:[^"\\]|\\.)*)"')   # the song page's own JSON
STORY_TITLE = re.compile(r"storyTitle:\s*'((?:[^'\\]|\\.)*)'")            # window.LST_NIGHT

def _read(path):
    return open(path, encoding='utf-8', errors='replace').read()

def check_night(folder, editions=True, slug=None):
    """Problems in one night folder, as a list of (what, found) pairs; [] when clean.
    The song page is {slug}-lullaby.html; slug defaults to the folder's name (audit.py passes
    the night's own SLUG, because a build folder is not always named after the night)."""
    out = []
    if not os.path.isdir(folder):
        return [('night folder not found', folder)]
    slug = slug or os.path.basename(os.path.abspath(folder))
    for fn, keys in (('night.json', ('title',)), ('lullaby.json', ('title', 'story'))):
        p = os.path.join(folder, fn)
        if not os.path.exists(p):
            continue
        try:
            data = json.load(open(p, encoding='utf-8'))
        except Exception as e:
            out.append((f'{fn} is unreadable', str(e)[:80]))
            continue
        if not isinstance(data, dict):
            out.append((f'{fn} is not a JSON object', type(data).__name__))
            continue
        for k in keys:
            v = data.get(k)
            if isinstance(v, str) and ENTITY.search(v):
                out.append((f'{fn} "{k}" is not plain text', v))
    song = os.path.join(folder, slug + '-lullaby.html')
    if os.path.exists(song):
        s = _read(song)
        twice = sorted(set(ESCAPED.findall(s)))
        if twice:
            out.append((f'{slug}-lullaby.html shows entity code on the page (escaped twice)', ', '.join(twice[:4])))
        for m in JSON_TITLE.finditer(s):
            if ENTITY.search(m.group(1)):
                out.append((f'{slug}-lullaby.html carries entity code in its JSON title', m.group(1)))
                break
    if editions:
        for p in sorted(glob.glob(os.path.join(folder, 'morning-lantern-*.html'))):
            s = _read(p)
            name = os.path.basename(p)
            m = STORY_TITLE.search(s)
            if m and ENTITY.search(m.group(1)):
                out.append((f'{name} window.LST_NIGHT storyTitle carries entity code', m.group(1)))
            twice = sorted(set(ESCAPED.findall(s)))
            if twice:
                out.append((f'{name} shows entity code on the page (escaped twice)', ', '.join(twice[:4])))
    return out

def main(argv):
    if argv:
        folders = [a.rstrip('/') for a in argv]
        legacy = False
    else:
        here = os.path.dirname(os.path.abspath(__file__))
        folders = sorted(d.rstrip('/') for d in glob.glob(os.path.join(here, '..', '*', '')))
        legacy = True
    bad = 0
    for f in folders:
        for what, found in check_night(f, editions=True):
            if legacy and 'storyTitle' in what:         # an older edition: listed, not failed
                print(f'note {os.path.basename(f)}: {what}: {found}')
            else:
                print(f'FAIL {os.path.basename(f)}: {what}: {found}')
                bad += 1
    print(f'{"FAIL" if bad else "PASS"} - plain titles ({bad} problem{"s" if bad != 1 else ""})')
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
