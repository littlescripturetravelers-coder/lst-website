# Little Scripture Travelers — HANDOFF

**Last updated:** 2026-08-15
**Owner:** Levi Lewis (non-technical founder). Claude builds & ships everything.
**Read this first, then check the `memory/` folder (MEMORY.md index), then inspect files before changing anything. Don't redo completed work.**

---

## 0. What this is
Little Scripture Travelers (LST) — an LDS/Christian bedtime scripture-story subscription for families with kids ages 1–5. Three pieces:
1. **iOS + Android app** (Capacitor 8) — daily scripture story + notifications.
2. **Website** — marketing + signup (`lst-site`), deployed on Vercel.
3. **Backend** — Supabase (Postgres + Auth + Edge Functions). Payhip = payments. Mailchimp = daily email.

## 1. Key accounts / IDs (source of truth)
- **Supabase project ref:** `rdbvktqgrwhjucocobua` — URL `https://rdbvktqgrwhjucocobua.supabase.co` (owner littlescripturetravelers@gmail.com).
- **Bundle ID (iOS & Android):** `com.littlescripturetravelers.littlescripturetravelers`
- **Apple Team ID:** `42378UBC64`. **APNs Key ID:** `GW65X6LH29`.
- **Payhip products:** Monthly `payhip.com/b/e7N6r` ($10.99/mo), Yearly `payhip.com/b/34fmR` ($98.91/yr). Both have a 7-day free trial ON.
- **Mailchimp Audience ID:** `a6978c55f7`. Subscriber tag: **`Lantern Subscribers`** (active = gets daily email). Levi sends the daily story as a MANUAL campaign each morning to that tag/segment.
- **Website domain:** www.littlescripturetravelers.com (Vercel, GitHub auto-deploy).
- **CI/CD:** Codemagic (`codemagic.yaml`). iOS builds on push; Android workflows started MANUALLY from Codemagic UI.

