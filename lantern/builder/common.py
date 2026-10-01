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

DATE = 'October 1, 2026'
WEEK, NIGHT, STORY = 1, 1, 1
TITLE = 'He Carries the Lambs'
SLUG = 'he-carries-the-lambs'
LULLABY_TITLE = 'Carried Close to His Heart'
TRAVELER = 'Willow the Warm'
MOTTO = '"Warm hugs, warm hearts!"'
VIRTUE = 'Compassion &amp; Tenderness'                    # entity form, for card text
VIRTUE_PLAIN = 'Compassion & Tenderness'                  # plain form, for window.LST_NIGHT
SCRIPTURE_REF = 'Isaiah 40:11'                   # for window.LST_NIGHT
NIGHT_ID = 'lst-ot-w01n01-he-carries-the-lambs-20261001'

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

# NIGHT is the night WITHIN the week (1-7); STORY is the night's number through the
# book. Night 8 of the book is Week 2, Night 1, Story 8. Two nights shipped as
# "Week 2, Night 8" before this existed, so the builder now puts it right itself:
# STORY is the one number every run gets right, and week and night-in-week both
# follow from it. A refusal here would have cost a night; a correction costs nothing.
STORY = int(STORY)
_week_from_story, _night_from_story = (STORY - 1) // 7 + 1, (STORY - 1) % 7 + 1
if int(NIGHT) != _night_from_story or int(WEEK) != _week_from_story:
    print(f"common.py: Story {STORY} is Week {_week_from_story}, Night {_night_from_story} - "
          f"was given Week {WEEK}, Night {NIGHT}; corrected.")
    WEEK, NIGHT = _week_from_story, _night_from_story
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
    "Long ago the people of Israel were tired and sad. Heavenly Father sent them a message, and it began with the softest word of all: Comfort.",
    "Then a voice called out in the wilderness. Make the road straight, it said, for the Lord is coming.",
    "Isaiah told the people how the Lord would come to them. Not with stomping feet. He would come like a shepherd walking slow among his sheep.",
    "He gathers the lambs up in his arms, Isaiah said, and carries them close against his heart. The tired mother sheep he leads gently, never fast.",
    "You are one of His little lambs. When your legs are too tired for one more step, He is the One who carries you.",
]

def story_card():
    return f'''
  <div class="card card-story reveal">
    <div class="card-label lbl-white">&#128214; Tonight's Scripture Story</div>
    <div class="card-title ct-white">{TITLE}</div>
{paras('bt-white', STORY_PARAS)}
  </div>
'''

TRAVELER_TEXT = "Willow fits tonight because comfort is her gift, and this story is Heavenly Father comforting His tired people. In Willow’s world today: her cousin cries when her block tower falls over. Willow does not fix it. She sits down close and pats her back until the crying goes quiet. Just like the Shepherd gathering the lambs in His arms, Willow learned that being held is the very first comfort."

def traveler_card():
    return f'''
  <div class="card card-wren trav-willow reveal">
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
    # THE LINKS RULE: every scripture reference is a link, made from the
    # reference itself - no fetch, so no proxy can take the links away.
    from links import linkify, count_links
    edition = 'christian' if 'christian' in os.path.basename(out_path) else 'lds'
    html = linkify(html, edition)
    assert count_links(html) >= 8, f'{out_path}: only {count_links(html)} outbound links - a night is never published without them'
    open(out_path, 'w', encoding='utf-8').write(html)
    return html
