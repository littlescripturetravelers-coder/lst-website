---
name: morning-lantern-nightly
description: "Produce the nightly Little Scripture Travelers Morning Lantern from a story PDF and a canonical HTML — extraction, the lullaby, then the two editions (Latter-day Saint, Christian) at three depths, each passing a full QA gate, then pushed to the website repo where the Action publishes them to the account. Runs unattended. Use for any Morning Lantern nightly build, edition rebuild, or publish fix."
---

# Morning Lantern — Nightly Production Run

Inputs: tonight's story PDF + a canonical Morning Lantern HTML. Output: a lullaby, two HTML editions (Latter-day Saint and Christian) each at three depths, and a `night.json` — pushed to the website repo, where the Action puts the night into the account. These go to paying subscribers. Never invent a fact, a quote, or a URL.

**This runs unattended.** A scheduled Cowork starts it with nobody watching. Never stop to ask; never wait for "next". Where the old run paused, proceed on the stated defaults and put the assumptions at the top of the final report.

## Order of operations

1. **Extract** from the PDF. 2. **Lullaby.** 3. **Both editions**, in this order: Latter-day Saint, then Christian. Build the run with the **Python composer** below — write `common.py` and `audit.py` once, then `lds.py` and `christian.py`. 4. **Publish** (see the last section): push the finished files into the website repo. The Action does the rest. Never through the Drive connector, and never by pasting into Admin.

## Step 0 — Extract

The PDF text layer is doubled and interleaved; `pdftotext` (with or without `-layout`, even after dedup) comes out garbled. **Read the PDF pages visually** (`Read` with `pages: "1-5"`) and transcribe: story title, key verse (the header often gives only the chapter — pick the verse the story quotes and say so), Week · Night · Story numbers, Traveler, the story paragraphs verbatim, the Traveler paragraph verbatim, the Five Stones lines (→ Story Connection card), the Parent Prompt questions (→ Conversation Starter), and the Parent Experience questions (→ Parent's Heart pinned card). `pdfinfo` gives the Come Follow Me week title in the Subject field. (When the PDF comes from Google Drive, `read_file_content` gives clean text for the story, Traveler and question sections; only the Five Stones / Remember This come out doubled.)

Slug = lowercase, hyphens, no punctuation. Resources: `{slug}.html`, `{slug}-lullaby.html`, and `travelers-lullaby.html` (never changes).

**The 5-page extract never contains** the week's reading plan, the book number, or the Traveler's motto. The Traveler motto is in memory (`/areas/brand-system.md`) — never improvise it. Nobody is there to ask, so proceed on these defaults and state them at the top of the final report: edition date = the day after the canonical's date; eyebrow "Week W · Night n · Story N" mirroring the canonical, where n is the night **within the week** (1–7, the index sheet's "Night in Week") and N is the night's number through the book — Night 8 is "Week 2 · Night 1 · Story 8", never "Week 2 · Night 8"; **no reading-plan block** (the canonical carries `.weekly-block` CSS but no markup, so match it); `LST_NIGHT.id` = `lst-ot-w0Wn0N-{slug}-YYYYMMDD`.

## Step 1 — Lullaby

Title matching the story's theme, 3–4 short verses + repeating refrain, ages 2–8, built on the story's key image. Keep one meter throughout (8-6-8-6 sings to any common-meter tune) and rhyme lines 2 and 4 so a parent can sing it without a new melody. Output, then stop.

**The song page.** `lullaby_page.py` (repo: `lantern/builder/`) builds `{slug}-lullaby.html` on `lantern/lullaby-template.html` — a copy of the app's own "A Little Travelers' Lullaby" page — so the night's lullaby looks and behaves exactly like that one inside the app (theme, text size, Play button, mini bar, sleep timer, repeat). Two things must be true of the built page: `<audio id="player"` has the mp3 linked **in full** (`https://littlescripturetravelers.com/lantern/{slug}/{slug}-lullaby.mp3` — the app opens the page from a copy it keeps, so a bare file name is silent there), and `const LULLABY =` carries one part per verse and chorus. Never ship the older navy card-list page.

