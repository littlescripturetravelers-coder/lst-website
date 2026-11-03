#!/usr/bin/env python3
"""THE SUNG-WORDS RULE (Levi, 3 Nov 2026: "Write It on My Heart pronounces live wrong. Please always make sure
all words are pronounced correctly in these songs").

The singer reads the words the way a stranger would. A word spelled one way and said two ways ("Your good way
lives in me" came out "lyves", like the lives of cats), or a Bible name it has never heard ("Job" sung as a day's
work), is sung wrong. So the lines the SINGER is given are spelled the way they are said; the words on the page,
in the Transcript and in the book stay exactly as written. The take is still checked against the page's words.

    python3 lantern/builder/sing_words.py --test          # the checks
    python3 lantern/builder/sing_words.py path/lullaby.json   # show what a song's singer will be given

Every rule looks at the words beside it, so it changes only the meaning that is said the other way:
  live / lives   the verb ("lives in me", "learned to live", "Long live the king") is "liv"; the lives we have
                 ("our lives") and a live coal (Isaiah 6) stay as they are.
  bow            a rainbow or an archer's bow ("the bow is there", "his bow") is "boh"; to bow down is "bough".
  winds          a path that winds up a hill is "wynds"; the wind that blows stays as it is.
  names          the names a singer guesses at, spelled as they are said (Job, Nephi, Mordecai ...).
"""
import json, re, sys

# Words before a noun: after one of these, "lives" is the lives we have and "bow" is a bow you hold.
_DET = {"a", "an", "the", "my", "our", "your", "his", "her", "their", "its", "whose", "these", "those", "all",
        "many", "two", "three", "nine", "both", "new", "whole", "little", "busy", "long", "happy", "own"}
_LIVE_ADJ_NEXT = {"coal", "coals", "ember", "embers", "wire", "fire", "oak"}   # a live coal: the other "live"
_WIND_VERB_NEXT = {"up", "down", "around", "round", "along", "through", "away", "its", "her", "his", "their", "a", "the"}

# Names a singer guesses at, as they are said. The commonly known ones (Isaiah, Jeremiah, Moses ...) are left alone.
NAMES = {
    "Job": "Jobe", "Nephi": "Nee-fye", "Lehi": "Lee-hye", "Moroni": "Mo-roh-nye", "Mosiah": "Mo-sye-uh",
    "Sariah": "Suh-rye-uh", "Laman": "Lay-mun", "Lamanites": "Lay-muh-nites", "Nephites": "Nee-fites",
    "Abinadi": "Uh-bin-uh-dye", "Teancum": "Tee-an-kum", "Cumorah": "Kuh-mor-uh", "Enos": "Ee-nus",
    "Jarom": "Jair-um", "Liahona": "Lee-uh-hoh-nuh", "Zarahemla": "Zair-uh-hem-luh", "Korihor": "Kor-ih-hor",
    "Haman": "Hay-mun", "Mordecai": "Mor-duh-kye", "Asa": "Ay-suh", "Nabal": "Nay-bul", "Naaman": "Nay-uh-mun",
    "Baruch": "Bair-uk", "Uzziah": "Yuh-zye-uh", "Haggai": "Hag-eye", "Habakkuk": "Huh-bak-uk",
    "Nahum": "Nay-hum", "Hosea": "Ho-zay-uh", "Malachi": "Mal-uh-kye", "Zephaniah": "Zef-uh-nye-uh",
    "Boaz": "Boh-az", "Ebed-melech": "Ee-bed-mee-lek",
    "Peninnah": "Peh-nin-uh", "Meshach": "Mee-shak",
    "Abednego": "Uh-bed-nee-go", "Nineveh": "Nin-uh-vuh",
    "Zacchaeus": "Zak-ee-us", "Bartimaeus": "Bar-tih-mee-us",
    "Jairus": "Jye-rus", "Gethsemane": "Geth-sem-uh-nee", "Golgotha": "Gol-guh-thuh", "Capernaum": "Kuh-per-nay-um",
}

_TOKEN = re.compile(r"[A-Za-z][A-Za-z'’-]*|[^A-Za-z]+")

def _bare(t):
    return re.sub(r"[’']s$", "", t).lower()

def _case(src, new):
    """Keep a capital at the start of a line, or a word written in capitals."""
    if src.isupper() and len(src) > 1: return new.upper()
    if src[:1].isupper(): return new[:1].upper() + new[1:]
    return new

