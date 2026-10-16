// Renders every NestWork logo as a photo-ready PNG on its own background: node brand/png/make-logos.js (needs Playwright).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const B = '/home/user/lst-website/family-app/brand/', OUT = B + 'png/', NM = '/home/user/lst-website/family-app/node_modules/@expo-google-fonts/nunito/';
const N = '#1B2D5F', L = '#F4EFE6', C = '#F2665A', W = '#FFFFFF', OAT = '#DFD2BE', CAP = '#5A6B93';
const svg = (f, w) => fs.readFileSync(B + f, 'utf8').replace('<svg ', `<svg width="${w}" `);
const byline = (color, px) => `<p style="font-family:Nunito;font-weight:700;font-size:${px}px;color:${color};margin:0;letter-spacing:.01em">by Lewy’s Family Studio</p>`;
const jobs = [
  // name, width, height, background, inner html
  ['01-nestwork-app-icon', 2048, 2048, N, svg('lst/app-icon.svg', 2048)],
  ['02-nestwork-full-logo-navy', 2048, 2048, N, `<div style="display:grid;justify-items:center;gap:56px">${svg('lst/mark-on-navy.svg', 620)}${svg('lst/lockup-on-navy.svg', 1240)}${byline(OAT, 64)}</div>`],
  ['03-nestwork-full-logo-linen', 2048, 2048, L, `<div style="display:grid;justify-items:center;gap:56px">${svg('lst/mark-on-linen.svg', 620)}${svg('lst/lockup-on-linen.svg', 1240)}${byline(CAP, 64)}</div>`],
  ['04-nestwork-mark-navy', 2048, 2048, N, svg('lst/mark-on-navy.svg', 1400)],
  ['05-nestwork-mark-linen', 2048, 2048, L, svg('lst/mark-on-linen.svg', 1400)],
  ['06-nestwork-lockup-navy', 2400, 1350, N, svg('lst/lockup-on-navy.svg', 1700)],
  ['07-nestwork-lockup-linen', 2400, 1350, L, svg('lst/lockup-on-linen.svg', 1700)],
  ['08-nestwork-wordmark-navy', 2400, 1350, N, svg('lst/wordmark-on-navy.svg', 1800)],
  ['09-nestwork-wordmark-linen', 2400, 1350, L, svg('lst/wordmark-on-linen.svg', 1800)],
  ['10-nestwork-wordmark-stacked-navy', 2048, 2048, N, svg('lst/wordmark-stacked-on-navy.svg', 1100)],
  ['11-nestwork-wordmark-stacked-linen', 2048, 2048, L, svg('lst/wordmark-stacked-on-linen.svg', 1100)],
  ['12-nestwork-byline-navy', 2400, 1350, N, `<div style="display:grid;justify-items:center;gap:40px">${svg('lst/wordmark-on-navy.svg', 1500)}${byline(OAT, 84)}</div>`],
  ['13-nestwork-byline-linen', 2400, 1350, L, `<div style="display:grid;justify-items:center;gap:40px">${svg('lst/wordmark-on-linen.svg', 1500)}${byline(CAP, 84)}</div>`],
  ['14-coral-app-icon', 2048, 2048, C, svg('coral/app-icon.svg', 2048)],
  ['15-coral-mark-coral', 2048, 2048, C, svg('coral/mark-on-coral.svg', 1400)],
  ['16-coral-mark-white', 2048, 2048, W, svg('coral/mark-on-white.svg', 1400)],
  ['17-coral-wordmark-coral', 2400, 1350, C, svg('coral/wordmark-on-coral.svg', 1800)],
  ['18-coral-wordmark-white', 2400, 1350, W, svg('coral/wordmark-on-white.svg', 1800)],
  ['19-coral-wordmark-stacked-coral', 2048, 2048, C, svg('coral/wordmark-stacked-on-coral.svg', 1100)],
  ['20-coral-wordmark-stacked-white', 2048, 2048, W, svg('coral/wordmark-stacked-on-white.svg', 1100)],
];
(async () => { const b = await chromium.launch();
  for (const [name, w, h, bg, inner] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<style>@font-face{font-family:Nunito;src:url(data:font/ttf;base64,${fs.readFileSync(NM + 'Nunito_700Bold.ttf').toString('base64')});font-weight:700}*{margin:0}body{width:${w}px;height:${h}px;background:${bg};display:grid;place-items:center;overflow:hidden}svg{display:block;height:auto}</style>${inner}`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: OUT + name + '.png' }); await p.close(); }
  await b.close(); console.log('done', jobs.length); })();
