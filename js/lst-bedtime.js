/* BEDTIME STORIES — the shelf.

   The Virtue Library answers "which story do I need tonight?" — you arrive
   knowing a feeling and leave with a story. This is the other way round: the
   books themselves, in order, so you can look along the shelf and pick one.

   Same stories, same catalog, same text. `data/virtue-library.js` holds what
   is public — titles, scriptures, virtues, a teaser. The story itself lives
   in `story_texts` behind a row-level-security policy that hands a row to a
   subscriber, or to anyone for a free story. Nothing here decides that; a
   reader who edits this file still gets nothing back.

   Every story is its own thing to choose. Pick one and it opens on its own,
   with its scripture, what it teaches, and the words to read aloud.

   Mount with: LSTBedtime.mount("lst-bedtime")
*/
(function () {
  var root = null, open = null, text = null, loadingText = false;
  var q = "", book = "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* A scripture reference, turned into a link if js/lst-refs.js is loaded and
     left as plain escaped text if it is not. */
  function sref(s) {
    return (window.LSTRefs && s) ? window.LSTRefs.text(s) : esc(s);
  }
  function auth() { return window.LSTAuth; }
  function lib() { return window.LST_LIBRARY || {}; }
  /* A month's book. The words are in `book_nights` in Supabase, behind the
     same rule as everything else a subscription buys — no reply means not
     allowed, and nothing here can change that. `night` holds whatever the
     database last handed back for the story that is open. */
  var night = null;

  function loadNight(id) {
    if (!window.LSTData || !window.LSTData.bookNights) return Promise.resolve(null);
    return window.LSTData.bookNights.one(id);
  }
  function stories() { return lib().stories || []; }
  function freeIds() { return (lib().meta && lib().meta.freeStoryIds) || []; }
  function isFree(id) { return freeIds().indexOf(id) !== -1; }
  function subscriber() {
    var a = auth();
    return !!(a && a.signedIn() && (a.isSubscriber() || (a.isAdmin && a.isAdmin())));
  }

  function virtueName(id) {
    var vs = lib().virtues || [];
    for (var i = 0; i < vs.length; i++) if (vs[i].id === id) return vs[i].name || vs[i].label || id;
    return id;
  }

  /* The books, in the order they were written. */
  function books() {
    var seen = {}, out = [];
    stories().forEach(function (s) {
      if (s.book == null || seen[s.book]) return;
      seen[s.book] = true;
      out.push({ n: s.book, title: s.bookTitle || ("Book " + s.book), month: s.month || "" });
    });
    return out.sort(function (a, b) { return a.n - b.n; });
  }

  /* A story's place on the shelf, so the order is the reading order. */
  function place(s) {
    return (s.book || 0) * 10000 + (s.week || 0) * 100 + (s.night || 0);
  }

  function shown() {
    var needle = q.trim().toLowerCase();
    return stories().filter(function (s) {
      if (book && String(s.book) !== String(book)) return false;
      if (!needle) return true;
      var hay = [s.title, s.scripture, s.bookTitle, s.teaser,
                 (s.virtues || []).map(virtueName).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(needle) !== -1;
    }).sort(function (a, b) { return place(a) - place(b); });
  }

  /* --------------------------------------------------------------- reading
     The gate is Postgres, not this. No row back means not allowed, and the
     teaser is what a visitor sees instead. */
  function fetchText(id) {
    var c = auth() ? auth().client() : null;
    if (!c) return Promise.resolve(null);
    return c.from("story_texts")
      .select("id,story,fork,remember_this,prompt")
      .eq("id", id).limit(1)
      .then(function (res) {
        if (res.error || !res.data || !res.data.length) return null;
        var r = res.data[0];
        return { story: r.story, fork: r.fork, remember: r.remember_this, prompt: r.prompt };
      })
      .catch(function () { return null; });
  }

  /* `story_texts.story` is jsonb — an ARRAY of paragraphs — so PostgREST hands
     back a real array. The other three columns are plain text. Take either:
     String(["a","b"]) is "a,b", which would run a whole story together into one
     comma-spliced paragraph the first time real text was loaded. */
  function paras(t) {
    var list = Array.isArray(t)
      ? t
      : String(t == null ? "" : t).split(/\n\s*\n/);
    return list
      .map(function (p) { return String(p == null ? "" : p).trim(); })
      .filter(Boolean)
      .map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; })
      .join("");
  }

  /* ----------------------------------------------------------------- views */
  function chips(s) {
    return (s.virtues || []).map(function (v) {
      return '<span class="mp-badge mp-badge-w">' + esc(virtueName(v)) + "</span>";
    }).join("");
  }

  /* The art on a story's tile. Each book has its own cover, so a shelf reads
     as the book it belongs to at a glance. A book we have no cover for yet
     falls back to its volume's, and then to nothing — a tile with no art
     still opens the same story. */
  /* ⚠️ A BOOK WITHOUT AN ENTRY HERE FALLS BACK TO THE VOLUME COVER, and every
     Old Testament book then wears the same generic picture. September was
     missing, so "Wonderful Is His Way" showed "The World's Most Treasured True
     Stories" on the shelf. Add each month as its book is published. */
  var BOOK_ART = {
    january: "images/book-cover-january.jpg",
    february: "images/book-cover-february.jpg",
    march: "images/book-cover-march.jpg",
    april: "images/book-cover-april.jpg",
    may: "images/book-cover-may.jpg",
    june: "images/book-cover-june.jpg",
    july: "images/book-cover-july.jpg",
    august: "images/book-cover-august.jpg",
    september: "images/book-cover-september.jpg",
    october: "images/book-cover-october.jpg",
    november: "images/book-cover-november.jpg",
    december: "images/book-cover-december.jpg"
  };
  var VOLUME_ART = {
    ot: "images/cover-ot.jpg",
    nt: "images/cover-nt.jpg",
    bom: "images/cover-bom.jpg",
    dc: "images/cover-dc.jpg"
  };
  function artFor(s) {
    /* the New Testament year (books 13-24) has its own covers, by month (Levi, 29 Oct 2026) */
    if (String(s.volume || "").toLowerCase() === "nt" && s.month)
      return "images/book-cover-nt-" + String(s.month).toLowerCase() + ".jpg";
    return BOOK_ART[String(s.month || "").toLowerCase()] ||
           VOLUME_ART[String(s.volume || "").toLowerCase()] || "";
  }

  function tileView(s) {
    var art = artFor(s);
    var free = (!subscriber() && isFree(s.id)) ? '<span class="bs-free">Free</span>' : "";
    var stamp = (s.week ? s.week : "?") + "&middot;" + (s.night ? s.night : "?");
    return '' +
      '<a class="bs-tile" href="read.html?id=' + encodeURIComponent(s.id) + '">' +
        '<span class="bs-art"' + (art ? ' style="background-image:url(' + esc(art) + ')"' : "") + ">" +
          '<span class="bs-stamp">' + stamp + "</span>" + free +
        "</span>" +
        '<span class="bs-label">' + esc(s.title || "Untitled") + "</span>" +
        '<span class="bs-sub">' + esc(s.scripture || "") + "</span>" +
      "</a>";
  }

  function shelfView() {
    var list = shown();
    var bs = books();

    /* The books themselves, as covers — the shelf before the stories.

       There is no "All stories" tile any more (Levi, 10 Sep 2026): it was an
       empty box with a book emoji in it, sitting where every other tile shows
       real artwork. Showing every book is still the view the shelf opens on,
       and tapping a chosen cover a second time comes back to it. */
    var covers =
      '<div class="bs-shelfrow">' +
        bs.map(function (b) {
          var one = stories().filter(function (s) { return s.book === b.n; })[0] || {};
          var art = artFor(one);
          var n = stories().filter(function (s) { return s.book === b.n; }).length;
          return '<button type="button" class="bs-cover' + (String(book) === String(b.n) ? " on" : "") +
            '" data-book="' + b.n + '">' +
            '<span class="bs-cover-art"' + (art ? ' style="background-image:url(' + esc(art) + ')"' : "") + "></span>" +
            '<span class="bs-label">' + esc(b.title) + "</span>" +
            '<span class="bs-sub">' + n + " stories" + (b.month ? " &middot; " + esc(b.month) : "") + "</span>" +
            "</button>";
        }).join("") +
      "</div>";

    var head = covers +
      '<div class="bs-bar">' +
        '<input class="mp-in-f bs-search" id="bs-q" placeholder="Search the stories…" value="' + esc(q) + '">' +
        '<span class="bs-count">' + list.length + (list.length === 1 ? " story" : " stories") + "</span>" +
      "</div>";

    if (!list.length) return head + '<p class="mp-note">Nothing matches that.</p>';

    var out = "", lastBook = null;
    list.forEach(function (s) {
      if (s.book !== lastBook) {
        if (lastBook !== null) out += "</div>";
        lastBook = s.book;
        var b = bs.filter(function (x) { return x.n === s.book; })[0] || {};
        out += '<h3 class="bs-shelf">' + esc(b.title || ("Book " + s.book)) +
          (b.month ? ' <span class="bs-month">' + esc(b.month) + "</span>" : "") +
          "</h3>" +
          '<div class="bs-grid">';
      }
      out += tileView(s);
    });
    if (lastBook !== null) out += "</div>";

    return head + out;
  }

  function lockedPitch(s) {
    var art = (window.LST_BOOK_COVERS || {})[s.id] || "";
    var count = stories().length;
    return '<div class="lk">' +
      (art ? '<img class="lk-cover" src="' + esc(art) + '" alt="" loading="lazy">' : "") +
      '<div class="lk-in">' +
        (s.teaser ? '<p class="lk-taste">' + esc(s.teaser) + "</p>" : "") +
        '<p class="lk-cut">The rest of it &mdash; and the pictures that go with it &mdash; ' +
          "comes with The Lantern.</p>" +
        '<div class="lk-proof">' +
          "<h3>Don&rsquo;t take our word for it. Read one.</h3>" +
          "<p>A whole night, free, with nothing to join.</p>" +
          '<a class="lk-read" href="sample.html">Read a whole story now &rarr;</a>' +
        "</div>" +
        '<ul class="lk-list">' +
          "<li><b>" + count + " stories</b> to read whenever you like</li>" +
          "<li><b>A new one every night</b>, waiting by 5&nbsp;AM Mountain</li>" +
          "<li>A lullaby to sing afterwards, with a sleep timer</li>" +
        "</ul>" +
        '<a class="mp-btn mp-btn-gold lk-go" href="subscribe.html#plans" ' +
          'onclick="return openTrialSignup()">' + (window.LST_FREE_FOR_NOW ? "Create a free account" : "Start the free week") + '</a>' +
        '<p class="lk-fine">Your first seven days are free. Cancel any time in two clicks ' +
          '&mdash; <a href="cancel.html">here is how</a>.</p>' +
      "</div></div>";
  }

  function storyView(s) {
    /* The book's own night, if this book has been brought over. It carries the
       whole thing — the story in illustrated turns, the Traveler, the Feeling
       Moment, Remember This and the parent's page — so where it exists it IS
       the story, and `story_texts` is not needed for that night. */
    /* The database decides. If it handed back a night, this reader is allowed
       it; if it handed back nothing, they are not, and there is nothing here
       to hide because the words never arrived. */
    var n = (night && night.id === s.id && window.LSTRead) ? night : null;
    var told = n ? window.LSTRead.beats(n) : null;
    if (told && told.ok) {
      return '<article class="rd">' +
        '<div class="mp-card-head">' +
          '<h3 style="flex:1;">' + esc(s.title || told.title || "Untitled") + "</h3>" +
          '<button type="button" class="mp-icon" id="bs-close" aria-label="Back to the shelf">&#10005;</button>' +
        "</div>" +
        '<p class="mp-meta">' +
          [s.bookTitle, n.night, s.scripture || n.reference].filter(Boolean).map(sref).join(" &middot; ") +
        "</p>" +
        (chips(s) ? '<div style="margin:.6rem 0 1.4rem;">' + chips(s) + "</div>" : "") +
        '<div class="rd-body">' + told.html +
          (s.teachingNote
            ? '<div class="rd-card"><h3 class="rd-label">When to reach for this one</h3><p>' +
              esc(s.teachingNote) + "</p></div>" : "") +
          '<div id="sf-host"></div>' +
          '<p class="rd-aside"><a class="bs-illus" href="read.html?id=' +
            encodeURIComponent(s.id) + '">&#10022; Open this story on its own page</a></p>' +
        "</div>" +
      "</article>";
    }

    var locked = !text || !text.story;
    /* The shut door is a page of its own, and it is built to persuade rather
       than to apologise — see the note beside shelfLockedView in
       js/lst-open.js. Everything on it is public: the cover, the taster the
       catalog carries, and a whole story given away on sample.html. Not one
       word of THIS story is in it. */
    var body = locked
      ? (subscriber()
          ? '<div class="rd-card rd-telling">' +
              (s.teaser ? "<p>" + esc(s.teaser) + "</p>" : "") +
              '<p class="rd-aside">The words of this one haven&rsquo;t been added yet.</p>' +
            "</div>"
          : lockedPitch(s))
      : '<div class="rd-card rd-telling"><h3 class="rd-label">The story</h3>' + paras(text.story) + "</div>" +
        (text.fork ? '<div class="rd-card rd-heart"><h3 class="rd-label">&#10022; The feeling moment</h3>' +
          paras(text.fork) + "</div>" : "") +
        (text.remember ? '<div class="rd-card rd-scripture"><h3 class="rd-label">&#10022; Remember this</h3>' +
          paras(text.remember) + "</div>" : "") +
        (text.prompt ? '<div class="rd-card rd-heart"><h3 class="rd-label">A parent&rsquo;s prompt</h3>' +
          paras(text.prompt) + "</div>" : "");

    return '<article class="rd">' +
      '<div class="mp-card-head">' +
        '<h3 style="flex:1;">' + esc(s.title || "Untitled") + "</h3>" +
        '<button type="button" class="mp-icon" id="bs-close" aria-label="Back to the shelf">&#10005;</button>' +
      "</div>" +
      '<p class="mp-meta">' +
        [s.bookTitle, s.week ? "Week " + s.week : "", s.night ? "Night " + s.night : "", s.scripture]
          .filter(Boolean).map(esc).join(" &middot; ") + "</p>" +
      (chips(s) ? '<div style="margin:.6rem 0 1.4rem;">' + chips(s) + "</div>" : "") +
      '<div class="rd-body">' +
        (loadingText ? '<p class="mp-note">Opening the story&hellip;</p>' : body) +
        (s.teachingNote
          ? '<div class="rd-card"><h3 class="rd-label">When to reach for this one</h3><p>' +
            esc(s.teachingNote) + "</p></div>" : "") +
        '<p class="rd-aside">Look this story up by what it teaches in ' +
          '<a href="virtue-library.html">the Virtue Library</a>.</p>' +
      "</div>" +
    "</article>";
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    if (!root) return;
    if (!stories().length) {
      root.innerHTML = '<p class="mp-note">The story list didn&rsquo;t load. Please refresh.</p>';
      return;
    }

    if (open) {
      root.innerHTML = storyView(open);
      if (window.LSTStoryFoot) window.LSTStoryFoot.mount(document.getElementById("sf-host"), open);
      var c = document.getElementById("bs-close");
      if (c) c.addEventListener("click", function () {
        open = null; text = null; night = null; render();
        window.scrollTo({ top: root.offsetTop - 90, behavior: "smooth" });
      });
      return;
    }

    root.innerHTML = shelfView();

    var qi = document.getElementById("bs-q");
    if (qi) qi.addEventListener("input", function () {
      var at = this.selectionStart;
      q = this.value;
      render();
      var again = document.getElementById("bs-q");
      if (again) { again.focus(); try { again.setSelectionRange(at, at); } catch (e) {} }
    });

    root.querySelectorAll("[data-book]").forEach(function (b) {
      b.addEventListener("click", function () {
        var picked = this.getAttribute("data-book");
        /* Tapping the book you are already in takes you back to all of them.
           With the "All stories" tile gone this is the only way back, so it
           must never be removed without putting something else in its place. */
        book = (String(book) === String(picked)) ? "" : picked;
        render();
      });
    });

    root.querySelectorAll("[data-story]").forEach(function (b) {
      b.addEventListener("click", function () { openStory(this.getAttribute("data-story"), true); });
    });
  }

  /* Opening one story, however the reader got here — a tap on the shelf, or an
     address carrying ?story=, which is how the Virtue Library sends them. */
  function openStory(id, scroll) {
    var found = stories().filter(function (s) { return s.id === id; })[0];
    if (!found) return false;
    book = String(found.book);              /* show the shelf it belongs to */
    open = found; text = null; night = null; loadingText = true;
    render();
    if (scroll && root) window.scrollTo({ top: root.offsetTop - 90, behavior: "smooth" });
    loadNight(id).then(function (n) {
      if (!open || open.id !== id) return;       /* they moved on */
      if (n && n.beats && n.beats.length) { night = n; loadingText = false; render(); return; }
      /* No night of a book — the older path, a story whose text is in
         story_texts. Same gate, same silence when it is not allowed. */
      return fetchText(id).then(function (t) {
        loadingText = false;
        if (open && open.id === id) { text = t; render(); }
      });
    });
    return true;
  }

  function asked() {
    var m = String(window.location.search || "").match(/[?&]story=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  window.LSTBedtime = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root) return;
      render();
      /* bedtime-stories.html?story=b8-w5-n1 used to open the shelf's own
         preview. Since 9 Sep 2026 every story is read in the full-screen book
         (read.html), so an old link goes there instead of showing a second,
         different-looking version of the same night. */
      var want = asked();
      if (want) { location.replace("read.html?id=" + encodeURIComponent(want)); return; }
      if (auth()) {
        auth().ready(render);
        auth().onChange(function () {
          if (open) { var id = open.id; night = null; text = null; loadingText = true; render();
            openStory(id, false);
          } else render();
        });
      }
    }
  };
})();
