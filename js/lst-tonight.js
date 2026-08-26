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

   This page is the DEVOTIONAL and nothing else. The picture book and the
   lullaby each have a page of their own — story.html and lullaby.html, opened
   from the resource links near the top — because printing all three down one
   page meant a family scrolled past the whole lullaby to reach the questions.

   js/lst-read.js reads the devotional apart and hands back its pieces, and
   they are set here in the website's own type: one comfortable column,
   headings that match the rest of the site, and the story given the most room.

   Two things carried over from the app because they matter at bedtime: the
   text size (kept, so a family sets it once) and read-aloud.

   Mount with: LSTTonight.mount("lst-tonight")
*/
(function () {
  var root = null, night = null, loaded = false, loadError = "";
  var depth = 0;          /* which reading depth of the night is showing */

  /* Text size, remembered on this device. The app has the same idea in its
     settings; a family that needs bigger letters needs them every night. */
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

  /* Read-aloud, the way the app does it: the browser's own voice, reading
     what is actually on the screen. Stops when the page changes under it. */
  var speaking = false;
  function readableText() {
    var box = root && root.querySelector(".rd-body");
    if (!box) return "";
    return (box.innerText || "")
      .replace(/[\u2605\u2606\u2726\u00b7]/g, " ")
      .replace(/\n{2,}/g, ". ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  function stopReading() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    speaking = false;
  }
  function toggleRead() {
    var synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) { stopReading(); render(); return; }
    var words = readableText();
    if (!words) return;
    var u = new SpeechSynthesisUtterance(words);
    u.rate = 0.95; u.pitch = 1;
    var voices = synth.getVoices() || [];
    for (var i = 0; i < voices.length; i++) {
      if (/^en/i.test(voices[i].lang || "")) { u.voice = voices[i]; break; }
    }
    u.onend = u.onerror = function () { speaking = false; render(); };
    synth.cancel();
    synth.speak(u);
    speaking = true;
    render();
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
        "<h3 style=\"font-family: var(--font-display);font-weight:600;color:#fff;font-size:1.35rem;margin:.2rem 0 .5rem;\">" +
          esc(s ? s.title : "One short story, every night") + "</h3>" +
        (s && s.scripture ? '<p class="mp-meta">' + sref(s.scripture) + "</p>" : "") +
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

  /* -------------------------------------------------------------- the night
     Three readers, one column. Each section only appears if the night
     actually carries it, so a light night simply reads shorter. */
  function toolsView() {
    var canSpeak = !!window.speechSynthesis;
    return '' +
      '<div class="rd-tools">' +
        '<span class="rd-tool-lbl">Text size</span>' +
        '<button type="button" class="rd-tool" id="t-smaller" aria-label="Smaller text">&minus;</button>' +
        '<button type="button" class="rd-tool" id="t-bigger" aria-label="Bigger text">A+</button>' +
        (canSpeak
          ? '<button type="button" class="rd-tool' + (speaking ? " on" : "") + ' rd-spacer" id="t-read">' +
              (speaking ? "&#9209; Stop reading" : "&#128266; Read it to me") + "</button>"
          : "") +
      "</div>";
  }

  function headView(n) {
    var stamp = [];
    if (n.book) stamp.push("Book " + n.book);
    if (n.week) stamp.push("Week " + n.week);
    if (n.night) stamp.push("Night " + n.night);

    return '' +
      '<p class="mp-meta">' + esc(prettyDate(n.date)) +
        (stamp.length ? " &middot; " + stamp.map(esc).join(" &middot; ") : "") + "</p>" +
      "<h2 style=\"font-family: var(--font-display);font-weight:600;color:#fff;font-size:clamp(1.5rem,4.4vw,2.15rem);margin:.15rem 0 .55rem;line-height:1.18;\">" +
        (n.title ? esc(n.title) : "Tonight&rsquo;s story") + "</h2>" +
      (n.scripture ? '<p class="mp-meta">' + sref(n.scripture) + "</p>" : "") +
      (n.traveler ? '<p style="margin:.2rem 0 .7rem;color:rgba(255,255,255,.6);font-size:.9rem;">Carried by ' +
        esc(n.traveler) + "</p>" : "") +
      (virtueChips(n.virtues) ? '<div style="margin:.5rem 0 1.4rem;">' + virtueChips(n.virtues) + "</div>" : "");
  }

  function narrationView(n) {
    if (!n.audio) return "";
    return '<h3 class="rd-label" style="margin-top:0;">&#128266; Tonight&rsquo;s narration</h3>' +
      '<audio controls preload="none" src="' + esc(n.audio) +
      '" style="width:100%;margin-bottom:1.8rem;"></audio>';
  }

  /* ----------------------------------------------------- tonight's resources
     The app's Lantern shows three buttons here, and their links point at
     files that live inside the app bundle — they cannot work on the website.
     So the same three are built from what the night actually carries, each
     opening a page of its own. */
  function resourcesView(n) {
    var d = n.date ? "?date=" + encodeURIComponent(n.date) : "";
    var items = [];

    if (n.bookHtml) {
      items.push({ ico: "&#128214;", href: "story.html" + d, primary: true,
        title: "Tonight&rsquo;s Bedtime Story",
        sub: [n.book ? "Book " + n.book : "", n.week ? "Week " + n.week : "",
              n.night ? "Night " + n.night : "", n.title]
             .filter(Boolean).map(esc).join(" &middot; ") });
    }
    if (n.songHtml || n.songAudio) {
      items.push({ ico: "&#127925;", href: "lullaby.html" + d,
        title: "Tonight&rsquo;s Lullaby &mdash; Lyrics &amp; Music",
        sub: esc(n.title || "The song for this night") });
    }
    /* The signature lullaby belongs to no night. If the night names one, use
       that link; otherwise the website has its own copy of the words. */
    items.push({ ico: "&#127926;",
      href: /^https?:/i.test(n.lanternLink || "") ? n.lanternLink : "lullaby.html?which=lantern",
      external: /^https?:/i.test(n.lanternLink || ""),
      title: "The Lantern Lullaby &mdash; Lyrics &amp; Music",
      sub: "Our signature Old Testament lullaby" });

    if (!items.length) return "";

    return '<h3 class="rd-label" style="margin-top:2.4rem;">&#127769; Tonight&rsquo;s resources</h3>' +
      '<div class="rd-kit">' + items.map(function (it) {
        return '<a class="rd-kit-btn' + (it.primary ? " rd-kit-primary" : "") + '" href="' +
          esc(it.href) + '" target="_blank" rel="noopener">' +
          '<span class="rd-kit-ico">' + it.ico + "</span>" +
          "<span><span class=\"rd-kit-title\">" + it.title + "</span>" +
          (it.sub ? '<span class="rd-kit-sub">' + it.sub + "</span>" : "") + "</span>" +
          '<span class="rd-kit-arrow">&#8599;</span></a>';
      }).join("") + "</div>";
  }

  function keepView() {
    /* js/lst-keep.js fills this: the Family Circle and the Study Journal,
       the same two the app puts at the foot of a night. */
    return '<div id="lst-keep"></div>' +
      '<p class="rd-aside">Everything you write here is in the app too, and gathered in ' +
        '<a href="family-stories.html">your family&rsquo;s stories</a> and ' +
        '<a href="journal.html">your journal</a>. ' +
        'Every night we have sent is in <a href="archive.html">The Lantern Archive</a>.</p>';
  }

  /* The Lantern carries the same night written four ways — quick through to
     the whole study. Offer the choice only when the night really has one. */
  function depthsView(eds) {
    if (!eds || eds.length < 2) return "";
    return '<div class="rd-depths" role="group" aria-label="How deep to read">' +
      eds.map(function (e, i) {
        return '<button type="button" class="rd-depth' + (i === depth ? " on" : "") +
          '" data-depth="' + i + '"' + (i === depth ? ' aria-current="true"' : "") + ">" +
          esc(e.label) + (e.note ? "<small>" + esc(e.note) + "</small>" : "") + "</button>";
      }).join("") + "</div>";
  }

  function nightView(n) {
    var told = window.LSTRead ? window.LSTRead.story(n.html, n.text) : { ok: false, html: "", editions: [] };
    var eds = told.editions || [];
    if (depth >= eds.length) depth = 0;

    var body = eds.length ? eds[depth].html
      : told.ok ? told.html
      : (n.text ? '<section class="rd-card rd-telling"><h3 class="rd-label">Tonight&rsquo;s story</h3>' +
          paragraphs(n.text) + "</section>"
        : '<p class="mp-note">The text of tonight&rsquo;s story hasn&rsquo;t been added yet.</p>');

    return '<div class="rd">' + headView(n) + '<div id="lst-admin"></div>' + toolsView() +
      '<div class="rd-body">' + depthsView(eds) +
        narrationView(n) + resourcesView(n) + body + keepView() +
      "</div></div>";
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
    applySize();


    var small = document.getElementById("t-smaller");
    if (small) small.addEventListener("click", function () {
      if (sizeIx > 0) { sizeIx--; applySize(); }
    });
    var big = document.getElementById("t-bigger");
    if (big) big.addEventListener("click", function () {
      if (sizeIx < SIZES.length - 1) { sizeIx++; applySize(); }
    });
    var rd = document.getElementById("t-read");
    if (rd) rd.addEventListener("click", toggleRead);

    /* The owner's controls, if it is the owner looking. */
    if (window.LSTAdmin) {
      window.LSTAdmin.strip(document.getElementById("lst-admin"), night, function (what) {
        if (what === "deleted") { night = null; loaded = false; load().then(render); }
      });
    }

    /* Every question on the page becomes something you can answer, and the
       two writing cards go in below the night. */
    if (window.LSTKeep) {
      window.LSTKeep.enhance(root, night);
      window.LSTKeep.bottom("lst-keep", night);
    }

    root.querySelectorAll("[data-depth]").forEach(function (b) {
      b.addEventListener("click", function () {
        stopReading();
        depth = parseInt(this.getAttribute("data-depth"), 10) || 0;
        var y = window.scrollY;
        render();
        window.scrollTo(0, y);      /* stay where you were reading */
      });
    });
  }

  window.addEventListener("pagehide", stopReading);
  window.addEventListener("beforeunload", stopReading);

  window.LSTTonight = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root || !auth()) return;
      auth().ready(function () {
        if (auth().signedIn()) load().then(render); else render();
      });
      auth().onChange(function () {
        stopReading();
        loaded = false; depth = 0;
        if (auth().signedIn()) { render(); load().then(render); }
        else { night = null; loaded = true; render(); }
      });
    }
  };
})();
