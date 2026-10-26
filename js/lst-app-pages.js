/* THE APP'S OWN PAGES, ON THE WEBSITE (Levi, 18 Oct 2026: "I need all the new things I've added
   to the app to be on the website").

   Scriptures (scriptures.html), Study & Tests (study.html) and Printables (printables.html) are not
   written twice. Each page loads the app's own module from the web app
   (app.littlescripturetravelers.com/js/scriptures.js, js/study.js + data/study.js, js/printables.js)
   and this file gives it the handful of things the app's index.html normally gives it:

     S / saveS()       what the app keeps on the phone, kept here in this browser, one copy per
                       person signed in (so a shared computer never mixes two people's marks)
     render() / go()   draw the module into #lav; go('printables') opens printables.html
     isLds()           the website's edition (js/lst-edition.js)
     archiveNights()   the published nights (date, title, scripture, Traveler) from the account
     personalPush/Pull each person's scripture marks and study progress, on their own sign-in
                       (personal_data, app migration 0042) - so they match the app exactly
     window.LST        the few account calls the modules make (printable_nights, printable_files,
                       personal_data, scripture_helps - read only, never the paid writer)
     toast(), A(), openOut(), openNightStory() ...

   The app's file decides everything else. When the app changes Scriptures, Study & Tests or
   Printables, the website has the change the moment the app is deployed, with nothing to do here.

   ⚠️ The owner's "Add a PDF" never appears here: S.isAdmin is never set on the website.
   ⚠️ No paid call is ever made from here (no narration, no helps writer, no pictures).

   Which page this is: <body data-lav="scriptures|study|printables">. */
