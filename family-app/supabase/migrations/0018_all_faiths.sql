-- Every faith, not just Latter-day Saint and Christian. The daily scripture, quote and teaching links follow the family's faith.
-- lantern_nights.texts: the verse text and "Remember this" quote pulled from each Morning Lantern edition ({ lds: {verse, ref, quote}, christian: {...} }).
alter table families drop constraint if exists families_faith_check;
alter table families add constraint families_faith_check check (faith in ('lds', 'christian', 'catholic', 'orthodox', 'jewish', 'muslim', 'hindu', 'buddhist', 'sikh', 'bahai', 'spiritual', 'none'));
alter table lantern_nights add column if not exists texts jsonb;
