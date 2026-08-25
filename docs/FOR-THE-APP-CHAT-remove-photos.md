# For the app chat: take photos out of the journal

**This is a request from the website side. Hand this whole file to the app chat.**

Levi's decision (2026-08-25): journal and family-story photos are not a feature
for now. He'd rather ship without them and add them later if customers ask.

The website side is already done — it neither shows nor attaches photos.

## ⚠️ Do NOT drop the `photos` column

`journal_entries.photos` must stay in the database.

Every app version already on a phone writes `photos` on **every journal save**
(`saveJournalEntry` in `www/js/backend.js`). Drop the column and those saves
start failing — families lose entries they think they wrote. The column costs
nothing empty. Leave it.

Same reasoning for the app's own write: it is safe to keep sending `photos: []`.

## What to remove from the app

1. **The photo picker** in the journal entry screen — the attach control and
   the thumbnail strip.
2. **`jPhotoId()`** in `www/index.html` and whatever stores the picked files on
   the device, if nothing else uses it.
3. **Any local copies already on a phone.** If the app saved image files to
   device storage, clean them up on upgrade so people are not carrying
   megabytes they can no longer see.

Leave alone: the `photos` field in the save payload, `place`, `lat`, `lon`.
Places and the map pin are staying — only pictures are going.

## What was NOT built (so nobody goes looking)

There was briefly a plan to sync photos to a Supabase storage bucket. It was
never built, and the website's migration now removes the bucket if an earlier
run created one. No uploads ever happened, so there is nothing to migrate and
no customer data to rescue.

## If it comes back later

The numbers, for whenever someone asks: resized to ~300 KB a photo, a typical
family stores about 46 MB a year. Even at 20,000 subscribers the storage bill
would be roughly $54/month against $219,800/month of revenue — about 0.025%.
Storage was never the reason not to do this; it simply wasn't wanted yet.
