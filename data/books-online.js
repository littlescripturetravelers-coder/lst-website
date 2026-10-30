/* WHICH BOOKS HAVE BEEN BROUGHT OVER.

   Nothing here is secret: it is a list of book numbers, so the website knows
   whether to offer "read it here" for a story. The WORDS live in `book_nights`
   in Supabase and are handed out by Postgres to subscribers only — see
   sql/book-june.sql and its two siblings.

   This file exists so a visitor who is not signed in still sees the invitation
   on a story that really can be read, rather than a button that goes nowhere
   or no button at all.

   When a new book is brought over: run tools/extract-book.py, then
   tools/book-to-sql.py, run the new sql/book-<month>.sql in Supabase, and add
   its number here.
*/
window.LST_BOOKS_ONLINE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
