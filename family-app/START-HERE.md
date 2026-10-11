# Start here: get the family app onto your phones

The same guide, with copy buttons and tick boxes: https://claude.ai/artifact/79QEfgCeMZBaWE1WtMS2z9

Claude already built the app, set up the database and turned on the server helpers. These are the only steps that need you. Do them in order, one at a time. Tap Copy, paste into PowerShell (right-click or Ctrl+V pastes), then press Enter. If you ever see red words, copy them into Claude and say "please fix this."

Think of it like a bakery:
- **Pantry:** Supabase holds your family's information (already stocked).
- **Chef:** The Anthropic key thinks up ideas and studies.
- **Oven:** Expo bakes the code into an app.
- **Truck:** TestFlight brings it to your phones.

## Part 1: Unlock the pantry

About 5 minutes. Supabase, free.

1. Go to supabase.com and sign in. Click the project called Family Management App.
2. On the left, click Authentication, then URL Configuration. Under Redirect URLs, click Add URL, paste this, then click Save. (It lets the sign-in email open your app.)
   ```
   lewisfamily://**
   ```
3. On the left, click SQL Editor, then New query. Paste all of this, then click Run. You should see "Success". (It adds the "delete my account" button Apple requires.)
   ```
   -- App Store requires in-app account deletion. Its own step because it deletes rows.
   create or replace function delete_my_account() returns void language plpgsql security definer set search_path = public as $$
   declare fid uuid;
   begin
     select family_id into fid from family_members where user_id = auth.uid();
     update family_members set user_id = null where user_id = auth.uid();
     if fid is not null and not exists (select 1 from family_members where family_id = fid and user_id is not null) then delete from families where id = fid; end if;
     delete from auth.users where id = auth.uid();
   end $$;
   revoke execute on function delete_my_account() from anon, public;
   grant execute on function delete_my_account() to authenticated;
   ```

## Part 2: Hire the chef

About 5 minutes. Costs $5 one time, and it lasts a long time.

1. Go to console.anthropic.com and sign in (or sign up).
2. Click Billing. Buy the smallest amount of credit ($5). Make sure auto-reload is OFF, so it can never charge you more.
3. Click API Keys, then Create key. Name it family-app. Copy the key (it starts with sk-ant-).
4. Back in Supabase, click Edge Functions on the left, then Secrets. Click Add new secret. For the name, paste this. For the value, paste your key. Click Save.
   ```
   ANTHROPIC_API_KEY
   ```
5. Can't spend $5 right now? Skip this part. The app still works: calendar, reminders, chores, health and family. Only the AI ideas and studies stay empty until you add the key.

## Part 3: Get your computer ready

About 15 minutes, one time only. Written for Windows.

1. Go to nodejs.org and click the big green Get Node.js button. Halfway down the next page, click Windows Installer (.msi), not the Docker box. Open the downloaded file from your Downloads folder. Click Next, tick "I accept the terms", and keep clicking Next. Leave "Tools for Native Modules" unticked. Click Install, click Yes if Windows asks, then Finish.
2. Open PowerShell: press the Windows key, type PowerShell, press Enter. A blue or black window opens. Type this and press Enter. It should show something like v24.21.0.
   ```
   node -v
   ```
3. Go to desktop.github.com, download GitHub Desktop, open it and sign in.
4. In GitHub Desktop, click File, then Clone repository. Click littlescripturetravelers-coder/lst-website. In the Local path box, delete what's there and paste this instead (it keeps the app out of OneDrive, which would slow it down). Then click Clone.
   ```
   C:\Users\User\GitHub\lst-website
   ```
5. At the top, click Current branch and pick claude/compassionate-keller-5hmdld. (After this work is merged, pick main instead.)
6. Back in PowerShell, install Expo's tool. If it says "running scripts is disabled on this system", see the tip at the bottom of this page, then try again.
   ```
   npm install -g eas-cli
   ```
7. Walk into the app folder:
   ```
   cd $HOME\GitHub\lst-website\family-app
   ```
8. Unpack the app's parts (takes a minute or two):
   ```
   npm install
   ```

## Part 4: Bake the app

About 30 minutes, mostly waiting. Expo's free plan.

1. In the same PowerShell window, log in to Expo with the same email and password you use on expo.dev:
   ```
   eas login
   ```
2. Set up the family app's own Expo project. If it asks to create a new project, say yes. If it asks which account, pick Little Scripture Travelers. Never pick the existing "Little Scripture Travelers App".
   ```
   eas init
   ```
3. Start baking:
   ```
   eas build -p ios --profile production
   ```
4. When it asks to log in with your Apple ID, say yes. For anything about certificates or provisioning, say yes and let EAS handle it, every time.
5. Wait about 20–40 minutes. The free plan sometimes waits in line first; that's normal. Go get a snack.

## Part 5: Send the truck

About 20 minutes, mostly waiting.

1. Send it to Apple:
   ```
   eas submit -p ios --latest
   ```
2. If it asks to create a new app, say yes. For the name, type Lewis Family. If Apple says the name is taken, try Lewis Family Hub. (You can change the public name later.)
3. Wait for Apple's email saying the build is ready (about 10–30 minutes).

## Part 6: Put it on your phone

About 5 minutes.

1. On your iPhone, get the TestFlight app from the App Store.
2. On your computer, go to appstoreconnect.apple.com. Click Apps, then your new app, then TestFlight.
3. Next to Internal Testing, click +. Name the group Family. Add yourself, then pick the build.
4. On your phone, open the email from TestFlight and tap View in TestFlight, then Install.

## Part 7: Add Lindy

About 10 minutes.

1. In appstoreconnect.apple.com, click Users and Access, then +. Type Lindy's name and the email she uses for her Apple ID. Pick the role Customer Support (the smallest one). Click Invite.
2. Lindy opens that email on her phone and taps Accept.
3. Back in Apps, your app, TestFlight, then the Family group: click + next to Testers and add Lindy.
4. Lindy gets the TestFlight app and taps Install from her TestFlight email.

## Part 8: Start using it

The bakery is open.

1. Open the app on your phone. Type your email and tap Send sign-in link.
2. Open the email on the same phone and tap the link. If it asks to open the app, tap Open.
3. Answer the setup questions: your last name, you, Lindy, the girls with their birthdays, your anniversary and your faith.
4. Go to More, then Settings. Under your family, tap Invite Lindy. Read her the 6-letter code.
5. Lindy opens the app, signs in with her own email, and under "Joining your spouse's family?" types the code and taps Join with code. Now you share everything.

## Later, and if you get stuck

- Going public on the App Store: after you two try it for a few days, tell Claude "get the app ready for the App Store". Claude writes the store listing, the privacy policy page and the review notes, then gives you a short list: take screenshots and click Submit for Review. Apple usually reviews in 1–3 days.
- The paywall: after the free month, tell Claude "turn on the paywall". It sets up a monthly plan and a cheaper yearly plan through Apple.
- Changed something? Claude tells you when to run this, and then your phones show Update in TestFlight: eas build -p ios --profile production --auto-submit
- Morning Lantern studies need one more key so the app can read tonight's story from your private website repo. Claude will walk you through it when you're ready.
- No sign-in email? Check spam. Supabase's free email sends only a few per hour, so wait a bit before trying again.
- "Bundle identifier already in use": tell Claude, and it changes it for you.
- If you close PowerShell, open it again and run the "Walk into the app folder" line before any other command.
- PowerShell says "running scripts is disabled on this system"? Paste this line, press Enter, type Y, press Enter, then try your command again: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
