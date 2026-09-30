# Lewis Family — iOS app (production code)

This folder is the real app. `CLAUDE.md` holds the rules for working on it, so open this folder in Claude Code. The design reference (`ui_kits/family-app/`) and design tokens live in the Lewis Family Design System project; `src/theme/tokens.ts` is the in-app copy of those tokens.

This folder sits inside the website repo but is **not** part of the website: `.vercelignore` keeps it off the live site.

**Stack:** Expo (React Native, TypeScript, expo-router) · Supabase (Postgres, Auth, RLS, Edge Functions, cron) · Claude API (on the server only) · Plaid (banks, cards, loans) · EventKit (Apple Calendar and Reminders) · App Intents (Siri and Shortcuts) · Alexa Custom Skill.

## Folders
```
app/                    expo-router screens (tabs: today, calendar, reminders, family, more)
src/theme/              tokens + ThemeProvider (user-chosen colors and fonts)
src/components/         UI primitives (button, card, rail, content-tile, list-row, tag, avatar, screen)
src/lib/                family.ts (ages, stages), health-rules.ts, dates.ts, supabase.ts, notifications.ts, eventkit.ts, api.ts
src/hooks/              use-family, use-reminders, use-daily-ideas, use-health, use-lantern
assets/educator/        Family Life Educator chatbot (runs in a WebView with a Claude shim)
supabase/migrations/    database schema + row-level security
supabase/functions/     daily-ideas, advisor, couple-study, lantern-today, educator, plaid-*, voice (Siri), alexa
ios-intents/            Swift App Intents for Siri + Expo config plugin
alexa/                  Alexa skill manifest + interaction model
```

## First-time setup
**New to this?** Follow **TESTFLIGHT.md** instead. It covers the same steps, written out in full, and includes adding your spouse.

