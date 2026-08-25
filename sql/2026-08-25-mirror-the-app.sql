-- =====================================================================
-- LITTLE SCRIPTURE TRAVELERS — make the website mirror the app
-- Run date: 2026-08-25
--
-- Copy EVERYTHING in this file, paste it into the Supabase SQL Editor,
-- press Ctrl+A then Run. Not the file name — the contents.
--
-- It only ADDS things. Nothing is deleted or emptied. Safe to run twice.
--
-- WHAT IT DOES
--   1. Lets the website read and write your journal (same journal as the app).
--   2. Adds the few extra columns the website's family stories use, alongside
--      the app's — neither side loses anything.
--   3. Checks whether a leftover journal photo bucket exists. Photos are
--      not a feature for now.
--   4. Lets YOU (the admin) read the nightly story and the archive without
--      paying. Right now the rule only lets people through who have a paid
--      row, so your own account sees an empty shelf.
--
-- WHEN IT FINISHES it prints four rows, all saying yes.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PART 1 — the journal
-- The app already made this table. These lines only fill in anything an
-- older copy is missing, so the website can read and write the same rows.
-- ---------------------------------------------------------------------
create table if not exists public.journal_entries (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_date  date not null,
  body        text not null default '',
  source      text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.journal_entries add column if not exists place   text;
alter table public.journal_entries add column if not exists lat     double precision;
alter table public.journal_entries add column if not exists lon     double precision;
alter table public.journal_entries add column if not exists photos  jsonb not null default '[]'::jsonb;

alter table public.journal_entries enable row level security;

drop policy if exists "own journal" on public.journal_entries;
create policy "own journal" on public.journal_entries
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists journal_entries_user_date
  on public.journal_entries (user_id, entry_date);


-- ---------------------------------------------------------------------
-- PART 2 — family stories
-- The app writes story_title, answers and virtues. The website adds a few
-- of its own for stories you write yourself (an ancestor's name, a year,
-- free-written text). Both sets live side by side.
-- ---------------------------------------------------------------------
alter table public.family_stories add column if not exists kind        text default 'journal';
alter table public.family_stories add column if not exists body        text;
alter table public.family_stories add column if not exists person      text;
alter table public.family_stories add column if not exists year        integer;
alter table public.family_stories add column if not exists story_id    text;
alter table public.family_stories add column if not exists situations  text[];
alter table public.family_stories add column if not exists feelings    text[];
alter table public.family_stories add column if not exists travelers   text[];
alter table public.family_stories add column if not exists custom      text[];

create index if not exists family_stories_user_kind
  on public.family_stories (user_id, kind);


-- ---------------------------------------------------------------------
-- PART 3 — the photo bucket
-- Photos are not a feature for now.
--
-- This part used to try to delete the bucket here. Supabase refuses that
-- on purpose: it will not let SQL delete from the storage tables, because
-- that would leave the actual files orphaned behind the database. Files
-- have to go through the Storage screen instead. So this part now only
-- LOOKS, and the last section tells you what it found.
--
-- The `photos` COLUMN on journal_entries is deliberately left alone: app
-- versions already on phones write it on every save, and removing it would
-- break their journals.
--
-- Dropping the old access rules IS allowed, and is wrapped so that it can
-- never stop the rest of this file from finishing.
-- ---------------------------------------------------------------------
do $$
begin
  begin
    execute 'drop policy if exists "own journal photos read"   on storage.objects';
    execute 'drop policy if exists "own journal photos write"  on storage.objects';
    execute 'drop policy if exists "own journal photos update" on storage.objects';
    execute 'drop policy if exists "own journal photos delete" on storage.objects';
  exception when others then
    null;   -- not there, or not ours to drop. Either way, carry on.
  end;
end $$;


-- ---------------------------------------------------------------------
-- PART 4 — the nightly story and the archive
-- The app made this rule back at the beginning, and it asks a narrow
-- question: "does this person have a paid row?" You are the owner and you
-- have no paid row, so it says no to you, and Tonight's Story and the
-- archive come back empty on your own account.
--
-- lst_is_subscriber() asks the wider question the rest of the site already
-- asks: paid, trialing, matched by email, or the admin. Swapping it in only
-- ever lets MORE of the right people through — no paying family loses
-- anything, and the app keeps working exactly as it does today.
-- ---------------------------------------------------------------------
alter table public.daily_content enable row level security;

drop policy if exists "subscribers read published" on public.daily_content;
create policy "subscribers read published"
  on public.daily_content for select
  to authenticated
  using (published_at is not null and public.lst_is_subscriber());


-- ---------------------------------------------------------------------
-- DID IT WORK?
-- Last thing that runs, so this is what shows in the Results panel.
-- You want four rows, all saying yes.
-- ---------------------------------------------------------------------
select 'journal table ready' as "what",
       case when exists (select 1 from information_schema.columns
                         where table_name='journal_entries' and column_name='photos')
            then 'yes' else 'NO' end as "ok?"
union all
select 'family story columns ready',
       case when exists (select 1 from information_schema.columns
                         where table_name='family_stories' and column_name='kind')
            then 'yes' else 'NO' end
union all
select 'no leftover photo bucket',
       case when exists (select 1 from storage.buckets where id='journal-photos')
            then 'there is one - see the note at the bottom' else 'yes' end
union all
select 'you can read tonight''s story',
       case when exists (select 1 from pg_policies
                         where tablename = 'daily_content'
                           and policyname = 'subscribers read published'
                           and qual like '%lst_is_subscriber%')
            then 'yes' else 'NO' end;


-- ---------------------------------------------------------------------
-- IF THE THIRD ROW DID NOT SAY "yes"
-- It means a bucket called journal-photos is still sitting in Storage.
-- Nothing on the website or in the app uses it, so it is not breaking
-- anything - it is just clutter. To clear it out:
--
--   Supabase -> Storage (in the left sidebar)
--   -> click journal-photos
--   -> delete any files inside it
--   -> then use the "..." menu beside the bucket name and delete the bucket
--
-- The other three rows are the ones that matter.
-- ---------------------------------------------------------------------
