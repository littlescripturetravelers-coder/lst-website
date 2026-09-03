/* THE GATE — the 7-days-free invitation on the members' pages.

   The members' pages are open to everyone. A visitor who is not a subscriber
   can land on The Morning Lantern, the Virtue Library, the Journal, Family
   Stories or the Archive, look at the top of the page, and see for themselves
   what the night is. The moment they try to USE the page — scroll it, tap it,
   press a key — the invitation arrives: your first seven days are free.

   WHAT THIS IS NOT: it is not the paywall. The paywall is a rule inside the
   database, and it has already decided long before this file runs. Nobody
   gets the story text by closing this box, and nobody who has paid ever sees
   it. This is the invitation, not the lock.

   Arm a page with:

     LSTGate.arm({
       title: "Tonight's story is waiting",
       lines: ["Tonight's story and lullaby", "Every story we have ever sent"]
     });

   It disarms itself the instant the account turns out to be a subscriber,
   and it shows once per page per browser session — an invitation, not a
   pestering.
*/
(function () {

  var armed = false;      /* listening for the first attempt to use the page */
  var shown = false;      /* the box is on screen right now */
  var done = false;       /* already shown once on this page this session */
  var cfg = {};

  function auth() { return window.LSTAuth; }

  /* A subscriber, a trialer, or Levi. Nobody in that group ever sees this. */
  function paying() {
    var a = auth();
    if (!a || !a.signedIn()) return false;
    return !!(a.isSubscriber() || (a.isAdmin && a.isAdmin()));
  }

  var KEY = "lst:gate:" + (location.pathname || "/");
  function alreadyShownThisSession() {
    try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }
  function rememberShown() {
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------------ box */
  function build() {
    var lines = (cfg.lines || []).map(function (t) {
      return "<li>" + esc(t) + "</li>";
    }).join("");

    var veil = document.createElement("div");
    veil.className = "lg-veil";
    veil.setAttribute("role", "dialog");
    veil.setAttribute("aria-modal", "true");
    veil.setAttribute("aria-label", "Try the first seven days free");
    veil.innerHTML =
      '<div class="lg-box">' +
        '<button type="button" class="lg-x" id="lg-x" aria-label="Close">&times;</button>' +
        '<span class="lg-eyebrow">Your first 7 days are free</span>' +
        "<h2>" + (cfg.title ? esc(cfg.title) : "Keep going &mdash; the first week is free") + "</h2>" +
        "<p>" + (cfg.blurb ||
          "Little Scripture Travelers sends one short scripture story every night, " +
          "written for ages 1&ndash;5. Start tonight; you are not charged for seven days.") + "</p>" +
        (lines ? '<ul class="lg-list">' + lines + "</ul>" : "") +
        '<a class="lg-cta" href="subscribe.html#plans" id="lg-go">Start the free week</a>' +
        '<p class="lg-fine">Cancel any time in two clicks &mdash; ' +
          '<a href="cancel.html" style="color:var(--ink-62);">here is how</a>.<br>' +
          'Already a subscriber? <button type="button" id="lg-in">Sign in</button>' +
          ' &middot; <button type="button" id="lg-later">Keep looking around</button></p>' +
      "</div>";
    return veil;
  }

  function close() {
    var v = document.querySelector(".lg-veil");
    if (v) v.remove();
    document.documentElement.style.overflow = "";
    shown = false;
  }

  function show() {
    if (shown || done || paying()) return;
    shown = true; done = true; armed = false;
    rememberShown();

    var veil = build();
    document.body.appendChild(veil);
    document.documentElement.style.overflow = "hidden";

    var go = veil.querySelector("#lg-go");
    go.addEventListener("click", function (e) {
      /* Straight into the signup popup, so the email typed there is carried
         into Payhip. That link is what matches a payment to a Mailchimp
         subscriber, and it must never be bypassed. */
      if (typeof window.openTrialSignup === "function") {
        e.preventDefault();
        close();
        window.openTrialSignup("monthly");
      }
    });

    veil.querySelector("#lg-in").addEventListener("click", function () {
      close();
      if (auth()) auth().openSignIn("Sign in to pick up where you left off.");
    });

    veil.querySelector("#lg-x").addEventListener("click", close);
    veil.querySelector("#lg-later").addEventListener("click", close);
    veil.addEventListener("click", function (e) { if (e.target === veil) close(); });
    document.addEventListener("keydown", function esc2(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc2); }
    });

    setTimeout(function () { try { go.focus(); } catch (e) {} }, 40);
  }

  /* ------------------------------------------------------- what counts as
     "trying to use the page". Scrolling is the obvious one. A click or a
     keypress counts too, because on a short screen there may be nothing to
     scroll. A click on the sign-in button or on the header does NOT count —
     those are the two things a visitor must still be able to reach. */
  var EXEMPT = "#lg-go,#lg-in,.lg-veil,.site-header,#trial-modal,[data-gate-free]";

  function onAttempt(e) {
    if (!armed || paying()) return;
    if (e && e.target && e.target.closest && e.target.closest(EXEMPT)) return;
    if (e && e.type === "keydown") {
      var k = e.key;
      if (k === "Tab" || k === "Shift" || k === "Escape" || k === "Control" || k === "Alt") return;
    }
    show();
  }

  function listen(on) {
    var m = on ? "addEventListener" : "removeEventListener";
    window[m]("scroll", onAttempt, { passive: true });
    window[m]("wheel", onAttempt, { passive: true });
    window[m]("touchmove", onAttempt, { passive: true });
    document[m]("click", onAttempt, true);
    document[m]("keydown", onAttempt, true);
  }

  function arm(options) {
    cfg = options || {};
    if (done || alreadyShownThisSession()) { done = true; return; }

    function settle() {
      if (paying()) { armed = false; listen(false); return; }
      if (!armed) { armed = true; listen(true); }
    }

    if (auth()) {
      auth().ready(settle);
      auth().onChange(function () {
        if (paying()) { armed = false; listen(false); close(); }
        else settle();
      });
    } else {
      settle();
    }
  }

  window.LSTGate = { arm: arm, show: show, close: close, paying: paying };
})();
