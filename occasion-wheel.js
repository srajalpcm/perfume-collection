(function(){
'use strict';
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function list(){try{var p=window.eval('perfumes');return Array.isArray(p)?p:[]}catch(e){return []}}
function split(s){return String(s||'').split(/[,;|]/).map(function(x){return x.trim()}).filter(Boolean)}
function setup(){
 if(document.getElementById('occasionWheelModal'))return;
 var hero=document.querySelector('#page-dashboard .hero-actions')||document.querySelector('.hero-actions');
 if(hero&&!document.getElementById('openOccasionWheel')){var b=document.createElement('button');b.id='openOccasionWheel';b.className='btn scent-day-btn';b.type='button';b.textContent='🎲 Spin "Scent of the Day"';b.onclick=open;hero.appendChild(b)}
 var style=document.createElement('style');style.id='occasion-wheel-css';style.textContent=
 '.scent-day-btn{background:#fff51a!important;color:#202b49!important;border:0!important;font-weight:900!important;border-radius:10px!important;padding:12px 18px!important;box-shadow:0 5px 0 rgba(0,0,0,.08)}.scent-day-btn:hover{filter:brightness(.97);transform:translateY(-1px)}.wheel-modal{display:none;position:fixed;inset:0;z-index:9999;background:rgba(19,27,48,.68);align-items:center;justify-content:center;padding:16px}.wheel-modal.open{display:flex}.wheel-panel{width:min(520px,100%);background:#fffdf9;color:#211d19;border-radius:22px;padding:22px;box-shadow:0 25px 80px rgba(0,0,0,.3);max-height:90vh;overflow:auto}.wheel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.wheel-head h2{margin:5px 0 0;font-size:25px}.wheel-stage{margin:18px 0;padding:24px 16px;background:#f6f0e9;border:1px solid #e7dfd5;border-radius:16px;text-align:center}.wheel-name{font-size:23px;font-weight:900;line-height:1.2}.wheel-sub{font-size:12px;color:#7b726a;margin-top:8px}.wheel-result{display:none;align-items:center;gap:14px;text-align:left;margin-top:16px;padding-top:15px;border-top:1px solid #e7dfd5}.wheel-result.show{display:flex}.wheel-result img{width:76px;height:96px;object-fit:contain;border-radius:10px;background:#eee6dd;flex-shrink:0}.wheel-result h3{font-size:15px;margin:0 0 4px}.wheel-result p{font-size:12px;color:#7b726a;margin:0 0 10px}.wheel-panel .field select{width:100%;border:1px solid #e7dfd5;background:#fff;border-radius:11px;padding:11px;color:#211d19}.wheel-panel #wheelSpin{margin-top:2px}.wheel-panel #wheelSpin:disabled{opacity:.7;cursor:wait}@media(max-width:600px){.wheel-panel{padding:17px}.wheel-name{font-size:20px}.scent-day-btn{width:100%}}';
 document.head.appendChild(style);
 var m=document.createElement('div');m.id='occasionWheelModal';m.className='wheel-modal';m.innerHTML='<section class="wheel-panel" role="dialog" aria-modal="true" aria-labelledby="wheelTitle"><div class="wheel-head"><div><div class="eyebrow">Your fragrance shelf</div><h2 id="wheelTitle">Spin the scent of the day</h2><p class="muted" style="margin:5px 0 0;font-size:13px">Pick an occasion, then let your collection choose for you.</p></div><button class="icon-btn" id="wheelClose" type="button" aria-label="Close">✕</button></div><div class="field" style="margin-top:18px"><label for="wheelOccasion">Choose an occasion</label><select id="wheelOccasion"><option value="__all">Any occasion — surprise me</option></select></div><div class="wheel-stage"><div id="wheelName" class="wheel-name">Ready when you are</div><div id="wheelSub" class="wheel-sub">Your next scent is one spin away.</div><div id="wheelResult" class="wheel-result"></div></div><button class="btn btn-block scent-day-btn" id="wheelSpin" type="button">🎲 Spin "Scent of the Day"</button><p class="muted" style="font-size:11px;margin:12px 0 0">Chooses randomly from your saved collection. It won't change your inventory.</p></section>';
 document.body.appendChild(m);
 document.getElementById('wheelClose').onclick=close;m.addEventListener('click',function(e){if(e.target===m)close()});document.getElementById('wheelSpin').onclick=spin;
 document.getElementById('wheelOccasion').onchange=reset;
}
function reset(){document.getElementById('wheelResult').classList.remove('show');document.getElementById('wheelName').textContent='Ready when you are';document.getElementById('wheelSub').textContent='Your next scent is one spin away.'}
function open(){
 setup();if(typeof go==='function')go('dashboard');
 var perfumes=list(),sel=document.getElementById('wheelOccasion'),occs=[...new Set(perfumes.flatMap(function(p){return split(p.occasion)}))].sort();
 sel.innerHTML='<option value="__all">Any occasion — surprise me</option>'+occs.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join('');
 reset();document.getElementById('occasionWheelModal').classList.add('open');document.body.style.overflow='hidden';
}
function close(){var m=document.getElementById('occasionWheelModal');if(m)m.classList.remove('open');document.body.style.overflow=''}
function spin(){
 var perfumes=list(),o=document.getElementById('wheelOccasion').value;
 if(o!=='__all')perfumes=perfumes.filter(function(p){return split(p.occasion).some(function(x){return x.toLowerCase()===o.toLowerCase()})});
 var name=document.getElementById('wheelName'),sub=document.getElementById('wheelSub'),res=document.getElementById('wheelResult'),btn=document.getElementById('wheelSpin');
 res.classList.remove('show');
 if(!perfumes.length){name.textContent='No matching perfumes';sub.textContent=o==='__all'?'Add perfumes to your collection first.':'No perfumes are tagged for this occasion yet. Add this occasion to a perfume, or choose another.';return}
 btn.disabled=true;btn.textContent='Spinning…';var winner=perfumes[Math.floor(Math.random()*perfumes.length)],start=Date.now(),duration=1900;
 function tick(){if(Date.now()-start<duration){name.textContent=perfumes[Math.floor(Math.random()*perfumes.length)].name||'Your next scent';setTimeout(tick,70+Math.min(100,(Date.now()-start)/duration*100));return}
 name.textContent=winner.name;sub.textContent='Picked from '+perfumes.length+' eligible perfume'+(perfumes.length===1?'':'s')+'.';
 res.innerHTML=(winner.imageUrl?'<img src="'+esc(winner.imageUrl)+'" alt="" onerror="this.style.visibility=\'hidden\'">':'')+'<div><h3>'+esc(winner.name)+'</h3><p>'+esc(winner.brand)+(winner.occasion?' · '+esc(winner.occasion):'')+'</p><button class="btn btn-accent btn-sm" type="button" id="wheelViewWinner">View perfume</button></div>';res.classList.add('show');
 document.getElementById('wheelViewWinner').onclick=function(){close();if(typeof showDetails==='function')showDetails(winner.id);else if(typeof go==='function')go('collection')};
 btn.disabled=false;btn.textContent='Spin again';
 }tick();
}
window.openOccasionWheel=open;document.addEventListener('DOMContentLoaded',setup);window.addEventListener('load',setup);
})();