-- (applied to the database 9 Sep 2026; the app repo carries the same file as migration 0014)
-- App Store and Google Play subscriptions.
--
-- A store row is kept current by RevenueCat (store-sync and revenuecat-webhook
-- write it), and unlike a Payhip row it carries a real current_period_end. So
-- a store row is held to its date - with a day of grace, in case a renewal's
-- webhook is late - while a Payhip row still passes on its status alone.

alter table public.subscriptions
  add column if not exists source text not null default 'payhip';

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
        and (
              -- bought on a store: status and date both have to agree
              (
                s.source in ('apple', 'google', 'store')
                and lower(coalesce(s.status, '')) in ('active', 'past_due')
                and coalesce(s.current_period_end, now() + interval '1 day') > now() - interval '1 day'
              )
              -- bought on the website (Payhip keeps the status current) or given away
              or (
                s.source not in ('apple', 'google', 'store')
                and lower(coalesce(s.status, '')) in ('active', 'past_due', 'grandfathered')
              )
              -- a free week, held to its end
              or (
                lower(coalesce(s.status, '')) in ('trialing', 'trial')
                and coalesce(s.trial_end, s.current_period_end, s.updated_at + interval '7 days') > now()
              )
            )
    );
$$;

revoke all on function public.lst_is_subscriber() from public;
grant execute on function public.lst_is_subscriber() to authenticated;
