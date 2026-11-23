/* ═══════════════════════════════════════════════════════════════════════════
   THE LINE ICONS (Levi, 21 Oct 2026: "icons that match my brand" in place of
   the phone's emoji). Drawn the same way as the app's own set (ICON in
   index.html): a 24px grid, one 1.75 line in the colour of the words around
   it (currentColor), and one gold accent per icon (class ig = gold fill,
   igs = gold line). The World Timeline loads this file; its chips, rows and
   round buttons hold <i data-lli="name"></i>, filled in as the page draws.

     lstLine('globe')            -> an <svg>
     <i data-lli="globe"></i>    -> filled in when it reaches the page
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  var L={
    gift:'<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v8h14v-8"/><path d="M12 8.5v12" class="igs"/><path d="M12 8.5C10.5 5 7 4.5 7 6.8 7 8.5 10 8.5 12 8.5zM12 8.5c1.5-3.5 5-4 5-1.7 0 1.7-3 1.7-5 1.7z"/>',
    lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.6" class="ig" stroke="none"/>',
    book:'<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5"/><path d="M12 6.5c2-1.5 5-2 8.5-1.5v13c-3.5-.5-6.5 0-8.5 1.5z" class="ig"/><path d="M12 6.5v13"/>',
    flag:'<path d="M5 21V3.5"/><path d="M5 4.5h13l-2.5 4 2.5 4H5" class="ig"/>',
    candle:'<rect x="8.5" y="10" width="7" height="10.5" rx="1.2"/><path d="M12 3.5c-1.6 2-1.6 3.6 0 5 1.6-1.4 1.6-3 0-5z" class="ig"/>',
    microscope:'<path d="M9.5 3.5h4l-.8 7.5h-2.4z" class="ig"/><path d="M11.5 11v3M5 20.5h14M8.5 17.5h7M15.5 8.5a5.5 5.5 0 0 1 0 9"/>',
    home:'<path d="M3.5 11 12 3.8l8.5 7.2"/><path d="M6 9.4V20h12V9.4"/><path d="M10 20v-5h4v5" class="igs"/>',
    feather:'<path d="M19.5 4.5c-7 0-12 5-12 12v3"/><path d="M19.5 4.5c0 7-4.5 11.5-12 12" class="igs"/><path d="M4.5 19.5l3-3"/>',
    headphones:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4.5" height="6.5" rx="1.5" class="ig"/><rect x="16" y="14" width="4.5" height="6.5" rx="1.5" class="ig"/>',
    bookmark:'<path d="M6.5 3.5h11v17l-5.5-4.2-5.5 4.2z"/><path d="M9.5 8h5" class="igs"/>',
    /* the website's pictures (Levi, 23 Nov 2026: "the website needs to have the little scripture travelers icons instead of emoji's") */
    music:'<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5" class="ig"/><circle cx="17.5" cy="16" r="2.5" class="ig"/>',
    moon:'<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z" class="ig"/>',
    phone:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/><path d="M10.5 18.5h3" class="igs"/>',
    lantern:'<path d="M9 5.5h6M12 2.5v3M8 21h8"/><path d="M8.5 5.5h7l1.5 3v9.5l-1.5 3h-7L7 18V8.5z"/><path d="M12 10.5c-1.4 1.6-1.4 3.2 0 4.5 1.4-1.3 1.4-2.9 0-4.5z" class="ig"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z" class="ig"/>',
    backpack:'<path d="M9 5.5V4a3 3 0 0 1 6 0v1.5"/><rect x="5" y="5.5" width="14" height="15.5" rx="4"/><rect x="8.5" y="13" width="7" height="4.5" rx="1" class="ig"/>',
    van:'<path d="M2.5 16.5V8a2 2 0 0 1 2-2h11l4 4.5h1a1 1 0 0 1 1 1v5"/><path d="M15.5 6v4.5h5" class="igs"/><circle cx="7" cy="17" r="2" class="ig"/><circle cx="17" cy="17" r="2" class="ig"/><path d="M9 17h6"/>',
    tools:'<path d="M14.5 6.5a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 1 5-5l-2.5 2.5.5 2 2 .5z"/><circle cx="8.6" cy="18.4" r=".9" class="ig" stroke="none"/>',
    picture:'<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.8" class="ig"/><path d="m3.5 17.5 5-5 4 4 3-3 5 4.5"/>',
    camera:'<path d="M3 8.5a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5" class="ig"/>',
    pencil:'<path d="M16 4.5 19.5 8 8 19.5H4.5V16z"/><path d="m13.5 7 3.5 3.5" class="igs"/>',
    trash:'<path d="M4 6.5h16M9.5 6.5V4h5v2.5"/><path d="M6 6.5l1 14h10l1-14"/><path d="M10 10.5v6M14 10.5v6" class="igs"/>',
    printer:'<path d="M7 8.5V3.5h10v5"/><rect x="3" y="8.5" width="18" height="8" rx="2"/><rect x="7" y="13.5" width="10" height="7" rx="1" class="ig"/>',
    gradcap:'<path d="M2.5 9 12 4.5 21.5 9 12 13.5z" class="ig"/><path d="M6.5 11v5c3 2.5 8 2.5 11 0v-5M21.5 9v5"/>',
    sparkle:'<path d="M12 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7z" class="ig"/><path d="M19 16.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z"/>',
    link:'<path d="M10 14a4 4 0 0 0 5.7 0l3.3-3.3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0L5 13.3a4 4 0 0 0 5.7 5.7l1.2-1.2" class="igs"/>',
    repeat:'<path d="M4 11V9.5a3 3 0 0 1 3-3h12.5"/><path d="m16.5 3.5 3 3-3 3" class="igs"/><path d="M20 13v1.5a3 3 0 0 1-3 3H4.5"/><path d="m7.5 20.5-3-3 3-3" class="igs"/>',
    heart:'<path d="M12 20s-7.5-4.6-8.7-9.6A4.6 4.6 0 0 1 12 7.3a4.6 4.6 0 0 1 8.7 3.1C19.5 15.4 12 20 12 20z" class="ig"/>',
    question:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2.2-2.5 4"/><circle cx="12" cy="17.3" r="1.1" class="ig" stroke="none"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.8" class="ig"/>',
    smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.8 2.3 2.6 4 2.6s3-.8 4-2.6" class="igs"/><path d="M9 9.5v.5M15 9.5v.5"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16.2 9.5" class="igs"/>',
    /* Levi's own drawings (22 Nov 2026): the Scripture character cards and the weekly story chart */
    cards:'<path d="M9 5H5.6A1.6 1.6 0 0 0 4 6.6v13.3a1.6 1.6 0 0 0 1.6 1.6h7.8a1.6 1.6 0 0 0 1.6-1.6V19.5"/><rect x="9" y="2.5" width="11" height="17" rx="1.6"/><circle cx="14.5" cy="8.4" r="2" class="ig"/><path d="M11.6 13.4c.6-1.7 1.6-2.5 2.9-2.5s2.3.8 2.9 2.5"/><path d="M11.8 16.4h5.4"/>',
    storychart:'<rect x="4.5" y="4" width="15" height="17" rx="2"/><rect x="9" y="2.5" width="6" height="3" rx="1"/><path d="M7.5 10h3M7.5 14h3M7.5 18h3"/><path d="M15.50 10.90L16.35 13.03L18.64 13.18L16.88 14.65L17.44 16.87L15.50 15.65L13.56 16.87L14.12 14.65L12.36 13.18L14.65 13.03z" class="ig igs"/>',
    search:'<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5" class="igs"/>',
    eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8" class="ig"/>',
    layers:'<path d="M12 3.5 21 8l-9 4.5L3 8z" class="ig"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16 9 4.5 9-4.5"/>',
    globe:'<circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="3.6" ry="8.5"/><path d="M3.5 12h17" class="igs"/>',
    pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4" class="ig"/>',
    books:'<path d="M3.5 19.5h17V15h-17z"/><path d="M5.5 15h15v-4.5h-15z"/><path d="M3.5 10.5h13V6h-13z" class="ig"/>',
    bulb:'<path d="M9 17.5v-1.6c0-1.3-.6-2.2-1.5-3.2a5.5 5.5 0 1 1 9 0c-.9 1-1.5 1.9-1.5 3.2v1.6z"/><path d="M9.5 20.5h5" class="igs"/>',
    bell:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0" class="igs"/>',
    scroll:'<path d="M7 7h10v10H7z"/><rect x="4.5" y="3.5" width="15" height="3.5" rx="1.75" class="ig"/><rect x="4.5" y="17" width="15" height="3.5" rx="1.75" class="ig"/>',
    sun:'<circle cx="12" cy="12" r="3.8" class="ig"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7"/>',
    temple:'<path d="M3.5 20.5h17M6 20.5v-8h12v8M9 12.5V8h6v4.5M10.5 20.5v-3.5h3v3.5"/><path d="M12 8V3.5" class="igs"/>',
    walk:'<circle cx="13" cy="4.8" r="1.9" class="ig"/><path d="M11.5 14.5 13 8.2l-3 1.6-2.3 3.4M13 8.2l2.4 3 3 .9M11.5 14.5l3 3V21M11.5 14.5 9 21"/>',
    cross:'<path d="M12 3.5v17"/><path d="M7.5 8.5h9" class="igs"/>',
    columns:'<path d="M3.5 9 12 4l8.5 5z" class="ig"/><path d="M5.5 9v9M10 9v9M14 9v9M18.5 9v9M3.5 20.5h17"/>',
    swords:'<path d="M5 5l11 11M19 5 8 16"/><path d="m4.5 17.5 2 2M19.5 17.5l-2 2M14 18l4-4M10 18l-4-4" class="igs"/>',
    ship:'<path d="M3.5 15h17l-2.5 5H6z" class="ig"/><path d="M12 15V3.5l6 8.5h-6"/>',
    arrows:'<path d="M4 8.5h14"/><path d="m14.5 5 3.5 3.5-3.5 3.5" class="igs"/><path d="M20 15.5H6M9.5 12 6 15.5 9.5 19"/>',
    map:'<path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/><circle cx="12" cy="11.5" r="1.5" class="ig" stroke="none"/>',
    person:'<circle cx="12" cy="8" r="3.8" class="ig"/><path d="M4.5 20.5c.8-4 3.6-6.5 7.5-6.5s6.7 2.5 7.5 6.5"/>',
    people:'<circle cx="9" cy="8.5" r="3.2" class="ig"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M3 20c.6-3.4 2.9-5.5 6-5.5s5.4 2.1 6 5.5M15 14.6c3 0 5.2 2 5.8 5.4"/>',
    star:'<path d="m12 3.5 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" class="ig"/>',
    trowel:'<path d="M14 4.5 19.5 10l-7 7L7 11.5z" class="ig"/><path d="m7 17-3 3M9.8 14.2 7 17"/>',
    stop:'<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12" class="igs"/>',
    wave:'<path d="M3 8.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 13.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" class="igs"/>',
    volcano:'<path d="M3 20.5 9 9.5h6l6 11z"/><path d="m10 6 2 3 2-3" class="igs"/>',
    speech:'<path d="M3.5 4.5h10v7H8L5 14v-2.5H3.5z"/><path d="M16.5 8.5h4v7H19V18l-3-2.5h-5.5v-2" class="igs"/>',
    city:'<path d="M4 20.5V9h6v11.5M10 20.5V4h7v16.5M3 20.5h18"/><path d="M13 8h1.5M13 11.5h1.5M13 15h1.5" class="igs"/>',
    family:'<path d="M3.5 11 12 3.8l8.5 7.2"/><path d="M6 9.4V20h12V9.4"/><path d="M12 17.4c-1.9-1.3-3.1-2.4-3.1-3.8a1.65 1.65 0 0 1 3.1-.85 1.65 1.65 0 0 1 3.1.85c0 1.4-1.2 2.5-3.1 3.8z" class="ig"/>',
    scales:'<path d="M12 4v16M8 20.5h8M5 7.5h14"/><path d="M5 7.5 2.5 13h5zM19 7.5 16.5 13h5z" class="ig"/>',
    skull:'<path d="M5.5 11a6.5 6.5 0 0 1 13 0v3.5H16V18H8v-3.5H5.5z"/><circle cx="9.5" cy="11" r="1.5" class="ig" stroke="none"/><circle cx="14.5" cy="11" r="1.5" class="ig" stroke="none"/>',
    factory:'<path d="M3.5 20.5v-9l5 3v-3l5 3v-3l5 3V4h2.5v16.5z"/><path d="M7 17.5h2M11.5 17.5h2" class="igs"/>',
    chain:'<rect x="2.5" y="8.5" width="10.5" height="6" rx="3"/><rect x="11" y="9.5" width="10.5" height="6" rx="3" class="igs"/>',
    chart:'<path d="M3.5 20.5h17M4 4v16.5"/><path d="m7.5 15 4-4 3 3 5.5-5.5"/><path d="M16.5 8.5H20V12" class="igs"/>',
    telescope:'<path d="m3.5 11.5 12-5 2.2 4.6-12 5z" class="ig"/><path d="m10.5 14.4-3 6.1M12.5 13.6l3 6.9"/>',
    health:'<path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z"/><path d="M12 9.5v5M9.5 12h5" class="igs"/>',
    bars:'<path d="M3.5 20.5h17M6 17v-5M18 17V9"/><path d="M12 17V6.5" class="igs"/>',
    child:'<circle cx="12" cy="7.5" r="3.5" class="ig"/><path d="M6.5 20.5v-2a5.5 5.5 0 0 1 11 0v2"/>',
    megaphone:'<path d="M4 10v4h3l9 5V5L7 10z"/><path d="M19 9.5a3.5 3.5 0 0 1 0 5" class="igs"/>',
    hand:'<path d="M8 13.5V7a1.5 1.5 0 0 1 3 0v4.5M11 11V5.5a1.5 1.5 0 0 1 3 0v6M14 11.5V7a1.5 1.5 0 0 1 3 0v7c0 4-2.5 6.5-6 6.5-2.5 0-4-1.5-5.5-4L4 14a1.5 1.5 0 0 1 2.6-1.4L8 14.5"/><path d="M10 17.5h4" class="igs"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2" class="igs"/>',
    seed:'<path d="M12 20.5V12"/><path d="M12 13c-4.5 0-6.5-3-6.5-6.5 4.5 0 6.5 2.5 6.5 6.5z" class="ig"/><path d="M12 12c0-4 2.5-7 7-7 0 4-2.5 7-7 7z"/>',
    mic:'<rect x="9" y="3.5" width="6" height="11" rx="3" class="ig"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3M9 20.5h6"/>',
    hands:'<path d="M11 20.5 6.5 17V9.5L10 4.5l1 1V20.5zM13 20.5l4.5-3.5V9.5L14 4.5l-1 1V20.5z"/><path d="M12 5.5v15" class="igs"/>'
  };
  function lstLine(name,cls){
    if(!L[name]) return '';
    return '<svg class="lli'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+L[name]+'</svg>';
  }
  /* the same drawing with its look written into it, for a page that has not got this file's style (a night's frame) */
  function lstLineInline(name,size){
    if(!L[name]) return '';
    var body=L[name].replace(/ class="ig igs"/g,' fill="#F5C518" stroke="#F5C518"').replace(/ class="ig"/g,' fill="#F5C518"').replace(/ class="igs"/g,' stroke="#F5C518"');
    return '<svg viewBox="0 0 24 24" width="'+(size||'1.2em')+'" height="'+(size||'1.2em')+'" style="vertical-align:-.28em;flex:0 0 auto" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+body+'</svg>';
  }
  var CSS='.lli{width:1.2em;height:1.2em;display:inline-block;vertical-align:-.24em;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;}'
    +'.lli .ig{fill:#F5C518;} .lli .igs{stroke:#F5C518;}'
    +'.hchip .lli,.lp-name .lli{margin-right:3px;}'
    +'.tlf .lli{width:24px;height:24px;vertical-align:middle;}'
    +'.ic .lli,.pr-b .ic .lli{width:24px;height:24px;}';
  function fill(root){
    try{ (root||document).querySelectorAll('i[data-lli]').forEach(function(el){ var h=lstLine(el.getAttribute('data-lli')); if(h){ el.insertAdjacentHTML('beforebegin',h); el.remove(); } }); }catch(e){}
  }
  function mount(doc){
    doc=doc||document;
    try{
      if(!doc.getElementById('lliCss')){ var s=doc.createElement('style'); s.id='lliCss'; s.textContent=CSS; (doc.head||doc.body).appendChild(s); }
      fill(doc);
      if(doc.body && doc.defaultView && doc.defaultView.MutationObserver && !doc.__lliObs){
        doc.__lliObs=new doc.defaultView.MutationObserver(function(ms){ for(var i=0;i<ms.length;i++){ var a=ms[i].addedNodes; for(var j=0;j<a.length;j++){ var n=a[j]; if(n.nodeType!==1) continue; if(n.matches&&n.matches('i[data-lli]')) fill(n.parentNode||doc); else if(n.querySelector&&n.querySelector('i[data-lli]')) fill(n); } } });
        doc.__lliObs.observe(doc.body,{childList:true,subtree:true});
      }
    }catch(e){}
  }
  window.lstLine=lstLine; window.lstLineInline=lstLineInline; window.lstLineFill=fill; window.LST_LINE=L;
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded',function(){ mount(); });
})();
