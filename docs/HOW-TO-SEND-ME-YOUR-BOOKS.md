# Sending me your books

You asked whether you can upload your books and have every story appear on the
website. Yes. This is the whole job, written down so it is not a mystery.

---

## The short version

Send me the books. Any format — Word, PDF, Google Doc, plain text, or the
files you already write from. One book at a time is fine, or all of them.

I turn each story into two pieces, and they must both exist or the story does
not work properly:

| Piece | Where it goes | Who can read it |
|---|---|---|
| **The card** — title, scripture, virtues, a short teaser | `data/virtue-library.js`, in the website | Everybody |
| **The words** — the story itself, the Feeling Moment, Remember This, the parent prompt | `story_texts` in Supabase | Subscribers only |

The card is what makes a story show up on **Bedtime Stories** *and* in the
**Virtue Library** — one entry, both places. The words are what a family
actually reads, and Postgres decides who gets them, not the website.

---

## What I need in each story

Most of this I can read straight out of your book. Where I can't, I'll ask
rather than guess.

- **Title** — as it appears in the book
- **Scripture reference** — "Ruth 1", "1 Samuel 17"
- **Which book, week and night** — so it sits in the right place on the shelf
- **The story itself** — the words you read aloud
- **The Feeling Moment** (the fork) — if that story has one
- **Remember This** — the closing line
- **The parent prompt** — the question for the grown-up
- **Virtues** — which of the 36 it teaches. If you don't tag them, I'll
  propose tags from the story and you can correct me before anything ships.

---

## What happens then

1. I add the cards to `data/virtue-library.js` and push. The stories appear on
   Bedtime Stories and in the Virtue Library straight away, with their teasers.
2. I write you **one SQL file** with all the story text in it.
3. You paste it into Supabase once, the same way you ran the last one.
4. Every story is readable.

Steps 1 and 2 are mine. Step 3 is about two minutes of yours.

---

## Two things worth knowing before you send

**Nothing needs re-typing.** Send the book as it is. If the formatting is
messy I will deal with it — that is a much smaller job than you re-keying 48
stories.

**Cover art is optional.** Right now a story's tile uses its book's cover, so
every story in a book shares one picture. If you ever want per-story pictures,
send them named by story id (`b6-w1-n1.jpg`) and I'll wire them up. It is a
nice-to-have, not a blocker.

---

## The one thing that would slow this down

Story text pasted into `data/virtue-library.js` instead of Supabase. **That
file is public** — anyone on the internet can read it. It holds titles,
scriptures, virtues and a 40-word teaser, and nothing more, on purpose. The
paywall only works because the words live somewhere Postgres guards.

If a future chat offers to "just put the stories in the data file to make it
simpler", that is the mistake to catch.
