# Builds nestwork-app.html, the full-screen version of the prototype for Safari on an iPhone, from family-app-prototype.html.
# Same app, same code and data; only the frame changes: no phone outline, no side notes, the app fills the screen.
# Run after every prototype change:  python3 prototype/build-mobile.py
import pathlib, re
here = pathlib.Path(__file__).parent
s = (here / 'family-app-prototype.html').read_text()
s = re.sub(r'<title>[^<]*</title>', '<title>NestWork</title>', s, count=1)
full = """
/* ---- Full-screen app (build-mobile.py): the app is the whole page ---- */
html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }
body { background: var(--frame); margin: 0; }
.band, .intro, .status { display: none !important; }
.stage { display: block; max-width: none; margin: 0; padding: 0; }
.phone { width: 100%; max-width: 520px; margin: 0 auto; height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); min-height: 0; border: 0; border-radius: 0; box-shadow: none; }
.app { border-radius: 0; }
.scroll { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding-top: 4px; }
"""
# The note tool lives in the hidden side panel, so it is switched off here.
note = "var commentsP = window.claude && window.claude.use ? window.claude.use('comments') : Promise.resolve(null);"
assert s.count(note) == 1
s = s.replace(note, "var commentsP = Promise.resolve(null);")
assert s.count('</style>') >= 1
s = s.replace('</style>', full + '</style>', 1)
(here / 'nestwork-app.html').write_text(s)
print('wrote', here / 'nestwork-app.html', len(s))
