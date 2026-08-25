# For the app chat: make journal photos sync

**This is a request from the website side. Nothing here changes the website —
it is all app work.** Hand this whole file to the app chat.

## The situation

`journal_entries.photos` is a `jsonb` array, and the app writes filenames into
it (`jPhotoId()` in `www/index.html` makes ids like `p1a2b3c4d5`). The images
themselves never leave the phone — there is no `storage.from(...).upload(...)`
anywhere in the app.

So a family who writes a journal entry on their phone, then opens the website,
sees the entry and the words "3 photos — kept on the phone you added them from".
Honest, but not what Levi wants. He wants the pictures to follow the account.

## What already exists (do NOT recreate these)

The website's migration `sql/2026-08-25-mirror-the-app.sql` has already created:

- A **private** storage bucket called `journal-photos` (not public).
- Four row-security policies on `storage.objects` restricting every family to a
  folder named after their own account id. A family can only read, write and
  delete inside `"<their auth.uid()>/..."`. Nobody can browse anyone else's.

## What the app needs to do

**1. Upload on save.** When a journal entry is saved with new photos, upload
each image to:

```
journal-photos/<user_id>/<photoId>.jpg
```

where `<photoId>` is the id the app already generates. Keep writing that same
id into the `photos` array — the array does not need to change shape at all,
which means older app versions keep working.

```js
await sb.storage.from('journal-photos')
  .upload(`${user.id}/${photoId}.jpg`, fileOrBlob, { upsert: true, contentType: 'image/jpeg' });
```

**2. Delete when the entry is deleted**, so families are not paying to store
pictures of entries they removed:

```js
await sb.storage.from('journal-photos').remove(paths);
```

**3. Shrink before uploading.** Phone photos are 3–8 MB each. Resize the long
edge to about 1600px and encode JPEG at ~0.8 quality before upload — that is
usually 200–400 KB, and it is the difference between this being pleasant and
this being expensive. Supabase's free tier is 1 GB of storage.

**4. Upload in the background and keep working offline.** The journal is
deliberately offline-first — ids are made on the phone so writing never waits
on a network. Don't regress that: save the row first, upload after, and retry
later if the upload fails. A failed upload must never lose the writing.

## What the website will do once that ships

The website already knows the bucket name and the path convention. When photos
start appearing there it will show them on `journal.html` — no further app work
needed, and no coordinated release. Until then it keeps saying they are on the
phone.

## One question for Levi first

Storage costs money once families have thousands of photos. Worth deciding
whether photo sync is part of The Lantern subscription or something everyone
gets, before this ships.
