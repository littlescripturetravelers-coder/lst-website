# Working on this codebase (for Claude as the family's developer)

## How Levi wants me to work (read first, every session)
Levi Lewis owns this app and is not technical. I am his developer.
- **Do everything I can myself.** Code, database, server functions, config, docs, testing, commits. Only hand Levi a task when it truly needs him (his passwords or payments, his Mac, his phone, Apple/Expo/Supabase screens no tool of mine can reach, or a "Supabase needs approval" step).
- **When he must act,** give very simple numbered steps a five-year-old could follow: one action per step, exact button names, exact text to copy, what he should see when it worked. An analogy helps him. Never dump jargon.
- **Make the best decisions myself.** Pick sensible defaults instead of asking. Ask only when the choice is genuinely his (money he would spend, names and branding the public sees, anything hard to undo).
- **Every change ships without bugs, and nothing else changes.** When he asks for one change, everything else must work exactly as before. Before any change goes out:
  1. Read the code the change touches and everything that calls it.
  2. Make the smallest change that does the job.
  3. Run `npm run typecheck`, `npm run lint`, and an iOS bundle build (`npx expo export --platform ios`, then delete `dist/`).
  4. For server functions, run `npx deno check --no-lock supabase/functions/<name>/index.ts` for each one touched, and redeploy every function that imports a changed `_shared` file.
  5. For the database, add a new numbered migration (never edit an applied one), apply it, then run Supabase's security advisor.
  6. Re-read the full diff looking for anything that changes other behaviour; undo it.
  7. Tell Levi plainly what changed and what he has to do (usually: nothing, or "tap Update in TestFlight").
- **Keep costs as low as possible. He has no money right now.**
  - AI defaults to the cheapest model (`claude-haiku-4-5` in `_shared/claude.ts`). Don't raise it without his OK.
  - Every AI path has a per-family daily cap (`underLimit()` in `_shared/ctx.ts`, counted in `ai_usage`): educator 30, advisor 20, interest-plan 10, voice 40, and at most 3 rounds of daily ideas. Keep a cap on any new AI feature.
  - The "run for every family" jobs only run when the scheduled job calls them with the service-role key (`isService()`). Don't schedule nightly AI jobs (`supabase/cron.sql`) until the paywall brings in money; today everything is generated on demand when someone opens it.
  - Builds use Expo's free plan (no paid build machine). Don't add paid services without asking.
- **Remember the plan:** public and free for about a month (every family starts `plan = 'early_access'`), then a paywall with a monthly subscription and a cheaper yearly one. One subscription covers the whole family (RevenueCat user ID = `family_id`). Apple requires in-app purchase for this.

## Where things live (live facts)
- Supabase project **Family Management App**, ref `uoqfjmgznzbbvzzaoyju`, region ca-central-1. Public URL and anon key are in `eas.json` (they are meant to be public). The other project in the org, `rdbvktqgrwhjucocobua`, is the **website's** database: never touch it from here.
- Migrations `0001`–`0011` are applied (0004 and 0007 were applied in their current form; 0009 lockdown and 0011 AI-usage caps too). `0010_delete_my_account.sql` needs Levi to run it in the SQL editor if it isn't applied yet (check `to_regprocedure('public.delete_my_account()')`).
- Deployed functions: `daily-ideas`, `lantern-today`, `educator`, `advisor`, `interest-plan`, `voice`. Not deployed: `alexa`, `plaid-*` (need Amazon and Plaid accounts first).
- Secrets Levi sets in Supabase (Edge Functions, then Secrets): `ANTHROPIC_API_KEY`. Optional later: `GITHUB_TOKEN` (read-only, lets the Morning Lantern read tonight's night from the private website repo), Plaid keys, `ALEXA_SKILL_ID`.
- Expo account is the **Little Scripture Travelers** org. This app is its own Expo project (`lewis-family`). Never point it at the existing "Little Scripture Travelers App" project.
- App config is static `app.json` (so `eas init` and `eas build` can update it). Bundle ID `com.lewisfamily.app`, scheme `lewisfamily`.
- Sign-in is an email link that opens `lewisfamily://#access_token=…`; `src/components/session-gate.tsx` turns it into a session. Supabase needs `lewisfamily://**` in Authentication, then URL Configuration, then Redirect URLs.

## Product rules
- **Multi-family:** this app is built for public release. Never hard-code the Lewis family in UI or prompts. Use `useFamily()`, `familyTitle()`, `kidsLabel()`, `familyContext()` and the family's `faith` setting.
- **First family:** Levi and Lindy Lewis (parents) and their daughters Mayble Lynn (born 2021-04-13) and Esmay (born 2022-11-15). Anniversary: 2019-09-28. This data lives in the `family_members` / `families` tables. Never hard-code an age. Always compute with `ageOn()` from `src/lib/family.ts`.
- **Design:** follow the Lewis Family Design System (its readme and the HTML reference in `ui_kits/family-app/`, kept in the design-system project, not this repo). Use tokens from `src/theme` only, never raw hex, so user theming keeps working. Choices are shown as swipeable **Rails** of **ContentTiles**. Tapping a tile opens the detail screen (`app/detail.tsx`), which has an attachments rail.
- **Brand rules:**
  - Nothing in the UI says "Little Scripture Travelers": no lockup, no tagline, no Traveler characters. "Morning Lantern" is fine.
  - Say "Heavenly Father", not "God", in app copy.
  - Italics are only for scripture.
  - Gold is for one CTA per screen at most.
  - No guilt language, no emoji.
- **AI:** all Claude calls go through Supabase Edge Functions (`supabase/functions/_shared/claude.ts`). Never put an API key in the app. Every prompt gets `familyContext()` (names, current ages, stages, years married). Server queries using the service role must always filter by the caller's `family_id`.
- **Money advice** is educational, not licensed. Keep the disclaimer. Never move money; access is read-only.
- **Health:** rules live in `src/lib/health-rules.ts` with their source guideline noted. When a guideline changes, update the rule and its `why`. Keep the "your doctor may recommend…" disclaimer.
- **Adding a feature:** add a table and RLS policy in a new migration (`supabase/migrations/NNNN_*.sql`), a hook in `src/hooks`, and a screen in `app/`. Update the design system's `ui_kits/family-app` if the design changes.
- **Files:** name them kebab-case (`content-tile.tsx`). PascalCase .jsx/.tsx files would be picked up by the design-system compiler in the parent project.
- **Love languages** live in `src/lib/love-languages.ts`. Anything one spouse does for the other must fit the receiving spouse's top languages.
