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
| Payhip — Monthly | `https://payhip.com/b/e7N6r` — **$6.99/mo** (see §18) |
| Payhip — Yearly | `https://payhip.com/b/34fmR` — **$49/yr** — the default plan (see §18) |
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
js/lst-keep.js          # the writing half — answers, family circle, journal (§16)
js/lst-bedtime.js       # Bedtime Stories — the written series as a shelf (§17)
js/lst-library.js       # THE LST LIBRARY — what has been sent, auto-shelved (§17)
js/lst-admin.js         # Levi's own controls: retag a night, delete a night (§17)
js/lst-founding.js      # Founding Family band — dark unless a real link is set (§18)
data/founding-offer.js  # ⚠️ the switch for that offer (§18)
bedtime-stories.html / lst-library.html
js/lst-open.js          # story.html / lullaby.html, one piece of the night (§16)
data/lantern-lullaby.js # ⚠️ 2nd copy of the app's signature lullaby words (§16)
story.html / lullaby.html
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
- ✅ **Pricing updated site-wide** — $6.99/mo, $49/yr, annual default, 7-day trial wording (§18).
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

---

## 16. The writing half of the night (built 2026-08-25)

### What Levi asked for
> "I would like the two lullabies and the story to all be links on the tonight's story tab that you
> click and it opens up a new web page... Also for the Parent's Heart for Tonight it needs to have
> the same functionality as the app where it has expandable buttons where you can type in your
> answers and tag them and save them and have them uploaded to your family library. Also at the
> bottom of the webpage it needs to be set up exactly like the app."

And again, the standing rule: **the app does not change. The website conforms.**

### The resource links — `story.html`, `lullaby.html`
The Lantern's three buttons point at files inside the app bundle
(`travelers-lullaby.html`, `a-brand-new-song.html`) that **can never resolve on the website**. So
`js/lst-tonight.js` does not use their hrefs — it rebuilds the same three from what the night
carries:

| Button | Opens |
|---|---|
| Tonight's Story | `story.html?date=…` — the picture book, unfolded down the page |
| Tonight's Lullaby | `lullaby.html?date=…` — that night's lullaby |
| The Lantern Lullaby | `lullaby.html?which=lantern` (or `lantern_url` if the night sets one) |

Both pages are `js/lst-open.js`. With no `?date` they show tonight.

**⚠️ `data/lantern-lullaby.js` is a SECOND COPY** of the app's `www/lullaby-lantern.html` words. The
signature lullaby belongs to no night, so it is in no database row. If it changes in the app, change
it here too. It is deliberately **public** — a lullaby to sing is not something to lock away.

### A Parent's Heart — `js/lst-keep.js`
Every `.rd-q` the reader produces grows a `+`. It opens an answer box with the night's own tags
already on it (story, scripture, traveler, virtues), room for your own, and a row of your family to
mark whose answer it is. Drafts survive in `localStorage`; they clear on save.

**Saving goes to `family_stories` as `answers: [{q,a}]`** — the app's exact shape — via
`LSTData.familyStories.saveAnswer()`.

**⚠️ It must never set `entry_date`.** The app upserts its own journal rows on
`(user_id, entry_date)`; a website row carrying tonight's date would be silently overwritten the
next time a parent answered on their phone. The night is recorded in **`story_id = "night:<date>"`**
instead, which is also how a second answer finds the first row and appends to it rather than making
another. One row per person per night.

### The foot of the page
**Our Family Circle** and **the Study Journal** (all eleven categories, copied from the app's
`JR_KINDS`). Journal entries go to `journal_entries` with the category in `source` as
`"website:<key>"`; `js/lst-journal.js` reads that back as a badge, and its "From the app" test is
now `!/^website/` rather than `!== "website"`.

**The family circle is the one thing still on the device.** There is no table for it and adding one
would mean another migration. It only names people so answers can be attributed; the answers
themselves are all account-backed. It tops itself up from every `person` that has ever had a story
saved, so a second device fills in rather than starting bare. *If Levi ever wants it to sync
properly, that is one `alter table profiles add column family_circle jsonb` away.*

