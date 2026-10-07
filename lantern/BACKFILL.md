# THE BACKFILL: a Morning Lantern night for every story back to June

Levi, 7 Oct 2026: "There are some old nights that aren't showing up. I need a devotional night for
every story that is in the app. That goes clear back to June with my first book."

The app's nights began on 24 Aug 2026. Every story before that (the June, July and August books)
has its illustrated story page and its sung song, but no Morning Lantern devotional and no night in
the account, so Daily Stories cannot show it. This builds those nights, exactly as good as the
nightly ones, and publishes them on dates that keep the books in order:

| Book | Story files | Dates |
|---|---|---|
| June (book 6) | jun-01 … jun-28 | 2026-06-01 … 06-28 |
| July (book 7) | jul-01 … jul-28 | 2026-06-29 … 07-26 |
| August (book 8) | aug-01 … aug-28 | 2026-07-27 … 08-23 |
| August | aug-31, aug-33 | 2026-08-25, 2026-08-28 (the two the live nights skipped) |

`lantern/backfill.json` lists all 86: `key` (the folder and file name), `date`, the Virtue Library
`id`, `title`, `scripture`, `book`/`week`/`night`, `traveler`.

## Your group
The message that started you names a group: a range of rows of backfill.json (0-based, inclusive).
Build those nights, one after another, and only those. Other sessions are building the other
groups at the same time; never touch a folder that is not yours.

## For each night (KEY, DATE from its row)
Work by lantern/NIGHTLY-RUN.md and lantern/skill-morning-lantern-nightly.md - every rule, the two
editions (Latter-day Saint and Christian), the three depths, the QA gate, the brand - with these
differences, which win where they disagree:

1. NO DRIVE. The inputs are already in the repos:
   - The story: the lst-app repo, www/stories/KEY.html. Attach it with the add_repo tool (owner
     littlescripturetravelers-coder, repo lst-app, read access) and clone it beside this one. Its
     `const STORY = {...}` holds the story verbatim (the "story" beats), the Scripture Traveler of
     the Night, the Feeling Moment with the Five Stones, Remember This, the Parent Prompt question
     and the Parent Experience questions - everything the PDF gives the nightly run. Use them
     verbatim, as the nightly run uses the PDF.
   - The canonical page: use lantern/a-word-for-the-weary/morning-lantern-lds.html (a complete
     current LDS edition) as canonical.html, split as the skill says.
   - The builder: lantern/builder/ as the nightly run uses it.
2. THE SONG IS ALREADY MADE. lantern/KEY/ holds KEY-lullaby.html, KEY-lullaby.mp3 and lullaby.json.
   Do not write a new song, do not change those files, do not delete the mp3. The night's "Tonight's
   Lullaby" links name KEY-lullaby.html. (Its words may predate the daytime-song rule; that is
   fine for these old songs.)
3. THE STORY PAGE: copy lst-app's www/stories/KEY.html to lantern/KEY/KEY.html, then run
   `python3 lantern/builder/story_pictures.py lantern/KEY/KEY.html` (the Feeling Moment picture
   goes on Remember This).
4. night.json in lantern/KEY/ (same keys as lantern/water-from-the-rock/night.json): slug KEY,
   publish_date DATE, title, scripture, traveler (the story's Traveler of the Night, lowercase id;
   from the STORY page when the row has none), traveler_why, traveler_about (written as the nightly
   run writes them), book, week, night, book_page "stories/KEY.html".
5. The Come, Follow Me alignment: a June–August 2026 night sits in that year's Old Testament
   course; name the lesson where the nightly run would, from the scripture, without inventing a
   week title you cannot verify.
6. The QA gate: audit.py on both editions must end ALL PASS (with the daytime-song check skipped
   because the song is already sung), smoke.js and story-check.js as the nightly run does.
7. Commit the night's folder alone, then `git pull --rebase origin main` and `git push origin
   HEAD:main`. Retry the push with a short wait if it is refused. One commit per night, message
   "Morning Lantern (backfill): TITLE (DATE)".

## Never
- Never spend ElevenLabs or OpenAI credits; never ask for a recording or a song.
- Never change a file outside your nights' folders.
- Never stop to ask a person: a night that cannot pass the gate is reported and skipped.
- The publisher records no voices and drafts no marketing for these dates (the backfill line in
  publish_to_supabase.py); do not work around it.

## The report
End with a short report: each night built and pushed, any skipped and why.
