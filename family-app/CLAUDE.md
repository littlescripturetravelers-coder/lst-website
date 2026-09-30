<!-- Rename this file to CLAUDE.md after downloading so Claude Code loads it automatically. -->
# Working on this codebase (for Claude as the family's developer)

- **Multi-family:** this app is built for public release. Never hard-code the Lewis family in UI or prompts. Use `useFamily()`, `familyTitle()`, `kidsLabel()`, `familyContext()` and the family's `faith` setting.
- **First family:** Levi and Lindy Lewis (parents) and their daughters Mayble Lynn (born 2021-04-13) and Esmay (born 2022-11-15). Anniversary: 2019-09-28. This data lives in the `family_members` / `families` tables. Never hard-code an age. Always compute with `ageOn()` from `src/lib/family.ts`.
- **Design:** follow the Lewis Family Design System (its readme and the HTML reference in `ui_kits/family-app/`, kept in the design-system project, not this repo). Use tokens from `src/theme` only, never raw hex, so user theming keeps working. Choices are shown as swipeable **Rails** of **ContentTiles**. Tapping a tile opens the detail screen (`app/detail.tsx`), which has an attachments rail.
- **Brand rules:**
  - Nothing in the UI says "Little Scripture Travelers": no lockup, no tagline, no Traveler characters. "Morning Lantern" is fine.
  - Say "Heavenly Father", not "God", in app copy.
  - Italics are only for scripture.
  - Gold is for one CTA per screen at most.
  - No guilt language, no emoji.
- **AI:** all Claude calls go through Supabase Edge Functions (`supabase/functions/_shared/claude.ts`). Never put an API key in the app. Every prompt gets `familyContext()` (names, current ages, stages, years married).
- **Money advice** is educational, not licensed. Keep the disclaimer. Never move money; access is read-only.
- **Health:** rules live in `src/lib/health-rules.ts` with their source guideline noted. When a guideline changes, update the rule and its `why`. Keep the "your doctor may recommend…" disclaimer.
- **Adding a feature:** add a table and RLS policy in a new migration (`supabase/migrations/NNNN_*.sql`), a hook in `src/hooks`, and a screen in `app/`. Update the design system's `ui_kits/family-app` if the design changes.
- **Files:** name them kebab-case (`content-tile.tsx`). PascalCase .jsx/.tsx files would be picked up by the design-system compiler in the parent project.
- **Love languages** live in `src/lib/love-languages.ts`. Anything one spouse does for the other must fit the receiving spouse's top languages.
- **Before you finish:** run `npm run typecheck` and `npm run lint`, and `supabase functions serve` to test functions locally.
