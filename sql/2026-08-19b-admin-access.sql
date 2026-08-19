-- =====================================================================
-- Little Scripture Travelers — admin access (and owner accounts)
-- Run date: 2026-08-19
--
-- Run this AFTER 2026-08-19-website-accounts-and-family-stories.sql.
--
-- WHAT THIS DOES
--   Admins get the whole library without a subscription. Levi owns the
--   thing — he should never have to pay himself to look at it. Same for
--   anyone else marked admin (a spouse, a helper, a reviewer account).
--
-- SAFE TO RUN TWICE.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Make sure profiles has the admin flag and is readable by its owner
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());


-- ---------------------------------------------------------------------
-- 2. Is the person calling an admin?
-- ---------------------------------------------------------------------
create or replace function public.lst_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.lst_is_admin() from public;
grant execute on function public.lst_is_admin() to authenticated;


-- ---------------------------------------------------------------------
-- 3. Admins count as subscribers everywhere the paywall is checked
-- ---------------------------------------------------------------------
create or replace function public.lst_is_subscriber()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.lst_is_admin()
    or exists (
      select 1
      from public.subscriptions s
      where (
              s.user_id = auth.uid()
              or lower(s.email) = lower((select u.email from auth.users u where u.id = auth.uid()))
            )
        and lower(coalesce(s.status, '')) in ('trialing', 'trial', 'active', 'past_due')
    );
$$;

revoke all on function public.lst_is_subscriber() from public;
grant execute on function public.lst_is_subscriber() to authenticated;


-- ---------------------------------------------------------------------
-- 4. MAKE LEVI AN ADMIN
--
--    Replace the email below with the email you sign in with, then run.
--    Use your OWNER account — NOT the applereview account.
--
--    The account has to exist first: sign up (or sign in) on the website
--    or the app once, then run this.
-- ---------------------------------------------------------------------
update public.profiles
   set is_admin = true
 where id = (
   select id from auth.users
    where lower(email) = lower('littlescripturetravelers@gmail.com')
 );

-- Check it worked — this should print one row with is_admin = true:
select u.email, p.is_admin
  from public.profiles p
  join auth.users u on u.id = p.id
 where p.is_admin = true;
