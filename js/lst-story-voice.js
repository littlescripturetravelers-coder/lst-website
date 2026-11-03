/* THE STORY, READ ALOUD — the same voice as the app.

   Levi, 26 Oct 2026: "I would like there to be headphones on the website that you can click as well, and it will
   read the story to you just like the app."

   A round headphones button sits in the corner of every picture book on the website (tonight's story in
   story.html, and every shelf story in read.html). A tap plays the story in Eli's recorded voice (or Hannah's,
   chosen in the little bar), the SAME recording the app plays: narration/story/<date>-<voice>.mp3 for a published
   night, narration/book/<slug>-<voice>.mp3 for a month's book night. A story not recorded yet is recorded the first
   time anyone plays it (the narrate function, which needs the family's sign-in, exactly as the app does), its
   opening first so it starts in about a second, then the whole recording carries on from the same spot.

   Mount with:
     LSTStoryVoice.mount({ story: "YYYY-MM-DD" })      a published night
     LSTStoryVoice.mount({ book: "oct-26-come-home-little-ones" })   a month's book night (the app's page name)
     LSTStoryVoice.mount({ id: "b10-w4-n5" })          a shelf id; data/story-slugs.js turns it into the page name
*/
(function () {
  "use strict";
  var BASE = "https://rdbvktqgrwhjucocobua.supabase.co/storage/v1/object/public/narration/";
  var VOICES = [["eli", "Eli"], ["hannah", "Hannah"]];
  var key = null, audio = null, voice = "eli", busy = false, startPart = null, fullUrl = "", waitT = 0;
  try { var kv = localStorage.getItem("lst:voice"); if (kv === "eli" || kv === "hannah") voice = kv; } catch (e) {}
  var wordOn = true;
  try { wordOn = localStorage.getItem("lst:wordlight") !== "off"; } catch (e) {}

  var CSS =
    "#lstVoiceFab{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(max(16px,env(safe-area-inset-bottom)) + 56px);" +
    "z-index:2147483600;width:58px;height:58px;border-radius:50%;border:0;background:#fff;color:#1B2D5F;cursor:pointer;" +
    "box-shadow:0 8px 26px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transition:transform .15s}" +
    "#lstVoiceFab:active{transform:scale(.94)}#lstVoiceFab svg{width:30px;height:30px}" +
    "#lstVoiceFab.on{background:#F5C518}#lstVoiceFab.wait svg{animation:lstvp 1.1s ease-in-out infinite}" +
    "@keyframes lstvp{50%{opacity:.35}}" +
    "#lstVoiceBar{position:fixed;left:50%;transform:translate(-50%,160%);bottom:max(14px,env(safe-area-inset-bottom));z-index:2147483600;" +
    "width:min(94vw,520px);box-sizing:border-box;background:#1B2D5F;color:#fff;border:1.5px solid #F5C518;border-radius:20px;" +
    "padding:10px 12px;font:600 14px/1.3 Nunito,system-ui,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.45);" +
    "transition:transform .25s cubic-bezier(.22,1,.36,1);display:flex;align-items:center;gap:10px}" +
    "#lstVoiceBar.on{transform:translate(-50%,0)}" +
    "#lstVoiceBar button{border:0;cursor:pointer;font:800 13px Nunito,system-ui,sans-serif}" +
    "#lstVoiceBar .pp{width:40px;height:40px;border-radius:50%;background:#F5C518;color:#1B2D5F;font-size:16px;flex:none}" +
    "#lstVoiceBar .mid{flex:1;min-width:0}#lstVoiceBar .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    "#lstVoiceBar input[type=range]{width:100%;accent-color:#F5C518;margin:4px 0 0}" +
    "#lstVoiceBar .vc{display:flex;gap:4px;flex:none}" +
    "#lstVoiceBar .vc button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:6px 9px}" +
    "#lstVoiceBar .vc button.on{background:#5BD3DC;color:#1B2D5F;border-color:#5BD3DC}" +
    "#lstVoiceBar .x{background:transparent;color:#fff;font-size:18px;padding:4px 6px;flex:none}" +
    "#lstVoiceBar .msg{font-size:12px;opacity:.8}" +
    "#lstVoiceBar .wl{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:6px 9px;flex:none}" +
    "#lstVoiceBar .wl.on{background:#F5C518;color:#1B2D5F;border-color:#F5C518}";
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6" fill="#F5C518" stroke="currentColor"/>' +
    '<rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6" fill="#F5C518" stroke="currentColor"/></svg>';

  function el(id) { return document.getElementById(id); }
  function slugFor(id) { var m = window.LST_STORY_SLUGS || {}; return m[id] || ""; }
  /* ONE WORD AT A TIME (Levi, 3 Nov 2026: "The website doesn't underline and highlight the word being read ...
     make that functionality happen on the website like it happens in the app"): the same recording the app now
     plays, the one that knows when every word is said (<name>-t.mp3 beside <name>-t.json), so the word being read
     lights up gold and underlined on the book's page and the book turns with the voice. */
  function fileName(v, plain) {
    var t = plain ? "" : "-t";
    if (key.story) return "story/" + key.story + "-" + v + t + ".mp3";
    if (key.book) return "book/" + key.book + "-" + v + t + ".mp3";
    return "";
  }
  /* a recording made again (the words changed) keeps its address, so ask past a day-old copy */
  function fresh(u) { var d = new Date(); return u + (u.indexOf("?") < 0 ? "?" : "&") + "d=" + d.getFullYear() + (d.getMonth() + 1) + d.getDate(); }
  function exists(u) {
    return fetch(fresh(u), { method: "HEAD", cache: "no-store" }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }

  /* THE PLAYER, LIKE THE APP'S (Levi, 3 Nov 2026: "the media player shold work on the website like it works in
     the app"): the small bar at the bottom (play, the time, ✕) opens the big player with a tap, as the app's does:
     back and forward 5 seconds, the line to drag with the time gone and left, Who reads it (Eli / Hannah), Light up
     each word, Playing speed (0.5× to 2×), Sleep timer, and the Transcript: every sentence, the one being read lit,
     the word being read gold and underlined, a tap reads from that sentence. */
  var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], SLEEPS = [5, 10, 15, 30, 45, 60, 90, 120], STEP = 5;
  var speed = 1, sleepAt = 0, sleepT = 0, bigT = 0;
  try { var ks = Number(localStorage.getItem("lst:speed")); if (SPEEDS.indexOf(ks) >= 0) speed = ks; } catch (e) {}
  var BCSS =
    "#lstVoiceBar .mid{cursor:pointer}#lstVoiceBar .up{background:transparent;color:#fff;padding:4px;flex:none;display:flex}" +
    "#lstVoiceBar .up svg{width:22px;height:22px}" +
    "#lstVoiceBig{position:fixed;inset:0;z-index:2147483640;background:#1B2D5F;color:#fff;transform:translateY(105%);" +
    "transition:transform .3s cubic-bezier(.22,1,.36,1);overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:Nunito,system-ui,sans-serif}" +
    "#lstVoiceBig.on{transform:none}" +
    "#lstVoiceBig .in{max-width:520px;margin:0 auto;padding:max(14px,env(safe-area-inset-top)) 18px max(28px,env(safe-area-inset-bottom));box-sizing:border-box}" +
    "#lstVoiceBig button{cursor:pointer;font-family:inherit;border:0}" +
    "#lstVoiceBig .top{display:flex;align-items:center;justify-content:space-between}" +
    "#lstVoiceBig .rd{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;display:flex;align-items:center;justify-content:center}" +
    "#lstVoiceBig .rd svg{width:22px;height:22px}#lstVoiceBig .lab{font:800 12px Nunito,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#F5C518}" +
    "#lstVoiceBig .art{width:min(46vw,190px);aspect-ratio:1;margin:22px auto 16px;border-radius:26px;background:linear-gradient(145deg,#24407f,#1B2D5F);" +
    "box-shadow:0 16px 40px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff}#lstVoiceBig .art svg{width:46%;height:46%}" +
    "#lstVoiceBig .ti{font:600 22px/1.25 Fredoka,Nunito,sans-serif;text-align:center}#lstVoiceBig .kd{text-align:center;opacity:.75;font-size:14px;margin-top:4px}" +
    "#lstVoiceBig .main{display:flex;align-items:center;justify-content:center;gap:26px;margin:20px 0 10px}" +
    "#lstVoiceBig .sk{width:52px;height:52px;border-radius:50%;background:transparent;color:#fff;position:relative;display:flex;align-items:center;justify-content:center}" +
    "#lstVoiceBig .sk svg{width:34px;height:34px}#lstVoiceBig .sk span{position:absolute;font:800 10px Nunito,sans-serif;top:55%;left:50%;transform:translate(-50%,-50%)}" +
    "#lstVoiceBig .pl{width:72px;height:72px;border-radius:50%;background:#F5C518;color:#1B2D5F;font-size:26px;box-shadow:0 8px 22px rgba(0,0,0,.35)}" +
    "#lstVoiceBig input[type=range]{width:100%;accent-color:#F5C518;margin:6px 0 0}" +
    "#lstVoiceBig .tm{display:flex;justify-content:space-between;font-size:12px;opacity:.8}" +
    "#lstVoiceBig .msg{text-align:center;font-size:13px;opacity:.85;min-height:18px;margin-top:4px}" +
    "#lstVoiceBig .row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 0;border-top:1px solid rgba(255,255,255,.12)}" +
    "#lstVoiceBig .row b{font:800 14px Nunito,sans-serif}#lstVoiceBig .ch{display:flex;gap:6px;flex-wrap:wrap}" +
    "#lstVoiceBig .ch button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:6px 11px;font:800 13px Nunito,sans-serif}" +
    "#lstVoiceBig .ch button.on{background:#5BD3DC;color:#1B2D5F;border-color:#5BD3DC}" +
    "#lstVoiceBig .words{margin-top:14px;background:rgba(255,255,255,.07);border-radius:18px;padding:14px 16px}" +
    "#lstVoiceBig .words .h{font:800 12px Nunito,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#F5C518;margin-bottom:8px}" +
    "#lstVoiceBig .lines{max-height:min(42vh,360px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}" +
    "#lstVoiceBig .ln{font:600 17px/1.5 Nunito,sans-serif;opacity:.55;padding:5px 0;cursor:pointer;transition:opacity .15s}" +
    "#lstVoiceBig .ln.lnow{opacity:1}#lstVoiceBig .ww{border-radius:4px}" +
    "#lstVoiceBig .ww.wnow{background:rgba(245,197,24,.42);text-decoration:underline;text-decoration-color:#F5C518;text-decoration-thickness:3px;text-underline-offset:4px}";
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9.5 6 6 6-6"/></svg>';
  var UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14.5 6-6 6 6"/></svg>';
  var BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5V2.5L8.2 5.4 12 8.3V5.8a6.2 6.2 0 1 1-6.2 6.2"/></svg>';
  var FWD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5V2.5l3.8 2.9L12 8.3V5.8a6.2 6.2 0 1 0 6.2 6.2"/></svg>';
  function spLabel(x) { return (x === 1 ? "1" : String(x)) + "×"; }
  function sleepLabel(n) { return n >= 60 ? (n / 60) + (n === 60 ? " hour" : " hours") : n + " min"; }

  function bar() {
    var b = el("lstVoiceBar");
    if (!b) {
      if (!el("lstVoiceCss2")) { var c = document.createElement("style"); c.id = "lstVoiceCss2"; c.textContent = BCSS; document.head.appendChild(c); }
      b = document.createElement("div"); b.id = "lstVoiceBar"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Story read aloud");
      b.innerHTML = '<button class="pp" type="button" aria-label="Play">&#9654;</button>' +
        '<div class="mid" role="button" aria-label="Open the full player"><div class="t">Read aloud</div><input type="range" min="0" max="1000" value="0" aria-label="Where in the story">' +
        '<div class="msg"></div></div>' +
        '<button class="up" type="button" aria-label="Open the full player" title="Open the full player">' + UP + '</button>' +
        '<button class="x" type="button" aria-label="Close">&#10005;</button>';
      document.body.appendChild(b);
      b.querySelector(".pp").addEventListener("click", toggle);
      b.querySelector(".x").addEventListener("click", stop);
      b.querySelector(".up").addEventListener("click", openBig);
      b.querySelector(".mid").addEventListener("click", function (e) { if (e.target.tagName !== "INPUT") openBig(); });
      b.querySelector("input").addEventListener("input", function () { seekTo(this.value / 1000); });
      big();
    }
    return b;
  }
  function seekTo(frac) { if (audio && isFinite(audio.duration) && !startPart) audio.currentTime = audio.duration * frac; }
  function skip(s) { if (audio && isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration - 0.2, audio.currentTime + s)); }
  function setVoice(v) {
    if (v === voice) return;
    voice = v; try { localStorage.setItem("lst:voice", v); } catch (e) {}
    var at = audio ? audio.currentTime : 0; teardown(); paintVoices(); play(at);
  }
  function setSpeed(x) { speed = x; try { localStorage.setItem("lst:speed", String(x)); } catch (e) {} if (audio) audio.playbackRate = x; paintVoices(); }
  function setSleep(n) {
    clearTimeout(sleepT); sleepAt = 0;
    if (n) { sleepAt = Date.now() + n * 60000; sleepT = setTimeout(function () { sleepAt = 0; if (audio) audio.pause(); paintVoices(); }, n * 60000); }
    paintVoices();
  }
  function setWord(on) { wordOn = on; try { localStorage.setItem("lst:wordlight", on ? "on" : "off"); } catch (e) {} if (!on) W.clear(); paintVoices(); T.paint(true); }
  function big() {
    var g = el("lstVoiceBig"); if (g) return g;
    g = document.createElement("div"); g.id = "lstVoiceBig"; g.setAttribute("role", "dialog"); g.setAttribute("aria-label", "Now playing");
    g.innerHTML = '<div class="in"><div class="top"><button class="rd cl" type="button" aria-label="Close the player">' + CHEV + '</button>' +
      '<span class="lab">Read aloud</span><span style="width:42px"></span></div>' +
      '<div class="art">' + ICON + '</div><div class="ti"></div><div class="kd"></div>' +
      '<div class="main"><button class="sk bk" type="button" aria-label="Back ' + STEP + ' seconds">' + BACK + '<span>' + STEP + '</span></button>' +
      '<button class="pl" type="button" aria-label="Play">&#9654;</button>' +
      '<button class="sk fw" type="button" aria-label="Forward ' + STEP + ' seconds">' + FWD + '<span>' + STEP + '</span></button></div>' +
      '<input type="range" class="rail" min="0" max="1000" value="0" aria-label="Where in the story">' +
      '<div class="tm"><span class="c">0:00</span><span class="r">&ndash;:&ndash;&ndash;</span></div><div class="msg"></div>' +
      '<div class="row"><b>Who reads it</b><div class="ch vc">' + VOICES.map(function (v) { return '<button type="button" data-v="' + v[0] + '">' + v[1] + "</button>"; }).join("") + '</div></div>' +
      '<div class="row"><b>Light up each word</b><div class="ch"><button type="button" class="wl" data-w="1">On</button><button type="button" class="wl" data-w="0">Off</button></div></div>' +
      '<div class="row"><b>Playing speed</b><div class="ch">' + SPEEDS.map(function (x) { return '<button type="button" data-s="' + x + '">' + spLabel(x) + "</button>"; }).join("") + '</div></div>' +
      '<div class="row"><b>Sleep timer</b><div class="ch"><button type="button" data-z="0">Off</button>' + SLEEPS.map(function (n) { return '<button type="button" data-z="' + n + '">' + sleepLabel(n) + "</button>"; }).join("") + '</div></div>' +
      '<div class="words" hidden><div class="h">Transcript</div><div class="lines"></div></div></div>';
    document.body.appendChild(g);
    g.querySelector(".cl").addEventListener("click", closeBig);
    g.querySelector(".pl").addEventListener("click", toggle);
    g.querySelector(".bk").addEventListener("click", function () { skip(-STEP); });
    g.querySelector(".fw").addEventListener("click", function () { skip(STEP); });
    g.querySelector(".rail").addEventListener("input", function () { seekTo(this.value / 1000); });
    g.querySelectorAll("[data-v]").forEach(function (x) { x.addEventListener("click", function () { setVoice(this.getAttribute("data-v")); }); });
    g.querySelectorAll("[data-w]").forEach(function (x) { x.addEventListener("click", function () { setWord(this.getAttribute("data-w") === "1"); }); });
    g.querySelectorAll("[data-s]").forEach(function (x) { x.addEventListener("click", function () { setSpeed(Number(this.getAttribute("data-s"))); }); });
    g.querySelectorAll("[data-z]").forEach(function (x) { x.addEventListener("click", function () { setSleep(Number(this.getAttribute("data-z"))); }); });
    g.querySelector(".lines").addEventListener("click", function (e) {
      var ln = e.target.closest && e.target.closest(".ln"); if (!ln || !audio) return;
      var t = Number(ln.getAttribute("data-t")); if (!isFinite(t)) return;
      if (startPart && isFinite(audio.duration) && t > audio.duration - 0.3) { say("Getting the rest ready…"); return; }
      audio.currentTime = t; if (audio.paused) audio.play().catch(function () {});
    });
    /* a pull down closes it, as the app's does */
    var y0 = null;
    g.addEventListener("touchstart", function (e) { y0 = g.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    g.addEventListener("touchend", function (e) { if (y0 != null && e.changedTouches[0].clientY - y0 > 90) closeBig(); y0 = null; }, { passive: true });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && g.classList.contains("on")) closeBig(); });
    paintVoices();
    return g;
  }
  function openBig() { var g = big(); g.classList.add("on"); T.paint(true); paint(); clearInterval(bigT); bigT = setInterval(function () { T.paint(false); }, 120); }
  function closeBig() { var g = el("lstVoiceBig"); if (g) g.classList.remove("on"); clearInterval(bigT); bigT = 0; }
  function paintVoices() {
    var g = el("lstVoiceBig"); if (!g) return;
    g.querySelectorAll("[data-v]").forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-v") === voice); });
    g.querySelectorAll("[data-w]").forEach(function (x) { x.classList.toggle("on", (x.getAttribute("data-w") === "1") === wordOn); });
    g.querySelectorAll("[data-s]").forEach(function (x) { x.classList.toggle("on", Number(x.getAttribute("data-s")) === speed); });
    var left = sleepAt ? Math.max(1, Math.round((sleepAt - Date.now()) / 60000)) : 0, best = 0;
    if (sleepAt) SLEEPS.forEach(function (n) { if (!best && n >= left) best = n; });
    g.querySelectorAll("[data-z]").forEach(function (x) { var n = Number(x.getAttribute("data-z")); x.classList.toggle("on", sleepAt ? n === best : n === 0); });
    var v = VOICES.filter(function (x) { return x[0] === voice; })[0];
    g.querySelector(".kd").textContent = "Read by " + (v ? v[1] : "Eli") + (sleepAt ? " · stops in " + left + " min" : "");
  }
  function say(t) { var b = bar(); b.querySelector(".msg").textContent = t || ""; var g = el("lstVoiceBig"); if (g) g.querySelector(".msg").textContent = t || ""; }
  function paint() {
    var b = bar(), f = el("lstVoiceFab"), g = el("lstVoiceBig"), on = !!(audio && !audio.paused);
    var pp = on ? "&#10074;&#10074;" : "&#9654;", lbl = on ? "Pause" : "Play";
    b.querySelector(".pp").innerHTML = pp; b.querySelector(".pp").setAttribute("aria-label", lbl);
    if (f) { f.classList.toggle("on", on); f.classList.toggle("wait", busy); }
    var known = audio && isFinite(audio.duration) && !startPart, title = key.title || "The story";
    if (known) {
      b.querySelector("input").value = Math.round(1000 * audio.currentTime / audio.duration);
      b.querySelector(".t").textContent = title + " · " + fmt(audio.currentTime) + " / " + fmt(audio.duration);
    } else b.querySelector(".t").textContent = title;
    if (g) {
      g.querySelector(".pl").innerHTML = pp; g.querySelector(".pl").setAttribute("aria-label", lbl);
      g.querySelector(".ti").textContent = title;
      g.querySelector(".rail").value = known ? Math.round(1000 * audio.currentTime / audio.duration) : 0;
      g.querySelector(".c").textContent = fmt(audio ? audio.currentTime : 0);
      g.querySelector(".r").textContent = known ? "-" + fmt(audio.duration - audio.currentTime) : "–:––";
    }
  }
  /* THE TRANSCRIPT: the recording's own words, a line per sentence, laid along its times */
  var T = (function () {
    var built = null, lines = [], lastW = -1, lastL = -1;
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function build(tm) {
      var g = el("lstVoiceBig"); if (!g) return;
      var box = g.querySelector(".words");
      if (!tm) { box.hidden = true; built = null; return; }
      if (built === tm) return;
      built = tm; lines = []; lastW = -1; lastL = -1;
      var cur = null;
      tm.w.forEach(function (w, i) {
        if (!cur) { cur = { a: i, b: i }; lines.push(cur); }
        cur.b = i;
        if (/[.!?]["”’')]*$/.test(w)) cur = null;
      });
      g.querySelector(".lines").innerHTML = lines.map(function (L, n) {
        var h = ""; for (var i = L.a; i <= L.b; i++) h += (i > L.a ? " " : "") + '<span class="ww" data-i="' + i + '">' + esc(tm.w[i]) + "</span>";
        return '<div class="ln" data-n="' + n + '" data-t="' + Number(tm.t[L.a]) + '">' + h + "</div>";
      }).join("");
      box.hidden = false;
    }
    return {
      paint: function (force) {
        var g = el("lstVoiceBig"); if (!g || !g.classList.contains("on")) return;
        var tm = W.times(); build(tm); if (!tm || !lines.length) return;
        if (force) { lastW = -2; lastL = -2; }
        var cur = audio ? audio.currentTime : 0, T0 = tm.t, lo = 0, hi = T0.length - 1, wi = -1;
        while (lo <= hi) { var mid = (lo + hi) >> 1; if (Number(T0[mid]) <= cur + 0.04) { wi = mid; lo = mid + 1; } else hi = mid - 1; }
        var li = -1; for (var n = 0; n < lines.length; n++) if (wi >= lines[n].a) li = n; else break;
        var box = g.querySelector(".lines");
        if (li !== lastL) {
          var o = box.querySelector(".ln.lnow"); if (o) o.classList.remove("lnow");
          var L = box.querySelector('.ln[data-n="' + li + '"]');
          if (L) { L.classList.add("lnow"); var y = L.getBoundingClientRect().top - box.getBoundingClientRect().top; if (y < 0 || y > box.clientHeight - 48) box.scrollTop += y - box.clientHeight * 0.3; }
          lastL = li;
        }
        var wk = wordOn ? wi : -1;
        if (wk !== lastW) {
          var ow = box.querySelector(".ww.wnow"); if (ow) ow.classList.remove("wnow");
          if (wk >= 0) { var sp = box.querySelector('.ww[data-i="' + wk + '"]'); if (sp) sp.classList.add("wnow"); }
          lastW = wk;
        }
      },
      reset: function () { built = null; lines = []; var g = el("lstVoiceBig"); if (g) { g.querySelector(".words").hidden = true; g.querySelector(".lines").innerHTML = ""; } }
    };
  })();
  function teardown() {
    clearTimeout(waitT); startPart = null; W.stop(); T.reset();
    if (audio) { try { audio.pause(); } catch (e) {} audio.src = ""; audio = null; }
  }
  function stop() { teardown(); busy = false; closeBig(); setSleep(0); var b = el("lstVoiceBar"); if (b) b.classList.remove("on"); paint(); }
  function toggle() {
    if (busy) return;
    if (!audio) { play(0); return; }
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  }
  function use(src, at) {
    audio = new Audio(fresh(src)); audio.preload = "auto"; audio.playbackRate = speed;
    audio.addEventListener("loadedmetadata", function () { audio.playbackRate = speed; });
    ["play", "pause", "timeupdate", "loadedmetadata", "ended"].forEach(function (ev) { audio.addEventListener(ev, paint); });
    audio.addEventListener("loadedmetadata", function () { if (at && isFinite(audio.duration)) audio.currentTime = Math.min(at, audio.duration - 1); }, { once: true });
    busy = false; say(""); W.start();
    return audio.play().catch(function () { paint(); });
  }
  /* the opening plays at once; the whole recording takes over from the same spot when it is ready */
  function playStart(start, full) {
    fullUrl = full; startPart = new Audio(fresh(start)); audio = startPart; startPart.playbackRate = speed;
    ["play", "pause", "timeupdate"].forEach(function (ev) { startPart.addEventListener(ev, paint); });
    startPart.addEventListener("ended", function () {
      var reached = startPart ? startPart.duration : 0;
      var tryFull = function () {
        exists(fullUrl).then(function (ok) {
          if (ok) { startPart = null; use(fullUrl, reached); }
          else { busy = true; say("Getting the rest ready…"); paint(); waitT = setTimeout(tryFull, 2000); }
        });
      };
      tryFull();
    });
    busy = false; say(""); W.start();
    startPart.play().catch(function () { paint(); });
  }
  function client() { var a = window.LSTAuth; return (a && a.client && a.client()) || window.LST_SB || null; }
  function play(at, plain) {
    if (!key) return;
    bar().classList.add("on");
    var name = fileName(voice, plain); if (!name) { say("This story has no recording yet."); return; }
    var full = BASE + name;
    busy = true; say("Opening the story…"); paint();
    var timesUrl = full.replace(/\.mp3$/, ".json");
    Promise.all([exists(full), plain ? Promise.resolve(true) : exists(timesUrl)]).then(function (ok) {
      if (ok[0] && ok[1]) { if (!plain) W.load(timesUrl); return use(full, at); }
      var sb = client();
      if (!sb || !sb.functions) { busy = false; say("Sign in to hear this read."); paint(); return; }
      var body = { voice: voice }; if (key.story) body.story = key.story; else body.book = key.book;
      if (!plain) body.timed = true;
      return sb.functions.invoke("narrate", { body: body }).then(function (r) {
        var d = r && r.data;
        if (!d || r.error || d.error) {
          /* should the timed recording fail, the same voice without the word times */
          if (!plain && !(r && r.error && /403|401/.test(String(r.error.message || r.error)))) { busy = false; return play(at, true); }
          busy = false;
          say((d && d.error) || (r && r.error && /403|401/.test(String(r.error.message || r.error)) ? "Sign in to hear this read." : "It could not be read just now. Try again in a moment."));
          paint(); return;
        }
        if (d.head) W.use(d.head);
        if (d.pending && d.start) { playStart(d.start, d.full || full); if (!plain) W.poll(timesUrl); }
        else { use(d.url || full, at); if (!plain) W.load(timesUrl); }
      });
    }).catch(function () { busy = false; say("It could not be read just now. Try again in a moment."); paint(); });
  }

  /* ---------- THE WORD BEING READ, ON THE BOOK'S PAGE ----------
     The recording's words are matched to the book's pages (the same list of words the recording was made from:
     the title and the reference said as words on the cover, then each page), and on the page shown to its words in
     order, a few words of slack for any shown but not said. Tonight's story is the app's own book in a frame
     (story.html); a shelf story is this site's book (read.html, LSTBookEngine). */
  var W = (function () {
    var times = null, map = null, timer = 0, lastBeat = -1, tries = 0, pollT = 0;
    function norm(w) { return String(w || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
    var dec = document.createElement("textarea");
    function decode(t) { dec.innerHTML = String(t || ""); return dec.value; }
    function refWords(ref) {
      var m = String(ref || "").trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-\u2013]\s*(\d+))?)?$/);
      if (!m) return String(ref || "");
      if (!m[3]) return m[1] + " chapter " + m[2];
      if (!m[4]) return m[1] + " chapter " + m[2] + ", verse " + m[3];
      return m[1] + " chapter " + m[2] + ", verses " + m[3] + " to " + m[4];
    }
    function beatTokens(st) {
      var toks = (st.beats || []).map(function () { return []; });
      var P = function (bi, t) { var x = decode(t).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); if (!x || bi < 0) return; x.split(" ").forEach(function (w) { toks[bi].push(norm(w)); }); };
      var cover = -1; (st.beats || []).forEach(function (b, k) { if (cover < 0 && b && b.type === "cover") cover = k; });
      P(cover, st.title); if (st.reference) P(cover, refWords(st.reference));
      (st.beats || []).forEach(function (b, bi) {
        if (!b) return;
        if (b.type === "story") { (b.text || []).forEach(function (t) { P(bi, t); }); return; }
        if (b.type !== "moment") return;
        var eb = decode(b.eyebrow || ""), h = decode(b.heading || "");
        if (/Scripture Traveler/i.test(eb)) P(bi, eb + ": " + h); else if (h) P(bi, h);
        (b.text || []).forEach(function (t) { P(bi, t); });
        (b.stones || []).forEach(function (x) { if (Array.isArray(x) && x.length > 1) { var lab = String(x[0] || ""); P(bi, lab.charAt(0) + lab.slice(1).toLowerCase() + ". " + x[1]); } });
        (b.list || []).forEach(function (t) { P(bi, t); });
      });
      return toks;
    }
    /* the book being read: the app's own book in the frame, or this site's shelf book */
    function engine() {
      var f = el("lst-book");
      if (f) {
        try {
          var w = f.contentWindow; if (!w || w.eval("typeof STORY") !== "object") return null;
          return { story: function () { return w.eval("STORY"); }, beat: function () { return w.eval("i"); }, sheet: function () { return w.eval("sheets[front]"); },
                   busy: function () { return w.eval("busy"); }, go: function (n) { w.go(n, true); }, doc: function () { return w.document; } };
        } catch (e) { return null; }
      }
      return window.LSTBookEngine && window.LSTBookEngine.story() ? window.LSTBookEngine : null;
    }
    function build(E) {
      if (map || !times || !E) return map;
      var st = E.story(); if (!st) return null;
      var Wd = times.w.map(norm), at = new Array(Wd.length), toks = beatTokens(st), g = 0;
      toks.forEach(function (list, bi) { list.forEach(function (n, k) {
        var hit = -1; for (var q = g; q < Math.min(Wd.length, g + 6); q++) if (Wd[q] === n) { hit = q; break; }
        if (hit < 0) { if (!n || g >= Wd.length) return; hit = g; }
        at[hit] = [bi, k]; g = hit + 1; }); });
      map = { t: times.t.map(Number), at: at, spoken: toks };
      return map;
    }
    function css(d) {
      if (d.getElementById("lstWordCss")) return;
      var c = d.createElement("style"); c.id = "lstWordCss";
      c.textContent = ".lst-w{border-radius:5px;transition:background-color .08s}.lst-w.lst-now{background:rgba(245,197,24,.42);text-decoration:underline;text-decoration-color:#F5C518;text-decoration-thickness:3px;text-underline-offset:4px;-webkit-box-decoration-break:clone;box-decoration-break:clone}";
      (d.head || d.documentElement).appendChild(c);
    }
    function wrap(E, sheet, bi, spoken) {
      var inner = sheet && sheet.querySelector(".panel-inner"); if (!inner) return null;
      if (inner.__lstw && inner.__lstw.bi === bi) return inner.__lstw;
      var d = E.doc(); css(d);
      var walk = d.createTreeWalker(inner, 4, null), nodes = [], t;
      while ((t = walk.nextNode())) { if (t.nodeValue && /\S/.test(t.nodeValue) && !(t.parentNode && t.parentNode.closest && t.parentNode.closest("a,button,.lst-w"))) nodes.push(t); }
      var spans = [];
      nodes.forEach(function (node) {
        var frag = d.createDocumentFragment();
        String(node.nodeValue).split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(part)); return; }
          var sp = d.createElement("span"); sp.className = "lst-w"; sp.textContent = part; frag.appendChild(sp); spans.push(sp);
        });
        node.parentNode.replaceChild(frag, node);
      });
      var D = spans.map(function (sp) { return norm(sp.textContent); }), byK = [], p = 0;
      (spoken || []).forEach(function (n, k) { for (var q = p; q < Math.min(D.length, p + 8); q++) if (D[q] === n) { byK[k] = spans[q]; p = q + 1; break; } });
      inner.__lstw = { bi: bi, byK: byK, now: null };
      return inner.__lstw;
    }
    function clear() {
      var E = engine(); if (!E) return;
      try { E.doc().querySelectorAll(".lst-w.lst-now").forEach(function (x) { x.classList.remove("lst-now"); }); } catch (e) {}
    }
    function tick() {
      if (!audio || !times) return;
      var E = engine(); if (!E) return;
      var M = build(E); if (!M) return;
      var cur = audio.currentTime || 0, T = M.t, lo = 0, hi = T.length - 1, g = -1;
      while (lo <= hi) { var mid = (lo + hi) >> 1; if (T[mid] <= cur + 0.04) { g = mid; lo = mid + 1; } else hi = mid - 1; }
      var pos = null; for (var q = g; q >= 0 && q > g - 4; q--) if (M.at[q]) { pos = M.at[q]; break; }
      if (!pos) { clear(); return; }
      var shown = E.beat();
      /* the voice has reached a new page: turn to it, once */
      if (pos[0] !== lastBeat) {
        if (shown !== pos[0]) { if (!E.busy()) E.go(pos[0]); if (E.beat() === pos[0]) lastBeat = pos[0]; return; }
        lastBeat = pos[0];
      }
      if (shown !== pos[0] || !wordOn || E.busy()) { clear(); return; }
      var L = wrap(E, E.sheet(), pos[0], M.spoken[pos[0]]); if (!L) return;
      var sp = L.byK[pos[1]] || null;
      if (sp === L.now) return;
      if (L.now) L.now.classList.remove("lst-now");
      L.now = sp; if (!sp) return;
      sp.classList.add("lst-now");
      try {
        var panel = sp.closest(".panel"); if (panel) {
          var r = sp.getBoundingClientRect(), pr = panel.getBoundingClientRect(), barEl = E.doc().querySelector(".controls");
          var floor = Math.min(pr.bottom, barEl ? barEl.getBoundingClientRect().top - 8 : pr.bottom);
          if (r.bottom > floor) panel.scrollTop += r.bottom - floor + 40; else if (r.top < pr.top + 20) panel.scrollTop -= pr.top + 20 - r.top + 40;
        }
      } catch (e) {}
    }
    function useTimes(j) { if (j && Array.isArray(j.w) && Array.isArray(j.t) && j.w.length === j.t.length) { if (!times || j.w.length >= times.w.length) { times = j; map = null; } } }
    return {
      use: useTimes,
      times: function () { return times; },
      load: function (u) { fetch(fresh(u), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(useTimes).catch(function () {}); },
      poll: function (u) { tries = 0; clearTimeout(pollT); var self = this; (function look() {
        fetch(fresh(u) + "&p=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
          if (j && j.w && (!times || j.w.length > times.w.length)) { useTimes(j); return; }
          if (++tries < 40) pollT = setTimeout(look, 4000); }).catch(function () { if (++tries < 40) pollT = setTimeout(look, 4000); }); })(); },
      start: function () { lastBeat = -1; if (!timer) timer = setInterval(function () { try { tick(); } catch (e) {} }, 100); },
      stop: function () { if (timer) { clearInterval(timer); timer = 0; } clearTimeout(pollT); times = null; map = null; lastBeat = -1; clear(); },
      clear: clear
    };
  })();

  window.LSTStoryVoice = {
    mount: function (k) {
      k = k || {};
      if (k.id && !k.book) k.book = slugFor(k.id);
      if (!k.story && !k.book) return;
      if (!el("lstVoiceCss")) { var st = document.createElement("style"); st.id = "lstVoiceCss"; st.textContent = CSS; document.head.appendChild(st); }
      if (key && (key.story !== k.story || key.book !== k.book)) stop();
      key = k;
      var f = el("lstVoiceFab");
      if (!f) {
        f = document.createElement("button"); f.id = "lstVoiceFab"; f.type = "button";
        f.setAttribute("aria-label", "Read the story to me"); f.title = "Read the story to me";
        f.innerHTML = ICON; document.body.appendChild(f);
        f.addEventListener("click", function () { if (!audio && !busy) play(0); else { bar().classList.add("on"); toggle(); } });
      }
    },
    stop: stop
  };
  window.addEventListener("pagehide", function () { try { if (audio) audio.pause(); } catch (e) {} });
})();
