-- =====================================================================
-- Little Scripture Travelers — website accounts, family stories, story texts
-- Run date: 2026-08-19
--
-- WHAT THIS DOES
--   1. Lets a signed-in person read their OWN subscription row, so the
--      website can tell whether to unlock the library.
--   2. Adds the columns the website's Family Stories section needs to the
--      existing `family_stories` table, without disturbing the app's use
--      of it, and locks every row to its owner.
--   3. Creates `story_texts` — where the full text of each Virtue Library
--      story lives — and gates it so only subscribers (or anyone, for the
--      free stories) can read it. This is the real paywall: it is enforced
--      by the database, not by the web page, so it cannot be bypassed.
--
-- SAFE TO RUN TWICE. Every statement checks first, so running it again
-- changes nothing. It only ever ADDS things — no column or row is dropped.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. SUBSCRIPTIONS — let a person see their own row
-- ---------------------------------------------------------------------

-- Make sure both link columns exist. The Payhip webhook matches by email;
-- user_id is here so rows can be linked to an app login as well.
alter table public.subscriptions add column if not exists user_id uuid references auth.users(id);
alter table public.subscriptions add column if not exists email   text;

alter table public.subscriptions enable row level security;

drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription"
  on public.subscriptions for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(email) = lower((select u.email from auth.users u where u.id = auth.uid()))
  );


-- Helper: is the person calling right now a paid-up (or trialing) subscriber?
-- SECURITY DEFINER so it can check the table regardless of the caller's own
-- read permissions; it answers only true/false about the caller themselves.
create or replace function public.lst_is_subscriber()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where (
            s.user_id = auth.uid()
            or lower(s.email) = lower((select u.email from auth.users u where u.id = auth.uid()))
          )
      and lower(coalesce(s.status, '')) in ('trialing', 'trial', 'active', 'past_due')
  );
$$;

revoke all on function public.lst_is_subscriber() from public;
grant execute on function public.lst_is_subscriber() to authenticated;


-- ---------------------------------------------------------------------
-- 2. FAMILY STORIES — the family's own half of the library
-- ---------------------------------------------------------------------

-- Create it only if it isn't there already (the app may have made it).
create table if not exists public.family_stories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Columns the website adds. `kind` separates the app's one-per-day journal
-- entries ('journal') from family-history entries ('history'), which can be
-- many per year. History rows leave the app's entry_date NULL on purpose, so
-- they can never collide with a journal entry.
alter table public.family_stories add column if not exists kind       text not null default 'journal';
alter table public.family_stories add column if not exists title      text;
alter table public.family_stories add column if not exists person     text;
alter table public.family_stories add column if not exists year       integer;
alter table public.family_stories add column if not exists body       text;
alter table public.family_stories add column if not exists virtues    text[];
alter table public.family_stories add column if not exists story_id   text;
alter table public.family_stories add column if not exists source     text default 'website';
alter table public.family_stories add column if not exists updated_at timestamptz default now();

create index if not exists family_stories_user_kind_idx on public.family_stories (user_id, kind);
create index if not exists family_stories_year_idx      on public.family_stories (user_id, year);

alter table public.family_stories enable row level security;

-- A family sees and edits only their own stories. Nobody else, ever.
drop policy if exists "own family stories: read"   on public.family_stories;
drop policy if exists "own family stories: insert" on public.family_stories;
drop policy if exists "own family stories: update" on public.family_stories;
drop policy if exists "own family stories: delete" on public.family_stories;

create policy "own family stories: read"
  on public.family_stories for select to authenticated
  using (user_id = auth.uid());

create policy "own family stories: insert"
  on public.family_stories for insert to authenticated
  with check (user_id = auth.uid());

create policy "own family stories: update"
  on public.family_stories for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own family stories: delete"
  on public.family_stories for delete to authenticated
  using (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- 3. STORY TEXTS — the Virtue Library paywall
-- ---------------------------------------------------------------------

create table if not exists public.story_texts (
  id            text primary key,          -- matches the library id, e.g. 'b6-w1-n1'
  story         jsonb,                     -- array of paragraphs
  fork          text,                      -- the Feeling Moment
  remember_this text,
  prompt        text,                      -- the parent prompt
  is_free       boolean not null default false,
  updated_at    timestamptz not null default now()
);

alter table public.story_texts enable row level security;

-- Free stories are readable by anyone signed in; everything else needs a
-- live subscription. Postgres enforces this, so editing the website's
-- JavaScript gets a reader precisely nothing.
drop policy if exists "read story text" on public.story_texts;
create policy "read story text"
  on public.story_texts for select
  to authenticated
  using (is_free or public.lst_is_subscriber());

-- Mark the three free stories (ids come from data/virtue-library.js meta).
-- Harmless if the rows aren't loaded yet — it simply updates nothing.
update public.story_texts
   set is_free = true
 where id in ('b6-w3-n1', 'b7-w1-n7', 'b6-w3-n4');
