# Little Scripture Travelers — WEBSITE HANDOFF

**Repo:** `littlescripturetravelers-coder/lst-website`
**Live:** https://www.littlescripturetravelers.com (Vercel, auto-deploys on push to `main`)
**Last updated:** 2026-08-25 (session 8)
**Owner:** Levi Lewis (non-technical founder, littlescripturetravelers@gmail.com). Claude builds and ships everything.

> **This file is the source of truth, not the chat.** Chats get lost. Update this file at the end of
> every work session — status, gotchas, and next tasks — then commit and push it.

---

## 0. SCOPE — website only

This repo and this chat cover the **marketing website only**.

The **mobile app** (iOS/Android, Capacitor, repo `lst-app`) is handled in a **separate chat**.
If a request here is about App Store review, Android APK/AAB builds, push notifications,
Codemagic, or app UI — that belongs in the app chat. Don't do it here.

Things that live in *both* worlds (Supabase, Payhip, Mailchimp) are documented below only to the
extent the website touches them.

---

## 1. What the site is

A static HTML marketing + signup site for LST — an LDS/Christian bedtime scripture-story
subscription for families with kids ages 1–5. No build step, no framework, no `package.json`.
Plain HTML + one shared `style.css` + a few vanilla JS files. Vercel serves the folder as-is.

**That means: edit an `.html` file, commit, push → it's live in ~30 seconds.** There is nothing to compile.

---

## 2. Key accounts / IDs the website depends on

| Thing | Value |
|---|---|
| Supabase project ref | `rdbvktqgrwhjucocobua` → `https://rdbvktqgrwhjucocobua.supabase.co` |
| Payhip — Monthly | `https://payhip.com/b/e7N6r` — $10.99/mo |
| Payhip — Yearly | `https://payhip.com/b/34fmR` — $98.91/yr (3 months free) |
| Free trial | 7 days, card up front, **already ON** in Payhip for both products |
| Mailchimp audience | `a6978c55f7`, subscriber tag **`Lantern Subscribers`** |
| Hosting | Vercel, GitHub auto-deploy from `main` |
| Google Search Console | verified two ways — `googlea5f8bfd252ef63cf.html` + a meta tag in `index.html` |

**Mailchimp/Payhip matching is BY EMAIL.** The subscriber's Payhip email must equal their app-login
email or their subscription won't connect. This is why the signup popup pre-fills `?email=` into the
Payhip checkout URL. **Never break that.**

Levi sends the daily story as a **manual Mailchimp campaign** each morning to the `Lantern Subscribers` tag.

---

## 3. File map

```
index.html              # home page (the live one)
index-default.html      # seasonal/alternate home variants — NOT linked in nav.
index-july.html         #   Swap by copying over index.html. Keep all three in sync when
                        #   you change shared nav/footer/CTAs.
subscribe.html          # pricing / plans
our-story.html          # founder story
travelers.html          # the four characters (Beau, Scout, Willow, Wren)
books.html              # monthly book list (card data is a JS array near the bottom)
watch.html              # video page
virtue-library.html     # + virtue-library.js and data/virtue-library.js (content data)
spiritual-tracker.html  # tracker tool
privacy.html            # privacy policy (required by App Store + Google Play)
timeline.html           # Sacred World Timeline — the EXPLAINER page (this is the nav link)
timeline-explore.html   # the full-viewport interactive timeline tool itself
blog.html               # blog index — nav dropdown + the post-card list
blog-*.html             # 9 posts, each a full standalone page
main.js                 # shared site JS (nav, misc UI)
style.css               # ALL shared styling — one file, site-wide
js/lst-signup.js        # THE signup popup (see §4)
js/lst-auth.js          # THE website login — Supabase, same account as the app (§11)
js/lst-app-data.js      # THE shared record — the ONE file that knows the app's
                        #   column shapes. Change it here when the app changes. (§13)
js/lst-journal.js       # the app's journal, on the website
js/lst-archive.js       # every published daily story
js/lst-tonight.js       # tonight's story + lullaby, same row the phone reads (§14)
js/lst-read.js          # THE reader — turns the app's three pasted pages into
                        #   website-native flowing content (§15)
js/lst-gate.js          # the 7-days-free invitation on the members' pages (§14)
js/lst-account.js       # account page
tonight.html / family-stories.html / journal.html / archive.html / account.html
docs/FOR-THE-APP-CHAT-remove-photos.md      # hand these to the app chat
docs/FOR-THE-APP-CHAT-timeline-duplicate.md #   "     "    "   "   "   " 
js/lst-family-stories.js# Family Stories section on the Virtue Library (§11)
sql/                    # migrations for Levi to paste into the Supabase SQL editor
                        #   ...-accounts-and-family-stories.sql  (run 1st)
                        #   ...b-admin-access.sql                (run 2nd — makes Levi admin)
                        #   ...c-family-story-tags.sql           (run 3rd)
reset-password.html     # where the "forgot password" email link lands
cancel.html             # how to cancel, with the direct Payhip link (§12)
js/vendor/supabase.js   # vendored Supabase JS client
images/                 # + subfolders: cancel-steps/, email-preview/, story-pdf/
downloads/              # lst-payhip-and-signin-setup.pdf
```

