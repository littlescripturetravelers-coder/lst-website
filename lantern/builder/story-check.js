const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:430,height:900}});
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForTimeout(1800);
  const dots = await p.evaluate(()=>document.querySelectorAll('.dot, .dots > *, [class*="dot"]').length);
  const imgs = await p.evaluate(()=>document.querySelectorAll('img').length);
  console.log('dots-ish:', dots, '| imgs in DOM:', imgs);
  // click through to the last page
  for (let i=0;i<10;i++){
    await p.evaluate(()=>{ const w=window.innerWidth,h=window.innerHeight;
      document.elementFromPoint(w-20,h/2)?.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
    await p.mouse.click(410, 450);
    await p.waitForTimeout(780);
  }
  const lull = await p.evaluate(()=>{ const a=[...document.querySelectorAll('a')].find(x=>/lullaby/i.test(x.getAttribute('href')||'')); return a?a.getAttribute('href')+' | '+a.textContent.trim().slice(0,60):'NONE'; });
  console.log('lullaby link on last page:', lull);
  await p.screenshot({path:'story-last.png'});
  console.log('pageerrors:', errs.length, errs);
  await b.close();
})();
