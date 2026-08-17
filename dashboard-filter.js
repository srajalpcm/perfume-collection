(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
  const money=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selected='All';
  const SOURCES=['All','Designer','Niche','Indian','Middle Eastern'];

  function filtered(){
    if(!Array.isArray(window.perfumes))return [];
    if(selected==='All')return window.perfumes;
    return window.perfumes.filter(p=>String(p.type||'').trim().toLowerCase()===selected.toLowerCase());
  }

  function injectStyle(){
    if($('source-filter-css'))return;
    const s=document.createElement('style');s.id='source-filter-css';s.textContent=`
      .source-filter-wrap{margin:0 0 18px}
      .source-filter-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:9px}
      .source-filter-title{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
      .source-filter-sub{font-size:11px;color:var(--muted)}
      .source-filter{display:flex;gap:7px;flex-wrap:wrap;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:6px;width:max-content;max-width:100%;box-shadow:0 4px 16px rgba(44,31,22,.04)}
      .source-pill{border:0;background:transparent;color:var(--muted);font-weight:850;font-size:12px;padding:9px 13px;border-radius:11px;white-space:nowrap}
      .source-pill:hover{background:var(--soft);color:var(--ink)}
      .source-pill.active{background:var(--ink);color:#fff}
      .source-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 18px}
      .source-card{border:1px solid var(--line);background:var(--card);border-radius:15px;padding:13px;cursor:pointer;transition:.16s;min-width:0}
      .source-card:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(44,31,22,.07)}
      .source-card.active{border-color:var(--accent);box-shadow:0 0 0 2px rgba(139,94,67,.1)}
      .source-card .sc-label{font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:900;color:var(--muted)}
      .source-card .sc-count{font-size:22px;font-weight:950;letter-spacing:-.03em;margin-top:4px}
      .source-card .sc-meta{font-size:10px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .source-empty{opacity:.55}
      @media(max-width:900px){.source-overview{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.source-filter{width:100%;overflow:auto;flex-wrap:nowrap}.source-pill{flex:0 0 auto}.source-filter-head{display:block}.source-filter-sub{margin-top:3px}.source-overview{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.source-card{padding:11px}.source-card .sc-count{font-size:19px}}
    `;document.head.appendChild(s);
  }

  function ensureUI(){
    const stats=$('dCount')?.closest('.stats');
    if(!stats)return;
    let wrap=$('sourceFilterWrap');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='sourceFilterWrap';wrap.className='source-filter-wrap';
      wrap.innerHTML=`<div class="source-filter-head"><div><div class="source-filter-title">View dashboard by source</div><div class="source-filter-sub" id="sourceFilterSub">Showing your full collection</div></div></div><div class="source-filter" role="tablist" aria-label="Perfume source filter">${SOURCES.map(x=>`<button type="button" class="source-pill${x==='All'?' active':''}" data-source-filter="${esc(x)}">${esc(x)}</button>`).join('')}</div><div class="source-overview" id="sourceOverview"></div>`;
      stats.parentNode.insertBefore(wrap,stats);
      wrap.querySelectorAll('[data-source-filter]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.sourceFilter;update();}));
    }
    renderOverview();
  }

  function renderOverview(){
    const el=$('sourceOverview');if(!el||!Array.isArray(window.perfumes))return;
    const rows=SOURCES.slice(1).map(src=>{
      const a=window.perfumes.filter(p=>String(p.type||'').trim().toLowerCase()===src.toLowerCase());
      const spend=a.reduce((s,p)=>s+n(p.price),0);
      const rem=a.reduce((s,p)=>s+n(p.quantityRemaining),0);
      return {src,a,spend,rem};
    });
    el.innerHTML=rows.map(x=>`<div class="source-card${selected===x.src?' active':''}${x.a.length?'':' source-empty'}" data-source-card="${esc(x.src)}"><div class="sc-label">${esc(x.src)}</div><div class="sc-count">${x.a.length}</div><div class="sc-meta">${money(x.spend)} invested · ${x.rem} ml left</div></div>`).join('');
    el.querySelectorAll('[data-source-card]').forEach(c=>c.addEventListener('click',()=>{selected=c.dataset.sourceCard;update();}));
  }

  function set(id,val){const e=$(id);if(e)e.textContent=val}
  function update(){
    ensureUI();
    const data=filtered(), all=window.perfumes||[];
    document.querySelectorAll('[data-source-filter]').forEach(b=>b.classList.toggle('active',b.dataset.sourceFilter===selected));
    set('sourceFilterSub',selected==='All'?'Showing your full collection':`Showing ${data.length} ${selected.toLowerCase()} perfume${data.length===1?'':'s'}`);
    const spend=data.reduce((s,p)=>s+n(p.price),0);
    const rem=data.reduce((s,p)=>s+n(p.quantityRemaining),0);
    const total=data.reduce((s,p)=>s+n(p.quantity),0);
    const shelf=data.reduce((s,p)=>s+(n(p.quantity)>0?n(p.price)*Math.max(0,Math.min(1,n(p.quantityRemaining)/n(p.quantity))):0),0);
    const brands=new Set(data.map(p=>p.brand).filter(Boolean));
    const low=data.filter(p=>n(p.quantity)>0&&n(p.quantityRemaining)/n(p.quantity)<=.25).length;
    const avg=data.length?spend/data.length:0;
    const avg100=total?spend/total*100:0;
    set('dCount',data.length);set('dSpend',money(spend));set('dRemaining',`${rem} ml`);set('dShelfValue',money(shelf));set('dAvgBottle',money(avg));set('dAvg100',money(avg100));set('dBrands',brands.size);set('dLowStock',low);
    const occ={};data.forEach(p=>{const k=p.occasion||'Not set';occ[k]=(occ[k]||0)+1});
    const topOcc=Object.entries(occ).filter(x=>x[0]!=='Not set').sort((a,b)=>b[1]-a[1])[0];
    const byBrand={};data.forEach(p=>{const k=p.brand||'Unknown';byBrand[k]=(byBrand[k]||0)+1});
    const topBrand=Object.entries(byBrand).sort((a,b)=>b[1]-a[1])[0];
    const largest=[...data].sort((a,b)=>n(b.quantity)-n(a.quantity))[0];
    const year=new Date().getFullYear();const yearSpend=data.filter(p=>Number(p.year)===year).reduce((s,p)=>s+n(p.price),0);
    set('xTopBrand',topBrand?topBrand[0]:'—');set('xTopBrandSub',topBrand?`${topBrand[1]} bottle${topBrand[1]===1?'':'s'}`:'Most bottles');set('xTopOccasion',topOcc?topOcc[0]:'—');set('xTopOccasionSub',topOcc?`${topOcc[1]} bottle${topOcc[1]===1?'':'s'}`:'Most represented');set('xYearSpend',money(yearSpend));set('xLargest',largest?`${n(largest.quantity)} ml`:'—');set('xLargestSub',largest?largest.name:'Bottle size');
    const full=data.filter(p=>n(p.quantity)>0&&n(p.quantityRemaining)/n(p.quantity)>=.75).length;
    const used=data.length-full;
    const fill=data.length?Math.round(rem/Math.max(1,total)*100):0;
    set('healthText',data.length?`${fill}% of original volume remains`:'No bottles in this source');set('fullLabel',`${full} mostly full`);set('usedLabel',`${used} in rotation`);set('lowLabel',`${low} low stock`);
    const hf=$('healthFill');if(hf)hf.style.width=Math.max(0,Math.min(100,fill))+'%';
    renderOverview();
  }

  function update(){
    ensureUI();
    const data=filtered();
    document.querySelectorAll('[data-source-filter]').forEach(b=>b.classList.toggle('active',b.dataset.sourceFilter===selected));
    set('sourceFilterSub',selected==='All'?'Showing your full collection':`Showing ${data.length} ${selected.toLowerCase()} perfume${data.length===1?'':'s'}`);
    const spend=data.reduce((s,p)=>s+n(p.price),0),rem=data.reduce((s,p)=>s+n(p.quantityRemaining),0),total=data.reduce((s,p)=>s+n(p.quantity),0),shelf=data.reduce((s,p)=>s+(n(p.quantity)>0?n(p.price)*Math.max(0,Math.min(1,n(p.quantityRemaining)/n(p.quantity))):0),0),brands=new Set(data.map(p=>p.brand).filter(Boolean)),low=data.filter(p=>n(p.quantity)>0&&n(p.quantityRemaining)/n(p.quantity)<=.25).length;
    set('dCount',data.length);set('dSpend',money(spend));set('dRemaining',`${rem} ml`);set('dShelfValue',money(shelf));set('dAvgBottle',money(data.length?spend/data.length:0));set('dAvg100',money(total?spend/total*100:0));set('dBrands',brands.size);set('dLowStock',low);
    const occ={};data.forEach(p=>{const k=p.occasion||'Not set';occ[k]=(occ[k]||0)+1});const topOcc=Object.entries(occ).filter(x=>x[0]!=='Not set').sort((a,b)=>b[1]-a[1])[0];
    const bb={};data.forEach(p=>{const k=p.brand||'Unknown';bb[k]=(bb[k]||0)+1});const topBrand=Object.entries(bb).sort((a,b)=>b[1]-a[1])[0];const largest=[...data].sort((a,b)=>n(b.quantity)-n(a.quantity))[0];
    set('xTopBrand',topBrand?topBrand[0]:'—');set('xTopBrandSub',topBrand?`${topBrand[1]} bottle${topBrand[1]===1?'':'s'}`:'Most bottles');set('xTopOccasion',topOcc?topOcc[0]:'—');set('xTopOccasionSub',topOcc?`${topOcc[1]} bottle${topOcc[1]===1?'':'s'}`:'Most represented');
    const year=new Date().getFullYear();set('xYearSpend',money(data.filter(p=>Number(p.year)===year).reduce((s,p)=>s+n(p.price),0)));set('xLargest',largest?`${n(largest.quantity)} ml`:'—');set('xLargestSub',largest?largest.name:'Bottle size');
    const full=data.filter(p=>n(p.quantity)>0&&n(p.quantityRemaining)/n(p.quantity)>=.75).length,used=data.length-full,fill=data.length?Math.round(rem/Math.max(1,total)*100):0;set('healthText',data.length?`${fill}% of original volume remains`:'No bottles in this source');set('fullLabel',`${full} mostly full`);set('usedLabel',`${used} in rotation`);set('lowLabel',`${low} low stock`);const hf=$('healthFill');if(hf)hf.style.width=Math.max(0,Math.min(100,fill))+'%';renderOverview();
  }

  function hook(){
    injectStyle();
    if(typeof window.renderDashboard==='function'&&!window.renderDashboard.__sourceWrapped){
      const original=window.renderDashboard;
      const wrapped=function(){original.apply(this,arguments);setTimeout(()=>{ensureUI();update();},0)};
      wrapped.__sourceWrapped=true;window.renderDashboard=wrapped;
    }
    setTimeout(()=>{ensureUI();update();},250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();
