/* SCRIPTURES AND TALKS, MADE CLICKABLE — js/lst-refs.js

   Every Morning Lantern is full of references: "John 14:15", "Alma 32:21",
   "D&C 121:7-8", "Psalms 102-103; 110; 116-119", and conference talks given
   by name and date. On the app they are words. On the website a parent who
   wants to open the chapter should be one tap from it.

   This file turns those words into links. It runs LAST, on the finished HTML
   the reader has already built, so nothing upstream has to know about it.

   THREE RULES IT WILL NOT BREAK
   1. It never touches text already inside an <a>. Some Lanterns already carry
      Levi's own links; his win.
   2. It only ever wraps text in a link. It never changes, reorders or drops a
      single character of what Levi wrote — run it twice and the words are
      identical, because the second pass sees the first pass's links and skips
      them.
   3. A reference it does not recognise is left alone as plain text. A wrong
      link is worse than no link: it sends a parent to the wrong verse, in
      front of their child, at bedtime.

   WHERE THE LINKS GO
   Set by WHERE below. "gospel-library" sends everything to the Church's own
   study site. "bible-neutral" sends Bible chapters to Bible Gateway (KJV) and
   keeps the Restoration scriptures on the Church site, because there is
   nowhere else for them. See the note by WHERE before changing it.

   Used by js/lst-read.js, js/lst-tonight.js, js/lst-archive.js and
   js/lst-sample.js.
*/
(function () {
  "use strict";

  /* ------------------------------------------------------------- WHERE
     Levi's audience is LDS families first, and Christian families we are
     working to welcome. The Gospel Library is the natural home for both — it
     carries the King James Bible — and it keeps every link on one site.

     If a link to churchofjesuschrist.org ever feels like the wrong doorstep
     for a family arriving through bible-bedtime-stories.html, change this one
     word to "bible-neutral". Bible chapters will then open on Bible Gateway
     in the King James Version, and only the Book of Mormon, the Doctrine and
     Covenants and the Pearl of Great Price will point at the Church's site,
     because those exist nowhere else. */
  var WHERE = "gospel-library";

  /* ------------------------------------------------------- the books
     slug is the Church's own, e.g. .../study/scriptures/nt/philip/4.
     bg is what Bible Gateway wants; absent for anything not in the Bible.
     Aliases cover the ways Levi actually writes them. */
  function B(vol, slug, bg, names) { return { vol: vol, slug: slug, bg: bg, names: names }; }

  var BOOKS = [
    /* ---- Old Testament */
    B("ot","gen","Genesis",["genesis","gen"]),
    B("ot","ex","Exodus",["exodus","exod","ex"]),
    B("ot","lev","Leviticus",["leviticus","lev"]),
    B("ot","num","Numbers",["numbers","num"]),
    B("ot","deut","Deuteronomy",["deuteronomy","deut"]),
    B("ot","josh","Joshua",["joshua","josh"]),
    B("ot","judg","Judges",["judges","judg"]),
    B("ot","ruth","Ruth",["ruth"]),
    B("ot","1-sam","1 Samuel",["1 samuel","1 sam","first samuel","i samuel"]),
    B("ot","2-sam","2 Samuel",["2 samuel","2 sam","second samuel","ii samuel"]),
    B("ot","1-kgs","1 Kings",["1 kings","1 kgs","first kings","i kings"]),
    B("ot","2-kgs","2 Kings",["2 kings","2 kgs","second kings","ii kings"]),
    B("ot","1-chr","1 Chronicles",["1 chronicles","1 chr","first chronicles","i chronicles"]),
    B("ot","2-chr","2 Chronicles",["2 chronicles","2 chr","second chronicles","ii chronicles"]),
    B("ot","ezra","Ezra",["ezra"]),
    B("ot","neh","Nehemiah",["nehemiah","neh"]),
    B("ot","esth","Esther",["esther","esth"]),
    B("ot","job","Job",["job"]),
    B("ot","ps","Psalms",["psalms","psalm","pss","ps"]),
    B("ot","prov","Proverbs",["proverbs","prov"]),
    B("ot","eccl","Ecclesiastes",["ecclesiastes","eccl"]),
    B("ot","song","Song of Solomon",["song of solomon","song of songs","song"]),
    B("ot","isa","Isaiah",["isaiah","isa"]),
    B("ot","jer","Jeremiah",["jeremiah","jer"]),
    B("ot","lam","Lamentations",["lamentations","lam"]),
    B("ot","ezek","Ezekiel",["ezekiel","ezek"]),
    B("ot","dan","Daniel",["daniel","dan"]),
    B("ot","hosea","Hosea",["hosea","hos"]),
    B("ot","joel","Joel",["joel"]),
    B("ot","amos","Amos",["amos"]),
    B("ot","obad","Obadiah",["obadiah","obad"]),
    B("ot","jonah","Jonah",["jonah"]),
    B("ot","micah","Micah",["micah","mic"]),
    B("ot","nahum","Nahum",["nahum","nah"]),
    B("ot","hab","Habakkuk",["habakkuk","hab"]),
    B("ot","zeph","Zephaniah",["zephaniah","zeph"]),
    B("ot","hag","Haggai",["haggai","hag"]),
    B("ot","zech","Zechariah",["zechariah","zech"]),
    B("ot","mal","Malachi",["malachi","mal"]),
    /* ---- New Testament */
    B("nt","matt","Matthew",["matthew","matt","mt"]),
    B("nt","mark","Mark",["mark"]),
    B("nt","luke","Luke",["luke"]),
    B("nt","john","John",["john"]),          /* ordered after 1/2/3 John below */
    B("nt","acts","Acts",["acts","acts of the apostles"]),
    B("nt","rom","Romans",["romans","rom"]),
    B("nt","1-cor","1 Corinthians",["1 corinthians","1 cor","first corinthians","i corinthians"]),
    B("nt","2-cor","2 Corinthians",["2 corinthians","2 cor","second corinthians","ii corinthians"]),
    B("nt","gal","Galatians",["galatians","gal"]),
    B("nt","eph","Ephesians",["ephesians","eph"]),
    B("nt","philip","Philippians",["philippians","philip","phil"]),
    B("nt","col","Colossians",["colossians","col"]),
    B("nt","1-thes","1 Thessalonians",["1 thessalonians","1 thes","1 thess","first thessalonians"]),
    B("nt","2-thes","2 Thessalonians",["2 thessalonians","2 thes","2 thess","second thessalonians"]),
    B("nt","1-tim","1 Timothy",["1 timothy","1 tim","first timothy","i timothy"]),
    B("nt","2-tim","2 Timothy",["2 timothy","2 tim","second timothy","ii timothy"]),
    B("nt","titus","Titus",["titus"]),
    B("nt","philem","Philemon",["philemon","philem","phlm"]),
    B("nt","heb","Hebrews",["hebrews","heb"]),
    B("nt","james","James",["james","jas"]),
    B("nt","1-pet","1 Peter",["1 peter","1 pet","first peter","i peter"]),
    B("nt","2-pet","2 Peter",["2 peter","2 pet","second peter","ii peter"]),
    B("nt","1-jn","1 John",["1 john","1 jn","first john","i john"]),
    B("nt","2-jn","2 John",["2 john","2 jn","second john","ii john"]),
    B("nt","3-jn","3 John",["3 john","3 jn","third john","iii john"]),
    B("nt","jude","Jude",["jude"]),
    B("nt","rev","Revelation",["revelation","revelations","rev"]),
    /* ---- Book of Mormon */
    B("bofm","1-ne",null,["1 nephi","1 ne","first nephi","i nephi"]),
    B("bofm","2-ne",null,["2 nephi","2 ne","second nephi","ii nephi"]),
    B("bofm","jacob",null,["jacob"]),
    B("bofm","enos",null,["enos"]),
    B("bofm","jarom",null,["jarom"]),
    B("bofm","omni",null,["omni"]),
    B("bofm","w-of-m",null,["words of mormon","w of m","wom"]),
    B("bofm","mosiah",null,["mosiah"]),
    B("bofm","alma",null,["alma"]),
    B("bofm","hel",null,["helaman","hel"]),
    B("bofm","3-ne",null,["3 nephi","3 ne","third nephi","iii nephi"]),
    B("bofm","4-ne",null,["4 nephi","4 ne","fourth nephi","iv nephi"]),
    B("bofm","morm",null,["mormon","morm"]),
    B("bofm","ether",null,["ether"]),
    B("bofm","moro",null,["moroni","moro"]),
    /* ---- Doctrine and Covenants */
    B("dc-testament","dc",null,["doctrine and covenants","d&c","d and c","dc"]),
    /* ---- Pearl of Great Price */
    B("pgp","moses",null,["moses"]),
    B("pgp","abr",null,["abraham","abr"]),
    B("pgp","js-m",null,["joseph smith-matthew","joseph smith matthew","js-m","js m"]),
    B("pgp","js-h",null,["joseph smith-history","joseph smith history","js-h","js h"]),
    B("pgp","a-of-f",null,["articles of faith","a of f"])
  ];

  /* Longest name first, so "1 John" is tried before "John" and "Song of
     Solomon" before "Song". Without this, "1 John 4:8" links to John. */
  var NAMES = [];
  BOOKS.forEach(function (b) {
    b.names.forEach(function (n) { NAMES.push({ n: n, b: b }); });
  });
  NAMES.sort(function (a, b) { return b.n.length - a.n.length; });
  var BY_NAME = {};
  NAMES.forEach(function (x) { if (!BY_NAME[x.n]) BY_NAME[x.n] = x.b; });

  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* "1 Nephi" has to match "1 Nephi", "1  Nephi" and "1&nbsp;Nephi"; "D&C"
     has to match with or without the spaces. */
  var NAME_RE = NAMES.map(function (x) {
    return rx(x.n)
      .replace(/ /g, "[\\s\\u00a0]*")
      /* Levi types "Joseph Smith\u2014History" with an em dash; the table spells it
         with a hyphen. Any dash matches any dash. */
      .replace(/-/g, "[-\\u2013\\u2014]");
  }).join("|");

  /* Book, then chapter, then optionally :verses — with en dashes and
     semicolon lists, the way Levi writes them:
       John 14:15      Alma 32:21-27      D&C 121:7–8
       Psalms 102–103; 110; 116–119       Moroni 10:3-5 */
  var REF_RE = new RegExp(
    "\\b(" + NAME_RE + ")" +                       /* 1: the book            */
    "[\\s\\u00a0]*" +
    "(\\d+(?:[\\s\\u00a0]*[-\\u2013\\u2014][\\s\\u00a0]*\\d+)?" +  /* 2: chapter(s) */
    "(?:[\\s\\u00a0]*:[\\s\\u00a0]*\\d+(?:[\\s\\u00a0]*[-\\u2013\\u2014,][\\s\\u00a0]*\\d+)*)?" + /* verses */
    /* A semicolon carries the same book forward — "Psalms 102-103; 110" — but
       only while the next piece is a bare number. "3 Nephi 11; 4 Nephi 1:15"
       must NOT read "4" as another chapter of 3 Nephi, so a piece that begins
       a new book name ends the list here and is matched on its own. */
    "(?:[\\s\\u00a0]*;[\\s\\u00a0]*(?!(?:" + NAME_RE + ")[\\s\\u00a0]*\\d)" +
    "\\d+(?:[\\s\\u00a0]*[-\\u2013\\u2014][\\s\\u00a0]*\\d+)?" +
    "(?:[\\s\\u00a0]*:[\\s\\u00a0]*\\d+(?:[\\s\\u00a0]*[-\\u2013\\u2014,][\\s\\u00a0]*\\d+)*)?)*" +
    ")", "gi");

  function bookOf(raw) {
    var k = String(raw)
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[\s\u00a0]+/g, " ")
      .trim().toLowerCase();
    return BY_NAME[k] || null;
  }

  /* ------------------------------------------------------------- the URL */
  function chapterUrl(book, chapter, verses) {
    if (WHERE === "bible-neutral" && book.bg) {
      var q = book.bg + " " + chapter + (verses ? ":" + verses : "");
      return "https://www.biblegateway.com/passage/?search=" +
        encodeURIComponent(q) + "&version=KJV";
    }
    var u = "https://www.churchofjesuschrist.org/study/scriptures/" +
      book.vol + "/" + book.slug + "/" + chapter + "?lang=eng";
    if (verses) {
      /* the Church's own anchor shape: id=p15-p17#p15 */
      var nums = String(verses).match(/\d+/g) || [];
      if (nums.length) {
        var id = nums.length > 1 ? "p" + nums[0] + "-p" + nums[nums.length - 1] : "p" + nums[0];
        u += "&id=" + id + "#p" + nums[0];
      }
    }
    return u;
  }

  /* "102–103; 110; 116–119" → one link per semicolon-separated piece, so a
     parent lands on the chapter they are pointing at rather than always the
     first one. Each piece keeps the exact characters it had. */
  function pieces(tail) {
    var out = [];
    String(tail).split(/;/).forEach(function (chunk, i) {
      if (i) out.push({ text: ";", link: null });
      var m = chunk.match(/(\d+)(?:[\s\u00a0]*[-–—][\s\u00a0]*\d+)?(?:[\s\u00a0]*:[\s\u00a0]*([\d\s\u00a0,–—-]*\d))?/);
      out.push({ text: chunk, link: m ? { chapter: m[1], verses: m[2] || "" } : null });
    });
    return out;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function anchor(href, label, title) {
    return '<a class="rd-sref" href="' + esc(href) + '" target="_blank" rel="noopener"' +
      (title ? ' title="' + esc(title) + '"' : "") + ">" + esc(label) + "</a>";
  }

  /* ------------------------------------------------- one string of text
     The book name joins the FIRST link, so "John 14:15" is one thing to tap
     rather than a bare "14:15" with the word left behind. In a semicolon list
     only the first piece carries the name — "Psalms 102-103; 110; 116-119"
     becomes three links, and each lands on its own chapter. */
  function markup(s) {
    var out = "", last = 0, m, found = false;
    REF_RE.lastIndex = 0;
    while ((m = REF_RE.exec(s))) {
      var book = bookOf(m[1]);
      if (!book) continue;
      var tail = m[2];
      var gap = s.slice(m.index + m[1].length, m.index + m[0].length - tail.length);
      var where = "Open on " + (WHERE === "bible-neutral" && book.bg
        ? "Bible Gateway" : "the Gospel Library");

      out += esc(s.slice(last, m.index));
      var parts = pieces(tail), first = true;
      for (var i = 0; i < parts.length; i++) {
        var piece = parts[i];
        if (!piece.link) { out += esc(piece.text); continue; }
        var lead = piece.text.match(/^[\s\u00a0]*/)[0];
        var label = piece.text.slice(lead.length);
        var href = chapterUrl(book, piece.link.chapter, piece.link.verses);
        if (first) {
          /* the name and the gap after it belong to this one */
          out += anchor(href, m[1] + gap + lead + label, where);
          first = false;
        } else {
          out += esc(lead) + anchor(href, label, where);
        }
      }
      if (first) out += esc(m[1] + gap + tail);   /* nothing was linkable */
      found = true;
      last = m.index + m[0].length;
    }
    if (!found) return null;
    return out + esc(s.slice(last));
  }

  var SKIP = { A: 1, SCRIPT: 1, STYLE: 1, CODE: 1, TEXTAREA: 1 };

  function walk(node) {
    var kids = [].slice.call(node.childNodes);
    kids.forEach(function (n) {
      if (n.nodeType === 1) {
        if (SKIP[n.tagName]) return;                  /* Levi's own links win */
        walk(n);
        return;
      }
      if (n.nodeType !== 3) return;
      var html = markup(n.nodeValue);
      if (html == null) return;
      var box = document.createElement("span");
      box.innerHTML = html;
      var frag = document.createDocumentFragment();
      while (box.firstChild) frag.appendChild(box.firstChild);
      n.parentNode.replaceChild(frag, n);
    });
  }

  /* ------------------------------------------------------ what to call
     link(html)  → the same HTML with every scripture reference wrapped.
     text(s)     → a plain string turned into linked, escaped HTML. */
  function link(html) {
    if (!html) return html;
    var box = document.createElement("div");
    box.innerHTML = String(html);
    walk(box);
    return box.innerHTML;
  }

  function textOf(s) {
    if (s == null || s === "") return "";
    return markup(String(s)) || esc(String(s));
  }

  /* ---------------------------------------------------------- the talks
     A conference talk cannot be deep-linked from its title alone: the
     Church's URL for it carries an id we do not have. So the title goes to a
     search of general conference, which finds it, and the date — when we can
     read a month and a year out of it — goes to that conference itself. Both
     are addresses we can be sure of. Guessing an id would produce a link that
     looks right and 404s. */
  var MONTHS = { january:"01", april:"04", october:"10", jan:"01", apr:"04", oct:"10" };

  function talkSearchUrl(title, speaker) {
    var q = [title, speaker].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    return "https://www.churchofjesuschrist.org/search?lang=eng&query=" +
      encodeURIComponent(q) + "&facet=general-conference";
  }

  function conferenceUrl(dateText) {
    var m = String(dateText || "").match(/(january|april|october|jan|apr|oct)[a-z]*\.?\s+(\d{4})/i);
    if (!m) return "";
    return "https://www.churchofjesuschrist.org/study/general-conference/" +
      m[2] + "/" + MONTHS[m[1].toLowerCase()] + "?lang=eng";
  }

  window.LSTRefs = {
    link: link,
    text: textOf,
    talkSearchUrl: talkSearchUrl,
    conferenceUrl: conferenceUrl,
    where: function () { return WHERE; },
    /* exposed so a checking page can list every book's link in one go */
    books: BOOKS,
    chapterUrl: chapterUrl
  };
})();
