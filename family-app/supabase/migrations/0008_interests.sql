-- "What matters to you": hobbies, people and shows per family member. The interest-plan function turns each into reminders/events.
create table interests (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade, member_slug text not null,
  title text not null, detail text, kind text default 'habit' check (kind in ('habit','people','show','season','team')),
  every_days int, weekday int, at_time time, add_to_calendar boolean default true, remind boolean default true, last_planned date, created_at timestamptz default now()
);
alter table interests enable row level security;
create policy "family access" on interests for all using (family_id in (select my_family_ids())) with check (family_id in (select my_family_ids()));
alter table reminders add column if not exists interest_id uuid references interests on delete cascade;
alter table events add column if not exists interest_id uuid references interests on delete cascade;
