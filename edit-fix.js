(function(){
  const byId = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => { const x=Number(v); return Number.isFinite(x)?x:0; };
  const money0 = v => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(num(v));
  const cost = p => num(p.quantity)>0 ? num(p.price)/num(p.quantity)*100 : 0;

  /* ---------- Stable add / edit / save ---------- */
  window.startAdd = function(){
    if(typeof resetForm==='function') resetForm();
    editingId=null;
    const title=byId('formTitle'),save=byId('saveBtn');
    if(title) title.textContent='Add a perfume';
    if(save) save.textContent='Save perfume';
    if(typeof go==='function') go('add');
  };

  window.editPerfume = function(id){
    try {
      const p = perfumes.find(x => String(x.id) === String(id));
      if(!p){ toast('Perfume not found','error'); return; }
      editingId=p.id;
      const fields={name:p.name,brand:p.brand,type:p.type,occasion:p.occasion,cloneOf:p.cloneOf,imageUrl:p.imageUrl,quantity:p.quantity,quantityRemaining:p.quantityRemaining,year:p.year,price:p.price,rating:p.rating,topNotes:p.topNotes,heartNotes:p.heartNotes,baseNotes:p.baseNotes,accords:p.accords,notes:p.notes};
      Object.entries(fields).forEach(([k,v])=>{const el=byId(k);if(el)el.value=v??'';});
      if(byId('formTitle'))byId('formTitle').textContent='Edit perfume';
      if(byId('saveBtn'))byId('saveBtn').textContent='Update perfume';
      if(typeof updateCost==='function')updateCost();
      if(typeof go==='function')go('add');
      setTimeout(()=>byId('perfumeForm')?.scrollIntoView({behavior:'smooth',block:'start'}),40);
    }catch(err){console.error(err);toast('Could not open perfume for editing.','error');}
  };

  window.savePerfume = async function(e){
    e.preventDefault();
    const form=byId('perfumeForm');
    if(!form||!form.reportValidity())return;
    const q=num(byId('quantity')?.value),r=num(byId('quantityRemaining')?.value);
    if(r>q){toast('Remaining cannot exceed bottle size','error');return;}
    const wasEditing=!!editingId;
    const p={id:editingId||crypto.randomUUID(),name:(byId('name')?.value||'').trim(),brand:(byId('brand')?.value||'').trim(),type:byId('type')?.value||'',profile:'',occasion:byId('occasion')?.value||'',cloneOf:(byId('cloneOf')?.value||'').trim(),imageUrl:(byId('imageUrl')?.value||'').trim(),quantity:q,quantityRemaining:r,year:parseInt(byId('year')?.value||'',10)||'',price:num(byId('price')?.value),rating:byId('rating')?.value||'',topNotes:(byId('topNotes')?.value||'').trim(),heartNotes:(byId('heartNotes')?.value||'').trim(),baseNotes:(byId('baseNotes')?.value||'').trim(),accords:(byId('accords')?.value||'').trim(),sourceUrl:'',notes:(byId('notes')?.value||'').trim()};
    const old=perfumes.slice();
    if(wasEditing)perfumes=perfumes.map(x=>String(x.id)===String(p.id)?{...x,...p}:x);else perfumes=[...perfumes,p];
    try{await saveData();toast(wasEditing?'Perfume updated':'Perfume added','success');resetForm();go('collection');}
    catch(err){perfumes=old;toast('Could not save: '+(err.message||err),'error');}
  };

  /* ---------- Product-quality UI pass ---------- */
  function injectCSS(){
    if(byId('premium-ui-css'))return;
    const s=document.createElement('style');s.id='premium-ui-css';s.textContent=`
      :root{--shadow:0 6px 22px rgba(44,31,22,.055);--shadow-hover:0 12px 32px rgba(44,31,22,.09)}
      .stat{min-height:128px;display:flex;flex-direction:column;justify-content:space-between;transition:transform .18s,box-shadow .18s;border-radius:18px}
      .stat:hover{transform:translateY(-2px);box-shadow:var(--shadow-hover)}
      .stats{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .stat .value{font-size:28px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .stat .sub{min-height:16px}
      .stat-kpi{display:flex;align-items:center;justify-content:space-between;gap:10px}.stat-icon{width:34px;height:34px;border-radius:11px;background:var(--soft);display:grid;place-items:center;font-size:15px;color:var(--accent)}
      .dashboard-section-title{font-size:18px;font-weight:900;letter-spacing:-.025em;margin:28px 0 11px}.dashboard-section-sub{color:var(--muted);font-size:12px;margin:-5px 0 12px}
      .mini-insights{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}.mini-insight{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:15px}.mini-insight .label{font-size:10px;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:.08em}.mini-insight strong{display:block;font-size:17px;margin-top:6px;letter-spacing:-.02em}.mini-insight span{display:block;color:var(--muted);font-size:11px;margin-top:3px}
      .health-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.health-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px}.health-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px}.health-head strong{font-size:15px}.health-head span{font-size:11px;color:var(--muted)}.health-meter{height:12px;border-radius:99px;background:#eee7df;overflow:hidden}.health-meter>i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#8b5e43,#c6a081)}.health-legend{display:flex;justify-content:space-between;gap:8px;margin-top:9px;font-size:10px;color:var(--muted)}
      .card{box-shadow:var(--shadow)}.card:hover{box-shadow:var(--shadow-hover)}
      .perfume-card{transition:transform .18s,box-shadow .18s}.perfume-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-hover)}
      .perfume-card:hover .bottle img{transform:none!important}.bottle{isolation:isolate}.bottle img{position:relative;z-index:0}.card-chip{z-index:10}.card-content{position:relative;z-index:2;background:var(--card)}
      .card-foot .btn,.row-actions .btn{transition:background .15s,border-color .15s,transform .15s}.card-foot .btn:hover,.row-actions .btn:hover{transform:translateY(-1px)}
      .filters{box-shadow:0 2px 10px rgba(44,31,22,.025)}
      .collection-grid{align-items:stretch}.collection-grid .insight{min-height:120px;display:flex;align-items:center;justify-content:center}
      .empty-state{text-align:center;padding:42px 18px}.empty-state h3{margin:0 0 5px;font-size:18px}.empty-state p{margin:0 0 15px;color:var(--muted);font-size:12px}
      @media(max-width:1200px){.stats{grid-template-columns:repeat(4,minmax(0,1fr))}.mini-insights{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:760px){.stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.stat{min-height:112px;padding:14px}.stat .value{font-size:21px}.stat-icon{width:30px;height:30px}.mini-insights{grid-template-columns:1fr 1fr;gap:9px}.mini-insight{padding:13px}.mini-insight strong{font-size:15px}.health-grid{grid-template-columns:1fr;gap:10px}.dashboard-section-title{margin-top:22px}.card-head{padding:15px 14px 10px}.card-body{padding:0 14px 14px}.hero{margin-bottom:18px}}
      @media(max-width:420px){.stats{grid-template-columns:1fr 1fr}.stat{min-height:105px}.stat .value{font-size:19px}.mini-insights{grid-template-columns:1fr}.bottle{height:270px}}
    `;document.head.appendChild(s);
  }

  function setupKpis(){
    const stats=byId('dCount')?.closest('.stats');
    if(!stats||stats.dataset.premium==='1')return;
    stats.dataset.premium='1';
    stats.innerHTML=`
      <div class="stat"><div class="stat-kpi"><div class="kicker">Collection</div><div class="stat-icon">◈</div></div><div class="value" id="dCount">0</div><div class="sub">bottles in your shelf</div></div>
      <div class="stat"><div class="stat-kpi"><div class="kicker">Shelf value</div><div class="stat-icon">₹</div></div><div class="value" id="dShelfValue">₹0</div><div class="sub">estimated value remaining</div></div>
      <div class="stat"><div class="stat-kpi"><div class="kicker">Invested</div><div class="stat-icon">↗</div></div><div class="value" id="dSpend">₹0</div><div class="sub">total acquisition spend</div></div>
      <div class="stat"><div class="stat-kpi"><div class="kicker">Remaining</div><div class="stat-icon">◒</div></div><div class="value" id="dRemaining">0 ml</div><div class="sub">liquid left across bottles</div></div>
      <div class="stat"><div class="stat-kpi"><div class="kicker">Avg. bottle</div><div class="stat-icon">◆</div></div><div class="value" id="dAvgBottle">₹0</div><div class="sub">average acquisition price</div></div>
      <div class="stat"><div class="stat-kpi"><div class="kicker">Avg. ₹ / 100 ml</div><div class="stat-icon">⌁</div></div><div class="value" id="dAvg100">₹0</div><div class="sub">weighted by bottle size</div></div>
      <div class="stat"><div class="stat-kpi"><div class="kicker">Brands</div><div class="stat-icon">✦</div></div><div class="value" id="dBrands">0</div><div class="sub">different houses</div></div>
      <div class="stat"><div class="stat-kpi"><div class="kicker">Low stock</div><div class="stat-icon">!</div></div><div class="value" id="dLowStock">0</div><div class="sub">at or below 25%</div></div>`;
  }

  function ensureMiniInsights(){
    if(byId('premiumMiniInsights'))return;
    const anchor=byId('recentList')?.closest('.split');
    if(!anchor)return;
    const el=document.createElement('div');el.id='premiumMiniInsights';el.className='mini-insights';
    el.innerHTML=`
      <div class="mini-insight"><div class="label">Biggest brand</div><strong id="xTopBrand">—</strong><span id="xTopBrandSub">Most bottles</span></div>
      <div class="mini-insight"><div class="label">Top occasion</div><strong id="xTopOccasion">—</strong><span id="xTopOccasionSub">Most represented</span></div>
      <div class="mini-insight"><div class="label">This year</div><strong id="xYearSpend">₹0</strong><span>acquisition spend</span></div>
      <div class="mini-insight"><div class="label">Largest bottle</div><strong id="xLargest">—</strong><span id="xLargestSub">Bottle size</span></div>`;
    anchor.insertAdjacentElement('afterend',el);
  }

  function ensureHealth(){
    if(byId('premiumHealth'))return;
    const mini=byId('premiumMiniInsights');if(!mini)return;
    const el=document.createElement('div');el.id='premiumHealth';el.className='health-grid';
    el.innerHTML=`
      <div class="health-card"><div class="health-head"><strong>Collection health</strong><span id="healthText">—</span></div><div class="health-meter"><i id="healthFill" style="width:0%"></i></div><div class="health-legend"><span id="fullLabel">Full</span><span id="usedLabel">Used</span><span id="lowLabel">Low stock</span></div></div>
      <div class="health-card"><div class="health-head"><strong>Collection mix</strong><span id="mixText">—</span></div><div id="mixRows"></div></div>`;
    mini.insertAdjacentElement('afterend',el);
  }

  function refreshPremiumData(){
    if(!Array.isArray(perfumes))return;
    const count=perfumes.length;
    const spend=perfumes.reduce((s,p)=>s+num(p.price),0);
    const remaining=perfumes.reduce((s,p)=>s+num(p.quantityRemaining),0);
    const shelf=perfumes.reduce((s,p)=>s+(num(p.quantity)>0?num(p.price)*Math.max(0,Math.min(1,num(p.quantityRemaining)/num(p.quantity))):0),0);
    const avg=count?spend/count:0;
    const totalMl=perfumes.reduce((s,p)=>s+num(p.quantity),0);
    const avg100=totalMl?spend/totalMl*100:0;
    const brands={};const occ={};const types={};
    perfumes.forEach(p=>{brands[p.brand||'Unknown']=(brands[p.brand||'Unknown']||0)+1;occ[p.occasion||'Not set']=(occ[p.occasion||'Not set']||0)+1;types[p.type||'Not set']=(types[p.type||'Not set']||0)+1});
    const topBrand=Object.entries(brands).sort((a,b)=>b[1]-a[1])[0];const topOcc=Object.entries(occ).filter(x=>x[0]!=='Not set').sort((a,b)=>b[1]-a[1])[0];
    const low=perfumes.filter(p=>num(p.quantity)>0&&num(p.quantityRemaining)/num(p.quantity)<=.25).length;
    const full=perfumes.filter(p=>num(p.quantity)>0&&num(p.quantityRemaining)/num(p.quantity)>=.75).length;
    const used=count-full;
    const largest=[...perfumes].sort((a,b)=>num(b.quantity)-num(a.quantity))[0];
    const year=new Date().getFullYear();const yearSpend=perfumes.filter(p=>Number(p.year)===year).reduce((s,p)=>s+num(p.price),0);
    if(byId('dShelfValue'))byId('dShelfValue').textContent=money0(shelf);
    if(byId('dAvgBottle'))byId('dAvgBottle').textContent=money0(avg);
    if(byId('dAvg100'))byId('dAvg100').textContent=money0(avg100);
    if(byId('xTopBrand'))byId('xTopBrand').textContent=topBrand?topBrand[0]:'—';
    if(byId('xTopBrandSub'))byId('xTopBrandSub').textContent=topBrand?`${topBrand[1]} bottle${topBrand[1]===1?'':'s'}`:'Most bottles';
    if(byId('xTopOccasion'))byId('xTopOccasion').textContent=topOcc?topOcc[0]:'—';
    if(byId('xTopOccasionSub'))byId('xTopOccasionSub').textContent=topOcc?`${topOcc[1]} bottle${topOcc[1]===1?'':'s'}`:'Most represented';
    if(byId('xYearSpend'))byId('xYearSpend').textContent=money0(yearSpend);
    if(byId('xLargest'))byId('xLargest').textContent=largest?`${num(largest.quantity)} ml`:'—';
    if(byId('xLargestSub'))byId('xLargestSub').textContent=largest?largest.name:'Bottle size';
    const fill=count?Math.round(remaining/Math.max(1,totalMl)*100):0;
    if(byId('healthFill'))byId('healthFill').style.width=Math.max(0,Math.min(100,fill))+'%';
    if(byId('healthText'))byId('healthText').textContent=count?`${fill}% of original volume remains`:'No bottles yet';
    if(byId('fullLabel'))byId('fullLabel').textContent=`${full} mostly full`;
    if(byId('usedLabel'))byId('usedLabel').textContent=`${used} in rotation`;
    if(byId('lowLabel'))byId('lowLabel').textContent=`${low} low stock`;
    const entries=Object.entries(types).sort((a,b)=>b[1]-a[1]);
    if(byId('mixRows'))byId('mixRows').innerHTML=entries.length?entries.slice(0,4).map(([k,v])=>`<div class="bar-row"><span>${esc(k)}</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.max(4,v/(entries[0][1]||1)*100)}%"></div></div><b>${v}</b></div>`).join(''):'<div class="muted" style="font-size:12px">Add perfumes to see your mix.</div>';
    if(byId('mixText'))byId('mixText').textContent=entries.length?`${entries.length} categories`:'—';
  }

  const originalDashboard=window.renderDashboard;
  window.renderDashboard=function(){
    setupKpis();
    ensureMiniInsights();
    ensureHealth();
    if(typeof originalDashboard==='function')originalDashboard();
    refreshPremiumData();
  };

  injectCSS();
  setupKpis();
  ensureMiniInsights();
  ensureHealth();

  window.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[onclick="go(\'add\')"]').forEach(b=>b.setAttribute('onclick','startAdd()'));
    document.querySelectorAll('[data-mobile="add"]').forEach(b=>b.setAttribute('onclick','startAdd()'));
    // Keep the account/profile interaction simple on mobile.
    document.querySelectorAll('.profile-menu .profile-item').forEach(b=>b.addEventListener('click',()=>closeProfile&&closeProfile()));
  });
})();
