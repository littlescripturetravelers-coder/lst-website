-- Each child's growth page. One row per child per item:
--   kind 'skill'    status 'done' | 'cleared'  (checklist "What she's working on")
--   kind 'activity' status 'saved' | 'done' | 'cleared'  (things to do together; saved ones form "Our list")
--   kind 'one'      status 'pick', note = the one-on-one activity key chosen for that parent this week (key 'one:<parent slug>')
-- Keys come from src/lib/kid-skills-data.ts and kid-activities-data.ts and never change. The whole family reads; parents change.
create table kid_progress (
  family_id uuid not null references families on delete cascade,
  member text not null,                 -- the child's family_members.slug
  key text not null,
  kind text not null check (kind in ('skill', 'activity', 'one')),
  status text not null check (status in ('done', 'saved', 'cleared', 'pick')),
  note text check (length(note) <= 200),
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (family_id, member, key)
);
alter table kid_progress enable row level security;
create policy "family reads kid progress" on kid_progress for select using (family_id in (select my_family_ids()));
create policy "parents add kid progress" on kid_progress for insert with check (family_id in (select my_family_ids()) and i_am_parent());
create policy "parents change kid progress" on kid_progress for update using (family_id in (select my_family_ids()) and i_am_parent()) with check (family_id in (select my_family_ids()) and i_am_parent());
