# How to undo anything

Nothing on this website is permanent. Every change ever made is kept, in
order, with a name — so "put it back the way it was" is always available, and
it takes about a minute.

**You do not need to do anything technical.** You just need to tell Claude
what to put back. This file exists so you know that is true, and so you know
what to say.

---

## What to say

Any of these works:

> "Undo the lullaby player, put it back the way it was."

> "Go back to before the price change."

> "The header was better before you shortened it. Change it back."

> "Undo the last thing you did."

You don't have to remember dates, names or numbers. Describing it is enough —
Claude can find it. If you can name the day, that helps; if you can't, don't
worry about it.

---

## Restore points

Every one of these is a moment the site actually existed in, and Claude can
put it back exactly. Newest first. The short code beside each one is how the
change is stored; you never need to type it, but it is what makes this
precise rather than approximate.

| Code | Date | What changed |
|---|---|---|
| `4f8a87f` | 28 Aug | **The Lantern in five editions** — faith asked at signup, changeable on My Account |
| `826b3fe` | 26 Aug | September's book says "coming" instead of showing nothing |
| `2a29ddc` | 26 Aug | **September added (119 stories)**, and every story linked to its virtues, your family's memories and the book |
| `b9d7fb5` | 26 Aug | The locked story became a page built to win subscribers |
| `28a48eb` | 26 Aug | **The 91 stories moved behind Postgres — a real lock** (run the three SQL files) |
| `f369f35` | 26 Aug | Every story on a page of its own &mdash; **and the stories stopped being truly locked** |
| `2f45c75` | 26 Aug | **June and July join August — all 91 stories on the website** — and the Virtue Library links to them |
| `4867157` | 26 Aug | **The August book — all 35 stories with their pictures, reading like the Morning Lantern** |
| `15044e8` | 26 Aug | Story text renders as real paragraphs when it is loaded (nothing visible yet) |
| `e3616ce` | 26 Aug | **The new Payhip checkout links**, and scripture links that follow the family's own front door |
| `645e430` | 26 Aug | Scriptures and conference talks in the Lanterns became clickable links |
| `5f05232` | 26 Aug | The banner explains the move: it was an email at 5 AM, it is the website and app now |
| `61d6459` | 26 Aug | The site stops promising an email each morning — it is the website and the app now |
| `b12cf6a` | 26 Aug | **The Bible landing page, the timeline/lullaby doors, the sell hidden from subscribers — and the reading pass (fonts, contrast, favicon)** |
| `635af0d` | 26 Aug | The lullaby's music, repeat and the sleep timer |
| `5e12396` | 26 Aug | The free sample night, and the logo made 98% smaller |
| `2887f61` | 25 Aug | "Where we're coming from" on Our Story |
| `1700115` | 25 Aug | **Prices to $6.99 / $49, yearly made the default** |
| `1ad9b4a` | 25 Aug | The header cut from eight doors to six |
| `bb07fee` | 25 Aug | The LST Library, and your own delete/retag controls |
| `4145a27` | 25 Aug | Bedtime Stories, and the two renames |
| `420b008` | 25 Aug | The picture book and lullaby taken off the Lantern page |

**To go back to how things were before one of those**, name the row above it.
So *"put the prices back to how they were"* means going back to `471f15c`,
the change immediately before the price change.

Ask for a marker any time — *"mark this as a good point"* — and Claude will
note it here with a name you chose.

---

## Three things worth knowing

**Undoing is safe.** Putting something back does not destroy the newer version.
Both are kept. You can change your mind again, and again, without losing
anything.

**You can undo one thing without undoing everything.** If you like the new
prices but hate the new header, say so. They came in separately and they can
go out separately.

**Some things live outside the website and cannot be undone from here.**

- **Payhip** — prices, products and the free trial. Changing those is done in
  your Payhip account, and undoing them is done there too.
- **Supabase** — anything you ran in the SQL editor. Most of it only adds
  things, so there is usually nothing to undo, but deleting a night with the
  owner's Delete button is permanent. That is why it asks you twice.
- **The app** — a separate conversation and a separate set of files. Undoing
  something on the website does not touch the app, and the other way round.

---

## For whoever is reading this in a future chat

The codes above are commit hashes on `origin/main`. **Tag pushes are blocked
by this environment's git proxy** (`send-pack: unexpected disconnect`), which
is why restore points are recorded here as hashes rather than as git tags —
a local-only tag would vanish when the container is reclaimed. Keep this
table up to date; it is the only durable record.

To return the working tree to one without losing what came after:

```
git checkout <hash> -- .       # bring those files back as a new change
```

Prefer that over `git reset --hard`, which throws away history Levi may still
want. Always tell him plainly what was put back and what was kept.

---

## About `b12cf6a` — it holds two different things

That one code covers both the new pages/doors **and** the reading pass (bigger
"Best value" pill, brand-font fallbacks, brighter footer text, the favicon, the
timeline's era bar at 11px). They went in together.

If you like the new pages but want the reading pass undone — or the other way
round — **say which half and I will take just that half back out.** Don't undo
the whole code for one of them.
