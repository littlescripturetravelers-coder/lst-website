# The month's story words, for the nightly run

When Drive does not have a month's `{MONTH}_Nightly_Index` sheet or a night's story PDF in
"Lantern Stories", the nightly run (lantern/NIGHTLY-RUN.md, inputs 1 and 2) reads them here instead:

    lantern/book-text/<mon>/index.json      the index sheet's columns, one row per night
    lantern/book-text/<mon>/Story-NN_...txt  that night's five printed pages, word for word

The text is poppler's layout text of each night's five pages, cut from the print interior
(`pdftotext -layout`, one `=== page N ===` block per page, running footers dropped). The book's
display face loses its ll/tt in the PDF ("Wi ow"); the headings and Traveler names here are put back.
The same nights as PDFs are in lst-app www/stories/pdf/<mon>/ (served at
app.littlescripturetravelers.com/stories/pdf/<mon>/).

November 2026 (Morning by Morning, 35 nights) was added on 21 Oct 2026.
