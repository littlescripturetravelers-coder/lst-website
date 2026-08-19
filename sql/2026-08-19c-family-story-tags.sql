-- =====================================================================
-- Little Scripture Travelers — family story tagging
-- Run date: 2026-08-19   (run AFTER the other two files in this folder)
--
-- Lets a family story be tagged the same five ways a scripture story is:
-- by virtue, life situation, feeling, traveler and scripture — so the same
-- five lookup doors work on both halves of the library.
--
-- SAFE TO RUN TWICE. Only adds columns.
-- =====================================================================

alter table public.family_stories add column if not exists situations text[];
alter table public.family_stories add column if not exists feelings   text[];
alter table public.family_stories add column if not exists traveler   text;
alter table public.family_stories add column if not exists scripture  text;

-- Makes "show me every family story tagged courage" fast once a family has
-- a few hundred of them.
create index if not exists family_stories_virtues_idx    on public.family_stories using gin (virtues);
create index if not exists family_stories_situations_idx on public.family_stories using gin (situations);
create index if not exists family_stories_feelings_idx   on public.family_stories using gin (feelings);
