/* THE FIVE EDITIONS OF THE MORNING LANTERN.

   A family says which tradition they belong to when they sign up, and from
   then on the Lantern arrives written in their own voice — which Bible is
   quoted and linked, whose teachers are quoted, the words used for worship.
   The story, the pictures and the lullaby are the same for everyone.

   From Levi's Faith Pack Guide. The ids are what goes in `profiles.faith` and
   `daily_content.faith` — see sql/2026-08-28-faith-editions.sql. CHANGING AN
   ID ORPHANS EVERY FAMILY AND EVERY NIGHT ALREADY CARRYING IT; add, don't
   rename.

   ⚠️ NOBODY IS MADE TO ANSWER. "Prefer not to say" is a real choice, and a
   family who takes it is served the Latter-day Saint edition, which is the one
   that has always existed. Faith is not used for anything else — not pricing,
   not marketing lists, not who may read what.
*/
window.LST_FAITHS = [
  { id: "lds",         name: "Latter-day Saint",
    note: "Come, Follow Me, general conference, the Book of Mormon" },
  { id: "catholic",    name: "Catholic",
    note: "the NABRE, the Holy Father, the saints and the Catechism" },
  { id: "evangelical", name: "Non-denominational / Evangelical",
    note: "the NIV, today's teachers, the gospel" },
  { id: "baptist",     name: "Baptist",
    note: "the CSB or KJV, Spurgeon and the preachers" },
  { id: "methodist",   name: "Methodist / Wesleyan",
    note: "the NRSVue, John and Charles Wesley, the means of grace" }
];

/* What a family gets when they have not said, or preferred not to. */
window.LST_FAITH_DEFAULT = "lds";
