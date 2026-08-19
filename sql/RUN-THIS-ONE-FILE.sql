-- =====================================================================
-- LITTLE SCRIPTURE TRAVELERS — RUN THIS WHOLE FILE, ALL AT ONCE
-- =====================================================================
--
-- Copy EVERYTHING in this file, paste it into the Supabase SQL Editor,
-- and press Run. Not the file name — the contents.
--
-- This is the three earlier migrations combined into one, so it only has
-- to be done once. It only ADDS things; nothing is deleted or emptied.
-- Safe to run twice.
--
-- BEFORE YOU RUN IT: find the line near the bottom that says
--     lower('littlescripturetravelers@gmail.com')
-- and make sure that is the email you sign in with. That line is what
-- makes you an admin so you never have to pay for your own library.
--
-- WHEN IT FINISHES it prints one row showing your email and is_admin =
-- true. If it prints no rows, your account does not exist yet — sign up
-- on the website once, then run this file again.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PART 1 — accounts, family stories, and the story paywall
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- PART 2 — admin access (this is the part that makes you an admin)
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());


-- ---------------------------------------------------------------------
-- 2. Is the person calling an admin?
-- ---------------------------------------------------------------------
create or replace function public.lst_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.lst_is_admin() from public;
grant execute on function public.lst_is_admin() to authenticated;


-- ---------------------------------------------------------------------
-- 3. Admins count as subscribers everywhere the paywall is checked
-- ---------------------------------------------------------------------
create or replace function public.lst_is_subscriber()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.lst_is_admin()
    or exists (
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
-- 4. MAKE LEVI AN ADMIN
--
--    Replace the email below with the email you sign in with, then run.
--    Use your OWNER account — NOT the applereview account.
--
--    The account has to exist first: sign up (or sign in) on the website
--    or the app once, then run this.
-- ---------------------------------------------------------------------
update public.profiles
   set is_admin = true
 where id = (
   select id from auth.users
    where lower(email) = lower('littlescripturetravelers@gmail.com')
 );


-- ---------------------------------------------------------------------
-- PART 3 — tagging family stories the same way scripture stories are
-- ---------------------------------------------------------------------
alter table public.family_stories add column if not exists situations text[];
alter table public.family_stories add column if not exists feelings   text[];
alter table public.family_stories add column if not exists traveler   text;
alter table public.family_stories add column if not exists scripture  text;

-- Makes "show me every family story tagged courage" fast once a family has
-- a few hundred of them.
create index if not exists family_stories_virtues_idx    on public.family_stories using gin (virtues);
create index if not exists family_stories_situations_idx on public.family_stories using gin (situations);
create index if not exists family_stories_feelings_idx   on public.family_stories using gin (feelings);


-- ---------------------------------------------------------------------
-- DID IT WORK?
--
-- This is the last thing that runs, so its answer is what shows in the
-- Results panel below. You want ONE row, with your email and true.
--
-- No rows? Your account doesn't exist yet — sign up on the website once,
-- then run this file again.
-- ---------------------------------------------------------------------
select u.email as "your email", p.is_admin as "admin?"
  from public.profiles p
  join auth.users u on u.id = p.id
 where p.is_admin = true;
