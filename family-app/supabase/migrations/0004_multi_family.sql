-- Public release: any family can sign up, set up their own members, and invite a spouse. Everything stays isolated by RLS (see 0001).
alter table families add column if not exists display_name text;            -- e.g. "The Lewis's" (shown as the app title)
alter table families add column if not exists faith text not null default 'lds' check (faith in ('lds','christian','none'));
alter table families add column if not exists created_by uuid references auth.users;

create table family_invites (
  code text primary key default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  family_id uuid not null references families on delete cascade, member_slug text, created_by uuid references auth.users,
  expires_at timestamptz default now() + interval '14 days', used_by uuid references auth.users
);
alter table family_invites enable row level security;
create policy "family access" on family_invites for all using (family_id in (select my_family_ids())) with check (family_id in (select my_family_ids()));

-- Creates a family + its members + default reminder lists for the signed-in user in one call (used by onboarding).
-- p = { surname, display_name, anniversary, faith, timezone, me_slug, members:[{slug,name,full_name,role,sex,birthday,color}] }
create or replace function create_family(p jsonb) returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid; m jsonb;
begin
  if exists (select 1 from family_members where user_id = auth.uid()) then raise exception 'already in a family'; end if;
  insert into families (surname, display_name, anniversary, faith, timezone, created_by)
  values (p->>'surname', coalesce(p->>'display_name', 'The ' || (p->>'surname') || '''s'), nullif(p->>'anniversary','')::date, coalesce(p->>'faith','lds'), coalesce(p->>'timezone','America/Denver'), auth.uid())
  returning id into fid;
  for m in select * from jsonb_array_elements(p->'members') loop
    insert into family_members (family_id, user_id, slug, name, full_name, role, sex, birthday, color)
    values (fid, case when m->>'slug' = p->>'me_slug' then auth.uid() end, m->>'slug', m->>'name', coalesce(m->>'full_name', m->>'name'), m->>'role', m->>'sex', (m->>'birthday')::date, m->>'color');
  end loop;
  insert into reminder_lists (family_id, name, color, icon, sort) values
    (fid,'Family','brand','house',0),(fid,'Groceries','money','shopping-cart',1),(fid,'Date night','marriage','heart',2),(fid,'Our kids','girls','flower-2',3),(fid,'Home projects','home','hammer',4),(fid,'Health','health','stethoscope',5);
  return fid;
end $$;
-- Spouse joins with a 6-character code; they're attached to their member row.
create or replace function accept_invite(code text) returns uuid language plpgsql security definer set search_path = public as $$
declare inv family_invites;
begin
  select * into inv from family_invites i where i.code = upper(accept_invite.code) and used_by is null and expires_at > now();
  if inv is null then raise exception 'invalid or expired code'; end if;
  update family_members set user_id = auth.uid() where family_id = inv.family_id and slug = inv.member_slug and user_id is null;
  update family_invites set used_by = auth.uid() where family_invites.code = inv.code;
  return inv.family_id;
end $$;
grant execute on function create_family(jsonb), accept_invite(text) to authenticated;
-- delete_my_account() lives in 0010 (its own step, because it deletes rows).