### Two bugs worth remembering
- `enhance()` attached its click handler on **every** render. The page redraws on each depth switch,
  so after two switches one Save fired three times. Guarded with `data-hq-wired`.
- The `1.` in front of a question was being stored as part of the question text. Stripped — the
  number is layout, not question.

---

## 17. The LST Library and the owner's controls (built 2026-08-25)

### The names, as of now
The member bar has **six** doors — **one per verb**:

| Door | The verb |
|---|---|
| The Morning Lantern | read tonight's |
| The LST Library | browse everything |
| Virtue Library | find what I need |
| Family Stories | keep our own |
| Journal | write |
| Timeline | explore |

**⚠️ Do not add a seventh without checking it is a new verb.** It briefly had
eight, and four of them — LST Library, Bedtime Stories, Virtue Library, The
Lantern Archive — all read as "a collection of stories". A family cannot tell
those apart, opens one, and never tries the rest. **A new book is a shelf in
the LST Library, not a tab.**

`bedtime-stories.html` and `archive.html` are shelves of the Library now. They keep their names and
their files; only their door moved. `main.js` lights the Library in the bar for them (and for
`story.html` / `lullaby.html`), so a page reached through it never leaves the row unlit.

**The Virtue Library stayed top-level on purpose.** It is not another shelf — it is the only place
that answers *"my child is frightened tonight, what do I read?"* Different question, own door.

Renamed at Levi's request: **Tonight's Story → The Morning Lantern** (`tonight.html`) and
**Story Archive → The Lantern Archive** (`archive.html`). **Filenames deliberately unchanged** so
nothing already linked, bookmarked or indexed breaks. Don't "tidy" them.

### The two libraries are different things — keep them apart
| Page | What it is | Where its content comes from |
|---|---|---|
| **Bedtime Stories** (`bedtime-stories.html`) | the written series, all 91 | `data/virtue-library.js` + `story_texts` |
| **LST Library** (`lst-library.html`) | what has actually been *sent* | `daily_content` |

The LST Library has five shelves: **Bedtime Stories** (the written series), **Picture Books** (the
nightly illustrated ones), **The Signature Lantern Lullaby** (from `data/lantern-lullaby.js`, §16),
**Daily Lullabies**, and **The Lantern Archive**.

### ⚠️ Nothing on the LST Library is kept by hand
Its shelves are built from `daily_content`, the same table the app publishes into. That is the whole
point: publish a night and it is on the shelf. **Never introduce a second list of what exists** —
it would fall behind the first week Levi published something.

How it knows what a night carries without downloading it:

```js
LSTData.archive.nightsWith("book_html")   // dates only — a few hundred bytes
LSTData.archive.nightsWith("song_html")
```

PostgREST returns just `publish_date` for rows where that column is not null. The books are megabytes
of base64 pictures and are fetched only when somebody opens one. Don't replace this with a `select("*")`.

### The owner's controls — `js/lst-admin.js`
A strip under any night, on The Morning Lantern and in the Archive, **for Levi alone**: retag the
night's virtues, or delete the night.

**No migration was needed and none should be added.** The app's own `0003_admin_publish.sql` already
grants admins `FOR ALL` on `daily_content` and everyone else nothing. **Postgres is the lock; hiding
the buttons is courtesy.** A family who called `LSTData.archive.remove()` from the console gets an
error, not a deleted night.

Deleting a night takes the Lantern, the picture book and the lullaby with it, from the website *and*
the app, with no undo. So it asks twice — a plain confirm, then it makes him type the date. Both
paths are tested.

### Tagging Levi's books
He asked me to tag the daily stories with virtues and said he must be able to edit them later. The
editing half is the strip above. The tagging half happens when a book is added (see
`docs/HOW-TO-SEND-ME-YOUR-BOOKS.md`) — propose tags from the story, show him, let him correct.

---

## 18. The prices (changed 2026-08-25)

