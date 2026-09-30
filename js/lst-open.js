/* ONE PIECE OF THE NIGHT, ON ITS OWN PAGE.

   The Morning Lantern lists the night's resources the way the app does, and each
   one opens a page of its own:

     story.html?date=YYYY-MM-DD      the picture book
     lullaby.html?date=YYYY-MM-DD    that night's lullaby
     lullaby.html?which=lantern      A Little Travelers' Lullaby, the signature
                                     one, which belongs to no single night

   With no date, both show tonight. The content is read out of the same
   database row the app reads, through js/lst-read.js, so a page opened here
   is the same night the phone has.

   The Lantern lullaby is the one exception: it is not tied to a night, so it
   comes from data/lantern-lullaby.js. It is public — a lullaby to sing is not
   something to lock away — while a night's own story and lullaby need a
   subscription, because the database will not hand them over otherwise.

   Mount with: LSTOpen.mount("lst-open", "book" | "song")
*/
(function () {
  var root = null, kind = "book", night = null, loaded = false, loadError = "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function auth() { return window.LSTAuth; }
  function param(k) {
    try { return new URLSearchParams(location.search).get(k) || ""; } catch (e) { return ""; }
  }
  function wantsLantern() { return /lantern/i.test(param("which")); }

  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  function prettyDate(d) {
    if (!d) return "";
    var p = String(d).split("-");
    if (p.length !== 3) return d;
    return parseInt(p[2], 10) + " " + (MONTHS[parseInt(p[1], 10) - 1] || p[1]) + " " + p[0];
  }

  /* Text size, the same setting The Morning Lantern keeps — set it once and it
     holds wherever you read. */
  var SIZES = [0.92, 1, 1.12, 1.28, 1.45];
  var sizeIx = 1;
  try {
    var kept = parseInt(localStorage.getItem("lst:read:size"), 10);
    if (kept >= 0 && kept < SIZES.length) sizeIx = kept;
  } catch (e) {}
  function applySize() {
    if (!root) return;
    var box = root.querySelector(".rd");
    if (box) box.style.setProperty("--rd-size", (1.06 * SIZES[sizeIx]).toFixed(3) + "rem");
    try { localStorage.setItem("lst:read:size", String(sizeIx)); } catch (e) {}
  }

  function load() {
    if (wantsLantern()) { loaded = true; return Promise.resolve(); }
    if (!window.LSTData || !auth() || !auth().signedIn()) {
      night = null; loaded = true; return Promise.resolve();
    }
    var date = param("date");
    var get = date ? window.LSTData.archive.full(date) : window.LSTData.archive.tonight();
    return get.then(function (n) { loaded = true; loadError = ""; night = n; })
      .catch(function (e) {
        loaded = true; night = null;
        loadError = (e && e.message) || "We couldn't open that.";
      });
  }

  /* ----------------------------------------------------------------- views */
  function toolsView() {
    return '' +
      '<div class="rd-tools">' +
        '<a class="rd-tool" href="tonight.html" style="text-decoration:none;">&larr; The Morning Lantern</a>' +
        '<span class="rd-tool-lbl" style="margin-left:.6rem;">Text size</span>' +
        '<button type="button" class="rd-tool" id="o-smaller" aria-label="Smaller text">&minus;</button>' +
        '<button type="button" class="rd-tool" id="o-bigger" aria-label="Bigger text">A+</button>' +
      "</div>";
  }

  function signedOutView() {
    var what = kind === "song" ? "lullaby" : "story";
    return '' +
      '<div class="mp-empty">' +
        '<div class="mp-empty-i">' + (kind === "song" ? "&#127925;" : "&#128214;") + "</div>" +
        "<h3>Sign in to open tonight&rsquo;s " + what + "</h3>" +
        "<p>It comes with The Lantern, and the first seven days are free.</p>" +
        '<button type="button" class="mp-btn mp-btn-gold" id="o-signin">Sign in</button>' +
        (kind === "song"
          ? '<p class="mp-note" style="padding:.9rem 0 0;font-size:.9rem;">' +
            'A Little Travelers&rsquo; Lullaby comes with a subscription too.</p>'
          : "") +
      "</div>";
  }

  function emptyView() {
    return '' +
      '<div class="mp-empty">' +
        "<h3>Nothing to open here</h3>" +
        "<p>Either this night hasn&rsquo;t been published, or this account&rsquo;s subscription isn&rsquo;t open.</p>" +
        '<a class="mp-btn mp-btn-gold" href="tonight.html" style="text-decoration:none;display:inline-block;">Back to The Morning Lantern</a>' +
      "</div>";
  }

  function head(title, sub) {
    return "<h2 style=\"font-family: var(--font-display);font-weight:600;color:var(--ink);" +
      "font-size:clamp(1.5rem,4.4vw,2.15rem);margin:0 0 .5rem;line-height:1.2;\">" +
      esc(title) + "</h2>" +
      (sub ? '<p class="mp-meta">' + esc(sub) + "</p>" : "");
  }

  function lanternView() {
    var data = window.LST_LANTERN_LULLABY;
    if (!data) return '<p class="mp-note">The lullaby didn&rsquo;t load. Please refresh.</p>';
    /* The reader takes a page and finds the object in it; here the object is
       already to hand, so it is handed over as the same shape a page would
       have carried. */
    var l = window.LSTRead.song("LULLABY = " + JSON.stringify(data));
    if (!l.ok) return '<p class="mp-note">The lullaby didn&rsquo;t load. Please refresh.</p>';
    var track = (data.song && data.song.url) || "";
    return '<div class="rd">' + toolsView() +
      '<div class="rd-body">' +
        head(l.title || "A Little Travelers&rsquo; Lullaby", "") +
        (l.subtitle ? '<p style="color:var(--ink-62);font-style:italic;margin:0 0 1.4rem;line-height:1.7;">' +
          esc(l.subtitle) + "</p>" : "") +
        (track ? '<div id="lst-player"></div>' : "") +
        (l.jump || "") + l.html +
      "</div></div>";
  }

  function songView(n) {
    var l = (n.songHtml && window.LSTRead) ? window.LSTRead.song(n.songHtml) : { ok: false };
    if (!l.ok && !n.songAudio) {
      return '<div class="mp-empty"><h3>No lullaby for this night</h3>' +
        '<p>Sing <a href="lullaby.html?which=lantern">A Little Travelers&rsquo; Lullaby</a> instead &mdash; it fits any night.</p></div>';
    }
    return '<div class="rd">' + toolsView() +
      '<div class="rd-body">' +
        head(l.title || n.title || "Tonight&rsquo;s lullaby", prettyDate(n.date)) +
        (l.subtitle ? '<p style="color:var(--ink-62);font-style:italic;margin:0 0 1.4rem;line-height:1.7;">' +
          esc(l.subtitle) + "</p>" : "") +
        (n.songAudio ? '<div id="lst-player"></div>' : "") +
        (l.jump || "") + (l.html || "") +
        '<p class="rd-aside">Or sing <a href="lullaby.html?which=lantern">A Little Travelers&rsquo; Lullaby</a>, the one that fits any night.</p>' +
      "</div></div>";
  }

  /* A night of a month's book, on a page of its own.

       story.html?id=b6-w1-n7

     The nightly picture book comes out of the database; these come out of
     data/book-*.js, which tools/extract-book.py wrote from the app's own
     pages. Different source, SAME reader — so a night of the June book is set
     in the same type, on the same page, as tonight's story. */
  var wantedId = (function () {
    var m = String(window.location.search || "").match(/[?&]id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  })();
  var shelfNight = null, shelfAsked = false;

  function catalogEntry(id) {
    var all = (window.LST_LIBRARY && window.LST_LIBRARY.stories) || [];
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  /* ------------------------------------------------- THE SHUT DOOR
     What a family sees when the database will not give them the story.

     A wall persuades nobody. This is built to do the persuading instead, and
     everything on it is public — the cover, the taster the catalog already
     carries, and a whole story given away elsewhere. Not one word of THIS
     story is here; there is nothing to leak, because nothing arrived.

     The order is deliberate:
       the book it is       — the cover, so it looks like something real
       a taste              — the opening, in the catalog already
       the cut              — said plainly, not hidden
       proof                — a WHOLE story, free, no sign-up. The strongest
                              thing we have: "don't take our word for it"
       what it costs        — and that the first week is not charged
       the way out          — cancelling in two clicks, said before they ask
       the quiet door       — already a subscriber? sign in
  */
  function coverOf(id) {
    return (window.LST_BOOK_COVERS || {})[id] || "";
  }

  function shelfLockedView(id) {
    var c = catalogEntry(id) || {};
    var art = coverOf(id);
    var count = ((window.LST_LIBRARY && window.LST_LIBRARY.stories) || []).length;
    return '<div class="lk">' +
      (art ? '<img class="lk-cover" src="' + esc(art) + '" alt="" loading="lazy">' : "") +
      '<div class="lk-in">' +
        (c.bookTitle ? '<p class="lk-eyebrow">' + esc(c.bookTitle) +
          (c.week ? " &middot; Week " + esc(c.week) + ", Night " + esc(c.night) : "") + "</p>" : "") +
        "<h2>" + esc(c.title || "This story") + "</h2>" +
        (c.scripture ? '<p class="lk-ref">' +
          ((window.LSTRefs) ? window.LSTRefs.text(c.scripture) : esc(c.scripture)) + "</p>" : "") +
        (c.teaser ? '<p class="lk-taste">' + esc(c.teaser) + "</p>" : "") +
        '<p class="lk-cut">The rest of it &mdash; and the pictures that go with it &mdash; ' +
          "comes with The Lantern.</p>" +

        '<div class="lk-proof">' +
          "<h3>Don&rsquo;t take our word for it. Read one.</h3>" +
          "<p>A whole night, free, with nothing to join &mdash; the pictures, the words, and " +
          "something to do together at the end.</p>" +
          '<a class="lk-read" href="sample.html">Read a whole story now &rarr;</a>' +
        "</div>" +

        '<ul class="lk-list">' +
          "<li><b>" + count + " stories</b> to read whenever you like</li>" +
          "<li><b>A new one every night</b>, waiting by 5&nbsp;AM Mountain</li>" +
          "<li>A lullaby to sing afterwards, with a sleep timer</li>" +
          "<li>Your family&rsquo;s own stories, kept alongside them</li>" +
        "</ul>" +

        '<a class="mp-btn mp-btn-gold lk-go" href="subscribe.html#plans" ' +
          'onclick="return openTrialSignup()">' + (window.LST_FREE_FOR_NOW ? "Create a free account" : "Start the free week") + '</a>' +
        '<p class="lk-fine">Your first seven days are free. ' +
          'Cancel any time in two clicks &mdash; <a href="cancel.html">here is how</a>.</p>' +
        '<p class="lk-fine">' + (window.LST_FREE_FOR_NOW ? "Already have an account? " : "Already a subscriber? ") +
          '<button type="button" class="mp-link" id="o-signin">Sign in</button></p>' +
      "</div></div>";
  }

  function dressFromCatalog(id) {
    var c = catalogEntry(id) || {};
    if (!c.title) return;
    document.title = c.title + " \u2014 Little Scripture Travelers";
    var h1 = document.querySelector(".mp-hero h1");
    if (h1) h1.textContent = c.title;
    var eye = document.querySelector(".mp-hero .mp-eyebrow");
    if (eye && c.bookTitle) eye.textContent = "\uD83D\uDCD6 " + String(c.bookTitle).toUpperCase();
    var sub = document.querySelector(".mp-hero p");
    if (sub) sub.textContent = c.teachingNote ||
      "One of the bedtime stories, with its pictures, laid out to read straight down the page.";
  }

  function dressForShelf(n) {
    var c = catalogEntry(n.id) || {};
    var title = n.title || c.title || "";
    if (!title) return;
    var plain = window.LSTRead ? window.LSTRead.decode(title) : title;
    document.title = plain + " \u2014 Little Scripture Travelers";
    var h1 = document.querySelector(".mp-hero h1");
    if (h1) h1.textContent = plain;
    var eye = document.querySelector(".mp-hero .mp-eyebrow");
    if (eye && c.bookTitle) eye.textContent = "\uD83D\uDCD6 " + String(c.bookTitle).toUpperCase();
    var sub = document.querySelector(".mp-hero p");
    if (sub) sub.textContent = c.teaser
      ? String(c.teaser)
      : "One of the bedtime stories, with its pictures, laid out to read straight down the page.";
  }

  function shelfNightView(n) {
    var told = window.LSTRead ? window.LSTRead.beats(n) : { ok: false };
    if (!told.ok) {
      return '<div class="mp-empty"><h3>That story isn&rsquo;t here</h3>' +
        '<p>Look along the shelf in <a href="bedtime-stories.html">Bedtime Stories</a>.</p></div>';
    }
    var c = catalogEntry(n.id) || {};
    var ref = function (t) { return (window.LSTRefs && t) ? window.LSTRefs.text(t) : esc(t); };
    var stamp = [c.bookTitle, n.night, c.scripture || n.reference].filter(Boolean).map(ref).join(" &middot; ");
    return '<div class="rd">' + toolsView() +
      '<div class="rd-body">' +
        head(told.title || c.title || "A bedtime story", "") +
        (stamp ? '<p class="mp-meta">' + stamp + "</p>" : "") +
        '<div style="margin-top:1.6rem;">' + told.html + "</div>" +
        (c.teachingNote
          ? '<div class="rd-card"><h3 class="rd-label">When to reach for this one</h3><p>' +
            esc(c.teachingNote) + "</p></div>" : "") +
        '<div id="sf-host"></div>' +
        '<p class="rd-aside">Back to the shelf in ' +
          '<a href="bedtime-stories.html">Bedtime Stories</a>.</p>' +
      "</div></div>";
  }

  function bookView(n) {
    var b = (n.bookHtml && window.LSTRead) ? window.LSTRead.book(n.bookHtml) : { ok: false };
    if (!b.ok) {
      return '<div class="mp-empty"><h3>No picture book for this night</h3>' +
        '<p>Tonight&rsquo;s reading is on <a href="tonight.html">The Morning Lantern</a>.</p></div>';
    }
    var stamp = [b.night, b.reference].filter(Boolean).map(esc).join(" &middot; ");
    return '<div class="rd">' + toolsView() +
      '<div class="rd-body">' +
        head(b.title || n.title || "Tonight&rsquo;s story", prettyDate(n.date)) +
        (stamp ? '<p class="mp-meta">' + stamp + "</p>" : "") +
        '<div style="margin-top:1.6rem;">' + b.html + "</div>" +
      "</div></div>";
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    if (!root) return;

    if (wantsLantern()) { root.innerHTML = lanternView(); wire(); return; }

    if (wantedId) {
      /* The database decides. Until it answers, say so; when it answers with
         nothing, this reader is not allowed the story and the words never
         reached the page to begin with. */
      if (!shelfAsked) { root.innerHTML = '<p class="mp-note">Opening&hellip;</p>'; return; }
      if (!shelfNight) {
        root.innerHTML = shelfLockedView(wantedId);
        /* Name the page even when the story is shut. A visitor who lands here
           from a search should see the story's name, not "Tonight's Story". */
        dressFromCatalog(wantedId);
        wire();
        return;
      }
      root.innerHTML = shelfNightView(shelfNight);
      /* the virtues, the family's own memories, and the book it is printed in */
      if (window.LSTStoryFoot) {
        window.LSTStoryFoot.mount(document.getElementById("sf-host"),
                                  catalogEntry(shelfNight.id) || {});
      }
      /* The page's own hero says "Tonight's Story", which this is not. A story
         opened by name should be named, in the tab and at the top. */
      dressForShelf(shelfNight);
      wire();
      return;
    }

    if (!auth() || !auth().signedIn()) {
      root.innerHTML = signedOutView();
      var si = document.getElementById("o-signin");
      if (si) si.addEventListener("click", function () {
        auth().openSignIn("Sign in to open tonight's story.");
      });
      return;
    }
    if (!loaded) { root.innerHTML = '<p class="mp-note">Opening&hellip;</p>'; return; }
    if (loadError) { root.innerHTML = '<p class="mp-note mp-note-warn">' + esc(loadError) + "</p>"; return; }
    if (!night) { root.innerHTML = emptyView(); return; }

    root.innerHTML = kind === "song" ? songView(night) : bookView(night);
    wire();
  }

  /* The player is built after the page is drawn, because it needs its own
     element to exist first. Repeat and the sleep timer live in it. */
  function wirePlayer() {
    var host = document.getElementById("lst-player");
    if (!host || !window.LSTPlayer) return;

    if (wantsLantern()) {
      var d = window.LST_LANTERN_LULLABY || {};
      var url = (d.song && d.song.url) || "";
      if (url) window.LSTPlayer.mount(host, { src: url, title: d.title || "A Little Travelers' Lullaby" });
      return;
    }
    if (night && night.songAudio) {
      window.LSTPlayer.mount(host, {
        src: night.songAudio,
        title: night.title ? night.title + " — tonight's lullaby" : "Tonight's lullaby"
      });
    }
  }

  function wire() {
    applySize();
    wirePlayer();
    var small = document.getElementById("o-smaller");
    if (small) small.addEventListener("click", function () {
      if (sizeIx > 0) { sizeIx--; applySize(); }
    });
    var big = document.getElementById("o-bigger");
    if (big) big.addEventListener("click", function () {
      if (sizeIx < SIZES.length - 1) { sizeIx++; applySize(); }
    });
  }

  window.LSTOpen = {
    mount: function (elm, which) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      kind = which === "song" ? "song" : "book";
      if (!root) return;
      if (wantsLantern()) { render(); return; }
      if (wantedId) {
        var ask = function () {
          shelfAsked = false; shelfNight = null; render();
          var go = (window.LSTData && window.LSTData.bookNights)
            ? window.LSTData.bookNights.one(wantedId) : Promise.resolve(null);
          go.then(function (n) {
            shelfNight = (n && n.beats && n.beats.length) ? n : null;
            shelfAsked = true;
            render();
          });
        };
        if (auth()) { auth().ready(ask); auth().onChange(ask); } else { shelfAsked = true; render(); }
        return;
      }
      if (!auth()) return;
      auth().ready(function () {
        if (auth().signedIn()) load().then(render); else render();
      });
      auth().onChange(function () {
        loaded = false;
        if (auth().signedIn()) { render(); load().then(render); }
        else { night = null; loaded = true; render(); }
      });
    }
  };
})();
