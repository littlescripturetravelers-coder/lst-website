"""links.py - scripture links that need no network (THE LINKS RULE).

Every scripture reference in a night's words becomes a link, made from the
reference itself:  churchofjesuschrist.org for the Latter-day Saint edition
(KJV + Book of Mormon, D&C, Pearl of Great Price), BibleGateway (NIV) for the
Christian edition.  Nothing here fetches anything, so a build cannot lose its
links to a proxy that refuses the source domains - which is how the 10
September night shipped with none.

    from links import linkify
    html = linkify(html, 'lds')        # or 'christian'
"""
import re
from urllib.parse import quote

# name -> (churchofjesuschrist.org path, is it in the Bible)
BOOKS = {
    # Old Testament
    'Genesis': ('ot/gen', 1), 'Exodus': ('ot/ex', 1), 'Leviticus': ('ot/lev', 1), 'Numbers': ('ot/num', 1),
    'Deuteronomy': ('ot/deut', 1), 'Joshua': ('ot/josh', 1), 'Judges': ('ot/judg', 1), 'Ruth': ('ot/ruth', 1),
    '1 Samuel': ('ot/1-sam', 1), '2 Samuel': ('ot/2-sam', 1), '1 Kings': ('ot/1-kgs', 1), '2 Kings': ('ot/2-kgs', 1),
    '1 Chronicles': ('ot/1-chr', 1), '2 Chronicles': ('ot/2-chr', 1), 'Ezra': ('ot/ezra', 1), 'Nehemiah': ('ot/neh', 1),
    'Esther': ('ot/esth', 1), 'Job': ('ot/job', 1), 'Psalm': ('ot/ps', 1), 'Psalms': ('ot/ps', 1),
    'Proverbs': ('ot/prov', 1), 'Ecclesiastes': ('ot/eccl', 1), 'Song of Solomon': ('ot/song', 1),
    'Isaiah': ('ot/isa', 1), 'Jeremiah': ('ot/jer', 1), 'Lamentations': ('ot/lam', 1), 'Ezekiel': ('ot/ezek', 1),
    'Daniel': ('ot/dan', 1), 'Hosea': ('ot/hosea', 1), 'Joel': ('ot/joel', 1), 'Amos': ('ot/amos', 1),
    'Obadiah': ('ot/obad', 1), 'Jonah': ('ot/jonah', 1), 'Micah': ('ot/micah', 1), 'Nahum': ('ot/nahum', 1),
    'Habakkuk': ('ot/hab', 1), 'Zephaniah': ('ot/zeph', 1), 'Haggai': ('ot/hag', 1), 'Zechariah': ('ot/zech', 1),
    'Malachi': ('ot/mal', 1),
    # New Testament
    'Matthew': ('nt/matt', 1), 'Mark': ('nt/mark', 1), 'Luke': ('nt/luke', 1), 'John': ('nt/john', 1),
    'Acts': ('nt/acts', 1), 'Romans': ('nt/rom', 1), '1 Corinthians': ('nt/1-cor', 1), '2 Corinthians': ('nt/2-cor', 1),
    'Galatians': ('nt/gal', 1), 'Ephesians': ('nt/eph', 1), 'Philippians': ('nt/philip', 1), 'Colossians': ('nt/col', 1),
    '1 Thessalonians': ('nt/1-thes', 1), '2 Thessalonians': ('nt/2-thes', 1), '1 Timothy': ('nt/1-tim', 1),
    '2 Timothy': ('nt/2-tim', 1), 'Titus': ('nt/titus', 1), 'Philemon': ('nt/philem', 1), 'Hebrews': ('nt/heb', 1),
    'James': ('nt/james', 1), '1 Peter': ('nt/1-pet', 1), '2 Peter': ('nt/2-pet', 1), '1 John': ('nt/1-jn', 1),
    '2 John': ('nt/2-jn', 1), '3 John': ('nt/3-jn', 1), 'Jude': ('nt/jude', 1), 'Revelation': ('nt/rev', 1),
    # Book of Mormon
    '1 Nephi': ('bofm/1-ne', 0), '2 Nephi': ('bofm/2-ne', 0), 'Jacob': ('bofm/jacob', 0), 'Enos': ('bofm/enos', 0),
    'Jarom': ('bofm/jarom', 0), 'Omni': ('bofm/omni', 0), 'Words of Mormon': ('bofm/w-of-m', 0),
    'Mosiah': ('bofm/mosiah', 0), 'Alma': ('bofm/alma', 0), 'Helaman': ('bofm/hel', 0), '3 Nephi': ('bofm/3-ne', 0),
    '4 Nephi': ('bofm/4-ne', 0), 'Mormon': ('bofm/morm', 0), 'Ether': ('bofm/ether', 0), 'Moroni': ('bofm/moro', 0),
    # Doctrine and Covenants, Pearl of Great Price
    'Doctrine and Covenants': ('dc-testament/dc', 0), 'D&C': ('dc-testament/dc', 0), 'D&amp;C': ('dc-testament/dc', 0),
    'Moses': ('pgp/moses', 0), 'Abraham': ('pgp/abr', 0), 'Joseph Smith—History': ('pgp/js-h', 0),
    'Joseph Smith&mdash;History': ('pgp/js-h', 0), 'Articles of Faith': ('pgp/a-of-f', 0),
}
_names = sorted(BOOKS.keys(), key=len, reverse=True)
_BOOK_RE = '|'.join(re.escape(n) for n in _names)
# "Proverbs 2:4-5", "Proverbs 2:4&ndash;5", "Psalm 40:3", "D&C 121:45", "Alma 37:37"
REF_RE = re.compile(r'(?<![\w/])(' + _BOOK_RE + r')\s+(\d{1,3}):(\d{1,3})((?:\s*(?:-|&ndash;|&#8211;|–)\s*)(\d{1,3}))?(?![\d:])')

