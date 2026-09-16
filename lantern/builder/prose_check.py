#!/usr/bin/env python3
"""Two checks on a page's prose, for the pass that takes the machine-sounding
tics out of the public copy.

  python3 lantern/builder/prose_check.py tags  before.html after.html
      The two files must have the very same sequence of tags and attributes;
      only text between tags may differ. Exit 1 and show the first difference
      otherwise. (The prose pass must never touch structure, scripts or styles.)

  python3 lantern/builder/prose_check.py tells page.html [...]
      Count what is left: long dashes in prose, and "not X, but Y" turns.
"""
import re, sys, html

def tags(src):
    # strip scripts/styles wholesale (their text is not prose), then keep tags only
    src = re.sub(r'<script\b.*?</script>', '<script/>', src, flags=re.S | re.I)
    src = re.sub(r'<style\b.*?</style>', '<style/>', src, flags=re.S | re.I)
    src = re.sub(r'<!--.*?-->', '', src, flags=re.S)
    return re.findall(r'<[^>]+>', src)

def prose(src):
    src = re.sub(r'<script\b.*?</script>', ' ', src, flags=re.S | re.I)
    src = re.sub(r'<style\b.*?</style>', ' ', src, flags=re.S | re.I)
    src = re.sub(r'<!--.*?-->', ' ', src, flags=re.S)
    return html.unescape(re.sub(r'<[^>]+>', ' ', src))

def main():
    mode = sys.argv[1]
    if mode == 'tags':
        a, b = [open(p, encoding='utf-8').read() for p in sys.argv[2:4]]
        ta, tb = tags(a), tags(b)
        norm = lambda t: re.sub(r'\s+', ' ', t.strip())
        for i, (x, y) in enumerate(zip(ta, tb)):
            if norm(x) != norm(y):
                print(f'tag {i} differs:\n  before: {x[:120]}\n  after:  {y[:120]}'); sys.exit(1)
        if len(ta) != len(tb):
            print(f'tag count differs: {len(ta)} before, {len(tb)} after'); sys.exit(1)
        print('structure identical'); return
    if mode == 'tells':
        for p in sys.argv[2:]:
            t = prose(open(p, encoding='utf-8').read())
            dashes = len(re.findall(r'—|– | –|--', t))
            notbut = len(re.findall(r"\b(?:not|n't|never|isn't|aren't|wasn't|doesn't|don't)\b[^.!?\n]{0,70}?[,;]\s*(?:but|it's|it is|they're|rather)\b", t, re.I))
            print(f'{dashes:4d} dashes  {notbut:3d} not-but   {p}')
        return
    print(__doc__)

if __name__ == '__main__':
    main()
