# Getting the app onto your iPhone and Lindy's (TestFlight)

This takes **about 2–3 hours the first time**, spread over a couple of days because Apple has to approve your developer account. Do the steps in order. Anything in `grey boxes` is typed or pasted exactly.

What you need: a Mac, your iPhone, an Apple ID, and a credit card ($99/year for Apple).

---

> **Already have an Apple Developer account (for example, from another live app)?** Skip step 1 below. The family app goes on the same account as its **own app**, with its own bundle ID, and your other app isn't touched. Your team members and testers carry over.

## Part 1: Accounts (one time, ~30 min, then wait 1–2 days)

1. **Apple Developer Program:** go to developer.apple.com/programs and tap **Enroll**. Sign in with your Apple ID and pay the $99. Choose **Individual** (not Organization). Apple emails you when you're approved, usually within 48 hours.
2. **Expo account (free):** go to expo.dev and sign up. This is the service that builds the app for you in the cloud, so you don't need Xcode.
3. **Supabase account (free to start):** go to supabase.com and sign up. Click **New project**, name it `lewis-family`, pick a strong database password and save it in your password manager, and choose the region closest to you (for example "West US").
4. **Anthropic API key:** go to console.anthropic.com, sign up, add a payment method, then **API Keys → Create key**. Copy it somewhere safe. It starts with `sk-ant-`.
5. *(Later, optional)* Plaid (plaid.com) for banks, and developer.amazon.com for Alexa. The app works without these, and you can add them afterward.

## Part 2: Set up your Mac (~20 min)

1. Install **Node.js**: go to nodejs.org, download the **LTS** version, and run the installer.
2. Open the **Terminal** app (press ⌘ + Space and type "Terminal").
3. Paste each line and press Return after each one:
   ```
   npm install -g eas-cli
   npm install -g supabase
   ```
4. Download the code folder from this project (**app-code**) and put it in your Documents folder. Then:
   ```
   cd ~/Documents/app-code
   npm install
   ```
5. `CLAUDE.md` is already in place. Whenever you open this folder in Claude Code, it knows the rules of your app.

## Part 3: Turn on the backend (~20 min)

Still in Terminal, inside the `app-code` folder:

1. Log in and connect to your project. The project ref is in Supabase → Project Settings → General.
   ```
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   ```
2. Create all the tables:
   ```
   supabase db push
   ```
3. Add your AI key:
   ```
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-PASTE-YOURS
   ```
4. Put the server functions online:
   ```
   supabase functions deploy
   ```
5. In Supabase, go to **Authentication → URL Configuration** and add this to Redirect URLs:
   ```
   lewisfamily://
   ```
6. Copy `.env.example` to a new file named `.env`. Fill in the two values from Supabase → **Project Settings → API**: the Project URL and the `anon` public key.

## Part 4: Build and send to TestFlight (~40 min, mostly waiting)

1. Log in to Expo and set up the project:
   ```
   eas login
   eas init
   ```
2. Build the iPhone app in the cloud:
   ```
   eas build -p ios --profile production
   ```
   - It asks you to **log in with your Apple ID**. Say yes.
   - When asked about certificates and provisioning, choose **Yes / let EAS handle it** every time.
   - Wait about 15–25 minutes. You'll get a link when it's done.
3. Send it to TestFlight:
   ```
   eas submit -p ios --latest
   ```
   - If it asks for an **App Store Connect app**, let it create one. Name it **Lewis Family**.
   - Apple takes about 10–30 minutes to "process" the build. You'll get an email.

## Part 5: Put it on your phone (~5 min)

1. On your iPhone, install **TestFlight** from the App Store.
2. On your computer, open **appstoreconnect.apple.com → My Apps → Lewis Family → TestFlight**.
3. Under **Internal Testing**, click **+** to make a group called `Family`. Add yourself, then select the build.
4. Check your email on the phone, tap **View in TestFlight → Install**. Done!

## Part 6: Add Lindy (~10 min)

**Step A: Add her as a tester (on your computer)**
1. In **appstoreconnect.apple.com → Users and Access**, click **+**.
2. Enter Lindy's name and the **email she uses for her Apple ID**. Choose the role **Customer Support**; it's the lowest access and is enough for testing.
3. Click **Invite**. Lindy will get an email. She taps **Accept** and signs in with her Apple ID.
4. Go back to **My Apps → Lewis Family → TestFlight → Family group → Testers → +** and add Lindy.

**Step B: Lindy installs it (on her iPhone)**
1. Install **TestFlight** from the App Store.
2. Open the email "You're invited to test Lewis Family" and tap **View in TestFlight → Accept → Install**.

**Step C: Join your family inside the app**
1. **You:** open the app, sign in with your email, and finish the setup.
2. Go to **Settings → Our family → Invite Lindy** and read her the 6-letter code.
3. **Lindy:** open the app, sign in with **her** email, tap **"I have an invite code"**, and enter it.
4. You're now sharing one family: calendar, reminders, check-ins and studies.

## Every time you update the app

After you or Claude Code change something:
```
eas build -p ios --profile production --auto-submit
```
About 30 minutes later, TestFlight on both phones shows **Update**. Tap it.

(Small changes that don't touch Siri, Alexa, or new permissions can go even faster with `eas update`. Ask Claude Code to set that up when you're ready.)

---

## If something goes wrong
- **"No bundle identifier" or "already in use":** open `app.config.ts` and change `com.lewisfamily.app` to something unique, like `com.levilewis.family`. Use the same new value for the app group too.
- **The build fails:** copy the red error text into Claude Code and say "fix this EAS build error."
- **You can't sign in (no email):** check spam. In Supabase → Authentication → Providers, make sure **Email** is on.
- **Siri or Alexa:** Siri shortcuts work automatically once the app is installed; try "What's on today in Lewis Family." Alexa is a separate setup in `alexa/README.md`, and you can do it later.
- **TestFlight builds expire after 90 days.** Just run the update command again.
