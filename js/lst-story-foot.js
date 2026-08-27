/* THE FOOT OF A STORY — where a night joins up with everything else.

   Levi: "link those stories to the virtues and family memories that are
   connected to them. When you click a tab for a story it should give you the
   option to look up the story and connect to them and then it should also have
   a link to the paperback book to buy it."

   So under every story there are three doors:

     the virtues it teaches   each one opens the Virtue Library on that virtue,
                              so a parent can find the other stories about it
     your family's own        the memories this family has written that carry
       memories               one of the same virtues — the whole point of
                              keeping both libraries side by side
     the book                 the paperback this story is printed in

   THE MEMORIES ARE THE FAMILY'S OWN. They come from `family_stories`, which
   row-level security ties to the signed-in account, so one family never sees
   another's. Signed out, that part is simply not drawn — there is nothing to
   ask for.

   THE BOOK BUTTON ONLY APPEARS WHERE THERE IS A REAL LINK. `books[].amazon` in
   data/virtue-library.js. A book with no link yet (September, as I write this)
   shows no button rather than a guess.

   Used by js/lst-open.js and js/lst-bedtime.js.
*/
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function lib() { return window.LST_LIBRARY || {}; }
  function virtueName(id) {
    var vs = lib().virtues || [];
    for (var i = 0; i < vs.length; i++) if (vs[i].id === id) return vs[i].name || id;
    return id;
  }
  function bookOf(n) {
    var bs = lib().books || [];
    for (var i = 0; i < bs.length; i++) if (bs[i].book === n) return bs[i];
    return null;
  }

  /* ------------------------------------------------------------ the virtues */
  function virtuesBlock(s) {
    var vs = s.virtues || [];
    if (!vs.length) return "";
    return '<section class="sf-block">' +
      '<h3 class="sf-h">What this story teaches</h3>' +
      '<p class="sf-sub">Tap one to find every other story about it.</p>' +
      '<div class="sf-chips">' + vs.map(function (v) {
        return '<a class="sf-chip" href="virtue-library.html?virtue=' + encodeURIComponent(v) + '">' +
          esc(virtueName(v)) + "</a>";
      }).join("") + "</div></section>";
  }

  /* ------------------------------------------------- the family's own memories */
  function memoryList(rows, s) {
    var want = s.virtues || [];
    var hits = rows.filter(function (r) {
      var rv = r.virtues || [];
      for (var i = 0; i < want.length; i++) if (rv.indexOf(want[i]) !== -1) return true;
      return r.storyId === s.id;
    }).slice(0, 4);

    if (!hits.length) {
      return '<section class="sf-block">' +
        '<h3 class="sf-h">Your family&rsquo;s own stories</h3>' +
        "<p class=\"sf-sub\">Nothing of yours carries " +
        (want.length ? esc(virtueName(want[0])).toLowerCase() : "these virtues") +
        " yet. When something happens in your family that this story is about, " +
        "write it down and it will sit here beside it.</p>" +
        '<a class="sf-go" href="family-stories.html">Write a family story &rarr;</a>' +
        "</section>";
    }
    return '<section class="sf-block">' +
      '<h3 class="sf-h">Your family&rsquo;s own stories</h3>' +
      '<p class="sf-sub">Your memories that carry the same virtues as this one.</p>' +
      '<ul class="sf-mem">' + hits.map(function (r) {
        var shared = (r.virtues || []).filter(function (v) { return want.indexOf(v) !== -1; })
          .map(virtueName).slice(0, 3);
        return '<li><a href="family-stories.html#' + encodeURIComponent(r.id || "") + '">' +
          "<b>" + esc(r.title || "A family story") + "</b>" +
          (r.date ? '<span class="sf-when">' + esc(r.date) + "</span>" : "") +
          (shared.length ? '<span class="sf-shared">' + esc(shared.join(" &middot; ")) + "</span>" : "") +
          "</a></li>";
      }).join("") + "</ul>" +
      '<a class="sf-go" href="family-stories.html">All your family stories &rarr;</a>' +
      "</section>";
  }

  /* ---------------------------------------------------------------- the book */
  /* Three states, and only one of them is a button.

       a real link   the paperback is out — Buy it
       "coming"      the book is written but not published yet. Say so: a parent
                     who has just loved a story and finds nothing about a book
                     concludes there isn't one, which is worse than waiting.
       nothing       we know of no book at all — draw nothing.

     A guessed Amazon URL sends a family to somebody else's book. Never. */
  function bookBlock(s) {
    var b = bookOf(s.book);
    if (!b) return "";
    var link = b.paper || b.amazon ||
               (b.paperback && b.paperback !== "coming" ? b.paperback : "");
    var soon = !link && (b.paperback === "coming");
    if (!link && !soon) return "";

    var name = esc(s.bookTitle || b.title || "the book");
    if (soon) {
      return '<section class="sf-block sf-buy sf-soon">' +
        '<h3 class="sf-h">The book of this one is coming</h3>' +
        "<p class=\"sf-sub\">This story belongs to <em>" + name + "</em>, " +
        (b.month ? esc(b.month) + "&rsquo;s book" : "the month&rsquo;s book") +
        ", which is written but not printed yet. Every night of it is already " +
        "here to read while you wait.</p>" +
        '<a class="sf-go" href="bedtime-stories.html">Read the rest of the month &rarr;</a>' +
        "</section>";
    }
    return '<section class="sf-block sf-buy">' +
      '<h3 class="sf-h">Hold it in your hands</h3>' +
      "<p class=\"sf-sub\">This story is printed in <em>" + name +
      "</em> &mdash; the whole month, illustrated, on paper.</p>" +
      '<a class="sf-paper" href="' + esc(link) + '" target="_blank" rel="noopener">' +
      "Buy the paperback on Amazon &rarr;</a></section>";
  }

  /* ------------------------------------------------------------------- mount
     Draws what it can straight away, then fills the family's memories in when
     the database answers. Nothing waits on anything else. */
  function mount(host, s) {
    if (!host || !s) return;
    host.innerHTML =
      '<div class="sf">' + virtuesBlock(s) +
        '<div id="sf-mem-slot"></div>' + bookBlock(s) +
      "</div>";

    var a = window.LSTAuth;
    if (!a || !a.signedIn() || !window.LSTData || !window.LSTData.familyStories) return;
    window.LSTData.familyStories.list().then(function (rows) {
      var slot = document.getElementById("sf-mem-slot");
      if (slot) slot.innerHTML = memoryList(rows || [], s);
    }).catch(function () { /* their memories are theirs; a failure says nothing */ });
  }

  window.LSTStoryFoot = { mount: mount, html: function (s) {
    return '<div class="sf">' + virtuesBlock(s) + bookBlock(s) + "</div>";
  } };
})();
