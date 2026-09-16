# lantern/ — one folder per night, and the night publishes itself

Drop a night here and the Action does the rest: sings the lullaby, puts the
night into the account (Supabase `daily_content`, the table the website and the
app both read), records the narration, and commits. Nobody pastes anything.

## A night is a folder

```
lantern/<slug>/
  night.json                       what the night is                      required
  morning-lantern-lds.html         the Latter-day Saint edition           required
  morning-lantern-christian.html   the Christian edition                  optional
  <slug>.html                      the illustrated story (the book) optional
  <slug>-lullaby.html              tonight's song page                    optional
  lullaby.json                     the words and the mood - it is sung     optional
  <slug>-lullaby.mp3               made by the Action, never by hand      (output)
  .published.json                  fingerprint of what was published      (output)
```

`<slug>` is the story title, lowercase, hyphens, no punctuation: `you-know-me`.

## night.json

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

- `publish_date` is the day the night is **for**. The app and the website hide it
  until 5 AM Mountain on that day, so nights can be published weeks ahead.
- `<slug>.html` is the illustrated story itself. When it is in the folder it is
  the book families get, and it is what the Lantern's "Tonight's Story" button
  and the song page's "More for Tonight" open. Its last page carries a button to
  tonight's lullaby.
- `book_page` is the illustrated story's page in the app (`www/stories/…` in
  lst-app, served at app.littlescripturetravelers.com). When the folder has no
  `<slug>.html`, the Action fetches this instead and stores it with the night.
  Leave it out if the page is not there yet; add it later and the night republishes.
- Everything else is optional. A missing key is simply not sent.

## How it publishes

`publish_to_supabase.py`, run by `.github/workflows/lantern-sync.yml`:

1. finds every `night.json`, and skips any folder whose files have not changed
   since `.published.json` was written;
2. re-encodes the book's photographs, at most 1200px on the long side (see
   below);
3. upserts `daily_content` **on `publish_date`** - exactly what the app's Admin
   does, so re-publishing a date replaces that night instead of doubling it;
4. asks the `narrate` function to record the voices from the Quick reading;
5. writes `.published.json`.

The fingerprint watches the folder's files, not this script, so `PUBLISH_REV` at
the top of `publish_to_supabase.py` is bumped whenever a change here alters what
a published night contains. Every folder then goes again instead of being
skipped as unchanged.

## Why the book's pictures are re-encoded

The app keeps tonight's book in the browser so it opens again without a signal,
and a browser will not hold much more than five megabytes. Night 8's book was
3.3 MB of full-size photographs, so it was never kept: the story stopped being
in the family's hand and became a page away on the website, and the Lantern's
"Tonight's Story" button had nowhere to go.

So the pictures go to the account at the size a phone shows them. Set
`BOOK_MAX_SIDE=0` to send a book untouched; `BOOK_QUALITY` defaults to 78.

  night 8:  artwork 2.4 MB -> 1.6 MB,  book 3.3 MB -> 2.2 MB

**The copy in this repository is the master and is never touched.** The website
goes on serving the book at full size, and `story_link` is published as that
full address, so a phone that still cannot hold the book has somewhere to open
it from. Re-encoding needs Pillow; without it the step says so and sends the
book whole, and the run still passes.

An unchanged folder is still checked against the account on every run: a save
from the app's Admin screen keeps only the boxes Admin has and drops the rest
(the song page, the sung mp3, the book, the Traveler), so if one of those has
gone missing from the row, the night is published again from the folder.

A push into `lantern/` **on `main`** runs the Action within a minute. Otherwise
it runs every half hour.

Nights are published from `main` and nowhere else. A push to a working branch
used to run the whole Action, so a branch that touched a night rewrote the live
account before anyone had looked at the change. The account is the one families
read tonight and there is no second copy to practise on, so the trigger is
`main` only and the publishing step checks the branch again for the
hand-pressed run. Everything before that step still runs on a branch, which
makes a branch a dry run: the night is built, sung and checked, and simply not
sent.

## The song

`lullaby.json` is `{slug, title, story, lyrics, mood, length_ms}`.

The words have always been written fresh for each story. The music was not: every
night carried the same sentence of direction, so every night came back the same
tune. The direction now has two parts.

**The spine** is in the workflow, not in a night, so a night cannot quietly stop
sounding like us: one single voice, warm and unhurried, gentle acoustic, no
drums, no backing vocals, and recorded clean with headroom.

**The mood** is the night's own, and it is what the build writes. It is the
colour of this story and nothing else - what the music is doing under the words.

```
"mood": "Walking music. A steady, unhurried step under the voice, like a child
         being led up a hill in the dark and finding the next stair is always
         there. Fingerpicked guitar keeping the step, a low sustained warmth
         underneath. Reassuring rather than sad, settling further with each verse."
```

Write what the music *does*, not how the story feels. "Hopeful" gives the model
nothing; "a step that keeps arriving" gives it a rhythm. The older `prompt` key
is still read, so a night written before this still sings.

`FINETUNE_NAME` stays pinned to **LST Theme Music**. The finetune is what makes
the songs a family; the mood is what makes tonight's its own. Drop the finetune
and you get twenty unrelated songs a month.

### Every take is measured

The model sometimes returns something clipped, near-silent, or far too short,
and nothing about saving a file notices. So each take is measured with ffmpeg
before it is kept:

| Rejected when | Why |
|---|---|
| Over 2,000 samples pinned at full scale | That is distortion, heard as crackle on the voice |
| Average level under -40 dB | Effectively silent |
| Peak under -25 dB | Too quiet to hear at bedtime |
| Under 40% of the asked-for length | The song was cut off |

A failed take is asked for again, up to three times. If every take is badly
distorted the night publishes **with no song at all**, because a broken lullaby
is worse than none; run it again and it starts afresh. A take that fails only
mildly is kept, with a line in the log saying what to listen for. Without ffmpeg
on the runner the take is kept unmeasured and the log says so.

## The one secret

`SUPABASE_SERVICE_ROLE_KEY` — repo **Settings → Secrets and variables → Actions**.
Copy it from Supabase **Project Settings → API → service_role**. Never put it in a
file, a chat, or the website's JavaScript; it bypasses every row rule. Without it
the publish step explains itself and does nothing.

## Do not run `sql/2026-08-28-faith-editions.sql`

It moves the night's uniqueness from `publish_date` to `(publish_date, faith)`.
The app - and this publisher - keep one row per date with the editions as
columns (`story_html`, `story_html_nondenom`, …). Running that file would make
every publish from Admin and from here fail with "no unique constraint matching
ON CONFLICT". The two editions are columns, not rows.

## The story lullabies (June onward)

Every story in the books has a lullaby of its own, beside the nightly ones:
`lantern/<key>/` where the key is `jun-01-ruth-stays-with-naomi` and so on.
Each folder holds `lullaby.json` (the words, the mood, the singer and the
arrangement, plus `book`, `storyNumber`, `readId`) and the song page. There is
no `night.json`, so the publisher leaves them alone; the sync Action sings any
whose MP3 is missing, at most `MAX_PER_RUN` (24) a run, June before July, so a
long queue is worked through by the half-hourly runs.

`python3 lantern/build_story_lullabies.py` rebuilds every song page and the
catalogue `data/story-lullabies.js` (the Library's "Story Lullabies" shelf);
with `APP_DATA=../lst-app/www/data/lullabies.js` it also writes the app's copy,
which the Lullabies & Songs page reads. The Action runs it after singing so
the catalogue's `sung` flags stay true.
