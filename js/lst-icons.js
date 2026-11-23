/* ═══════════════════════════════════════════════════════════════════════════
   THE BRAND'S ICONS, NOT THE PHONE'S EMOJI (Levi, 23 Nov 2026: "the website
   needs to have the little scripture travelers icons instead of emoji's").

   The pictures are the app's own line set (js/line-icons.js, the same file as
   the app's www/js/line-icons.js: one line in the colour of the words, one gold
   accent). The pages' own markup already holds <i data-lli="name"></i> where an
   emoji used to be; this file catches the rest: anything a script writes later
   (a night's cards, a list, a message), turning each emoji that has an icon
   into that icon as it lands. An emoji with no icon is left as it is.

   Speed: loaded with defer after line-icons.js; one pass over the page when it
   is ready, then only the pieces a script adds (a MutationObserver, batched).
   Not on the World Timeline (timeline-explore.html): its event markers stay the
   phone's pictures, as in the app. A spot can keep its emoji with data-keep-emoji.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.__lstIcons) return; window.__lstIcons = true;
  var MAP = {
    "\u{1F4D6}": "book", "\u{1F4D5}": "book", "\u{1F4D7}": "book", "\u{1F4D8}": "book", "\u{1F4D9}": "book", "\u{1F56E}": "book",
    "\u{1F4DA}": "books",
    "\u{1F3B5}": "music", "\u{1F3B6}": "music", "\u{1F3BC}": "music", "♫": "music", "♪": "music",
    "\u{1F319}": "moon", "\u{1F31B}": "moon", "\u{1F31C}": "moon",
    "\u{1F46A}": "family", "\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}": "family", "\u{1F468}‍\u{1F469}‍\u{1F467}": "family",
    "\u{1F49B}": "heart", "\u{1F49E}": "heart", "❤": "heart", "\u{1F496}": "heart", "\u{1F497}": "heart",
    "\u{1F464}": "person", "\u{1F465}": "people",
    "✍": "feather", "\u{1F4DD}": "feather", "\u{1F4D3}": "feather", "\u{1F4D4}": "feather", "\u{1F4D2}": "feather", "\u{1FAB6}": "feather",
    "\u{1F4DC}": "scroll", "\u{1F4C4}": "scroll",
    "\u{1F3EE}": "lantern", "\u{1F56F}": "candle",
    "\u{1F50A}": "headphones", "\u{1F3A7}": "headphones",
    "\u{1F4F7}": "camera", "\u{1F4F8}": "camera",
    "\u{1F5D1}": "trash", "✏": "pencil", "✎": "pencil",
    "\u{1F3E0}": "home", "\u{1F3E1}": "home",
    "\u{1F550}": "clock", "\u{1F552}": "clock", "⏰": "clock", "⌚": "clock", "⏳": "clock",
    "\u{1F4F1}": "phone", "\u{1F4F2}": "phone",
    "\u{1F512}": "lock", "\u{1F510}": "lock",
    "\u{1F9ED}": "compass", "\u{1F392}": "backpack", "\u{1F690}": "van", "\u{1F6E0}": "tools",
    "\u{1F5BC}": "picture", "\u{1F441}": "eye", "\u{1F440}": "eye", "\u{1F4A1}": "bulb", "⚔": "swords",
    "\u{1F50D}": "search", "\u{1F50E}": "search", "\u{1F448}": "hand", "\u{1F44B}": "hand", "✋": "hand",
    "\u{1F310}": "globe", "\u{1F30D}": "globe", "\u{1F30E}": "globe", "\u{1F30F}": "globe",
    "✨": "sparkle", "\u{1F31F}": "star", "⭐": "star",
    "\u{1F3A4}": "mic", "\u{1F33F}": "seed", "\u{1F331}": "seed", "✝": "cross", "⚖": "scales", "\u{1F4CD}": "pin",
    "\u{1F5A8}": "printer", "\u{1F393}": "gradcap", "\u{1F517}": "chain", "\u{1F501}": "repeat",
    "\u{1F64C}": "hands", "\u{1F64F}": "hands", "\u{1F5E3}": "speech", "\u{1F4AD}": "speech", "\u{1F4AC}": "speech",
    "\u{1F602}": "smile", "\u{1F60A}": "smile", "\u{1F604}": "smile", "❓": "question", "❔": "question", "\u{1F3AF}": "target",
    "\u{1F381}": "gift", "☀": "sun", "\u{1F514}": "bell", "✅": "check", "\u{1F3DB}": "columns", "☪": "hand",
    "\u{1F4E3}": "megaphone", "\u{1F4E2}": "megaphone", "\u{1F52D}": "telescope", "\u{1F52C}": "microscope", "\u{1F5FA}": "map", "\u{1F6A9}": "flag"
  };
  var keys = Object.keys(MAP).sort(function (a, b) { return b.length - a.length; });
  var RE = new RegExp("(" + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")️?", "gu");
  var TEST = new RegExp(RE.source, "u");
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|TITLE|NOSCRIPT|svg|SVG|CODE|PRE)$/;

  function svg(name) { return window.lstLine ? window.lstLine(name, "lli-em") : ""; }
  function kept(el) { return el.closest && el.closest("[data-keep-emoji]"); }

  function swapText(t) {
    var p = t.parentNode; if (!p || SKIP.test(p.nodeName) || kept(p)) return;
    var v = t.nodeValue; if (!TEST.test(v)) return;
    if (p.nodeName === "OPTION") { t.nodeValue = v.replace(RE, "").replace(/^\s+/, ""); return; }
    var d = t.ownerDocument, frag = d.createDocumentFragment(), last = 0, m; RE.lastIndex = 0;
    while ((m = RE.exec(v))) {
      if (m.index > last) frag.appendChild(d.createTextNode(v.slice(last, m.index)));
      var box = d.createElement("span"); box.innerHTML = svg(MAP[m[1]]);
      if (box.firstChild) frag.appendChild(box.firstChild); else frag.appendChild(d.createTextNode(m[0]));
      last = RE.lastIndex;
    }
    if (last < v.length) frag.appendChild(d.createTextNode(v.slice(last)));
    p.replaceChild(frag, t);
  }
  function swap(root) {
    try {
      if (!root) return;
      if (root.nodeType === 3) { swapText(root); return; }
      if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
      if (!TEST.test(root.textContent || "")) return;
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), todo = [], n;
      while ((n = w.nextNode())) if (TEST.test(n.nodeValue)) todo.push(n);
      todo.forEach(swapText);
    } catch (e) {}
  }
  /* a button that names itself by an emoji (title/aria-label) keeps its words; only what is seen changes */
  var queue = [], queued = false;
  function flush() { queued = false; var q = queue; queue = []; q.forEach(function (n) { if (n.isConnected !== false) swap(n); }); onGold(document); }
  /* on a gold button or badge the gold parts would vanish: there they take the colour of the line */
  function onGold(root) {
    try {
      var list = [].slice.call((root || document).querySelectorAll("svg.lli:not([data-g])")), memo = new Map();
      var marks = list.map(function (svgEl) {
        var n = svgEl.parentElement, path = [];
        while (n && n.nodeType === 1) {
          if (memo.has(n)) { var v = memo.get(n); path.forEach(function (x) { memo.set(x, v); }); return v; }
          path.push(n);
          var m = (getComputedStyle(n).backgroundColor || "").match(/(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,\/]+([\d.]+))?/),
              img = getComputedStyle(n).backgroundImage || "";
          if ((m && (m[4] === undefined || +m[4] > 0.3)) || /gradient/.test(img)) {
            var g = m && (m[4] === undefined || +m[4] > 0.3) ? (+m[1] > 200 && +m[2] > 150 && +m[3] < 110) : /245, ?197, ?24|#F5C518|244, ?200|#F4C842|217, ?162, ?39/i.test(img);
            path.forEach(function (x) { memo.set(x, g); }); return g;
          }
          n = n.parentElement;
        }
        return false;
      });
      list.forEach(function (svgEl, i) { svgEl.setAttribute("data-g", marks[i] ? "1" : "0"); });
    } catch (e) {}
  }
  function start() {
    if (!window.lstLine) return;
    var css = document.createElement("style");
    css.textContent = ".lli.lli-em{width:1.15em;height:1.15em;vertical-align:-.2em;margin:0 .08em}" +
      "svg.lli[data-g='1'] .ig{fill:currentColor}svg.lli[data-g='1'] .igs{stroke:currentColor}";
    document.head.appendChild(css);
    swap(document.body); onGold(document);
    try {
      new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          var m = ms[i];
          if (m.type === "characterData") queue.push(m.target);
          else for (var j = 0; j < m.addedNodes.length; j++) queue.push(m.addedNodes[j]);
        }
        if (!queued && queue.length) { queued = true; Promise.resolve().then(flush); }
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.lstIconSwap = swap;
})();
