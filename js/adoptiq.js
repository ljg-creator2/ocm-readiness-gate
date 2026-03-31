'use strict';
// ════════════════════════════════════════════════════════
// SUPABASE AUTH
// ════════════════════════════════════════════════════════
const SUPABASE_URL='https://yufehucjvviwanbulcok.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_6YS9ifWHEU53f-H9svKJpg_paNqSFam';
const _supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

function showLogin(){document.getElementById('v-login').classList.add('active');document.getElementById('v-portfolio').classList.remove('active');document.getElementById('v-release').classList.remove('active');document.getElementById('v-project').classList.remove('active');}
function hideLogin(){document.getElementById('v-login').classList.remove('active');}
function hideAllLoginPanels(){['login-signin','login-signup','login-forgot','login-verify'].forEach(id=>document.getElementById(id).style.display='none');}
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
  await loadData();renderPortfolio();renderAlerts();document.getElementById('v-portfolio').classList.add('active');
  checkPendingInvites();
  // Show onboarding for new users
  const{data:{user}}=await _supabase.auth.getUser();
  if(user&&!user.user_metadata?.onboarded&&releases.length===0){
    document.getElementById('welcome-modal').classList.add('open');
  }
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

async function initAuth(){
  const{data:{session}}=await _supabase.auth.getSession();
  if(session&&session.user){
    if(!session.user.email_confirmed_at){await _supabase.auth.signOut();return;}
    currentUserId=session.user.id;
    hideLogin();await bootApp();updateAvatars();
  }
}

// ════════════════════════════════════════════════════════
// USER PROFILE
// ════════════════════════════════════════════════════════
function getInitials(name){
  if(!name)return '?';
  const parts=name.trim().split(/\s+/);
  if(parts.length>=2)return(parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function updateAvatars(){
  _supabase.auth.getUser().then(({data:{user}})=>{
    if(!user)return;
    const meta=user.user_metadata||{};
    const name=meta.full_name||'';
    const initials=getInitials(name);
    const display=name||user.email.split('@')[0];
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
  const{error:metaErr}=await _supabase.auth.updateUser({data:{full_name:name,organization:org,role:role}});
  if(metaErr){msgEl.style.color='var(--red)';msgEl.textContent=metaErr.message;return;}

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
  setTimeout(()=>{closeModal('profile-modal');},1200);
}

// ════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════
const GATE_DEFS=[
  {id:'g1',label:'Gate 1',sub:'Post-Requirements / Pre-Design',items:[
    {text:'Impacted user groups identified via Impact Analysis',owner:'impl'},
    {text:'Preliminary stakeholder matrix drafted and shared with Training',owner:'impl'},
    {text:'High-level scope of system changes documented',owner:'dev'},
    {text:'Training approach approved (ILT, vILT, eLearning, job aids)',owner:'train'},
    {text:'Training budget and resourcing confirmed',owner:'train'}
  ]},
  {id:'g2',label:'Gate 2',sub:'Post-Design / Pre-Development',items:[
    {text:'Finalized stakeholder matrix with role-level mapping',owner:'impl'},
    {text:'Training environment plan confirmed (ownership, access, timeline)',owner:'dev'},
    {text:'SME assignments confirmed and communicated',owner:'pm'},
    {text:'Curriculum outline approved',owner:'train'},
    {text:'Training calendar windows identified and protected',owner:'pm'},
    {text:'Communications plan aligned with Training delivery schedule',owner:'impl'}
  ]},
  {id:'g3',label:'Gate 3',sub:'Post-Dev / Pre-UAT',items:[
    {text:'Training environment accessible and stable',owner:'dev'},
    {text:'SMEs available and confirmed for content validation',owner:'pm'},
    {text:'Tech transfer date locked or within confirmed window',owner:'dev'},
    {text:'TTT schedule drafted and distributed',owner:'train'},
    {text:'System changes from Development documented and communicated to Training',owner:'dev'},
    {text:'End user training materials in active development',owner:'train'}
  ]},
  {id:'g4',label:'Gate 4',sub:'Post-UAT / Pre-Go-Live',items:[
    {text:'TTT complete with documented sign-off',owner:'train'},
    {text:'Training environment mirrors production as closely as possible',owner:'dev'},
    {text:'Final user list confirmed by role and population',owner:'pm'},
    {text:'Go-live date locked with change freeze window communicated',owner:'pm'},
    {text:'Post-release monitoring plan confirmed between Implementation and Training',owner:'impl'},
    {text:'Floor support and help desk coverage plan in place',owner:'train'}
  ]}
];
const RC={
  g1:['Training cannot size effort, timeline, or resources. All downstream planning is speculative.',
      'Training cannot determine who requires training or at what scale.',
      'Training scope is undefined. Curriculum development cannot be initiated.',
      'Delivery format unknown. Materials development and vendor sourcing are blocked.',
      'Training cannot be adequately staffed. Schedule risk is elevated.'],
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
const WS=['OCM Implementation','Project Management','Functional','App Dev','QA','UAT','Training Environment'];
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
  {key:'ocm_impl',label:'OCM Implementation'},
  {key:'pm',label:'Project Management'},
  {key:'func',label:'Functional'},
  {key:'appdev',label:'App Dev'},
  {key:'qa',label:'QA'},
  {key:'uat',label:'UAT'},
  {key:'train_env',label:'Training Environment'},
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
    if(ic)ic.textContent=t==='dark'?'☀':'☽';
    if(lb)lb.textContent=t==='dark'?'Light':'Dark';
  });
}
function toggleTheme(){applyTheme(theme==='light'?'dark':'light');}
applyTheme(theme);

// ════════════════════════════════════════════════════════
// PERSISTENCE — Supabase primary, localStorage offline cache
// ════════════════════════════════════════════════════════
function showSaveIndicator(text){
  clearTimeout(saveIndTimer);
  ['save-ind','save-ind-r','save-ind-p'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.textContent=text||'Saved';el.classList.add('vis');}
  });
  saveIndTimer=setTimeout(()=>{['save-ind','save-ind-r','save-ind-p'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('vis');});},2400);
}