## 2. Project folders (all under C:\Users\User\Downloads\)
- `lst-app\` — the Capacitor app (www/ = web UI, ios/, android/, supabase/functions/, codemagic.yaml).
- `lst-site\` — the marketing website (static HTML, deployed to Vercel).
- `lst-companion-guide.html` — a marketing/strategy kit Levi attached (source for the pending blog-post task).

---

## 3. STATUS — what's DONE & verified
- **Backend live & verified** (Supabase): tables profiles/subscriptions/daily_content/family_stories/devices with RLS; `on_auth_user_created` trigger auto-creates profile + 7-day `trialing` subscription; email confirmation OFF (instant login).
- **App wired to REAL backend** (was a fake local demo before): real sign in/up/out, session restore on boot, live daily story from `daily_content`, device registration after login. Verified in browser.
- **5 AM push notifications WORKING end-to-end** (direct APNs, ES256 JWT, no Firebase). Edge function deployed with slug **`dynamic-function`** (NOT "daily-publish"), JWT OFF, hourly cron `five-am-push` gated to the 5 o'clock hour America/Denver with a `notified_at` guard. The 4 `APNS_*` secrets are set in Supabase. Manual test: `curl -X POST .../functions/v1/dynamic-function?test=1`. THE fix that made it work: AppDelegate.swift now forwards the two APNs callbacks to Capacitor.
- **Admin publish flow:** app Admin "Upload Today's Story" writes to `daily_content` via `LST.publishContent()` (upsert on publish_date). Gated behind `profiles.is_admin`.
- **iOS reader model (Apple 3.1.1 fix):** on iOS the app hides all Payhip/purchase CTAs (`IS_IOS` gate in www/index.html). Payments happen on web/Android only.
- **Account deletion (Apple 5.1.1 fix):** "Delete My Account" button → `delete-account` edge function (verifies caller JWT, service-role deleteUser). JWT verification ON for this one.
- **Website email+password signup popup (`lst-signup.js`):** opens from home page + ALL trial CTAs site-wide (133 CTAs wired across 19 pages). Flow: user enters first name/email/password → `sb.auth.signUp()` creates the app login → redirect to Payhip checkout with `?email=` prefilled. Monthly/Yearly toggle, "✨ 7 DAYS FREE · No charge today" badge. "Meet the Travelers"/"Start the Journey" stay as explore links (not signup).
- **Mailchimp auto-sync LIVE & verified:** `payhip-webhook` edge fn syncs both the `subscriptions` table AND Mailchimp. Subscribe → `Lantern Subscribers` tag active; cancel/refund → inactive. So only active subscribers get the daily email. Tested end-to-end via curl. Matching is BY EMAIL — subscriber must use the same email at Payhip as their app login (checkout URL now prefills email).

## 4. STATUS — in flight / waiting
- **iOS 1.0.2 (build 12):** submitted, "Waiting for Review." History: rejected once (3.1.1 payments + 5.1.1 deletion) → fixed with reader model + delete account. Rejected again (2.1 Information Needed) → replied with walkthrough video + written answers, resubmitted. ASC gotcha: to un-grey "Resubmit to App Review," open the VERSION page and click blue "Update Review" first.
- **Trial model decided:** card-upfront via Payhip's built-in 7-day free trial + honest reminder emails (best conversion + happy customers). Payhip trial is already ON.

## 5. NEXT TASKS (in priority order)
1. **(IN PROGRESS — do this first) Add the blog post to the website.** Levi wants ONLY the blog-post portion of `lst-companion-guide.html` added as a new post on `lst-site`. Content = that file's lines 734–810: tag "Faith & Family", title "The Gospel Library Is Amazing — And There's Still One Thing It Can't Do for Your Kids", meta "By Levi · Little Scripture Travelers · littlescripturetravelers.com", full body (Gospel Library praise → identification/characters Beau/Scout/Willow/Wren → Duke & Fivush family-stories research → "companion not competition" → signature). **How:** copy `lst-site\blog-heart-behind-pages.html` → e.g. `blog-gospel-library-companion.html`; replace `<title>` (line 6), the `article-hero` block (article-tag/h1/subtitle/byline, lines 686–691), and the whole `article-body` inner content (lines 700–915, i.e. everything before the `<!-- CTA -->` at line 917) with the new article adapted to the template's classes (`pull-quote` for pullquotes, `opening-quote` for the highlight box, `<h2>` for headings). Keep the existing CTA/footer/scripts (they already have the signup-popup wiring). Then add the post to `blog.html` (nav dropdown ~lines 367–395 + the post list ~line 471+). Then it auto-deploys via Vercel on git push.
2. **Ship Android to Google Play.** Keystore uploaded to Codemagic (`lst_keystore`), `android-test` workflow green. Remaining: run `android-release` (signed AAB), then create the Play listing ($25 dev account). build.gradle release signingConfig reads CM_KEYSTORE_PATH/PASSWORD, CM_KEY_ALIAS, CM_KEY_PASSWORD. Caveat: push on Android needs FCM (currently iOS-only APNs).
3. **After Apple approves 1.0.2:** apply for the **reader-app External Link Account Entitlement** so the app can show a seamless "subscribe on our website" link (Spotify-style, no Apple cut).
4. **Build trial/subscription ENFORCEMENT** (coordinated flip, app 1.0.3): app-side RLS + trigger change so access actually ends when the trial/subscription ends + a "trial ended" screen + Mailchimp win-back. Email side is already enforced via the Mailchimp tag; this is the APP side. Deferred until AFTER 1.0.2 is approved so you don't disrupt review.
5. **Cloud-sync Family Stories** (Task #7): `family_stories` needs columns traveler/travelers/situations/custom, `entry_date` is date-typed (app passes human strings), and a unique(user_id,entry_date) for upsert. Currently Family Stories is LOCAL-only.

## 6. IMPORTANT GOTCHAS (things that cost hours)
- The push edge function's slug is **`dynamic-function`**, not `daily-publish` — cron and curl must target that.
- App Store screenshots must have **NO alpha channel** — flatten to 24bpp RGB (Apple silently rejects 32bpp ARGB). Used PowerShell System.Drawing Format24bppRgb.
- iOS build = Swift Package Manager (not CocoaPods); executable & scheme both named "App".
- Mailchimp key must be a regular **Marketing API key** (Account → Extras → API keys), NOT a "Mobile Client Key." DC is parsed from the `-usXX` suffix. **Key expires ~1 year from ~2026-08-14 — regenerate before then.**
- `SUPABASE_SERVICE_ROLE_KEY` shows as deprecated in Supabase but is still auto-injected and works.
- Supabase Edge Function deploys: must click the **Deploy** button (pasting code alone doesn't deploy).
- Levi runs the Desktop app, **no CLI**. He can't run SQL migrations that need service role via code — he must paste them in the Supabase SQL editor himself. Remote Control is enabled (sessions show on claude.ai/code + phone app).
- Migration 0003 adds `profiles.is_admin` etc. — after running it, set his owner account admin: `update profiles set is_admin=true where email='<his owner email, NOT the applereview account>';` (account must already exist).

## 7. Key files
- `lst-app\www\index.html` — app UI (auth, IS_IOS reader gate, delete account, admin publish, push diagnostics).
- `lst-app\www\js\backend.js` — Supabase calls (restore, setNotify, deleteAccount, isAdmin, publishContent, getTodayContent).
- `lst-app\www\js\native.js` — registerForPush() (robust, 9s timeout, window.__pushDiag).
- `lst-app\ios\App\App\AppDelegate.swift` — the APNs callback fix.
- `lst-app\supabase\functions\daily-publish\index.ts` — 5 AM push (deployed as slug `dynamic-function`).
- `lst-app\supabase\functions\delete-account\index.ts` — account deletion.
- `lst-app\supabase\functions\payhip-webhook\index.ts` — subscriptions + Mailchimp sync.
- `lst-app\codemagic.yaml` — ios-release / android-test / android-release workflows.
- `lst-site\js\lst-signup.js` — website signup popup (email+password → Payhip).
- `lst-site\blog.html` + `blog-*.html` — blog (posts are separate pages linked from blog.html).

## 8. How to resume in a fresh session
Tell Claude: "Read HANDOFF.md and the memory/ folder, inspect the current files, then continue from the next unfinished task in HANDOFF.md section 5. Don't redo completed work." The repository/files are the source of truth; this chat is disposable.