**THE SONG RULE.** A night's song is its page — the title, the words, and the page's own Play button — never the bare recording. The app opens the song page first and falls back to the .mp3 only for a night that has no page, so a night must always ship `{slug}-lullaby.html` beside its mp3, built from `lantern/lullaby-template.html` with `<audio id="player">` and `#playBtn`. `audit.py` fails the night if the page is missing or has no player; `publish_to_supabase.py` writes `song_url` = the page and `song_audio_url` = the mp3, and never the other way round.

## Step 2 — Build both editions

### common.py (write once, reuse for both)

The shape below is the template. (An older copy sits in the Drive folder "Lantern Builder" as `common.py`; if the two disagree, this file wins.)

```python
import re, os
CANONICAL_PATH = os.environ.get('LANTERN_CANONICAL', '/home/claude/lantern/canonical.html')  # the GitHub Action sets these
OUT_DIR = os.environ.get('LANTERN_OUT', '/home/claude/lantern')
CANON = open(CANONICAL_PATH, encoding='utf-8').read(); LINES = CANON.split('\n')
#   HEAD = everything through the line '<div class="scroll-area">'   (assert the split lines by content)
#   TAIL = everything from the line '</div><!-- /scroll-area -->'
DATE, WEEK, NIGHT, STORY, TITLE, SLUG, LULLABY_TITLE, TRAVELER, MOTTO = ...   # rewrite per night
VIRTUE = 'Joy &amp; Praise'; VIRTUE_PLAIN = 'Joy & Praise'; SCRIPTURE_REF = 'Psalm 150:6'; NIGHT_ID = 'lst-ot-w01n07-…-20260908'
STORY_PARAS = [...]; TRAVELER_TEXT = "..."          # PDF verbatim
def ent(s):  # canonical uses entities; author prose in Unicode and convert
    return (s.replace('—','&mdash;').replace('–','&ndash;').replace('“','&ldquo;').replace('”','&rdquo;')
             .replace('‘','&lsquo;').replace('’','&rsquo;').replace('…','&hellip;'))
def paras(cls, ps, gap=8): ...  # <div class="bt">… ; style="margin-top:8px;" on every div after the first
def hero(depth_note, verse_ref_html): ...  # story-hero: page-title, depth-note, hero-eyebrow, hero-title, tonight-verse-ref, gold-rule
def resources_card(): ...   # pinned toolkit-card: travelers-lullaby.html, {slug}-lullaby.html, {slug}.html (primary)
def story_card(): ...       # card-story, card-title, STORY_PARAS verbatim via paras('bt-white', …)
def traveler_card(): ...    # card-wren trav-<beau|scout|willow|wren>, traveler-name, traveler-motto (locked), PDF paragraph verbatim
DEPTH = [('quick','Quick read'),('deep','Medium read'),('heavenly','Deep read')]  # three tiers - see "Three readings" below
def build(cards_by_tier, verse_ref_html, out_path, page_title):
    # HEAD + for each tier: '<div class="edition[ active]" id="tab-{key}">' + hero + cards + '</div><!-- /{key} -->' + TAIL
    # then re.sub the <title> and the whole window.LST_NIGHT = {…}; block BY PATTERN (id, storyTitle, scripture, traveler, virtue)
    # — never by exact-string match; the canonical's own LST_NIGHT id has drifted before (b09 vs no b09) and broke the build
```

Each `<faith>.py` defines every card once as a string, then composes tiers from lists so cumulativeness cannot go wrong, and its `__main__` writes to `f'{OUT_DIR}/{SLUG}__morning-lantern-<faith>.html'`:

```python
BASE   = [RES, PARENT_HEART, STORY, TRAV, HEART, VERSE]                                                     # 6 (Resources first)
QUICK  = BASE + [APPLY_QUICK]                                                                               # 7
DEEP   = BASE + [WHY, HIST, CONF1, WORD1, CONF2, PROPHET, CONVO, GO_DEEPER, APPLY_DEEP, STORY_CONN]         # 16
HEAVENLY = BASE + [WHY, HIST, CONF1, WORD1, CONF2, FULL, WORD2, XREFS, COMMENTARY, THREAD, PROPHET, CONVO,
           GO_DEEPER, APPLY_DEEP, STORY_CONN, THREE_Q,
           CONNECT_DOTS, TEN_VOICES, SERMONS, STUDY_TACTICS, ONE_INVITATION]                                # 27
```

