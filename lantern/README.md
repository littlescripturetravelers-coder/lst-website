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
- `book_page` is the illustrated story's page in the app (`www/stories/…` in
  lst-app, served at app.littlescripturetravelers.com). The Action fetches it and
  stores it with the night, so families get the book in the app. Leave it out if
  the page is not there yet; add it later and the night republishes.
- Everything else is optional. A missing key is simply not sent.

## How it publishes

`publish_to_supabase.py`, run by `.github/workflows/lantern-sync.yml`:

1. finds every `night.json`, and skips any folder whose files have not changed
   since `.published.json` was written;
2. upserts `daily_content` **on `publish_date`** - exactly what the app's Admin
   does, so re-publishing a date replaces that night instead of doubling it;
3. asks the `narrate` function to record the voices from the Quick reading;
4. writes `.published.json`.

A push into `lantern/` runs the Action within a minute. Otherwise it runs every
half hour.

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
