-- Lewis Family app schema. Every row belongs to a family; RLS limits access to that family's members.
create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table families (
  id uuid primary key default gen_random_uuid(),
  surname text not null,
  anniversary date,
  timezone text not null default 'America/Denver',
  created_at timestamptz default now()
);
create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families on delete cascade,
  user_id uuid references auth.users on delete set null,          -- set for the parents who sign in
  slug text not null, name text not null, full_name text not null,
  role text not null check (role in ('dad','mom','daughter','son')),
  sex text check (sex in ('m','f')),
  birthday date not null,
  color text,
  unique (family_id, slug)
);
create or replace function my_family_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select family_id from family_members where user_id = auth.uid()
$$;

-- Theme & notification prefs per signed-in parent
create table member_prefs (
  user_id uuid primary key references auth.users on delete cascade,
  theme jsonb, notify jsonb default '{"remAlerts":true,"calAlerts":true,"morning":"07:00","checkin":"20:30"}',
  expo_push_token text
);

-- Calendar + Reminders
create table events (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  title text not null, starts_at timestamptz not null, ends_at timestamptz, all_day boolean default false,
  area text, who text[], alert text, repeat text, notes text, apple_id text, created_by uuid references auth.users,
  created_at timestamptz default now()
);
create table reminder_lists (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  name text not null, color text not null, icon text not null, sort int default 0
);
create table reminders (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  list_id uuid references reminder_lists on delete set null,
  title text not null, notes text, due_date date, due_time time, on_calendar boolean default false,
  alert text default 'none', repeat text, flagged boolean default false, priority text,
  done boolean default false, completed_at timestamptz, apple_id text, source text default 'app',  -- app | siri | alexa | think | health | idea
  created_by uuid references auth.users, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index on reminders (family_id, due_date);

-- Daily ideas (generated nightly) + what the family did with them
create table daily_ideas (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  for_date date not null, kind text not null check (kind in ('couple','girls')), round int default 0,
  title text not null, meta text, why text, icon text, min_age int, steps text[], attachments jsonb, source text default 'ai',
  created_at timestamptz default now()
);
create index on daily_ideas (family_id, for_date);
create table idea_actions (idea_id uuid references daily_ideas on delete cascade, user_id uuid references auth.users, action text check (action in ('saved','planned','dismissed')), at timestamptz default now(), primary key (idea_id, user_id, action));

-- Marriage
create table checkins (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  for_date date not null, question text not null, answers jsonb default '{}', unique (family_id, for_date)
);
create table lantern_nights (           -- mirror of the Morning Lantern feed
  publish_date date primary key, slug text not null, title text, scripture text, book_page text, edition_url text, raw jsonb
);
create table couple_studies (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  for_date date not null, scripture text, study jsonb not null, answers jsonb default '{}', done_at timestamptz, unique (family_id, for_date)
);
create table think_sessions (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  who text, what text, facts text[], feelings text[], whys text[], sides jsonb, ideas text[], weigh jsonb, chosen int, step int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table goals (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  area text, title text not null, steps jsonb default '[]', quadrant int, due date, created_at timestamptz default now()
);

-- Health
create table health_log (
  family_id uuid not null references families on delete cascade, member_slug text not null, rule_id text not null,
  done_on date not null, notes text, primary key (family_id, member_slug, rule_id, done_on)
);

-- Money (Plaid). Access tokens live in Vault; only the service role reads them.
create table plaid_items (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  item_id text unique not null, institution text, vault_secret_id uuid not null, cursor text, status text default 'good', updated_at timestamptz default now()
);
create table accounts (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  plaid_item uuid references plaid_items on delete cascade, plaid_account_id text unique,
  institution text, name text, mask text, type text, subtype text,   -- depository | credit | loan | investment
  balance numeric, available numeric, credit_limit numeric, apr numeric, min_payment numeric, next_due date, updated_at timestamptz default now()
);
create table transactions (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  account_id uuid references accounts on delete cascade, plaid_txn_id text unique, date date, name text, merchant text,
  amount numeric, category text, pending boolean default false, who text
);
create index on transactions (family_id, date desc);
create table budgets (family_id uuid references families on delete cascade, month date, category text, limit_amount numeric, primary key (family_id, month, category));
create table advisor_messages (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  user_id uuid references auth.users, role text check (role in ('user','assistant')), content text, created_at timestamptz default now()
);
create table money_plans (id uuid primary key default gen_random_uuid(), family_id uuid references families on delete cascade, kind text, plan jsonb, created_at timestamptz default now());

-- Voice assistants: Alexa account links map an Amazon user to a family member.
create table voice_links (provider text, external_user text, user_id uuid references auth.users on delete cascade, primary key (provider, external_user));

-- RLS: every family table is readable/writable by that family's signed-in members.
do $$ declare t text; begin
  foreach t in array array['events','reminder_lists','reminders','daily_ideas','checkins','couple_studies','think_sessions','goals','health_log','accounts','transactions','budgets','advisor_messages','money_plans','family_members'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "family access" on %I for all using (family_id in (select my_family_ids())) with check (family_id in (select my_family_ids()))', t);
  end loop;
end $$;
alter table families enable row level security;
create policy "family access" on families for all using (id in (select my_family_ids()));
alter table plaid_items enable row level security;  -- no client policy: service role only
alter table member_prefs enable row level security;
create policy "own prefs" on member_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table lantern_nights enable row level security;
create policy "read lantern" on lantern_nights for select using (auth.role() = 'authenticated');
alter publication supabase_realtime add table reminders, events, checkins, couple_studies, daily_ideas;
