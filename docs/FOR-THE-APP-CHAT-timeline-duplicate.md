# For the app chat — one small bug in `www/timeline.html`

Not urgent, and nothing is visibly broken. But it is the kind of thing that
bites later, and it has now happened twice.

## What it is

`www/timeline.html` declares `PROPHECIES` **twice**:

```
line 2545   var PROPHECIES=[ ...12 pairs... ];
line 2644   var PROPHECIES=[ ...12 pairs... ];
```

Two `var` declarations of the same name in one file is not an error in
JavaScript. The later one simply wins. So the first block is dead code that
never runs — and it disagrees with the second one:

| | first block (dead) | second block (the one that runs) |
|---|---|---|
| Malachi's prophecy year | `y:-600` | `y:-430` |
| its own description says | "Written c. 430 BC" | "Written c. 430 BC" |

The dead block contradicts itself. Nobody sees it today. But the moment
somebody reorders these blocks, or copies the first one thinking it is the
live one, the timeline starts telling families that Malachi prophesied in
600 BC when the same card says he wrote it in 430 BC.

## The fix

Delete the **first** block — lines 2545 to 2643, from `var PROPHECIES=[`
through the `];` that closes it. Keep the second. Nothing else changes,
because nothing else was ever using the first one.

Leaving a note in its place is worth doing, so this does not come back a
third time:

```js
// NOTE FOR WHOEVER EDITS THIS NEXT
// An older PROPHECIES list used to sit here, ahead of the one below.
// Two `var PROPHECIES=[...]` in one file is not an error in JavaScript:
// the later one silently wins, so the earlier block was dead code that
// still dated Malachi to 600 BC while its own text said "written c. 430
// BC". It has been removed. Keep exactly one list.
```

## Why the website is telling you

The website's Sacred World Timeline is built from this same file. It has
been fixed on the website side already (`timeline-explore.html`), which is
where the duplicate was spotted — for the second time. The same defect was
found and fixed in the v6 upload back in August, and it came back.

If the two files are ever going to stay in step, the app is the one that
needs the fix, because the app is where the file is written.
