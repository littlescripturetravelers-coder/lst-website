-- App Store requires in-app account deletion. Its own step because it deletes rows.
create or replace function delete_my_account() returns void language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  select family_id into fid from family_members where user_id = auth.uid();
  update family_members set user_id = null where user_id = auth.uid();
  if fid is not null and not exists (select 1 from family_members where family_id = fid and user_id is not null) then delete from families where id = fid; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function delete_my_account() from anon, public;
grant execute on function delete_my_account() to authenticated;
