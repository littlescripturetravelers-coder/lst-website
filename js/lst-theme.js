/* THE THREE THEMES — Traditional, Dark, Light.

   The app has offered these since it shipped. This is the same three, and it
   is deliberately the SAME CONTRACT so the two never disagree:

       stored as   lst_theme          (localStorage, same key as the app)
       values      blue | dark | light
       applied as  data-theme on <html>; 'blue' carries NO attribute, because
                   it is the built-in look
       chrome      <meta name="theme-color"> follows, so the phone's own bar
                   matches the page

   ⚠️ THIS FILE GOES IN <head>, NOT AT THE FOOT.
   It has to paint the theme before the body is drawn. Loaded at the bottom, a
   family who chose Light gets a flash of navy on every page, which looks like
   a fault.

   WHERE THE CONTROL IS: the header, at the right, just before the subscribe
   button — the corner where a reader looks for settings, and where the app
   keeps its own theme chip. Also written out in full on My Account, because
   that is where somebody goes looking for it if they miss the header.

   ⚠️ Colours are tokens now (see the top of style.css). If you add a rule with
   a literal `color: rgba(255,255,255,…)` or `color: #fff`, it will be right in
   two themes and invisible in the third.
*/
(function () {
  "use strict";

  var KEY = "lst_theme";
  var THEMES = ["blue", "dark", "light"];
  var LABEL = { blue: "Traditional", dark: "Dark", light: "Light" };
  var BAR   = { blue: "#1B2D5F", dark: "#14171F", light: "#FFFFFF" };

  /* A page may lock itself to one look with
         <meta name="lst:theme-lock" content="blue">
     The Sacred World Timeline does. It is a night sky drawn on a canvas with
     its own stars and its own hand-placed colours; on paper it would be a
     white square with white writing on it. A locked page still stores nothing
     and changes nothing — the family's choice is untouched everywhere else. */
  function locked() {
    var m = document.querySelector('meta[name="lst:theme-lock"]');
    var v = m && m.content;
    return THEMES.indexOf(v) === -1 ? null : v;
  }

  function saved() {
    var l = locked();
    if (l) return l;
    try {
      var v = localStorage.getItem(KEY);
      return THEMES.indexOf(v) === -1 ? "blue" : v;
    } catch (e) { return "blue"; }
  }

  function apply(name) {
    if (THEMES.indexOf(name) === -1) name = "blue";
    var h = document.documentElement;
    if (name === "blue") h.removeAttribute("data-theme");
    else h.setAttribute("data-theme", name);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      (document.head || h).appendChild(meta);
    }
    meta.content = BAR[name];
    return name;
  }

  function set(name) {
    if (locked()) return locked();
    var n = apply(name);
    try { localStorage.setItem(KEY, n); } catch (e) {}
    paintControls(n);
    /* Anything that drew itself from a token can redraw if it wants to. */
    try {
      document.dispatchEvent(new CustomEvent("lst:theme", { detail: { theme: n } }));
    } catch (e) {}
    return n;
  }

  /* Painted before anything else runs. */
  var current = apply(saved());

  /* ------------------------------------------------------------ the control */
  function group(id, withLabels) {
    var g = document.createElement("div");
    g.className = "th" + (withLabels ? " th-wide" : "");
    g.id = id;
    g.setAttribute("role", "group");
    g.setAttribute("aria-label", "Colour theme");
    THEMES.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "th-b th-" + t;
      b.setAttribute("data-theme-set", t);
      b.setAttribute("aria-label", LABEL[t]);
      b.title = LABEL[t];
      b.innerHTML = '<span class="th-dot" aria-hidden="true"></span>' +
                    (withLabels ? '<span class="th-txt">' + LABEL[t] + "</span>" : "");
      b.addEventListener("click", function () { set(t); });
      g.appendChild(b);
    });
    return g;
  }

  function paintControls(name) {
    var all = document.querySelectorAll("[data-theme-set]");
    for (var i = 0; i < all.length; i++) {
      var on = all[i].getAttribute("data-theme-set") === name;
      all[i].classList.toggle("on", on);
      all[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function place() {
    if (locked()) return;
    /* the header, just before the subscribe button */
    if (!document.getElementById("lst-theme-head")) {
      var cta = document.querySelector(".header-inner .nav-cta") ||
                document.querySelector(".header-inner .btn-gold");
      if (cta && cta.parentNode) {
        cta.parentNode.insertBefore(group("lst-theme-head", false), cta);
      } else {
        var inner = document.querySelector(".header-inner");
        if (inner) inner.appendChild(group("lst-theme-head", false));
      }
    }
    /* the phone menu, at the foot of it — the header dots are too small a
       target once the nav has collapsed to a burger, so on a phone the
       control lives where the rest of the menu lives */
    var mob = document.querySelector(".mobile-nav");
    if (mob && !document.getElementById("lst-theme-mob")) {
      var wrap = document.createElement("div");
      wrap.className = "th-mob";
      var cap = document.createElement("span");
      cap.className = "th-mob-cap";
      cap.textContent = "Colour theme";
      wrap.appendChild(cap);
      wrap.appendChild(group("lst-theme-mob", true));
      mob.appendChild(wrap);
    }

    /* and spelled out wherever a page asks for it */
    var slots = document.querySelectorAll("[data-theme-picker]");
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].firstChild) continue;
      slots[i].appendChild(group("", true));
    }
    paintControls(current);
  }

  if (document.readyState !== "loading") place();
  else document.addEventListener("DOMContentLoaded", place);

  window.LSTTheme = {
    get: function () { return saved(); },
    set: set,
    /* Anything that draws itself after the page has loaded — My Account draws
       once the sign-in has come back — calls this so its [data-theme-picker]
       slot gets filled. Safe to call as often as you like. */
    place: place,
    themes: THEMES,
    label: function (t) { return LABEL[t] || t; }
  };
})();
