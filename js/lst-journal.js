/* THE JOURNAL — the same journal as the app, on the website.

   Reads and writes `journal_entries` through js/lst-app-data.js, which speaks
   the app's exact column shape. Write an entry here and it is on the phone;
   write one on the phone and it is here.

   Photos are deliberately not part of this. The website neither shows nor
   attaches them. It does still carry the `photos` value through untouched on
   save, because older app versions on phones still write that column, and
   blanking it from here would wipe an entry's photo list out from under the
   phone that holds the actual pictures.

   Mount with: LSTJournal.mount("lst-journal")
*/
(function () {
  var root = null, rows = [], loaded = false, editing = null, loadError = "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function auth() { return window.LSTAuth; }

  /* "2026-08-19" → "19 August 2026", without tripping over time zones. */
  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  function prettyDate(d) {
    if (!d) return "";
    var p = String(d).split("-");
    if (p.length !== 3) return d;
    var m = MONTHS[parseInt(p[1], 10) - 1];
    return parseInt(p[2], 10) + " " + (m || p[1]) + " " + p[0];
  }

  function load() {
    if (!window.LSTData || !auth() || !auth().signedIn()) {
      rows = []; loaded = true; return Promise.resolve();
    }
    return window.LSTData.journal.list()
      .then(function (list) { loaded = true; loadError = ""; rows = list; })
      .catch(function (e) {
        loaded = true; rows = [];
        loadError = (e && e.message) || "We couldn't load your journal.";
      });
  }

  /* ----------------------------------------------------------------- views */
  function signedOutView() {
    return '' +
      '<div class="mp-empty">' +
        '<div class="mp-empty-i">&#128366;</div>' +
        '<h3>Your journal is waiting</h3>' +
        '<p>This is the same journal as the one in the Little Scripture Travelers app. Write here and it is on your phone; write on your phone and it is here. It is private to your account &mdash; nobody else can read it.</p>' +
        '<button type="button" class="mp-btn mp-btn-gold" id="j-signin">Sign in to open it</button>' +
      '</div>';
  }

  /* An entry written from Tonight's Story carries its category in `source`,
     as "website:gratitude". Anything else with no "website" prefix came from
     the phone. */
  function kindOf(src) {
    var m = /^website:(\w+)/.exec(String(src || ""));
    if (!m || !window.LSTKeep) return null;
    for (var i = 0; i < window.LSTKeep.kinds.length; i++) {
      if (window.LSTKeep.kinds[i].key === m[1]) return window.LSTKeep.kinds[i];
    }
    return null;
  }

  function cardView(r) {
    var where = r.place ? esc(r.place) : "";
    var fromApp = !/^website/.test(r.source || "");
    var kind = kindOf(r.source);
    return '' +
      '<article class="mp-card">' +
        '<div class="mp-card-head">' +
          "<h3>" + esc(prettyDate(r.date)) + "</h3>" +
          '<div style="display:flex;gap:.15rem;flex-shrink:0;">' +
            '<button type="button" class="mp-icon" data-edit="' + esc(r.id) + '" aria-label="Edit">&#9998;</button>' +
            '<button type="button" class="mp-icon" data-del="' + esc(r.id) + '" aria-label="Delete">&#128465;</button>' +
          "</div>" +
        "</div>" +
        '<p class="mp-meta">' +
          '<span class="mp-badge' + (fromApp ? "" : " mp-badge-w") + '">' +
            (fromApp ? "From the app" : "Written here") + "</span>" +
          (kind ? '<span class="mp-badge">' + kind.ico + " " + esc(kind.label) + "</span>" : "") +
          (where ? "&#128205; " + where : "") +
        "</p>" +
        '<p class="mp-text">' + esc(r.body) + "</p>" +
      "</article>";
  }

  function formView(rec) {
    return '' +
      '<form class="mp-form" id="j-form">' +
        "<h3>" + (rec.id ? "Edit this entry" : "New journal entry") + "</h3>" +
        '<div class="mp-row">' +
          '<label class="mp-l">Date <span class="mp-hint">(when it happened)</span>' +
            '<input class="mp-in-f" id="j-date" type="date" value="' +
              esc(rec.date || window.LSTData.today()) + '"></label>' +
          '<label class="mp-l">Place <span class="mp-hint">(optional)</span>' +
            '<input class="mp-in-f" id="j-place" value="' + esc(rec.place || "") +
            '" placeholder="Grandma&rsquo;s kitchen"></label>' +
        "</div>" +
        '<label class="mp-l">The entry<textarea class="mp-in-f mp-ta" id="j-body" rows="8" placeholder="Write it the way you would say it.">' +
          esc(rec.body || "") + "</textarea></label>" +
        '<div class="mp-err" id="j-err"></div>' +
        '<div class="mp-acts">' +
          '<button type="submit" class="mp-btn mp-btn-gold">Save entry</button>' +
          '<button type="button" class="mp-btn" id="j-cancel">Cancel</button>' +
        "</div>" +
      "</form>";
  }

  function listView() {
    var head =
      '<div class="mp-bar">' +
        '<button type="button" class="mp-btn mp-btn-gold" id="j-add">+ New entry</button>' +
        '<span class="mp-who">Signed in as ' + esc(auth().email() || "") +
          ' &middot; <button type="button" class="mp-link" id="j-out">sign out</button></span>' +
      "</div>";

    if (loadError) return head + '<p class="mp-note mp-note-warn">' + esc(loadError) + "</p>";
    if (!rows.length) {
      return head +
        '<div class="mp-empty">' +
          "<h3>Nothing written yet</h3>" +
          "<p>Start with today. One honest paragraph is worth more than a page you never write.</p>" +
        "</div>";
    }
    return head + rows.map(cardView).join("");
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    if (!root) return;
    if (!auth() || !auth().signedIn()) {
      root.innerHTML = signedOutView();
      var si = document.getElementById("j-signin");
      if (si) si.addEventListener("click", function () {
        auth().openSignIn("Sign in to open your journal.");
      });
      return;
    }
    if (!loaded) { root.innerHTML = '<p class="mp-note">Loading your journal&hellip;</p>'; return; }
    if (editing) { root.innerHTML = formView(editing); wireForm(); return; }
    root.innerHTML = listView();
    wireList();
  }

  function wireList() {
    var add = document.getElementById("j-add");
    if (add) add.addEventListener("click", function () { editing = {}; render(); });
    var out = document.getElementById("j-out");
    if (out) out.addEventListener("click", function () { auth().signOut(); });

    root.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.getAttribute("data-edit");
        for (var i = 0; i < rows.length; i++) {
          if (String(rows[i].id) === id) { editing = JSON.parse(JSON.stringify(rows[i])); break; }
        }
        render();
      });
    });
    root.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.getAttribute("data-del");
        if (!window.confirm("Delete this journal entry? This cannot be undone, and it will go from the app too.")) return;
        window.LSTData.journal.remove(id).then(load).then(render);
      });
    });
  }

  function wireForm() {
    var form = document.getElementById("j-form");
    var cancel = document.getElementById("j-cancel");
    if (cancel) cancel.addEventListener("click", function () { editing = null; render(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("j-err");
      var body = (document.getElementById("j-body").value || "").trim();
      if (!body) { err.textContent = "Write something first."; return; }

      var rec = {
        id: editing.id,                       /* keeps the app's id when editing */
        date: document.getElementById("j-date").value || window.LSTData.today(),
        place: (document.getElementById("j-place").value || "").trim(),
        body: body,
        lat: editing.lat, lon: editing.lon,   /* never lose the map pin the app set */
        photos: editing.photos || [],         /* carried through, never shown */
        source: editing.source || "website"
      };

      err.textContent = "Saving…";
      window.LSTData.journal.save(rec).then(function (res) {
        if (res && res.error) { err.textContent = res.error.message; return; }
        editing = null;
        return load().then(render);
      }).catch(function () {
        err.textContent = "We couldn't save that. Please try again.";
      });
    });
  }

  window.LSTJournal = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root || !auth()) return;
      auth().ready(function () {
        if (auth().signedIn()) load().then(render); else render();
      });
      auth().onChange(function () {
        loaded = false; editing = null;
        if (auth().signedIn()) { render(); load().then(render); }
        else { rows = []; loaded = true; render(); }
      });
    }
  };
})();
