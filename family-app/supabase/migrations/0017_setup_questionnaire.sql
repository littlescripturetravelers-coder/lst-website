-- The setup questionnaire and later check-ins. The app and the AI adapt to these answers.
-- family_setup: shared family answers (which sections to show, top priorities, season of life). Everyone in the family reads; parents change.
-- member_profiles: each person's PRIVATE answers (what they want more of with their spouse, date budget, personal priorities). Only that person.
-- family_members.about: each child's interests and what the family is working on with them (filled in by parents).
create table family_setup (
  family_id uuid primary key references families on delete cascade,
  sections text[] not null default '{faith,marriage,money,health,home,kids,work}',
  priorities text[] not null default '{}', season text[] not null default '{}',
  updated_at timestamptz not null default now(), updated_by uuid default auth.uid() references auth.users on delete set null
);
alter table family_setup enable row level security;
create policy "family reads setup" on family_setup for select using (family_id in (select my_family_ids()));
create policy "parents add setup" on family_setup for insert with check (family_id in (select my_family_ids()) and i_am_parent());
create policy "parents change setup" on family_setup for update using (family_id in (select my_family_ids()) and i_am_parent()) with check (family_id in (select my_family_ids()) and i_am_parent());

create table member_profiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  family_id uuid not null references families on delete cascade,
  answers jsonb not null default '{}', updated_at timestamptz not null default now()
);
alter table member_profiles enable row level security;
create policy "own profile only" on member_profiles for all using (user_id = auth.uid() and family_id in (select my_family_ids())) with check (user_id = auth.uid() and family_id in (select my_family_ids()));

alter table family_members add column if not exists about jsonb not null default '{}';
