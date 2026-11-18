/* THE APP STORE'S RATING AND REVIEWS on the home page (Levi, 18 Nov 2026: "I would like to include the
   ratings and reviews in the Apple App Store on my website").

   Reads window.LST_APP_STORE (data/app-store-reviews.js, written each day by tools/app-store-reviews.py
   from Apple's own public pages) and fills #app-store-reviews inside the Reviews section.

   The honest rules:
   - Nothing real to show (no ratings and no written reviews yet): the section stays exactly as it was,
     "Reviews coming soon".
   - The average is shown only from five ratings up, as the App Store itself does; "5.0 from 1 rating" tells
     a family nothing. Fewer than that, the written reviews are shown on their own.
   - The reviews are the latest ones as written, low stars included. Nothing is picked.
   - Every word from the file goes in as text, never as markup. */
(function () {
  "use strict";
  var d = window.LST_APP_STORE, mount = document.getElementById("app-store-reviews");
  if (!d || !mount) return;

  var FALLBACK = "https://apps.apple.com/us/app/little-scripture-travelers/id6793999173";
  var SHOW = 6;
  var count = Math.max(0, parseInt(d.count, 10) || 0);
  var rating = parseFloat(d.rating) || 0;
  function link(u) { return typeof u === "string" && /^https:\/\/apps\.apple\.com\//.test(u) ? u : null; }
  var url = link(d.url) || FALLBACK, allUrl = link(d.reviewsUrl) || url;

  var reviews = (Array.isArray(d.reviews) ? d.reviews : []).filter(function (r) {
    return r && typeof r === "object" && r.stars >= 1 && r.stars <= 5 && (r.text || r.title);
  }).slice(0, SHOW);
  var showAvg = count >= 5 && rating >= 1 && rating <= 5;
  if (!showAvg && !reviews.length) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function stars(value) {              // five stars, filled to the given value (4.4 fills four and four tenths)
    var s = el("span", "asr-stars", "★★★★★");
    s.setAttribute("aria-hidden", "true");
    s.style.setProperty("--fill", Math.max(0, Math.min(100, value / 5 * 100)) + "%");
    return s;
  }
  function when(iso) {
    var t = /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? new Date(iso + "T12:00:00Z") : null;
    return t && !isNaN(t) ? t.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) : "";
  }

  var wrap = el("div", "container asr-wrap");
  wrap.appendChild(el("div", "section-label", "✦ ON THE APP STORE ✦"));
  wrap.appendChild(el("h2", null, "What families are saying"));

  if (showAvg) {
    var sum = el("div", "asr-summary");
    sum.setAttribute("role", "img");
    sum.setAttribute("aria-label", "Rated " + rating.toFixed(1) + " out of 5 stars, from " + count + " ratings on the App Store");
    sum.appendChild(el("span", "asr-avg", rating.toFixed(1)));
    sum.appendChild(stars(rating));
    sum.appendChild(el("span", "asr-count", "from " + count.toLocaleString("en-US") + (count === 1 ? " rating" : " ratings") + " on the App Store"));
    wrap.appendChild(sum);
  }

  if (reviews.length) {
    var grid = el("div", "asr-grid");
    reviews.forEach(function (r) {
      var card = el("article", "asr-card");
      var top = el("div", "asr-top");
      top.appendChild(stars(r.stars));
      top.appendChild(el("span", "asr-sr", r.stars + " out of 5 stars"));
      card.appendChild(top);
      if (r.title) card.appendChild(el("h3", "asr-title", r.title));
      if (r.text) card.appendChild(el("p", "asr-text", r.text));
      var who = [r.author, when(r.date)].filter(Boolean).join(" · ");
      if (who) card.appendChild(el("p", "asr-who", who));
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  var more = el("p", "asr-more");
  var a = el("a", "asr-link", "Read every review on the App Store →");
  a.href = allUrl; a.target = "_blank"; a.rel = "noopener";
  more.appendChild(a);
  wrap.appendChild(more);
  if (reviews.length) wrap.appendChild(el("p", "asr-note", "Reviews are written by App Store users and shown as they wrote them. The newest are shown, whatever their stars."));

  mount.appendChild(wrap);
  mount.hidden = false;
  var old = document.querySelector("#testimonials .testimonial-inner");   // the "coming soon" placeholder
  if (old) old.hidden = true;
})();
