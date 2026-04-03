'use strict';
// ════════════════════════════════════════════════════════
// SUPABASE AUTH
// ════════════════════════════════════════════════════════
const SUPABASE_URL='https://yufehucjvviwanbulcok.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_6YS9ifWHEU53f-H9svKJpg_paNqSFam';
const _supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

function showLogin(){document.getElementById('v-login').classList.add('active');document.getElementById('v-portfolio').classList.remove('active');document.getElementById('v-release').classList.remove('active');document.getElementById('v-project').classList.remove('active');}
function hideLogin(){document.getElementById('v-login').classList.remove('active');}
function hideAllLoginPanels(){['login-signin','login-signup','login-forgot','login-verify'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});}
function showSignin(){hideAllLoginPanels();document.getElementById('login-signin').style.display='block';document.getElementById('login-err').textContent='';}
function showSignup(){hideAllLoginPanels();document.getElementById('login-signup').style.display='block';document.getElementById('signup-err').textContent='';document.getElementById('signup-email').value='';document.getElementById('signup-pw').value='';document.getElementById('signup-confirm').value='';document.getElementById('pw-strength').textContent='';}
function showForgot(){hideAllLoginPanels();document.getElementById('login-forgot').style.display='block';document.getElementById('forgot-err').textContent='';document.getElementById('forgot-email').value='';}
function showVerify(email){hideAllLoginPanels();document.getElementById('login-verify').style.display='block';document.getElementById('verify-email-display').textContent=email;document.getElementById('verify-err').textContent='';}

let pendingVerifyEmail='';

async function signIn(){
  document.getElementById('login-err').textContent='';
  const email=document.getElementById('signin-email').value.trim();
  const pw=document.getElementById('signin-pw').value;
  if(!email||!pw){document.getElementById('login-err').textContent='Please enter email and password.';return;}
  const{data,error}=await _supabase.auth.signInWithPassword({email,password:pw});
  if(error){document.getElementById('login-err').textContent=error.message;return;}
  if(data.user&&!data.user.email_confirmed_at){
    pendingVerifyEmail=email;
    await _supabase.auth.signOut();
    document.getElementById('login-err').textContent='Please verify your email before signing in. Check your inbox.';
    return;
  }
  currentUserId=data.user.id;
  hideLogin();await bootApp();updateAvatars();
}

async function createAccount(){
  document.getElementById('signup-err').textContent='';
  const email=document.getElementById('signup-email').value.trim();
  const pw=document.getElementById('signup-pw').value;
  const confirm=document.getElementById('signup-confirm').value;
  if(!email||!pw||!confirm){document.getElementById('signup-err').textContent='Please fill in all fields.';return;}
  const pwErr=validatePassword(pw);if(pwErr){document.getElementById('signup-err').textContent=pwErr;return;}
  if(pw!==confirm){document.getElementById('signup-err').textContent='Passwords do not match.';return;}
  const{error}=await _supabase.auth.signUp({email,password:pw});
  if(error){document.getElementById('signup-err').textContent=error.message;return;}
  pendingVerifyEmail=email;
  showVerify(email);
}

async function resendVerification(){
  const errEl=document.getElementById('verify-err');
  if(!pendingVerifyEmail){errEl.textContent='No email to resend to.';return;}
  const{error}=await _supabase.auth.resend({type:'signup',email:pendingVerifyEmail});
  if(error){errEl.textContent=error.message;return;}
  errEl.style.color='var(--green)';errEl.textContent='Verification email resent. Check your inbox.';
  setTimeout(()=>{errEl.textContent='';errEl.style.color='';},3000);
}

async function sendPasswordReset(){
  document.getElementById('forgot-err').textContent='';
  const email=document.getElementById('forgot-email').value.trim();
  if(!email){document.getElementById('forgot-err').textContent='Please enter your email.';return;}
  const{error}=await _supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'?reset=true'});
  if(error){document.getElementById('forgot-err').textContent=error.message;return;}
  document.getElementById('forgot-err').textContent='Check your email for a password reset link.';
  setTimeout(()=>showSignin(),2000);
}

let currentUserId=null;

async function signOut(){
  currentUserId=null;releases=[];
  await _supabase.auth.signOut();
  showLogin();showSignin();
}

async function bootApp(){
  await loadData();applyBrand();renderPortfolio();renderAlerts();document.getElementById('v-portfolio').classList.add('active');
  checkPendingInvites();autoSnapshot();initTopBrand();renderTrendCharts();
  // Show onboarding for new users
  const{data:{user}}=await _supabase.auth.getUser();
  if(user&&!user.user_metadata?.onboarded&&releases.length===0){
    document.getElementById('welcome-modal').classList.add('open');
  }
  // Determine if user is owner or team member and lock role accordingly
  await resolveUserRole();
}
async function resolveUserRole(){
  if(!currentUserId||isDemoMode)return;
  try{
    // Check if user owns any releases (has their own user_data)
    const{data:own}=await _supabase.from('user_data').select('user_id').eq('user_id',currentUserId).maybeSingle();
    if(own){
      // User is an owner/admin — show role selector, default to admin
      applyViewRole('admin');
      const sel=document.getElementById('view-role-select');if(sel)sel.style.display='';
      return;
    }
    // Not an owner — check team memberships for assigned role
    const{data:memberships}=await _supabase.from('team_members').select('role').eq('user_id',currentUserId);
    if(memberships&&memberships.length){
      // Use the highest-access role across all team memberships
      const roleOrder=['staff','exec_sponsor','client_viewer'];
      let bestRole='client_viewer';
      for(const m of memberships){
        if(roleOrder.indexOf(m.role)<roleOrder.indexOf(bestRole)&&roleOrder.includes(m.role))bestRole=m.role;
        // Legacy roles map to staff
        if(m.role==='editor')bestRole='staff';
        if(m.role==='viewer'&&bestRole==='client_viewer')bestRole='staff';
      }
      applyViewRole(bestRole);
      // Hide role selector — role is assigned by admin
      const sel=document.getElementById('view-role-select');if(sel)sel.style.display='none';
      const profVR=document.getElementById('profile-view-role');if(profVR)profVR.disabled=true;
    }
  }catch(e){console.warn('Role resolution:',e);}
}

function checkPasswordStrength(){
  const pw=document.getElementById('signup-pw').value;
  const strength=document.getElementById('pw-strength');
  const checks={len:pw.length>=12,upper:/[A-Z]/.test(pw),lower:/[a-z]/.test(pw),num:/\d/.test(pw),spec:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)};
  const met=Object.values(checks).filter(Boolean).length;
  if(!pw){strength.textContent='';return;}
  if(met<5){strength.style.color='var(--amber)';strength.textContent=`Password: ${!checks.len?'12+ chars, ':''} ${!checks.upper?'1 uppercase, ':''} ${!checks.lower?'1 lowercase, ':''} ${!checks.num?'1 number, ':''} ${!checks.spec?'1 special char':''}`;}
  else{strength.style.color='var(--green)';strength.textContent='\u2713 Strong password';}
}

function validatePassword(pw){
  if(pw.length<12)return 'Password must be at least 12 characters.';
  if(!/[A-Z]/.test(pw))return 'Password must contain at least one uppercase letter.';
  if(!/[a-z]/.test(pw))return 'Password must contain at least one lowercase letter.';
  if(!/\d/.test(pw))return 'Password must contain at least one number.';
  if(!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw))return 'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?).';
  return '';
}

function initTopBrand(){
  document.querySelectorAll('.top-brand').forEach(el=>{
    el.style.cursor='pointer';
    el.onclick=()=>{
      const isPortfolio=document.getElementById('v-portfolio')?.classList.contains('active');
      if(!isPortfolio){goPortfolio();}
    };
  });
}

async function initAuth(){
  // Check for public share link first
  const shareToken=checkShareParam();
  if(shareToken){
    await loadSharedView(shareToken);
    return;
  }
  const{data:{session}}=await _supabase.auth.getSession();
  if(session&&session.user){
    if(!session.user.email_confirmed_at){await _supabase.auth.signOut();return;}
    currentUserId=session.user.id;
    hideLogin();await bootApp();updateAvatars();
    if(checkReadOnlyParam())enableReadOnly();
  }
}

// ════════════════════════════════════════════════════════
// USER PROFILE
// ════════════════════════════════════════════════════════
function getInitials(name){
  if(!name)return '?';
  const parts=name.trim().split(/\s+/).filter(p=>p.length>0);
  if(!parts.length)return '?';
  if(parts.length>=2)return(parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function updateAvatars(){
  _supabase.auth.getUser().then(({data:{user}})=>{
    if(!user)return;
    const meta=user.user_metadata||{};
    const name=meta.full_name||'';
    const initials=getInitials(name);
    const display=name||(user.email||'').split('@')[0]||'User';
    ['avatar-p','avatar-r','avatar-proj'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.textContent=initials;
    });
    ['avatar-name-p','avatar-name-r','avatar-name-proj'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.textContent=display;
    });
  });
}

async function openProfile(){
  const{data:{user}}=await _supabase.auth.getUser();
  if(!user)return;
  const meta=user.user_metadata||{};
  document.getElementById('profile-email').textContent=user.email;
  document.getElementById('profile-name').value=meta.full_name||'';
  document.getElementById('profile-org').value=meta.organization||'';
  document.getElementById('profile-role').value=meta.role||'';
  document.getElementById('profile-new-pw').value='';
  document.getElementById('profile-confirm-pw').value='';
  document.getElementById('profile-pw-strength').textContent='';
  document.getElementById('profile-msg').textContent='';
  document.getElementById('profile-modal').classList.add('open');
  loadAlertPrefs();loadBrandInputs();
  const vrSel=document.getElementById('profile-view-role');if(vrSel)vrSel.value=meta.view_role||'admin';
  const brandSec=document.getElementById('brand-section');
  if(brandSec)brandSec.style.display=(currentViewRole==='admin')?'block':'none';
}

function checkProfilePwStrength(){
  const pw=document.getElementById('profile-new-pw').value;
  const el=document.getElementById('profile-pw-strength');
  if(!pw){el.textContent='';return;}
  const checks={len:pw.length>=12,upper:/[A-Z]/.test(pw),lower:/[a-z]/.test(pw),num:/\d/.test(pw),spec:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)};
  const missing=[];
  if(!checks.len)missing.push('12+ chars');if(!checks.upper)missing.push('uppercase');if(!checks.lower)missing.push('lowercase');if(!checks.num)missing.push('number');if(!checks.spec)missing.push('special char');
  if(missing.length){el.style.color='var(--amber)';el.textContent='Needs: '+missing.join(', ');}
  else{el.style.color='var(--green)';el.textContent='\u2713 Strong password';}
}

async function saveProfile(){
  const msgEl=document.getElementById('profile-msg');
  msgEl.textContent='';msgEl.style.color='';
  const name=document.getElementById('profile-name').value.trim();
  const org=document.getElementById('profile-org').value.trim();
  const role=document.getElementById('profile-role').value;
  const newPw=document.getElementById('profile-new-pw').value;
  const confirmPw=document.getElementById('profile-confirm-pw').value;

  // Update metadata
  const viewRole=document.getElementById('profile-view-role')?.value||'admin';
  const{error:metaErr}=await _supabase.auth.updateUser({data:{full_name:name,organization:org,role:role,view_role:viewRole}});
  if(metaErr){msgEl.style.color='var(--red)';msgEl.textContent=metaErr.message;return;}
  saveBrandFromInputs();applyViewRole(viewRole);

  // Change password if provided
  if(newPw){
    const pwErr=validatePassword(newPw);
    if(pwErr){msgEl.style.color='var(--red)';msgEl.textContent=pwErr;return;}
    if(newPw!==confirmPw){msgEl.style.color='var(--red)';msgEl.textContent='Passwords do not match.';return;}
    const{error:pwError}=await _supabase.auth.updateUser({password:newPw});
    if(pwError){msgEl.style.color='var(--red)';msgEl.textContent=pwError.message;return;}
  }

  msgEl.style.color='var(--green)';msgEl.textContent='Profile saved successfully.';
  updateAvatars();
  await saveAlertPrefs();
  setTimeout(()=>{closeModal('profile-modal');},1200);
}

// ════════════════════════════════════════════════════════
// EMAIL ALERT PREFERENCES
// ════════════════════════════════════════════════════════
async function loadAlertPrefs(){
  if(!currentUserId)return;
  try{
    const{data}=await _supabase.from('alert_preferences').select('*').eq('user_id',currentUserId).maybeSingle();
    if(data){
      document.getElementById('alert-golive').checked=data.golive_enabled;
      document.getElementById('alert-golive-days').value=data.golive_days;
      document.getElementById('alert-golive-thresh').value=data.golive_threshold;
      document.getElementById('alert-stale').checked=data.stale_enabled;
      document.getElementById('alert-stale-days').value=data.stale_days;
      document.getElementById('alert-adkar').checked=data.adkar_enabled;
      document.getElementById('alert-digest').checked=data.digest_enabled;
      document.getElementById('alert-digest-day').value=data.digest_day;
      document.getElementById('alert-share').checked=data.share_expiry_enabled;
    }
  }catch(e){console.warn('Alert prefs table not found. Run sql/phase6_alerts.sql.',e.message);}
}

async function saveAlertPrefs(){
  if(!currentUserId)return;
  const{data:{user}}=await _supabase.auth.getUser();
  if(!user)return;
  const prefs={
    user_id:currentUserId,
    email:user.email,
    golive_enabled:document.getElementById('alert-golive').checked,
    golive_days:parseInt(document.getElementById('alert-golive-days').value),
    golive_threshold:parseInt(document.getElementById('alert-golive-thresh').value),
    stale_enabled:document.getElementById('alert-stale').checked,
    stale_days:parseInt(document.getElementById('alert-stale-days').value),
    adkar_enabled:document.getElementById('alert-adkar').checked,
    digest_enabled:document.getElementById('alert-digest').checked,
    digest_day:parseInt(document.getElementById('alert-digest-day').value),
    share_expiry_enabled:document.getElementById('alert-share').checked,
    updated_at:new Date().toISOString()
  };
  try{
    await _supabase.from('alert_preferences').upsert(prefs,{onConflict:'user_id'});
  }catch(e){console.warn('Could not save alert prefs:',e.message);}
}

// ════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════
const GATE_DEFS=[
  {id:'g1',label:'Gate 1',sub:'Post-Requirements / Pre-Design',items:[
    {text:'Impacted user groups identified via Impact Analysis',owner:'ocm_impl'},
    {text:'Preliminary stakeholder matrix drafted and shared with Training',owner:'ocm_impl'},
    {text:'High-level scope of system changes documented',owner:'func'},
    {text:'Training approach approved (ILT, vILT, eLearning, job aids)',owner:'train_env'},
    {text:'Training resources confirmed',owner:'train_env'}
  ]},
  {id:'g2',label:'Gate 2',sub:'Post-Design / Pre-Development',items:[
    {text:'Finalized stakeholder matrix with role-level mapping',owner:'ocm_impl'},
    {text:'Training environment plan confirmed (ownership, access, timeline)',owner:'func'},
    {text:'SME assignments confirmed and communicated',owner:'smes'},
    {text:'Curriculum outline approved',owner:'train_env'},
    {text:'Training calendar windows identified and protected',owner:'pm'},
    {text:'Communications plan aligned with Training delivery schedule',owner:'ocm_impl'}
  ]},
  {id:'g3',label:'Gate 3',sub:'Post-Dev / Pre-UAT',items:[
    {text:'Training environment accessible and stable',owner:'func'},
    {text:'SMEs available and confirmed for content validation',owner:'smes'},
    {text:'Tech transfer date locked or within confirmed window',owner:'func'},
    {text:'TTT schedule drafted and distributed',owner:'train_env'},
    {text:'System changes from Development documented and communicated to Training',owner:'func'},
    {text:'End user training materials in active development',owner:'train_env'}
  ]},
  {id:'g4',label:'Gate 4',sub:'Post-UAT / Pre-Go-Live',items:[
    {text:'TTT complete with documented sign-off',owner:'train_env'},
    {text:'Training environment mirrors production as closely as possible',owner:'func'},
    {text:'Final user list confirmed by role and population',owner:'pm'},
    {text:'Go-live date locked with change freeze window communicated',owner:'pm'},
    {text:'Post-release monitoring plan confirmed between Implementation and Training',owner:'ocm_impl'},
    {text:'Floor support and help desk coverage plan in place',owner:'train_env'}
  ]}
];
const RC={
  g1:['Training cannot size effort, timeline, or resources. All downstream planning is speculative.',
      'Training cannot determine who requires training or at what scale.',
      'Training scope is undefined. Curriculum development cannot be initiated.',
      'Delivery format unknown. Materials development and vendor sourcing are blocked.',
      'Training resources are unconfirmed. Schedule risk is elevated.'],
  g2:['Training cannot confirm who to train or sequence delivery by role.',
      'No environment plan means TTT and end user training have no operational foundation.',
      'Content cannot be validated without confirmed SMEs. Accuracy and credibility are at risk.',
      'Curriculum development cannot begin without an approved outline.',
      'Training dates have no protected window. Schedule compression risk is high.',
      'Communications will not align with Training delivery. End users arrive unprepared.'],
  g3:['TTT cannot be scheduled. End user training timeline is at risk.',
      'Unvalidated content will be delivered to end users. Accuracy risk is critical.',
      'Tech transfer date unknown. TTT and end user training cannot be sequenced.',
      'TTT scheduling is blocked. Compression to go-live is likely.',
      'Training may not reflect current system state. End users trained on incorrect workflows.',
      'Materials cannot be finalized without active development underway.'],
  g4:['End users receive training without a validated instruction baseline. Adoption risk is critical.',
      'Environment instability means end users are trained on an inaccurate system.',
      'User list gaps create coverage failures at go-live.',
      'Date uncertainty prevents end user training scheduling.',
      'No shared post-release monitoring plan between Implementation and Training.',
      'End users will have no structured support at go-live.']
};
const WS=['OCM Training','OCM Implementation','Project Manager','Functional','QA','UAT','SMEs','App Dev'];
const GL=['Post-Requirements','Post-Design','Post-Dev / Pre-UAT','Post-UAT / Pre-Go-Live'];
const AF=[
  {key:'resistance',label:'Resistance Signals',desc:'Signals surfaced via stakeholder engagement'},
  {key:'env',label:'Environment Stability',desc:'Reliability of training environment at TTT'},
  {key:'window',label:'Training Window',desc:'Adequacy of time available for delivery'},
  {key:'complexity',label:'Role Complexity Delta',desc:'Degree of change from current to future state'},
  {key:'saturation',label:'Change Saturation',desc:'Volume of prior change affecting this group'},
  {key:'leadership',label:'Leadership Reinforcement',desc:'Supervisor readiness to reinforce post-training'},
];
const FD={1:'Critical risk indicator',2:'High risk indicator',3:'Moderate — monitor',4:'Acceptable — sustain',5:'Low risk — strength'};
const ADKAR_DIMS=[
  {key:'A1',letter:'A',word:'Awareness',desc:'Awareness of the need for change'},
  {key:'D',letter:'D',word:'Desire',desc:'Desire to support and participate'},
  {key:'K',letter:'K',word:'Knowledge',desc:'Knowledge of how to change'},
  {key:'Ab',letter:'A',word:'Ability',desc:'Ability to implement required skills and behaviors'},
  {key:'R',letter:'R',word:'Reinforcement',desc:'Reinforcement to sustain the change'},
];
const RES_ROLES=[
  {key:'ocm_train',label:'OCM Training'},
  {key:'ocm_impl',label:'OCM Implementation'},
  {key:'pm',label:'Project Manager'},
  {key:'func',label:'Functional'},
  {key:'qa',label:'QA'},
  {key:'uat',label:'UAT'},
  {key:'smes',label:'SMEs'},
  {key:'app_dev',label:'App Dev'},
];
const TIER_MAP={low:'Low',mod:'Moderate',high:'High',crit:'Critical'};
function storageKey(){return currentUserId?'adoptiq_v1_'+currentUserId:'adoptiq_v1';}
const PROJ_STATUSES=['Not Started','In Progress','Complete','On Hold','Blocked'];

// ════════════════════════════════════════════════════════
// HTML ESCAPING
// ════════════════════════════════════════════════════════
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

// ════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════
let releases=[];
let activeRelId=null;
let activeProjId=null;
let noteKey=null;
let delRelTarget=null;
let delProjTarget=null;
let saveTimer=null;
let saveIndTimer=null;
let theme=localStorage.getItem('ocm_theme')||'light';
let modalRelAgencies=[];
let newProjAgencies=[];

// ════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════
function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  theme=t;
  localStorage.setItem('ocm_theme',t);
  ['','-r','-p'].forEach(s=>{
    const ic=document.getElementById('theme-icon'+s);
    const lb=document.getElementById('theme-lbl'+s);
    if(ic)ic.textContent=t==='dark'?'☽':'☀';
    if(lb)lb.textContent=t==='dark'?'Dark':'Light';
  });
}
function toggleTheme(){applyTheme(theme==='light'?'dark':'light');setTimeout(()=>{if(releases.length){renderPortfolioCharts();renderTrendCharts();}const p=getProj();if(p)renderProjCharts();},300);}
applyTheme(theme);

// ════════════════════════════════════════════════════════
// METHODOLOGY BRANDING
// ════════════════════════════════════════════════════════
const DEFAULT_BRAND={firmName:'Providence Consulting Firm',subtitle:'Where OCM Meets Measurable Readiness',gateLabels:['Gate 1','Gate 2','Gate 3','Gate 4'],adkarLabels:{A1:'Awareness',D:'Desire',K:'Knowledge',Ab:'Ability',R:'Reinforcement'}};
function getBrand(){try{const b=localStorage.getItem('adoptiq_brand');return b?{...DEFAULT_BRAND,...JSON.parse(b)}:{...DEFAULT_BRAND};}catch(e){return{...DEFAULT_BRAND};}}
function saveBrand(brand){localStorage.setItem('adoptiq_brand',JSON.stringify(brand));applyBrand();}
function applyBrand(){
  const b=getBrand();
  document.querySelectorAll('.top-firm').forEach(el=>el.textContent=b.firmName);
  document.querySelectorAll('.login-footer-brand').forEach(el=>el.textContent=b.firmName);
  b.gateLabels.forEach((lbl,i)=>{if(GATE_DEFS[i])GATE_DEFS[i].label=lbl;});
  Object.entries(b.adkarLabels).forEach(([key,lbl])=>{const dim=ADKAR_DIMS.find(d=>d.key===key);if(dim)dim.word=lbl;});
}
function loadBrandInputs(){
  const b=getBrand();
  const f=document.getElementById('brand-firm');if(f)f.value=b.firmName;
  const s=document.getElementById('brand-subtitle');if(s)s.value=b.subtitle;
  b.gateLabels.forEach((lbl,i)=>{const el=document.getElementById('brand-g'+(i+1));if(el)el.value=lbl;});
  renderFrameworkDimInputs();
}
function saveBrandFromInputs(){
  const b=getBrand();
  const brand={
    ...b,
    firmName:document.getElementById('brand-firm')?.value||DEFAULT_BRAND.firmName,
    subtitle:document.getElementById('brand-subtitle')?.value||DEFAULT_BRAND.subtitle,
    gateLabels:[1,2,3,4].map(i=>document.getElementById('brand-g'+i)?.value||'Gate '+i)
  };
  saveBrand(brand);
}

// ════════════════════════════════════════════════════════
// ROLE-BASED VIEWS
// ════════════════════════════════════════════════════════
let currentViewRole='admin';
function applyViewRole(role){
  currentViewRole=role||'admin';
  document.body.setAttribute('data-role',currentViewRole);
  const brandSec=document.getElementById('brand-section');
  if(brandSec)brandSec.style.display=(currentViewRole==='admin')?'block':'none';
  const vrSel=document.getElementById('view-role-select');
  if(vrSel)vrSel.value=currentViewRole;
  const profileSel=document.getElementById('profile-view-role');
  if(profileSel)profileSel.value=currentViewRole;
  if(currentViewRole==='exec_sponsor'||currentViewRole==='client_viewer'){
    showView('v-portfolio');renderPortfolio();
  }
}

// ════════════════════════════════════════════════════════
// PERSISTENCE — Supabase primary, localStorage offline cache
// ════════════════════════════════════════════════════════
function showSaveIndicator(text,isWarning){
  clearTimeout(saveIndTimer);
  ['save-ind','save-ind-r','save-ind-p'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.textContent=text||'Saved';el.classList.add('vis');
      el.classList.toggle('save-warn',!!isWarning);
    }
  });
  const delay=isWarning?5000:2400;
  saveIndTimer=setTimeout(()=>{['save-ind','save-ind-r','save-ind-p'].forEach(id=>{const el=document.getElementById(id);if(el){el.classList.remove('vis');el.classList.remove('save-warn');}});},delay);
}

const MAX_SAVE_RETRIES=2;
async function saveData(){
  try{localStorage.setItem(storageKey(),JSON.stringify(releases));}catch(e){}
  showSaveIndicator('Saving\u2026');
  if(currentUserId){
    let saved=false;
    for(let attempt=0;attempt<=MAX_SAVE_RETRIES;attempt++){
      try{
        const{error}=await _supabase.from('user_data').upsert({user_id:currentUserId,releases:releases,updated_at:new Date().toISOString()});
        if(error){
          console.error('Supabase save:',error);
          if(attempt<MAX_SAVE_RETRIES){showSaveIndicator('Retrying\u2026');await new Promise(resolve=>setTimeout(resolve,1500*(attempt+1)));continue;}
          showSaveIndicator('Offline — saved locally',true);return;
        }
        saved=true;break;
      }catch(netErr){
        console.error('Network error:',netErr);
        if(attempt<MAX_SAVE_RETRIES){showSaveIndicator('Retrying\u2026');await new Promise(resolve=>setTimeout(resolve,1500*(attempt+1)));continue;}
        showSaveIndicator('Offline — saved locally',true);return;
      }
    }
    if(!saved){showSaveIndicator('Offline — saved locally',true);return;}
  }
  showSaveIndicator('Saved');
}

async function loadData(){
  releases=[];
  if(!currentUserId)return;
  const{data,error}=await _supabase.from('user_data').select('releases').eq('user_id',currentUserId).maybeSingle();
  if(!error&&data){
    releases=data.releases||[];
    try{localStorage.setItem(storageKey(),JSON.stringify(releases));}catch(e){}
  } else {
    // Migrate from localStorage on first Supabase login
    try{const cached=localStorage.getItem(storageKey());if(cached){releases=JSON.parse(cached);await saveData();}}catch(e){releases=[];}
  }
  // Migrate all project resources and ensure stakeholder data integrity
  releases.forEach(r=>{
    delete r.resources; // remove release-level resources (no longer used)
    (r.projects||[]).forEach(p=>{
      migrateResources(p);
      if(!p.impactAssessment)p.impactAssessment={groups:[]};
      // Ensure all stakeholders have required nested objects
      (p.stakeholders||[]).forEach(sh=>{
        if(!sh.factors)sh.factors={resistance:3,env:3,window:3,complexity:3,saturation:3,leadership:3};
        if(!sh.kirk)sh.kirk={L1:{method:'',timing:''},L2:{method:'',assessment:''},L3:{interval:'30',observable:''},L4:{outcome:'',metric:''}};
        else{if(!sh.kirk.L1)sh.kirk.L1={method:'',timing:''};if(!sh.kirk.L2)sh.kirk.L2={method:'',assessment:''};if(!sh.kirk.L3)sh.kirk.L3={interval:'30',observable:''};if(!sh.kirk.L4)sh.kirk.L4={outcome:'',metric:''};}
        if(!sh.rein)sh.rein={owner:'',activities:'',intervals:['30 Days'],escalation:''};
        if(!sh.objectives)sh.objectives=[];
        if(!sh.id)sh.id=uid();
      });
    });
  });
}

function schedSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveData,600);}

// ════════════════════════════════════════════════════════
// DATA FACTORIES
// ════════════════════════════════════════════════════════
let _idSeq=0;
function uid(){return Date.now()*10000+Math.floor(Math.random()*9999)+(_idSeq++)*10000;}
function newRelease(name,agencies,golive,phase){
  return{id:uid(),name,agencies:agencies||[],golive:golive||'',phase:phase||'',
    modified:new Date().toISOString(),projects:[]
  };
}
function newProject(name,agencies,users){
  const res={};RES_ROLES.forEach(r=>{res[r.key]=[];});
  return{id:uid(),name:name||'Untitled Project',agencies:agencies||[],estimatedUsers:users||0,
    trainingRequired:true,status:'Not Started',golive:'',
    gateState:{},depHM:{},depNotes:{},stakeholders:[],
    adkarScores:{A1:3,D:3,K:3,Ab:3,R:3},adkarNotes:{A1:'',D:'',K:'',Ab:'',R:''},
    resources:res,
    impactAssessment:{groups:[]},
    gapAnalysis:{gaps:[]},
    pulseConfig:{},
    pulseResults:{},
    postLaunch:{}
  };
}

// ════════════════════════════════════════════════════════
// GETTERS
// ════════════════════════════════════════════════════════
function getRel(){return releases.find(r=>r.id===activeRelId)||null;}
function getProj(){
  const r=getRel();if(!r)return null;
  return r.projects.find(p=>p.id===activeProjId)||null;
}
function migrateResources(p){
  if(!p.resources)p.resources={};
  // Migrate old keys to new keys
  if(p.resources.pmo&&!p.resources.pm)p.resources.pm=p.resources.pmo;
  delete p.resources.pmo;
  if(p.resources.train_env&&!p.resources.app_dev)p.resources.app_dev=p.resources.train_env;
  delete p.resources.train_env;
  RES_ROLES.forEach(role=>{
    const v=p.resources[role.key];
    if(!v)p.resources[role.key]=[];
    else if(!Array.isArray(v))p.resources[role.key]=[v];
  });
}
function getEffectiveRes(proj,key,field){
  if(!proj?.resources?.[key])return'';
  const arr=Array.isArray(proj.resources[key])?proj.resources[key]:[proj.resources[key]];
  return arr[0]?.[field]||'';
}
function touch(target){
  if(target==='proj'){const p=getProj();if(p)p.modified=new Date().toISOString();}
  const r=getRel();if(r)r.modified=new Date().toISOString();
}

// ════════════════════════════════════════════════════════
// SCORE HELPERS
// ════════════════════════════════════════════════════════
function projGateScore(p){
  let tot=0,grn=0;
  GATE_DEFS.forEach(g=>{g.items.forEach((_,i)=>{if(p.gateState[g.id+'_'+i]==='na')return;tot++;if(p.gateState[g.id+'_'+i]==='green')grn++;});});
  return tot?Math.round(grn/tot*100):null;
}
function projFlagCount(p){
  let n=0;
  GATE_DEFS.forEach(g=>{g.items.forEach((_,i)=>{if(p.gateState[g.id+'_'+i]==='red')n++;});});
  return n;
}
function projAdkarAvg(p){
  const dims=getActiveDims();
  const v=dims.map(d=>p.adkarScores?.[d.key]||3);
  return(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1);
}
function projHighestRisk(p){
  if(!p.stakeholders.length)return{name:'—',score:null};
  const w=p.stakeholders.reduce((m,s)=>adoptScore(s.factors)<adoptScore(m.factors)?s:m,p.stakeholders[0]);
  return{name:w.name,score:adoptScore(w.factors)};
}
function projStatus(p){
  const r=Object.values(p.gateState).filter(v=>v==='red').length;
  if(r>=3)return{label:'Critical',cls:'critical'};if(r>=1)return{label:'At Risk',cls:'at-risk'};
  return{label:'On Track',cls:'on-track'};
}
const _rollupCache=new Map();
function relRollup(r){
  const cacheKey=r.id+'_'+(r.modified||'');
  if(_rollupCache.has(cacheKey))return _rollupCache.get(cacheKey);
  const projs=r.projects||[];
  if(!projs.length){const res={gateScore:null,flags:0,adkar:null,status:{label:'On Track',cls:'on-track'}};_rollupCache.set(cacheKey,res);return res;}
  const scores=projs.map(p=>projGateScore(p)).filter(s=>s!==null);
  const gateScore=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
  const flags=projs.reduce((s,p)=>s+projFlagCount(p),0);
  const adkars=projs.map(p=>parseFloat(projAdkarAvg(p)));
  const adkar=adkars.length?(adkars.reduce((a,b)=>a+b,0)/adkars.length).toFixed(1):null;
  const reds=projs.reduce((s,p)=>s+Object.values(p.gateState).filter(v=>v==='red').length,0);
  const baseStatus=reds>=3?{label:'Critical',cls:'critical'}:reds>=1?{label:'At Risk',cls:'at-risk'}:{label:'On Track',cls:'on-track'};
  const d=daysTo(r.golive);
  const status=(d!==null&&d<0&&baseStatus.cls==='on-track')?{label:'Overdue',cls:'overdue'}:baseStatus;
  const result={gateScore,flags,adkar,status};_rollupCache.set(cacheKey,result);return result;
}
function relRAG(r){
  const rl=relRollup(r);let score=0,count=0;
  if(rl.gateScore!==null){score+=rl.gateScore>=70?2:rl.gateScore>=40?1:0;count++;}
  if(rl.adkar!==null){score+=parseFloat(rl.adkar)>=3.5?2:parseFloat(rl.adkar)>=2.5?1:0;count++;}
  score+=rl.flags===0?2:rl.flags<=3?1:0;count++;
  const d=daysTo(r.golive);if(d!==null){score+=d<0?0:d>30?2:d>=14?1:0;count++;}
  const avg=count?score/count:2;
  if(avg>=1.5)return{rag:'green',label:'On Track',cls:'rag-g'};
  if(avg>=0.75)return{rag:'amber',label:'At Risk',cls:'rag-a'};
  return{rag:'red',label:'Critical',cls:'rag-r'};
}
function projRAG(p,golive){
  const gs=projGateScore(p);const fl=projFlagCount(p);const adk=parseFloat(projAdkarAvg(p));
  let score=0,count=0;
  if(gs!==null){score+=gs>=70?2:gs>=40?1:0;count++;}
  score+=adk>=3.5?2:adk>=2.5?1:0;count++;
  score+=fl===0?2:fl<=3?1:0;count++;
  const d=daysTo(golive);if(d!==null){score+=d<0?0:d>30?2:d>=14?1:0;count++;}
  const avg=count?score/count:2;
  if(avg>=1.5)return{rag:'green',label:'On Track',cls:'rag-g'};
  if(avg>=0.75)return{rag:'amber',label:'At Risk',cls:'rag-a'};
  return{rag:'red',label:'Critical',cls:'rag-r'};
}
function quartiles(arr){
  if(arr.length<4)return null;
  const sorted=[...arr].sort((a,b)=>a-b);
  return{q1:sorted[Math.floor(sorted.length*0.25)],median:sorted[Math.floor(sorted.length*0.5)],q3:sorted[Math.floor(sorted.length*0.75)],min:sorted[0],max:sorted[sorted.length-1]};
}
function calcBenchmarks(){
  const gs=[],ad=[],fl=[];
  releases.forEach(r=>r.projects.forEach(p=>{const s=projGateScore(p);if(s!==null)gs.push(s);ad.push(parseFloat(projAdkarAvg(p)));fl.push(projFlagCount(p));}));
  return{gate:quartiles(gs),adkar:quartiles(ad),flags:quartiles(fl)};
}
function benchmarkPosition(value,q){
  if(!q)return null;
  if(value>=q.q3)return{label:'Top Quartile',cls:'top',icon:'▲'};
  if(value>=q.median)return{label:'Above Median',cls:'above',icon:'►'};
  if(value>=q.q1)return{label:'Below Median',cls:'below',icon:'►'};
  return{label:'Bottom Quartile',cls:'bottom',icon:'▼'};
}
function adoptScore(f){if(!f||typeof f!=='object')return 0;const v=Object.values(f);if(!v.length)return 0;return Math.round(v.reduce((a,b)=>a+(+b||0),0)/v.length/5*100);}
function adoptTier(s){if(s>=80)return{tier:'Low Risk',cls:'low'};if(s>=60)return{tier:'Moderate Risk',cls:'mod'};if(s>=40)return{tier:'High Risk',cls:'high'};return{tier:'Critical Risk',cls:'crit'};}
function facTier(v){if(v>=4)return'low';if(v>=3)return'mod';if(v>=2)return'high';return'crit';}
function kirkReady(sh){if(!sh?.kirk)return'needed';let f=0;const k=sh.kirk;if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;return Math.round(f/8*100)>=75?'ready':Math.round(f/8*100)>=40?'partial':'needed';}
function reinReady(sh){if(!sh?.rein)return'needed';let f=0;if(sh.rein.owner)f++;if(sh.rein.activities)f++;if(sh.rein.intervals?.length)f++;if(sh.rein.escalation)f++;return f>=3?'ready':f>=1?'partial':'needed';}
function badgeLabel(r){return r==='ready'?'Ready':r==='partial'?'In Progress':'Not Started';}
function daysTo(d){if(!d)return null;const t=new Date();t.setHours(0,0,0,0);const g=new Date(d);g.setHours(0,0,0,0);return Math.ceil((g-t)/86400000);}
function fmtDays(d){if(d===null)return'—';if(d<0)return Math.abs(d)+' days overdue';if(d===0)return'Today';return d+' days';}
function fmtDate(d){if(!d)return'—';const[y,m,dy]=d.split('-');return`${m}/${dy}/${y}`;}
function fmtMod(iso){try{const d=new Date(iso);const now=new Date();const diff=Math.floor((now-d)/60000);if(diff<1)return'Just now';if(diff<60)return`${diff}m ago`;const h=Math.floor(diff/60);if(h<24)return`${h}h ago`;const dy=Math.floor(h/24);if(dy<7)return`${dy}d ago`;return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});}catch(e){return'—';}}
function adkarColor(v){return v>=4?'var(--green)':v===3?'var(--gold)':v===2?'#C28E00':'var(--red)';}
function hmCellCls(val,thr){if(val===null)return'n';if(val>=thr[0])return'g';if(val>=thr[1])return'a';return'r';}

// ════════════════════════════════════════════════════════
// VIEW NAVIGATION
// ════════════════════════════════════════════════════════
function showView(id){
  ['v-portfolio','v-release','v-project'].forEach(v=>{
    document.getElementById(v).classList.toggle('active',v===id);
  });
}
function goPortfolio(){activeRelId=null;activeProjId=null;showView('v-portfolio');renderPortfolio();announceToSR('Portfolio view loaded');const fab=document.getElementById('smart-fab');if(fab)fab.style.display='none';}
function openRelease(id){
  activeRelId=id;activeProjId=null;const fab=document.getElementById('smart-fab');if(fab)fab.style.display='none';
  const r=getRel();if(!r)return;
  document.getElementById('bc-rel').textContent=r.name||'Release';
  document.getElementById('r-name').value=r.name||'';
  document.getElementById('r-golive').value=r.golive||'';
  document.getElementById('r-phase').value=r.phase||'';
  renderRelAgencyChips();updateRelDays();
  showView('v-release');
  document.querySelectorAll('#v-release .tab-sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#v-release .nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('rsec-overview').classList.add('active');
  document.querySelectorAll('#v-release .nav-btn')[0].classList.add('active');
  renderRelView();
}
function goRelease(){
  activeProjId=null;showView('v-release');
  document.querySelectorAll('#v-release .tab-sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#v-release .nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('rsec-overview').classList.add('active');
  document.querySelectorAll('#v-release .nav-btn')[0].classList.add('active');
  renderRelView();
}
function openProject(pid){
  const r=getRel();if(!r)return;
  activeProjId=pid;
  const p=getProj();if(!p)return;
  document.getElementById('bc-rel-p').textContent=r.name||'Release';
  document.getElementById('bc-proj').textContent=p.name||'Project';
  document.getElementById('p-name').value=p.name||'';
  document.getElementById('p-golive').value=p.golive||'';
  document.getElementById('p-users').value=p.estimatedUsers||0;
  document.getElementById('p-status').value=p.status||'Not Started';
  renderProjAgencyChips();
  updateTRButtons();
  showView('v-project');
  document.querySelectorAll('#v-project .tab-sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#v-project .nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('psec-overview').classList.add('active');
  document.querySelectorAll('#v-project .nav-btn')[0].classList.add('active');
  renderProjAll();
}
function syncRel(field,val){const r=getRel();if(!r)return;r[field]=val;if(field==='name')document.getElementById('bc-rel').textContent=val||'Release';touch('rel');schedSave();}
function syncProj(field,val){const p=getProj();if(!p)return;p[field]=val;touch('proj');schedSave();}
function showRelTab(id,btn){
  document.querySelectorAll('#v-release .tab-sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#v-release .nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('rsec-'+id).classList.add('active');btn.classList.add('active');
  if(id==='overview')renderRelOverview();
}
function showProjTab(id,btn){
  document.querySelectorAll('#v-project .tab-sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#v-project .nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('psec-'+id).classList.add('active');btn.classList.add('active');
  if(id==='overview')renderPOverview();
  if(id==='flags')renderPFlags();
  if(id==='adopthm')renderPAHM();
  if(id==='impact')renderPImpact();
  if(id==='gaps')renderPGaps();
  if(id==='postlaunch')renderPPostLaunch();
  if(id==='pulse')renderPPulse();
}

// ════════════════════════════════════════════════════════
// MODALS
// ════════════════════════════════════════════════════════
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')document.querySelectorAll('.modal-ov.open').forEach(m=>m.classList.remove('open'));
});
document.querySelectorAll('.modal-ov').forEach(m=>{m.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});});

// Add Release
function openAddRelease(){
  modalRelAgencies=[];
  ['new-r-name','new-r-golive','new-r-phase'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('new-r-name').classList.remove('err');
  document.getElementById('err-r-name').classList.remove('show');
  renderModalRelChips();
  openModal('add-rel-modal');
  setTimeout(()=>document.getElementById('new-r-name').focus(),50);
}
function addModalRelAgency(){
  const inp=document.getElementById('modal-rel-agency-inp');
  const val=inp.value.trim();if(!val)return;
  if(!modalRelAgencies.includes(val))modalRelAgencies.push(val);
  inp.value='';renderModalRelChips();
}
function removeModalRelAgency(a){modalRelAgencies=modalRelAgencies.filter(x=>x!==a);renderModalRelChips();}
function renderModalRelChips(){
  document.getElementById('modal-rel-chips').innerHTML=
    modalRelAgencies.map(a=>`<span class="chip chip-ink">${esc(a)}<button class="chip-rm" onclick="removeModalRelAgency('${esc(a)}')">&times;</button></span>`).join('');
}
function createRelease(){
  const name=document.getElementById('new-r-name').value.trim();
  if(!name){document.getElementById('new-r-name').classList.add('err');document.getElementById('err-r-name').classList.add('show');return;}
  const nr=newRelease(name,[...modalRelAgencies],document.getElementById('new-r-golive').value,document.getElementById('new-r-phase').value);
  releases.push(nr);logAudit('release_created','release',name,{agencies:nr.agencies});
  closeModal('add-rel-modal');saveData();renderPortfolio();
}

// Delete Release
function openDelRelease(id,name){
  delRelTarget=id;
  document.getElementById('del-rel-sub').textContent=`"${name}" and all its projects and data will be permanently removed. This action cannot be undone.`;
  openModal('del-rel-modal');
  setTimeout(()=>document.getElementById('del-rel-btn').focus(),50);
}
function confirmDelRelease(){
  if(!delRelTarget)return;
  const rel=releases.find(x=>x.id===delRelTarget);
  if(rel)logAudit('release_deleted','release',rel.name,{projects:(rel.projects||[]).length});
  releases=releases.filter(x=>x.id!==delRelTarget);
  closeModal('del-rel-modal');delRelTarget=null;saveData();renderPortfolio();
}

// Add / Delete Project
function openAddProject(){openRelease(activeRelId);showRelTab('projects',document.querySelectorAll('#v-release .nav-btn')[1]);}
function addProject(){
  const r=getRel();if(!r)return;
  const name=document.getElementById('new-p-name').value.trim();if(!name)return;
  const users=parseInt(document.getElementById('new-p-users').value)||0;
  const np=newProject(name,[...newProjAgencies],users);
  r.projects.push(np);logAudit('project_created','project',name,{release:r.name});
  document.getElementById('new-p-name').value='';
  document.getElementById('new-p-users').value='';
  newProjAgencies=[];renderNewProjChips();
  touch('rel');schedSave();renderRelView();
}
function openDelProject(pid,name){
  delProjTarget=pid;
  document.getElementById('del-proj-sub').textContent=`"${name}" and all its gate data, ${fwShort()} scores, and stakeholder groups will be permanently removed.`;
  openModal('del-proj-modal');
  setTimeout(()=>document.getElementById('del-proj-btn').focus(),50);
}
function confirmDelProject(){
  const rel=getRel();if(!rel)return;
  const proj=rel.projects.find(x=>x.id===delProjTarget);
  if(proj)logAudit('project_deleted','project',proj.name,{release:rel.name});
  rel.projects=rel.projects.filter(x=>x.id!==delProjTarget);
  closeModal('del-proj-modal');delProjTarget=null;touch('rel');saveData();renderRelView();
}

// New proj agency chips
function addNewProjAgency(){
  const inp=document.getElementById('new-p-agency-inp');const val=inp.value.trim();if(!val)return;
  if(!newProjAgencies.includes(val))newProjAgencies.push(val);
  inp.value='';renderNewProjChips();
}
function removeNewProjAgency(a){newProjAgencies=newProjAgencies.filter(x=>x!==a);renderNewProjChips();}
function renderNewProjChips(){
  document.getElementById('new-p-agency-chips').innerHTML=
    newProjAgencies.map(a=>`<span class="chip chip-ink">${esc(a)}<button class="chip-rm" onclick="removeNewProjAgency('${esc(a)}')">&times;</button></span>`).join('');
}

// ════════════════════════════════════════════════════════
// PORTFOLIO RENDER
// ════════════════════════════════════════════════════════
function renderPortfolio(){
  _rollupCache.clear();
  const total=releases.length;
  document.getElementById('ps-total').textContent=total;
  const tFlags=releases.reduce((s,r)=>s+relRollup(r).flags,0);
  document.getElementById('ps-flags').textContent=tFlags;
  const allStatuses=releases.map(r=>relRollup(r).status.cls);
  const atRisk=allStatuses.filter(c=>c==='at-risk').length;
  const crit=allStatuses.filter(c=>c==='critical').length;
  document.getElementById('ps-atrisk').textContent=atRisk+crit;
  const cs=document.getElementById('ps-crit-sub');
  if(crit>0){cs.textContent=`${crit} Critical`;cs.className='ps-sub danger';}else{cs.textContent='Including critical';cs.className='ps-sub';}
  const scores=releases.map(r=>relRollup(r).gateScore).filter(s=>s!==null);
  document.getElementById('ps-gate').textContent=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)+'%':'—';
  const wd=releases.filter(r=>r.golive).sort((a,b)=>new Date(a.golive)-new Date(b.golive));
  const future=wd.filter(r=>daysTo(r.golive)>=0);const nearest=future.length?future[0]:wd[wd.length-1];
  if(nearest){const d=daysTo(nearest.golive);document.getElementById('ps-near-d').textContent=fmtDays(d);document.getElementById('ps-near-r').textContent=nearest.name;}
  else{document.getElementById('ps-near-d').textContent='—';document.getElementById('ps-near-r').textContent='No go-live dates set';}
  const wrap=document.getElementById('rel-grid-wrap');
  if(!releases.length){
    wrap.innerHTML=`<div class="hero-empty">
      <div class="hero-badge">ADOPTION INTELLIGENCE PLATFORM</div>
      <div class="hero-h">Enterprise-Grade Change Readiness,<br>Measured and Managed</div>
      <div class="hero-sub">AdoptIQ integrates ADKAR, Kirkpatrick, and SDLC gate methodology into a single command center — giving OCM leaders the visibility to drive adoption at scale.</div>
      <div class="hero-features">
        <div class="hero-feat"><div class="hero-feat-icon">&#9632;</div><div><div class="hero-feat-t">4-Gate Readiness Tracker</div><div class="hero-feat-d">Map training dependencies across the full SDLC lifecycle</div></div></div>
        <div class="hero-feat"><div class="hero-feat-icon">&#9650;</div><div><div class="hero-feat-t">${fwName()} Assessment Engine</div><div class="hero-feat-d">Score readiness dimensions across your chosen change framework</div></div></div>
        <div class="hero-feat"><div class="hero-feat-icon">&#9679;</div><div><div class="hero-feat-t">Adoption Risk Scoring</div><div class="hero-feat-d">Quantify stakeholder readiness with 6-factor analysis</div></div></div>
        <div class="hero-feat"><div class="hero-feat-icon">&#9733;</div><div><div class="hero-feat-t">Kirkpatrick Measurement</div><div class="hero-feat-d">L1–L4 evaluation framework built into every stakeholder group</div></div></div>
      </div>
      <button class="btn-gold" onclick="openAddRelease()" style="padding:14px 32px;font-size:13px">+ Create Your First Release</button>
      <div class="hero-cred">Providence Consulting Firm &middot; CPTM &middot; ATD Master Trainer &middot; ADKAR-Aligned</div>
    </div>`;
    document.getElementById('tl-sec').style.display='none';document.getElementById('exec-dash').style.display='none';return;
  }
  wrap.innerHTML=`<div class="card-grid">${releases.map(r=>{
    const rl=relRollup(r);const d=daysTo(r.golive);const modStr=fmtMod(r.modified);
    const rg=relRAG(r);
    const tp=(r.projects||[]).filter(p=>p.trainingRequired).length;
    return`<div class="r-card" tabindex="0" draggable="true" data-rel-id="${r.id}" onclick="openRelease(${r.id})" onkeydown="if(event.key==='Enter')openRelease(${r.id})" role="button" aria-label="Open ${esc(r.name)}">
      <div class="r-card-hd">
        <div style="display:flex;align-items:center;justify-content:space-between"><div class="rc-name"><span class="rag-dot ${rg.cls}" title="${rg.label}"></span>${esc(r.name)}</div><span class="drag-handle" title="Drag to reorder">&#x2630;</span></div>
        <div class="chip-row">${(r.agencies||[]).map(a=>`<span class="chip chip-white">${esc(a)}</span>`).join('')}</div>
        <div class="rc-gl">Go-Live: ${fmtDate(r.golive)}</div>
        <div class="rc-mod">Updated ${modStr}</div>
      </div>
      <div class="r-card-bd">
        <div class="rc-metrics">
          <div class="rcm"><div class="rcm-l">Gate Readiness</div><div class="rcm-v">${rl.gateScore!==null?rl.gateScore+'%':'—'}</div></div>
          <div class="rcm"><div class="rcm-l">Risk Flags</div><div class="rcm-v">${rl.flags}</div></div>
          <div class="rcm"><div class="rcm-l">${fwShort()} Avg</div><div class="rcm-v">${rl.adkar!==null?rl.adkar+'/5':'—'}</div></div>
          <div class="rcm"><div class="rcm-l">Projects</div><div class="rcm-v">${(r.projects||[]).length} / ${tp} tr.</div></div>
        </div>
        <div class="rc-foot">
          <span class="status-chip ${rl.status.cls}">${rl.status.label}</span>
          <div class="rc-acts">
            <button class="btn-del-sm" onclick="event.stopPropagation();openDelRelease(${r.id},'${esc(r.name).replace(/'/g,"\\'")}')">Remove</button>
            <button class="btn-sm" onclick="event.stopPropagation();openRelease(${r.id})">Open</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
  document.getElementById('tl-sec').style.display=releases.length>=2?'block':'none';
  document.getElementById('sat-sec').style.display=releases.length>=1?'block':'none';
  renderSaturationMap();renderTimeline();renderAlerts();renderAuditLog();initReleaseDrag();renderPortfolioCharts();renderTrendCharts();
  if(isReadOnly)applyReadOnlyRestrictions();
}

function renderTimeline(){
  const canvas=document.getElementById('tl-canvas');
  const today=new Date();today.setHours(0,0,0,0);
  const allDates=releases.filter(r=>r.golive).map(r=>{const d=new Date(r.golive);d.setHours(0,0,0,0);return d;});
  const wStart=new Date(today);wStart.setDate(wStart.getDate()-21);
  const latest=allDates.length?new Date(Math.max(...allDates)):new Date(today);
  latest.setDate(latest.getDate()+45);
  const wEnd=latest;const totalMs=wEnd-wStart;
  const pct=d=>Math.max(0,Math.min(100,((new Date(d)-wStart)/totalMs)*100));
  const todayPct=pct(today);
  const ticks=[];const tc=new Date(wStart);tc.setDate(1);
  while(tc<=wEnd){ticks.push(new Date(tc));tc.setMonth(tc.getMonth()+1);}
  let html=`<div style="position:relative;margin-left:190px;height:26px;border-bottom:2px solid var(--navy);margin-bottom:0">`;
  ticks.forEach(t=>{const lp=pct(t);html+=`<div style="position:absolute;left:${lp}%;transform:translateX(-50%);font-size:10px;font-weight:700;letter-spacing:0.07em;color:var(--ink-60);white-space:nowrap;padding-top:3px">${t.toLocaleDateString('en-US',{month:'short',year:'2-digit'})}</div>`;if(lp>0)html+=`<div style="position:absolute;left:${lp}%;top:0;bottom:0;width:1px;background:var(--border)"></div>`;});
  html+=`<div style="position:absolute;left:${todayPct}%;top:0;width:2px;height:100%;background:var(--gold);z-index:5"></div></div>`;
  const sorted=[...releases].sort((a,b)=>{if(!a.golive&&!b.golive)return 0;if(!a.golive)return 1;if(!b.golive)return -1;return new Date(a.golive)-new Date(b.golive);});
  sorted.forEach(r=>{
    const rl=relRollup(r);const bCls=rl.status.cls==='on-track'?'bon':rl.status.cls==='at-risk'?'bat':'bcr';const mCls=rl.status.cls==='on-track'?'mon':rl.status.cls==='at-risk'?'mat':'mcr';
    html+=`<div class="tl-row"><div class="tl-rl" onclick="openRelease(${r.id})" tabindex="0" onkeydown="if(event.key==='Enter')openRelease(${r.id})" role="button"><span class="tl-rl-n">${esc(r.name)}</span><span class="tl-rl-s">${(r.agencies||[]).map(a=>esc(a)).join(' · ')||'—'}</span></div>
    <div class="tl-track"><div class="tl-today" style="left:${todayPct}%;height:100%"><div class="tl-today-l">TODAY</div></div>`;
    if(r.golive){const gl=new Date(r.golive);gl.setHours(0,0,0,0);const glPct=pct(gl);const passed=gl<today;const bL=passed?glPct:todayPct;const bW=passed?Math.max(todayPct-glPct,2):Math.max(glPct-todayPct,2);
      html+=`<div class="tl-bar-w" style="left:${bL}%;width:${bW}%" onclick="openRelease(${r.id})"><div class="tl-bar ${passed?'bcr':bCls}"><span class="tl-bar-l">${passed?esc(r.name)+' — overdue':esc(r.name)}</span></div></div>
      <div class="tl-mkr ${passed?'mcr':mCls}" style="left:calc(${glPct}% - 5px)"></div><div class="tl-gl-d" style="left:${glPct}%">${fmtDate(r.golive)}</div>`;
    }else{html+=`<div class="tl-bar-w" style="left:0%;width:15%" onclick="openRelease(${r.id})"><div class="tl-bar bnd"><span class="tl-bar-l">No date set</span></div></div>`;}
    html+='</div></div>';
  });
  canvas.innerHTML=html;
}

// ════════════════════════════════════════════════════════
// RELEASE BAND AGENCIES
// ════════════════════════════════════════════════════════
function renderRelAgencyChips(){
  const r=getRel();if(!r)return;
  document.getElementById('rel-agency-chips').innerHTML=
    (r.agencies||[]).map(a=>`<span class="chip chip-white">${esc(a)}<button class="chip-rm" onclick="removeRelAgency('${esc(a)}')">&times;</button></span>`).join('');
}
function addRelAgency(){
  const r=getRel();if(!r)return;
  const inp=document.getElementById('rel-agency-inp');const val=inp.value.trim();if(!val)return;
  if(!r.agencies)r.agencies=[];if(!r.agencies.includes(val))r.agencies.push(val);
  inp.value='';touch('rel');schedSave();renderRelAgencyChips();renderRelSumBar();
}
function removeRelAgency(a){
  const r=getRel();if(!r)return;
  r.agencies=(r.agencies||[]).filter(x=>x!==a);
  touch('rel');schedSave();renderRelAgencyChips();renderRelSumBar();
}
function updateRelDays(){
  const v=document.getElementById('r-golive').value;
  if(!v){document.getElementById('rel-days-num').textContent='—';return;}
  const d=daysTo(v);document.getElementById('rel-days-num').textContent=fmtDays(d);
  updateRelStatusPill();
}
function updateRelStatusPill(){
  const r=getRel();if(!r)return;
  const rl=relRollup(r);
  const pill=document.getElementById('rel-overall-st');
  pill.className='st-pill '+rl.status.cls;pill.textContent=rl.status.label;
}

// ════════════════════════════════════════════════════════
// RELEASE VIEW
// ════════════════════════════════════════════════════════
function renderRelView(){renderRelSumBar();renderRelScope();renderRelKPIs();renderRelProjCards();renderRelOverview();applyRoleRestrictions();if(isReadOnly)applyReadOnlyRestrictions();}
function renderRelSumBar(){
  const r=getRel();if(!r)return;
  document.getElementById('rsb-name').textContent=r.name||'—';
  document.getElementById('rsb-chips').innerHTML=(r.agencies||[]).map(a=>`<span class="chip chip-white" style="margin-right:4px">${esc(a)}</span>`).join('');
  document.getElementById('rsb-phase').textContent=r.phase||'—';
  document.getElementById('rsb-golive').textContent=r.golive?fmtDate(r.golive):'Not set';
  const rl=relRollup(r);const rg=relRAG(r);const chip=document.getElementById('rsb-chip');
  chip.className='rsb-chip '+rl.status.cls;chip.textContent=rl.status.label;
  const ragEl=document.getElementById('rsb-rag');if(ragEl){ragEl.className='rag-badge '+rg.cls;ragEl.innerHTML='<span class="rag-dot '+rg.cls+'"></span>'+rg.label;}
  const tp=(r.projects||[]).filter(p=>p.trainingRequired).length;
  document.getElementById('rsb-proj-ct').textContent=`${(r.projects||[]).length} total — ${tp} require training`;
}
function renderRelScope(){
  const r=getRel();if(!r)return;
  const trProjs=(r.projects||[]).filter(p=>p.trainingRequired);
  document.getElementById('scope-cnt').textContent=`${trProjs.length} project${trProjs.length!==1?'s':''} requiring training`;
  const rows=document.getElementById('scope-rows');
  if(!trProjs.length){rows.innerHTML='<div class="scope-empty">No projects marked Training Required.</div>';document.getElementById('scope-total').style.display='none';return;}
  const stMap={'Not Started':'sp-st-n','In Progress':'sp-st-a','Complete':'sp-st-g','On Hold':'sp-st-r','Blocked':'sp-st-r'};
  rows.innerHTML=trProjs.map(p=>`<div class="scope-row">
    <span class="sp-name">${esc(p.name)}</span>
    ${(p.agencies||[]).length?`<span class="sp-agency">${p.agencies.map(a=>esc(a)).join(', ')}</span>`:''}
    <span class="sp-users">${p.estimatedUsers?p.estimatedUsers+' users':'—'}</span>
    <span class="sp-status ${stMap[p.status]||'sp-st-n'}">${p.status}</span>
  </div>`).join('');
  const total=trProjs.reduce((s,p)=>s+(p.estimatedUsers||0),0);
  document.getElementById('scope-total').style.display='flex';
  document.getElementById('scope-users').textContent=total.toLocaleString();
}
function renderRelKPIs(){
  const r=getRel();if(!r)return;
  const rl=relRollup(r);
  document.getElementById('r-kpi-gate').textContent=rl.gateScore!==null?rl.gateScore+'%':'—';
  document.getElementById('r-kpi-flags').textContent=rl.flags;
  document.getElementById('r-kpi-projs').textContent=(r.projects||[]).length;
  document.getElementById('r-kpi-adkar').textContent=rl.adkar!==null?rl.adkar+'/5':'—';
  const rkL=document.getElementById('r-kpi-adkar-label');if(rkL)rkL.textContent=fwShort()+' Avg';
  // Highest adoption risk across all projects
  let worstName='—',worstScore=101;
  (r.projects||[]).forEach(p=>{
    const hr=projHighestRisk(p);
    if(hr.score!==null&&hr.score<worstScore){worstScore=hr.score;worstName=hr.name+' ('+p.name+')';}
  });
  document.getElementById('r-kpi-rg').textContent=worstScore<101?worstName:'—';
  document.getElementById('r-kpi-rg-s').textContent=worstScore<101?worstScore+'% adoption likelihood':'Stakeholder group';
}
function renderRelProjCards(){
  const r=getRel();if(!r)return;
  const grid1=document.getElementById('rel-proj-cards');
  const grid2=document.getElementById('rel-proj-list');
  if(!r.projects||!r.projects.length){
    const em='<div class="es"><div class="es-rule"></div><p class="es-txt">No projects added yet. Click Add Project to begin.</p></div>';
    grid1.innerHTML=em;grid2.innerHTML=em;return;
  }
  const cards=r.projects.map(p=>{
    const gs=projGateScore(p);const fl=projFlagCount(p);const adk=projAdkarAvg(p);const st=projStatus(p);
    return`<div class="pc" tabindex="0" draggable="true" data-proj-id="${p.id}" onclick="openProject(${p.id})" onkeydown="if(event.key==='Enter')openProject(${p.id})" role="button" aria-label="Open project ${esc(p.name)}">
      <div class="pc-hd">
        <div style="display:flex;align-items:center;justify-content:space-between"><div class="pc-name">${esc(p.name)}</div><span class="drag-handle" title="Drag to reorder">&#x2630;</span></div>
        <div class="chip-row">${(p.agencies||[]).map(a=>`<span class="chip chip-white">${esc(a)}</span>`).join('')}</div>
        <div class="pc-tr-badge ${p.trainingRequired?'pc-tr-yes':'pc-tr-no'}">${p.trainingRequired?'Training Required':'No Training'}</div>
      </div>
      <div class="pc-bd">
        <div class="pc-metrics">
          <div class="pcm"><div class="pcm-l">Gate Readiness</div><div class="pcm-v">${gs!==null?gs+'%':'—'}</div></div>
          <div class="pcm"><div class="pcm-l">Risk Flags</div><div class="pcm-v">${fl}</div></div>
          <div class="pcm"><div class="pcm-l">${fwShort()}</div><div class="pcm-v">${adk}/5</div></div>
        </div>
        <div class="pc-foot">
          <span class="status-chip ${st.cls}">${st.label}</span>
          <div class="pc-acts">
            <button class="btn-del-proj" onclick="event.stopPropagation();openDelProject(${p.id},'${esc(p.name).replace(/'/g,"\\'")}')">Remove</button>
            <button class="btn-open-sm" onclick="event.stopPropagation();openProject(${p.id})">Open</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  grid1.innerHTML=grid2.innerHTML=cards;initProjectDrag();
}
function renderRelOverview(){
  renderRelSumBar();renderRelScope();renderRelKPIs();renderRelProjCards();
  const r=getRel();if(!r)return;
  // Gate bars per project
  const gp=document.getElementById('rel-ov-gates');
  const projs=(r.projects||[]);
  if(!projs.length){gp.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">Add projects to see gate readiness here.</p></div>';}
  else{gp.innerHTML=projs.map(p=>{
    const gs=projGateScore(p);const col=gs===null?'var(--bg-dark)':gs>=80?'var(--green)':gs>=50?'var(--gold)':'var(--red)';
    return`<div class="ov-row"><div class="ov-name">${esc(p.name)}</div>
      <div class="ov-track"><div class="ov-fill" style="width:${gs||0}%;background:${col}"></div></div>
      <div class="ov-score">${gs!==null?gs+'%':'—'}</div></div>`;
  }).join('');}
  // Flags preview
  const fp=document.getElementById('rel-ov-flags');
  const allFlags=[];
  projs.forEach(p=>{GATE_DEFS.forEach(gate=>{gate.items.forEach((item,i)=>{if(p.gateState[gate.id+'_'+i]==='red')allFlags.push({gate:gate.label,item:item.text,proj:p.name});});});});
  if(!allFlags.length){fp.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">No active risk flags at this time.</p></div>';}
  else{fp.innerHTML=allFlags.slice(0,5).map(f=>`<div class="fpv"><div class="fpv-g">${esc(f.gate)} — ${esc(f.proj)}</div><div class="fpv-i">${esc(f.item)}</div></div>`).join('');}
}

// ════════════════════════════════════════════════════════
// PROJECT BAND
// ════════════════════════════════════════════════════════
function renderProjAgencyChips(){
  const p=getProj();if(!p)return;
  document.getElementById('proj-agency-chips').innerHTML=
    (p.agencies||[]).map(a=>`<span class="chip chip-white">${esc(a)}<button class="chip-rm" onclick="removeProjAgency('${esc(a)}')">&times;</button></span>`).join('');
}
function addProjAgency(){
  const p=getProj();if(!p)return;
  const inp=document.getElementById('proj-agency-inp');const val=inp.value.trim();if(!val)return;
  if(!p.agencies)p.agencies=[];if(!p.agencies.includes(val))p.agencies.push(val);
  inp.value='';touch('proj');schedSave();renderProjAgencyChips();
}
function removeProjAgency(a){
  const p=getProj();if(!p)return;
  p.agencies=(p.agencies||[]).filter(x=>x!==a);
  touch('proj');schedSave();renderProjAgencyChips();
}
function updateTRButtons(){
  const p=getProj();if(!p)return;
  const yes=document.getElementById('tr-yes');const no=document.getElementById('tr-no');
  if(yes){yes.style.background=p.trainingRequired?'var(--green)':'transparent';yes.style.color=p.trainingRequired?'#fff':'rgba(255,255,255,0.40)';}
  if(no){no.style.background=!p.trainingRequired?'var(--red)':'transparent';no.style.color=!p.trainingRequired?'#fff':'rgba(255,255,255,0.40)';}
}
function setProjTR(val){const p=getProj();if(!p)return;p.trainingRequired=val;updateTRButtons();touch('proj');schedSave();}
function updateProjGateScoreBand(){
  const p=getProj();if(!p)return;
  const gs=projGateScore(p);
  document.getElementById('p-gate-score').textContent=gs!==null?gs+'%':'—';
}

// ════════════════════════════════════════════════════════
// PROJECT — ALL RENDER
// ════════════════════════════════════════════════════════
function renderProjAll(){
  // Update assessment framework nav label
  const fw=getFramework();const navAk=document.getElementById('nav-adkar-btn');if(navAk)navAk.textContent=fw.name.split(' ')[0];
  const catTitle=document.getElementById('chart-proj-adkar-title');if(catTitle)catTitle.textContent=fwName()+' Assessment';
  renderPGates();renderPDepHM();renderPAdkar();renderPSH();renderPKPIs();renderPOverview();renderPResources();
  // Show Post-Launch tab if go-live is in the past
  const p=getProj();const plBtn=document.getElementById('nav-postlaunch');const plSec=document.getElementById('psec-postlaunch');
  if(p&&p.golive&&new Date(p.golive)<=new Date()){if(plBtn)plBtn.style.display='';if(plSec)plSec.style.display='';}
  else{if(plBtn)plBtn.style.display='none';if(plSec)plSec.style.display='none';}
  if(isReadOnly)applyReadOnlyRestrictions();
  checkNavOverflow();
}
function checkNavOverflow(){
  const nav=document.getElementById('proj-nav-tabs');
  if(!nav)return;
  nav.classList.toggle('has-overflow',nav.scrollWidth>nav.clientWidth+8);
}
window.addEventListener('resize',checkNavOverflow);

function renderPGates(){
  const p=getProj();if(!p)return;
  const c=document.getElementById('p-gates-container');c.innerHTML='';
  GATE_DEFS.forEach(gate=>{
    const tot=gate.items.length;
    const naCount=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='na').length;
    const applicable=tot-naCount;
    const grn=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='green').length;
    const pct=applicable?Math.round(grn/applicable*100):100;
    const barColor=pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--red)';
    const div=document.createElement('div');div.className='gate-panel';
    div.innerHTML=`<div class="gate-hdr"><div class="gate-ttl">${gate.label} — ${gate.sub}</div><div class="gate-tag" id="pgs-${gate.id}">${grn}/${applicable} &nbsp; ${pct}%<button class="score-info-btn" onclick="event.stopPropagation();showGateInfoPop(this)" title="Gate thresholds" aria-label="Gate score thresholds" style="color:var(--gold-light);margin-left:6px">ⓘ</button></div></div>
    <div class="gate-bar"><div class="gate-fill" id="pgf-${gate.id}" style="width:${pct}%;background:${barColor}"></div></div>
    <div class="gate-items">${gate.items.map((item,i)=>{const st=p.gateState[gate.id+'_'+i]||null;
      return`<div class="gate-item${st==='na'?' gate-na':''}"><div class="gate-txt">${item.text}</div>
        <div class="ss-row" role="group">
          <button class="ss-btn ${st==='green'?'sc':''}" onclick="setPGate('${gate.id}',${i},'green')">Complete</button>
          <button class="ss-btn ${st==='yellow'?'sp':''}" onclick="setPGate('${gate.id}',${i},'yellow')">Partial</button>
          <button class="ss-btn ${st==='red'?'si':''}" onclick="setPGate('${gate.id}',${i},'red')">Incomplete</button>
          <button class="ss-btn ${st==='gray'?'sn':''}" onclick="setPGate('${gate.id}',${i},'gray')">Not Started</button>
          <button class="ss-btn ${st==='na'?'sna':''}" onclick="setPGate('${gate.id}',${i},'na')">N/A</button>
        </div></div>`;}).join('')}</div>`;
    c.appendChild(div);
  });
  updateProjGateScoreBand();
}
function setPGate(gid,idx,color){
  const p=getProj();if(!p)return;
  const k=gid+'_'+idx;p.gateState[k]=p.gateState[k]===color?null:color;
  renderPGates();renderPKPIs();touch('proj');schedSave();
}

const HMS=['Not Started','Complete','Partial','Blocking','N/A'];
function renderPDepHM(){
  const p=getProj();if(!p)return;
  const t=document.getElementById('p-dep-hm');
  let h=`<thead><tr><th class="hm-rh">Gate</th>`;WS.forEach(w=>{h+=`<th>${w}</th>`;});h+='</tr></thead><tbody>';
  GL.forEach((gl,gi)=>{
    h+=`<tr><td class="hm-rl">${gl}</td>`;
    WS.forEach((_,wi)=>{
      const k=`${gi}_${wi}`,s=p.depHM[k]||0;
      const nd=p.depNotes[k]?'<span class="note-dot"></span>':'';
      h+=`<td><div class="hm-cw"><div class="hm-cell" data-s="${s}" onclick="cyclePHMCell('${k}')" tabindex="0" onkeydown="if(event.key==='Enter')cyclePHMCell('${k}')">${nd}${HMS[s]}</div></div></td>`;
    });h+='</tr>';
  });h+='</tbody>';t.innerHTML=h;
}
function cyclePHMCell(k){const p=getProj();if(!p)return;p.depHM[k]=((p.depHM[k]||0)+1)%5;renderPDepHM();touch('proj');schedSave();}
document.addEventListener('click',e=>{
  if(e.shiftKey&&e.target.classList.contains('hm-cell')){
    e.preventDefault();const oc=e.target.getAttribute('onclick');const k=oc?.match(/'([^']+)'/)?.[1];
    if(k){noteKey=k;document.getElementById('note-ta').value=getProj()?.depNotes[k]||'';openModal('note-modal');setTimeout(()=>document.getElementById('note-ta').focus(),50);}
  }
});
function saveNote(){const p=getProj();if(p&&noteKey)p.depNotes[noteKey]=document.getElementById('note-ta').value;closeModal('note-modal');renderPDepHM();touch('proj');schedSave();}

function getPFlags(){
  const p=getProj();if(!p)return[];const r=getRel();
  const f=[];
  GATE_DEFS.forEach(gate=>{
    gate.items.forEach((item,i)=>{
      if(p.gateState[gate.id+'_'+i]==='red'){
        const defOwner=getEffectiveRes(p,item.owner||'','name');
        f.push({gate:gate.label,sub:gate.sub,item:item.text,consequence:RC[gate.id]?.[i]||'Change readiness is at risk.',key:gate.id+'_'+i,defOwner});
      }
    });
  });
  return f;
}
function renderPFlags(){
  const f=getPFlags();const pan=document.getElementById('p-flags-panel');
  if(!f.length){pan.innerHTML='<div class="nfs"><div class="nfs-rule"></div><p class="nfs-txt">No active risk flags. Mark gate items Incomplete in the Gate Tracker to generate flags.</p></div>';return;}
  pan.innerHTML=f.map((fl,i)=>`<div class="rf">
    <div class="rf-meta"><div class="rf-num">Risk Flag ${i+1} of ${f.length}</div><div class="rf-tag">${esc(fl.gate)} — ${esc(fl.sub)}</div></div>
    <div class="rf-row"><strong>Gap:</strong> ${esc(fl.item)}</div>
    <div class="rf-row"><strong>Consequence to Training:</strong> ${esc(fl.consequence)}</div>
    <div class="rf-inputs">
      <div class="rf-field"><label>Owner</label><input type="text" id="own_${fl.key}" value="${esc(fl.defOwner)}" placeholder="Assign responsible party"></div>
      <div class="rf-field"><label>Resolution Date</label><input type="date" id="due_${fl.key}"></div>
    </div>
  </div>`).join('');
}

function renderPAdkar(){
  const p=getProj();if(!p)return;
  const dims=getActiveDims();
  const fw=getFramework();
  const eye=document.getElementById('assess-eye');if(eye)eye.textContent=fw.name;
  const head=document.getElementById('assess-head');if(head)head.textContent=fw.name+' Readiness Assessment';
  const pt=document.getElementById('assess-pt');if(pt)pt.textContent=fw.name+' Readiness by Dimension';
  const navBtn=document.getElementById('nav-adkar-btn');if(navBtn)navBtn.textContent=fw.name.split(' ')[0];
  // Migrate legacy scores if needed
  const migrated=migrateScores(p.adkarScores);
  if(migrated!==p.adkarScores){p.adkarScores=migrated;}
  // Ensure scores exist for all dims
  dims.forEach(d=>{if(p.adkarScores[d.key]===undefined)p.adkarScores[d.key]=3;});
  if(!p.adkarNotes)p.adkarNotes={};
  dims.forEach(d=>{if(p.adkarNotes[d.key]===undefined)p.adkarNotes[d.key]='';});
  const grid=document.getElementById('p-adkar-grid');
  grid.style.gridTemplateColumns='repeat('+Math.min(dims.length,5)+',1fr)';
  grid.innerHTML=dims.map(d=>`
    <div class="ak-col"><div class="ak-hd"><div class="ak-ltr">${esc(d.letter)}</div><div class="ak-wrd">${esc(d.word)}</div></div>
    <div class="ak-bd"><label>Readiness Score</label>
    <div class="ak-sr"><input type="range" class="ak-sl" min="1" max="5" value="${p.adkarScores[d.key]||3}" oninput="updatePAdkar('${d.key}',this.value)">
    <div class="ak-vl" id="pav-${d.key}">${p.adkarScores[d.key]||3}</div></div>
    <div class="ak-bar"><div class="ak-bar-fill" id="pab-${d.key}" style="width:${(p.adkarScores[d.key]||3)/5*100}%;background:${adkarColor(p.adkarScores[d.key]||3)}"></div></div>
    <label style="margin-top:3px">Qualitative Notes</label>
    <textarea class="ak-notes" placeholder="${esc(d.desc)}..." oninput="updatePAdkarNote('${d.key}',this.value)">${esc(p.adkarNotes[d.key]||'')}</textarea>
    </div></div>`).join('');
  updatePAdkarSummary();
}
function updatePAdkar(k,v){
  const p=getProj();if(!p)return;p.adkarScores[k]=parseInt(v);
  const ve=document.getElementById('pav-'+k);const be=document.getElementById('pab-'+k);
  if(ve)ve.textContent=v;if(be){be.style.width=(parseInt(v)/5*100)+'%';be.style.background=adkarColor(parseInt(v));}
  updatePAdkarSummary();renderPKPIs();touch('proj');schedSave();
}
function updatePAdkarNote(k,v){const p=getProj();if(!p)return;p.adkarNotes[k]=v;touch('proj');schedSave();}
function updatePAdkarSummary(){
  const p=getProj();if(!p)return;
  const dims=getActiveDims();
  const vals=dims.map(d=>p.adkarScores[d.key]||3);const avg=(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
  document.getElementById('p-adkar-overall').textContent=avg+'/5';
  const sumL=document.getElementById('ak-sum-label');if(sumL)sumL.textContent='Overall '+fwShort()+' Score';
  document.getElementById('p-adkar-int').textContent=
    avg>=4?'Strong organizational readiness. Sustain momentum through targeted reinforcement and visible sponsor engagement.'
    :avg>=3?'Moderate readiness. Targeted interventions recommended for dimensions scoring below 3.'
    :avg>=2?'Readiness gaps identified. Structured engagement, coaching, and sponsor activation required prior to go-live.'
    :'Critical readiness deficit. Recommend formal escalation to executive sponsor before proceeding.';
  const kpi=document.getElementById('p-kpi-adkar');if(kpi)kpi.textContent=avg+'/5';
  const kpiL=document.getElementById('p-kpi-adkar-label');if(kpiL)kpiL.textContent=fwShort()+' Score';
}

function addPSH(){
  const p=getProj();if(!p)return;
  const inp=document.getElementById('p-sh-inp');const name=inp.value.trim();if(!name)return;
  p.stakeholders.push({id:uid(),name,
    factors:{resistance:3,env:3,window:3,complexity:3,saturation:3,leadership:3},objectives:[],
    kirk:{L1:{method:'',timing:''},L2:{method:'',assessment:''},L3:{interval:'30',observable:''},L4:{outcome:'',metric:''}},
    rein:{owner:'',activities:'',intervals:['30 Days'],escalation:''}});
  inp.value='';renderPSH();renderPKPIs();touch('proj');schedSave();
}
function removePSH(id){const p=getProj();if(!p)return;p.stakeholders=p.stakeholders.filter(s=>s.id!==id);renderPSH();renderPKPIs();touch('proj');schedSave();}
function renderPSH(){
  const p=getProj();if(!p)return;const wrap=document.getElementById('p-sh-wrap');
  if(!p.stakeholders.length){wrap.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">Add stakeholder groups to begin scoring adoption likelihood.</p></div>';renderPAHM();return;}
  const adkarR=p.adkarScores['R'];
  const rNote=adkarR>=4?'Strong reinforcement environment. Sustain through scheduled check-ins.':adkarR>=3?'Moderate reinforcement signals. Supervisor activation recommended before go-live.':adkarR>=2?'Reinforcement gaps identified. Structured coaching and floor support required.':'Critical reinforcement deficit. Adoption sustainability is at high risk without immediate intervention.';
  wrap.innerHTML=p.stakeholders.map(sh=>{
    const sc=adoptScore(sh.factors),{tier,cls}=adoptTier(sc);
    const kr=kirkReady(sh),rr=reinReady(sh);const loc=sh.objectives.filter(o=>o.trim()).length;
    return`<div class="sh-card"><div class="sh-hd">
      <div class="sh-name">${esc(sh.name)}</div>
      <div class="adopt-badge ${cls}">${sc}% — ${tier}</div>
      <button class="btn-rm-sh" onclick="removePSH(${sh.id})">&times;</button>
    </div>
    <div class="sh-factors">${AF.map(f=>`<div class="sh-fac"><label>${f.label}</label>
      <div class="fac-row"><input type="range" class="fac-sl" min="1" max="5" value="${sh.factors[f.key]}" oninput="updatePFac(${sh.id},'${f.key}',this.value)">
      <div class="fac-vl" id="pfv-${sh.id}-${f.key}">${sh.factors[f.key]}</div></div>
      <div class="fac-desc" id="pfd-${sh.id}-${f.key}">${FD[sh.factors[f.key]]}</div></div>`).join('')}</div>
    <div class="exp-secs">
      <div class="exp-sec"><button class="exp-tog" onclick="toggleExp('plo-${sh.id}',this)" aria-expanded="false">
        <div class="exp-tog-l">Learning Objectives<span class="exp-badge ${loc>0?'ready':'needed'}">${loc>0?loc+' Defined':'Not Started'}</span></div>
        <span class="exp-arr" id="parr-lo-${sh.id}">&#9660;</span></button>
        <div class="exp-body" id="plo-${sh.id}">
          <div class="lo-hint">Write in performance terms: the learner will be able to [verb] [skill/behavior] [condition/standard].</div>
          <ul class="lo-list">${sh.objectives.map((o,i)=>`<li class="lo-item"><span class="lo-num">0${i+1}</span>
            <input class="lo-inp" value="${esc(o)}" placeholder="The learner will be able to..." oninput="updatePLO(${sh.id},${i},this.value)">
            <button class="btn-lo-rm" onclick="removePLO(${sh.id},${i})">&times;</button></li>`).join('')}</ul>
          <button class="btn-lo-add" onclick="addPLO(${sh.id})">+ Add Objective</button>
        </div>
      </div>
      <div class="exp-sec"><button class="exp-tog" onclick="toggleExp('pkirk-${sh.id}',this)" aria-expanded="false">
        <div class="exp-tog-l">Measurement Framework — Kirkpatrick<span class="exp-badge ${kr}">${badgeLabel(kr)}</span></div>
        <span class="exp-arr" id="parr-kirk-${sh.id}">&#9660;</span></button>
        <div class="exp-body" id="pkirk-${sh.id}">
          <div class="kirk-grid">
            <div class="kirk-card"><div class="kirk-hd"><div class="kirk-badge">L1</div><div><div class="kirk-name">Reaction</div><div class="kirk-desc-txt">Learner feedback and satisfaction</div></div></div>
              <div class="kirk-field"><label>Feedback Method</label><input class="kirk-inp" placeholder="e.g. Post-training survey via LMS" value="${esc(sh.kirk.L1.method)}" oninput="updatePKirk(${sh.id},'L1','method',this.value)"></div>
              <div class="kirk-field"><label>Collection Timing</label><input class="kirk-inp" placeholder="e.g. Immediately following each session" value="${esc(sh.kirk.L1.timing)}" oninput="updatePKirk(${sh.id},'L1','timing',this.value)"></div></div>
            <div class="kirk-card"><div class="kirk-hd"><div class="kirk-badge">L2</div><div><div class="kirk-name">Learning</div><div class="kirk-desc-txt">Knowledge and skill transfer confirmation</div></div></div>
              <div class="kirk-field"><label>Assessment Method</label><input class="kirk-inp" placeholder="e.g. Scenario-based skills check" value="${esc(sh.kirk.L2.method)}" oninput="updatePKirk(${sh.id},'L2','method',this.value)"></div>
              <div class="kirk-field"><label>Proficiency Standard</label><input class="kirk-inp" placeholder="e.g. 80% accuracy prior to go-live access" value="${esc(sh.kirk.L2.assessment)}" oninput="updatePKirk(${sh.id},'L2','assessment',this.value)"></div></div>
            <div class="kirk-card"><div class="kirk-hd"><div class="kirk-badge">L3</div><div><div class="kirk-name">Behavior</div><div class="kirk-desc-txt">Observable behavior change post go-live</div></div></div>
              <div class="kirk-field"><label>Observable Behavior Indicator</label><input class="kirk-inp" placeholder="e.g. Accurate case entry without assistance" value="${esc(sh.kirk.L3.observable)}" oninput="updatePKirk(${sh.id},'L3','observable',this.value)"></div>
              <div class="kirk-field"><label>Measurement Interval</label>
                <select class="kirk-inp" style="width:auto" onchange="updatePKirk(${sh.id},'L3','interval',this.value)">
                  <option ${sh.kirk.L3.interval==='14'?'selected':''}>14 days post go-live</option>
                  <option ${sh.kirk.L3.interval==='30'?'selected':''}>30 days post go-live</option>
                  <option ${sh.kirk.L3.interval==='60'?'selected':''}>60 days post go-live</option>
                  <option ${sh.kirk.L3.interval==='90'?'selected':''}>90 days post go-live</option>
                </select></div></div>
            <div class="kirk-card"><div class="kirk-hd"><div class="kirk-badge">L4</div><div><div class="kirk-name">Results</div><div class="kirk-desc-txt">Organizational outcome alignment</div></div></div>
              <div class="kirk-field"><label>Targeted Organizational Outcome</label><input class="kirk-inp" placeholder="e.g. Reduction in case processing errors" value="${esc(sh.kirk.L4.outcome)}" oninput="updatePKirk(${sh.id},'L4','outcome',this.value)"></div>
              <div class="kirk-field"><label>Success Metric</label><input class="kirk-inp" placeholder="e.g. Error rate below 5% at 60-day review" value="${esc(sh.kirk.L4.metric)}" oninput="updatePKirk(${sh.id},'L4','metric',this.value)"></div></div>
          </div>
        </div>
      </div>
      <div class="exp-sec"><button class="exp-tog" onclick="toggleExp('prein-${sh.id}',this)" aria-expanded="false">
        <div class="exp-tog-l">Reinforcement Plan — ${fwShort()} Alignment<span class="exp-badge ${rr}">${badgeLabel(rr)}</span></div>
        <span class="exp-arr" id="parr-rein-${sh.id}">&#9660;</span></button>
        <div class="exp-body" id="prein-${sh.id}">
          <div class="rein-grid">
            <div class="rein-field"><label>Reinforcement Owner</label><input class="rein-inp" placeholder="e.g. Direct supervisor, change champion" value="${esc(sh.rein.owner)}" oninput="updatePRein(${sh.id},'owner',this.value)"></div>
            <div class="rein-field"><label>Escalation Path</label><input class="rein-inp" placeholder="e.g. Escalate to OCM lead if metrics fall below threshold" value="${esc(sh.rein.escalation)}" oninput="updatePRein(${sh.id},'escalation',this.value)"></div>
            <div class="rein-field" style="grid-column:1/-1"><label>Reinforcement Activities</label>
              <textarea class="rein-ta" placeholder="e.g. Job aids at go-live, 2-week floor support, 30-day check-in..." oninput="updatePRein(${sh.id},'activities',this.value)">${esc(sh.rein.activities)}</textarea></div>
            <div class="rein-field" style="grid-column:1/-1"><label>Post Go-Live Check-In Intervals</label>
              <div class="rein-intervals">${['2 Weeks','30 Days','60 Days','90 Days','6 Months'].map(iv=>`<label class="intv-cb"><input type="checkbox" ${sh.rein.intervals.includes(iv)?'checked':''} onchange="updatePReinIv(${sh.id},'${iv}',this.checked)"> ${iv}</label>`).join('')}</div></div>
          </div>
          <div class="ak-r-note"><strong>${fwShort()} Reinforcement Score: ${adkarR}/5 —</strong> ${rNote}</div>
        </div>
      </div>
    </div></div>`;
  }).join('');
  renderPAHM();
}
function updatePFac(id,key,val){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.factors[key]=parseInt(val);const ve=document.getElementById(`pfv-${id}-${key}`);const de=document.getElementById(`pfd-${id}-${key}`);if(ve)ve.textContent=val;if(de)de.textContent=FD[parseInt(val)];renderPSH();renderPKPIs();touch('proj');schedSave();}
function addPLO(id){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.objectives.push('');renderPSH();const b=document.getElementById('plo-'+id);if(b){b.classList.add('open');const a=document.getElementById('parr-lo-'+id);if(a)a.classList.add('open');}touch('proj');schedSave();}
function removePLO(id,idx){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.objectives.splice(idx,1);renderPSH();touch('proj');schedSave();}
function updatePLO(id,idx,val){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.objectives[idx]=val;
  // Update badge count live
  const loc=sh.objectives.filter(o=>o.trim()).length;
  const badge=document.querySelector(`#plo-${id}`)?.closest('.exp-sec')?.querySelector('.exp-badge');
  if(badge){badge.textContent=loc>0?loc+' Defined':'Not Started';badge.className='exp-badge '+(loc>0?'ready':'needed');}
  touch('proj');schedSave();}
function updatePKirk(id,level,field,val){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.kirk[level][field]=val;touch('proj');schedSave();}
function updatePRein(id,field,val){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.rein[field]=val;touch('proj');schedSave();}
function updatePReinIv(id,iv,checked){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;if(checked&&!sh.rein.intervals.includes(iv))sh.rein.intervals.push(iv);if(!checked)sh.rein.intervals=sh.rein.intervals.filter(x=>x!==iv);touch('proj');schedSave();}
function toggleExp(id,btn){const body=document.getElementById(id);const arr=btn.querySelector('.exp-arr');if(!body)return;const open=body.classList.toggle('open');if(arr)arr.classList.toggle('open',open);btn.setAttribute('aria-expanded',open);}

function renderPAHM(){
  const p=getProj();if(!p)return;const pan=document.getElementById('p-ahm-panel');
  if(!p.stakeholders.length){pan.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">Score stakeholder groups in the Adoption Scoring tab to populate this map.</p></div>';return;}
  const cols=[...AF.map(f=>f.label),'Measurement','Reinforcement','Adoption Score'];
  let h='<div style="overflow-x:auto"><table class="ahm-tbl"><thead><tr><th class="ahm-rh">Group</th>';cols.forEach(c=>{h+=`<th>${c}</th>`;});h+='</tr></thead><tbody>';
  p.stakeholders.forEach(sh=>{
    const sc=adoptScore(sh.factors),{tier,cls}=adoptTier(sc);
    const kr=kirkReady(sh),rr=reinReady(sh);const krCls=kr==='ready'?'low':kr==='partial'?'mod':'crit';const rrCls=rr==='ready'?'low':rr==='partial'?'mod':'crit';
    h+=`<tr><td class="ahm-rl">${esc(sh.name)}</td>`;
    AF.forEach(f=>{const v=sh.factors[f.key],t=facTier(v);h+=`<td class="ahm-cw"><div class="ahm-cell ${t}">${TIER_MAP[t]}<br><span style="font-size:9px;opacity:0.65">${v}/5</span></div></td>`;});
    h+=`<td class="ahm-cw"><div class="ahm-cell ${krCls}">${badgeLabel(kr)}</div></td>`;
    h+=`<td class="ahm-cw"><div class="ahm-cell ${rrCls}">${badgeLabel(rr)}</div></td>`;
    h+=`<td class="ahm-cw"><div class="ahm-cell ${cls}" style="font-size:11px">${sc}%<br><span style="font-size:9px;opacity:0.65">${tier}</span></div></td></tr>`;
  });
  h+='</tbody></table></div>';pan.innerHTML=h;
}

function renderPResources(){
  const p=getProj();if(!p)return;
  migrateResources(p);
  document.getElementById('p-res-grid').innerHTML=RES_ROLES.map(role=>{
    const arr=p.resources[role.key]||[];
    const entries=arr.length?arr:[{name:'',contact:''}];
    const showContact=role.key==='smes';
    return`<div class="res-card">
      <div class="res-role">${role.label}</div>
      ${entries.map((entry,i)=>`<div class="res-fields" style="margin-bottom:6px;position:relative">
        <div><div class="res-field"><label>Name</label><input class="res-inp" type="text" value="${esc(entry.name||'')}" placeholder="Full name" oninput="updatePRes('${role.key}',${i},'name',this.value)"></div></div>
        ${showContact?`<div><div class="res-field"><label>Contact / Agency</label><input class="res-inp" type="text" value="${esc(entry.contact||'')}" placeholder="Email or agency" oninput="updatePRes('${role.key}',${i},'contact',this.value)"></div></div>`:''}
        ${entries.length>1?`<button class="res-remove-btn" onclick="removePRes('${role.key}',${i})" title="Remove">&times;</button>`:''}
      </div>`).join('')}
      <button class="res-add-btn" onclick="addPRes('${role.key}')">+ Add Resource</button>
    </div>`;
  }).join('');
  // Quick-view on overview tab
  const allRes=RES_ROLES.filter(role=>(p.resources[role.key]||[]).some(e=>e.name));
  const qv=document.getElementById('p-res-qv');
  if(!allRes.length){qv.innerHTML='<div class="es" style="padding:16px"><div class="es-rule"></div><p class="es-txt">No resources assigned. Add assignments in the Resources tab.</p></div>';return;}
  qv.innerHTML=allRes.map(role=>{
    const arr=p.resources[role.key].filter(e=>e.name);
    return arr.map(entry=>`<div class="res-qv-card">
      <div class="res-qv-role">${role.label}</div>
      <div class="res-qv-name">${esc(entry.name)}</div>
      ${entry.contact?`<div class="res-qv-contact">${esc(entry.contact)}</div>`:''}
    </div>`).join('');
  }).join('');
}
function updatePRes(key,idx,field,val){const p=getProj();if(!p)return;migrateResources(p);if(!p.resources[key][idx])p.resources[key][idx]={name:'',contact:''};p.resources[key][idx][field]=val;touch('proj');schedSave();}
function addPRes(key){const p=getProj();if(!p)return;migrateResources(p);p.resources[key].push({name:'',contact:''});renderPResources();touch('proj');schedSave();}
function removePRes(key,idx){const p=getProj();if(!p)return;migrateResources(p);if(p.resources[key].length>1){p.resources[key].splice(idx,1);renderPResources();touch('proj');schedSave();}}

function renderPKPIs(){
  const p=getProj();if(!p)return;
  const gs=projGateScore(p);
  document.getElementById('p-kpi-gate').textContent=gs!==null?gs+'%':'—';
  document.getElementById('p-kpi-flags').textContent=getPFlags().length;
  document.getElementById('p-kpi-grps').textContent=p.stakeholders.length;
  const hr=projHighestRisk(p);
  document.getElementById('p-kpi-rg').textContent=hr.name;
  document.getElementById('p-kpi-rg-s').textContent=hr.score!==null?hr.score+'% adoption likelihood':'Stakeholder group';
  updateProjGateScoreBand();
}

// ════════════════════════════════════════════════════════
// SCORE EXPLAINER
// ════════════════════════════════════════════════════════
function openScoreExplainer(){
  const p=getProj();if(!p)return;
  let existing=document.getElementById('score-explainer-modal');
  if(existing)existing.remove();

  // Calculate component scores
  const shs=p.stakeholders||[];
  const dims=getActiveDims();

  // Framework Assessment (30%) - average of ADKAR/framework scores
  const fwScores=dims.map(d=>p.adkarScores?.[d.key]||3);
  const fwAvg=fwScores.length?fwScores.reduce((a,b)=>a+b,0)/fwScores.length:3;
  const fwPct=Math.round(fwAvg/5*100);

  // Stakeholder Sentiment (20%) - average adoption score across all groups
  const sentPct=shs.length?Math.round(shs.reduce((a,sh)=>a+adoptScore(sh.factors),0)/shs.length):0;

  // Training Effectiveness (20%) - based on Kirkpatrick completion
  const kirkPcts=shs.map(sh=>{
    if(!sh?.kirk)return 0;
    let f=0;const k=sh.kirk;
    if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;
    if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;
    return Math.round(f/8*100);
  });
  const trainPct=kirkPcts.length?Math.round(kirkPcts.reduce((a,b)=>a+b,0)/kirkPcts.length):0;

  // Communications Completion (15%) - framework scores for awareness/comms dimensions
  const commsDims=dims.filter(d=>['A1','d1','d7','d8'].includes(d.key));
  const commsAvg=commsDims.length?commsDims.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/commsDims.length:3;
  const commsPct=Math.round(commsAvg/5*100);

  // Risk Adjustment (15%) - inverse of risk flag density
  const gs=projGateScore(p);
  const flagCount=getPFlags().length;
  const riskPct=Math.max(0,Math.min(100, gs!==null ? Math.round(gs*(flagCount===0?1:flagCount<=2?0.8:0.5)) : 50));

  // Weighted total
  const totalScore=Math.round(fwPct*0.30 + sentPct*0.20 + trainPct*0.20 + commsPct*0.15 + riskPct*0.15);

  // Determine tier
  let tierKey='critical';
  if(totalScore>=85)tierKey='champion';
  else if(totalScore>=65)tierKey='ontrack';
  else if(totalScore>=40)tierKey='atrisk';

  const components=[
    {label:fwName()+' Assessment',weight:'30%',pct:fwPct,color:'var(--navy)'},
    {label:'Stakeholder Sentiment',weight:'20%',pct:sentPct,color:'var(--gold)'},
    {label:'Training Effectiveness',weight:'20%',pct:trainPct,color:'var(--green)'},
    {label:'Comms Completion',weight:'15%',pct:commsPct,color:'#4A6FA5'},
    {label:'Risk Adjustment',weight:'15%',pct:riskPct,color:riskPct>=70?'var(--green)':riskPct>=40?'var(--amber)':'var(--red)'}
  ];

  const modal=document.createElement('div');
  modal.id='score-explainer-modal';
  modal.className='score-modal';
  modal.innerHTML=`<div class="score-modal-box">
    <button class="score-modal-close" onclick="document.getElementById('score-explainer-modal').classList.remove('open')" aria-label="Close">&times;</button>
    <h2>How This Score Works</h2>
    <p style="font-size:13px;color:var(--ink-60);margin:8px 0 20px">The Adoption Score is a weighted composite of five readiness dimensions, calculated from your project data.</p>

    <h3>Formula Breakdown</h3>
    <div style="font-size:22px;font-weight:700;color:var(--navy);margin:8px 0 16px;font-family:var(--font-d)">Composite Score: ${totalScore}%</div>
    ${components.map(c=>`<div class="score-bar-row">
      <div class="score-bar-label">${c.label}</div>
      <div class="score-bar-track"><div class="score-bar-fill" style="width:${c.pct}%;background:${c.color}"><span class="score-bar-val">${c.pct}%</span></div></div>
      <div class="score-bar-weight">${c.weight}</div>
    </div>`).join('')}

    <h3>Tier Classification</h3>
    <div class="tier-strip">
      <div class="tier-badge champion ${tierKey==='champion'?'active':''}">Champion<br><span style="font-weight:400;font-size:10px">85–100</span></div>
      <div class="tier-badge ontrack ${tierKey==='ontrack'?'active':''}">On Track<br><span style="font-weight:400;font-size:10px">65–84</span></div>
      <div class="tier-badge atrisk ${tierKey==='atrisk'?'active':''}">At Risk<br><span style="font-weight:400;font-size:10px">40–64</span></div>
      <div class="tier-badge critical ${tierKey==='critical'?'active':''}">Critical<br><span style="font-weight:400;font-size:10px">0–39</span></div>
    </div>

    <h3>Gate Scoring Thresholds</h3>
    <div style="margin:8px 0">
      <div class="gate-thresh"><span class="gate-dot" style="background:var(--green)"></span><strong>Go</strong> — Score ≥ 75%</div>
      <div class="gate-thresh"><span class="gate-dot" style="background:var(--amber)"></span><strong>Conditional Go</strong> — Score 50–74%</div>
      <div class="gate-thresh"><span class="gate-dot" style="background:var(--red)"></span><strong>No-Go</strong> — Score < 50%</div>
    </div>

    <div class="score-method-note">
      <strong>Methodology Notes:</strong> Stakeholder sentiment scores are influence-weighted based on adoption factors. Training effectiveness gives greater weight to Kirkpatrick L3 (Behavior) and L4 (Results) levels over L1 (Reaction) and L2 (Learning), reflecting actual performance transfer rather than satisfaction alone.
    </div>
  </div>`;

  document.body.appendChild(modal);
  // Click outside to close
  modal.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
  // Open with slight delay for animation
  requestAnimationFrame(()=>modal.classList.add('open'));
}

function showGateInfoPop(btn){
  // Remove any existing popover
  document.querySelectorAll('.gate-info-pop').forEach(p=>p.remove());
  const pop=document.createElement('div');
  pop.className='gate-info-pop';
  pop.innerHTML=`<div style="font-weight:700;margin-bottom:6px;color:var(--navy)">Gate Score Thresholds</div>
    <div class="gate-thresh"><span class="gate-dot" style="background:var(--green)"></span> Go — ≥ 75%</div>
    <div class="gate-thresh"><span class="gate-dot" style="background:var(--amber)"></span> Conditional — 50–74%</div>
    <div class="gate-thresh"><span class="gate-dot" style="background:var(--red)"></span> No-Go — < 50%</div>`;
  btn.parentElement.style.position='relative';
  btn.parentElement.appendChild(pop);
  // Close on click outside
  const closer=function(e){if(!pop.contains(e.target)&&e.target!==btn){pop.remove();document.removeEventListener('click',closer);}};
  setTimeout(()=>document.addEventListener('click',closer),10);
}

// ════════════════════════════════════════════════════════
// AI-POWERED PREDICTED TRAJECTORY
// ════════════════════════════════════════════════════════
let _trajCache={};
let _trajChartInstance=null;
const TRAJ_EDGE_URL='https://yufehucjvviwanbulcok.supabase.co/functions/v1/predict-trajectory';
const TRAJ_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZmVodWNqdnZpd2FuYnVsY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NjE2NjEsImV4cCI6MjA5MDUzNzY2MX0.2yF5PqIjsKsGGFyCTIYtZk999ff7lavTA5kFRPPBkcQ';

function getTrajCacheKey(p){
  // Build a hash from project data that changes when prediction-relevant data changes
  const parts=[
    JSON.stringify(p.gateState),
    JSON.stringify(p.adkarScores),
    p.stakeholders.map(s=>JSON.stringify(s.factors)).join(','),
    p.stakeholders.map(s=>adoptScore(s.factors)).join(','),
    p.stakeholders.length,
    p.golive||'',
    (p.impactAssessment?.groups||[]).length,
    (p.gapAnalysis?.gaps||[]).length
  ].join('|');
  let hash=0;
  for(let i=0;i<parts.length;i++){hash=((hash<<5)-hash)+parts.charCodeAt(i);hash|=0;}
  return p.id+'_'+hash;
}

function collectTrajectoryData(p){
  const dims=getActiveDims();

  // Per-gate scores
  const gateScores=GATE_DEFS.map(gate=>{
    const tot=gate.items.length;
    const naCount=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='na').length;
    const applicable=tot-naCount;
    const grn=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='green').length;
    const ylw=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='yellow').length;
    const red=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='red').length;
    const notStarted=gate.items.filter((_,i)=>!p.gateState[gate.id+'_'+i]||p.gateState[gate.id+'_'+i]==='gray').length;
    const pct=applicable?Math.round(grn/applicable*100):null;
    const status=pct===null?'not_applicable':pct>=75?'go':pct>=50?'conditional':'no_go';
    return{gate:gate.label,sub:gate.sub,score:pct,status,completed:grn,partial:ylw,incomplete:red,notStarted,applicable};
  });

  // Framework assessment scores
  const fwScores={};
  dims.forEach(d=>{fwScores[d.word]=p.adkarScores?.[d.key]||3;});
  const fwAvg=dims.length?dims.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/dims.length:3;

  // Stakeholder data
  const stakeholderData=p.stakeholders.map(s=>({
    name:s.name,
    adoptionScore:adoptScore(s.factors),
    tier:adoptTier(adoptScore(s.factors)).tier,
    factors:Object.fromEntries(AF.map(f=>([f.label, s.factors?.[f.key]||3]))),
    kirkpatrickReady:kirkReady(s),
    reinforcementReady:reinReady(s)
  }));

  // Training completion rates
  const trainRate=stakeholderData.length?Math.round(stakeholderData.filter(s=>s.kirkpatrickReady==='ready').length/stakeholderData.length*100):0;
  const reinRate=stakeholderData.length?Math.round(stakeholderData.filter(s=>s.reinforcementReady==='ready').length/stakeholderData.length*100):0;

  // Risk flags
  const flags=getPFlags();

  // Gap analysis
  const gaps=(p.gapAnalysis?.gaps||[]).map(g=>({
    description:g.description||'',
    severity:g.severity||'Medium',
    status:g.status||'Open',
    owner:g.owner||''
  }));

  // Impact groups
  const impactGroups=(p.impactAssessment?.groups||[]).map(g=>({
    name:g.name||'',
    impactLevel:g.impactLevel||'Medium',
    changeTypes:g.changeTypes||[],
    readinessActions:g.readinessActions?.length||0,
    completedActions:g.readinessActions?.filter(a=>a.done).length||0
  }));

  // Determine which gates are "completed" vs "upcoming"
  const completedGates=gateScores.filter(g=>g.score!==null&&g.notStarted===0&&g.incomplete===0);
  const upcomingGates=gateScores.filter(g=>g.score===null||g.notStarted>0||g.incomplete>0);

  // Confidence calculation
  const dataPoints=completedGates.length + (stakeholderData.length>0?1:0) + (gaps.length>0?1:0) + (impactGroups.length>0?1:0) + (trainRate>0?1:0);
  const confidence=dataPoints>=5?'High':dataPoints>=3?'Medium':'Low';

  // Overall adoption score (from explainer formula)
  const sentPct=stakeholderData.length?Math.round(stakeholderData.reduce((a,s)=>a+s.adoptionScore,0)/stakeholderData.length):0;
  const kirkPcts=p.stakeholders.map(sh=>{
    if(!sh?.kirk)return 0;let f=0;const k=sh.kirk;
    if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;
    if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;
    return Math.round(f/8*100);
  });
  const trainPctCalc=kirkPcts.length?Math.round(kirkPcts.reduce((a,b)=>a+b,0)/kirkPcts.length):0;
  const commsDims=dims.filter(d=>['A1','d1','d7','d8'].includes(d.key));
  const commsAvg=commsDims.length?commsDims.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/commsDims.length:3;
  const commsPct=Math.round(commsAvg/5*100);
  const gs=projGateScore(p);
  const flagCount=flags.length;
  const riskPct=Math.max(0,Math.min(100,gs!==null?Math.round(gs*(flagCount===0?1:flagCount<=2?0.8:0.5)):50));
  const fwPct=Math.round(fwAvg/5*100);
  const currentAdoptionScore=Math.round(fwPct*0.30+sentPct*0.20+trainPctCalc*0.20+commsPct*0.15+riskPct*0.15);

  return{
    projectName:p.name,
    frameworkName:fwName(),
    goLiveDate:p.golive||null,
    currentAdoptionScore,
    overallGateScore:gs,
    confidence,
    gateScores,
    completedGates,
    upcomingGates,
    frameworkScores:fwScores,
    frameworkAverage:Math.round(fwAvg*100)/100,
    stakeholders:stakeholderData,
    avgStakeholderSentiment:sentPct,
    trainingCompletionRate:trainRate,
    reinforcementRate:reinRate,
    riskFlags:flags.map(f=>({gate:f.gate,sub:f.sub,item:f.item})),
    gaps,
    impactGroups
  };
}

async function callAnthropicPrediction(data){
  const response=await fetch(TRAJ_EDGE_URL,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':'Bearer '+TRAJ_ANON_KEY
    },
    body:JSON.stringify(data)
  });

  if(!response.ok){
    const err=await response.json().catch(()=>({}));
    throw new Error(err.error||'Prediction service unavailable');
  }

  return await response.json();
}

function renderTrajectoryCard(){
  const p=getProj();if(!p)return;
  const card=document.getElementById('p-trajectory-card');
  if(!card)return;

  card.style.display='block';

  // Check cache
  const cacheKey=getTrajCacheKey(p);
  if(_trajCache[cacheKey]){
    renderTrajectoryFromData(_trajCache[cacheKey]);
    return;
  }

  // Show loading state in chart
  renderTrajectoryLoading();
  // Auto-fetch prediction
  fetchAndRenderPrediction();
}

function renderTrajectoryLoading(){
  const canvas=document.getElementById('chart-trajectory');
  if(!canvas)return;
  if(_trajChartInstance){_trajChartInstance.destroy();_trajChartInstance=null;}
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.font='500 14px "DM Sans",sans-serif';
  ctx.fillStyle=chartSubColor();
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText('Analyzing project data…',canvas.width/2,canvas.height/2);
  ctx.restore();
}

async function fetchAndRenderPrediction(){
  const p=getProj();if(!p)return;
  const btn=document.getElementById('traj-refresh-btn');
  if(btn){btn.classList.add('loading');btn.textContent='⟳ Analyzing…';}

  try{
    const data=collectTrajectoryData(p);
    const prediction=await callAnthropicPrediction(data);
    // Cache it
    const cacheKey=getTrajCacheKey(p);
    _trajCache[cacheKey]={prediction,data,timestamp:Date.now()};
    renderTrajectoryFromData(_trajCache[cacheKey]);
  }catch(err){
    renderTrajectoryError(err.message);
  }finally{
    if(btn){btn.classList.remove('loading');btn.innerHTML='&#x21BB; Refresh';}
  }
}

function refreshPrediction(){
  const p=getProj();if(!p)return;
  // Clear cache for this project
  Object.keys(_trajCache).forEach(k=>{if(k.startsWith(p.id+'_'))delete _trajCache[k];});
  fetchAndRenderPrediction();
}

function renderTrajectoryError(msg){
  const canvas=document.getElementById('chart-trajectory');
  if(!canvas)return;
  if(_trajChartInstance){_trajChartInstance.destroy();_trajChartInstance=null;}
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.font='500 13px "DM Sans",sans-serif';
  ctx.fillStyle='#8B1A1A';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText('Prediction unavailable: '+msg,canvas.width/2,canvas.height/2);
  ctx.restore();
}

function renderTrajectoryFromData(cached){
  const{prediction,data}=cached;

  // Render chart
  renderTrajectoryChart(prediction,data);

  // Render confidence
  const confEl=document.getElementById('traj-confidence');
  if(confEl){
    confEl.style.display='flex';
    const dot=confEl.querySelector('.traj-conf-dot');
    const label=confEl.querySelector('.traj-conf-label');
    dot.className='traj-conf-dot '+data.confidence.toLowerCase();
    label.textContent=data.confidence+' Confidence';
  }

  // Render drivers
  const driversEl=document.getElementById('traj-drivers');
  if(driversEl&&prediction.drivers?.length){
    driversEl.style.display='grid';
    driversEl.innerHTML=prediction.drivers.map((d,i)=>{
      const dir=d.direction||'neutral';
      const icon=dir==='positive'?'▲':dir==='negative'?'▼':'►';
      return`<div class="traj-driver">
        <div class="traj-driver-rank ${dir}">${icon} Factor ${i+1} — ${dir.charAt(0).toUpperCase()+dir.slice(1)}</div>
        <div class="traj-driver-name">${esc(d.name)}</div>
        <div class="traj-driver-desc">${esc(d.description)}</div>
      </div>`;
    }).join('');
  }

  // Render warning banner
  const bannerEl=document.getElementById('traj-warning-banner');
  if(bannerEl){
    if(prediction.atRiskWarning){
      const w=prediction.atRiskWarning;
      bannerEl.style.display='block';
      bannerEl.innerHTML=`<strong>⚠ Trajectory Alert:</strong> Based on current trends, this project is projected to score <strong>${w.score}%</strong> at <strong>${esc(w.gate)}</strong>. Consider intervention in <strong>${esc(w.dimension)}</strong>: ${esc(w.recommendation)}`;
    }else{
      bannerEl.style.display='none';
    }
  }
}

function renderTrajectoryChart(prediction,data){
  if(_trajChartInstance){_trajChartInstance.destroy();_trajChartInstance=null;}
  const canvas=document.getElementById('chart-trajectory');
  if(!canvas)return;

  const labels=GATE_DEFS.map(g=>g.label);
  const actualScores=[];
  const predictedScores=[];

  GATE_DEFS.forEach((gate,i)=>{
    const gateData=data.gateScores[i];
    const pred=prediction.predictions?.find(p=>p.gate===gate.label);
    const isComplete=gateData&&gateData.notStarted===0&&gateData.incomplete===0&&gateData.score!==null;

    if(isComplete){
      actualScores.push(gateData.score);
      predictedScores.push(gateData.score); // overlap at transition point
    }else{
      actualScores.push(null);
      predictedScores.push(pred?pred.predictedScore:null);
    }
  });

  // If we have actual data, extend the actual line one point into the predicted zone for visual continuity
  const lastActualIdx=actualScores.reduce((last,v,i)=>v!==null?i:last,-1);
  if(lastActualIdx>=0&&lastActualIdx<3&&predictedScores[lastActualIdx+1]!==null){
    // Set the first predicted point to also have an actual score for line continuity
    predictedScores[lastActualIdx]=actualScores[lastActualIdx];
  }

  // Threshold annotation line at 65
  const thresholdData=labels.map(()=>65);

  _trajChartInstance=new Chart(canvas,{
    type:'line',
    data:{
      labels:labels,
      datasets:[
        {
          label:'Actual Score',
          data:actualScores,
          borderColor:'rgba(12,31,63,0.9)',
          backgroundColor:'rgba(12,31,63,0.1)',
          borderWidth:3,
          pointRadius:6,
          pointBackgroundColor:'rgba(12,31,63,1)',
          pointBorderColor:'#fff',
          pointBorderWidth:2,
          pointHoverRadius:8,
          tension:0.3,
          fill:false,
          spanGaps:false
        },
        {
          label:'Predicted Score',
          data:predictedScores,
          borderColor:'rgba(184,146,42,0.9)',
          backgroundColor:'rgba(184,146,42,0.08)',
          borderWidth:3,
          borderDash:[8,4],
          pointRadius:6,
          pointBackgroundColor:'rgba(184,146,42,1)',
          pointBorderColor:'#fff',
          pointBorderWidth:2,
          pointHoverRadius:8,
          pointStyle:'rectRot',
          tension:0.3,
          fill:false,
          spanGaps:true
        },
        {
          label:'At Risk Threshold',
          data:thresholdData,
          borderColor:'rgba(139,26,26,0.3)',
          borderWidth:1,
          borderDash:[4,4],
          pointRadius:0,
          pointHoverRadius:0,
          fill:false,
          tension:0
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      scales:{
        y:{
          min:0,max:100,
          ticks:{stepSize:25,font:{size:10,family:"'DM Sans',sans-serif"},color:chartSubColor(),callback:v=>v+'%'},
          grid:{color:chartGridColor()},
          title:{display:true,text:'Adoption Score',font:{size:11,family:"'DM Sans',sans-serif",weight:'600'},color:chartTextColor()}
        },
        x:{
          ticks:{font:{size:10,family:"'DM Sans',sans-serif",weight:'500'},color:chartTextColor()},
          grid:{display:false}
        }
      },
      plugins:{
        legend:{
          position:'bottom',
          labels:{
            font:{size:10,family:"'DM Sans',sans-serif"},
            padding:16,
            usePointStyle:true,
            pointStyleWidth:10,
            color:chartTextColor(),
            filter:item=>item.text!=='At Risk Threshold'
          }
        },
        tooltip:{
          backgroundColor:'rgba(12,31,63,0.95)',
          titleFont:{size:12,family:"'DM Sans',sans-serif",weight:'600'},
          bodyFont:{size:11,family:"'DM Sans',sans-serif"},
          padding:12,
          cornerRadius:8,
          callbacks:{
            label:function(ctx){
              if(ctx.dataset.label==='At Risk Threshold')return'At Risk Threshold: 65%';
              const pred=prediction.predictions?.find(p=>p.gate===ctx.label);
              let line=ctx.dataset.label+': '+ctx.parsed.y+'%';
              if(ctx.dataset.label==='Predicted Score'&&pred?.reasoning){
                line+=' — '+pred.reasoning;
              }
              return line;
            }
          }
        },
        // Custom annotation for threshold label
        thresholdLabel:{
          id:'thresholdLabel',
          afterDraw(chart){
            const{ctx}=chart;
            const yScale=chart.scales.y;
            const yPos=yScale.getPixelForValue(65);
            ctx.save();
            ctx.font='500 9px "DM Sans",sans-serif';
            ctx.fillStyle='rgba(139,26,26,0.5)';
            ctx.textAlign='right';
            ctx.fillText('At Risk Threshold',chart.chartArea.right-4,yPos-5);
            ctx.restore();
          }
        }
      }
    },
    plugins:[{
      id:'thresholdLabel',
      afterDraw(chart){
        const{ctx}=chart;
        const yScale=chart.scales.y;
        const yPos=yScale.getPixelForValue(65);
        ctx.save();
        ctx.font='500 9px "DM Sans",sans-serif';
        ctx.fillStyle='rgba(139,26,26,0.5)';
        ctx.textAlign='right';
        ctx.fillText('At Risk Threshold',chart.chartArea.right-4,yPos-5);
        ctx.restore();
      }
    }]
  });
}

// ════════════════════════════════════════════════════════
// DOCUMENT INGESTION (Upload → Auto-Populate)
// ════════════════════════════════════════════════════════
let _importTarget=null;
let _importParsed=[];

function openDocImport(target){
  _importTarget=target;
  _importParsed=[];
  let existing=document.getElementById('doc-import-modal');
  if(existing)existing.remove();
  const targetLabels={impact:'Impact Assessment',gaps:'Gap Analysis',stakeholders:'Stakeholder Groups'};
  const modal=document.createElement('div');
  modal.id='doc-import-modal';
  modal.className='import-modal';
  modal.innerHTML=`<div class="import-modal-box">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h2>Import ${targetLabels[target]||target}</h2>
      <div class="import-sub">Upload a document to auto-populate ${targetLabels[target]||target} data. Supports .xlsx, .csv, .docx, and .txt files.</div></div>
      <button class="btn-ghost" onclick="document.getElementById('doc-import-modal').classList.remove('open')" style="font-size:22px;padding:0 6px;line-height:1">&times;</button>
    </div>
    <div class="import-drop" id="import-drop-zone" onclick="document.getElementById('import-file-input').click()">
      <div class="import-drop-icon">📄</div>
      <div class="import-drop-text">Drag &amp; drop your file here or <strong>browse</strong></div>
      <div class="import-drop-formats">.xlsx &nbsp; .csv &nbsp; .docx &nbsp; .txt</div>
    </div>
    <input type="file" id="import-file-input" accept=".xlsx,.xls,.csv,.docx,.txt" style="display:none" onchange="handleImportFile(this.files[0])">
    <div id="import-preview-area"></div>
    <div id="import-status-area"></div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
  // Drag and drop
  const dropZone=modal.querySelector('#import-drop-zone');
  dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag-over');});
  dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.classList.remove('drag-over');
    if(e.dataTransfer.files.length)handleImportFile(e.dataTransfer.files[0]);});
  requestAnimationFrame(()=>modal.classList.add('open'));
}

async function handleImportFile(file){
  if(!file)return;
  const statusArea=document.getElementById('import-status-area');
  const previewArea=document.getElementById('import-preview-area');
  statusArea.innerHTML='<div class="import-status" style="background:var(--amber-bg);color:var(--amber)">Parsing '+esc(file.name)+'...</div>';
  try{
    const ext=file.name.split('.').pop().toLowerCase();
    let rows=[];
    if(ext==='csv'){
      const text=await file.text();
      rows=parseCSV(text);
    }else if(ext==='xlsx'||ext==='xls'){
      const data=await file.arrayBuffer();
      rows=parseXLSX(data);
    }else if(ext==='docx'){
      const data=await file.arrayBuffer();
      rows=await parseDOCX(data);
    }else if(ext==='txt'){
      const text=await file.text();
      rows=parseTXT(text);
    }else{
      statusArea.innerHTML='<div class="import-status error">Unsupported file format. Please use .xlsx, .csv, .docx, or .txt</div>';
      return;
    }
    if(!rows.length){
      statusArea.innerHTML='<div class="import-status error">No data found in file. Ensure your document contains a table or structured data.</div>';
      return;
    }
    // Map to target schema
    _importParsed=mapImportRows(rows,_importTarget);
    if(!_importParsed.length){
      statusArea.innerHTML='<div class="import-status error">Could not map document structure to '+_importTarget+' fields. Ensure your file has recognizable column headers.</div>';
      return;
    }
    statusArea.innerHTML='';
    renderImportPreview(previewArea,_importParsed,_importTarget);
  }catch(err){
    console.error('Import parse error:',err);
    statusArea.innerHTML='<div class="import-status error">Error parsing file: '+esc(err.message)+'</div>';
  }
}

function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length<2)return[];
  const headers=splitCSVLine(lines[0]);
  return lines.slice(1).map(line=>{
    const vals=splitCSVLine(line);
    const obj={};
    headers.forEach((h,i)=>{obj[h.trim()]=vals[i]?.trim()||'';});
    return obj;
  }).filter(obj=>Object.values(obj).some(v=>v));
}
function splitCSVLine(line){
  const result=[];let current='';let inQuotes=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){inQuotes=!inQuotes;}
    else if(c===','&&!inQuotes){result.push(current);current='';}
    else{current+=c;}
  }
  result.push(current);
  return result;
}

function parseXLSX(data){
  if(!window.XLSX){alert('Excel parser is still loading.');return[];}
  const wb=XLSX.read(data,{type:'array'});
  const ws=wb.Sheets[wb.SheetNames[0]];
  const json=XLSX.utils.sheet_to_json(ws,{defval:''});
  return json;
}

async function parseDOCX(data){
  if(!window.mammoth){alert('Document parser is still loading.');return[];}
  const result=await mammoth.convertToHtml({arrayBuffer:data});
  const html=result.value;
  // Extract tables from HTML
  const div=document.createElement('div');
  div.innerHTML=html;
  const tables=div.querySelectorAll('table');
  if(tables.length){
    // Use first table found
    const tbl=tables[0];
    const thRow=tbl.querySelector('tr');
    if(!thRow)return[];
    const headers=Array.from(thRow.querySelectorAll('th,td')).map(c=>c.textContent.trim());
    const rows=[];
    tbl.querySelectorAll('tr').forEach((tr,i)=>{
      if(i===0)return;// skip header
      const cells=Array.from(tr.querySelectorAll('td')).map(c=>c.textContent.trim());
      const obj={};
      headers.forEach((h,j)=>{obj[h]=cells[j]||'';});
      if(Object.values(obj).some(v=>v))rows.push(obj);
    });
    return rows;
  }
  // Fallback: try to parse structured text (bullet lists, etc.)
  const textLines=div.textContent.split(/\n/).filter(l=>l.trim());
  return parseTXT(textLines.join('\n'));
}

function parseTXT(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length<2)return[];
  // Try tab-delimited first
  if(lines[0].includes('\t')){
    const headers=lines[0].split('\t').map(h=>h.trim());
    return lines.slice(1).map(line=>{
      const vals=line.split('\t');
      const obj={};
      headers.forEach((h,i)=>{obj[h]=vals[i]?.trim()||'';});
      return obj;
    }).filter(obj=>Object.values(obj).some(v=>v));
  }
  // Try pipe-delimited
  if(lines[0].includes('|')){
    const headers=lines[0].split('|').map(h=>h.trim()).filter(h=>h);
    return lines.slice(1).filter(l=>!l.match(/^[\s\-|]+$/)).map(line=>{
      const vals=line.split('|').map(v=>v.trim()).filter(v=>v!==undefined);
      const obj={};
      headers.forEach((h,i)=>{obj[h]=vals[i]?.trim()||'';});
      return obj;
    }).filter(obj=>Object.values(obj).some(v=>v));
  }
  // Try bullet-list format: "- Name: Value" or "• Key: Value"
  const items=[];let current={};
  lines.forEach(line=>{
    const match=line.match(/^[\s•\-*]+(.+?):\s*(.+)/);
    if(match){
      current[match[1].trim()]=match[2].trim();
    }else if(line.match(/^[\s•\-*]+(.+)/)&&Object.keys(current).length===0){
      current.name=line.replace(/^[\s•\-*]+/,'').trim();
    }else if(Object.keys(current).length>0&&line.trim()===''){
      items.push(current);current={};
    }
  });
  if(Object.keys(current).length>0)items.push(current);
  return items;
}

// Fuzzy column header matching
const FIELD_ALIASES={
  // Impact fields
  name:['name','group','stakeholder','audience','team','department','population','group name','stakeholder group','stakeholder name'],
  level:['level','impact','impact level','severity','priority','impact rating'],
  currentState:['current','current state','as-is','as is','current process','from'],
  futureState:['future','future state','to-be','to be','target state','to','desired state'],
  changeTypes:['change type','change types','type','types','impact type','impact area','area'],
  // Gap fields
  description:['description','gap','gap description','issue','finding','detail','details','gap detail'],
  severity:['severity','priority','level','risk','rating','criticality','risk level'],
  trainingImpact:['training','training impact','impact','adoption impact','recommendation','mitigation','remediation'],
  status:['status','state','progress','resolution'],
  // Stakeholder fields (for adoption scoring)
  role:['role','title','position','job title','function'],
  influence:['influence','power','authority'],
  sentiment:['sentiment','attitude','disposition','readiness']
};

function fuzzyMatch(header,fieldAliases){
  const h=header.toLowerCase().trim();
  for(const[field,aliases] of Object.entries(fieldAliases)){
    if(aliases.some(a=>h===a||h.includes(a)||a.includes(h)))return field;
  }
  return null;
}

function mapImportRows(rows,target){
  if(!rows.length)return[];
  // Get headers from first row
  const headers=Object.keys(rows[0]);
  const fieldMap={};
  headers.forEach(h=>{
    const match=fuzzyMatch(h,FIELD_ALIASES);
    if(match)fieldMap[h]=match;
  });
  // If no name column found, try first column
  const hasName=Object.values(fieldMap).includes('name');
  if(!hasName&&headers.length>0)fieldMap[headers[0]]='name';

  return rows.map((row,idx)=>{
    const mapped={_selected:true,_idx:idx};
    Object.entries(fieldMap).forEach(([header,field])=>{
      mapped[field]=row[header]||'';
    });
    // Also preserve unmapped columns for display
    headers.forEach(h=>{
      if(!fieldMap[h])mapped['_raw_'+h]=row[h]||'';
    });
    return mapped;
  }).filter(m=>m.name);
}

function renderImportPreview(container,items,target){
  const cols=getPreviewColumns(target);
  let html='<div class="import-preview"><h3>Preview — '+items.length+' item'+(items.length!==1?'s':'')+' found</h3>';
  html+='<div class="import-preview-count">Review the parsed data below. Uncheck any rows you don\'t want to import.</div>';
  html+='<div class="import-merge-opts"><label><input type="radio" name="import-merge" value="append" checked> Append to existing</label><label><input type="radio" name="import-merge" value="replace"> Replace existing</label></div>';
  html+='<div style="overflow-x:auto"><table class="import-tbl"><thead><tr><th class="import-check"><input type="checkbox" checked onchange="toggleAllImportRows(this.checked)"></th>';
  cols.forEach(c=>{html+='<th>'+c.label+'</th>';});
  html+='</tr></thead><tbody>';
  items.forEach((item,i)=>{
    html+='<tr><td class="import-check"><input type="checkbox" '+(item._selected?'checked':'')+' onchange="toggleImportRow('+i+',this.checked)"></td>';
    cols.forEach(c=>{
      let val=item[c.key]||'';
      if(val.length>80)val=val.substring(0,80)+'…';
      html+='<td>'+esc(val)+'</td>';
    });
    html+='</tr>';
  });
  html+='</tbody></table></div>';
  html+='<div class="import-acts"><button class="btn-ghost" onclick="document.getElementById(\'doc-import-modal\').classList.remove(\'open\')">Cancel</button>';
  html+='<button class="btn-gold" onclick="commitImport()">Import '+items.length+' Item'+(items.length!==1?'s':'')+'</button></div></div>';
  container.innerHTML=html;
}

function getPreviewColumns(target){
  if(target==='impact')return[{key:'name',label:'Group Name'},{key:'level',label:'Impact Level'},{key:'currentState',label:'Current State'},{key:'futureState',label:'Future State'}];
  if(target==='gaps')return[{key:'description',label:'Description'},{key:'severity',label:'Severity'},{key:'trainingImpact',label:'Training Impact'},{key:'status',label:'Status'}];
  if(target==='stakeholders')return[{key:'name',label:'Group Name'},{key:'role',label:'Role'},{key:'influence',label:'Influence'},{key:'sentiment',label:'Sentiment'}];
  return[{key:'name',label:'Name'}];
}

function toggleImportRow(idx,checked){if(_importParsed[idx])_importParsed[idx]._selected=checked;}
function toggleAllImportRows(checked){_importParsed.forEach(item=>item._selected=checked);}

function commitImport(){
  const p=getProj();if(!p)return;
  const selected=_importParsed.filter(item=>item._selected);
  if(!selected.length){alert('No rows selected for import.');return;}
  const mergeMode=document.querySelector('input[name="import-merge"]:checked')?.value||'append';

  if(_importTarget==='impact'){
    if(!p.impactAssessment)p.impactAssessment={groups:[]};
    if(mergeMode==='replace')p.impactAssessment.groups=[];
    selected.forEach(item=>{
      const lvl=normalizeLevel(item.level);
      const ct=item.changeTypes?item.changeTypes.split(/[,;]/).map(s=>s.trim()).filter(s=>s):[];
      p.impactAssessment.groups.push({
        name:item.name||'Imported Group',
        level:lvl,
        changeTypes:ct.length?ct:['Process'],
        currentState:item.currentState||'',
        futureState:item.futureState||'',
        actions:[]
      });
    });
    renderPImpact();
  }else if(_importTarget==='gaps'){
    if(!p.gapAnalysis)p.gapAnalysis={gaps:[]};
    if(mergeMode==='replace')p.gapAnalysis.gaps=[];
    selected.forEach(item=>{
      p.gapAnalysis.gaps.push({
        id:uid(),
        description:item.description||item.name||'',
        severity:normalizeSeverity(item.severity),
        trainingImpact:item.trainingImpact||'',
        status:item.status||''
      });
    });
    renderPGaps();
  }else if(_importTarget==='stakeholders'){
    if(mergeMode==='replace')p.stakeholders=[];
    selected.forEach(item=>{
      p.stakeholders.push({
        id:uid(),
        name:item.name||'Imported Group',
        factors:{resistance:3,env:3,window:3,complexity:3,saturation:3,leadership:3},
        objectives:[],
        kirk:{L1:{},L2:{},L3:{},L4:{}},
        rein:{owner:'',activities:'',intervals:[],escalation:''}
      });
    });
    renderPSH();renderPKPIs();
  }

  touch('proj');schedSave();
  const statusArea=document.getElementById('import-status-area');
  if(statusArea)statusArea.innerHTML='<div class="import-status success">Successfully imported '+selected.length+' item'+(selected.length!==1?'s':'')+'!</div>';
  setTimeout(()=>{
    const modal=document.getElementById('doc-import-modal');
    if(modal)modal.classList.remove('open');
  },1200);
}

function normalizeLevel(val){
  if(!val)return'Medium';
  const v=val.toLowerCase().trim();
  if(v.includes('high')||v.includes('3')||v.includes('major'))return'High';
  if(v.includes('low')||v.includes('1')||v.includes('minor'))return'Low';
  return'Medium';
}
function normalizeSeverity(val){
  if(!val)return'Medium';
  const v=val.toLowerCase().trim();
  if(v.includes('critical')||v.includes('4')||v.includes('blocker'))return'Critical';
  if(v.includes('high')||v.includes('3')||v.includes('major'))return'High';
  if(v.includes('low')||v.includes('1')||v.includes('minor'))return'Low';
  return'Medium';
}

function renderPOverview(){
  const p=getProj();if(!p)return;
  renderPKPIs();
  renderTrajectoryCard();
  const fp=document.getElementById('p-ov-flags');const flags=getPFlags().slice(0,4);
  if(!flags.length){fp.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">No active risk flags at this time.</p></div>';}
  else{fp.innerHTML=flags.map(f=>`<div class="fpv"><div class="fpv-g">${esc(f.gate)} — ${esc(f.sub)}</div><div class="fpv-i">${esc(f.item)}</div></div>`).join('');}
  renderPResources();
  renderProjCharts();
  renderRecommendations();
  renderBenchmarkCard();
}

// ════════════════════════════════════════════════════════
// CHARTS (Chart.js)
// ════════════════════════════════════════════════════════
let chartInstances={};
function destroyChart(id){if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];}}
function chartTextColor(){return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()||'#0C1F3F';}
function chartSubColor(){return getComputedStyle(document.documentElement).getPropertyValue('--ink-60').trim()||'#666';}
function chartGridColor(){const t=document.documentElement.getAttribute('data-theme');return t==='dark'?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)';}
const CHART_NAVY='rgba(12,31,63,0.85)';const CHART_GOLD='rgba(184,146,42,0.85)';
const CHART_GREEN='rgba(29,104,64,0.85)';const CHART_AMBER='rgba(138,92,0,0.85)';
const CHART_RED='rgba(139,26,26,0.85)';const CHART_BLUE='rgba(74,111,165,0.85)';
const CHART_GRAY='rgba(180,180,180,0.5)';

function renderProjCharts(){
  getActiveDims();
  const p=getProj();if(!p)return;
  // Gate Readiness Donut
  destroyChart('proj-gates');
  const gc=document.getElementById('chart-proj-gates');if(!gc)return;
  const gateData=GATE_DEFS.map(gate=>{
    const tot=gate.items.length;
    const grn=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='green').length;
    return{label:gate.label,pct:Math.round(grn/tot*100)};
  });
  const avgGate=Math.round(gateData.reduce((a,g)=>a+g.pct,0)/gateData.length);
  chartInstances['proj-gates']=new Chart(gc,{type:'doughnut',data:{
    labels:gateData.map(g=>g.label),
    datasets:[{data:gateData.map(g=>g.pct),
      backgroundColor:[CHART_NAVY,CHART_GOLD,CHART_GREEN,CHART_BLUE],
      borderWidth:0,borderRadius:3}]
  },options:{responsive:true,maintainAspectRatio:false,cutout:'70%',
    plugins:{legend:{position:'bottom',labels:{font:{size:10,family:"'DM Sans',sans-serif"},padding:12,usePointStyle:true,pointStyleWidth:8,color:chartTextColor()}},
      tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.raw+'%'}}
    }},
    plugins:[{id:'centerText',afterDraw(chart){
      const{ctx,width,height}=chart;ctx.save();
      ctx.font='bold 28px "DM Serif Display",Georgia,serif';ctx.fillStyle=chartTextColor();
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(avgGate+'%',width/2,height/2-8);
      ctx.font='500 10px "DM Sans",sans-serif';ctx.fillStyle=chartSubColor();
      ctx.fillText('Overall',width/2,height/2+12);ctx.restore();
    }}]
  });

  // ADKAR Bar Chart
  destroyChart('proj-adkar');
  const ac=document.getElementById('chart-proj-adkar');if(!ac)return;
  const adkarLabels=ADKAR_DIMS.map(d=>d.word);
  const adkarValues=ADKAR_DIMS.map(d=>p.adkarScores[d.key]);
  const adkarColors=adkarValues.map(v=>v>=4?CHART_GREEN:v>=3?CHART_GOLD:v>=2?CHART_AMBER:CHART_RED);
  chartInstances['proj-adkar']=new Chart(ac,{type:'bar',data:{
    labels:adkarLabels,datasets:[{data:adkarValues,backgroundColor:adkarColors,borderRadius:4,barPercentage:0.6}]
  },options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
    scales:{x:{min:0,max:5,ticks:{stepSize:1,font:{size:9},color:chartSubColor()},grid:{color:chartGridColor()}},
      y:{ticks:{font:{size:10,family:"'DM Sans',sans-serif",weight:'600'},color:chartTextColor()},grid:{display:false}}},
    plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.raw+'/5'}}}
  }});
}

function renderPortfolioCharts(){
  if(!releases.length){document.getElementById('exec-dash').style.display='none';return;}
  document.getElementById('exec-dash').style.display='block';

  // Overall Readiness Donut
  destroyChart('port-readiness');
  const rc=document.getElementById('chart-port-readiness');if(!rc)return;
  let totalGate=0,countGate=0;
  releases.forEach(r=>r.projects.forEach(p=>{const gs=projGateScore(p);if(gs!==null){totalGate+=gs;countGate++;}}));
  const avgGate=countGate?Math.round(totalGate/countGate):0;
  const remainder=100-avgGate;
  chartInstances['port-readiness']=new Chart(rc,{type:'doughnut',data:{
    labels:['Ready','Remaining'],datasets:[{data:[avgGate,remainder],
      backgroundColor:[avgGate>=70?CHART_GREEN:avgGate>=40?CHART_GOLD:CHART_RED,CHART_GRAY],borderWidth:0,borderRadius:3}]
  },options:{responsive:true,maintainAspectRatio:false,cutout:'75%',
    plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.raw+'%'}}}},
    plugins:[{id:'centerText2',afterDraw(chart){
      const{ctx,width,height}=chart;ctx.save();
      ctx.font='bold 32px "DM Serif Display",Georgia,serif';ctx.fillStyle=chartTextColor();
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(avgGate+'%',width/2,height/2-10);
      ctx.font='500 10px "DM Sans",sans-serif';ctx.fillStyle=chartSubColor();
      ctx.fillText('Portfolio Readiness',width/2,height/2+14);ctx.restore();
    }}]
  });

  // Risk Distribution
  destroyChart('port-risk');
  const rkc=document.getElementById('chart-port-risk');if(!rkc)return;
  let low=0,mod=0,high=0,crit=0;
  releases.forEach(r=>r.projects.forEach(p=>{
    p.stakeholders.forEach(sh=>{const sc=adoptScore(sh.factors);const{cls}=adoptTier(sc);
      if(cls==='low')low++;else if(cls==='mod')mod++;else if(cls==='high')high++;else crit++;
    });
  }));
  const totalSH=low+mod+high+crit;
  if(totalSH){
    chartInstances['port-risk']=new Chart(rkc,{type:'doughnut',data:{
      labels:['Low Risk','Moderate','High Risk','Critical'],
      datasets:[{data:[low,mod,high,crit],backgroundColor:[CHART_GREEN,CHART_GOLD,CHART_AMBER,CHART_RED],borderWidth:0,borderRadius:3}]
    },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',
      plugins:{legend:{position:'right',align:'center',labels:{font:{size:10,family:"'DM Sans',sans-serif"},padding:10,boxWidth:10,usePointStyle:true,pointStyleWidth:8,color:chartTextColor()}},
        tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.raw+' group'+(ctx.raw!==1?'s':'')}}}}
    });
  } else {
    rkc.parentElement.innerHTML='<div class="es" style="padding:40px"><p class="es-txt">Add stakeholder groups to see risk distribution.</p></div>';
  }

  // Attention Required + Enhanced Exec Dashboard
  renderExecAttention();renderExecRAGSummary();renderExecGoLiveStrip();renderExecTopRisks();renderExecAgencyHM();renderExecNarratives();
}

function renderExecAttention(){
  const el=document.getElementById('exec-attention');if(!el)return;
  const items=[];
  // Critical flags
  releases.forEach(r=>{r.projects.forEach(p=>{
    GATE_DEFS.forEach(gate=>{gate.items.forEach((item,i)=>{
      if(p.gateState[gate.id+'_'+i]==='red'){
        items.push({sev:'crit',label:`${esc(r.name)} › ${esc(p.name)}`,sub:`${gate.label}: ${esc(item.text)}`});
      }
    });});
  });});
  // Go-live within 14 days
  const today=new Date();today.setHours(0,0,0,0);
  releases.forEach(r=>{if(r.golive){const gl=new Date(r.golive+'T00:00:00');const days=Math.ceil((gl-today)/(86400000));
    if(days<=14&&days>=0)items.push({sev:'warn',label:esc(r.name),sub:`Go-live in ${days} day${days!==1?'s':''}`});
    if(days<0)items.push({sev:'crit',label:esc(r.name),sub:`Go-live was ${Math.abs(days)} day${Math.abs(days)!==1?'s':''} ago`});
  }});
  // Critical stakeholders
  releases.forEach(r=>{r.projects.forEach(p=>{p.stakeholders.forEach(sh=>{
    const sc=adoptScore(sh.factors);if(sc<40)items.push({sev:'warn',label:`${esc(r.name)} › ${esc(p.name)}`,sub:`${esc(sh.name)} at ${sc}% adoption likelihood`});
  });});});

  if(!items.length){el.innerHTML='<div class="es" style="padding:30px"><p class="es-txt" style="color:var(--green);font-weight:600">&#10003; No critical items. Portfolio is healthy.</p></div>';return;}
  el.innerHTML=items.slice(0,8).map(it=>`<div class="exec-attn-item">
    <div class="exec-attn-icon ${it.sev}">${it.sev==='crit'?'!':'⚠'}</div>
    <div class="exec-attn-txt"><div class="exec-attn-label">${it.label}</div><div class="exec-attn-sub">${it.sub}</div></div>
  </div>`).join('');
}

function renderExecRAGSummary(){
  const el=document.getElementById('exec-rag-summary');if(!el)return;
  let g=0,a=0,r=0;
  releases.forEach(rel=>{const rg=relRAG(rel);if(rg.rag==='green')g++;else if(rg.rag==='amber')a++;else r++;});
  el.innerHTML=`<div class="rag-summary-row">
    <div class="rag-summary-card rag-g-bg"><div class="rag-summary-val">${g}</div><div class="rag-summary-lbl">On Track</div></div>
    <div class="rag-summary-card rag-a-bg"><div class="rag-summary-val">${a}</div><div class="rag-summary-lbl">At Risk</div></div>
    <div class="rag-summary-card rag-r-bg"><div class="rag-summary-val">${r}</div><div class="rag-summary-lbl">Critical</div></div>
  </div>`;
}

function renderExecGoLiveStrip(){
  const el=document.getElementById('exec-golive-strip');if(!el)return;
  const sorted=[...releases].filter(r=>r.golive).sort((a,b)=>new Date(a.golive)-new Date(b.golive));
  if(!sorted.length){el.innerHTML='';return;}
  el.innerHTML=sorted.map(r=>{const d=daysTo(r.golive);const rg=relRAG(r);
    return`<div class="golive-card" onclick="openRelease(${r.id})">
      <div class="golive-card-name"><span class="rag-dot ${rg.cls}"></span>${esc(r.name)}</div>
      <div class="golive-card-days">${fmtDays(d)}</div>
      <div class="golive-card-sub">${fmtDate(r.golive)}</div>
    </div>`;
  }).join('');
}

function renderExecTopRisks(){
  const el=document.getElementById('exec-top-risks');if(!el)return;
  const risks=[];
  releases.forEach(r=>{
    const d=daysTo(r.golive);const rl=relRollup(r);
    if(d!==null&&d<0)risks.push({sev:3,text:`${esc(r.name)} is ${Math.abs(d)} days overdue with ${rl.gateScore||0}% gate readiness.`});
    if(d!==null&&d>=0&&d<=14&&rl.gateScore!==null&&rl.gateScore<50)risks.push({sev:3,text:`${esc(r.name)} goes live in ${d} days but gate readiness is only ${rl.gateScore}%.`});
    r.projects.forEach(p=>{
      const fl=projFlagCount(p);if(fl>=3)risks.push({sev:2,text:`${esc(p.name)} (${esc(r.name)}) has ${fl} active risk flags requiring immediate attention.`});
      const uatEmpty=!(p.resources?.uat?.length&&p.resources.uat.some(e=>e.name));
      if(uatEmpty&&d!==null&&d<=30&&d>=0)risks.push({sev:2,text:`${esc(p.name)} has no UAT resources assigned with go-live in ${d} days.`});
      p.stakeholders.forEach(sh=>{const sc=adoptScore(sh.factors);if(sc<40)risks.push({sev:1,text:`${esc(sh.name)} (${esc(p.name)}) at ${sc}% adoption likelihood — critical risk tier.`});});
    });
  });
  risks.sort((a,b)=>b.sev-a.sev);
  if(!risks.length){el.innerHTML='<div class="es" style="padding:20px"><p class="es-txt" style="color:var(--green);font-weight:600">No critical risks identified.</p></div>';return;}
  el.innerHTML=risks.slice(0,5).map(r=>`<div class="exec-attn-item"><div class="exec-attn-icon ${r.sev>=2?'crit':'warn'}">${r.sev>=2?'!':'⚠'}</div><div class="exec-attn-txt"><div class="exec-attn-sub">${r.text}</div></div></div>`).join('');
}

function renderExecAgencyHM(){
  const el=document.getElementById('exec-agency-hm');if(!el)return;
  const agencyMap={};
  releases.forEach(r=>{(r.agencies||[]).forEach(a=>{
    if(!agencyMap[a])agencyMap[a]={gateScores:[],adkars:[],flags:0,releases:0};
    agencyMap[a].releases++;
    const rl=relRollup(r);if(rl.gateScore!==null)agencyMap[a].gateScores.push(rl.gateScore);
    if(rl.adkar!==null)agencyMap[a].adkars.push(parseFloat(rl.adkar));
    agencyMap[a].flags+=rl.flags;
  });});
  const agencies=Object.keys(agencyMap);
  if(!agencies.length){el.innerHTML='';return;}
  let h='<thead><tr><th class="phm-rh">Agency</th><th>Releases</th><th>Avg Gate</th><th>Avg '+fwShort()+'</th><th>Risk Flags</th></tr></thead><tbody>';
  agencies.forEach(a=>{const d=agencyMap[a];
    const avgG=d.gateScores.length?Math.round(d.gateScores.reduce((s,v)=>s+v,0)/d.gateScores.length):null;
    const avgA=d.adkars.length?(d.adkars.reduce((s,v)=>s+v,0)/d.adkars.length).toFixed(1):null;
    const gcls=hmCellCls(avgG,[80,50]);const acls=avgA?hmCellCls(parseFloat(avgA),[4,3]):'n';const fcls=d.flags===0?'g':d.flags<=2?'a':'r';
    h+=`<tr><td class="phm-rl">${esc(a)}</td><td><div class="hmc-w"><div class="hmc g">${d.releases}</div></div></td>
    <td><div class="hmc-w"><div class="hmc ${gcls}">${avgG!==null?avgG+'%':'—'}</div></div></td>
    <td><div class="hmc-w"><div class="hmc ${acls}">${avgA||'—'}</div></div></td>
    <td><div class="hmc-w"><div class="hmc ${fcls}">${d.flags}</div></div></td></tr>`;
  });
  h+='</tbody>';el.innerHTML=h;
}

function generatePortfolioNarratives(){
  const insights=[];
  // UAT resources unassigned near go-live
  let uatMissing=0;
  releases.forEach(r=>{const d=daysTo(r.golive);r.projects.forEach(p=>{
    const uatEmpty=!(p.resources?.uat?.length&&p.resources.uat.some(e=>e.name));
    if(uatEmpty&&d!==null&&d<=30&&d>=0)uatMissing++;
  });});
  if(uatMissing)insights.push({icon:'!',cls:'warn',text:`${uatMissing} project${uatMissing>1?'s have':' has'} no UAT resources assigned within 30 days of go-live.`});
  // Low gate readiness
  const lowGate=releases.filter(r=>{const rl=relRollup(r);return rl.gateScore!==null&&rl.gateScore<50;});
  if(lowGate.length)insights.push({icon:'⚠',cls:'warn',text:`${lowGate.length} release${lowGate.length>1?'s are':' is'} below 50% gate readiness: ${lowGate.map(r=>r.name).join(', ')}.`});
  // Critical stakeholders
  let critSH=0;
  releases.forEach(r=>r.projects.forEach(p=>p.stakeholders.forEach(sh=>{if(adoptScore(sh.factors)<40)critSH++;})));
  if(critSH)insights.push({icon:'!',cls:'warn',text:`${critSH} stakeholder group${critSH>1?'s are':' is'} at critical adoption risk (below 40%).`});
  // Competing go-lives
  const goLives=releases.filter(r=>r.golive).map(r=>({name:r.name,d:new Date(r.golive)})).sort((a,b)=>a.d-b.d);
  for(let i=1;i<goLives.length;i++){const diff=Math.abs(goLives[i].d-goLives[i-1].d)/86400000;
    if(diff<=7)insights.push({icon:'⚠',cls:'warn',text:`${goLives[i-1].name} and ${goLives[i].name} go live within ${Math.round(diff)} days of each other — resource contention risk.`});}
  // High readiness releases
  const highReady=releases.filter(r=>{const rl=relRollup(r);return rl.gateScore!==null&&rl.gateScore>=80;});
  if(highReady.length)insights.push({icon:'✓',cls:'good',text:`${highReady.length} release${highReady.length>1?'s are':' is'} at 80%+ gate readiness: ${highReady.map(r=>r.name).join(', ')}.`});
  // ADKAR strengths
  const strongAdkar=releases.filter(r=>{const rl=relRollup(r);return rl.adkar!==null&&parseFloat(rl.adkar)>=4;});
  if(strongAdkar.length)insights.push({icon:'✓',cls:'good',text:`${strongAdkar.length} release${strongAdkar.length>1?'s show':' shows'} strong ${fwShort()} scores (4+/5).`});
  if(!insights.length)insights.push({icon:'—',cls:'neutral',text:'Portfolio data is insufficient to generate insights. Add projects and score gates to begin.'});
  return insights;
}

function renderExecNarratives(){
  const el=document.getElementById('exec-narratives');if(!el)return;
  const insights=generatePortfolioNarratives();
  el.innerHTML=insights.map(i=>`<div class="trend-insight ${i.cls}">
    <div class="trend-insight-icon ${i.cls}">${i.icon}</div><div>${i.text}</div>
  </div>`).join('');
}

function renderBenchmarkCard(){
  const el=document.getElementById('p-benchmark-card');if(!el)return;
  const p=getProj();if(!p){el.style.display='none';return;}
  const bm=calcBenchmarks();const gs=projGateScore(p);
  if(!bm.gate||gs===null){el.style.display='none';return;}
  const pos=benchmarkPosition(gs,bm.gate);
  const adk=parseFloat(projAdkarAvg(p));const adkPos=bm.adkar?benchmarkPosition(adk,bm.adkar):null;
  el.style.display='block';
  el.innerHTML=`<div class="bench-card">
    <div class="bench-icon ${pos.cls}">${pos.icon}</div>
    <div class="bench-txt">
      <div class="bench-label">Portfolio Benchmark</div>
      Gate readiness at ${gs}% places this project in the <strong>${pos.label}</strong> across your portfolio.
      ${adkPos?` ${fwShort()} score of ${adk}/5 is <strong>${adkPos.label}</strong>.`:''}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════
// RECOMMENDATIONS ENGINE
// ════════════════════════════════════════════════════════
const RECOMMENDATIONS={
  g1_0:{action:'Schedule an impact analysis session with OCM and functional leads to identify all impacted user populations.'},
  g1_1:{action:'Draft a preliminary stakeholder matrix and share with the Training team for curriculum scoping.'},
  g1_2:{action:'Request Development to document high-level system changes and share with Training.'},
  g1_3:{action:'Convene a training approach review session to decide delivery format (ILT, vILT, eLearning, job aids).'},
  g1_4:{action:'Confirm training resources and staffing with the PMO to mitigate schedule risk.'},
  g2_0:{action:'Finalize the stakeholder matrix with role-level detail to enable targeted training sequencing.'},
  g2_1:{action:'Coordinate with Development to confirm training environment ownership, access, and timeline.'},
  g2_2:{action:'Confirm SME assignments and communicate expectations for content validation.'},
  g2_3:{action:'Submit the curriculum outline for approval to unblock materials development.'},
  g2_4:{action:'Work with the PMO to identify and protect training calendar windows before they compress.'},
  g2_5:{action:'Align the communications plan with the training delivery schedule to prevent end-user confusion.'},
  g3_0:{action:'Escalate training environment stability issues to Development — TTT cannot proceed without it.'},
  g3_1:{action:'Confirm SME availability for content validation before the TTT window closes.'},
  g3_2:{action:'Lock the tech transfer date with Development to enable TTT and end-user training sequencing.'},
  g3_3:{action:'Draft and distribute the TTT schedule to all trainers and facilitators.'},
  g3_4:{action:'Request documented system changes from Development to update training materials.'},
  g3_5:{action:'Accelerate end-user training materials development to meet the delivery timeline.'},
  g4_0:{action:'Complete TTT with documented sign-off before proceeding to end-user training.'},
  g4_1:{action:'Verify the training environment mirrors production — report discrepancies to Development.'},
  g4_2:{action:'Confirm the final user list by role and population with the PMO.'},
  g4_3:{action:'Lock the go-live date and communicate the change freeze window to all stakeholders.'},
  g4_4:{action:'Finalize the post-release monitoring plan between OCM Implementation and Training.'},
  g4_5:{action:'Confirm floor support and help desk coverage for go-live and the first two weeks post-launch.'}
};

function renderRecommendations(){
  const p=getProj();if(!p)return;
  const el=document.getElementById('proj-recommendations');if(!el)return;
  const recs=[];
  GATE_DEFS.forEach(gate=>{gate.items.forEach((item,i)=>{
    const s=p.gateState[gate.id+'_'+i];
    if(s==='red'||s==='yellow'){
      const key=gate.id+'_'+i;
      const rec=RECOMMENDATIONS[key];
      if(rec)recs.push({gate:`${gate.label} — ${gate.sub}`,item:item.text,action:rec.action,sev:s});
    }
  });});
  if(!recs.length){el.innerHTML='<div class="es" style="padding:30px"><p class="es-txt" style="color:var(--green);font-weight:600">&#10003; All gate items are complete. No actions required.</p></div>';return;}
  el.innerHTML=recs.slice(0,6).map(r=>`<div class="rec-item">
    <div class="rec-icon ${r.sev}">${r.sev==='red'?'!':'⚠'}</div>
    <div class="rec-txt"><div class="rec-gate">${esc(r.gate)}: ${esc(r.item)}</div>
    <div class="rec-action"><strong>Action:</strong> ${esc(r.action)}</div></div>
  </div>`).join('')+(recs.length>6?`<div style="text-align:center;padding:8px;font-size:11px;color:var(--ink-60)">+${recs.length-6} more — view all in the Gates tab</div>`:'');
  // Also render AI smart recs
  renderSmartRecs();
}

// ════════════════════════════════════════════════════════
// SMART RECOMMENDATIONS ENGINE (AI-Powered)
// ════════════════════════════════════════════════════════
const SMART_RECS_URL='https://yufehucjvviwanbulcok.supabase.co/functions/v1/smart-recommendations';
let _smartRecsCache={};
let _smartRecsDismissed=new Set();

function getSmartRecsCacheKey(p){
  const parts=[
    JSON.stringify(p.gateState),
    JSON.stringify(p.adkarScores),
    p.stakeholders.map(s=>JSON.stringify(s.factors)).join(','),
    p.stakeholders.length,
    (p.gapAnalysis?.gaps||[]).length,
    (p.impactAssessment?.groups||[]).length,
    Object.values(p.gateState).filter(v=>v==='red').length
  ].join('|');
  let hash=0;
  for(let i=0;i<parts.length;i++){hash=((hash<<5)-hash)+parts.charCodeAt(i);hash|=0;}
  return p.id+'_sr_'+hash;
}

function collectSmartRecsData(p){
  const dims=getActiveDims();
  const shs=p.stakeholders||[];

  // Framework scores
  const fwScores={};
  dims.forEach(d=>{fwScores[d.word]=p.adkarScores?.[d.key]||3;});
  const fwAvg=dims.length?dims.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/dims.length:3;
  const fwPct=Math.round(fwAvg/5*100);

  // Stakeholder sentiment breakdown
  const stakeholderBreakdown=shs.map(s=>{
    const score=adoptScore(s.factors);
    const tier=adoptTier(score);
    return{name:s.name,adoptionScore:score,tier:tier.tier,
      factors:Object.fromEntries(AF.map(f=>([f.label,s.factors?.[f.key]||3]))),
      kirkpatrickReady:kirkReady(s),reinforcementReady:reinReady(s)};
  });
  const supporters=stakeholderBreakdown.filter(s=>s.adoptionScore>=70).length;
  const neutral=stakeholderBreakdown.filter(s=>s.adoptionScore>=40&&s.adoptionScore<70).length;
  const resistant=stakeholderBreakdown.filter(s=>s.adoptionScore<40).length;
  const sentPct=shs.length?Math.round(shs.reduce((a,s)=>a+adoptScore(s.factors),0)/shs.length):0;

  // Training completion
  const kirkPcts=shs.map(sh=>{
    if(!sh?.kirk)return 0;let f=0;const k=sh.kirk;
    if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;
    if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;
    return Math.round(f/8*100);
  });
  const trainPct=kirkPcts.length?Math.round(kirkPcts.reduce((a,b)=>a+b,0)/kirkPcts.length):0;

  // Comms completion
  const commsDims=dims.filter(d=>['A1','d1','d7','d8'].includes(d.key));
  const commsAvg=commsDims.length?commsDims.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/commsDims.length:3;
  const commsPct=Math.round(commsAvg/5*100);

  // Risk flags
  const flags=getPFlags();

  // Gate history
  const gateHistory=GATE_DEFS.map(gate=>{
    const tot=gate.items.length;
    const naCount=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='na').length;
    const applicable=tot-naCount;
    const grn=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='green').length;
    const ylw=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='yellow').length;
    const red=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='red').length;
    const pct=applicable?Math.round(grn/applicable*100):null;
    const status=pct===null?'not_started':pct>=75?'pass':pct>=50?'conditional':'fail';
    return{gate:gate.label,sub:gate.sub,score:pct,status,greenItems:grn,yellowItems:ylw,redItems:red,applicable};
  });

  // Risk adjustment
  const gs=projGateScore(p);
  const riskPct=Math.max(0,Math.min(100,gs!==null?Math.round(gs*(flags.length===0?1:flags.length<=2?0.8:0.5)):50));

  // Composite adoption score
  const currentAdoptionScore=Math.round(fwPct*0.30+sentPct*0.20+trainPct*0.20+commsPct*0.15+riskPct*0.15);
  let tier='Critical';
  if(currentAdoptionScore>=85)tier='Champion';
  else if(currentAdoptionScore>=65)tier='On Track';
  else if(currentAdoptionScore>=40)tier='At Risk';

  // Gaps
  const gaps=(p.gapAnalysis?.gaps||[]).map(g=>({description:g.description||'',severity:g.severity||'Medium',status:g.status||'Open'}));

  return{
    projectName:p.name,
    frameworkName:fwName(),
    goLiveDate:p.golive||null,
    currentAdoptionScore,tier,
    scoringComponents:{
      frameworkAssessment:{score:fwPct,weight:'30%',scores:fwScores},
      stakeholderSentiment:{score:sentPct,weight:'20%',supporters,neutral,resistant,total:shs.length},
      trainingEffectiveness:{score:trainPct,weight:'20%',kirkpatrickDetails:stakeholderBreakdown.map(s=>({name:s.name,kirkReady:s.kirkpatrickReady,reinReady:s.reinforcementReady}))},
      commsCompletion:{score:commsPct,weight:'15%'},
      riskAdjustment:{score:riskPct,weight:'15%',activeFlags:flags.length}
    },
    stakeholders:stakeholderBreakdown,
    gateHistory,
    riskFlags:flags.map(f=>({gate:f.gate,sub:f.sub,item:f.item,consequence:f.consequence})),
    gaps,
    acknowledgedRecs:p.acknowledgedRecs||[]
  };
}

async function callSmartRecommendations(data){
  const response=await fetch(SMART_RECS_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+TRAJ_ANON_KEY},
    body:JSON.stringify(data)
  });
  if(!response.ok){
    const err=await response.json().catch(()=>({}));
    throw new Error(err.error||'Recommendations service unavailable');
  }
  return await response.json();
}

function renderSmartRecs(){
  const p=getProj();if(!p)return;
  const panel=document.getElementById('smart-recs-panel');
  const fab=document.getElementById('smart-fab');
  if(!panel)return;

  panel.style.display='block';
  if(fab)fab.style.display='flex';

  // Check cache
  const cacheKey=getSmartRecsCacheKey(p);
  if(_smartRecsCache[cacheKey]){
    renderSmartRecsFromData(_smartRecsCache[cacheKey],p);
    return;
  }

  // Show loading
  const list=document.getElementById('smart-recs-list');
  if(list)list.innerHTML='<div class="smart-recs-loading">Analyzing project data for recommendations…</div>';
  document.getElementById('smart-recs-ts').textContent='';

  fetchSmartRecs();
}

async function fetchSmartRecs(){
  const p=getProj();if(!p)return;
  const btn=document.getElementById('smart-recs-refresh');
  if(btn){btn.classList.add('loading');btn.textContent='⟳ Analyzing…';}

  try{
    const data=collectSmartRecsData(p);
    const result=await callSmartRecommendations(data);
    const cacheKey=getSmartRecsCacheKey(p);
    _smartRecsCache[cacheKey]={result,timestamp:Date.now()};
    renderSmartRecsFromData(_smartRecsCache[cacheKey],p);
  }catch(err){
    const list=document.getElementById('smart-recs-list');
    if(list)list.innerHTML=`<div class="smart-recs-error">Unable to generate recommendations: ${esc(err.message)}</div>`;
  }finally{
    if(btn){btn.classList.remove('loading');btn.innerHTML='&#x21BB; Re-analyze';}
  }
}

function refreshSmartRecs(){
  const p=getProj();if(!p)return;
  _smartRecsDismissed.clear();
  Object.keys(_smartRecsCache).forEach(k=>{if(k.includes('_sr_'))delete _smartRecsCache[k];});
  fetchSmartRecs();
}

function renderSmartRecsFromData(cached,p){
  const{result,timestamp}=cached;
  const recs=result.recommendations||[];
  const list=document.getElementById('smart-recs-list');
  const tsEl=document.getElementById('smart-recs-ts');

  if(tsEl&&timestamp){
    const d=new Date(timestamp);
    tsEl.textContent='Last analyzed: '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  }

  if(!recs.length){
    list.innerHTML='<div class="smart-recs-loading" style="color:var(--green)">✓ No urgent recommendations at this time.</div>';
    return;
  }

  const acked=p.acknowledgedRecs||[];

  list.innerHTML=recs.map((r,i)=>{
    const prCls=(r.priority||'medium').toLowerCase();
    const isAcked=acked.includes('sr_'+i);
    const isDismissed=_smartRecsDismissed.has(i);
    return`<div class="smart-rec-card${isAcked?' acknowledged':''}${isDismissed?' dismissed':''}" id="smart-rec-${i}">
      <div class="smart-rec-top">
        <div class="smart-rec-priority ${prCls}"><span class="smart-rec-dot ${prCls}"></span>${esc(r.priority||'Medium')}</div>
        <div class="smart-rec-btns">
          <button class="smart-rec-btn ack" onclick="ackSmartRec(${i})" title="Acknowledge"${isAcked?' disabled':''}>✓${isAcked?' Acknowledged':''}</button>
          <button class="smart-rec-btn dismiss" onclick="dismissSmartRec(${i})" title="Dismiss">✕</button>
        </div>
      </div>
      <div class="smart-rec-action">${esc(r.action)}</div>
      <div class="smart-rec-meta">
        <div class="smart-rec-trigger"><strong>Data trigger:</strong> ${esc(r.data_trigger)}</div>
        <div class="smart-rec-impact">▲ ${esc(r.estimated_impact)}</div>
        <div class="smart-rec-dimension">${esc(r.target_dimension)}</div>
      </div>
    </div>`;
  }).join('');
}

function ackSmartRec(idx){
  const p=getProj();if(!p)return;
  if(!p.acknowledgedRecs)p.acknowledgedRecs=[];
  const key='sr_'+idx;
  if(!p.acknowledgedRecs.includes(key))p.acknowledgedRecs.push(key);
  touch('proj');save();
  const card=document.getElementById('smart-rec-'+idx);
  if(card){
    card.classList.add('acknowledged');
    const btn=card.querySelector('.smart-rec-btn.ack');
    if(btn){btn.disabled=true;btn.textContent='✓ Acknowledged';}
  }
}

function dismissSmartRec(idx){
  _smartRecsDismissed.add(idx);
  const card=document.getElementById('smart-rec-'+idx);
  if(card)card.classList.add('dismissed');
}

function scrollToSmartRecs(){
  const panel=document.getElementById('smart-recs-panel');
  if(panel){
    // Make sure we're on the overview tab
    const overviewTab=document.querySelector('[onclick*="psec-overview"]');
    if(overviewTab)overviewTab.click();
    setTimeout(()=>{panel.scrollIntoView({behavior:'smooth',block:'start'});},100);
  }
}

// ════════════════════════════════════════════════════════
// CHANGE IMPACT ASSESSMENT
// ════════════════════════════════════════════════════════
const CHANGE_TYPES=['Process','Technology','People','Organization'];
function renderPImpact(){
  const p=getProj();if(!p)return;
  const el=document.getElementById('p-impact-panel');if(!el)return;
  if(!p.impactAssessment)p.impactAssessment={groups:[]};
  const groups=p.impactAssessment.groups;
  if(!groups.length){el.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">Add impacted groups to begin the impact assessment.</p></div>';return;}
  el.innerHTML=groups.map((g,gi)=>{
    const lvlCls=g.level==='High'?'high':g.level==='Low'?'low':'medium';
    return`<div class="impact-group">
      <div class="impact-group-hd">
        <input class="ib-input" style="flex:1;font-weight:600" value="${esc(g.name)}" placeholder="Group name" onchange="syncImpactField(${gi},'name',this.value)">
        <select class="ib-select" style="margin:0 10px" onchange="syncImpactField(${gi},'level',this.value)">
          <option value="High"${g.level==='High'?' selected':''}>High Impact</option>
          <option value="Medium"${g.level==='Medium'?' selected':''}>Medium Impact</option>
          <option value="Low"${g.level==='Low'?' selected':''}>Low Impact</option>
        </select>
        <span class="impact-level ${lvlCls}">${g.level}</span>
        <button class="btn-del-sm" style="margin-left:10px" onclick="removeImpactGroup(${gi})">Remove</button>
      </div>
      <div class="change-type-chips">${CHANGE_TYPES.map(ct=>`<button class="ct-chip${(g.changeTypes||[]).includes(ct)?' active':''}" onclick="toggleChangeType(${gi},'${ct}')">${ct}</button>`).join('')}</div>
      <div class="impact-states">
        <div><label class="ib-label">Current State</label><textarea class="impact-ta" onchange="syncImpactField(${gi},'currentState',this.value)" placeholder="Describe the current process, tools, or behaviors...">${esc(g.currentState||'')}</textarea></div>
        <div class="impact-arrow">→</div>
        <div><label class="ib-label">Future State</label><textarea class="impact-ta" onchange="syncImpactField(${gi},'futureState',this.value)" placeholder="Describe the target process, tools, or behaviors...">${esc(g.futureState||'')}</textarea></div>
      </div>
      <div class="impact-actions">
        <div class="ib-label">Readiness Actions</div>
        ${(g.actions||[]).map((a,ai)=>`<div class="impact-action${a.done?' done':''}">
          <input type="checkbox" ${a.done?'checked':''} onchange="toggleImpactAction(${gi},${ai})">
          <input class="ib-input" style="flex:1" value="${esc(a.text)}" onchange="syncImpactAction(${gi},${ai},this.value)">
          <button class="btn-del-sm" onclick="removeImpactAction(${gi},${ai})">×</button>
        </div>`).join('')}
        <button class="btn-sm" style="margin-top:6px" onclick="addImpactAction(${gi})">+ Add Action</button>
      </div>
    </div>`;
  }).join('');
}
function addImpactGroup(){
  const p=getProj();if(!p)return;
  if(!p.impactAssessment)p.impactAssessment={groups:[]};
  p.impactAssessment.groups.push({name:'',level:'Medium',changeTypes:[],currentState:'',futureState:'',actions:[]});
  touch('proj');schedSave();renderPImpact();
}
function removeImpactGroup(gi){
  const p=getProj();if(!p)return;
  p.impactAssessment.groups.splice(gi,1);touch('proj');schedSave();renderPImpact();
}
function syncImpactField(gi,field,val){
  const p=getProj();if(!p)return;
  p.impactAssessment.groups[gi][field]=val;touch('proj');schedSave();
  if(field==='level')renderPImpact();
}
function toggleChangeType(gi,ct){
  const p=getProj();if(!p)return;
  const g=p.impactAssessment.groups[gi];if(!g.changeTypes)g.changeTypes=[];
  const idx=g.changeTypes.indexOf(ct);if(idx>=0)g.changeTypes.splice(idx,1);else g.changeTypes.push(ct);
  touch('proj');schedSave();renderPImpact();
}
function addImpactAction(gi){
  const p=getProj();if(!p)return;
  if(!p.impactAssessment.groups[gi].actions)p.impactAssessment.groups[gi].actions=[];
  p.impactAssessment.groups[gi].actions.push({text:'',done:false});
  touch('proj');schedSave();renderPImpact();
}
function toggleImpactAction(gi,ai){
  const p=getProj();if(!p)return;
  p.impactAssessment.groups[gi].actions[ai].done=!p.impactAssessment.groups[gi].actions[ai].done;
  touch('proj');schedSave();renderPImpact();
}
function syncImpactAction(gi,ai,val){
  const p=getProj();if(!p)return;
  p.impactAssessment.groups[gi].actions[ai].text=val;touch('proj');schedSave();
}
function removeImpactAction(gi,ai){
  const p=getProj();if(!p)return;
  p.impactAssessment.groups[gi].actions.splice(ai,1);touch('proj');schedSave();renderPImpact();
}

// ════════════════════════════════════════════════════════
// GAP ANALYSIS
// ════════════════════════════════════════════════════════
const GAP_SEVERITIES=['Critical','High','Medium','Low'];
function gapSummary(p){
  const g=(p.gapAnalysis?.gaps)||[];
  return{total:g.length,critical:g.filter(x=>x.severity==='Critical').length,high:g.filter(x=>x.severity==='High').length};
}
function addGap(){
  const p=getProj();if(!p)return;
  if(!p.gapAnalysis)p.gapAnalysis={gaps:[]};
  p.gapAnalysis.gaps.push({id:uid(),description:'',severity:'Medium',trainingImpact:''});
  touch('proj');schedSave();renderPGaps();
}
function updateGap(gapId,field,value){
  const p=getProj();if(!p)return;
  const gap=(p.gapAnalysis?.gaps||[]).find(g=>g.id===gapId);if(!gap)return;
  gap[field]=value;
  touch('proj');schedSave();
  if(field==='severity')renderPGaps();
}
function removeGap(gapId){
  const p=getProj();if(!p||!p.gapAnalysis)return;
  p.gapAnalysis.gaps=p.gapAnalysis.gaps.filter(g=>g.id!==gapId);
  touch('proj');schedSave();renderPGaps();
}
function renderPGaps(){
  const p=getProj();if(!p)return;
  if(!p.gapAnalysis)p.gapAnalysis={gaps:[]};
  const el=document.getElementById('ptab-gaps');if(!el)return;
  const gaps=p.gapAnalysis.gaps;
  const s=gapSummary(p);
  const sevCls=sev=>sev==='Critical'?'sev-crit':sev==='High'?'sev-high':sev==='Medium'?'sev-med':'sev-low';
  let h='<div class="gap-summary-strip">';
  h+='<div class="gap-stat"><span class="gap-stat-val">'+s.total+'</span><span class="gap-stat-lbl">Total Gaps</span></div>';
  h+='<div class="gap-stat"><span class="gap-stat-val sev-crit">'+s.critical+'</span><span class="gap-stat-lbl">Critical</span></div>';
  h+='<div class="gap-stat"><span class="gap-stat-val sev-high">'+s.high+'</span><span class="gap-stat-lbl">High</span></div>';
  h+='</div>';
  h+='<div style="margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap"><button class="btn-gold" onclick="addGap()">+ Add Gap</button>';
  h+='<button class="btn-outline" onclick="openDocImport(\'gaps\')" title="Import from document">&#x1F4C4; Import</button>';
  h+='<span style="font-size:10px;color:var(--ink-60);font-style:italic">Gaps received from implementation team — focus on training/adoption impact</span></div>';
  if(gaps.length===0){
    h+='<div style="text-align:center;padding:40px;color:var(--ink-35);font-size:12px">No gaps recorded yet. Click "+ Add Gap" to log gaps from the implementation team\'s analysis.</div>';
  }else{
    gaps.forEach(g=>{
      h+='<div class="gap-row">';
      h+='<div class="gap-row-head">';
      h+='<span class="sev-badge '+sevCls(g.severity)+'">'+g.severity+'</span>';
      h+='<select class="gap-sev-sel" onchange="updateGap(\''+g.id+'\',\'severity\',this.value)">';
      GAP_SEVERITIES.forEach(sv=>{h+='<option'+(sv===g.severity?' selected':'')+'>'+sv+'</option>';});
      h+='</select>';
      h+='<button class="btn-del-sm" onclick="removeGap(\''+g.id+'\')" title="Remove gap">&times;</button>';
      h+='</div>';
      h+='<div class="gap-row-fields">';
      h+='<div class="gap-field gap-field-desc"><label>Gap Description</label><textarea rows="2" oninput="updateGap(\''+g.id+'\',\'description\',this.value)" placeholder="What gap was identified by the implementation team?">'+esc(g.description)+'</textarea></div>';
      h+='<div class="gap-field gap-field-impact"><label>Training / Adoption Impact</label><textarea rows="2" oninput="updateGap(\''+g.id+'\',\'trainingImpact\',this.value)" placeholder="How does this affect training or adoption? How will OCM address it?">'+esc(g.trainingImpact)+'</textarea></div>';
      h+='</div></div>';
    });
  }
  el.innerHTML=h;
}
// ════════════════════════════════════════════════════════
// FEATURE: CROSS-PORTFOLIO SATURATION INTELLIGENCE
// ════════════════════════════════════════════════════════
function renderSaturationMap(){
  const el=document.getElementById('sat-map');if(!el)return;
  // Collect all stakeholder groups across all releases/projects
  const groupMap={};// normalized name → {name, projects:[{relName, projName, golive, adoptScore, impactLevel}]}
  releases.forEach(r=>{
    (r.projects||[]).forEach(p=>{
      const projInfo={relName:r.name,projName:p.name,golive:p.golive||r.golive||'',relId:r.id,projId:p.id};
      // From stakeholders
      (p.stakeholders||[]).forEach(sh=>{
        const norm=sh.name.trim().toLowerCase();
        if(!groupMap[norm])groupMap[norm]={name:sh.name,projects:[]};
        groupMap[norm].projects.push({...projInfo,adoptScore:adoptScore(sh.factors),impactLevel:null,source:'stakeholder'});
      });
      // From impact assessment groups
      (p.impactAssessment?.groups||[]).forEach(ig=>{
        const norm=ig.name.trim().toLowerCase();
        if(!groupMap[norm])groupMap[norm]={name:ig.name,projects:[]};
        // Only add if not already from stakeholder in same project
        const existing=groupMap[norm].projects.find(x=>x.projId===p.id);
        if(existing){existing.impactLevel=ig.level;}
        else{groupMap[norm].projects.push({...projInfo,adoptScore:null,impactLevel:ig.level,source:'impact'});}
      });
    });
  });
  // Filter to groups appearing in 2+ projects for the saturation view, but show all
  const groups=Object.values(groupMap).sort((a,b)=>b.projects.length-a.projects.length);
  // Update collapse summary stat
  const satSummary=document.getElementById('sat-summary-stat');
  if(!groups.length){
    if(satSummary)satSummary.textContent='No stakeholder groups found';
    el.innerHTML='<div style="text-align:center;padding:40px;color:var(--ink-35);font-size:12px">No stakeholder groups found. Add stakeholders to projects to see saturation data.</div>';return;
  }
  const satHigh=groups.filter(g=>g.projects.length>=3).length;
  const satMod=groups.filter(g=>g.projects.length===2).length;
  if(satSummary){
    const parts=[];
    if(satHigh)parts.push(satHigh+' high saturation');
    if(satMod)parts.push(satMod+' moderate');
    parts.push(groups.length+' total groups');
    satSummary.textContent=parts.join(' · ');
  }
  // Get unique projects as columns
  const allProjs=[];const projSet=new Set();
  releases.forEach(r=>(r.projects||[]).forEach(p=>{if(!projSet.has(p.id)){projSet.add(p.id);allProjs.push({id:p.id,name:p.name,relName:r.name,golive:p.golive||r.golive||'',relId:r.id});}}));
  // Build table
  let h='<div class="sat-alert-strip">';
  const saturated=groups.filter(g=>g.projects.length>=3);
  const moderate=groups.filter(g=>g.projects.length===2);
  h+='<div class="sat-alert-item"><span class="sat-alert-val'+(saturated.length?' sev-crit':'')+'">'+saturated.length+'</span><span class="sat-alert-lbl">High Saturation (3+)</span></div>';
  h+='<div class="sat-alert-item"><span class="sat-alert-val'+(moderate.length?' sev-high':'')+'">'+moderate.length+'</span><span class="sat-alert-lbl">Moderate (2 projects)</span></div>';
  h+='<div class="sat-alert-item"><span class="sat-alert-val">'+groups.length+'</span><span class="sat-alert-lbl">Total Groups</span></div>';
  h+='</div>';
  h+='<div class="phm-scroll"><table class="phm-tbl sat-tbl"><thead><tr><th>Stakeholder Group</th><th>Projects</th>';
  allProjs.forEach(pr=>{h+='<th class="sat-proj-th" title="'+esc(pr.relName)+' → '+esc(pr.name)+'">'+esc(pr.name.length>15?pr.name.substring(0,14)+'…':pr.name)+'</th>';});
  h+='</tr></thead><tbody>';
  groups.forEach(g=>{
    const satLevel=g.projects.length>=3?'sat-high':g.projects.length===2?'sat-mod':'sat-low';
    h+='<tr class="'+satLevel+'">';
    h+='<td class="sat-grp-name">'+esc(g.name)+'</td>';
    h+='<td class="sat-count"><span class="sat-count-badge '+satLevel+'">'+g.projects.length+'</span></td>';
    allProjs.forEach(pr=>{
      const match=g.projects.find(x=>x.projId===pr.id);
      if(match){
        const scoreLabel=match.adoptScore!==null?match.adoptScore+'%':(match.impactLevel||'•');
        const cls=match.adoptScore!==null?(match.adoptScore>=70?'sat-cell-ok':match.adoptScore>=40?'sat-cell-warn':'sat-cell-risk'):'sat-cell-impact';
        h+='<td class="sat-cell '+cls+'" title="'+esc(g.name)+' in '+esc(pr.name)+(match.adoptScore!==null?': '+match.adoptScore+'% adoption':'')+'">'+scoreLabel+'</td>';
      }else{
        h+='<td class="sat-cell sat-cell-empty">—</td>';
      }
    });
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  if(saturated.length){
    h+='<div class="sat-warnings">';
    saturated.forEach(g=>{
      const golives=g.projects.filter(p=>p.golive).map(p=>({name:p.projName,golive:p.golive})).sort((a,b)=>new Date(a.golive)-new Date(b.golive));
      const overlapWarn=golives.length>=2;
      h+='<div class="sat-warn-item"><span class="sev-badge sev-crit">SATURATED</span> <strong>'+esc(g.name)+'</strong> appears in '+g.projects.length+' projects';
      if(overlapWarn){h+=' — go-live dates: '+golives.map(x=>x.name+' ('+fmtDate(x.golive)+')').join(', ');}
      h+='</div>';
    });
    h+='</div>';
  }
  el.innerHTML=h;
}

// ════════════════════════════════════════════════════════
// FEATURE: POST-GO-LIVE ADOPTION TRACKER
// ════════════════════════════════════════════════════════
const PL_INTERVALS=[{key:'d30',label:'30 Days'},{key:'d60',label:'60 Days'},{key:'d90',label:'90 Days'}];
function renderPPostLaunch(){
  const p=getProj();if(!p)return;
  if(!p.postLaunch)p.postLaunch={};
  const el=document.getElementById('ptab-postlaunch');if(!el)return;
  const shs=p.stakeholders||[];
  if(!shs.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--ink-35);font-size:12px">Add stakeholder groups first to track post-launch adoption.</div>';return;}
  const goDate=new Date(p.golive||'');const now=new Date();const daysSince=Math.round((now-goDate)/(1000*60*60*24));
  let h='<div class="pl-header">';
  h+='<div class="pl-stat"><span class="pl-stat-val">'+daysSince+'</span><span class="pl-stat-lbl">Days Post Go-Live</span></div>';
  h+='<div class="pl-stat"><span class="pl-stat-val">'+shs.length+'</span><span class="pl-stat-lbl">Groups Tracked</span></div>';
  const allObs=shs.map(sh=>{const d=p.postLaunch[sh.id]||{};return PL_INTERVALS.filter(iv=>d[iv.key]?.adoption!==undefined).length;});
  const totalObs=allObs.reduce((a,b)=>a+b,0);const totalPossible=shs.length*3;
  h+='<div class="pl-stat"><span class="pl-stat-val">'+totalObs+'/'+totalPossible+'</span><span class="pl-stat-lbl">Observations Logged</span></div>';
  h+='</div>';
  shs.forEach(sh=>{
    const data=p.postLaunch[sh.id]||{};
    const preScore=adoptScore(sh.factors);
    h+='<div class="pl-group">';
    h+='<div class="pl-group-hd"><span class="pl-group-name">'+esc(sh.name)+'</span><span class="pl-pre-score">Pre-Launch: '+preScore+'%</span></div>';
    h+='<div class="pl-intervals">';
    PL_INTERVALS.forEach(iv=>{
      const obs=data[iv.key]||{};
      const active=daysSince>=parseInt(iv.key.substring(1));
      h+='<div class="pl-iv '+(active?'pl-iv-active':'pl-iv-future')+'">';
      h+='<div class="pl-iv-label">'+iv.label+'</div>';
      if(active){
        h+='<div class="pl-iv-fields">';
        h+='<div class="pl-iv-field"><label>Adoption %</label><input type="number" min="0" max="100" value="'+(obs.adoption!==undefined?obs.adoption:'')+'" oninput="updatePL('+sh.id+',\''+iv.key+'\',\'adoption\',this.value)" placeholder="—"></div>';
        h+='<div class="pl-iv-field"><label>Support Tickets</label><input type="number" min="0" value="'+(obs.tickets!==undefined?obs.tickets:'')+'" oninput="updatePL('+sh.id+',\''+iv.key+'\',\'tickets\',this.value)" placeholder="—"></div>';
        h+='<div class="pl-iv-field"><label>Proficiency Score</label><input type="number" min="0" max="100" value="'+(obs.proficiency!==undefined?obs.proficiency:'')+'" oninput="updatePL('+sh.id+',\''+iv.key+'\',\'proficiency\',this.value)" placeholder="—"></div>';
        h+='<div class="pl-iv-field pl-iv-notes"><label>Notes</label><textarea rows="1" oninput="updatePL('+sh.id+',\''+iv.key+'\',\'notes\',this.value)" placeholder="Observations...">'+esc(obs.notes||'')+'</textarea></div>';
        h+='</div>';
        // Show trend vs pre-launch
        if(obs.adoption!==undefined){
          const delta=obs.adoption-preScore;
          const cls=delta>=0?'pl-trend-up':'pl-trend-down';
          h+='<div class="pl-trend '+cls+'">'+(delta>=0?'▲':'▼')+' '+Math.abs(delta)+'% vs pre-launch prediction</div>';
        }
      }else{
        h+='<div class="pl-iv-locked">Available in '+(parseInt(iv.key.substring(1))-daysSince)+' days</div>';
      }
      h+='</div>';
    });
    h+='</div></div>';
  });
  // Kirk L3/L4 outcomes section
  const kirkShs=shs.filter(sh=>sh.kirk?.L3?.observable||sh.kirk?.L4?.outcome);
  if(kirkShs.length){
    h+='<div class="pl-kirk-sec">';
    h+='<div class="pl-kirk-hd">Kirkpatrick L3/L4 Outcome Tracking</div>';
    kirkShs.forEach(sh=>{
      h+='<div class="pl-kirk-row"><strong>'+esc(sh.name)+'</strong>';
      if(sh.kirk.L3?.observable)h+='<div class="pl-kirk-item"><span class="pl-kirk-tag">L3</span> Observable: '+esc(sh.kirk.L3.observable)+' (Interval: '+esc(sh.kirk.L3.interval||'30')+' days)</div>';
      if(sh.kirk.L4?.outcome)h+='<div class="pl-kirk-item"><span class="pl-kirk-tag">L4</span> Outcome: '+esc(sh.kirk.L4.outcome)+' | Metric: '+esc(sh.kirk.L4.metric||'TBD')+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  el.innerHTML=h;
}
function updatePL(shId,interval,field,value){
  const p=getProj();if(!p)return;
  if(!p.postLaunch)p.postLaunch={};
  if(!p.postLaunch[shId])p.postLaunch[shId]={};
  if(!p.postLaunch[shId][interval])p.postLaunch[shId][interval]={};
  p.postLaunch[shId][interval][field]=field==='notes'?value:(value===''?undefined:parseInt(value));
  touch('proj');schedSave();
}

// ════════════════════════════════════════════════════════
// FEATURE: CONFIGURABLE ASSESSMENT FRAMEWORKS
// ════════════════════════════════════════════════════════
const FRAMEWORK_PRESETS={
  adkar:{name:'ADKAR (Prosci)',dims:[
    {key:'d1',letter:'A',word:'Awareness',desc:'Awareness of the need for change'},
    {key:'d2',letter:'D',word:'Desire',desc:'Desire to support and participate'},
    {key:'d3',letter:'K',word:'Knowledge',desc:'Knowledge of how to change'},
    {key:'d4',letter:'A',word:'Ability',desc:'Ability to implement required skills and behaviors'},
    {key:'d5',letter:'R',word:'Reinforcement',desc:'Reinforcement to sustain the change'}]},
  kotter:{name:'Kotter 8-Step',dims:[
    {key:'d1',letter:'U',word:'Urgency',desc:'Creating a sense of urgency for change'},
    {key:'d2',letter:'C',word:'Coalition',desc:'Building a guiding coalition'},
    {key:'d3',letter:'V',word:'Vision',desc:'Forming a strategic vision and initiatives'},
    {key:'d4',letter:'E',word:'Enlist',desc:'Enlisting a volunteer army'},
    {key:'d5',letter:'A',word:'Action',desc:'Enabling action by removing barriers'},
    {key:'d6',letter:'W',word:'Wins',desc:'Generating short-term wins'},
    {key:'d7',letter:'S',word:'Sustain',desc:'Sustaining acceleration'},
    {key:'d8',letter:'I',word:'Institute',desc:'Instituting change in culture'}]},
  bridges:{name:'Bridges Transition',dims:[
    {key:'d1',letter:'E',word:'Ending',desc:'Letting go of old ways and identities'},
    {key:'d2',letter:'N',word:'Neutral Zone',desc:'Navigating the in-between uncertainty'},
    {key:'d3',letter:'B',word:'New Beginning',desc:'Embracing the new identity and energy'}]},
  mck7s:{name:'McKinsey 7S',dims:[
    {key:'d1',letter:'S',word:'Strategy',desc:'Plan to build competitive advantage'},
    {key:'d2',letter:'S',word:'Structure',desc:'Organization and reporting relationships'},
    {key:'d3',letter:'S',word:'Systems',desc:'Daily activities and processes'},
    {key:'d4',letter:'S',word:'Shared Values',desc:'Core values and culture'},
    {key:'d5',letter:'S',word:'Style',desc:'Leadership and management approach'},
    {key:'d6',letter:'S',word:'Staff',desc:'People and their capabilities'},
    {key:'d7',letter:'S',word:'Skills',desc:'Competencies of the organization'}]},
  pct:{name:'PCT Model',dims:[
    {key:'d1',letter:'P',word:'People',desc:'Stakeholder readiness and engagement'},
    {key:'d2',letter:'C',word:'Culture',desc:'Organizational culture alignment'},
    {key:'d3',letter:'T',word:'Technology',desc:'Technology readiness and adoption'}]}
};
// Legacy key migration map: old ADKAR keys → new generic keys
const LEGACY_KEY_MAP={A1:'d1',D:'d2',K:'d3',Ab:'d4',R:'d5'};

function getFramework(){
  const b=getBrand();
  const fwId=b.frameworkId||'adkar';
  if(fwId==='custom'&&b.customDims)return{name:'Custom',dims:b.customDims};
  return FRAMEWORK_PRESETS[fwId]||FRAMEWORK_PRESETS.adkar;
}
function migrateScores(scores){
  if(!scores)return{};
  // If scores use legacy keys (A1,D,K,Ab,R), migrate to d1-d5
  if(scores.A1!==undefined||scores.D!==undefined){
    const migrated={};
    Object.entries(LEGACY_KEY_MAP).forEach(([old,nw])=>{if(scores[old]!==undefined)migrated[nw]=scores[old];});
    return migrated;
  }
  return scores;
}
function getActiveDims(){
  const fw=getFramework();
  const dims=[...fw.dims];
  // Update ADKAR_DIMS to match current framework (for backward compat)
  ADKAR_DIMS.length=0;
  dims.forEach(d=>ADKAR_DIMS.push(d));
  return dims;
}
function fwName(){
  const b=getBrand();const fw=b.frameworkId||'adkar';
  const names={adkar:'ADKAR',kotter:'Kotter 8-Step',bridges:'Bridges Transition',mck7s:'McKinsey 7S',pct:'PCT',custom:'Assessment'};
  return b.frameworkName||names[fw]||'Assessment';
}
function fwShort(){
  const b=getBrand();const fw=b.frameworkId||'adkar';
  const shorts={adkar:'ADKAR',kotter:'Kotter',bridges:'Bridges',mck7s:'7S',pct:'PCT',custom:'Assessment'};
  return shorts[fw]||'Assessment';
}
function applyFrameworkPreset(fwId){
  const b=getBrand();
  b.frameworkId=fwId;
  if(fwId!=='custom'){
    const preset=FRAMEWORK_PRESETS[fwId];
    if(preset){
      b.adkarLabels={};
      preset.dims.forEach(d=>{b.adkarLabels[d.key]=d.word;});
    }
  }
  saveBrand(b);
  renderFrameworkDimInputs();
}
function renderFrameworkDimInputs(){
  const b=getBrand();const grid=document.getElementById('brand-dims-grid');if(!grid)return;
  const fw=getFramework();
  const fwSel=document.getElementById('brand-framework');if(fwSel)fwSel.value=b.frameworkId||'adkar';
  grid.innerHTML=fw.dims.map((d,i)=>`<div style="display:flex;gap:6px;align-items:center">
    <input type="text" class="modal-inp" style="width:40px;text-align:center;flex-shrink:0" value="${esc(d.letter)}" data-dim-idx="${i}" data-dim-field="letter" onchange="updateDimLabel(${i},'letter',this.value)">
    <input type="text" class="modal-inp" style="flex:1" value="${esc(d.word)}" data-dim-idx="${i}" data-dim-field="word" onchange="updateDimLabel(${i},'word',this.value)">
    ${fw.dims.length>2?'<button class="btn-del-sm" onclick="removeDim('+i+')">&times;</button>':''}
  </div>`).join('');
}
function updateDimLabel(idx,field,value){
  const b=getBrand();
  const fw=getFramework();
  if(idx<fw.dims.length){
    fw.dims[idx][field]=value;
    b.frameworkId='custom';b.customDims=fw.dims;
    b.adkarLabels={};fw.dims.forEach(d=>{b.adkarLabels[d.key]=d.word;});
    saveBrand(b);
  }
}
function addFrameworkDim(){
  const b=getBrand();const fw=getFramework();
  if(fw.dims.length>=10){alert('Maximum 10 dimensions');return;}
  const nk='d'+(fw.dims.length+1);
  fw.dims.push({key:nk,letter:'?',word:'New Dimension',desc:'Description'});
  b.frameworkId='custom';b.customDims=fw.dims;
  b.adkarLabels={};fw.dims.forEach(d=>{b.adkarLabels[d.key]=d.word;});
  saveBrand(b);renderFrameworkDimInputs();
}
function removeDim(idx){
  const b=getBrand();const fw=getFramework();
  if(fw.dims.length<=2)return;
  fw.dims.splice(idx,1);
  // Re-key dimensions
  fw.dims.forEach((d,i)=>{d.key='d'+(i+1);});
  b.frameworkId='custom';b.customDims=fw.dims;
  b.adkarLabels={};fw.dims.forEach(d=>{b.adkarLabels[d.key]=d.word;});
  saveBrand(b);renderFrameworkDimInputs();
}

// ════════════════════════════════════════════════════════
// FEATURE: STAKEHOLDER PULSE SURVEYS
// ════════════════════════════════════════════════════════
function renderPPulse(){
  const p=getProj();if(!p)return;
  if(!p.pulseConfig)p.pulseConfig={};
  if(!p.pulseResults)p.pulseResults={};
  // Sync real survey responses from localStorage before rendering
  syncPulseResponses();
  const el=document.getElementById('ptab-pulse');if(!el)return;
  const shs=p.stakeholders||[];
  const dims=getActiveDims();
  if(!shs.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--ink-35);font-size:12px">Add stakeholder groups first to create pulse surveys.</div>';return;}
  const hasAnyResults=shs.some(sh=>(p.pulseResults[sh.id]||{}).responses>0);
  let h='';
  if(!hasAnyResults&&isDemoMode){
    h+='<div style="margin-bottom:14px"><button class="btn-gold" onclick="loadPulseDemoData()">Load Sample Survey Data</button>';
    h+='<span style="margin-left:10px;font-size:10px;color:var(--ink-60);font-style:italic">Generates links and simulates stakeholder responses for all groups</span></div>';
  }
  shs.forEach(sh=>{
    const cfg=p.pulseConfig[sh.id]||{};
    const results=p.pulseResults[sh.id]||{};
    const linkId=cfg.linkId||null;
    const responseCount=results.responses||0;
    h+='<div class="pulse-group">';
    h+='<div class="pulse-group-hd">';
    h+='<span class="pulse-group-name">'+esc(sh.name)+'</span>';
    if(linkId){
      h+='<span class="pulse-badge pulse-active">'+responseCount+' response'+(responseCount!==1?'s':'')+'</span>';
    }
    h+='</div>';
    // Survey link management
    if(!linkId){
      h+='<button class="btn-gold btn-sm" onclick="createPulseLink('+sh.id+')">Generate Survey Link</button>';
      h+='<span style="margin-left:8px;font-size:10px;color:var(--ink-60)">Creates an anonymous survey mapped to your assessment dimensions</span>';
    }else{
      const url=window.location.origin+'/pulse?link='+linkId;
      h+='<div class="pulse-link-box">';
      h+='<div class="pulse-link-url"><input type="text" value="'+esc(url)+'" readonly class="pulse-link-inp" onclick="this.select()"><button class="btn-sm" onclick="navigator.clipboard.writeText(\''+esc(url)+'\');this.textContent=\'Copied!\';setTimeout(()=>this.textContent=\'Copy\',1500)">Copy</button></div>';
      h+='<div class="pulse-link-meta">Created '+fmtDate(cfg.created)+' &nbsp;|&nbsp; '+responseCount+' responses</div>';
      h+='</div>';
    }
    // Show results comparison if we have data
    if(responseCount>0){
      h+='<div class="pulse-compare">';
      h+='<div class="pulse-compare-hd">Team Assessment vs. Stakeholder Feedback</div>';
      // Build gap analysis data
      const gapData=[];
      dims.forEach(d=>{
        const team=migrateScores(p.adkarScores)[d.key]||3;
        const survey=results.scores?.[d.key]||3;
        const diff=+(team-survey).toFixed(1);
        gapData.push({dim:d,team,survey,diff,absDiff:Math.abs(diff)});
      });
      // Insight summary
      const blindSpots=gapData.filter(g=>g.diff>=1);// team scored higher than stakeholders
      const underEst=gapData.filter(g=>g.diff<=-1);// team scored lower than stakeholders
      const aligned=gapData.filter(g=>g.absDiff<1);
      h+='<div class="pulse-insights">';
      if(blindSpots.length){
        h+='<div class="pulse-insight pulse-insight-warn"><strong>Potential blind spots:</strong> Your team rated <strong>'+blindSpots.map(g=>g.dim.word).join(', ')+'</strong> higher than stakeholders did. Stakeholders may not be as ready as your team believes — consider deeper engagement or targeted interventions.</div>';
      }
      if(underEst.length){
        h+='<div class="pulse-insight pulse-insight-pos"><strong>Underestimated strengths:</strong> Stakeholders rated <strong>'+underEst.map(g=>g.dim.word).join(', ')+'</strong> higher than your team expected. This is a positive signal — leverage these areas to build momentum.</div>';
      }
      if(aligned.length===gapData.length){
        h+='<div class="pulse-insight pulse-insight-ok"><strong>Strong alignment:</strong> Your team\'s assessment closely matches stakeholder feedback across all dimensions. Continue current approach.</div>';
      }
      h+='</div>';
      // Bars
      h+='<div class="pulse-bars">';
      gapData.forEach(g=>{
        const gapCls=g.absDiff>=2?'pulse-gap-high':g.absDiff>=1?'pulse-gap-mod':'pulse-gap-low';
        const arrow=g.diff>0.5?'▼':g.diff<-0.5?'▲':'≈';
        const arrowLabel=g.diff>0.5?'Stakeholders lower':g.diff<-0.5?'Stakeholders higher':'Aligned';
        h+='<div class="pulse-bar-row">';
        h+='<div class="pulse-dim-lbl">'+esc(g.dim.word)+'</div>';
        h+='<div class="pulse-dual-bar">';
        h+='<div class="pulse-bar-prac" style="width:'+(g.team/5*100)+'%" title="Team Assessment: '+g.team+'/5"></div>';
        h+='<div class="pulse-bar-pop" style="width:'+(g.survey/5*100)+'%" title="Stakeholder Feedback: '+g.survey.toFixed(1)+'/5"></div>';
        h+='</div>';
        h+='<div class="pulse-score-vals"><span>Team:'+g.team+'</span><span class="'+gapCls+'" title="'+arrowLabel+'">'+arrow+' Survey:'+g.survey.toFixed(1)+'</span></div>';
        h+='</div>';
      });
      h+='</div>';
      h+='<div class="pulse-legend"><span class="pulse-leg-prac">■ Team Assessment</span><span class="pulse-leg-pop">■ Stakeholder Feedback</span><span style="margin-left:auto;font-size:9px;color:var(--ink-35)">'+responseCount+' responses</span></div>';
      h+='</div>';
    }
    // Simulate results button (for demo/testing)
    if(linkId&&responseCount===0){
      h+='<button class="btn-sm" style="margin-top:8px;opacity:0.6" onclick="simulatePulseResults('+sh.id+')">Simulate Responses (Demo)</button>';
    }
    h+='</div>';
  });
  el.innerHTML=h;
}
function loadPulseDemoData(){
  const p=getProj();if(!p)return;
  if(!p.pulseConfig)p.pulseConfig={};
  if(!p.pulseResults)p.pulseResults={};
  (p.stakeholders||[]).forEach(sh=>{
    if(!p.pulseConfig[sh.id]){
      p.pulseConfig[sh.id]={linkId:uid()+'_'+Date.now().toString(36),created:new Date().toISOString().split('T')[0],active:true};
    }
    const dims=getActiveDims();const scores={};
    dims.forEach(d=>{
      const pracScore=migrateScores(p.adkarScores)[d.key]||3;
      const variance=(Math.random()-0.5)*2;
      scores[d.key]=Math.max(1,Math.min(5,+(pracScore+variance).toFixed(1)));
    });
    p.pulseResults[sh.id]={responses:Math.floor(Math.random()*40)+10,scores};
  });
  touch('proj');schedSave();renderPPulse();
}
function createPulseLink(shId){
  const p=getProj();if(!p)return;
  if(!p.pulseConfig)p.pulseConfig={};
  const linkId=uid()+'_'+Date.now().toString(36);
  p.pulseConfig[shId]={linkId,created:new Date().toISOString().split('T')[0],active:true};
  if(!p.pulseResults)p.pulseResults={};
  p.pulseResults[shId]={responses:0,scores:{}};
  // Store link context for pulse.html
  const sh=p.stakeholders.find(s=>s.id===shId||s.name===shId);
  const links=JSON.parse(localStorage.getItem('adoptiq_pulse_links')||'{}');
  links[linkId]={projectName:p.name,groupName:sh?.name||'',created:new Date().toISOString()};
  localStorage.setItem('adoptiq_pulse_links',JSON.stringify(links));
  touch('proj');schedSave();renderPPulse();
}
function syncPulseResponses(){
  // Aggregate real survey responses from localStorage into project pulseResults
  const rawResponses=JSON.parse(localStorage.getItem('adoptiq_pulse_responses')||'[]');
  if(!rawResponses.length)return;
  const pulseLinks=JSON.parse(localStorage.getItem('adoptiq_pulse_links')||'{}');
  // Group responses by linkId
  const byLink={};
  rawResponses.forEach(r=>{if(r.linkId){if(!byLink[r.linkId])byLink[r.linkId]=[];byLink[r.linkId].push(r);}});
  // For each release/project, find matching links and aggregate
  let updated=false;
  releases.forEach(rel=>{
    (rel.projects||[]).forEach(p=>{
      if(!p.pulseConfig)return;
      (p.stakeholders||[]).forEach(sh=>{
        const cfg=p.pulseConfig[sh.id];
        if(!cfg||!cfg.linkId)return;
        const responses=byLink[cfg.linkId];
        if(!responses||!responses.length)return;
        // Aggregate scores: average across all responses per dimension
        const dimTotals={};const dimCounts={};
        responses.forEach(resp=>{
          if(!resp.scores)return;
          Object.entries(resp.scores).forEach(([key,val])=>{
            if(!dimTotals[key])dimTotals[key]=0;
            if(!dimCounts[key])dimCounts[key]=0;
            dimTotals[key]+=val;dimCounts[key]++;
          });
        });
        const avgScores={};
        Object.keys(dimTotals).forEach(k=>{avgScores[k]=+(dimTotals[k]/dimCounts[k]).toFixed(1);});
        if(!p.pulseResults)p.pulseResults={};
        const prev=p.pulseResults[sh.id];
        const newCount=responses.length;
        // Only update if count changed (avoid unnecessary saves)
        if(!prev||prev.responses!==newCount){
          p.pulseResults[sh.id]={responses:newCount,scores:avgScores};
          updated=true;
        }
      });
    });
  });
  if(updated){schedSave();}
}

function simulatePulseResults(shId){
  const p=getProj();if(!p)return;
  if(!p.pulseResults)p.pulseResults={};
  const dims=getActiveDims();
  const scores={};
  dims.forEach(d=>{
    // Simulate population scores with some variance from practitioner scores
    const pracScore=migrateScores(p.adkarScores)[d.key]||3;
    const variance=(Math.random()-0.5)*2;// ±1
    scores[d.key]=Math.max(1,Math.min(5,+(pracScore+variance).toFixed(1)));
  });
  const responses=Math.floor(Math.random()*40)+10;
  p.pulseResults[shId]={responses,scores};
  touch('proj');schedSave();renderPPulse();
}

// ════════════════════════════════════════════════════════
// PROGRESS TRACKING (Weekly Snapshots)
// ════════════════════════════════════════════════════════
async function saveSnapshot(){
  if(!currentUserId)return;
  const today=new Date().toISOString().split('T')[0];
  const snapshotData={
    releases:releases.map(r=>({
      id:r.id,name:r.name,
      projects:r.projects.map(p=>{
        const gs=projGateScore(p);const avg=projAdkarAvg(p);const flags=getProjFlags(p).length;
        return{id:p.id,name:p.name,gateScore:gs,adkarAvg:avg,flags,status:p.status};
      })
    }))
  };
  // Try new snapshots table first, fall back to user_metadata
  const{error}=await _supabase.from('snapshots').upsert({user_id:currentUserId,snapshot_date:today,data:snapshotData},{onConflict:'user_id,snapshot_date'});
  if(error){
    // Fallback: store in user_metadata (table may not exist yet)
    const{data:{user}}=await _supabase.auth.getUser();
    const history=user?.user_metadata?.snapshots||[];
    const filtered=history.filter(s=>s.date!==today);
    filtered.push({date:today,...snapshotData});
    await _supabase.auth.updateUser({data:{snapshots:filtered.slice(-52)}});
  }
}

function autoSnapshot(){
  // Auto-snapshot once per day on login
  const lastSnap=localStorage.getItem('adoptiq_last_snap_'+currentUserId);
  const today=new Date().toISOString().split('T')[0];
  if(lastSnap!==today&&releases.length>0){
    saveSnapshot();
    localStorage.setItem('adoptiq_last_snap_'+currentUserId,today);
  }
}

// ════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════
function exportProjectSummary(){
  const p=getProj();const r=getRel();if(!p||!r)return;
  const flags=getPFlags();const avg=projAdkarAvg(p);
  let t='OCM READINESS GATE — PROJECT SUMMARY\n';
  t+='Providence Consulting Firm | CPTM · ATD Master Trainer · ADKAR-Aligned\n';
  t+='─'.repeat(60)+'\n\n';
  t+=`Release:      ${r.name}\nProject:      ${p.name}\nAgencies:     ${(p.agencies||[]).join(', ')||'—'}\nTraining:     ${p.trainingRequired?'Required':'Not Required'}\nStatus:       ${p.status}\nEst. Users:   ${p.estimatedUsers||0}\nGenerated:    ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}\n\n`;
  // Resources
  migrateResources(p);
  const effRes=RES_ROLES.filter(ro=>(p.resources[ro.key]||[]).some(e=>e.name));
  if(effRes.length){t+='PROJECT TEAM\n'+'─'.repeat(45)+'\n';effRes.forEach(ro=>{const arr=p.resources[ro.key].filter(e=>e.name);arr.forEach(e=>{t+=`${ro.label}: ${e.name}${e.contact?' — '+e.contact:''}\n`;});});t+='\n';}
  // Gates
  t+='GATE READINESS\n'+'─'.repeat(45)+'\n';
  GATE_DEFS.forEach(gate=>{
    const tot=gate.items.length;const grn=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='green').length;
    t+=`\n${gate.label} — ${gate.sub}: ${Math.round(grn/tot*100)}% (${grn}/${tot})\n`;
    gate.items.forEach((item,i)=>{const s=p.gateState[gate.id+'_'+i];const sym=s==='green'?'[COMPLETE]   ':s==='yellow'?'[PARTIAL]    ':s==='red'?'[INCOMPLETE] ':s==='gray'?'[NOT STARTED]':'[NOT SET]    ';t+=`  ${sym} ${item.text}\n`;});
  });
  t+='\n\n'+fwName().toUpperCase()+' ASSESSMENT\n'+'─'.repeat(45)+'\n';
  t+=`Overall Score: ${avg}/5\n\n`;
  ADKAR_DIMS.forEach(d=>{t+=`${d.word} (${d.letter}): ${p.adkarScores[d.key]}/5\n`;if(p.adkarNotes[d.key])t+=`  Notes: ${p.adkarNotes[d.key]}\n`;});
  t+='\n\nACTIVE RISK FLAGS ('+flags.length+')\n'+'─'.repeat(45)+'\n';
  if(!flags.length){t+='No active risk flags.\n';}
  else{flags.forEach((fl,i)=>{t+=`\nFlag ${i+1}: ${fl.gate} — ${fl.sub}\n  Gap:          ${fl.item}\n  Consequence:  ${fl.consequence}\n`;const ow=fl.defOwner||(p.flagOwners&&p.flagOwners[fl.key])||'';const du=(p.flagDueDates&&p.flagDueDates[fl.key])||'';if(ow)t+=`  Owner:        ${ow}\n`;if(du)t+=`  Resolution:   ${du}\n`;});}
  t+='\n\nSTAKEHOLDER ASSESSMENT SUMMARY\n'+'─'.repeat(45)+'\n';
  if(!p.stakeholders.length){t+='No stakeholder groups scored.\n';}
  else{p.stakeholders.forEach(sh=>{const sc=adoptScore(sh.factors),{tier}=adoptTier(sc);t+=`\n${sh.name}\n  Adoption Likelihood:   ${sc}% — ${tier}\n  Measurement:           ${badgeLabel(kirkReady(sh))}\n  Reinforcement Plan:    ${badgeLabel(reinReady(sh))}\n`;const los=sh.objectives.filter(o=>o.trim());if(los.length){t+=`  Learning Objectives (${los.length}):\n`;los.forEach((o,i)=>{t+=`    ${i+1}. ${o}\n`;});}AF.forEach(f=>{t+=`  ${f.label}: ${sh.factors[f.key]}/5 — ${FD[sh.factors[f.key]]}\n`;});if(sh.kirk.L4.outcome)t+=`  L4 Outcome: ${sh.kirk.L4.outcome}\n`;if(sh.rein.owner)t+=`  Reinforcement Owner: ${sh.rein.owner}\n`;});}
  t+='\n'+'─'.repeat(60)+'\nGenerated by AdoptIQ | Providence Consulting Firm\nCPTM · ATD Master Trainer · ADKAR-Aligned\n';
  const blob=new Blob([t],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`AdoptIQ-${r.name.replace(/[^a-z0-9]/gi,'-')}-${p.name.replace(/[^a-z0-9]/gi,'-')}.txt`;a.click();URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════
// PDF EXPORT
// ════════════════════════════════════════════════════════
function pdfHeader(doc,w){
  const brand=getBrand();
  doc.setFillColor(12,31,63);doc.rect(0,0,w,28,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(184,146,42);
  doc.text('AdoptIQ',14,18);
  doc.setFontSize(9);doc.setTextColor(255,255,255);
  doc.text(brand.firmName||'',w-14,13,{align:'right'});
  doc.setFontSize(7);doc.text('CPTM · ATD Master Trainer · ADKAR-Aligned',w-14,19,{align:'right'});
  doc.setTextColor(0,0,0);
  return 38;
}
function pdfFooter(doc,w,h,pg){
  const brand=getBrand();
  doc.setFillColor(12,31,63);doc.rect(0,h-12,w,12,'F');
  doc.setFontSize(7);doc.setTextColor(255,255,255);
  doc.text('Generated by AdoptIQ | '+(brand.firmName||''),14,h-4);
  doc.text('Page '+pg,w-14,h-4,{align:'right'});
  doc.setTextColor(0,0,0);
}
function pdfSection(doc,y,title,w){
  doc.setFillColor(240,237,230);doc.rect(10,y-1,w-20,9,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(12,31,63);
  doc.text(title,14,y+5);doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');
  return y+14;
}
function pdfBar(doc,x,y,w,pct,fillR,fillG,fillB){
  doc.setFillColor(230,230,230);doc.roundedRect(x,y,w,5,2,2,'F');
  if(pct>0){doc.setFillColor(fillR,fillG,fillB);doc.roundedRect(x,y,w*pct/100,5,2,2,'F');}
}
function pdfCheckPage(doc,y,w,h,pg,needed){
  if(y+needed>h-18){pdfFooter(doc,w,h,pg[0]);pg[0]++;doc.addPage();y=pdfHeader(doc,w);} return y;
}

function exportProjectPDF(){
  if(!window.jspdf){alert('PDF library is still loading. Please try again in a moment.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  migrateResources(p);
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
  const pg=[1];let y=pdfHeader(doc,w);
  // Title
  doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(12,31,63);
  doc.text('Project Readiness Summary',14,y);y+=8;
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(80,80,80);
  const genDate=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  doc.text(`Generated: ${genDate}`,14,y);y+=8;
  // Executive summary
  doc.setTextColor(0,0,0);doc.setFontSize(9);
  const info=[['Release',r.name],['Project',p.name],['Agencies',(p.agencies||[]).join(', ')||'—'],['Training',p.trainingRequired?'Required':'Not Required'],['Status',p.status],['Est. Users',String(p.estimatedUsers||0)]];
  info.forEach(([label,val])=>{doc.setFont('helvetica','bold');doc.text(label+':',14,y);doc.setFont('helvetica','normal');doc.text(val,45,y);y+=5;});
  y+=4;
  // Project Team
  const effRes=RES_ROLES.filter(ro=>(p.resources[ro.key]||[]).some(e=>e.name));
  if(effRes.length){
    y=pdfCheckPage(doc,y,w,h,pg,12+effRes.length*5);
    y=pdfSection(doc,y,'Project Team',w);
    effRes.forEach(ro=>{const arr=p.resources[ro.key].filter(e=>e.name);arr.forEach(e=>{
      doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(ro.label+':',14,y);
      doc.setFont('helvetica','normal');doc.text(`${e.name}${e.contact?' — '+e.contact:''}`,55,y);y+=5;
    });});y+=4;
  }
  // Gate Readiness
  y=pdfCheckPage(doc,y,w,h,pg,20);
  y=pdfSection(doc,y,'Gate Readiness',w);
  GATE_DEFS.forEach(gate=>{
    y=pdfCheckPage(doc,y,w,h,pg,16);
    const tot=gate.items.length;const grn=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='green').length;
    const pct=Math.round(grn/tot*100);
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(`${gate.label} — ${gate.sub}`,14,y);
    doc.setFont('helvetica','normal');doc.text(`${pct}% (${grn}/${tot})`,w-14,y,{align:'right'});y+=3;
    pdfBar(doc,14,y,w-28,pct,29,104,64);y+=8;
    gate.items.forEach((item,i)=>{
      y=pdfCheckPage(doc,y,w,h,pg,6);
      const s=p.gateState[gate.id+'_'+i];
      const clr=s==='green'?[29,104,64]:s==='yellow'?[138,92,0]:s==='red'?[139,26,26]:s==='gray'?[136,150,167]:[210,210,210];
      doc.setFillColor(...clr);doc.circle(17,y-1.2,1.5,'F');
      doc.setFontSize(7.5);doc.text(item.text,22,y);y+=4.5;
    });
    y+=3;
  });
  // ADKAR
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,fwName()+' Assessment',w);
  const avg=projAdkarAvg(p);
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text(`Overall Score: ${avg}/5`,14,y);y+=6;
  doc.setFont('helvetica','normal');
  ADKAR_DIMS.forEach(d=>{
    y=pdfCheckPage(doc,y,w,h,pg,10);
    const sc=p.adkarScores[d.key];const pct=sc/5*100;
    doc.setFontSize(8);doc.text(`${d.word} (${d.letter})`,14,y);
    doc.text(`${sc}/5`,w-14,y,{align:'right'});y+=3;
    pdfBar(doc,14,y,w-28,pct,12,31,63);y+=7;
  });
  y+=2;
  // Risk Flags
  const flags=getPFlags();
  y=pdfCheckPage(doc,y,w,h,pg,16);
  y=pdfSection(doc,y,`Active Risk Flags (${flags.length})`,w);
  if(!flags.length){doc.setFontSize(8);doc.text('No active risk flags.',14,y);y+=6;}
  else{
    const flagRows=flags.map(f=>[`${f.gate} — ${f.sub}`,f.item,f.consequence]);
    doc.autoTable({startY:y,head:[['Gate','Gap','Consequence']],body:flagRows,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},
      didDrawPage:function(data){pg[0]++;}
    });
    y=doc.lastAutoTable.finalY+6;
  }
  // Stakeholders
  if(p.stakeholders.length){
    y=pdfCheckPage(doc,y,w,h,pg,16);
    y=pdfSection(doc,y,'Stakeholder Assessment Summary',w);
    const shRows=p.stakeholders.map(sh=>{const sc=adoptScore(sh.factors);const{tier}=adoptTier(sc);return[sh.name,sc+'%',tier,badgeLabel(kirkReady(sh)),badgeLabel(reinReady(sh))];});
    doc.autoTable({startY:y,head:[['Group','Adoption','Risk Tier','Measurement','Reinforcement']],body:shRows,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},
      didDrawPage:function(data){pg[0]++;}
    });
    y=doc.lastAutoTable.finalY+6;
  }
  pdfFooter(doc,w,h,pg[0]);
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);}
}

function exportReleasePDF(){
  if(!window.jspdf){alert('PDF library is still loading. Please try again in a moment.');return;}
  const r=getRel();if(!r)return;
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
  const pg=[1];let y=pdfHeader(doc,w);
  doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(12,31,63);
  doc.text('Release Readiness Summary',14,y);y+=8;
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(80,80,80);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`,14,y);y+=8;
  doc.setTextColor(0,0,0);
  doc.setFont('helvetica','bold');doc.text('Release:',14,y);doc.setFont('helvetica','normal');doc.text(r.name,45,y);y+=5;
  doc.setFont('helvetica','bold');doc.text('Go-Live:',14,y);doc.setFont('helvetica','normal');doc.text(r.golive||'Not set',45,y);y+=5;
  doc.setFont('helvetica','bold');doc.text('Projects:',14,y);doc.setFont('helvetica','normal');doc.text(String(r.projects.length),45,y);y+=8;
  // Project summary table
  if(r.projects.length){
    y=pdfSection(doc,y,'Projects Overview',w);
    const rows=r.projects.map(p=>{
      const gs=projGateScore(p);const avg=projAdkarAvg(p);
      return[p.name,p.status,(p.agencies||[]).join(', ')||'—',gs!==null?gs+'%':'—',avg+'/5',String(getProjFlags(p).length)];
    });
    doc.autoTable({startY:y,head:[['Project','Status','Agencies','Gate Score',fwShort(),'Flags']],body:rows,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},
      didDrawPage:function(data){pg[0]++;}
    });
    y=doc.lastAutoTable.finalY+8;
  }
  // Per-project gate bars
  r.projects.forEach(p=>{
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,p.name+' — Gate Readiness',w);
    GATE_DEFS.forEach(gate=>{
      y=pdfCheckPage(doc,y,w,h,pg,12);
      const tot=gate.items.length;const grn=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='green').length;
      const pct=Math.round(grn/tot*100);
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.text(`${gate.label}`,14,y);
      doc.setFont('helvetica','normal');doc.text(`${pct}%`,w-14,y,{align:'right'});y+=3;
      pdfBar(doc,14,y,w-28,pct,29,104,64);y+=8;
    });
    y+=3;
  });
  pdfFooter(doc,w,h,pg[0]);
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);}
}
function getProjFlags(p){
  const flags=[];
  GATE_DEFS.forEach(gate=>{gate.items.forEach((item,i)=>{
    const s=p.gateState[gate.id+'_'+i];
    if(s==='red'||s==='yellow')flags.push({gate:gate.label,sub:gate.sub,item:item.text,consequence:RC[gate.id]?.[i]||'',key:gate.id+'_'+i});
  });});
  return flags;
}

// ════════════════════════════════════════════════════════
// CLIENT HANDOFF PDF
// ════════════════════════════════════════════════════════
function exportHandoffPDF(){
  if(!window.jspdf){alert('PDF library is still loading. Please try again in a moment.');return;}
  try{
  const brand=getBrand();
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
  const mg=14,pg=[1];
  // Cover page
  doc.setFillColor(12,31,63);doc.rect(0,0,w,h,'F');
  doc.setFontSize(32);doc.setTextColor(184,146,42);doc.setFont('helvetica','bold');
  const fnLines=doc.splitTextToSize(brand.firmName||'AdoptIQ',w-60);
  fnLines.forEach((l,i)=>doc.text(l,w/2,h*0.30+i*14,{align:'center'}));
  const fnBottom=h*0.30+(fnLines.length-1)*14;
  doc.setDrawColor(184,146,42);doc.setLineWidth(0.5);doc.line(w*0.3,fnBottom+8,w*0.7,fnBottom+8);
  doc.setFontSize(16);doc.setTextColor(255,255,255);doc.setFont('helvetica','normal');
  doc.text('Client Handoff Package',w/2,fnBottom+22,{align:'center'});
  doc.setFontSize(10);doc.text(brand.subtitle||'',w/2,fnBottom+32,{align:'center'});
  doc.setFontSize(9);doc.setTextColor(200,200,200);
  doc.text('Generated: '+new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),w/2,h*0.62,{align:'center'});
  doc.text(releases.length+' Releases  ·  '+releases.reduce((s,r)=>s+r.projects.length,0)+' Projects',w/2,h*0.67,{align:'center'});
  doc.setFontSize(7);doc.setTextColor(184,146,42);
  doc.text('Powered by AdoptIQ — Adoption Intelligence Platform',w/2,h-20,{align:'center'});

  // Executive summary page
  pg[0]++;doc.addPage();let y=pdfHeader(doc,w);
  doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(12,31,63);
  doc.text('Executive Summary',mg,y);y+=12;
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(60,60,60);
  // RAG summary
  let gCnt=0,aCnt=0,rCnt=0;
  releases.forEach(r=>{const rg=relRAG(r);if(rg.rag==='green')gCnt++;else if(rg.rag==='amber')aCnt++;else rCnt++;});
  doc.text(`Portfolio Status:  ${gCnt} On Track  ·  ${aCnt} At Risk  ·  ${rCnt} Critical`,mg,y);y+=7;
  const scores=releases.map(r=>relRollup(r).gateScore).filter(s=>s!==null);
  const avgGate=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
  doc.text(`Average Gate Readiness: ${avgGate}%`,mg,y);y+=7;
  const tFlags=releases.reduce((s,r)=>s+relRollup(r).flags,0);
  doc.text(`Total Risk Flags: ${tFlags}`,mg,y);y+=12;
  // Narratives
  const narratives=generatePortfolioNarratives();
  if(narratives.length){
    y=pdfSection(doc,y,'Portfolio Insights',w);
    narratives.forEach(n=>{y=pdfCheckPage(doc,y,w,h,pg,10);
      doc.setFontSize(8);doc.setTextColor(60,60,60);
      const lines=doc.splitTextToSize('•  '+n.text,w-mg*2);
      lines.forEach(l=>{doc.text(l,mg,y);y+=4.5;});y+=3;
    });
    y+=6;
  }
  // Release summary table
  y=pdfCheckPage(doc,y,w,h,pg,25);
  y=pdfSection(doc,y,'Release Overview',w);
  const relRows=releases.map(r=>{const rl=relRollup(r);const rg=relRAG(r);
    return[r.name,rg.label,rl.gateScore!==null?rl.gateScore+'%':'—',rl.adkar||'—',String(rl.flags),r.golive?fmtDate(r.golive):'—'];
  });
  doc.autoTable({startY:y,head:[['Release','RAG','Gate %',fwShort(),'Flags','Go-Live']],body:relRows,
    margin:{left:mg,right:mg},styles:{fontSize:8,cellPadding:3},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]}
  });y=doc.lastAutoTable.finalY+10;
  pdfFooter(doc,w,h,pg[0]);

  // Per-release detail pages
  releases.forEach(r=>{
    pg[0]++;doc.addPage();y=pdfHeader(doc,w);
    doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(12,31,63);
    doc.text(r.name,mg,y);y+=8;
    const rl=relRollup(r);const rg=relRAG(r);
    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(60,60,60);
    doc.text(`Status: ${rg.label}   |   Gate Readiness: ${rl.gateScore!==null?rl.gateScore+'%':'—'}   |   Go-Live: ${r.golive?fmtDate(r.golive):'Not set'}`,mg,y);y+=10;
    // Project table
    if(r.projects.length){
      y=pdfSection(doc,y,'Projects',w);
      const pRows=r.projects.map(p=>{const gs=projGateScore(p);const avg=projAdkarAvg(p);
        return[p.name,p.status||'—',gs!==null?gs+'%':'—',avg+'/5',String(getProjFlags(p).length)];
      });
      doc.autoTable({startY:y,head:[['Project','Status','Gate %',fwShort(),'Flags']],body:pRows,
        margin:{left:mg,right:mg},styles:{fontSize:8,cellPadding:3},
        headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
        alternateRowStyles:{fillColor:[248,247,244]}
      });y=doc.lastAutoTable.finalY+12;
    }
    // Per-project detail
    r.projects.forEach(p=>{
      // Gate readiness bars
      y=pdfCheckPage(doc,y,w,h,pg,30);
      y=pdfSection(doc,y,p.name+' — Gate Readiness',w);
      GATE_DEFS.forEach(gate=>{
        y=pdfCheckPage(doc,y,w,h,pg,12);
        const tot=gate.items.length;const naC=gate.items.filter((_,i)=>(p.gateState||{})[gate.id+'_'+i]==='na').length;
        const applicable=tot-naC;const grn=gate.items.filter((_,i)=>(p.gateState||{})[gate.id+'_'+i]==='green').length;
        const pct=applicable?Math.round(grn/applicable*100):100;
        doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(60,60,60);
        doc.text(gate.label,mg,y);
        doc.setFont('helvetica','normal');doc.text(pct+'%',w-mg,y,{align:'right'});y+=4;
        pdfBar(doc,mg,y,w-mg*2,pct,29,104,64);y+=8;
      });
      y+=4;
      // ADKAR
      y=pdfCheckPage(doc,y,w,h,pg,28);
      y=pdfSection(doc,y,p.name+' — '+fwName()+' Assessment',w);
      const adkar=p.adkarScores||{};
      doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(12,31,63);
      doc.text('Overall: '+projAdkarAvg(p)+'/5',mg,y);y+=7;
      doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(60,60,60);
      ADKAR_DIMS.forEach(d=>{const sc=adkar[d.key]||0;doc.text(d.word+': '+sc+'/5',mg+4,y);y+=5;});
      y+=6;
      // Impact assessment
      if(p.impactAssessment?.groups?.length){
        y=pdfCheckPage(doc,y,w,h,pg,20);
        y=pdfSection(doc,y,p.name+' — Change Impact',w);
        const impRows=p.impactAssessment.groups.map(g=>[g.name||'—',g.level||'—',(g.changeTypes||[]).join(', ')||'—',
          (g.actions||[]).filter(a=>a.done).length+'/'+(g.actions||[]).length+' complete']);
        doc.autoTable({startY:y,head:[['Group','Impact','Change Types','Actions']],body:impRows,
          margin:{left:mg,right:mg},styles:{fontSize:8,cellPadding:3},
          headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
          alternateRowStyles:{fillColor:[248,247,244]}
        });y=doc.lastAutoTable.finalY+10;
      }
      // Stakeholders
      if(p.stakeholders?.length){
        y=pdfCheckPage(doc,y,w,h,pg,20);
        y=pdfSection(doc,y,p.name+' — Stakeholder Adoption',w);
        const shRows=p.stakeholders.map(sh=>{const sc=adoptScore(sh.factors||{});const{tier}=adoptTier(sc);return[sh.name||'—',sc+'%',tier];});
        doc.autoTable({startY:y,head:[['Stakeholder','Adoption %','Risk Tier']],body:shRows,
          margin:{left:mg,right:mg},styles:{fontSize:8,cellPadding:3},
          headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
          alternateRowStyles:{fillColor:[248,247,244]}
        });y=doc.lastAutoTable.finalY+10;
      }
    });
    pdfFooter(doc,w,h,pg[0]);
  });
  // Open in new tab for preview instead of auto-download
  const blob=doc.output('blob');
  const url=URL.createObjectURL(blob);
  window.open(url,'_blank');
  }catch(e){console.error('Handoff PDF error:',e);alert('Error generating PDF: '+e.message);}
}

// ════════════════════════════════════════════════════════
// OCM DELIVERABLE GENERATOR
// ════════════════════════════════════════════════════════
function toggleGenMenu(){const m=document.getElementById('gen-menu');if(m)m.classList.toggle('open');}
document.addEventListener('click',e=>{const m=document.getElementById('gen-menu');if(m&&!e.target.closest('.dropdown-gen'))m.classList.remove('open');});

const ADKAR_MSG_FOCUS={
  A1:{focus:'Why we are changing',channel:'Town halls, leadership memos, FAQs'},
  D:{focus:'What is in it for me',channel:'1:1 meetings, testimonials, incentives'},
  K:{focus:'How to operate in the new way',channel:'Training sessions, job aids, demos'},
  Ab:{focus:'Practice and proficiency building',channel:'Sandbox environments, coaching, super-users'},
  R:{focus:'Sustaining the change',channel:'Recognition programs, KPI dashboards, check-ins'},
  d1:{focus:'Why we are changing',channel:'Town halls, leadership memos, FAQs'},
  d2:{focus:'What is in it for me',channel:'1:1 meetings, testimonials, incentives'},
  d3:{focus:'How to operate in the new way',channel:'Training sessions, job aids, demos'},
  d4:{focus:'Practice and proficiency building',channel:'Sandbox environments, coaching, super-users'},
  d5:{focus:'Sustaining the change',channel:'Recognition programs, KPI dashboards, check-ins'},
  d6:{focus:'Building urgency and coalition',channel:'Stakeholder workshops, leadership alignment sessions'},
  d7:{focus:'Communicating the vision',channel:'All-hands meetings, visual roadmaps, story-driven messaging'},
  d8:{focus:'Empowering action and removing barriers',channel:'Process redesign, quick wins, barrier removal sessions'}
};
const RESIST_INTERVENTIONS={
  resistance:'Sponsor engagement sessions, 1:1 stakeholder meetings, address concerns directly',
  env:'Training environment remediation, technical readiness checks, infrastructure validation',
  window:'Schedule adjustment, micro-learning modules, staggered rollout',
  complexity:'Simplified job aids, super-user support network, reduced scope per wave',
  saturation:'Change sequencing, timeline spacing, initiative consolidation',
  leadership:'Manager coaching program, cascaded messaging toolkits, leadership alignment workshops'
};

function calcReadinessRec(p){
  const gate=projGateScore(p);
  const adkar=parseFloat(projAdkarAvg(p));
  const flags=getProjFlags(p).filter(f=>f.key&&(p.gateState||{})[f.key]==='red').length;
  const gaps=p.gapAnalysis?.gaps||[];
  const critGaps=gaps.filter(g=>g.severity==='Critical').length;
  if(gate>=80&&adkar>=3.5&&flags===0&&critGaps===0)return{status:'READY',label:'Ready to Proceed',color:[29,104,64]};
  if(gate<50||adkar<2.5||flags>=3||critGaps>0)return{status:'NOT_READY',label:'Not Ready',color:[184,50,50]};
  return{status:'CONDITIONAL',label:'Proceed with Conditions',color:[184,146,42]};
}

function pdfCover(doc,w,h,title,subtitle,p,r,brand){
  doc.setFillColor(12,31,63);doc.rect(0,0,w,h,'F');
  doc.setFontSize(32);doc.setFont('helvetica','bold');doc.setTextColor(184,146,42);
  const fnLines=doc.splitTextToSize(brand.firmName||'AdoptIQ',w-60);
  doc.text(fnLines,w/2,70,{align:'center'});
  doc.setDrawColor(184,146,42);doc.setLineWidth(0.5);doc.line(40,90,w-40,90);
  doc.setFontSize(18);doc.setTextColor(255,255,255);doc.text(title,w/2,110,{align:'center'});
  doc.setFontSize(11);doc.setTextColor(200,200,200);doc.text(subtitle||'',w/2,122,{align:'center'});
  doc.setFontSize(10);doc.setTextColor(184,146,42);
  const info=['Project: '+(p?.name||''),'Release: '+(r?.name||''),
    'Agencies: '+(p?.agencies?.join(', ')||'N/A'),'Go-Live: '+(r?.golive||p?.golive||'TBD'),
    'Generated: '+new Date().toLocaleDateString()];
  info.forEach((line,i)=>doc.text(line,w/2,155+i*8,{align:'center'}));
  doc.setFontSize(8);doc.setTextColor(100,100,100);doc.text('Powered by AdoptIQ',w/2,h-15,{align:'center'});
}

function _shCoalitionRole(sc){return sc>=80?'Change Champion':sc>=60?'Supporter':sc>=40?'Fence-Sitter':'Resistant';}
function _shEngagement(sh){
  const f=sh.factors||{};const sorted=AF.map(a=>({key:a.key,label:a.label,val:f[a.key]||3})).sort((a,b)=>a.val-b.val);
  if(!sorted.length)return'General Engagement';
  const low=sorted[0];
  if(low.key==='resistance')return'Active Resistance Management';
  if(low.key==='leadership')return'Sponsor Activation & Leadership Alignment';
  if(low.key==='saturation')return'Change Fatigue Mitigation';
  if(low.key==='complexity')return'Role Transition Support & Simplification';
  if(low.key==='env')return'Technical Readiness & Environment Stabilization';
  if(low.key==='window')return'Accelerated Enablement';
  return'Targeted Factor Remediation';
}
function _shPrimaryConcern(sh){
  const f=sh.factors||{};const sorted=AF.map(a=>({key:a.key,label:a.label,val:f[a.key]||3})).sort((a,b)=>a.val-b.val);
  if(!sorted.length)return'No data available';
  const low=sorted[0];return low.label+' ('+low.val+'/5): '+FD[low.val];
}
function _resistRootCause(key){
  const map={resistance:'Active Opposition',env:'Technical Readiness Gap',window:'Time Pressure',
    complexity:'Role Change Anxiety',saturation:'Change Fatigue',leadership:'Sponsor Gap'};
  return map[key]||'Organizational Barrier';
}
function _resistDetailedIntervention(key){
  const map={
    resistance:['Conduct confidential 1:1 listening sessions to surface underlying concerns','Deploy executive sponsor to deliver face-to-face vision messaging to affected groups','Establish a stakeholder advisory council to give resistors a voice in the solution design','Create a visible quick-wins campaign demonstrating early benefits of the change'],
    env:['Conduct a full technical readiness audit of training and production environments','Establish a dedicated environment support team with clear SLAs for issue resolution','Schedule end-to-end system rehearsals prior to training delivery','Create environment contingency plans including offline training alternatives'],
    window:['Redesign training into micro-learning modules (15-20 min) that fit into existing workflows','Implement a staggered rollout to reduce per-wave training load','Negotiate protected training time blocks with operational leadership','Deploy just-in-time performance support tools to supplement formal training'],
    complexity:['Develop role-specific transition guides mapping current tasks to future-state processes','Establish a super-user network for peer-to-peer support during transition','Create sandbox environments for safe practice before go-live','Implement graduated complexity rollout, starting with core functions'],
    saturation:['Conduct a change portfolio review to identify opportunities for initiative consolidation','Negotiate timeline spacing with other change initiatives','Implement a single change calendar visible to all stakeholder groups','Appoint a change fatigue liaison to monitor cumulative impact on affected groups'],
    leadership:['Deploy a structured sponsor coaching program with biweekly check-ins','Create cascaded messaging toolkits with pre-built talking points for each management level','Establish leadership alignment workshops to resolve conflicting priorities','Implement visible sponsorship actions calendar with accountability tracking']
  };
  return map[key]||['Conduct targeted assessment to identify specific barriers','Develop customized intervention plan based on root cause analysis','Assign dedicated change agent to monitor and support affected groups'];
}
function _trainingModality(sh){
  const f=sh.factors||{};
  if((f.complexity||3)<=2)return'Hands-on workshop + sandbox environment';
  if((f.window||3)<=2)return'Micro-learning modules (15-20 min segments)';
  if((f.saturation||3)<=2)return'Self-paced eLearning with optional coaching';
  if((f.env||3)<=2)return'Instructor-led with offline backup materials';
  return'Instructor-led training (ILT/vILT)';
}

function genStakeholderAnalysis(){
  if(!window.jspdf){alert('PDF library is still loading.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  try{
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];const mg=14;
  const brand=getBrand();
  pdfCover(doc,w,h,'Stakeholder Analysis','Adoption Risk Assessment & Engagement Strategy',p,r,brand);

  const shs=p.stakeholders||[];const igs=(p.impactAssessment?.groups)||[];
  // Compute coalition counts
  const coalition={champion:0,supporter:0,fence:0,resistant:0};
  shs.forEach(sh=>{const sc=adoptScore(sh.factors);if(sc>=80)coalition.champion++;else if(sc>=60)coalition.supporter++;else if(sc>=40)coalition.fence++;else coalition.resistant++;});
  const avgAdopt=shs.length?Math.round(shs.reduce((s,sh)=>s+adoptScore(sh.factors),0)/shs.length):0;
  const highRiskGroup=shs.length?shs.reduce((worst,sh)=>adoptScore(sh.factors)<adoptScore(worst.factors)?sh:worst,shs[0]):null;
  const overallPosture=coalition.resistant>0||coalition.fence>coalition.supporter?'elevated risk':'manageable';

  // ── Page 2: Executive Summary ──
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  y=pdfSection(doc,y,'1. Executive Summary',w);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  let execText='This analysis covers '+shs.length+' stakeholder group'+(shs.length!==1?'s':'')+' across the '+p.name+' initiative. ';
  if(highRiskGroup)execText+='The highest-risk group is '+highRiskGroup.name+' at '+adoptScore(highRiskGroup.factors)+'% adoption likelihood. ';
  execText+='The average adoption likelihood across all groups is '+avgAdopt+'%, placing the overall engagement posture at '+overallPosture+'. ';
  if(coalition.resistant>0)execText+=coalition.resistant+' group'+(coalition.resistant!==1?'s show':' shows')+' active resistance indicators requiring immediate intervention. ';
  if(coalition.champion>0)execText+=coalition.champion+' group'+(coalition.champion!==1?'s qualify':' qualifies')+' as potential Change Champion'+(coalition.champion!==1?'s':'')+' and should be leveraged for peer advocacy.';
  const execLines=doc.splitTextToSize(execText,w-28);
  doc.text(execLines,mg,y+3);y+=3+execLines.length*4+6;

  // ── Stakeholder Influence/Impact Matrix (2x2 Grid) ──
  y=pdfCheckPage(doc,y,w,h,pg,90);
  y=pdfSection(doc,y,'2. Stakeholder Influence / Impact Matrix',w);
  doc.setFontSize(7);doc.setTextColor(100,100,100);doc.setFont('helvetica','italic');
  const matrixNote=doc.splitTextToSize('Impact is derived from the change impact assessment. Influence is approximated from leadership factor and adoption score. Groups are plotted to inform engagement prioritization.',w-28);
  doc.text(matrixNote,mg,y+2);y+=2+matrixNote.length*4+4;
  doc.setFont('helvetica','normal');
  // Draw 2x2 grid
  const gx=35,gy=y,gw=130,ghalf=gw/2,gh=60,ghh=gh/2;
  doc.setDrawColor(12,31,63);doc.setLineWidth(0.3);
  doc.rect(gx,gy,gw,gh);doc.line(gx+ghalf,gy,gx+ghalf,gy+gh);doc.line(gx,gy+ghh,gx+gw,gy+ghh);
  // Axis labels
  doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
  doc.text('HIGH IMPACT',gx+ghalf/2,gy-2,{align:'center'});doc.text('HIGH IMPACT',gx+ghalf+ghalf/2,gy-2,{align:'center'});
  doc.text('Low Influence',gx+ghalf/2,gy+gh+4,{align:'center'});doc.text('High Influence',gx+ghalf+ghalf/2,gy+gh+4,{align:'center'});
  // Quadrant labels
  doc.setFontSize(6);doc.setFont('helvetica','italic');doc.setTextColor(150,150,150);
  doc.text('Keep Informed',gx+2,gy+5);doc.text('Manage Closely',gx+ghalf+2,gy+5);
  doc.text('Monitor',gx+2,gy+ghh+5);doc.text('Keep Satisfied',gx+ghalf+2,gy+ghh+5);
  // Plot stakeholders
  doc.setFontSize(6);doc.setFont('helvetica','bold');
  shs.forEach((sh,idx)=>{
    const sc=adoptScore(sh.factors);const leadership=sh.factors?.leadership||3;
    const ig=igs.find(g=>g.name===sh.name);
    const impactHigh=ig?(ig.level==='High'||ig.level==='Critical'):sc<60;
    const influenceHigh=leadership>=4||sc>=70;
    const qx=influenceHigh?gx+ghalf+5:gx+5;
    const qy=impactHigh?gy+8:gy+ghh+8;
    const offsetX=(idx*17)%50;const offsetY=(idx*11)%18;
    const col=sc>=80?[29,104,64]:sc>=60?[184,146,42]:[184,50,50];
    doc.setTextColor(col[0],col[1],col[2]);
    const label=sh.name.length>18?sh.name.substring(0,16)+'..':sh.name;
    doc.text(label,qx+offsetX,qy+offsetY);
  });
  y=gy+gh+12;

  // ── Stakeholder Inventory Table ──
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'3. Stakeholder Inventory',w);
  if(shs.length===0){doc.setFontSize(9);doc.setTextColor(100,100,100);doc.text('No stakeholder groups have been added to this project.',mg,y+6);y+=14;}
  else{
    const rows=shs.map(sh=>{const sc=adoptScore(sh.factors);const t=adoptTier(sc);
      const ig=igs.find(g=>g.name===sh.name);
      return[sh.name,ig?.level||'--',sc+'%',t.tier,_shEngagement(sh),_shPrimaryConcern(sh)];});
    doc.autoTable({startY:y,head:[['Group','Impact','Adoption %','Risk Tier','Engagement Strategy','Primary Concern']],body:rows,
      margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2.5},
      columnStyles:{4:{cellWidth:35},5:{cellWidth:40}},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  // ── Per-Group Deep Dive ──
  shs.forEach(sh=>{
    y=pdfCheckPage(doc,y,w,h,pg,100);
    y=pdfSection(doc,y,'4. Deep Dive: '+sh.name,w);
    const sc=adoptScore(sh.factors);const t=adoptTier(sc);
    const ig=igs.find(g=>g.name===sh.name);
    const coalRole=_shCoalitionRole(sc);
    const engage=_shEngagement(sh);

    // Coalition role + engagement approach
    doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text('Coalition Role: '+coalRole,mg,y+4);
    const roleCol=sc>=80?[29,104,64]:sc>=60?[184,146,42]:sc>=40?[180,130,30]:[184,50,50];
    doc.setFillColor(roleCol[0],roleCol[1],roleCol[2]);doc.roundedRect(mg+60,y,35,6,2,2,'F');
    doc.setFontSize(7);doc.setTextColor(255,255,255);doc.text(coalRole,mg+62,y+4.5);
    y+=10;
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
    doc.text('Engagement Approach: '+engage,mg,y+3);y+=8;

    // Impact & current/future state
    if(ig){
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
      doc.text('Impact Level: '+ig.level,mg,y+4);y+=8;
      doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
      if(ig.currentState){doc.setFont('helvetica','bold');doc.text('Current State:',mg,y+4);doc.setFont('helvetica','normal');
        const csLines=doc.splitTextToSize(ig.currentState,w-32);doc.text(csLines,mg,y+9);y+=9+csLines.length*4;}
      if(ig.futureState){doc.setFont('helvetica','bold');doc.text('Future State:',mg,y+4);doc.setFont('helvetica','normal');
        const fsLines=doc.splitTextToSize(ig.futureState,w-32);doc.text(fsLines,mg,y+9);y+=9+fsLines.length*4;}
      y+=4;
    }
    // Adoption factor bars
    doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text('Adoption Likelihood: '+sc+'% ('+t.tier+')',mg,y+4);y+=10;
    AF.forEach(f=>{
      const val=sh.factors?.[f.key]||3;
      doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(80,80,80);
      doc.text(f.label+': '+val+'/5',mg,y+3);
      const barCol=val>=4?[29,104,64]:val>=3?[184,146,42]:[184,50,50];
      pdfBar(doc,70,y,80,val/5*100,barCol[0],barCol[1],barCol[2]);y+=7;
    });
    y+=4;

    // Engagement approach narrative
    y=pdfCheckPage(doc,y,w,h,pg,30);
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);doc.text('Engagement Approach Detail',mg,y+3);y+=8;
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
    const sorted=AF.map(a=>({key:a.key,label:a.label,val:sh.factors?.[a.key]||3})).sort((a,b)=>a.val-b.val);
    const lowF=sorted[0];
    let engNarr='';
    if(lowF&&lowF.val<=2)engNarr='The primary area of concern for this group is '+lowF.label.toLowerCase()+' (rated '+lowF.val+'/5). This requires immediate, targeted intervention using the '+engage.toLowerCase()+' approach. ';
    else if(lowF)engNarr='No critical-risk factors detected. The lowest factor is '+lowF.label.toLowerCase()+' at '+lowF.val+'/5, which warrants monitoring but does not require urgent intervention. ';
    if(sc>=80)engNarr+='This group should be recruited as Change Champions to advocate for adoption among peer groups and provide testimonials.';
    else if(sc>=60)engNarr+='This group is generally supportive but requires sustained communication and support to prevent backsliding. Consider assigning a dedicated change agent.';
    else if(sc>=40)engNarr+='This group is on the fence and could tip either direction. Prioritize direct manager engagement, address specific concerns through facilitated dialogue, and demonstrate early wins.';
    else engNarr+='This group exhibits significant resistance indicators. Escalate to executive sponsor for direct engagement. Deploy intensive 1:1 coaching and create a structured concern-resolution process.';
    const engLines=doc.splitTextToSize(engNarr,w-28);doc.text(engLines,mg,y+2);y+=2+engLines.length*4+4;

    // Kirkpatrick
    if(sh.kirk){
      y=pdfCheckPage(doc,y,w,h,pg,30);
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);doc.text('Kirkpatrick Evaluation Plan',mg,y+3);y+=8;
      const kRows=[];
      if(sh.kirk.L1?.method)kRows.push(['L1: Reaction',sh.kirk.L1.method,sh.kirk.L1.timing||'']);
      if(sh.kirk.L2?.method)kRows.push(['L2: Learning',sh.kirk.L2.method,sh.kirk.L2.assessment||'']);
      if(sh.kirk.L3?.observable)kRows.push(['L3: Behavior',sh.kirk.L3.observable,sh.kirk.L3.interval?sh.kirk.L3.interval+' days post go-live':'']);
      if(sh.kirk.L4?.outcome)kRows.push(['L4: Results',sh.kirk.L4.outcome,sh.kirk.L4.metric||'']);
      if(kRows.length){doc.autoTable({startY:y,head:[['Level','Method/Indicator','Standard/Timing']],body:kRows,
        margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2},
        headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
        alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
        y=doc.lastAutoTable.finalY+8;}
    }
    // Reinforcement
    if(sh.rein?.owner){
      y=pdfCheckPage(doc,y,w,h,pg,30);
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);doc.text('Reinforcement Plan',mg,y+3);y+=8;
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
      doc.text('Owner: '+(sh.rein.owner||'TBD'),mg,y+3);y+=5;
      if(sh.rein.activities){const aLines=doc.splitTextToSize('Activities: '+sh.rein.activities,w-28);doc.text(aLines,mg,y+3);y+=3+aLines.length*4;}
      if(sh.rein.intervals?.length){doc.text('Intervals: '+sh.rein.intervals.join(', '),mg,y+3);y+=5;}
      if(sh.rein.escalation){const eLines=doc.splitTextToSize('Escalation: '+sh.rein.escalation,w-28);doc.text(eLines,mg,y+3);y+=3+eLines.length*4;}
      y+=6;
    }
  });

  // ── Coalition Map Summary ──
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,'5. Coalition Map Summary',w);
  doc.setFontSize(8);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  const coalNarr='The coalition composition below reflects the distribution of stakeholder groups by their adoption likelihood. A healthy change coalition requires a critical mass of Champions and Supporters. '+
    (coalition.resistant+coalition.fence>coalition.champion+coalition.supporter?
    'Currently, the balance tips toward resistance and ambivalence, indicating that sponsor engagement and targeted interventions must be prioritized before go-live.':
    'The current balance favors adoption, though continued engagement is essential to prevent backsliding among Supporters and Fence-Sitters.');
  const coalLines=doc.splitTextToSize(coalNarr,w-28);doc.text(coalLines,mg,y+2);y+=2+coalLines.length*4+4;
  const coalRows=[
    ['Change Champions (80%+)',coalition.champion+'','Leverage for peer advocacy, testimonials, and super-user roles'],
    ['Supporters (60-79%)',coalition.supporter+'','Sustain engagement through regular updates and recognition'],
    ['Fence-Sitters (40-59%)',coalition.fence+'','Target with manager coaching, demonstrate quick wins, address specific concerns'],
    ['Resistant (<40%)',coalition.resistant+'','Escalate to sponsor, deploy 1:1 interventions, create structured concern resolution']
  ];
  doc.autoTable({startY:y,head:[['Coalition Role','Count','Recommended Action']],body:coalRows,
    margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2.5},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},
    didDrawCell:(data)=>{
      if(data.section==='body'&&data.column.index===0){
        const colors=[[29,104,64],[184,146,42],[180,130,30],[184,50,50]];
        doc.setFillColor(colors[data.row.index][0],colors[data.row.index][1],colors[data.row.index][2]);
        doc.roundedRect(data.cell.x+1,data.cell.y+1,3,3,1,1,'F');
      }
    },
    didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  pdfFooter(doc,w,h,pg[0]);
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);}
  toggleGenMenu();
  }catch(e){console.error('Stakeholder Analysis PDF:',e);alert('Error generating PDF: '+e.message);}
}

function genTrainingPlan(){
  if(!window.jspdf){alert('PDF library is still loading.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  try{
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];const mg=14;
  const brand=getBrand();
  pdfCover(doc,w,h,'Training Plan','CPTM/Kirkpatrick-Aligned Training Strategy',p,r,brand);
  const shs=p.stakeholders||[];
  const kirkPct=shs.length?Math.round(shs.filter(sh=>kirkReady(sh)==='ready').length/shs.length*100):0;

  // ── 1. Executive Summary ──
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  y=pdfSection(doc,y,'1. Executive Summary',w);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  let trainExec='This training plan addresses '+shs.length+' stakeholder group'+(shs.length!==1?'s':'')+' for the '+p.name+' initiative. ';
  trainExec+='Training is '+(p.trainingRequired?'required':'not currently flagged as required')+' with an estimated '+(p.estimatedUsers||'TBD')+' end users. ';
  trainExec+='Kirkpatrick evaluation design is '+kirkPct+'% complete across all groups. ';
  const adkarK=(p.adkarScores||{}).K||3;const adkarAb=(p.adkarScores||{}).Ab||3;
  if(adkarK<3||adkarAb<3)trainExec+='Knowledge ('+adkarK+'/5) and Ability ('+adkarAb+'/5) scores indicate significant learning gaps that must be addressed through targeted training interventions. ';
  else trainExec+='Knowledge and Ability scores are at acceptable levels, suggesting the training approach should focus on reinforcement and proficiency building. ';
  const gaps=(p.gapAnalysis?.gaps||[]).filter(g=>g.trainingImpact);
  if(gaps.length)trainExec+=gaps.length+' implementation gap'+(gaps.length!==1?'s have':' has')+' direct training implications that are addressed in the risk register below.';
  const trainExecLines=doc.splitTextToSize(trainExec,w-28);doc.text(trainExecLines,mg,y+3);y+=3+trainExecLines.length*4+6;

  // ── 2. Training Governance ──
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'2. Training Governance',w);
  const trainLead=(p.resources?.ocm_train||[]).filter(r2=>r2.name);
  const smeList=(p.resources?.smes||[]).filter(r2=>r2.name);
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
  doc.text('Training Lead'+(trainLead.length!==1?'s':'')+':', mg, y+4);
  doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  doc.text(trainLead.length?trainLead.map(r2=>r2.name+(r2.contact?' ('+r2.contact+')':'')).join(', '):'TBD - Assignment required',mg+35,y+4);y+=7;
  doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
  doc.text('Subject Matter Experts:',mg,y+4);
  doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  doc.text(smeList.length?smeList.map(r2=>r2.name).join(', '):'TBD - Assignment required',mg+43,y+4);y+=7;
  doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
  doc.text('Approval Process:',mg,y+4);
  doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  const apprvl='Training materials are reviewed by designated SMEs, validated against learning objectives, and approved by the OCM Lead prior to delivery. All curriculum changes require re-approval.';
  const apprvlLines=doc.splitTextToSize(apprvl,w-28);doc.text(apprvlLines,mg,y+9);y+=9+apprvlLines.length*4+6;

  // ── 3. Needs Analysis Matrix ──
  if(shs.length){
    y=pdfCheckPage(doc,y,w,h,pg,40);
    y=pdfSection(doc,y,'3. Needs Analysis Matrix',w);
    doc.setFontSize(7);doc.setFont('helvetica','italic');doc.setTextColor(100,100,100);
    doc.text('Learning gaps are derived from the lowest '+fwShort()+' dimension and adoption factors per group. Modality is auto-recommended based on environmental constraints.',mg,y+2);y+=8;
    const naRows=shs.map(sh=>{
      const dims=getActiveDims();const scores=p.adkarScores||{};
      const lowestDim=dims.reduce((min,d)=>(scores[d.key]||3)<(scores[min.key]||3)?d:min,dims[0]);
      const sc=adoptScore(sh.factors);
      const profCurr=sc>=80?'Proficient':sc>=60?'Developing':sc>=40?'Foundational':'Novice';
      return[sh.name,lowestDim.word+' ('+((scores[lowestDim.key])||3)+'/5)',profCurr,'Proficient (80%+)',_trainingModality(sh)];
    });
    doc.autoTable({startY:y,head:[['Group','Learning Gap','Current Proficiency','Target Proficiency','Recommended Modality']],body:naRows,
      margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2.5},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  // ── 4. Learning Path Design (per group) ──
  shs.forEach(sh=>{
    y=pdfCheckPage(doc,y,w,h,pg,80);
    y=pdfSection(doc,y,'4. Learning Path: '+sh.name,w);
    const objs=sh.objectives||[];const kr=sh.kirk||{};const rn=sh.rein||{};

    // Pre-training
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text('Phase 1: Pre-Training',mg,y+3);y+=7;
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
    doc.text('- Distribute awareness communications explaining why training is required and what will change',mg+4,y+2);y+=5;
    doc.text('- Conduct readiness assessment to baseline current proficiency levels',mg+4,y+2);y+=5;
    doc.text('- Share pre-work materials and system access instructions',mg+4,y+2);y+=7;

    // Core training
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text('Phase 2: Core Training',mg,y+3);y+=7;
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
    if(objs.length){
      doc.text('Learning objectives:',mg+4,y+2);y+=5;
      objs.forEach(obj=>{const oLines=doc.splitTextToSize('- '+obj,w-36);doc.text(oLines,mg+8,y+2);y+=2+oLines.length*4;});
    }else{doc.text('- Learning objectives to be defined with SME input',mg+4,y+2);y+=5;}
    doc.text('Delivery method: '+(kr.L1?.method||_trainingModality(sh)),mg+4,y+2);y+=5;
    doc.text('Timing: '+(kr.L1?.timing||'To be scheduled based on go-live date'),mg+4,y+2);y+=7;

    // Post-training
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text('Phase 3: Post-Training Reinforcement',mg,y+3);y+=7;
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
    if(rn.activities){const rLines=doc.splitTextToSize('- Reinforcement activities: '+rn.activities,w-36);doc.text(rLines,mg+4,y+2);y+=2+rLines.length*4;}
    else{doc.text('- Scheduled follow-up sessions, job aids distribution, super-user office hours',mg+4,y+2);y+=5;}
    if(rn.intervals?.length){doc.text('- Check-in intervals: '+rn.intervals.join(', '),mg+4,y+2);y+=5;}
    else{doc.text('- Recommended check-ins at 7, 14, 30, and 60 days post go-live',mg+4,y+2);y+=5;}
    y+=3;

    // Evaluation
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text('Phase 4: Evaluation (Kirkpatrick Model)',mg,y+3);y+=7;
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
    doc.text('- L1 Reaction: '+(kr.L1?.method||'Post-session satisfaction survey'),mg+4,y+2);y+=5;
    doc.text('- L2 Learning: '+(kr.L2?.method||'Knowledge check / assessment'),mg+4,y+2);y+=5;
    doc.text('- L3 Behavior: '+(kr.L3?.observable||'On-the-job observation of target behaviors'),mg+4,y+2);y+=5;
    doc.text('- L4 Results: '+(kr.L4?.outcome||'Business outcome measurement against success metrics'),mg+4,y+2);y+=8;
  });

  // ── 5. Kirkpatrick Evaluation Design ──
  y=pdfCheckPage(doc,y,w,h,pg,60);
  y=pdfSection(doc,y,'5. Kirkpatrick Evaluation Design',w);
  doc.setFontSize(7);doc.setFont('helvetica','italic');doc.setTextColor(100,100,100);
  doc.text('The Kirkpatrick Model provides a four-level framework for evaluating training effectiveness, from learner reaction through business results.',mg,y+2);y+=8;
  // Consolidated L1-L4 table
  const kirkRows=shs.map(sh=>{const kr=sh.kirk||{};return[sh.name,
    kr.L1?.method||'TBD',kr.L1?.timing||'TBD',
    kr.L2?.method||'TBD',kr.L2?.assessment||'TBD',
    kirkReady(sh).toUpperCase()];});
  if(kirkRows.length){
    doc.autoTable({startY:y,head:[['Group','L1 Method','L1 Timing','L2 Method','L2 Standard','Status']],body:kirkRows,
      margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+8;
  }
  // L3/L4 table
  const l34=shs.filter(sh=>sh.kirk?.L3?.observable||sh.kirk?.L4?.outcome);
  if(l34.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);doc.text('Post-Training Measurement (L3/L4)',mg,y+3);y+=8;
    const rows34=l34.map(sh=>[sh.name,sh.kirk?.L3?.observable||'--',
      sh.kirk?.L3?.interval?(sh.kirk.L3.interval+' days post go-live'):'--',
      sh.kirk?.L4?.outcome||'--',sh.kirk?.L4?.metric||'--']);
    doc.autoTable({startY:y,head:[['Group','Observable Behavior (L3)','Observation Window','Business Outcome (L4)','Success Metric']],body:rows34,
      margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+8;
  }
  // Evaluation success criteria & remediation triggers
  y=pdfCheckPage(doc,y,w,h,pg,50);
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);doc.text('Success Criteria & Remediation Triggers',mg,y+3);y+=8;
  const evalRows=[
    ['L1: Reaction','Day of training','Satisfaction >= 4.0/5.0','If satisfaction < 3.5, conduct immediate debrief with facilitator and revise delivery approach for next session'],
    ['L2: Learning','End of training','Assessment score >= 80%','If score < 70%, schedule remediation session within 5 business days. Provide additional study materials.'],
    ['L3: Behavior','30 days post go-live','>=60% adoption of target behaviors','If observation shows <60% behavior adoption at 30 days, trigger additional coaching and super-user support'],
    ['L4: Results','60-90 days post go-live','Business KPIs trending toward target','If KPIs plateau or decline, conduct root-cause analysis and deploy targeted refresher training']
  ];
  doc.autoTable({startY:y,head:[['Level','Evaluation Timeline','Success Criteria','Remediation Trigger']],body:evalRows,
    margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2.5},columnStyles:{3:{cellWidth:55}},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 6. Reinforcement & Sustainment Schedule ──
  const reinShs=shs.filter(sh=>sh.rein?.owner||sh.rein?.activities);
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'6. Reinforcement & Sustainment Schedule',w);
  if(reinShs.length){
    const rRows=reinShs.map(sh=>[sh.name,sh.rein?.owner||'TBD',sh.rein?.activities||'TBD',
      sh.rein?.intervals?.join(', ')||'7, 14, 30, 60 days',sh.rein?.escalation||'Manager notification, then sponsor escalation']);
    doc.autoTable({startY:y,head:[['Group','Owner','Activities','Check-in Intervals','Escalation Path']],body:rRows,
      margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+8;
  }else{
    doc.setFontSize(8);doc.setTextColor(100,100,100);doc.setFont('helvetica','italic');
    doc.text('No reinforcement plans have been configured. It is strongly recommended to establish reinforcement activities for each stakeholder group.',mg,y+3);y+=10;
  }
  // Sustainment narrative
  doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  const sustNarr='Reinforcement is a critical component of sustainable adoption. Without structured follow-up, research indicates that 70% of organizational changes fail to achieve intended outcomes. Each group should have a designated reinforcement owner, defined check-in cadence, and clear escalation criteria for non-adoption.';
  const sustLines=doc.splitTextToSize(sustNarr,w-28);doc.text(sustLines,mg,y+2);y+=2+sustLines.length*4+6;

  // ── 7. Training Risk Register ──
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'7. Training Risk Register',w);
  const trainRisks=[];
  if(gaps.length){gaps.forEach(g=>{trainRisks.push([g.severity||'Medium',g.description?.substring(0,60)||'Implementation gap','Training Impact: '+(g.trainingImpact||'Potential delay'),g.status||'Open']);});}
  shs.forEach(sh=>{
    const f=sh.factors||{};
    if((f.env||3)<=2)trainRisks.push(['High','Training environment instability for '+sh.name,'May require offline alternatives or environment remediation sprint','Open']);
    if((f.window||3)<=2)trainRisks.push(['High','Insufficient training window for '+sh.name,'Consider micro-learning or staggered rollout to compress delivery timeline','Open']);
    if(kirkReady(sh)==='needed')trainRisks.push(['Medium','Kirkpatrick evaluation not designed for '+sh.name,'Training effectiveness cannot be measured; remediation triggers undefined','Open']);
  });
  if(adkarK<3)trainRisks.push(['High','Knowledge gap across project ('+adkarK+'/5)','Curriculum may need significant expansion or redesign','Open']);
  if(adkarAb<3)trainRisks.push(['High','Ability gap across project ('+adkarAb+'/5)','Additional hands-on practice environments required','Open']);
  if(trainRisks.length){
    doc.autoTable({startY:y,head:[['Severity','Risk Description','Training Impact','Status']],body:trainRisks,
      margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2},
      headStyles:{fillColor:[184,50,50],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+8;
  }else{
    doc.setFontSize(8);doc.setTextColor(29,104,64);doc.setFont('helvetica','normal');
    doc.text('No training-specific risks identified at this time. Continue monitoring adoption factors and evaluation results.',mg,y+3);y+=10;
  }

  // ── 8. Training Team & Resources ──
  const trainRes=RES_ROLES.filter(ro=>['ocm_train','smes'].includes(ro.key))
    .flatMap(ro=>(p.resources?.[ro.key]||[]).filter(r2=>r2.name).map(r2=>([ro.label,r2.name,r2.contact||''])));
  if(trainRes.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'8. Training Team & Resources',w);
    doc.autoTable({startY:y,head:[['Role','Name','Contact']],body:trainRes,
      margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  pdfFooter(doc,w,h,pg[0]);
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);}
  toggleGenMenu();
  }catch(e){console.error('Training Plan PDF:',e);alert('Error generating PDF: '+e.message);}
}

function genCommsPlan(){
  if(!window.jspdf){alert('PDF library is still loading.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  try{
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];const mg=14;
  const brand=getBrand();
  pdfCover(doc,w,h,'Communications Plan',fwName()+'-Aligned Messaging Strategy',p,r,brand);

  const scores=p.adkarScores||{};const shs=p.stakeholders||[];const igs=(p.impactAssessment?.groups)||[];
  const dims=getActiveDims();
  const gapDims=dims.filter(d=>(scores[d.key]||3)<3);
  const goLive=r.golive||p.golive||null;

  // ── 1. Executive Summary ──
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  y=pdfSection(doc,y,'1. Executive Summary',w);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  const posture=gapDims.length>=3?'proactive and intensive':gapDims.length>=1?'targeted':'sustainment-focused';
  let commsExec='The communications strategy for '+p.name+' is '+posture+', addressing '+shs.length+' stakeholder group'+(shs.length!==1?'s':'')+'. ';
  if(gapDims.length>0){
    commsExec+='Key '+fwShort()+' gaps requiring communication attention: '+gapDims.map(d=>d.word+' ('+((scores[d.key])||3)+'/5)').join(', ')+'. ';
    commsExec+='Communications must prioritize closing these gaps through targeted messaging before the change can proceed successfully.';
  }else{
    commsExec+='All '+fwShort()+' dimensions are at acceptable levels (3+/5). The communication approach should focus on sustaining momentum, reinforcing key messages, and celebrating early wins.';
  }
  const commsExecLines=doc.splitTextToSize(commsExec,w-28);doc.text(commsExecLines,mg,y+3);y+=3+commsExecLines.length*4+6;

  // Key themes
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);doc.text('Key Communication Themes:',mg,y+3);y+=7;
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
  const themes=['Why: The business case for change and consequences of inaction',
    'What: Specific impacts by role, process changes, and timeline',
    'How: Training availability, support resources, and transition path',
    'When: Key milestones, preparation activities, and go-live logistics',
    'Who: Points of contact, escalation paths, and support channels'];
  themes.forEach(t=>{doc.text('- '+t,mg+4,y+2);y+=5;});
  y+=4;

  // ── 2. Key Message Framework ──
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,'2. Key Message Framework',w);
  doc.setFontSize(7);doc.setFont('helvetica','italic');doc.setTextColor(100,100,100);
  doc.text('Messages are aligned to the '+fwName()+' model. Each dimension addresses a distinct communication need in the adoption journey.',mg,y+2);y+=8;

  const msgFramework=dims.map(d=>{
    const mf=ADKAR_MSG_FOCUS[d.key]||{focus:'General messaging',channel:'Multiple channels'};
    const val=scores[d.key]||3;
    const timing=d.key==='A1'||d.key==='d1'||d.key==='d6'?'8-12 weeks before go-live':
                 d.key==='D'||d.key==='d2'||d.key==='d7'?'6-8 weeks before go-live':
                 d.key==='K'||d.key==='d3'||d.key==='d8'?'4-6 weeks before go-live':
                 d.key==='Ab'||d.key==='d4'?'2-4 weeks before go-live':
                 'Go-live through 90 days post';
    const measure=d.key==='A1'||d.key==='d1'||d.key==='d6'?'Survey: 80%+ can articulate reason for change':
                  d.key==='D'||d.key==='d2'||d.key==='d7'?'Manager feedback: 70%+ express willingness':
                  d.key==='K'||d.key==='d3'||d.key==='d8'?'Pre-assessment: 80%+ know where to access training':
                  d.key==='Ab'||d.key==='d4'?'Training completion >= 90%':
                  'Pulse survey: reinforcement score >= 3.5/5';
    const audiences=val<3?'All groups (priority: at-risk groups)':'All groups';
    return[d.word+' ('+val+'/5)',mf.focus,audiences,mf.channel,timing,measure];
  });
  doc.autoTable({startY:y,head:[['Dimension','Core Message','Target Audience','Channel','Timing','Success Measure']],body:msgFramework,
    margin:{left:mg,right:mg},styles:{fontSize:6,cellPadding:2},columnStyles:{1:{cellWidth:30},5:{cellWidth:30}},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},
    didDrawCell:(data)=>{
      if(data.section==='body'&&data.column.index===0){
        const val=scores[dims[data.row.index]?.key]||3;
        const c=val>=4?[29,104,64]:val>=3?[184,146,42]:[184,50,50];
        doc.setTextColor(c[0],c[1],c[2]);
      }
    },
    didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 3. Audience Segmentation Matrix ──
  if(shs.length){
    y=pdfCheckPage(doc,y,w,h,pg,40);
    y=pdfSection(doc,y,'3. Audience Segmentation Matrix',w);
    const audRows=shs.map(sh=>{
      const sc=adoptScore(sh.factors);const t=adoptTier(sc);
      const ig=igs.find(g=>g.name===sh.name);
      const lowestFactor=AF.length?AF.reduce((min,f)=>(sh.factors?.[f.key]||3)<(sh.factors?.[min.key]||3)?f:min,AF[0]):null;
      const prefChannel=sc<40?'1:1 meetings, small group sessions':sc<60?'Town halls, team meetings':'Email, intranet, all-hands';
      const freq=sc<40?'Weekly':'Bi-weekly';
      const concern=lowestFactor?lowestFactor.label:'General readiness';
      const resistRisk=sc<40?'High':sc<60?'Medium':'Low';
      return[sh.name,ig?.level||'--',prefChannel,freq,concern,resistRisk,t.tier];
    });
    doc.autoTable({startY:y,head:[['Audience','Impact','Preferred Channel','Frequency','Key Concern','Resistance Risk','Risk Tier']],body:audRows,
      margin:{left:mg,right:mg},styles:{fontSize:6,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  // ── 4. Communication Calendar ──
  y=pdfCheckPage(doc,y,w,h,pg,70);
  y=pdfSection(doc,y,'4. Communication Calendar',w);
  doc.setFontSize(7);doc.setFont('helvetica','italic');doc.setTextColor(100,100,100);
  const calNote=goLive?'Timeline is anchored to the go-live date of '+goLive+'. Adjust as needed if the date shifts.':'Go-live date is TBD. Timeline below uses relative weeks. Set a go-live date to generate specific dates.';
  doc.text(calNote,mg,y+2);y+=8;
  const calRows=[
    ['12+ weeks','Executive sponsor announcement; vision cascade to senior leadership; change network mobilization','Executive Sponsor','Email, town hall'],
    ['8-10 weeks','Department-level town halls; FAQ distribution; impact briefings by group; manager toolkit delivery','OCM Lead, Managers','Town halls, email, intranet'],
    ['6 weeks','Training awareness campaign; schedule publication; pre-work distribution; role-specific impact summaries','Training Lead','Email, LMS, intranet'],
    ['4 weeks','Detailed role-specific change impacts; system access instructions; support channel announcement','OCM Lead','Team meetings, email'],
    ['2 weeks','Final readiness check communications; go-live logistics guide; hypercare support plan overview','Project Manager','Email, Teams/Slack'],
    ['Go-Live','Day-of support contacts; war room location/hours; known issues log; quick reference cards','Support Team','All channels'],
    ['Week 1-2 Post','Immediate feedback collection; issue resolution updates; early adopter recognition','OCM Lead','Pulse survey, email'],
    ['30 days Post','Success stories; adoption metrics dashboard; lessons learned; reinforcement reminders','OCM Lead, Sponsor','Newsletter, town hall'],
    ['60-90 days Post','Sustainment review; process optimization feedback; long-term support model announcement','OCM Lead','Town hall, intranet']
  ];
  doc.autoTable({startY:y,head:[['Timing','Activities','Owner','Channels']],body:calRows,
    margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2.5},columnStyles:{1:{cellWidth:70}},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 5. Channel Matrix ──
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,'5. Channel Matrix',w);
  const chanRows=[
    ['Email','All stakeholders','Weekly during ramp, bi-weekly post go-live','Updates, FAQs, action items','OCM Lead'],
    ['Town Hall / All-Hands','All stakeholders','Monthly; ad hoc for milestones','Vision, progress, Q&A','Executive Sponsor'],
    ['Team Meetings','Individual teams','Weekly','Role-specific impacts, concerns','Direct Managers'],
    ['Intranet / SharePoint','All stakeholders','Updated continuously','Reference docs, FAQs, job aids','OCM Lead'],
    ['1:1 Meetings','High-risk / resistant groups','As needed','Concern resolution, coaching','Managers, OCM Lead'],
    ['Teams / Slack Channel','Support network, super-users','Daily during go-live period','Real-time Q&A, issue reporting','Support Team'],
    ['Newsletter / Digest','All stakeholders','Bi-weekly','Progress highlights, success stories','OCM Lead']
  ];
  doc.autoTable({startY:y,head:[['Channel','Audience','Frequency','Content Type','Owner']],body:chanRows,
    margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 6. Feedback Loop Design ──
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,'6. Feedback Loop Design',w);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  const feedNarr='Effective communication requires structured feedback mechanisms to ensure messages are received, understood, and acted upon. The following feedback loops are designed to continuously improve the communication approach and surface emerging concerns before they escalate.';
  const feedLines=doc.splitTextToSize(feedNarr,w-28);doc.text(feedLines,mg,y+2);y+=2+feedLines.length*4+4;
  const feedRows=[
    ['Pulse Surveys','Bi-weekly','All groups','Quantitative sentiment and '+fwShort()+' dimension tracking','If any dimension drops below 3.0, trigger targeted messaging within 48 hours'],
    ['Manager Check-ins','Weekly','Direct managers','Qualitative feedback on team readiness and concerns','Escalate recurring themes to OCM Lead within 24 hours'],
    ['Feedback Inbox / Form','Continuous','All stakeholders','Open-ended questions, concerns, suggestions','Triage within 24 hours; publish FAQ updates weekly'],
    ['Town Hall Q&A','Monthly','All stakeholders','Live questions during sessions; written follow-up','Document all questions; publish responses within 5 business days'],
    ['Super-User Network','Weekly','Change champions','Frontline adoption observations and user struggles','Feed insights into training adjustments and communication updates']
  ];
  doc.autoTable({startY:y,head:[['Mechanism','Frequency','Audience','Data Collected','Action Protocol']],body:feedRows,
    margin:{left:mg,right:mg},styles:{fontSize:6,cellPadding:2},columnStyles:{4:{cellWidth:40}},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 7. ADKAR Assessment Summary ──
  y=pdfCheckPage(doc,y,w,h,pg,60);
  y=pdfSection(doc,y,'7. '+fwName()+' Assessment Summary',w);
  dims.forEach(d=>{
    const val=scores[d.key]||3;const note=(p.adkarNotes||{})[d.key]||'';
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text(d.word+': '+val+'/5',mg,y+4);
    const barCol=val>=4?[29,104,64]:val>=3?[184,146,42]:[184,50,50];
    pdfBar(doc,60,y+1,80,val/5*100,barCol[0],barCol[1],barCol[2]);y+=8;
    if(note){doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100,100,100);
      const nLines=doc.splitTextToSize(note,w-28);doc.text(nLines,mg+2,y+2);y+=2+nLines.length*4;}
    // Add communication recommendation per dimension
    if(val<3){
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(184,50,50);
      const mf=ADKAR_MSG_FOCUS[d.key]||{focus:'General awareness',channel:'Multiple channels'};
      doc.text('Action Required: Intensify messaging focused on "'+mf.focus+'" via '+mf.channel,mg+2,y+2);y+=6;
    }
    y+=2;
  });

  pdfFooter(doc,w,h,pg[0]);
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);}
  toggleGenMenu();
  }catch(e){console.error('Comms Plan PDF:',e);alert('Error generating PDF: '+e.message);}
}

function genResistancePlan(){
  if(!window.jspdf){alert('PDF library is still loading.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  try{
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];const mg=14;
  const brand=getBrand();
  pdfCover(doc,w,h,'Resistance Management Plan','Risk Mitigation & Adoption Sustainment Strategy',p,r,brand);

  const flags=getProjFlags(p);const shs=p.stakeholders||[];
  const critSH=shs.filter(sh=>adoptScore(sh.factors)<60);
  const adkar=parseFloat(projAdkarAvg(p));
  const gaps=(p.gapAnalysis?.gaps||[]).filter(g=>g.description);
  const critGaps=gaps.filter(g=>g.severity==='Critical');
  const adkarGaps=getActiveDims().filter(d=>(p.adkarScores?.[d.key]||3)<3);

  // ── 1. Executive Summary ──
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  y=pdfSection(doc,y,'1. Executive Summary',w);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  const resistPosture=critSH.length>=3||critGaps.length>0?'critical':critSH.length>=1?'elevated':'manageable';
  let resistExec='The resistance posture for '+p.name+' is currently assessed as '+resistPosture+'. ';
  resistExec+='Of '+shs.length+' stakeholder group'+(shs.length!==1?'s':'')+', '+critSH.length+' exhibit adoption likelihood below 60%, indicating active or emerging resistance. ';
  if(flags.length)resistExec+=flags.length+' active risk flag'+(flags.length!==1?'s require':' requires')+' attention. ';
  if(critGaps.length)resistExec+=critGaps.length+' critical implementation gap'+(critGaps.length!==1?'s compound':' compounds')+' the resistance risk. ';
  resistExec+=fwShort()+' average is '+adkar+'/5'+(adkar<3?', which is below the minimum threshold for proceeding and signals systemic readiness gaps':'')+'. ';
  // Priority actions
  const priorities=[];
  if(critSH.length)priorities.push('Deploy targeted interventions for '+critSH.length+' at-risk group'+(critSH.length!==1?'s':''));
  if(flags.length)priorities.push('Resolve '+flags.length+' active risk flag'+(flags.length!==1?'s':''));
  if(adkar<3)priorities.push('Address '+fwShort()+' gaps through intensive stakeholder engagement');
  if(priorities.length)resistExec+='Recommended priority actions: '+priorities.join('; ')+'.';
  const resistExecLines=doc.splitTextToSize(resistExec,w-28);doc.text(resistExecLines,mg,y+3);y+=3+resistExecLines.length*4+6;

  // ── 2. Resistance Root Cause Analysis ──
  if(critSH.length){
    y=pdfCheckPage(doc,y,w,h,pg,40);
    y=pdfSection(doc,y,'2. Resistance Root Cause Analysis',w);
    doc.setFontSize(7);doc.setFont('helvetica','italic');doc.setTextColor(100,100,100);
    doc.text('Root causes are derived from the lowest adoption factor per group. Interventions are prioritized by severity.',mg,y+2);y+=8;
    critSH.forEach(sh=>{
      y=pdfCheckPage(doc,y,w,h,pg,60);
      const sc=adoptScore(sh.factors);
      const sorted=AF.map(a=>({key:a.key,label:a.label,val:sh.factors?.[a.key]||3})).sort((a,b)=>a.val-b.val);
      const rootKey=sorted[0]?.key||'resistance';
      const rootCause=_resistRootCause(rootKey);
      const severity=sc<40?'Critical':'High';

      doc.setFontSize(9);doc.setFont('helvetica','bold');
      doc.setTextColor(sc<40?184:180,sc<40?50:130,sc<40?50:30);
      doc.text(sh.name+' -- '+sc+'% Adoption Likelihood',mg,y+4);y+=9;

      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
      doc.text('Root Cause: '+rootCause,mg+4,y+3);y+=6;
      doc.text('Severity: '+severity,mg+4,y+3);y+=6;
      doc.text('Primary Barrier: '+sorted[0].label+' ('+sorted[0].val+'/5)',mg+4,y+3);y+=8;

      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
      doc.text('Recommended Interventions:',mg+4,y+2);y+=5;
      const interventions=_resistDetailedIntervention(rootKey);
      interventions.forEach(iv=>{const ivLines=doc.splitTextToSize('- '+iv,w-36);doc.text(ivLines,mg+8,y+2);y+=2+ivLines.length*4;});
      y+=6;
    });
  }

  // ── 3. Intervention Strategy Matrix ──
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,'3. Intervention Strategy Matrix',w);
  const intRows=[];
  const resistTypes={resistance:'Active Opposition',env:'Technical Barriers',window:'Time Constraints',complexity:'Role Anxiety',saturation:'Change Fatigue',leadership:'Sponsor Gap'};
  const resistIndicators={resistance:'Vocal objections, non-participation, workarounds',env:'System errors, access issues, environment complaints',
    window:'Schedule conflicts, training no-shows, overtime concerns',complexity:'Confusion about new processes, error rates, help desk volume',
    saturation:'Disengagement, apathy, "another change" sentiment',leadership:'Lack of visible support, conflicting priorities, mixed messages'};
  const resistTimelines={resistance:'Immediate (within 1 week)',env:'2-4 weeks (environment sprint)',window:'1-2 weeks (schedule adjustment)',
    complexity:'2-3 weeks (support deployment)',saturation:'Ongoing (change sequencing)',leadership:'1-2 weeks (sponsor activation)'};
  const resistOwners={resistance:'OCM Lead + Executive Sponsor',env:'Technical Lead + Training Lead',window:'Project Manager + OCM Lead',
    complexity:'Training Lead + Super-Users',saturation:'OCM Lead + Project Manager',leadership:'Executive Sponsor + OCM Lead'};
  const resistMeasures={resistance:'Reduction in escalations; participation rates increase to 80%+',env:'Environment uptime >= 99%; zero training disruptions',
    window:'100% of training sessions delivered as scheduled',complexity:'Help desk volume decreases 50% within 30 days post go-live',
    saturation:'Engagement scores stabilize or improve in pulse surveys',leadership:'Sponsor visibility actions completed per schedule'};
  Object.keys(resistTypes).forEach(key=>{
    const affectedGroups=shs.filter(sh=>{const sorted=AF.map(a=>({k:a.key,v:sh.factors?.[a.key]||3})).sort((a,b)=>a.v-b.v);return sorted[0]?.k===key&&sorted[0]?.v<=2;});
    if(affectedGroups.length||critSH.some(sh=>(sh.factors?.[key]||3)<=2)){
      intRows.push([resistTypes[key],resistIndicators[key],RESIST_INTERVENTIONS[key]||'Targeted intervention',resistOwners[key],resistTimelines[key],resistMeasures[key]]);
    }
  });
  if(intRows.length===0){
    // Add generic rows if no specific resistance detected
    intRows.push(['General Resistance','Low engagement signals','Proactive stakeholder engagement and communication','OCM Lead','Ongoing','Pulse survey scores >= 3.5/5']);
  }
  doc.autoTable({startY:y,head:[['Resistance Type','Indicators','Intervention','Owner','Timeline','Success Measure']],body:intRows,
    margin:{left:mg,right:mg},styles:{fontSize:6,cellPadding:2},columnStyles:{1:{cellWidth:28},2:{cellWidth:30}},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 4. Coaching Conversation Guide ──
  y=pdfCheckPage(doc,y,w,h,pg,70);
  y=pdfSection(doc,y,'4. Coaching Conversation Guide',w);
  doc.setFontSize(7);doc.setFont('helvetica','italic');doc.setTextColor(100,100,100);
  doc.text('Use these guides for structured 1:1 conversations with resistant stakeholders. Adapt language to the specific context and relationship.',mg,y+2);y+=8;

  const topResistAreas=AF.map(a=>{
    const avgVal=shs.length?shs.reduce((s,sh)=>s+(sh.factors?.[a.key]||3),0)/shs.length:3;
    return{key:a.key,label:a.label,avg:avgVal};
  }).sort((a,b)=>a.avg-b.avg).slice(0,3);

  const coachGuides={
    resistance:{open:'What concerns do you have about this change that we haven\'t addressed yet?',
      points:['Acknowledge that their concerns are valid and important','Share specific benefits relevant to their daily work','Provide examples of how similar changes succeeded in other organizations','Offer a direct line to leadership for unresolved concerns'],
      empathy:'I understand this feels like a lot to take on, especially given everything else on your plate.',
      commit:'Can we agree to try the new approach for two weeks and then check in on how it\'s going?'},
    env:{open:'What has your experience been with the system or tools so far?',
      points:['Document specific technical issues they\'ve encountered','Commit to concrete resolution timelines','Offer alternative methods if the primary system is unreliable','Connect them with technical support resources'],
      empathy:'It\'s frustrating when the tools don\'t work as expected. That\'s on us to fix.',
      commit:'I\'ll have the technical team address these issues by [date]. Can we reconnect then to verify?'},
    window:{open:'How is the timeline feeling for your team? Where are the pressure points?',
      points:['Explore which specific time constraints are most impactful','Discuss options for schedule flexibility or phased adoption','Identify which training elements are most critical for Day 1','Offer micro-learning alternatives that fit into existing schedules'],
      empathy:'I hear you -- the timeline is tight, and I don\'t want your team to feel set up to fail.',
      commit:'Let\'s identify the three most critical skills for go-live and focus there first. Sound fair?'},
    complexity:{open:'On a scale of 1-10, how confident does your team feel about the new processes?',
      points:['Break down the change into smaller, manageable components','Identify which aspects of the change feel most overwhelming','Offer simplified job aids and quick-reference guides','Connect them with super-users who can provide peer support'],
      empathy:'Change of this magnitude is genuinely challenging. Your concern about your team\'s ability to adapt shows strong leadership.',
      commit:'I\'ll arrange a dedicated practice session for your team. Can you identify 2-3 people who could become your team\'s go-to experts?'},
    saturation:{open:'How many changes is your team managing right now? Let\'s map them out.',
      points:['Create a visible change portfolio showing all concurrent initiatives','Identify which changes can be sequenced or consolidated','Advocate for their team in change prioritization discussions','Provide a single point of coordination across initiatives'],
      empathy:'I can see your team is carrying a heavy load. We need to be thoughtful about how we layer this on.',
      commit:'Let me work with the PMO to see if we can stagger some of these initiatives. I\'ll report back by [date].'},
    leadership:{open:'How are you communicating the change to your team? What support would help?',
      points:['Provide pre-built talking points and presentation materials','Offer to co-facilitate team sessions with the manager','Connect them directly with the executive sponsor for alignment','Share data and success stories that build confidence in the change'],
      empathy:'Leading through change is one of the hardest parts of management. We\'re here to support you, not add to your burden.',
      commit:'Let\'s schedule a 30-minute prep session before your next team meeting so you feel fully equipped.'}
  };

  topResistAreas.forEach(area=>{
    y=pdfCheckPage(doc,y,w,h,pg,50);
    const guide=coachGuides[area.key]||coachGuides.resistance;
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text('Coaching Guide: '+area.label+' (avg '+area.avg.toFixed(1)+'/5)',mg,y+3);y+=8;

    doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(60,60,60);
    doc.text('Opening Question:',mg+4,y+2);y+=5;
    doc.setFont('helvetica','normal');const oLines=doc.splitTextToSize('"'+guide.open+'"',w-36);doc.text(oLines,mg+8,y+2);y+=2+oLines.length*4+2;

    doc.setFont('helvetica','bold');doc.text('Key Talking Points:',mg+4,y+2);y+=5;
    doc.setFont('helvetica','normal');
    guide.points.forEach(pt=>{doc.text('- '+pt,mg+8,y+2);y+=5;});y+=2;

    doc.setFont('helvetica','bold');doc.text('Empathy Statement:',mg+4,y+2);y+=5;
    doc.setFont('helvetica','normal');doc.setFont('helvetica','italic');
    const eLines=doc.splitTextToSize('"'+guide.empathy+'"',w-36);doc.text(eLines,mg+8,y+2);y+=2+eLines.length*4+2;
    doc.setFont('helvetica','normal');

    doc.setFont('helvetica','bold');doc.text('Commitment Ask:',mg+4,y+2);y+=5;
    doc.setFont('helvetica','normal');const cLines=doc.splitTextToSize('"'+guide.commit+'"',w-36);doc.text(cLines,mg+8,y+2);y+=2+cLines.length*4+6;
  });

  // ── 5. Escalation Framework ──
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,'5. Escalation Framework',w);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  const escNarr='Not all resistance can be resolved at the peer level. The following escalation framework provides a structured approach to addressing resistance that persists beyond initial interventions.';
  const escLines=doc.splitTextToSize(escNarr,w-28);doc.text(escLines,mg,y+2);y+=2+escLines.length*4+4;
  const escRows=[
    ['Level 1','Peer Support / Super-User Network','Individual expresses confusion or minor frustration','Within 24 hours','Super-user provides hands-on support, shares job aids, answers questions','Issue resolved; user demonstrates competency'],
    ['Level 2','Manager 1:1 Coaching','Resistance persists after peer support; pattern of non-adoption','Within 48 hours','Manager conducts coaching conversation using guide above; documents concerns','Agreed action plan; commitment to try for defined period'],
    ['Level 3','Sponsor Intervention','Manager unable to resolve; group-level resistance; vocal opposition','Within 1 week','Sponsor meets with group; addresses systemic concerns; removes barriers','Visible reduction in resistance behaviors; participation resumes'],
    ['Level 4','Executive Escalation','Resistance threatens project timeline or success; cross-group impact','Immediate','Executive leadership addresses organizational barriers; may adjust scope/timeline','Strategic decision on path forward; formal remediation plan']
  ];
  doc.autoTable({startY:y,head:[['Level','Mechanism','Trigger Criteria','Response Time','Actions','Success Indicator']],body:escRows,
    margin:{left:mg,right:mg},styles:{fontSize:6,cellPadding:2},columnStyles:{4:{cellWidth:35}},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 6. Progress Indicators ──
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'6. Progress Indicators',w);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  const progNarr='Resistance reduction should be measured continuously using both quantitative and qualitative indicators. The following metrics should be tracked weekly during the transition period and bi-weekly during sustainment.';
  const progLines=doc.splitTextToSize(progNarr,w-28);doc.text(progLines,mg,y+2);y+=2+progLines.length*4+4;
  const progRows=[
    ['Adoption Factor Scores','Per group','Weekly','Upward trend in lowest factors; all factors >= 3/5','AdoptIQ dashboard'],
    ['Pulse Survey Sentiment','All groups','Bi-weekly','Average score >= 3.5/5 across all dimensions','Pulse survey tool'],
    ['Training Participation','Per group','Per session','>=90% attendance; <=5% no-show rate','LMS / attendance records'],
    ['Help Desk Volume','All groups','Weekly','Decreasing trend after Week 2 post go-live','Ticketing system'],
    ['Escalation Count','All groups','Weekly','Decreasing trend; zero Level 4 escalations','Escalation log'],
    ['Manager Feedback','Per group','Weekly','Qualitative improvement in team readiness reports','Manager check-in notes']
  ];
  doc.autoTable({startY:y,head:[['Indicator','Scope','Frequency','Target','Data Source']],body:progRows,
    margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 7. Active Risk Flags ──
  if(flags.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'7. Active Risk Flags',w);
    const fRows=flags.map(f=>[f.gate||'',f.item||'',f.consequence||'',f.defOwner||'Unassigned']);
    doc.autoTable({startY:y,head:[['Gate','Gap Item','Consequence','Owner']],body:fRows,
      margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[184,50,50],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  // ── 8. ADKAR Barrier Analysis ──
  if(adkarGaps.length){
    y=pdfCheckPage(doc,y,w,h,pg,40);
    y=pdfSection(doc,y,'8. '+fwShort()+' Barrier Analysis',w);
    adkarGaps.forEach(d=>{
      y=pdfCheckPage(doc,y,w,h,pg,25);
      const val=p.adkarScores[d.key];const note=(p.adkarNotes||{})[d.key]||'';
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(184,50,50);
      doc.text(d.word+': '+val+'/5',mg,y+4);
      const barCol=[184,50,50];pdfBar(doc,55,y+1,90,val/5*100,barCol[0],barCol[1],barCol[2]);y+=8;
      if(note){doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(80,80,80);
        const nLines=doc.splitTextToSize('Context: '+note,w-28);doc.text(nLines,mg+2,y+2);y+=2+nLines.length*4+2;}
      // Add recommended action
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(12,31,63);
      const mf=ADKAR_MSG_FOCUS[d.key]||{focus:'General remediation',channel:'Multiple channels'};
      const actionText='Recommended Action: Intensify '+mf.focus.toLowerCase()+' messaging via '+mf.channel.toLowerCase()+'. Target score improvement to 3/5 minimum before go-live.';
      const actLines=doc.splitTextToSize(actionText,w-28);doc.text(actLines,mg+2,y+2);y+=2+actLines.length*4+4;
    });
  }

  // ── 9. Reinforcement Plans ──
  const reinShs=shs.filter(sh=>sh.rein?.owner);
  if(reinShs.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'9. Reinforcement Plans',w);
    const rRows=reinShs.map(sh=>[sh.name,sh.rein.owner,sh.rein.activities||'',
      sh.rein.intervals?.join(', ')||'',sh.rein.escalation||'']);
    doc.autoTable({startY:y,head:[['Group','Owner','Activities','Intervals','Escalation']],body:rRows,
      margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  pdfFooter(doc,w,h,pg[0]);
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);}
  toggleGenMenu();
  }catch(e){console.error('Resistance Plan PDF:',e);alert('Error generating PDF: '+e.message);}
}

function genReadinessRec(){
  if(!window.jspdf){alert('PDF library is still loading.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  try{
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];const mg=14;
  const brand=getBrand();const rec=calcReadinessRec(p);
  pdfCover(doc,w,h,'Adoption Readiness Recommendation','Gate Review Assessment',p,r,brand);

  const gate=projGateScore(p);const adkar=parseFloat(projAdkarAvg(p));
  const flags=getProjFlags(p);const shs=p.stakeholders||[];
  const gaps=(p.gapAnalysis?.gaps||[]).filter(g=>g.description);
  const critGaps=gaps.filter(g=>g.severity==='Critical');
  const goLive=r.golive||p.golive||null;
  const dims=getActiveDims();
  const kirkPct=shs.length?Math.round(shs.filter(sh=>kirkReady(sh)==='ready').length/shs.length*100):0;
  const reinPct=shs.length?Math.round(shs.filter(sh=>reinReady(sh)==='ready').length/shs.length*100):0;
  const pulseData=p.pulseResults;
  const avgAdopt=shs.length?Math.round(shs.reduce((s,sh)=>s+adoptScore(sh.factors),0)/shs.length):0;

  // ── 1. Executive Summary ──
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  y=pdfSection(doc,y,'1. Executive Summary',w);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  let recExec='Based on a comprehensive analysis of gate readiness ('+(gate||0)+'%), '+fwShort()+' assessment ('+adkar+'/5), '+
    shs.length+' stakeholder group'+(shs.length!==1?'s':'')+', '+flags.length+' active risk flag'+(flags.length!==1?'s':'')+', and '+
    gaps.length+' implementation gap'+(gaps.length!==1?'s':'')+', ';
  if(rec.status==='READY')recExec+='the recommendation is to PROCEED with the '+p.name+' go-live as planned. All readiness criteria are met, and the organization demonstrates sufficient preparedness for a successful transition. Continued monitoring through pulse surveys and 30/60/90 day reviews is recommended.';
  else if(rec.status==='NOT_READY')recExec+='the recommendation is to DELAY the '+p.name+' go-live. Critical readiness gaps exist that, if unaddressed, present substantial risk of adoption failure. A structured remediation plan with defined milestones is required before reassessment.';
  else recExec+='the recommendation is to PROCEED WITH CONDITIONS for '+p.name+'. The organization shows partial readiness but specific gaps must be addressed prior to or immediately following go-live to mitigate adoption risk. Conditions are detailed below.';
  const recExecLines=doc.splitTextToSize(recExec,w-28);doc.text(recExecLines,mg,y+3);y+=3+recExecLines.length*4+6;

  // ── 2. Recommendation Status ──
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'2. Recommendation',w);
  doc.setFillColor(rec.color[0],rec.color[1],rec.color[2]);
  doc.roundedRect(mg,y+2,w-28,22,3,3,'F');
  doc.setFontSize(16);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
  doc.text(rec.label.toUpperCase(),w/2,y+12,{align:'center'});
  doc.setFontSize(8);doc.setFont('helvetica','normal');
  const statusSub=rec.status==='READY'?'All readiness gates passed. Organization is prepared for transition.':
    rec.status==='NOT_READY'?'Critical gaps identified. Remediation required before proceeding.':
    'Partial readiness achieved. Specific conditions must be met.';
  doc.text(statusSub,w/2,y+19,{align:'center'});
  y+=32;

  // ── 3. Evidence Dashboard ──
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,'3. Evidence Dashboard',w);
  const metrics=[
    ['Gate Readiness',(gate||0)+'%',gate>=80?'Pass':gate>=50?'Marginal':'Fail'],
    [fwShort()+' Average',adkar+'/5',adkar>=3.5?'Pass':adkar>=2.5?'Marginal':'Fail'],
    ['Active Risk Flags',flags.length+'',flags.length===0?'Pass':flags.length<=2?'Marginal':'Fail'],
    ['Open Gaps',gaps.length+' ('+critGaps.length+' critical)',critGaps.length===0?'Pass':'Fail'],
    ['Stakeholder Groups',shs.length+' (avg '+avgAdopt+'% adoption)',avgAdopt>=60?'Pass':avgAdopt>=40?'Marginal':'Fail'],
    ['Training Readiness',kirkPct+'% Kirk. complete',kirkPct>=75?'Pass':kirkPct>=40?'Marginal':'Fail'],
    ['Reinforcement Coverage',reinPct+'% of groups covered',reinPct>=75?'Pass':reinPct>=40?'Marginal':'Fail']
  ];
  if(pulseData?.length){
    const latestPulse=pulseData[pulseData.length-1];
    const pulseDims=Object.values(latestPulse.scores||{});
    const pulseAvg=pulseDims.length?Math.round(pulseDims.reduce((a,b)=>a+b,0)/pulseDims.length*10)/10:0;
    metrics.push(['Pulse Survey Response',pulseAvg+'/5 (latest)',pulseAvg>=3.5?'Pass':pulseAvg>=2.5?'Marginal':'Fail']);
  }
  doc.autoTable({startY:y,head:[['Metric','Value','Assessment']],body:metrics,
    margin:{left:mg,right:mg},styles:{fontSize:8,cellPadding:3},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},
    didDrawCell:(data)=>{
      if(data.section==='body'&&data.column.index===2){
        const val=data.cell.raw;
        if(val==='Pass')doc.setTextColor(29,104,64);
        else if(val==='Marginal')doc.setTextColor(184,146,42);
        else if(val==='Fail')doc.setTextColor(184,50,50);
      }
    },
    didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 4. Conditions for Proceeding ──
  if(rec.status==='CONDITIONAL'){
    y=pdfCheckPage(doc,y,w,h,pg,50);
    y=pdfSection(doc,y,'4. Conditions for Proceeding',w);
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
    const condNarr='The following conditions must be resolved prior to or immediately following go-live. Each condition represents a gap that, if unaddressed, increases the probability of adoption failure.';
    const condLines=doc.splitTextToSize(condNarr,w-28);doc.text(condLines,mg,y+2);y+=2+condLines.length*4+4;
    const conditions=[];
    if(flags.length)conditions.push(['Resolve Risk Flags','Resolve '+flags.length+' active risk flag'+(flags.length!==1?'s':'')+' identified in the gate review','Before go-live','Project team']);
    if(adkar<3.5){
      const lowDims=dims.filter(d=>(p.adkarScores?.[d.key]||3)<3);
      if(lowDims.length)conditions.push(['Improve '+fwShort()+' Scores','Raise '+lowDims.map(d=>d.word).join(', ')+' score'+(lowDims.length!==1?'s':'')+' to minimum 3/5','Before go-live','OCM Lead']);
    }
    if(gate<80)conditions.push(['Complete Gate Items','Advance gate readiness from '+(gate||0)+'% to minimum 80%','Before go-live','Project Manager']);
    const atRisk=shs.filter(sh=>adoptScore(sh.factors)<60);
    if(atRisk.length)conditions.push(['Address At-Risk Groups','Deploy targeted interventions for '+atRisk.map(sh=>sh.name).join(', '),'Before go-live','OCM Lead']);
    if(kirkPct<75)conditions.push(['Complete Evaluation Design','Advance Kirkpatrick evaluation design from '+kirkPct+'% to 75%+ completion','Before go-live','Training Lead']);
    if(reinPct<50)conditions.push(['Establish Reinforcement Plans','Configure reinforcement plans for '+Math.round((1-reinPct/100)*shs.length)+' remaining group'+(Math.round((1-reinPct/100)*shs.length)!==1?'s':''),'Before go-live','OCM Lead']);
    if(conditions.length){
      doc.autoTable({startY:y,head:[['Condition','Requirement','Deadline','Owner']],body:conditions,
        margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2.5},columnStyles:{1:{cellWidth:60}},
        headStyles:{fillColor:[184,146,42],textColor:[255,255,255],fontStyle:'bold'},
        alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
      y=doc.lastAutoTable.finalY+10;
    }
  }

  // ── 5. Risk-Adjusted Timeline ──
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'5. Risk-Adjusted Timeline Assessment',w);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  if(goLive){
    const daysLeft=Math.ceil((new Date(goLive)-new Date())/86400000);
    let timeNarr='The go-live date is set for '+goLive+' ('+daysLeft+' days from today). ';
    if(rec.status==='READY')timeNarr+='Based on current readiness scores, the timeline is achievable. No adjustments recommended.';
    else if(rec.status==='NOT_READY'){
      const remedWeeks=Math.max(4,Math.ceil((flags.length*5+critGaps.length*10)/5));
      timeNarr+='Based on the volume of unresolved gaps and risk flags, a minimum of '+remedWeeks+' additional weeks is recommended for remediation before re-assessment. ';
      timeNarr+='A revised go-live target of approximately '+(remedWeeks)+' weeks from today would allow adequate time to address critical barriers.';
    }else{
      timeNarr+='The timeline is tight given the conditions that must be met. ';
      if(daysLeft<14)timeNarr+='With only '+daysLeft+' days remaining, achieving all conditions is at high risk. Consider a 2-4 week extension.';
      else if(daysLeft<30)timeNarr+='The remaining '+daysLeft+' days should be sufficient if remediation begins immediately and is tracked daily.';
      else timeNarr+='There is adequate time to address the conditions if action begins within the next 5 business days.';
    }
    const timeLines=doc.splitTextToSize(timeNarr,w-28);doc.text(timeLines,mg,y+2);y+=2+timeLines.length*4+6;
  }else{
    doc.text('Go-live date has not been set. Set a go-live date to enable risk-adjusted timeline analysis.',mg,y+3);y+=10;
  }

  // ── 6. Contingency Triggers ──
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'6. Contingency Triggers',w);
  doc.setFontSize(7);doc.setFont('helvetica','italic');doc.setTextColor(100,100,100);
  doc.text('These triggers should be monitored continuously. If any condition is met, the corresponding action should be initiated immediately.',mg,y+2);y+=8;
  const trigRows=[
    ['Any group adoption score drops below 40%','2 weeks before go-live','Recommend delayed rollout for affected group; deploy intensive 1:1 coaching','OCM Lead + Sponsor'],
    ['Training completion below 80%','1 week before go-live','Extend training window; schedule mandatory catch-up sessions; deploy self-paced alternatives','Training Lead'],
    [fwShort()+' average drops below 2.5/5','Any time','Initiate emergency stakeholder engagement; consider scope reduction or phased rollout','OCM Lead + PM'],
    ['3+ new critical gaps identified','Any time','Convene emergency steering committee; reassess go-live viability','Project Manager'],
    ['Sponsor engagement drops or conflicting messages detected','Any time','Escalate to executive leadership; realign sponsorship coalition','OCM Lead'],
    ['Help desk volume exceeds capacity post go-live','Week 1 post go-live','Deploy additional support resources; extend hypercare period; communicate revised support hours','Support Lead']
  ];
  doc.autoTable({startY:y,head:[['Trigger Condition','Monitoring Window','Response Action','Owner']],body:trigRows,
    margin:{left:mg,right:mg},styles:{fontSize:6.5,cellPadding:2},columnStyles:{2:{cellWidth:50}},
    headStyles:{fillColor:[184,50,50],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;

  // ── 7. Post-Decision Action Plan ──
  y=pdfCheckPage(doc,y,w,h,pg,60);
  y=pdfSection(doc,y,'7. Post-Decision Action Plan',w);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  if(rec.status==='READY'){
    doc.setFont('helvetica','bold');doc.setTextColor(29,104,64);doc.text('Status: READY TO PROCEED',mg,y+3);y+=8;
    doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
    const readyActions=['Proceed to go-live as scheduled','Activate hypercare support plan and war room for go-live week',
      'Monitor adoption via pulse surveys at Day 7, 14, 30','Schedule 30-day post go-live adoption review with stakeholders',
      'Schedule 60-day sustainment review with executive sponsor','Schedule 90-day value realization assessment against business KPIs',
      'Transition from project-mode to steady-state support model at 90 days','Document lessons learned and update organizational change playbook'];
    readyActions.forEach(a=>{doc.text('- '+a,mg+4,y+2);y+=5;});
  }else if(rec.status==='NOT_READY'){
    doc.setFont('helvetica','bold');doc.setTextColor(184,50,50);doc.text('Status: NOT READY -- DELAY RECOMMENDED',mg,y+3);y+=8;
    doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
    const nrActions=[];
    if(critGaps.length)nrActions.push('Resolve '+critGaps.length+' critical implementation gap'+(critGaps.length!==1?'s':'')+' -- these are blocking adoption readiness');
    if(flags.length)nrActions.push('Address '+flags.length+' active risk flag'+(flags.length!==1?'s':'')+' through targeted remediation sprints');
    if(adkar<2.5)nrActions.push('Conduct intensive stakeholder engagement to raise '+fwShort()+' scores above 2.5/5 minimum threshold');
    const atRisk=shs.filter(sh=>adoptScore(sh.factors)<40);
    if(atRisk.length)nrActions.push('Deploy resistance management interventions for critical-risk groups: '+atRisk.map(sh=>sh.name).join(', '));
    nrActions.push('Establish weekly remediation check-ins with project steering committee');
    nrActions.push('Set a reassessment date for readiness re-evaluation (recommended: 4-6 weeks)');
    nrActions.push('Communicate delay decision to stakeholders with revised timeline and rationale');
    doc.setFont('helvetica','bold');doc.text('Remediation Priorities (in order):',mg+4,y+2);y+=6;
    doc.setFont('helvetica','normal');
    nrActions.forEach((a,i)=>{const aLines=doc.splitTextToSize((i+1)+'. '+a,w-36);doc.text(aLines,mg+8,y+2);y+=2+aLines.length*4;});
  }else{
    doc.setFont('helvetica','bold');doc.setTextColor(184,146,42);doc.text('Status: PROCEED WITH CONDITIONS',mg,y+3);y+=8;
    doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
    doc.text('The following actions must be completed to satisfy the conditions identified above:',mg+4,y+2);y+=6;
    const condActions=['Assign clear owners and deadlines for each condition listed in Section 4',
      'Establish daily stand-up to track condition resolution progress','Prepare contingency plan in case conditions are not met by go-live',
      'Communicate conditional status to stakeholders with transparency about remaining work',
      'Schedule mid-point check-in to assess condition resolution progress',
      'If conditions are not met by 1 week before go-live, reconvene for go/no-go decision'];
    condActions.forEach(a=>{doc.text('- '+a,mg+8,y+2);y+=5;});
  }
  y+=6;

  // ── 8. ADKAR Readiness ──
  y=pdfCheckPage(doc,y,w,h,pg,60);
  y=pdfSection(doc,y,'8. '+fwShort()+' Readiness',w);
  dims.forEach(d=>{
    const val=p.adkarScores?.[d.key]||3;
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
    doc.text(d.word,mg,y+4);
    const c=val>=4?[29,104,64]:val>=3?[184,146,42]:[184,50,50];
    pdfBar(doc,55,y+1,90,val/5*100,c[0],c[1],c[2]);
    doc.setTextColor(c[0],c[1],c[2]);doc.text(val+'/5',150,y+4);y+=8;
  });y+=6;

  // ── 9. Stakeholder Readiness ──
  if(shs.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'9. Stakeholder Readiness Summary',w);
    const sRows=shs.map(sh=>{const sc=adoptScore(sh.factors);return[sh.name,sc+'%',adoptTier(sc).tier,_shCoalitionRole(sc),kirkReady(sh).toUpperCase(),reinReady(sh).toUpperCase()];});
    doc.autoTable({startY:y,head:[['Group','Adoption %','Risk Tier','Coalition Role','Kirkpatrick','Reinforcement']],body:sRows,
      margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2.5},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},
      didDrawCell:(data)=>{
        if(data.section==='body'&&data.column.index===1){
          const pct=parseInt(data.cell.raw);
          if(pct>=80)doc.setTextColor(29,104,64);else if(pct>=60)doc.setTextColor(184,146,42);else doc.setTextColor(184,50,50);
        }
      },
      didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  // ── 10. Risk Flags ──
  if(flags.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'10. Risk Flags Requiring Resolution',w);
    const fRows=flags.map(f=>[f.gate||'',f.item||'',f.consequence||'',f.defOwner||'Unassigned']);
    doc.autoTable({startY:y,head:[['Gate','Gap','Consequence','Owner']],body:fRows,
      margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[184,50,50],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  pdfFooter(doc,w,h,pg[0]);
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);}
  toggleGenMenu();
  }catch(e){console.error('Readiness Rec PDF:',e);alert('Error generating PDF: '+e.message);}
}

function genFullPackage(){
  if(!window.jspdf){alert('PDF library is still loading.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  alert('Generating all 5 deliverables. Each will open in a separate tab.');
  toggleGenMenu();
  setTimeout(()=>genStakeholderAnalysis(),100);
  setTimeout(()=>genTrainingPlan(),300);
  setTimeout(()=>genCommsPlan(),500);
  setTimeout(()=>genResistancePlan(),700);
  setTimeout(()=>genReadinessRec(),900);
}

// ════════════════════════════════════════════════════════
// TEAM COLLABORATION + RBAC
// ════════════════════════════════════════════════════════
let currentUserRole='owner'; // default for own releases
let isDemoMode=false;

function setDemoMode(on){
  isDemoMode=on;
  ['demo-banner-p','demo-banner-r','demo-banner-proj'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display=on?'inline-block':'none';
  });
}
function exitDemo(){
  localStorage.removeItem(storageKey());
  isDemoMode=false;
  setDemoMode(false);
  releases=[];
  showLogin();showSignin();
}

async function ensureTeam(releaseId){
  try{
    const{data,error:selErr}=await _supabase.from('teams').select('id').eq('release_id',releaseId).eq('owner_id',currentUserId).maybeSingle();
    if(selErr){console.warn('Teams table not found. Run sql/phase4_teams.sql in Supabase.',selErr.message);return null;}
    if(data)return data.id;
    const{data:newTeam,error}=await _supabase.from('teams').insert({release_id:releaseId,owner_id:currentUserId}).select('id').single();
    if(error){console.error('Create team:',error);return null;}
    return newTeam.id;
  }catch(e){console.warn('Team feature unavailable:',e);return null;}
}

function openInviteModal(){
  document.getElementById('invite-email').value='';
  document.getElementById('invite-role').value='staff';
  document.getElementById('invite-err').textContent='';
  document.getElementById('invite-modal').classList.add('open');
}

async function sendInvite(){
  const email=document.getElementById('invite-email').value.trim();
  const role=document.getElementById('invite-role').value;
  const errEl=document.getElementById('invite-err');
  if(!email){errEl.textContent='Please enter an email address.';return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){errEl.textContent='Please enter a valid email.';return;}
  const r=getRel();if(!r){errEl.textContent='No release selected.';return;}
  const teamId=await ensureTeam(r.id);
  if(!teamId){errEl.textContent='Could not create team. Try again.';return;}
  // Check for duplicate invite
  const{data:existing}=await _supabase.from('team_invites').select('id').eq('team_id',teamId).eq('email',email).is('accepted_at',null).maybeSingle();
  if(existing){errEl.textContent='An invite is already pending for this email.';return;}
  const{error}=await _supabase.from('team_invites').insert({team_id:teamId,email,role,invited_by:currentUserId});
  if(error){errEl.textContent='Failed to send invite: '+error.message;return;}
  closeModal('invite-modal');
  showSaveIndicator('Invite sent');
}

async function openTeamPanel(){
  const r=getRel();if(!r)return;
  const teamId=await ensureTeam(r.id);
  if(!teamId){
    document.getElementById('team-list').innerHTML='<div style="padding:20px;text-align:center;font-size:13px;color:var(--ink-60)"><strong>Team collaboration setup required.</strong><br><br>Run the SQL migration in <code>sql/phase4_teams.sql</code> in your Supabase SQL Editor to enable team features.</div>';
    document.getElementById('team-invites-pending').innerHTML='';
    document.getElementById('team-modal').classList.add('open');return;
  }
  // Load members
  const{data:members}=await _supabase.from('team_members').select('user_id,role').eq('team_id',teamId);
  const listEl=document.getElementById('team-list');
  let html='<div style="margin-bottom:8px;font-size:12px;color:var(--ink-60)">Members with access to this release:</div>';
  // Owner
  html+=`<div class="team-member-row"><span class="team-role-badge owner">Owner</span><span>You</span></div>`;
  if(members&&members.length){
    for(const m of members){
      const{data:u}=await _supabase.auth.admin?.getUserById?.(m.user_id)||{data:null};
      const name=u?.user?.email||m.user_id.slice(0,8)+'...';
      const roleLbl={staff:'Staff',exec_sponsor:'Exec Sponsor',client_viewer:'Client',editor:'Editor',viewer:'Viewer'}[m.role]||m.role;
      const badgeCls=m.role==='staff'?'editor':m.role==='editor'?'editor':'viewer';
      html+=`<div class="team-member-row"><span class="team-role-badge ${badgeCls}">${roleLbl}</span><span>${esc(name)}</span>
        <button class="btn-sm" style="margin-left:auto;font-size:9px;padding:3px 8px" onclick="removeMember('${teamId}','${m.user_id}')">Remove</button></div>`;
    }
  }
  listEl.innerHTML=html;
  // Pending invites
  const{data:invites}=await _supabase.from('team_invites').select('id,email,role,created_at').eq('team_id',teamId).is('accepted_at',null);
  const invEl=document.getElementById('team-invites-pending');
  if(invites&&invites.length){
    invEl.innerHTML='<div style="font-size:11px;font-weight:700;color:var(--ink-60);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.08em">Pending Invites</div>'+
      invites.map(inv=>`<div class="team-member-row"><span class="team-role-badge ${inv.role}">${inv.role}</span><span>${esc(inv.email)}</span><span style="font-size:10px;color:var(--ink-35);margin-left:auto">Pending</span></div>`).join('');
  } else {invEl.innerHTML='';}
  document.getElementById('team-modal').classList.add('open');
}

async function removeMember(teamId,userId){
  await _supabase.from('team_members').delete().eq('team_id',teamId).eq('user_id',userId);
  openTeamPanel();
}

async function checkPendingInvites(){
  if(!currentUserId)return;
  const{data:{user}}=await _supabase.auth.getUser();
  if(!user?.email)return;
  const{data:invites}=await _supabase.from('team_invites').select('id,team_id,role').eq('email',user.email).is('accepted_at',null);
  const bar=document.getElementById('pending-invites-bar');
  if(!invites||!invites.length){bar.style.display='none';return;}
  bar.style.display='block';
  bar.innerHTML=`<div style="background:var(--green-bg);border-bottom:2px solid var(--green);padding:12px 40px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
    <span style="font-size:13px;font-weight:600;color:var(--green)">You have ${invites.length} pending team invite${invites.length>1?'s':''}.</span>
    ${invites.map(inv=>`<button class="btn-sm" style="background:var(--green)" onclick="acceptInvite('${inv.id}','${inv.team_id}','${inv.role}')">Accept</button>`).join('')}
  </div>`;
}

async function acceptInvite(inviteId,teamId,role){
  // Add as team member
  const{error:mErr}=await _supabase.from('team_members').insert({team_id:teamId,user_id:currentUserId,role});
  if(mErr){console.error('Accept invite:',mErr);return;}
  // Mark invite accepted
  await _supabase.from('team_invites').update({accepted_at:new Date().toISOString()}).eq('id',inviteId);
  checkPendingInvites();
  // Apply the assigned role immediately
  await resolveUserRole();
  renderPortfolio();
  showSaveIndicator('Invite accepted');
}

function getUserRoleForRelease(r){
  // For own releases, always owner
  if(r._sharedRole)return r._sharedRole;
  return'owner';
}

function applyRoleRestrictions(){
  const r=getRel();if(!r)return;
  const role=getUserRoleForRelease(r);
  currentUserRole=role;
  // Show/hide team button (only for owners)
  const teamBtn=document.getElementById('team-btn');
  if(teamBtn)teamBtn.style.display=role==='owner'?'inline-block':'none';
  // For viewers: disable all inputs/buttons in project and release views
  if(role==='viewer'){
    document.querySelectorAll('#v-release input,#v-release select,#v-release textarea,#v-project input,#v-project select,#v-project textarea').forEach(el=>{el.disabled=true;});
    document.querySelectorAll('#v-release button,#v-project button').forEach(el=>{
      if(!el.textContent.includes('Export')&&!el.textContent.includes('Back')&&!el.textContent.includes('Team'))el.disabled=true;
    });
  }
}

// ════════════════════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════════════════════
function welcomeNext(step){
  document.querySelectorAll('.welcome-step').forEach(s=>s.style.display='none');
  document.getElementById('welcome-step-'+step).style.display='block';
}
async function closeWelcome(){
  document.getElementById('welcome-modal').classList.remove('open');
  await _supabase.auth.updateUser({data:{onboarded:true}});
}
async function loadDemoData(){
  releases=[];
  // Release 1: Q3 EHR Migration (Healthcare)
  const r1=newRelease('Q3 EHR Migration',['HCA Healthcare','Cigna'],'2026-07-15','Development');
  const p1a=newProject('Clinical Workflow',['HCA Healthcare'],4200);
  p1a.status='In Progress';
  p1a.gateState={g1_0:'green',g1_1:'green',g1_2:'yellow',g1_3:'green',g1_4:'green',g2_0:'green',g2_1:'green',g2_2:'yellow',g2_3:'green',g2_4:'green',g2_5:'green',g3_0:'yellow',g3_1:'green'};
  migrateResources(p1a);
  p1a.resources.ocm_train=[{name:'Dr. Rachel Goldman',contact:''}];
  p1a.resources.ocm_impl=[{name:'James Mitchell',contact:''}];
  p1a.resources.pm=[{name:'Asha Patel',contact:''}];
  p1a.resources.func=[{name:'Dr. Emily Wilson',contact:''}];
  p1a.stakeholders=[{id:uid(),name:'Attending Physicians',factors:{resistance:4,env:3,window:2,complexity:5,saturation:4,leadership:4},objectives:['Document patient encounters in new EHR','Generate clinical quality reports'],kirk:{L1:{method:'In-person workshop',timing:'Pre-go-live'},L2:{method:'Case-based assessment',assessment:'90% accuracy'},L3:{observable:'Documentation compliance',interval:'14-day post go-live'},L4:{outcome:'Zero clinical safety events',metric:'Safety event tracker'}},rein:{owner:'Chief Medical Officer',activities:'Weekly physician council + lunch sessions',intervals:['Week 1','Week 2','Week 3'],escalation:'Escalate if < 80% documentation compliance'}}];
  const p1b=newProject('Nursing Documentation',['HCA Healthcare'],8500);
  p1b.status='In Progress';
  p1b.gateState={g1_0:'green',g1_1:'yellow',g1_2:'green',g1_3:'yellow',g1_4:'yellow',g2_0:'green',g2_1:'green',g2_2:'green',g2_3:'yellow',g2_4:'green',g2_5:'green',g3_0:'green',g3_1:'yellow'};
  migrateResources(p1b);
  p1b.resources.ocm_train=[{name:'Patricia Johnson',contact:''}];
  p1b.resources.ocm_impl=[{name:'Michael Chen',contact:''}];
  p1b.resources.pm=[{name:'Sophia Rodriguez',contact:''}];
  p1b.stakeholders=[{id:uid(),name:'RN Staff',factors:{resistance:3,env:4,window:3,complexity:4,saturation:3,leadership:3},objectives:['Complete shift assessments','Enter vital signs + interventions'],kirk:{L1:{method:'Classroom + hands-on lab',timing:'2 days pre-go-live'},L2:{method:'Simulation with scenarios',assessment:'Pass/fail'},L3:{observable:'Shift charting time',interval:'30-day post go-live'},L4:{outcome:'Patient safety metrics maintained',metric:'Safety dashboard'}},rein:{owner:'Chief Nursing Officer',activities:'Daily floor huddles + super-user rounds',intervals:['Daily','Week 1','Week 2'],escalation:'Escalate to Nursing Leadership if issues arise'}}];
  p1a.impactAssessment={groups:[
    {name:'Attending Physicians',level:'High',changeTypes:['Technology','Process'],currentState:'Paper-based charting with legacy EHR for order entry. Physicians dictate notes for transcription.',futureState:'Full electronic documentation with CPOE, real-time clinical decision support, and integrated patient portal.',actions:[{text:'Complete physician workflow analysis',done:true},{text:'Schedule hands-on EHR lab sessions',done:true},{text:'Assign super-user physician champions per department',done:false},{text:'Develop quick-reference workflow cards',done:false}]},
    {name:'Medical Assistants',level:'Medium',changeTypes:['Technology','People'],currentState:'Manual vitals entry and paper intake forms. Limited system access.',futureState:'Tablet-based intake with auto-populated patient history and vitals integration.',actions:[{text:'Identify MA training cohorts by clinic',done:true},{text:'Create role-specific job aids',done:false}]}
  ]};
  p1b.impactAssessment={groups:[
    {name:'RN Staff — Inpatient',level:'High',changeTypes:['Technology','Process','People'],currentState:'Shift handoffs via paper reports. Medication scanning on legacy system.',futureState:'Electronic shift handoff with barcode medication administration (BCMA) and real-time alerts.',actions:[{text:'Map current nursing workflows per unit',done:true},{text:'Build simulation scenarios for BCMA',done:true},{text:'Coordinate with Pharmacy on med reconciliation',done:false}]}
  ]};
  p1a.gapAnalysis={gaps:[
    {id:uid(),description:'EHR order entry workflow does not support verbal orders — physicians must enter all orders directly into the system.',severity:'High',trainingImpact:'Proxy order entry role requires new training module for clinical support staff. Adds 2 hours to training curriculum.'},
    {id:uid(),description:'Legacy lab interface does not support real-time results feed — 15-minute delay in lab result availability.',severity:'Medium',trainingImpact:'Users must be trained on expected latency and manual refresh workflow during transition period.'},
    {id:uid(),description:'Patient portal registration requires dual authentication not supported by current SSO configuration.',severity:'Critical',trainingImpact:'Front desk staff need training on manual registration fallback process. Portal training for patients deferred until SSO is resolved.'},
    {id:uid(),description:'Custom clinical note templates from legacy system have been migrated and validated.',severity:'Low',trainingImpact:'No additional training impact — templates match existing workflow.'}
  ]};
  r1.projects=[p1a,p1b];
  releases.push(r1);

  // Release 2: Core Banking Modernization (Financial Services)
  const r2=newRelease('Core Banking Modernization',['JPMorgan','Deloitte'],'2026-08-30','Testing');
  const p2a=newProject('Teller Platform',['JPMorgan'],2800);
  p2a.status='In Progress';
  p2a.gateState={g1_0:'green',g1_1:'green',g1_2:'green',g1_3:'yellow',g1_4:'green',g2_0:'yellow',g2_1:'green',g2_2:'green',g2_3:'yellow',g2_4:'yellow',g2_5:'green',g3_0:'yellow',g3_1:'yellow'};
  migrateResources(p2a);
  p2a.resources.ocm_train=[{name:'Robert Harrison',contact:''}];
  p2a.resources.ocm_impl=[{name:'Lisa Anderson',contact:''}];
  p2a.resources.pm=[{name:'David Thompson',contact:''}];
  p2a.resources.func=[{name:'Michelle Lee',contact:''}];
  p2a.stakeholders=[{id:uid(),name:'Branch Tellers',factors:{resistance:3,env:3,window:3,complexity:3,saturation:2,leadership:3},objectives:['Process deposits/withdrawals','Handle wire transfers','Customer authentication verification'],kirk:{L1:{method:'Role-based training modules',timing:'2 weeks pre-go-live'},L2:{method:'Transaction simulation',assessment:'100 test cases'},L3:{observable:'Avg transaction time',interval:'14-day post go-live'},L4:{outcome:'Zero fraudulent transactions',metric:'Risk dashboard'}},rein:{owner:'Branch Managers',activities:'Daily check-ins + super-user support',intervals:['Week 1','Week 2','Week 4'],escalation:'Escalate if transaction errors exceed 0.5%'}}];
  const p2b=newProject('Online Banking',['JPMorgan'],45000);
  p2b.status='Not Started';
  p2b.gateState={g1_0:'yellow',g1_1:'yellow',g1_2:'red',g1_3:'red',g1_4:'red'};
  migrateResources(p2b);
  p2b.resources.ocm_impl=[{name:'Jennifer Walsh',contact:''}];
  p2b.resources.pm=[{name:'Thomas Burke',contact:''}];
  p2b.resources.func=[{name:'Sarah Kim',contact:''}];
  p2a.impactAssessment={groups:[
    {name:'Branch Tellers',level:'High',changeTypes:['Technology','Process'],currentState:'Legacy teller terminal with manual transaction entry. Paper-based customer verification.',futureState:'Modern teller platform with biometric auth, real-time fraud detection, and integrated CRM.',actions:[{text:'Complete branch-by-branch readiness assessment',done:true},{text:'Deploy practice environment to pilot branches',done:false},{text:'Train branch managers as local champions',done:false}]}
  ]};
  p2b.stakeholders=[{id:uid(),name:'Branch Tellers',factors:{resistance:3,env:2,window:3,complexity:4,saturation:3,leadership:3},objectives:['Navigate new online banking portal','Assist customers with digital migration','Troubleshoot common login issues'],kirk:{L1:{method:'eLearning + branch huddles',timing:'4 weeks pre-launch'},L2:{method:'Scenario-based quiz',assessment:'85% pass rate'},L3:{observable:'Customer assist accuracy',interval:'30-day post launch'},L4:{outcome:'Reduce in-branch transactions 20%',metric:'Transaction analytics'}},rein:{owner:'Branch Manager',activities:'Weekly huddles + floor support',intervals:['Week 1','Week 2','Month 1'],escalation:'Escalate if adoption below 60%'}}];
  p2b.impactAssessment={groups:[{name:'Branch Tellers',level:'Medium',changeTypes:['Technology','Process'],currentState:'Assist customers in-branch for all banking needs.',futureState:'Guide customers to self-service digital channels, handle exceptions only.',actions:[{text:'Develop digital migration talking points',done:false},{text:'Pilot with select branches',done:false}]}]};
  r2.projects=[p2a,p2b];
  releases.push(r2);

  // Release 3: SAP S/4HANA Cutover (Manufacturing)
  const r3=newRelease('SAP S/4HANA Cutover',['Accenture','SAP'],'2026-09-15','Development');
  const p3a=newProject('Shop Floor MES',['Accenture'],650);
  p3a.status='Not Started';
  p3a.gateState={g1_0:'red',g1_1:'red',g1_2:'yellow',g1_3:'yellow',g1_4:'red',g2_0:'red',g2_1:'red',g2_2:'yellow',g2_3:'red',g2_4:'red',g2_5:'yellow',g3_0:'red',g3_1:'red'};
  migrateResources(p3a);
  p3a.resources.ocm_train=[{name:'Klaus Weber',contact:''}];
  p3a.resources.ocm_impl=[{name:'Marco Rossi',contact:''}];
  p3a.resources.pm=[{name:'Anna Schmidt',contact:''}];
  p3a.stakeholders=[{id:uid(),name:'Machine Operators',factors:{resistance:4,env:2,window:2,complexity:5,saturation:3,leadership:2},objectives:['Operate in new MES','Enter production data','Respond to system alerts'],kirk:{L1:{method:'Hands-on factory training',timing:'3 days pre-go-live'},L2:{method:'Production simulation line',assessment:'Pass safety + speed checks'},L3:{observable:'Downtime reduction',interval:'30-day post cutover'},L4:{outcome:'5% efficiency improvement',metric:'Production metrics'}},rein:{owner:'Plant Manager',activities:'Shift leader check-ins + production reviews',intervals:['Daily','Week 1','Week 4'],escalation:'Stop production if error rate > 2%'}},{id:uid(),name:'Warehouse Staff',factors:{resistance:3,env:3,window:3,complexity:4,saturation:3,leadership:3},objectives:['Pick items per SAP','Manage inventory transfers','Scan and reconcile'],kirk:{L1:{method:'Classroom SAP basics',timing:'1 week pre-cutover'},L2:{method:'Mock warehouse drill',assessment:'Speed + accuracy'},L3:{observable:'Inventory accuracy',interval:'14-day post go-live'},L4:{outcome:'Cycle count time < 2 hours',metric:'Inventory reports'}},rein:{owner:'Warehouse Manager',activities:'Daily huddles + floor supervision',intervals:['Daily','Week 1','Week 2'],escalation:'Escalate if cycle counts fail'}},{id:uid(),name:'HR Business Partners',factors:{resistance:2,env:3,window:3,complexity:3,saturation:3,leadership:4},objectives:['Support workforce transition communications','Manage role changes in HRIS','Coordinate retraining programs'],kirk:{L1:{method:'Virtual briefing',timing:'2 weeks pre-cutover'},L2:{method:'Scenario walkthrough',assessment:'Role mapping proficiency'},L3:{observable:'HRIS update accuracy',interval:'30-day post cutover'},L4:{outcome:'Zero workforce disruption grievances',metric:'HR case log'}},rein:{owner:'HR Director',activities:'Monthly alignment meetings + change impact reviews',intervals:['Month 1','Month 2'],escalation:'Escalate if grievances filed'}}];
  p3a.impactAssessment={groups:[{name:'Machine Operators',level:'Critical',changeTypes:['Technology','Process','Role'],currentState:'Manual production tracking with paper-based work orders.',futureState:'Digital MES with real-time production monitoring and automated work orders.',actions:[{text:'Complete floor-by-floor readiness assessment',done:false},{text:'Set up training simulation line',done:false}]},{name:'HR Business Partners',level:'Medium',changeTypes:['Process'],currentState:'Manual workforce planning and role definitions.',futureState:'SAP-integrated workforce planning with automated role mapping.',actions:[{text:'Map current roles to new SAP structure',done:false}]}]};
  r3.projects=[p3a];
  releases.push(r3);

  // Release 4: Müller & Sons CRM Go-Live (Edge case - international)
  const r4=newRelease('Müller & Sons CRM Go-Live',['Salesforce','Müller & Sons AG'],'2026-06-30','Testing');
  const p4a=newProject('Client 360° Dashboard <Beta>',['Müller & Sons AG'],3200);
  p4a.status='In Progress';
  p4a.gateState={g1_0:'green',g1_1:'green',g1_2:'green',g1_3:'green',g1_4:'yellow',g2_0:'green',g2_1:'green',g2_2:'green',g2_3:'green',g2_4:'green',g2_5:'yellow',g3_0:'green',g3_1:'green'};
  migrateResources(p4a);
  p4a.resources.ocm_train=[{name:'François Dupont',contact:''}];
  p4a.resources.ocm_impl=[{name:'Hans Mueller',contact:''}];
  p4a.resources.pm=[{name:'Giulia Rossi',contact:''}];
  const p4b=newProject('',['Müller & Sons AG'],0);
  p4b.status='Not Started';
  migrateResources(p4b);
  r4.projects=[p4a,p4b];
  releases.push(r4);

  // Release 5: State Benefits Portal (Government - Live)
  const r5=newRelease('State Benefits Portal Modernization',['GSA','DeloitteGov'],'2025-11-30','Active Production');
  const p5a=newProject('Case Management System',['GSA'],12500);
  p5a.status='Complete';
  p5a.gateState={g1_0:'green',g1_1:'green',g1_2:'green',g1_3:'green',g1_4:'green',g2_0:'green',g2_1:'green',g2_2:'green',g2_3:'green',g2_4:'green',g2_5:'green',g3_0:'green',g3_1:'green'};
  migrateResources(p5a);
  p5a.resources.ocm_train=[{name:'Patricia Walsh',contact:''}];
  p5a.resources.ocm_impl=[{name:'Charles Thompson',contact:''}];
  p5a.resources.pm=[{name:'Rebecca Martinez',contact:''}];
  p5a.resources.func=[{name:'Dr. Jonathan Lee',contact:''}];
  p5a.stakeholders=[{id:uid(),name:'Case Workers',factors:{resistance:2,env:3,window:4,complexity:3,saturation:2,leadership:4},objectives:['Manage benefit applications','Process claims quickly','Document client interactions'],kirk:{L1:{method:'Classroom + online modules',timing:'6 weeks pre-launch'},L2:{method:'Job shadowing + practice cases',assessment:'100% accuracy required'},L3:{observable:'Case processing time',interval:'30-day post launch'},L4:{outcome:'Zero benefits processing delays',metric:'Claims dashboard'}},rein:{owner:'Regional Director',activities:'Weekly supervisor check-ins + monthly town halls',intervals:['Weekly','Monthly'],escalation:'Escalate if processing time exceeds SLA'}},{id:uid(),name:'Agency Leadership',factors:{resistance:1,env:4,window:5,complexity:2,saturation:1,leadership:5},objectives:['Monitor system performance','Meet constituent service metrics','Track budget savings'],kirk:{L1:{method:'Executive briefing',timing:'2 weeks pre-launch'},L2:{method:'Dashboard training',assessment:'Operational proficiency'},L3:{observable:'System availability',interval:'Ongoing'},L4:{outcome:'90% constituent satisfaction',metric:'Feedback surveys'}},rein:{owner:'Deputy Commissioner',activities:'Monthly performance reviews + quarterly steering committee',intervals:['Monthly','Quarterly'],escalation:'Escalate if system availability < 99.5%'}}];
  const p5b=newProject('Public Portal & Self-Service',['GSA'],8300);
  p5b.status='Completed';
  p5b.gateState={g1_0:'green',g1_1:'green',g1_2:'green',g1_3:'green',g1_4:'green',g2_0:'green',g2_1:'green',g2_2:'green',g2_3:'green',g2_4:'green',g2_5:'green',g3_0:'green',g3_1:'green'};
  migrateResources(p5b);
  p5b.resources.ocm_train=[{name:'Margaret Chen',contact:''}];
  p5b.resources.ocm_impl=[{name:'William Rodriguez',contact:''}];
  p5b.resources.pm=[{name:'Katherine Johnson',contact:''}];
  p5b.stakeholders=[{id:uid(),name:'Constituents/Public Users',factors:{resistance:3,env:2,window:3,complexity:2,saturation:2,leadership:2},objectives:['Access benefit information','Submit applications online','Track application status'],kirk:{L1:{method:'Website tutorials + FAQs',timing:'Ongoing'},L2:{method:'Call center training pilot',assessment:'Support staff proficiency'},L3:{observable:'Portal usage adoption',interval:'30-day post launch'},L4:{outcome:'50% online submission rate',metric:'Portal analytics'}},rein:{owner:'Help Desk Manager',activities:'Daily monitoring + weekly optimization',intervals:['Daily','Weekly'],escalation:'Escalate if 311 call volume spikes'}},{id:uid(),name:'Agency Leadership',factors:{resistance:1,env:4,window:5,complexity:2,saturation:1,leadership:5},objectives:['Monitor portal adoption metrics','Ensure constituent satisfaction','Report to oversight committee'],kirk:{L1:{method:'Executive dashboard walkthrough',timing:'1 week pre-launch'},L2:{method:'Dashboard proficiency check',assessment:'Operational'},L3:{observable:'Dashboard usage frequency',interval:'Monthly'},L4:{outcome:'Positive constituent feedback trend',metric:'Satisfaction surveys'}},rein:{owner:'Deputy Commissioner',activities:'Quarterly steering committee + monthly KPI review',intervals:['Monthly','Quarterly'],escalation:'Escalate if satisfaction drops below 80%'}}];
  p5b.impactAssessment={groups:[{name:'Constituents/Public Users',level:'High',changeTypes:['Technology','Process'],currentState:'In-person and phone-based service delivery.',futureState:'Digital self-service portal for benefits and applications.',actions:[{text:'Develop accessibility compliance plan',done:true},{text:'User testing with diverse populations',done:false}]},{name:'Agency Leadership',level:'Low',changeTypes:['Process'],currentState:'Manual reporting and in-person oversight.',futureState:'Real-time digital dashboards and automated reporting.',actions:[{text:'Dashboard training for leadership team',done:false}]}]};
  r5.projects=[p5a,p5b];
  releases.push(r5);

  // Release 6: Completed project with post-launch data
  const r6=newRelease('Payroll Modernization',['ADP','Deloitte'],'2026-02-15','Complete');
  const p6a=newProject('Payroll Engine',['ADP'],1200);
  p6a.status='Complete';p6a.golive='2026-02-15';
  p6a.gateState={g1_0:'green',g1_1:'green',g1_2:'green',g1_3:'green',g1_4:'green',g2_0:'green',g2_1:'green',g2_2:'green',g2_3:'green',g2_4:'green',g2_5:'green',g3_0:'green',g3_1:'green',g3_2:'green',g3_3:'green',g3_4:'green',g3_5:'green',g4_0:'green',g4_1:'green',g4_2:'green',g4_3:'green',g4_4:'green',g4_5:'green'};
  migrateResources(p6a);
  p6a.adkarScores={A1:4,D:4,K:3,Ab:3,R:4};
  p6a.stakeholders=[
    {id:uid(),name:'Payroll Specialists',factors:{resistance:4,env:4,window:3,complexity:3,saturation:4,leadership:4},objectives:['Process biweekly payroll','Handle tax filings','Manage garnishments'],kirk:{L1:{method:'Instructor-led workshops',timing:'3 weeks pre go-live'},L2:{method:'Parallel payroll run',assessment:'Zero-variance test'},L3:{observable:'Processing time per cycle',interval:'30'},L4:{outcome:'Zero payroll errors for 3 cycles',metric:'Error rate dashboard'}},rein:{owner:'Payroll Manager',activities:'Weekly check-ins + error review',intervals:['Week 1','Week 2','Month 1'],escalation:'Escalate if error rate exceeds 0.1%'}},
    {id:uid(),name:'HR Business Partners',factors:{resistance:3,env:3,window:4,complexity:2,saturation:3,leadership:4},objectives:['Run compensation reports','Manage employee records','Support managers with payroll queries'],kirk:{L1:{method:'Self-paced eLearning',timing:'2 weeks pre go-live'},L2:{method:'Report generation quiz',assessment:'Pass/Fail'},L3:{observable:'Report accuracy',interval:'30'},L4:{outcome:'Reduced payroll queries to HR',metric:'Ticket volume'}},rein:{owner:'HR Director',activities:'Monthly review + refresher sessions',intervals:['Month 1','Month 2','Month 3'],escalation:'Escalate if query volume increases'}}
  ];
  // Post-launch observation data
  p6a.postLaunch={};
  p6a.postLaunch[p6a.stakeholders[0].id]={d30:{adoption:82,tickets:14,proficiency:78,notes:'Strong adoption, minor issues with garnishment module.'},d60:{adoption:91,tickets:6,proficiency:88,notes:'Significant improvement. Team is self-sufficient.'}};
  p6a.postLaunch[p6a.stakeholders[1].id]={d30:{adoption:68,tickets:22,proficiency:65,notes:'Struggling with new report builder. Additional coaching scheduled.'}};
  r6.projects=[p6a];
  releases.push(r6);

  await saveData();setDemoMode(true);renderPortfolio();renderAlerts();
  initTopBrand();
  closeWelcome();
}

// ════════════════════════════════════════════════════════
// DRAG-TO-REORDER
// ════════════════════════════════════════════════════════
let dragSrcEl=null;let dragType=null;
function initReleaseDrag(){
  document.querySelectorAll('.r-card[draggable]').forEach(card=>{
    card.addEventListener('dragstart',e=>{dragSrcEl=card;dragType='release';card.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.dataset.relId);});
    card.addEventListener('dragend',()=>{dragSrcEl=null;dragType=null;document.querySelectorAll('.r-card').forEach(c=>{c.classList.remove('dragging','drag-over');});});
    card.addEventListener('dragover',e=>{if(dragType!=='release')return;e.preventDefault();e.dataTransfer.dropEffect='move';card.classList.add('drag-over');});
    card.addEventListener('dragleave',()=>{card.classList.remove('drag-over');});
    card.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();card.classList.remove('drag-over');if(!dragSrcEl||dragSrcEl===card||dragType!=='release')return;
      const fromId=parseInt(dragSrcEl.dataset.relId);const toId=parseInt(card.dataset.relId);
      const fromIdx=releases.findIndex(r=>r.id===fromId);const toIdx=releases.findIndex(r=>r.id===toId);
      if(fromIdx<0||toIdx<0)return;const[moved]=releases.splice(fromIdx,1);releases.splice(toIdx,0,moved);
      schedSave();renderPortfolio();});
  });
}
function initProjectDrag(){
  document.querySelectorAll('.pc[draggable]').forEach(card=>{
    card.addEventListener('dragstart',e=>{dragSrcEl=card;dragType='project';card.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.dataset.projId);});
    card.addEventListener('dragend',()=>{dragSrcEl=null;dragType=null;document.querySelectorAll('.pc').forEach(c=>{c.classList.remove('dragging','drag-over');});});
    card.addEventListener('dragover',e=>{if(dragType!=='project')return;e.preventDefault();e.dataTransfer.dropEffect='move';card.classList.add('drag-over');});
    card.addEventListener('dragleave',()=>{card.classList.remove('drag-over');});
    card.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();card.classList.remove('drag-over');if(!dragSrcEl||dragSrcEl===card||dragType!=='project')return;
      const r=getRel();if(!r)return;
      const fromId=parseInt(dragSrcEl.dataset.projId);const toId=parseInt(card.dataset.projId);
      const fromIdx=r.projects.findIndex(p=>p.id===fromId);const toIdx=r.projects.findIndex(p=>p.id===toId);
      if(fromIdx<0||toIdx<0)return;const[moved]=r.projects.splice(fromIdx,1);r.projects.splice(toIdx,0,moved);
      schedSave();renderRelProjCards();initProjectDrag();});
  });
}

// ════════════════════════════════════════════════════════
// AUDIT TRAIL
// ════════════════════════════════════════════════════════
function logAudit(action,entityType,entityName,details){
  if(!currentUserId)return;
  _supabase.from('audit_log').insert({user_id:currentUserId,action,entity_type:entityType,entity_name:entityName||'',details:details||{}}).then(({error})=>{if(error)console.warn('Audit log:',error);});
}

function openAuditLog(){document.getElementById('audit-modal').classList.add('open');renderAuditLog();}
async function exportAuditLog(){
  const{data}=await _supabase.from('audit_log').select('*').eq('user_id',currentUserId).order('created_at',{ascending:false}).limit(200);
  if(!data||!data.length){showSaveIndicator('No audit data');return;}
  let csv='Timestamp,Action,Entity,Details\n';
  data.forEach(r=>{const ts=new Date(r.created_at).toISOString();csv+=`"${ts}","${r.action}","${(r.entity_name||'').replace(/"/g,'""')}","${JSON.stringify(r.details||{}).replace(/"/g,'""')}"\n`;});
  const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='AdoptIQ-Audit-Log.csv';a.click();URL.revokeObjectURL(url);
}
async function renderAuditLog(){
  const container=document.getElementById('audit-log-body');if(!container)return;
  container.innerHTML='<div style="color:var(--ink-60);font-size:12px;padding:8px 0">Loading\u2026</div>';
  const{data,error}=await _supabase.from('audit_log').select('*').eq('user_id',currentUserId).order('created_at',{ascending:false}).limit(50);
  if(error||!data||!data.length){container.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">No activity recorded yet.</p></div>';return;}
  const ACTION_LABELS={release_created:'Release Created',release_deleted:'Release Removed',project_created:'Project Added',project_deleted:'Project Removed',gate_updated:'Gate Updated',adkar_updated:fwShort()+' Updated'};
  container.innerHTML=data.map(row=>{
    const ts=new Date(row.created_at);
    const tsStr=ts.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' '+ts.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    return`<div class="audit-row"><span class="audit-ts">${tsStr}</span><span class="audit-action">${ACTION_LABELS[row.action]||row.action}</span><span class="audit-detail">${esc(row.entity_name)}${row.details&&row.details.release?' &mdash; '+esc(row.details.release):''}</span></div>`;
  }).join('');
}

// ════════════════════════════════════════════════════════
// IN-APP ALERTS
// ════════════════════════════════════════════════════════
function renderAlerts(){
  const bar=document.getElementById('alert-bar');if(!bar)return;
  const today=new Date();today.setHours(0,0,0,0);
  const dismissed=JSON.parse(sessionStorage.getItem('adoptiq_dismissed_alerts')||'[]');
  const alerts=[];
  releases.forEach(r=>{
    const rl=relRollup(r);
    if(r.golive){
      const d=daysTo(r.golive);
      if(d!==null&&d<0)
        alerts.push({id:'overdue-'+r.id,cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> go-live was <strong>${Math.abs(d)} day${Math.abs(d)===1?'':'s'} ago</strong> — release is overdue.`});
      else if(d!==null&&d===0)
        alerts.push({id:'today-'+r.id,cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> goes live <strong>today</strong> — final readiness check required.`});
      else if(d!==null&&d<=7)
        alerts.push({id:'7day-'+r.id,cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> goes live in <strong>${d} day${d===1?'':'s'}</strong> — final readiness check required.`});
      else if(d!==null&&d<=30&&rl.status.cls!=='on-track')
        alerts.push({id:'30day-'+r.id,cls:'warn',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> goes live in <strong>${d} days</strong> and is ${rl.status.label}.`});
    }
    if(rl.status.cls==='critical')
      alerts.push({id:'crit-'+r.id,cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> is <strong>Critical</strong> — ${rl.flags} active risk flag${rl.flags===1?'':'s'} require attention.`});
  });
  // Deduplicate and filter dismissed
  const seen=new Set();const deduped=alerts.filter(a=>{const k=a.id;if(seen.has(k)||dismissed.includes(k))return false;seen.add(k);return true;});
  if(!deduped.length){bar.style.display='none';return;}
  bar.style.display='block';
  bar.innerHTML=`<div style="max-width:1440px;margin:0 auto;padding:4px 0">${deduped.map(a=>`<div class="alert-item" data-alert-id="${a.id}"><span class="alert-dot ${a.cls}"></span><span>${a.msg}</span><button class="alert-dismiss" onclick="dismissAlert('${a.id}')" title="Dismiss">&times;</button></div>`).join('')}</div>`;
}
function dismissAlert(alertId){
  const dismissed=JSON.parse(sessionStorage.getItem('adoptiq_dismissed_alerts')||'[]');
  dismissed.push(alertId);
  sessionStorage.setItem('adoptiq_dismissed_alerts',JSON.stringify(dismissed));
  const item=document.querySelector(`.alert-item[data-alert-id="${alertId}"]`);
  if(item){item.style.transition='opacity 0.2s';item.style.opacity='0';setTimeout(()=>{item.remove();const bar=document.getElementById('alert-bar');if(bar&&!bar.querySelector('.alert-item'))bar.style.display='none';},200);}
}

// ════════════════════════════════════════════════════════
// VIEW-ONLY SHARING MODE
// ════════════════════════════════════════════════════════
let isReadOnly=false;

function checkReadOnlyParam(){
  const params=new URLSearchParams(window.location.search);
  return params.get('readonly')==='true';
}

function enableReadOnly(){
  isReadOnly=true;
  document.body.classList.add('readonly-mode');
  // Show viewer banner on all views
  ['viewer-banner-p','viewer-banner-r','viewer-banner-proj'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display='flex';
  });
  applyReadOnlyRestrictions();
}

function applyReadOnlyRestrictions(){
  if(!isReadOnly)return;
  // Disable all inputs, selects, textareas across all views
  document.querySelectorAll('#v-portfolio input,#v-portfolio select,#v-portfolio textarea,#v-release input,#v-release select,#v-release textarea,#v-project input,#v-project select,#v-project textarea').forEach(el=>{el.disabled=true;});
  // Disable action buttons (but keep navigation, export, and theme buttons)
  document.querySelectorAll('#v-portfolio button,#v-release button,#v-project button').forEach(el=>{
    const txt=el.textContent||'';
    const isNav=el.classList.contains('nav-btn')||el.classList.contains('theme-btn')||el.classList.contains('btn-profile');
    const isExport=txt.includes('Export')||txt.includes('Audit');
    const isBack=txt.includes('Back')||txt.includes('Portfolio');
    const isOpen=txt.includes('Open')||el.classList.contains('btn-sm');
    const isCard=el.closest('.r-card')||el.closest('.pc');
    if(!isNav&&!isExport&&!isBack&&!isOpen&&!isCard){
      el.disabled=true;el.style.opacity='0.5';el.style.cursor='not-allowed';
    }
  });
  // Hide add/remove/delete buttons
  document.querySelectorAll('.btn-del-sm,.res-add-btn,.chip-rm').forEach(el=>{el.style.display='none';});
  // Hide sign-out and profile edit
  const signOutBtn=document.querySelector('.btn-profile');
  if(signOutBtn)signOutBtn.style.display='none';
}

function copyViewOnlyLink(){
  const url=new URL(window.location.href);
  url.searchParams.set('readonly','true');
  navigator.clipboard.writeText(url.toString()).then(()=>{
    showSaveIndicator('View-only link copied!');
  }).catch(()=>{
    const ta=document.createElement('textarea');ta.value=url.toString();document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    showSaveIndicator('View-only link copied!');
  });
}

// ════════════════════════════════════════════════════════
// PUBLIC SHARING (Frozen Snapshots)
// ════════════════════════════════════════════════════════
let sharedViewData=null; // Holds data when viewing a shared link

function checkShareParam(){
  const params=new URLSearchParams(window.location.search);
  return params.get('share')||null;
}

async function loadSharedView(token){
  // Try RPC first (works for anonymous), fall back to direct query
  const{data,error}=await _supabase.rpc('get_shared_snapshot',{share_token:token});
  if(error||!data){
    // Fallback: direct query (works if RLS allows)
    const{data:row,error:qErr}=await _supabase.from('shared_links').select('snapshot,label,created_at,expires_at').eq('token',token).eq('is_active',true).gt('expires_at',new Date().toISOString()).maybeSingle();
    if(qErr||!row){
      document.getElementById('v-login').classList.remove('active');
      document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg);font-family:DM Sans,sans-serif"><div style="text-align:center;max-width:400px;padding:40px"><div style="font-size:48px;margin-bottom:16px">&#128279;</div><h2 style="font-family:DM Serif Display,Georgia,serif;margin-bottom:12px">Link Expired or Invalid</h2><p style="color:#666;font-size:14px">This shared dashboard link has expired, been revoked, or does not exist.</p><a href="/" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#b8922a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Go to AdoptIQ</a></div></div>';
      return;
    }
    sharedViewData=row;
  } else {
    sharedViewData=data;
  }
  // Load the frozen data
  releases=sharedViewData.snapshot||[];
  const createdDate=new Date(sharedViewData.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  // Hide login, show portfolio
  hideLogin();
  document.getElementById('v-portfolio').classList.add('active');
  // Set shared banner text
  ['viewer-banner-p','viewer-banner-r','viewer-banner-proj'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.style.display='flex';el.innerHTML=`<span>Shared View</span> — Dashboard snapshot from ${esc(createdDate)}. This is a read-only view.`;}
  });
  isReadOnly=true;
  document.body.classList.add('readonly-mode');
  renderPortfolio();renderAlerts();initTopBrand();
  applyReadOnlyRestrictions();
  // Hide auth-only elements
  document.querySelectorAll('.btn-profile,.btn-signout,#demo-banner-p,#demo-banner-r,#demo-banner-proj').forEach(el=>{el.style.display='none';});
}

function openShareModal(){
  document.getElementById('share-err').textContent='';
  document.getElementById('share-link-result').style.display='none';
  document.getElementById('share-expiry').value='7';
  renderActiveShares();
  openModal('share-modal');
}

async function generateShareLink(){
  const errEl=document.getElementById('share-err');
  errEl.textContent='';
  if(!currentUserId){errEl.textContent='Please sign in to share.';return;}
  const days=parseInt(document.getElementById('share-expiry').value)||7;
  const expiresAt=new Date();expiresAt.setDate(expiresAt.getDate()+days);
  // Freeze current data
  const snapshot=JSON.parse(JSON.stringify(releases));
  const label=releases.map(r=>r.name).join(', ');
  const{data,error}=await _supabase.from('shared_links').insert({
    user_id:currentUserId,
    label:label.substring(0,200),
    snapshot,
    expires_at:expiresAt.toISOString(),
    is_active:true
  }).select('token').single();
  if(error){
    errEl.textContent='Could not create share link. Run sql/phase5_sharing.sql in Supabase first.';
    console.error('Share link error:',error);return;
  }
  const url=window.location.origin+'/?share='+data.token;
  document.getElementById('share-link-url').value=url;
  document.getElementById('share-link-expires').textContent='Expires '+expiresAt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  document.getElementById('share-link-result').style.display='block';
  renderActiveShares();
}

function copyShareLink(){
  const inp=document.getElementById('share-link-url');
  inp.select();
  navigator.clipboard.writeText(inp.value).then(()=>{
    showSaveIndicator('Share link copied!');
  }).catch(()=>{
    document.execCommand('copy');
    showSaveIndicator('Share link copied!');
  });
}

async function renderActiveShares(){
  const el=document.getElementById('active-shares-list');if(!el)return;
  if(!currentUserId){el.innerHTML='';return;}
  const{data,error}=await _supabase.from('shared_links').select('id,token,label,created_at,expires_at,is_active').eq('user_id',currentUserId).order('created_at',{ascending:false}).limit(10);
  if(error||!data||!data.length){el.innerHTML='<div style="font-size:11px;color:var(--ink-60);padding:8px 0">No shared links yet.</div>';return;}
  el.innerHTML=data.map(s=>{
    const created=new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const expires=new Date(s.expires_at);
    const isExpired=expires<new Date();
    const active=s.is_active&&!isExpired;
    const statusTxt=!s.is_active?'Revoked':isExpired?'Expired':'Active';
    const statusCls=active?'share-active':' share-inactive';
    return`<div class="share-row">
      <div class="share-row-info"><span class="share-row-label">${esc(s.label||'Dashboard').substring(0,40)}</span><span class="share-row-date">Created ${created}</span></div>
      <span class="share-status ${statusCls}">${statusTxt}</span>
      ${active?`<button class="btn-del-sm" onclick="revokeShare('${s.id}')">Revoke</button>`:''}
    </div>`;
  }).join('');
}

async function revokeShare(id){
  await _supabase.from('shared_links').update({is_active:false}).eq('id',id).eq('user_id',currentUserId);
  showSaveIndicator('Link revoked');
  renderActiveShares();
}

// ════════════════════════════════════════════════════════
// HISTORICAL TREND CHARTS
// ════════════════════════════════════════════════════════
function generateDemoSnapshots(){
  // Simulate 8 weeks of improving portfolio data for demo
  const today=new Date();const snaps=[];
  const baseGates=[8,12,15,19,22,25,27,30];
  const baseFlags=[22,19,17,16,15,14,13,12];
  const baseAdkar=[2.2,2.4,2.5,2.7,2.8,2.9,3.0,3.0];
  for(let i=7;i>=0;i--){
    const d=new Date(today);d.setDate(d.getDate()-i*7);
    const idx=7-i;
    snaps.push({
      date:d.toISOString().split('T')[0],
      releases:[
        {id:1,name:'Q3 EHR Migration',projects:[
          {id:1,name:'Clinical Workflow',gateScore:baseGates[idx]+9,adkarAvg:(baseAdkar[idx]+0.5).toFixed(1),flags:Math.max(0,baseFlags[idx]-10),status:'In Progress'},
          {id:2,name:'Nursing Documentation',gateScore:baseGates[idx]+5,adkarAvg:(baseAdkar[idx]+0.3).toFixed(1),flags:Math.max(0,baseFlags[idx]-8),status:'In Progress'}
        ]},
        {id:2,name:'Core Banking Modernization',projects:[
          {id:3,name:'Teller Platform',gateScore:baseGates[idx]+3,adkarAvg:baseAdkar[idx].toFixed(1),flags:Math.max(0,baseFlags[idx]-5),status:'In Progress'},
          {id:4,name:'Online Banking',gateScore:Math.max(0,baseGates[idx]-5),adkarAvg:(baseAdkar[idx]-0.2).toFixed(1),flags:baseFlags[idx],status:'Not Started'}
        ]},
        {id:3,name:'SAP S/4HANA Cutover',projects:[
          {id:5,name:'Shop Floor MES',gateScore:Math.max(0,baseGates[idx]-8),adkarAvg:(baseAdkar[idx]-0.3).toFixed(1),flags:Math.min(22,baseFlags[idx]+3),status:'Not Started'}
        ]},
        {id:4,name:'M\u00FCller & Sons CRM Go-Live',projects:[
          {id:6,name:'Client 360',gateScore:baseGates[idx]+20,adkarAvg:(baseAdkar[idx]+0.8).toFixed(1),flags:Math.max(0,baseFlags[idx]-12),status:'In Progress'}
        ]},
        {id:5,name:'State Benefits Portal Modernization',projects:[
          {id:7,name:'Case Management',gateScore:100,adkarAvg:'4.5',flags:0,status:'Completed'},
          {id:8,name:'Public Portal',gateScore:100,adkarAvg:'4.2',flags:0,status:'Completed'}
        ]}
      ]
    });
  }
  return snaps;
}

// Cached snapshots for sparklines
let _trendSnapshots=[];

async function renderTrendCharts(){
  const container=document.getElementById('trends-sec');if(!container)return;
  const tatEl=document.getElementById('trend-adkar-title');if(tatEl)tatEl.textContent=fwShort()+' Score Trend';
  let snapshots=[];
  if(isDemoMode){
    snapshots=generateDemoSnapshots();
  } else if(currentUserId){
    // Try snapshots table first
    const{data:rows}=await _supabase.from('snapshots').select('snapshot_date,data').eq('user_id',currentUserId).order('snapshot_date',{ascending:true}).limit(52);
    if(rows&&rows.length){
      snapshots=rows.map(r=>({date:r.snapshot_date,...r.data}));
    } else {
      // Fallback to user_metadata
      const{data:{user}}=await _supabase.auth.getUser();
      snapshots=user?.user_metadata?.snapshots||[];
    }
  }
  if(snapshots.length<2){container.style.display='none';return;}
  container.style.display='block';
  snapshots.sort((a,b)=>a.date.localeCompare(b.date));
  _trendSnapshots=snapshots;
  const recent=snapshots.slice(-12);
  const labels=recent.map(s=>{const d=new Date(s.date+'T00:00:00');return 'Wk '+d.toLocaleDateString('en-US',{month:'short',day:'numeric'});});

  // Calculate portfolio metrics per snapshot
  const gateScores=recent.map(s=>{let t=0,c=0;s.releases.forEach(r=>(r.projects||[]).forEach(p=>{if(p.gateScore!=null){t+=p.gateScore;c++;}}));return c?Math.round(t/c):null;});
  const flagCounts=recent.map(s=>{let t=0;s.releases.forEach(r=>(r.projects||[]).forEach(p=>{t+=(p.flags||0);}));return t;});
  const adkarAvgs=recent.map(s=>{let t=0,c=0;s.releases.forEach(r=>(r.projects||[]).forEach(p=>{if(p.adkarAvg!=null){t+=parseFloat(p.adkarAvg);c++;}}));return c?parseFloat((t/c).toFixed(1)):null;});

  // ── Delta KPI Row ──
  const curGate=gateScores[gateScores.length-1];const prevGate=gateScores[gateScores.length-2];
  const curFlags=flagCounts[flagCounts.length-1];const prevFlags=flagCounts[flagCounts.length-2];
  const curAdkar=adkarAvgs[adkarAvgs.length-1];const prevAdkar=adkarAvgs[adkarAvgs.length-2];
  const gateDelta=curGate!=null&&prevGate!=null?curGate-prevGate:null;
  const flagDelta=curFlags!=null&&prevFlags!=null?curFlags-prevFlags:null;
  const adkarDelta=curAdkar!=null&&prevAdkar!=null?parseFloat((curAdkar-prevAdkar).toFixed(1)):null;

  const deltaHtml=(val,unit,inverted)=>{
    if(val===null||val===0)return'<span class="trend-delta trend-neutral">No change</span>';
    const up=val>0;const good=inverted?!up:up;
    return`<span class="trend-delta ${good?'trend-up':'trend-down'}">${up?'&#9650; +':'&#9660; '}${Math.abs(val)}${unit} this week</span>`;
  };
  const kpiEl=document.getElementById('trend-kpis');
  if(kpiEl)kpiEl.innerHTML=`
    <div class="trend-kpi"><div class="trend-kpi-label">Gate Readiness</div><div class="trend-kpi-val">${curGate!=null?curGate+'%':'—'}</div>${deltaHtml(gateDelta,'%',false)}</div>
    <div class="trend-kpi"><div class="trend-kpi-label">Risk Flags</div><div class="trend-kpi-val">${curFlags!=null?curFlags:'—'}</div>${deltaHtml(flagDelta,'',true)}</div>
    <div class="trend-kpi"><div class="trend-kpi-label">${fwShort()} Score</div><div class="trend-kpi-val">${curAdkar!=null?curAdkar+'/5':'—'}</div>${deltaHtml(adkarDelta,'',false)}</div>
    <div class="trend-kpi"><div class="trend-kpi-label">Weeks Tracked</div><div class="trend-kpi-val">${recent.length}</div><span class="trend-delta trend-neutral">${labels[0]} — ${labels[labels.length-1]}</span></div>
  `;

  // ── Auto-generated Insights ──
  const insights=[];
  // Gate readiness trajectory
  if(gateDelta!==null){
    if(gateDelta>0)insights.push({icon:'&#9650;',cls:'good',text:`Portfolio gate readiness improved by <strong>${gateDelta}%</strong> this week, now at <strong>${curGate}%</strong>.`});
    else if(gateDelta<0)insights.push({icon:'&#9660;',cls:'warn',text:`Portfolio gate readiness dropped by <strong>${Math.abs(gateDelta)}%</strong> this week to <strong>${curGate}%</strong> — review incomplete gates.`});
    else insights.push({icon:'—',cls:'neutral',text:`Gate readiness held steady at <strong>${curGate}%</strong>.`});
  }
  // Gate vs target
  if(curGate!=null&&curGate<80)insights.push({icon:'&#9673;',cls:'warn',text:`Portfolio is <strong>${80-curGate}%</strong> below the 80% go-live readiness target.`});
  else if(curGate!=null&&curGate>=80)insights.push({icon:'&#10003;',cls:'good',text:`Portfolio exceeds the 80% go-live readiness target.`});
  // Risk flags
  if(flagDelta!==null){
    if(flagDelta>0)insights.push({icon:'!',cls:'warn',text:`Risk flags increased by <strong>${flagDelta}</strong> this week (now ${curFlags}). Investigate new incomplete gates.`});
    else if(flagDelta<0)insights.push({icon:'&#10003;',cls:'good',text:`Risk flags decreased by <strong>${Math.abs(flagDelta)}</strong> this week (now ${curFlags}).`});
  }
  // ADKAR stagnation
  if(adkarAvgs.length>=3){
    const last3=adkarAvgs.slice(-3);
    const flat=last3.every((v,_,a)=>v!=null&&Math.abs(v-a[0])<0.2);
    if(flat&&curAdkar!=null&&curAdkar<4)insights.push({icon:'&#9724;',cls:'warn',text:`${fwShort()} scores have been flat at <strong>${curAdkar}/5</strong> for 3+ weeks — reinforcement activities may need attention.`});
  }
  // Per-release insights: find biggest mover
  if(recent.length>=2){
    const last=recent[recent.length-1];const prev=recent[recent.length-2];
    let bestDelta=-Infinity,bestName='',worstDelta=Infinity,worstName='';
    last.releases.forEach(lr=>{
      const pr=prev.releases.find(r=>r.id===lr.id);if(!pr)return;
      const curAvg=avgGateForRel(lr);const prevAvg=avgGateForRel(pr);
      if(curAvg!=null&&prevAvg!=null){
        const d=curAvg-prevAvg;
        if(d>bestDelta){bestDelta=d;bestName=lr.name;}
        if(d<worstDelta){worstDelta=d;worstName=lr.name;}
      }
    });
    if(bestDelta>0)insights.push({icon:'&#9650;',cls:'good',text:`<strong>${esc(bestName)}</strong> improved the most this week (+${bestDelta}% gate readiness).`});
    if(worstDelta<0)insights.push({icon:'&#9660;',cls:'warn',text:`<strong>${esc(worstName)}</strong> declined this week (${worstDelta}% gate readiness) — may need intervention.`});
  }

  const insEl=document.getElementById('trend-insights');
  const insOverflow=document.getElementById('trend-insights-overflow');
  const insToggle=document.getElementById('trend-insights-toggle');
  if(insEl){
    if(!insights.length){
      insEl.innerHTML='<div class="es"><p class="es-txt">Collecting data — insights will appear as trends emerge.</p></div>';
      if(insOverflow)insOverflow.style.display='none';
      if(insToggle)insToggle.style.display='none';
    } else {
      const top=insights.slice(0,2);const rest=insights.slice(2);
      insEl.innerHTML=top.map(i=>`<div class="trend-insight ${i.cls}"><span class="trend-insight-icon ${i.cls}">${i.icon}</span><span>${i.text}</span></div>`).join('');
      if(rest.length&&insOverflow&&insToggle){
        insOverflow.innerHTML=rest.map(i=>`<div class="trend-insight ${i.cls}"><span class="trend-insight-icon ${i.cls}">${i.icon}</span><span>${i.text}</span></div>`).join('');
        insOverflow.style.display='none';
        insToggle.style.display='block';
        insToggle.textContent='Show all insights (+'+(rest.length)+' more)';
      } else {
        if(insOverflow)insOverflow.style.display='none';
        if(insToggle)insToggle.style.display='none';
      }
    }
  }

  // ── Charts ──
  // Gate Readiness with 80% goal line
  destroyChart('trend-gate');
  const gc=document.getElementById('chart-trend-gate');
  if(gc){
    const goalLine=new Array(labels.length).fill(80);
    chartInstances['trend-gate']=new Chart(gc,{type:'line',data:{
      labels,datasets:[
        {label:'Gate Readiness %',data:gateScores,borderColor:CHART_GREEN,backgroundColor:'rgba(29,104,64,0.1)',fill:true,tension:0.3,pointRadius:4,pointBackgroundColor:CHART_GREEN,borderWidth:2},
        {label:'80% Target',data:goalLine,borderColor:'rgba(184,146,42,0.6)',borderDash:[6,4],borderWidth:1.5,pointRadius:0,fill:false}
      ]
    },options:{responsive:true,maintainAspectRatio:false,
      scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%',font:{size:9},color:chartSubColor()},grid:{color:chartGridColor()}},
        x:{ticks:{font:{size:9},color:chartSubColor(),maxRotation:45},grid:{display:false}}},
      plugins:{legend:{display:false},tooltip:{filter:ctx=>ctx.datasetIndex===0,callbacks:{label:ctx=>ctx.raw+'%'}}}}
    });
  }

  // Risk Flags
  destroyChart('trend-flags');
  const fc=document.getElementById('chart-trend-flags');
  if(fc){
    chartInstances['trend-flags']=new Chart(fc,{type:'line',data:{
      labels,datasets:[{label:'Risk Flags',data:flagCounts,borderColor:CHART_RED,backgroundColor:'rgba(139,26,26,0.1)',fill:true,tension:0.3,pointRadius:4,pointBackgroundColor:CHART_RED,borderWidth:2}]
    },options:{responsive:true,maintainAspectRatio:false,
      scales:{y:{min:0,ticks:{font:{size:9},color:chartSubColor()},grid:{color:chartGridColor()}},
        x:{ticks:{font:{size:9},color:chartSubColor(),maxRotation:45},grid:{display:false}}},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.raw+' flags'}}}}
    });
  }

  // ADKAR
  destroyChart('trend-adkar');
  const ac=document.getElementById('chart-trend-adkar');
  if(ac){
    chartInstances['trend-adkar']=new Chart(ac,{type:'line',data:{
      labels,datasets:[{label:fwShort()+' Avg',data:adkarAvgs,borderColor:CHART_GOLD,backgroundColor:'rgba(184,146,42,0.1)',fill:true,tension:0.3,pointRadius:4,pointBackgroundColor:CHART_GOLD,borderWidth:2}]
    },options:{responsive:true,maintainAspectRatio:false,
      scales:{y:{min:0,max:5,ticks:{stepSize:1,font:{size:9},color:chartSubColor()},grid:{color:chartGridColor()}},
        x:{ticks:{font:{size:9},color:chartSubColor(),maxRotation:45},grid:{display:false}}},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.raw+'/5'}}}}
    });
  }

  // ── Sparklines on release cards ──
  renderReleaseSparklines(snapshots);
}

function toggleTrendInsights(){
  const overflow=document.getElementById('trend-insights-overflow');
  const btn=document.getElementById('trend-insights-toggle');
  if(!overflow||!btn)return;
  const showing=overflow.style.display!=='none';
  overflow.style.display=showing?'none':'flex';
  btn.textContent=showing?btn.textContent.replace('Hide','Show all'):btn.textContent.replace(/Show all.*/,'Hide extra insights');
}

function avgGateForRel(r){
  let t=0,c=0;
  (r.projects||[]).forEach(p=>{if(p.gateScore!=null){t+=p.gateScore;c++;}});
  return c?Math.round(t/c):null;
}

function renderReleaseSparklines(snapshots){
  if(!snapshots||snapshots.length<2)return;
  const recent=snapshots.slice(-8);
  releases.forEach(r=>{
    const canvas=document.getElementById('spark-'+r.id);if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const w=canvas.offsetWidth||canvas.parentElement.offsetWidth||200;
    const h=32;canvas.width=w;canvas.height=h;
    // Get gate scores for this release across snapshots
    const points=recent.map(s=>{
      const sr=s.releases.find(sr=>sr.id===r.id||sr.name===r.name);
      if(!sr)return null;
      return avgGateForRel(sr);
    });
    if(points.filter(p=>p!=null).length<2){ctx.clearRect(0,0,w,h);return;}
    const validPts=points.map((p,i)=>p!=null?{x:i,y:p}:null).filter(Boolean);
    const minY=0;const maxY=100;const rangeY=maxY-minY||1;
    const padX=4;const padY=4;
    const scaleX=(w-padX*2)/(recent.length-1);
    const scaleY=(h-padY*2)/rangeY;
    // Determine color based on trend
    const first=validPts[0].y;const last=validPts[validPts.length-1].y;
    const trending=last>first?'up':last<first?'down':'flat';
    const color=trending==='up'?'rgba(29,104,64,0.9)':trending==='down'?'rgba(139,26,26,0.9)':'rgba(184,146,42,0.9)';
    const fillColor=trending==='up'?'rgba(29,104,64,0.15)':trending==='down'?'rgba(139,26,26,0.15)':'rgba(184,146,42,0.15)';
    ctx.clearRect(0,0,w,h);
    // Fill
    ctx.beginPath();
    ctx.moveTo(padX+validPts[0].x*scaleX,h-padY);
    validPts.forEach(p=>{ctx.lineTo(padX+p.x*scaleX,h-padY-(p.y-minY)*scaleY);});
    ctx.lineTo(padX+validPts[validPts.length-1].x*scaleX,h-padY);
    ctx.closePath();ctx.fillStyle=fillColor;ctx.fill();
    // Line
    ctx.beginPath();
    validPts.forEach((p,i)=>{const x=padX+p.x*scaleX;const y=h-padY-(p.y-minY)*scaleY;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    // End dot
    const lastPt=validPts[validPts.length-1];
    ctx.beginPath();ctx.arc(padX+lastPt.x*scaleX,h-padY-(lastPt.y-minY)*scaleY,3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  });
}

// ════════════════════════════════════════════════════════
// ACCESSIBILITY HELPERS
// ════════════════════════════════════════════════════════
function trapFocus(modal){
  const focusable=modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
  if(!focusable.length)return;
  const first=focusable[0];const last=focusable[focusable.length-1];
  modal._trapHandler=function(e){
    if(e.key!=='Tab')return;
    if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last.focus();}}
    else{if(document.activeElement===last){e.preventDefault();first.focus();}}
  };
  modal.addEventListener('keydown',modal._trapHandler);
  first.focus();
}

function releaseFocusTrap(modal){
  if(modal._trapHandler){modal.removeEventListener('keydown',modal._trapHandler);delete modal._trapHandler;}
}

// Enhance openModal/closeModal with focus trapping
const _origOpenModal=openModal;
openModal=function(id){
  _origOpenModal(id);
  const m=document.getElementById(id);
  if(m){trapFocus(m);m.setAttribute('aria-hidden','false');}
};
const _origCloseModal=closeModal;
closeModal=function(id){
  const m=document.getElementById(id);
  if(m){releaseFocusTrap(m);m.setAttribute('aria-hidden','true');}
  _origCloseModal(id);
};

function announceToSR(msg){
  const el=document.getElementById('sr-announcer');
  if(el){el.textContent='';setTimeout(()=>{el.textContent=msg;},50);}
}

// ════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════
// Check readonly mode before auth
if(checkReadOnlyParam()){
  // In readonly mode, skip login and load demo or existing data
  document.addEventListener('DOMContentLoaded',()=>{
    enableReadOnly();
  });
}
initAuth();
