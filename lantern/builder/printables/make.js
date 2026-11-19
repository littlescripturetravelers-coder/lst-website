#!/usr/bin/env node
/* THE PRINTABLES (Levi, 19 Nov 2026: "redo the part in the app and website so the printables are different",
   with his Printables Design Prompt and Developer Printables Library Prompt; the coloring books are left out
   for now, Levi: "drop the coloring pictures for now").

   Makes, in the storybook design (page.html), US Letter PDFs and a small cover picture for each:
     - every night's Story (both editions: the Christian one reads "God" for "Heavenly Father"),
       lantern/<slug>/printables/story.pdf, story-christian.pdf (only when the words differ), story.jpg
     - every night's Song (the words of its lullaby.json), lantern/<slug>/printables/song.pdf, song.jpg
     - the Lantern Lullaby, Old and New Testament, print/lullaby-ot.pdf, print/lullaby-nt.pdf
   and the list families browse, data/printables.json (read by printables.html and the app's Printables page).

   A printable is made again only when what it is made from changes (its `src` hash), and its address
   carries ?v=<hash> so no one is handed an old copy. A story with no Five Stones is NOT made: it is listed
   under "warnings" for the owner instead.

   node lantern/builder/printables/make.js [--all] [--only <slug>[,<slug>]]
   Needs Playwright with Chromium (the Action installs it). */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const LAN = path.join(ROOT, 'lantern'), OUT_INDEX = path.join(ROOT, 'data', 'printables.json');
const PAGE = path.join(__dirname, 'page.html');
const LULLABY_PAGE = path.join(__dirname, 'lullaby.html');   // the Lantern Lullaby's own one-page design (Levi's Canva sheet, 19 Nov 2026)
const VERSION = '1';
/* THE FREE PRINTABLES (Levi, 19 Nov 2026: "make it so the free samples they can print so they can test out if they like
   that too"): anyone may open these; every other printable is handed out only by the `printable` edge function to a
   family lst_is_subscriber() lets in, stamped with their name. The free sample night (sample.html) and the Virtue
   Library's free stories (data/virtue-library.js meta.freeStoryIds: David and Goliath, David Forgives Saul, Micaiah),
   plus both Lantern Lullabies. A new free night is one more slug here. */
const FREE_NIGHTS = ['children-are-a-gift', 'jun-15-david-and-goliath', 'jun-18-david-forgives-saul-in-the-cave', 'jul-07-micaiah-tells-the-truth'];
const isFree = x => x.type === 'lullaby' || FREE_NIGHTS.includes(x.story);   // raise to make every printable again after a design change

function playwright() { for (const t of [process.env.PLAYWRIGHT, 'playwright', '/opt/node22/lib/node_modules/playwright'].filter(Boolean)) { try { return require(t); } catch (e) {} } throw new Error('Playwright is not installed'); }
function chromePath() { try { for (const d of fs.readdirSync('/opt/pw-browsers')) { const p = path.join('/opt/pw-browsers', d, 'chrome-linux', 'chrome'); if (/^chromium-/.test(d) && fs.existsSync(p)) return p; } } catch (e) {} return undefined; }

