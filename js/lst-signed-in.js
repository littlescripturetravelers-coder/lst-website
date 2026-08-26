/* NOTHING TO SELL TO SOMEBODY WHO HAS ALREADY BOUGHT.

   A subscriber who keeps being shown "Try the First 7 Days Free" is being
   told the website has not noticed them. Worse, it invites the thought
   "hang on, am I being charged twice?" So once a paying family is signed in,
   every offer, price and free-trial button comes off the page.

   WHAT COMES OFF
     - the gold button in the header, replaced with a way into tonight's story
     - every call-to-action that opens the signup popup
     - the Subscribe menu, and the free-week line in the footer
     - anything marked data-selling="1"

   WHAT DELIBERATELY STAYS
     - How to Cancel, and Manage Subscriptions. Those are FOR subscribers, and
       hiding them is the behaviour families rightly hate.
     - Everything on cancel.html.

   THE FLASH. Auth takes a moment to resolve, so a subscriber would otherwise
   see the sell for a blink on every page. The last known answer is kept on
   the device and applied immediately, then corrected once auth is certain.
   That is a display hint only — it grants nothing, and js/lst-members-only.js
   and Postgres are what actually decide who may read what.
*/
(function () {
  var KEY = "lst:wasSubscriber";
  var SELLING = [
    ".nav-cta",
    '[onclick*="openTrialSignup"]',
    '[data-selling="1"]'
  ].join(",");

  function auth() { return window.LSTAuth; }

  function paying() {
    var a = auth();
    if (!a || !a.signedIn()) return false;
    return !!(a.isSubscriber() || (a.isAdmin && a.isAdmin()));
  }

  function remembered() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }
  function remember(on) {
    try { on ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); } catch (e) {}
  }

  /* Never hide the way out. A family must always be able to find how to
     cancel, even — especially — when everything else about selling is gone. */
  function isTheWayOut(el) {
    var href = (el.getAttribute && el.getAttribute("href")) || "";
    if (/cancel\.html/.test(href)) return true;
    if (el.closest && el.closest(".footer-col-manage")) return true;
    if (el.classList && el.classList.contains("btn-cancel-sub")) return true;
    return false;
  }

  function apply(on) {
    var root = document.documentElement;
    root.classList.toggle("lst-member", on);

    document.querySelectorAll(SELLING).forEach(function (el) {
      if (isTheWayOut(el)) return;
      el.style.display = on ? "none" : "";
    });

    /* The Subscribe menu in the header, whole. */
    document.querySelectorAll('.main-nav li, .mobile-nav > ul > li').forEach(function (li) {
      var a = li.querySelector("a");
      if (!a) return;
      var href = (a.getAttribute("href") || "").split("#")[0];
      if (href === "subscribe.html") li.style.display = on ? "none" : "";
    });

    /* Where the gold button was, put something a subscriber actually wants. */
    var slot = document.getElementById("lst-member-cta");
    if (on && !slot) {
      var cta = document.querySelector(".header-inner");
      if (cta) {
        var a = document.createElement("a");
        a.id = "lst-member-cta";
        a.className = "btn btn-gold nav-cta lst-member-cta";
        a.href = "tonight.html";
        a.textContent = "Tonight's Lantern";
        cta.appendChild(a);
      }
    } else if (!on && slot) {
      slot.remove();
    }
  }

  /* Straight away, from what this device saw last time — so a subscriber
     does not watch the sell appear and then vanish on every page. */
  function early() { apply(remembered()); }

  function settle() {
    var on = paying();
    remember(on);
    apply(on);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", early);
  } else {
    early();
  }

  function start() {
    if (!auth()) return;
    auth().ready(settle);
    auth().onChange(settle);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
