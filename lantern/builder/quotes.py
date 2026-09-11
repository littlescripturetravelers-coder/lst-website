"""quotes.py - outside voices that need no network (THE QUOTES RULE).

A night's quotations come from lantern/quotes/bank.json: every entry was read
off its source page by a script in a session that could reach it, and the
words are verbatim from that page with the page's own address.  The nightly
run never fetches anything: it picks from the bank by theme.  When the run
CAN reach the sources it may add fresh, verified quotes on top - but the card
is never empty and never says "no outside voices tonight".

    from quotes import quotes_card
    SOURCES_TONIGHT = quotes_card('lds', ['wisdom','seeking'], n=2)
"""
import json, os, random

def ent(s):
    """HTML-safe text, the same way common.py writes it (kept local so the bank
    can be read without a canonical file on disk)."""
    return (str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            .replace('\u2019', '&rsquo;').replace('\u2018', '&lsquo;').replace('\u201c', '&ldquo;').replace('\u201d', '&rdquo;')
            .replace('\u2014', '&mdash;').replace('\u2013', '&ndash;').replace('\u2026', '&hellip;'))

BANK_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'quotes', 'bank.json')

def load_bank():
    with open(BANK_PATH, encoding='utf-8') as f:
        return json.load(f)

def pick(edition, themes, n=2, seed=None, exclude_ids=()):
    """The n entries for this edition that share the most themes with the night."""
    if n <= 0:                            # the card is already full from `extra`;
        return []                         # without this the loop below returns the whole bank
    bank = [q for q in load_bank() if q['edition'] in (edition, 'both') and q['id'] not in exclude_ids]
    themes = [t.lower() for t in themes]
    def score(q):
        return sum(1 for t in q['themes'] if t in themes)
    rng = random.Random(seed)
    scored = sorted(bank, key=lambda q: (-score(q), rng.random()))
    out, seen_talk = [], set()
    for q in scored:
        key = (q['speaker'], q['title'])
        if key in seen_talk: continue         # one quote per talk
        if score(q) == 0 and out: break       # never pad with off-theme voices once we have one
        seen_talk.add(key); out.append(q)
        if len(out) == n: break
    return out

def _talk(q, edition):
    link_txt = 'Read the full talk at ChurchofJesusChrist.org' if edition == 'lds' else 'Read it in full at ccel.org'
    role = f' &middot; {ent(q["role"])}' if q.get('role') else ''
    return f'''    <div class="conf-talk">
      <div class="conf-date" style="color:var(--gold);">{ent(q["source"])}</div>
      <div class="conf-speaker">{ent(q["speaker"])}{role}</div>
      <div class="conf-talk-title">&ldquo;{ent(q["title"])}&rdquo;</div>
      <div class="conf-body">&ldquo;{ent(q["quote"])}&rdquo;</div>
      <a class="conf-link" href="{q["url"]}" target="_blank">&#8599; {link_txt}</a>
    </div>'''

def quotes_card(edition, themes, n=2, seed=None, extra=()):
    """The card. `extra` = fresh quotes the run verified itself, same shape as the bank."""
    chosen = list(extra) + pick(edition, themes, n=max(0, n - len(extra)), seed=seed)
    assert chosen, 'the quote bank has nothing for this edition - it must never be empty'
    if edition == 'lds':
        label, title = '&#9733; From Recent General Conference', 'What Living Prophets &amp; Apostles Are Teaching Now'
    else:
        label, title = '&#9733; Voices from the Church', 'What Faithful Teachers Have Said About Tonight&rsquo;s Truth'
    body = '\n'.join(_talk(q, edition) for q in chosen)
    return f'''
  <div class="card card-conf reveal">
    <div class="card-label lbl-gold">{label}</div>
    <div class="card-title ct-gold">{title}</div>
{body}
  </div>
'''

if __name__ == '__main__':
    import sys
    ed, th = sys.argv[1], sys.argv[2].split(',')
    for q in pick(ed, th, n=int(sys.argv[3]) if len(sys.argv) > 3 else 2):
        print('-', q['speaker'], '|', q['title'], '|', q['themes'], '\n ', q['quote'][:140])
