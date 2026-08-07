import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
const ROOT='/tmp/bg/dist';
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.xml':'application/xml'};
const server=createServer(async(req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);let f=join(ROOT,p);try{const s=await stat(f);if(s.isDirectory())f=join(f,'index.html');}catch{if(!extname(f))f=join(ROOT,p,'index.html');}try{const d=await readFile(f);res.writeHead(200,{'content-type':MIME[extname(f)]??'application/octet-stream'});res.end(d);}catch{res.writeHead(404);res.end('x');}});
await new Promise(r=>server.listen(4325,r));
const B='http://localhost:4325';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const fails=[]; const ok=[];
const t=(name,cond,info='')=> (cond?ok:fails).push(name+(info?', '+info:''));

async function open(url, vp={width:1920,height:1080}, opts={}){
  const ctx=await b.newContext({viewport:vp, ...opts});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e))); page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await page.goto(B+url,{waitUntil:'networkidle'});
  return {ctx,page,errs};
}

// 1 · karta = jeden odkaz, tagy nie sú odkazy
{
  const {ctx,page,errs}=await open('/sk/articles/');
  const r=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('.card')];
    return {
      n:cards.length,
      multiLink: cards.filter(c=>c.querySelectorAll('a').length!==1).length,
      tagLinks: document.querySelectorAll('.card-tags a').length,
      cols: getComputedStyle(document.querySelector('[data-list]')).gridTemplateColumns.split(' ').length,
    };
  });
  t('karta je jeden odkaz', r.multiLink===0, `kariet ${r.n}, s iným počtom odkazov ${r.multiLink}`);
  t('tagy na karte nie sú odkazy', r.tagLinks===0);
  t('mriežka nemá 4 stĺpce', r.cols<=3, `stĺpcov ${r.cols}`);
  t('archív bez chýb v konzole', errs.length===0, errs.join(' | '));
  await ctx.close();
}

// 2 · accentový text pod 24 px
{
  const {ctx,page}=await open('/sk/articles/771002-manifest-jedneho-napadu/');
  const bad=await page.evaluate(()=>{
    const out=[];
    for(const el of document.querySelectorAll('*')){
      const cs=getComputedStyle(el);
      if(cs.color!=='rgb(217, 63, 17)') continue;
      if(parseFloat(cs.fontSize)>=24) continue;
      if(!el.textContent.trim()) continue;
      if(el.children.length) continue;
      out.push(el.className+' '+cs.fontSize);
    }
    return out;
  });
  t('accent pod 24 px nepoužíva #d93f11', bad.length===0, bad.join(', '));
  await ctx.close();
}

// 3 · horná hrana hlavnej karty vidieť bez scrollu 1920×1080
{
  const {ctx,page}=await open('/sk/');
  const top=await page.evaluate(()=>document.querySelector('.feature').getBoundingClientRect().top);
  t('horná hrana hlavnej karty je vidieť na 1920×1080', top<1080, `top=${Math.round(top)}`);
  await ctx.close();
}

// 4 · dátumy 14. 07. 2026
{
  const {ctx,page}=await open('/en/articles/');
  const dates=await page.evaluate(()=>[...document.querySelectorAll('time')].map(e=>e.textContent.trim()));
  t('dátumy sú číselné aj v EN', dates.every(d=>/^\d{2}\. \d{2}\. \d{4}$/.test(d)), dates.slice(0,3).join(' | '));
  await ctx.close();
}

// 5 · rozpísaný článok
{
  const {ctx,page}=await open('/sk/articles/771001-system-ktory-prezije-zly-den/');
  const r=await page.evaluate(()=>({
    band: !!document.querySelector('.draft-band'),
    rail: !!document.querySelector('.draft-rail'),
    state: document.querySelector('.art-state')?.textContent.trim(),
    thread: !!document.querySelector('.thread'),
  }));
  t('rozpísaný má pás aj šrafovanie', r.band && r.rail, JSON.stringify(r));
  t('rozpísaný má stav v hlavičke', /Rozpísané/i.test(r.state||''), r.state);
  t('séria 1:1 vykreslí niť', r.thread);
  await ctx.close();
}
// karta rozpísaného v archíve
{
  const {ctx,page}=await open('/sk/articles/');
  const r=await page.evaluate(()=>{
    const cell=document.querySelector('[data-id="771001"]');
    return {draft: !!cell?.querySelector('.badge-draft'), pinned: !!document.querySelector('[data-id="771002"] .badge-pinned-quiet')};
  });
  t('rozpísaný má značku na karte', r.draft);
  t('pripnutý má v archíve len malý PINNED', r.pinned);
  await ctx.close();
}

