/* THE ACCOUNT PAGE — who you are, what you have, and the way out.

   Every fact here comes from the same account the app uses. Nothing is
   decided in this file: the tier comes from js/lst-auth.js, which reads the
   subscriptions table, and cancelling is a link to cancel.html.

   Mount with: LSTAccount.mount("lst-account")
*/
(function () {
  var root = null;
  function auth() { return window.LSTAuth; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function signedOutView() {
    return '' +
      '<div class="mp-empty">' +
        '<div class="mp-empty-i">&#10022;</div>' +
        '<h3>Sign in to see your account</h3>' +
        '<p>Use the same email and password as the Little Scripture Travelers app. One account covers both &mdash; your journal, your family stories and your subscription are the same on either.</p>' +
        '<button type="button" class="mp-btn mp-btn-gold" id="ac-signin">Sign in</button>' +
      '</div>';
  }

  function row(label, value, extra) {
    return '<div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:baseline;padding:.85rem 0;' +
      'border-bottom:1px solid rgba(255,255,255,.08);">' +
      '<span style="font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;' +
      'color:rgba(255,255,255,.42);min-width:9rem;">' + label + "</span>" +
      '<span style="color:#fff;font-size:1rem;flex:1;">' + value + "</span>" +
      (extra || "") + "</div>";
  }

  function signedInView() {
    var a = auth();
    var isAdmin = a.isAdmin && a.isAdmin();
    var open = a.isSubscriber();

    var status = isAdmin
      ? '<span class="mp-badge mp-badge-w">Admin</span> Full access, no subscription needed'
      : open
        ? '<span class="mp-badge mp-badge-w">Open</span> The whole library is unlocked'
        : '<span class="mp-badge">Free</span> Sample stories only';

    return '' +
      '<div class="mp-card">' +
        row("Signed in as", esc(a.email() || "")) +
        row("Subscription", status) +
        row("Your things", "Journal, family stories and subscription are shared with the app &mdash; " +
            "sign in there with this same email and everything is already waiting.") +
      "</div>" +

      '<div class="mp-bar" style="margin-top:1.25rem;">' +
        '<a class="mp-btn" href="journal.html" style="text-decoration:none;">&#128366; My Journal</a>' +
        '<a class="mp-btn" href="archive.html" style="text-decoration:none;">&#128218; The Lantern Archive</a>' +
        '<a class="mp-btn" href="virtue-library.html#family-stories" style="text-decoration:none;">&#128106; Family Stories</a>' +
      "</div>" +

      (open && !isAdmin
        ? '<p style="color:rgba(255,255,255,.55);font-size:.92rem;line-height:1.7;margin:1.5rem 0 0;">' +
          'Need to stop? <a href="cancel.html" style="color:#F5C518;">Here is exactly how to cancel</a> ' +
          '&mdash; it takes about a minute and you do it yourself.</p>'
        : "") +

      '<p style="margin:1.5rem 0 0;"><button type="button" class="mp-link" id="ac-out">Sign out</button></p>';
  }

  function render() {
    if (!root) return;
    if (!auth() || !auth().signedIn()) {
      root.innerHTML = signedOutView();
      var si = document.getElementById("ac-signin");
      if (si) si.addEventListener("click", function () { auth().openSignIn(); });
      return;
    }
    root.innerHTML = signedInView();
    var out = document.getElementById("ac-out");
    if (out) out.addEventListener("click", function () { auth().signOut(); });
  }

  window.LSTAccount = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root || !auth()) return;
      auth().ready(render);
      auth().onChange(render);
    }
  };
})();
