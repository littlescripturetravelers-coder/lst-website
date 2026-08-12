/* =========================================================================
   THE VIRTUE LIBRARY  —  Little Scripture Travelers
   Reads window.LST_LIBRARY from data/virtue-library.js
   ========================================================================= */
(function () {
  "use strict";

  var L = window.LST_LIBRARY;
  if (!L) { console.error("[Virtue Library] data file did not load"); return; }

  /* ---------- helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function norm(s) { return String(s || "").toLowerCase(); }

  var STORIES  = L.stories   || [];
  var VIRTUES  = L.virtues   || [];
  var FEELINGS = L.feelings  || [];
  var SITS     = L.situations|| [];
  var TRAVS    = L.travelers || [];
  var STAGES   = L.stages    || [];

  /* ---------- indexes ---------- */
  var byVirtue = {}, byFeeling = {}, byTraveler = {}, byScripture = {};
  STORIES.forEach(function (s) {
    (s.virtues || []).forEach(function (v) { (byVirtue[v] = byVirtue[v] || []).push(s); });
    if (s.feeling)  (byFeeling[s.feeling]   = byFeeling[s.feeling]   || []).push(s);
    if (s.traveler) (byTraveler[s.traveler] = byTraveler[s.traveler] || []).push(s);
    if (s.scriptureBook) (byScripture[s.scriptureBook] = byScripture[s.scriptureBook] || []).push(s);
  });

  /* stage filter: a story matches if it carries the stage, or if it has no
     stages recorded at all (older entries default to the active stages)     */
  var activeStageIds = STAGES.filter(function (t) { return t.status === "active"; })
                            .map(function (t) { return t.id; });
  function inStage(s, stageId) {
    if (!stageId) return true;
    var st = s.stages && s.stages.length ? s.stages : activeStageIds;
    return st.indexOf(stageId) !== -1;
  }
  function filterStories(list, stageId) {
    return (list || []).filter(function (s) { return inStage(s, stageId); });
  }

  /* ---------- state ---------- */
  var state = { axis: "virtue", q: "", stage: "", view: null };

  /* =====================================================================
     GROWTH METER
     ===================================================================== */
  function renderGrowth() {
    var have = STORIES.length;
    var total = (L.meta && L.meta.plannedTotal) || 1440;
    var pct = Math.max(1.5, (have / total) * 100);
    var bar = el("vl-bar");
    if (bar) setTimeout(function () { bar.style.width = pct.toFixed(1) + "%"; }, 250);
    var books = {};
    STORIES.forEach(function (s) { books[s.book] = 1; });
    var note = el("vl-growth-note");
    if (note) {
      note.innerHTML = "<strong>" + have + " stories</strong> catalogued across " +
        Object.keys(books).length + " books, tagged with " + VIRTUES.length +
        " virtues and principles. Growing toward " + total.toLocaleString() +
        " as the series is written &mdash; new stories are added every month.";
    }
  }

  /* =====================================================================
     DEVELOPMENT STAGES STRIP
     ===================================================================== */
  function renderStages() {
    var wrap = el("vl-stage-grid");
    if (!wrap) return;
    wrap.innerHTML = STAGES.map(function (t) {
      var live = t.status === "active";
      var n = live ? filterStories(STORIES, t.id).length : 0;
      return '<div class="vl-stage-card' + (live ? " on" : "") + '">' +
        '<span class="vl-stage-badge ' + (live ? "live" : "soon") + '">' +
          (live ? n + " stories" : "In development") + '</span>' +
        "<h4>" + esc(t.name) + "</h4>" +
        '<p class="vl-stage-ages">Ages ' + esc(t.ages) + "</p>" +
        "<p>" + esc(t.developmental) + "</p>" +
      "</div>";
    }).join("");
  }

  function renderStageFilter() {
    var sel = el("vl-stage-filter");
    if (!sel) return;
    var opts = ['<option value="">Every stage</option>'];
    STAGES.forEach(function (t) {
      if (t.status !== "active") return;
      opts.push('<option value="' + esc(t.id) + '">' + esc(t.name) + " (ages " + esc(t.ages) + ")</option>");
    });
    sel.innerHTML = opts.join("");
  }

  /* =====================================================================
     BROWSE VIEW  —  the five axes
     ===================================================================== */
  var CAT_LABEL = { character: "Character", heart: "Heart", faith: "Faith", family: "Family" };

  function cards() {
    var q = norm(state.q), stage = state.stage, out = [];

    if (state.axis === "virtue") {
      VIRTUES.forEach(function (v) {
        var hay = norm(v.name + " " + v.definition + " " + v.id);
        if (q && hay.indexOf(q) === -1) return;
        var n = filterStories(byVirtue[v.id], stage).length;
        out.push({ kind: "virtue", id: v.id, cat: CAT_LABEL[v.category] || v.category,
                   title: v.name, body: v.definition, n: n });
      });
      out.sort(function (a, b) { return b.n - a.n || a.title.localeCompare(b.title); });

    } else if (state.axis === "situation") {
      SITS.forEach(function (s) {
        var vnames = (s.virtues || []).map(function (vid) {
          var vv = byId(VIRTUES, vid); return vv ? vv.name : vid;
        });
        var hay = norm(s.name + " " + vnames.join(" "));
        if (q && hay.indexOf(q) === -1) return;
        var seen = {}, n = 0;
        (s.virtues || []).forEach(function (vid) {
          filterStories(byVirtue[vid], stage).forEach(function (st) {
            if (!seen[st.id]) { seen[st.id] = 1; n++; }
          });
        });
        out.push({ kind: "situation", id: s.id, cat: "Life Situation",
                   title: s.name, body: "Teaches " + vnames.join(" \u00b7 "), n: n });
      });
      out.sort(function (a, b) { return b.n - a.n || a.title.localeCompare(b.title); });

    } else if (state.axis === "feeling") {
      var keys = Object.keys(byFeeling).sort();
      keys.forEach(function (f) {
        var known = byId(FEELINGS, f);
        var label = known ? known.name : f.charAt(0).toUpperCase() + f.slice(1);
        var body = known ? (known.body || "") :
          "Stories where a Traveler names this feeling and finds a way through it.";
        if (q && norm(label + " " + body).indexOf(q) === -1) return;
        var n = filterStories(byFeeling[f], stage).length;
        out.push({ kind: "feeling", id: f, cat: "Feeling", title: label, body: body, n: n });
      });
      out.sort(function (a, b) { return b.n - a.n || a.title.localeCompare(b.title); });

    } else if (state.axis === "traveler") {
      TRAVS.forEach(function (t) {
        if (q && norm(t.name + " " + t.domain + " " + t.motto).indexOf(q) === -1) return;
        var n = filterStories(byTraveler[t.id], stage).length;
        out.push({ kind: "traveler", id: t.id, cat: t.domain,
                   title: t.name, body: "\u201c" + t.motto + "\u201d", n: n });
      });

    } else if (state.axis === "scripture") {
      Object.keys(byScripture).forEach(function (b) {
        if (q && norm(b).indexOf(q) === -1) return;
        var list = filterStories(byScripture[b], stage);
        if (!list.length && !q) return;
        out.push({ kind: "scripture", id: b, cat: "Old Testament", title: b,
                   body: list.length + " " + (list.length === 1 ? "story" : "stories") +
                         " from " + b + ".", n: list.length });
      });
      out.sort(function (a, b) { return b.n - a.n || a.title.localeCompare(b.title); });
    }
    return out;
  }

  var AXIS_NOUN = { virtue: "virtues and principles", situation: "life situations",
                    feeling: "feelings", traveler: "Travelers", scripture: "scripture books" };

  function renderBrowse() {
    var list = cards(), wrap = el("vl-results"), count = el("vl-count");

    if (count) {
      var withStories = list.filter(function (c) { return c.n > 0; }).length;
      count.innerHTML = list.length
        ? list.length + " " + AXIS_NOUN[state.axis] + " &middot; " + withStories + " with stories ready"
        : "";
    }
    if (!wrap) return;

    if (!list.length) {
      wrap.innerHTML = '<div class="vl-empty" style="grid-column:1/-1"><strong>Nothing matched that.</strong>' +
        "Try a different word &mdash; or clear the search to browse everything.</div>";
      return;
    }
    wrap.innerHTML = list.map(function (c) {
      return '<button class="vl-card" data-kind="' + esc(c.kind) + '" data-id="' + esc(c.id) + '">' +
        '<span class="vl-cat">' + esc(c.cat) + "</span>" +
        "<h3>" + esc(c.title) + "</h3>" +
        "<p>" + esc(c.body) + "</p>" +
        '<span class="vl-tally' + (c.n ? "" : " zero") + '">' +
          (c.n ? c.n + " " + (c.n === 1 ? "story" : "stories") : "Coming soon") +
        "</span></button>";
    }).join("");
  }

  /* =====================================================================
     DETAIL VIEW  —  a virtue / situation / feeling / traveler / book
     ===================================================================== */
  function storiesFor(kind, id) {
    var stage = state.stage;
    if (kind === "virtue")    return filterStories(byVirtue[id], stage);
    if (kind === "feeling")   return filterStories(byFeeling[id], stage);
    if (kind === "traveler")  return filterStories(byTraveler[id], stage);
    if (kind === "scripture") return filterStories(byScripture[id], stage);
    if (kind === "situation") {
      var s = byId(SITS, id), seen = {}, out = [];
      if (!s) return [];
      (s.virtues || []).forEach(function (vid) {
        filterStories(byVirtue[vid], stage).forEach(function (st) {
          if (!seen[st.id]) { seen[st.id] = 1; out.push(st); }
        });
      });
      return out;
    }
    return [];
  }

  function detailHead(kind, id) {
    var t, d, eyebrow;
    if (kind === "virtue") {
      var v = byId(VIRTUES, id) || {};
      eyebrow = CAT_LABEL[v.category] || "Virtue"; t = v.name || id; d = v.definition || "";
    } else if (kind === "situation") {
      var s = byId(SITS, id) || {};
      eyebrow = "Life Situation"; t = s.name || id;
      d = "Every story in the library that speaks to this moment \u2014 gathered from the virtues it touches.";
      if (s.virtues && s.virtues.length) {
        var names = s.virtues.map(function (vid) {
          var vv = byId(VIRTUES, vid); return vv ? vv.name : vid;
        });
        d += " <br><br><em>Teaches:</em> " + names.join(" &middot; ");
      }
    } else if (kind === "feeling") {
      var f = byId(FEELINGS, id);
      eyebrow = "Feeling";
      t = f ? f.name : id.charAt(0).toUpperCase() + id.slice(1);
      d = f ? ("<em>In the body:</em> " + esc(f.body) + "<br><em>In the mind:</em> " + f.mind +
               "<br><em>What helps:</em> " + esc(f.response))
            : "Stories where a Traveler names this feeling and walks through it.";
    } else if (kind === "traveler") {
      var tr = byId(TRAVS, id) || {};
      eyebrow = tr.domain || "Traveler"; t = tr.name || id;
      d = "\u201c" + (tr.motto || "") + "\u201d";
    } else {
      eyebrow = "Old Testament"; t = id;
      d = "Every story the library carries from " + esc(id) + ".";
    }
    return '<div class="vl-detail-head"><span class="vl-cat">' + esc(eyebrow) + "</span>" +
      '<h2 id="vl-detail-title">' + esc(t) + "</h2>" +
      '<p class="vl-def">' + d + "</p></div>";
  }

  function renderDetail(kind, id) {
    var list = storiesFor(kind, id), box = el("vl-detail");
    if (!box) return;

    var body;
    if (!list.length) {
      body = '<div class="vl-empty"><strong>No stories tagged with this yet.</strong>' +
        "This principle is in the catalog and stories will be linked to it as the series grows.</div>";
    } else {
      body = "<p class=\"vl-count\" style=\"text-align:left;margin-bottom:1rem\">" +
        list.length + " " + (list.length === 1 ? "story you can" : "stories you can") +
        " use to teach this &mdash; tap one to read it.</p>" +
        '<div class="vl-stories">' + list.map(function (s) {
          var chips = (s.virtues || []).slice(0, 4).map(function (vid) {
            var vv = byId(VIRTUES, vid);
            return '<span class="vl-chip">' + esc(vv ? vv.name : vid) + "</span>";
          }).join("");
          var freeTag = (((L.meta && L.meta.freeStoryIds) || []).indexOf(s.id) !== -1)
            ? '<span class="vl-free">Free</span>' : "";
          return '<button class="vl-story" data-story="' + esc(s.id) + '">' +
            '<span class="vl-story-top"><h4>' + esc(s.title) + freeTag + "</h4>" +
              (s.scripture ? '<span class="vl-ref">' + esc(s.scripture) + "</span>" : "") +
              '<span class="vl-loc">' + esc(s.month) + " &middot; Week " + s.week + ", Night " + s.night + "</span>" +
            "</span>" +
            (s.teachingNote ? '<p class="vl-note">' + esc(s.teachingNote) + "</p>" : "") +
            '<div class="vl-chips">' + chips + "</div></button>";
        }).join("") + "</div>";
    }

    box.innerHTML = '<button class="vl-back" id="vl-back">&#8592; Back to the library</button>' +
      detailHead(kind, id) + body;

    el("vl-browse").hidden = true;
    box.hidden = false;
    state.view = { kind: kind, id: id };
    var h = el("vl-detail-title");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    var tool = el("vl-tool");
    if (tool) window.scrollTo({ top: tool.offsetTop - 20, behavior: "smooth" });
  }

  function backToBrowse() {
    var box = el("vl-detail");
    if (box) { box.hidden = true; box.innerHTML = ""; }
    el("vl-browse").hidden = false;
    state.view = null;
    var tool = el("vl-tool");
    if (tool) window.scrollTo({ top: tool.offsetTop - 20, behavior: "smooth" });
  }

  /* =====================================================================
     SESSION  —  email sign-in. The server decides what may be read; nothing
     here is trusted, and the story text is never in a public file.
     ===================================================================== */
  var SKEY = "lst_vl_session";

  var API = (function () {
    var h = location.hostname;
    if (/(^|\.)littlescripturetravelers\.com$/i.test(h) || h === "localhost" || h === "127.0.0.1") {
      return "/api/library";
    }
    /* Preview builds have no server of their own, so they talk to the live one. */
    return "https://www.littlescripturetravelers.com/api/library";
  })();

  var SESSION = null;

  function loadSession() {
    try { SESSION = JSON.parse(localStorage.getItem(SKEY) || "null"); }
    catch (e) { SESSION = null; }
    return SESSION;
  }
  function saveSession(s) {
    SESSION = s;
    try {
      if (s) localStorage.setItem(SKEY, JSON.stringify(s));
      else localStorage.removeItem(SKEY);
    } catch (e) {}
  }
  function signedIn() { return !!(SESSION && SESSION.token); }
  function isSubscriber() { return !!(SESSION && SESSION.tier === "subscriber"); }
  function freeIds() {
    if (SESSION && SESSION.freeStoryIds && SESSION.freeStoryIds.length) return SESSION.freeStoryIds;
    return (L.meta && L.meta.freeStoryIds) || [];
  }
  function isFree(sid) { return freeIds().indexOf(sid) !== -1; }

  function api(path, opts) {
    opts = opts || {};
    var headers = opts.headers || {};
    if (SESSION && SESSION.token) headers.Authorization = "Bearer " + SESSION.token;
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch(API + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        return { status: r.status, ok: r.ok, data: j };
      });
    });
  }

  /* Re-check on load so a subscription started (or cancelled) since the last
     visit is reflected without the parent doing anything. */
  function refreshSession() {
    if (!signedIn()) return Promise.resolve();
    return api("/me").then(function (r) {
      if (r.status === 401) { saveSession(null); return; }
      if (r.ok && r.data && r.data.signedIn) {
        SESSION.tier = r.data.tier;
        SESSION.email = r.data.email;
        SESSION.freeStoryIds = r.data.freeStoryIds || [];
        saveSession(SESSION);
      }
    }).catch(function () { /* offline — fall back to what we stored */ });
  }

  function signOut() {
    saveSession(null);
    updateSignInStrip();
    closeStory();
    renderBrowse();
  }

  /* The little line at the top of the page showing who is signed in. */
  function updateSignInStrip() {
    var strip = el("vl-who");
    if (!strip) return;
    if (!signedIn()) {
      strip.hidden = true;
      return;
    }
    strip.hidden = false;
    var label = isSubscriber()
      ? "Signed in as <strong>" + esc(SESSION.email) + "</strong> &middot; full library unlocked"
      : "Signed in as <strong>" + esc(SESSION.email) + "</strong> &middot; " +
        freeIds().length + " free stories unlocked";
    strip.innerHTML = '<span>' + label + '</span>' +
      ' <button type="button" class="vl-link" id="vl-signout">Sign out</button>';
    var so = el("vl-signout");
    if (so) so.addEventListener("click", signOut);
  }

  /* =====================================================================
     STORY MODAL  —  click a lesson, land on the story
     ===================================================================== */
  var lastFocus = null;
  var currentStory = null;

  function storyHead(s) {
    var h = [];
    h.push('<span class="vl-modal-eyebrow">' + esc(s.bookTitle) + " &middot; " + esc(s.month) +
           " &middot; Week " + s.week + ", Night " + s.night + "</span>");
    h.push('<h3 id="vl-modal-title">' + esc(s.title) + "</h3>");
    if (s.scripture) h.push('<p class="vl-modal-ref">' + esc(s.scripture) + "</p>");
    return h.join("");
  }

  function storyFoot(s) {
    var h = [];
    if (s.virtues && s.virtues.length) {
      h.push('<div class="vl-sec"><div class="vl-sec-label">What This Teaches</div>' +
        '<div class="vl-chips" style="margin-top:0">' + s.virtues.map(function (vid) {
          var vv = byId(VIRTUES, vid);
          return '<span class="vl-chip" style="background:rgba(13,27,75,.08);color:#1a2c6b;border-color:rgba(13,27,75,.18)">' +
                 esc(vv ? vv.name : vid) + "</span>";
        }).join("") + "</div></div>");
    }
    var bk = byId(L.books || [], s.book) ||
             (L.books || []).filter(function (b) { return b.book === s.book; })[0];
    h.push('<div class="vl-modal-foot"><p>Find this story on <strong>Week ' + s.week +
      ", Night " + s.night + "</strong> of <em>" + esc(s.bookTitle) + "</em>.</p>" +
      (bk && bk.amazon ? '<a class="vl-btn" href="' + esc(bk.amazon) +
        '" target="_blank" rel="noopener">Get the ' + esc(s.month) + " Book</a>" : "") +
      "</div>");
    return h.join("");
  }

  /* The unlocked story, as returned by the server. */
  function storyFull(s, d) {
    var h = [];
    if (d.story && d.story.length) {
      h.push('<div class="vl-sec"><div class="vl-sec-label">Tonight\u2019s Story</div>' +
        d.story.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>");
    }
    if (s.feeling || d.fork) {
      var fb = [];
      if (s.feeling) {
        var fn = byId(FEELINGS, s.feeling);
        fb.push("<p><strong>The feeling to name:</strong> " + esc(fn ? fn.name : s.feeling) + "</p>");
      }
      if (d.fork) fb.push("<p>" + esc(d.fork) + "</p>");
      h.push('<div class="vl-sec"><div class="vl-sec-label">A Feeling Moment</div>' +
             '<div class="vl-box">' + fb.join("") + "</div></div>");
    }
    if (d.rememberThis) {
      h.push('<div class="vl-sec"><div class="vl-sec-label">Remember This</div>' +
             '<div class="vl-box"><p>' + esc(d.rememberThis) + "</p></div></div>");
    }
    if (d.prompt) {
      h.push('<div class="vl-sec"><div class="vl-sec-label">Parent Prompt</div><p>' +
             esc(d.prompt) + "</p></div>");
    }
    return h.join("");
  }

  /* The teaser plus whatever the parent needs to do next. */
  function storyTeaser(s) {
    var h = [];
    if (s.teachingNote) h.push('<div class="vl-sec"><p>' + esc(s.teachingNote) + "</p></div>");
    if (s.teaser) {
      h.push('<div class="vl-sec"><div class="vl-sec-label">Tonight\u2019s Story</div>' +
             '<div class="vl-teaser"><p>' + esc(s.teaser) + "</p></div></div>");
    }
    return h.join("");
  }

  var TRIAL = "/subscribe.html#plans";
  var FREE_N = 3;

  function unlockPanel(s) {
    var total = (STORIES || []).length;
    var words = s.wordCount ? Math.round(s.wordCount / 10) * 10 : 0;

    /* Signed in, but this one is behind the subscription. */
    if (signedIn() && !isSubscriber()) {
      var names = freeIds().map(function (id) {
        var f = byId(STORIES, id);
        return f ? '<button type="button" class="vl-link" data-free="' + esc(id) + '">' + esc(f.title) + "</button>" : "";
      }).filter(Boolean).join(" &middot; ");
      return '<div class="vl-locked">' +
        "<p><strong>This one is part of The Lantern.</strong> " +
        "You have " + freeIds().length + " stories unlocked; there are " + total + " in the library, " +
        "and a new one arrives every night at 5&nbsp;AM.</p>" +
        '<a class="vl-btn" href="' + TRIAL + '" target="_blank" rel="noopener">Start My Free 7-Day Trial</a>' +
        (names ? '<p class="vl-locked-alt">Your free stories: ' + names + "</p>" : "") +
        "</div>";
    }

    /* Not signed in yet. */
    var pitch = isFree(s.id)
      ? "<p><strong>This story is free.</strong> Pop in your email and we\u2019ll send you a " +
        "six-digit code so you can read it tonight" +
        (words ? " \u2014 all " + words + " words" : "") + ", plus " + (FREE_N - 1) + " more.</p>"
      : "<p><strong>Read " + FREE_N + " complete stories free.</strong> Pop in your email and we\u2019ll " +
        "send you a six-digit code. This particular one comes with The Lantern, " +
        "along with all " + total + " stories in the library.</p>";

    return '<div class="vl-locked">' + pitch +
      '<form id="vl-si-form" class="vl-si-form" novalidate>' +
        '<div id="vl-si-step1">' +
          '<label class="vl-si-label" for="vl-si-email">Your email</label>' +
          '<input id="vl-si-email" class="vl-si-input" type="email" name="email" ' +
                 'autocomplete="email" inputmode="email" placeholder="you@example.com" required>' +
          '<button type="submit" class="vl-btn vl-si-btn">Email Me My Code</button>' +
        "</div>" +
        '<div id="vl-si-step2" hidden>' +
          '<label class="vl-si-label" for="vl-si-code">Six-digit code</label>' +
          '<input id="vl-si-code" class="vl-si-input vl-si-code" type="text" name="code" ' +
                 'autocomplete="one-time-code" inputmode="numeric" maxlength="6" ' +
                 'placeholder="000000">' +
          '<button type="submit" class="vl-btn vl-si-btn">Open My Story</button>' +
          '<p class="vl-locked-alt"><button type="button" class="vl-link" id="vl-si-again">' +
            "Send it again</button></p>" +
        "</div>" +
      "</form>" +
      '<p class="vl-si-msg" id="vl-si-msg" role="status" aria-live="polite"></p>' +
      '<p class="vl-locked-alt">Already subscribed? Use the same email you subscribed with ' +
      "and the whole library opens.</p>" +
      "</div>";
  }

  function wireUnlock(s) {
    var form = el("vl-si-form");
    var msg = el("vl-si-msg");
    var step1 = el("vl-si-step1"), step2 = el("vl-si-step2");
    var pending = "";

    /* Jump straight to one of the free stories. */
    var jumps = document.querySelectorAll("#vl-modal-body [data-free]");
    for (var i = 0; i < jumps.length; i++) {
      jumps[i].addEventListener("click", function () {
        openStory(this.getAttribute("data-free"));
      });
    }
    if (!form) return;

    function say(text, kind) {
      if (!msg) return;
      msg.textContent = text || "";
      msg.className = "vl-si-msg" + (kind ? " is-" + kind : "");
    }

    function askForCode(email, btn) {
      say("Sending your code\u2026");
      api("/request-code", { method: "POST", body: { email: email } })
        .then(function (r) {
          if (btn) { btn.disabled = false; btn.textContent = "Email Me My Code"; }
          if (r.ok) {
            pending = email;
            step1.hidden = true;
            step2.hidden = false;
            var ci = el("vl-si-code"); if (ci) ci.focus();
            say("Code sent to " + email + ". It works for 15 minutes \u2014 check your junk folder if it\u2019s shy.", "good");
          } else {
            say((r.data && r.data.message) || "We couldn\u2019t send that code. Please try again.", "bad");
          }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Email Me My Code"; }
          say("We couldn\u2019t reach the server. Please check your connection and try again.", "bad");
        });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();

      if (!step2.hidden) {
        var code = (el("vl-si-code").value || "").replace(/\D/g, "");
        if (code.length !== 6) { say("Please type all six digits.", "bad"); return; }
        say("Checking\u2026");
        api("/verify-code", { method: "POST", body: { email: pending, code: code } })
          .then(function (r) {
            if (r.ok && r.data && r.data.token) {
              saveSession({
                token: r.data.token, email: r.data.email,
                tier: r.data.tier, freeStoryIds: r.data.freeStoryIds || []
              });
              updateSignInStrip();
              renderBrowse();
              openStory(s.id);   /* land them on what they came for */
            } else {
              say((r.data && r.data.message) || "That code didn\u2019t work.", "bad");
            }
          })
          .catch(function () { say("We couldn\u2019t reach the server. Please try again.", "bad"); });
        return;
      }

      var email = (el("vl-si-email").value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
        say("That doesn\u2019t look like an email address yet.", "bad");
        return;
      }
      var btn = form.querySelector("#vl-si-step1 .vl-si-btn");
      if (btn) { btn.disabled = true; btn.textContent = "Sending\u2026"; }
      askForCode(email, btn);
    });

    var again = el("vl-si-again");
    if (again) again.addEventListener("click", function () {
      if (pending) askForCode(pending, null);
    });
  }

  function openStory(sid) {
    var s = byId(STORIES, sid);
    if (!s) return;
    currentStory = sid;
    lastFocus = document.activeElement;

    function paint(inner) {
      el("vl-modal-body").innerHTML = storyHead(s) + inner + storyFoot(s);
    }

    /* Show something instantly, then fill in the story if they may read it. */
    if (isSubscriber() || (signedIn() && isFree(sid))) {
      paint('<div class="vl-sec"><p class="vl-loading">Opening the story\u2026</p></div>');
    } else {
      paint(storyTeaser(s) + unlockPanel(s));
      wireUnlock(s);
    }

    var m = el("vl-modal");
    m.classList.add("open");
    document.body.style.overflow = "hidden";
    el("vl-close").focus();

    if (!signedIn()) return;

    api("/story?id=" + encodeURIComponent(sid)).then(function (r) {
      if (currentStory !== sid) return;              /* they moved on */
      if (r.ok && r.data && r.data.story) {
        if (r.data.tier && SESSION && r.data.tier !== SESSION.tier) {
          SESSION.tier = r.data.tier; saveSession(SESSION); updateSignInStrip(); renderBrowse();
        }
        paint(storyFull(s, r.data));
        return;
      }
      if (r.status === 401) { saveSession(null); updateSignInStrip(); }
      if (r.status === 402 && r.data && r.data.tier && SESSION) {
        SESSION.tier = r.data.tier; saveSession(SESSION); updateSignInStrip();
      }
      paint(storyTeaser(s) + unlockPanel(s));
      wireUnlock(s);
    }).catch(function () {
      if (currentStory !== sid) return;
      paint(storyTeaser(s) +
        '<div class="vl-locked"><p>We couldn\u2019t load that story just now. ' +
        "Please check your connection and try again.</p></div>");
    });
  }

  function closeStory() {
    var m = el("vl-modal");
    if (!m) return;
    m.classList.remove("open");
    el("vl-modal-body").innerHTML = "";
    document.body.style.overflow = "";
    currentStory = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initGate() {
    /* The catalog is always open — browsing is how a parent discovers what the
       library holds. Only the story text is gated, inside openStory(). */
    var t = el("vl-tool");   if (t) t.hidden = false;
    var g = el("vl-gate");   if (g) g.hidden = true;

    loadSession();
    updateSignInStrip();
    refreshSession().then(function () {
      updateSignInStrip();
      renderBrowse();
      if (currentStory) openStory(currentStory);
    });
  }

  /* =====================================================================
     WIRING
     ===================================================================== */
  function init() {
    renderGrowth();
    renderStages();
    renderStageFilter();
    renderBrowse();
    initGate();

    document.querySelectorAll(".vl-axis").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".vl-axis").forEach(function (x) {
          x.setAttribute("aria-selected", x === b ? "true" : "false");
        });
        state.axis = b.getAttribute("data-axis");
        state.q = "";
        var si = el("vl-search");
        if (si) {
          si.value = "";
          si.placeholder = "Search " + AXIS_NOUN[state.axis] + "\u2026";
        }
        if (state.view) backToBrowse();
        renderBrowse();
      });
    });

    var si = el("vl-search");
    if (si) si.addEventListener("input", function () {
      state.q = si.value;
      renderBrowse();
    });

    var sf = el("vl-stage-filter");
    if (sf) sf.addEventListener("change", function () {
      state.stage = sf.value;
      if (state.view) renderDetail(state.view.kind, state.view.id);
      else renderBrowse();
    });

    var tool = el("vl-tool");
    if (tool) tool.addEventListener("click", function (ev) {
      var card = ev.target.closest(".vl-card");
      if (card) { renderDetail(card.getAttribute("data-kind"), card.getAttribute("data-id")); return; }
      var st = ev.target.closest(".vl-story");
      if (st) { openStory(st.getAttribute("data-story")); return; }
      if (ev.target.closest("#vl-back")) backToBrowse();
    });

    var close = el("vl-close");
    if (close) close.addEventListener("click", closeStory);
    var modal = el("vl-modal");
    if (modal) modal.addEventListener("click", function (ev) {
      if (ev.target === modal) closeStory();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      var m = el("vl-modal");
      if (m && m.classList.contains("open")) closeStory();
      else if (state.view) backToBrowse();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
