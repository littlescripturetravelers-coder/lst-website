#!/usr/bin/env python3
"""THE WORDS KEEP TIME WITH THE SINGING.

    python3 lantern/builder/time_words.py <slug> [<slug> ...]
    python3 lantern/builder/time_words.py --from-file /tmp/lst-sung.txt
    python3 lantern/builder/time_words.py --today        (today's and tomorrow's nights that still have no timing)

Levi, 1 Oct 2026: the app lights each line of the lullaby as it is sung, the
way Spotify's lyrics do, and the lit line was running ahead of the singer. A
sung song keeps no clock of its own; the app had to lay the lines evenly along
the recording, and a real singer does not sing evenly - she breathes between
verses, lingers on a chorus, lets the guitar play.

So every song is listened to once, after it is sung. ElevenLabs Scribe writes
down every word it hears with the second it was sung at; those words are laid
against the page's own lines; and the second each line begins is written into
the song page's LULLABY object as  "timing"  (one number per line, in the
order the app reads the lines) and into lullaby.json beside it. The app
believes a page that carries timing and lays the lines out itself only when a
page has none.

The lines are counted exactly as the app counts them (linesFromLullaby in the
app's index.html): every part in order, each stanza's lines, a stanza that says
CHORUS standing for the chorus's lines, blank lines dropped. The timing must be
one number per line or the app ignores it, so that rule is kept here in one
place and checked before anything is written.

A song is never spoilt by this: when Scribe cannot be reached, or hears less
than most of the words, nothing is written and the app keeps laying the lines
out as before. Scribe costs a few cents of ElevenLabs credit per song.
"""
import difflib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
LANTERN = os.path.dirname(HERE)
KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
MIN_HEARD = 0.6          # the share of the page's words Scribe must have heard


# ---- the lines, as the app reads them ------------------------------------------------
def lines_of(L):
    chorus = str(L.get("chorus") or "")
    out = []
    for p in L.get("parts") or []:
        if not p:
            continue
        text = "\n".join(chorus if str(st).strip() == "CHORUS" else str(st or "") for st in (p.get("stanzas") or []))
        for l in text.split("\n"):
            l = re.sub(r"\s+", " ", l).strip()
            if l:
                out.append(l)
    return out


def words_of(text):
    return [w for w in re.sub(r"[^a-z0-9' ]+", " ", text.lower().replace("’", "'")).replace("'", "").split() if w]


# ---- the page ---------------------------------------------------------------------------
LULL_RE = re.compile(r"(const\s+LULLABY\s*=\s*)(\{.*?\n\})(\s*;)", re.S)


def read_page(path):
    html = open(path, encoding="utf-8").read()
    m = LULL_RE.search(html)
    if not m:
        return html, None, None
    try:
        return html, m, json.loads(m.group(2))
    except json.JSONDecodeError:
        return html, m, None


def write_page(path, html, m, L):
    body = json.dumps(L, indent=1, ensure_ascii=False)
    open(path, "w", encoding="utf-8").write(html[: m.start(2)] + body + html[m.end(2):])


# ---- listening --------------------------------------------------------------------------
def scribe(mp3):
    """Every word Scribe hears, with its start second. None when it cannot be asked."""
    if not KEY:
        print("   no ELEVENLABS_API_KEY - the words cannot be timed")
        return None
    data = open(mp3, "rb").read()
    b = uuid.uuid4().hex.encode()

    def part(name, value, filename=None, ct=None):
        h = b"--" + b + b'\r\nContent-Disposition: form-data; name="' + name.encode() + b'"'
        if filename:
            h += b'; filename="' + filename.encode() + b'"\r\nContent-Type: ' + ct.encode()
        return h + b"\r\n\r\n" + (value if isinstance(value, bytes) else value.encode()) + b"\r\n"

    body = (part("model_id", "scribe_v1") + part("language_code", "eng") + part("timestamps_granularity", "word")
            + part("tag_audio_events", "false") + part("file", data, os.path.basename(mp3), "audio/mpeg")
            + b"--" + b + b"--\r\n")
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body,
                                 headers={"xi-api-key": KEY, "Content-Type": "multipart/form-data; boundary=" + b.decode()})
    for wait in (0, 20, 45):
        if wait:
            print(f"   Scribe busy; asking again in {wait}s", flush=True)
            time.sleep(wait)
        try:
            r = json.load(urllib.request.urlopen(req, timeout=900))
            words = [w for w in r.get("words", []) if w.get("type", "word") == "word" and str(w.get("text", "")).strip()]
            return [(str(w["text"]), float(w.get("start", 0) or 0), float(w.get("end", 0) or 0)) for w in words]
        except urllib.error.HTTPError as e:
            detail = e.read()[:300]
            print(f"   ElevenLabs Scribe: HTTP {e.code} {detail!r}", flush=True)
            if e.code not in (429, 500, 502, 503, 504):
                return None
        except Exception as e:  # noqa: BLE001 - the network, the parse: all of it means "not now"
            print(f"   ElevenLabs Scribe failed: {e}", flush=True)
            return None
    return None