**$6.99/month · $49/year.** Yearly is the default everywhere and is shown first, bigger, with
*"just $4.08 a month"* spelled out beside it. Trial unchanged at 7 days.

### ⚠️ THE WEBSITE IS NOT THE TILL
Changing a number in this repo changes what a family **reads**. Payhip charges whatever the **Payhip
product** is set to. Both have to be changed or a family reads one price and is billed another —
which is the single worst bug this site could have. **Whenever a price changes, say so plainly and
give Levi the Payhip steps in the same message.**

### Every place a price is written down
Nine spots, five files. Change all of them together:

| File | What is there |
|---|---|
| `js/lst-signup.js` | the `PRICE` block at the top — the popup builds its buttons from it |
| `subscribe.html` | the tier card, and the two plan buttons (`btn-tier-gold` / `btn-tier-outline`) |
| `index.html`, `index-july.html`, `index-default.html` | the plan card — **all three, they drift** |

Check with: `grep -rn "6\.99\|\$49" --include=*.html --include=*.js .`

### Why yearly is the default, and how
`openTrialSignup()` with **no argument** = annual. There are ~250 generic CTAs on the site and they
all call it that way now. **Only one button on the whole site names a plan** — the Monthly one on
`subscribe.html`. If you ever see `openTrialSignup('monthly')` anywhere else, it is a mistake: it
forces the worse plan on a family who never asked for it.

### The Founding Family offer — built, deliberately dark
`data/founding-offer.js` + `js/lst-founding.js`, mounted on `subscribe.html`.

**It draws nothing unless `active: true` AND `link` matches a real `https://payhip.com/b/…` URL.**
Both conditions, every time. That guard exists because a banner promising $39 that leads to a $49
checkout is worse than no banner at all. To switch on: Levi creates the Payhip product, sends the
link, and it is two lines in `data/founding-offer.js`.

### Things only Levi can do (do not promise these are done)
1. Change the two Payhip product prices.
2. Create the Founding Family product.
3. **Move existing subscribers down** to the new price. Early supporters discovering newcomers pay
   less is how you lose the people you can least afford to lose.

---

## 19. The second front door, the two doors, and hiding the sell (built 2026-08-26)

### What Levi asked for
Three things in one go:
1. A second landing page for a family who has never heard of *Come, Follow Me*, with the
   headline *"Bedtime Bible stories, in the smallest words that still carry the meaning."*
2. The Sacred World Timeline and the lullabies put behind the Lantern subscription.
3. **"Anything about subscription or free should not be shown once someone signs in."**

### The second front door — `bible-bedtime-stories.html`
Same product, same price, same footer, same Lantern. A different first sentence.

It says *Bible* and it does not say *LDS* — not because anything is hidden, but because
"Come, Follow Me" means nothing to a family who has never used it. **"Where we're coming
from" is one click away from this page**, exactly as it is from `index.html`. If anyone ever
proposes removing that link to improve conversion, the answer is no: a family who finds out
later feels tricked, and rightly.

`sample.html` is the page it sends people to first — *"Don't take our word for it. Read one."*

### ⚠️ The two doors are NOT a paywall — read this before describing them to anyone
`js/lst-members-only.js`, on `timeline-explore.html` and `lullaby.html`.

The nightly story, the archive and the library are guarded **by Postgres**: `lst_is_subscriber()`
decides, and a non-subscriber's browser never receives the words at all. That is a real lock.

**The timeline and the lullabies are not that.** Their content is written into those two files,
so it is already in the visitor's browser before the door appears. What `lst-members-only.js`
does is *put a door in front of a room the visitor is already standing in*. It turns people
away; it does not lock them out. Anyone who opens View Source can read past it.

That is an acceptable trade for now — it costs nothing and nearly everyone respects a closed
door — but **never tell Levi, or a customer, that this content is locked.** If it ever has to
be truly private, the words must move into Supabase behind RLS, the way the nights did.

The copy in `js/lst-members-only.js` carries this same warning at the top of the file.

