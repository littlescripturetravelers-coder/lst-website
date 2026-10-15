#!/usr/bin/env node
/*
  The full-screen story book (Levi, 15 October 2026; first used for November 2026).

  Puts tonight's words (taken word for word from the story PDF) together with the
  month's phone pictures and writes lantern/<slug>/<slug>.html on
  lantern/story-fullscreen-template.html, then opens it in Chromium upright and
  sideways and checks it. Nothing here needs Pillow or any download: pictures are
  shrunk in the Chromium that is already on the machine.

  node lantern/builder/story_fullscreen.js --words words.json --pics <dir> --out lantern/<slug>/<slug>.html
       [--template lantern/story-fullscreen-template.html] [--allow-missing]

  words.json: the night's facts and its pages, in book order. A page that has a
  picture names its slot number in "pic" (1 = A cover ... 7 = G Parent Experience).
    { "id": "ot-b11-w1n1", "night": "Week 1 · Night 1", "title": "...", "reference": "...",
      "storyNumber": 1, "bookTitle": "...", "lullabyUrl": "https://littlescripturetravelers.com/lantern/<slug>/<slug>-lullaby.html",
      "lullabyTitle": "...", "devotionalUrl": "#",
      "beats": [ {"type":"cover","pic":1,"alt":"..."},
                 {"type":"story","pic":2,"text":["...","..."]}, ... , {"type":"end"} ] }
  A page may also carry "focus": [x%, y%] (the spot to keep in view when a picture
  is trimmed to fill the screen; default the middle) and "img": a data: URI of a
  book picture to use when the pictures folder has none for that slot.

  <dir> holds the night's pictures, named the way the month's Image Prompts page
  names them: w1n1-4.png (book), w1n1-4-landscape.png, w1n1-4-portrait.png. Any
  prefix is fine; the slot number and the -landscape / -portrait ending are what
  count. .png, .jpg and .jpeg are all read.
*/
const fs = require('fs');
const path = require('path');

function arg(name, dflt){ const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : dflt; }
const flag = name => process.argv.includes('--' + name);
const ROOT = path.resolve(__dirname, '..', '..');
const WORDS = arg('words'), PICS = arg('pics'), OUT = arg('out');
const TEMPLATE = arg('template', path.join(ROOT, 'lantern', 'story-fullscreen-template.html'));
const FONTS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:ital,wght@0,400;0,700;0,800;1,400&display=swap" rel="stylesheet">'
].join('\n');
const LONG_EDGE = 1500, QUALITY = 0.78;   /* sharper than a phone needs, and a night stays near today's page size */

function fail(msg){ console.error('STORY NOT BUILT: ' + msg); process.exit(2); }
if (!WORDS || !OUT) fail('usage: --words words.json --pics <dir> --out lantern/<slug>/<slug>.html');

const story = JSON.parse(fs.readFileSync(WORDS, 'utf8'));
const tmpl = fs.readFileSync(TEMPLATE, 'utf8');
for (const slot of ['__TITLE__', '__FONTS__', '__STORY__'])
  if (tmpl.split(slot).length !== 2) fail('the template must carry ' + slot + ' exactly once');

