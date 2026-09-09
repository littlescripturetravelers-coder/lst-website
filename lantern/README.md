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
  lullaby.json                     the words - the Action sings them      optional
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
