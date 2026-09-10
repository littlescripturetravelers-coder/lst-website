import re, os

# Paths are overridable so the very same scripts run both in the nightly task
# and inside the GitHub Action (lantern/build_from_inbox.py sets these).
CANONICAL_PATH = os.environ.get('LANTERN_CANONICAL', '/home/claude/lantern/canonical.html')
OUT_DIR = os.environ.get('LANTERN_OUT', '/home/claude/lantern')
CANON = open(CANONICAL_PATH, encoding='utf-8').read()
LINES = CANON.split('\n')
# head: through <div class="scroll-area">, tail: from </div><!-- /scroll-area -->
_H = next(i for i, l in enumerate(LINES) if l.strip() == '<div class="scroll-area">')
_T = next(i for i, l in enumerate(LINES) if l.strip() == '</div><!-- /scroll-area -->')
HEAD = '\n'.join(LINES[0:_H + 1])
TAIL = '\n'.join(LINES[_T:])
assert LINES[_H].strip() == '<div class="scroll-area">'
assert LINES[_T].strip() == '</div><!-- /scroll-area -->'

DATE = 'September 10, 2026'
WEEK, NIGHT, STORY = 2, 9, 9
TITLE = 'Wisdom, a Hidden Treasure'
SLUG = 'wisdom-a-hidden-treasure'
LULLABY_TITLE = 'The Treasure Hidden in My Heart'
TRAVELER = 'Scout the Seeker'
MOTTO = '"Look and see &mdash; what could it be?"'
VIRTUE = 'Wisdom &amp; Seeking'                    # entity form, for card text
VIRTUE_PLAIN = 'Wisdom & Seeking'                  # plain form, for window.LST_NIGHT
SCRIPTURE_REF = 'Proverbs 2:4-5'                   # for window.LST_NIGHT
NIGHT_ID = 'lst-ot-w02n09-wisdom-a-hidden-treasure-20260910'

def ent(s):
    """Convert typographic Unicode to the entities the canonical file uses."""
    return (s.replace('—', '&mdash;').replace('–', '&ndash;')
             .replace('“', '&ldquo;').replace('”', '&rdquo;')
             .replace('‘', '&lsquo;').replace('’', '&rsquo;')
             .replace('…', '&hellip;'))

def paras(cls, ps, gap=8):
    out = []
    for i, p in enumerate(ps):
        style = '' if i == 0 else f' style="margin-top:{gap}px;"'
        out.append(f'    <div class="{cls}"{style}>{ent(p)}</div>')
    return '\n'.join(out)

EYEBROW = f'{DATE} &nbsp;&#9733;&nbsp; Week {WEEK} &middot; Night {NIGHT} &middot; Story {STORY}'

def hero(depth_note, verse_ref_html):
    return f'''
  <div class="story-hero reveal">
    <div class="hero-lockup">
      <div class="page-title">The <span>Morning</span> Lantern</div>
      <div class="depth-note">{depth_note}</div>
    </div>
    <div class="hero-eyebrow">{EYEBROW}</div>

    <div class="hero-title">{TITLE}</div>
    <div class="tonight-verse-label">Tonight's Scripture</div>
    <div class="tonight-verse-ref">
      {verse_ref_html}
    </div>
    <div class="gold-rule" style="margin-top:14px;"></div>
  </div>
'''

def resources_card():
    return f'''
  <div class="toolkit-card pinned-card">
    <div class="toolkit-label">&#127769; Tonight's Resources</div>
    <div class="toolkit-grid">
      <a class="toolkit-btn" href="travelers-lullaby.html" target="_blank">
        <div class="toolkit-icon">&#127926;</div>
        <div><div class="toolkit-title">The Lantern Lullaby &mdash; Lyrics &amp; Music</div><div class="toolkit-sub">Our signature Old Testament lullaby</div></div>
      </a>
      <a class="toolkit-btn" href="{SLUG}-lullaby.html" target="_blank">
        <div class="toolkit-icon">&#127925;</div>
        <div><div class="toolkit-title">Tonight's Lullaby &mdash; Lyrics &amp; Music</div><div class="toolkit-sub">{LULLABY_TITLE}</div></div>
      </a>
      <a class="toolkit-btn toolkit-btn-primary" href="{SLUG}.html" target="_blank">
        <div class="toolkit-icon">&#128214;</div>
        <div><div class="toolkit-title">Tonight's Story</div><div class="toolkit-sub">Week {WEEK} &middot; Night {NIGHT} &middot; {TITLE}</div></div>
      </a>
    </div>
  </div>
'''

