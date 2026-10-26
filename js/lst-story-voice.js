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
    "#lstVoiceBar .msg{font-size:12px;opacity:.8}";
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6" fill="#F5C518" stroke="currentColor"/>' +
    '<rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6" fill="#F5C518" stroke="currentColor"/></svg>';

  function el(id) { return document.getElementById(id); }
  function slugFor(id) { var m = window.LST_STORY_SLUGS || {}; return m[id] || ""; }
  function fileName(v) {
    if (key.story) return "story/" + key.story + "-" + v + ".mp3";
    if (key.book) return "book/" + key.book + "-" + v + ".mp3";
    return "";
  }
  /* a recording made again (the words changed) keeps its address, so ask past a day-old copy */
  function fresh(u) { var d = new Date(); return u + (u.indexOf("?") < 0 ? "?" : "&") + "d=" + d.getFullYear() + (d.getMonth() + 1) + d.getDate(); }
  function exists(u) {
    return fetch(fresh(u), { method: "HEAD", cache: "no-store" }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }

  function bar() {
    var b = el("lstVoiceBar");
    if (!b) {
      b = document.createElement("div"); b.id = "lstVoiceBar"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Story read aloud");
      b.innerHTML = '<button class="pp" type="button" aria-label="Play">&#9654;</button>' +
        '<div class="mid"><div class="t">Read aloud</div><input type="range" min="0" max="1000" value="0" aria-label="Where in the story">' +
        '<div class="msg"></div></div>' +
        '<div class="vc">' + VOICES.map(function (v) { return '<button type="button" data-v="' + v[0] + '">' + v[1] + "</button>"; }).join("") + "</div>" +
        '<button class="x" type="button" aria-label="Close">&#10005;</button>';
      document.body.appendChild(b);
      b.querySelector(".pp").addEventListener("click", toggle);
      b.querySelector(".x").addEventListener("click", stop);
      b.querySelector("input").addEventListener("input", function () {
        if (audio && isFinite(audio.duration) && !startPart) audio.currentTime = audio.duration * this.value / 1000;
      });
      b.querySelectorAll("[data-v]").forEach(function (x) {
        x.addEventListener("click", function () {
          var v = this.getAttribute("data-v"); if (v === voice) return;
          voice = v; try { localStorage.setItem("lst:voice", v); } catch (e) {}
          var at = audio ? audio.currentTime : 0; teardown(); paintVoices(); play(at);
        });
      });
    }
    paintVoices();
    return b;
  }
  function paintVoices() { var b = el("lstVoiceBar"); if (!b) return; b.querySelectorAll("[data-v]").forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-v") === voice); }); }
  function say(t) { var b = bar(); b.querySelector(".msg").textContent = t || ""; }
  function paint() {
    var b = bar(), f = el("lstVoiceFab"), on = !!(audio && !audio.paused);
    b.querySelector(".pp").innerHTML = on ? "&#10074;&#10074;" : "&#9654;";
    b.querySelector(".pp").setAttribute("aria-label", on ? "Pause" : "Play");
    if (f) { f.classList.toggle("on", on); f.classList.toggle("wait", busy); }
    if (audio && isFinite(audio.duration) && !startPart) {
      b.querySelector("input").value = Math.round(1000 * audio.currentTime / audio.duration);
      b.querySelector(".t").textContent = (key.title || "The story") + " · " + fmt(audio.currentTime) + " / " + fmt(audio.duration);
    } else b.querySelector(".t").textContent = key.title || "The story";
  }
  function teardown() {
    clearTimeout(waitT); startPart = null;
    if (audio) { try { audio.pause(); } catch (e) {} audio.src = ""; audio = null; }
  }
  function stop() { teardown(); busy = false; var b = el("lstVoiceBar"); if (b) b.classList.remove("on"); paint(); }
  function toggle() {
    if (busy) return;
    if (!audio) { play(0); return; }
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  }
  function use(src, at) {
    audio = new Audio(fresh(src)); audio.preload = "auto";
    ["play", "pause", "timeupdate", "loadedmetadata", "ended"].forEach(function (ev) { audio.addEventListener(ev, paint); });
    audio.addEventListener("loadedmetadata", function () { if (at && isFinite(audio.duration)) audio.currentTime = Math.min(at, audio.duration - 1); }, { once: true });
    busy = false; say("");
    return audio.play().catch(function () { paint(); });
  }
  /* the opening plays at once; the whole recording takes over from the same spot when it is ready */
  function playStart(start, full) {
    fullUrl = full; startPart = new Audio(fresh(start)); audio = startPart;
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
    busy = false; say("");
    startPart.play().catch(function () { paint(); });
  }
  function client() { var a = window.LSTAuth; return (a && a.client && a.client()) || window.LST_SB || null; }
  function play(at) {
    if (!key) return;
    bar().classList.add("on");
    var name = fileName(voice); if (!name) { say("This story has no recording yet."); return; }
    var full = BASE + name;
    busy = true; say("Opening the story…"); paint();
    exists(full).then(function (ok) {
      if (ok) return use(full, at);
      var sb = client();
      if (!sb || !sb.functions) { busy = false; say("Sign in to hear this read."); paint(); return; }
      var body = { voice: voice }; if (key.story) body.story = key.story; else body.book = key.book;
      return sb.functions.invoke("narrate", { body: body }).then(function (r) {
        var d = r && r.data;
        if (!d || r.error || d.error) {
          busy = false;
          say((d && d.error) || (r && r.error && /403|401/.test(String(r.error.message || r.error)) ? "Sign in to hear this read." : "It could not be read just now. Try again in a moment."));
          paint(); return;
        }
        if (d.pending && d.start) playStart(d.start, d.full || full); else use(d.url || full, at);
      });
    }).catch(function () { busy = false; say("It could not be read just now. Try again in a moment."); paint(); });
  }

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
