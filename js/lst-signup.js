/* Free-week signup: create the app login (Supabase), then go to Payhip for the card.
   The Payhip webhook links the subscription to this account by matching email. */
(function () {
  var SUPA_URL = "https://rdbvktqgrwhjucocobua.supabase.co";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkYnZrdHFncndoanVjb2NvYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNDAwMzEsImV4cCI6MjEwMTYxNjAzMX0.1PJVCfeK6dIFWeBvdsC13HPQ8173BHEok0Qq6l7mfC4";
  var PAYHIP = { monthly: "https://payhip.com/b/e7N6r", annual: "https://payhip.com/b/34fmR" };
  var sb = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(SUPA_URL, SUPA_KEY) : null;
  var plan = "monthly";
  function el(id) { return document.getElementById(id); }

  // Returns false to cancel the fallback <a href> (which points to Payhip) when the modal opens.
  window.openTrialSignup = function (p) {
    plan = p === "annual" ? "annual" : "monthly";
    var m = el("trial-modal");
    if (!m || !sb) return true; // JS/library failed -> let the link go straight to Payhip
    el("ts-plan").textContent = plan === "annual"
      ? "Yearly Lantern — $98.91/year (3 months free) · 7 days free"
      : "Monthly Lantern — $10.99/month · 7 days free";
    el("ts-err").textContent = "";
    m.style.display = "flex";
    setTimeout(function () { var n = el("ts-name"); if (n) n.focus(); }, 60);
    return false;
  };
  window.closeTrialSignup = function () { var m = el("trial-modal"); if (m) m.style.display = "none"; };

  window.submitTrialSignup = async function () {
    var name = (el("ts-name").value || "").trim();
    var email = (el("ts-email").value || "").trim();
    var pw = el("ts-pw").value || "";
    var err = el("ts-err");
    if (!name) { err.textContent = "Please enter your first name."; return; }
    if (!email || !pw) { err.textContent = "Please enter your email and a password."; return; }
    if (pw.length < 6) { err.textContent = "Password must be at least 6 characters."; return; }
    if (!sb) { window.location.href = PAYHIP[plan]; return; }
    var btn = el("ts-submit");
    err.textContent = "Creating your account…";
    if (btn) btn.disabled = true;
    try {
      var res = await sb.auth.signUp({ email: email, password: pw, options: { data: { first_name: name } } });
      if (res.error) {
        if (btn) btn.disabled = false;
        err.textContent = /already|registered|exists/i.test(res.error.message)
          ? "That email already has an account. Just sign in on the app — or use a different email."
          : res.error.message;
        return;
      }
    } catch (e) {
      if (btn) btn.disabled = false;
      err.textContent = "Something went wrong. Please try again.";
      return;
    }
    // Account created. Go to Payhip for the card — same email links the subscription to this account.
    try { localStorage.setItem("lst_signup_email", email); } catch (e) {}
    window.location.href = PAYHIP[plan] + "?email=" + encodeURIComponent(email);
  };
})();
