#!/usr/bin/env python3
"""Write a book's pictures out of the app's story pages into images/book/.

    python3 extract-night-pictures.py /path/to/www/stories oct

Each picture is saved as images/book/<slug>-<beat index>.jpg, the names
tools/sync-book-nights.py looks for; the beat's index 0 is the cover the shut
page may show to anyone. Run this once per book, commit the pictures, then run
the Book nights workflow to put the words in the database.
"""
import base64, json, os, re, sys
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(SITE, "images", "book")

def main(srcdir, mon):
    os.makedirs(IMG, exist_ok=True)
    files = sorted(f for f in os.listdir(srcdir) if re.match(r"^%s-\d\d-" % mon, f) and f.endswith(".html"))
    if not files: sys.exit("no %s-NN-*.html pages in %s" % (mon, srcdir))
    n = 0
    for name in files:
        src = open(os.path.join(srcdir, name), encoding="utf-8", errors="ignore").read()
        st = json.loads(re.search(r"const STORY\s*=\s*(\{.*?\n\});", src, re.S).group(1))
        slug = "-".join(name.split("-")[:2])
        for i, b in enumerate(st.get("beats", [])):
            img = b.get("img") or ""
            if not img.startswith("data:image/"): continue
            head, b64 = img.split(",", 1)
            ext = "jpg" if ("jpeg" in head or "jpg" in head) else "png"
            open(os.path.join(IMG, "%s-%d.%s" % (slug, i, ext)), "wb").write(base64.b64decode(b64)); n += 1
    print("%d pictures from %d nights into images/book/" % (n, len(files)))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
