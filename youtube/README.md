# Daily read-along video → YouTube

Levi, 3 Nov 2026: *"I want this to become a recurring [task] that happens each day with the morning
lantern's scripture of the day that automatically gets uploaded to YouTube."*

Every evening (`.github/workflows/readalong-video.yml`, 8:15 PM Mountain, safety nets 11:15 PM and 3:15 AM)
the job makes the NEXT day's videos and posts; each morning the **Lantern Daily Posts** scheduled task
(3:41 AM) schedules them in Metricool (Levi, 3 Nov 2026: "create these and post them to each account each day";
"include this in the Lantern Daily Posts ... scheduled task"):

1. **Which story.** The night the Morning Lantern publishes that day — `lantern/*/night.json` whose
   `publish_date` matches. The video always matches that day's Lantern.
2. **The pages.** That night's five printed pages: the PDF from
   `app.littlescripturetravelers.com/stories/pdf/<mon>/` and its words from `lantern/book-text/<mon>/`.
3. **The narration.** Every page is read aloud from those words (Kokoro "af_heart" voice, free, runs
   inside the Action). The grown-up *Parent Experience* box stays on screen and is not read aloud;
   the *Question time!* questions get a pause for the child to answer.
4. **The book.** The month's cover opens, the camera glides to each page as it is read, and each page
   flips by itself the moment its narration ends. The book closes on the back cover.
5. **The end card.** Paperback on Amazon (the link is read from `books.html` by the book's title),
   the app and website, with QR codes, then like / share / subscribe — in **Levi's own ElevenLabs
   voice** (made once a month with the repo's `ELEVENLABS_API_KEY`, kept in `endcard-audio/<mon>/`).
6. **The vertical cut** (`vertical.py`): 9:16, about 68 seconds — the title page, the story page read
   aloud with the camera on each paragraph (found from the PDF's own text boxes), burned-in captions,
   and Levi's like / share / subscribe line over a call-to-action card.
7. **The posts** (`social_posts.py` → `posts/<date>.json`): YouTube (full video with chapters, and a
   Short), Instagram Reel, Facebook Reel, TikTok, Pinterest video pin — titles, captions, tags, alt text.
   The files are a GitHub release `readalong-<date>` (public links; three weeks are kept).
8. **Posting.** Lantern Daily Posts schedules them in Metricool, made for kids: the Reel at 10 AM on
   Instagram, Facebook, TikTok and YouTube Shorts; the full YouTube video at 4 PM; Pinterest at 8:30 PM.

| Want to… | Do this |
|---|---|
| Stop the daily videos | Add an empty file `youtube/PAUSED`. Delete it to start again. |
| Remake a day | Actions → *Read-along video (daily posts)* → Run workflow → the date, Remake: yes. |

**Covers:** `assets/<mon>/front.png` if present (November has the KDP cover), otherwise the website's
`images/book-cover-<month>.jpg` (New Testament: `book-cover-nt-<month>.jpg`). The back cover and the
"Sweet Dreams" page in `assets/common/` work for every month.

`upload_youtube.py` can also upload straight to YouTube with Google keys, but posting goes through
Metricool, so it is not run by the workflow (two uploads a day would double-post).

## Not needed now: direct YouTube setup (only if Metricool ever stops posting to YouTube)

This part needs you, because Google has to see you sign in and say yes. About 15 minutes, once.
Use the Google account that owns the Little Scripture Travelers YouTube channel.

**A. Make the key (Google Cloud)**
1. Go to **console.cloud.google.com** and sign in.
2. At the top, click the project picker → **New project** → name it `LST YouTube` → **Create**.
3. In the search bar type **YouTube Data API v3** → click it → **Enable**.
4. Left menu → **Google Auth Platform** (or "OAuth consent screen") → **Get started**.
   App name `LST YouTube`, pick your email, **External**, your email again → **Create**.
5. Left menu → **Audience** → **Publish app** → **Confirm**. (This stops the key from expiring after 7 days.)
6. Left menu → **Clients** → **Create client** → type **Web application**.
   Under *Authorized redirect URIs* click **Add URI** and paste:
   `https://developers.google.com/oauthplayground` → **Create**.
7. Copy the **Client ID** and **Client secret** somewhere safe.

**B. Let it post to your channel**
1. Go to **developers.google.com/oauthplayground**.
2. Click the **gear ⚙️** (top right) → tick **Use your own OAuth credentials** → paste the Client ID and
   Client secret → close the gear box.
3. In the left box *"Input your own scopes"* paste:
   `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube`
   → **Authorize APIs**.
4. Pick your account and the **Little Scripture Travelers** channel. If Google says *"hasn't verified
   this app"*, click **Advanced** → **Go to LST YouTube** → **Continue / Allow**.
5. Click **Exchange authorization code for tokens**. Copy the **Refresh token**.

**C. Give the three values to GitHub**
1. Go to **github.com/littlescripturetravelers-coder/lst-website** → **Settings** →
   **Secrets and variables** → **Actions** → **New repository secret**.
2. Add three secrets, one at a time (name exactly as written):
   - `YT_CLIENT_ID` → the Client ID
   - `YT_CLIENT_SECRET` → the Client secret
   - `YT_REFRESH_TOKEN` → the Refresh token
3. Optional: `YT_PLAYLIST_ID` → a playlist's ID (the part after `list=` in its link) to collect them all.

Custom thumbnails need the channel to be phone-verified once at **youtube.com/verify**; without it the
video still uploads, just with YouTube's own thumbnail.