STORY_PARAS = [
    "Wise Solomon wanted everyone to have something wonderful called wisdom. Wisdom means knowing the good and right thing to do.",
    "“Look for wisdom like you’re searching for hidden treasure!” Solomon said. “Dig for it, hunt for it — it’s more precious than gold and shiny jewels!”",
    "How do we find this treasure? Solomon said to listen to Heavenly Father, and to listen to the wise grown-ups who love us, like our mom and dad.",
    "“Pay attention, my child,” he wrote. “Keep my good words close, and you will grow wise and happy.”",
    "Every time you listen and learn, you’re finding a little more treasure. Heavenly Father loves to help you grow wise, one good lesson at a time.",
]

def story_card():
    return f'''
  <div class="card card-story reveal">
    <div class="card-label lbl-white">&#128214; Tonight's Scripture Story</div>
    <div class="card-title ct-white">{TITLE}</div>
{paras('bt-white', STORY_PARAS)}
  </div>
'''

TRAVELER_TEXT = "Scout fits tonight because Scout loves to search out good and wonderful things. In Scout’s world today: Scout wanted to build the tallest sandcastle but didn’t know how. Instead of giving up, Scout asked Grandpa, who knew a clever trick — wet sand sticks better! Scout listened, tried it, and built a mighty castle. Just like Solomon said to hunt for wisdom like treasure, Scout discovered that listening to wise helpers is like finding gold."

def traveler_card():
    return f'''
  <div class="card card-wren trav-scout reveal">
    <div class="card-label lbl-wren">&#9733; Scripture Traveler of the Night</div>
    <div class="traveler-center">
      <div class="traveler-name">{TRAVELER}</div>
      <div class="traveler-motto">{MOTTO}</div>
    </div>
    <div class="bt">{ent(TRAVELER_TEXT)}</div>
  </div>
'''

DEPTH = [('quick', 'Quick read'), ('deep', 'Medium read'), ('heavenly', 'Deep read')]

def build(edition_cards, verse_ref_html, out_path, page_title):
    """edition_cards: dict tier -> list of card html strings (hero excluded)."""
    blocks = []
    for key, note in DEPTH:
        active = ' active' if key == 'quick' else ''
        body = ''.join(edition_cards[key])
        blocks.append(f'''
<!-- ======================== {key.upper()} ======================== -->
<div class="edition{active}" id="tab-{key}">
{hero(note, verse_ref_html)}
{body}
</div><!-- /{key} -->
''')
    html = HEAD + '\n' + '\n'.join(blocks) + '\n' + TAIL
    # Swap <title> and the window.LST_NIGHT block by pattern, so this works no
    # matter which night the canonical file happens to be.
    html = re.sub(r'<title>.*?</title>', f'<title>The Morning Lantern &middot; {page_title}</title>', html, count=1, flags=re.S)
    new_night = f"""window.LST_NIGHT = {{
  id:         '{NIGHT_ID}',
  storyTitle: '{TITLE}',
  scripture:  '{SCRIPTURE_REF}',
  traveler:   '{TRAVELER}',
  virtue:     '{VIRTUE_PLAIN}'
}};"""
    html, n = re.subn(r"window\.LST_NIGHT = \{.*?\};", lambda m: new_night, html, count=1, flags=re.S)
    assert n == 1, 'window.LST_NIGHT block not found in canonical'
    open(out_path, 'w', encoding='utf-8').write(html)
    return html