/* the volume's colours: the layout stays, only these change. A new volume is one more entry here. */
const THEMES = {
  ot:  { label: 'Old Testament', file: 'OldTestament', navy: '#14275C', gold: '#F6C324', dash: '#E3A82B', band: '#4F8A63', accent: '#2E9E52', card: '#EEE8CC', tint: '#E4EFE3' },
  nt:  { label: 'New Testament', file: 'NewTestament', navy: '#14275C', gold: '#F6C324', dash: '#E3A82B', band: '#D9584A', accent: '#C2453A', card: '#F6E8E0', tint: '#FBE5DF' },
  bom: { label: 'Book of Mormon', file: 'BookOfMormon', navy: '#14275C', gold: '#F6C324', dash: '#E3A82B', band: '#7A4A2A', accent: '#8B5A3C', card: '#F0E5D6', tint: '#F4E9DC' },
  dc:  { label: 'Doctrine and Covenants', file: 'DoctrineAndCovenants', navy: '#14275C', gold: '#F6C324', dash: '#E3A82B', band: '#8A63C9', accent: '#7A4FB8', card: '#EEE8F6', tint: '#F1EAF9' },
  pgp: { label: 'Pearl of Great Price', file: 'PearlOfGreatPrice', navy: '#14275C', gold: '#F6C324', dash: '#E3A82B', band: '#4F8A63', accent: '#2E9E52', card: '#EEE8CC', tint: '#E4EFE3' },
};
const TRAV = {
  beau: { name: 'Beau the Brave', virtue: 'Courage & Faith', motto: '“Big heart, brave start!”' },
  scout: { name: 'Scout the Seeker', virtue: 'Curiosity & Discovery', motto: '“Look and see — what could it be?”' },
  willow: { name: 'Willow the Warm', virtue: 'Compassion & Tenderness', motto: '“Warm hugs, warm hearts!”' },
  wren: { name: 'Wren the Wonderer', virtue: 'Wisdom & Reflection', motto: '“Pause and ponder — what a wonder!”' },
};
const volumeOf = n => (+n.book >= 13 && +n.book <= 24) ? 'nt' : 'ot';
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const fileTitle = t => String(t || '').replace(/&[a-z]+;/g, '').replace(/[’'"“”]/g, '').split(/[^A-Za-z0-9]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('');
const godWords = s => s.replace(/Heavenly Father’s/g, 'God’s').replace(/Heavenly Father's/g, "God's").replace(/Heavenly Father/g, 'God');

function storyOf(html) {   // the picture book's STORY object, read the way the app reads it
  const mark = 'const STORY = ', i = html.indexOf(mark); if (i < 0) return null;
  let j = i + mark.length, d = 0, ins = false, q = '', esc = false;
  for (; j < html.length; j++) { const c = html[j];
    if (ins) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) ins = false; continue; }
    if (c === '"' || c === "'" || c === '`') { ins = true; q = c; } else if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { if (--d === 0) break; } }
  try { return JSON.parse(html.slice(i + mark.length, j + 1)); } catch (e) { return null; }
}
function songOf(lyrics) {   // "[Verse 1]\n...\n\n[Chorus]\n..." into sections; a bare [Chorus] repeats the first one
  const secs = []; let cur = null;
  for (const raw of String(lyrics || '').split('\n')) { const l = raw.trim(); const h = l.match(/^\[(.+)\]$/);
    if (h) { cur = { label: h[1], chorus: /chorus|refrain/i.test(h[1]), lines: [] }; secs.push(cur); continue; }
    if (!l) continue; if (!cur) { cur = { label: 'Verse 1', chorus: false, lines: [] }; secs.push(cur); } cur.lines.push(l); }
  return secs.filter(s => s.lines.length || s.chorus);
}
function loadLullaby(file, key) { const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data', file), 'utf8'))(w); return w[key]; }

/* THE MASTERS GO TO THE PRIVATE BUCKET (migration 0049 in lst-app). The edge function `printable` reads them there,
   checks the family, stamps their name and hands back their copy. Only a printable whose `src` changed since it was
   last stored is sent again (`stored`). Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the Action has both);
   without them nothing is sent and the next run tries again. A failed upload never holds anything back. */
async function storeMasters(items) {
  const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL_ || !KEY) { console.log('printables: no Supabase key here, the masters are not stored this run'); return; }
  const jobs = [];
  for (const x of items) {
    if (x.stored === x.src) continue;
    const paths = Object.values(x.files || {}).map(f => String(f.url || '').split('?')[0].replace(/^\/+/, '')).filter(Boolean);
    if (!paths.length || !paths.every(p => fs.existsSync(path.join(ROOT, p)))) continue;
    jobs.push({ x, paths });
  }
  let ok = 0, bad = 0;
  const send = async ({ x, paths }) => {
    try {
      for (const p of paths) {
        const r = await fetch(`${URL_}/storage/v1/object/printables-locked/${p}`, { method: 'POST',
          headers: { Authorization: 'Bearer ' + KEY, apikey: KEY, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
          body: fs.readFileSync(path.join(ROOT, p)) });
        if (!r.ok) throw new Error(p + ' ' + r.status + ' ' + (await r.text()).slice(0, 120));
      }
      x.stored = x.src; ok++;
    } catch (e) { bad++; if (bad <= 5) console.log('    ! not stored: ' + e.message); }
  };
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map(send));
  console.log(`printables: ${ok} stored in the private bucket` + (bad ? `, ${bad} to try again next run` : ''));
}

async function render(browser, doc, pdfOut, thumbOut, page) {
  const ctx = await browser.newContext({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 0.75 });
  const pg = await ctx.newPage();
  await pg.addInitScript(d => { window.DOC = d; }, doc);
  await pg.goto('file://' + (page || PAGE), { waitUntil: 'load' });
  await pg.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  const res = await pg.evaluate(() => window.RESULT);
  if (res.error) { await ctx.close(); throw new Error(res.error); }
  await pg.emulateMedia({ media: 'print' });
  await pg.pdf({ path: pdfOut, preferCSSPageSize: true, printBackground: true });
  if (thumbOut) await pg.locator('.page').first().screenshot({ path: thumbOut, type: 'jpeg', quality: 80 });
  await ctx.close();
  return res;
}

(async () => {
  const args = process.argv.slice(2), all = args.includes('--all');
  const only = (args[args.indexOf('--only') + 1] && args.includes('--only')) ? args[args.indexOf('--only') + 1].split(',') : null;
  const tpl = sha(fs.readFileSync(PAGE, 'utf8') + VERSION).slice(0, 12);
  const ltpl = sha(fs.readFileSync(LULLABY_PAGE, 'utf8')).slice(0, 12);   // the lullaby look: the Lantern Lullaby AND every night's song   // the look; raise VERSION when make.js changes what goes on a page
  let index = { items: [] }; try { index = JSON.parse(fs.readFileSync(OUT_INDEX, 'utf8')); } catch (e) {}
  const prev = new Map((index.items || []).map(x => [x.id, x]));
  const items = [], warnings = [];
  const { chromium } = playwright();
  const browser = await chromium.launch({ executablePath: process.env.CHROME || chromePath() });
  let made = 0, kept = 0;
  const today = new Date().toISOString().slice(0, 10);

  async function one(id, srcKey, files, build) {   // files: {pdf:[rel...], thumb: rel}; build() -> [{doc, pdf, thumb?}]
    const p = prev.get(id);
    const fresh = p && p.src === srcKey && files.every(f => fs.existsSync(path.join(ROOT, f)));
    if (fresh && !all) { kept++; return p; }
    const jobs = build(); const out = { files: {} };
    for (const j of jobs) { fs.mkdirSync(path.dirname(path.join(ROOT, j.pdf)), { recursive: true });
      const r = await render(browser, j.doc, path.join(ROOT, j.pdf), j.thumb ? path.join(ROOT, j.thumb) : null, j.page);
      out.files[j.ed] = { url: '/' + j.pdf + '?v=' + srcKey.slice(0, 10), pages: r.pages, bytes: fs.statSync(path.join(ROOT, j.pdf)).size };
      if (r.overflow) console.log(`    ! ${id} (${j.ed}): ${r.overflow} page(s) still too full`);
      if (j.thumb) out.thumb = '/' + j.thumb + '?v=' + srcKey.slice(0, 10); }
    made++; console.log('made ' + id);
    return Object.assign(out, { src: srcKey, updated: today, created: (p && p.created) || today });
  }

  // the nights
  const nights = fs.readdirSync(LAN).filter(d => fs.existsSync(path.join(LAN, d, 'night.json'))).map(d => {
    try { return Object.assign({ dir: d }, JSON.parse(fs.readFileSync(path.join(LAN, d, 'night.json'), 'utf8'))); } catch (e) { return null; } }).filter(Boolean)
    .filter(n => n.publish_date && n.publish_date <= '2099').sort((a, b) => a.publish_date < b.publish_date ? -1 : 1);
  for (const n of nights) {
    if (only && !only.includes(n.dir)) { (index.items || []).filter(x => x.story === n.dir).forEach(x => items.push(x)); continue; }
    const vol = volumeOf(n), T = Object.assign({}, THEMES[vol]);
    const base = { volume: vol, volumeLabel: T.label, book: n.book || null, week: n.week || null, night: n.night || null, date: n.publish_date, story: n.dir, ref: n.scripture || '' };
    const bookFile = path.join(LAN, n.dir, n.dir + '.html');
    const S = fs.existsSync(bookFile) ? storyOf(fs.readFileSync(bookFile, 'utf8')) : null;
    if (S) base.storyId = S.id || null;
    if (fs.existsSync(bookFile)) {
      const feel = S && (S.beats || []).find(b => b.type === 'moment' && Array.isArray(b.stones));
      if (!S) warnings.push({ story: n.dir, date: n.publish_date, why: 'its picture book could not be read' });
      else if (!feel || feel.stones.length < 5) warnings.push({ story: n.dir, date: n.publish_date, why: 'its Five Stones are missing, so its Story printable was not made' });
      else {
        const sj = JSON.stringify(S), chrSj = godWords(sj), two = chrSj !== sj;
        const rel = `lantern/${n.dir}/printables/`;
        const docOf = s => ({ kind: 'story', theme: T, story: s, traveler: n.traveler, travInfo: TRAV[String(n.traveler || '').toLowerCase()] || null });
        const r = await one('story-' + n.dir, sha(tpl + sj + (n.traveler || '')), [rel + 'story.pdf', rel + 'story.jpg'].concat(two ? [rel + 'story-christian.pdf'] : []), () =>
          [{ ed: 'lds', doc: docOf(S), pdf: rel + 'story.pdf', thumb: rel + 'story.jpg' }].concat(two ? [{ ed: 'christian', doc: docOf(JSON.parse(chrSj)), pdf: rel + 'story-christian.pdf' }] : []));
        items.push(Object.assign({ id: 'story-' + n.dir, type: 'story', title: S.title || n.title, nightLabel: (S.night || '').replace(/&middot;/g, '·'), download: `${T.file}_Story_${fileTitle(S.title || n.title)}_Letter.pdf` }, base, r));
      }
    }
    const lj = path.join(LAN, n.dir, 'lullaby.json');
    if (fs.existsSync(lj)) { const L = JSON.parse(fs.readFileSync(lj, 'utf8')); const secs = songOf(L.lyrics);
      if (secs.length) { const rel = `lantern/${n.dir}/printables/`;
        /* every night's song in the Lantern Lullaby's own design (Levi, 19 Nov 2026: "every days lullaby should be
           in that same format but in a regular page print size and in however columns it needs") */
        const firstChorus = (secs.find(x => x.chorus && x.lines.length) || {}).lines || [];
        const parts = secs.map(x => ({ label: x.label, kind: x.chorus ? 'chorus' : 'verse', stanzas: [(x.lines.length ? x.lines : firstChorus).join('\n')] }));
        const r = await one('song-' + n.dir, sha(ltpl + JSON.stringify([L.title, L.lyrics, n.scripture])), [rel + 'song.pdf', rel + 'song.jpg'], () =>
          [{ ed: 'lds', doc: { kind: 'song', theme: T, lullaby: { title: L.title, subtitle: (n.scripture ? n.scripture + ' · ' : '') + 'Tonight\u2019s Lullaby', parts } }, pdf: rel + 'song.pdf', thumb: rel + 'song.jpg', page: LULLABY_PAGE }]);
        items.push(Object.assign({ id: 'song-' + n.dir, type: 'song', title: L.title, storyTitle: n.title, download: `${T.file}_Song_${fileTitle(L.title)}_Letter.pdf` }, base, r)); } }
  }
  // the Lantern Lullaby, each Testament
  for (const [vol, file, key] of [['ot', 'lantern-lullaby.js', 'LST_LANTERN_LULLABY'], ['nt', 'lantern-lullaby-nt.js', 'LST_LANTERN_LULLABY_NT']]) {
    if (only && !only.includes('lullaby')) { const x = prev.get('lullaby-' + vol); if (x) items.push(x); continue; }
    const L = loadLullaby(file, key); if (!L) continue; const T = THEMES[vol];
    const r = await one('lullaby-' + vol, sha(ltpl + JSON.stringify(L.parts) + (L.chorus || '') + L.title), [`print/lullaby-${vol}.pdf`, `print/lullaby-${vol}.jpg`], () =>
      [{ ed: 'lds', doc: { kind: 'lullaby', theme: T, lullaby: { title: L.title, parts: L.parts.map(p => Object.assign({}, p, { stanzas: (p.stanzas || []).map(x => x === 'CHORUS' ? (L.chorus || '') : x) })) } }, pdf: `print/lullaby-${vol}.pdf`, thumb: `print/lullaby-${vol}.jpg`, page: LULLABY_PAGE }]);
    items.push(Object.assign({ id: 'lullaby-' + vol, type: 'lullaby', title: L.title + (vol === 'nt' ? ' (New Testament)' : ' (Old Testament)'), volume: vol, volumeLabel: T.label, download: `${T.file}_Lullaby_LittleTravelersLullaby_Letter.pdf` }, r));
  }
  await browser.close();
  if (only) (index.warnings || []).forEach(w => { if (!only.includes(w.story)) warnings.push(w); });   // the nights not looked at keep their warnings
  items.sort((a, b) => (a.type === 'lullaby') - (b.type === 'lullaby') || ((b.date || '') < (a.date || '') ? -1 : (b.date || '') > (a.date || '') ? 1 : 0) || (a.type < b.type ? 1 : -1));
  items.forEach(x => { if (isFree(x)) x.free = true; else delete x.free; });
  await storeMasters(items);
  fs.writeFileSync(OUT_INDEX, JSON.stringify({ updated: new Date().toISOString(), base: 'https://littlescripturetravelers.com', items, warnings }, null, 1) + '\n');
  console.log(`printables: ${made} made, ${kept} unchanged, ${items.length} listed, ${warnings.length} warning(s)`);
  warnings.forEach(w => console.log('  WARNING ' + w.date + ' ' + w.story + ': ' + w.why));
})().catch(e => { console.error(e); process.exit(1); });
