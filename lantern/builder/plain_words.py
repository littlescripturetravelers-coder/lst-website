#!/usr/bin/env python3
"""THE PLAIN WORDS CHECK - is the Deep read written for a tired parent?

  python3 lantern/builder/plain_words.py <morning-lantern-lds.html> [more files]

Exit 1 on any failure. Levi found the Deep read "a little weird worded" (28 Sept
2026). This reads only the words LST wrote itself and refuses the ones that sound
like a commentary. Everything verbatim is dropped first, because those keep their
own words: the story and Traveler cards, the Verse of the Day and Full Passage
cards, every conference or quotation card, link text, and anything inside
quotation marks.

Measured on the Deep read (tab-heavenly), which holds every card:
  FAIL  a sentence of LST's own prose over MAX_WORDS words
  FAIL  a never-use word (whole word, any case)
  FAIL  an average sentence length over MAX_AVG
  PRINT every sentence over WARN_WORDS, and the longest ones, to read once
Fix the prose, never this file. audit.py runs it last and folds it into its list.
"""
import html, re, sys, statistics

MAX_WORDS  = 35
WARN_WORDS = 25
MAX_AVG    = 19.0

NEVER = """eschatological typology typological pericope exegesis exegetical hermeneutic
hermeneutical soteriology soteriological chiasmus chiastic theophany deuteronomic septuagint
apocalyptic liturgical paradigm motif juxtapose juxtaposition dichotomy nuance nuanced
trajectory transcendent immanent salvific ontological epistemological eschaton kerygma
didactic polemic hegemony teleological""".split()
NEVER_RE = re.compile(r'\b(' + '|'.join(NEVER) + r')\b', re.I)

# cards whose words are somebody else's, matched on the card's label
VERBATIM_LABELS = ("tonight's scripture story", "scripture traveler", "verse of the day",
                   "full passage", "tonight's resources")

def deep_section(src):
    m = re.search(r'id="tab-heavenly">([\s\S]*?)</div><!-- /heavenly -->', src)
    if not m:
        sys.exit("plain_words: no tab-heavenly section found")
    return m.group(1)

def label_of(card):
    m = re.search(r'class="(?:card-label|toolkit-label)[^"]*"[^>]*>([\s\S]*?)</', card)
    return html.unescape(re.sub('<[^>]+>', ' ', m.group(1))).strip().lower() if m else ''

def card_prose(card):
    """The sentences LST wrote in one card, with the borrowed words taken out."""
    c = re.sub(r'<script[\s\S]*?</script>', ' ', card)
    c = re.sub(r'<(?:a|button)\b[^>]*>[\s\S]*?</(?:a|button)>', ' ', c)              # link text
    c = re.sub(r'<[^>]+class="(?:card-label|toolkit-[a-z]+|tonight-tag|chip|pill|card-title)[^"]*"[^>]*>[\s\S]*?</[^>]+>', ' ', c)
    c = re.sub(r'</(?:p|li|div|h[1-6]|blockquote|tr)>', ' . ', c)                    # a block end ends a sentence
    c = html.unescape(re.sub(r'<[^>]+>', ' ', c))
    c = re.sub(r'“[^”\n]{1,600}”', ' ', c)                              # “quoted words”
    c = re.sub(r'"[^"\n]{1,600}"', ' ', c)                                             # "quoted words"
    c = re.sub(r'\s+', ' ', c)
    return c

def own_prose(src):
    parts = re.split(r'(?=<div class="card\b)', deep_section(src))
    out = []
    for card in parts:
        if 'class="story-hero' in card or 'class="card card-conf' in card or 'class="card card-quote' in card:
            continue
        if any(v in label_of(card) for v in VERBATIM_LABELS):
            continue
        out.append(card_prose(card))
    return ' '.join(out)

def sentences(text):
    for s in re.split(r'(?<=[.!?])\s+', text):
        s = s.strip(' .—–-·*:')
        if len(s.split()) >= 4:
            yield s

def check(path, quiet=False):
    src = open(path, encoding='utf-8').read()
    sents = list(sentences(own_prose(src)))
    if not sents:
        print(f"{path}: FAIL - found no prose to measure"); return False
    lengths = [len(s.split()) for s in sents]
    avg = statistics.mean(lengths)
    fails = []
    print(f"== {path}: {len(sents)} sentences of LST's own prose, average {avg:.1f} words")
    for s, n in zip(sents, lengths):
        if n > MAX_WORDS:
            fails.append(f"{n} words: {s}")
        elif n > WARN_WORDS and not quiet:
            print(f"  long {n}w: {s}")
    for s in sents:
        for m in NEVER_RE.finditer(s):
            fails.append(f"never-use word '{m.group(0)}': {s}")
    if avg > MAX_AVG:
        fails.append(f"average sentence length {avg:.1f} is over {MAX_AVG}")
    for f in fails:
        print("  FAIL " + f)
    if not quiet:
        print("  the longest, to read once:")
        for s in sorted(sents, key=len, reverse=True)[:8]:
            print(f"    {len(s.split())}w: {s[:200]}")
    print(f"  {'PASS' if not fails else 'FAIL'} - plain words ({len(fails)} problem{'s' if len(fails)!=1 else ''})")
    return not fails

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--quiet']
    if not args:
        sys.exit(__doc__)
    results = [check(p, quiet='--quiet' in sys.argv) for p in args]
    sys.exit(0 if all(results) else 1)
