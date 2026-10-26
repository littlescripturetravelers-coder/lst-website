/* ═══════════════════════════════════════════════════════════════════════════
   THE BEDTIME STORY, THE WAY THE APP TELLS IT — but filling a browser window.

   This is the app's own page-turning book, ported to the website. The picture
   owns the whole screen; the words rest on a scrim that rises out of the foot
   of it; a tap, a swipe or an arrow key turns the page. It is deliberately the
   SAME reading experience as the phone, because a family should not have to
   learn the website separately.

   ⚠️ WHERE THE WORDS COME FROM
   Nowhere in this file. It asks LSTData.bookNights.one(id), which asks
   Supabase, which returns the night ONLY to a subscriber (or for a free
   story) because of the row-level-security policy on book_nights. If the
   answer is empty we draw the taster instead. Postgres is the paywall; this
   file is only a reader. Never cache a night's words into a public file.

   ⚠️ THE THEME IS THE SITE'S THEME
   js/lst-theme.js has already put data-theme on <html> before this runs, from
   the same `lst_theme` key the app uses. The page's own palette keys off that
   attribute, so Traditional / Dark / Light all work here and follow the rest
   of the site. The button in the top bar just calls LSTTheme.set.

   ⚠️ A BEAT MAY CARRY ANY OF THESE
     type      cover | story | moment | end
     img, alt  a path under images/book/ — never a data URI on the website
     focus     how high the picture rides, e.g. "24%" (optional, default 30%)
     eyebrow, heading
     text      an array of paragraphs
     stones    the Five Stones, [[KEY, words], ...]
     list      the Parent Experience prompts, numbered
     forParent marks a page written for the grown-up, not the child
   Anything absent is simply not drawn. Nine "Scripture Traveler" pages carry a
   picture and a heading but no words; that is faithful to the app.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var TURN_MS = 340;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function param(k) {
    try { return new URLSearchParams(location.search).get(k) || ""; } catch (e) { return ""; }
  }
  function auth() { return window.LSTAuth; }

  /* The book each night belongs to, for the cover and the goodnight page. */
  function bookOf(n) {
    var list = (window.LST_LIBRARY && window.LST_LIBRARY.books) || [];
    for (var i = 0; i < list.length; i++) if (list[i].book === n) return list[i];
    return null;
  }

  /* ------------------------------------------------------------------ state */
  var STORY = null;
  var sheets = [];
  var book = null;
  var els = {};
  var i = 0, front = 0, busy = false, idleTimer = null;
  var reduceMotion = false;
  var KEY = "";

  /* ------------------------------------------------------------- the pages */
  function renderBody(b) {
    if (b.type === "cover") {
      var bk = bookOf(STORY.book);
      return '<p class="eyebrow">' + esc(STORY.night || (bk ? bk.month : "Tonight")) + "</p>" +
             "<h1>" + esc(STORY.title) + '</h1><div class="rule"></div>' +
             '<p class="ref">' + esc(STORY.reference) + "</p>";
    }
    if (b.type === "end") {
      var bb = bookOf(STORY.book);
      return '<div class="endplate"><div class="moon">&#127769;</div>' +
             "<h1>Sweet Dreams,</h1><h2>Little Traveler</h2>" +
             "<p>Until our next adventure, may these stories tuck themselves gently into " +
             "your heart &mdash; like the warmth of a hug at the end of the day.</p>" +
             '<p class="sig">Little Scripture Travelers' +
               (bb ? " &middot; " + esc(bb.title) : "") + "<br>" +
               "~ Beau, Scout, Willow, &amp; Wren ~</p>" +
             '<div class="travelers">' +
               '<span style="background:var(--beau)"></span>' +
               '<span style="background:var(--scout)"></span>' +
               '<span style="background:var(--willow)"></span>' +
               '<span style="background:var(--wren)"></span>' +
             "</div></div>";
    }

    var h = "";
    /* The eyebrow and heading arrive from the app already carrying entities
       like &middot; and &amp;, so they are written through, not escaped —
       escaping them a second time prints the &middot; at the family. */
    if (b.eyebrow) h += '<p class="eyebrow' + (b.forParent ? " forparent" : "") + '">' + b.eyebrow + "</p>";
    if (b.heading) h += "<h1>" + b.heading + '</h1><div class="rule"></div>';
    if (b.text && b.text.length) {
      h += b.text.map(function (t) { return '<p class="storytext">' + t + "</p>"; }).join("");
    }
    if (b.stones && b.stones.length) {
      h += '<p class="substep">The Five Stones</p><ul class="stones">' +
        b.stones.map(function (s) {
          return '<li><span class="k ' + esc(String(s[0]).toLowerCase()) + '">' + s[0] + "</span>" +
                 '<span class="v">' + s[1] + "</span></li>";
        }).join("") + "</ul>";
    }
    if (b.list && b.list.length) {
      h += '<ol class="prompts">' + b.list.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ol>";
    }
    return h;
  }

  /* ---- Show the picture as large as the window will hold without cutting an
     edge, then tell the words to begin just underneath it. --peek-min and
     --peek-max keep both honest: the words are always reachable, and the
     picture is never squeezed into a strip. */
  function cssPx(v) {
    v = String(v || "").trim();
    if (v.slice(-3) === "rem") {
      var root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return parseFloat(v) * root;
    }
    return parseFloat(v) || 0;
  }

  function peekRange(node, H) {
    var cs = getComputedStyle(node);
    function read(name, dflt) {
      var v = parseFloat(cs.getPropertyValue(name));
      return isFinite(v) ? v : dflt;
    }
    var lo = read("--peek-min", 42);
    var hi = read("--peek-max", 82);
    if (H < 700) hi -= 8;
    hi = Math.max(lo, hi);
    return [H * lo / 100, H * hi / 100];
  }

  function fitArt(node) {
    var im = node.querySelector(".art img");
    if (!im) { node.style.removeProperty("--peek"); return; }
    var H = node.clientHeight, W = node.clientWidth;
    if (!H || !W || !im.naturalWidth || !im.naturalHeight) return;

    /* Wide screens put the words in a column beside the picture. */
    if (window.matchMedia("(orientation:landscape) and (min-width:700px)").matches) {
      var panel = node.querySelector(".panel");
      var boxW = Math.max(160, W - (panel ? panel.clientWidth : 0));
      var s = Math.min(boxW / im.naturalWidth, H / im.naturalHeight);
      var dw2 = im.naturalWidth * s, dh2 = im.naturalHeight * s;
      node.style.removeProperty("--peek");
      im.style.width = dw2 + "px"; im.style.height = dh2 + "px";
      im.style.left = ((boxW - dw2) / 2) + "px";
      im.style.top = ((H - dh2) / 2) + "px";
      im.style.right = "auto";
      return;
    }

    var scale = Math.min(W / im.naturalWidth, H / im.naturalHeight);
    var dw = im.naturalWidth * scale, dh = im.naturalHeight * scale;
    var f = Math.max(0, Math.min(1, (parseFloat(im.style.getPropertyValue("--art-y")) || 30) / 100));
    var top = Math.max(0, Math.min(H - dh, (H - dh) * f));

    im.style.width = dw + "px";
    im.style.height = dh + "px";
    im.style.left = ((W - dw) / 2) + "px";
    im.style.top = top + "px";
    im.style.right = "auto";

    var blend = cssPx(getComputedStyle(node).getPropertyValue("--blend")) || 40;
    var r = peekRange(node, H);
    var peek = Math.max(r[0], Math.min(r[1], top + dh - blend));
    node.style.setProperty("--peek", Math.round(peek) + "px");
  }

  /* Is a word hiding behind the controls? Only then is there "more". */
  function syncMore(node) {
    var p = node.querySelector(".panel");
    var inner = node.querySelector(".panel-inner");
    if (!p || !inner) { node.classList.remove("more"); return; }
    var bar = document.querySelector(".controls");
    var floorY = bar ? bar.getBoundingClientRect().top - 6 : p.getBoundingClientRect().bottom;
    node.classList.toggle("more", inner.getBoundingClientRect().bottom > floorY);
  }

  function drawSheet(node, n) {
    var b = STORY.beats[n] || {};
    node.classList.toggle("noart", !b.img);
    node.classList.toggle("dense", !!(b.stones || b.list));
    node.innerHTML =
      '<div class="art">' +
        (b.img ? '<div class="artbg" aria-hidden="true"></div><img src="' + esc(b.img) +
                 '" alt="' + esc(b.alt || "") + '">' : "") +
      "</div>" +
      '<div class="panel"><div class="sheet"><div class="panel-inner">' + renderBody(b) + "</div></div></div>" +
      '<div class="morecue" aria-hidden="true"><span>Scroll</span><span class="arw"></span></div>';

    if (b.img) {
      var bg = node.querySelector(".artbg");
      if (bg) bg.style.backgroundImage = 'url("' + b.img + '")';
      var im0 = node.querySelector(".art img");
      if (im0 && b.focus) im0.style.setProperty("--art-y", b.focus);
    }
    var p = node.querySelector(".panel");
    if (p) {
      p.scrollTop = 0;
      p.addEventListener("scroll", function () { syncMore(node); }, { passive: true });
    }
    var im = node.querySelector(".art img");
    if (im && !(im.complete && im.naturalWidth)) {
      im.addEventListener("load", function () { fitArt(node); syncMore(node); }, { once: true });
    }
    fitArt(node);
    requestAnimationFrame(function () { syncMore(node); });
  }

  function chrome() {
    var last = STORY.beats.length - 1;
    document.body.classList.toggle("plain", !STORY.beats[i].img);
    var kids = els.dots.children;
    for (var n = 0; n < kids.length; n++) kids[n].classList.toggle("on", n <= i);
    els.back.disabled = (i === 0);
    els.hintText.textContent = (i === last) ? "Goodnight" : (i === 0 ? "Tap to begin" : "Tap to keep going");
    els.hint.style.opacity = (i === last) ? 0.45 : 1;
    try { localStorage.setItem(KEY, String(i)); } catch (e) {}
    els.hint.classList.remove("nudge");
    clearTimeout(idleTimer);
    if (i < last) idleTimer = setTimeout(function () { els.hint.classList.add("nudge"); }, 4000);
  }

  function place(node, x, z) {
    node.classList.remove("sliding");
    node.style.transform = "translateX(" + x + ")";
    node.style.zIndex = z;
  }

  function settle() {
    front = 1 - front;
    for (var n = 0; n < sheets.length; n++) {
      sheets[n].classList.remove("sliding", "lifted");
      sheets[n].style.transform = "translateX(0%)";
      sheets[n].style.zIndex = (n === front) ? 2 : 1;
    }
    busy = false;
  }

  function turn(dir, target) {
    var top = sheets[front], under = sheets[1 - front];
    drawSheet(under, target);
    if (dir > 0) {
      place(under, "0%", 1); place(top, "0%", 2);
      top.classList.add("lifted");
      void top.offsetWidth;
      top.classList.add("sliding");
      top.style.transform = "translateX(-100%)";
    } else {
      place(top, "0%", 1); place(under, "-100%", 2);
      under.classList.add("lifted");
      void under.offsetWidth;
      under.classList.add("sliding");
      under.style.transform = "translateX(0%)";
    }
    if (reduceMotion) settle(); else setTimeout(settle, TURN_MS);
  }

  function bump(dir) {
    if (reduceMotion) return;
    var top = sheets[front];
    top.classList.add("sliding");
    top.style.transform = "translateX(" + (dir * -12) + "px)";
    setTimeout(function () { top.style.transform = "translateX(0%)"; }, 130);
    setTimeout(function () { top.classList.remove("sliding"); }, 500);
  }

  function go(n, animate) {
    if (busy) return;
    var last = STORY.beats.length - 1;
    var next = Math.max(0, Math.min(last, n));
    if (next === i) { if (animate) bump(n > i ? 1 : -1); return; }
    var dir = next > i ? 1 : -1;
    i = next;
    chrome();
    if (!animate || reduceMotion) { drawSheet(sheets[front], i); return; }
    busy = true;
    turn(dir, i);
  }

  /* ---------------------------------------------- the sheet follows a finger */
  var sx = 0, sy = 0, st = 0, mode = null, prepped = null, swiped = false, width = 1;

  function startDrag(x, y) {
    if (busy) return;
    sx = x; sy = y; st = Date.now(); mode = "undecided"; prepped = null;
    width = book.clientWidth || 1;
  }

  function moveDrag(x, y) {
    if (busy || mode === null || mode === "scroll") return;
    var dx = x - sx, dy = y - sy;
    var last = STORY.beats.length - 1;

    if (mode === "undecided") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { mode = "scroll"; return; }
      var dir = dx < 0 ? 1 : -1;
      if ((dir > 0 && i === last) || (dir < 0 && i === 0)) { mode = "edge"; return; }
      mode = "drag";
      var target = i + dir;
      var top = sheets[front], under = sheets[1 - front];
      drawSheet(under, target);
      if (dir > 0) { place(under, "0%", 1); place(top, "0%", 2); top.classList.add("lifted"); }
      else { place(top, "0%", 1); place(under, "-100%", 2); under.classList.add("lifted"); }
      prepped = { dir: dir, target: target, mover: (dir > 0 ? top : under) };
    }

    if (mode === "edge") {
      var pull = Math.max(-26, Math.min(26, dx * 0.25));
      sheets[front].style.transform = "translateX(" + pull + "px)";
      return;
    }

    if (mode === "drag" && prepped) {
      var base = prepped.dir > 0 ? 0 : -width;
      var pos = base + dx;
      if (pos < -width) pos = -width;
      if (pos > 0) pos = 0;
      prepped.mover.style.transform = "translateX(" + pos + "px)";
    }
  }

  function endDrag(x, y) {
    if (mode === null) return;
    var dx = x - sx, dy = y - sy;
    var quick = (Date.now() - st) < 420;
    var far = Math.abs(dx) > width * 0.28;
    var m = mode, p = prepped;
    mode = null; prepped = null;

    if (m === "edge") {
      var top = sheets[front];
      top.classList.add("sliding");
      top.style.transform = "translateX(0%)";
      setTimeout(function () { top.classList.remove("sliding"); }, 400);
      return;
    }
    if (m === "scroll") {                       /* a vertical flick was reading */
      swiped = true;
      setTimeout(function () { swiped = false; }, 380);
      return;
    }
    if (m !== "drag" || !p) return;

    swiped = true;
    setTimeout(function () { swiped = false; }, 380);

    var commit = far || (quick && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy));
    var mover = p.mover;
    busy = true;
    mover.classList.add("sliding");

    if (commit) {
      i = p.target;
      chrome();
      mover.style.transform = (p.dir > 0) ? "translateX(-100%)" : "translateX(0%)";
      setTimeout(settle, 300);
    } else {
      mover.style.transform = (p.dir > 0) ? "translateX(0%)" : "translateX(-100%)";
      setTimeout(function () {
        for (var n = 0; n < sheets.length; n++) {
          sheets[n].classList.remove("sliding", "lifted");
          sheets[n].style.transform = "translateX(0%)";
          sheets[n].style.zIndex = (n === front) ? 2 : 1;
        }
        busy = false;
      }, 320);
    }
  }

  /* ------------------------------------------------------------------ start */
  function begin(night) {
    STORY = night;
    KEY = "lst:" + STORY.id + ":beat";
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.title = STORY.title + " · Little Scripture Travelers";
    var bk = bookOf(STORY.book);
    el("lst-shell").hidden = false;
    el("lst-waiting").hidden = true;

    book = el("book");
    sheets = [el("pageA"), el("pageB")];
    els = {
      dots: el("dots"), hint: el("hint"), hintText: el("hintText"),
      back: el("backBtn"), restart: el("restartBtn"),
      night: el("nightLabel")
    };
    els.night.textContent = STORY.night || (bk ? bk.month : "");

    STORY.beats.forEach(function () {
      var d = document.createElement("span");
      d.className = "dot";
      els.dots.appendChild(d);
    });

    var last = STORY.beats.length - 1;
    try {
      var saved = parseInt(localStorage.getItem(KEY) || "0", 10);
      if (!isNaN(saved) && saved > 0 && saved < last) i = saved;
    } catch (e) {}

    drawSheet(sheets[0], i);
    drawSheet(sheets[1], Math.min(i + 1, last));
    place(sheets[0], "0%", 2);
    place(sheets[1], "0%", 1);
    front = 0;
    chrome();

    book.addEventListener("touchstart", function (e) { if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    book.addEventListener("touchmove", function (e) { if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    book.addEventListener("touchend", function (e) { var t = e.changedTouches[0]; endDrag(t.clientX, t.clientY); }, { passive: true });
    book.addEventListener("touchcancel", function () { mode = null; prepped = null; }, { passive: true });
    book.addEventListener("mousedown", function (e) { startDrag(e.clientX, e.clientY); });
    window.addEventListener("mousemove", function (e) { if (mode) moveDrag(e.clientX, e.clientY); });
    window.addEventListener("mouseup", function (e) { if (mode) endDrag(e.clientX, e.clientY); });

    book.addEventListener("click", function () { if (!swiped) go(i + 1, true); });
    book.addEventListener("keydown", function (e) { if (e.key === "Enter") go(i + 1, true); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(i + 1, true); }
      if (e.key === "ArrowLeft") go(i - 1, true);
    });
    els.back.addEventListener("click", function (e) { e.stopPropagation(); go(i - 1, true); });
    els.restart.addEventListener("click", function (e) { e.stopPropagation(); go(0, true); });

    /* There is no "Read to me" here. The narration has not been recorded, and a
       button that only ever answers "coming soon" is furniture, not a feature.
       When the audio exists, put it back and read it from beat.audio. */

    function remeasure() { sheets.forEach(function (n) { fitArt(n); syncMore(n); }); }
    window.addEventListener("resize", remeasure);
    window.addEventListener("orientationchange", function () { setTimeout(remeasure, 280); });

    STORY.beats.forEach(function (b) { if (b.img) { var im = new Image(); im.src = b.img; } });
  }

  /* --------------------------------------------------------------- the door */
  function shut(id) {
    el("lst-waiting").hidden = true;
    var shutEl = el("lst-shut");
    shutEl.hidden = false;

    var cat = null;
    var lib = window.LST_LIBRARY;
    if (lib && lib.stories) {
      for (var n = 0; n < lib.stories.length; n++) {
        if (lib.stories[n].nightId === id || lib.stories[n].id === id) { cat = lib.stories[n]; break; }
      }
    }
    var covers = window.LST_BOOK_COVERS || {};
    var cover = covers[id] || "";
    if (cover) el("shut-cover").style.backgroundImage = 'url("' + cover + '")';
    if (cat && cat.title) el("shut-title").textContent = cat.title;
    if (cat && cat.teaser) el("shut-teaser").textContent = cat.teaser;

    var signIn = el("shut-signin");
    signIn.addEventListener("click", function () {
      if (auth() && auth().openSignIn) auth().openSignIn("Sign in to read tonight's story.");
    });
    document.title = ((cat && cat.title) || "Tonight's story") + " · Little Scripture Travelers";
  }

  function boot() {
    var id = param("id");
    if (!id) { location.replace("bedtime-stories.html"); return; }

    /* The back arrow goes wherever the family came from, or to the shelf. */
    var back = el("backLink");
    back.addEventListener("click", function (e) {
      e.preventDefault();
      if (document.referrer && history.length > 1) history.back();
      else location.href = "bedtime-stories.html";
    });

    var theme = el("themeBtn");
    var paint = function () {
      var t = window.LSTTheme.get();
      theme.querySelector(".tlabel").textContent = window.LSTTheme.label(t);
      theme.setAttribute("aria-label", "Colour theme: " + window.LSTTheme.label(t) + ". Tap to change.");
    };
    if (theme && window.LSTTheme) {
      paint();
      theme.addEventListener("click", function (e) {
        e.stopPropagation();
        var order = window.LSTTheme.themes();
        var at = order.indexOf(window.LSTTheme.get());
        window.LSTTheme.set(order[(at + 1) % order.length]);
        paint();
      });
    } else if (theme) {
      theme.hidden = true;
    }

    function ask() {
      if (!window.LSTData || !window.LSTData.bookNights) { shut(id); return; }
      window.LSTData.bookNights.one(id).then(function (night) {
        if (night && night.beats && night.beats.length) {
          begin(night);
          /* the corner headphones read it in Eli's voice, the app's own recording (js/lst-story-voice.js) */
          if (window.LSTStoryVoice) window.LSTStoryVoice.mount({ id: id, title: night.title || "" });
        }
        else shut(id);
      }).catch(function () { shut(id); });
    }

    if (auth() && auth().ready) { auth().ready(ask); auth().onChange(function () { if (el("lst-shut") && !el("lst-shut").hidden) location.reload(); }); }
    else ask();
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