### Three readings, and why the ids do not match the names

A night is written at **three** depths, not five. The old Medium (12) and Super Deep (23)
are retired: nobody was reading two studies that sat between the three that matter.

**The section ids stay `quick`, `deep` and `heavenly`.** The app renames them on the way
into the frame, because a published night carries its own frozen copy of the picker and
cannot be told anything later:

| section id | card list | what a family sees |
|---|---|---|
| `tab-quick` | QUICK (7) | ⚡ Quick read |
| `tab-deep` | DEEP (16) | 📖 Medium read |
| `tab-heavenly` | HEAVENLY (27) | 🔥 Deep read |

Do not rename the ids to match the labels. The app fills its three slots by looking for
`quick`, then `deep` or `medium`, then `heavenly` or `superdeep` — a file whose deepest
study is called `deep` would land in the Medium slot and leave the Deep slot empty.

The canonical's own tables must read (once, in the canonical, so gate 1 still holds):

```js
var DEPTH_LABELS = { quick: 'Quick read', deep: 'Medium read', heavenly: 'Deep read' };
var DEPTH_SHORT  = { quick: '\u26A1 Quick', deep: '\uD83D\uDCD6 Medium', heavenly: '\uD83D\uDD25 Deep' };
```

### Two editions, and who reads which

| file | edition | column in the account | who is served it |
|---|---|---|---|
| `morning-lantern-lds.html` | Latter-day Saint | `story_html` | families who chose Latter-day Saint, and anyone who has not said |
| `morning-lantern-christian.html` | Christian | `story_html_nondenom` | families who chose Christian — and, until their own editions return, Catholic, Baptist and Methodist families too |

The Christian edition is the non-denominational voice from the faith pack below: NIV,
today's teachers, the gospel. It is not a Baptist or Methodist edition with the labels
filed off; it has to read well to all three. Catholic, Baptist and Methodist are not
built. Their packs stay in this file so the day the pipeline is boring enough to carry
a third, nothing has to be rediscovered.

The faith scripts are re-run unattended by the GitHub Action, so they must import only the standard library and `common.py`, read no file but the canonical, and stay under 120,000 bytes each (move long strings to a `<faith>_text.py` module if one grows past that).

**Card order (canonical):** hero · Resources (pinned) · Parent's Heart (pinned) · Story · Traveler · Heart of Tonight · Verse of the Day · [Why This Matters · Historical Background · Conference 1 · Word Study · Conference 2 · Full Passage · Word Study 2 · Cross-References · Commentary · Doctrinal Thread] · Prophet/quote card · Conversation Starter · Go-Deeper · Apply It · Story Connection · Three Questions · [**Deep read only:** Connecting the Dots · Ten Voices · Sermons & Talks · Study Tactics] · One Invitation.

Gotchas learned the hard way:
- Python < 3.12 forbids backslashes inside f-string expressions — inside `ent("…")` strings use single-quoted HTML attributes (`style='color:var(--amber);'`), never `\"`.
- Anything **outside** `ent()` (conf-talk titles, `<strong>` labels, xref labels) must use entities directly — no raw curly quotes or dashes; the audit catches them.
- The **Story Connection card uses `.tonight-tag`, not `.card-label`** (the Anton accent badge, one per layout).
- The canonical already ships the `heavenly` tab wiring (`depthHeavenly`, `DEPTH_LABELS.heavenly`, `renderDepthButtons`) — verify, don't re-add. Build only `tab-quick`, `tab-deep` and `tab-heavenly`; the picker reads the sections that are actually on the page, so omitting `medium` and `superdeep` gives three buttons with no other edit.
- Card classes by role: quote cards `card-quote` + `quote-inner-gold`; conference/sermon cards `card-conf` + `conf-talk` (`conf-date` colour alternates `var(--gold)` / `var(--amber)`); study tactics and invitation `card-gold`; synthesis `card-navy`; word studies/xrefs `card-teal` with `chips`.

**Story and Traveler cards are verbatim from the PDF in both editions** — including "Heavenly Father." So are the Parent Prompt/Experience questions and the Five Stones lines. Only adult prose takes the edition's voice. Grep the Christian edition for `Heavenly Father` and confirm each hit is PDF-verbatim (one extra hit lives in the canonical JS — fine).

