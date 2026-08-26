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
  /* The illustrated pages the app chat builds for a month's book — see
     data/book-pages.js, and the warning there that they are PUBLIC files. */
  /* A month's book, extracted from the app's own night pages into the website's
     shape by tools/extract-book.py. One entry per night: the words, and the
     pictures as real files. Drawn by the same reader as the Morning Lantern. */
  function nightOf(id) {
    var books = [window.LST_BOOK_AUGUST];
    for (var i = 0; i < books.length; i++) {
      var b = books[i];
      if (!b) continue;
      for (var j = 0; j < b.length; j++) if (b[j].id === id) return b[j];
    }
    return null;
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
  var BOOK_ART = {
    june: "images/book-cover-june.jpg",
    july: "images/book-cover-july.jpg",
    august: "images/book-cover-august.jpg"
  };
  var VOLUME_ART = {
    ot: "images/cover-ot.jpg",
    nt: "images/cover-nt.jpg",
    bom: "images/cover-bom.jpg",
    dc: "images/cover-dc.jpg"
  };
  function artFor(s) {
    return BOOK_ART[String(s.month || "").toLowerCase()] ||
           VOLUME_ART[String(s.volume || "").toLowerCase()] || "";
  }

  function tileView(s) {
    var art = artFor(s);
    var free = (!subscriber() && isFree(s.id)) ? '<span class="bs-free">Free</span>' : "";
    var stamp = (s.week ? s.week : "?") + "&middot;" + (s.night ? s.night : "?");
    return '' +
      '<button type="button" class="bs-tile" data-story="' + esc(s.id) + '">' +
        '<span class="bs-art"' + (art ? ' style="background-image:url(' + esc(art) + ')"' : "") + ">" +
          '<span class="bs-stamp">' + stamp + "</span>" + free +
        "</span>" +
        '<span class="bs-label">' + esc(s.title || "Untitled") + "</span>" +
        '<span class="bs-sub">' + esc(s.scripture || "") + "</span>" +
      "</button>";
  }

  function shelfView() {
    var list = shown();
    var bs = books();

    /* The books themselves, as covers — the shelf before the stories. */
    var covers =
      '<div class="bs-shelfrow">' +
        '<button type="button" class="bs-cover' + (book === "" ? " on" : "") + '" data-book="">' +
          '<span class="bs-cover-art bs-cover-all">&#128218;</span>' +
          '<span class="bs-label">All stories</span>' +
          '<span class="bs-sub">' + stories().length + " in the series</span>" +
        "</button>" +
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

  function storyView(s) {
    /* The book's own night, if this book has been brought over. It carries the
       whole thing — the story in illustrated turns, the Traveler, the Feeling
       Moment, Remember This and the parent's page — so where it exists it IS
       the story, and `story_texts` is not needed for that night. */
    var n = window.LSTRead ? nightOf(s.id) : null;
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
          '<p class="rd-aside">Look this story up by what it teaches in ' +
            '<a href="virtue-library.html">the Virtue Library</a>.</p>' +
        "</div>" +
      "</article>";
    }

    var locked = !text || !text.story;
    var body = locked
      ? '<div class="rd-card rd-telling">' +
          (s.teaser ? "<p>" + esc(s.teaser) + "</p>" : "") +
          '<p class="rd-aside">' +
            (subscriber()
              ? "The words of this one haven&rsquo;t been added yet."
              : "The rest of this story comes with The Lantern &mdash; and the first seven days are free.") +
          "</p>" +
          (subscriber() ? "" :
            '<a class="mp-btn mp-btn-gold" href="subscribe.html#plans" ' +
            'style="text-decoration:none;display:inline-block;margin-top:.4rem;" ' +
            'onclick="return openTrialSignup(\'monthly\')">Start the free week</a>') +
        "</div>"
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
      var c = document.getElementById("bs-close");
      if (c) c.addEventListener("click", function () {
        open = null; text = null; render();
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
      b.addEventListener("click", function () { book = this.getAttribute("data-book"); render(); });
    });

    root.querySelectorAll("[data-story]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.getAttribute("data-story");
        var found = stories().filter(function (s) { return s.id === id; })[0];
        if (!found) return;
        open = found; text = null; loadingText = true;
        render();
        window.scrollTo({ top: root.offsetTop - 90, behavior: "smooth" });
        fetchText(id).then(function (t) {
          loadingText = false;
          if (open && open.id === id) { text = t; render(); }
        });
      });
    });
  }

  window.LSTBedtime = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root) return;
      render();
      if (auth()) {
        auth().ready(render);
        auth().onChange(function () {
          if (open) { text = null; loadingText = true; render();
            fetchText(open.id).then(function (t) { loadingText = false; text = t; render(); });
          } else render();
        });
      }
    }
  };
})();
