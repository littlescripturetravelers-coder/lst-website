# -*- coding: utf-8 -*-
"""Put a month's book behind Postgres.

Levi's instruction (2026-08-26): "I want all the stories to be behind the pay
wall. You should not see them unless you subscribe."

data/book-*.js were ordinary public files — anyone could open one and read all
ninety-one stories. This writes the same nights as SQL so they live in
`book_nights` instead, under the same row-level-security rule that already
guards story_texts: a row is handed to a subscriber, or to anyone for a story
marked free, and to nobody else. The words then never reach a browser that is
not allowed them, whatever the website's JavaScript says.

  python3 tools/book-to-sql.py            -> writes sql/book-<month>.sql per book

One file per book, so no single paste into the Supabase editor is enormous.
"""
import io, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load(month):
    out = subprocess.run(
        ["node", "-e",
         "global.window={};require('%s/data/book-%s.js');"
         "console.log(JSON.stringify(window.LST_BOOK_%s))" % (ROOT, month, month.upper())],
        capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit("could not read data/book-%s.js\n%s" % (month, out.stderr))
    return json.loads(out.stdout)

def q(s):
    """A Postgres string literal. An apostrophe inside must be doubled."""
    return "'" + str(s).replace("'", "''") + "'"

HEAD = """-- =====================================================================
--  %(TITLE)s  —  the words, moved behind the paywall
--
--  WHAT THIS DOES
--  Creates `book_nights` if it is not there yet, and puts %(N)d nights of
--  %(BOOK)s into it. The table carries the same rule as
--  story_texts: Postgres hands a row to a subscriber, or to anyone for a
--  story marked free, and to nobody else.
--
--  HOW TO RUN IT
--    Supabase  ->  SQL Editor  ->  New query  ->  paste  ->  Ctrl+A  ->  Run
--
--  Safe to run more than once: it updates rather than duplicating.
--  Run the three book files in any order.
-- =====================================================================

create table if not exists public.book_nights (
  id         text primary key,   -- the catalog id, e.g. 'b6-w1-n1'
  book       int,
  night      text,               -- "Week 1 · Night 1"
  title      text,
  reference  text,
  beats      jsonb not null,     -- the whole night: pictures, words, moments
  is_free    boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.book_nights enable row level security;

-- The same rule story_texts already uses. Editing the website's JavaScript
-- gets a reader precisely nothing, because the words never leave the database.
drop policy if exists "read book night" on public.book_nights;
create policy "read book night"
  on public.book_nights for select
  to authenticated
  using (is_free or public.lst_is_subscriber());

-- ---------------------------------------------------------------------
--  %(BOOK)s
-- ---------------------------------------------------------------------
"""

def main():
    books = [("june", 6), ("july", 7), ("august", 8)]
    made = []
    for month, num in books:
        nights = load(month)
        title = nights and "" or ""
        # the book's name, from the catalog
        cat = subprocess.run(
            ["node", "-e",
             "global.window={};require('%s/data/virtue-library.js');"
             "var s=(window.LST_LIBRARY.stories||[]).filter(x=>x.book===%d)[0]||{};"
             "console.log(s.bookTitle||'')" % (ROOT, num)],
            capture_output=True, text=True).stdout.strip()
        rows = []
        for n in nights:
            rows.append(
                "insert into public.book_nights (id, book, night, title, reference, beats) values\n"
                "  (%s, %d, %s, %s, %s, %s::jsonb)\n"
                "on conflict (id) do update set\n"
                "  book = excluded.book, night = excluded.night, title = excluded.title,\n"
                "  reference = excluded.reference, beats = excluded.beats, updated_at = now();\n"
                % (q(n["id"]), num, q(n.get("night", "")), q(n.get("title", "")),
                   q(n.get("reference", "")),
                   q(json.dumps(n.get("beats", []), ensure_ascii=False))))
        body = HEAD % {"TITLE": month.title(), "N": len(nights), "BOOK": cat or month.title()}
        body += "\n".join(rows)
        free = subprocess.run(
            ["node", "-e",
             "global.window={};require('%s/data/virtue-library.js');"
             "console.log(((window.LST_LIBRARY.meta||{}).freeStoryIds||[]).join(','))" % ROOT],
            capture_output=True, text=True).stdout.strip()
        ids = ", ".join(q(x) for x in free.split(",") if x)
        body += (
            "\n-- ---------------------------------------------------------------------\n"
            "-- WHICH STORIES ARE FREE\n"
            "-- The same three as meta.freeStoryIds in data/virtue-library.js. Keep the\n"
            "-- two lists the same, or a story is free in one place and not the other.\n"
            "-- ---------------------------------------------------------------------\n"
            + (("update public.book_nights set is_free = (id in (%s));\n" % ids) if ids
               else "update public.book_nights set is_free = false;\n") +
            "\n-- ---------------------------------------------------------------------\n"
            "-- DID IT WORK? Last statement, so this is what the Results panel shows.\n"
            "-- ---------------------------------------------------------------------\n"
            "select book, count(*) as nights,\n"
            "       count(*) filter (where is_free) as \"free ones\"\n"
            "  from public.book_nights group by book order by book;\n")
        p = os.path.join(ROOT, "sql", "book-%s.sql" % month)
        io.open(p, "w", encoding="utf-8").write(body)
        made.append((p, len(nights), os.path.getsize(p)))
    for p, n, sz in made:
        print("%-28s %2d nights  %6.0f KB" % (os.path.relpath(p, ROOT), n, sz / 1024.0))

if __name__ == "__main__":
    main()