# ---- laying the words against the lines -------------------------------------------------
def align(lines, heard, length=None):
    """A start second for every line, and the share of the page's words that were heard.

    The page's words and the heard words are matched in order (the chorus comes
    back several times, so order matters more than spelling); a line begins at
    its first heard word; a line no word was heard for is placed between its
    neighbours by its share of their words."""
    page = []                                   # (line index, word)
    for i, l in enumerate(lines):
        for w in words_of(l):
            page.append((i, w))
    if not page:
        return None, 0.0
    sung = [words_of(t) for t, _, _ in heard]
    flat = []                                   # (start, word) - a heard token may hold two words
    for ws, (t, s, e) in zip(sung, heard):
        for w in ws:
            flat.append((s, w))
    a = [w for _, w in page]
    b = [w for _, w in flat]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    first = {}                                  # line -> start of its first matched word
    matched = 0
    hit = {}                                    # page word index -> heard word index
    for i, j, n in sm.get_matching_blocks():
        for k in range(n):
            hit[i + k] = j + k
            matched += 1
    line_first = {}                             # line -> index of its first page word
    for idx, (li, _) in enumerate(page):
        line_first.setdefault(li, idx)
    for idx, (li, _) in enumerate(page):
        if idx not in hit:
            continue
        j = hit[idx]
        st = flat[j][0]
        # The line's first word was misheard (sung words often are) and a later
        # word of the line was the first to match: the line began at the heard
        # word just before that match, when it is unmatched and close enough to
        # be the same breath - not at the second or third word.
        if idx != line_first[li]:
            back = idx - line_first[li]        # how many page words of this line sit before the match
            jj = j
            while back > 0 and jj - 1 >= 0 and (jj - 1) not in hit.values() and flat[j][0] - flat[jj - 1][0] < 0.9 * back + 0.6:
                jj -= 1
                back -= 1
            st = flat[jj][0]
        if li not in first or st < first[li]:
            first[li] = st
    share = matched / float(len(page))
    n = len(lines)
    starts = [None] * n
    for li, st in first.items():
        starts[li] = st
    # keep the clock moving forwards: a line matched out of order is dropped and filled in
    last = -1.0
    for i in range(n):
        if starts[i] is not None and starts[i] <= last:
            starts[i] = None
        if starts[i] is not None:
            last = starts[i]
    counts = [max(1, len(words_of(l))) for l in lines]
    known = [i for i in range(n) if starts[i] is not None]
    if not known:
        return None, share
    # before the first heard line and after the last: pace by the song's own average
    per_word = (starts[known[-1]] - starts[known[0]]) / float(max(1, sum(counts[known[0]:known[-1]]))) if len(known) > 1 else 0.45
    per_word = max(0.2, min(1.5, per_word))
    for i in range(known[0] - 1, -1, -1):
        starts[i] = max(0.0, starts[i + 1] - counts[i] * per_word)
    for i in range(known[-1] + 1, n):
        starts[i] = starts[i - 1] + counts[i - 1] * per_word
        if length:
            starts[i] = min(starts[i], max(0.0, length - 1.0))
    # between two heard lines: by each line's share of the words in between
    i = 0
    while i < n:
        if starts[i] is not None:
            i += 1
            continue
        j = i
        while j < n and starts[j] is None:
            j += 1
        lo, hi = starts[i - 1], starts[j]
        span = sum(counts[i - 1:j])
        acc = counts[i - 1]
        for k in range(i, j):
            starts[k] = lo + (hi - lo) * acc / float(span)
            acc += counts[k]
        i = j
    starts = [round(float(s), 2) for s in starts]
    for i in range(1, n):                       # strictly forwards, always
        if starts[i] <= starts[i - 1]:
            starts[i] = round(starts[i - 1] + 0.05, 2)
    return starts, share


