/* THE SAMPLE NIGHT — the page you hand to someone who isn't sure yet.

   A parent who is wary of us will not be argued round. They will read one and
   decide. So this page gives one whole night away: the pictures, the words,
   the Feeling Moment, the parent prompt. No sign-in, no email box, no card,
   nothing between them and the story.

   That is the entire point, so mind these three things:

     NO GATE. js/lst-gate.js is deliberately NOT loaded here. If somebody adds
     it "for consistency", the page stops doing its job.
     NO SIGN-IN. It does not touch the database and does not care whether
     anybody is logged in.
     IT IS MEANT TO BE SHARED. That is why it is indexable, why it loads fast
     with real image files instead of a megabyte of base64, and why there is a
     copy-the-link button.

   The story comes from data/sample-night.js and is read by the same
   js/lst-read.js everything else uses.

   Mount with: LSTSample.mount("lst-sample")
*/
(function () {
  var root = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* A scripture reference, turned into a link if js/lst-refs.js is loaded and
     left as plain escaped text if it is not. */
  function sref(s) {
    return (window.LSTRefs && s) ? window.LSTRefs.text(s) : esc(s);
  }

  /* Text size, the same setting the members' pages keep. A grandparent
     reading this on a phone should be able to make it bigger here too. */
  var SIZES = [0.92, 1, 1.12, 1.28, 1.45];
  var sizeIx = 1;
  try {
    var kept = parseInt(localStorage.getItem("lst:read:size"), 10);
    if (kept >= 0 && kept < SIZES.length) sizeIx = kept;
  } catch (e) {}
  function applySize() {
    var box = root && root.querySelector(".rd");
    if (box) box.style.setProperty("--rd-size", (1.06 * SIZES[sizeIx]).toFixed(3) + "rem");
    try { localStorage.setItem("lst:read:size", String(sizeIx)); } catch (e) {}
  }

  function view(book) {
    return '<div class="rd">' +
      '<div class="rd-tools">' +
        '<span class="rd-tool-lbl">Text size</span>' +
        '<button type="button" class="rd-tool" id="s-smaller" aria-label="Smaller text">&minus;</button>' +
        '<button type="button" class="rd-tool" id="s-bigger" aria-label="Bigger text">A+</button>' +
        '<button type="button" class="rd-tool rd-spacer" id="s-share">&#128279; Copy the link</button>' +
      "</div>" +
      '<div class="rd-body">' +
        (book.reference
          ? '<p class="mp-meta">' + sref(book.reference) +
            (book.night ? " &middot; " + esc(book.night) : "") + "</p>"
          : "") +
        book.html +
        '<div class="sm-after">' +
          "<h3>That was one night.</h3>" +
          "<p>There is one of these every evening &mdash; a story, a lullaby to sing afterwards, " +
          "and something for the grown-up to read while the day is still ahead of them. " +
          "Ten quiet minutes, and the words do the rest.</p>" +
          '<a class="mp-btn mp-btn-gold" href="subscribe.html#plans" ' +
            'style="text-decoration:none;display:inline-block;" ' +
            'onclick="return openTrialSignup()">Start the free week</a>' +
          '<p class="sm-fine">Seven days free, then $49 a year &mdash; about $4 a month. ' +
            'Cancel in two clicks, <a href="cancel.html">here is how</a>.</p>' +
          '<p class="sm-fine">Know a family this would suit? ' +
            '<button type="button" class="mp-link" id="s-share2">Send them this page</button> ' +
            '&mdash; they can read the whole thing without signing up for anything.</p>' +
        "</div>" +
      "</div></div>";
  }

  function shared(btn) {
    var url = location.href.split("#")[0];
    function done() {
      var was = btn.innerHTML;
      btn.innerHTML = "&#10003; Link copied";
      setTimeout(function () { btn.innerHTML = was; }, 2200);
    }
    /* The share sheet on a phone, the clipboard on a laptop, and if a browser
       allows neither, the address bar — which every reader already knows. */
    if (navigator.share) {
      navigator.share({ title: document.title, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () {
        window.prompt("Copy this link:", url);
      });
      return;
    }
    window.prompt("Copy this link:", url);
  }

  window.LSTSample = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root) return;

      var data = window.LST_SAMPLE_NIGHT;
      if (!data || !window.LSTRead) {
        root.innerHTML = '<p class="mp-note">The story didn&rsquo;t load. Please refresh.</p>';
        return;
      }

      /* The reader takes a page and finds the story inside it. Here the story
         is already to hand, so it is handed over in the shape a page carries. */
      var book = window.LSTRead.book("STORY = " + JSON.stringify(data));
      if (!book.ok) {
        root.innerHTML = '<p class="mp-note">The story didn&rsquo;t load. Please refresh.</p>';
        return;
      }

      root.innerHTML = view(book);
      applySize();

      var small = document.getElementById("s-smaller");
      if (small) small.addEventListener("click", function () {
        if (sizeIx > 0) { sizeIx--; applySize(); }
      });
      var big = document.getElementById("s-bigger");
      if (big) big.addEventListener("click", function () {
        if (sizeIx < SIZES.length - 1) { sizeIx++; applySize(); }
      });
      ["s-share", "s-share2"].forEach(function (id) {
        var b = document.getElementById(id);
        if (b) b.addEventListener("click", function () { shared(this); });
      });
    }
  };
})();
