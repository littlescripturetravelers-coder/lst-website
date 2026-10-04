/* THE APP, AT FULL SIZE (Levi, 4 Oct 2026)

   Anything with a data-app-shot attribute (the screens in the .app-tour row,
   and the pictures inside The Lantern's perk previews) opens here: the real
   app screen, large, with its name and a few plain words, and Previous / Next
   to walk through every screen on the page.

     data-app-shot   the picture (images/app/app-*.jpg)
     data-app-title  its name
     data-app-desc   a sentence or two about it (plain text)

   The screens are pictures of the app itself, made at phone size. To swap one,
   replace the file in images/app/ and keep its name. */
(function () {
  if (window.LSTAppPeek) return;
  var box = null, list = [], at = 0, lastFocus = null;

  function build() {
    if (box) return box;
    box = document.createElement("div");
    box.className = "app-peek";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "A screen from the app");
    box.innerHTML =
      '<div class="app-peek-box">' +
        '<button type="button" class="app-peek-close" aria-label="Close">&#x2715;</button>' +
        '<div class="app-peek-phone"><img alt=""></div>' +
        '<div class="app-peek-text">' +
          '<div class="app-peek-kicker">In the app</div>' +
          '<h3 class="app-peek-title"></h3>' +
          '<p class="app-peek-desc"></p>' +
          '<div class="app-peek-nav">' +
            '<button type="button" data-step="-1">&larr; Previous</button>' +
            '<button type="button" data-step="1">Next &rarr;</button>' +
          '</div>' +
          '<div class="app-peek-count"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest(".app-peek-close")) { close(); return; }
      var s = e.target.closest("[data-step]");
      if (s) show(at + Number(s.getAttribute("data-step")));
    });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(at + 1);
      else if (e.key === "ArrowLeft") show(at - 1);
    });
    return box;
  }

  /* Every distinct screen on the page, in the order it appears. */
  function collect() {
    var seen = {}, out = [];
    document.querySelectorAll("[data-app-shot]").forEach(function (el) {
      var src = el.getAttribute("data-app-shot");
      if (!src || seen[src]) return;
      seen[src] = 1;
      out.push({ src: src, title: el.getAttribute("data-app-title") || "", desc: el.getAttribute("data-app-desc") || "" });
    });
    return out;
  }

  function show(i) {
    if (!list.length) return;
    at = (i + list.length) % list.length;
    var it = list[at];
    var img = box.querySelector(".app-peek-phone img");
    img.src = it.src;
    img.alt = it.title ? "The " + it.title.replace(/^The /, "") + " screen in the Little Scripture Travelers app" : "A screen from the Little Scripture Travelers app";
    box.querySelector(".app-peek-title").textContent = it.title;
    box.querySelector(".app-peek-desc").textContent = it.desc;
    box.querySelector(".app-peek-count").textContent = list.length > 1 ? (at + 1) + " of " + list.length : "";
    box.querySelector(".app-peek-nav").style.display = list.length > 1 ? "" : "none";
  }

  function open(src) {
    build();
    list = collect();
    var i = 0;
    for (var k = 0; k < list.length; k++) if (list[k].src === src) { i = k; break; }
    lastFocus = document.activeElement;
    show(i);
    box.classList.add("open");
    document.body.style.overflow = "hidden";
    var c = box.querySelector(".app-peek-close");
    if (c) c.focus();
  }

  function close() {
    if (!box) return;
    box.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  /* Capture phase, so the older preview viewers on these pages never see a
     click that belongs here. */
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-app-shot]") : null;
    if (!t) {
      /* the little eye beside a perk opens that perk's screen too */
      var eye = e.target && e.target.closest ? e.target.closest(".lantern-perks .perk-eye") : null;
      if (eye) t = eye.closest("li") && eye.closest("li").querySelector("[data-app-shot]");
    }
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    open(t.getAttribute("data-app-shot"));
  }, true);

  window.LSTAppPeek = { open: open, close: close };
})();
