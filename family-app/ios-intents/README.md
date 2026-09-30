# Siri and Shortcuts

- **Built in:** `LewisFamilyIntents.swift` holds 5 App Intents and the `AppShortcutsProvider`. They show up in Siri and in the Shortcuts app automatically after install, with no setup. Phrases:
  - "Add a family reminder in Lewis Family"
  - "What's on today in Lewis Family"
  - "Give us a date idea in Lewis Family"
  - "Today's scripture in Lewis Family"
  - "Ask Lewis Family"
- **Apple Reminders sync:** family reminders are mirrored to a "Lewis Family" list in Apple Reminders (`src/lib/eventkit.ts`). That means plain Siri also works: "Hey Siri, remind me to … in my Lewis Family list." The app pulls those back in on launch.
- **Auth:** the app saves the Supabase session in the shared keychain group `group.com.lewisfamily.app`, and the intents read it from there.
- **Build:** the config plugin `with-app-intents.js` copies the Swift file into the Xcode project during `expo prebuild`. This needs an EAS or dev-client build; Expo Go can't run it.
- **Next step:** add an App Intents extension target so the intents can run without launching the app.
