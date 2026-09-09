-- A trial ends when it ends.                                  (applied 9 Sep 2026)
--
-- lst_is_subscriber() is the one question every gate asks - the nightly
-- content, the story library, the family stories, the app. It used to answer
-- yes for any row whose status was 'trialing', and nothing ever changed that
-- status, so every free week became a free forever: on 9 September 2026, 25 of
-- the 31 trial rows were past their trial_end and all 25 still read.
--
-- Paid rows are different. Payhip's webhook keeps their status current
-- (active / past_due / canceled) but never touches the dates, so for them the
-- status is the truth and the dates are stale. A paid status therefore still
-- passes on its own; only a trial is held to its date.

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
              lower(coalesce(s.status, '')) in ('active', 'past_due', 'grandfathered')
              or (
                   lower(coalesce(s.status, '')) in ('trialing', 'trial')
                   and coalesce(s.trial_end, s.current_period_end, s.updated_at + interval '7 days') > now()
                 )
            )
    );
$$;

revoke all on function public.lst_is_subscriber() from public;
grant execute on function public.lst_is_subscriber() to authenticated;

-- Where a subscription was bought. Payhip on the website is the only source
-- today; the app stores are next, and a row needs to say which so a renewal
-- or a cancellation from one store cannot overwrite a purchase from another.
alter table public.subscriptions
  add column if not exists source text not null default 'payhip';

comment on column public.subscriptions.source is
  'payhip (website), apple, google, or comp (given away). The account, not the source, is what unlocks content.';
