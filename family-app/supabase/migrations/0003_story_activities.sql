-- Daily hands-on activity for the girls built from the Morning Lantern story, tailored to each child's current stage.
create table story_activities (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  for_date date not null, slug text, story_title text, scripture text, activity jsonb not null, done_by jsonb default '{}',
  created_at timestamptz default now(), unique (family_id, for_date)
);
alter table story_activities enable row level security;
create policy "family access" on story_activities for all using (family_id in (select my_family_ids())) with check (family_id in (select my_family_ids()));
alter publication supabase_realtime add table story_activities;
