#!/usr/bin/env python3
"""THE FEELING MOMENT PICTURE RULE (Levi, 7 Oct 2026): "I want the image with the feeling moment
to be placed with the remember this page and no picture with the feeling moment. ... that is how
the app and website should always work."

The story PDFs put a picture on the Feeling Moment page. In the story book the Feeling Moment page
has no picture, and that picture goes on the Remember This page.

    python3 lantern/builder/story_pictures.py lantern/<slug>/<slug>.html [...]   # fix in place
    python3 lantern/builder/story_pictures.py --check lantern/<slug>/<slug>.html  # exit 1 if wrong

Only the two beats' img/alt change; every other byte of the page stays as it was.
"""
import json, re, sys

MARK = 'const STORY = '

def find_story(html):
    """(start, end, story) of the STORY object literal, whatever its layout, else None."""
    i = html.find(MARK)
    if i < 0:
        return None
    a = i + len(MARK)
    try:
        story, n = json.JSONDecoder().raw_decode(html, a)
    except Exception:
        return None
    return a, n, story

def is_heading(b, name):
    return name.lower() in re.sub(r'&[a-z]+;', ' ', str(b.get('heading') or '')).lower()

def move(story):
    """Return True when the beats were changed."""
    beats = story.get('beats') or []
    fm = next((b for b in beats if is_heading(b, 'Feeling Moment')), None)
    rt = next((b for b in beats if is_heading(b, 'Remember This')), None)
    if not fm or not fm.get('img'):
        return False
    if rt is not None and not rt.get('img'):
        rt['img'] = fm['img']
        rt['alt'] = fm.get('alt') or rt.get('alt') or ''
    fm['img'] = None
    fm['alt'] = ''
    return True

def fix_html(html):
    found = find_story(html)
    if not found:
        return html, False
    a, n, story = found
    if not move(story):
        return html, False
    blob = json.dumps(story, ensure_ascii=False, indent=1 if '\n' in html[a:a + 4] else None)
    return html[:a] + blob + html[n:], True

def main(argv):
    check = '--check' in argv
    paths = [a for a in argv if a != '--check']
    bad = 0
    for p in paths:
        html = open(p, encoding='utf-8').read()
        out, changed = fix_html(html)
        if changed and check:
            print(f'{p}: the Feeling Moment still has the picture (it belongs on Remember This)'); bad += 1
        elif changed:
            open(p, 'w', encoding='utf-8').write(out); print(f'{p}: picture moved to Remember This')
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