**Every string you pass to `LSTMembers.guard()` is plain text.** It is escaped on the way in,
so write a real `—` and a real `’`, never `&mdash;` or `&rsquo;`. (It used to escape the bullets
but not the blurb, which is how `Every night&rsquo;s lullaby` reached a real screen.)

### Hiding the sell from people who already bought — `js/lst-signed-in.js`
On all 35 real pages. Once `LSTAuth` says the visitor is a subscriber, everything selling the
subscription is removed: the header CTA, the Subscribe menu, every "7 days free" button, and
anything marked `data-selling="1"`.

Two things **always stay**, whatever state the visitor is in:
- `cancel.html` and every link to it
- `.footer-col-manage` and `.btn-cancel-sub`

A subscriber who cannot find the way out is a complaint, a chargeback, and a bad review. Do not
let a future tidy-up sweep those into the "selling" list.

The header keeps a button, but it goes somewhere useful: **Tonight's Lantern** → `tonight.html`.

`localStorage["lst:wasSubscriber"]` is applied immediately on load so the sell does not flash
up for half a second before auth resolves. It is a **display hint only** — never treat it as
proof of anything. Postgres decides who is a subscriber.

## 20. The reading pass (2026-08-26)

### What Levi asked for
> "Make sure everything is in my branding fonts and any medicine boxes you click to get access
> to please also make sure that the words in it are readable. The example you showed me had a
> yellow pill box that you couldn't read the words in it."

### The yellow pill box
It was **"Best value"** on the yearly plan in the signup popup (`js/lst-signup.js`,
`.ts-best-tag`). Dark navy on gold — the colours were fine — but set at `0.6rem`, which is
9.6px. It is now `0.72rem` with more padding, and the button above it gained room to hold it.

### How this was checked, and how to check it again
Two scripts in the session scratchpad, both driving headless Chromium with the **real** Fredoka,
Nunito and Anton served from disk (earlier screenshots in this project had the webfonts blocked,
which is why they looked wrong):

- `brand.mjs` — walks every element with visible text on all 36 pages and reports (a) anything
  not set in a brand face, (b) anything below WCAG AA contrast **against what is actually
  painted behind it**, (c) any HTML entity that reached the screen as literal text.
- `boxes.mjs` — the same test on the boxes that only exist after a click: the signup popup, the
  journal gate, both members-only doors, the Lantern gate.

Both now report **0**. Two traps worth remembering if you rebuild them:
1. Compositing two translucent layers must keep the result's alpha. Getting that wrong turned
   `rgba(255,255,255,.16)` into opaque white and produced 274 false failures.
2. If any ancestor has a `background-image`, the colour behind the text is unknowable from
   computed style. Say so and skip, or you will "fix" gold-on-gold text that was navy on gold.
   (`.lst-mark` on the timeline is exactly this: dark navy on a gold radial gradient.)

### What actually changed
- **Fonts.** Every one of **1,245** `font-family` declarations now points at `--font-display`,
  `--font-body` or `--font-accent` instead of naming the face directly. Same fonts; the
  difference is the fallback while Google Fonts is still loading — 'Arial Rounded MT Bold'
  rather than plain Arial for headings, so the page looks like itself on first paint.
  `timeline-explore.html` repeats the three variables in its own `:root` so it stands alone.
- **Muted text has a floor.** 196 declarations of `color: rgba(255,255,255, …)` below `0.55`
  were raised to `0.55`. The footer's legal line, at `0.35`, was the largest single offender —
  it appeared on every page.
- **An invisible heading.** "Built to Grow With Your Child" on `virtue-library.html` was white
  on the cream stage strip: 1.03:1, effectively not there. It is navy now.
- **A favicon, at last.** No page declared one, so every tab showed a blank square. `favicon.ico`
  plus `images/favicon-32.png` and `images/apple-touch-icon.png`, cut from the logo badge and
  linked on all 36 pages.
- **Small things made readable**: the lullaby's "Chorus" tag, the virtue badges on the Lantern,
  the cancel-page captions, the privacy date, the Old-Testament page tag, the YouTube button.
