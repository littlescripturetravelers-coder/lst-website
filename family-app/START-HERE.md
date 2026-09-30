# Start here: get the family app onto your phone

Think of it like opening a **bakery**:

- **The pantry** is Supabase. It holds your family's information.
- **The chef** is the Anthropic key. It thinks up the daily ideas and studies.
- **The oven** is Expo. It bakes the code into a real iPhone app.
- **The delivery truck** is TestFlight. It brings the app to your phone.

Do one step at a time. When a step says "type", copy the grey box, paste it into Terminal and press **Return**.
If anything shows red words, copy them into Claude Code and say "please fix this."

---

## Part 1: Get your keys (like getting keys to the bakery)

1. **Apple.** You already pay for an Apple Developer account for your other app, so this is done. ✅
2. **Expo.** Go to **expo.dev**. Tap **Sign up**. Make an account. It's free.
3. **Supabase.** Go to **supabase.com**. Tap **Sign up**.
   - Tap **New project**.
   - Name it `family-app`.
   - Make a password. **Write it down.**
   - Pick the place closest to you, like "West US".
   - Tap **Create**. Wait a few minutes while it gets ready.
4. **Anthropic.** Go to **console.anthropic.com**. Sign up and add a card.
   - Tap **API Keys**, then **Create key**.
   - Copy the key. It starts with `sk-ant-`. **Save it somewhere safe.**

## Part 2: Get your Mac ready (like washing your hands)

1. Go to **nodejs.org**. Download the button that says **LTS**. Open it and click **Continue** until it's done.
2. Go to **desktop.github.com**. Download **GitHub Desktop**, open it and sign in.
3. In GitHub Desktop, click **File → Clone repository**. Pick **lst-website**. Click **Clone**.
4. At the top, click **Current branch** and pick **claude/compassionate-keller-5hmdld**.
   (Once this work is merged, pick **main** instead.)
5. Open **Terminal**. Press **⌘ + Space**, type `Terminal`, then press **Return**.
6. Type these one at a time:
   ```
   npm install -g eas-cli
   ```
   ```
   brew install supabase/tap/supabase
   ```
   (If it says "brew: command not found", go to **brew.sh**, copy the one line on that page into Terminal, press Return, then try again.)
7. Walk into the app folder:
   ```
   cd ~/Documents/GitHub/lst-website/family-app
   ```
8. Unpack the app's parts:
   ```
   npm install
   ```

## Part 3: Fill the pantry (Supabase)

1. Log in:
   ```
   supabase login
   ```
2. Find your **project ref**. In Supabase, click **Project Settings → General**. It's a short jumble of letters. Then type this, putting yours where it says YOUR-REF:
   ```
   supabase link --project-ref YOUR-REF
   ```
   It asks for the password from Part 1. Type it in.
3. Build the shelves (the tables):
   ```
   supabase db push
   ```
4. Give the chef its key. Put your real key where it says PASTE-YOURS:
   ```
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-PASTE-YOURS
   ```
5. Turn on the helpers:
   ```
   supabase functions deploy
   ```
6. In Supabase, click **Authentication → URL Configuration**. Under **Redirect URLs**, add this and click **Save**:
   ```
   lewisfamily://
   ```

## Part 4: Tell the app where the pantry is

1. In Supabase, click **Project Settings → API**. You'll see two things:
   - the **Project URL**, which looks like `https://abc123.supabase.co`
   - the **anon public** key, a long line of letters
2. Log in to Expo and set up the project:
   ```
   eas login
   ```
   ```
   eas init
   ```
3. Give Expo the two things from Supabase. Put yours in place of the capital letters:
   ```
   eas env:create --environment production --visibility plaintext --name EXPO_PUBLIC_SUPABASE_URL --value YOUR-PROJECT-URL
   ```
   ```
   eas env:create --environment production --visibility plaintext --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR-ANON-KEY
   ```

## Part 5: Bake the app (Expo)

1. Type:
   ```
   eas build -p ios --profile production
   ```
2. It asks questions. Here's how to answer:
   - **Log in with your Apple ID?** Say **yes**.
   - **Certificates or provisioning?** Say **yes, let EAS handle it**, every time.
3. Wait about 20 minutes. Go get a snack. 🍪

## Part 6: Send the truck (TestFlight)

1. Type:
   ```
   eas submit -p ios --latest
   ```
   If it asks to make a new app, say **yes** and name it **Lewis Family**.
2. Wait about 20 minutes. Apple emails you when it's ready.
3. On your iPhone, get the **TestFlight** app from the App Store.
4. On your computer, go to **appstoreconnect.apple.com → Apps → Lewis Family → TestFlight**.
5. Under **Internal Testing**, click **+**. Make a group called `Family`. Add yourself, then pick the build.
6. On your phone, open the email and tap **View in TestFlight → Install**. 🎉

## Part 7: Open it

1. Open the app. Type your email.
2. Check your email and tap the link.
3. Answer the setup questions: your family's name, who's in it, birthdays and your anniversary.
4. To add Lindy, follow **Part 6** of `TESTFLIGHT.md`.

---

## Later (not needed today)

- **Nightly ideas and the morning study made fresh each day:** ask Claude Code to "turn on the nightly jobs in supabase/cron.sql."
- **Banks (Plaid) and Alexa** can wait. The app works without them.
- **Changed something?** Type this, and about 30 minutes later your phone shows **Update**:
  ```
  eas build -p ios --profile production --auto-submit
  ```

## If you get stuck

- **"Bundle identifier already in use":** ask Claude Code to "change the bundle identifier in app.config.ts to com.levilewis.family."
- **No sign-in email:** check your spam folder.
- **Anything with red words:** copy it into Claude Code and say "please fix this."
