/* Cloud sync layer for My Perfume Collection */
(function(){
  const SUPABASE_URL = 'https://hlhvzgaedcwprvactlwm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_tkI9iZMT722qLWYflXtxjw_98Qolbmx';
  const SCRIPT_ID = 'supabase-js-cdn';
  let sb;
  let sessionUser = null;
  let originalSave;
  let authBusy = false;

  function loadClient(){
    return new Promise((resolve,reject)=>{
      if(window.supabase){ sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY); return resolve(sb); }
      const s=document.createElement('script'); s.id=SCRIPT_ID; s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload=()=>{ try{ sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY); resolve(sb); }catch(e){reject(e)} };
      s.onerror=()=>reject(new Error('Could not load the Supabase client. Please check your internet connection and refresh the page.'));
      document.head.appendChild(s);
    });
  }

  function addStyles(){
    const s=document.createElement('style');
    s.textContent=`
      .cloud-gate{position:fixed;inset:0;background:rgba(247,244,239,.98);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
      .cloud-box{width:min(460px,100%);background:#fff;border:1px solid #e5ded6;border-radius:22px;padding:28px;box-shadow:0 20px 70px rgba(60,45,30,.14)}
      .cloud-box h2{margin:0 0 6px}.cloud-box p{color:#746b63;font-size:14px;line-height:1.5}
      .cloud-box label{display:block;font-size:12px;font-weight:700;color:#746b63;margin:10px 0 5px}
      .cloud-box input{width:100%;border:1px solid #e5ded6;border-radius:10px;padding:11px;margin:0;outline:none;transition:.15s}
      .cloud-box input:focus{border-color:#8d5b3f;box-shadow:0 0 0 3px rgba(141,91,63,.08)}
      .cloud-box input.invalid{border-color:#b84949;background:#fffafa}
      .cloud-box .row{display:flex;gap:8px;margin-top:14px}
      .cloud-box button{border:1px solid #e5ded6;background:#fff;border-radius:10px;padding:10px 13px;flex:1;font-weight:700;cursor:pointer}
      .cloud-box button.primary{background:#24201c;color:#fff;border-color:#24201c}
      .cloud-box button:disabled{opacity:.55;cursor:not-allowed}
      .cloud-status{font-size:13px;margin-top:12px;min-height:20px;line-height:1.45;padding:0}
      .cloud-status.info{color:#746b63}.cloud-status.success{color:#237a45;background:#edf8f1;border:1px solid #cfe9d8;border-radius:10px;padding:9px 10px}.cloud-status.error{color:#9b3434;background:#fff2f2;border:1px solid #efcaca;border-radius:10px;padding:9px 10px}.cloud-status.warning{color:#86601d;background:#fff8e8;border:1px solid #edd8a2;border-radius:10px;padding:9px 10px}
      .cloud-help{font-size:11px;color:#8a8179;margin-top:7px;line-height:1.45}.cloud-link{color:#8d5b3f;font-weight:700;text-decoration:none}.cloud-link:hover{text-decoration:underline}
      .cloud-user{position:fixed;right:18px;top:78px;z-index:25;display:flex;gap:7px;align-items:center;background:#fff;border:1px solid #e5ded6;border-radius:999px;padding:6px 9px 6px 11px;font-size:12px;box-shadow:0 5px 18px rgba(60,45,30,.08)}
      .cloud-user button{border:0;background:#24201c;color:#fff;border-radius:999px;padding:6px 9px;font-size:11px;cursor:pointer}
    `;
    document.head.appendChild(s);
  }

  function gate(){
    if(document.getElementById('cloudGate')) return;
    const d=document.createElement('div');
    d.className='cloud-gate';
    d.id='cloudGate';
    d.innerHTML=`<div class="cloud-box">
      <h2>My Perfume Collection</h2>
      <p>Your collection is cloud-backed. Create a personal account or sign in to access it from any device.</p>
      <label for="cloudEmail">Email address</label>
      <input id="cloudEmail" type="email" autocomplete="email" placeholder="you@example.com">
      <div id="cloudEmailHelp" class="cloud-help">Use an email address you can access for confirmation.</div>
      <label for="cloudPassword">Password</label>
      <input id="cloudPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters">
      <div id="cloudPasswordHelp" class="cloud-help">Minimum 6 characters.</div>
      <div class="row"><button type="button" class="primary" id="cloudLogin">Sign in</button><button type="button" id="cloudSignup">Create account</button></div>
      <div class="cloud-status info" id="cloudStatus" aria-live="polite"></div>
    </div>`;
    document.body.appendChild(d);

    const email=document.getElementById('cloudEmail');
    const password=document.getElementById('cloudPassword');
    email.addEventListener('input',()=>clearFieldState(email,'cloudEmailHelp','Use an email address you can access for confirmation.'));
    password.addEventListener('input',()=>clearFieldState(password,'cloudPasswordHelp','Minimum 6 characters.'));
    email.addEventListener('keydown',e=>{if(e.key==='Enter')auth('login')});
    password.addEventListener('keydown',e=>{if(e.key==='Enter')auth('login')});
    document.getElementById('cloudLogin').onclick=()=>auth('login');
    document.getElementById('cloudSignup').onclick=()=>auth('signup');
  }

  function clearFieldState(input,helpId,defaultText){
    input.classList.remove('invalid');
    const h=document.getElementById(helpId); if(h) h.textContent=defaultText;
  }

  function status(t,type='info'){
    const e=document.getElementById('cloudStatus');
    if(!e)return;
    e.className='cloud-status '+type;
    e.textContent=t;
  }

  function validateAuthFields(){
    const email=document.getElementById('cloudEmail');
    const password=document.getElementById('cloudPassword');
    const emailValue=email.value.trim();
    const passwordValue=password.value;
    let ok=true;
    const emailValid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    if(!emailValue){email.classList.add('invalid');document.getElementById('cloudEmailHelp').textContent='Email is required.';ok=false}
    else if(!emailValid){email.classList.add('invalid');document.getElementById('cloudEmailHelp').textContent='Enter a valid email address, for example you@example.com.';ok=false}
    if(!passwordValue){password.classList.add('invalid');document.getElementById('cloudPasswordHelp').textContent='Password is required.';ok=false}
    else if(passwordValue.length<6){password.classList.add('invalid');document.getElementById('cloudPasswordHelp').textContent='Password must be at least 6 characters.';ok=false}
    return ok;
  }

  function friendlyAuthError(error,mode){
    const msg=String(error?.message||error||'').toLowerCase();
    if(msg.includes('user already registered')||msg.includes('already been registered')) return 'An account with this email already exists. Please use Sign in instead.';
    if(msg.includes('invalid login credentials')) return 'Email or password is incorrect. Please check both and try again.';
    if(msg.includes('email not confirmed')) return 'Your email has not been confirmed yet. Please check your inbox for the confirmation email.';
    if(msg.includes('password')&&msg.includes('6')) return 'Password must be at least 6 characters.';
    if(msg.includes('rate limit')||msg.includes('too many')) return 'Too many attempts. Please wait a few minutes and try again.';
    if(msg.includes('redirect')||msg.includes('url')) return 'The account was created, but the confirmation link could not be prepared. Please check the Supabase Auth redirect settings.';
    if(mode==='signup') return 'We could not create the account. '+(error?.message||'Please try again.');
    return 'We could not sign you in. '+(error?.message||'Please try again.');
  }

  async function auth(mode){
    if(authBusy)return;
    if(!validateAuthFields()){status('Please fix the highlighted fields and try again.','error');return}
    const email=document.getElementById('cloudEmail').value.trim();
    const password=document.getElementById('cloudPassword').value;
    const loginBtn=document.getElementById('cloudLogin');
    const signupBtn=document.getElementById('cloudSignup');
    authBusy=true;
    loginBtn.disabled=true;signupBtn.disabled=true;
    status(mode==='login'?'Signing in…':'Creating your account…','info');
    try{
      let result;
      if(mode==='login'){
        result=await sb.auth.signInWithPassword({email,password});
      }else{
        const redirectTo=new URL(location.href); redirectTo.hash='';
        result=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectTo.toString()}});
      }
      if(result.error)throw result.error;

      if(mode==='signup'){
        const hasSession=!!result.data?.session;
        if(hasSession){
          status('Account created successfully. Signing you in…','success');
          setTimeout(()=>boot(result.data.session).catch(e=>status('Account created, but cloud loading failed: '+e.message,'error')),400);
          return;
        }
        status('Account created successfully. We sent a confirmation email to '+email+'. Please click the confirmation link, then return here and sign in.','success');
        return;
      }

      status('Sign-in successful. Loading your collection…','success');
      await boot(result.data?.session);
    }catch(e){
      status(friendlyAuthError(e,mode),'error');
    }finally{
      authBusy=false;loginBtn.disabled=false;signupBtn.disabled=false;
    }
  }

  function userBadge(){
    const old=document.getElementById('cloudUser');if(old)old.remove();
    const d=document.createElement('div');d.id='cloudUser';d.className='cloud-user';d.innerHTML='<span>'+esc(sessionUser.email||'Signed in')+'</span><button type="button" id="cloudLogout">Sign out</button>';
    document.body.appendChild(d);document.getElementById('cloudLogout').onclick=()=>sb.auth.signOut();
  }

  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function toRow(p){return {id:p.id,user_id:sessionUser.id,name:p.name,brand:p.brand,type:p.type||null,occasion:p.occasion||null,clone_of:p.cloneOf||null,image:p.image||null,volume:Number(p.volume)||0,remaining:Number(p.remaining)||0,year:p.year?Number(p.year):null,price:Number(p.price)||0,rating:p.rating!==''&&p.rating!=null?Number(p.rating):null,top_notes:p.topNotes||null,heart_notes:p.heartNotes||null,base_notes:p.baseNotes||null,accords:p.accords||null,source:p.source||null,my_notes:p.myNotes||null,updated_at:new Date().toISOString()}}
  function fromRow(r){return {id:r.id,name:r.name,brand:r.brand,type:r.type||'',occasion:r.occasion||'',cloneOf:r.clone_of||'',image:r.image||'',volume:Number(r.volume)||0,remaining:Number(r.remaining)||0,year:r.year||'',price:Number(r.price)||0,rating:r.rating==null?'':r.rating,topNotes:r.top_notes||'',heartNotes:r.heart_notes||'',baseNotes:r.base_notes||'',accords:r.accords||'',source:r.source||'',myNotes:r.my_notes||''}}
  async function fetchCloud(){const {data,error}=await sb.from('perfumes').select('*').order('created_at',{ascending:true});if(error)throw error;return data||[]}
  async function replaceCloud(items){const {error:delErr}=await sb.from('perfumes').delete().eq('user_id',sessionUser.id);if(delErr)throw delErr;if(items.length){const {error}=await sb.from('perfumes').insert(items.map(toRow));if(error)throw error}}
  async function cloudSave(){try{localStorage.setItem('perfumeCollection.v10',JSON.stringify(collection));await replaceCloud(collection);refreshAll()}catch(e){toast('Cloud save failed: '+(e.message||e))}}
  async function boot(){
    sessionUser=(await sb.auth.getUser()).data.user;if(!sessionUser)return;
    userBadge();
    const cloud=await fetchCloud();
    if(cloud.length===0 && Array.isArray(collection) && collection.length>0){
      if(confirm('I found your existing browser collection. Upload it to your new cloud account?')){await replaceCloud(collection);toast('Existing collection uploaded to cloud.')}else collection=[];
    }else collection=cloud.map(fromRow);
    localStorage.setItem('perfumeCollection.v10',JSON.stringify(collection));refreshAll();
    if(originalSave===undefined){originalSave=save;save=cloudSave;}
    const gate=document.getElementById('cloudGate');if(gate)gate.remove();
  }
  async function start(){
    addStyles();
    try{await loadClient();const {data}=await sb.auth.getSession();sb.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_IN'&&s)boot(s).catch(e=>status(e.message,'error'));if(event==='SIGNED_OUT'){sessionUser=null;location.reload()}});if(data.session)await boot(data.session);else gate();}
    catch(e){gate();status(e.message||'Supabase connection failed. Please refresh and try again.','error')}
  }
  window.addEventListener('load',start);
})();
