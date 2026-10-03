/* The timeline's guided tours, stop by stop, as each edition's timeline prints them:
   node tools/tour-stops.js > stops.json
   Opens timeline-explore.html in each edition (a real browser, so the words are exactly
   the page's own, Christian wording and all) and lists every stop's recording name and the
   words to read. The tour-narrate Action sends these to the narrate-tour function. */
const path=require('path'), http=require('http'), fs=require('fs');
const { chromium } = require(process.env.PLAYWRIGHT||'playwright');
const ROOT=path.join(__dirname,'..');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const srv=http.createServer((rq,rs)=>{ const f=path.join(ROOT,decodeURIComponent(rq.url.split('?')[0]));
  fs.readFile(f,(e,d)=>{ if(e){ rs.writeHead(404); rs.end(); return; } rs.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); rs.end(d); }); });
(async()=>{
  await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
  const all={};
  for(const ed of ['lds','christian']){
    const pg=await (await b.newContext()).newPage();
    await pg.goto(`http://localhost:${port}/timeline-explore.html?edition=${ed}`,{waitUntil:'load'}); await pg.waitForTimeout(2000);
    const stops=await pg.evaluate(()=>{ const out=[]; NARRATE_TOURS.forEach(t=>t.stops.forEach(s=>out.push({id:narrKey(t,s),text:narrSpeech(s),tour:t.id}))); return out; });
    stops.forEach(s=>{ all[s.id]=s; });
    console.error(ed+': '+stops.length+' stops');
  }
  await b.close(); srv.close();
  const list=Object.values(all);
  console.error(list.length+' recordings, '+list.reduce((a,s)=>a+s.text.length,0)+' characters');
  process.stdout.write(JSON.stringify(list,null,1));
})().catch(e=>{ console.error(e); process.exit(1); });
