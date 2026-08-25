/* THE OWNER'S CONTROLS — visible to Levi, to nobody else.

   Two things he asked for, both about nights he published while testing:

     RETAG    set which virtues a night teaches, so the tags I propose when a
              book is added can be corrected later without touching code
     DELETE   remove a night entirely — a test night he cannot remove is a
              test night that ends up in front of a paying family

   THIS IS NOT WHAT MAKES IT SAFE. Postgres is. The app's own third migration
   granted admins full control of `daily_content` ("admins manage content",
   FOR ALL) and nobody else any control at all. A family who found this file
   and called these functions would get an error back, not a deleted night.
   Hiding the buttons is courtesy; the database is the lock.

   Mount a strip under any night with:
     LSTAdmin.strip(hostElement, night, onChanged)
*/
(function () {

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function auth() { return window.LSTAuth; }

  function isAdmin() {
    var a = auth();
    return !!(a && a.signedIn() && a.isAdmin && a.isAdmin());
  }

  function catalogue() {
    var L = window.LST_LIBRARY;
    return (L && L.virtues) || [];
  }

  /* One strip per night. `night` needs at least { date }; virtues and title
     make it friendlier. `onChanged` is called after a save or a delete so the
     page can redraw itself. */
  function strip(host, night, onChanged) {
    if (!host) return;
    if (!isAdmin() || !night || !night.date) { host.innerHTML = ""; return; }

    var picked = (night.virtues || []).slice();
    var open = false;
    var note = "";

    function draw() {
      var vs = catalogue();
      var chips = vs.length
        ? vs.map(function (v) {
            var on = picked.indexOf(v.id) !== -1;
            return '<button type="button" class="ad-v' + (on ? " on" : "") +
              '" data-v="' + esc(v.id) + '">' + esc(v.name || v.label || v.id) + "</button>";
          }).join("")
        : '<span class="hq-hint">The virtue list didn&rsquo;t load.</span>';

      host.innerHTML =
        '<div class="ad-strip">' +
          '<div class="ad-row">' +
            '<span class="ad-tag">Owner</span>' +
            '<span class="ad-what">' + esc(night.title || "This night") +
              " &middot; " + esc(night.date) + "</span>" +
            '<button type="button" class="ad-btn" data-act="tags">' +
              (open ? "Close tags" : "Edit the virtues") + "</button>" +
            '<button type="button" class="ad-btn ad-danger" data-act="del">Delete this night</button>' +
          "</div>" +
          (open
            ? '<div class="ad-panel">' +
                '<p class="ad-hint">These are the tags this night is found by. ' +
                  'Tap to turn one on or off, then save.</p>' +
                '<div class="ad-vs">' + chips + "</div>" +
                '<div class="hq-acts">' +
                  '<button type="button" class="hq-btn hq-btn-gold" data-act="save">Save the virtues</button>' +
                  '<span class="hq-note">' + esc(note) + "</span>" +
                "</div>" +
              "</div>"
            : (note ? '<p class="hq-note" style="margin:.6rem 0 0;">' + esc(note) + "</p>" : "")) +
        "</div>";

      host.querySelectorAll("[data-v]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = this.getAttribute("data-v");
          var at = picked.indexOf(id);
          if (at === -1) picked.push(id); else picked.splice(at, 1);
          draw();
        });
      });

      host.querySelectorAll("[data-act]").forEach(function (b) {
        b.addEventListener("click", function () {
          var act = this.getAttribute("data-act");
          if (act === "tags") { open = !open; note = ""; draw(); return; }
          if (act === "save") return save();
          if (act === "del") return remove();
        });
      });
    }

    function save() {
      note = "Saving…"; draw();
      window.LSTData.archive.setVirtues(night.date, picked).then(function (res) {
        if (res && res.error) { note = res.error.message; draw(); return; }
        night.virtues = picked.slice();
        note = "Saved.";
        draw();
        if (onChanged) onChanged("virtues");
      }).catch(function (e) {
        note = (e && e.message) || "That didn't save.";
        draw();
      });
    }

    /* Deleting a night takes the story, the book and the lullaby with it, and
       there is no undo. So it asks twice — once plainly, and once by making
       him type the date. */
    function remove() {
      var what = (night.title ? '"' + night.title + '"' : "this night") + " (" + night.date + ")";
      if (!window.confirm(
            "Delete " + what + "?\n\n" +
            "This removes the Lantern, the picture book and the lullaby for that " +
            "night, from the website AND the app. It cannot be undone.")) return;

      var typed = window.prompt(
        "To be sure: type the date of the night you are deleting.\n\n" + night.date);
      if (!typed || typed.trim() !== night.date) {
        note = "Not deleted — the date didn't match.";
        draw();
        return;
      }

      note = "Deleting…"; draw();
      window.LSTData.archive.remove(night.date).then(function (res) {
        if (res && res.error) { note = res.error.message; draw(); return; }
        host.innerHTML = '<div class="ad-strip"><p class="hq-note" style="margin:0;">' +
          "Deleted. " + esc(night.date) + " is gone.</p></div>";
        if (onChanged) onChanged("deleted");
      }).catch(function (e) {
        note = (e && e.message) || "That didn't delete.";
        draw();
      });
    }

    draw();
  }

  window.LSTAdmin = { strip: strip, isAdmin: isAdmin };
})();
