/* WHERE A SCRIPTURE LINK OPENS — the website's own Settings, the same as the app's.

   Levi, 26 Oct 2026: "when I click on the links of the scriptures on the website I should be able to choose whether it
   takes me to the church website to read for lds or to take me to the scriptures in little scripture travelers. That
   should be in settings or under your account like it is in the app."

   My Account, Scripture links: Gospel Library (the default) or Little Scripture Travelers. In the Latter-day Saint
   edition, with the second chosen, every link to a chapter in the Gospel Library (churchofjesuschrist.org/study/
   scriptures/...) opens on our Scriptures page (scriptures.html) at that verse, with a gold way back to the page it was
   tapped on. The Christian edition's links are left alone: they read the NIV, which is not ours to hold (as in the app).
   Kept on this device (lst:scrlinks), like the theme. */
(function () {
  "use strict";
  var KEY = "lst:scrlinks";
  function get() { try { return localStorage.getItem(KEY) === "app" ? "app" : "gl"; } catch (e) { return "gl"; } }
  function set(v) { try { localStorage.setItem(KEY, v === "app" ? "app" : "gl"); } catch (e) {} paintPickers(); }
  function lds() { return (window.LST_EDITION || document.documentElement.getAttribute("data-edition") || "lds") === "lds"; }
  /* the app's own reading of a Gospel Library chapter address (scrLinkTarget in the app's index.html) */
  function target(href) {
    var m = String(href || "").match(/^https?:\/\/(?:www\.)?churchofjesuschrist\.org\/study\/scriptures\/([a-z-]+)\/([a-z0-9-]+)\/(\d+)(?:[?#](.*))?$/i);
    if (!m) return null;
    var id = (m[4] || "").match(/(?:^|[?&#])id=p(\d+)/), hash = (m[4] || "").match(/#p(\d+)/);
    return { slug: m[1] === "dc-testament" ? "dc" : m[1] + "/" + m[2], ch: +m[3], vs: id ? +id[1] : (hash ? +hash[1] : 0) };
  }
  function route(href) {
    if (get() !== "app" || !lds()) return false;
    var t = target(href); if (!t) return false;
    /* the Lantern keeps its place for the way back */
    try { if (window.LSTTonight && window.LSTTonight.keepSpot) window.LSTTonight.keepSpot(); } catch (e) {}
    var here = location.pathname.replace(/^.*\//, "") + location.search;
    if (!/^[a-z-]+\.html/.test(here)) here = "tonight.html";
    window.top.location.href = "scriptures.html?open=" + encodeURIComponent(t.slug + "/" + t.ch).replace(/%2F/g, "/") +
      (t.vs ? "&v=" + t.vs : "") + "&from=" + encodeURIComponent(here);
    return true;
  }
  function hook(doc) {
    if (!doc || doc.__lstScrLinks) return; doc.__lstScrLinks = 1;
    doc.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || e.defaultPrevented) return;
      if (route(a.href)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
  /* My Account's row: two choices, the one in use lit */
  function pickerHtml() {
    return '<span class="only-lds"><span data-scrlinks-picker style="display:inline-flex;gap:.4rem;flex-wrap:wrap;">' +
      [["gl", "Gospel Library"], ["app", "Little Scripture Travelers"]].map(function (o) {
        return '<button type="button" class="mp-btn" data-scrlinks="' + o[0] + '" style="padding:.4rem .85rem;font-size:.9rem;">' + o[1] + "</button>";
      }).join("") + "</span>" +
      '<p style="color:var(--ink-55);font-size:.85rem;line-height:1.6;margin:.45rem 0 0;">Where a scripture link opens: the ' +
      "Church&rsquo;s Gospel Library, or our own Scriptures, at the verse, with a button back. Kept on this device, the same as in the app.</p></span>" +
      '<span class="only-christian">Scripture links open on Bible Gateway (NIV).</span>';
  }
  function paintPickers() {
    var v = get();
    document.querySelectorAll("[data-scrlinks]").forEach(function (b) {
      var on = b.getAttribute("data-scrlinks") === v;
      b.classList.toggle("mp-btn-gold", on); b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-scrlinks]") : null;
    if (!b) return; e.preventDefault(); set(b.getAttribute("data-scrlinks"));
  });
  try { new MutationObserver(function () { if (document.querySelector("[data-scrlinks]:not([aria-pressed])")) paintPickers(); })
    .observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  hook(document);
  window.LSTScrLinks = { get: get, set: set, hook: hook, route: route, target: target, pickerHtml: pickerHtml };
})();
