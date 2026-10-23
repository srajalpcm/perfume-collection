(function(){
'use strict';
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function split(s){return String(s||'').split(/[,;|]/).map(function(x){return x.trim()}).filter(Boolean)}
function setup(){
 if(document.getElementById('occasionWheelModal'))return;
 var hero=document.querySelector('.hero-actions');
 if(hero&&!document.getElementById('openOccasionWheel')){var b=document.createElement('button');b.id='openOccasionWheel';b.className='btn';b.type='button';b.textContent='🎡 Pick for me';b.onclick=open;hero.appendChild(b)}
 var m=document.createElement('div');m.id='occasionWheelModal';m.className='wheel-modal';m.innerHTML='<section class="wheel-panel" role="dialog" aria-modal="true" aria-labelledby="wheelTitle"><div class="wheel-head"><div><div class="eyebrow">Your scent, by chance</div><h2 id="wheelTitle">Spin the shelf</h2><p class="muted" style="margin:5px 0 0;font-size:13px">Choose an occasion and let your collection decide.</p></div><button class="icon-btn" id="wheelClose" type="button" aria-label="Close">✕</button></div><div class="field" style="margin-top:18px"><label for="wheelOccasion">Occasion</label><select id="wheelOccasion"><option value="__all">Surprise me — any occasion</option></select></div><div class="wheel-stage"><div class="wheel-window"><div id="wheelName" class="wheel-name">Ready when you are</div></div><div id="wheelSub" class="wheel-sub">Spin to get a random pick.</div><div id="wheelResult" class="wheel-result"></div></div><button class="btn btn-accent btn-block" id="wheelSpin" type="button">🎡 Spin the wheel</button><p class="muted" style="font-size:11px;margin:12px 0 0">Randomly selects from perfumes currently visible in your Collection view. Your inventory is never changed.</p></section>';
 document.body.appendChild(m);
 document.getElementById('wheelClose').onclick=close;
 m.addEventListener('click',function(e){if(e.target===m)close()});
 document.getElementById('wheelSpin').onclick=spin;
 document.getElementById('wheelOccasion').onchange=function(){document.getElementById('wheelResult').classList.remove('show');document.getElementById('wheelName').textContent='Ready when you are';document.getElementById('wheelSub').textContent='Spin to get a random pick.'};
}
function readCards(){
 var cards=Array.prototype.slice.call(document.querySelectorAll('#collectionGrid .perfume-card'));
 return cards.map(function(c){var title=c.querySelector('.card-title'),brand=c.querySelector('.card-brand'),chips=Array.prototype.slice.call(c.querySelectorAll('.meta-row .chip'));var occasion=chips.length?chips[0].textContent.trim():'';var img=c.querySelector('.bottle img');var btn=c.querySelector('.card-foot button');var onclick=btn?btn.getAttribute('onclick')||'':'';var match=onclick.match(/showDetails\(['"]([^'"]+)/);return {name:title?title.textContent.trim():'',brand:brand?brand.textContent.trim():'',occasion:occasion,image:img?img.src:'',id:match?match[1]:''}}).filter(function(p){return p.name})
}
function open(){
 setup();
 if(typeof go==='function')go('collection');
 var list=readCards(),sel=document.getElementById('wheelOccasion'),occ=[...new Set(list.flatMap(function(p){return split(p.occasion)}))].sort();
 sel.innerHTML='<option value="__all">Surprise me — any occasion</option>'+occ.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join('');
 document.getElementById('wheelResult').classList.remove('show');document.getElementById('occasionWheelModal').classList.add('open');document.body.style.overflow='hidden';
}
function close(){var m=document.getElementById('occasionWheelModal');if(m)m.classList.remove('open');document.body.style.overflow=''}
function spin(){
 var list=readCards(),o=document.getElementById('wheelOccasion').value;
 if(o!=='__all')list=list.filter(function(p){return split(p.occasion).some(function(x){return x.toLowerCase()===o.toLowerCase()})});
 var name=document.getElementById('wheelName'),sub=document.getElementById('wheelSub'),res=document.getElementById('wheelResult'),btn=document.getElementById('wheelSpin');
 res.classList.remove('show');
 if(!list.length){name.textContent='No matching perfumes';sub.textContent='Browse your Collection first, clear other filters, or tag perfumes with this occasion.';return}
 btn.disabled=true;btn.textContent='Spinning…';var winner=list[Math.floor(Math.random()*list.length)],start=Date.now(),duration=2200;
 function tick(){if(Date.now()-start<duration){name.textContent=list[Math.floor(Math.random()*list.length)].name;setTimeout(tick,75+Math.min(100,(Date.now()-start)/duration*100));return}
 name.textContent=winner.name;sub.textContent='Picked from '+list.length+' eligible perfume'+(list.length===1?'':'s')+'.';
 res.innerHTML='<img src="'+esc(winner.image)+'" alt="" onerror="this.style.visibility=\'hidden\'"><div><h3>'+esc(winner.name)+'</h3><p>'+esc(winner.brand)+(winner.occasion?' · '+esc(winner.occasion):'')+'</p><button class="btn btn-accent btn-sm" type="button" id="wheelViewWinner">View perfume</button></div>';res.classList.add('show');
 document.getElementById('wheelViewWinner').onclick=function(){close();if(winner.id&&typeof showDetails==='function')showDetails(winner.id)};
 btn.disabled=false;btn.textContent='Spin again';
 }tick();
}
window.openOccasionWheel=open;document.addEventListener('DOMContentLoaded',setup);window.addEventListener('load',setup);
})();