### The 9 blog posts
`blog-feeling-path` · `blog-gospel-library-companion` · `blog-heart-behind-pages` ·
`blog-holy-ghost` · `blog-proclaim-liberty` · `blog-product-toolkit` ·
`blog-quietest-revolution` · `blog-scripture-last-thing` · `blog-scripture-routine`

---

## 4. The signup popup — the most important thing on the site

**File:** `js/lst-signup.js` (self-contained; builds its own modal + styles, no HTML markup needed).

**Flow:** click a trial CTA → popup opens → Monthly/Yearly toggle + "✨ 7 DAYS FREE · No charge today"
badge → first name / email / password → `sb.auth.signUp()` creates the **app login** →
redirect to the Payhip checkout **with `?email=` prefilled** so the Payhip email matches the app login.

**How a CTA is wired** — every trial button uses the same pattern:

```html
<a href="https://payhip.com/b/e7N6r" onclick="return openTrialSignup('monthly')">Start free week</a>
```

`openTrialSignup()` returns `false` to cancel the link when the popup opens, and returns `true`
(letting the raw Payhip link through) if the Supabase library failed to load. **The `href` is the
fallback — always keep a real Payhip URL in it.**

**Wiring status: COMPLETE.** All trial/plan CTAs are wired across all 20 content pages
(~173 `openTrialSignup` hooks). A new page only needs `<script src="js/lst-signup.js"></script>`
before `</body>` plus the onclick pattern above.

**Deliberately NOT signup CTAs — leave them alone:** "Meet the Travelers" and "Start the Journey"
are explore links to `travelers.html` / content pages, on purpose.

---

## 5. STATUS — DONE (do not redo)

- ✅ **Signup popup live and wired site-wide** — all trial CTAs, all 20 pages, Monthly/Yearly toggle,
  7-days-free badge, email prefill into Payhip.
- ✅ **Blog post: "The Gospel Library Is Amazing — And There's Still One Thing It Can't Do for Your Kids"**
  → `blog-gospel-library-companion.html`, tag "Faith & Family". Full arc shipped: Gospel Library/Friend
  praise → identification via Beau/Scout/Willow/Wren → the family-stories resilience research
  (intergenerational narrative) → "companion, not competition" → signature. Linked from `blog.html` in
  **both** the nav dropdown and the post-card list. *(Was listed as "in progress" in the old handoff —
  it is finished and pushed.)*
- ✅ **Sacred World Timeline shipped** — see §10 for the full picture. `timeline.html` (explainer,
  site-styled, owns the nav link) + `timeline-explore.html` (the tool). "Timeline" added to the
  desktop AND mobile nav on all 20 content pages.
- ✅ **Website login + Family Stories** — see §11. The Virtue Library now uses the same Supabase
  account as the app, and has a Family Stories section tagged with the same 36 virtues.
  **⚠️ Needs the SQL in `sql/` run before it works** — see §11.
- ✅ **Cancelling made findable** — `cancel.html`, linked from every footer and the signed-in strip.
  See §12.
- ✅ **Privacy policy page** (`privacy.html`) — required for App Store + Google Play.
- ✅ **Google Search Console verification** — HTML file + homepage meta tag.
- ✅ **Pricing updated site-wide** — $10.99/mo, $98.91/yr, 7-day trial wording.
- ✅ **"App coming soon" announcement banner** on all pages.

## 6. STATUS — PENDING / next up

1. **Hand two files to the app chat**, both in `docs/`:
   - `FOR-THE-APP-CHAT-remove-photos.md` — the website half of removing photos is shipped; the app
     still has the picker. Leads with the thing that must not happen: **do not drop the `photos`
     column** (§13).
   - `FOR-THE-APP-CHAT-timeline-duplicate.md` — `www/timeline.html` declares `PROPHECIES` twice
     again. Fixed on the website for the second time; it will come back a third unless the app is
     fixed (§10).
2. **Load the story text.** `story_texts` is empty, so subscribers still can't read a full story.
   The text is in `api/_lib/stories-full.json` on Levi's computer (referenced by
   `data/virtue-library.js`, never committed). Get that file from him, then load the 91 rows.