/* --- the words: checks that catch a wrong page before a family sees it --- */
for (const k of ['id', 'title', 'reference', 'beats']) if (!story[k]) fail('words.json has no "' + k + '"');
if (story.lullabyUrl && !/^https:\/\/littlescripturetravelers\.com\/lantern\//.test(story.lullabyUrl))
  fail('lullabyUrl must be the FULL address https://littlescripturetravelers.com/lantern/<slug>/<slug>-lullaby.html (a bare name is a 404 inside the app)');
if (story.beats[0].type !== 'cover') fail('the first page must be the cover');
if (story.beats[story.beats.length - 1].type !== 'end') fail('the last page must be {"type":"end"}');
story.beats.forEach((b, i) => {
  if (/feeling moment/i.test(b.heading || '') && b.pic)
    fail('page ' + (i + 1) + ' (A Feeling Moment) must have no picture: its picture goes on Remember This (Levi, 7 Oct 2026)');
  if (b.type !== 'cover' && b.type !== 'end' && !(b.text && b.text.length) && !(b.list && b.list.length))
    fail('page ' + (i + 1) + ' has no words');
});

/* --- the pictures on disk, by slot --- */
const found = {};
if (PICS && fs.existsSync(PICS)) {
  for (const f of fs.readdirSync(PICS)) {
    const m = f.match(/(?:^|[^0-9])([1-7])(?:-(landscape|portrait))?\.(png|jpe?g)$/i);
    if (!m) continue;
    const slot = +m[1], kind = (m[2] || 'book').toLowerCase();
    (found[slot] = found[slot] || {})[kind] = path.join(PICS, f);
  }
}

(async () => {
  const { chromium } = require('/opt/node22/lib/node_modules/playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');

  /* shrink in the browser: never enlarge, keep the shape, JPEG */
  async function shrink(dataUrl){
    return page.evaluate(async ({ src, edge, q }) => {
      const im = new Image(); im.src = src; await im.decode();
      const s = Math.min(1, edge / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h);
      return { src: c.toDataURL('image/jpeg', q), w, h };
    }, { src: dataUrl, edge: LONG_EDGE, q: QUALITY });
  }
  const fileUrl = f => 'data:' + (/\.png$/i.test(f) ? 'image/png' : 'image/jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');

  const missing = [], used = [];
  for (const [i, b] of story.beats.entries()) {
    const focus = b.focus || [50, 50];
    if (b.pic) {
      const have = found[b.pic] || {};
      if (have.landscape) b.wide = Object.assign(await shrink(fileUrl(have.landscape)), { focus: [50, 50] });
      if (have.portrait)  b.tall = Object.assign(await shrink(fileUrl(have.portrait)),  { focus: [50, 50] });
      /* the book picture only fills the shape the phone pictures do not already cover;
         a page with no phone picture at all carries just the book picture, and the
         page fills the other shape from it around its focal point */
      const book = have.book ? fileUrl(have.book) : (b.img || null);
      if (book && (!b.wide || !b.tall)) {
        const p = Object.assign(await shrink(book), { focus });
        if (p.w >= p.h) { if (!b.wide) b.wide = p; }
        else            { if (!b.tall) b.tall = p; }
      }
      if (!b.wide && !b.tall) missing.push('page ' + (i + 1) + ' (slot ' + 'ABCDEFG'[b.pic - 1] + ')');
      used.push((i + 1) + ':' + (have.landscape ? 'W' : '') + (have.portrait ? 'T' : '') + (!have.landscape && !have.portrait && (have.book || b.img) ? 'book' : ''));
    }
    delete b.img; delete b.pic; delete b.focus;
  }
  if (missing.length && !flag('allow-missing')) { await browser.close(); fail('no picture for ' + missing.join(', ') + ' (pass --allow-missing to build those pages with words only)'); }

  const json = JSON.stringify(story).replace(/<\//g, '<\\/');
  const html = tmpl.replace('__TITLE__', () => story.title.replace(/[<&]/g, c => ({ '<': '&lt;', '&': '&amp;' })[c]))
                   .replace('__FONTS__', () => FONTS)
                   .replace('__STORY__', () => json);
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(OUT, html);

  /* --- open it the way a family would: upright and sideways --- */
  const errs = [], report = [];
  for (const [w, h, name] of [[390, 844, 'upright'], [844, 390, 'sideways']]) {
    const p = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto('file://' + path.resolve(OUT));
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload(); await p.waitForTimeout(600);
    const r = await p.evaluate(async () => {
      const out = { dots: document.querySelectorAll('#dots i').length, pages: document.querySelectorAll('.pg').length, blankPictures: [] };
      for (const [i, pg] of [...document.querySelectorAll('.pg')].entries()) {
        const im = pg.querySelector('.pic');
        if (im) { try { await im.decode(); } catch (e) {} if (!im.naturalWidth) out.blankPictures.push(i + 1); }
      }
      goTo(999, true);
      const a = document.querySelector('.pg:last-child a.songlink');
      out.lullaby = a ? a.getAttribute('href') : null;
      return out;
    });
    report.push(name + ' ' + r.pages + ' pages' + (r.blankPictures.length ? ', BLANK PICTURE on ' + r.blankPictures.join(',') : ''));
    if (r.dots !== story.beats.length || r.pages !== story.beats.length) errs.push(name + ': ' + r.pages + ' pages drawn for ' + story.beats.length);
    if (r.blankPictures.length) errs.push(name + ': picture did not show on page ' + r.blankPictures.join(', '));
    if (story.lullabyUrl && r.lullaby !== story.lullabyUrl) errs.push(name + ': the last page has no lullaby button');
    await p.close();
  }
  await browser.close();
  if (/playBtn|els\.play/.test(html)) errs.push('a "Read to me" button is in the page');
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  if (errs.length) { console.error('STORY CHECK FAILED: ' + errs.join(' | ')); process.exit(1); }
  console.log('STORY OK: ' + story.beats.length + ' pages, pictures ' + used.join(' ') + ' (W wide, T tall), ' + kb + ' KB' +
              (missing.length ? ', words only on ' + missing.join(', ') : '') + ' | ' + report.join(' | '));
})().catch(e => { console.error('STORY NOT BUILT: ' + (e && e.stack || e)); process.exit(2); });
