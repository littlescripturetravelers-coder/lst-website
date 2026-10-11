-- Private ("just for me") items, parent-controlled privacy for kids, and shared busy time from work calendars.
-- Family items stay visible to the whole family exactly as before; a private item is visible only to the person who made it.

-- Who may keep private items: every parent, and a child only after a parent turns it on.
alter table family_members add column if not exists private_ok boolean not null default false;
create or replace function can_private() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where user_id = auth.uid() and (role in ('dad','mom') or private_ok))
$$;
revoke execute on function can_private() from anon, public;
grant execute on function can_private() to authenticated;

-- Only parents may change a member's sign-in, sections or privacy switches.
create or replace function guard_member_switches() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not i_am_parent() and (new.private_ok is distinct from old.private_ok or new.can_login is distinct from old.can_login or new.kid_sections is distinct from old.kid_sections or new.role is distinct from old.role) then
    raise exception 'only a parent can change this';
  end if;
  return new;
end $$;
create trigger guard_member_switches before update on family_members for each row execute function guard_member_switches();

-- Owner + private flag on the things a person might keep to themselves.
do $$ declare t text; begin foreach t in array array['events','reminders','goals','think_sessions'] loop
  execute format('alter table %I add column if not exists owner_id uuid references auth.users on delete cascade default auth.uid()', t);
  execute format('alter table %I add column if not exists private boolean not null default false', t);
end loop; end $$;

-- Events and reminders: family rows as before; private rows only for their owner.
do $$ declare t text; begin foreach t in array array['events','reminders'] loop
  execute format('alter policy "family access" on %I using (family_id in (select my_family_ids()) and (not private or owner_id = auth.uid())) with check (family_id in (select my_family_ids()) and (not private or (owner_id = auth.uid() and can_private())))', t);
end loop; end $$;
-- Goals and think-it-through: family rows stay parents-only (as before); private rows only for their owner.
do $$ declare t text; begin foreach t in array array['goals','think_sessions'] loop
  execute format('alter policy "family access" on %I using (family_id in (select my_family_ids()) and ((not private and i_am_parent()) or (private and owner_id = auth.uid()))) with check (family_id in (select my_family_ids()) and ((not private and i_am_parent()) or (private and owner_id = auth.uid() and can_private())))', t);
end loop; end $$;

-- Busy time a person chooses to share from their work or personal calendars. The details never leave their phone unless they pick "Family sees details".
create table busy_blocks (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  owner_id uuid not null references auth.users on delete cascade default auth.uid(),
  starts_at timestamptz not null, ends_at timestamptz not null, all_day boolean not null default false, label text, created_at timestamptz default now()
);
create index on busy_blocks (family_id, starts_at);
alter table busy_blocks enable row level security;
create policy "family reads busy time" on busy_blocks for select using (family_id in (select my_family_ids()));
create policy "owner adds busy time" on busy_blocks for insert with check (family_id in (select my_family_ids()) and owner_id = auth.uid());
create policy "owner removes busy time" on busy_blocks for delete using (owner_id = auth.uid());
alter publication supabase_realtime add table busy_blocks;
