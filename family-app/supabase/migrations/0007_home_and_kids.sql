-- Home upkeep, vehicles, kids' chores, location, and kid profiles with limited access.
alter table families add column if not exists state text;          -- two-letter state → climate profile for seasonal tasks
alter table families add column if not exists city text;
alter table family_members add column if not exists can_login boolean not null default false;
alter table family_members add column if not exists kid_sections text[] not null default '{chores,story,feelings}';

create table home_assignments (family_id uuid not null references families on delete cascade, task_id text not null, member_slug text, primary key (family_id, task_id));
create table home_task_log (id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade, task_id text not null, done_on date not null, done_by text, created_at timestamptz default now());
create index on home_task_log (family_id, task_id, done_on desc);
create table kid_chores (id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade, member_slug text not null, title text not null, sort int default 0);
create table vehicles (id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade, name text not null, miles int default 0, reg_due date, created_at timestamptz default now());
create table vehicle_log (id uuid primary key default gen_random_uuid(), vehicle_id uuid not null references vehicles on delete cascade, family_id uuid not null references families on delete cascade, task_id text not null, done_on date not null, miles int);
do $$ declare t text; begin foreach t in array array['home_assignments','home_task_log','kid_chores','vehicles','vehicle_log'] loop
  execute format('alter table %I enable row level security', t);
  execute format('create policy "family access" on %I for all using (family_id in (select my_family_ids())) with check (family_id in (select my_family_ids()))', t);
end loop; end $$;

-- Kids on their own devices: parents-only tables are hidden from child accounts.
create or replace function i_am_parent() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where user_id = auth.uid() and role in ('dad','mom'))
$$;
do $$ declare t text; begin foreach t in array array['accounts','transactions','budgets','advisor_messages','money_plans','health_log','checkins','couple_studies','think_sessions','goals'] loop
  execute format('drop policy if exists "family access" on %I', t);
  execute format('create policy "parents only" on %I for all using (family_id in (select my_family_ids()) and i_am_parent()) with check (family_id in (select my_family_ids()) and i_am_parent())', t);
end loop; end $$;
alter publication supabase_realtime add table home_task_log, kid_chores;
