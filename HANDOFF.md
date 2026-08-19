# Little Scripture Travelers — WEBSITE HANDOFF

**Repo:** `littlescripturetravelers-coder/lst-website`
**Live:** https://www.littlescripturetravelers.com (Vercel, auto-deploys on push to `main`)
**Last updated:** 2026-08-19
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
blog.html               # blog index — nav dropdown + the post-card list
blog-*.html             # 9 posts, each a full standalone page
main.js                 # shared site JS (nav, misc UI)
style.css               # ALL shared styling — one file, site-wide
js/lst-signup.js        # THE signup popup (see §4)
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
- ✅ **Privacy policy page** (`privacy.html`) — required for App Store + Google Play.
- ✅ **Google Search Console verification** — HTML file + homepage meta tag.
- ✅ **Pricing updated site-wide** — $10.99/mo, $98.91/yr, 7-day trial wording.
- ✅ **"App coming soon" announcement banner** on all pages.

## 6. STATUS — PENDING / next up

1. **World timeline page — BLOCKED, waiting on Levi.** He created an educational "world timeline" and
   wants it on the site, but the details were lost when a previous chat died. **Do not invent the
   content.** Ask him: (a) what is it exactly — scripture chronology, Church history, world history
   alongside scripture? (b) what form is it in now — document, spreadsheet, HTML, notes? (c) where
   should it live — its own page, a blog post, or a section of an existing page? Get the source
   material first.
2. Nothing else outstanding on the website.

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
