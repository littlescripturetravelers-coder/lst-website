# Little Scripture Travelers — WEBSITE HANDOFF

**Repo:** `littlescripturetravelers-coder/lst-website`
**Live:** https://www.littlescripturetravelers.com (Vercel, auto-deploys on push to `main`)
**Last updated:** 2026-08-19 (session 6)
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

1. **Finish the shared family record.** Website half is BUILT (§11) but two things remain:
   - **Levi must run `sql/2026-08-19-website-accounts-and-family-stories.sql`** in the Supabase SQL
     editor. Nothing works until he does. Click-by-click: Supabase → SQL Editor → New query → paste
     the whole file → Run.
   - **Load the story text.** `story_texts` is empty, so subscribers still can't read a full story.
     The text is in `api/_lib/stories-full.json` on Levi's computer (referenced by
     `data/virtue-library.js`, never committed). Get that file from him, then load the 91 rows.
   - **Wire the timeline's Family Story layer** to the same `family_stories` table (it currently
     keeps added stories in memory only). The app's Family Stories should move to it too — but that
     is app-side work for the app chat.
2. **YouTube "how to use the timeline" video section on the home page.** Levi wants a home-page
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

**What the tool is (VERSION 6, installed 2026-08-19):** a pan/zoom timeline, 4000 BC → 2030, built
by Levi. Self-contained vanilla JS — no build step, no libraries. ~4,800 lines. Only external calls
are Google Fonts and OpenStreetMap tiles for the per-event map.

Version 6 replaced the original wholesale. It adds empires, wars, trade routes, famous people,
migrations, explorations and Christian history as layers; **eighteen** layers behind a slide-out
`☰ Layers` panel (they used to be chips across the top); four modes — **Hand** (dims all but the
events where His hand shows), **Prophecy** (arcs from prophecy to fulfilment), **Seeds** (truths
placed in cultures before missionaries came), **Chain** (a 21-link animated walk from fire to the
First Vision); and three panels — **Prophecy Tracker** (27 fulfilled prophecies with confidence
ratings), **World Faiths Chart** (15 traditions from their own sources), **My Family History**
(add events, pioneer ancestors).

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

**Edits made to Levi's file when it is brought into the repo** (otherwise verbatim — re-apply these
to any future version he sends):
1. meta description added;
2. the header wordmark links back to `index.html`;
3. OpenStreetMap attribution over the map canvas (their tile policy requires it).

**Two defects fixed in the v6 upload** (watch for them recurring in a v7):
- The Prophecy, Seeds and Chain buttons were each in the header **twice**. `getElementById` only
  finds the first, so the second set never lit when toggled. Duplicate run removed.
- `PROPHECIES` was declared **twice**; the later block silently won, making the earlier one dead
  code that also dated Malachi to 600 BC against its own "written c. 430 BC" text. Stale block
  removed, note left in its place.

**`timeline.html` (the explainer) must be updated whenever the tool changes** — it names specific
controls, lists all eighteen layers, and describes each mode. A stale explainer sends people looking
for buttons that aren't there.

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

