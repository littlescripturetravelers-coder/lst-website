-- "First things first" on the Today tab (Covey's 7 Habits and time-management matrix).
-- Each parent gets a few "big rocks" a day: important-but-not-urgent things (Quadrant II) drawn from the family's priorities
-- in their ranked order, suggested by AI (function `compass`) or added by the person. Rows are the owner's alone;
-- the week's tally for both parents comes only as counts (compass_week), never titles.
create table compass_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  for_date date not null,
  rank int not null default 0,
  title text not null check (length(title) between 1 and 140),
  why text check (length(why) <= 300),
  priority text check (length(priority) <= 40),     -- a key from PRIORITIES or MY_PRIORITIES (src/lib/setup.ts)
  role text check (length(role) <= 40),             -- Covey's roles: Spouse, Parent, Self, Faith, Home, Work...
  dimension text check (dimension in ('body', 'mind', 'heart', 'spirit')),  -- Habit 7, sharpen the saw
  steps jsonb not null default '[]',
  minutes int check (minutes between 0 and 1440),
  source text not null default 'mine' check (source in ('ai', 'mine')),
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index on compass_items (owner_id, for_date);
create index on compass_items (family_id, done_at);
alter table compass_items enable row level security;
create policy "own big rocks" on compass_items for all
  using (owner_id = auth.uid() and family_id in (select my_family_ids()) and i_am_parent())
  with check (owner_id = auth.uid() and family_id in (select my_family_ids()) and i_am_parent());

-- The day's one-line focus ("begin with the end in mind") and a look back at what got done, per person.
create table compass_days (
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  for_date date not null,
  family_id uuid not null references families on delete cascade,
  focus text check (length(focus) <= 300),
  look_back text check (length(look_back) <= 400),
  created_at timestamptz not null default now(),
  primary key (owner_id, for_date)
);
alter table compass_days enable row level security;
create policy "own compass day" on compass_days for all
  using (owner_id = auth.uid() and family_id in (select my_family_ids()) and i_am_parent())
  with check (owner_id = auth.uid() and family_id in (select my_family_ids()) and i_am_parent());

-- What the family got done since p_from: both parents' big rocks (counts only, by dimension), finished family reminders
-- (private ones only the caller's own) and the kids' checked skills and activities. Parents only.
create or replace function compass_week(p_family uuid, p_from date)
returns table (rocks int, body int, mind int, heart int, spirit int, mine int, reminders int, kids int)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from compass_items c where c.family_id = p_family and c.done and c.for_date >= p_from),
    (select count(*)::int from compass_items c where c.family_id = p_family and c.done and c.for_date >= p_from and c.dimension = 'body'),
    (select count(*)::int from compass_items c where c.family_id = p_family and c.done and c.for_date >= p_from and c.dimension = 'mind'),
    (select count(*)::int from compass_items c where c.family_id = p_family and c.done and c.for_date >= p_from and c.dimension = 'heart'),
    (select count(*)::int from compass_items c where c.family_id = p_family and c.done and c.for_date >= p_from and c.dimension = 'spirit'),
    (select count(*)::int from compass_items c where c.family_id = p_family and c.done and c.for_date >= p_from and c.owner_id = auth.uid()),
    (select count(*)::int from reminders r where r.family_id = p_family and r.done and r.completed_at >= p_from
       and (not coalesce(r.private, false) or r.owner_id = auth.uid())),
    (select count(*)::int from kid_progress k where k.family_id = p_family and k.status = 'done' and k.updated_at >= p_from)
  where p_family in (select my_family_ids()) and i_am_parent();
$$;
revoke execute on function compass_week(uuid, date) from public, anon;
grant execute on function compass_week(uuid, date) to authenticated;