## Faith packs

| Edition | Bible + link | Card relabels (Conf1 / Conf2 / Prophet) | Pinned card title | Study tactics |
|---|---|---|---|---|
| LDS | KJV + BoM/D&C at `churchofjesuschrist.org/study/scriptures/{vol}/{book}/{ch}?lang=eng&id=p{v}#p{v}` (ranges `&id=p5-p7#p5`) | (canonical) — **no Spurgeon card** | The Atonement | journaling, footnote/TG chains, liken, ponder+record |
| Catholic | NABRE, `bible.usccb.org/bible/{book}/{ch}` **chapter-level only** (slugs like `psalms`, `2timothy`) | From the Holy Father / From the Saints & Church Fathers / From the Catechism | The Cross (Paschal Mystery) | Lectio Divina (4 steps), Examen, praying the Psalms, CCC cross-refs; mention `bible.usccb.org/daily-bible-reading` |
| Non-denom | NIV, BibleGateway `passage/?search={ref}&version=NIV` | From Today's Teachers / Voices of the Faith / A Word from a Trusted Teacher | The Gospel | SOAP, verse mapping, memorization plan, praying scripture, two-translation |
| Baptist | CSB + KJV alternate link, BibleGateway | From the Pulpit (Spurgeon) / Preachers of the Word / A Word from the Preacher | The Cross (finished work) | expository walk-through, Treasury of David, sword drills, memorization, praying the text |
| Methodist | NRSVue, BibleGateway `&version=NRSVUE` | From the Wesleys / A Hymn for Tonight / Words of the Founders | Amazing Grace | means of grace as rhythm (Wesley's six reading directions), Explanatory Notes, hymn-singing, "How is it with your soul?" |

Voices: LDS — Heavenly Father, the Savior, covenants, the Holy Ghost. Catholic — God our Father, Our Lord, the Church, grace, the sacraments, the Mass, the saints. Non-denom — God, Jesus, the gospel, God's Word, quiet time, personal relationship. Baptist — the Word, brother/sister, testimony, grace alone through faith alone, the invitation. Methodist — prevenient/justifying/sanctifying grace, means of grace, holiness of heart and life, the warmed heart. **Never** use "Do all the good you can" as a sourced Wesley quote; it is apocryphal — say so on the Methodist Ten Voices card.

## Quotes and links — verify, never assert

Fetch every quote's source page before using it. Attribute name, source, year. Only link URLs confirmed to resolve; if the quote checks out but no free full text exists, ship it with attribution and no link, and say so on the card. **Eight verified beat ten padded** — the card intro states how many and why. If a deep link is uncertain, link the archive's landing page.

Source map (what fetched, what didn't — fetches to new domains need user approval and time out when the user is away, so prefer these):
- **LDS**: `churchofjesuschrist.org/study/general-conference/YYYY/MM?lang=eng` lists every talk with slugs (recent talks `NNspeaker`, older ones title slugs) — read the last two conferences' lists to pick the two "recent" cards; Teachings of Presidents manuals; the NT class-member study guide page "Teachings of Latter-day Prophets on the Blessings of Scripture Study" is a verified quote index with sources.
- **Catholic**: `vatican.va` — CCC `archive/ENG0015/__PR.HTM` (§120–130) and `__PS.HTM` (§131–141); Dei Verbum; papal audiences/letters (Leo XIV's 2026 *Dei Verbum* catecheses under `/content/leo-xiv/en/audiences/2026/`; his homily index at `/content/leo-xiv/en/homilies/2026.index.html`); `newadvent.org/fathers` (long pages truncate — ask for early verses; Augustine on Psalm 119 = `1801119.htm`, Vulgate numbering inside). **usccb starts returning 403 after ~5 fetches** — fetch the key psalm chapter first, in one request asking for every verse you need. *Verbum Domini* is too long to fetch.
- **Non-denom**: `billygraham.ca` (BGEA Canada, fetchable; billygraham.org is search-only), `intouch.org` / `intouchuk.org` devotions (In Touch devotions on Psalm 119:105 exist), `desiringgod.org` (index by scripture: `/scripture/psalms/119/messages`), Tozer *Pursuit of God* ch. 6 at worthychristianbooks.com, TGC "50 Quotes from Tim Keller". **gospelinlife.com and utmost.org need fetch approval.** Lewis *Reflections on the Psalms* — verify wording via an excerpt, ship unlinked. No verifiable Corrie ten Boom / Lucado / Shirer source was found in one night; leave the slot empty rather than pad.
- **Baptist**: Spurgeon *Treasury of David* at `blueletterbible.org/Comm/spurgeon_charles/tod/ps{N}_{a}-{b}.cfm` (archive.spurgeon.org and spurgeon.org are gated — disclose the substitution); Spurgeon sermons at `ccel.org/ccel/spurgeon/sermons01.{roman}.html` ("The Bible" No. 15 = `xiv`); `wacriswell.com/sermons/YYYY/slug/` (sermon library, fetchable); `lwf.org/ultimate-guide-to-bible-study` quotes Adrian Rogers with article titles. bfm.sbc.net is gated.
- **Methodist**: `wesley.nnu.edu/john-wesley/the-sermons-of-john-wesley-1872-edition/sermon-NN-slug/` (the alphabetical-order index page returns exact URLs; Means of Grace = 16, On Family Religion = 94); Preface to Sermons at `ccel.org/ccel/wesley/sermons.iv.html`; Aldersgate journal at `ccel.org/ccel/wesley/journal.vi.ii.xvi.html`; OT Notes preface §18 (six reading directions) at `wesley.nnu.edu/john-wesley/john-wesleys-notes-on-the-bible/preface-to-the-old-testament-notes/`. hymnary.org confirms author/date/PD but refuses to print stanzas — quote the PD hymn from knowledge and link the UMH number. umc.org is gated.
- **BibleGateway never serves text** — NIV/CSB/NRSVue wording is from knowledge; name which verses to spot-check in the reply. Vulgate psalm numbering: Augustine's Psalm 119 is his 118.

## Brand rules (Style Sheet v2.1)

- Fredoka = display; Nunito = body/UI; **Anton = accent caps, one badge per layout** (`.tonight-tag`).
- Palette via CSS variables only, never hardcoded hex: navy `#1B2D5F`, gold `#F5C518`, teal `#5BD3DC`, amber `#D9A227`.
- Travelers are Beau, Scout, Willow, Wren only. Mottos are locked — check memory, never improvise. Retired names (Rockwell, Shamrock, Maylyn, Amay) must never appear.
- "Heavenly Father," never bare "God," in original LST prose (LDS edition); other editions use their own voice in adult prose only.

## QA gate — `python3 audit.py <file>`, run before delivering each file

1. `<style>` block and every `<script>` block byte-identical to canonical after normalising `<title>` and the `window.LST_NIGHT = {…};` object; HEAD/TAIL verbatim likewise
2. `node --check` on the concatenated inline JS
3. Exactly three sections — `tab-quick`, `tab-deep`, `tab-heavenly` — and **no** `tab-medium` or `tab-superdeep`; `id="depthHeavenly"` + `pmDepth('heavenly')` wiring present; DEPTH_LABELS reads `quick: 'Quick read'`, `deep: 'Medium read'`, `heavenly: 'Deep read'`
4. Tier card counts **7 / 16 / 27** — count `.card-label`, `.toolkit-label`, `.tonight-tag` inside each `id="tab-{key}">` … `</div><!-- /{key} -->` — and every label in tier N present in tier N+1; print the Deep-read order for eyeballing
5. Three resource links in all three tiers; previous night's slug absent anywhere
6. `LST_NIGHT` id updated; every story paragraph (entity-converted) present in all three tiers
7. Authored region (between the scroll-area markers, excluding the opening scroll-area div): `<div` count == `</div>` count; no `(?<!&)#[0-9A-Fa-f]{6}` (the lookbehind skips `&#128214;` emoji entities); no `\"`; no raw `“”‘’—–…`
8. Leak check: the Christian edition contains none of `General Conference`, `Latter-day Prophet`, `churchofjesuschrist.org`, `Book of Mormon`, `Nephi`, `Holy Ghost`; the LDS edition contains no `Spurgeon`
9. Playwright smoke test with the pre-installed Chromium: load the file, call `pmDepth('quick')`, `pmDepth('deep')` and `pmDepth('heavenly')` in turn, assert three buttons and zero `pageerror`s, screenshot the deepest one and look at it once
10. Correct translation quoted **and named** beside the verse (manual)

Re-run the audit on both files at the end of the run.

## Publishing — push the night into the website repo, and the Action does the rest

Nothing is pasted anywhere, and nothing goes through Drive. When both editions pass
`audit.py`, push these files into **`littlescripturetravelers-coder/lst-website`**, branch
`main`, folder **`lantern/<slug>/`**, in **one commit** with the GitHub connector's
`push_files` (it takes a list of `{path, content}`; there is no size limit that matters —
the Drive connector's 125 KB truncation is why Drive is never used for this):

| path | what |
|---|---|
| `lantern/<slug>/night.json` | the manifest below |
| `lantern/<slug>/morning-lantern-lds.html` | the Latter-day Saint edition, verbatim |
| `lantern/<slug>/morning-lantern-christian.html` | the Christian edition, verbatim |
| `lantern/<slug>/<slug>-lullaby.html` | tonight's song page, on `lantern/lullaby-template.html`, mp3 linked in full |
| `lantern/<slug>/lullaby.json` | `{slug, title, story, lyrics, mood, length_ms}` — the Action sings it |

**Write a new `mood` for every night.** It is the one line that decides what the
music does, and it is the reason the songs stopped sounding identical: the old
`prompt` key held the same sentence on every night, so the model was asked for
the same tune every time and obliged.

The brand is not your job here. One voice, gentle acoustic, no drums, no backing
vocals, clean and undistorted — all of that lives in the workflow and is added to
whatever you write, so a night cannot drift off-brand. Your job is tonight's
colour, and only tonight's.

Write what the **music is doing under the words**, taken from what the story
teaches and what a child should feel as it ends. Name a rhythm, an instrument or
two, and the direction the song travels.

```
"mood": "Walking music. A steady, unhurried step under the voice, like a child
         being led up a hill in the dark and finding the next stair is always
         there. Fingerpicked guitar keeping the step, a low sustained warmth
         underneath. Reassuring rather than sad, settling further with each verse."
```

Adjectives about feelings give the model nothing — "hopeful" and "peaceful" both
return the same lullaby. A rhythm gives it something to play. Two or three
sentences. A night of rescue should sound different from a night of gratitude,
and both should still sound like us.

Every take is measured before it is kept (samples at full scale, level, length),
and a bad one is re-asked up to three times, so do not write direction that
invites loudness or thickness — no "big", no "soaring", no "full choir".

Commit message: `Morning Lantern: <Title> (<publish_date>)`.

`night.json`:

```json
{
  "slug": "you-know-me",
  "publish_date": "2026-09-06",
  "title": "You Know Me!",
  "scripture": "Psalm 139:14",
  "traveler": "wren",
  "traveler_why": "one line on why this Traveler fits tonight",
  "traveler_about": "the Traveler paragraph from the book, verbatim",
  "book": 9, "week": 1, "night": 5,
  "book_page": "stories/sep-06-you-know-me.html"
}
```

- `publish_date` is the day the night is **for** — the app and the website hide it until
  5 AM Mountain that day, so publishing ahead is safe and expected.
- `book_page` is the illustrated story's page in the app (`www/stories/<mon>-<DD>-<slug>.html`
  in lst-app, served at app.littlescripturetravelers.com). Include it when that page exists;
  leave it out when it does not, and the night republishes on its own when it is added.
- `traveler` is `beau | scout | willow | wren`, lowercase.

The Action (`.github/workflows/lantern-sync.yml`) runs within a minute of the push: it
sings the lullaby, upserts the night into `daily_content` on `publish_date` exactly as
Admin does, records the narration, and commits `.published.json` beside the files.
`lantern/README.md` in that repo is the contract if anything here is unclear.

**Verify after pushing:** `get_file_contents` on `lantern/<slug>/morning-lantern-lds.html`
and confirm its size matches what you wrote. Then, in the final report: assumptions at the
top; what is different in the Christian edition; the verified source list for the quote
cards (how many verified, what was left out and why); which Bible wordings could not be
re-fetched and are worth a spot-check; the QA summary for both files; the commit URL.
Files are ~340 KB — never paste one into chat. If the push itself fails, and only then,
attach both editions with `SendUserFile` so the night is not lost, and say so.
