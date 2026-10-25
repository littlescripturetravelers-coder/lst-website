import re, sys, os, subprocess
from common import CANON, HEAD, TAIL, STORY_PARAS, SLUG, NIGHT_ID, ent

path = sys.argv[1]
html = open(path, encoding='utf-8').read()
ok = True
def check(cond, msg):
    global ok
    print(('PASS ' if cond else 'FAIL ') + msg)
    ok = ok and cond

# 1. CSS + JS byte-identical (except LST_NIGHT + title)
style_c = re.findall(r'<style>.*?</style>', CANON, re.S)
style_h = re.findall(r'<style>.*?</style>', html, re.S)
check(style_c == style_h, f'CSS blocks identical ({len(style_c)} blocks)')
def scripts(s):
    return [re.sub(r"window\.LST_NIGHT = \{.*?\};", 'LST', x, flags=re.S) for x in re.findall(r'<script[^>]*>.*?</script>', s, re.S)]
check(scripts(CANON) == scripts(html), f'JS blocks identical except LST_NIGHT ({len(scripts(html))} blocks)')
i = html.index('<div class="scroll-area">')+len('<div class="scroll-area">')
t = html[html.index('</div><!-- /scroll-area -->'):]
norm = lambda x: re.sub(r"window\.LST_NIGHT = \{.*?\};", 'LST', re.sub(r'<title>.*?</title>', '<title></title>', x, 1), flags=re.S)
check(norm(html[:i]) == norm(HEAD) and norm(t) == norm(TAIL), 'head and tail verbatim except <title> and LST_NIGHT')

# 2. node --check
js = '\n'.join(re.findall(r'<script>(.*?)</script>', html, re.S))
open('/tmp/_all.js', 'w').write(js)
r = subprocess.run(['node', '--check', '/tmp/_all.js'], capture_output=True, text=True)
check(r.returncode == 0, 'node --check ' + (r.stderr.strip()[:200] if r.returncode else ''))

# 3. depth tabs
check('id="depthHeavenly"' in html and "pmDepth('heavenly')" in html, 'Heavenly button wired')
check("quick: 'Quick read'" in html and "deep: 'Medium read'" in html and "heavenly: 'Deep read'" in html,
      'DEPTH_LABELS reads Quick / Medium / Deep read')
m = re.search(r"\['quick'.*?'heavenly'\]", html)
check(bool(m), "renderDepthButtons array includes heavenly")
check('id="tab-medium"' not in html and 'id="tab-superdeep"' not in html, 'no tab-medium / tab-superdeep')
check(html.count('<div class="edition') == 3, f'exactly three edition sections ({html.count(chr(60)+"div class=" + chr(34) + "edition")})')
for note, n in [('Quick read', 1), ('Medium read', 1), ('Deep read', 1)]:
    check(f'<div class="depth-note">{note}</div>' in html, f'depth-note "{note}" present')

# 4. tiers
tiers = {}
for key in ['quick', 'deep', 'heavenly']:
    m = re.search(rf'<div class="edition(?: active)?" id="tab-{key}">(.*?)</div><!-- /{key} -->', html, re.S)
    check(bool(m), f'tier {key} present')
    body = m.group(1)
    labels = re.findall(r'<div class="(?:card-label[^"]*|toolkit-label|tonight-tag)">(.*?)</div>', body)
    tiers[key] = labels
expected = {'quick': 7, 'deep': 16, 'heavenly': 27}
prev = []
for key, n in expected.items():
    check(len(tiers[key]) == n, f'{key}: {len(tiers[key])} cards (expected {n})')
    missing = [l for l in prev if l not in tiers[key]]
    check(not missing, f'{key} contains all of previous tier' + (f' MISSING {missing}' if missing else ''))
    prev = tiers[key]