- **The timeline's controls.** The era bar (Creation → Today) was 7.5px; it is 11px, and it
  still sits on one row at desktop width and wraps to a tidy two on a tablet. The zoom and
  reset glyphs went from 10px to 15px inside their 34px buttons.

### What was deliberately left alone
`timeline-explore.html` is the app's own file, and Levi said the app stays as it is. Everything
in it except the era bar and the zoom buttons — the faint layer chrome, the 7px legend headings,
the white glyphs on the coloured event dots — is untouched. If he ever wants the whole timeline
made easier to read, that is a separate decision and a separate conversation with the app chat.

## 21. The website is the delivery, not the inbox (changed 2026-08-26)

### What Levi asked for
> "In the front of my website it still talks about what you get is an email each morning. Please
> remove that and say something to the extent that you get the same products as before but instead
> of an email you are able to get all of those through the website or through our app."

### What changed
Every promise that the subscription is **delivered by email** is gone — 30 of them, across the
three front pages, `subscribe.html`, `books.html`, `bible-bedtime-stories.html`,
`spiritual-tracker.html` and five blog closers.

The **5 AM Mountain (Denver)** timing stays everywhere it appeared. Only the channel changed:
*"waiting on the website and in the app by 5 AM"* instead of *"delivered to your inbox by 5 AM"*.

Named changes worth knowing about:
- The homepage section **"WHAT ARRIVES IN YOUR INBOX"** is now **"WHAT IS WAITING EACH MORNING"**.
- The bullet **"No app, no screen time — everything arrives by email"** is now
  **"On the website or in the app — the same story either way"**. It was the copy most directly
  contradicted by the app existing.
- The third doorway card, **"Subscribe by Email"**, is now **"Subscribe to The Lantern"**, and its
  **envelope icon is an open book** — an envelope is a picture of a promise we no longer make.
- The perk badge **"★ In Your Inbox by 5 AM"** is now **"★ Ready by 5 AM"**.

### Two mentions of email were deliberately kept
Both are the **newsletter**, not the subscription, and both are still genuinely email:
- `index.html` (and the two variants) — *"Free scripture story sent straight to your inbox"* in the
  "Join the Journey" block, which is the Mailchimp lead form.
- `blog.html` — *"new blog posts … delivered directly to your inbox every week"*.

If Levi ever stops sending those, they have to come out too. They are the only two left.

### The banner is now the notice that the email is ending
`app-move-banner` (it was `app-coming-banner`; nothing in CSS or JS targets the class, so the
name was changed to match what it says), at the top of the same **20 pages**:

> 📱 **A change for our families —** your story has always arrived by email at 5 AM Mountain.
> We are moving it all onto the website and into the app: the nightly story and lullabies,
> the Virtue Library, and your Family Story Library, all in one place.

That is Levi's own framing, asked for directly: *"something to the extent saying we have had it
as an email at 5 AM Mountain but we are moving it all into the app and website."* It resolves what
used to be a contradiction — the body copy says where the story now lives, and the banner says why
it moved.

**It must stay visible to subscribers.** `js/lst-signed-in.js` hides things that sell a
subscription; this sells nothing, and paying families are precisely the people who need to know
their 5 AM email is stopping. It carries none of the selling markers (`.nav-cta`,
`[onclick*="openTrialSignup"]`, `[data-selling="1"]`), so it is safe today — keep it that way.

Take the banner down once the move is finished and no one is still waiting on an email.

## 22. Scriptures and talks are links now (built 2026-08-26)

### What Levi asked for
> "All the scriptures listed throughout the morning lanterns need to have links to the scripture
> chapters or verses. They also need links to the talks or sermons listed."

### `js/lst-refs.js` — the one file that does it
It runs **last**, on the finished HTML the reader has already built. That is the whole design:
`js/lst-read.js` does not have to know a card contains a scripture, and a card Levi invents next
month gets its references linked without anyone touching this file.

