# For the app chat: the library stories can be real now

**This is a request from the website side. Hand this whole file to the app chat.**

Levi asked (2026-08-26) for the August book's stories to be copied from the app
into the website. **There is nothing to copy.** The app does not hold those
stories either — `openStory()` in `www/index.html` shows the title, scripture,
virtue, teaching note and teaser, and then this card:

> 📖 The full illustrated story lives in **<book title>**. We're bringing the
> whole library into the app so you'll read every story right here —
> **coming soon**.

Both sides show a teaser because the words have never been anywhere but Levi's
book manuscripts. `www/data/virtue-library.js` is metadata only, in the app
exactly as on the website.

## What is changing on the website side

Levi is sending the August book. The website turns each story into two halves:

| Half | Where | Who may read it |
|---|---|---|
| the card | `data/virtue-library.js` (already done for all 91) | everybody |
| the words | `story_texts` in Supabase | subscribers, by RLS |

`story_texts` already exists — see `sql/2026-08-19-website-accounts-and-family-stories.sql`:

```
id            text primary key      -- 'b8-w1-n1', identical to the catalog id
story         jsonb                 -- AN ARRAY OF PARAGRAPHS, not one string
fork          text                  -- the Feeling Moment
remember_this text
prompt        text
is_free       boolean not null default false
```

Its select policy hands a row to a subscriber, or to anyone when `is_free`.

## What the app can do once the text is loaded

Replace the "coming soon" card in `openStory()` with the real story, read the
same way the website reads it:

```js
const { data } = await sb
  .from('story_texts')
  .select('id,story,fork,remember_this,prompt')
  .eq('id', id).limit(1);
```

No row back means not allowed — show the teaser and the subscribe prompt, the
way it does now. **The gate is Postgres. Do not add a plan check in the app and
call that the paywall.**

### ⚠️ The one thing that will bite you

`story` is **jsonb — an array of paragraphs**, so the client hands back a real
JavaScript array. `String(["a","b"])` is `"a,b"`, so treating it as a string
runs the whole story into one comma-spliced paragraph. The website had exactly
that bug; it is fixed in `js/lst-bedtime.js` and worth copying:

```js
var list = Array.isArray(t) ? t : String(t == null ? "" : t).split(/\n\s*\n/);
```

The other three columns are plain text.

## Also worth a look while you are in there

The app's demo checkout (`startCheckout` in `www/index.html`) still shows
**$10.99 / $98.91**. The real prices are **$6.99 / $49**, and Levi's Payhip
links changed to the plan shape:

```
monthly  https://payhip.com/order?link=1MNVZ&pricing_plan=PAWg3bbPWK
yearly   https://payhip.com/order?link=1MNVZ&pricing_plan=91zw8xxyBL
```

Nobody is charged by that demo screen, so it is not urgent — but a beta tester
reading $98.91 will believe it.

*Nothing in the app was changed to write this. The website chat only read it.*