# 4b. THE STAGES AND THE GROWN-UP'S LIFE (Levi, 25 Oct 2026: "applied to parent life or adult life ... one section
# ... titled applying it to all children and adolescent development stages ... for all future morning lanterns";
# "do the different human development stages in the same box as the one above. Don't add a new box"). In every
# depth The Heart of Tonight's Story ends with the stages section naming all six stages; the rest of the night speaks
# to the grown-up reading it, so the child talk lives in that section, the Parent's Heart and the conversation cards.
_STAGES = ['Early Years', 'Early Elementary', 'Late Elementary', 'Early Adolescence', 'Teen', 'Young Adult']
for key in expected:
    body = re.search(rf'id="tab-{key}">(.*?)</div><!-- /{key} -->', html, re.S).group(1)
    heart = re.search(r"The Heart of Tonight(?:&#39;|'|&rsquo;)s Story</div>(.*?)\n  </div>", body, re.S)
    hb = heart.group(1) if heart else ''
    check('Applying It to All Children and Adolescent Development Stages' in hb and 'class="stages-block"' in hb
          and all(f'<strong>{st}</strong>' in hb for st in _STAGES),
          f"{key}: The Heart of Tonight's Story carries the stages section with all six stages")
_deep = re.search(r'id="tab-heavenly">(.*?)</div><!-- /heavenly -->', html, re.S).group(1)
_rest = re.sub(r'<div class="stages-block".*?\n    </div>', '', _deep, flags=re.S)
_rest = re.sub(r'<div class="card [^"]*(?:pinned-card|card-story)[^"]*">.*?\n  </div>', '', _rest, flags=re.S)
_rest = re.sub(r'<div class="card [^"]*">\s*<div class="card-label[^>]*>[^<]*(?:Conversation|Scripture Traveler)[^<]*</div>.*?\n  </div>', '', _rest, flags=re.S)
_rest = re.sub(r'<div class="quote-text">.*?</div>|<div class="conf-body">.*?</div>', '', _rest, flags=re.S)
_kid = re.findall(r"\b(?:child|children|kids?)\b", re.sub(r"\bas (?:a )?little child(?:ren)?\b|\bas a child\b", ' ', re.sub(r'<[^>]+>', ' ', _rest), flags=re.I), re.I)   # "become as a little child" is scripture, not child talk
check(len(_kid) <= 6, f"the Deep read speaks to the grown-up's own life ({len(_kid)} child words outside the stages, Parent's Heart, story, Traveler and conversation cards; at most 6)")
check('For young children:' not in html and 'at a child&rsquo;s size' not in html and "at a child’s size" not in html,
      'no "For young children" line or "at a child’s size" (the stages teach each age)')
print('   deep-read order:', [re.sub(r'&#\d+; ?', '', l) for l in tiers['heavenly']])

# 5. resources
for key in expected:
    m = re.search(rf'id="tab-{key}">(.*?)</div><!-- /{key} -->', html, re.S).group(1)
    check(f'href="{SLUG}.html"' in m and f'href="{SLUG}-lullaby.html"' in m and 'href="travelers-lullaby.html"' in m, f'{key}: three resource links')
check('trust-him-to-lead-the-way' not in html and 'a-lamp-for-my-feet' not in html, 'no previous-night slug')

# 5b. THE SONG RULE - the night's song page must exist beside the editions and
# carry its own Play button and <audio id="player">. The app opens the page,
# never the bare recording; a night without its page lands on a player with no words.
_song_path = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), f'{SLUG}-lullaby.html')
if os.path.exists(_song_path):
    _song = open(_song_path, encoding='utf-8').read()
    check('id="player"' in _song and 'id="playBtn"' in _song and f'{SLUG}-lullaby.mp3' in _song,
          'song page has its own player (audio#player, #playBtn, the night\'s mp3)')
else:
    check(False, f'{SLUG}-lullaby.html exists beside the editions (THE SONG RULE)')

# 5c. THE LINKS RULE and THE QUOTES RULE - a night never ships without its
# outside links or its outside voices, whatever the build machine could reach.
_nlinks = len(re.findall(r'<a\b[^>]*href="https?://', html))
check(_nlinks >= 8, f'outbound links present ({_nlinks}; THE LINKS RULE needs at least 8)')
check(bool(re.search(r'href="https://www\.(churchofjesuschrist\.org/study/scriptures|biblegateway\.com/passage)', html)), 'scripture references are linked')
check('prints no outside' not in html and 'quotes no one but scripture' not in html, 'no "no outside voices tonight" card (THE QUOTES RULE)')
check(bool(re.search(r'class="(conf-link|quote-link)" href="https?://', html)), 'a quotes card with a source link is present (THE QUOTES RULE)')

