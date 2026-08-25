/* THE STORY ARCHIVE — every night's story the app has published.

   Reads `daily_content` through js/lst-app-data.js. Nothing is gated here in
   JavaScript: the database's own rule decides who may read a story, and it
   wants a subscription row for this account with an open status, or an admin
   flag. If a family sees nothing, that rule is the reason — which is also
   why editing this file gets a reader precisely nothing.

   The list is deliberately light — titles and dates only. The moment somebody
   opens a night, its full row is fetched (the two big HTML columns included)
   and read apart by js/lst-read.js, so a past night reads exactly like
   tonight's does rather than like a database row.

   Mount with: LSTArchive.mount("lst-archive")
*/
(function () {
  var root = null, rows = [], loaded = false, loadError = "", open = null, q = "", opening = false;
  var depth = 0;          /* which reading depth of the open night is showing */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function auth() { return window.LSTAuth; }

  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  function prettyDate(d) {
    if (!d) return "";
    var p = String(d).split("-");
    if (p.length !== 3) return d;
    return parseInt(p[2], 10) + " " + (MONTHS[parseInt(p[1], 10) - 1] || p[1]) + " " + p[0];
  }

  function load() {
    if (!window.LSTData || !auth() || !auth().signedIn()) {
      rows = []; loaded = true; return Promise.resolve();
    }
    return window.LSTData.archive.list()
      .then(function (list) { loaded = true; loadError = ""; rows = list; })
      .catch(function (e) {
        loaded = true; rows = [];
        loadError = (e && e.message) || "We couldn't load the archive.";
      });
  }

  /* ----------------------------------------------------------------- views */
  function signedOutView() {
    return '' +
      '<div class="mp-empty">' +
        '<div class="mp-empty-i">&#128218;</div>' +
        '<h3>Every story, kept</h3>' +
        '<p>Every night&rsquo;s story the app has sent is here, back to the beginning. Miss a night and you have not missed it &mdash; read it whenever you like, on any screen.</p>' +
        '<button type="button" class="mp-btn mp-btn-gold" id="a-signin">Sign in to read</button>' +
      '</div>';
  }

  /* Signed in, but the database returned nothing. Almost always the
     subscription rule, so say that instead of pretending the shelf is empty. */
  function lockedView() {
    return '' +
      '<div class="mp-empty">' +
        '<div class="mp-empty-i">&#128218;</div>' +
        "<h3>No stories to show yet</h3>" +
        "<p>Either no stories have been published yet, or this account&rsquo;s subscription isn&rsquo;t open. The archive comes with The Lantern &mdash; a free week opens it too.</p>" +
        '<a class="mp-btn mp-btn-gold" href="subscribe.html#plans" style="text-decoration:none;display:inline-block;" onclick="return openTrialSignup(\'monthly\')">Start the free week</a>' +
      "</div>";
  }

  function storyView(r) {
    var head =
      '<div class="mp-card-head">' +
        "<h3>" + esc(r.title || "Untitled") + "</h3>" +
        '<button type="button" class="mp-icon" id="a-close" aria-label="Back">&#10005;</button>' +
      "</div>" +
      '<p class="mp-meta">' + esc(prettyDate(r.date)) +
        (r.scripture ? " &middot; " + esc(r.scripture) : "") + "</p>" +
      (virtueChips(r) ? '<div style="margin:.6rem 0 1.2rem;">' + virtueChips(r) + "</div>" : "");

    if (opening) {
      return '<article class="mp-card">' + head +
        '<p class="mp-note">Opening that night&hellip;</p></article>';
    }

    var told = window.LSTRead ? window.LSTRead.story(r.html, r.text) : { ok: false, html: "", editions: [] };
    var eds = told.editions || [];
    if (depth >= eds.length) depth = 0;

    /* A night is written at several depths. The archive offers the same
       choice tonight's page does, or nothing at all if there is no choice. */
    var depths = eds.length > 1
      ? '<div class="rd-depths" role="group" aria-label="How deep to read">' +
          eds.map(function (e, i) {
            return '<button type="button" class="rd-depth' + (i === depth ? " on" : "") +
              '" data-depth="' + i + '">' + esc(e.label) +
              (e.note ? "<small>" + esc(e.note) + "</small>" : "") + "</button>";
          }).join("") + "</div>"
      : "";

    var body = eds.length ? eds[depth].html
      : told.ok ? told.html
      : (r.text ? '<section class="rd-card rd-telling">' + paragraphs(r.text) + "</section>"
        : '<p class="mp-note">The text of this one hasn&rsquo;t been added yet.</p>');

    var song = "";
    if (r.songHtml && window.LSTRead) {
      var l = window.LSTRead.song(r.songHtml);
      if (l.ok) {
        song = '<h3 class="rd-label" style="margin-top:2.2rem;">&#127925; That night&rsquo;s lullaby</h3>' +
          (l.title ? "<h4 style=\"font-family:'Fredoka',sans-serif;font-weight:600;color:#fff;font-size:1.25rem;margin:0 0 .9rem;\">" +
            esc(l.title) + "</h4>" : "") +
          (l.jump || "") + l.html;
      }
    }

    return '<article class="mp-card rd">' + head +
      '<div class="rd-body">' + depths +
        (r.audio ? '<audio controls preload="none" src="' + esc(r.audio) +
           '" style="width:100%;margin-bottom:1.6rem;"></audio>' : "") +
        body +
        (r.songAudio ? '<h3 class="rd-label" style="margin-top:2.2rem;">&#127925; That night&rsquo;s song</h3>' +
           '<audio controls preload="none" src="' + esc(r.songAudio) +
           '" style="width:100%;"></audio>' : "") +
        song +
      "</div></article>";
  }

  function virtueChips(r) {
    return (r.virtues || []).map(function (v) {
      return '<span class="mp-badge mp-badge-w">' +
        esc(window.LSTData ? window.LSTData.virtueName(v) : v) + "</span>";
    }).join("");
  }

  function paragraphs(t) {
    return String(t || "").split(/\n\s*\n/).filter(Boolean)
      .map(function (p) { return "<p>" + esc(p.trim()) + "</p>"; }).join("");
  }

  function rowView(r) {
    return '' +
      '<article class="mp-card" style="cursor:pointer;" data-open="' + esc(r.id) + '">' +
        '<div class="mp-card-head"><h3>' + esc(r.title || "Untitled") + "</h3></div>" +
        '<p class="mp-meta">' + esc(prettyDate(r.date)) +
          (r.scripture ? " &middot; " + esc(r.scripture) : "") + "</p>" +
      "</article>";
  }

  function listView() {
    var head =
      '<div class="mp-bar">' +
        '<input class="mp-in-f" id="a-q" style="max-width:18rem;margin-top:0;" placeholder="Search the Lantern Archive…" value="' + esc(q) + '">' +
        '<span class="mp-who">' + rows.length + (rows.length === 1 ? " story" : " stories") +
          " &middot; signed in as " + esc(auth().email() || "") + "</span>" +
      "</div>";

    if (loadError) return head + '<p class="mp-note mp-note-warn">' + esc(loadError) + "</p>";
    if (!rows.length) return lockedView();

    var needle = q.toLowerCase();
    var shown = needle ? rows.filter(function (r) {
      return (r.title + " " + r.scripture + " " + r.text).toLowerCase().indexOf(needle) !== -1;
    }) : rows;

    return head + (shown.length
      ? shown.map(rowView).join("")
      : '<p class="mp-note">Nothing matches that.</p>');
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    if (!root) return;
    if (!auth() || !auth().signedIn()) {
      root.innerHTML = signedOutView();
      var si = document.getElementById("a-signin");
      if (si) si.addEventListener("click", function () {
        auth().openSignIn("Sign in to read The Lantern Archive.");
      });
      return;
    }
    if (!loaded) { root.innerHTML = '<p class="mp-note">Opening the archive&hellip;</p>'; return; }

    if (open) {
      root.innerHTML = storyView(open);
      var c = document.getElementById("a-close");
      if (c) c.addEventListener("click", function () { open = null; depth = 0; render(); });
      root.querySelectorAll("[data-depth]").forEach(function (b) {
        b.addEventListener("click", function () {
          depth = parseInt(this.getAttribute("data-depth"), 10) || 0;
          var y = window.scrollY;
          render();
          window.scrollTo(0, y);
        });
      });
      return;
    }

    root.innerHTML = listView();

    var qi = document.getElementById("a-q");
    if (qi) qi.addEventListener("input", function () {
      q = this.value;
      var at = this.selectionStart;
      render();
      var again = document.getElementById("a-q");
      if (again) { again.focus(); try { again.setSelectionRange(at, at); } catch (e) {} }
    });

    root.querySelectorAll("[data-open]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.getAttribute("data-open");
        for (var i = 0; i < rows.length; i++) {
          if (String(rows[i].id) === id) { open = rows[i]; break; }
        }
        if (!open) return;
        depth = 0;
        render();
        window.scrollTo({ top: root.offsetTop - 80, behavior: "smooth" });

        /* The list left the heavy columns behind. Fetch them now, and only
           for the one night somebody actually wants to read. */
        if (open.html === undefined && window.LSTData) {
          opening = true;
          render();
          var want = open.date;
          window.LSTData.archive.full(want).then(function (full) {
            opening = false;
            if (full && open && open.date === want) open = full;
            render();
          }).catch(function () { opening = false; render(); });
        }
      });
    });
  }

  window.LSTArchive = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root || !auth()) return;
      auth().ready(function () {
        if (auth().signedIn()) load().then(render); else render();
      });
      auth().onChange(function () {
        loaded = false; open = null;
        if (auth().signedIn()) { render(); load().then(render); }
        else { rows = []; loaded = true; render(); }
      });
    }
  };
})();
