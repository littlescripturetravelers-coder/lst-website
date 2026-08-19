-- =====================================================================
-- TEMPLATE — adding the text of Virtue Library stories
--
-- Use this when a book's stories are being added to the library.
--
-- REMEMBER: a story lives in two halves.
--   HALF 1 (public)  the catalog entry in  data/virtue-library.js
--                    — title, scripture, virtues, teaser. NO story text.
--   HALF 2 (private) the text, inserted here into `story_texts`.
-- The `id` must be identical in both halves. That is what joins them.
--
-- Anything inserted here is protected: Postgres only hands a row to a
-- subscriber, or to anyone for a story marked is_free.
--
-- HOW LEVI RUNS IT: Supabase → SQL Editor → New query → paste → Ctrl+A →
-- Run. Safe to run more than once; re-running updates rather than
-- duplicating.
-- =====================================================================


-- ---------------------------------------------------------------------
-- ONE STORY — copy this block once per story and fill it in
-- ---------------------------------------------------------------------
insert into public.story_texts (id, story, fork, remember_this, prompt)
values (
  'b9-w1-n1',                       -- id: book-week-night, EXACTLY as in the catalog

  -- the story itself, one quoted string per paragraph, comma separated
  '[
     "First paragraph of the story.",
     "Second paragraph.",
     "Third paragraph."
   ]'::jsonb,

  'The Feeling Moment — the fork where the child chooses.',   -- fork
  'Remember this — the one line that stays with them.',       -- remember_this
  'The question a parent asks afterward.'                     -- prompt
)
on conflict (id) do update set
  story         = excluded.story,
  fork          = excluded.fork,
  remember_this = excluded.remember_this,
  prompt        = excluded.prompt,
  updated_at    = now();


-- ---------------------------------------------------------------------
-- QUOTES: an apostrophe inside the text must be DOUBLED
--   wrong:  'Heavenly Father's love'
--   right:  'Heavenly Father''s love'
-- Inside the jsonb block use \" for a quotation mark:
--   "She whispered, \"I will go.\""
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- WHICH STORIES ARE FREE
-- Keep this list the same as meta.freeStoryIds in data/virtue-library.js.
-- ---------------------------------------------------------------------
update public.story_texts set is_free = true
 where id in ('b6-w3-n1', 'b7-w1-n7', 'b6-w3-n4');

update public.story_texts set is_free = false
 where id not in ('b6-w3-n1', 'b7-w1-n7', 'b6-w3-n4');


-- ---------------------------------------------------------------------
-- DID IT WORK? Last statement, so this is what the Results panel shows.
-- ---------------------------------------------------------------------
select count(*) as "stories with text loaded",
       count(*) filter (where is_free) as "free ones"
  from public.story_texts;