async function saveData(){
  try{localStorage.setItem(storageKey(),JSON.stringify(releases));}catch(e){}
  showSaveIndicator('Saving\u2026');
  if(currentUserId){
    const{error}=await _supabase.from('user_data').upsert({user_id:currentUserId,releases:releases,updated_at:new Date().toISOString()});
    if(error){console.error('Supabase save:',error);showSaveIndicator('Saved locally');return;}
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
  // Migrate all project resources to array format
  releases.forEach(r=>{
    delete r.resources; // remove release-level resources (no longer used)
    (r.projects||[]).forEach(p=>migrateResources(p));
  });
}

function schedSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveData,600);}

// ════════════════════════════════════════════════════════
// DATA FACTORIES
// ════════════════════════════════════════════════════════
function newRelease(name,agencies,golive,phase){
  return{id:Date.now(),name,agencies:agencies||[],golive:golive||'',phase:phase||'',
    modified:new Date().toISOString(),projects:[]
  };
}
function newProject(name,agencies,users){
  const res={};RES_ROLES.forEach(r=>{res[r.key]=[];});
  return{id:Date.now(),name,agencies:agencies||[],estimatedUsers:users||0,
    trainingRequired:true,status:'Not Started',
    gateState:{},depHM:{},depNotes:{},stakeholders:[],
    adkarScores:{A1:3,D:3,K:3,Ab:3,R:3},adkarNotes:{A1:'',D:'',K:'',Ab:'',R:''},
    resources:res
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
  GATE_DEFS.forEach(g=>{g.items.forEach((_,i)=>{tot++;if(p.gateState[g.id+'_'+i]==='green')grn++;});});
  return tot?Math.round(grn/tot*100):null;
}
function projFlagCount(p){
  let n=0;
  GATE_DEFS.forEach(g=>{g.items.forEach((_,i)=>{if(p.gateState[g.id+'_'+i]==='red')n++;});});
  return n;
}
function projAdkarAvg(p){
  const v=Object.values(p.adkarScores);
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
function relRollup(r){
  const projs=r.projects||[];
  if(!projs.length)return{gateScore:null,flags:0,adkar:null,status:{label:'On Track',cls:'on-track'}};
  const scores=projs.map(p=>projGateScore(p)).filter(s=>s!==null);
  const gateScore=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
  const flags=projs.reduce((s,p)=>s+projFlagCount(p),0);
  const adkars=projs.map(p=>parseFloat(projAdkarAvg(p)));
  const adkar=adkars.length?(adkars.reduce((a,b)=>a+b,0)/adkars.length).toFixed(1):null;
  const reds=projs.reduce((s,p)=>s+Object.values(p.gateState).filter(v=>v==='red').length,0);
  const status=reds>=3?{label:'Critical',cls:'critical'}:reds>=1?{label:'At Risk',cls:'at-risk'}:{label:'On Track',cls:'on-track'};
  return{gateScore,flags,adkar,status};
}
function adoptScore(f){const v=Object.values(f);return Math.round(v.reduce((a,b)=>a+b,0)/v.length/5*100);}
function adoptTier(s){if(s>=80)return{tier:'Low Risk',cls:'low'};if(s>=60)return{tier:'Moderate Risk',cls:'mod'};if(s>=40)return{tier:'High Risk',cls:'high'};return{tier:'Critical Risk',cls:'crit'};}
function facTier(v){if(v>=4)return'low';if(v>=3)return'mod';if(v>=2)return'high';return'crit';}
function kirkReady(sh){let f=0;const k=sh.kirk;if(k.L1.method)f++;if(k.L1.timing)f++;if(k.L2.method)f++;if(k.L2.assessment)f++;if(k.L3.observable)f++;if(k.L3.interval)f++;if(k.L4.outcome)f++;if(k.L4.metric)f++;return Math.round(f/8*100)>=75?'ready':Math.round(f/8*100)>=40?'partial':'needed';}
function reinReady(sh){let f=0;if(sh.rein.owner)f++;if(sh.rein.activities)f++;if(sh.rein.intervals.length)f++;if(sh.rein.escalation)f++;return f>=3?'ready':f>=1?'partial':'needed';}
function badgeLabel(r){return r==='ready'?'Ready':r==='partial'?'In Progress':'Not Started';}
function daysTo(d){if(!d)return null;const r=Math.ceil((new Date(d)-new Date())/86400000);return r>0?r:0;}
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
function goPortfolio(){activeRelId=null;activeProjId=null;showView('v-portfolio');renderPortfolio();}
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
  const r=releases.find(r=>r.id===delRelTarget);
  if(r)logAudit('release_deleted','release',r.name,{projects:(r.projects||[]).length});
  releases=releases.filter(r=>r.id!==delRelTarget);
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
  document.getElementById('del-proj-sub').textContent=`"${name}" and all its gate data, ADKAR scores, and stakeholder groups will be permanently removed.`;
  openModal('del-proj-modal');
  setTimeout(()=>document.getElementById('del-proj-btn').focus(),50);
}
function confirmDelProject(){
  const r=getRel();if(!r)return;
  const p=r.projects.find(p=>p.id===delProjTarget);
  if(p)logAudit('project_deleted','project',p.name,{release:r.name});
  r.projects=r.projects.filter(p=>p.id!==delProjTarget);
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
  if(wd.length){const n=wd[0];const d=daysTo(n.golive);document.getElementById('ps-near-d').textContent=d!==null?d+' days':'Passed';document.getElementById('ps-near-r').textContent=n.name;}
  else{document.getElementById('ps-near-d').textContent='—';document.getElementById('ps-near-r').textContent='No go-live dates set';}
  const wrap=document.getElementById('rel-grid-wrap');
  if(!releases.length){
    wrap.innerHTML=`<div class="port-empty"><div class="pe-rule"></div><div class="pe-h">No releases added yet</div><div class="pe-s">Add your first release to begin tracking readiness and adoption across your portfolio.</div><button class="btn-gold" onclick="openAddRelease()">+ Add First Release</button></div>`;
    document.getElementById('phm-sec').style.display='none';document.getElementById('tl-sec').style.display='none';return;
  }
  wrap.innerHTML=`<div class="card-grid">${releases.map(r=>{
    const rl=relRollup(r);const d=daysTo(r.golive);const modStr=fmtMod(r.modified);
    const tl=r.resources?.train?.name||'';const tp=(r.projects||[]).filter(p=>p.trainingRequired).length;
    return`<div class="r-card" tabindex="0" draggable="true" data-rel-id="${r.id}" onclick="openRelease(${r.id})" onkeydown="if(event.key==='Enter')openRelease(${r.id})" role="button" aria-label="Open ${esc(r.name)}">
      <div class="r-card-hd">
        <div style="display:flex;align-items:center;justify-content:space-between"><div class="rc-name">${esc(r.name)}</div><span class="drag-handle" title="Drag to reorder">&#x2630;</span></div>
        <div class="chip-row">${(r.agencies||[]).map(a=>`<span class="chip chip-white">${esc(a)}</span>`).join('')}</div>
        <div class="rc-gl">Go-Live: ${fmtDate(r.golive)}</div>
        ${tl?`<div class="rc-owner">Training Lead: ${esc(tl)}</div>`:''}
        <div class="rc-mod">Updated ${modStr}</div>
      </div>
      <div class="r-card-bd">
        <div class="rc-metrics">
          <div class="rcm"><div class="rcm-l">Gate Readiness</div><div class="rcm-v">${rl.gateScore!==null?rl.gateScore+'%':'—'}</div></div>
          <div class="rcm"><div class="rcm-l">Risk Flags</div><div class="rcm-v">${rl.flags}</div></div>
          <div class="rcm"><div class="rcm-l">ADKAR Avg</div><div class="rcm-v">${rl.adkar!==null?rl.adkar+'/5':'—'}</div></div>
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
  document.getElementById('phm-sec').style.display='block';document.getElementById('tl-sec').style.display=releases.length>=2?'block':'none';document.getElementById('audit-sec').style.display='block';
  renderPortfolioHM();renderTimeline();renderAlerts();renderAuditLog();initReleaseDrag();
}

function renderPortfolioHM(){
  const cols=['Gate Readiness','ADKAR Avg','Risk Flags','Days to Go-Live','Status'];
  let h=`<thead><tr><th class="phm-rh">Release / Agencies / Go-Live</th>`;cols.forEach(c=>{h+=`<th>${c}</th>`;});h+='</tr></thead><tbody>';
  releases.forEach(r=>{
    const rl=relRollup(r);const d=daysTo(r.golive);
    const gcls=hmCellCls(rl.gateScore,[80,50]);
    const acls=rl.adkar?hmCellCls(parseFloat(rl.adkar),[4,3]):'n';
    const fcls=rl.flags===0?'g':rl.flags<=2?'a':'r';
    const dcls=d===null?'n':hmCellCls(d,[30,14]);
    const scls=rl.status.cls==='on-track'?'g':rl.status.cls==='at-risk'?'a':'r';
    h+=`<tr>
      <td class="phm-rl" onclick="openRelease(${r.id})" tabindex="0" onkeydown="if(event.key==='Enter')openRelease(${r.id})">
        ${esc(r.name)}<div class="phm-rl-sub">${(r.agencies||[]).map(a=>esc(a)).join(' · ')||'—'} &nbsp;|&nbsp; ${fmtDate(r.golive)}</div>
      </td>
      <td><div class="hmc-w"><div class="hmc ${gcls}">${rl.gateScore!==null?rl.gateScore+'%':'Not Set'}</div></div></td>
      <td><div class="hmc-w"><div class="hmc ${acls}">${rl.adkar!==null?rl.adkar+'/5':'Not Set'}</div></div></td>
      <td><div class="hmc-w"><div class="hmc ${fcls}">${rl.flags}</div></div></td>
      <td><div class="hmc-w"><div class="hmc ${dcls}">${d!==null?d+' days':'—'}</div></div></td>
      <td><div class="hmc-w"><div class="hmc ${scls}">${rl.status.label}</div></div></td>
    </tr>`;
  });
  h+='</tbody>';document.getElementById('portfolio-hm').innerHTML=h;
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
    <div class="tl-track"><div class="tl-today" style="left:${todayPct}%;height:100%"><div class="tl-today-l">Today</div></div>`;
    if(r.golive){const gl=new Date(r.golive);gl.setHours(0,0,0,0);const glPct=pct(gl);const passed=gl<today;const bL=passed?glPct:todayPct;const bW=passed?Math.max(todayPct-glPct,0.8):Math.max(glPct-todayPct,0.8);
      html+=`<div class="tl-bar-w" style="left:${bL}%;width:${bW}%" onclick="openRelease(${r.id})"><div class="tl-bar ${passed?'bnd':bCls}"><span class="tl-bar-l">${passed?esc(r.name)+' — passed':esc(r.name)}</span></div></div>
      <div class="tl-mkr ${mCls}" style="left:calc(${glPct}% - 5px)"></div><div class="tl-gl-d" style="left:${glPct}%">${fmtDate(r.golive)}</div>`;
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
  const d=daysTo(v);document.getElementById('rel-days-num').textContent=d!==null?d:'—';
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
function renderRelView(){renderRelSumBar();renderRelScope();renderRelKPIs();renderRelProjCards();renderRelOverview();applyRoleRestrictions();}
function renderRelSumBar(){
  const r=getRel();if(!r)return;
  document.getElementById('rsb-name').textContent=r.name||'—';
  document.getElementById('rsb-chips').innerHTML=(r.agencies||[]).map(a=>`<span class="chip chip-white" style="margin-right:4px">${esc(a)}</span>`).join('');
  document.getElementById('rsb-tl').textContent=r.resources?.train?.name||'Not assigned';
  document.getElementById('rsb-pm').textContent=r.resources?.pm?.name||'Not assigned';
  const rl=relRollup(r);const chip=document.getElementById('rsb-chip');
  chip.className='rsb-chip '+rl.status.cls;chip.textContent=rl.status.label;
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
          <div class="pcm"><div class="pcm-l">ADKAR</div><div class="pcm-v">${adk}/5</div></div>
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
function renderProjAll(){renderPGates();renderPDepHM();renderPAdkar();renderPSH();renderPKPIs();renderPOverview();renderPResources();}

function renderPGates(){
  const p=getProj();if(!p)return;
  const c=document.getElementById('p-gates-container');c.innerHTML='';
  GATE_DEFS.forEach(gate=>{
    const tot=gate.items.length;
    const grn=gate.items.filter((_,i)=>p.gateState[gate.id+'_'+i]==='green').length;
    const pct=Math.round(grn/tot*100);
    const barColor=pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--red)';
    const div=document.createElement('div');div.className='gate-panel';
    div.innerHTML=`<div class="gate-hdr"><div class="gate-ttl">${gate.label} — ${gate.sub}</div><div class="gate-tag" id="pgs-${gate.id}">${grn}/${tot} &nbsp; ${pct}%</div></div>
    <div class="gate-bar"><div class="gate-fill" id="pgf-${gate.id}" style="width:${pct}%;background:${barColor}"></div></div>
    <div class="gate-items">${gate.items.map((item,i)=>{const st=p.gateState[gate.id+'_'+i]||null;
      return`<div class="gate-item"><div class="gate-txt">${item.text}</div>
        <div class="ss-row" role="group">
          <button class="ss-btn ${st==='green'?'sc':''}" onclick="setPGate('${gate.id}',${i},'green')">Complete</button>
          <button class="ss-btn ${st==='yellow'?'sp':''}" onclick="setPGate('${gate.id}',${i},'yellow')">Partial</button>
          <button class="ss-btn ${st==='red'?'si':''}" onclick="setPGate('${gate.id}',${i},'red')">Incomplete</button>
        </div></div>`;}).join('')}</div>`;
    c.appendChild(div);
  });
  updateProjGateScoreBand();
}
function setPGate(gid,idx,color){
  const p=getProj();if(!p)return;
  const k=gid+'_'+idx;p.gateState[k]=p.gateState[k]===color?null:color;
  const gate=GATE_DEFS.find(g=>g.id===gid);
  if(gate){
    const tot=gate.items.length;const grn=gate.items.filter((_,i)=>p.gateState[gid+'_'+i]==='green').length;
    const pct=Math.round(grn/tot*100);const bc=pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--red)';
    const se=document.getElementById('pgs-'+gid);const fe=document.getElementById('pgf-'+gid);
    if(se)se.textContent=`${grn}/${tot}   ${pct}%`;if(fe){fe.style.width=pct+'%';fe.style.background=bc;}
  }
  renderPGates();renderPKPIs();touch('proj');schedSave();
}

const HMS=['Not Set','Complete','Partial','Blocking'];
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
function cyclePHMCell(k){const p=getProj();if(!p)return;p.depHM[k]=((p.depHM[k]||0)+1)%4;renderPDepHM();touch('proj');schedSave();}
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
        f.push({gate:gate.label,sub:gate.sub,item:item.text,consequence:RC[gate.id]?.[i]||'Training delivery is at risk.',key:gate.id+'_'+i,defOwner});
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
  document.getElementById('p-adkar-grid').innerHTML=ADKAR_DIMS.map(d=>`
    <div class="ak-col"><div class="ak-hd"><div class="ak-ltr">${d.letter}</div><div class="ak-wrd">${d.word}</div></div>
    <div class="ak-bd"><label>Readiness Score</label>
    <div class="ak-sr"><input type="range" class="ak-sl" min="1" max="5" value="${p.adkarScores[d.key]}" oninput="updatePAdkar('${d.key}',this.value)">
    <div class="ak-vl" id="pav-${d.key}">${p.adkarScores[d.key]}</div></div>
    <div class="ak-bar"><div class="ak-bar-fill" id="pab-${d.key}" style="width:${p.adkarScores[d.key]/5*100}%;background:${adkarColor(p.adkarScores[d.key])}"></div></div>
    <label style="margin-top:3px">Qualitative Notes</label>
    <textarea class="ak-notes" placeholder="${d.desc}..." oninput="updatePAdkarNote('${d.key}',this.value)">${esc(p.adkarNotes[d.key])}</textarea>
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
  const vals=Object.values(p.adkarScores);const avg=(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
  document.getElementById('p-adkar-overall').textContent=avg+'/5';
  document.getElementById('p-adkar-int').textContent=
    avg>=4?'Strong organizational readiness. Sustain momentum through targeted reinforcement and visible sponsor engagement.'
    :avg>=3?'Moderate readiness. Targeted interventions recommended for dimensions scoring below 3.'
    :avg>=2?'Readiness gaps identified. Structured engagement, coaching, and sponsor activation required prior to go-live.'
    :'Critical readiness deficit. Recommend formal escalation to executive sponsor before proceeding.';
  const kpi=document.getElementById('p-kpi-adkar');if(kpi)kpi.textContent=avg+'/5';
}

function addPSH(){
  const p=getProj();if(!p)return;
  const inp=document.getElementById('p-sh-inp');const name=inp.value.trim();if(!name)return;
  p.stakeholders.push({id:Date.now(),name,
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
            <input class="lo-inp" value="${o.replace(/"/g,'&quot;')}" placeholder="The learner will be able to..." oninput="updatePLO(${sh.id},${i},this.value)">
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
        <div class="exp-tog-l">Reinforcement Plan — ADKAR R Alignment<span class="exp-badge ${rr}">${badgeLabel(rr)}</span></div>
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
          <div class="ak-r-note"><strong>ADKAR Reinforcement Score: ${adkarR}/5 —</strong> ${rNote}</div>
        </div>
      </div>
    </div></div>`;
  }).join('');
  renderPAHM();
}
function updatePFac(id,key,val){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.factors[key]=parseInt(val);const ve=document.getElementById(`pfv-${id}-${key}`);const de=document.getElementById(`pfd-${id}-${key}`);if(ve)ve.textContent=val;if(de)de.textContent=FD[parseInt(val)];renderPSH();renderPKPIs();touch('proj');schedSave();}
function addPLO(id){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.objectives.push('');renderPSH();const b=document.getElementById('plo-'+id);if(b){b.classList.add('open');const a=document.getElementById('parr-lo-'+id);if(a)a.classList.add('open');}touch('proj');schedSave();}
function removePLO(id,idx){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.objectives.splice(idx,1);renderPSH();touch('proj');schedSave();}
function updatePLO(id,idx,val){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.objectives[idx]=val;touch('proj');schedSave();}
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
    return`<div class="res-card">
      <div class="res-role">${role.label}</div>
      ${entries.map((entry,i)=>`<div class="res-fields" style="margin-bottom:6px;position:relative">
        <div><div class="res-field"><label>Name</label><input class="res-inp" type="text" value="${esc(entry.name||'')}" placeholder="Full name" oninput="updatePRes('${role.key}',${i},'name',this.value)"></div></div>
        <div><div class="res-field"><label>Contact / Agency</label><input class="res-inp" type="text" value="${esc(entry.contact||'')}" placeholder="Email or agency" oninput="updatePRes('${role.key}',${i},'contact',this.value)"></div></div>
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
    gate.items.forEach((item,i)=>{const s=p.gateState[gate.id+'_'+i];const sym=s==='green'?'[COMPLETE]   ':s==='yellow'?'[PARTIAL]    ':s==='red'?'[INCOMPLETE] ':'[NOT SET]    ';t+=`  ${sym} ${item.text}\n`;});
  });
  t+='\n\nADKAR ASSESSMENT\n'+'─'.repeat(45)+'\n';
  t+=`Overall Score: ${avg}/5\n\n`;
  ADKAR_DIMS.forEach(d=>{t+=`${d.word} (${d.letter}): ${p.adkarScores[d.key]}/5\n`;if(p.adkarNotes[d.key])t+=`  Notes: ${p.adkarNotes[d.key]}\n`;});
  t+='\n\nACTIVE RISK FLAGS ('+flags.length+')\n'+'─'.repeat(45)+'\n';
  if(!flags.length){t+='No active risk flags.\n';}
  else{flags.forEach((fl,i)=>{t+=`\nFlag ${i+1}: ${fl.gate} — ${fl.sub}\n  Gap:          ${fl.item}\n  Consequence:  ${fl.consequence}\n`;const ow=document.getElementById('own_'+fl.key),du=document.getElementById('due_'+fl.key);if(ow?.value)t+=`  Owner:        ${ow.value}\n`;if(du?.value)t+=`  Resolution:   ${du.value}\n`;});}
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
  doc.setFillColor(12,31,63);doc.rect(0,0,w,28,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(184,146,42);
  doc.text('AdoptIQ',14,18);
  doc.setFontSize(9);doc.setTextColor(255,255,255);
  doc.text('Providence Consulting Firm',w-14,13,{align:'right'});
  doc.setFontSize(7);doc.text('CPTM · ATD Master Trainer · ADKAR-Aligned',w-14,19,{align:'right'});
  doc.setTextColor(0,0,0);
  return 36;
}
function pdfFooter(doc,w,h,pg){
  doc.setFillColor(12,31,63);doc.rect(0,h-12,w,12,'F');
  doc.setFontSize(7);doc.setTextColor(255,255,255);
  doc.text('Generated by AdoptIQ | Providence Consulting Firm',14,h-4);
  doc.text('Page '+pg,w-14,h-4,{align:'right'});
  doc.setTextColor(0,0,0);
}
function pdfSection(doc,y,title,w){
  doc.setFillColor(240,237,230);doc.rect(10,y,w-20,8,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(12,31,63);
  doc.text(title,14,y+6);doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');
  return y+12;
}
function pdfBar(doc,x,y,w,pct,fillR,fillG,fillB){
  doc.setFillColor(230,230,230);doc.roundedRect(x,y,w,5,2,2,'F');
  if(pct>0){doc.setFillColor(fillR,fillG,fillB);doc.roundedRect(x,y,w*pct/100,5,2,2,'F');}
}
function pdfCheckPage(doc,y,w,h,pg,needed){
  if(y+needed>h-18){pdfFooter(doc,w,h,pg[0]);pg[0]++;doc.addPage();y=pdfHeader(doc,w);} return y;
}

function exportProjectPDF(){
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
      const clr=s==='green'?[29,104,64]:s==='yellow'?[138,92,0]:s==='red'?[139,26,26]:[180,180,180];
      doc.setFillColor(...clr);doc.circle(17,y-1.2,1.5,'F');
      doc.setFontSize(7.5);doc.text(item.text,22,y);y+=4.5;
    });
    y+=3;
  });
  // ADKAR
  y=pdfCheckPage(doc,y,w,h,pg,40);
  y=pdfSection(doc,y,'ADKAR Assessment',w);
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
  doc.save(`AdoptIQ-${r.name.replace(/[^a-z0-9]/gi,'-')}-${p.name.replace(/[^a-z0-9]/gi,'-')}.pdf`);
}

function exportReleasePDF(){
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
    doc.autoTable({startY:y,head:[['Project','Status','Agencies','Gate Score','ADKAR','Flags']],body:rows,
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
  doc.save(`AdoptIQ-${r.name.replace(/[^a-z0-9]/gi,'-')}-Release-Summary.pdf`);
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
// TEAM COLLABORATION + RBAC
// ════════════════════════════════════════════════════════
let currentUserRole='owner'; // default for own releases

async function ensureTeam(releaseId){
  // Get or create a team record for this release
  const{data}=await _supabase.from('teams').select('id').eq('release_id',releaseId).eq('owner_id',currentUserId).maybeSingle();
  if(data)return data.id;
  const{data:newTeam,error}=await _supabase.from('teams').insert({release_id:releaseId,owner_id:currentUserId}).select('id').single();
  if(error){console.error('Create team:',error);return null;}
  return newTeam.id;
}

function openInviteModal(){
  document.getElementById('invite-email').value='';
  document.getElementById('invite-role').value='editor';
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
  const teamId=await ensureTeam(r.id);if(!teamId)return;
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
      const badgeCls=m.role==='editor'?'editor':'viewer';
      html+=`<div class="team-member-row"><span class="team-role-badge ${badgeCls}">${m.role}</span><span>${esc(name)}</span>
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
  if(teamBtn)teamBtn.style.display=role==='owner'?'':'none';
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
  const r=newRelease('6/21 Release',['Agency Alpha','Agency Beta'],'2026-07-21','Development');
  const p1=newProject('Benefits Modernization',['Agency Alpha'],1200);
  p1.status='In Progress';
  p1.gateState={g1_0:'green',g1_1:'green',g1_2:'green',g1_3:'yellow',g1_4:'green',g2_0:'green',g2_1:'yellow',g2_2:'green',g2_3:'green',g2_4:'red',g2_5:'yellow',g3_0:'red',g3_1:'yellow'};
  p1.adkarScores={A1:4,D:3,K:3,Ab:2,R:2};
  p1.adkarNotes={A1:'Strong executive communications delivered',D:'Middle management resistance in field offices',K:'',Ab:'New system training not yet scheduled',R:''};
  migrateResources(p1);
  p1.resources.ocm_impl=[{name:'Jordan Lee',contact:'jordan.lee@agency-alpha.gov'}];
  p1.resources.pm=[{name:'Maria Santos',contact:'maria.santos@agency-alpha.gov'}];
  p1.resources.func=[{name:'David Chen',contact:'david.chen@agency-alpha.gov'}];
  p1.resources.train_env=[{name:'Sarah Kim',contact:'sarah.kim@agency-alpha.gov'}];
  p1.stakeholders=[{
    name:'Field Office Supervisors',factors:{resistance:3,env:4,window:3,complexity:4,saturation:3,leadership:3},
    objectives:['Navigate new case management workflow','Generate exception reports','Escalate system-flagged discrepancies'],
    kirk:{L1:{method:'Post-training survey',timing:'Same day'},L2:{method:'Simulation exercise',assessment:'Pass/fail practical'},L3:{observable:'Case processing time',interval:'30-day post go-live'},L4:{outcome:'15% reduction in processing errors',metric:'Error rate dashboard'}},
    rein:{owner:'Regional Directors',activities:'Bi-weekly check-ins + dashboard reviews',intervals:['Week 2','Week 4','Week 8'],escalation:'Escalate to Program Director if adoption < 70%'}
  }];
  const p2=newProject('Portal Redesign',['Agency Beta'],3500);
  p2.status='Not Started';
  p2.gateState={g1_0:'green',g1_1:'yellow',g1_2:'green',g1_3:'red',g1_4:'red'};
  p2.adkarScores={A1:2,D:2,K:1,Ab:1,R:1};
  migrateResources(p2);
  p2.resources.ocm_impl=[{name:'Alex Rivera',contact:'alex.rivera@agency-beta.gov'}];
  p2.resources.pm=[{name:'Priya Patel',contact:'priya.patel@agency-beta.gov'}];
  r.projects=[p1,p2];
  releases.push(r);
  await saveData();renderPortfolio();renderAlerts();
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

async function renderAuditLog(){
  const container=document.getElementById('audit-log-body');if(!container)return;
  container.innerHTML='<div style="color:var(--ink-60);font-size:12px;padding:8px 0">Loading\u2026</div>';
  const{data,error}=await _supabase.from('audit_log').select('*').eq('user_id',currentUserId).order('created_at',{ascending:false}).limit(50);
  if(error||!data||!data.length){container.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">No activity recorded yet.</p></div>';return;}
  const ACTION_LABELS={release_created:'Release Created',release_deleted:'Release Removed',project_created:'Project Added',project_deleted:'Project Removed',gate_updated:'Gate Updated',adkar_updated:'ADKAR Updated'};
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
  const alerts=[];
  releases.forEach(r=>{
    const rl=relRollup(r);
    if(r.golive){
      const d=daysTo(r.golive);
      if(d!==null&&d>=0&&d<=30&&rl.status.cls!=='on-track')
        alerts.push({cls:'warn',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> goes live in <strong>${d} days</strong> and is ${rl.status.label}.`});
      if(d!==null&&d>=0&&d<=7)
        alerts.push({cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> goes live in <strong>${d} day${d===1?'':'s'}</strong> — final readiness check required.`});
    }
    if(rl.status.cls==='critical')
      alerts.push({cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> is <strong>Critical</strong> — ${rl.flags} active risk flag${rl.flags===1?'':'s'} require attention.`});
  });
  // Deduplicate (7-day alert supersedes 30-day)
  const seen=new Set();const deduped=alerts.filter(a=>{const k=a.msg;if(seen.has(k))return false;seen.add(k);return true;});
  if(!deduped.length){bar.style.display='none';return;}
  bar.style.display='block';
  bar.innerHTML=`<div style="max-width:1440px;margin:0 auto;padding:4px 0">${deduped.map(a=>`<div class="alert-item"><span class="alert-dot ${a.cls}"></span><span>${a.msg}</span></div>`).join('')}</div>`;
}

// ════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════
initAuth();
