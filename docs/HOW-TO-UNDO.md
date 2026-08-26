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

## Named restore points

These are moments deliberately marked as "the site was fine here". Claude can
return to any of them exactly.

| Name | What the site was like |
|---|---|
| `before-lullaby-player` | Before the lullaby music, the repeat and sleep timer, and the second landing page. Prices were already $6.99/$49; the sample night was already live. |

More get added as we go. Ask for one any time — *"mark this as a good point"* —
and it becomes a place you can always come back to.

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

The restore points are git tags in this repository. `git tag -l` lists them.
To return the working tree to one without losing what came after:

```
git checkout <tag> -- .        # bring those files back as a new change
```

Prefer that over `git reset --hard`, which throws away history Levi may still
want. Always tell him plainly what was put back and what was kept.