1. `npm install`, then `npx expo install` to line up native versions.
2. Create a Supabase project and run `supabase db push`, which applies `supabase/migrations`.
3. Set the server secrets with `supabase secrets set KEY=value`:
   - `ANTHROPIC_API_KEY`
   - `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (sandbox → development → production)
   - `GITHUB_TOKEN`, used to read the Morning Lantern repo if it is private
   - `ALEXA_SKILL_ID`
4. Deploy the functions with `supabase functions deploy --no-verify-jwt alexa plaid-webhook`, then `supabase functions deploy` for the rest.
5. Schedule the nightly jobs. Run `supabase/cron.sql`, which sets daily ideas for 3:00 AM MT, the Lantern fetch and couple study for 5:05 AM MT, and the Plaid refresh every 6 hours.
6. Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
7. Build with `eas build -p ios --profile development`. Siri intents and EventKit need a dev build, not Expo Go.
8. Sign in as Levi, invite Lindy from Settings → Family, and you both share one `family_id`.

## Daily faith features
- **Morning Lantern couple study** (`app/lantern.tsx`, `functions/lantern-today`). Each morning at 5:05 AM Mountain, the function mirrors that day's night from the Lantern repo (`lantern/<slug>/night.json`). It then writes a 10-minute study for the parents: read together, what it teaches, one marriage question for each spouse, how to apply it in parenting for each child's stage, one small act (fitted to the spouse's love language), and a prayer prompt.
- **Story activity with the kids** (`app/story-activity.tsx`, `_shared/story-activity.ts`). This reads the story card from that night's edition. It builds one hands-on activity (15–25 minutes, household materials) plus a version for each child at her current developmental stage, including what to say and how to tell she understood. It adds a feelings moment, scripture questions and a bedtime recall question. The source app's brand and characters are never mentioned.

## Love languages
Each spouse takes a 10-question quiz (`app/love-languages.tsx`), and the result is stored on their member row. These all adapt to the receiving spouse's top languages:
- every AI prompt, through `familyContext`
- the "for your spouse" daily ideas
- the "one small act" in the couple study
- the "Love each other today" row on the Family tab

## Public release (any family)
- **Multi-family from day one:** every row has a `family_id` and row-level security. `0004_multi_family.sql` adds `create_family()` (used by onboarding), `accept_invite(code)` so a spouse can join, and `delete_my_account()`, which the App Store requires.
- **Onboarding** (`app/onboarding.tsx`) asks for:
  - family name, shown as the app title (e.g. "The Lewis's")
  - you and your spouse
  - any number of daughters or sons, with birthdays
  - the anniversary
  - faith content: Latter-day Saint, Christian (uses the Christian Lantern edition) or none (faith features are hidden)
- **Copy adapts per family:** `src/lib/brand.ts` provides `familyTitle()`, `kidsLabel()` ("the girls", "the boys", "the kids" or one child's name) and pronouns.
- **Before submitting:**
  - Pick a store name and set it with `APP_NAME`, and change `bundleIdentifier`.
  - Add Sign in with Apple (the email magic link is already in place).
  - Write a privacy policy that covers health, financial and child data.
  - Get Plaid production access, Anthropic production limits and Alexa certification.
  - Confirm you have permission from the Morning Lantern owner to use the feed for other families.
  - Add billing if needed (RevenueCat is a good fit).

## Home upkeep and kids' chores
- `app/home.tsx` and `src/lib/home-schedule.ts` (migration `0007`) cover:
  - dishes, laundry and a 10-minute reset every day
  - a cleaning focus for each weekday
  - kitchen and house-system tasks on their own schedules
  - yard and seasonal tasks timed to the family's **climate**, which comes from their state; there are 7 climate profiles
  - vehicle service by miles or months
- Any task can be assigned to a family member.
- **Kids' chores:** ideas are suggested by age, and parents assign them.
- **Kid profiles:**
  - In Settings, parents turn on "Can sign in", pick which sections the child sees, and send an invite code.
  - On sign-in, the child lands on `app/kid.tsx`, where they check off chores and earn stars.
  - The `i_am_parent()` rules hide money, health, check-ins, studies and goals from child accounts at the database level.

## What matters to each of us
- In Settings, each person adds hobbies, people and shows, for example hunting, time with sisters or a favorite show.
- `functions/interest-plan` turns each one into calendar events and reminders:
  - **Recurring interests** are planned 90 days ahead.
  - **Seasonal interests** (permit deadlines, openers, premieres, game days) are planned for the family's state. Dates it isn't sure of are marked "confirm".
- A monthly cron keeps everything rolling forward.
- Removing an interest also removes its future items.

## Free now, membership later
- Every family starts with `plan = 'early_access'` and has everything free (`0006_membership.sql`, `src/hooks/use-membership.ts`).
- **When you're ready to charge:**
  1. Add RevenueCat.
  2. Create one "family" entitlement with monthly and yearly products. The design reference shows placeholder prices and a 14-day trial.
  3. Set `PAYWALL_ENABLED=true`.
- One subscription covers both spouses, because the RevenueCat user ID is the `family_id`.
- Early-access families are flagged, so you can give them a founding-family offer.
- The paywall screen design is in `ui_kits/family-app/OnboardingScreen.jsx` (`PaywallScreen`).

## Everything adapts with time
The only fixed facts are birthdays, the anniversary and the family's health log (`family_members`, `health_log`). Everything else is computed from those against today's date:
- ages and developmental stages (`src/lib/family.ts`)
- screenings due (`src/lib/health-rules.ts`)
- fitness guidance
- birthday and anniversary events
- the family context sent to every AI prompt

Nothing has to be edited as the girls grow. The daily-ideas and couple-study functions read the ages fresh every night.

## Money
Plaid Link runs in the app (`react-native-plaid-link-sdk`). `plaid-exchange` stores the access token in Supabase Vault. `plaid-webhook` and the 6-hour cron sync these: accounts, balances, `/transactions/sync`, and `/liabilities/get` (credit card APR and minimums, student loans, mortgages).

The **advisor** function is a Claude tool-use loop. Its tools read accounts, transactions, liabilities, budgets and goals, and it can run snowball and avalanche simulations and save plans.

## Siri and Alexa
- **Siri:** see `ios-intents/README.md`. App Shortcuts include "Add a family reminder", "What's on today in Lewis Family", "Give us a date idea" and "Today's Morning Lantern scripture". Reminders also sync to Apple Reminders through EventKit, so Siri's own Reminders commands work as well.
- **Alexa:** see `alexa/README.md`. It's a custom skill with account linking to Supabase Auth, and the endpoint is `supabase/functions/alexa`.