// 6 · homepage, pripnutý ako hlavná karta a neopakuje sa v mriežke
{
  const {ctx,page}=await open('/sk/');
  const r=await page.evaluate(()=>({
    label: document.querySelector('.feature-label')?.textContent.trim(),
    featureId: document.querySelector('.feature')?.dataset.cardId,
    gridIds: [...document.querySelectorAll('.grid-cell .card')].map(c=>c.dataset.cardId),
    archiveLink: !!document.querySelector('.more-link'),
  }));
  t('pripnutý je hlavná karta', r.featureId==='771002', r.featureId);
  t('hlavná karta sa v mriežke neopakuje', !r.gridIds.includes(r.featureId));
  t('odkaz do archívu sa pri 6 článkoch nezobrazí', r.archiveLink===false);
  await ctx.close();
}

// 7 · chýbajúci preklad
{
  const {ctx,page}=await open('/en/articles/771002-manifest-jedneho-napadu/');
  const r=await page.evaluate(()=>({
    missing: !!document.querySelector('.missing-flag'),
    lang: document.documentElement.lang,
    noindex: !!document.querySelector('meta[name="robots"]'),
  }));
  t('chýbajúci preklad ukáže oznam, nie 404', r.missing && r.lang==='en', JSON.stringify(r));
  await ctx.close();
}

// 8 · bez JavaScriptu
{
  const {ctx,page}=await open('/sk/articles/836206-hry-ktore-zazijete-iba-raz/',{width:1440,height:900},{javaScriptEnabled:false});
  const r=await page.evaluate(()=>({
    body: document.querySelector('.article-body')?.textContent.trim().length ?? 0,
    nav: document.querySelectorAll('.nav-link').length,
    imgOpacity: getComputedStyle(document.querySelector('.article-body img')).opacity,
  }));
  t('článok je čitateľný bez JS', r.body>400 && r.nav===3, JSON.stringify(r));
  t('obrázky sú bez JS viditeľné', r.imgOpacity==='1', r.imgOpacity);
  await ctx.close();
}
{
  const {ctx,page}=await open('/sk/articles/',{width:1440,height:900},{javaScriptEnabled:false});
  const n=await page.evaluate(()=>[...document.querySelectorAll('[data-item]')].filter(e=>!e.hidden).length);
  t('archív je bez JS čitateľný', n>=6, `viditeľných ${n}`);
  await ctx.close();
}

// 9 · filter cez URL
{
  const {ctx,page}=await open('/sk/articles/?tag=proces');
  await page.waitForTimeout(400);
  const r=await page.evaluate(()=>({
    visible:[...document.querySelectorAll('[data-item]')].filter(e=>!e.hidden).map(e=>e.dataset.id),
    months:[...document.querySelectorAll('[data-month-head]')].filter(e=>!e.hidden).length,
    result: document.querySelector('[data-result]')?.textContent.trim(),
    pressed: document.querySelector('[data-tag="proces"]')?.getAttribute('aria-pressed'),
    timeline: getComputedStyle(document.querySelector('[data-timeline]')).display,
  }));
  t('?tag= filtruje archív', r.visible.length===2 && r.visible.includes('771001'), JSON.stringify(r.visible));
  t('pri filtri sa mesiace skryjú', r.months===0);
  t('počet výsledkov sa hlási', /2 výsledky/.test(r.result||''), r.result);
  t('štítok je označený ako vybraný', r.pressed==='true');
  t('pri filtri sa časová os skryje', r.timeline==='none', r.timeline);
  await ctx.close();
}