3. **Wire the timeline's Family Story layer** to the same `family_stories` table. It keeps added
   stories in `localStorage`, on that device only — so they reach neither the app, the account, nor
   the family-stories page. Now that `family-stories.html` and `js/lst-app-data.js` exist, this is
   a much smaller job than it was: the timeline's family panel needs to read and write through
   `LSTData.familyStories` instead of its own storage.
4. **YouTube "how to use the timeline" video section on the home page.** Levi wants a home-page
   section showing a walkthrough video of the timeline. **Waiting on the video URL** — it may not be
   recorded yet. When it lands, follow the existing `watch-section` iframe pattern in `index.html`,
   and remember to add it to all three index variants.
*(App-side work — Android Play release, Apple entitlements, trial enforcement in the app — is tracked
in the app chat / `lst-app` repo, not here.)*

---

## 7. GOTCHAS — things that cost real time

- **Levi has NO command line.** He runs the Claude desktop/web app. He cannot run git, CLI tools, or
  SQL migrations. When he must act by hand (Supabase SQL editor, a Vercel button), give **exact
  click-by-click steps**, not jargon. Everything else: you do it and push it.
- **Three home-page files.** `index.html`, `index-default.html`, `index-july.html` are near-identical
  seasonal variants. A shared nav/footer/CTA change must be applied to **all three** or a future swap
  silently reverts it.
- **Email matching is load-bearing.** Payhip email must equal the app-login email or the Mailchimp
  sync and subscription link both fail. Don't remove the `?email=` prefill.
- **Every trial CTA keeps a working Payhip `href`.** It's the no-JS fallback.
- **Blog posts are full standalone pages**, not templated partials. Shared nav/footer edits mean
  editing 9 files. Adding a post = copy an existing post file (see §8).
- **No build step.** Don't add one, don't add `node_modules`. Push = deploy.
- **`.gitignore`** covers `node_modules/`, `.DS_Store`, `.vercel`.

---

### ⚠️ Supabase will not let SQL delete from the storage tables
A first attempt at this migration ended with `ERROR: 42501: Direct deletion from storage tables is
not allowed. Use the Storage API instead.` — a Supabase trigger (`storage.protect_delete()`), there
so files never end up orphaned behind the database. **`delete from storage.objects` / `storage.buckets`
will always fail.** Buckets go through the Storage screen in the dashboard, by hand.

Worse, the SQL editor runs the file as one transaction, so that one line rolled back the whole
migration and nothing else landed either. Anything touching `storage.*` in a migration belongs
inside `do $$ begin begin ... exception when others then null; end; end $$;` so it can never take
the rest of the file down with it.

**Migrations can be tested for real before Levi ever sees them.** This container has Postgres 16:
`service postgresql start`, build a small stand-in for the `auth`/`storage` schemas and the app's
tables, create the `authenticated` role, then run the file with `--single-transaction`. That is how
this one was fixed — including reproducing Supabase's own delete guard to prove the fix survives it.
Do this every time. Levi's SQL editor should not be where a migration is first executed.

---

## 8. How to add a new blog post (proven recipe)

1. `cp blog-heart-behind-pages.html blog-<slug>.html` — this template already has the signup-popup
   wiring in its CTA, footer, and scripts. **Keep all of that.**
2. Replace three things only:
   - the `<title>` and `<meta name="description">` in `<head>`,
   - the `article-hero` block (`article-tag`, `<h1>`, `.subtitle`, `.byline`),
   - the inner content of `article-body` — everything up to the `<!-- CTA -->` comment.
3. Use the template's own classes: `<h2>` for headings, `pull-quote` for pull quotes,
   `opening-quote` for the highlight box.
4. Link it from `blog.html` in **two** places: the nav dropdown *and* the post-card list
   (`blog-featured` card with `blog-tag` / `<h2>` / summary / `blog-date` / `btn-read` link).
5. Commit and push → Vercel deploys automatically.

---

## 9. How to resume in a fresh chat

Paste this:

> "You're my website chat for Little Scripture Travelers (repo `lst-website`, live at
> www.littlescripturetravelers.com). Read `HANDOFF.md` first, then inspect the actual files before
> changing anything — don't redo completed work. Then continue from the next unfinished item in
> section 6. The app is handled in a different chat; don't do app work here."

Then, **at the end of the session**, update this file (status, gotchas, next tasks), commit, push.

---

## 10. The Sacred World Timeline — how it's put together

**Two files, on purpose:**
- `timeline.html` — the explainer. Normal site page (header, footer, signup wiring). **This is what
  the nav links to** and what Google should index.
