/* THE LST LIBRARY — everything we have made, on one shelf.

   Six collections, laid out the way a library is: covers you look along and
   pick from.

     Bedtime Stories            the written series, all of it
     Picture Books              every night's illustrated story
     The Signature Lullaby      A Little Travelers' Lullaby, always there
     Daily Lullabies            every night's own lullaby
     The Lantern Archive        every Morning Lantern we have sent
     Coloring Books             every night's picture to color (Levi, 9 Oct 2026: "under the
                                LST LIBRARY"); coloring-books.html, from the web app's copy

   WHY THIS IS THE HUB. The header used to carry four doors that all sounded
   like collections of stories — LST Library, Bedtime Stories, Virtue Library,
   The Lantern Archive — and a family arriving for the first time could not
   tell which to open. The browsing ones live here now, as shelves. What is
   left in the header is one door per VERB: read tonight's, browse everything,
   find what I need, keep our own, write, explore.

   The Virtue Library deliberately did NOT move here. It is not another shelf;
   it is the only place that answers "my child is frightened tonight, what do
   I read?" — a different question, so a different door.

   NOTHING HERE IS KEPT BY HAND. The shelves are built from `daily_content`,
   the same table The Morning Lantern is published into. Publish a night in
   the app and its book and its lullaby are on these shelves the moment the
   page is next opened — there is no second list to remember to update, and
   so no second list to fall behind.

   How it knows what a night carries without downloading it: it asks Postgres
   for the DATES where `book_html is not null`, and again for `song_html`.
   That comes back as a few hundred bytes. The books themselves are megabytes
   of pictures and are fetched only when somebody opens one.

   The Signature Lullaby is the exception, because it belongs to no night. Its
   words are in data/lantern-lullaby.js.

   Mount with: LSTLibrary.mount("lst-library")
*/
(function () {
  var root = null;
  var view = "hub";            /* hub | books | lullabies */
  var books = null, songs = null;
  var loading = false, loadError = "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function auth() { return window.LSTAuth; }
  function signedIn() { return !!(auth() && auth().signedIn()); }

  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  function prettyDate(d) {
    if (!d) return "";
    var p = String(d).split("-");
    if (p.length !== 3) return d;
    return parseInt(p[2], 10) + " " + (MONTHS[parseInt(p[1], 10) - 1] || p[1]) + " " + p[0];
  }
  function shortDate(d) {
    var p = String(d || "").split("-");
    if (p.length !== 3) return "";
    return parseInt(p[2], 10) + " " + (MONTHS[parseInt(p[1], 10) - 1] || "").slice(0, 3);
  }

  /* The cover a night's tile wears. A night knows its book number, and the
     books have covers already; anything we have no cover for still gets a
     tile that opens. */
  var BOOK_ART = { 6: "images/book-cover-june.jpg", 7: "images/book-cover-july.jpg",
                   8: "images/book-cover-august.jpg",
                   9: "images/book-cover-september.jpg",
                   10: "images/book-cover-october.jpg",
                   11: "images/book-cover-november.jpg" };
  function artFor(n) { return BOOK_ART[n && n.book] || "images/cover-ot.jpg"; }

  function load() {
    if (!signedIn() || !window.LSTData) { books = []; songs = []; return Promise.resolve(); }
    loading = true;
    return Promise.all([
      window.LSTData.archive.nightsWith("book_html"),
      window.LSTData.archive.nightsWith("song_html")
    ]).then(function (r) {
      loading = false; loadError = "";
      books = r[0]; songs = r[1];
    }).catch(function (e) {
      loading = false; books = []; songs = [];
      loadError = (e && e.message) || "We couldn't open the library.";
    });
  }

  /* ------------------------------------------------------------------ hub */
  function hubView() {
    var nBooks = books ? books.length : 0;
    var nSongs = (songs ? songs.length : 0) + storySongs().length;
    var series = (window.LST_LIBRARY && window.LST_LIBRARY.stories || []).length;

    function tile(go, href, art, title, sub, glyph) {
      var attrs = href ? ('href="' + esc(href) + '"') : ('type="button" data-go="' + go + '"');
      var tag = href ? "a" : "button";
      return "<" + tag + ' class="bs-cover lb-big" ' + attrs + ">" +
        '<span class="bs-cover-art"' + (art ? ' style="background-image:url(' + esc(art) + ')"' : ' data-glyph="1"') + ">" +
          (art ? "" : (glyph || "")) + "</span>" +
        '<span class="bs-label">' + title + "</span>" +
        '<span class="bs-sub">' + sub + "</span>" +
      "</" + tag + ">";
    }

    return '<div class="bs-shelfrow lb-hub">' +
      tile(null, "bedtime-stories.html", "images/book-cover-june.jpg",
        "Bedtime Stories",
        (series ? series + " stories" : "The written series") + " &middot; the whole series") +
      tile("books", null, books && books.length ? artFor(books[0]) : "images/cover-ot.jpg",
        "Picture Books",
        signedIn()
          ? (nBooks + (nBooks === 1 ? " illustrated night" : " illustrated nights"))
          : "Every night&rsquo;s illustrated story") +
      tile(null, "lullaby.html?which=lantern", "images/lullaby-sheet.jpg",
        "The Signature Lantern Lullaby",
        "A Little Travelers&rsquo; Lullaby &middot; always here") +
      tile("lullabies", null, "images/sky-star.jpg",
        "Lullabies",
        signedIn()
          ? (nSongs + (nSongs === 1 ? " lullaby" : " lullabies"))
          : "One for every story and every night") +
      tile(null, "archive.html", "images/hero-bg.jpg",
        "The Lantern Archive",
        "Every Morning Lantern we have sent") +
      tile(null, "coloring-books.html", "https://app.littlescripturetravelers.com/coloring/jun-01-1.png",
        "Coloring Books",
        "Every night&rsquo;s picture to color &middot; or print") +
    "</div>" +
    '<p class="rd-aside">These shelves fill themselves. Publish a night in the app and its story ' +
      'and its lullaby are here straight away. Looking for a story by what your child needs ' +
      'tonight instead? That is <a href="virtue-library.html">the Virtue Library</a>.</p>';
  }

  /* --------------------------------------------------------------- shelves */
  function nightTile(n, where) {
    var art = artFor(n);
    var stamp = (n.week ? n.week : "?") + "&middot;" + (n.night ? n.night : "?");
    return '<a class="bs-tile" href="' + where + "?date=" + encodeURIComponent(n.date) + '">' +
      '<span class="bs-art" style="background-image:url(' + esc(art) + ')">' +
        '<span class="bs-stamp">' + stamp + "</span>" +
        '<span class="bs-when">' + esc(shortDate(n.date)) + "</span>" +
      "</span>" +
      '<span class="bs-label">' + esc(n.title || "Untitled") + "</span>" +
      '<span class="bs-sub">' + esc(n.scripture || prettyDate(n.date)) + "</span>" +
    "</a>";
  }

  /* THE STORY LULLABIES. One song for every story in the books, June onward,
     written and sung on the website (lantern/<key>/) and listed in
     data/story-lullabies.js by lantern/build_story_lullabies.py. They sit on
     the one lullabies shelf with the nightly songs, book by book: a book's
     stories in story order, then its nights by date. */
  function storySongs() { return window.LST_STORY_SONGS || []; }
  function storySongTile(s) {
    var art = BOOK_ART[s.bookNo] || "images/cover-ot.jpg";
    var href = "lantern/" + encodeURIComponent(s.key) + "/" + encodeURIComponent(s.key) + "-lullaby.html";
    return '<a class="bs-tile" href="' + href + '">' +
      '<span class="bs-art" style="background-image:url(' + esc(art) + ')">' +
        '<span class="bs-stamp">' + esc("Story " + s.n) + "</span>" +
        (s.sung ? "" : '<span class="bs-when">words</span>') +
      "</span>" +
      '<span class="bs-label">' + esc(s.title) + "</span>" +
      '<span class="bs-sub">' + esc(s.story) + "</span>" +
    "</a>";
  }
  var BOOK_NAMES = { 6: "June", 7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December" };
  var BOOK_TITLES = { 6: "A Heart That Follows the Lord", 7: "There Is a Prophet in Israel",
                      8: "I Will Trust and Sing", 9: "Wonderful Is His Way", 10: "He Gathers the Lambs",
                      11: "Morning by Morning" };
  function bookOfNight(n) {
    if (n.book) return Number(n.book);
    var p = String(n.date || "").split("-");
    return p.length === 3 ? parseInt(p[1], 10) : 0;
  }
  function lullabyShelves() {
    var books = {};
    function shelf(no) {
      if (!books[no]) books[no] = { no: no, stories: [], nights: [] };
      return books[no];
    }
    storySongs().forEach(function (s) { shelf(s.bookNo).stories.push(s); });
    (songs || []).forEach(function (n) { shelf(bookOfNight(n)).nights.push(n); });
    return Object.keys(books).map(function (k) { return books[k]; })
      .sort(function (a, b) { return b.no - a.no; })
      .map(function (g) {
        g.stories.sort(function (a, b) { return a.n - b.n; });
        g.nights.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
        var name = BOOK_NAMES[g.no] ? "The " + BOOK_NAMES[g.no] + " Book" : "More songs";
        return '<h3 class="lb-shelf">' + esc(name) +
          (BOOK_TITLES[g.no] ? ' <span>&middot; ' + esc(BOOK_TITLES[g.no]) + "</span>" : "") + "</h3>" +
          '<div class="bs-grid">' + g.stories.map(storySongTile).join("") +
          g.nights.map(function (n) { return nightTile(n, "lullaby.html"); }).join("") + "</div>";
      }).join("");
  }

  function shelfView(kind) {
    var rows = kind === "books" ? books : songs;
    var where = kind === "books" ? "story.html" : "lullaby.html";
    var name = kind === "books" ? "Picture Books" : "Lullabies";
    var blurb = kind === "books"
      ? "Every night&rsquo;s illustrated story, newest first. Each one opens on its own page."
      : "A lullaby for every story and every night &mdash; the music and the words to sing, book by book. " +
        "A tile marked <i>words</i> has its words up and its recording on the way.";

    var head =
      '<div class="lb-head">' +
        '<button type="button" class="rd-tool" data-go="hub">&larr; The LST Library</button>' +
        "<h2>" + name + "</h2>" +
        "<p>" + blurb + "</p>" +
      "</div>";

    if (loading) return head + '<p class="mp-note">Opening the shelf&hellip;</p>';
    if (loadError) return head + '<p class="mp-note mp-note-warn">' + esc(loadError) + "</p>";

    if (kind === "lullabies" && storySongs().length) return head + lullabyShelves();
    if (!rows || !rows.length) {
      return head +
        '<div class="mp-empty"><h3>Nothing on this shelf yet</h3>' +
        "<p>" + (kind === "books"
          ? "A picture book arrives with a night once one has been published with it."
          : "A lullaby arrives with a night once one has been published with it.") +
        (kind === "lullabies"
          ? ' In the meantime there is always <a href="lullaby.html?which=lantern">' +
            "A Little Travelers&rsquo; Lullaby</a>." : "") +
        "</p></div>";
    }

    return head + '<div class="bs-grid">' +
      rows.map(function (n) { return nightTile(n, where); }).join("") + "</div>";
  }

  function signedOutView() {
    return '' +
      '<div class="mp-empty">' +
        '<div class="mp-empty-i">&#128218;</div>' +
        "<h3>The LST Library opens with a subscription</h3>" +
        "<p>Every picture book and every lullaby we have sent, gathered on one shelf and kept. Your first seven days are free.</p>" +
        '<a class="mp-btn mp-btn-gold" href="subscribe.html#plans" style="text-decoration:none;display:inline-block;" onclick="return openTrialSignup(\'monthly\')">' + (window.LST_FREE_FOR_NOW ? "Create a free account" : "Start the free week") + '</a>' +
        '<p class="mp-note" style="padding:.9rem 0 0;font-size:.9rem;">' + (window.LST_FREE_FOR_NOW ? "Already have an account? " : "Already a subscriber? ") +
          '<button type="button" class="mp-link" id="lb-signin">Sign in</button></p>' +
        '<p class="mp-note" style="padding:.4rem 0 0;font-size:.9rem;">' +
          'Read one first &mdash; <a href="sample.html">a whole bedtime story, free</a>.</p>' +
      "</div>";
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    if (!root) return;

    if (!signedIn()) {
      root.innerHTML = hubView() + signedOutView();
      wire();
      var si = document.getElementById("lb-signin");
      if (si) si.addEventListener("click", function () {
        auth().openSignIn("Sign in to open the LST Library.");
      });
      return;
    }

    root.innerHTML = (view === "hub") ? hubView() : shelfView(view);
    wire();
  }

  function wire() {
    root.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () {
        var to = this.getAttribute("data-go");
        if (to === "lantern") { location.href = "lullaby.html?which=lantern"; return; }
        if (!signedIn() && to !== "hub") {
          auth().openSignIn("Sign in to open the LST Library.");
          return;
        }
        view = to;
        render();
        window.scrollTo({ top: root.offsetTop - 90, behavior: "smooth" });
      });
    });
  }

  window.LSTLibrary = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root || !auth()) return;
      auth().ready(function () {
        render();
        if (signedIn()) load().then(render);
      });
      auth().onChange(function () {
        view = "hub"; books = null; songs = null;
        render();
        if (signedIn()) load().then(render);
      });
    }
  };
})();
