/* FAMILY STORIES — the family's own half of the Virtue Library.

   The library holds the scripture stories, each tagged by virtue, life
   situation, feeling, traveler and scripture. This holds the family's own
   stories, tagged the SAME five ways, and looked up through the same five
   doors. Open "By Virtue" → courage and you get Daniel in the lions' den
   and the great-grandfather who walked away from everything he owned.

   Every tag list is read live from window.LST_LIBRARY, so when a new month
   of stories adds virtues, situations or feelings, they appear here on the
   next page load with nothing to change in this file.

   Rows live in Supabase `family_stories`, keyed to the signed-in user, so
   the same stories reach the app and the Sacred World Timeline.

   Entries written here are `kind = 'history'` and deliberately leave
   `entry_date` NULL — the app's own Family Stories are a one-per-day
   journal keyed on that column, and these must not collide with it. A
   family can have twenty ancestors born in the same year.

   Mount with: LSTFamilyStories.mount("lst-family")
*/
(function () {
  var TABLE = "family_stories";

  /* The lookup doors, in the same order and wording as the library's own. */
  var AXES = [
    { id: "virtue",    label: "By Virtue or Principle", noun: "virtues and principles" },
    { id: "situation", label: "By Life Situation",      noun: "life situations" },
    { id: "feeling",   label: "By Feeling",             noun: "feelings" },
    { id: "traveler",  label: "By Traveler",            noun: "travelers" },
    { id: "scripture", label: "By Scripture",           noun: "books of scripture" }
  ];

  var root = null;
  var rows = [];
  var loaded = false;
  var editing = null;          // row being edited, {} for a new one
  var axis = "virtue";
  var value = "";              // "" = show everything on this axis
  var loadError = "";

  /* ------------------------------------------------------- library lookups */
  function lib() { return window.LST_LIBRARY || {}; }
  function listOf(k) { return lib()[k] || []; }
  function virtues()   { return listOf("virtues"); }
  function situations(){ return listOf("situations"); }
  function feelings()  { return listOf("feelings"); }
  function travelers() { return listOf("travelers"); }
  function stories()   { return listOf("stories"); }

  function nameOf(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i].label || list[i].name || id;
    }
    return id;
  }
  function virtueLabel(id) { return nameOf(virtues(), id); }
  function storyById(id) {
    var s = stories();
    for (var i = 0; i < s.length; i++) if (s[i].id === id) return s[i];
    return null;
  }

  /* Which library list backs each axis. */
  function axisList(a) {
    if (a === "virtue") return virtues();
    if (a === "situation") return situations();
    if (a === "feeling") return feelings();
    if (a === "traveler") return travelers();
    return [];                                   // scripture is free text
  }
  function axisLabel(a, id) {
    if (a === "scripture") return id;
    return nameOf(axisList(a), id);
  }

  /* The values a single family story carries on a given axis. */
  function tagsOn(r, a) {
    if (a === "virtue")    return r.virtues || [];
    if (a === "situation") return r.situations || [];
    if (a === "feeling")   return r.feelings || [];
    if (a === "traveler")  return r.traveler ? [r.traveler] : [];
    if (a === "scripture") {
      var book = scriptureBook(r);
      return book ? [book] : [];
    }
    return [];
  }

  /* "Ruth 1" → "Ruth". Falls back to the linked library story's own book. */
  function scriptureBook(r) {
    if (r.scripture) {
      var m = String(r.scripture).trim()
        .match(/^([0-9]?\s*[A-Za-z][A-Za-z\s.]*?)(?:\s+\d|$)/);
      if (m) return m[1].replace(/\s+/g, " ").trim();
    }
    if (r.story_id) {
      var s = storyById(r.story_id);
      if (s && s.scriptureBook) return s.scriptureBook;
    }
    return "";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sb() { return window.LSTAuth ? window.LSTAuth.client() : null; }

  /* ------------------------------------------------------------------ data */
  var COLS = "id,title,person,year,body,virtues,situations,feelings,traveler,scripture,story_id,kind";

  function load() {
    var c = sb();
    if (!c || !window.LSTAuth.signedIn()) { rows = []; loaded = true; return Promise.resolve(); }
    return c.from(TABLE).select(COLS).eq("kind", "history").order("year", { ascending: true })
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
      .catch(function () { loaded = true; loadError = "We couldn't reach the server just now."; });
  }

  function save(rec) {
    var c = sb(), u = window.LSTAuth.user();
    if (!c || !u) return Promise.reject(new Error("not signed in"));
    var payload = {
      user_id: u.id,
      kind: "history",
      title: rec.title,
      person: rec.person || null,
      year: rec.year === "" || rec.year == null ? null : parseInt(rec.year, 10),
      body: rec.body || null,
      virtues:    rec.virtues    && rec.virtues.length    ? rec.virtues    : null,
      situations: rec.situations && rec.situations.length ? rec.situations : null,
      feelings:   rec.feelings   && rec.feelings.length   ? rec.feelings   : null,
      traveler:   rec.traveler   || null,
      scripture:  rec.scripture  || null,
      story_id:   rec.story_id   || null
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
        '<p>The library above holds the scripture stories. This is where your own go &mdash; the ancestor who kept a promise, the grandmother whose faith held, the night a prayer was answered. Tag them by virtue, life situation, feeling, traveler and scripture, exactly like the scripture stories, and look them up the same five ways.</p>' +
        '<p class="fs-empty-note">Your stories are private to your family, and they reach the app and the Sacred World Timeline too.</p>' +
        '<button type="button" class="fs-btn fs-btn-gold" id="fs-signin">Sign in to start</button>' +
      '</div>';
  }

  function chips(r) {
    var out = "";
    (r.virtues || []).forEach(function (v) {
      out += '<span class="fs-chip">' + esc(virtueLabel(v)) + "</span>";
    });
    (r.feelings || []).forEach(function (f) {
      out += '<span class="fs-chip fs-chip-feel">' + esc(nameOf(feelings(), f)) + "</span>";
    });
    (r.situations || []).forEach(function (s) {
      out += '<span class="fs-chip fs-chip-sit">' + esc(nameOf(situations(), s)) + "</span>";
    });
    if (r.traveler) {
      out += '<span class="fs-chip fs-chip-trav">' + esc(nameOf(travelers(), r.traveler)) + "</span>";
    }
    return out ? '<div class="fs-chips">' + out + "</div>" : "";
  }

  /* Scripture stories that share a tag with this family story — the point of
     keeping both on one page. */
  function companions(r) {
    var wantV = r.virtues || [], wantF = r.feelings || [];
    if (!wantV.length && !wantF.length) return "";
    var hits = [], all = stories();
    for (var i = 0; i < all.length && hits.length < 3; i++) {
      var s = all[i];
      if (s.id === r.story_id) continue;
      var sv = s.virtues || [];
      var match = false;
      for (var j = 0; j < wantV.length && !match; j++) if (sv.indexOf(wantV[j]) !== -1) match = true;
      if (!match && s.feeling && wantF.indexOf(s.feeling) !== -1) match = true;
      if (match) hits.push(s);
    }
    if (!hits.length) return "";
    var links = hits.map(function (s) {
      return '<button type="button" class="fs-link" data-story="' + esc(s.id) + '">' + esc(s.title) + "</button>";
    }).join(", ");
    return '<p class="fs-companion"><span>Read alongside:</span> ' + links + "</p>";
  }

  function cardView(r) {
    var linked = r.story_id ? storyById(r.story_id) : null;
    var ref = r.scripture || (linked ? linked.scripture : "");
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
          (r.person && r.year ? " &middot; " : "") + (r.year ? esc(r.year) : "") +
          (ref ? (r.person || r.year ? " &middot; " : "") + esc(ref) : "") +
        "</p>" +
        (r.body ? '<p class="fs-body">' + esc(r.body) + "</p>" : "") +
        chips(r) +
        (linked ? '<p class="fs-linked">Linked to <button type="button" class="fs-link" data-story="' +
          esc(linked.id) + '">' + esc(linked.title) + "</button></p>" : "") +
        companions(r) +
      "</article>";
  }

  /* --------------------------------------------------------------- the form */
  function chipGroup(id, list, chosen, open) {
    var opts = "";
    for (var i = 0; i < list.length; i++) {
      var on = chosen.indexOf(list[i].id) !== -1;
      opts += '<label class="fs-vopt' + (on ? " on" : "") + '">' +
        '<input type="checkbox" value="' + esc(list[i].id) + '"' + (on ? " checked" : "") + ">" +
        esc(list[i].label || list[i].name || list[i].id) + "</label>";
    }
    return '<details class="fs-det"' + (open ? " open" : "") + ">" +
      "<summary>" + esc(id.label) + ' <span class="fs-det-n">' + list.length + "</span></summary>" +
      '<div class="fs-vopts" id="' + esc(id.el) + '">' + opts + "</div></details>";
  }

  function formView(rec) {
    var all = stories().slice().sort(function (a, b) {
      return (a.title || "").localeCompare(b.title || "");
    });
    var sOpts = '<option value="">&mdash; none &mdash;</option>';
    for (var k = 0; k < all.length; k++) {
      sOpts += '<option value="' + esc(all[k].id) + '"' +
        (all[k].id === rec.story_id ? " selected" : "") + ">" +
        esc(all[k].title) + " (" + esc(all[k].scripture || "") + ")</option>";
    }
    var tOpts = '<option value="">&mdash; none &mdash;</option>';
    travelers().forEach(function (t) {
      tOpts += '<option value="' + esc(t.id) + '"' + (t.id === rec.traveler ? " selected" : "") +
        ">" + esc(t.name || t.id) + "</option>";
    });

    return '' +
      '<form class="fs-form" id="fs-form">' +
        "<h3>" + (rec.id ? "Edit this story" : "Add a family story") + "</h3>" +

        '<label class="fs-l">Title<input class="fs-in" id="fs-title" value="' + esc(rec.title || "") +
          '" placeholder="Grandpa Wells and the long winter" required></label>' +

        '<div class="fs-row">' +
          '<label class="fs-l">Who it&rsquo;s about<input class="fs-in" id="fs-person" value="' +
            esc(rec.person || "") + '" placeholder="Great-grandfather Wells"></label>' +
          '<label class="fs-l fs-l-sm">Year<input class="fs-in" id="fs-year" type="number" inputmode="numeric" value="' +
            esc(rec.year == null ? "" : rec.year) + '" placeholder="1887"></label>' +
        "</div>" +

        '<label class="fs-l">The story<textarea class="fs-in fs-ta" id="fs-body" rows="5" placeholder="Tell it the way you would tell it at the table.">' +
          esc(rec.body || "") + "</textarea></label>" +

        '<div class="fs-row">' +
          '<label class="fs-l">Reads alongside this scripture story<select class="fs-in" id="fs-story">' + sOpts + "</select></label>" +
          '<label class="fs-l fs-l-sm">Traveler<select class="fs-in" id="fs-trav">' + tOpts + "</select></label>" +
        "</div>" +

        '<label class="fs-l">Scripture reference <span class="fs-hint">(only if it isn&rsquo;t one of the stories above)</span>' +
          '<input class="fs-in" id="fs-scripture" value="' + esc(rec.scripture || "") + '" placeholder="Ruth 1"></label>' +

        '<div class="fs-l"><span class="fs-l-t">Tag it &mdash; the same way the scripture stories are tagged</span>' +
          chipGroup({ el: "fs-virtues",    label: "Virtues &amp; principles" }, virtues(),    rec.virtues || [],    true) +
          chipGroup({ el: "fs-feelings",   label: "Feelings" },                 feelings(),   rec.feelings || [],   false) +
          chipGroup({ el: "fs-situations", label: "Life situations" },          situations(), rec.situations || [], false) +
        "</div>" +

        '<div class="fs-err" id="fs-err"></div>' +
        '<div class="fs-acts">' +
          '<button type="submit" class="fs-btn fs-btn-gold">Save story</button>' +
          '<button type="button" class="fs-btn" id="fs-cancel">Cancel</button>' +
        "</div>" +
      "</form>";
  }

  /* --------------------------------------------------------------- browsing */
  /* Every value on the current axis that at least one family story carries. */
  function valuesOnAxis() {
    var counts = {};
    rows.forEach(function (r) {
      tagsOn(r, axis).forEach(function (v) {
        if (!v) return;
        counts[v] = (counts[v] || 0) + 1;
      });
    });
    return Object.keys(counts).sort(function (a, b) {
      return axisLabel(axis, a).localeCompare(axisLabel(axis, b));
    }).map(function (id) {
      return { id: id, n: counts[id], label: axisLabel(axis, id) };
    });
  }

  function axisTabs() {
    return '<div class="fs-axes" role="tablist">' + AXES.map(function (a) {
      return '<button type="button" class="fs-axis' + (a.id === axis ? " on" : "") +
        '" role="tab" aria-selected="' + (a.id === axis) + '" data-axis="' + a.id + '">' +
        esc(a.label) + "</button>";
    }).join("") + "</div>";
  }

  function valueBar() {
    var vals = valuesOnAxis();
    if (!vals.length) return "";
    var out = '<button type="button" class="fs-val' + (value === "" ? " on" : "") + '" data-val="">All</button>';
    vals.forEach(function (v) {
      out += '<button type="button" class="fs-val' + (v.id === value ? " on" : "") +
        '" data-val="' + esc(v.id) + '">' + esc(v.label) +
        ' <span class="fs-val-n">' + v.n + "</span></button>";
    });
    return '<div class="fs-vals">' + out + "</div>";
  }

  function listView() {
    var head =
      '<div class="fs-bar">' +
        '<button type="button" class="fs-btn fs-btn-gold" id="fs-add">+ Add a family story</button>' +
        '<span class="fs-who">Signed in as ' + esc(window.LSTAuth.email() || "") +
          (window.LSTAuth.isAdmin && window.LSTAuth.isAdmin() ? ' <span class="fs-admin">admin</span>' : "") +
          ' &middot; <button type="button" class="fs-link" id="fs-signout">sign out</button></span>' +
      "</div>";

    if (loadError) return head + '<p class="fs-note fs-note-warn">' + esc(loadError) + "</p>";

    if (!rows.length) {
      return head +
        '<div class="fs-empty fs-empty-sm">' +
          "<h3>Nothing here yet</h3>" +
          "<p>Start with one. The story you already tell your children &mdash; write it down before it goes.</p>" +
        "</div>";
    }

    var shown = value
      ? rows.filter(function (r) { return tagsOn(r, axis).indexOf(value) !== -1; })
      : rows;

    var body = shown.length
      ? '<div class="fs-grid">' + shown.map(cardView).join("") + "</div>"
      : '<p class="fs-note">No family stories tagged that way yet.</p>';

    var untagged = rows.filter(function (r) { return !tagsOn(r, axis).length; }).length;
    var note = (!value && untagged)
      ? '<p class="fs-note fs-note-sm">' + untagged + " of your " + rows.length +
        " stories have nothing on this axis yet &mdash; open one and add a tag." + "</p>"
      : "";

    return head + axisTabs() + valueBar() + note + body;
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

    var so = document.getElementById("fs-signout");
    if (so) so.addEventListener("click", function () { window.LSTAuth.signOut(); });

    root.querySelectorAll("[data-axis]").forEach(function (b) {
      b.addEventListener("click", function () {
        axis = this.getAttribute("data-axis");
        value = "";
        render();
      });
    });
    root.querySelectorAll("[data-val]").forEach(function (b) {
      b.addEventListener("click", function () {
        value = this.getAttribute("data-val");
        render();
      });
    });
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

  function picked(containerId) {
    var out = [];
    root.querySelectorAll("#" + containerId + " input:checked").forEach(function (cb) {
      out.push(cb.value);
    });
    return out;
  }

  function wireForm() {
    var form = document.getElementById("fs-form");
    var cancel = document.getElementById("fs-cancel");

    root.querySelectorAll(".fs-vopt input").forEach(function (cb) {
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

      var rec = {
        id: editing.id,
        title: title,
        person: (document.getElementById("fs-person").value || "").trim(),
        year: (document.getElementById("fs-year").value || "").trim(),
        body: (document.getElementById("fs-body").value || "").trim(),
        story_id: document.getElementById("fs-story").value || "",
        traveler: document.getElementById("fs-trav").value || "",
        scripture: (document.getElementById("fs-scripture").value || "").trim(),
        virtues: picked("fs-virtues"),
        feelings: picked("fs-feelings"),
        situations: picked("fs-situations")
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
  window.LSTFamilyStories = {
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

    /* Used by the library to surface a family's own stories next to a
       virtue or a scripture story. */
    forAxis: function (a, v) {
      return rows.filter(function (r) { return tagsOn(r, a).indexOf(v) !== -1; });
    },
    forStory: function (id) {
      return rows.filter(function (r) { return r.story_id === id; });
    },
    all: function () { return rows.slice(); }
  };
})();
