/* THE FOUNDING FAMILY BANNER.

   Draws nothing at all unless data/founding-offer.js says the offer is live
   AND carries a real Payhip link. That is deliberate: a banner promising one
   price that leads to a checkout charging another is worse than no banner,
   and an offer left half-configured is exactly how that happens.

   Put <div id="lst-founding"></div> where it should appear.
*/
(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function draw() {
    var host = document.getElementById("lst-founding");
    if (!host) return;
    var o = window.LST_FOUNDING;

    /* Both conditions, every time. Neither one alone is enough. */
    /* Payhip writes links two ways now: the old /b/XXXXX and the newer
       /order?link=…&pricing_plan=…. Both are real; anything else is not. */
    var PAYHIP_LINK = /^https:\/\/payhip\.com\/(b\/\w+|order\?[\w=&%.-]*link=\w+)/;
    if (!o || !o.active || !PAYHIP_LINK.test(o.link || "")) {
      host.innerHTML = "";
      return;
    }

    var left = (o.seats && o.taken != null) ? Math.max(0, o.seats - o.taken) : 0;
    var count = left
      ? '<span class="ff-left">' + left + " of " + o.seats + " left</span>"
      : "";

    host.innerHTML =
      '<div class="ff-band">' +
        '<div class="ff-in">' +
          '<span class="ff-tag">&#10022; ' + esc(o.headline || "Founding Family") + "</span>" +
          '<div class="ff-words">' +
            "<strong>" + esc(o.price) + " a year</strong> for the first " + o.seats +
            " families &mdash; " + esc(o.promise || "locked for as long as you stay") +
            ', instead of ' + esc(o.normal) + ". " + count +
          "</div>" +
          '<a class="ff-go" href="' + esc(o.link) + '" rel="noopener">Become a Founding Family</a>' +
        "</div>" +
      "</div>";
  }

  if (document.readyState !== "loading") draw();
  else document.addEventListener("DOMContentLoaded", draw);

  window.LSTFounding = { draw: draw };
})();
