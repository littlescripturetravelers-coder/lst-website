/* TONIGHT'S STORY — the app's Today screen, on the website.

   The same row the phone reads: the newest night published on or before
   today. Title, scripture, the traveler who carries it, the virtues it
   teaches, the story itself, the narration, and the lullaby.

   WHO SEES THE STORY is not decided here. It is decided by a rule inside
   the database, which hands back nothing at all unless the account asking
   is a subscriber, a trialer, or Levi. So a visitor who has not subscribed
   is not shown a trimmed-down story — there is no story here to trim. They
   are shown a real sample night from the free stories, plainly labelled,
   and js/lst-gate.js invites them in.

   Mount with: LSTTonight.mount("lst-tonight")
*/
(function () {
  var root = null, night = null, loaded = false, loadError = "", openBook = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function auth() { return window.LSTAuth; }

  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  function prettyDate(d) {
    if (!d) return "";
    var p = String(d).split("-");
    if (p.length !== 3) return d;
    var dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return DAYS[dt.getDay()] + ", " + parseInt(p[2], 10) + " " +
           (MONTHS[parseInt(p[1], 10) - 1] || p[1]) + " " + p[0];
  }

  /* Levi pastes this HTML into the app's admin screen himself, so it is his
     own writing and not a stranger's. It still gets its script tags and its
     on-anything attributes taken off before it goes on the page: a story is
     words and pictures, and nothing in one has any business running. */
  function safeHtml(html) {
    var box = document.createElement("div");
    box.innerHTML = String(html || "");
    box.querySelectorAll("script,iframe,object,embed,form").forEach(function (n) { n.remove(); });
    box.querySelectorAll("*").forEach(function (n) {
      for (var i = n.attributes.length - 1; i >= 0; i--) {
        var a = n.attributes[i].name;
        if (/^on/i.test(a) || (a === "href" && /^\s*javascript:/i.test(n.getAttribute(a) || ""))) {
          n.removeAttribute(a);
        }
      }
    });
    return box.innerHTML;
  }

  function paragraphs(text) {
    return String(text || "").split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return "<p>" + esc(p.trim()) + "</p>"; }).join("");
  }

  function load() {
    if (!window.LSTData || !auth() || !auth().signedIn()) {
      night = null; loaded = true; return Promise.resolve();
    }
    return window.LSTData.archive.tonight()
      .then(function (n) { loaded = true; loadError = ""; night = n; })
      .catch(function (e) {
        loaded = true; night = null;
        loadError = (e && e.message) || "We couldn't load tonight's story.";
      });
  }

  /* --------------------------------------------------------- the free peek
     A real story from the library's free shelf, so a visitor sees the shape
     of a night rather than a locked door. Only the public teaser — the full
     text of even a free story lives behind the database rule. */
  function sample() {
    var L = window.LST_LIBRARY;
    if (!L || !L.stories || !L.stories.length) return null;
    var free = (L.meta && L.meta.freeStoryIds) || [];
    for (var i = 0; i < free.length; i++) {
      for (var j = 0; j < L.stories.length; j++) {
        if (L.stories[j].id === free[i]) return L.stories[j];
      }
    }
    return L.stories[0];
  }

  function virtueChips(ids) {
    return (ids || []).map(function (v) {
      var name = window.LSTData ? window.LSTData.virtueName(v) : v;
      return '<span class="mp-badge mp-badge-w">' + esc(name) + "</span>";
    }).join("");
  }

  function peekView() {
    var s = sample();
    var chips = s ? virtueChips(s.virtues) : "";
    return '' +
      '<article class="mp-card" id="lst-peek">' +
        '<p class="mp-meta">A sample night &middot; this is what arrives every evening</p>' +
        "<h3 style=\"font-family:'Fredoka',sans-serif;font-weight:600;color:#fff;font-size:1.35rem;margin:.2rem 0 .5rem;\">" +
          esc(s ? s.title : "One short story, every night") + "</h3>" +
        (s && s.scripture ? '<p class="mp-meta">' + esc(s.scripture) + "</p>" : "") +
        (chips ? '<div style="margin:.6rem 0 1rem;">' + chips + "</div>" : "") +
        '<div class="mp-story">' + (s && s.teaser ? "<p>" + esc(s.teaser) + "</p>"
          : "<p>A beginning, a worry, and a hopeful ending &mdash; in the smallest words that still carry the meaning.</p>") + "</div>" +
        (s && s.teachingNote
          ? '<p class="mp-sub">For the grown-up reading it</p><p class="mp-text">' +
            esc(s.teachingNote) + "</p>" : "") +
      "</article>" +
      '<div class="mp-empty" style="margin-top:1.25rem;">' +
        "<h3>And then there is the rest of the night</h3>" +
        "<p>Every evening carries the story, a lullaby to sing together, the narration if a voice is easier than reading aloud, and a page in your family&rsquo;s own book. Your first seven days are free.</p>" +
        '<a class="mp-btn mp-btn-gold" href="subscribe.html#plans" style="text-decoration:none;display:inline-block;" onclick="return openTrialSignup(\'monthly\')">Start the free week</a>' +
        '<p class="mp-note" style="padding:.9rem 0 0;font-size:.87rem;">Already a subscriber? ' +
          '<button type="button" class="mp-link" id="t-signin">Sign in</button></p>' +
      "</div>";
  }

  /* Signed in, but the database handed back nothing. That is the paywall
     answering, or a night that hasn't been published yet — say which. */
  function lockedView() {
    return '' +
      '<div class="mp-empty">' +
        '<div class="mp-empty-i">&#127769;</div>' +
        "<h3>Nothing has arrived for tonight yet</h3>" +
        "<p>Either tonight&rsquo;s story hasn&rsquo;t been published, or this account&rsquo;s subscription isn&rsquo;t open. The nightly story comes with The Lantern &mdash; a free week opens it too.</p>" +
        '<a class="mp-btn mp-btn-gold" href="subscribe.html#plans" style="text-decoration:none;display:inline-block;" onclick="return openTrialSignup(\'monthly\')">Start the free week</a>' +
      "</div>" + peekView();
  }

  function lullabyView(n) {
    var bits = "";
    if (n.songHtml) bits += '<div class="mp-story">' + safeHtml(n.songHtml) + "</div>";
    if (n.songAudio) {
      bits += '<audio controls preload="none" src="' + esc(n.songAudio) +
              '" style="width:100%;margin:.4rem 0 .8rem;"></audio>';
    }
    var links = [];
    if (n.songLink) links.push('<a href="' + esc(n.songLink) + '" target="_blank" rel="noopener">Listen to the song</a>');
    if (n.lyricsLink) links.push('<a href="' + esc(n.lyricsLink) + '" target="_blank" rel="noopener">Words to sing along</a>');
    if (links.length) bits += '<p class="mp-text">' + links.join(" &middot; ") + "</p>";
    if (!bits) return "";
    return '<p class="mp-sub">&#127925; Tonight&rsquo;s lullaby</p>' + bits;
  }

  function nightView(n) {
    var stamp = [];
    if (n.book) stamp.push("Book " + n.book);
    if (n.week) stamp.push("Week " + n.week);
    if (n.night) stamp.push("Night " + n.night);

    var story = n.html ? '<div class="mp-story">' + safeHtml(n.html) + "</div>"
              : n.text ? '<div class="mp-story">' + paragraphs(n.text) + "</div>"
              : '<p class="mp-note">The text of tonight&rsquo;s story hasn&rsquo;t been added yet.</p>';

    return '' +
      '<article class="mp-card">' +
        '<p class="mp-meta">' + esc(prettyDate(n.date)) +
          (stamp.length ? " &middot; " + esc(stamp.join(" &middot; ")) : "") + "</p>" +
        "<h2 style=\"font-family:'Fredoka',sans-serif;font-weight:600;color:#fff;font-size:clamp(1.4rem,4vw,1.9rem);margin:.15rem 0 .5rem;line-height:1.2;\">" +
          esc(n.title || "Tonight&rsquo;s story") + "</h2>" +
        (n.scripture ? '<p class="mp-meta">' + esc(n.scripture) + "</p>" : "") +
        (n.traveler ? '<p class="mp-text" style="margin:.2rem 0 .6rem;color:rgba(255,255,255,.65);font-size:.9rem;">Carried by ' +
          esc(n.traveler) + "</p>" : "") +
        (virtueChips(n.virtues) ? '<div style="margin:.5rem 0 1.1rem;">' + virtueChips(n.virtues) + "</div>" : "") +

        (n.audio ? '<p class="mp-sub">&#128266; Read to us</p><audio controls preload="none" src="' +
          esc(n.audio) + '" style="width:100%;margin-bottom:.6rem;"></audio>' : "") +

        '<p class="mp-sub">&#128214; The story</p>' + story +

        (n.bookHtml
          ? '<p class="mp-sub">&#128214; The picture book</p>' +
            '<button type="button" class="mp-btn" id="t-book">' +
              (openBook ? "Close the book" : "Open the page-turning book") + "</button>" +
            (openBook ? '<div class="mp-story" style="margin-top:1rem;">' + safeHtml(n.bookHtml) + "</div>" : "")
          : "") +

        lullabyView(n) +

        '<p class="mp-sub">Keep it</p>' +
        '<p class="mp-text">Write what your child said tonight in <a href="journal.html">your journal</a>, ' +
          'or tag it into <a href="family-stories.html">your family&rsquo;s stories</a>. ' +
          'Every night we have sent is in <a href="archive.html">the archive</a>.</p>' +
      "</article>";
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    if (!root) return;

    if (!auth() || !auth().signedIn()) {
      root.innerHTML = peekView();
      var si = document.getElementById("t-signin");
      if (si) si.addEventListener("click", function () {
        auth().openSignIn("Sign in to read tonight's story.");
      });
      return;
    }
    if (!loaded) { root.innerHTML = '<p class="mp-note">Fetching tonight&rsquo;s story&hellip;</p>'; return; }
    if (loadError) { root.innerHTML = '<p class="mp-note mp-note-warn">' + esc(loadError) + "</p>"; return; }
    if (!night) { root.innerHTML = lockedView(); return; }

    root.innerHTML = nightView(night);
    var b = document.getElementById("t-book");
    if (b) b.addEventListener("click", function () { openBook = !openBook; render(); });
  }

  window.LSTTonight = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root || !auth()) return;
      auth().ready(function () {
        if (auth().signedIn()) load().then(render); else render();
      });
      auth().onChange(function () {
        loaded = false; openBook = false;
        if (auth().signedIn()) { render(); load().then(render); }
        else { night = null; loaded = true; render(); }
      });
    }
  };
})();