def song_length(mp3):
    try:
        import subprocess
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3],
                             capture_output=True, text=True, timeout=60).stdout.strip()
        return float(out) if out else None
    except Exception:  # noqa: BLE001
        return None


# ---- one night ---------------------------------------------------------------------------
def time_night(slug, force=False):
    folder = os.path.join(LANTERN, slug)
    page = os.path.join(folder, f"{slug}-lullaby.html")
    mp3 = os.path.join(folder, f"{slug}-lullaby.mp3")
    meta = os.path.join(folder, "lullaby.json")
    if not (os.path.exists(page) and os.path.exists(mp3)):
        print(f"{slug}: no song page and recording together - nothing to time")
        return False
    html, m, L = read_page(page)
    if not L:
        print(f"{slug}: the song page carries no LULLABY object this script can read - not timed")
        return False
    lines = lines_of(L)
    if not lines:
        print(f"{slug}: the song page has no lines - not timed")
        return False
    if not force and isinstance(L.get("timing"), list) and len(L["timing"]) == len(lines):
        print(f"{slug}: already timed ({len(lines)} lines)")
        return True
    print(f"{slug}: listening to {os.path.basename(mp3)} ({len(lines)} lines)", flush=True)
    heard = scribe(mp3)
    if not heard:
        print(f"{slug}: not timed this run - the app lays the lines out evenly until it is")
        return False
    starts, share = align(lines, heard, song_length(mp3))
    print(f"   Scribe heard {len(heard)} words; {share:.0%} of the page's words were found in order")
    if starts is None or share < MIN_HEARD:
        print(f"{slug}: too few of the words were heard to trust the timing (need {MIN_HEARD:.0%}) - not timed")
        return False
    if len(starts) != len(lines):
        print(f"{slug}: {len(starts)} times for {len(lines)} lines - not written")
        return False
    L["timing"] = starts
    write_page(page, html, m, L)
    try:
        J = json.load(open(meta, encoding="utf-8")) if os.path.exists(meta) else {}
    except json.JSONDecodeError:
        J = {}
    J["timing"] = starts
    J["timed"] = {"by": "elevenlabs-scribe", "heard": round(share, 3), "lines": len(lines), "when": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    json.dump(J, open(meta, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    open(meta, "a", encoding="utf-8").write("\n")
    shown = ", ".join(f"{s:.1f}" for s in starts[:6])
    print(f"   timed: first lines begin at {shown} ... last at {starts[-1]:.1f}s")
    return True


def nights_for_today():
    """Today's and tomorrow's nights (by publish_date, UTC day) that have a recording but no timing yet."""
    import datetime
    today = datetime.datetime.utcnow().date()
    want = {str(today - datetime.timedelta(days=1)), str(today), str(today + datetime.timedelta(days=1))}
    out = []
    for slug in sorted(os.listdir(LANTERN)):
        nj = os.path.join(LANTERN, slug, "night.json")
        if not os.path.exists(nj):
            continue
        try:
            d = str(json.load(open(nj, encoding="utf-8")).get("publish_date", ""))
        except Exception:  # noqa: BLE001
            continue
        if d not in want:
            continue
        if not os.path.exists(os.path.join(LANTERN, slug, f"{slug}-lullaby.mp3")):
            continue
        meta = os.path.join(LANTERN, slug, "lullaby.json")
        try:
            if isinstance(json.load(open(meta, encoding="utf-8")).get("timing"), list):
                continue
        except Exception:  # noqa: BLE001
            pass
        out.append(slug)
    return out


def main(argv):
    slugs, force = [], False
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--from-file":
            i += 1
            if i < len(argv) and os.path.exists(argv[i]):
                slugs += [l.strip() for l in open(argv[i], encoding="utf-8") if l.strip()]
        elif a == "--today":
            slugs += nights_for_today()
        elif a == "--force":
            force = True
        else:
            slugs += [s.strip() for s in a.split(",") if s.strip()]
        i += 1
    seen, todo = set(), []
    for s in slugs:
        if s not in seen:
            seen.add(s)
            todo.append(s)
    if not todo:
        print("nothing to time")
        return 0
    done = 0
    for s in todo:
        if time_night(s, force):
            done += 1
    print(f"timed {done} of {len(todo)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
