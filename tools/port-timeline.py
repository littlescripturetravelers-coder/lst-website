#!/usr/bin/env python3
"""THE WEBSITE'S TIMELINE IS THE APP'S TIMELINE.

    python3 tools/port-timeline.py [path/to/lst-app/www/timeline.html]

Levi, 1 Oct 2026: "Technology for Good isn't on the website. Only the app
timeline." The website's Sacred World Timeline (timeline-explore.html) was a
copy of the app's, taken by hand before Technology for Good and Evidence &
Discoveries were added, and the copy never caught up. This makes the copy
from the app's page every time, applying only the handful of changes that
belong to the website, so the two can never drift apart again:

  1. the head: the night-sky theme lock, the favicons, the page description,
     and the brand fonts from Google (the app carries them embedded);
  2. the brand type through --font-display / --font-body, as the rest of the
     website writes it;
  3. a few controls a size larger, for a desktop screen and a mouse;
  4. no js/config.js (the website's account code is loaded at the foot);
  5. a back arrow to the home page, and the map's OpenStreetMap credit;
  6. the old, dead PROPHECIES list left out (two lists in one file: the
     later one silently wins);
  7. at the foot, the website's own stylesheet, account code and the
     members' welcome (js/lst-members-only.js).

Each change names the exact text it replaces and stops if that text is not
found once, so a change to the app that moves one of them is caught here
rather than published half-done. Run it, then the website's timeline tests:
    ROOT=. PAGE=timeline-explore.html node ../lst-app/tests/timeline-intro.js
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SITE, "..", "lst-app", "www", "timeline.html")
OUT = os.path.join(SITE, "timeline-explore.html")


def once(s, old, new, what):
    n = s.count(old)
    if n != 1:
        sys.exit(f"port-timeline: '{what}' - the text to replace was found {n} times, not once. "
                 f"The app's timeline has moved; update this step.")
    return s.replace(old, new)


s = open(SRC, encoding="utf-8").read()

# 1. the head
s = once(s, '<link rel="stylesheet" href="fonts-embed.css">',
         '<!-- This page does not turn with the theme. It is a night sky. See js/lst-theme.js -->\n'
         '<meta name="lst:theme-lock" content="blue">\n'
         '  <link rel="icon" href="/favicon.ico" sizes="any">\n'
         '  <link rel="icon" type="image/png" href="/images/favicon-32.png" sizes="32x32">\n'
         '  <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">\n'
         '<meta name="description" content="An interactive Sacred World Timeline for families: the gospel story, '
         'world civilizations, empires, wars, inventions, prophecy and fulfillment, world faiths and your own family '
         'history, from Adam and Eve to today.">\n'
         '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;700;800'
         '&family=Anton&display=swap" rel="stylesheet">', "fonts")

# 2. the brand type
s = once(s, "--appfoot:96px;--safeb:calc(var(--appfoot) + env(safe-area-inset-bottom,0px));}",
         "--appfoot:96px;--safeb:calc(var(--appfoot) + env(safe-area-inset-bottom,0px));\n"
         "  /* the brand type, repeated here so this page still looks right on its own -\n"
         "     style.css loads at the foot of it and defines the same three */\n"
         "  --font-display:'Fredoka','Arial Rounded MT Bold',sans-serif;\n"
         "  --font-body:'Nunito',Arial,sans-serif;\n"
         "  --font-accent:'Anton',Impact,sans-serif;}", "font variables")
s = re.sub(r"font-family:\s*Fredoka,\s*sans-serif", "font-family:var(--font-display)", s)
s = re.sub(r"font-family:\s*Nunito,\s*sans-serif", "font-family:var(--font-body)", s)
s = s.replace("font-family:Nunito;'", "font-family:var(--font-body);'")
s = re.sub(r"font-family:\s*Anton,\s*sans-serif", "font-family:var(--font-accent)", s)

# 3. a size larger for a desktop
s = once(s, ".ej{font-weight:700;font-size:7.5px;padding:2px 6px;border-radius:9px;border:none;\n"
            "  background:transparent;color:rgba(255,255,255,.38);",
         ".ej{font-weight:700;font-size:11px;padding:3px 8px;border-radius:9px;border:none;\n"
         "  background:transparent;color:rgba(255,255,255,.55);", "era jump buttons")
s = once(s, "  font-size:10px;cursor:pointer;box-shadow:0 3px 12px rgba(244,114,182,.4);}",
         "  font-size:12px;cursor:pointer;box-shadow:0 3px 12px rgba(244,114,182,.4);}", "pink button")
s = once(s, '<button class="zb" style="font-size:10px" onclick="fitAll()">',
         '<button class="zb" style="font-size:15px" onclick="fitAll()">', "fit button")
s = once(s, '<button class="zb" style="font-size:10px" onclick="rz()">',
         '<button class="zb" style="font-size:15px" onclick="rz()">', "reset button")

s = once(s, "  letter-spacing:1.5px;color:rgba(255,255,255,.25);}",
         "  letter-spacing:1.5px;color:rgba(255,255,255,.55);}", "layer section labels")

# 4. no app config
s = once(s, '<script src="js/config.js"></script>\n', "", "app config")

# 5. home, and the map's credit
s = once(s, '<div id="tl-fab">\n',
         '<div id="tl-fab">\n  <a class="tlf" href="index.html" aria-label="Back to Little Scripture Travelers" '
         'title="Back to Little Scripture Travelers" style="text-decoration:none;font-size:19px;line-height:1;">&#8592;</a>\n',
         "home arrow")
s = once(s, '  <canvas id="map-canvas"></canvas>\n',
         '  <canvas id="map-canvas"></canvas>\n'
         '  <div style="position:absolute;right:4px;bottom:3px;z-index:5;font-size:8.5px;color:rgba(255,255,255,.55);'
         'background:rgba(6,13,30,.72);padding:1px 5px;border-radius:4px;">&copy; <a href="https://www.openstreetmap.org/copyright" '
         'target="_blank" rel="noopener" style="color:rgba(255,255,255,.75);">OpenStreetMap</a> contributors</div>\n',
         "map credit")

# 6. one PROPHECIES list
first = s.find("var PROPHECIES=[")
second = s.find("var PROPHECIES=[", first + 1)
if first >= 0 and second > first:
    s = (s[:first] + "// One PROPHECIES list only: two in one file is not an error in JavaScript,\n"
         "// the later one silently wins, so the earlier one was dead code (left out here).\n" + s[second:])

# 7. the website's foot
s = once(s, "setTimeout(tgFetch,900);\n</script>\n",
         "setTimeout(tgFetch,900);\n</script>\n\n"
         "<!-- The Sacred World Timeline comes with a subscription. The explainer at\n"
         "     timeline.html stays open to everyone; this is the tool itself.\n"
         "     Read the warning at the top of js/lst-members-only.js: the timeline's\n"
         "     data is in this file, so this turns people away, it does not lock them\n"
         "     out. -->\n"
         '<link rel="stylesheet" href="style.css">\n'
         '<script src="js/lst-theme.js"></script>\n'
         '  <script src="js/lst-edition.js"></script>\n'
         '<script src="js/vendor/supabase.js"></script>\n'
         '<script src="js/lst-auth.js"></script>\n'
         '<script src="js/lst-signup.js"></script>\n'
         '<script src="js/lst-members-only.js"></script>\n'
         "<script>\n"
         "  LSTMembers.guard({\n"
         '    what: "The Sacred World Timeline",\n'
         '    eyebrow: "Comes with The Lantern",\n'
         '    blurb: "Six thousand years laid out at once — the gospel story, empires, " +\n'
         '           "wars, inventions, prophecy and fulfilment, and your own family placed " +\n'
         '           "where they actually stood. Your first seven days are free.",\n'
         "    lines: [\n"
         '      "Every event across the layers you can switch on and off",\n'
         '      "Technology for Good, and Evidence & Discoveries with their sources",\n'
         '      "Add your own ancestors at the year they lived",\n'
         '      "And a new scripture story every night"\n'
         "    ],\n"
         '    back: "timeline.html",\n'
         '    backLabel: "What the timeline is"\n'
         "  });\n"
         "</script>\n"
         '  <script src="js/lst-signed-in.js"></script>\n', "website foot")

open(OUT, "w", encoding="utf-8").write(s)
print(f"timeline-explore.html written from {os.path.relpath(SRC, SITE)}: {len(s):,} characters")
