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
      '</div>' +
      /* The theme is a setting of the device, not of the account, so it is
         offered here whether anybody is signed in or not. */
      (window.LSTTheme
        ? '<div class="mp-card" style="margin-top:1.25rem;">' +
            row("Colour theme", themePicker()) +
          "</div>"
        : "");
  }

  function row(label, value, extra) {
    return '<div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:baseline;padding:.85rem 0;' +
      'border-bottom:1px solid var(--edge-08);">' +
      '<span style="font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;' +
      'color:var(--ink-55);min-width:9rem;">' + label + "</span>" +
      '<span style="color:var(--ink);font-size:1rem;flex:1;">' + value + "</span>" +
      (extra || "") + "</div>";
  }

  /* WHICH EDITION OF THE LANTERN THIS FAMILY GETS.

     Asked at signup, changeable here — because a family who answered in a
     hurry, or joined before there were five editions, should not be stuck with
     the wrong voice. It changes what arrives tomorrow morning, nothing else:
     not the price, not what they may read. */
  function faithPicker() {
    var list = window.LST_FAITHS || [];
    if (!list.length || !window.LSTData || !window.LSTData.faith) {
      return "The Morning Lantern, every morning.";
    }
    var mine = window.LSTData.faith.now();
    return '<select id="ac-faith" style="background:var(--fill-08);color:var(--ink);' +
      'border:1px solid var(--edge-22);border-radius:8px;padding:.45rem .6rem;' +
      "font-family:var(--font-body);font-size:.95rem;\">" +
      list.map(function (f) {
        return '<option value="' + f.id + '"' + (f.id === mine ? " selected" : "") + ">" +
          esc(f.name) + "</option>";
      }).join("") + "</select>" +
      '<span id="ac-faith-said" style="color:var(--gold-ink);font-size:.85rem;margin-left:.6rem;"></span>' +
      '<p style="color:var(--ink-55);font-size:.85rem;line-height:1.6;margin:.45rem 0 0;">' +
      "The story is the same for every family. This chooses whose Bible is quoted " +
      "and whose teachers are heard. It takes effect with tomorrow&rsquo;s Lantern.</p>";
  }

  /* The same three themes the app has. The header carries them as dots; here
     they are written out, because this is where somebody goes looking. */
  function themePicker() {
    if (!window.LSTTheme) return "Traditional.";
    return '<span data-theme-picker></span>' +
      '<p style="color:var(--ink-55);font-size:.85rem;line-height:1.6;margin:.45rem 0 0;">' +
      "Kept on this device, the same as in the app.</p>";
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
        row("Your Lantern", faithPicker()) +
        row("Colour theme", themePicker()) +
      "</div>" +

      '<div class="mp-bar" style="margin-top:1.25rem;">' +
        '<a class="mp-btn" href="journal.html" style="text-decoration:none;">&#128366; My Journal</a>' +
        '<a class="mp-btn" href="archive.html" style="text-decoration:none;">&#128218; The Lantern Archive</a>' +
        '<a class="mp-btn" href="virtue-library.html#family-stories" style="text-decoration:none;">&#128106; Family Stories</a>' +
      "</div>" +

      (open && !isAdmin
        ? '<p style="color:var(--ink-55);font-size:.92rem;line-height:1.7;margin:1.5rem 0 0;">' +
          'Need to stop? <a href="cancel.html" style="color:var(--gold-ink);">Here is exactly how to cancel</a> ' +
          '&mdash; it takes about a minute and you do it yourself.</p>'
        : "") +

      '<p style="margin:1.5rem 0 0;"><button type="button" class="mp-link" id="ac-out">Sign out</button></p>';
  }

  /* When the account service cannot be reached. Never leave the page empty:
     say what happened, offer a way to try again, and still give the theme
     picker, which needs nothing from the network. */
  function noConnectionView() {
    return '' +
      '<div class="mp-empty">' +
        '<div class="mp-empty-i">&#10022;</div>' +
        '<h3>We couldn&rsquo;t reach your account</h3>' +
        '<p>The website is fine &mdash; it just could not get through to the account service. ' +
        'That is usually a slow or patchy connection. Your journal, your family stories and your ' +
        'subscription are all safe.</p>' +
        '<button type="button" class="mp-btn mp-btn-gold" id="ac-retry">Try again</button>' +
      '</div>' +
      (window.LSTTheme
        ? '<div class="mp-card" style="margin-top:1.25rem;">' +
            row("Colour theme", themePicker()) +
          "</div>"
        : "");
  }

  function render() {
    if (!root) return;

    /* ⚠️ Check this BEFORE signedIn(). With no answer from the service,
       signedIn() is false, and showing "sign in" to somebody who is already
       signed in sends them round in circles. */
    if (!auth() || (auth().offline && auth().offline())) {
      root.innerHTML = noConnectionView();
      var again = document.getElementById("ac-retry");
      if (again) {
        again.addEventListener("click", function () {
          again.disabled = true;
          again.textContent = "Trying\u2026";
          if (auth() && auth().refresh) auth().refresh().then(render);
          else location.reload();
        });
      }
      if (window.LSTTheme && window.LSTTheme.place) window.LSTTheme.place();
      return;
    }

    if (!auth().signedIn()) {
      root.innerHTML = signedOutView();
      var si = document.getElementById("ac-signin");
      if (si) si.addEventListener("click", function () { auth().openSignIn(); });
      if (window.LSTTheme && window.LSTTheme.place) window.LSTTheme.place();
      return;
    }
    root.innerHTML = signedInView();
    if (window.LSTTheme && window.LSTTheme.place) window.LSTTheme.place();
    var out = document.getElementById("ac-out");
    if (out) out.addEventListener("click", function () { auth().signOut(); });

    var fs = document.getElementById("ac-faith");
    if (fs && window.LSTData && window.LSTData.faith) {
      /* Read what the database actually has before offering to change it, so a
         family is never shown the wrong answer as if it were theirs. */
      window.LSTData.faith.load().then(function (v) { if (fs.value !== v) fs.value = v; });
      fs.addEventListener("change", function () {
        var said = document.getElementById("ac-faith-said");
        if (said) said.textContent = "Saving\u2026";
        window.LSTData.faith.set(fs.value).then(function () {
          if (said) said.textContent = "\u2713 Saved";
        });
      });
    }
  }

  window.LSTAccount = {
    mount: function (elm) {
      root = typeof elm === "string" ? document.getElementById(elm) : elm;
      if (!root) return;

      /* ⚠️ PAINT SOMETHING NOW. Whatever happens next, and however long the
         account service takes, this page is never blank for a single second.
         An empty screen tells a parent the website is broken. */
      root.innerHTML =
        '<div class="mp-empty">' +
          '<div class="mp-empty-i">&#10022;</div>' +
          "<h3>Checking your account&hellip;</h3>" +
          "<p>One moment.</p>" +
        "</div>";

      /* No LSTAuth at all (its script failed to load) is still not a reason to
         show an empty page. Draw the "could not reach" card instead. */
      if (!auth()) { render(); return; }
      auth().ready(render);
      auth().onChange(render);
    }
  };
})();
