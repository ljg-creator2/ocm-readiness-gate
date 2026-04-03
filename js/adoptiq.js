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
function goPortfolio(){activeRelId=null;activeProjId=null;showView('v-portfolio');renderPortfolio();announceToSR('Portfolio view loaded');}
function openRelease(id){
  activeRelId=id;activeProjId=null;
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
  if(id==='overview')renderProjOverview();
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
    div.innerHTML=`<div class="gate-hdr"><div class="gate-ttl">${gate.label} — ${gate.sub}</div><div class="gate-tag" id="pgs-${gate.id}">${grn}/${applicable} &nbsp; ${pct}%</div></div>
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

function renderPOverview(){
  const p=getProj();if(!p)return;
  renderPKPIs();
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
  h+='<div style="margin-bottom:12px"><button class="btn-gold" onclick="addGap()">+ Add Gap</button>';
  h+='<span style="margin-left:12px;font-size:10px;color:var(--ink-60);font-style:italic">Gaps received from implementation team — focus on training/adoption impact</span></div>';
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

function genStakeholderAnalysis(){
  if(!window.jspdf){alert('PDF library is still loading.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  try{
  const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];
  const brand=getBrand();
  pdfCover(doc,w,h,'Stakeholder Analysis','Adoption Risk Assessment & Engagement Strategy',p,r,brand);
  // Page 2: Inventory
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  y=pdfSection(doc,y,'Stakeholder Group Inventory',w);
  const shs=p.stakeholders||[];const igs=(p.impactAssessment?.groups)||[];
  if(shs.length===0){doc.setFontSize(10);doc.setTextColor(100,100,100);doc.text('No stakeholder groups have been added to this project.',14,y+6);y+=14;}
  else{
    const rows=shs.map(sh=>{const sc=adoptScore(sh.factors);const t=adoptTier(sc);
      const ig=igs.find(g=>g.name===sh.name);
      return[sh.name,ig?.level||'—',sc+'%',t.tier,sh.objectives?.length||0];});
    doc.autoTable({startY:y,head:[['Group','Impact','Adoption %','Risk Tier','Objectives']],body:rows,
      margin:{left:14,right:14},styles:{fontSize:8,cellPadding:2.5},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }
  // Per-group details
  shs.forEach(sh=>{
    y=pdfCheckPage(doc,y,w,h,pg,100);
    y=pdfSection(doc,y,sh.name,w);
    const sc=adoptScore(sh.factors);const t=adoptTier(sc);
    const ig=igs.find(g=>g.name===sh.name);
    // Impact & current/future state
    if(ig){
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
      doc.text('Impact Level: '+ig.level,14,y+4);y+=8;
      doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
      if(ig.currentState){doc.setFont('helvetica','bold');doc.text('Current State:',14,y+4);doc.setFont('helvetica','normal');
        const csLines=doc.splitTextToSize(ig.currentState,w-32);doc.text(csLines,14,y+9);y+=9+csLines.length*4;}
      if(ig.futureState){doc.setFont('helvetica','bold');doc.text('Future State:',14,y+4);doc.setFont('helvetica','normal');
        const fsLines=doc.splitTextToSize(ig.futureState,w-32);doc.text(fsLines,14,y+9);y+=9+fsLines.length*4;}
      y+=4;
    }
    // Adoption risk
    doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text('Adoption Likelihood: '+sc+'% ('+t.tier+')',14,y+4);y+=10;
    AF.forEach(f=>{
      const val=sh.factors?.[f.key]||3;
      doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(80,80,80);
      doc.text(f.label+': '+val+'/5',14,y+3);
      const barCol=val>=4?[29,104,64]:val>=3?[184,146,42]:[184,50,50];
      pdfBar(doc,70,y,80,val/5*100,barCol[0],barCol[1],barCol[2]);y+=7;
    });
    y+=4;
    // Kirkpatrick
    if(sh.kirk){
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);doc.text('Kirkpatrick Evaluation Plan',14,y+3);y+=8;
      const kRows=[];
      if(sh.kirk.L1?.method)kRows.push(['L1: Reaction',sh.kirk.L1.method,sh.kirk.L1.timing||'']);
      if(sh.kirk.L2?.method)kRows.push(['L2: Learning',sh.kirk.L2.method,sh.kirk.L2.assessment||'']);
      if(sh.kirk.L3?.observable)kRows.push(['L3: Behavior',sh.kirk.L3.observable,sh.kirk.L3.interval?sh.kirk.L3.interval+' days post go-live':'']);
      if(sh.kirk.L4?.outcome)kRows.push(['L4: Results',sh.kirk.L4.outcome,sh.kirk.L4.metric||'']);
      if(kRows.length){doc.autoTable({startY:y,head:[['Level','Method/Indicator','Standard/Timing']],body:kRows,
        margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
        headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
        alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
        y=doc.lastAutoTable.finalY+8;}
    }
    // Reinforcement
    if(sh.rein?.owner){
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);doc.text('Reinforcement Plan',14,y+3);y+=8;
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
      doc.text('Owner: '+(sh.rein.owner||'TBD'),14,y+3);y+=5;
      if(sh.rein.activities){const aLines=doc.splitTextToSize('Activities: '+sh.rein.activities,w-28);doc.text(aLines,14,y+3);y+=3+aLines.length*4;}
      if(sh.rein.intervals?.length){doc.text('Intervals: '+sh.rein.intervals.join(', '),14,y+3);y+=5;}
      if(sh.rein.escalation){const eLines=doc.splitTextToSize('Escalation: '+sh.rein.escalation,w-28);doc.text(eLines,14,y+3);y+=3+eLines.length*4;}
      y+=6;
    }
  });
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
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];
  const brand=getBrand();
  pdfCover(doc,w,h,'Training Plan','Kirkpatrick-Aligned Training Strategy',p,r,brand);
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  // Training scope
  y=pdfSection(doc,y,'Training Scope',w);
  const shs=p.stakeholders||[];
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  doc.text('Total stakeholder groups: '+shs.length,14,y+5);
  doc.text('Estimated end users: '+(p.estimatedUsers||'TBD'),14,y+11);
  doc.text('Training required: '+(p.trainingRequired?'Yes':'No'),14,y+17);y+=24;
  // Per-group requirements
  if(shs.length){
    y=pdfSection(doc,y,'Training Requirements by Group',w);
    const rows=shs.map(sh=>[sh.name,sh.objectives?.join('; ')||'None defined',
      sh.kirk?.L1?.method||'TBD',sh.kirk?.L1?.timing||'TBD',
      sh.kirk?.L2?.method||'TBD',sh.kirk?.L2?.assessment||'TBD',kirkReady(sh).toUpperCase()]);
    doc.autoTable({startY:y,head:[['Group','Learning Objectives','Delivery Method','Timing','Assessment','Standard','Kirk Status']],body:rows,
      margin:{left:14,right:14},styles:{fontSize:6.5,cellPadding:2},columnStyles:{1:{cellWidth:45}},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }
  // Post-training observation (L3/L4)
  const l34=shs.filter(sh=>sh.kirk?.L3?.observable||sh.kirk?.L4?.outcome);
  if(l34.length){
    y=pdfCheckPage(doc,y,w,h,pg,40);
    y=pdfSection(doc,y,'Post-Training Measurement (L3/L4)',w);
    const rows34=l34.map(sh=>[sh.name,sh.kirk?.L3?.observable||'—',
      sh.kirk?.L3?.interval?(sh.kirk.L3.interval+' days post go-live'):'—',
      sh.kirk?.L4?.outcome||'—',sh.kirk?.L4?.metric||'—']);
    doc.autoTable({startY:y,head:[['Group','Observable Behavior (L3)','Observation Interval','Business Outcome (L4)','Success Metric']],body:rows34,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }
  // Gap analysis training impacts
  const gaps=(p.gapAnalysis?.gaps||[]).filter(g=>g.trainingImpact);
  if(gaps.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'Training Adjustments from Gap Analysis',w);
    const gRows=gaps.map(g=>[g.severity,g.description?.substring(0,80)||'',g.trainingImpact,g.status]);
    doc.autoTable({startY:y,head:[['Severity','Gap','Training Impact','Status']],body:gRows,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }
  // Training team
  const trainRes=RES_ROLES.filter(ro=>['ocm_train','smes'].includes(ro.key))
    .flatMap(ro=>(p.resources?.[ro.key]||[]).filter(r=>r.name).map(r=>([ro.label,r.name,r.contact||''])));
  if(trainRes.length){
    y=pdfCheckPage(doc,y,w,h,pg,25);
    y=pdfSection(doc,y,'Training Team',w);
    doc.autoTable({startY:y,head:[['Role','Name','Contact']],body:trainRes,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
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
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];
  const brand=getBrand();
  pdfCover(doc,w,h,'Communications Plan',fwName()+'-Aligned Messaging Strategy',p,r,brand);
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  // ADKAR gap-driven objectives
  y=pdfSection(doc,y,'Communications Objectives',w);
  const scores=p.adkarScores||{A1:3,D:3,K:3,Ab:3,R:3};
  const gapDims=ADKAR_DIMS.filter(d=>(scores[d.key]||3)<3);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  if(gapDims.length===0){doc.text('All '+fwShort()+' dimensions are at acceptable levels (3+/5). Communications should focus on sustaining momentum.',14,y+5);y+=12;}
  else{
    doc.text('The following '+fwShort()+' gaps require targeted communications:',14,y+5);y+=10;
    gapDims.forEach(d=>{
      const mf=ADKAR_MSG_FOCUS[d.key]||{focus:'General awareness building',channel:'Multiple channels'};
      doc.setFont('helvetica','bold');doc.setTextColor(184,50,50);
      doc.text(d.word+' ('+scores[d.key]+'/5)',14,y+4);
      doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
      doc.text('Message focus: '+mf.focus,24,y+10);
      doc.text('Recommended channels: '+mf.channel,24,y+15);y+=22;
    });
  }
  // Audience matrix
  const shs=p.stakeholders||[];
  if(shs.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'Audience Matrix',w);
    const igs=(p.impactAssessment?.groups)||[];
    const rows=shs.map(sh=>{
      const sc=adoptScore(sh.factors);const t=adoptTier(sc);
      const ig=igs.find(g=>g.name===sh.name);
      const lowestFactor=AF.length?AF.reduce((min,f)=>(sh.factors?.[f.key]||3)<(sh.factors?.[min.key]||3)?f:min,AF[0]):null;
      const msgKey=lowestFactor?(lowestFactor.key==='resistance'?'A1':lowestFactor.key==='leadership'?'R':
        lowestFactor.key==='complexity'?'K':lowestFactor.key==='env'?'Ab':'D'):'A1';
      const mfEntry=ADKAR_MSG_FOCUS[msgKey]||{focus:'General awareness',channel:'Multiple channels'};
      return[sh.name,ig?.level||'—',mfEntry.focus,mfEntry.channel,t.tier];
    });
    doc.autoTable({startY:y,head:[['Audience','Impact','Key Message Focus','Channel','Risk Tier']],body:rows,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2.5},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }
  // ADKAR scores summary
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,fwName()+' Assessment Summary',w);
  ADKAR_DIMS.forEach(d=>{
    const val=scores[d.key]||3;const note=(p.adkarNotes||{})[d.key]||'';
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
    doc.text(d.word+': '+val+'/5',14,y+4);
    const barCol=val>=4?[29,104,64]:val>=3?[184,146,42]:[184,50,50];
    pdfBar(doc,60,y+1,80,val/5*100,barCol[0],barCol[1],barCol[2]);y+=8;
    if(note){doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100,100,100);
      const nLines=doc.splitTextToSize(note,w-28);doc.text(nLines,16,y+2);y+=2+nLines.length*4;}
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
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];
  const brand=getBrand();
  pdfCover(doc,w,h,'Resistance Management Plan','Risk Mitigation & Adoption Sustainment',p,r,brand);
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  // Risk summary
  y=pdfSection(doc,y,'Risk Summary',w);
  const flags=getProjFlags(p);const shs=p.stakeholders||[];
  const critSH=shs.filter(sh=>adoptScore(sh.factors)<60);
  const adkar=parseFloat(projAdkarAvg(p));
  const gaps=(p.gapAnalysis?.gaps||[]).filter(g=>g.description);
  const critGaps=gaps.filter(g=>g.severity==='Critical');
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  doc.text('Active risk flags: '+flags.length,14,y+5);
  doc.text('Critical/high-risk stakeholder groups: '+critSH.length,14,y+11);
  doc.text(fwShort()+' average: '+adkar+'/5'+(adkar<3?' (below threshold)':''),14,y+17);
  doc.text('Open implementation gaps: '+gaps.length+' ('+critGaps.length+' critical)',14,y+23);y+=32;
  // Active risk flags
  if(flags.length){
    y=pdfSection(doc,y,'Active Risk Flags',w);
    const fRows=flags.map(f=>[f.gate||'',f.item||'',f.consequence||'',f.defOwner||'Unassigned']);
    doc.autoTable({startY:y,head:[['Gate','Gap Item','Consequence','Owner']],body:fRows,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[184,50,50],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }
  // Implementation gaps
  if(gaps.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'Implementation Gaps Affecting Adoption',w);
    const gRows=gaps.map(g=>[g.severity,g.description?.substring(0,80)||'',g.trainingImpact||'—']);
    doc.autoTable({startY:y,head:[['Severity','Gap Description','Training / Adoption Impact']],body:gRows,
      margin:{left:14,right:14},styles:{fontSize:6.5,cellPadding:2},
      headStyles:{fillColor:[184,146,42],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }
  // Resistance indicators by group
  if(critSH.length){
    y=pdfCheckPage(doc,y,w,h,pg,40);
    y=pdfSection(doc,y,'Resistance Indicators by Group',w);
    critSH.forEach(sh=>{
      y=pdfCheckPage(doc,y,w,h,pg,35);
      const sc=adoptScore(sh.factors);
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(184,50,50);
      doc.text(sh.name+' — '+sc+'% adoption likelihood',14,y+4);y+=9;
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,60);
      const lowFactors=AF.filter(f=>(sh.factors?.[f.key]||3)<=2).sort((a,b)=>(sh.factors?.[a.key]||3)-(sh.factors?.[b.key]||3));
      lowFactors.forEach(f=>{
        doc.text('• '+f.label+' ('+(sh.factors?.[f.key]||3)+'/5): '+(RESIST_INTERVENTIONS[f.key]||'Targeted intervention required'),16,y+3);y+=6;
      });
      if(lowFactors.length===0&&AF.length){
        const allF=AF.map(f=>({...f,val:sh.factors?.[f.key]||3})).sort((a,b)=>a.val-b.val);
        if(allF[0])doc.text('• Lowest factor: '+allF[0].label+' ('+allF[0].val+'/5): '+(RESIST_INTERVENTIONS[allF[0].key]||'Targeted intervention required'),16,y+3);y+=6;
      }
      y+=4;
    });
  }
  // ADKAR barrier analysis
  const adkarGaps=ADKAR_DIMS.filter(d=>(p.adkarScores?.[d.key]||3)<3);
  if(adkarGaps.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,fwShort()+' Barrier Analysis',w);
    adkarGaps.forEach(d=>{
      const val=p.adkarScores[d.key];const note=(p.adkarNotes||{})[d.key]||'';
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(184,50,50);
      doc.text(d.word+': '+val+'/5',14,y+4);y+=7;
      if(note){doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(80,80,80);
        const nLines=doc.splitTextToSize(note,w-28);doc.text(nLines,16,y+2);y+=2+nLines.length*4+2;}
    });
  }
  // Reinforcement plans
  const reinShs=shs.filter(sh=>sh.rein?.owner);
  if(reinShs.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'Reinforcement Plans',w);
    const rRows=reinShs.map(sh=>[sh.name,sh.rein.owner,sh.rein.activities||'',
      sh.rein.intervals?.join(', ')||'',sh.rein.escalation||'']);
    doc.autoTable({startY:y,head:[['Group','Owner','Activities','Intervals','Escalation']],body:rRows,
      margin:{left:14,right:14},styles:{fontSize:6.5,cellPadding:2},
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
  const w=doc.internal.pageSize.getWidth();const h=doc.internal.pageSize.getHeight();const pg=[1];
  const brand=getBrand();const rec=calcReadinessRec(p);
  pdfCover(doc,w,h,'Adoption Readiness Recommendation','Gate Review Assessment',p,r,brand);
  doc.addPage();pg[0]++;let y=pdfHeader(doc,w);
  // Recommendation status
  y=pdfSection(doc,y,'Recommendation',w);
  doc.setFillColor(rec.color[0],rec.color[1],rec.color[2]);
  doc.roundedRect(14,y+2,w-28,16,3,3,'F');
  doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
  doc.text(rec.label.toUpperCase(),w/2,y+12,{align:'center'});y+=26;
  // Evidence dashboard
  y=pdfSection(doc,y,'Evidence Dashboard',w);
  const gate=projGateScore(p);const adkar=parseFloat(projAdkarAvg(p));
  const flags=getProjFlags(p);const shs=p.stakeholders||[];
  const gaps=(p.gapAnalysis?.gaps||[]).filter(g=>g.description);
  const metrics=[['Gate Readiness',(gate||0)+'%',gate>=80?'Pass':gate>=50?'Marginal':'Fail'],
    [fwShort()+' Average',adkar+'/5',adkar>=3.5?'Pass':adkar>=2.5?'Marginal':'Fail'],
    ['Active Risk Flags',flags.length+'',flags.length===0?'Pass':flags.length<=2?'Marginal':'Fail'],
    ['Open Gaps',gaps.length+'',gaps.filter(g=>g.severity==='Critical').length===0?'Pass':'Fail'],
    ['Stakeholder Groups',shs.length+'','—']];
  doc.autoTable({startY:y,head:[['Metric','Value','Assessment']],body:metrics,
    margin:{left:14,right:14},styles:{fontSize:9,cellPadding:3},
    headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
  y=doc.lastAutoTable.finalY+10;
  // ADKAR breakdown
  y=pdfCheckPage(doc,y,w,h,pg,50);
  y=pdfSection(doc,y,fwShort()+' Readiness',w);
  ADKAR_DIMS.forEach(d=>{
    const val=p.adkarScores?.[d.key]||3;
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
    doc.text(d.word,14,y+4);
    const c=val>=4?[29,104,64]:val>=3?[184,146,42]:[184,50,50];
    pdfBar(doc,55,y+1,90,val/5*100,c[0],c[1],c[2]);
    doc.text(val+'/5',150,y+4);y+=8;
  });y+=6;
  // Stakeholder readiness
  if(shs.length){
    y=pdfCheckPage(doc,y,w,h,pg,30);
    y=pdfSection(doc,y,'Stakeholder Readiness Summary',w);
    const sRows=shs.map(sh=>{const sc=adoptScore(sh.factors);return[sh.name,sc+'%',adoptTier(sc).tier,kirkReady(sh).toUpperCase(),reinReady(sh).toUpperCase()];});
    doc.autoTable({startY:y,head:[['Group','Adoption %','Risk Tier','Kirkpatrick','Reinforcement']],body:sRows,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2.5},
      headStyles:{fillColor:[12,31,63],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }
  // Risk flags
  if(flags.length){
    y=pdfCheckPage(doc,y,w,h,pg,25);
    y=pdfSection(doc,y,'Risk Flags Requiring Resolution',w);
    const fRows=flags.map(f=>[f.gate||'',f.item||'',f.consequence||'']);
    doc.autoTable({startY:y,head:[['Gate','Gap','Consequence']],body:fRows,
      margin:{left:14,right:14},styles:{fontSize:7,cellPadding:2},
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
  // Generate all 5 individually (each opens in new tab)
  // For a combined PDF, we'd need to merge — for now, generate the most comprehensive one: Readiness Recommendation
  // which contains evidence from all areas
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