Three rules it will not break, and they are in the file's own header:
1. **It never touches text already inside an `<a>`.** Some Lanterns carry Levi's own links; his win.
2. **It only ever wraps text in a link.** Not one character of what he wrote is changed, moved or
   dropped. Run it twice and the output is identical — the second pass sees the first pass's links
   and skips them. Both properties are asserted in the test below.
3. **A reference it does not recognise is left as plain text.** A wrong link is worse than no link:
   it sends a parent to the wrong verse, in front of their child, at bedtime.

### What it understands
Book names and the abbreviations Levi actually writes, across the Old Testament, New Testament,
Book of Mormon, Doctrine and Covenants and Pearl of Great Price — with verses, ranges and
semicolon lists:

| He writes | It links to |
|---|---|
| `John 14:15` | nt/john/14, anchored at verse 15 |
| `Alma 32:21-27` | bofm/alma/32, verses 21–27 |
| `D&C 121:7–8` | dc-testament/dc/121 |
| `Psalms 102–103; 110; 116–119` | **six separate links**, each on its own chapter |
| `Joseph Smith—History 1:17` | pgp/js-h/1 (any dash matches any dash) |

**Two traps that cost real debugging, so do not undo them:**
- Names are matched **longest first**. Without it, `1 John 4:8` links to John.
- A semicolon list **stops at the next book name**. `3 Nephi 11; 4 Nephi 1:15` was reading the "4"
  as another chapter of 3 Nephi — a link that looked right and went to the wrong book.

### The talks
A conference talk **cannot be deep-linked from its title**: the Church's URL for it carries an id
we do not have, and a guessed id produces a link that looks right and 404s. So:
- the **talk title** links to a search of general conference, which finds it;
- the **date**, when a month and year can be read out of it, links to that conference itself.

Both are addresses we can be sure of. These are built in `js/lst-read.js` from the card's own
`.conf-speaker` / `.conf-talk-title` / `.conf-date`, not guessed out of prose.

### ⚠️ The links could not be opened from the build machine
`churchofjesuschrist.org` is blocked by this environment's network policy, so **every URL here was
written from the published Gospel Library scheme, not fetched and confirmed.** The scheme is
long-standing and the shapes were checked against each other, but a single wrong book slug would
produce one dead link.

**`link-check.html`** exists for exactly that: one link for every book on a single page, plus a
sample sentence showing the links in context. Nothing on the website links to it and it carries
`noindex`. If Levi reports a book that lands on "page not found", the fix is one `slug` in the
`BOOKS` table.

### Where the links go — it depends which door the family came through
Two front doors, two kinds of family, two right answers. Set by `WHERE` in `js/lst-refs.js`, which
is now decided per page load rather than fixed:

| Family | How it is decided | Bible chapters open on |
|---|---|---|
| Came through `index.html` | that page declares `gospel-library` | the Gospel Library |
| Came through `bible-bedtime-stories.html` | that page declares `bible` | Bible Gateway (KJV) |
| Read on into the sample, the Lantern, the archive | the door is remembered for the browser | wherever their door said |
| No door remembered at all | the default | the Gospel Library |

A page says which it is with `<meta name="lst:scripture-links" content="bible">` (or
`gospel-library`), and declaring it also **sets** the door, so a Latter-day Saint family who
happened to land on the Bible page is put back on the Gospel Library the moment they visit the
main site.

**The Book of Mormon, the Doctrine and Covenants and the Pearl of Great Price always go to the
Church's site**, in either mode, because they exist nowhere else. That rule lives in `chapterUrl`.

### ⚠️ The site does not know anyone's religion, and must not pretend to
Nobody is asked their faith, and nothing is inferred from a name or an email address. The **only**
signal is which front door the browser came through. If anyone ever proposes guessing — from a
surname, a location, a mailing list — the answer is no. Getting it wrong tells a family you think
you know something about them that you do not.

