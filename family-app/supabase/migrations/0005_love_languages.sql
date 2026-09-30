-- Each spouse's love languages (how they most feel loved). Drives couple ideas, daily "small act", check-in questions and the couple study.
alter table family_members add column if not exists love_languages jsonb;   -- { ranked: ['time','service','words','touch','gifts'], scores: {...}, taken_at }
