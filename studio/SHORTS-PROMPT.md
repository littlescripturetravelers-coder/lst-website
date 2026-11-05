# The Shorts task (advertising each episode)

Levi, 4 Nov 2026: "we could do a separate task of creating shorts to advertise them".

The prompt of the scheduled task **"Video Studio — Shorts for the newest episode"** (runs after the
daily episode task). Needs the GitHub and Supabase connectors.

1. Find the newest episode that is `review`, `approved` or `posted` and has no Short yet:
   `select id, title, timeline from studio_projects p where kind='episode' and status in ('review','approved','posted') and not exists (select 1 from studio_projects s where s.timeline->>'from' = p.id) order by created_at desc limit 1;`
2. Pick its 45–60 seconds that sell it best: the funniest playroom beat as the hook (first 1.5 s
   grabs), one wonder shot from the scripture story (never a sacred moment cut for laughs), the star
   Traveler's catchphrase, and an end card "Watch the whole episode on YouTube". Write the Short as a
   timeline (lst-app/docs/STUDIO.md): `kind` "short", 1080×1920, `from` = the episode id, clips that
   reuse the episode's `src` (the crew reframes them to 9:16), the episode's own voice lines, a hook
   text in the first second, karaoke captions, and `post` for Instagram, Facebook, TikTok and YouTube
   Shorts (each platform's own caption and hashtags; `when` "10:00").
3. Same guard rail as the episode (scripture, reverence and brand must be 10).
4. Insert it (`id` = `<episode id>-short`, status 'making') and run the Action "Video Studio (make the
   video)" with that id. It appears in Levi's Video Studio under Ready for you; nothing posts until he
   approves it.
