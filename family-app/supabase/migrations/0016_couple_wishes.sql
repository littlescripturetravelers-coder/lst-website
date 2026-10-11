-- "Our list": ideas for date nights, trips, home projects and intimacy that each parent answers privately.
-- Each person's yes / maybe / no is visible only to them. An idea shows on the shared list only when BOTH parents said yes,
-- so nobody ever sees a "no" or feels put on the spot. Kids' accounts can't see any of it.
create table couple_wishes (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  kind text not null check (kind in ('date', 'trip', 'project', 'intimacy')),
  title text not null check (length(title) between 1 and 140), detail text check (length(detail) <= 500),
  added_by uuid not null default auth.uid() references auth.users on delete cascade, created_at timestamptz default now()
);
create index on couple_wishes (family_id, kind);
alter table couple_wishes enable row level security;
create policy "parents read ideas" on couple_wishes for select using (family_id in (select my_family_ids()) and i_am_parent());
create policy "parents add ideas" on couple_wishes for insert with check (family_id in (select my_family_ids()) and i_am_parent() and added_by = auth.uid());
create policy "adder removes idea" on couple_wishes for delete using (added_by = auth.uid());

create table wish_votes (
  family_id uuid not null references families on delete cascade, item_key text not null check (length(item_key) <= 80),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  vote text not null check (vote in ('yes', 'maybe', 'no')), updated_at timestamptz default now(),
  primary key (family_id, item_key, user_id)
);
alter table wish_votes enable row level security;
create policy "own answers only" on wish_votes for all
  using (user_id = auth.uid() and family_id in (select my_family_ids()) and i_am_parent())
  with check (user_id = auth.uid() and family_id in (select my_family_ids()) and i_am_parent());

-- The only way to learn anything about the other person's answers: ideas where both said yes.
create or replace function wish_matches(p_family uuid) returns table (item_key text) language sql stable security definer set search_path = public as $$
  select v.item_key from wish_votes v
  where v.family_id = p_family and p_family in (select my_family_ids()) and i_am_parent() and v.vote = 'yes'
  group by v.item_key having count(distinct v.user_id) >= 2
$$;
revoke execute on function wish_matches(uuid) from anon, public;
grant execute on function wish_matches(uuid) to authenticated;

-- Removing your own idea also clears everyone's answers to it.
create or replace function clear_wish_votes() returns trigger language plpgsql security definer set search_path = public as $$
begin delete from wish_votes where family_id = old.family_id and item_key = 'c:' || old.id; return old; end $$;
revoke execute on function clear_wish_votes() from public, anon, authenticated;
create trigger clear_wish_votes after delete on couple_wishes for each row execute function clear_wish_votes();
