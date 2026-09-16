#!/usr/bin/env python3
"""Does a new lullaby sound like the others? Run before a song is sung.

    python3 lantern/builder/lyric_tells.py                 # audit every lantern/*/lullaby.json
    python3 lantern/builder/lyric_tells.py path/to/lullaby.json   # judge one new song against the rest

A parent who sings two of these in a week must not hear the same closing line
twice. On 16 September 2026, 83 of 94 story lullabies contained "close your
eyes" and 61 opened their last verse with "Now close your eyes" - one rule,
followed too well. So: any run of three words that already appears in more
than one song in twelve is a tell, and a last verse that opens the way another
song's does is a tell. Fix the words before the recording is asked for.
"""
import json, glob, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
LANTERN = os.path.dirname(HERE)
STOP = {'the', 'a', 'an', 'and', 'of', 'to', 'in', 'is', 'my', 'your', 'you', 'he', 'his', 'her', 'i', 'so', 'for', 'on', 'with', 'that', 'it', 'was', 'be', 'are'}

def words(text):
    text = re.sub(r'\[[^\]]*\]', ' ', text)        # drop [Verse n] / [Chorus] labels
    return re.findall(r"[a-z']+", text.lower())

def grams(text, n=3):
    w = words(text)
    out = set()
    for i in range(len(w) - n + 1):
        g = w[i:i + n]
        if all(x in STOP for x in g):
            continue
        out.add(' '.join(g))
    return out

def last_verse_opening(lyrics):
    parts = re.split(r'\[Verse \d+\]', lyrics)
    if len(parts) < 2:
        return ''
    body = parts[-1].split('[Chorus]')[0].strip().split('\n')
    return ' '.join(words(body[0])[:3]) if body and body[0].strip() else ''

def load_all():
    songs = {}
    for p in sorted(glob.glob(os.path.join(LANTERN, '*', 'lullaby.json'))):
        try:
            m = json.load(open(p, encoding='utf-8'))
        except Exception:
            continue
        if m.get('lyrics'):
            songs[os.path.basename(os.path.dirname(p))] = m['lyrics']
    return songs

def main():
    songs = load_all()
    n = len(songs)
    if not n:
        print('no lullabies found'); return
    per_gram = collections.Counter()
    for L in songs.values():
        for g in grams(L):
            per_gram[g] += 1
    openings = collections.Counter(last_verse_opening(L) for L in songs.values())
    limit = max(2, n // 12)

    if len(sys.argv) > 1:                      # judge one song
        m = json.load(open(sys.argv[1], encoding='utf-8'))
        me = os.path.basename(os.path.dirname(os.path.abspath(sys.argv[1])))
        L = m['lyrics']
        bad = []
        for g in sorted(grams(L)):
            others = per_gram[g] - (1 if me in songs else 0)
            if others > limit:
                bad.append(f'"{g}" is already in {others} other songs')
        op = last_verse_opening(L)
        others = openings[op] - (1 if me in songs else 0)
        if op and others:
            bad.append(f'last verse opens "{op}", like {others} other song(s)')
        if bad:
            print(f'{me}: sounds like the others -'); [print('   ', b) for b in bad]; sys.exit(1)
        print(f'{me}: its own song.'); return

    print(f'{n} lullabies. Word-runs in more than {limit} songs:')
    for g, c in per_gram.most_common():
        if c <= limit:
            break
        print(f'  {c:3d}  {g}')
    print('Last-verse openings shared by more than one song:')
    for op, c in openings.most_common():
        if c < 2:
            break
        if op:
            print(f'  {c:3d}  {op}')

if __name__ == '__main__':
    main()
