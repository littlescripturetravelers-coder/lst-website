/* THE COLORING BOOKS on the website (Levi, 9 Oct 2026): "place on the website the PDFs of the
   coloring books but also have the functionality to digitally paint and color them like the
   app does". One copy of everything lives on the web app: the books list
   (coloring/index.js, loaded by the page), the pictures (coloring/<file>), each month's
   printable PDF (coloring/<book>.pdf) and the coloring page itself (coloring.html), which
   opens here in a frame over the page and keeps a child's coloring in the browser. */
(function () {
  var APP = "https://app.littlescripturetravelers.com/";
  var ORDER = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function theme() { var t = document.documentElement.getAttribute("data-theme"); return t === "dark" || t === "light" ? t : "navy"; }

  function draw() {
    var host = document.getElementById("cb-shelf"); if (!host) return;
    var B = window.COLORING_BOOKS || {};
    var keys = Object.keys(B).filter(function (k) { return (B[k].pages || []).length; })
      .sort(function (a, b) { return (ORDER[b] || 0) - (ORDER[a] || 0); });
    if (!keys.length) {
      host.innerHTML = '<p class="cb-note">The first coloring book is being drawn. Come back soon.</p>'; return;
    }
    host.innerHTML = keys.map(function (k) {
      var b = B[k];
      var pages = (b.pages || []).map(function (p) {
        var label = "Night " + p.night + (p.parts > 1 ? " &middot; page " + p.part + " of " + p.parts : "");
        return '<button type="button" class="cb-page" data-id="' + esc(p.id) + '" data-file="' + esc(p.file) + '" data-title="' + esc(p.title + (p.parts > 1 ? " (" + p.part + " of " + p.parts + ")" : "")) + '">' +
          '<img src="' + APP + "coloring/" + esc(p.file) + '" alt="" loading="lazy"><div class="cb-t"><span>' + label + "</span>" + esc(p.title) + "</div></button>";
      }).join("");
      return '<section class="cb-month" id="cb-' + esc(k) + '"><div class="cb-head"><div><h2>The ' + esc(b.month) + " Coloring Book</h2><p>" + esc(b.title || "") + " &middot; " + b.pages.length + " page" + (b.pages.length === 1 ? "" : "s") + ". Tap a picture to color it here.</p></div>" +
        (b.pdf ? '<a class="cb-pdf" href="' + APP + "coloring/" + esc(b.pdf) + '" download>&#128424;&#65039; Download the PDF to print</a>' : "") +
        '</div><div class="cb-grid">' + pages + "</div></section>";
    }).join("");
  }

  function open(id, file, title) {
    var box = document.getElementById("cb-color"), f = document.getElementById("cb-frame");
    document.getElementById("cb-title").textContent = title || "Coloring page";
    f.src = APP + "coloring.html?page=" + encodeURIComponent(id) + "&img=" + encodeURIComponent(APP + "coloring/" + file) +
      "&title=" + encodeURIComponent(title || "") + "&theme=" + theme() + "&top=0";
    box.classList.add("on"); document.body.style.overflow = "hidden";
  }
  function close() {
    var box = document.getElementById("cb-color"), f = document.getElementById("cb-frame");
    box.classList.remove("on"); f.src = "about:blank"; document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".cb-page");
    if (b) { open(b.getAttribute("data-id"), b.getAttribute("data-file"), b.getAttribute("data-title")); return; }
    if (e.target.closest && e.target.closest("#cb-close")) close();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  window.addEventListener("lst:coloring-books", draw);
  if (window.COLORING_BOOKS) draw();
  window.LSTColoringBooks = { draw: draw, open: open, close: close };
})();
