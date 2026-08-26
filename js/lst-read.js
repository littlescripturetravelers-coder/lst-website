/* READING THE NIGHT — the app's three pasted pages, in the website's own voice.

   Every night Levi pastes three whole HTML pages into the app's admin screen,
   and they land in `daily_content`:

     story_html   the devotional — headings and paragraphs
     book_html    the picture book — a page-turning story, one beat per screen
     song_html    the lullaby — verses and a chorus

   On a phone the app opens each of them in a frame, as the page it is. That is
   right for a phone. On the website it is wrong: a whole foreign page dropped
   inside ours brings its own fonts, its own colours and its own idea of how
   wide a line should be, and it fights everything around it.

   So this file does not display those pages. It READS them — pulls out the
   pieces they are made of — and hands back the same information as ordinary
   website content, in the website's type, flowing down the page the way the
   rest of the site does.

   Where the pieces are:

     the devotional   in the markup itself. Parsed the same way the app parses
                      it (see parseStory in lst-app/www/index.html) so the two
                      always find the same things.
     the book         in a `STORY = {...}` object inside the page's script
     the lullaby      in a `LULLABY = {...}` object inside the page's script

   The last two are DATA, not display — which is lucky, because the lullaby
   page builds its verses with JavaScript at load time, so reading its markup
   would find an empty box.

   NOTHING IS EXECUTED. Those two objects are read by the small literal reader
   below, which understands strings, numbers, arrays and objects and nothing
   else. It cannot call a function or reach a variable, so a bad paste can only
   ever produce a bad object, never an action.

   Used by js/lst-tonight.js and js/lst-archive.js.
*/
(function () {

  /* ==================================================== the literal reader
     Just enough of JavaScript's value syntax to read an object literal that
     somebody wrote by hand: comments, trailing commas, all three kinds of
     quote, the usual escapes. Anything it does not recognise throws, and the
     caller falls back to showing the plain text. */
  function Reader(src) { this.s = String(src); this.i = 0; }

  Reader.prototype.ws = function () {
    for (;;) {
      var c = this.s[this.i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f" || c === "\v") { this.i++; continue; }
      if (c === "/" && this.s[this.i + 1] === "/") {
        while (this.i < this.s.length && this.s[this.i] !== "\n") this.i++;
        continue;
      }
      if (c === "/" && this.s[this.i + 1] === "*") {
        var end = this.s.indexOf("*/", this.i + 2);
        if (end === -1) throw new Error("unclosed comment");
        this.i = end + 2;
        continue;
      }
      return;
    }
  };

  var ESCAPES = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", "0": "\0" };

  Reader.prototype.string = function () {
    var quote = this.s[this.i++], out = "";
    for (;;) {
      if (this.i >= this.s.length) throw new Error("unclosed string");
      var c = this.s[this.i++];
      if (c === quote) return out;
      if (c !== "\\") { out += c; continue; }
      var e = this.s[this.i++];
      if (e === "u") {
        if (this.s[this.i] === "{") {                       /* \u{1F319} */
          var close = this.s.indexOf("}", this.i);
          if (close === -1) throw new Error("bad \\u{}");
          out += String.fromCodePoint(parseInt(this.s.slice(this.i + 1, close), 16));
          this.i = close + 1;
        } else {
          out += String.fromCharCode(parseInt(this.s.substr(this.i, 4), 16));
          this.i += 4;
        }
      } else if (e === "x") {
        out += String.fromCharCode(parseInt(this.s.substr(this.i, 2), 16));
        this.i += 2;
      } else if (e === "\n") {
        /* a backslash at end of line continues the string */
      } else {
        out += (ESCAPES[e] !== undefined ? ESCAPES[e] : e);
      }
    }
  };

  Reader.prototype.key = function () {
    var c = this.s[this.i];
    if (c === '"' || c === "'" || c === "`") return this.string();
    var start = this.i;
    while (/[A-Za-z0-9_$]/.test(this.s[this.i] || "")) this.i++;
    if (this.i === start) throw new Error("expected a key");
    return this.s.slice(start, this.i);
  };

  Reader.prototype.value = function () {
    this.ws();
    var c = this.s[this.i];
    if (c === undefined) throw new Error("ran out");

    if (c === '"' || c === "'" || c === "`") return this.string();

    if (c === "{") {
      this.i++;
      var obj = {};
      for (;;) {
        this.ws();
        if (this.s[this.i] === "}") { this.i++; return obj; }
        var k = this.key();
        this.ws();
        if (this.s[this.i] !== ":") throw new Error("expected :");
        this.i++;
        obj[k] = this.value();
        this.ws();
        if (this.s[this.i] === ",") { this.i++; continue; }
        if (this.s[this.i] === "}") { this.i++; return obj; }
        throw new Error("expected , or }");
      }
    }

    if (c === "[") {
      this.i++;
      var arr = [];
      for (;;) {
        this.ws();
        if (this.s[this.i] === "]") { this.i++; return arr; }
        arr.push(this.value());
        this.ws();
        if (this.s[this.i] === ",") { this.i++; continue; }
        if (this.s[this.i] === "]") { this.i++; return arr; }
        throw new Error("expected , or ]");
      }
    }

    var word = this.s.substr(this.i, 9);
    if (/^true\b/.test(word))      { this.i += 4; return true; }
    if (/^false\b/.test(word))     { this.i += 5; return false; }
    if (/^null\b/.test(word))      { this.i += 4; return null; }
    if (/^undefined\b/.test(word)) { this.i += 9; return null; }

    var num = /^-?\d+(\.\d+)?([eE][-+]?\d+)?/.exec(this.s.slice(this.i));
    if (num) { this.i += num[0].length; return Number(num[0]); }

    throw new Error("cannot read a value at " + this.i);
  };

  /* Find `NAME = {` (const, let, var or bare) and read the object after it. */
  function objectNamed(html, name) {
    if (!html) return null;
    var re = new RegExp("(?:^|[^\\w$.])" + name + "\\s*=\\s*(?=[{\\[])", "g");
    var m = re.exec(String(html));
    if (!m) return null;
    try {
      var r = new Reader(html);
      r.i = m.index + m[0].length;
      return r.value();
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------- helpers */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Levi writes &mdash; and &rsquo; straight into these files, so a string
     pulled out of one is already part entity. Turn those back into characters
     BEFORE escaping, or a reader sees "&amp;mdash;" on the page. */
  function decode(s) {
    if (s == null) return "";
    var box = document.createElement("textarea");
    box.innerHTML = String(s);
    return box.value;
  }
  function text(s) { return esc(decode(s)).replace(/\n/g, "<br>"); }
  function tidy(s) { return decode(s).replace(/\s+/g, " ").trim(); }

  function paras(s) {
    return String(s || "").split(/\n\s*\n/)
      .filter(function (p) { return p.trim(); })
      .map(function (p) { return "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>"; })
      .join("");
  }

  /* Only pictures the page carries with it. A story book's images arrive as
     data: URIs inside the paste; anything reaching off to another site does
     not belong in a bedtime story and is dropped. */
  function safeImg(src, alt) {
    var u = String(src || "").trim();
    if (!/^data:image\//i.test(u) && !/^images\//i.test(u) && !/^\/images\//i.test(u)) return "";
    return '<img class="rd-img" src="' + esc(u) + '" alt="' + esc(decode(alt || "")) + '" loading="lazy">';
  }

  /* Inside a paragraph, some markup carries meaning that plain text loses:
     the bold Hebrew word a Word Study is about, the "What comes before."
     that opens a paragraph, the link out to the passage on the Church's own
     site. So a body element is kept as HTML — but only these tags, only
     these attributes, and only links that go somewhere a link may go. */
  var KEEP = { STRONG: 1, B: 1, EM: 1, I: 1, U: 1, SUP: 1, SUB: 1, SMALL: 1, BR: 1, A: 1 };

  function inlineHtml(node) {
    var out = "";
    [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { out += esc(n.nodeValue); return; }
      if (n.nodeType !== 1) return;

      var tag = n.tagName;
      if (tag === "BR") { out += "<br>"; return; }

      if (!KEEP[tag]) { out += inlineHtml(n); return; }   /* keep the words */

      if (tag === "A") {
        var href = String(n.getAttribute("href") || "").trim();
        if (!/^(https?:|mailto:)/i.test(href)) { out += inlineHtml(n); return; }
        out += '<a href="' + esc(href) + '" target="_blank" rel="noopener">' +
               inlineHtml(n) + "</a>";
        return;
      }

      var t = tag.toLowerCase();
      out += "<" + t + ">" + inlineHtml(n) + "</" + t + ">";
    });
    return out.replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
  }

  function card(label, body, extra) {
    if (!body) return "";
    return '<section class="rd-card' + (extra ? " " + extra : "") + '">' +
      (label ? '<h3 class="rd-label">' + label + "</h3>" : "") + body + "</section>";
  }

  /* ================================================== THE DEVOTIONAL
     What Levi actually publishes each morning is The Morning Lantern, and it
     is not shaped the way a plain article is. It carries FOUR editions of the
     same night in one file — quick, medium, deep, super deep — each an
     `.edition` block, only one of them marked active. Inside an edition the
     writing lives in `.card` blocks: a label, sometimes a title, then body
     text in `.bt` / `.bt-white`, with verses, quotations, conference talks
     and questions in classes of their own.

     On a phone the app shows one edition and lets you switch. On a website
     the natural thing is the same choice made visible — four depths across
     the top, and the one you pick laid out as an article.

     Everything is read out of the markup by class. A class this file does not
     recognise still gets its text through, so a new kind of card Levi invents
     next month appears as plain paragraphs rather than vanishing. */

  var DEPTHS = [
    { match: /quick/i,     label: "Quick read",     note: "A few minutes" },
    { match: /medium/i,    label: "Medium read",    note: "A little deeper" },
    { match: /superdeep/i, label: "Super deep",     note: "The whole study" },
    { match: /deep/i,      label: "Deep read",      note: "For the grown-ups" }
  ];

  function depthOf(el) {
    var id = (el.id || "") + " " + (el.className || "");
    /* superdeep before deep — "deep" matches both. */
    var order = [DEPTHS[0], DEPTHS[1], DEPTHS[2], DEPTHS[3]];
    for (var i = 0; i < order.length; i++) if (order[i].match.test(id)) return order[i];
    var note = el.querySelector(".depth-note");
    return { label: note ? tidy(note.textContent) : "", note: "" };
  }

  /* Which website accent a card gets. The Lantern's own colour names carry
     meaning — gold is for the parent, teal for study, navy for background —
     so they are kept rather than flattened. */
  function accentOf(cls) {
    if (/card-verse/.test(cls)) return "rd-scripture";
    if (/card-quote/.test(cls)) return "rd-quote";
    if (/card-conf/.test(cls)) return "rd-conf";
    if (/card-story/.test(cls)) return "rd-telling";
    if (/card-gold/.test(cls)) return "rd-heart";
    if (/card-teal/.test(cls)) return "rd-study";
    if (/trav-|card-wren/.test(cls)) return "rd-traveler";
    return "";
  }

  /* One `.card` → one website section. */
  function readCard(card) {
    var cls = String(card.className || "");
    var out = "", label = "", seen = [];

    function grab(sel, fn) {
      [].slice.call(card.querySelectorAll(sel)).forEach(function (el) {
        if (seen.indexOf(el) !== -1) return;
        seen.push(el);
        fn(el);
      });
    }

    var lab = card.querySelector(".card-label, .toolkit-label, .tonight-tag");
    if (lab) { label = tidy(lab.textContent); seen.push(lab); }

    var title = card.querySelector(".card-title");
    if (title) {
      seen.push(title);
      out += "<h4>" + esc(tidy(title.textContent)) + "</h4>";
    }

    /* The traveler of the night, who gets a name and a motto. */
    var tname = card.querySelector(".traveler-name");
    if (tname) {
      var motto = card.querySelector(".traveler-motto");
      seen.push(tname);
      if (motto) seen.push(motto);
      out += '<p class="rd-who">' + esc(tidy(tname.textContent)) + "</p>" +
        (motto ? '<p class="rd-motto">' + esc(tidy(motto.textContent)) + "</p>" : "");
      var tc = card.querySelector(".traveler-center");
      if (tc) seen.push(tc);
    }

    /* A conference talk: who said it, when, and what it was called. */
    var speaker = card.querySelector(".conf-speaker");
    if (speaker) {
      var date = card.querySelector(".conf-date");
      var ttl = card.querySelector(".conf-talk-title");
      [speaker, date, ttl].forEach(function (e) { if (e) seen.push(e); });
      /* The talk is linked from the pieces the card already gives us, rather
         than guessed at out of prose. Its title goes to a search of general
         conference, which finds it; the date goes to that conference itself.
         The Church's own URL for a talk carries an id we do not have, and a
         guessed id would 404 — see the note in js/lst-refs.js. */
      var who = tidy(speaker.textContent);
      var tt = ttl ? tidy(ttl.textContent) : "";
      var dt = date ? tidy(date.textContent) : "";
      var R = window.LSTRefs;
      var conf = R && dt ? R.conferenceUrl(dt) : "";
      out += '<p class="rd-who">' + esc(who) + "</p>" +
        (tt ? '<p class="rd-motto">' + (R
              ? '<a class="rd-sref" href="' + esc(R.talkSearchUrl(tt, who)) +
                '" target="_blank" rel="noopener" title="Find this talk on the Church\u2019s site">' +
                esc(tt) + "</a>"
              : esc(tt)) + "</p>" : "") +
        (dt ? '<p class="rd-when">' + (conf
              ? '<a class="rd-sref" href="' + esc(conf) +
                '" target="_blank" rel="noopener" title="Open this general conference">' +
                esc(dt) + "</a>"
              : esc(dt)) + "</p>" : "");
      var talk = card.querySelector(".conf-talk");
      if (talk) seen.push(talk);
    }

    grab(".verse-text, .quote-text", function (el) {
      out += '<blockquote class="rd-verse">' + inlineHtml(el) + "</blockquote>";
    });
    grab(".quote-attr", function (el) {
      out += '<p class="rd-attr">' + inlineHtml(el) + "</p>";
    });
    /* The questions a parent is meant to sit with — numbered ones in
       .heart-q, and the paragraph about the Atonement that closes them. */
    grab(".heart-q, .prompt-q", function (el) {
      out += '<p class="rd-q">' + inlineHtml(el) + "</p>";
    });
    grab(".atonement-q", function (el) {
      out += '<p class="rd-atone">' + inlineHtml(el) + "</p>";
    });
    grab(".bt, .bt-white, .conf-body, .card-body, .toolkit-sub", function (el) {
      var t = inlineHtml(el);
      if (t) out += "<p>" + t + "</p>";
    });
    grab(".chips span, .pills span, .chip, .pill", function (el) {
      var t = tidy(el.textContent);
      if (t) out += '<span class="mp-badge mp-badge-w">' + esc(t) + "</span>";
    });

    /* Anything the classes above did not claim, so a card Levi invents next
       month still reaches the reader. */
    if (!out) {
      var t = tidy(card.textContent);
      if (t && t !== label) out += "<p>" + esc(t) + "</p>";
    }

    if (!out && !label) return "";
    return '<section class="rd-card ' + accentOf(cls) + '">' +
      (label ? '<h3 class="rd-label">' + esc(label) + "</h3>" : "") + out + "</section>";
  }

  /* One `.edition` → one readable article. */
  function readEdition(ed) {
    var out = "";

    var weekly = ed.querySelector(".weekly-block");
    if (weekly) {
      var wl = weekly.querySelector(".weekly-label");
      var rows = [].slice.call(weekly.querySelectorAll(".weekly-row"))
        .map(function (r) { return tidy(r.textContent); }).filter(Boolean);
      if (rows.length) {
        out += '<section class="rd-card rd-study">' +
          (wl ? '<h3 class="rd-label">' + esc(tidy(wl.textContent)) + "</h3>" : "") +
          '<ul class="rd-list">' + rows.map(function (r) {
            return "<li>" + esc(r) + "</li>";
          }).join("") + "</ul></section>";
      }
    }

    [].slice.call(ed.querySelectorAll(".card")).forEach(function (card) {
      /* The toolkit card is a set of buttons into the app — the lullaby and
         the story, both of which the website already shows further down the
         page. Repeating them here as dead links helps nobody. */
      if (/toolkit/.test(String(card.className || ""))) return;
      if (card.parentElement && card.parentElement.closest(".card")) return;
      out += readCard(card);
    });

    return out;
  }

  /* The older, simpler shape the app's own parseStory looks for. Kept as a
     fallback so a night pasted in the earlier format still reads. */
  function parseStory(html) {
    if (!html) return null;
    try {
      var doc = new DOMParser().parseFromString(String(html), "text/html");
      var ps = [].slice.call(doc.querySelectorAll("p"));
      var clean = function (s) { return String(s || "").replace(/\s+/g, " ").trim(); };

      var nutshell = "";
      ps.forEach(function (p) {
        if (!nutshell && /in a nutshell/i.test(p.textContent)) {
          nutshell = clean(p.textContent).replace(/^.*?in a nutshell:\s*/i, "");
        }
      });

      var background = [], bgUl = null;
      ps.forEach(function (p) {
        if (!bgUl && /a little background/i.test(p.textContent)) {
          var n = p.nextElementSibling;
          while (n && n.tagName !== "UL") n = n.nextElementSibling;
          bgUl = n;
        }
      });
      if (bgUl) {
        [].slice.call(bgUl.children).forEach(function (li) {
          if (li.tagName !== "LI") return;
          var nested = li.querySelector("ul"), label = "";
          [].slice.call(li.childNodes).forEach(function (n) {
            if (n.nodeType === 3) label += n.textContent;
            else if (n.nodeType === 1 && n.tagName !== "UL") label += n.textContent;
          });
          background.push({
            label: clean(label),
            sub: nested ? [].slice.call(nested.children)
              .filter(function (c) { return c.tagName === "LI"; })
              .map(function (c) { return clean(c.textContent); }) : []
          });
        });
      }

      var afterLabel = function (label) {
        var out = "";
        ps.forEach(function (p) {
          if (out) return;
          var t = clean(p.textContent), i = t.toLowerCase().indexOf(label.toLowerCase());
          if (i >= 0) {
            var rest = t.slice(i + label.length).replace(/^[:\s—–-]+/, "").trim();
            if (rest) out = rest;
          }
        });
        return out;
      };

      var whereToRead = "";
      for (var i = 0; i < ps.length; i++) {
        if (/where to read/i.test(ps[i].textContent)) {
          whereToRead = clean((ps[i + 1] || {}).textContent);
          break;
        }
      }

      var verseText = "";
      [].slice.call(doc.querySelectorAll("em")).forEach(function (e) {
        if (!verseText && clean(e.textContent).length > 20) verseText = clean(e.textContent);
      });

      var heart = [];
      ps.forEach(function (p) {
        var m = clean(p.textContent).match(/^(\d+)\.\s*(.+)/);
        if (m && m[2].length > 8) heart.push(m[2]);
      });
      if (!heart.length) {
        [].slice.call(doc.querySelectorAll(".heart-q,.atonement-q")).forEach(function (el) {
          var t = clean(el.textContent).replace(/^\d+\.\s*/, "");
          if (t.length > 8) heart.push(t);
        });
      }

      return {
        nutshell: nutshell, background: background,
        principle: afterLabel("Main Gospel Principle"),
        lesson: afterLabel("Key Lesson"),
        verseRef: afterLabel("Verse of the day"),
        verseText: verseText, whereToRead: whereToRead,
        heart: heart.slice(0, 6)
      };
    } catch (e) { return null; }
  }

  function simpleStory(p) {
    var body = "";
    if (p.nutshell) body += card("The story in a nutshell", "<p>" + text(p.nutshell) + "</p>");
    if (p.background && p.background.length) {
      body += card("A little background",
        '<ul class="rd-list">' + p.background.map(function (it) {
          return "<li><b>" + text(it.label) + "</b>" +
            (it.sub && it.sub.length
              ? "<ul>" + it.sub.map(function (s) { return "<li>" + text(s) + "</li>"; }).join("") + "</ul>"
              : "") + "</li>";
        }).join("") + "</ul>");
    }
    if (p.principle || p.lesson) {
      body += card("&#10022; The heart of tonight&rsquo;s story",
        (p.principle ? "<p><b>Main gospel principle:</b> " + text(p.principle) + "</p>" : "") +
        (p.lesson ? "<p><b>Key lesson for young children:</b> " + text(p.lesson) + "</p>" : ""),
        "rd-heart");
    }
    if (p.verseText || p.verseRef || p.whereToRead) {
      body += card("&#10022; Key scripture",
        (p.verseRef ? '<p class="rd-ref">' + text(p.verseRef) + "</p>" : "") +
        (p.verseText ? '<blockquote class="rd-verse">' + text(p.verseText) + "</blockquote>" : "") +
        (p.whereToRead ? "<p><b>Where to read it:</b> " + text(p.whereToRead) + "</p>" : ""),
        "rd-scripture");
    }
    if (p.heart && p.heart.length) {
      body += card("A parent&rsquo;s heart",
        '<ol class="rd-qs">' + p.heart.map(function (q) {
          return "<li>" + text(q) + "</li>";
        }).join("") + "</ol>", "rd-heart");
    }
    return body;
  }

  /* The one thing the rest of the website calls.

     Returns { ok, editions:[{label,note,html}], html } — `editions` present
     only when the paste really does carry more than one depth, so the page
     shows a depth chooser exactly when there is a choice to make. */
  /* Scripture references become links here, once, on the finished article.
     Doing it last means every card — including one whose class this file has
     never seen — gets linked without knowing anything about it. If
     js/lst-refs.js has not loaded, the words stay exactly as they were. */
  function linked(h) {
    return (window.LSTRefs && h) ? window.LSTRefs.link(h) : h;
  }

  function story(html, storyText) {
    var told = { ok: false, editions: [], html: "" };
    if (!html && !storyText) return told;

    try {
      var doc = new DOMParser().parseFromString(String(html || ""), "text/html");
      var eds = [].slice.call(doc.querySelectorAll(".edition"));

      if (eds.length) {
        eds.forEach(function (ed) {
          var body = readEdition(ed);
          if (!body) return;
          var d = depthOf(ed);
          told.editions.push({ label: d.label || "This night", note: d.note || "", html: body });
        });
        if (told.editions.length) {
          told.editions.forEach(function (e) { e.html = linked(e.html); });
          told.ok = true;
          told.html = told.editions[0].html;
          return told;
        }
      }

      /* No editions: an older or simpler paste. */
      var p = parseStory(html);
      var body = p ? simpleStory(p) : "";
      if (!body && storyText && String(storyText).trim()) {
        body = card("Tonight&rsquo;s story", paras(storyText), "rd-telling");
      }
      told.ok = !!body;
      told.html = linked(body);
      return told;
    } catch (e) { return told; }
  }

  /* ========================================================= THE BOOK
     The picture book, unfolded down the page instead of turned one screen at
     a time. Same pictures, same words, same order. */
  /* A book's night, from the object itself.

     `book()` below digs a STORY out of a pasted page; the month's books arrive
     already extracted (data/book-august.js, built by tools/extract-book.py), so
     they come straight in here. Same beats, same output, same look — a night of
     the August book reads exactly like the Morning Lantern, because it is drawn
     by the same few lines. */
  function beats(s) {
    if (!s || !s.beats || !s.beats.length) return { ok: false, html: "" };

    var out = "";
    s.beats.forEach(function (b) {
      var img = safeImg(b.img, b.alt);
      var words = (b.text || []).map(function (t) {
        return String(t == null ? "" : t).trim() ? "<p>" + text(t) + "</p>" : "";
      }).join("");

      /* A beat with no words and no picture draws an empty card with a heading
         over nothing, which reads as a fault rather than as a quiet moment. The
         book's closing beat is one of these by design; so is the occasional
         Parent Experience the book leaves blank. */
      if (!img && !words) return;

      if (b.type === "cover") {
        out += '<section class="rd-beat rd-cover">' + img + "</section>";
        return;
      }
      if (b.type === "moment") {
        out += '<section class="rd-beat rd-moment">' +
          (b.eyebrow ? '<p class="rd-eyebrow">' + text(b.eyebrow) + "</p>" : "") +
          (b.heading ? "<h3>" + text(b.heading) + "</h3>" : "") +
          img + words + "</section>";
        return;
      }
      out += '<section class="rd-beat">' + img + words + "</section>";
    });

    return {
      ok: !!out,
      title: tidy(s.title),
      night: tidy(s.night),
      reference: tidy(s.reference),
      html: out
    };
  }

  function book(html) {
    return beats(objectNamed(html, "STORY"));
  }

  /* ======================================================= THE LULLABY
     Verses and chorus, laid out to be sung from. The page in the database
     builds these with JavaScript when it loads, so its markup is empty and
     the words have to come from the LULLABY object instead.

     A part whose stanza is the single word CHORUS means "the chorus again" —
     it is written out in full each time, because nobody wants to scroll back
     up to the chorus with a sleepy child on their arm. */
  function song(html) {
    var l = objectNamed(html, "LULLABY");

    if (!l || !l.parts || !l.parts.length) {
      /* Not the usual template. Fall back to whatever words the markup holds
         rather than showing a family nothing. */
      try {
        var doc = new DOMParser().parseFromString(String(html || ""), "text/html");
        var lines = [].slice.call(doc.querySelectorAll(".verse,p"))
          .map(function (e) { return e.textContent.trim(); })
          .filter(function (t) { return t.length > 12; });
        if (!lines.length) return { ok: false, html: "" };
        return {
          ok: true, title: "", subtitle: "",
          html: lines.map(function (t) {
            return '<p class="rd-stanza">' + esc(t).replace(/\n/g, "<br>") + "</p>";
          }).join("")
        };
      } catch (e) { return { ok: false, html: "" }; }
    }

    var chorus = decode(l.chorus || "");
    var out = "", jump = [], seenChorus = false;

    l.parts.forEach(function (part, n) {
      var isChorus = part.kind === "chorus";
      var id = "sing-" + (part.id ? String(part.id).replace(/[^\w-]/g, "") : n);
      var label = tidy(part.label || (isChorus ? "Chorus" : "Verse " + (n + 1)));
      /* The chorus comes round three or four times and carries the same name
         each time. Listing it three times in the jump row is noise, so only
         its first appearance gets a link. */
      if (label && !(isChorus && seenChorus)) {
        jump.push('<a href="#' + id + '">' + esc(label) + "</a>");
      }
      if (isChorus) seenChorus = true;

      var stanzas = (part.stanzas || []).map(function (st) {
        var words = (String(st).trim().toUpperCase() === "CHORUS") ? chorus : decode(st);
        return '<p class="rd-stanza">' + esc(words).replace(/\n/g, "<br>") + "</p>";
      }).join("");

      out += '<section class="rd-part' + (isChorus ? " rd-chorus" : "") + '" id="' + id + '">' +
        (label ? '<h3 class="rd-part-label">' + esc(label) +
          (isChorus ? ' <span class="rd-tag">Chorus</span>' : "") + "</h3>" : "") +
        stanzas + "</section>";
    });

    return {
      ok: !!out,
      title: tidy(l.title),
      subtitle: tidy(l.subtitle),
      jump: jump.length > 1 ? '<nav class="rd-jump">' + jump.join("") + "</nav>" : "",
      html: out
    };
  }

  window.LSTRead = {
    story: story,
    book: book,
    beats: beats,
    song: song,
    parseStory: parseStory,
    objectNamed: objectNamed,
    decode: decode
  };
})();
