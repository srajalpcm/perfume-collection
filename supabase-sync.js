/* Cloud sync layer for My Perfume Collection */
(function(){
  const SUPABASE_URL = 'https://hlhvzgaedcwprvactlwm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_tkI9iZMT722qLWYflXtxjw_98Qolbmx';
  const SCRIPT_ID = 'supabase-js-cdn';
  let sb;
  let sessionUser = null;
  let originalSave;

  function loadClient(){
    return new Promise((resolve,reject)=>{
      if(window.supabase){ sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY); return resolve(sb); }
      const s=document.createElement('script'); s.id=SCRIPT_ID; s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload=()=>{ try{ sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY); resolve(sb); }catch(e){reject(e)} };
      s.onerror=()=>reject(new Error('Could not load Supabase client.'));
      document.head.appendChild(s);
    });
  }
  function addStyles(){
    const s=document.createElement('style');s.textContent='.cloud-gate{position:fixed;inset:0;background:rgba(247,244,239,.97);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}.cloud-box{width:min(440px,100%);background:#fff;border:1px solid #e5ded6;border-radius:22px;padding:28px;box-shadow:0 20px 70px rgba(60,45,30,.14)}.cloud-box h2{margin:0 0 6px}.cloud-box p{color:#746b63;font-size:14px;line-height:1.5}.cloud-box input{width:100%;border:1px solid #e5ded6;border-radius:10px;padding:11px;margin:6px 0 10px}.cloud-box .row{display:flex;gap:8px;margin-top:10px}.cloud-box button{border:1px solid #e5ded6;background:#fff;border-radius:10px;padding:10px 13px;flex:1}.cloud-box button.primary{background:#24201c;color:#fff;border-color:#24201c}.cloud-status{font-size:12px;margin-top:10px;min-height:18px;color:#746b63}.cloud-user{position:fixed;right:18px;top:78px;z-index:25;display:flex;gap:7px;align-items:center;background:#fff;border:1px solid #e5ded6;border-radius:999px;padding:6px 9px 6px 11px;font-size:12px;box-shadow:0 5px 18px rgba(60,45,30,.08)}.cloud-user button{border:0;background:#24201c;color:#fff;border-radius:999px;padding:6px 9px;font-size:11px}';document.head.appendChild(s)
  }
  function gate(){
    const d=document.createElement('div');d.className='cloud-gate';d.id='cloudGate';d.innerHTML='<div class="cloud-box"><h2>My Perfume Collection</h2><p>Your collection is now cloud-backed. Sign in to access it from any device.</p><label>Email</label><input id="cloudEmail" type="email" autocomplete="email" placeholder="you@example.com"><label>Password</label><input id="cloudPassword" type="password" autocomplete="current-password" placeholder="Password"><div class="row"><button class="primary" id="cloudLogin">Sign in</button><button id="cloudSignup">Create account</button></div><div class="cloud-status" id="cloudStatus"></div></div>';
    document.body.appendChild(d);
    $('cloudLogin').onclick=()=>auth('login'); $('cloudSignup').onclick=()=>auth('signup');
  }
  function status(t){const e=document.getElementById('cloudStatus');if(e)e.textContent=t}
  async function auth(mode){
    const email=document.getElementById('cloudEmail').value.trim(), password=document.getElementById('cloudPassword').value;
    if(!email||!password){status('Enter your email and password.');return}
    status(mode==='login'?'Signing in…':'Creating account…');
    try{
      let result;
      if(mode==='login') result=await sb.auth.signInWithPassword({email,password});
      else result=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.href}});
      if(result.error) throw result.error;
      if(mode==='signup' && !result.data.session){status('Account created. Check your email to confirm, then return here and sign in.');return}
      await boot(result.data.session||result.data.user?.session);
    }catch(e){status(e.message||'Authentication failed.')}
  }
  function userBadge(){
    const old=document.getElementById('cloudUser');if(old)old.remove();
    const d=document.createElement('div');d.id='cloudUser';d.className='cloud-user';d.innerHTML='<span>'+esc(sessionUser.email||'Signed in')+'</span><button id="cloudLogout">Sign out</button>';
    document.body.appendChild(d);document.getElementById('cloudLogout').onclick=()=>sb.auth.signOut();
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function toRow(p){return {id:p.id,user_id:sessionUser.id,name:p.name,brand:p.brand,type:p.type||null,occasion:p.occasion||null,clone_of:p.cloneOf||null,image:p.image||null,volume:Number(p.volume)||0,remaining:Number(p.remaining)||0,year:p.year?Number(p.year):null,price:Number(p.price)||0,rating:p.rating!==''&&p.rating!=null?Number(p.rating):null,top_notes:p.topNotes||null,heart_notes:p.heartNotes||null,base_notes:p.baseNotes||null,accords:p.accords||null,source:p.source||null,my_notes:p.myNotes||null,updated_at:new Date().toISOString()}}
  function fromRow(r){return {id:r.id,name:r.name,brand:r.brand,type:r.type||'',occasion:r.occasion||'',cloneOf:r.clone_of||'',image:r.image||'',volume:Number(r.volume)||0,remaining:Number(r.remaining)||0,year:r.year||'',price:Number(r.price)||0,rating:r.rating==null?'':r.rating,image:r.image||'',topNotes:r.top_notes||'',heartNotes:r.heart_notes||'',baseNotes:r.base_notes||'',accords:r.accords||'',source:r.source||'',myNotes:r.my_notes||''}}
  async function fetchCloud(){const {data,error}=await sb.from('perfumes').select('*').order('created_at',{ascending:true});if(error)throw error;return data||[]}
  async function replaceCloud(items){
    const {error:delErr}=await sb.from('perfumes').delete().eq('user_id',sessionUser.id);if(delErr)throw delErr;
    if(items.length){const {error}=await sb.from('perfumes').insert(items.map(toRow));if(error)throw error}
  }
  async function cloudSave(){
    try{
      localStorage.setItem('perfumeCollection.v10',JSON.stringify(collection));
      await replaceCloud(collection);
      refreshAll();
    }catch(e){toast('Cloud save failed: '+(e.message||e))}
  }
  async function boot(){
    sessionUser=(await sb.auth.getUser()).data.user;if(!sessionUser)return;
    userBadge();
    const cloud=await fetchCloud();
    if(cloud.length===0 && Array.isArray(collection) && collection.length>0){
      if(confirm('I found your existing browser collection. Upload it to your new cloud account?')){status('');await replaceCloud(collection);toast('Existing collection uploaded to cloud.');}
      else collection=[];
    }else collection=cloud.map(fromRow);
    localStorage.setItem('perfumeCollection.v10',JSON.stringify(collection));refreshAll();
    if(originalSave===undefined){originalSave=save;save=cloudSave;}
    const gate=document.getElementById('cloudGate');if(gate)gate.remove();
  }
  async function start(){
    addStyles();
    try{await loadClient();const {data}=await sb.auth.getSession();sb.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_IN'&&s)boot().catch(e=>toast(e.message));if(event==='SIGNED_OUT'){sessionUser=null;location.reload()}});if(data.session)await boot();else gate();}
    catch(e){gate();status(e.message||'Supabase connection failed.')}
  }
  window.addEventListener('load',start);
})();
