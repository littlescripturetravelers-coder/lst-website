# Putting the 91 stories behind the paywall

**Three files to run in Supabase. Ten minutes, once.**

Until you do this, the stories are not on the website at all — a subscriber
who opens one sees "this comes with The Lantern". That is the safe way round:
nobody can read them for free while you get to it.

---

## Why this is needed

The words used to sit in ordinary website files. Anyone who knew to look could
download one and read all ninety-one stories without paying.

Now they go into your database, under the same rule that already guards the
nightly story: **Postgres hands the words to a subscriber and to nobody else.**
It is not the website being polite. A person who is not subscribing never
receives the words at all, whatever they do to their browser.

---

## Do this three times — once per file

I have sent you three files:

* `book-june.sql`
* `book-july.sql`
* `book-august.sql`

They can be run in any order, and running one twice does no harm.

### The steps

1. Go to **supabase.com** and sign in.
2. Click your project (**rdbvktqgrwhjucocobua**).
3. In the left-hand menu click **SQL Editor**.
4. Click **New query**.
5. Open the file I sent, click inside it, press **Ctrl+A** then **Ctrl+C**
   (on a Mac: **Cmd+A** then **Cmd+C**). That copies the whole thing.
6. Click inside the big empty box in Supabase and press **Ctrl+V**
   (Mac: **Cmd+V**).
7. **Press Ctrl+A inside that box.** This matters — if some of the text is
   highlighted and some is not, Supabase runs only the highlighted part.
8. Click the green **Run** button, bottom right.
9. Wait. A big file takes a few seconds.

### What you should see

A small table at the bottom. After all three files it reads:

| book | nights | free ones |
|---|---|---|
| 6 | 28 | 2 |
| 7 | 28 | 1 |
| 8 | 35 | 0 |

**91 nights in total, and 3 free ones** — the three stories you give away.

If you see red writing instead, copy it and send it to me. Nothing will have
been half-done: Supabase runs the whole file or none of it.

---

## Then check it worked

1. Open your website and **sign in with an account that subscribes**.
2. The LST Library → Bedtime Stories → any story. You should see the whole
   thing, pictures and all.
3. Now open the same page in a **private window**, not signed in. You should
   see the short taster and an invitation to start the free week.

That second one is the real test. Tell me if it shows you the story.

---

## One thing this does not cover

**The pictures are still ordinary files on the website.** Someone who guessed
an address like `littlescripturetravelers.com/images/book/jun-01-1.jpg` would
see that illustration. They would get no story with it, and the same pictures
are in the books you sell on Amazon — but they are not locked.

Locking the pictures too is a bigger job: they would have to move into
Supabase's file storage and be handed out one signed link at a time, which
also makes the pages slower to load. **Say the word and I will do it.** I did
not, because you did not ask for it and it costs speed at bedtime.