def sing_line(line):
    """The line as the singer should be given it. The meaning is the same; only the spelling says it."""
    toks = _TOKEN.findall(line)
    words = [i for i, t in enumerate(toks) if t[:1].isalpha()]
    out = list(toks)
    for n, i in enumerate(words):
        t = toks[i]; low = t.lower()
        prev = _bare(toks[words[n - 1]]) if n > 0 else ""
        nxt = _bare(toks[words[n + 1]]) if n + 1 < len(words) else ""
        poss = re.search(r"[’']s$", t)
        root = re.sub(r"[’']s$", "", t)
        if root in NAMES and not (root == "Job" and nxt in {"well", "done"}):
            out[i] = NAMES[root] + (t[len(root):] if poss else "")
            continue
        if low == "lives":
            if prev not in _DET: out[i] = _case(t, "livs")
        elif low == "live":
            if nxt not in _LIVE_ADJ_NEXT: out[i] = _case(t, "liv")
        elif low == "bow":
            out[i] = _case(t, "boh" if prev in _DET else "bough")
        elif low == "bows":
            out[i] = _case(t, "bohs" if prev in _DET else "boughs")
        elif low == "winds":
            if nxt in _WIND_VERB_NEXT and prev not in _DET: out[i] = _case(t, "wynds")
    return "".join(out)

def sing_lyrics(text):
    """A whole song: [Verse]/[Chorus] labels kept, every line spelled for the singer."""
    return "\n".join(l if l.strip().startswith("[") else sing_line(l) for l in text.split("\n"))

def changes(text):
    """[(as written, as the singer is given it)] for every line that is spelled differently."""
    return [(l, sing_line(l)) for l in text.split("\n") if l.strip() and not l.strip().startswith("[") and sing_line(l) != l]

def _test():
    cases = [
        ("Your good way lives in me.", "Your good way livs in me."),
        ('I know that my Redeemer lives,"', 'I know that my Redeemer livs,"'),
        ("The One who lives above the sky", "The One who livs above the sky"),
        ("He gave us all our lives to share", "He gave us all our lives to share"),
        ("And learned to live God's way.", "And learned to liv God's way."),
        ('"Long live the king!" they cry.', '"Long liv the king!" they cry.'),
        ("He touched my lips with a live coal,", "He touched my lips with a live coal,"),
        ("But look, the bow is there.", "But look, the boh is there."),
        ("He gave his robe, his sword, his bow,", "He gave his robe, his sword, his boh,"),
        ("To bow when he walked by.", "To bough when he walked by."),
        ("The path winds up a great big hill,", "The path wynds up a great big hill,"),
        ("The winds were cold and gray;", "The winds were cold and gray;"),
        ('"I trust You," Job said humbly then,', '"I trust You," Jobe said humbly then,'),
        ("A long, long time they stayed with Job,", "A long, long time they stayed with Jobe,"),
        ("Then Mordecai sent Esther word:", "Then Mor-duh-kye sent Esther word:"),
        ("Nephi's brothers would not go,", "Nee-fye's brothers would not go,"),
        ("Come close! Her fear had passed.", "Come close! Her fear had passed."),
        ("And He will dry your tears.", "And He will dry your tears."),
        ("Isaiah came with happy news", "Isaiah came with happy news"),
    ]
    bad = 0
    for a, want in cases:
        got = sing_line(a)
        if got != want: bad += 1; print(f"FAIL  {a!r}\n   got  {got!r}\n   want {want!r}")
    song = "[Chorus]\nOh, write it on my heart, dear Lord,\nYour good way lives in me.\n\n[Chorus]"
    if sing_lyrics(song) != "[Chorus]\nOh, write it on my heart, dear Lord,\nYour good way livs in me.\n\n[Chorus]":
        bad += 1; print("FAIL  sing_lyrics keeps the labels and spells the lines")
    print(f"{len(cases) + 1 - bad} of {len(cases) + 1} sung-word checks pass")
    return bad

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test": sys.exit(1 if _test() else 0)
    for p in sys.argv[1:]:
        lyr = json.load(open(p, encoding="utf-8")).get("lyrics", "")
        ch = changes(lyr)
        print(f"{p}: {len(ch)} line(s) spelled for the singer")
        for a, b in ch: print(f"   {a}\n -> {b}")