### Where it is wired in
`js/lst-read.js` (every article, both the four-depth Lantern and the older simple shape),
`js/lst-tonight.js` (the night's reference line and the sample card),
`js/lst-archive.js` (**the opened night only** — the list card is itself a click target, and a link
inside it would fight the card for the tap), and `js/lst-sample.js`.
`js/lst-refs.js` loads **before** those on `tonight.html`, `archive.html`, `story.html`,
`lullaby.html` and `sample.html`. If it fails to load, every one of them falls back to plain text.

### Style
`.rd-sref` in `style.css`. Inside a sentence the link **inherits its colour** and shows a dotted
underline, going gold on hover — a coloured link in every verse would speckle the page. A talk
title and its date are their own line, so those are gold.

## 23. The Payhip links changed (2026-08-26)

Levi moved to Payhip's newer shape: **one product, two pricing plans**, with the plan in the query
string rather than a product code in the path.

| Plan | Link |
|---|---|
| Monthly | `https://payhip.com/order?link=1MNVZ&pricing_plan=PAWg3bbPWK` |
| Yearly | `https://payhip.com/order?link=1MNVZ&pricing_plan=91zw8xxyBL` |

They are in `js/lst-signup.js` (`PAYHIP`) and on the two buttons in `subscribe.html`.

### ⚠️ This nearly broke the one thing that must not break
The old links had no query string, so the popup handed the email over with
`PAYHIP[plan] + "?email=" + …`. Against a link that **already** carries `?link=…&pricing_plan=…`,
that second `?` would have been swallowed into the pricing_plan value: the wrong plan charged, and
the email never arriving — which is the §4 contract, since Payhip and Mailchimp are matched to a
family **by email**.

There is now a `withEmail()` that joins with `&` when the URL already has a `?`. **Never go back to
string-concatenating a `?` onto a checkout link.** Verified by driving the real popup and reading
the URL the browser is actually sent to:

```
annual  → https://payhip.com/order?link=1MNVZ&pricing_plan=91zw8xxyBL&email=family%2Btest%40example.com
monthly → https://payhip.com/order?link=1MNVZ&pricing_plan=PAWg3bbPWK&email=family%2Btest%40example.com
```

`js/lst-founding.js` only recognised the old `/b/XXXXX` shape and would have silently refused to
draw the Founding banner for a plan-style link. Its guard now accepts both.

### Still only Levi can confirm
`payhip.com` is blocked from the build machine, so **the prices and the trial on those two plans
were not checked** — only that the links are well formed and carry the right plan and email. The
website says **$6.99** and **$49** with a **7-day trial**. If Payhip says anything else, the
website is lying to a family at the moment they reach for a card.

## 24. ~~The library stories have no words yet~~ — WRONG, see §25 (2026-08-26)

### What Levi asked for
> "I need all the stories under resources in the app and then under bedtimes stories and then
> under August book to be placed into my website."

### ⚠️ THIS SECTION IS WRONG. It is kept only so the mistake is on the record.
The clone of `lst-app` this was written from was a day out of date. The app chat had already
shipped all 35 August nights. **Read §25 instead.**

### What it wrongly claimed
The app does not hold those stories either. `openStory()` in `lst-app/www/index.html` shows the
title, scripture, virtue, teaching note and teaser — then a card reading *"The full illustrated
story lives in <book>. We're bringing the whole library into the app so you'll read every story
right here — coming soon."*

`lst-app/www/data/virtue-library.js` is the **same metadata-only catalog** the website has. The
words for all 91 stories have never existed anywhere but Levi's book manuscripts. Both sides show
a teaser for the same reason.

**The August catalog half was already complete** before he asked: book 8, *I Will Trust and Sing*,
35 stories across 5 weeks, every one carrying virtues, stages, a teaching note and a teaser, all
ids unique. It shows on the shelf with its cover. Only `story_texts` is empty.

### ⚠️ A bug that would have appeared the moment the text was loaded
`story_texts.story` is **jsonb — an array of paragraphs**, so PostgREST returns a real JavaScript
array. `paras()` in `js/lst-bedtime.js` did `String(t).split(/\n\s*\n/)`, and `String(["a","b"])`
is `"a,b"` — every story would have rendered as **one comma-spliced paragraph**, and it would have
looked like Levi's writing was at fault rather than the code. It now takes an array or a string.
Verified by serving a jsonb array through the real page: three paragraphs, all four sections.

**The other three columns — `fork`, `remember_this`, `prompt` — are plain text.** Only `story` is
an array. Do not "tidy" that inconsistency without changing the table.

### What actually has to happen
Levi sends the August book. `docs/HOW-TO-SEND-ME-YOUR-BOOKS.md` already describes the job. For a
book whose cards exist, only half 2 is left: one SQL file built from
`sql/TEMPLATE-add-story-text.sql`, 35 blocks, pasted into the Supabase SQL editor once. The ids are
already fixed by the catalog — `b8-w1-n1` through `b8-w5-n7` — so they must match exactly.

`docs/FOR-THE-APP-CHAT-library-story-text.md` carries the app half: once `story_texts` holds the
words, the app can replace its "coming soon" card by reading the same table, with the same warning
about the jsonb array, and a note that its demo checkout still shows the old $10.99 / $98.91.

## 25. The August book, read the website's way (built 2026-08-26)

### I was wrong in §24, and the check that would have caught it
I told Levi the app had no story text. He said he had looked and it did. He was right: my clone of
`lst-app` was one commit stale, and `fff56c7` — *"Every night of the August book is in the app and
on the website"* — had already landed.

**Always `git fetch` the app before reasoning about what is in it.** The app's default branch is
`master`, not `main`; `git fetch origin main` fails with "couldn't find remote ref" and it is easy
to read that as "nothing new".

### What the app actually has
`lst-app/www/stories/aug-01-*.html` … `aug-35-*.html` plus `august.html`, a contents page. Each
night's page carries a **`STORY = {...}` object** — the very same shape as `data/sample-night.js`,
which `js/lst-read.js` has always known how to draw.

### What Levi asked for, and what was built
His first instruction was to put those stories on the website. The obvious move — copy the pages —
was **built and then thrown away**, because his next message was clear:

> "You need to correct it so they show up well on the website. So they match the writing and
> everything on the website and then have the images. Just like the morning lanterns looks."

So the website does not serve the app's pages. It takes the words and the pictures out of them:

- **`tools/extract-book.py`** reads the app's night pages and writes `data/book-august.js`
  (108 KB, all 35 nights, 9,608 words) plus **241 real .jpg files** in `images/book/`. The
  pictures come out of the base64 because a browser can cache a file and cannot cache a string —
  12.8 MB on disk, ~380 KB for the night a family actually opens, lazily.
- **`LSTRead.beats(night)`** is a new door into the reader that takes an already-extracted object.
  `book(html)` is now one line: `beats(objectNamed(html, "STORY"))`. Same beats, same output.
- A night opened from **Bedtime Stories** is drawn by that, so it carries the same eyebrows and
  headings as the Morning Lantern — *Scripture Traveler of the Night*, *A Feeling Moment*,
  *Remember This*, *Parent Prompt*, *Parent Experience* — in the website's own type.

### Where a night comes from now
`storyView()` in `js/lst-bedtime.js` looks for the book first. **Where the book has a night, that
night IS the story, and `story_texts` is not consulted for it.** `story_texts` remains the path for
any story a book has not been extracted for.

### Rebuilding it, and next month
```
python3 tools/extract-book.py ../lst-app/www/stories august 8
```
Never edit `data/book-august.js` by hand — the app's page is the one source of truth, and a hand
edit is lost the next time the tool runs. For September: fetch the app, run the tool with the new
month and book number, add one `<script src="data/book-september.js">` beside the August one, and
add the array to `nightOf()` in `js/lst-bedtime.js`.

### Two small things found in the book's own data
- Every night is exactly **9 beats** — cover, two story turns, five moments, and a closing beat.
- **One beat is empty**: `b8-w2-n5`'s *Parent Experience* has neither words nor a picture, and the
  book's closing beat never has either. `beats()` now skips any beat that would draw nothing,
  because a heading over an empty space reads as a fault rather than as a quiet moment. The app
  presumably still draws them — worth a look from that side.

