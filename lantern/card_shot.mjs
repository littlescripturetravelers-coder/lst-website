// card_shot.mjs - photograph Morning Lantern cards exactly as the app shows them.
//
//   node lantern/card_shot.mjs <morning-lantern.html> <out dir> '<json list of labels>'
//
// Opens the night's Lantern page in Chromium at phone width (2x pixels), shows
// the deep read (it holds every card of the quick and medium reads too), turns
// every reveal animation on, and screenshots each card whose label matches -
// the real card, the real fonts, the real colors. Prints a JSON list of
// { label, file, width, height } and the page background color.
// Used by marketing_media.py (THE CARDS RULE). Needs the playwright npm package
// and a Chromium (CHROME_PATH, or Playwright's own).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const [html, outDir, labelsJson] = process.argv.slice(2);
const labels = JSON.parse(labelsJson || "[]");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 540, height: 1200 }, deviceScaleFactor: 2 });
page.on("dialog", (d) => d.dismiss().catch(() => {}));
await page.goto("file://" + path.resolve(html) + "?inapp=1", { waitUntil: "load", timeout: 60000 });
try { await page.evaluate(() => document.fonts.ready); } catch {}
await page.waitForTimeout(600);

const BRAND_DIR = "file://" + path.resolve(path.dirname(new URL(import.meta.url).pathname), "brand");
await page.evaluate((BRAND_DIR) => {
  try { if (typeof showTab === "function") showTab("heavenly"); } catch {}
  const deep = document.getElementById("tab-heavenly");
  if (deep) { document.querySelectorAll(".edition").forEach((e) => e.classList.remove("active", "focus-mode")); deep.classList.add("active"); deep.style.display = "block"; }
  document.querySelectorAll(".reveal").forEach((e) => { e.classList.add("visible"); e.style.opacity = "1"; e.style.transform = "none"; e.style.filter = "none"; });
  document.querySelectorAll("details").forEach((d) => { d.open = true; });
  // the Traveler card wears the Traveler's round portrait, as it does in the app
  document.querySelectorAll(".card-wren").forEach((card) => {
    if (card.querySelector("img")) return;
    const m = (card.className.match(/trav-(beau|scout|willow|wren)/) || [])[1];
    if (!m) return;
    const img = document.createElement("img");
    img.src = BRAND_DIR + "/" + m + ".jpg";
    img.style.cssText = "display:block;width:112px;height:112px;border-radius:50%;object-fit:cover;object-position:50% 20%;margin:6px auto 10px;border:4px solid var(--" + m + ", #F5C518);box-shadow:0 4px 14px rgba(0,0,0,.18)";
    const label = card.querySelector(".card-label");
    if (label && label.nextSibling) card.insertBefore(img, label.nextSibling); else card.prepend(img);
  });
}, BRAND_DIR);
await page.waitForTimeout(400);

const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const cards = await page.$$("#tab-heavenly .card");
const info = [];
for (const c of cards) {
  const label = await c.evaluate((el) => {
    const l = el.querySelector(".card-label, .card-title, h2, h3, .pill, .tsc-pill");
    return (l ? l.textContent : el.textContent || "").replace(/\s+/g, " ").trim();
  });
  info.push({ el: c, label });
}
const out = [];
let n = 0;
for (const want of labels) {
  const key = String(want).toLowerCase();
  const hit = info.find((i) => i.label.toLowerCase().includes(key));
  if (!hit) { out.push({ label: want, file: null }); continue; }
  await hit.el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const file = path.join(outDir, `card-${String(++n).padStart(2, "0")}.png`);
  await hit.el.screenshot({ path: file, type: "png" });
  const box = await hit.el.boundingBox();
  out.push({ label: hit.label, file, width: Math.round(box.width * 2), height: Math.round(box.height * 2) });
}
await browser.close();
console.log(JSON.stringify({ bg, cards: out }));
