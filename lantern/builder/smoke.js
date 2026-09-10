const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const file = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:430,height:900}});
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('file://'+file); await p.waitForTimeout(1200);
  for (const d of ['quick','deep','heavenly']) {
    await p.evaluate(k=>pmDepth(k), d); await p.waitForTimeout(700);
    const n = await p.evaluate(k=>document.querySelectorAll(`#tab-${k} .card, #tab-${k} .toolkit-card`).length, d);
    const note = await p.evaluate(()=>document.querySelector('.edition.active .depth-note')?.textContent);
    console.log(`  ${d}: ${n} cards, depth-note "${note}"`);
  }
  const btns = await p.evaluate(()=>document.querySelectorAll('.pm-depth button').length);
  const labels = await p.evaluate(()=>[...document.querySelectorAll('.pm-depth button')].map(b=>b.textContent.trim()));
  console.log('  depth buttons:', btns, labels);
  await p.evaluate(()=>pmDepth('heavenly')); await p.waitForTimeout(700);
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300);
  await p.screenshot({path: file.includes('lds')?'shot-lds.png':'shot-christian.png'});
  console.log('  pageerrors:', errs.length, errs.slice(0,3));
  await b.close();
})();
