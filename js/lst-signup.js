/* Free-week signup popup: pick a plan, create the app login (Supabase), then go to
   Payhip for the card. The Payhip webhook links the subscription by matching email.
   The popup builds itself, so any page just needs to load this script and call
   openTrialSignup('monthly'|'annual') from a button. */
(function () {
  var SUPA_URL = "https://rdbvktqgrwhjucocobua.supabase.co";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkYnZrdHFncndoanVjb2NvYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNDAwMzEsImV4cCI6MjEwMTYxNjAzMX0.1PJVCfeK6dIFWeBvdsC13HPQ8173BHEok0Qq6l7mfC4";
  /* ======================================================== THE PRICES
     ⚠️ CHANGING A NUMBER HERE DOES NOT CHANGE WHAT ANYONE IS CHARGED.
     Payhip charges whatever the Payhip product is set to. These are the
     words on the website; the product page is the till. Change both, or a
     family reads one price and is billed another.

     The plain-English list of every other place a price is written down is
     in HANDOFF.md §18.
     ================================================================== */
  var PRICE = {
    monthly:  "$6.99",
    annual:   "$49",
    perMonth: "$4.08",          // what $49/year works out at
    saving:   "$35"             // $83.88 a year at monthly, less $49
  };
  /* ⚠️ THE ONE THING THAT MUST NOT BREAK
     Payhip and Mailchimp are matched to a family BY EMAIL. The address typed
     into the box above is handed to checkout in the URL, and every downstream
     thing — the subscription record, the Lantern Subscribers tag, whether the
     website lets them in — hangs off the two matching. See HANDOFF.md §4.

     These are Payhip's newer plan links: one product, two pricing plans, and
     the plan chosen in the query string. That is why the email is joined with
     `withEmail` below and never with a bare "?" — a second "?" would be read
     as part of the pricing_plan value, the wrong plan would be charged, and
     the email would never arrive. */
  var PAYHIP = {
    monthly: "https://payhip.com/order?link=1MNVZ&pricing_plan=PAWg3bbPWK",
    annual:  "https://payhip.com/order?link=1MNVZ&pricing_plan=91zw8xxyBL"
  };

  function withEmail(url, email) {
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "email=" + encodeURIComponent(email);
  }
  /* Share the one client lst-auth.js sets up, so the page never runs two auth
     clients against the same stored session. Falls back to its own if this
     page doesn't load lst-auth.js. */
  var sb = window.LST_SB
    || ((window.supabase && window.supabase.createClient)
          ? (window.LST_SB = window.supabase.createClient(SUPA_URL, SUPA_KEY))
          : null);
  /* Annual unless a button explicitly asks for monthly. Most families take
     whichever plan the screen already had selected, and the yearly one is
     both better for them and far better for a daily-content subscription
     that lives or dies on people staying. */
  var plan = "annual";
  function el(id) { return document.getElementById(id); }
  var IN = "width:100%;box-sizing:border-box;padding:0.75rem 0.9rem;margin-bottom:0.6rem;border-radius:10px;border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.06);color:#fff;font-size:1rem;font-family: var(--font-body);";

  function injectModal() {
    if (el("trial-modal")) return;
    var st = document.createElement("style");
    st.textContent = ".ts-plan-btn{flex:1;padding:0.6rem 0.4rem;border-radius:10px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.05);color:#fff;font-family: var(--font-body);font-size:0.92rem;font-weight:700;cursor:pointer;line-height:1.25;text-align:center;}.ts-plan-btn span{display:block;font-size:0.72rem;font-weight:600;color:rgba(255,255,255,0.6);margin-top:2px;}.ts-plan-btn.on{border-color:#f4c842;background:rgba(245,197,24,0.14);}.ts-plan-btn.on span{color:#f4c842;}.ts-plan-btn{position:relative;}.ts-plan-best{flex:1.35;padding-top:1.35rem;}.ts-best-tag{position:absolute;top:-0.6rem;left:50%;transform:translateX(-50%);background:#f4c842;color:#07112e;font-family: var(--font-body);font-size:0.72rem;font-weight:900;letter-spacing:0.03em;text-transform:uppercase;padding:0.2rem 0.7rem;border-radius:999px;white-space:nowrap;}";
    document.head.appendChild(st);
    var d = document.createElement("div");
    d.id = "trial-modal";
    d.style.cssText = "display:none;position:fixed;inset:0;z-index:99999;background:rgba(7,17,46,0.88);align-items:center;justify-content:center;padding:1rem;";
    d.innerHTML =
      '<div style="background:#0d1b3f;border:1px solid rgba(245,197,24,0.35);border-radius:16px;max-width:430px;width:100%;padding:1.6rem;font-family:\'Nunito\',sans-serif;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
        '<div style="font-family:\'Fredoka\',sans-serif;font-weight:600;font-size:1.35rem;color:#f4c842;">Start your free week</div>' +
        '<div style="display:inline-block;background:rgba(245,197,24,0.16);border:1px solid rgba(245,197,24,0.45);color:#f4c842;font-weight:800;font-size:0.8rem;letter-spacing:0.02em;padding:0.28rem 0.75rem;border-radius:999px;margin:0.45rem 0 0.15rem;">&#10024; 7 DAYS FREE &middot; No charge today</div>' +
        '<div id="ts-plans" style="display:flex;gap:0.5rem;margin:0.7rem 0 0.9rem;">' +
          '<button type="button" data-plan="annual" onclick="setTrialPlan(\'annual\')" class="ts-plan-btn ts-plan-best">' +
            '<b class="ts-best-tag">Best value</b>Yearly<span>' + PRICE.annual + '/yr &middot; just ' +
            PRICE.perMonth + ' a month</span></button>' +
          '<button type="button" data-plan="monthly" onclick="setTrialPlan(\'monthly\')" class="ts-plan-btn">Monthly<span>' +
            PRICE.monthly + '/mo</span></button>' +
        '</div>' +
        '<input id="ts-name" placeholder="First name" autocomplete="given-name" style="' + IN + '">' +
        '<input id="ts-email" type="email" placeholder="Email" autocomplete="email" style="' + IN + '">' +
        '<input id="ts-pw" type="password" placeholder="Create a password (6+ characters)" autocomplete="new-password" style="' + IN + '">' +
        '<p style="font-size:0.8rem;color:rgba(255,255,255,0.62);line-height:1.5;margin:0.2rem 0 0.6rem;">Next, add your card on our secure checkout (Payhip). <b style="color:#fff;">You won\'t be charged for 7 days</b>, and you can cancel anytime. Please use this same email at checkout so your subscription connects to your account.</p>' +
        '<div id="ts-err" style="color:#e0607a;font-size:0.85rem;min-height:18px;margin-bottom:0.4rem;"></div>' +
        '<button id="ts-submit" onclick="submitTrialSignup()" style="width:100%;cursor:pointer;background:#f4c842;color:#07112e;border:none;font-family:\'Nunito\',sans-serif;font-weight:900;font-size:1rem;padding:0.8rem;border-radius:999px;">Continue to secure checkout &rarr;</button>' +
        '<button onclick="closeTrialSignup()" style="width:100%;background:none;border:none;color:rgba(255,255,255,0.55);margin-top:0.6rem;cursor:pointer;font-size:0.9rem;">Cancel</button>' +
      '</div>';
    d.addEventListener("click", function (e) { if (e.target === d) closeTrialSignup(); });
    document.body.appendChild(d);
  }

  window.setTrialPlan = function (p) {
    plan = p === "annual" ? "annual" : "monthly";
    var btns = document.querySelectorAll("#ts-plans .ts-plan-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("on", btns[i].getAttribute("data-plan") === plan);
    }
  };

  // Returns false to cancel the fallback <a href> (Payhip) when the popup opens.
  window.openTrialSignup = function (p) {
    if (!sb) return true; // library failed to load -> let the link go straight to Payhip
    injectModal();
    setTrialPlan(p || "annual");
    el("ts-err").textContent = "";
    el("trial-modal").style.display = "flex";
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
    try { localStorage.setItem("lst_signup_email", email); } catch (e) {}
    window.location.href = withEmail(PAYHIP[plan], email);
  };

  if (document.readyState !== "loading") injectModal();
  else document.addEventListener("DOMContentLoaded", injectModal);
})();
