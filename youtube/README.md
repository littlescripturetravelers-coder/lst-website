# Daily read-along video → YouTube

Levi, 3 Nov 2026: *"I want this to become a recurring [task] that happens each day with the morning
lantern's scripture of the day that automatically gets uploaded to YouTube."*

Every morning at **4:15 AM Mountain** (`.github/workflows/readalong-video.yml`, safety-net run at 9:15):

1. **Which story.** The night the Morning Lantern published for today — `lantern/*/night.json` whose
   `publish_date` is today in Denver. The video always matches that day's Lantern.
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
6. **YouTube.** Uploaded as *made for kids* with title, description, tags and thumbnail.
   `published.json` remembers every upload, so nothing is posted twice.

| Want to… | Do this |
|---|---|
| Stop the daily videos | Add an empty file `youtube/PAUSED`. Delete it to start again. |
| Remake or post a day by hand | Actions → *Read-along video (YouTube)* → Run workflow → type the date. |
| Post as unlisted/private instead | Same, and pick the privacy. |
| See a video before YouTube is connected | Open that day's run → *Artifacts* (kept 14 days). |

**Covers:** `assets/<mon>/front.png` if present (November has the KDP cover), otherwise the website's
`images/book-cover-<month>.jpg` (New Testament: `book-cover-nt-<month>.jpg`). The back cover and the
"Sweet Dreams" page in `assets/common/` work for every month.

## One-time YouTube setup (Levi)

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