- `timeline-explore.html` — the tool. A full-viewport app that sets `overflow:hidden` on html/body
  and positions its chrome `fixed` at z-index 300–700. **It can never be pasted inline into another
  page** — it would kill that page's scrolling and cover the site nav. Link to it, don't embed it
  (an iframe would work if a preview is ever wanted).

**What the tool is (the APP's version, installed 2026-08-25):** a pan/zoom timeline, 4000 BC → 2030,
built by Levi. Self-contained vanilla JS — no build step, no libraries. ~9,000 lines. Only external
calls are Google Fonts and OpenStreetMap tiles for the per-event map.

**It is now the app's file, adapted — not a separate website build.** `lst-app/www/timeline.html` is
the source. When Levi says "match the app", copy that file and re-apply the four adaptations below.
Do NOT hand-port features across; the two would drift again within a session.

**88 events across 33 layers** (v6 had 63 across 18). Controls moved: three round buttons top-LEFT
(🔍 search, 👁 views+modes, ☰ layers), a 📚 Studies button bottom-left, era buttons along the
bottom. The old header rows still exist in the markup but are hidden (`#hdr,#hdr2{display:none}`)
because the app draws its own chrome — their controls were re-homed into the sheets as the very
same elements, so ids and handlers still work. **`togglePath()` survives with no button**: the
guided tour is now 🎤 Narrate, with four scripted tours.

**Five studies** behind 📚: Study Library, World Faiths Chart, Prophecy Tracker, Faith & Freedom
(four patterns, each with an honest caution), My Family History.

Five modes, all under 👁: **Hand** (dims all but the events where His hand shows), **Prophecy**
(arcs from prophecy to fulfilment), **Seeds** (16 truths placed in cultures before missionaries
came), **Chain** (a 21-link animated walk from fire to the First Vision), **Narrate** (four scripted
tours). ↔ / ↕ swap whether time runs across or down; down is the phone-friendly one.

**`counter` (Counterfeits) is still off by default** — check this on every future upload. It is
heavier teen/adult material and the website is public. The switch is in the visibility map beside
`var LANES`, not in `LANES` itself.

**Family events now persist in `localStorage`** — on the device only, not the account, and not
shared with the app or the Virtue Library. That sync is still the open task.

**Data model** (all inline near the top of `timeline-explore.html`):
- `EVS` — the events. Each has `l` (layer), `y` (year), `t` (title), `de` (description), `sc`
  (scripture refs), `co`/`ch` (how it points to Christ), `lat`/`lng` (map), `trav` (which traveler),
  and `conf`.
- `conf` is the honesty flag: `confirmed` (evidence exists) / `believed` (held by faith) / `debated`
  (scholars disagree). **This matters to Levi** — the timeline must stay factual, and anything not
  established gets marked `debated` rather than asserted. Keep that discipline when adding events.
- `ERAS` (10 eras, Creation → Today), `WARS` (spans), `PATH` (the guided-tour event ids),
  `LC`/`LN` (layer colors and names).

**The eleven layers:** gospel, world, arch (biblical evidence), bom, church, family, invent, faith,
freedom, counter (Counterfeit/Shadow — **off by default**, heavier teen/adult material), war.

**The editorial thesis** (Levi's, reflected in the explainer copy — preserve it):
1. Christ is the center of time; the Atonement is the pivot the whole timeline is built around.
2. Light and knowledge compound — freedom produces progress and invention, which move the work forward.
3. There is opposition in all things — every advance gets turned against people too.
4. Where freedom is taken, progress stops, and you can see it in that region of the world.
5. Everything must be factual. It should lead people to truth on its own evidence; if the evidence
   doesn't support something, it doesn't get claimed.

**It's also a family history tool.** The Family Story layer is meant to hold the user's own genealogy
— ancestors placed at their real moment in history, so you can see how the family formed and what
your people lived through. This is the bridge to the app's Family Stories (see §6, item 1).

**THE FOUR ADAPTATIONS — re-apply every single time the app's file is copied in:**
1. meta description added (the app file has none; this page should be indexed);
2. `fonts-embed.css` → the Google Fonts link (that file is 405 KB of embedded fonts and lives only
   in the app repo);
3. OpenStreetMap attribution over the map canvas (their tile policy requires it);
4. **a way home** — a `←` link to `index.html` as the first button in `#tl-fab`. The app hides both
   header rows because it draws its own navigation; on the website there is nothing around this
   page, so without this a visitor is stranded.

**The defect that keeps coming back — check for it on EVERY upload:**
- `PROPHECIES` declared **twice**. The later block silently wins; the earlier is dead code that
  dates Malachi to 600 BC against its own "written c. 430 BC" text. Fixed in v6, back again in the
  app's current file, removed again here. Written up for the app chat in
  `docs/FOR-THE-APP-CHAT-timeline-duplicate.md`. **Fix it in the app** or it returns a third time.
- (v6 also had the Prophecy/Seeds/Chain buttons in the header twice, so the second set never lit.
  That one has NOT recurred — the current file has no duplicate ids at all.)

**`timeline.html` (the explainer) must be updated whenever the tool changes** — it names specific
controls, lists all thirty-three layers, and describes each mode. A stale explainer sends people
looking for buttons that aren't there, which is exactly what happened this time: it still said
Layers was in the top right, still said "eighteen", and still told people to tap a ✦ Path button
that no longer exists. **Check it against the running tool, not against memory.**

**Known gap:** family entries persist on the **device** (localStorage) but not to the account, so they
do not reach the app, the Virtue Library, or another device. Levi wants account-saving — see §6 item 1.
**Do not add any third-party genealogy-service integration or mention one anywhere on the site.**
Levi asked for every reference stripped (2026-08-19) because he does not know whether such a
partnership will ever be possible, and he does not want the site implying one that may never exist.

---

## 11. Website login + Family Stories (built 2026-08-19)

### The discovery that started it
`virtue-library.js` shipped with a full sign-in UI (its own token session, a six-digit email code,
tiers, free-story unlocks) pointed at `/api/library`. **That server was never written and has never
existed in this repo.** So on the live site the Virtue Library sign-in was dead and no story could
be read. Levi chose to fix it by moving to the app's login rather than building a second account
system.

### How it works now
- **`js/lst-auth.js`** is the one login for the whole website. It uses the **same Supabase account
  as the app** — the account `lst-signup.js` already creates at trial signup. Exposes
  `LSTAuth.signedIn()`, `.isSubscriber()`, `.openSignIn()`, `.ready()`, `.onChange()`, `.signOut()`.
- Subscription status comes from the `subscriptions` table (statuses `trialing`/`trial`/`active`/
  `past_due` count as unlocked, so a family in their Payhip free week gets the full library). It
  matches on `user_id` and falls back to **email**, because the Payhip webhook keys rows by email.
- **`lst-signup.js` now shares the same client** via `window.LST_SB`. Don't undo that — two Supabase
  auth clients on one page fight over the stored session.
- **The paywall is now enforced by Postgres, not JavaScript.** Story text lives in `story_texts`
  with an RLS policy that returns a row only to a subscriber (or to anyone for a free story).
  Editing the page's JavaScript gets a reader nothing.
- **`js/lst-family-stories.js`** renders the Family Stories section into `#lst-family` on
  `virtue-library.html`. Stories are tagged with the same 36 virtues as the scripture stories, can be
  linked to a specific scripture story, and each card surfaces the scripture stories teaching the
  same virtue ("Read alongside…"). That cross-link is the whole reason it lives on this page.

### The one schema subtlety worth remembering
`family_stories` is shared with the app, whose Family Stories are a **one-per-day journal** keyed on
`entry_date`. Family *history* entries are many-per-year and must never collide with that. So the
website writes rows as **`kind = 'history'` with `entry_date` left NULL**, and uses `year` instead.
Keep that rule if you touch this table.

### Family Stories — the five doors and the two kinds
- Family stories are tagged and looked up **exactly the five ways the scripture stories are**:
  By Virtue or Principle, By Life Situation, By Feeling, By Traveler, By Scripture.
- **The tag lists are read live from `window.LST_LIBRARY`.** When Levi adds a month of stories that
  introduces new virtues, situations or feelings, they appear in the family-story tagger and the
  lookup doors automatically. Nothing in `js/lst-family-stories.js` needs editing.
- **By Scripture** derives the book from the typed reference ("Ruth 1" → Ruth), falling back to the
  linked library story's `scriptureBook`.
- **Two kinds of family story, shown together and filterable** (Levi's call):
  - `kind = 'journal'` — a **Parent's Heart** answer written in the app after a night's story,
    already tied to that scripture story.
  - `kind = 'history'` — a story the parent sat down and wrote on the website.
  The filter only appears when both kinds exist. Sorting uses `entry_date` for journal rows and
  `year` for history rows, done in the page so it doesn't depend on a `created_at` column.
- **There is deliberately NO "By Emotion" axis.** Levi asked for one, then confirmed emotions are
  already the Feeling category — a sixth door would list the same 24 items twice. Don't re-add it.

### Admin access — Levi never pays
`profiles.is_admin` makes an account count as a subscriber. It's enforced in
`public.lst_is_subscriber()`, the same function the story paywall uses, so it's a real unlock and
not a client-side one. `LSTAuth.isAdmin()` exposes it, and the Family Stories bar shows an "admin"
badge. Run `sql/2026-08-19b-admin-access.sql` and set the email in step 4 to the OWNER account.

### Password reset
There was no way to recover an account from the website. `LSTAuth.resetPassword()` +
"Forgot your password?" in the sign-in box → emails a link to `reset-password.html`, which lets them
set a new one. **Supabase needs `https://www.littlescripturetravelers.com/reset-password.html` in
its allowed redirect URLs** (Authentication → URL Configuration) or the link will bounce.

### ✅ The migration HAS been run (2026-08-19)
Levi ran `sql/RUN-THIS-ONE-FILE.sql` (all three migrations combined) in the Supabase SQL editor and
it confirmed `littlescripturetravelers@gmail.com` → `is_admin = true`. **Don't ask him to run it
again.** If a later change needs more schema, write a NEW file — never edit that one.

Two things tripped him up, worth remembering when writing any future migration for him:
1. He pasted the *file name* into the editor the first time. Say "open the file, select all, copy
   the text inside it" — and attach the file rather than pointing at a path.
2. The editor's button says **"Run selected"** whenever any text is highlighted, and then runs only
   the highlight. Tell him to press Ctrl+A first so "Run selected" covers the whole file.
3. Supabase shows only the LAST statement's result, so always end a migration with a confirmation
   `select` that proves it worked.

### ⚠️ Not finished
- **`story_texts` is empty** — nobody can read a full story yet regardless of subscription. Needs
  `api/_lib/stories-full.json` from Levi's computer.
- The timeline still keeps its added family stories in memory only.
- **The app should write Parent's Heart answers into `family_stories` with `kind='journal'`** and the
  same tag columns. Until it does, the website's "From the daily stories" filter has nothing to show.
  That is app-side work — belongs in the app chat.
- **No third-party genealogy integration.** Every mention was removed at Levi's request — he can't
  promise a partnership he may never get. Families type their own ancestors in. Don't reintroduce it.

---

## 12. Cancelling, and the "Free" tags

### cancel.html
Levi's rule: cancelling must be **obvious and easy**, never something a family has to hunt for or
email about. The page leads with the direct link and only then explains.

- **The direct link is** `https://payhip.com/LittleScriptureTravelersBedtimeStories/b-account` —
  the customer's Payhip account page, where the Cancel button lives. Same URL the footer modal uses.
- Linked from **every page's footer** ("How to Cancel"), and from the **signed-in strip** on the
  Virtue Library and the Family Stories bar ("Manage or cancel").
- Uses the screenshots in `images/cancel-steps/`, which existed in the repo but were only wired into
  the footer modal in `main.js`.
- **The older footer modal still works** and is unchanged — `main.js` injects it site-wide from the
  `.btn-cancel-sub` button. Both routes now exist on purpose; don't delete one assuming it is a
  duplicate.
- The page states three things deliberately: payments stop immediately, the account and any family
  stories are NOT deleted, and cancelling inside the free week means never being charged while still
  keeping the week.

### The "Free" tags
The three sample stories are tagged "Free" in the catalog. That tag is now **hidden from anyone who
can already read everything** (`isSubscriber()`, which includes admins) — it was noise for them, and
its absence is a quiet confirmation that they are signed in and unlocked. **Signed-in free readers
still see it**, because for them it says which three they may open. Verified both ways in a browser:
29 stories listed, 1 Free badge as a free reader, 0 as a subscriber.

---

## 13. Mirroring the app (built 2026-08-25)

Levi's goal: the website should be the app. Same login, same saved things, and
changes on one side showing on the other.

### The truth about "changes propagate automatically"
**Content does. Code does not.** New daily stories, new virtues, anything that
lives in a shared table appears on both sides with nothing to deploy. But a new
app *screen* is not a new website page — somebody builds that. The way to keep
Levi's wish mostly true is to **never keep two copies of the same thing**.

### The bug this uncovered — read this before touching family stories
The app and the website were writing the same table in **different shapes**:

| | App writes | Website used to write |
|---|---|---|
| title | `story_title` | `title` |
| the writing | `answers` jsonb `[{q,a}]` | `body` text |
| virtues | `[{id,name}]` **objects** | `["courage"]` **strings** |

Same drawer, different handwriting — neither side could read the other. Fixed by
making the **website conform to the app**.

> **THE RULE: the app is the authority on shape.** It ships to phones and sits
> behind App Store review; the website redeploys in seconds. When the two
> disagree, change the website. Never "fix" it by changing what the app writes.

### `js/lst-app-data.js` is the only file that knows the shapes
Everything goes through it — `LSTData.familyStories`, `.journal`, `.archive`.
It **reads forgivingly** (older website rows with `title`/string-virtues still
work) and **writes strictly** in the app's shape. When the app adds a column,
this is the one file to update.

Shapes are documented in its header, taken from `lst-app/supabase/migrations/`.
**To re-check them, read that repo** — it can be attached read-only with
`add_repo` + a shallow clone. Reading the app to mirror it is website work;
*changing* the app is still the app chat's job.

### The pages
`journal.html` (both directions with the app's journal), `archive.html` (every
published story; **gated by the database's own policy, not by JavaScript** — if
a family sees nothing, it's the subscription rule), `account.html`. All three
are `noindex` and linked from a "My Account" nav dropdown on all 25 pages.

### ✅ The migration HAS been run (2026-08-25)
`sql/2026-08-25-mirror-the-app.sql` — journal table + policies, the website's
extra family-story columns, and the `daily_content` read rule rewritten to use
`lst_is_subscriber()` so an admin sees the nightly story. Levi ran it and all
four confirmation rows came back **yes**. Do not ask him to run it again.

Both migrations are now run: this one and the §11 one. **There is no pending
SQL.** If something on a members' page is empty, the cause is missing content
(`story_texts` is still empty, and `daily_content` needs published nights) —
not a missing migration.

### Photos — decided against, on purpose (25 Aug 2026)
Levi: *"for now we just don't include photo uploads with the family stories and
journals. That is something we can do later if my customers want that. So do
away with that in the app and website."*

So: the website neither shows nor attaches photos, and the storage bucket is
deleted by the migration above.

⚠️ **The `photos` column stays.** Do not drop it. App versions already on
phones write `photos` on every journal save (verified in the app's
`www/js/backend.js`), so dropping the column would break saving for families
who haven't updated. `js/lst-app-data.js` and `js/lst-journal.js` therefore
read and write the value through **untouched** — blanking it from the website
would erase a phone's own photo list out from under it.

The app half of the removal is written up in
`docs/FOR-THE-APP-CHAT-remove-photos.md` — hand that file to the app chat.

If Levi ever asks for photos back: storage is cheap enough not to charge for
(20,000 subscribers ≈ $54/mo against ≈ $219,800/mo of revenue — 0.025%). Don't
build a paid storage tier; just turn it back on.

### Loose ends
- `subscribe.html` has a stray `</div>` that **predates all of this**. Browsers
  ignore it; left alone deliberately.
- The website's Virtue Library catalog (`data/virtue-library.js`, 36 virtues) is
  still a **separate copy** from whatever the app tags stories with. That is the
  next two-copies problem to solve if Levi wants true one-source content.

---

## 14. The member bar, and the 7-days-free gate (built 2026-08-25)

### What Levi asked for
> "I need to also have in the header as one of the pages journal. I also need tonight's story and
> family stories all in the header that you click and it takes you to their own page... I would like
> all of those to be accessible but once they try to scroll or use the page have a pop up that says
> 7 days free with the subscribe button."

### The header now has two rows
The top row is unchanged marketing navigation. Below it, `.member-bar` — **the product**:

`Tonight's Story · Virtue Library · Family Stories · Journal · Story Archive · Timeline`

**Why a second row and not six more items up top.** The top row is capped at `--content-wide`
(1300px) and was **already spilling past it** before any of this — at 1280 and 1440 the
"Try the First 7 Days Free" button hung off the right edge of the page. Adding six names made it
worse by 570px. Measured at eight widths from 1100 to 1920; nothing overflows now. Moving those six
out actually left the top row **shorter than it was** (8 items, was 10).

On a phone the member bar stays visible and scrolls sideways — one fewer tap than the hamburger.
`main.js` marks the current page with `aria-current="page"`, matched on filename, so a new page can
never forget to highlight itself.

### The gate — `js/lst-gate.js`
Arm it on a page and it waits. The moment somebody who is not a subscriber scrolls, clicks or
presses a key, the invitation appears: the free week, four things it opens, and a **Start the free
week** button that goes through `openTrialSignup('monthly')` — never straight to Payhip, because
that popup is what carries the email into checkout (§4).

**It is NOT the paywall.** Postgres decided long before this file ran; closing the box hands nobody
a story. It exists to explain, not to lock.

- Subscribers, trialers and admins **never** see it — it disarms itself the instant `LSTAuth` says so.
- Once per page per browser session (`sessionStorage`). An invitation, not a pestering.
- The header, the sign-in button and anything marked `data-gate-free` don't trigger it.

Armed on: `tonight.html`, `family-stories.html`, `journal.html`, `archive.html`,
`virtue-library.html`. **Not** on `account.html` — you cannot ask somebody to subscribe on the page
where they manage their subscription.

### Tonight's Story — `tonight.html` + `js/lst-tonight.js`
The same `daily_content` row the phone reads: newest published night **on or before** today, so a
skipped day shows last night rather than an empty screen. Title, scripture, traveler, virtues,
narration, the story, the page-turning book, and the lullaby.

A visitor who is not signed in sees a **real sample night** built from the library's free shelf and
its public teaser — plainly labelled "A sample night". There is no trimmed-down real story to show,
because the database hands back nothing at all.

`story_html` and `book_html` are Levi's own markup from the app's admin screen, but they still get
their `<script>`, `<iframe>`, `<form>` and every `on*` attribute stripped before going on the page.

### Family Stories has its own page
`family-stories.html`. The section on `virtue-library.html` keeps its `#family-stories` anchor but is
now a **pointer** to that page — mounting the same module twice is two copies to keep in step.

### Two CSS blocks moved into `style.css`
- The `mp-*` member-page rules were pasted **identically into three files**. One copy now.
- The `fs-*` family-story rules were trapped inside `virtue-library.html`, where the new page could
  not reach them — which is why Family Stories rendered completely unstyled on its own page at first.

### Bug found on the way
`virtue-library.html` mounted `LSTFamilyStories` but never loaded `js/lst-app-data.js`, so
`window.LSTData` was undefined and the section could never have loaded a single story. Fixed.

---

## 15. Reading the night on the website (built 2026-08-25)

### What Levi asked for
> "Do the stories and lullaby's in an easy to read and flowable way on my website... how the text and
> headers are in the other pages of the website but all the same information and working the same way
> as the app." And then, plainly: **"I want the app setup to stay the exact same as it is but I want
> the website to read like a website would."**

So: **never change the app for this.** The website conforms, as always (§13).

### The problem
A night carries three whole HTML pages in `daily_content` — `story_html`, `book_html`, `song_html`.
The app opens each in a frame, as the page it is. Right for a phone; wrong here. A foreign page
dropped inside ours brings its own fonts, colours and line width and fights everything around it.

### `js/lst-read.js` — the one file that reads them apart
`LSTRead.story(html, text)` · `.book(html)` · `.song(html)`. Each returns website markup in `rd-*`
classes, styled in `style.css`.

Where the content actually lives:
- **devotional** — in the markup, read by class
- **picture book** — in a `STORY = {...}` object inside the page's script
- **lullaby** — in a `LULLABY = {...}` object inside the page's script

The last two *have* to come from the object: the lullaby page builds its verses with JavaScript at
load time, so its markup is an empty box.

**Nothing is executed.** A small literal reader understands strings, numbers, arrays and objects and
nothing else — it cannot call a function or reach a variable, so a bad paste yields a bad object,
never an action. Do not "simplify" it to `eval` or `new Function`.

### ⚠️ The Morning Lantern is not shaped like the app's parser assumes
This cost real time and will again. The app's own `parseStory` looks for "in a nutshell", "A little
background", "Main Gospel Principle" in `<p>` tags. **The real published Lantern has none of that.**
It has:

- **four `.edition` blocks — the same night written at four depths**, ids `tab-quick`, `tab-medium`,
  `tab-deep`, `tab-superdeep`, only one marked `active`
- writing in `.card` blocks: `.card-label`, `.card-title`, body in `.bt` / `.bt-white`
- `.verse-text`, `.quote-text` + `.quote-attr`, `.prompt-q`, `.heart-q`, `.atonement-q`,
  `.conf-speaker` / `.conf-date` / `.conf-talk-title` / `.conf-body`, `.chips`, `.pills`,
  `.traveler-name` / `.traveler-motto`, `.weekly-block`

The website reads that structure and **offers the four depths as a chooser** — which is what a
website would do with them. The app's older shape is kept as a fallback. A card class the reader
does not know still gets its text through as paragraphs, so a new kind of card appears rather than
vanishing.

**Bold and links inside body text are kept on purpose** — they carry meaning (the Hebrew word a Word
Study is about, the scripture link). Inline tags are held to an allowlist; `href` to http/mailto only.

### Carried over from the app
Text size (remembered per device in `localStorage`) and read-aloud (`speechSynthesis`). Both matter
more at bedtime than they look on a desk.

### The archive too
`archive.html` lists nights without the heavy HTML columns, then fetches the full row through
`LSTData.archive.full(date)` only for the night somebody opens — and renders it exactly like
tonight's, depth chooser included.

### Gotcha that bit
`esc(x.join(" &middot; "))` escapes the separator too, so `&middot;` reached the page as literal
text. Escape each piece, then join with the entity.