# 5d. THE READING-POSITION RULE - the app restores a family's depth and scroll
# through these two names; a page without them loses every reader's place.
check("var currentDepth" in html and "function showTab(" in html, 'currentDepth and showTab(id) present (THE READING-POSITION RULE)')

# 6. LST_NIGHT + story verbatim
check(f"id:         '{NIGHT_ID}'" in html, 'LST_NIGHT id updated')
for key in expected:
    m = re.search(rf'id="tab-{key}">(.*?)</div><!-- /{key} -->', html, re.S).group(1)
    check(all(ent(p) in m for p in STORY_PARAS), f'{key}: story text verbatim')

# 7. div balance in authored region
authored = html[html.index('<div class="scroll-area">')+len('<div class="scroll-area">'):html.index('</div><!-- /scroll-area -->')]
check(authored.count('<div') == authored.count('</div>'), f"div balance {authored.count('<div')} / {authored.count('</div>')}")
hexes = re.findall(r'(?<!&)#[0-9A-Fa-f]{6}\b', authored)
check(not hexes, f'no hardcoded hex in authored markup {hexes[:5]}')
check('\\"' not in authored, 'no escaped quotes leaked')
bad = re.findall(r'[“”‘’—–…]', authored)
check(not bad, f'no raw typographic chars ({len(bad)})')
check(not re.search(r'note on (?:tonight(?:&rsquo;|\u2019|\')s|the) wording', authored, re.I),
      'no note about checking the scripture wording on the page (Levi, 5 Oct 2026; it goes in the report)')
print('\nALL PASS' if ok else '\nFAILURES PRESENT')

# 8. faith-label leak check
LDS_MARKERS = ['General Conference', 'Latter-day Prophet', 'churchofjesuschrist.org', 'Book of Mormon', 'Nephi', 'Holy Ghost']
if 'lds' not in path:
    leaks = [m for m in LDS_MARKERS if m in authored and not (m == 'Holy Ghost' and 'methodist' in path)]
    check(not leaks, f'no LDS labels/sources leak into non-LDS edition {leaks}')
else:
    check('Spurgeon' not in authored, 'no Spurgeon card in LDS edition')
print('ALL PASS (with leak check)' if ok else 'FAILURES PRESENT')

# 9. THE PLAIN WORDS CHECK (28 Sept 2026): is the Deep read written for a tired parent?
# plain_words.py sits beside this file; it drops every verbatim card and quotation
# and measures only what LST wrote itself. Fix the prose, never the check.
pw = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'plain_words.py')
r = subprocess.run([sys.executable, pw, path], capture_output=True, text=True)
print(r.stdout.rstrip())
check(r.returncode == 0, 'plain words: every sentence LST wrote is short and plain (see above)')
print('ALL PASS (with plain words)' if ok else 'FAILURES PRESENT')

# 10. THE DAYTIME-SONG RULE (Levi, 7 Oct 2026): a night's song is sung in the day - nothing of
# bed, sleep, dreams, night-time or eyes closing, and no "Shh"/"Hush" (the singer runs it into
# the next word). Only the Lantern Lullaby is for sleep. Judged before the song is sung, while
# the night has a lullaby.json and no recording yet; a song already sung is not re-judged here.
night_dir = os.path.dirname(os.path.abspath(path))
lj = os.path.join(night_dir, 'lullaby.json')
slug_here = os.path.basename(night_dir)
if os.path.exists(lj) and not os.path.exists(os.path.join(night_dir, slug_here + '-lullaby.mp3')):
    import json as _json
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from lyric_tells import bedtime_words
    try:
        found = bedtime_words(_json.load(open(lj, encoding='utf-8')).get('lyrics', ''))
    except Exception as e:
        found = [('unreadable lullaby.json', str(e))]
    check(not found, 'daytime song: no bed, sleep, dreams, night-time, closing eyes or "Shh" in the lyrics '
          + ('' if not found else str([s for _, s in found])))
    print('ALL PASS (with the daytime song)' if ok else 'FAILURES PRESENT')
