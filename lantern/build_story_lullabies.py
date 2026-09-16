#!/usr/bin/env python3
"""The story lullabies: one song for every story in the books, June onward.

Every folder  lantern/<key>/  whose lullaby.json carries a `book` is a story
lullaby (the nightly Morning Lantern songs have a night.json beside them and
no `book`; this script leaves those alone). From each one this writes

    lantern/<key>/<key>-lullaby.html     the song page, on the app's own template
    data/story-lullabies.js              the catalogue the website's Library reads

and the same catalogue is copied into the app as www/data/lullabies.js, where
the Lullabies & Songs page puts every story's song on its book's shelf.

The recording, <key>-lullaby.mp3, is sung by the Lantern sync Action the first
time it sees a lullaby.json with no MP3 beside it - the same way a night's song
is sung. Nothing here spends a credit.

Run from the top of the repo:   python3 lantern/build_story_lullabies.py
"""
import json, os, re, glob, html as H, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE_BASE = os.environ.get('SITE_BASE', 'https://littlescripturetravelers.com').rstrip('/')
TEMPLATE = os.path.join(HERE, 'lullaby-template.html')

BOOKS = {'june': 6, 'july': 7, 'august': 8, 'september': 9, 'october': 10,
         'november': 11, 'december': 12}
BOOK_TITLES = {6: 'A Heart That Follows the Lord', 7: 'There Is a Prophet in Israel',
               8: 'I Will Trust and Sing', 9: 'Wonderful Is His Way', 10: 'He Gathers the Lambs'}

def parts_from_lyrics(lyrics):
    """[Verse n] -> a verse; [Chorus] -> the one chorus, repeated."""
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
    assert parts and all(p['stanzas'][0] for p in parts), 'empty section in the lyrics'
    if any(p['kind'] == 'chorus' for p in parts):
        assert chorus, 'a [Chorus] label appears but no chorus words were given'
    return parts, chorus

def page_for(meta, key, template):
    parts, chorus = parts_from_lyrics(meta['lyrics'])
    title = meta['title']
    lull = {
        'title': title,
        'subtitle': 'Sing it slow. The words are for you — the calm is for them.',
        'artist': 'Little Scripture Travelers',
        'song': {'url': '', 'id': '', 'title': title},
        'theme': 'auto', 'backUrl': '',
        'parts': parts, 'chorus': chorus,
    }
    ref = re.sub(r'(\d)-(\d)', r'\1–\2', meta.get('reference') or '')
    month = meta['book'].capitalize()
    note = f"{meta['story']} — {ref}. {month}, Story {meta['storyNumber']}." if ref else f"{meta['story']}. {month}, Story {meta['storyNumber']}."
    fills = {
        '__TITLE__': H.escape(title, quote=False),
        '__AUDIO__': f'{SITE_BASE}/lantern/{key}/{key}-lullaby.mp3',
        '__LULLABY__': json.dumps(lull, ensure_ascii=False, indent=1),
        '__STORY_TITLE__': H.escape(meta['story'], quote=True),
        '__STORY_NOTE__': H.escape(note, quote=True),
        '__STORY_URL__': f"{SITE_BASE}/read.html?id={meta['readId']}" if meta.get('readId') else '',
    }
    page = template.replace("&larr; Back to tonight's devotional", '&larr; Back to the songs')
    for k, v in fills.items():
        assert k in page, f'{k} missing from template'
        page = page.replace(k, v)
    return page

def main():
    template = open(TEMPLATE, encoding='utf-8').read()
    rows = []
    for p in sorted(glob.glob(os.path.join(HERE, '*', 'lullaby.json'))):
        meta = json.load(open(p, encoding='utf-8'))
        if not meta.get('book'):
            continue                      # a Morning Lantern night, not a story lullaby
        key = os.path.basename(os.path.dirname(p))
        assert meta.get('slug') == key, f'{p}: slug {meta.get("slug")} is not its folder {key}'
        page = page_for(meta, key, template)
        out = os.path.join(os.path.dirname(p), f'{key}-lullaby.html')
        old = open(out, encoding='utf-8').read() if os.path.exists(out) else None
        if old != page:
            open(out, 'w', encoding='utf-8').write(page)
        rows.append({
            'key': key,
            'book': meta['book'],
            'bookNo': BOOKS.get(meta['book'], 0),
            'bookTitle': BOOK_TITLES.get(BOOKS.get(meta['book'], 0), ''),
            'n': int(meta['storyNumber']),
            'night': meta.get('night', ''),
            'story': meta['story'],
            'reference': meta.get('reference', ''),
            'title': meta['title'],
            'page': f'{SITE_BASE}/lantern/{key}/{key}-lullaby.html',
            'audio': f'{SITE_BASE}/lantern/{key}/{key}-lullaby.mp3',
            'readId': meta.get('readId', ''),
            'appPage': meta.get('appPage', ''),
            'sung': os.path.exists(os.path.join(os.path.dirname(p), f'{key}-lullaby.mp3')),
        })
    rows.sort(key=lambda r: (r['bookNo'], r['n']))
    head = ("/* THE STORY LULLABIES - one song for every story in the books, June onward.\n"
            "   Written by lantern/build_story_lullabies.py from lantern/<key>/lullaby.json;\n"
            "   do not edit by hand. `sung` says whether the recording exists yet. */\n")
    js = head + 'window.LST_STORY_SONGS = ' + json.dumps(rows, ensure_ascii=False, indent=1) + ';\n'
    out = os.path.join(ROOT, 'data', 'story-lullabies.js')
    open(out, 'w', encoding='utf-8').write(js)
    sung = sum(r['sung'] for r in rows)
    print(f'{len(rows)} story lullabies; {sung} sung so far -> {os.path.relpath(out, ROOT)}')
    app = os.environ.get('APP_DATA')      # e.g. ../lst-app/www/data/lullabies.js
    if app:
        open(app, 'w', encoding='utf-8').write(js); print('copied to', app)

if __name__ == '__main__':
    main()
