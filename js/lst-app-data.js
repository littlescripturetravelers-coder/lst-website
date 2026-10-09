/* THE SHARED RECORD — one place where the website speaks the app's language.

   The website and the app sign into the same Supabase account and read the
   same tables. This file is the only place on the website that knows the
   SHAPE of those tables, so when the app changes a column there is exactly
   one file here to change — not a dozen pages.

   THE RULE: the app is the authority on shape. It ships to phones and sits
   behind App Store review; the website redeploys in seconds. So when the two
   disagree, the website conforms. Never "fix" a mismatch by changing what
   the app writes.

   Shapes, taken from the app's own migrations (lst-app/supabase/migrations):

     family_stories   user_id, entry_date (date), story_title, scripture,
                      answers  jsonb  [{q,a}]   <- Parent's Heart answers
                      virtues  jsonb  [{id,name}]     <- objects, NOT strings
                      traveler, travelers, situations, custom
                      upserted by the app on (user_id, entry_date)

     journal_entries  id TEXT (made by the client so it works offline),
                      user_id, entry_date (date), body, source,
                      place, lat, lon, photos jsonb

   Photos are not a website feature. The column is still read and written
   verbatim because app versions already on phones write it on every save —
   dropping it, or blanking it from here, would break or erase their entries.

     daily_content    publish_date (date, unique), title, scripture, traveler,
                      virtues jsonb, story_text, story_html, narration_url,
                      published_at, book, week, night,
                      book_html    the page-turning story book, kept apart
                                   from story_html, which is the devotional
                      song_html, song_audio_url, song_url, lyrics_url,
                                   lantern_url, story_link

   Reading is forgiving on purpose: earlier website builds wrote virtues as
   plain strings and the title into `title` instead of `story_title`, so both
   are still understood. Writing is strict — always the app's shape.
*/
(function () {

  function sb() { return window.LSTAuth ? window.LSTAuth.client() : null; }
  function uid() {
    var u = window.LSTAuth && window.LSTAuth.user();
    return u ? u.id : null;
  }
  function ready() { return !!(sb() && uid()); }

  /* An id the app would accept: text, made here, unique enough offline. */
  function newId(prefix) {
    return (prefix || "w") + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  /* ------------------------------------------------------------- virtues
     The app stores [{id,name}]. The website's pickers work in ids. These
     translate, and tolerate the plain-string rows older website builds left
     behind. Names come from the Virtue Library catalog when it is loaded. */
  function virtueName(id) {
    var lib = window.LST_LIBRARY;
    if (lib && lib.virtues) {
      for (var i = 0; i < lib.virtues.length; i++) {
        if (lib.virtues[i].id === id) return lib.virtues[i].name || lib.virtues[i].label || id;
      }
    }
    return id;
  }
  function virtuesToApp(ids) {
    return (ids || []).map(function (v) {
      if (v && typeof v === "object") return { id: v.id, name: v.name || virtueName(v.id) };
      return { id: v, name: virtueName(v) };
    });
  }
  function virtuesToIds(v) {
    return (v || []).map(function (x) {
      return (x && typeof x === "object") ? x.id : x;
    }).filter(Boolean);
  }

  /* ======================================================== FAMILY STORIES */
  var family = {
    /* Everything this account has, newest first. */
    list: function () {
      if (!ready()) return Promise.resolve([]);
      return sb().from("family_stories").select("*")
        .order("entry_date", { ascending: false })
        .then(function (res) {
          if (res.error) throw new Error(res.error.message);
          return (res.data || []).map(family.fromRow).sort(function (a, b) {
            return String(b.sortKey).localeCompare(String(a.sortKey));
          });
        });
    },

    /* One row as the website likes to think about it. Understands both the
       app's shape and what earlier website builds wrote. */
    fromRow: function (r) {
      var me = uid();
      return {
        id: r.id,
        /* A family (app migration 0034, 9 Oct 2026) reads each other's stories; a story someone
           else wrote shows their name and only they change it. */
        authorId: r.user_id || null,
        authorName: r.author_name || "",
        other: !!(me && r.user_id && r.user_id !== me),
        date: r.entry_date || null,
        title: r.story_title || r.title || "",     // `title` = older website rows
        scripture: r.scripture || "",
        answers: Array.isArray(r.answers) ? r.answers : [],
        body: r.body || "",                        // website free-written text
        virtues: virtuesToIds(r.virtues),
        traveler: r.traveler || "",
        travelers: r.travelers || [],
        situations: r.situations || [],
        feelings: r.feelings || [],
        custom: r.custom || [],
        person: r.person || "",
        year: r.year == null ? null : r.year,
        storyId: r.story_id || "",
        kind: r.kind || (r.entry_date ? "journal" : "history"),
        sortKey: r.entry_date || (r.year != null ? String(r.year) + "-99-99" : "0000-00-00")
      };
    },

    /* Writes the app's shape. A story written here is `history`: it leaves
       entry_date NULL so it can never collide with the app's one-per-day
       upsert on (user_id, entry_date). */
    save: function (rec) {
      if (!ready()) return Promise.reject(new Error("not signed in"));
      var row = {
        user_id: uid(),
        kind: rec.kind || "history",
        story_title: rec.title || null,
        scripture: rec.scripture || null,
        virtues: virtuesToApp(rec.virtues),
        traveler: rec.traveler || null,
        situations: rec.situations && rec.situations.length ? rec.situations : null,
        feelings: rec.feelings && rec.feelings.length ? rec.feelings : null,
        body: rec.body || null,
        person: rec.person || null,
        year: (rec.year === "" || rec.year == null) ? null : parseInt(rec.year, 10),
        story_id: rec.storyId || null,
        updated_at: new Date().toISOString()
      };
      if (rec.id) return sb().from("family_stories").update(row).eq("id", rec.id);
      return sb().from("family_stories").insert(row);
    },

    remove: function (id) {
      if (!ready()) return Promise.reject(new Error("not signed in"));
      return sb().from("family_stories").delete().eq("id", id);
    },

    /* ------------------------------------------- a Parent's Heart answer
       The app keeps a night's answers in ONE row, as `answers: [{q,a}]`.
       This does the same, so an answer written on the website reads in the
       app exactly like one written on the phone.

       It deliberately does NOT set entry_date. The app upserts its own
       journal rows on (user_id, entry_date); a website row carrying tonight's
       date would be silently overwritten the next time a parent answered on
       their phone. The night is recorded in story_id instead, which is what
       ties the answers together and what a second answer looks itself up by.

       Pass `person` to attribute the answer to somebody in particular — that
       is how a child's own words are kept as their story rather than yours. */
    saveAnswer: function (night, question, answer, extra) {
      if (!ready()) return Promise.reject(new Error("not signed in"));
      extra = extra || {};
      var key = "night:" + (night.date || night.id || "");
      var who = extra.person || "";

      var find = sb().from("family_stories").select("*")
        .eq("story_id", key).eq("kind", "journal");

      return find.then(function (res) {
        var rows = (res && res.data) || [];
        var mine = null;
        var me = uid();
        for (var i = 0; i < rows.length; i++) {
          /* One row per person per night: yours, and one for each child. Never one written by
             someone else in the family - the family reads those, but only their author edits. */
          if (rows[i].user_id && rows[i].user_id !== me) continue;
          if ((rows[i].person || "") === who) { mine = rows[i]; break; }
        }

        var answers = (mine && Array.isArray(mine.answers)) ? mine.answers.slice() : [];
        var replaced = false;
        for (var j = 0; j < answers.length; j++) {
          if (answers[j] && answers[j].q === question) {
            answers[j] = { q: question, a: answer };
            replaced = true;
            break;
          }
        }
        if (!replaced) answers.push({ q: question, a: answer });

        var custom = (mine && Array.isArray(mine.custom)) ? mine.custom.slice() : [];
        (extra.tags || []).forEach(function (t) {
          if (t && custom.indexOf(t) === -1) custom.push(t);
        });

        var row = {
          user_id: uid(),
          kind: "journal",
          story_title: night.title || null,
          scripture: night.scripture || null,
          traveler: night.traveler || null,
          virtues: virtuesToApp(night.virtues || []),
          answers: answers,
          custom: custom.length ? custom : null,
          person: who || null,
          story_id: key,
          updated_at: new Date().toISOString()
        };

        if (mine) return sb().from("family_stories").update(row).eq("id", mine.id);
        return sb().from("family_stories").insert(row);
      });
    },

    /* Everything already written for one night, so a panel can open showing
       what was said last time rather than an empty box. */
    answersFor: function (night) {
      if (!ready()) return Promise.resolve([]);
      var key = "night:" + (night.date || night.id || "");
      return sb().from("family_stories").select("*")
        .eq("story_id", key).eq("kind", "journal")
        .then(function (res) {
          if (res.error) return [];
          /* only this person's own answers fill their boxes - never someone else's in the family */
          return (res.data || []).map(family.fromRow).filter(function (r) { return !r.other; });
        });
    }
  };

  /* ================================================================ JOURNAL
     The app's personal journal. Same table, same shape, both directions. */
  var journal = {
    list: function () {
      if (!ready()) return Promise.resolve([]);
      return sb().from("journal_entries").select("*")
        .order("entry_date", { ascending: false }).limit(2000)
        .then(function (res) {
          if (res.error) throw new Error(res.error.message);
          return (res.data || []).map(journal.fromRow);
        });
    },

    fromRow: function (r) {
      return {
        id: r.id,
        date: r.entry_date,
        body: r.body || "",
        source: r.source || "",
        place: r.place || "",
        lat: (r.lat === null || r.lat === undefined) ? null : Number(r.lat),
        lon: (r.lon === null || r.lon === undefined) ? null : Number(r.lon),
        photos: Array.isArray(r.photos) ? r.photos : [],
        /* a voice memo shared in on the phone, kept in the private bucket */
        audio: (r.audio && r.audio.path) ? r.audio : null,
        created: r.created_at,
        updated: r.updated_at
      };
    },

    /* Upserts on the id, exactly as the app does, so saving the same entry
       twice edits it rather than duplicating it. New entries written here get
       a "w" id so it is obvious later which side wrote them. */
    save: function (e) {
      if (!ready()) return Promise.reject(new Error("not signed in"));
      var row = {
        id: e.id || newId("w"),
        user_id: uid(),
        entry_date: e.date || today(),
        body: e.body || "",
        body_html: null,                       /* written plain here; the app's formatting is let go */
        source: e.source || "website",
        place: e.place || null,
        lat: (e.lat === null || e.lat === undefined || e.lat === "") ? null : Number(e.lat),
        lon: (e.lon === null || e.lon === undefined || e.lon === "") ? null : Number(e.lon),
        photos: Array.isArray(e.photos) ? e.photos : [],
        audio: (e.audio && e.audio.path) ? e.audio : null,   /* carried through, never dropped */
        updated_at: new Date().toISOString()
      };
      return sb().from("journal_entries").upsert(row, { onConflict: "id" })
        .then(function (res) {
          /* A journal table made before photos and places existed: keep the
             writing rather than losing it to a column that isn't there. */
          if (res.error && /place|lat|lon|photos|body_html|audio|column/i.test(res.error.message || "")) {
            delete row.place; delete row.lat; delete row.lon; delete row.photos; delete row.body_html; delete row.audio;
            return sb().from("journal_entries").upsert(row, { onConflict: "id" });
          }
          return res;
        });
    },

    remove: function (id) {
      if (!ready()) return Promise.reject(new Error("not signed in"));
      return sb().from("journal_entries").delete().eq("id", id);
    }
  };

  /* ================================================================ ARCHIVE
     Past daily stories. The database decides who may read these: its rule
     wants a subscriptions row for this account with an open status, or an
     admin. If a family sees nothing here, that rule is why — not this code. */
  var archive = {
    /* TONIGHT — the newest published night on or before today. Exactly what
       the app's Today screen asks for, including the "or before" part: it
       keeps a family reading last night's story rather than showing them an
       empty screen when a day gets skipped or a time zone disagrees.

       `select("*")` on purpose. Postgres rejects a whole select for one
       column it doesn't know, and this row has picked up new columns over
       time (book_html, song_html, song_audio_url). A star never goes stale. */
    tonight: function () {
      if (!ready()) return Promise.resolve(null);
      /* One row per night carries both editions (story_html, story_html_nondenom),
         exactly as the app reads them; fromFullRow picks the family's own. */
      return sb().from("daily_content").select("*")
        .not("published_at", "is", null)
        .lte("publish_date", today())
        .order("publish_date", { ascending: false })
        .limit(1)
        .then(function (res) {
          if (res.error) throw new Error(res.error.message);
          var row = (res.data || [])[0];
          return row ? archive.fromFullRow(row) : null;
        });
    },

    /* One night in full — the two big HTML columns included. Fetched only
       when somebody actually opens that night. */
    full: function (date) {
      if (!ready() || !date) return Promise.resolve(null);
      /* The family's own edition is a column of the night's one row; fromFullRow picks it. */
      function plain() {
        return sb().from("daily_content").select("*")
          .eq("publish_date", date)
          .not("published_at", "is", null)
          .limit(1)
          .then(function (res) {
            if (res.error) throw new Error(res.error.message);
            var row = (res.data || [])[0];
            return row ? archive.fromFullRow(row) : null;
          });
      }
      return plain();
    },

    /* Everything a night carries. Named the same way the app names it, so
       the two files can be read side by side. */
    fromFullRow: function (r) {
      var n = archive.fromRow(r);
      /* THE EDITION, as the app chooses it: a Christian family reads the night's
         Christian edition when it was written, and the Latter-day Saint one -
         the edition that has always existed - when it was not. */
      n.html = (faithNow() === "nondenom" && r.story_html_nondenom) ? r.story_html_nondenom : (r.story_html || "");
      n.bookHtml = r.book_html || "";
      n.songHtml = r.song_html || "";
      n.songAudio = r.song_audio_url || "";
      n.songLink = r.song_url || "";
      n.lyricsLink = r.lyrics_url || "";
      n.lanternLink = r.lantern_url || "";
      n.storyLink = r.story_link || "";
      return n;
    },

    /* WHICH nights carry a given piece, without dragging the piece itself
       across. Asking for `publish_date` where `book_html is not null` sends
       back a list of dates and nothing else — a few hundred bytes, where the
       books themselves are megabytes of pictures.

       This is what lets the LST Library fill its shelves accurately the
       moment a night is published, with no second place to keep in step. */
    nightsWith: function (column) {
      if (!ready()) return Promise.resolve([]);
      return sb().from("daily_content")
        .select("publish_date,title,scripture,book,week,night")
        .not("published_at", "is", null)
        .not(column, "is", null)
        .lte("publish_date", today())
        .order("publish_date", { ascending: false })
        .limit(500)
        .then(function (res) {
          if (res.error) throw new Error(res.error.message);
          return (res.data || []).map(function (r) {
            return {
              date: r.publish_date, title: r.title || "", scripture: r.scripture || "",
              book: r.book, week: r.week, night: r.night
            };
          });
        });
    },

    list: function (limit) {
      if (!ready()) return Promise.resolve([]);
      return sb().from("daily_content")
        .select("id,publish_date,title,scripture,traveler,virtues,story_text,narration_url,published_at,book,week,night")
        .not("published_at", "is", null)
        .order("publish_date", { ascending: false })
        .limit(limit || 400)
        .then(function (res) {
          if (res.error) throw new Error(res.error.message);
          return (res.data || []).map(archive.fromRow);
        });
    },

    /* ------------------------------------------------------ admin only
       The app has granted admins full control of `daily_content` since its
       third migration ("admins manage content", FOR ALL). So these need no
       new permission — but Postgres is still the one deciding. A family who
       calls them gets an error, not a deleted night.

       Levi asked for these because he is testing, and a test night he cannot
       remove is a test night that ends up in front of a paying family. */
    remove: function (date) {
      if (!ready() || !date) return Promise.reject(new Error("no night given"));
      return sb().from("daily_content").delete().eq("publish_date", date);
    },

    /* Retag a night. The app stores virtues as [{id,name}] objects, so this
       goes through the same translation everything else does. */
    setVirtues: function (date, ids) {
      if (!ready() || !date) return Promise.reject(new Error("no night given"));
      return sb().from("daily_content")
        .update({ virtues: virtuesToApp(ids || []) })
        .eq("publish_date", date);
    },

    fromRow: function (r) {
      return {
        id: r.id,
        date: r.publish_date,
        title: r.title || "",
        scripture: r.scripture || "",
        traveler: r.traveler || "",
        virtues: virtuesToIds(r.virtues),
        text: r.story_text || "",
        audio: r.narration_url || "",
        book: r.book, week: r.week, night: r.night
      };
    }
  };


  /* ------------------------------------------------------ THE EDITION
     The Morning Lantern comes in two editions (data/faiths.js), the same two
     the app offers. Which one a family gets is `profiles.faith`; a night
     carries both in its one row (story_html, story_html_nondenom).

     ⚠️ A FAMILY MUST NEVER BE SHOWN AN EMPTY PAGE BECAUSE THEIR EDITION IS NOT
     WRITTEN YET. The Christian edition is not always written for every night. So every read asks for the family's
     own edition first and falls back to the one that has always existed. A
     Catholic family on a night with no Catholic edition gets the Latter-day
     Saint one, which is a real Lantern, rather than nothing at all.

     The faith is remembered per browser so the first paint does not wait on a
     round trip. It is a display hint only — it decides which night is asked
     for, never who may read it. Postgres still answers that. */
  var FAITH_KEY = "lst:faith";
  var myFaith = null;

  function faithDefault() { return window.LST_FAITH_DEFAULT || "lds"; }

  function knownFaith(v) {
    var list = window.LST_FAITHS || [];
    var alias = window.LST_FAITH_ALIAS || {};
    v = alias[v] || v;                 /* an older answer reads the edition it maps to */
    for (var i = 0; i < list.length; i++) if (list[i].id === v) return v;
    return "";
  }

  function faithNow() {
    if (myFaith) return myFaith;
    try {
      var kept = knownFaith(localStorage.getItem(FAITH_KEY));
      if (kept) { myFaith = kept; return kept; }
    } catch (e) {}
    return faithDefault();
  }

  /* Asked once, when the account is known. */
  function loadFaith() {
    var c = sb();
    var a = window.LSTAuth;
    var u = (a && a.user && a.user()) || null;
    if (!c || !u || !u.id) return Promise.resolve(faithNow());
    return c.from("profiles").select("faith").eq("id", u.id).limit(1)
      .then(function (res) {
        var v = knownFaith(res && res.data && res.data[0] && res.data[0].faith);
        myFaith = v || faithDefault();
        try { localStorage.setItem(FAITH_KEY, myFaith); } catch (e) {}
        return myFaith;
      })
      .catch(function () { return faithNow(); });
  }

  function setFaith(v) {
    var c = sb();
    var a = window.LSTAuth;
    var u = (a && a.user && a.user()) || null;
    myFaith = knownFaith(v) || faithDefault();
    try { localStorage.setItem(FAITH_KEY, myFaith); } catch (e) {}
    if (!c || !u || !u.id) return Promise.resolve(myFaith);
    return c.from("profiles").upsert({ id: u.id, faith: knownFaith(v) || null })
      .then(function () { return myFaith; })
      .catch(function () { return myFaith; });
  }

  /* The editions to try, best first. Always ends at the one that exists. */
  function editionOrder() {
    var mine = faithNow(), fall = faithDefault();
    return mine === fall ? [fall] : [mine, fall];
  }

  /* ------------------------------------------------------ THE BOOKS
     A night of a month's book. The words used to sit in data/book-*.js, which
     is a public file — anyone could open one and read all ninety-one stories.
     They live in `book_nights` now, under the same rule as story_texts: a row
     is handed to a subscriber, or to anyone for a story marked free, and to
     nobody else. Postgres decides, so no reply here means not allowed, and
     nothing this file does can change that.

     `beats` is jsonb — an ARRAY — so it comes back as a real array. See the
     note in js/lst-read.js about what happens if it is treated as a string.

     sql/book-june.sql, book-july.sql, book-august.sql put them there. */
  var bookNights = {
    one: function (id) {
      var c = sb();
      if (!c || !id) return Promise.resolve(null);
      return c.from("book_nights")
        .select("id,book,night,title,reference,beats")
        .eq("id", id).limit(1)
        .then(function (res) {
          if (res.error || !res.data || !res.data.length) return null;
          var r = res.data[0];
          return {
            id: r.id, book: r.book, night: r.night || "",
            title: r.title || "", reference: r.reference || "",
            beats: Array.isArray(r.beats) ? r.beats : []
          };
        })
        .catch(function () { return null; });
    },
    /* Which nights exist at all — ids only, so it stays small. Used to decide
       whether to offer "read it here" without asking for any words. */
    ids: function () {
      var c = sb();
      if (!c) return Promise.resolve([]);
      return c.from("book_nights").select("id")
        .then(function (res) {
          if (res.error || !res.data) return [];
          return res.data.map(function (r) { return r.id; });
        })
        .catch(function () { return []; });
    }
  };

  window.LSTData = {
    faith: { now: faithNow, load: loadFaith, set: setFaith, order: editionOrder },
    bookNights: bookNights,
    familyStories: family,
    journal: journal,
    archive: archive,
    newId: newId,
    today: today,
    virtueName: virtueName,
    virtuesToApp: virtuesToApp,
    virtuesToIds: virtuesToIds,
    ready: ready
  };
})();
