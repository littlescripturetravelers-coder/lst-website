#!/usr/bin/env python3
"""Does a new lullaby sound like the others, and is it a daytime song? Run before a song is sung.

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

# THE DAYTIME-SONG RULE (Levi, 7 Oct 2026): "going forward I don't want the songs to say
# anything about bed or close your eyes. These are meant to be played during the day, the
# future YouTube videos and not for bedtime. The lantern lullaby/the traveler lullaby is meant
# for sleep." A night's song is sung in the day: nothing of bed, sleep, night-time or eyes
# closing. And no "Shh"/"Hush": the singer runs it into the next word ("Shh, listen" came out
# "shlisten", Quiet as a River, 7 Oct 2026).
BEDTIME = [
    (r"\bbed(s|time)?\b", 'bed'), (r"\b(a)?sleep(s|ing|y|ily)?\b", 'sleep'), (r"\bslumber", 'slumber'),
    (r"\b(close|closing|shut|shutting)\s+(your|my|their|his|her|those|little)?\s*(sleepy\s+)?eyes\b", 'close your eyes'),
    (r"\beyes\s+(close|closed|closing|shut)\b", 'eyes close'), (r"\bdream(s|ing|ed|y)?\b", 'dream'),
    (r"\bgood\s*-?\s*night\b|\bnight\s*-\s*night\b", 'goodnight'), (r"\bpillow", 'pillow'),
    (r"\btuck(ed|s|ing)?\b", 'tuck in'), (r"\bblanket", 'blanket'), (r"\blullab(y|ies)\b", 'lullaby'),
    (r"\brest\s+your\s+head\b", 'rest your head'), (r"\bsleepy\s*head", 'sleepy head'),
    (r"\bnight\s*time\b|\btonight\b|\bmoon(light|lit)?\b", 'night-time'),
    (r"\bshh+\b|\bhush(ed|ing)?\b", 'Shh / Hush'),
]

def bedtime_words(lyrics):
    """What in a night's song belongs to bedtime (the daytime-song rule), each named once."""
    text = re.sub(r'\[[^\]]*\]', ' ', lyrics or '').lower()
    found = []
    for rx, name in BEDTIME:
        m = re.search(rx, text)
        if m and name not in [f[0] for f in found]:
            found.append((name, m.group(0)))
    return found

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
        for name, said in bedtime_words(L):
            bad.append(f'"{said}" is bedtime ({name}): a night\'s song is sung in the day - only the Lantern Lullaby is for sleep')
        if bad:
            print(f'{me}: not ready -'); [print('   ', b) for b in bad]; sys.exit(1)
        print(f'{me}: its own song.'); return

    print(f'{n} lullabies. Word-runs in more than {limit} songs:')
    for g, c in per_gram.most_common():
        if c <= limit:
            break
        print(f'  {c:3d}  {g}')
    sleepy = {k: bedtime_words(L) for k, L in songs.items()}
    sleepy = {k: v for k, v in sleepy.items() if v}
    print(f'Songs with bedtime words (the daytime-song rule, from 7 Oct 2026): {len(sleepy)}')
    print('Last-verse openings shared by more than one song:')
    for op, c in openings.most_common():
        if c < 2:
            break
        if op:
            print(f'  {c:3d}  {op}')

if __name__ == '__main__':
    main()