def scripture_url(book, chapter, v1, v2, edition):
    path, in_bible = BOOKS[book]
    if edition == 'christian':
        if not in_bible:
            return ''
        name = 'Psalm' if book in ('Psalm', 'Psalms') else book
        ref = f'{name} {chapter}:{v1}' + (f'-{v2}' if v2 else '')
        return 'https://www.biblegateway.com/passage/?search=' + quote(ref) + '&version=NIV'
    anchor = f'id=p{v1}' + (f'-p{v2}' if v2 else '') + f'#p{v1}'
    return f'https://www.churchofjesuschrist.org/study/scriptures/{path}/{chapter}?lang=eng&{anchor}'

_LINK_STYLE = 'color:var(--amber);text-decoration:none;border-bottom:1px dotted currentColor;'

def _link_text(text, edition):
    def sub(m):
        book, ch, v1, _, v2 = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
        url = scripture_url(book, ch, v1, v2, edition)
        if not url:
            return m.group(0)
        return f'<a href="{url}" target="_blank" style="{_LINK_STYLE}">{m.group(0)}</a>'
    return REF_RE.sub(sub, text)

# Regions that must not be touched: existing links, scripts, styles, the <title>,
# and every tag itself (attributes).
_SKIP = re.compile(r'(<a\b[^>]*>.*?</a>|<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<title>.*?</title>|<[^>]+>)', re.S | re.I)

def linkify(html, edition):
    """Wrap every bare scripture reference in the page's text in a link."""
    out, pos = [], 0
    for m in _SKIP.finditer(html):
        out.append(_link_text(html[pos:m.start()], edition))
        out.append(m.group(0))
        pos = m.end()
    out.append(_link_text(html[pos:], edition))
    return ''.join(out)

def count_links(html):
    return len(re.findall(r'<a\b[^>]*href="https?://', html))

if __name__ == '__main__':
    import sys
    p, ed = sys.argv[1], sys.argv[2]
    h = open(p, encoding='utf-8').read()
    before = count_links(h)
    h2 = linkify(h, ed)
    print(f'{p}: {before} -> {count_links(h2)} outbound links')
    if len(sys.argv) > 3 and sys.argv[3] == '--write':
        open(p, 'w', encoding='utf-8').write(h2)