(function () {
  "use strict";
  var LIVE = "https://app.littlescripturetravelers.com/";
  var PAGE = (document.body && document.body.getAttribute("data-lav")) || "";
  var PAGES = { scriptures: "scriptures.html", study: "study.html", printables: "printables.html" };

  /* ---- where the app is. Always the live app, except a test may point it at a copy served on
     this machine (?app=http://localhost:PORT/). Nothing else is accepted, so a link can never
     make this page run someone else's code. */
  function appBase() {
    var q = null;
    try { q = new URLSearchParams(location.search).get("app"); } catch (e) {}
    try { if (!q) q = sessionStorage.getItem("lst:app-base"); } catch (e) {}
    if (q && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/$/.test(q)) {
      try { sessionStorage.setItem("lst:app-base", q); } catch (e) {}
      return q;
    }
    return LIVE;
  }
  var APP = appBase();
  window.LST_APP_BASE = APP;

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  window.esc0 = esc;
  /* the app's own jsq (index.html), so an onclick='...' the module writes reads the same */
  window.jsq = function (v) { return "'" + String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/</g, "\\x3c") + "'"; };

  /* ---------------------------------------------------------------- S */
  function auth() { return window.LSTAuth; }
  function uid() { var a = auth(); var u = a && a.signedIn() && a.user(); return u ? u.id : ""; }
  var OWNER = null;
  function storeKey(who) { return "lst:web:app:" + (who || "guest"); }
  function readS(who) {
    try { var v = JSON.parse(localStorage.getItem(storeKey(who)) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
  }
  function useS(who) {
    OWNER = who || "";
    var s = readS(OWNER);
    delete s.isAdmin; s.page = PAGE; s.loggedIn = !!OWNER;
    s.today = TODAY || s.today || {};
    window.S = s;
  }
  window.saveS = function () {
    try {
      var c = {}; for (var k in S) if (k !== "page" && k !== "loggedIn" && k !== "isAdmin" && k !== "today") c[k] = S[k];
      localStorage.setItem(storeKey(OWNER), JSON.stringify(c));
    } catch (e) {}
  };
  var TODAY = null;
  useS("");

  /* ------------------------------------------------------- the edition */
  window.isLds = function () { return (window.LST_EDITION || document.documentElement.getAttribute("data-edition") || "lds") !== "christian"; };
  window.faithId = function () { return isLds() ? "lds" : "nondenom"; };

  /* ---------------------------------------------------------- drawing */
  var VIEW = { scriptures: "viewScriptures", study: "viewStudy", printables: "viewPrintables" }[PAGE];
  var ready = false;
  function host() { return document.getElementById("scroll"); }
  /* words written for the phone that read wrongly in a browser */
  function forTheWeb(h) {
    return String(h)
      .replace(/ saved on this phone/g, " saved")
      .replace(/ The headphones at the top read the chapter aloud\./g, "")
      .replace(/>Color in the app</g, ">Color it here<")
      .replace('<p class="muted">No stories yet.</p>', uid() ? '<p class="muted">No stories yet.</p>'
        : '<p class="muted">Sign in to make each week&rsquo;s chart, crossword and quiz, and each night&rsquo;s story and song, from the stories.</p>');
  }
  window.render = function () {
    var el = host(); if (!el) return;
    if (!ready || typeof window[VIEW] !== "function") { el.innerHTML = '<div class="pad"><p class="muted">Opening&hellip;</p></div>'; return; }
    var html = "";
    try { html = window[VIEW](); } catch (e) { console.warn("lav", e); html = '<div class="pad"><p class="muted">Something did not open. Reload the page to try again.</p></div>'; }
    el.innerHTML = (PAGE === "printables" ? askedFor() : "") + forTheWeb(html);
  };
  /* the modules put the page back at its top with #scroll.scrollTop=0; here the page itself scrolls */
  (function () {
    var el = host(); if (!el) return;
    try {
      Object.defineProperty(el, "scrollTop", {
        configurable: true,
        get: function () { return 0; },
        set: function (v) {
          if (v !== 0) return;
          var top = el.getBoundingClientRect().top + window.pageYOffset - 130;
          if (window.pageYOffset > top) window.scrollTo(0, Math.max(0, top));
        }
      });
    } catch (e) {}
  })();

  /* ------------------------------------------------------------ toast */
  window.toast = function (m) {
    var t = document.getElementById("lav-toast");
    if (!t) { t = document.createElement("div"); t.id = "lav-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = m; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2400);
  };

  /* --------------------------------------------- the app's modal, for notes */
  (function () {
    var o = document.createElement("div"); o.id = "overlay"; o.className = "lav-overlay";
    var m = document.createElement("div"); m.id = "modalHost"; m.className = "lav lav-modalhost";
    o.appendChild(m); document.body.appendChild(o);
    window.overlay = o; window.modalHost = m;
    window.closeModal = function () { o.classList.remove("open"); m.innerHTML = ""; };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && o.classList.contains("open")) closeModal(); });
  })();

  /* --------------------------------------------------- going places */
  var PENDING = "";
  window.go = function (page) {
    var to = PAGES[page] || (page === "coloring" ? "coloring-books.html" : "");
    if (!to) return;
    setTimeout(function () { location.href = to + PENDING; }, 0);
  };
  /* Study & Tests' "Print this test" calls go('printables') and then prMake(kind, unit). Here
     the PDF is made on the Printables page, so prMake only says which one to offer there. */
  if (PAGE !== "printables") {
    window.prMake = function (kind, a) { PENDING = "?make=" + encodeURIComponent(kind) + "&unit=" + encodeURIComponent(a || ""); };
  }
  function askedFor() {
    var q; try { q = new URLSearchParams(location.search); } catch (e) { return ""; }
    var kind = q.get("make"), id = q.get("unit");
    if (!kind || !id || !window.studyUnits) return "";
    var u = window.studyUnits().filter(function (x) { return x.id === id; })[0];
    if (!u) return "";
    var what = kind === "history" ? "test" : "flashcards";
    return '<div class="pad lav-asked"><div class="card"><span class="kicker">From Study &amp; Tests</span>' +
      '<b>' + esc(u.t) + " " + what + '</b><button class="btn primary ctr" onclick="prMake(' + jsq(kind) + "," + jsq(id) + ')"><span class="lbl">Make the PDF</span></button></div></div>';
  }
  window.openOut = function (url) { if (!url) { toast("That one is not linked yet."); return; } window.open(url, "_blank", "noopener"); };
  window.openNightStory = function (n) { if (n && n.date) location.href = "story.html?date=" + encodeURIComponent(n.date); };
  window.openColoringBook = function (k) { location.href = "coloring-books.html" + (k ? "#cb-" + encodeURIComponent(k) : ""); };
  /* the Travelers' pictures, from the website's own images */
  window.A = function (name) { return "images/" + name; };
  window.IS_LIVE = function () { return !!uid(); };

  /* ------------------------------------------------------- the nights */
  var NIGHTS = [];
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  window.archiveNights = function () { return NIGHTS; };
  function client() { var a = auth(); return a && a.client ? a.client() : null; }
  var nightsAsk = null;
  function loadNights() {
    var c = client(); if (!c || !uid()) return Promise.resolve([]);
    if (nightsAsk) return nightsAsk;
    nightsAsk = c.from("daily_content").select("publish_date,title,scripture,traveler")
      .not("published_at", "is", null).lte("publish_date", todayISO())
      .order("publish_date", { ascending: false }).limit(1000)
      .then(function (res) {
        if (res.error || !res.data) { nightsAsk = null; return []; }
        NIGHTS = res.data.map(function (r) { return { date: r.publish_date, title: r.title || "", scripture: r.scripture || "", traveler: r.traveler || "" }; });
        var t = NIGHTS[0];
        TODAY = t && t.date === todayISO() ? { title: t.title, scripture: t.scripture, date: t.date } : {};
        S.today = TODAY;
        return NIGHTS;
      }, function () { nightsAsk = null; return []; });
    return nightsAsk;
  }

  /* ----------------------------------------------------- the account */
  window.LST = {
    listArchive: function () { return loadNights(); },
    printableNights: function (d0, d1) {
      var c = client(); if (!c || !uid()) return Promise.resolve(null);
      return c.rpc("printable_nights", { d0: d0, d1: d1 }).then(function (r) { return r.error ? null : (r.data || []); }, function () { return null; });
    },
    printableFiles: function () {
      var c = client(); if (!c || !uid()) return Promise.resolve([]);
      return c.from("printable_files").select("id,kind,title,note,path,edition,created_at").order("created_at", { ascending: false })
        .then(function (r) {
          return (r.data || []).map(function (x) { x.url = c.storage.from("printables").getPublicUrl(x.path).data.publicUrl; return x; });
        }, function () { return []; });
    },
    /* the helps already written for every family; never asks for a new one to be written */
    scriptureHelps: function (key) {
      var c = client(); if (!c) return Promise.resolve(null);
      return c.from("scripture_helps").select("key,ref,s,parts").eq("key", key).maybeSingle()
        .then(function (r) { return r.data || null; }, function () { return null; });
    },
    getPersonal: function (key) {
      var c = client(), id = uid(); if (!c || !id) return Promise.resolve(null);
      return c.from("personal_data").select("value,updated_at").eq("user_id", id).eq("key", key).maybeSingle()
        .then(function (r) { return r.error ? null : (r.data ? { value: r.data.value, at: r.data.updated_at } : { value: null }); }, function () { return null; });
    },
    putPersonal: function (key, value) {
      var c = client(), id = uid(); if (!c || !id) return Promise.resolve({ ok: false });
      return c.from("personal_data").upsert({ user_id: id, key: key, value: value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" })
        .then(function (r) { return { ok: !r.error }; }, function () { return { ok: false }; });
    }
  };

  /* WHAT IS YOURS, ON YOUR ACCOUNT — the same merge the app does (PERSONAL in lst-app
     www/index.html): kept per chapter / per unit with the time it last changed, and whichever side
     changed it last wins, so the phone, the tablet and the website agree. */
  var PERSONAL = {
    scr_marks: {
      get: function () { return { m: S.scrMarks || {}, t: S.scrMarksT || {} }; },
      merge: function (r) {
        var changed = false, push = false, m = S.scrMarks = S.scrMarks || {}, t = S.scrMarksT = S.scrMarksT || {};
        var rm = (r && r.m) || {}, rt = (r && r.t) || {}, keys = {};
        [m, t, rm, rt].forEach(function (o) { Object.keys(o).forEach(function (k) { keys[k] = 1; }); });
        Object.keys(keys).forEach(function (k) {
          var a = t[k] || 0, b = rt[k] || 0;
          if (b > a) { if (rm[k] && rm[k].length) m[k] = rm[k]; else delete m[k]; t[k] = b; changed = true; }
          else if (a > b || (m[k] && !rm[k])) push = true;
        });
        return { changed: changed, push: push };
      }
    },
    study: {
      get: function () { return S.study || { u: {} }; },
      merge: function (r) {
        var changed = false, push = false, L = S.study = S.study || { u: {} }; L.u = L.u || {};
        var R = (r && r.u) || {}, keys = {};
        Object.keys(L.u).concat(Object.keys(R)).forEach(function (k) { keys[k] = 1; });
        Object.keys(keys).forEach(function (k) {
          var a = L.u[k], b = R[k];
          if (b && (!a || (b.mt || 0) > (a.mt || 0))) { var best = Math.max((a && a.best) || 0, b.best || 0); L.u[k] = Object.assign({}, b, { best: best }); if (best > (b.best || 0)) push = true; changed = true; }
          else if (a && (!b || (a.mt || 0) > (b.mt || 0) || (a.best || 0) > (b.best || 0))) push = true;
        });
        /* the rest of the study record (a person's own flashcard sets, and anything the app adds
           later) is carried as the app wrote it when this browser has none of its own */
        if (r) Object.keys(r).forEach(function (k) {
          if (k === "u") return;
          if (L[k] === undefined) { L[k] = r[k]; changed = true; }
          else if (JSON.stringify(L[k]) !== JSON.stringify(r[k])) push = true;
        });
        return { changed: changed, push: push };
      }
    }
  };
  var PT = {}, PULLED = {};
  window.personalPush = function (key) {
    if (!uid() || !PERSONAL[key]) return; clearTimeout(PT[key]);
    PT[key] = setTimeout(function () { LST.putPersonal(key, PERSONAL[key].get()); }, 1500);
  };
  window.personalPull = function (key, force) {
    if (!uid() || !PERSONAL[key]) return Promise.resolve(); if (PULLED[key] && !force) return Promise.resolve();
    PULLED[key] = 1;
    return LST.getPersonal(key).then(function (r) {
      if (!r) { PULLED[key] = 0; return; }
      var res = PERSONAL[key].merge(r.value || {});
      if (res.changed) { saveS(); render(); }
      if (res.push) personalPush(key);
    }, function () { PULLED[key] = 0; });
  };

  /* ------------------------------------------- the story book, as a PDF
     Printables' "The story" needs the night's picture book. nightObj / primeBook fetch it from
     the account the way the website's story.html does. */
  window.nightObj = function (date) { return { date: date }; };
  window.primeBook = function (n) {
    if (!n || !n.date || n.bookHtml || !(window.LSTData && LSTData.archive)) return Promise.resolve();
    return LSTData.archive.full(n.date).then(function (f) { if (f && f.bookHtml) n.bookHtml = f.bookHtml; }, function () {});
  };
  window.loadSongHtml = function () { return ""; };
  /* ⚠️ TWO COPIES, ON PURPOSE AND CHECKED: these two are the app's own (lst-app www/index.html),
     word for word. The app's tests/website-app-pages.js fails if they ever drift apart.
     THE FEELING MOMENT PICTURE RULE: in a story book the Feeling Moment has no picture; its
     picture goes on Remember This. */
  /* @app-copy:storyBeatsEnd */
function storyBeatsEnd(html,a){
  let depth=0, str=false, esc=false;
  for(let i=a;i<html.length;i++){
    const c=html.charCodeAt(i);
    if(str){ if(esc) esc=false; else if(c===92) esc=true; else if(c===34) str=false; continue; }
    if(c===34) str=true; else if(c===123) depth++; else if(c===125){ depth--; if(depth===0) return i+1; }
  }
  return -1;
}
  /* @app-copy:feelingPictureToRemember */
function feelingPictureToRemember(html){
  try{
    if(String(html||'').indexOf('Feeling Moment')<0) return html;
    const mark='const STORY = ', i=html.indexOf(mark); if(i<0) return html;
    const a=i+mark.length; if(html.charAt(a)!=='{') return html;
    const z=storyBeatsEnd(html,a); if(z<0) return html;
    const st=JSON.parse(html.slice(a,z)), beats=(st&&st.beats)||[];
    const named=(b,n)=>String((b&&b.heading)||'').replace(/&[a-z]+;/g,' ').toLowerCase().indexOf(n)>=0;
    const fm=beats.find(b=>named(b,'feeling moment')), rt=beats.find(b=>named(b,'remember this'));
    if(!fm || !fm.img) return html;
    if(rt && !rt.img){ rt.img=fm.img; rt.alt=fm.alt||rt.alt||''; }
    fm.img=null; fm.alt='';
    return html.slice(0,a)+JSON.stringify(st)+html.slice(z);
  }catch(e){ return html; }
}
  /* @app-copy:end */
  window.storyBeatsEnd = storyBeatsEnd;
  window.feelingPictureToRemember = feelingPictureToRemember;

  /* ------------------------------------------------- loading the app */
  function script(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = src; s.onload = function () { res(); }; s.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  var V = "?v=" + Math.floor(Date.now() / 600000);   /* a fresh copy every ten minutes */
  var stAsk = null;
  window.stLoad = function () {
    if (window.viewStudy && window.LST_STUDY) return Promise.resolve();
    if (stAsk) return stAsk;
    stAsk = (window.LST_STUDY ? Promise.resolve() : script(APP + "data/study.js" + V))
      .then(function () { return window.viewStudy ? null : script(APP + "js/study.js" + V); })
      .catch(function (e) { stAsk = null; throw e; });
    return stAsk;
  };
  function loadModule() {
    if (PAGE === "scriptures") return script(APP + "js/scriptures.js" + V);
    if (PAGE === "study") return stLoad();
    if (PAGE === "printables") {
      /* the coloring books are offered with their month; Study & Tests gives the history tests */
      script(APP + "coloring/index.js" + V).then(function () { render(); }, function () {});
      return script(APP + "js/printables.js" + V).then(function () { return stLoad().catch(function () {}); });
    }
    return Promise.reject(new Error("no page"));
  }

  function whoChanged() {
    var id = uid();
    if (id === OWNER) return false;
    for (var k in PULLED) PULLED[k] = 0;
    nightsAsk = null; NIGHTS = []; TODAY = null;
    useS(id); return true;
  }
  function afterSignIn() {
    loadNights().then(function () { render(); });
    if (PAGE === "scriptures") personalPull("scr_marks");
    if (PAGE === "study" || PAGE === "printables") personalPull("study");
  }

  /* A SCRIPTURE LINK OPENED HERE (Levi, 26 Oct 2026: "when I click on the links of the scriptures on the website I
     should be able to choose whether it takes me to the church website ... or to the scriptures in little scripture
     travelers ... like it is in the app"): js/lst-scr-links.js sends a Gospel Library chapter link here as
     scriptures.html?open=<gospel library slug>/<chapter>&v=<verse>&from=<the page it was tapped on>; the chapter
     opens at the verse, with the gold way back to where it was tapped (S.scrFrom, as in the app). */
  var OPEN = (function () { try { var q = new URLSearchParams(location.search); var o = q.get("open"); if (!o) return null;
    var m = o.match(/^([a-z0-9-]+(?:\/[a-z0-9-]+)?)\/(\d+)$/); if (!m) return null;
    var from = q.get("from") || ""; if (!/^[a-z-]+\.html/.test(from)) from = "";
    return { slug: m[1], ch: +m[2], vs: parseInt(q.get("v"), 10) || 0, from: from }; } catch (e) { return null; } })();
  window.scrBackFrom = function () { var f = S.scrFrom; S.scrFrom = null; saveS(); location.href = (f && f.href) || "tonight.html"; };
  function openAsked() {
    if (!OPEN || PAGE !== "scriptures" || !ready) return;
    var o = OPEN; OPEN = null;
    fetch(APP + "scriptures/slugs.json" + V).then(function (r) { return r.json(); }).then(function (sl) {
      var hit = sl[o.slug]; if (hit == null) { window.open("https://www.churchofjesuschrist.org/study/scriptures/" + o.slug + "/" + o.ch + (o.vs ? "?id=p" + o.vs + "#p" + o.vs : ""), "_blank", "noopener"); return; }
      var dc = o.slug === "dc";
      S.scr = { v: "read", vol: dc ? "dc" : hit[0], book: dc ? 0 : hit[1], ch: o.ch, vs: o.vs || 0 };
      S.scrFrom = o.from ? { page: "back", href: o.from, label: /^tonight|^archive/.test(o.from) ? "Back to the Morning Lantern" : "Back to where you were" } : null;
      saveS(); render();
      if (o.vs) setTimeout(function () { try { scrToVerse(o.vs, true); } catch (e) {} }, 700);
      try { history.replaceState(null, "", "scriptures.html"); } catch (e) {}
    }).catch(function () {});
  }

  render();
  loadModule().then(function () { ready = true; render(); if (auth() && auth().ready) auth().ready(openAsked); else openAsked(); },
    function () {
      var el = host();
      if (el) el.innerHTML = '<div class="pad"><p class="muted">This page could not open just now. Check the connection and reload the page.</p></div>';
    });
  document.addEventListener("lst:edition", function () { if (ready) render(); });
  if (auth()) {
    auth().ready(function () { whoChanged(); render(); if (uid()) afterSignIn(); });
    auth().onChange(function () { if (whoChanged()) { render(); if (uid()) afterSignIn(); } });
  }
  window.LSTAppPages = { base: APP, page: PAGE, render: render, nights: function () { return NIGHTS; } };
})();
