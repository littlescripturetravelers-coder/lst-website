import re, html as H
THEMES = {
 'wisdom': ['wisdom','wise','understanding','knowledge','learn'],
 'seeking': ['seek','search','find','treasure','diligent'],
 'trust': ['trust','rely','lean not','confidence in'],
 'faith': ['faith','believe','belief'],
 'prayer': ['pray','prayer','ask'],
 'scripture': ['scripture','word of god','book of mormon','bible','read the'],
 'family': ['family','families','home','parents','mother','father'],
 'children': ['children','child','little ones','youth'],
 'courage': ['courage','brave','fear not','be strong','afraid'],
 'obedience': ['obey','obedience','commandment','keep his'],
 'gratitude': ['grateful','gratitude','thank'],
 'kindness': ['kind','kindness','gentle','compassion','charity'],
 'patience': ['patience','patient','endure','wait upon'],
 'humility': ['humble','humility','meek'],
 'forgiveness': ['forgive','forgiveness','mercy','repent'],
 'hope': ['hope'],
 'peace': ['peace','calm','rest'],
 'love': ['love','loved','loving'],
 'service': ['serve','service','minister','lift'],
 'covenant': ['covenant','temple','ordinance'],
 'holyghost': ['holy ghost','spirit','revelation','still small'],
 'jesus': ['jesus christ','savior','redeemer','atonement'],
 'joy': ['joy','rejoice','happiness','happy'],
 'work': ['work','labor','diligence'],
 'honesty': ['honest','truth','integrity'],
 'light': ['light','lantern','lamp','darkness'],
 'creation': ['creation','created','earth','nature','beauty'],
 'praise': ['praise','worship','sing'],
}
def clean(s):
    s = re.sub(r'<sup[^>]*>.*?</sup>', '', s, flags=re.S)
    s = re.sub(r'<[^>]+>', '', s)
    s = H.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

NARRATIVE = re.compile(r"\b(my wife|my husband|my son|my daughter|my mother|my father|my grand(?:father|mother|children|son|daughter)|my (?:dear )?friend|years ago|when I was|I remember|I was|I had|I have a|we were|our family|last (?:week|month|year)|recently|one day|as a (?:boy|girl|young))\b", re.I)
FLOW_START = re.compile(r"^(The next|Another|Secondly|Thirdly|Now,|But |And |So |Then |There is another|This |That |These |Those |It is|Here |Again|Also|Finally|Lastly|First,|Second,|Third,)", re.I)
def standalone(p):
    """A paragraph that reads on its own: no personal story, no mid-argument opener,
    not a scripture header, quotation marks balanced, ends as a sentence."""
    p = p.strip()
    if NARRATIVE.search(p): return False
    if FLOW_START.match(p): return False
    # an opener that leans on what came before it ("I acknowledge these feelings",
    # "That is why...") does not stand alone
    if re.match(r"^(\S+\s+){0,5}(these|those|this|that|such|it|they|them|he|she|his|her|there)\b", p, re.I): return False
    # a footnote, not a paragraph: starts with a reference or "See", or cites a magazine issue
    if re.match(r"^(See |Cf\. |[1-3]?\s?[A-Z][a-z]+\.? \d+:\d+)", p): return False
    if re.search(r"\b(Liahona|Ensign),? \w*\.? ?\d{4}, \d+", p): return False
    if re.match(r"^(In addition|Additionally|Furthermore|Moreover|Also,|Second|Third|Next,|Then,|Finally)", p, re.I): return False
    if re.match(r"^(In (?:other words|short|the same way|this|that)|As |Like |Likewise|Similarly|For example|Of course|Yes,|No,|Indeed|Still,|Yet |However|Nevertheless|Instead|Rather|Even so|Otherwise|Therefore|Thus|Hence)", p, re.I): return False
    if p.startswith(("\u201c", '"')) and re.search(r"[\u2014-]\s*[1-3]?\s?[A-Z][a-z]+\s+\d+:\d+", p): return False   # a verse header
    if p.count("\u201c") != p.count("\u201d"): return False
    if not re.search(r"[.!?][\u201d\")]*$", p): return False
    if re.search(r"\b(I|me)\b", p) and len(re.findall(r"\bI\b", p)) > 2: return False
    return True
