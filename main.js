// Little Scripture Travelers — Main JS

// Mobile menu
(function () {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.mobile-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    nav.setAttribute('aria-hidden', !isOpen);
  });

  // Close on nav link click — skip dropdown parent links (they handle open/close themselves)
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (link.classList.contains('nav-link-parent')) return;
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-hidden', 'true');
    });
  });
})();

// Sticky header shadow on scroll
(function () {
  const header = document.getElementById('site-header');
  if (!header) return;
  const observer = new IntersectionObserver(
    ([e]) => header.classList.toggle('scrolled', !e.isIntersecting),
    { threshold: 1, rootMargin: '-1px 0px 0px 0px' }
  );
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
  document.body.prepend(sentinel);
  observer.observe(sentinel);
})();

// Subtle scroll-in animation for cards
(function () {
  if (!('IntersectionObserver' in window)) return;
  const style = document.createElement('style');
  style.textContent = `
    .way-card, .traveler-card, .step-card, .plan-card, .book-card, .blog-card {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .way-card.visible, .traveler-card.visible, .step-card.visible,
    .plan-card.visible, .book-card.visible, .blog-card.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const cards = document.querySelectorAll(
    '.way-card, .traveler-card, .step-card, .plan-card, .book-card, .blog-card'
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 60);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  cards.forEach(card => observer.observe(card));
})();

// Smooth active nav highlight
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.style.color = link.getAttribute('href') === `#${id}`
              ? 'var(--gold-ink)'
              : 'var(--white-90)';
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(section => observer.observe(section));
})();



// Desktop dropdown — hover opens panel, click ALWAYS navigates; Escape closes
(function () {
  var hoverTimer = null;

  function setDropdownTop() {
    // Always position at 72px (nav bar height) so the panel covers the ribbon below
    document.querySelectorAll('.nav-dropdown-panel').forEach(function(panel) {
      panel.style.top = '72px';
    });
  }

  function openDropdown(li) {
    closeAll();
    setDropdownTop();
    li.classList.add('open');
  }

  function closeAll() {
    document.querySelectorAll('.main-nav li.has-dropdown.open').forEach(function(el) {
      el.classList.remove('open');
    });
  }

  document.querySelectorAll('.main-nav li.has-dropdown').forEach(function(li) {
    // Hover opens the panel
    li.addEventListener('mouseenter', function() {
      clearTimeout(hoverTimer);
      openDropdown(li);
    });

    // Small delay before closing so mouse can move to panel
    li.addEventListener('mouseleave', function() {
      hoverTimer = setTimeout(closeAll, 150);
    });

    // Panel itself — keep open while hovering over it
    var panel = li.querySelector('.nav-dropdown-panel');
    if (panel) {
      panel.addEventListener('mouseenter', function() {
        clearTimeout(hoverTimer);
      });
      panel.addEventListener('mouseleave', function() {
        hoverTimer = setTimeout(closeAll, 150);
      });
    }

    // Click on the nav item ALWAYS navigates — no preventDefault, no toggle
    // (hover already handles opening; clicking just follows the link)
  });

  // Click outside closes
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.main-nav li.has-dropdown')) {
      closeAll();
    }
  });

  // Escape key closes
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAll();
  });

  // Reposition on resize
  window.addEventListener('resize', setDropdownTop);
})();

// Mobile dropdown — tap to open, tap again to navigate
(function () {
  document.querySelectorAll('.mobile-nav li.has-dropdown > a').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var li = this.closest('li');
      var mobileNav = this.closest('.mobile-nav');
      if (!li.classList.contains('open')) {
        e.preventDefault();
        mobileNav.querySelectorAll('li.has-dropdown').forEach(function(el) {
          el.classList.remove('open');
        });
        li.classList.add('open');
      }
      // Already open — follow href naturally
    });
  });
})();

