/* THE TWO EDITIONS OF THE MORNING LANTERN.

   A family says which tradition they belong to when they sign up, and from
   then on the Lantern arrives written in their own voice - which Bible is
   quoted and linked, whose teachers are quoted, the words used for worship.
   The story, the pictures and the lullaby are the same for everyone.

   Levi, 1 October 2026: the choice is "The Church of Jesus Christ of
   Latter-day Saints" or "Christian", the same two the app offers, and the
   website matches the app. The ids are what goes in `profiles.faith` - the
   app's own ids, so one account reads the same edition everywhere. CHANGING
   AN ID ORPHANS EVERY FAMILY ALREADY CARRYING IT; add, don't rename. A family
   who chose Catholic, Baptist, Methodist or "evangelical" while there were
   five keeps that word on their profile and is served the Christian edition
   (LST_FAITH_ALIAS).

   ⚠️ NOBODY IS MADE TO ANSWER. "Prefer not to say" is a real choice, and a
   family who takes it is served the Latter-day Saint edition, which is the one
   that has always existed. Faith is not used for anything else - not pricing,
   not marketing lists, not who may read what.
*/
window.LST_FAITHS = [
  { id: "lds",      name: "The Church of Jesus Christ of Latter-day Saints",
    note: "The King James Bible with the Book of Mormon, Doctrine & Covenants and Pearl of Great Price; General Conference" },
  { id: "nondenom", name: "Christian",
    note: "The NIV, today's teachers, and the classic voices of the faith - for every Christian family" }
];

/* Older answers, and the website's old word for the Christian edition. */
window.LST_FAITH_ALIAS = { evangelical: "nondenom", christian: "nondenom", catholic: "nondenom", baptist: "nondenom", methodist: "nondenom" };

/* What a family gets when they have not said, or preferred not to. */
window.LST_FAITH_DEFAULT = "lds";
