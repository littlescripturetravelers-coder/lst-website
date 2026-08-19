/* FAMILY STORIES — the family's own half of the Virtue Library.

   The library holds 91 scripture stories, each tagged with the virtues it
   teaches. This holds the family's own stories — an ancestor, a grandparent,
   the night a prayer was answered — tagged with the SAME virtues, so the two
   sit side by side. Look up "courage" and you get Daniel in the lions' den
   and your great-grandfather who walked away from everything he owned.

   Rows live in Supabase `family_stories`, keyed to the signed-in user, so the
   same stories reach the app and the Sacred World Timeline.

   Entries written here are `kind = 'history'` and deliberately leave
   `entry_date` NULL — the app's own Family Stories are a one-per-day journal
   keyed on that column, and history entries must not collide with it. A
   family can have twenty ancestors born in the same year.

   Renders into whatever element is passed to LSTFamilyStories.mount(el).
*/
(function () {
  var TABLE = "family_stories";
  var root = null;
  var rows = [];
  var loaded = false;
  var editing = null;      // the row being edited, or {} for a new one
  var filterVirtue = "";
  var loadError = "";

  function lib() { return window.LST_LIBRARY || {}; }
  function virtues() { return lib().virtues || []; }
  function stories() { return lib().stories || []; }

  function virtueLabel(id) {
    var v = virtues();
    for (var i = 0; i < v.length; i++) if (v[i].id === id) return v[i].label || v[i].name || id;
    return id;
  }
  function storyById(id) {
    var s = stories();
    for (var i = 0; i < s.length; i++) if (s[i].id === id) return s[i];
    return null;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function sb() { return window.LSTAuth ? window.LSTAuth.client() : null; }

  /* ------------------------------------------------------------------ data */
  function load() {
    var c = sb();
    if (!c || !window.LSTAuth.signedIn()) { rows = []; loaded = true; return Promise.resolve(); }
    return c.from(TABLE)
      .select("id,title,person,year,body,virtues,story_id,kind")
      .eq("kind", "history")
      .order("year", { ascending: true })
      .then(function (res) {
        loaded = true;
        if (res.error) {
          rows = [];
          loadError = res.error.message || "We couldn't load your family stories.";
          return;
        }
        loadError = "";
        rows = res.data || [];
      })
      .catch(function () {
        loaded = true;
        loadError = "We couldn't reach the server just now.";
      });
  }

  function save(rec) {
    var c = sb();
    var u = window.LSTAuth.user();
    if (!c || !u) return Promise.reject(new Error("not signed in"));

    var payload = {
      user_id: u.id,
      kind: "history",
      title: rec.title,
      person: rec.person || null,
      year: rec.year === "" || rec.year == null ? null : parseInt(rec.year, 10),
      body: rec.body || null,
      virtues: rec.virtues && rec.virtues.length ? rec.virtues : null,
      story_id: rec.story_id || null
    };
    if (rec.id) return c.from(TABLE).update(payload).eq("id", rec.id);
    return c.from(TABLE).insert(payload);
  }

  function remove(id) {
    var c = sb();
    if (!c) return Promise.reject(new Error("no client"));
    return c.from(TABLE).delete().eq("id", id);
  }

  /* ----------------------------------------------------------------- views */
  function signedOutView() {
    return '' +
      '<div class="fs-empty">' +
        '<div class="fs-empty-i">&#10022;</div>' +
        '<h3>Your family has stories too</h3>' +
        '<p>The library holds the scripture stories. This is where your own go &mdash; the ancestor who kept a promise, the grandmother whose faith held, the night a prayer was answered. Tag them with the same virtues and they sit right alongside the scripture stories that teach the same thing.</p>' +
        '<p class="fs-empty-note">Your stories are private to your family, and they reach the app and the Sacred World Timeline too.</p>' +
        '<button type="button" class="fs-btn fs-btn-gold" id="fs-signin">Sign in to start</button>' +
      '</div>';
  }

  function virtueChips(list) {
    if (!list || !list.length) return "";
    var out = "";
    for (var i = 0; i < list.length; i++) {
      out += '<span class="fs-chip">' + esc(virtueLabel(list[i])) + "</span>";
    }
    return '<div class="fs-chips">' + out + "</div>";
  }

  /* Scripture stories that teach the same virtue — the actual connection. */
  function companions(rec) {
    if (!rec.virtues || !rec.virtues.length) return "";
    var want = rec.virtues;
    var hits = [];
    var all = stories();
    for (var i = 0; i < all.length && hits.length < 3; i++) {
      var s = all[i];
      if (s.id === rec.story_id) continue;
      var sv = s.virtues || [];
      for (var j = 0; j < want.length; j++) {
        if (sv.indexOf(want[j]) !== -1) { hits.push(s); break; }
      }
    }
    if (!hits.length) return "";
    var links = hits.map(function (s) {
      return '<button type="button" class="fs-link" data-story="' + esc(s.id) + '">' + esc(s.title) + "</button>";
    }).join(", ");
    return '<p class="fs-companion"><span>Read alongside:</span> ' + links + "</p>";
  }

  function cardView(r) {
    var linked = r.story_id ? storyById(r.story_id) : null;
    return '' +
      '<article class="fs-card">' +
        '<div class="fs-card-head">' +
          "<h3>" + esc(r.title || "Untitled") + "</h3>" +
          '<div class="fs-card-acts">' +
            '<button type="button" class="fs-icon" data-edit="' + esc(r.id) + '" aria-label="Edit">&#9998;</button>' +
            '<button type="button" class="fs-icon" data-del="' + esc(r.id) + '" aria-label="Delete">&#128465;</button>' +
          "</div>" +
        "</div>" +
        '<p class="fs-meta">' +
          (r.person ? esc(r.person) : "") +
          (r.person && r.year ? " &middot; " : "") +
          (r.year ? esc(r.year) : "") +
        "</p>" +
        (r.body ? "<p class=\"fs-body\">" + esc(r.body) + "</p>" : "") +
        virtueChips(r.virtues) +
        (linked ? '<p class="fs-linked">Linked to <button type="button" class="fs-link" data-story="' + esc(linked.id) + '">' + esc(linked.title) + "</button></p>" : "") +
        companions(r) +
      "</article>";
  }

  function formView(rec) {
    var v = virtues();
    var chosen = rec.virtues || [];
    var vOpts = "";
    for (var i = 0; i < v.length; i++) {
      var on = chosen.indexOf(v[i].id) !== -1;
      vOpts += '<label class="fs-vopt' + (on ? " on" : "") + '">' +
        '<input type="checkbox" value="' + esc(v[i].id) + '"' + (on ? " checked" : "") + ">" +
        esc(v[i].label || v[i].name || v[i].id) + "</label>";
    }

    var all = stories().slice().sort(function (a, b) {
      return (a.title || "").localeCompare(b.title || "");
    });
    var sOpts = '<option value="">— none —</option>';
    for (var k = 0; k < all.length; k++) {
      sOpts += '<option value="' + esc(all[k].id) + '"' +
        (all[k].id === rec.story_id ? " selected" : "") + ">" +
        esc(all[k].title) + " (" + esc(all[k].scripture || "") + ")</option>";
    }

    return '' +
      '<form class="fs-form" id="fs-form">' +
        "<h3>" + (rec.id ? "Edit this story" : "Add a family story") + "</h3>" +
        '<label class="fs-l">Title<input class="fs-in" id="fs-title" value="' + esc(rec.title || "") + '" placeholder="Grandpa Wells and the long winter" required></label>' +
        '<div class="fs-row">' +
          '<label class="fs-l">Who it&rsquo;s about<input class="fs-in" id="fs-person" value="' + esc(rec.person || "") + '" placeholder="Great-grandfather Wells"></label>' +
          '<label class="fs-l fs-l-sm">Year<input class="fs-in" id="fs-year" type="number" inputmode="numeric" value="' + esc(rec.year == null ? "" : rec.year) + '" placeholder="1887"></label>' +
        "</div>" +
        '<label class="fs-l">The story<textarea class="fs-in fs-ta" id="fs-body" rows="5" placeholder="Tell it the way you would tell it at the table.">' + esc(rec.body || "") + "</textarea></label>" +
        '<label class="fs-l">Reads alongside this scripture story<select class="fs-in" id="fs-story">' + sOpts + "</select></label>" +
        '<div class="fs-l"><span class="fs-l-t">What it teaches</span><div class="fs-vopts" id="fs-virtues">' + vOpts + "</div></div>" +
        '<div class="fs-err" id="fs-err"></div>' +
        '<div class="fs-acts">' +
          '<button type="submit" class="fs-btn fs-btn-gold">Save story</button>' +
          '<button type="button" class="fs-btn" id="fs-cancel">Cancel</button>' +
        "</div>" +
      "</form>";
  }

  function listView() {
    var head = '' +
      '<div class="fs-bar">' +
        '<button type="button" class="fs-btn fs-btn-gold" id="fs-add">+ Add a family story</button>' +
        (rows.length ? '<select class="fs-in fs-filter" id="fs-filter">' + filterOpts() + "</select>" : "") +
        '<span class="fs-who">Signed in as ' + esc(window.LSTAuth.email() || "") +
          ' &middot; <button type="button" class="fs-link" id="fs-signout">sign out</button></span>' +
      "</div>";

    if (loadError) {
      return head + '<p class="fs-note fs-note-warn">' + esc(loadError) + "</p>";
    }
    if (!rows.length) {
      return head +
        '<div class="fs-empty fs-empty-sm">' +
          "<h3>Nothing here yet</h3>" +
          "<p>Start with one. The story you already tell your children &mdash; write it down before it goes.</p>" +
        "</div>";
    }

    var shown = rows.filter(function (r) {
      return !filterVirtue || (r.virtues || []).indexOf(filterVirtue) !== -1;
    });
    if (!shown.length) {
      return head + '<p class="fs-note">No family stories tagged with that virtue yet.</p>';
    }
    return head + '<div class="fs-grid">' + shown.map(cardView).join("") + "</div>";
  }

  function filterOpts() {
    var seen = {};
    rows.forEach(function (r) { (r.virtues || []).forEach(function (v) { seen[v] = 1; }); });
    var out = '<option value="">All virtues</option>';
    Object.keys(seen).sort().forEach(function (id) {
      out += '<option value="' + esc(id) + '"' + (id === filterVirtue ? " selected" : "") + ">" +
        esc(virtueLabel(id)) + "</option>";
    });
    return out;
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    if (!root) return;
    if (!window.LSTAuth || !window.LSTAuth.signedIn()) {
      root.innerHTML = signedOutView();
      var si = document.getElementById("fs-signin");
      if (si) si.addEventListener("click", function () {
        window.LSTAuth.openSignIn("Sign in to keep your family's stories.");
      });
      return;
    }
    if (!loaded) { root.innerHTML = '<p class="fs-note">Loading your family stories&hellip;</p>'; return; }
    if (editing) { root.innerHTML = formView(editing); wireForm(); return; }
    root.innerHTML = listView();
    wireList();
  }

  function wireList() {
    var add = document.getElementById("fs-add");
    if (add) add.addEventListener("click", function () { editing = {}; render(); });

    var f = document.getElementById("fs-filter");
    if (f) f.addEventListener("change", function () { filterVirtue = this.value; render(); });

    var so = document.getElementById("fs-signout");
    if (so) so.addEventListener("click", function () { window.LSTAuth.signOut(); });

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
        if (!window.confirm("Delete this family story? This cannot be undone.")) return;
        remove(id).then(load).then(render);
      });
    });

    wireStoryLinks();
  }

  /* Clicking a scripture story opens it in the library's own modal. */
  function wireStoryLinks() {
    root.querySelectorAll("[data-story]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.getAttribute("data-story");
        if (window.LSTVirtueLibrary && window.LSTVirtueLibrary.openStory) {
          window.LSTVirtueLibrary.openStory(id);
        }
      });
    });
  }

  function wireForm() {
    var form = document.getElementById("fs-form");
    var cancel = document.getElementById("fs-cancel");

    root.querySelectorAll("#fs-virtues .fs-vopt input").forEach(function (cb) {
      cb.addEventListener("change", function () {
        this.parentNode.classList.toggle("on", this.checked);
      });
    });

    if (cancel) cancel.addEventListener("click", function () { editing = null; render(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("fs-err");
      var title = (document.getElementById("fs-title").value || "").trim();
      if (!title) { err.textContent = "Please give the story a title."; return; }

      var picked = [];
      root.querySelectorAll("#fs-virtues .fs-vopt input:checked").forEach(function (cb) {
        picked.push(cb.value);
      });

      var rec = {
        id: editing.id,
        title: title,
        person: (document.getElementById("fs-person").value || "").trim(),
        year: (document.getElementById("fs-year").value || "").trim(),
        body: (document.getElementById("fs-body").value || "").trim(),
        story_id: document.getElementById("fs-story").value || "",
        virtues: picked
      };

      err.textContent = "Saving…";
      save(rec).then(function (res) {
        if (res && res.error) { err.textContent = res.error.message; return; }
        editing = null;
        return load().then(render);
      }).catch(function () {
        err.textContent = "We couldn't save that. Please try again.";
      });
    });
  }

  /* ------------------------------------------------------------------ init */
  var API = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root || !window.LSTAuth) return;

      window.LSTAuth.ready(function () {
        if (window.LSTAuth.signedIn()) load().then(render);
        else render();
      });

      window.LSTAuth.onChange(function () {
        loaded = false;
        editing = null;
        if (window.LSTAuth.signedIn()) { render(); load().then(render); }
        else { rows = []; loaded = true; render(); }
      });
    },
    /* Used by the library to show a virtue's family stories inline. */
    forVirtue: function (id) {
      return rows.filter(function (r) { return (r.virtues || []).indexOf(id) !== -1; });
    },
    forStory: function (id) {
      return rows.filter(function (r) { return r.story_id === id; });
    }
  };

  window.LSTFamilyStories = API;
})();