/* ------------------------------------------------------------------
   Cancel-instruction screenshot lightbox
   Clicking a step thumbnail opens the full original screenshot.
   Builds its own markup so it works on every page that loads main.js.
------------------------------------------------------------------ */
(function () {
  var box = null, imgEl = null, capEl = null, stageEl = null, lastFocus = null;
  var focusX = 0.5, focusY = 0.3;

  function build() {
    box = document.createElement("div");
    box.className = "shot-lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Full screenshot");
    box.innerHTML =
      '<span class="shot-lightbox-hint">Tap the image to zoom \u00b7 Esc to close</span>' +
      '<button type="button" class="shot-lightbox-close" aria-label="Close full screenshot">&times;</button>' +
      '<div class="shot-lightbox-stage"><img alt=""></div>' +
      '<p class="shot-lightbox-cap"></p>';
    document.body.appendChild(box);
    imgEl = box.querySelector("img");
    capEl = box.querySelector(".shot-lightbox-cap");
    stageEl = box.querySelector(".shot-lightbox-stage");

    // Tap/click the image to toggle between fit-to-screen and actual size
    imgEl.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleZoom();
    });

    // Drag to pan while zoomed
    var dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
    stageEl.addEventListener("pointerdown", function (e) {
      if (!box.classList.contains("zoomed")) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      sl = stageEl.scrollLeft; st = stageEl.scrollTop;
      stageEl.style.cursor = "grabbing";
    });
    stageEl.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      stageEl.scrollLeft = sl - (e.clientX - sx);
      stageEl.scrollTop = st - (e.clientY - sy);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
      stageEl.addEventListener(ev, function () { dragging = false; stageEl.style.cursor = ""; });
    });

    // Clicking the dark area (not the image) closes
    box.addEventListener("click", function (e) {
      if (stageEl.contains(e.target)) return;
      close();
    });
  }

  function toggleZoom() {
    var z = box.classList.toggle("zoomed");
    var hint = box.querySelector(".shot-lightbox-hint");
    if (hint) hint.textContent = z
      ? "Drag to move around \u00b7 tap the image to zoom out \u00b7 Esc to close"
      : "Tap the image to zoom \u00b7 Esc to close";
    if (z) {
      // centre the view on the circled area rather than the top-left corner
      var maxL = Math.max(0, imgEl.clientWidth - stageEl.clientWidth);
      var maxT = Math.max(0, imgEl.clientHeight - stageEl.clientHeight);
      stageEl.scrollLeft = Math.min(maxL, Math.max(0, focusX * imgEl.clientWidth - stageEl.clientWidth / 2));
      stageEl.scrollTop = Math.min(maxT, Math.max(0, focusY * imgEl.clientHeight - stageEl.clientHeight / 2));
    } else {
      stageEl.scrollLeft = 0; stageEl.scrollTop = 0;
    }
  }

  function open(src, alt, caption, fx, fy) {
    focusX = (typeof fx === "number" && !isNaN(fx)) ? fx : 0.5;
    focusY = (typeof fy === "number" && !isNaN(fy)) ? fy : 0.3;
    if (!box) build();
    lastFocus = document.activeElement;
    box.classList.remove("zoomed");
    var h0 = box.querySelector(".shot-lightbox-hint");
    if (h0) h0.textContent = "Tap the image to zoom \u00b7 Esc to close";
    stageEl.scrollLeft = 0; stageEl.scrollTop = 0;
    imgEl.src = src;
    imgEl.alt = alt || "Full screenshot";
    capEl.textContent = caption || "";
    box.classList.add("open");
    document.body.style.overflow = "hidden";
    box.querySelector(".shot-lightbox-close").focus();
  }

  function close() {
    if (!box) return;
    box.classList.remove("open");
    box.classList.remove("zoomed");
    imgEl.removeAttribute("src");
    // the cancel modal may still be open behind this, so only unlock scroll if it isn't
    var cancelModal = document.getElementById("cancelSubModal");
    if (!cancelModal || !cancelModal.classList.contains("open")) {
      document.body.style.overflow = "";
    }
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest("a.cancel-step-shot") : null;
    if (!link) return;
    e.preventDefault();
    var thumb = link.querySelector("img");
    var cap = link.parentNode ? link.parentNode.querySelector(".cancel-step-cap") : null;
    open(
      link.getAttribute("href"),
      thumb ? thumb.getAttribute("alt") : "",
      cap ? cap.textContent.replace(/\s*(Tap|Click) the picture to see the full screen\.?/i, "").trim() : "",
      parseFloat(link.getAttribute("data-focus-x")),
      parseFloat(link.getAttribute("data-focus-y"))
    );
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && box && box.classList.contains("open")) {
      e.stopPropagation();
      close();
    }
  }, true);
})();

/* ============================================================
   Manage Subscriptions — cancel-instructions modal (site-wide)
   Injected by JS so the footer "Cancel Subscription" link works
   on every page from one shared code path.
   ============================================================ */
