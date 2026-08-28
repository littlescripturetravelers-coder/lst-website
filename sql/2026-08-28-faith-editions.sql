-- =====================================================================
--  THE MORNING LANTERN, IN FIVE EDITIONS
--
--  Levi is opening the Lantern to other Christian traditions. A family
--  says which one they belong to when they sign up, and from then on
--  they get the Lantern written in their own voice.
--
--  The five, from the Faith Pack Guide:
--      lds         Latter-day Saint      (the edition that exists today)
--      catholic    Catholic
--      evangelical Non-denominational / Evangelical
--      baptist     Baptist
--      methodist   Methodist / Wesleyan
--
--  HOW TO RUN IT
--    Supabase -> SQL Editor -> New query -> paste -> Ctrl+A -> Run
--  Safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
--  1. Which faith a family belongs to
--  Nobody is forced to answer. No answer means the Latter-day Saint
--  edition, which is the one that exists today — so every family who
--  signed up before this change keeps exactly what they had.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists faith text;

comment on column public.profiles.faith is
  'lds | catholic | evangelical | baptist | methodist. Null means the family was not asked, or preferred not to say, and is served the lds edition.';

-- ---------------------------------------------------------------------
--  2. Which faith a night was written for
-- ---------------------------------------------------------------------
alter table public.daily_content
  add column if not exists faith text not null default 'lds';

comment on column public.daily_content.faith is
  'Which edition of the Morning Lantern this row is. Every night that existed before the five editions is lds, which is what it was.';

-- ---------------------------------------------------------------------
--  3. ⚠️ ONE NIGHT PER DATE BECOMES ONE NIGHT PER DATE PER FAITH
--
--  publish_date was UNIQUE on its own. With five editions that is wrong:
--  publishing the Catholic edition for a date would refuse, or replace
--  the Latter-day Saint one. The uniqueness moves to the pair.
--
--  The app's publish screen upserts on publish_date. IT MUST BE CHANGED
--  TO UPSERT ON (publish_date, faith) — see
--  docs/FOR-THE-APP-CHAT-faith-editions.md. Until it is, the app keeps
--  publishing the lds edition and nothing breaks.
-- ---------------------------------------------------------------------
do $$
declare c record;
begin
  for c in
    select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public' and rel.relname = 'daily_content'
       and con.contype = 'u'
       and (select array_agg(att.attname::text order by att.attname)
              from unnest(con.conkey) k
              join pg_attribute att
                on att.attrelid = con.conrelid and att.attnum = k)
           = array['publish_date']
  loop
    execute format('alter table public.daily_content drop constraint %I', c.conname);
  end loop;
end $$;

create unique index if not exists daily_content_date_faith
  on public.daily_content (publish_date, faith);

-- ---------------------------------------------------------------------
--  4. Nothing about who may READ a night changes.
--  The existing policy on daily_content still decides that, and it still
--  asks lst_is_subscriber(). A family's faith chooses WHICH night they
--  are shown; it has never had anything to do with whether they may.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- DID IT WORK? Last statement, so this is what the Results panel shows.
-- ---------------------------------------------------------------------
select
  (select count(*) from public.daily_content)                        as nights,
  (select count(distinct faith) from public.daily_content)           as editions,
  (select count(*) from public.profiles where faith is not null)     as "families who have said";
