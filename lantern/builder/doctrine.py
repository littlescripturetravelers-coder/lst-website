#!/usr/bin/env python3
"""THE DOCTRINE RULE (Levi, 9 Nov 2026): the plainest wrong wordings, by edition. lantern/DOCTRINE.md is the rule;
this only catches what a phrase can show. The nightly writer still reads every teaching sentence against DOCTRINE.md.

    python3 lantern/builder/doctrine.py <morning-lantern-lds.html | morning-lantern-christian.html> ...
    python3 lantern/builder/doctrine.py --test
Exits 1 and prints each sentence when one is found. Story, Traveler, scripture and quotations are left out."""
import html, re, sys

# Latter-day Saint edition: grace that asks nothing of us, or love called unconditional (DOCTRINE.md).
LDS = [
    (r"\b(the savior|jesus|christ|heavenly father|the lord)\s+(does|did|will do)\s+(it all|all the work)\b(?!\s+(the|by|of))|\b(he|the savior|jesus|the lord)\s+(does|did|will do)\s+(it all|all the work|everything)\s+for\s+(us|you)\b", "grace with nothing asked of us"),
    (r"\b(nothing|not a thing)\s+(we|you)\s+(can|could|need to|have to|must)\s+do\b", "grace with nothing asked of us"),
    (r"\byou\s+(don.t|do not)\s+have\s+to\s+do\s+anything\b", "grace with nothing asked of us"),
    (r"\bunconditional(ly)?\s+(love|loves|loved|forgiv\w*)", "Heavenly Father's love is perfect, not 'unconditional' (DOCTRINE.md)"),
    (r"\b(saved|salvation)\s+by\s+(grace|faith)\s+alone\b", "not Latter-day Saint wording"),
    (r"\bone god in three persons\b|\bthe holy trinity\b", "the Godhead is three separate beings"),
    (r"\b(he|the savior|the lord)\s+(softens|will soften|changes)\s+(your|our)\s+(hard\s+)?hearts?\s+for\s+(you|us)\b", "we desire, pray and turn to Him, and He softens the heart"),
]
# Christian edition: grace that is earned, and Latter-day Saint-only teaching.
CHR = [
    (r"\b(earn|earns|earned|earning)\s+(his|god.s|jesus.|the lord.s)\s+(love|grace|forgiveness|favor|mercy)\b", "grace is God's free gift, never earned"),
    (r"\b(earn|earns|earned|earning)\s+(our|your|their)?\s*(salvation|forgiveness|a place in heaven)\b", "salvation is God's free gift, never earned"),
    (r"\bgood enough (to be saved|to be forgiven|for god to love|for jesus to love)\b", "salvation by grace through faith"),
    (r"\bafter all (we|you) can do\b", "a Latter-day Saint phrase (2 Nephi 25:23)"),
    (r"\b(pre-?mortal|premortal|before we were born we lived|heavenly parents|heavenly mother|(our|your|eternal|celestial) exaltation|covenant path|eternal marriage|sealed (in|for) (the )?(eternity|temple))\b", "Latter-day Saint-only teaching"),
    (r"\bholy ghost\b", "say the Holy Spirit"),
]

def prose(h):
    h = re.sub(r"<(script|style)\b[\s\S]*?</\1>", " ", h)
    # leave out what is quoted or verbatim: the story and Traveler cards, quotations, scripture text
    h = re.sub(r'<div class="card card-(story|quote|verse)[\s\S]*?(?=<div class="card )', " ", h)
    h = re.sub(r'<(blockquote|q)\b[\s\S]*?</\1>', " ", h)
    h = re.sub(r'class="(quote-text|verse-text|conf-quote)"[^>]*>[\s\S]*?</div>', ">", h)
    t = html.unescape(re.sub(r"<[^>]+>", " ", h))
    t = re.sub(r"[“\"][^”\"]{0,400}[”\"]", " ", t)          # anything in quotation marks is someone else's words
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", t)) if s.strip()]

def problems(text_or_html, edition):
    rules = LDS if edition == "lds" else CHR
    out, seen = [], set()
    for s in prose(text_or_html):
        for rx, why in rules:
            m = re.search(rx, s, re.I)
            # "we can never earn it", "nothing we do earns it" say the right thing
            if m and re.search(r"\b(never|not|cannot|can.t|don.t|won.t|no one|nobody|isn.t|aren.t|without|nothing)\b[^.]{0,30}$", s[:m.start()], re.I) and "earn" in m.group(0).lower():
                m = None
            if m and (s, why) not in seen:
                seen.add((s, why)); out.append((why, s))
    return out

def _test():
    bad = 0
    cases = [
        ("lds", "<p>He softens your heart for you, so rest tonight.</p>", True),
        ("lds", "<p>As you pray and turn to Him, He softens your heart.</p>", False),
        ("lds", "<p>Heavenly Father's unconditional love is with you.</p>", True),
        ("lds", "<p>There is nothing we can do to earn it, and nothing we need to do.</p>", True),
        ("lds", "<p>The Savior carries our pain, and He knows how to help us.</p>", False),
        ("christian", "<p>We can never earn God's love. It is a gift.</p>", False),
        ("christian", "<p>Try hard tonight so you earn God's forgiveness.</p>", True),
        ("christian", "<p>The Holy Ghost will guide you.</p>", True),
        ("christian", "<p>God gives a new heart as we turn to Him and ask.</p>", False),
        ("christian", '<p>Nephi said, “after all we can do.”</p>', False),
        ("lds", "<p>Beau shouts that he did it all by himself.</p>", False),
        ("lds", "<p>The Savior did it all for us, so we need not try.</p>", True),
        ("christian", "<p>Solomon did not ask what was good enough for God.</p>", False),
    ]
    for ed, h, want in cases:
        got = bool(problems(h, ed))
        if got != want: bad += 1; print("FAIL", ed, h, "found" if got else "missed")
    print(f"{len(cases) - bad} of {len(cases)} doctrine checks pass"); return bad

if __name__ == "__main__":
    if sys.argv[1:] == ["--test"]: sys.exit(1 if _test() else 0)
    n = 0
    for p in sys.argv[1:]:
        ed = "christian" if "christian" in p else "lds"
        for why, s in problems(open(p, encoding="utf-8").read(), ed):
            n += 1; print(f"DOCTRINE  {p}: {why}\n   {s}")
    sys.exit(1 if n else 0)
