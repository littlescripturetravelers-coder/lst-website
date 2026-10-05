/* Free-week signup popup: pick a plan, create the app login (Supabase), then go to
   Payhip for the card. The Payhip webhook links the subscription by matching email.
   The popup builds itself, so any page just needs to load this script and call
   openTrialSignup('monthly'|'annual') from a button. */
(function () {
  var SUPA_URL = "https://rdbvktqgrwhjucocobua.supabase.co";
  /* FREE FOR NOW: see js/lst-auth.js. The same switch, so the sign-up modal
     creates a free account and never goes to checkout while it is on. */
  /* THE WEBSITE ASKS FOR THE CARD (Levi, 4 Oct 2026): "when they click free 7 days it should open
     the sign in information and show the yearly subscription amount and monthly ... they should be
     able to choose right there and they also have to still put their card in and they get the 7
     days free but once the 7 days are up they are charged." So the website's sign-up shows both
     plans and goes to Payhip for the card, now. (The app itself stays free for everyone through December
     31 - lst_settings.free_until, Levi: "I don't want people to have to put their card in the app
     though untill January 1st ... but in the website I want them to have to put their card in now".) Set true to make sign-up ask for no card again. */
  var FREE_FOR_NOW = false;
  window.LST_FREE_FOR_NOW = FREE_FOR_NOW;
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
  var IN = "width:100%;box-sizing:border-box;padding:0.75rem 0.9rem;margin-bottom:0.6rem;border-radius:10px;border:1px solid var(--edge-22);background:var(--fill-06);color:var(--ink);font-size:1rem;font-family: var(--font-body);";

  /* WHICH EDITION OF THE LANTERN THIS FAMILY GETS.

     The Lantern comes in two editions, the same two the app offers — see data/faiths.js. Asking here is
     the only chance we get, because it changes what arrives the very next
     morning.

     ⚠️ Nobody is made to answer. "Prefer not to say" is a real option and it
     is not a trick: it means the Latter-day Saint edition, the one that has
     always existed. The answer is used for one thing — which Lantern to send.
     Never for pricing, never for a mailing list, never for who may read what.
     If it is ever wanted for anything else, ask Levi first, and tell the
     family on this screen before they answer. */
  function faiths() { return window.LST_FAITHS || []; }

  function faithField() {
    var list = faiths();
    if (!list.length) return "";                 /* data/faiths.js not loaded */
    return '<label for="ts-faith" style="display:block;font-size:0.86rem;color:var(--ink-78);margin:0.35rem 0 0.3rem;">' +
      'Which tradition is your family? <span style="color:var(--ink-55);">We write the Lantern in your own voice.</span></label>' +
      '<select id="ts-faith" style="' + IN + 'appearance:auto;">' +
        list.map(function (f) {
          return '<option value="' + f.id + '">' + f.name + '</option>';
        }).join("") +
        '<option value="">Prefer not to say</option>' +
      "</select>";
  }

  function injectModal() {
    if (el("trial-modal")) return;
    var st = document.createElement("style");
    st.textContent = ".ts-plan-btn{flex:1;padding:0.6rem 0.4rem;border-radius:10px;border:1px solid var(--edge-22);background:var(--fill-06);color:var(--ink);font-family: var(--font-body);font-size:0.92rem;font-weight:700;cursor:pointer;line-height:1.25;text-align:center;}.ts-plan-btn span{display:block;font-size:0.72rem;font-weight:600;color:var(--ink-62);margin-top:2px;}.ts-plan-btn.on{border-color:var(--gold-ink);background:rgba(245,197,24,0.14);}.ts-plan-btn.on span{color:var(--gold-ink);}.ts-plan-btn{position:relative;}.ts-plan-best{flex:1.35;padding-top:1.35rem;}.ts-best-tag{position:absolute;top:-0.6rem;left:50%;transform:translateX(-50%);background:#f4c842;color:#07112e;font-family: var(--font-body);font-size:0.72rem;font-weight:900;letter-spacing:0.03em;text-transform:uppercase;padding:0.2rem 0.7rem;border-radius:999px;white-space:nowrap;}";
    document.head.appendChild(st);
    var d = document.createElement("div");
    d.id = "trial-modal";
    d.style.cssText = "display:none;position:fixed;inset:0;z-index:99999;background:rgba(var(--rgb-navy-deep), 0.88);align-items:center;justify-content:center;padding:1rem;";
    d.innerHTML =
      '<div style="background:var(--page-2);border:1px solid rgba(245,197,24,0.35);border-radius:16px;max-width:430px;width:100%;padding:1.6rem;font-family:\'Nunito\',sans-serif;color:var(--ink);box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
        '<div style="font-family:\'Fredoka\',sans-serif;font-weight:600;font-size:1.35rem;color:var(--gold-ink);">' + (FREE_FOR_NOW ? "Create your free account" : "Start your free week") + '</div>' +
        '<div style="display:inline-block;background:rgba(245,197,24,0.16);border:1px solid rgba(245,197,24,0.45);color:var(--gold-ink);font-weight:800;font-size:0.8rem;letter-spacing:0.02em;padding:0.28rem 0.75rem;border-radius:999px;margin:0.45rem 0 0.15rem;">&#10024; 7 DAYS FREE &middot; No charge today</div>' +
        '<div id="ts-plans" style="display:' + (FREE_FOR_NOW ? "none" : "flex") + ';gap:0.5rem;margin:0.7rem 0 0.9rem;">' +
          '<button type="button" data-plan="annual" onclick="setTrialPlan(\'annual\')" class="ts-plan-btn ts-plan-best">' +
            '<b class="ts-best-tag">Best value</b>Yearly<span>' + PRICE.annual + '/yr &middot; just ' +
            PRICE.perMonth + ' a month</span></button>' +
          '<button type="button" data-plan="monthly" onclick="setTrialPlan(\'monthly\')" class="ts-plan-btn">Monthly<span>' +
            PRICE.monthly + '/mo</span></button>' +
        '</div>' +
        '<input id="ts-name" placeholder="First name" autocomplete="given-name" style="' + IN + '">' +
        '<input id="ts-email" type="email" placeholder="Email" autocomplete="email" style="' + IN + '">' +
        '<input id="ts-pw" type="password" placeholder="Create a password (6+ characters)" autocomplete="new-password" style="' + IN + '">' +
        faithField() +
        /* A CODE FROM LEVI (4 Oct 2026): "if they have received a code from me they can get the
           code and get a discount or completely free according to the code I give them from
           Payhip." The code is a Payhip coupon; it goes to checkout with them (in the address,
           and shown on screen to type into Payhip's coupon box, which always works). */
        (FREE_FOR_NOW ? '' :
          '<input id="ts-code" placeholder="Coupon code (optional)" autocomplete="off" autocapitalize="characters" style="' + IN + 'text-transform:uppercase;letter-spacing:0.04em;">') +
        (FREE_FOR_NOW
          ? '<p style="font-size:0.85rem;color:var(--ink-62);line-height:1.5;margin:0.2rem 0 0.6rem;"><b style="color:var(--ink);">The Lantern is free while it is new.</b> Every story, song and study is included with your account, and no card is asked for.</p>'
          : '<p id="ts-terms" style="font-size:0.8rem;color:var(--ink-62);line-height:1.5;margin:0.2rem 0 0.6rem;"></p>') +
        '<div id="ts-err" style="color:var(--warn-ink);font-size:0.85rem;min-height:18px;margin-bottom:0.4rem;"></div>' +
        '<button id="ts-submit" onclick="submitTrialSignup()" style="width:100%;cursor:pointer;background:#f4c842;color:#07112e;border:none;font-family:\'Nunito\',sans-serif;font-weight:900;font-size:1rem;padding:0.8rem;border-radius:999px;">' + (FREE_FOR_NOW ? "Create my account &rarr;" : "Continue to secure checkout &rarr;") + '</button>' +
        '<button onclick="closeTrialSignup()" style="width:100%;background:none;border:none;color:var(--ink-55);margin-top:0.6rem;cursor:pointer;font-size:0.9rem;">Cancel</button>' +
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
    /* What happens, in plain words, for the plan that is lit */
    var t = el("ts-terms");
    if (t) {
      var price = plan === "annual" ? PRICE.annual + " a year" : PRICE.monthly + " a month";
      t.innerHTML = 'Next, add your card on our secure checkout (Payhip). <b style="color:var(--ink);">Nothing is charged today.</b> ' +
        'Your first <b style="color:var(--ink);">7 days are free</b>; after that, your plan begins at <b style="color:var(--ink);">' + price + '</b> unless you cancel before then. ' +
        'Please use this same email at checkout so your subscription connects to your account.';
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
    if (!sb) { if (FREE_FOR_NOW) { err.textContent = "Something went wrong. Please try again."; return; } window.location.href = PAYHIP[plan]; return; }
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
    /* Which Lantern this family gets. Saved after the account exists, and a
       failure here never blocks checkout — a family who paid and lost their
       answer can change it on My Account, whereas a family who could not pay
       has nothing at all. */
    var faithEl = el("ts-faith");
    var faith = faithEl ? faithEl.value : "";
    try { localStorage.setItem("lst_signup_email", email); } catch (e) {}
    try { if (faith) localStorage.setItem("lst_signup_faith", faith); } catch (e) {}
    if (faith) {
      try {
        var uid = res && res.data && res.data.user && res.data.user.id;
        if (uid) await sb.from("profiles").upsert({ id: uid, faith: faith });
      } catch (e) {}
    }
    if (FREE_FOR_NOW) {
      /* No checkout. A confirmed account goes straight in; one that must confirm
         its email is told so, and read.html signs it in when it comes back. */
      var session = res && res.data && res.data.session;
      err.style.color = "var(--gold-ink)";
      err.textContent = session ? "Your account is ready. Opening The Lantern\u2026" : "Your account is created. Check your email to confirm it, then sign in.";
      if (session) setTimeout(function () { window.location.href = "read.html"; }, 700);
      else if (btn) { btn.disabled = false; btn.textContent = "Sign in"; btn.onclick = function () { closeTrialSignup(); if (window.LSTAuth && LSTAuth.openSignIn) LSTAuth.openSignIn(); else window.location.href = "read.html"; }; }
      return;
    }
    var codeEl = el("ts-code");
    var code = codeEl ? String(codeEl.value || "").trim().replace(/\s+/g, "") : "";
    var go = withEmail(PAYHIP[plan], email) + (code ? "&coupon=" + encodeURIComponent(code) : "");
    if (code) {
      /* Payhip's checkout has its own box for a coupon. Say the code plainly, copy it, and let
         them go on when they are ready, so a code never goes missing on the way. */
      try { if (navigator.clipboard) navigator.clipboard.writeText(code); } catch (e) {}
      if (btn) btn.disabled = false;
      err.style.color = "var(--gold-ink)";
      err.innerHTML = 'Your code <b style="letter-spacing:0.05em;">' + code.replace(/[<>&"]/g, "") + '</b> is copied. ' +
        'On the next page, find the box for a <b>coupon or discount code</b>, paste or type your code in, and apply it. Your discount shows before you pay anything.';
      if (btn) { btn.innerHTML = "Continue to secure checkout &rarr;"; btn.onclick = function () { window.location.href = go; }; }
      return;
    }
    window.location.href = go;
  };

  /* The site's own buttons: while The Lantern is free, every "Try the First 7
     Days Free" and "Start the free week" becomes "Create a free account" that
     opens the modal, "See All Plans" steps aside, and the plans on
     subscribe.html make way for a plain word. */
  function freeButtons() {
    if (!FREE_FOR_NOW) return;
    var links = document.querySelectorAll('a[href*="subscribe.html"], a[href*="payhip.com/order"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i], t = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (/^Subscribe/i.test(t) && a.classList.contains("nav-link-parent")) { a.textContent = "Join free"; a.setAttribute("href", "#join"); a.onclick = function () { return openTrialSignup(); }; continue; }
      if (/See All Plans|Choose a Plan|The Lantern$/i.test(t) && !/free/i.test(t)) { if (/See All Plans/i.test(t)) a.style.display = "none"; else { a.textContent = "Create a free account"; a.setAttribute("href", "#join"); a.onclick = function () { return openTrialSignup(); }; } continue; }
      if (/7 Days Free|free week|Start The Lantern|Start my free|Begin|Join The Lantern/i.test(t) || /payhip\.com\/order/.test(a.getAttribute("href") || "")) {
        a.textContent = "Create a free account" + (/→|&rarr;|→/.test(a.innerHTML) ? " →" : "");
        a.setAttribute("href", "#join"); a.removeAttribute("target"); a.onclick = function () { return openTrialSignup(); };
      }
    }
    if (/subscribe\.html$/i.test(location.pathname)) {
      var plans = document.getElementById("plans");
      if (plans && !document.getElementById("lst-free-note")) {
        var n = document.createElement("section");
        n.id = "lst-free-note"; n.className = "subscribe-section";
        n.innerHTML = '<div style="max-width:640px;margin:0 auto;padding:2.5rem 1rem;text-align:center;font-family:\'Nunito\',sans-serif;">'
          + '<h2 style="font-family:\'Fredoka\',sans-serif;color:var(--gold-ink);font-size:2rem;margin:0 0 .6rem;">The Lantern is free while it is new</h2>'
          + '<p style="font-size:1.1rem;line-height:1.6;margin:0 0 1.2rem;">A new scripture story every morning, the lullabies, the Virtue Library and the Sacred World Timeline: everything is included with a free account, and no card is asked for. Plans will come later; for now, come in and tell us what you think.</p>'
          + '<a href="#join" class="btn btn-gold btn-lg" onclick="return openTrialSignup()">Create a free account &rarr;</a></div>';
        plans.parentNode.insertBefore(n, plans); plans.style.display = "none";
      }
    }
  }
  if (document.readyState !== "loading") freeButtons();
  else document.addEventListener("DOMContentLoaded", freeButtons);

  if (document.readyState !== "loading") injectModal();
  else document.addEventListener("DOMContentLoaded", injectModal);
})();
