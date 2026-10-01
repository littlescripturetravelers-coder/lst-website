-- Lock down tables the 0001 loop missed. idea_actions: each person sees and writes only their own rows.
alter table idea_actions enable row level security;
create policy "own actions" on idea_actions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- voice_links: only the Alexa/Siri server functions (service role) read it.
alter table voice_links enable row level security;
-- Signed-out visitors can't call the family helpers or the account functions.
revoke execute on function my_family_ids() from anon, public;
revoke execute on function i_am_parent() from anon, public;
revoke execute on function create_family(jsonb), accept_invite(text) from anon, public;
grant execute on function my_family_ids(), i_am_parent(), create_family(jsonb), accept_invite(text) to authenticated;
