# The Video Studio — the crew and the editing room

Levi, 4 Nov 2026: "I want to create my own tool that is like CapCut ... The characters have to be the same
always from scene to scene and episode to episode."

**Think of it like a film studio.** Claude is the director (writes the script and every shot, each day).
This folder is the crew and the editing room (makes the pictures, voices and music, then cuts the movie).
The app's **Video Studio** page is your screening room: you watch it, change anything, or tap **Approve**.

The main video is a **5–10 minute YouTube episode** (16:9), built the Episode Engine way: 10 scenes,
45–60 shots of 6, 10 or 15 seconds. A **Short** (9:16, 45–60 s) is cut from it by `make_short.py`.

## What each file does

| File | What it does |
|---|---|
| `EPISODE-ENGINE.md` | Your Master Video Prompt and Guardrail Check, word for word. Claude follows it. |
| `cast.json` | The character bible: every look, outfit, colour, catchphrase, voice and reference picture. |
| `produce.py` | Fills the gaps: book pictures, AI pictures (from the reference pictures), voices, talking shots, music, captions. |
| `render.py` | Makes the finished MP4: camera motion, transitions, captions that light up word by word, music under the voices. |
| `make_short.py` | Cuts a 9:16 Short from an episode. |
| `sample-episode.json`, `sample-short.json` | Examples to test with. |
| `../.github/workflows/studio.yml` | Runs all of this on GitHub (free for this repo). |

## Free, or paid? (nothing costs money until you say so)

- **Free (every day):** your book's own pictures, the free voice (Kokoro), the lullabies you own, all the motion,
  transitions and captions. A shot with no picture shows a navy **"Picture to come"** card.
- **Paid (only with your go):** new AI pictures made from your reference pictures (OpenAI, about 4–19 cents
  each), the characters' own ElevenLabs voices, HeyGen talking shots, and Claude checking each picture.

**To turn paid making ON:**
1. Go to **github.com/littlescripturetravelers-coder/lst-website**.
2. Tap **Settings** → **Secrets and variables** → **Actions**.
3. Tap the **Variables** tab → **New repository variable**.
4. Name: `STUDIO_SPEND` · Value: `yes` → **Add variable**.
5. To turn it OFF again, change the value to `no`.

## Make a picture yourself in ChatGPT (any time, free with your ChatGPT plan)
1. In the app: menu → **Video Studio** → open the video → tap the shot that says **Picture to come**.
2. Tap **Copy prompt**.
3. Open ChatGPT, attach your reference pictures (the four Travelers, the playroom), paste, send.
4. Save the picture to your phone.
5. Back in the Video Studio, tap **Upload picture** on that shot and choose it.
6. Tap **Make the video**. In a few minutes the new video is ready.

## Keep the characters the same (reference pictures)
1. Make the picture once (a full-body front view, or the room exactly as it should always look).
2. Name it after the character or place in `cast.json`, for example `grandma.png`, `playroom.png`, `travel-chest.png`.
3. Put it in the folder `studio/refs/` in this repo (on GitHub: **Add file** → **Upload files**, type
   `studio/refs/` in front of the name).
4. From the next video on, every new picture of them is made from it.
   `cast.json` → `refs_needed` lists which pictures are still missing.

## Add the voices you choose (ElevenLabs)
1. In ElevenLabs, pick or design a voice for one character, copy its **Voice ID**.
2. In `cast.json`, find that character, paste the id into `"elevenlabs": ""`.
3. The voices are the same in every episode from then on (paid making must be ON).

## Add HeyGen (talking shots)
1. In HeyGen: **Settings** → **API** → copy your API key.
2. GitHub → this repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Name: `HEYGEN_API_KEY` · paste the key → **Add secret**.
4. A shot whose maker is `heygen` now talks with its own voice line (paid making must be ON).
   It uses HeyGen's Avatar IV: `POST https://upload.heygen.com/v1/asset` (the picture and the voice),
   `POST https://api.heygen.com/v2/video/av4/generate`, then `GET https://api.heygen.com/v1/video_status.get`.

## Music
Shots can have music by cue: `lullaby`, `lullaby-nt`, `lantern-song` (the night's own song). Any other cue
(`theme`, `sacred`, `wonder`, `adventure` …) plays `studio/music/<cue>.mp3` if you put one there; with paid
making ON, ElevenLabs makes it from the item's `prompt`. Music always gets quieter under the voices.

## Pause it
Add an empty file `studio/PAUSED` (GitHub: **Add file** → **Create new file** → name it `studio/PAUSED` →
**Commit**). Delete it to start again.

## Run it on a computer (for Claude or a helper)
```
python3 studio/produce.py --file studio/sample-episode.json --out /tmp/ep.json
python3 studio/render.py  --file /tmp/ep.json --out /tmp/studio
python3 studio/make_short.py --file /tmp/ep.json --out /tmp/short.json
python3 studio/test_render.py            # a quick check, no internet needed
```
