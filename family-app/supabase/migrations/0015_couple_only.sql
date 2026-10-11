-- The Marriage section is for the two parents only. Children's accounts never receive couple data.
-- Couple data: events on the Marriage calendar, reminders in the Date night list (any list colored 'marriage'),
-- and the daily couple ideas. (Couple studies, goals and think sessions were already parents-only.)
alter table events add column if not exists couple boolean generated always as (coalesce(area, '') = 'marriage') stored;
alter table reminder_lists add column if not exists couple boolean generated always as (color = 'marriage') stored;

create or replace function list_is_couple(l uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select couple from reminder_lists where id = l), false)
$$;
revoke execute on function list_is_couple(uuid) from anon, public;
grant execute on function list_is_couple(uuid) to authenticated;

alter policy "family access" on events
  using (family_id in (select my_family_ids()) and (not private or owner_id = auth.uid()) and (not couple or i_am_parent()))
  with check (family_id in (select my_family_ids()) and (not private or (owner_id = auth.uid() and can_private())) and (coalesce(area, '') <> 'marriage' or i_am_parent()));
alter policy "family access" on reminders
  using (family_id in (select my_family_ids()) and (not private or owner_id = auth.uid()) and (list_id is null or not list_is_couple(list_id) or i_am_parent()))
  with check (family_id in (select my_family_ids()) and (not private or (owner_id = auth.uid() and can_private())) and (list_id is null or not list_is_couple(list_id) or i_am_parent()));
alter policy "family access" on reminder_lists
  using (family_id in (select my_family_ids()) and (not couple or i_am_parent()))
  with check (family_id in (select my_family_ids()) and (color <> 'marriage' or i_am_parent()));
alter policy "family access" on daily_ideas
  using (family_id in (select my_family_ids()) and (kind <> 'couple' or i_am_parent()))
  with check (family_id in (select my_family_ids()) and (kind <> 'couple' or i_am_parent()));
