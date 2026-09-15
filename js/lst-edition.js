/* TWO EDITIONS OF THE WEBSITE.
   A Latter-day Saint family walks four volumes of scripture with Come, Follow
   Me; a Christian family walks the two Testaments. Every page says so in the
   visitor's own edition: anything marked .only-lds shows to one, .only-christian
   to the other. Which edition a visitor is in comes, in order, from ?edition=
   in the address, the choice they made on a page (lst:edition), the faith on
   their account (lst:faith, kept by lst-app-data.js), the page's own default
   (<html data-edition>), and failing all of those, Latter-day Saint - the
   edition the site has always been. */
(function () {
  var KEY = "lst:edition";
  var CHRISTIAN = ["christian", "nondenom", "evangelical", "baptist", "methodist", "catholic"];
  function norm(v) {
    v = String(v || "").toLowerCase().trim();
    if (v === "lds") return "lds";
    return CHRISTIAN.indexOf(v) >= 0 ? "christian" : "";
  }
  function resolve() {
    try { var q = norm(new URLSearchParams(location.search).get("edition")); if (q) { localStorage.setItem(KEY, q); return q; } } catch (e) {}
    try { var k = norm(localStorage.getItem(KEY)); if (k) return k; } catch (e) {}
    try { var f = norm(localStorage.getItem("lst:faith")); if (f) return f; } catch (e) {}
    var d = norm(document.documentElement.getAttribute("data-edition"));
    if (d) { try { localStorage.setItem(KEY, d); } catch (e) {} return d; }
    return "lds";
  }
  function apply(ed) {
    document.documentElement.setAttribute("data-edition", ed);
    window.LST_EDITION = ed;
    var links = document.querySelectorAll("[data-set-edition]");
    for (var i = 0; i < links.length; i++) links[i].classList.toggle("on", links[i].getAttribute("data-set-edition") === ed);
    try { document.dispatchEvent(new CustomEvent("lst:edition", { detail: ed })); } catch (e) {}
  }
  var css = document.createElement("style");
  css.textContent = '[data-edition="christian"] .only-lds,[data-edition="lds"] .only-christian{display:none !important}'
    + '.lst-edition-switch a{color:inherit;text-decoration:none;opacity:.7}.lst-edition-switch a.on{opacity:1;font-weight:700;text-decoration:underline}';
  document.head.appendChild(css);
  apply(resolve());
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("[data-set-edition]") : null;
    if (!a) return;
    e.preventDefault();
    var ed = norm(a.getAttribute("data-set-edition")); if (!ed) return;
    try { localStorage.setItem(KEY, ed); } catch (x) {}
    apply(ed);
  });
  document.addEventListener("DOMContentLoaded", function () { apply(resolve()); });
})();