(function () {
  var MODAL_ID = "cancelSubModal";
  var modal = null;

  var HTML = [
    '<div class="cancel-modal-box">',
      '<button class="cancel-modal-close" id="cancelModalClose" aria-label="Close">&times;</button>',
      '<div class="cancel-modal-icon">\uD83D\uDD6F\uFE0F</div>',
      '<h2 class="cancel-modal-title" id="cancelModalTitle">How to Cancel Your Lantern Subscription</h2>',
      '<p class="cancel-modal-intro">We&rsquo;re sorry to see you go. Here&rsquo;s exactly how to cancel &mdash; it only takes a minute.</p>',
      '<ol class="cancel-modal-steps">',
        '<li><strong>Open your account.</strong> Click the person icon (the little head-and-shoulders shape) in the top-right corner of our Payhip store. Or open your Payhip receipt email and click the login link inside it.',
          '<a class="cancel-step-shot is-narrow" href="images/cancel-steps/full-person-icon.jpg" data-focus-x="0.90" data-focus-y="0.14"><img src="images/cancel-steps/step-person-icon.jpg" alt="The person icon in the top-right corner of the Payhip store, circled in red" width="325" height="130" loading="lazy"></a>',
          '<span class="cancel-step-cap">Look for this in the top-right corner. Tap the picture to see the full screen.</span>',
        '</li>',
        '<li><strong>Sign in.</strong> Use the same email you signed up with. If it asks for a password, it&rsquo;s the one you made when you joined.</li>',
        '<li><strong>Click the person icon again, then click Settings.</strong> You&rsquo;ll land on a page headed &ldquo;Settings&rdquo; with a row of tabs across the top.</li>',
        '<li><strong>Click the Subscriptions tab.</strong> It&rsquo;s the second tab in that row.',
          '<a class="cancel-step-shot" href="images/cancel-steps/full-subscriptions-tab.jpg" data-focus-x="0.42" data-focus-y="0.36"><img src="images/cancel-steps/step-subscriptions-tab.jpg" alt="The Settings page tab row with the Subscriptions tab circled in red" width="710" height="160" loading="lazy"></a>',
          '<span class="cancel-step-cap">The Subscriptions tab, circled in red. Tap the picture to see the full screen.</span>',
        '</li>',
        '<li><strong>Click Cancel next to your Lantern subscription.</strong> That&rsquo;s it &mdash; future payments stop.',
          '<a class="cancel-step-shot" href="images/cancel-steps/full-cancel-here.jpg" data-focus-x="0.42" data-focus-y="0.36"><img src="images/cancel-steps/step-cancel-here.jpg" alt="The Settings page with the Subscriptions tab open and selected" width="710" height="160" loading="lazy"></a>',
          '<span class="cancel-step-cap">Once the Subscriptions tab is open, your Lantern subscription is listed here with a Cancel link beside it. Tap the picture to see the full screen.</span>',
        '</li>',
      '</ol>',
      '<div class="cancel-modal-note">',
        '<strong>What happens after:</strong> You won&rsquo;t be charged again. Canceling here only stops the payments &mdash; it doesn&rsquo;t delete your account, so the lantern stays lit if you ever want to come back.',
      '</div>',
      '<a href="https://payhip.com/LittleScriptureTravelersBedtimeStories/b-account" target="_blank" rel="noopener" class="cancel-modal-store-btn">Go to the Store &rarr;</a>',
    '</div>'
  ].join("");

  function build() {
    modal = document.getElementById(MODAL_ID);
    if (modal) return modal; // a page may still carry it inline
    modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "cancel-modal-overlay";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "cancelModalTitle");
    modal.innerHTML = HTML;
    document.body.appendChild(modal);
    modal.querySelector(".cancel-modal-close").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    return modal;
  }

  function openModal() {
    var m = build();
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var c = m.querySelector(".cancel-modal-close");
    if (c) c.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Delegated so it covers the footer link and any inline triggers,
  // including markup added to the page after load.
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest(".btn-cancel-sub") : null;
    if (!t) return;
    e.preventDefault();
    openModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    // the screenshot lightbox handles its own Esc and sits above this modal
    var lb = document.querySelector(".shot-lightbox.open");
    if (lb) return;
    if (modal && modal.classList.contains("open")) closeModal();
  });
})();

/* The member bar tells you which door you came through. Done here rather
   than by hand in 30 files, so a new page can never forget.

   The LST Library has shelves that are pages of their own — the written
   series, the archive, a single story or lullaby. None of those are in the
   bar any more, so the bar lights up the Library instead: you did come
   through that door, and a row with nothing lit reads as being lost. */
(function () {
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var SHELVES = ['bedtime-stories.html', 'archive.html', 'story.html', 'lullaby.html'];
  var mark = SHELVES.indexOf(here) !== -1 ? 'lst-library.html' : here;

  document.querySelectorAll('.member-bar a').forEach(function (a) {
    var to = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (to && to === mark) a.setAttribute('aria-current', 'page');
  });
})();
