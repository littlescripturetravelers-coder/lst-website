/* Website sign-in, on the SAME Supabase account the app uses.

   This is the one login for the whole site. The trial popup (lst-signup.js)
   creates the account; this signs people back into it and answers the only
   two questions the rest of the site asks:

       LSTAuth.signedIn()      is somebody logged in?
       LSTAuth.isSubscriber()  are they paid up (or still in their trial)?

   Everything that gates content — the Virtue Library stories, the family
   stories — reads those two. Because it is the same Supabase user as the
   app, a family's stories follow them between the app and the website.

   Usage:
       LSTAuth.ready(function () { ...paint the page... });
       LSTAuth.onChange(function () { ...repaint... });
       LSTAuth.openSignIn("Sign in to read the whole story.");
*/
(function () {
  var SUPA_URL = "https://rdbvktqgrwhjucocobua.supabase.co";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkYnZrdHFncndoanVjb2NvYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNDAwMzEsImV4cCI6MjEwMTYxNjAzMX0.1PJVCfeK6dIFWeBvdsC13HPQ8173BHEok0Qq6l7mfC4";

  /* Statuses that mean "let them read". Payhip's 7-day trial lands as
     `trialing`, so a family in their free week gets the full library. */
  var OPEN_STATUSES = ["trialing", "trial", "active", "past_due"];

  /* One shared client for the whole page. lst-signup.js picks this up too, so
     we never end up with two auth clients fighting over the same session. */
  var sb = null;
  if (window.LST_SB) {
    sb = window.LST_SB;
  } else if (window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
    window.LST_SB = sb;
  }

  var user = null;         // { id, email } once resolved
  var tier = null;         // "subscriber" | "free" | null when signed out
  var admin = false;       // owner/admin accounts never need a subscription
  var resolved = false;    // have we finished the first session check?
  var readyCbs = [];
  var changeCbs = [];

  function fire(list) {
    for (var i = 0; i < list.length; i++) {
      try { list[i](); } catch (e) {}
    }
  }
  function announce() { fire(changeCbs); }

  /* ---------------------------------------------------------------------
     Subscription lookup. The payhip-webhook keeps `subscriptions` in step
     with Payhip. We try user_id first and fall back to email, because rows
     written before a person had an app login are keyed by email only.
     --------------------------------------------------------------------- */
  /* Admins (Levi, and anyone else flagged in profiles.is_admin) get the whole
     library without paying. The database agrees — lst_is_subscriber() returns
     true for them too, so this is not a client-side-only unlock. */
  function lookupAdmin() {
    if (!sb || !user) { admin = false; return Promise.resolve(false); }
    return sb.from("profiles").select("is_admin").eq("id", user.id).limit(1)
      .then(function (res) {
        admin = !!(!res.error && res.data && res.data[0] && res.data[0].is_admin);
        return admin;
      })
      .catch(function () { admin = false; return false; });
  }

  function lookupTier() {
    if (!sb || !user) { tier = null; admin = false; return Promise.resolve(null); }

    function readRows(res) {
      if (res.error || !res.data || !res.data.length) return null;
      for (var i = 0; i < res.data.length; i++) {
        var st = String(res.data[i].status || "").toLowerCase();
        if (OPEN_STATUSES.indexOf(st) !== -1) return "subscriber";
      }
      return "free";
    }

    return sb.from("subscriptions").select("status").eq("user_id", user.id)
      .then(function (res) {
        var t = readRows(res);
        if (t) return t;
        if (!user.email) return "free";
        return sb.from("subscriptions").select("status").eq("email", user.email)
          .then(function (r2) { return readRows(r2) || "free"; });
      })
      .then(function (t) {
        return lookupAdmin().then(function (isAdmin) {
          tier = isAdmin ? "subscriber" : t;
          return tier;
        });
      })
      .catch(function () { tier = "free"; return tier; });
  }

  function setUser(session) {
    user = (session && session.user)
      ? { id: session.user.id, email: session.user.email }
      : null;
  }

  function refresh() {
    if (!sb) { resolved = true; return Promise.resolve(); }
    return sb.auth.getSession().then(function (res) {
      setUser(res && res.data ? res.data.session : null);
      return lookupTier();
    }).then(function () {
      resolved = true;
    }).catch(function () { resolved = true; });
  }

  /* ===================================================================
     SIGN-IN MODAL — builds itself, so a page only needs this script.
     =================================================================== */
  var IN = "width:100%;box-sizing:border-box;padding:0.75rem 0.9rem;margin-bottom:0.6rem;border-radius:10px;border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.06);color:#fff;font-size:1rem;font-family:'Nunito',sans-serif;";

  function el(id) { return document.getElementById(id); }

  function injectModal() {
    if (el("lst-auth-modal")) return;
    var d = document.createElement("div");
    d.id = "lst-auth-modal";
    d.style.cssText = "display:none;position:fixed;inset:0;z-index:99999;background:rgba(7,17,46,0.88);align-items:center;justify-content:center;padding:1rem;";
    d.innerHTML =
      '<div style="background:#0d1b3f;border:1px solid rgba(245,197,24,0.35);border-radius:16px;max-width:410px;width:100%;padding:1.6rem;font-family:\'Nunito\',sans-serif;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
        '<div style="font-family:\'Fredoka\',sans-serif;font-weight:600;font-size:1.35rem;color:#f4c842;">Sign in</div>' +
        '<p id="lst-auth-why" style="font-size:0.9rem;color:rgba(255,255,255,0.72);line-height:1.55;margin:0.45rem 0 0.9rem;">Use the same email and password as the Little Scripture Travelers app.</p>' +
        '<input id="lst-auth-email" type="email" placeholder="Email" autocomplete="email" style="' + IN + '">' +
        '<input id="lst-auth-pw" type="password" placeholder="Password" autocomplete="current-password" style="' + IN + '">' +
        '<div id="lst-auth-err" style="color:#e0607a;font-size:0.85rem;min-height:18px;margin-bottom:0.4rem;"></div>' +
        '<button id="lst-auth-go" style="width:100%;cursor:pointer;background:#f4c842;color:#07112e;border:none;font-family:\'Nunito\',sans-serif;font-weight:900;font-size:1rem;padding:0.8rem;border-radius:999px;">Sign in</button>' +
        '<p style="font-size:0.82rem;color:rgba(255,255,255,0.6);line-height:1.55;margin:0.75rem 0 0;text-align:center;">' +
          '<button type="button" id="lst-auth-forgot" style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:0.82rem;text-decoration:underline;padding:0;">Forgot your password?</button>' +
        '</p>' +
        '<p style="font-size:0.82rem;color:rgba(255,255,255,0.6);line-height:1.55;margin:0.45rem 0 0;text-align:center;">' +
          'No account yet? <button type="button" id="lst-auth-join" style="background:none;border:none;color:#f4c842;font-weight:800;cursor:pointer;font-size:0.82rem;text-decoration:underline;padding:0;">Start your free week</button>' +
        '</p>' +
        '<button id="lst-auth-cancel" style="width:100%;background:none;border:none;color:rgba(255,255,255,0.55);margin-top:0.5rem;cursor:pointer;font-size:0.9rem;">Cancel</button>' +
      '</div>';
    d.addEventListener("click", function (e) { if (e.target === d) API.closeSignIn(); });
    document.body.appendChild(d);

    el("lst-auth-go").addEventListener("click", submit);
    el("lst-auth-cancel").addEventListener("click", function () { API.closeSignIn(); });
    el("lst-auth-join").addEventListener("click", function () {
      API.closeSignIn();
      if (typeof window.openTrialSignup === "function") window.openTrialSignup("monthly");
      else window.location.href = "subscribe.html#plans";
    });
    el("lst-auth-pw").addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });
    el("lst-auth-forgot").addEventListener("click", function () {
      var email = (el("lst-auth-email").value || "").trim();
      var err = el("lst-auth-err");
      if (!email) { err.textContent = "Type your email above first, then tap this."; return; }
      err.textContent = "Sending a reset link\u2026";
      API.resetPassword(email).then(function (res) {
        err.style.color = (res && res.error) ? "#e0607a" : "#9ae6b4";
        err.textContent = (res && res.error)
          ? res.error.message
          : "Check your email for a link to set a new password.";
      }).catch(function () {
        err.textContent = "We couldn't send that just now. Please try again.";
      });
    });
  }

  function submit() {
    var email = (el("lst-auth-email").value || "").trim();
    var pw = el("lst-auth-pw").value || "";
    var err = el("lst-auth-err");
    var btn = el("lst-auth-go");
    if (!email || !pw) { err.textContent = "Please enter your email and password."; return; }
    if (!sb) { err.textContent = "We couldn't reach the server. Please refresh and try again."; return; }
    err.textContent = "Signing you in…";
    btn.disabled = true;

    sb.auth.signInWithPassword({ email: email, password: pw }).then(function (res) {
      if (res.error) {
        btn.disabled = false;
        err.textContent = /invalid|credentials/i.test(res.error.message)
          ? "That email and password didn't match. Check them and try again."
          : res.error.message;
        return;
      }
      setUser(res.data ? res.data.session : null);
      return lookupTier().then(function () {
        btn.disabled = false;
        err.textContent = "";
        API.closeSignIn();
        announce();
      });
    }).catch(function () {
      btn.disabled = false;
      err.textContent = "Something went wrong. Please try again.";
    });
  }

  /* =================================================================== */
  var API = {
    client: function () { return sb; },
    user: function () { return user; },
    email: function () { return user ? user.email : null; },
    signedIn: function () { return !!user; },
    isSubscriber: function () { return tier === "subscriber"; },
    isAdmin: function () { return admin; },
    tier: function () { return tier; },
    resolved: function () { return resolved; },

    /* Runs cb once the first session check is done (immediately if already). */
    ready: function (cb) {
      if (resolved) { try { cb(); } catch (e) {} return; }
      readyCbs.push(cb);
    },
    onChange: function (cb) { changeCbs.push(cb); },

    refresh: function () { return refresh().then(announce); },

    openSignIn: function (why) {
      injectModal();
      var w = el("lst-auth-why");
      if (w && why) w.textContent = why;
      el("lst-auth-err").textContent = "";
      el("lst-auth-modal").style.display = "flex";
      setTimeout(function () {
        var f = el("lst-auth-email");
        if (f) f.focus();
      }, 60);
    },
    closeSignIn: function () {
      var m = el("lst-auth-modal");
      if (m) m.style.display = "none";
    },

    /* Emails a reset link back to the page they were on. */
    resetPassword: function (email) {
      if (!sb) return Promise.reject(new Error("no client"));
      return sb.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + "/reset-password.html"
      });
    },

    signOut: function () {
      if (!sb) return Promise.resolve();
      return sb.auth.signOut().then(function () {
        user = null; tier = null; admin = false;
        announce();
      });
    }
  };

  window.LSTAuth = API;

  /* Keep every tab in step — signing out in one updates the others. */
  if (sb && sb.auth && sb.auth.onAuthStateChange) {
    sb.auth.onAuthStateChange(function (_evt, session) {
      if (!resolved) return; // the initial refresh() below handles first load
      setUser(session);
      lookupTier().then(announce);
    });
  }

  refresh().then(function () {
    fire(readyCbs);
    readyCbs = [];
    announce();
  });

  if (document.readyState !== "loading") injectModal();
  else document.addEventListener("DOMContentLoaded", injectModal);
})();
