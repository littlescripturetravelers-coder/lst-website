# For the app chat: the Morning Lantern in five editions

**This is a request from the website side. Hand this whole file to the app chat.**

Levi (2026-08-26) is opening the Lantern to other Christian traditions. A family says
which one they belong to when they subscribe, and from then on the Lantern arrives
written in their own voice. His Faith Pack Guide names five launch editions:

| id | edition |
|---|---|
| `lds` | Latter-day Saint — **the edition that exists today** |
| `catholic` | Catholic |
| `evangelical` | Non-denominational / Evangelical |
| `baptist` | Baptist |
| `methodist` | Methodist / Wesleyan |

**These ids are now in use.** They are in `data/faiths.js` on the website and in the
database. Add to them freely; renaming one orphans every family and every night
already carrying it.

## What the website has already done

`sql/2026-08-28-faith-editions.sql` (in the website repo — Levi runs it once, and
after that both sides see it):

```sql
alter table public.profiles      add column if not exists faith text;
alter table public.daily_content add column if not exists faith text not null default 'lds';
```

- Every night that already existed is `lds`, because that is what it is.
- `profiles.faith` null means the family was not asked or preferred not to say. They
  get the `lds` edition.

### ⚠️ THE ONE THING THAT WILL BREAK YOUR PUBLISH SCREEN

`daily_content.publish_date` **was `unique` on its own.** With five editions that is
wrong — publishing the Catholic edition for a date would either be refused or would
replace the Latter-day Saint one. The migration drops that constraint and creates:

```sql
create unique index daily_content_date_faith on public.daily_content (publish_date, faith);
```

**The app upserts on `publish_date`.** That must become an upsert on
`(publish_date, faith)`, and the admin publish screen needs a way to say which
edition is being published. Until you change it the app keeps publishing `lds` and
nothing breaks — the default sees to that — but it cannot publish the other four.

## What the website does now, so you can match it

`js/lst-app-data.js`:

- Reads `profiles.faith` once when the account is known, remembers it per browser as
  a display hint, and lets the family change it on My Account.
- `archive.tonight()` and `archive.full(date)` ask for **the family's own edition
  first, then fall back to `lds`.**

**A family must never be shown an empty page because their edition is not written
yet.** Five editions will not always land together. A Catholic family on a night with
no Catholic edition gets the Latter-day Saint one, which is a real Lantern, rather
than nothing. Please do the same in the app.

There is a second fallback: if the database has no `faith` column at all, the query
errors and the code asks again without it. That is what lets the website ship before
Levi runs the migration. You can drop that once the migration is definitely in.

## What faith is NOT for

It chooses **which Lantern to send**. Nothing else. Not pricing, not a mailing list,
not who may read what — `lst_is_subscriber()` still decides that and is untouched.
The signup screen says as much. If anyone wants it used for something else, ask Levi
first and tell families on the screen where they answer.

## Still open

Levi asked for the daily prompt he enters in the app admin to reach the website.
It already does — the website reads the same `daily_content` row the app writes.
Once the app publishes with a `faith`, the website serves it to that faith with no
further change. **Nothing on the website is waiting on anything except the
migration being run and the app learning to publish an edition.**
