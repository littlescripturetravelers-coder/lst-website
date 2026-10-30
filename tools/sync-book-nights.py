#!/usr/bin/env python3
"""
Rebuild book_nights.beats from the app's own story pages.

WHY THIS EXISTS
    The first extraction (tools/extract-book.py) only kept `text`, so it quietly
    dropped every Parent Experience list (119 of them), every Five Stones block
    (63) and every forParent flag (238). The website has been showing a blank
    Parent Experience page ever since; the old scrolling reader hid it by
    skipping beats with no words, so nobody saw it.

    This reads the WHOLE beat, every key, so the website holds what the app
    holds. It reads lst-app and never writes to it.

THE PICTURES
    The app embeds each illustration as a base64 data URI. The website cannot
    carry those - they are megabytes each and would put the artwork in a public
    file. tools/extract-book.py already wrote them out as real jpgs under
    images/book/<slug>-<beat index>.jpg, so this swaps each data URI for that
    path and refuses to invent one that is not on disk.

OUTPUT
    scratchpad/beats.json  ->  { "<website id>": [ ...beats... ] }
    Apply it with tools/apply-book-nights.py, which is the only thing that
    touches the database.
"""
import json, os, re, sys, collections

APP  = os.environ.get("LST_APP_STORIES") or "/home/user/lst-app/www/stories"
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG  = os.path.join(SITE, "images", "book")
# a book is numbered by its month (June was the first, book 6)
MONTH = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
         "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}
# the New Testament year (2027) is books 13-24, its pages njan-01-..., nfeb-01-... (Levi, 29 Oct 2026)
MONTH.update({"n" + k: v + 12 for k, v in list(MONTH.items())})
KEEP = ("type", "img", "alt", "focus", "eyebrow", "heading",
        "text", "stones", "list", "forParent")

DATA_URI = re.compile(r'data:[a-zA-Z0-9/+.-]+;base64,[A-Za-z0-9+/=\s]+')


def story_of(path):
    src = open(path, encoding="utf-8", errors="ignore").read()
    m = re.search(r'const STORY\s*=\s*(\{.*?\n\});', src, re.S)
    if not m:
        return None
    return json.loads(DATA_URI.sub("__IMG__", m.group(1)))


def main():
    out, notes = {}, []
    missing_img = 0
    files = sorted(f for f in os.listdir(APP)
                   if f.endswith(".html") and f.split("-")[0] in MONTH and re.match(r"[a-z]{3,4}-\d\d-", f))
    for name in files:
        slug = "-".join(name.split("-")[:2])          # sep-08
        book = MONTH[name.split("-")[0]]
        o = story_of(os.path.join(APP, name))
        if not o:
            notes.append(f"{name}: no STORY object"); continue

        beats = []
        for i, b in enumerate(o.get("beats", [])):
            nb = {}
            for k in KEEP:
                v = b.get(k)
                if v in (None, "", [], {}):
                    continue
                if k == "img":
                    rel = f"images/book/{slug}-{i}.jpg"
                    if not os.path.exists(os.path.join(SITE, rel)):
                        missing_img += 1
                        notes.append(f"{name} beat {i}: no picture at {rel}")
                        continue
                    v = rel
                nb[k] = v
            beats.append(nb)

        # ⚠️ THE FEELING MOMENT STANDS ALONE (Levi, 9 Sep 2026)
        # On the website the Feeling Moment is the page where a family stops and
        # DOES something together, so it carries no picture; its illustration
        # belongs to Remember This, which had none. The app's older story files
        # still have it the other way round, so without this a re-sync would
        # quietly put it back. Levi's newer story pages already agree with this.
        pic = {}
        for b in beats:
            if b.get("heading") == "A Feeling Moment":
                for k in ("img", "alt", "focus"):
                    if k in b:
                        pic[k] = b.pop(k)
        if pic.get("img"):          # a words-only night (pictures still coming) has none to move
            for b in beats:
                if b.get("heading") == "Remember This" and "img" not in b:
                    b["img"] = pic["img"]
                    b["alt"] = "Illustration for tonight's Remember This moment"
                    if "focus" in pic:
                        b["focus"] = pic["focus"]

        out[(book, o.get("night"))] = {
            "book": book, "night": o.get("night"), "title": o.get("title"),
            "reference": o.get("reference"), "beats": beats, "source": name,
        }

    # the shapes we are restoring, counted so the change can be checked
    tally = collections.Counter()
    for v in out.values():
        for b in v["beats"]:
            for k in ("stones", "list", "forParent", "focus"):
                if k in b:
                    tally[k] += 1

    print(f"nights read      : {len(out)}")
    print(f"pictures missing : {missing_img}")
    print("restoring        : " + ", ".join(f"{k}={n}" for k, n in sorted(tally.items())))
    if notes:
        print("\nnotes:")
        for n in notes[:20]:
            print("  " + n)
        if len(notes) > 20:
            print(f"  ... and {len(notes)-20} more")

    dest = sys.argv[1] if len(sys.argv) > 1 else "beats.json"
    with open(dest, "w", encoding="utf-8") as fh:
        json.dump([{"book": k[0], "night": k[1], **v} for k, v in out.items()],
                  fh, ensure_ascii=False, indent=1)
    print(f"\nwrote {dest}")


if __name__ == "__main__":
    main()