// 10 · reduced motion
{
  const {ctx,page}=await open('/sk/',{width:1440,height:900},{reducedMotion:'reduce'});
  const r=await page.evaluate(()=>({
    motion: getComputedStyle(document.documentElement).getPropertyValue('--motion').trim(),
    t: getComputedStyle(document.documentElement).getPropertyValue('--t-state').trim(),
    revealVisible: [...document.querySelectorAll('.reveal')].every(e=>getComputedStyle(e).opacity==='1'),
  }));
  t('reduced-motion nastaví --motion na 0', r.motion==='0', JSON.stringify(r));
  t('reduced-motion necháva obsah viditeľný', r.revealVisible);
  await ctx.close();
}

// 11 · fokus a klávesnica
{
  const {ctx,page}=await open('/sk/');
  const first=await page.evaluate(async()=>{document.body.focus();return null;});
  await page.keyboard.press('Tab');
  const r=await page.evaluate(()=>{
    const el=document.activeElement;
    const cs=getComputedStyle(el);
    return {cls:el.className, outline:cs.outlineWidth, style:cs.outlineStyle};
  });
  t('prvý Tab je skip link', /skip-link/.test(r.cls), r.cls);
  t('fokusový prstenec má 2 px', parseFloat(r.outline)>=2 && r.style!=='none', JSON.stringify(r));
  await ctx.close();
}

// 12 · orientačné oblasti + alt texty
{
  const {ctx,page}=await open('/sk/articles/836206-hry-ktore-zazijete-iba-raz/');
  const r=await page.evaluate(()=>({
    header:document.querySelectorAll('header').length,
    nav:document.querySelectorAll('nav').length,
    main:document.querySelectorAll('main').length,
    footer:document.querySelectorAll('footer').length,
    imgsNoAlt:[...document.querySelectorAll('img')].filter(i=>i.getAttribute('alt')===null).length,
    h1:document.querySelectorAll('h1').length,
  }));
  t('orientačné oblasti sú na mieste', r.header>=1&&r.nav>=1&&r.main===1&&r.footer>=1, JSON.stringify(r));
  t('každý obrázok má alt', r.imgsNoAlt===0);
  t('presne jeden H1', r.h1===1);
  await ctx.close();
}

// 13 · dotykové ciele na mobile
{
  const {ctx,page}=await open('/sk/articles/',{width:440,height:900});
  const small=await page.evaluate(()=>{
    const out=[];
    for(const el of document.querySelectorAll('a[href], button:not([hidden])')){
      if(el.closest('[hidden]')) continue;
      if(el.dataset.hit==='expanded') continue;
      const r=el.getBoundingClientRect();
      if(r.width===0&&r.height===0) continue;
      if(r.height<44-0.5) out.push((el.className||el.tagName)+' '+Math.round(r.height));
    }
    return out;
  });
  t('dotykové ciele majú aspoň 44 px', small.length===0, small.slice(0,6).join(', '));
  await ctx.close();
}

// 14 · OG a hreflang
{
  const {ctx,page}=await open('/sk/articles/771002-manifest-jedneho-napadu/');
  const r=await page.evaluate(()=>({
    og:document.querySelector('meta[property="og:image"]')?.content,
    alts:[...document.querySelectorAll('link[rel=alternate][hreflang]')].map(l=>l.hreflang),
    canonical: !!document.querySelector('link[rel=canonical]'),
  }));
  t('článok má OG kartu', /\/sk\/og\/771002\.png$/.test(r.og||''), r.og);
  t('hreflang pre obe mutácie', r.alts.includes('sk')&&r.alts.includes('en'), r.alts.join(','));
  t('kanonická adresa', r.canonical);
  await ctx.close();
}

console.log('OK   ('+ok.length+')');
ok.forEach(o=>console.log('  ✓ '+o));
console.log('FAIL ('+fails.length+')');
fails.forEach(f=>console.log('  ✕ '+f));
await b.close(); server.close();
process.exit(fails.length?1:0);
