/* MEMBERS ONLY — for pages whose content is in the page itself.

   Most of what a subscription buys is guarded by Postgres: the nightly story,
   the archive, the library text. A visitor who is not a subscriber does not
   receive those, full stop, no matter what the browser does.

   ⚠️ THIS IS NOT THAT, AND IT MUST NOT BE DESCRIBED AS THAT.

   The Sacred World Timeline and the lullabies are files. Their content is
   downloaded before this code decides anything, so what this does is put a
   door in front of a room the visitor is already standing in. It turns away
   everybody who arrives normally — which is very nearly everybody — and it
   will not turn away somebody who knows to look in the page source.

   If a page ever needs to be genuinely closed rather than politely closed,
   its content has to move behind the database like the stories did. Say so
   plainly rather than letting anyone believe this is a lock.

   Use:  <script src="js/lst-members-only.js"></script>
         <script>LSTMembers.guard({ what: "The Sacred World Timeline" });</script>
*/
(function () {

  function auth() { return window.LSTAuth; }

  function paying() {
    var a = auth();
    if (!a || !a.signedIn()) return false;
    return !!(a.isSubscriber() || (a.isAdmin && a.isAdmin()));
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function screenFor(cfg) {
    var lines = (cfg.lines || []).map(function (t) {
      return "<li>" + esc(t) + "</li>";
    }).join("");

    var d = document.createElement("div");
    d.className = "mo-veil";
    d.id = "lst-members-only";
    d.innerHTML =
      '<div class="mo-box">' +
        '<span class="mo-eyebrow">' + esc(cfg.eyebrow || (window.LST_FREE_FOR_NOW ? "Free with an account" : "Comes with The Lantern")) + "</span>" +
        "<h2>" + esc(cfg.what || (window.LST_FREE_FOR_NOW ? "Create a free account to open it" : "This is for subscribing families")) + "</h2>" +
        "<p>" + esc(cfg.blurb ||
          "It comes with a subscription, along with a new scripture story every night. " +
          "Your first seven days are free.") + "</p>" +
        (lines ? '<ul class="mo-list">' + lines + "</ul>" : "") +
        '<a class="mo-cta" href="subscribe.html#plans" id="mo-go">' + (window.LST_FREE_FOR_NOW ? "Create a free account" : "Start the free week") + '</a>' +
        '<p class="mo-fine">' + (window.LST_FREE_FOR_NOW ? "Already have an account? " : "Already a subscriber? ") +
          '<button type="button" id="mo-in">Sign in</button><br>' +
          '<a href="' + esc(cfg.back || "index.html") + '">' +
          esc(cfg.backLabel || "Back to the website") + "</a></p>" +
      "</div>";
    return d;
  }

  function guard(cfg) {
    cfg = cfg || {};

    function decide() {
      var already = document.getElementById("lst-members-only");
      if (paying()) {
        if (already) already.remove();
        document.documentElement.classList.remove("mo-shut");
        return;
      }
      if (already) return;
      document.documentElement.classList.add("mo-shut");
      var screen = screenFor(cfg);
      document.body.appendChild(screen);

      var go = screen.querySelector("#mo-go");
      go.addEventListener("click", function (e) {
        /* Through the signup popup, so the email reaches Payhip. */
        if (typeof window.openTrialSignup === "function") {
          e.preventDefault();
          window.openTrialSignup();
        }
      });
      screen.querySelector("#mo-in").addEventListener("click", function () {
        if (auth()) auth().openSignIn("Sign in to open " + (cfg.what || "this") + ".");
      });
    }

    function start() {
      if (!auth()) {
        /* No sign-in module on the page at all: better to shut than to let a
           page that was meant to be members-only stand open. */
        decide();
        return;
      }
      auth().ready(decide);
      auth().onChange(decide);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  }

  window.LSTMembers = { guard: guard, paying: paying };
})();
