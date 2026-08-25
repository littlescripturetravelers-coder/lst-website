/* WHAT THE NIGHT LEAVES BEHIND — the writing half of The Morning Lantern.

   The app's Lantern does not only give a family the night; it gives them
   somewhere to put what the night produced. Three things, and this file is
   all three on the website:

     A PARENT'S HEART   every question on the page opens into an answer box.
                        Write, tag it, say who it is about, save.
     OUR FAMILY CIRCLE  your spouse and each child, and each of them gets
                        their own box for their own words about tonight.
     THE STUDY JOURNAL  eleven kinds of keepsake — gratitude, what my child
                        said, an answered prayer — whichever one fits.

   WHERE IT GOES, and why it differs from the app. The app's Lantern page
   keeps all of this in that page's own localStorage. On the website it goes
   to the account:

     answers and family stories  ->  family_stories, as `answers: [{q,a}]`
     study journal keepsakes     ->  journal_entries

   which are the same two tables the phone reads. So an answer written here
   is in the app, and in the Family Stories library, on every device the
   family signs in on. That is what Levi asked for — "saved and uploaded to
   your family library" — and it is strictly more than the app does today.

   THE FAMILY CIRCLE is the one thing still kept on the device, because there
   is no table for it and adding one would mean another migration. It is only
   a list of names for attributing answers to; the answers themselves are all
   account-backed. The list is topped up from every name that has ever had a
   story saved, so a second device fills itself in rather than starting bare.

   Mount with: LSTKeep.enhance(rootElement, night)   — makes questions open
               LSTKeep.bottom(night)                 — the two cards below
*/
(function () {

  var night = null;
  var root = null;
  var members = [];
  var openQ = null;          /* which question panel is open */
  var saved = {};            /* question -> what is already stored */
  var noticed = "";          /* the little confirmation line */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function auth() { return window.LSTAuth; }
  function signedIn() { return !!(auth() && auth().signedIn()); }

  /* --------------------------------------------------------------- drafts
     A half-written answer must survive a stray tap. Kept per night and per
     question, on the device, and cleared the moment it is saved. */
  function draftKey(q) {
    return "lst:draft:" + (night && (night.date || night.id) || "x") + ":" + q.slice(0, 60);
  }
  function getDraft(q) {
    try { return localStorage.getItem(draftKey(q)) || ""; } catch (e) { return ""; }
  }
  function setDraft(q, v) {
    try { v ? localStorage.setItem(draftKey(q), v) : localStorage.removeItem(draftKey(q)); } catch (e) {}
  }

  /* -------------------------------------------------------- family circle */
  var FAM_KEY = "lst:family:circle";
  var ROLES = ["Child", "Spouse", "Parent", "Grandparent", "Other"];

  function loadMembers() {
    var list = [];
    try { list = JSON.parse(localStorage.getItem(FAM_KEY) || "[]") || []; } catch (e) { list = []; }
    return list.filter(function (m) { return m && m.name; });
  }
  function saveMembers(list) {
    members = list;
    try { localStorage.setItem(FAM_KEY, JSON.stringify(list)); } catch (e) {}
  }
  /* Anybody who has ever had a story saved belongs in the circle, even on a
     phone that has never seen this list before. */
  function foldInSavedPeople(rows) {
    var have = {}, changed = false;
    members.forEach(function (m) { have[m.name.toLowerCase()] = true; });
    (rows || []).forEach(function (r) {
      var n = (r.person || "").trim();
      if (!n || have[n.toLowerCase()]) return;
      have[n.toLowerCase()] = true;
      members.push({ id: "m" + Date.now().toString(36) + members.length, name: n, role: "Other" });
      changed = true;
    });
    if (changed) saveMembers(members);
  }

  /* ------------------------------------------------------------ auto tags
     What the app tags every entry with, taken from the night itself. Shown,
     never edited — they are facts about the night, not opinions about it. */
  function autoTags() {
    if (!night) return [];
    var out = [];
    if (night.title) out.push("\u{1F4D6} " + night.title);
    if (night.scripture) out.push("✦ " + night.scripture);
    if (night.traveler) out.push("★ " + night.traveler);
    (night.virtues || []).forEach(function (v) {
      out.push("◆ " + (window.LSTData ? window.LSTData.virtueName(v) : v));
    });
    return out;
  }

  /* ============================================ making a question openable */
  var tags = {};        /* question -> custom tags being added */
  var people = {};      /* question -> member names it is about */

  function panelFor(q, i) {
    var already = saved[q] || "";
    var mine = tags[q] || [];
    var who = people[q] || [];

    var chips = autoTags().map(function (t) {
      return '<span class="hq-tag hq-auto">' + esc(t) + "</span>";
    }).join("") + mine.map(function (t) {
      return '<span class="hq-tag hq-mine">' + esc(t) +
        '<button type="button" class="hq-x" data-untag="' + esc(t) + '" data-qi="' + i +
        '" aria-label="Remove tag">&times;</button></span>';
    }).join("");

    var whoChips = members.length
      ? members.map(function (m) {
          var on = who.indexOf(m.name) !== -1;
          return '<button type="button" class="hq-who' + (on ? " on" : "") +
            '" data-who="' + esc(m.name) + '" data-qi="' + i + '">' +
            esc(m.name) + "</button>";
        }).join("")
      : '<span class="hq-hint">Add your family below and you can mark whose answer this is.</span>';

    return '<div class="hq-panel" id="hq-panel-' + i + '">' +
      (already ? '<p class="hq-saved">Saved already: &ldquo;' + esc(already) + '&rdquo;</p>' : "") +
      '<textarea class="hq-text" id="hq-text-' + i + '" rows="4" ' +
        'placeholder="Write it the way you would say it out loud.">' +
        esc(getDraft(q) || already) + "</textarea>" +

      '<div class="hq-sec">Tagged with</div>' +
      '<div class="hq-tags">' + chips + "</div>" +
      '<div class="hq-tagadd">' +
        '<input class="hq-in" id="hq-tag-' + i + '" placeholder="Add your own tag" ' +
          'aria-label="Add your own tag">' +
        '<button type="button" class="hq-btn" data-addtag="' + i + '">Add</button>' +
      "</div>" +

      '<div class="hq-sec">Whose answer is this?</div>' +
      '<div class="hq-whos">' + whoChips + "</div>" +

      '<div class="hq-acts">' +
        '<button type="button" class="hq-btn hq-btn-gold" data-save="' + i + '">Save to our Family Stories</button>' +
        '<span class="hq-note" id="hq-note-' + i + '"></span>' +
      "</div>" +
    "</div>";
  }

  /* Turn every question the reader produced into something you can answer. */
  function enhance(el, n) {
    root = el; night = n || {};
    if (!root || !signedIn()) return;
    members = loadMembers();

    var qs = [].slice.call(root.querySelectorAll(".rd-q"));
    if (!qs.length) return;
    openQ = null;          /* a redraw renumbers them; start closed */

    qs.forEach(function (q, i) {
      if (q.getAttribute("data-hq") === "1") return;
      q.setAttribute("data-hq", "1");
      q.setAttribute("data-qi", String(i));
      q.classList.add("hq-q");
      q.insertAdjacentHTML("beforeend",
        '<button type="button" class="hq-plus" data-open="' + i + '" ' +
        'aria-label="Answer this">+</button>');
      q.insertAdjacentHTML("afterend", '<div class="hq-slot" id="hq-slot-' + i + '"></div>');
    });

    /* What is already written for this night, so a panel opens showing it. */
    if (window.LSTData && window.LSTData.familyStories.answersFor) {
      window.LSTData.familyStories.answersFor(night).then(function (rows) {
        foldInSavedPeople(rows);
        rows.forEach(function (r) {
          (r.answers || []).forEach(function (a) {
            if (a && a.q) saved[a.q] = a.a || "";
          });
        });
      }).catch(function () {});
    }

    /* Once only. The page redraws whenever the reading depth changes, and a
       listener added on every pass would fire a save once per redraw. */
    if (root.getAttribute("data-hq-wired") !== "1") {
      root.setAttribute("data-hq-wired", "1");
      root.addEventListener("click", onClick);
    }
  }

  function questionText(i) {
    var q = root.querySelector('.rd-q[data-qi="' + i + '"]');
    if (!q) return "";
    var clone = q.cloneNode(true);
    var btn = clone.querySelector(".hq-plus");
    if (btn) btn.remove();
    return (clone.textContent || "")
      .replace(/\s+/g, " ")
      .replace(/^\d+\.\s*/, "")      /* the number is layout, not question */
      .trim();
  }

  function drawPanel(i) {
    var slot = document.getElementById("hq-slot-" + i);
    if (!slot) return;
    var q = questionText(i);
    slot.innerHTML = (openQ === i) ? panelFor(q, i) : "";
    var qEl = root.querySelector('.rd-q[data-qi="' + i + '"]');
    if (qEl) qEl.classList.toggle("hq-open", openQ === i);
    if (openQ === i) {
      var ta = document.getElementById("hq-text-" + i);
      if (ta) {
        ta.addEventListener("input", function () { setDraft(q, this.value); });
        setTimeout(function () { try { ta.focus(); } catch (e) {} }, 40);
      }
    }
  }

  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var open = t.closest("[data-open]");
    if (open) {
      var i = parseInt(open.getAttribute("data-open"), 10);
      var was = openQ;
      if (was !== null && was !== i) { openQ = null; drawPanel(was); }
      openQ = (was === i) ? null : i;
      drawPanel(i);
      return;
    }

    var addTag = t.closest("[data-addtag]");
    if (addTag) {
      var ai = parseInt(addTag.getAttribute("data-addtag"), 10);
      var input = document.getElementById("hq-tag-" + ai);
      var val = input ? input.value.trim() : "";
      if (val) {
        var q = questionText(ai);
        tags[q] = tags[q] || [];
        if (tags[q].indexOf(val) === -1) tags[q].push(val);
        drawPanel(ai);
      }
      return;
    }

    var untag = t.closest("[data-untag]");
    if (untag) {
      var ui = parseInt(untag.getAttribute("data-qi"), 10);
      var uq = questionText(ui);
      var gone = untag.getAttribute("data-untag");
      tags[uq] = (tags[uq] || []).filter(function (x) { return x !== gone; });
      drawPanel(ui);
      return;
    }

    var who = t.closest("[data-who]");
    if (who) {
      var wi = parseInt(who.getAttribute("data-qi"), 10);
      var wq = questionText(wi);
      var name = who.getAttribute("data-who");
      people[wq] = people[wq] || [];
      var at = people[wq].indexOf(name);
      if (at === -1) people[wq].push(name); else people[wq].splice(at, 1);
      drawPanel(wi);
      return;
    }

    var save = t.closest("[data-save]");
    if (save) { doSave(parseInt(save.getAttribute("data-save"), 10)); return; }
  }

  function doSave(i) {
    var q = questionText(i);
    var ta = document.getElementById("hq-text-" + i);
    var note = document.getElementById("hq-note-" + i);
    var body = ta ? ta.value.trim() : "";
    if (!body) {
      if (note) note.textContent = "Write something first.";
      if (ta) ta.focus();
      return;
    }
    if (note) note.textContent = "Saving…";

    var who = (people[q] || []);
    /* An answer marked as somebody's own is kept as their story, under their
       name, so it comes back to them later rather than to you. */
    var targets = who.length ? who : [""];

    var work = targets.map(function (name) {
      return window.LSTData.familyStories.saveAnswer(night, q, body, {
        tags: tags[q] || [], person: name
      });
    });

    Promise.all(work).then(function (results) {
      for (var k = 0; k < results.length; k++) {
        if (results[k] && results[k].error) {
          if (note) note.textContent = results[k].error.message;
          return;
        }
      }
      saved[q] = body;
      setDraft(q, "");
      tags[q] = []; people[q] = [];
      if (note) note.textContent = "Saved to your Family Stories.";
      setTimeout(function () { openQ = null; drawPanel(i); }, 1100);
    }).catch(function () {
      if (note) note.textContent = "We couldn't save that. Please try again.";
    });
  }

  /* ================================================= the two cards below */
  var JOURNAL_KINDS = [
    { key: "gratitude",   ico: "\u{1F64C}", label: "Gratitude",
      ph: "What are you thankful for tonight? Small and ordinary counts — those are the ones you forget first." },
    { key: "childsaid",   ico: "\u{1F5E3}️", label: "My child said",
      ph: "Write it exactly the way they said it — the mispronunciations, the odd grammar, all of it. That is the part that disappears." },
    { key: "childmoment", ico: "\u{1F49B}", label: "With my child",
      ph: "A moment with your child today you want to keep. What happened, and what did it feel like?" },
    { key: "spouse",      ico: "\u{1F49E}", label: "With my spouse",
      ph: "A moment with your spouse today." },
    { key: "funny",       ico: "\u{1F602}", label: "Family funny",
      ph: "The one you will all still be telling in ten years." },
    { key: "revelation",  ico: "✨", label: "Revelation",
      ph: "Something you were shown or understood today." },
    { key: "prayer",      ico: "\u{1F64F}", label: "Answered prayer",
      ph: "What you asked for, and how the answer came." },
    { key: "question",    ico: "❓", label: "Question",
      ph: "Something you are still sitting with. Questions are worth keeping too." },
    { key: "thought",     ico: "\u{1F4AD}", label: "Thought",
      ph: "Anything worth keeping from today." },
    { key: "learned",     ico: "\u{1F4DA}", label: "Learned",
      ph: "What you learned today — from scripture, from a person, from getting it wrong." },
    { key: "goal",        ico: "\u{1F3AF}", label: "Goal",
      ph: "One thing you mean to do, written down where you will meet it again." }
  ];
  var jrKind = "gratitude";

  function bottomView() {
    if (!signedIn()) {
      return '<div class="mp-empty" style="margin-top:2.4rem;">' +
        "<h3>Keep what tonight produced</h3>" +
        "<p>Sign in and every question above opens into an answer box — saved to your Family Stories, on the website and in the app together.</p>" +
        '<button type="button" class="mp-btn mp-btn-gold" id="k-signin">Sign in</button></div>';
    }
    return '<div class="hq-bottom">' + familyCard() + journalCard() + "</div>";
  }

  function familyCard() {
    var list = members.length
      ? members.map(function (m) {
          return '<div class="fam-row"><span class="fam-dot">' +
            esc((m.name || "?").charAt(0).toUpperCase()) + "</span>" +
            '<span class="fam-meta"><span class="fam-name">' + esc(m.name) + "</span>" +
            '<span class="fam-role">' + esc(m.role || "") + "</span></span>" +
            '<button type="button" class="hq-x" data-drop="' + esc(m.name) +
            '" aria-label="Remove">&times;</button></div>';
        }).join("")
      : '<p class="hq-hint">Nobody yet. Add your spouse and each child.</p>';

    return '<section class="rd-card rd-heart">' +
      '<h3 class="rd-label">&#128106; Our Family Circle</h3>' +
      "<h4>Who is growing with tonight&rsquo;s story</h4>" +
      "<p>Add your spouse and each child. Then, when you answer a question above, you can mark whose answer it is &mdash; and it is kept as their story to hand down.</p>" +
      '<div class="fam-list">' + list + "</div>" +
      '<div class="hq-sec">Add someone to your circle</div>' +
      '<div class="fam-add">' +
        '<input class="hq-in" id="fam-name" placeholder="Name" aria-label="Name">' +
        '<select class="hq-in hq-sel" id="fam-role" aria-label="Role">' +
          ROLES.map(function (r) { return '<option value="' + r + '">' + r + "</option>"; }).join("") +
        "</select>" +
        '<button type="button" class="hq-btn hq-btn-gold" id="fam-add">Add</button>' +
      "</div>" +
      (noticed ? '<p class="hq-note">' + esc(noticed) + "</p>" : "") +
      "</section>";
  }

  function journalCard() {
    var here = JOURNAL_KINDS.filter(function (k) { return k.key === jrKind; })[0] || JOURNAL_KINDS[0];
    return '<section class="rd-card">' +
      '<h3 class="rd-label">&#9997; Tonight&rsquo;s Study Journal</h3>' +
      "<h4>Anything worth keeping from today</h4>" +
      "<p>Gratitude, what your child said, a prayer answered, a question you are still sitting with. It goes to the same journal as the app.</p>" +
      '<div class="jr-kinds">' +
        JOURNAL_KINDS.map(function (k) {
          return '<button type="button" class="jr-kind' + (k.key === jrKind ? " on" : "") +
            '" data-kind="' + k.key + '">' + k.ico + " " + esc(k.label) + "</button>";
        }).join("") +
      "</div>" +
      '<textarea class="hq-text" id="jr-body" rows="4" placeholder="' + esc(here.ph) + '"></textarea>' +
      '<div class="hq-acts">' +
        '<button type="button" class="hq-btn hq-btn-gold" id="jr-save">Save to my journal</button>' +
        '<span class="hq-note" id="jr-note"></span>' +
      "</div>" +
      "</section>";
  }

  /* Everything below the night, drawn and wired. */
  function bottom(el, n) {
    night = n || night || {};
    members = loadMembers();
    var host = typeof el === "string" ? document.getElementById(el) : el;
    if (!host) return;

    function draw() {
      host.innerHTML = bottomView();
      var si = document.getElementById("k-signin");
      if (si) si.addEventListener("click", function () {
        auth().openSignIn("Sign in to keep what tonight produced.");
      });

      var add = document.getElementById("fam-add");
      if (add) add.addEventListener("click", function () {
        var name = (document.getElementById("fam-name").value || "").trim();
        if (!name) { document.getElementById("fam-name").focus(); return; }
        var role = document.getElementById("fam-role").value;
        members.push({ id: "m" + Date.now().toString(36), name: name, role: role });
        saveMembers(members);
        noticed = name + " is in your circle.";
        draw();
        setTimeout(function () { noticed = ""; }, 4000);
      });

      host.querySelectorAll("[data-drop]").forEach(function (b) {
        b.addEventListener("click", function () {
          var name = this.getAttribute("data-drop");
          if (!window.confirm("Take " + name + " out of your Family Circle? Anything already saved under their name is kept.")) return;
          saveMembers(members.filter(function (m) { return m.name !== name; }));
          draw();
        });
      });

      host.querySelectorAll("[data-kind]").forEach(function (b) {
        b.addEventListener("click", function () {
          var keep = (document.getElementById("jr-body") || {}).value || "";
          jrKind = this.getAttribute("data-kind");
          draw();
          var ta = document.getElementById("jr-body");
          if (ta) { ta.value = keep; ta.focus(); }
        });
      });

      var js = document.getElementById("jr-save");
      if (js) js.addEventListener("click", saveJournal);
    }

    if (auth()) {
      auth().ready(draw);
      auth().onChange(draw);
    } else {
      draw();
    }
  }

  function saveJournal() {
    var ta = document.getElementById("jr-body");
    var note = document.getElementById("jr-note");
    var body = ta ? ta.value.trim() : "";
    if (!body) { if (note) note.textContent = "Write something first."; return; }
    if (note) note.textContent = "Saving…";

    window.LSTData.journal.save({
      date: (night && night.date) || window.LSTData.today(),
      body: body,
      /* The category rides in `source`, which is where the app already keeps
         where an entry came from. The Journal page reads it back as a badge. */
      source: "website:" + jrKind
    }).then(function (res) {
      if (res && res.error) { if (note) note.textContent = res.error.message; return; }
      if (ta) ta.value = "";
      if (note) note.textContent = "Saved to your journal.";
      setTimeout(function () { if (note) note.textContent = ""; }, 4000);
    }).catch(function () {
      if (note) note.textContent = "We couldn't save that. Please try again.";
    });
  }

  window.LSTKeep = { enhance: enhance, bottom: bottom, kinds: JOURNAL_KINDS };
})();
