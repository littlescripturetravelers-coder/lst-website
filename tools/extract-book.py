# -*- coding: utf-8 -*-
"""Pull a month's book out of the app's pages and into the website's own shape.

The app chat writes one HTML page per night (lst-app/www/stories/aug-NN-*.html).
Each carries a `STORY = {...}` object — the very same shape data/sample-night.js
has, which js/lst-read.js already renders in the website's type.

So the website does NOT copy those pages. It takes the words and the pictures
out of them and reads them the way it reads everything else, which is what Levi
asked for: "match the writing and everything on the website ... just like the
morning lanterns looks."

The pictures come out as real .jpg files rather than base64 inside a data file,
because a browser can cache a file and cannot cache a string.

  python3 tools/extract-book.py <app-stories-dir> <month> <book-number>

Writes  data/book-<month>.js  and  images/book/<month>-NN-b*.jpg
"""
import io, json, os, re, sys, base64, hashlib

def literal_after(src, name):
    """The STORY object, read by balancing braces and skipping strings."""
    i = src.index(name)
    i = src.index("{", i)
    d, j, instr = 0, i, None
    while j < len(src):
        c = src[j]
        if instr:
            if c == "\\":
                j += 2; continue
            if c == instr: instr = None
        elif c in "\"'": instr = c
        elif c == "{": d += 1
        elif c == "}":
            d -= 1
            if d == 0: break
        j += 1
    return json.loads(src[i:j + 1])

def main(srcdir, month, booknum):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    imgdir = os.path.join(root, "images", "book")
    os.makedirs(imgdir, exist_ok=True)
    files = sorted(f for f in os.listdir(srcdir)
                   if re.match(r"^%s-\d\d-" % month[:3], f) and f.endswith(".html"))
    if not files:
        sys.exit("no night pages found in " + srcdir)

    out, seen_img, total, saved = [], {}, 0, 0
    for f in files:
        src = io.open(os.path.join(srcdir, f), encoding="utf-8").read()
        st = literal_after(src, "STORY")
        beats = []
        for n, b in enumerate(st.get("beats", [])):
            img = b.get("img") or ""
            path = ""
            if img.startswith("data:image/"):
                head, b64 = img.split(",", 1)
                ext = "jpg" if "jpeg" in head or "jpg" in head else \
                      ("png" if "png" in head else "webp")
                raw = base64.b64decode(b64)
                total += len(raw)
                key = hashlib.sha1(raw).hexdigest()
                if key in seen_img:              # a cover reused across nights
                    path = seen_img[key]
                else:
                    name = "%s-%s-%d.%s" % (month[:3], f.split("-")[1], n, ext)
                    io.open(os.path.join(imgdir, name), "wb").write(raw)
                    path = "images/book/" + name
                    seen_img[key] = path
                    saved += len(raw)
            elif img:
                path = img
            beat = {"type": b.get("type") or "story"}
            if path: beat["img"] = path
            if b.get("alt"): beat["alt"] = b["alt"]
            if b.get("text"): beat["text"] = b["text"]
            if b.get("eyebrow"): beat["eyebrow"] = b["eyebrow"]
            if b.get("heading"): beat["heading"] = b["heading"]
            beats.append(beat)
        out.append({
            "appId": st.get("id", ""),
            "night": st.get("night", ""),
            "title": st.get("title", ""),
            "reference": st.get("reference", ""),
            "storyNumber": st.get("storyNumber"),
            "beats": beats,
        })

    # the website's own catalog id, matched on week/night — never guessed
    for s in out:
        m = re.search(r"w(\d+)n(\d+)", s["appId"] or "")
        if not m:
            m = re.search(r"Week\s*(\d+).*?Night\s*(\d+)", s["night"] or "")
        if not m:
            sys.exit("cannot read week/night from " + repr(s["appId"] or s["night"]))
        s["id"] = "b%s-w%s-n%s" % (booknum, int(m.group(1)), int(m.group(2)))

    body = ",\n".join("  " + json.dumps(s, ensure_ascii=False) for s in out)
    doc = (
        "/* %s — the book, in the website's own shape.\n\n"
        "   EXTRACTED, NOT WRITTEN BY HAND. Rebuild it with:\n"
        "     python3 tools/extract-book.py ../lst-app/www/stories %s %s\n\n"
        "   The words and the pictures came out of the app's own night pages, so\n"
        "   there is one source of truth and it is the app's. The pictures are real\n"
        "   files under images/book/ rather than base64 in here, because a browser\n"
        "   can cache a file and cannot cache a string.\n\n"
        "   Rendered by js/lst-read.js, the same reader that draws the Morning\n"
        "   Lantern and the free sample, so a night of the book reads like every\n"
        "   other page on this website.\n"
        "*/\n"
        "window.LST_BOOK_%s = [\n%s\n];\n"
    ) % (month.title(), month, booknum, month.upper(), body)
    io.open(os.path.join(root, "data", "book-%s.js" % month), "w", encoding="utf-8").write(doc)

    print("nights   : %d" % len(out))
    print("pictures : %d unique (%.1f MB in the pages -> %.1f MB on disk)"
          % (len(seen_img), total / 1048576.0, saved / 1048576.0))
    print("data file: data/book-%s.js  (%.0f KB)"
          % (month, os.path.getsize(os.path.join(root, "data", "book-%s.js" % month)) / 1024.0))

if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2].lower(), sys.argv[3])
