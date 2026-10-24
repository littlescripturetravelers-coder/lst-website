# The quote bank — how it is made and how to refresh it

`bank.json` is every outside voice the Morning Lantern may quote without
fetching anything at build time (THE QUOTES RULE). Each entry is a paragraph
read **verbatim** off its source page by the scripts beside this file, with
the page's own address, the speaker, the talk or sermon title, and theme tags.

- Latter-day Saint edition: General Conference talks (April 2024 through October 2026, the newest last in CONFS),
  read from churchofjesuschrist.org by `build_lds_bank.py`.
- Christian edition: Charles Spurgeon (New Park Street sermons, vol. 1) and John
  Wesley (Sermons, 1872 edition), read from ccel.org by `build_chr_bank.py`.

## Refresh (twice a year, after each General Conference)

From a session that can reach the sources (a claude.ai/code session usually can;
the scheduled nightly run usually cannot — which is exactly why the bank exists):

```
cd lantern/quotes
# 1. add the new conference to CONFS in build_lds_bank.py, e.g. '2026/10'
# 2. fetch the indexes it needs (one file per conference)
for c in 2026/10; do curl -sSL "https://www.churchofjesuschrist.org/study/general-conference/$c?lang=eng" -o idx-$(echo $c | tr / -).html; done
# 3. rebuild both halves and merge
python3 build_lds_bank.py      # -> lds-bank.json
python3 build_chr_bank.py      # -> chr-bank.json
python3 -c "import json; json.dump(json.load(open('lds-bank.json'))+json.load(open('chr-bank.json')), open('bank.json','w'), ensure_ascii=False, indent=1)"
rm -f talk-*.html chr-*.html idx-*.html lds-bank.json chr-bank.json
```

Commit `bank.json`. Nothing else changes: `quotes.py` reads it by theme, and gives every Latter-day Saint card one talk from the newest conference in the bank when one fits the night.

A quicker refresh that keeps the Christian half: run only `build_lds_bank.py`, then join `lds-bank.json` with the bank's entries whose edition is not `lds`.

## Rules
- Never hand-type a quote into the bank. Entries come from the page, by script.
- Never delete the bank to "start fresh" during a nightly run; the nightly run only reads it.
- Themes are the keys in `themes.py`; the night's `THEMES_TONIGHT` in `lds.py` /
  `christian.py` uses the same words.
