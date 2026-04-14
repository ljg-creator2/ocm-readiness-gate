'use strict';
// ════════════════════════════════════════════════════════
// SUPABASE AUTH
// ════════════════════════════════════════════════════════
const SUPABASE_URL='https://yufehucjvviwanbulcok.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_6YS9ifWHEU53f-H9svKJpg_paNqSFam';
const _supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

// ════════════════════════════════════════════════════════
// CHART.JS PCF SKIN — branded defaults, not Chart.js stock
// ════════════════════════════════════════════════════════
const PCF_COLORS=['#0b1c3f','#c75c1f','#2f7b2e','#e5cc94','#a59d5f','#2a4a80'];
if(typeof Chart!=='undefined'){
  Chart.defaults.font.family='DM Sans, sans-serif';
  Chart.defaults.font.size=11;
  Chart.defaults.color='#8a96a3';
  Chart.defaults.scale.grid.color='rgba(11,28,63,0.06)';
  Chart.defaults.scale.border={display:false};
  Chart.defaults.plugins.tooltip.backgroundColor='#021d2e';
  Chart.defaults.plugins.tooltip.titleColor='#f3f1ed';
  Chart.defaults.plugins.tooltip.bodyColor='#c8c4bc';
  Chart.defaults.plugins.tooltip.borderWidth=0;
  Chart.defaults.plugins.tooltip.padding=10;
  Chart.defaults.plugins.tooltip.cornerRadius=4;
  Chart.defaults.plugins.legend.labels.usePointStyle=true;
  Chart.defaults.plugins.legend.labels.boxWidth=8;
}

// ═══ Density Toggle ═══
function setDensity(level){
  document.body.setAttribute('data-density',level);
  localStorage.setItem('adoptiq-density',level);
  document.querySelectorAll('.density-btn').forEach(btn=>{
    btn.classList.toggle('density-btn--active',btn.textContent.trim().toLowerCase()===level);
  });
}
(function(){const saved=localStorage.getItem('adoptiq-density')||'comfortable';setDensity(saved);})();

// ═══ First-Run Onboarding Callouts ═══
function showOnboardingCallout(key,containerSelector,headline,body,ctaLabel){
  const seen=JSON.parse(localStorage.getItem('adoptiq-onboarding')||'{}');
  if(seen[key])return;
  const container=document.querySelector(containerSelector);
  if(!container)return;
  if(container.querySelector('.onboarding-callout'))return;
  const callout=document.createElement('div');
  callout.className='onboarding-callout';
  callout.innerHTML='<h4>'+headline+'</h4><p>'+body+'</p><button class="btn-sm" onclick="dismissOnboarding(this,\''+key+'\')">'+ctaLabel+'</button>';
  container.prepend(callout);
}
function dismissOnboarding(btn,key){
  if(btn&&btn.parentElement)btn.parentElement.remove();
  const s=JSON.parse(localStorage.getItem('adoptiq-onboarding')||'{}');
  s[key]=true;
  localStorage.setItem('adoptiq-onboarding',JSON.stringify(s));
}

function showLanding(){document.getElementById('v-landing').classList.add('active');document.getElementById('v-login').classList.remove('active');document.getElementById('v-portfolio').classList.remove('active');document.getElementById('v-release').classList.remove('active');document.getElementById('v-project').classList.remove('active');}
function hideLanding(){document.getElementById('v-landing').classList.remove('active');}
function showLogin(){hideLanding();document.getElementById('v-login').classList.add('active');document.getElementById('v-portfolio').classList.remove('active');document.getElementById('v-release').classList.remove('active');document.getElementById('v-project').classList.remove('active');}
function hideLogin(){document.getElementById('v-login').classList.remove('active');}
function landingToLogin(){hideLanding();showLogin();showSignin();}
async function landingToDemo(){hideLanding();hideLogin();await loadDemoData();document.getElementById('v-portfolio').classList.add('active');}
function landingBookWalkthrough(){openBookingModal();}
function openBookingModal(){
  let existing=document.getElementById('booking-modal');if(existing)existing.remove();
  const modal=document.createElement('div');modal.id='booking-modal';modal.className='lp-booking-modal';
  modal.innerHTML=`<div class="lp-booking-box">
    <button class="lp-booking-close" onclick="document.getElementById('booking-modal').remove()">&times;</button>
    <div class="lp-booking-hdr">
      <div class="lp-booking-logo">A</div>
      <h2>Book a Walkthrough</h2>
      <p>Tell us about your organization and we'll schedule a personalized demo of AdoptIQ.</p>
    </div>
    <form id="booking-form" name="walkthrough-request" method="POST" data-netlify="true" onsubmit="return submitBooking(event)">
      <input type="hidden" name="form-name" value="walkthrough-request">
      <div class="lp-booking-fields">
        <div class="lp-booking-row">
          <div class="lp-booking-field"><label>First Name *</label><input type="text" name="firstName" required placeholder="First name" autocomplete="given-name" aria-label="First name"></div>
          <div class="lp-booking-field"><label>Last Name *</label><input type="text" name="lastName" required placeholder="Last name" autocomplete="family-name" aria-label="Last name"></div>
        </div>
        <div class="lp-booking-field"><label>Work Email *</label><input type="email" name="email" required placeholder="you@organization.com" autocomplete="email" aria-label="Work email"></div>
        <div class="lp-booking-field"><label>Organization *</label><input type="text" name="organization" required placeholder="Organization name" autocomplete="organization" aria-label="Organization"></div>
        <div class="lp-booking-field"><label>Role</label><input type="text" name="role" placeholder="Your role or title" autocomplete="organization-title" aria-label="Role"></div>
        <div class="lp-booking-field"><label>What are you looking to solve?</label>
          <textarea name="message" rows="3" placeholder="Tell us about your change initiative..."></textarea></div>
        <div class="lp-booking-field"><label>Preferred Contact Method</label>
          <div class="lp-booking-prefs">
            <label class="lp-booking-pref"><input type="radio" name="contactMethod" value="email" checked> Email</label>
            <label class="lp-booking-pref"><input type="radio" name="contactMethod" value="phone"> Phone</label>
          </div>
        </div>
      </div>
      <button type="submit" class="lp-btn-primary" style="width:100%;margin-top:16px">Request Walkthrough</button>
      <p class="lp-booking-note">We typically respond within 1–3 business days.</p>
    </form>
    <div id="booking-success" style="display:none" class="lp-booking-success">
      <div class="lp-booking-check"><i class="ph ph-check-circle"></i></div>
      <h3>Request Received</h3>
      <p>Thank you. We'll be in touch within 1–3 business days to schedule your walkthrough.</p>
      <button class="lp-btn-secondary" onclick="document.getElementById('booking-modal').remove()" style="margin-top:20px">Close</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  requestAnimationFrame(()=>modal.classList.add('open'));
  modal.addEventListener('click',function(e){if(e.target===this)this.remove();});
}
function submitBooking(e){
  e.preventDefault();
  const form=document.getElementById('booking-form');
  const data=new FormData(form);
  fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data).toString()})
    .then(()=>{form.style.display='none';document.getElementById('booking-success').style.display='block';})
    .catch(()=>{form.style.display='none';document.getElementById('booking-success').style.display='block';});
  return false;
}
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
  showLanding();
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
    hideLanding();hideLogin();await bootApp();updateAvatars();
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

  msgEl.style.color='var(--green)';msgEl.textContent='Profile saved.';
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
    {text:'End-user journey map created by Implementation team',owner:'func'},
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
  {key:'A1',letter:'A',word:'Awareness',desc:'Does the organization understand why this change is happening? Without a credible \u201cwhy,\u201d resistance starts here.'},
  {key:'D',letter:'D',word:'Desire',desc:'Do people want to support this change \u2014 or are they tolerating it? Desire can\u2019t be mandated; it has to be earned.'},
  {key:'K',letter:'K',word:'Knowledge',desc:'Do people know how to change? Training and communication gaps surface here. High desire without knowledge stalls execution.'},
  {key:'Ab',letter:'A',word:'Ability',desc:'Can people actually perform the new behaviors? Ability is where theory meets practice. Low ability means the change isn\u2019t real yet.'},
  {key:'R',letter:'R',word:'Reinforcement',desc:'Are the right behaviors being recognized and sustained? Without reinforcement, change regresses. This is what makes it stick.'},
];

// ═══ ADKAR Guided Scoring Content ═══
const ADKAR_GUIDED={
  d1:{
    question:'Does this group understand why this change is happening and what happens if it doesn\u2019t?',
    fieldPrompt:'In your conversations with this group, can people tell you \u2014 in their own words \u2014 why this change is happening and what\u2019s driving it from the top?\n\nNot just the project name. The reason.',
    coachingTip:'Tip: \u201CWe\u2019re going to a new system\u201D is not Awareness.\n\u201CWe\u2019re moving to a new system because the current one can\u2019t support the growth we\u2019re targeting and leadership made the call in Q1\u201D \u2014 that\u2019s Awareness.\n\nIf people know the what but not the why, score this no higher than a 2.',
    anchors:[
      {score:1,label:'No signal',desc:'People don\u2019t know this change is happening, or they\u2019ve heard a rumor with no substance'},
      {score:2,label:'Name only',desc:'People know the project name or that \u201Csomething is changing\u201D but can\u2019t say why'},
      {score:3,label:'Partial',desc:'Some people can explain the why, others can\u2019t. Messaging has reached parts of the group'},
      {score:4,label:'Solid',desc:'Most people can explain the reason for the change in their own words, consistently'},
      {score:5,label:'Anchored',desc:'The group can articulate the why, the urgency, and the consequence of not changing'}
    ],
    barrier:'If people don\u2019t understand why this change is happening, Desire is almost meaningless \u2014 you can\u2019t want something you don\u2019t understand.\n\nFix Awareness first before drawing conclusions from any other score.',
    intervention:[
      'Find the communication gap \u2014 ask a few people: \u201CWhat have you heard about this initiative?\u201D',
      'Get a leader visible \u2014 awareness moves fastest from a trusted leader, not a project team.',
      'Make the \u201Cwhy\u201D impossible to miss \u2014 one-pagers, digital signage, manager talking points.',
      'Address the \u201Cwhat happens if we don\u2019t\u201D question \u2014 consequence, not just benefit.'
    ],
    clientLang:'Right now, most of the team knows something is coming, but they can\u2019t tell you why it matters or why it\u2019s happening now. Before we build momentum, we need the leadership message to land. That\u2019s the first thing we address.'
  },
  d2:{
    question:'Does this group want to support this change \u2014 or are they tolerating it?',
    fieldPrompt:'When you talk to people in this group, do they seem invested in making this work? Or do they seem like they\u2019re waiting to see what happens?\n\nDesire isn\u2019t enthusiasm. It\u2019s active willingness to participate and not block.',
    coachingTip:'Tip: Desire cannot be mandated \u2014 and it can\u2019t be faked for long.\nSomeone who says \u201Cyes\u201D in a meeting and does nothing afterward has low Desire. Watch behavior, not words.\n\nAlso: Desire is personal. Different subgroups within the same team can have very different scores. When in doubt, segment.',
    anchors:[
      {score:1,label:'Active resistance',desc:'People are openly opposed, pushing back publicly, or trying to block the change'},
      {score:2,label:'Passive resistance',desc:'People are compliant in meetings but disengaged, skeptical, or quietly undermining'},
      {score:3,label:'Neutral',desc:'People will participate if asked but are not invested; change feels like something happening to them'},
      {score:4,label:'Supportive',desc:'People are willing and generally positive; they ask questions and show up'},
      {score:5,label:'Advocates',desc:'People actively champion the change, bring others along, and hold peers accountable'}
    ],
    barrier:'You can train people who don\u2019t want to change. You cannot make that training stick.\n\nResistance \u2014 whether active or passive \u2014 is the most common reason change initiatives fail after go-live.',
    intervention:[
      'Find out what\u2019s behind the resistance \u2014 ask: \u201CWhat concerns do you have about this change?\u201D',
      'Address WIIFM directly \u2014 what does this change mean for someone\u2019s day-to-day work?',
      'Remove structural blockers \u2014 sometimes resistance is a real problem the project team missed.',
      'Find your advocates \u2014 peer influence moves Desire more than consultant influence.',
      'Give your sponsor work to do \u2014 sponsor visibility signals the organization is serious.'
    ],
    clientLang:'The team understands this is happening, but right now they don\u2019t feel ownership over it. Before we go further with training or process changes, we need to address some concerns that are creating friction. That\u2019s a conversation, not a communication.'
  },
  d3:{
    question:'Does this group know how to make this change \u2014 in practice, not in theory?',
    fieldPrompt:'If the system went live tomorrow, could people do their jobs?\nNot \u201Cdid they attend training.\u201D Not \u201Cwere they sent the user guide.\u201D\n\nCould they actually do it?',
    coachingTip:'Tip: Training completion rate is not a Knowledge score. Attendance is an input. Retention and application are the output.\n\nAsk a few people to walk you through how they would complete a common task in the new process. What they can and can\u2019t do tells you more than any completion dashboard.',
    anchors:[
      {score:1,label:'No knowledge',desc:'No training has occurred; people have no exposure to new processes or systems'},
      {score:2,label:'Awareness of training',desc:'Training exists or is planned, but hasn\u2019t been delivered or wasn\u2019t retained'},
      {score:3,label:'Basic knowledge',desc:'People have been trained and can recall the general process, but need significant support'},
      {score:4,label:'Operational knowledge',desc:'Most people can perform key tasks with minimal support; some edge cases need help'},
      {score:5,label:'Embedded knowledge',desc:'People can perform all tasks independently and can help train others'}
    ],
    barrier:'High Desire with low Knowledge is one of the most frustrating states for employees \u2014 they want to do the right thing but don\u2019t know how.\n\nThat frustration converts to disengagement fast if it isn\u2019t addressed.',
    intervention:[
      'Audit what training has actually happened \u2014 not what was planned, what was retained.',
      'Build role-specific job aids \u2014 break it down by role, not generic manuals.',
      'Create practice opportunities before go-live \u2014 sandbox environments, simulations.',
      'Identify floor support resources \u2014 who can someone ask a question on day one?',
      'Schedule reinforcement training \u2014 one session is never enough.'
    ],
    clientLang:'People are willing to make this work, but right now the training hasn\u2019t built the confidence they need to perform independently. We need to add role-specific practice time and make sure floor support is in place for the first two weeks after go-live.'
  },
  d4:{
    question:'Can this group actually perform the new behaviors \u2014 not just describe them?',
    fieldPrompt:'Is the gap between knowing and doing closed?\n\nKnowledge is what\u2019s in someone\u2019s head. Ability is what they can do with their hands, in their actual work environment, under real conditions.',
    coachingTip:'Tip: Ability is where process failures and system barriers live. Sometimes people know exactly what to do \u2014 and can\u2019t do it because the system won\u2019t let them, their manager won\u2019t approve it, or the new process contradicts an old policy.\n\nWhen Ability is low, ask: \u201CIs this a skill gap or a barrier?\u201D The interventions are very different.',
    anchors:[
      {score:1,label:'Cannot perform',desc:'People have not attempted the new behavior or system; no demonstrated capability'},
      {score:2,label:'Attempted, struggling',desc:'People have tried but are making errors, reverting to old behavior, or asking for constant help'},
      {score:3,label:'Performing with support',desc:'People can complete tasks but need help with exceptions, edge cases, or less common scenarios'},
      {score:4,label:'Performing independently',desc:'Most people handle their daily work without support; exceptions are manageable'},
      {score:5,label:'Proficient',desc:'People perform fluently, handle edge cases confidently, and can coach peers'}
    ],
    barrier:'This is the gap between training and performance. Until people can do the work, adoption is not real \u2014 regardless of what any other metric shows.',
    intervention:[
      'Separate skill gaps from system barriers \u2014 \u201CIs this a can\u2019t-do or a won\u2019t-let-me?\u201D',
      'Address process barriers immediately \u2014 broken workflows, missing access, conflicting policies.',
      'Add on-the-job coaching \u2014 a coach sitting next to someone while they work.',
      'Extend your support window \u2014 don\u2019t declare success until people can work without help.',
      'Track error rates and help desk volume \u2014 leading indicators of Ability.'
    ],
    clientLang:'We\u2019ve done the training, and people understand what\u2019s expected \u2014 but there\u2019s still a gap between knowing and doing. Some of that is skill, and some of it is friction in the process itself. We need two or three more weeks of floor support and we need to get three process issues resolved before we can call this adoption.'
  },
  d5:{
    question:'Are the right behaviors being recognized, sustained, and protected \u2014 or is the organization quietly reverting?',
    fieldPrompt:'Is this change holding?\n\nThree months from now, will people still be using the new process \u2014 or will they have drifted back to what\u2019s comfortable?\n\nReinforcement is what separates a change that sticks from one that gets \u201Cpiloted forever.\u201D',
    coachingTip:'Tip: Reinforcement is often skipped because it happens after go-live, and most project teams have moved on.\n\nThis is the most common cause of change failure that nobody talks about. The go-live was a success. Six months later, nobody uses the new process. That\u2019s a Reinforcement failure.',
    anchors:[
      {score:1,label:'No reinforcement',desc:'No recognition, accountability, or follow-through; reversion to old behavior is visible'},
      {score:2,label:'Informal only',desc:'Individual managers may be reinforcing, but no organizational mechanism exists'},
      {score:3,label:'Partial',desc:'Some formal reinforcement exists (recognition, metrics), but not consistently applied'},
      {score:4,label:'Consistent',desc:'Formal recognition, accountability, and performance metrics are in place and applied'},
      {score:5,label:'Embedded',desc:'New behaviors are the norm; old behaviors are visibly corrected; change is part of the culture'}
    ],
    barrier:'Without reinforcement, the change will regress. People will default to what\u2019s comfortable \u2014 not because they\u2019re resistant, but because no one told them the new way actually matters.',
    intervention:[
      'Build recognition into existing rhythms \u2014 meetings, newsletters, performance reviews.',
      'Connect behavior to performance metrics \u2014 if it\u2019s not measured, it won\u2019t hold.',
      'Create accountability without blame \u2014 \u201CWe\u2019re doing it the new way now\u201D is accountability.',
      'Run a 90-day pulse check \u2014 survey the group, surface data, act on it publicly.',
      'Celebrate early adopters \u2014 tell their story, signal what \u201Cgood\u201D looks like.'
    ],
    clientLang:'The change went live and people are using it \u2014 but we\u2019re at the most vulnerable point. Without formal recognition and accountability in place, groups tend to drift back. We want to build reinforcement into your normal operating rhythms before we step back.'
  }
};

const ADKAR_GUIDED_INTERP=[
  {min:4.5,max:5.0,label:'Ready',cls:'guided-ready',text:'This group is positioned well. Shift to Reinforcement monitoring.'},
  {min:3.5,max:4.4,label:'On track',cls:'guided-ontrack',text:'Solid foundation. Address any dimension below 3 before go-live.'},
  {min:2.5,max:3.4,label:'At risk',cls:'guided-atrisk',text:'Real gaps exist. Targeted interventions needed before go-live is advisable.'},
  {min:1.5,max:2.4,label:'High risk',cls:'guided-highrisk',text:'Significant readiness gaps. Go-live timeline should be reviewed with sponsor.'},
  {min:1.0,max:1.4,label:'Not ready',cls:'guided-notready',text:'This group is not prepared. A go-live decision requires sponsor awareness and deliberate mitigation.'}
];

const ADKAR_DIM_ORDER=['d1','d2','d3','d4','d5'];
const ADKAR_DIM_NAMES={d1:'Awareness',d2:'Desire',d3:'Knowledge',d4:'Ability',d5:'Reinforcement'};

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
let moveProjTarget=null;
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
  ['','-r','-p','-lp'].forEach(s=>{
    const ic=document.getElementById('theme-icon'+s);
    const lb=document.getElementById('theme-lbl'+s);
    if(ic)ic.innerHTML=t==='dark'?'<i class="ph ph-moon"></i>':'<i class="ph ph-sun"></i>';
    if(lb)lb.textContent=t==='dark'?'Dark':'Light';
  });
}
function toggleTheme(){const newTheme=theme==='light'?'dark':'light';applyTheme(newTheme);showSuccess(newTheme==='dark'?'Dark mode on.':'Back to light mode.');setTimeout(()=>{if(releases.length){renderPortfolioCharts();renderTrendCharts();}const p=getProj();if(p)renderProjCharts();},300);}
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
  const roleNames={admin:'Admin',staff:'Staff',exec_sponsor:'Executive Sponsor',client_viewer:'Client Viewer',editor:'Editor',viewer:'Viewer'};
  showSuccess('Viewing as '+(roleNames[role]||role)+'.');
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

function showSuccess(message){
  const toast=document.createElement('div');
  toast.className='toast toast--success';
  toast.textContent=message||'Saved';
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),3000);
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
          console.error('Supabase save failed');
          if(attempt<MAX_SAVE_RETRIES){showSaveIndicator('Retrying\u2026');await new Promise(resolve=>setTimeout(resolve,1500*(attempt+1)));continue;}
          showSaveIndicator('Couldn\u2019t save that change. Check your connection and try again.',true);return;
        }
        saved=true;break;
      }catch(netErr){
        console.error('Network save failed');
        if(attempt<MAX_SAVE_RETRIES){showSaveIndicator('Retrying\u2026');await new Promise(resolve=>setTimeout(resolve,1500*(attempt+1)));continue;}
        showSaveIndicator('Couldn\u2019t save that change. Check your connection and try again.',true);return;
      }
    }
    if(!saved){showSaveIndicator('Couldn\u2019t save that change. Check your connection and try again.',true);return;}
  }
  showSaveIndicator('Saved');
  showSuccess('Saved.');
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
    trainingRequired:true,trainingStartDate:'',status:'Not Started',golive:'',
    gateState:{},depHM:{},depNotes:{},stakeholders:[],
    adkarScores:{A1:3,D:3,K:3,Ab:3,R:3},adkarNotes:{A1:'',D:'',K:'',Ab:'',R:''},
    resources:res,
    impactAssessment:{groups:[]},
    gapAnalysis:{gaps:[]},
    pulseConfig:{},
    pulseResults:{},
    postLaunch:{},
    lifecycleSignals:{
      requirements:{onSchedule:null,daysVariance:0,reviewCycles:0,disputes:false,disputeNotes:''},
      design:{reviewsDelayed:null,delayDays:0,scopeChangeRequests:0,workaroundRequests:0,workaroundNotes:''},
      testing:{qaDefects:0,uatDefects:0,uatParticipationRate:0,testingApproach:''},
      training:{startDateChanges:0,startDateReasons:[],envDefects:0,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:0},
      deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:0,supportTicketsMonth1:0,workaroundRequestsPostGL:0}
    },
    valueCase:{statement:'',requestor:'',impactLevel:'',successCriteria:[],unintendedConsequences:''},
    proofPoints:[],
    craid:[]
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
  if(value>=q.q3)return{label:'Top Quartile',cls:'top',icon:'<i class="ph ph-arrow-up"></i>'};
  if(value>=q.median)return{label:'Above Median',cls:'above',icon:'<i class="ph ph-caret-right"></i>'};
  if(value>=q.q1)return{label:'Below Median',cls:'below',icon:'<i class="ph ph-caret-right"></i>'};
  return{label:'Bottom Quartile',cls:'bottom',icon:'<i class="ph ph-arrow-down"></i>'};
}
function adoptScore(f){if(!f||typeof f!=='object')return 0;const v=Object.values(f);if(!v.length)return 0;return Math.round(v.reduce((a,b)=>a+(+b||0),0)/v.length/5*100);}
function adoptTier(s){if(s>=80)return{tier:'Low Risk',cls:'low'};if(s>=60)return{tier:'Moderate Risk',cls:'mod'};if(s>=40)return{tier:'High Risk',cls:'high'};return{tier:'Critical Risk',cls:'crit'};}
function facTier(v){if(v>=4)return'low';if(v>=3)return'mod';if(v>=2)return'high';return'crit';}
function kirkReady(sh){if(!sh?.kirk)return'needed';let f=0;const k=sh.kirk;if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;return Math.round(f/8*100)>=75?'ready':Math.round(f/8*100)>=40?'partial':'needed';}
function reinReady(sh){if(!sh?.rein)return'needed';let f=0;if(sh.rein.owner)f++;if(sh.rein.activities)f++;if(sh.rein.intervals?.length)f++;if(sh.rein.escalation)f++;return f>=3?'ready':f>=1?'partial':'needed';}
function badgeLabel(r){return r==='ready'?'Ready':r==='partial'?'In Progress':'Not Started';}
// Training readiness is only meaningful once training has actually started.
// Before the trainingStartDate is set or reached, Kirkpatrick design
// completeness should be excluded from adoption scoring rather than dragging
// it down as a "0% ready" signal.
function trainingActive(p){
  if(!p||!p.trainingRequired)return false;
  if(!p.trainingStartDate)return false;
  const now=new Date();now.setHours(0,0,0,0);
  const start=new Date(p.trainingStartDate+'T00:00:00');
  return start<=now;
}
// Canonical adoption-score weights used by every weighted roll-up. When
// training is not yet active the training dimension is dropped and the
// remaining 80% is renormalized back to 100%.
function adoptionWeights(trActive){
  const base={fw:0.30,sent:0.20,train:0.20,comms:0.15,risk:0.15};
  if(trActive)return base;
  const k=1/(1-base.train);
  return{fw:base.fw*k,sent:base.sent*k,train:0,comms:base.comms*k,risk:base.risk*k};
}

// ════════════════════════════════════════════════════════
// LIFECYCLE HEALTH SCORING
// ════════════════════════════════════════════════════════
function calcLifecycleHealth(p){
  if(!p?.lifecycleSignals)return{score:50,signals:[],hasData:false};
  const ls=p.lifecycleSignals;
  const signals=[];
  let total=0,count=0;
  function sig(key,val,g,y,r,label,redNote){
    let strength='green',score=1.0;
    if(val===null||val===undefined||val==='')return;
    if(typeof val==='boolean'){
      if(r===true&&val===true){strength='red';score=0.2;}
      else if(g===false&&val===false){strength='green';score=1.0;}
      else if(val===true){strength='yellow';score=0.6;}
      else{strength='green';score=1.0;}
    } else {
      const n=parseFloat(val)||0;
      if(n<=g)strength='green',score=1.0;
      else if(n<=y)strength='yellow',score=0.6;
      else strength='red',score=0.2;
    }
    signals.push({key,label,strength,score,value:val,redNote:strength==='red'?redNote:''});
    total+=score;count++;
  }
  const req=ls.requirements||{},des=ls.design||{},tst=ls.testing||{},trn=ls.training||{},dep=ls.deployment||{};
  // Requirements
  if(req.onSchedule===false){signals.push({key:'req_schedule',label:'Requirements on schedule',strength:req.daysVariance>5?'red':'yellow',score:req.daysVariance>5?0.2:0.6,value:req.daysVariance,redNote:req.daysVariance>5?'Requirements completed more than 5 days late. This delay may compress downstream phases.':''});total+=req.daysVariance>5?0.2:0.6;count++;}
  else if(req.onSchedule===true){signals.push({key:'req_schedule',label:'Requirements on schedule',strength:'green',score:1.0,value:true,redNote:''});total+=1.0;count++;}
  if(req.reviewCycles){sig('req_reviews',req.reviewCycles,2,3,99,'Requirements review cycles','4+ review cycles suggests ongoing disputes or unclear scope. Consider a stakeholder alignment session.');}
  if(req.disputes===true){signals.push({key:'req_disputes',label:'Unresolved disputes in requirements',strength:'red',score:0.2,value:true,redNote:'Unresolved disputes at requirements phase are a leading indicator of resistance and rework.'});total+=0.2;count++;}
  // Design
  if(des.scopeChangeRequests){sig('des_scope',des.scopeChangeRequests,0,2,99,'Design scope change requests','3+ scope changes during design indicates unstable requirements or stakeholder misalignment.');}
  if(des.workaroundRequests){sig('des_workaround',des.workaroundRequests,0,2,99,'Stakeholder workaround requests','Workaround requests during design are a strong leading indicator of adoption resistance. Each request represents a stakeholder who does not believe the system will meet their needs.');}
  if(des.reviewsDelayed===true){signals.push({key:'des_delay',label:'Design reviews delayed',strength:des.delayDays>5?'red':'yellow',score:des.delayDays>5?0.2:0.6,value:des.delayDays,redNote:des.delayDays>5?'Design review delays of more than 5 days compress testing and training timelines.':''});total+=des.delayDays>5?0.2:0.6;count++;}
  // Testing
  const qa=parseInt(tst.qaDefects)||0,uat=parseInt(tst.uatDefects)||0;
  if(qa>0||uat>0){
    const ratio=uat>0?Math.round(qa/uat):qa>0?999:0;
    let rStr='green',rScr=1.0,rNote='';
    if(ratio>=50){rStr='red';rScr=0.2;rNote=`UAT found ${uat} defect${uat!==1?'s':''} while QA found ${qa}. Users may not be testing thoroughly or are accepting known issues. This is a leading indicator of post-go-live resistance.`;}
    else if(ratio>=10){rStr='yellow';rScr=0.6;rNote='QA-to-UAT ratio is elevated. Verify UAT test coverage is comprehensive and testers are exercising real-world scenarios.';}
    signals.push({key:'tst_ratio',label:'QA-to-UAT defect ratio',strength:rStr,score:rScr,value:ratio+':1',redNote:rNote});
    total+=rScr;count++;
  }
  if(tst.uatParticipationRate){
    const rate=parseFloat(tst.uatParticipationRate)||0;
    let rStr=rate>80?'green':rate>=60?'yellow':'red',rScr=rate>80?1.0:rate>=60?0.6:0.2;
    signals.push({key:'tst_participation',label:'UAT participation rate',strength:rStr,score:rScr,value:rate+'%',redNote:rStr==='red'?`Only ${rate}% of invited users participated in UAT. Low participation means the system has not been adequately validated by real users.`:''});
    total+=rScr;count++;
  }
  // Deployment
  // Training Schedule
  if(trn.startDateChanges){sig('trn_date',trn.startDateChanges,0,1,99,'Training start date changes','3+ training start date changes signals chronic schedule instability — often caused by UAT delays, training environment issues, or insufficient time scoped for end-user preparation.');}
  if(trn.envDefects){sig('trn_env',trn.envDefects,0,3,99,'Training environment defects','High defect counts in the training environment delay readiness and reduce learner confidence in the system.');}
  if(trn.scopeUnderestimated===true){signals.push({key:'trn_scope',label:'Training scope underestimated',strength:'yellow',score:0.6,value:true,redNote:'Training scope was underestimated. This often results in compressed timelines, reduced reinforcement planning, and lower L3/L4 measurement quality.'});total+=0.6;count++;}
  if(trn.materialReworkCycles){sig('trn_rework',trn.materialReworkCycles,1,2,99,'Training material rework cycles','3+ material rework cycles suggests unstable system design or late-breaking requirements changes impacting training quality.');}
  // Deployment
  if(dep.goliveDateChanges){sig('dep_changes',dep.goliveDateChanges,0,1,99,'Go-live date changes','2+ go-live date changes erode stakeholder confidence and may indicate the project is not ready.');}
  if(dep.supportTicketsWeek1){sig('dep_tickets',dep.supportTicketsWeek1,20,50,99,'Post-go-live support tickets (week 1)',`${dep.supportTicketsWeek1} support tickets in the first week suggests significant user difficulties. Consider extended hyper-care support.`);}
  if(dep.workaroundRequestsPostGL){sig('dep_workaround_post',dep.workaroundRequestsPostGL,0,2,99,'Post-go-live workaround requests',`${dep.workaroundRequestsPostGL} workaround requests post go-live indicates users are not adopting the intended process. Targeted coaching intervention recommended.`);}
  const score=count>0?Math.round((total/count)*100):50;
  return{score,signals,hasData:count>0};
}

function signalStrengthBadge(strength){
  const map={green:'<span class="sig-badge sig-green">Healthy</span>',yellow:'<span class="sig-badge sig-yellow">Watch</span>',red:'<span class="sig-badge sig-red">Concern</span>'};
  return map[strength]||'';
}

// ════════════════════════════════════════════════════════
// DATA SOURCE CLASSIFICATION
// ════════════════════════════════════════════════════════
function getDataSourceType(component,p){
  if(!p)return'Estimated';
  const shs=p.stakeholders||[];
  switch(component){
    case'framework':{
      const hasPulse=p.pulseResults&&Object.keys(p.pulseResults).length>0;
      if(hasPulse)return'Measured';
      const hasNotes=Object.values(p.adkarNotes||{}).some(n=>n&&n.trim().length>0);
      return hasNotes?'Observed':'Estimated';
    }
    case'sentiment':{
      const hasTouchpoints=shs.some(sh=>(sh.touchpoints||[]).length>0);
      const hasTrustHistory=shs.some(sh=>(sh.trustHistory||[]).length>=2);
      if(hasTrustHistory&&hasTouchpoints)return'Measured';
      if(hasTouchpoints)return'Observed';
      return'Estimated';
    }
    case'training':{
      const kirkPcts=shs.map(sh=>{if(!sh?.kirk)return 0;let f=0;const k=sh.kirk;if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;return Math.round(f/8*100);});
      const avg=kirkPcts.length?kirkPcts.reduce((a,b)=>a+b,0)/kirkPcts.length:0;
      return avg>=75?'Measured':avg>=40?'Observed':'Estimated';
    }
    case'lifecycle':{
      const lh=calcLifecycleHealth(p);
      if(!lh.hasData)return'Estimated';
      return lh.signals.length>=4?'Measured':'Observed';
    }
    case'comms':{
      const dims=getActiveDims();
      const cd=dims.filter(d=>['A1','d1','d7','d8'].includes(d.key));
      const hasNotes=cd.some(d=>(p.adkarNotes||{})[d.key]&&p.adkarNotes[d.key].trim().length>0);
      const hasPulse=p.pulseResults&&Object.keys(p.pulseResults).length>0;
      if(hasPulse)return'Measured';
      return hasNotes?'Observed':'Estimated';
    }
    case'risk':{
      const keys=Object.keys(p.gateState||{});
      const assessed=keys.filter(k=>p.gateState[k]!=='gray').length;
      const total=keys.length;
      if(!total)return'Estimated';
      return assessed/total>=0.75?'Measured':assessed/total>=0.4?'Observed':'Estimated';
    }
  }
  return'Estimated';
}
function calcDataConfidence(p){
  const components=['framework','sentiment','training','lifecycle','comms','risk'];
  let measured=0,observed=0,estimated=0;
  components.forEach(c=>{const t=getDataSourceType(c,p);if(t==='Measured')measured++;else if(t==='Observed')observed++;else estimated++;});
  const total=components.length;
  return{measured:Math.round(measured/total*100),observed:Math.round(observed/total*100),estimated:Math.round(estimated/total*100)};
}
function dataSourceBadge(type){
  if(type==='Measured')return'<span class="ds-badge ds-measured">Measured</span>';
  if(type==='Observed')return'<span class="ds-badge ds-observed">Observed</span>';
  return'<span class="ds-badge ds-estimated">Estimated</span>';
}

// ════════════════════════════════════════════════════════
// MULTI-SOURCE SENTIMENT SCORE
// ════════════════════════════════════════════════════════
function sentimentScore(sh,pulseScores){
  const base=adoptScore(sh.factors);
  let modifier=0;
  const trust=sh.trust||3;
  if(trust<3)modifier-=(3-trust)*8;
  else if(trust>3)modifier+=(trust-3)*4;
  const ai=sh.anxietyIndicators||{};
  if((ai.whatDoesThisMeanFreq||0)>5)modifier-=5;
  if((ai.extraReviewCycles||0)>2)modifier-=5;
  if((ai.escalations||0)>1)modifier-=5;
  if(ai.attendanceDrop)modifier-=5;
  const tps=sh.touchpoints||[];
  tps.forEach(tp=>{if(tp.trustImpact==='Increased')modifier+=5;else if(tp.trustImpact==='Decreased')modifier-=5;});
  modifier=Math.max(-30,Math.min(15,modifier));
  let score=base+modifier;
  if(pulseScores&&Object.keys(pulseScores).length>0){
    const pv=Object.values(pulseScores);
    const pAvg=Math.round(pv.reduce((a,b)=>a+b,0)/pv.length/5*100);
    score=Math.round(score*0.7+pAvg*0.3);
  }
  return Math.max(0,Math.min(100,score));
}

// ════════════════════════════════════════════════════════
// "SO WHAT?" INTERPRETATION ENGINE
// ════════════════════════════════════════════════════════
function getSoWhat(metric,value,context){
  const ctx=context||{};
  switch(metric){
    case'adoptionScore':{
      const v=parseInt(value)||0;
      if(v>=85)return'Champion — on trajectory to become a reference site. Continue reinforcement focus through go-live.';
      if(v>=65)return'On Track — maintain current engagement cadence. Monitor people and trust as go-live approaches.';
      if(v>=40){
        const weak=ctx.weakestComponent||'people and trust';
        const gate=ctx.nextGate||'the next checkpoint';
        return`At Risk — current trajectory suggests this project will not be ready by ${gate} without intervention in ${weak}.`;
      }
      const drivers=ctx.topDrivers||'open issues and low trust';
      return`Critical — this project should not proceed to launch without addressing: ${drivers}.`;
    }
    case'sentiment':{
      const v=parseFloat(value)||0;
      const recentNoChange=ctx.recentNoChange||0;
      const trust=ctx.trust||3;
      const highAnxiety=ctx.highAnxiety||false;
      if(highAnxiety)return'Multiple anxiety signals active. Targeted FAQ sessions, a leadership Q&A, or a walkthrough of common concerns may help reduce uncertainty.';
      if(trust<3&&ctx.trustDeclining)return'Trust trending negative. Address the root cause — unclear messaging or unresolved concerns — before adding more communication volume.';
      if(v<2.5&&recentNoChange>=3)return'Engagement activities are not moving the needle. The last 3 touchpoints showed no improvement in trust. Consider leadership-level intervention or a different engagement approach.';
      if(v>=4)return'Strong sentiment — this stakeholder group is actively supportive. Leverage them as change champions.';
      if(v>=3)return'Neutral to positive sentiment. Maintain engagement cadence and watch for early signs of concern.';
      return'Below-average sentiment. Increase engagement frequency and document what is driving the gap.';
    }
    case'kirkpatrickGap':{
      const l2=parseFloat(ctx.l2)||0,l3=parseFloat(ctx.l3)||0;
      if(l2>=3.5&&l3<2.5)return`People are completing training but not applying what they learned on the job. They know how — they're just not doing it yet. Consider job aids, coaching, and supervisory support to bridge the gap.`;
      if(l3>=3.5)return'Strong results — training is translating into on-the-job application. Maintain the reinforcement schedule.';
      return'On-the-job application is developing. Continue monitoring at the scheduled check-in intervals.';
    }
    case'gateScore':{
      const v=parseInt(value)||0;
      const declined=ctx.declined||false;
      const gateNum=ctx.gateNum||'';
      if(declined)return`Readiness is declining — score dropped since ${gateNum?'checkpoint '+gateNum:'the previous review'}. Review which items are falling behind and address root causes.`;
      if(v<50)return'Not ready to proceed — launching without resolving the open items is high risk.';
      if(v<75)return'Conditionally ready — some items still need to be completed. Document what must be resolved before proceeding.';
      return'Ready to proceed — readiness is sufficient. Continue monitoring through launch.';
    }
    case'lifecycleHealth':{
      const v=parseInt(value)||0;
      if(v>=80)return'Lifecycle signals are healthy — no significant resistance or quality indicators detected in the project execution data.';
      if(v>=60)return'Watch indicators present. Review yellow signals and determine whether they require active intervention.';
      if(v>=40)return'Multiple concern signals detected in the SDLC data. These patterns are leading indicators of post-go-live adoption difficulty.';
      return'Critical lifecycle signals present. The SDLC data indicates significant adoption risk. Escalation and targeted intervention recommended before go-live.';
    }
    case'frameworkDim':{
      const v=parseFloat(value)||0;
      const dim=ctx.dim||'this dimension';
      if(v<2.5)return`${dim} is low. Focused attention — direct conversations, leadership messaging, or coaching — is recommended before the next review.`;
      if(v>=4)return`Strong ${dim}. Keep doing what is working.`;
      return`${dim} is moderate. Monitor for decline and address any emerging gaps early.`;
    }
    case'complexity':{
      const v=ctx.rating||'Medium';
      const effort=ctx.effort||'Standard';
      if(v==='Critical')return`Critical complexity — ${effort} OCM effort required. Ensure adequate resources are allocated before this project's OCM plan is finalized.`;
      if(v==='High')return`High complexity — ${effort} OCM support recommended. Monitor this project closely as it approaches key milestones.`;
      if(v==='Medium')return`Standard complexity — ${effort} OCM approach is appropriate. Confirm resource allocations are in place.`;
      return`Low complexity — ${effort} OCM approach. Maintain baseline engagement and monitoring.`;
    }
    default:return'';
  }
}

// ════════════════════════════════════════════════════════
// COMPLEXITY RATING
// ════════════════════════════════════════════════════════
function calcComplexity(p){
  if(!p)return{score:0,rating:'Low',effort:'Light Touch'};
  let score=0;
  const groups=(p.impactAssessment?.groups||[]).length;
  if(groups>5)score+=2;else if(groups>=3)score+=1;
  const lh=calcLifecycleHealth(p);
  const badSigs=lh.signals.filter(s=>s.strength==='red'||s.strength==='yellow').length;
  if(badSigs>3)score+=2;else if(badSigs>=1)score+=1;
  const adScore=calcCompositeScore(p);
  if(adScore<50)score+=2;else if(adScore<65)score+=1;
  const flags=getProjFlagCount(p);
  if(flags>3)score+=2;else if(flags>=1)score+=1;
  const deps=Object.values(p.depHM||{}).filter(v=>v&&v!=='n').length;
  if(deps>2)score+=1;
  let rating,effort;
  if(score>=9){rating='Critical';effort='Intensive';}
  else if(score>=6){rating='High';effort='High Touch';}
  else if(score>=3){rating='Medium';effort='Standard';}
  else{rating='Low';effort='Light Touch';}
  return{score,rating,effort};
}
function getProjFlagCount(p){
  if(!p)return 0;
  let n=0;GATE_DEFS.forEach(g=>{g.items.forEach((_,i)=>{if(p.gateState[g.id+'_'+i]==='red')n++;});});return n;
}

// ════════════════════════════════════════════════════════
// COMPOSITE SCORE (extracted for reuse)
// ════════════════════════════════════════════════════════
function calcCompositeScore(p){
  if(!p)return 0;
  const shs=p.stakeholders||[];
  const dims=getActiveDims();
  const fwScores=dims.map(d=>p.adkarScores?.[d.key]||3);
  const fwPct=fwScores.length?Math.round(fwScores.reduce((a,b)=>a+b,0)/fwScores.length/5*100):0;
  const sentPct=shs.length?Math.round(shs.reduce((a,sh)=>{
    const ps=p.pulseResults?.[sh.id]?.scores||{};
    return a+sentimentScore(sh,ps);
  },0)/shs.length):50;
  const kirkPcts=shs.map(sh=>{if(!sh?.kirk)return 0;let f=0;const k=sh.kirk;if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;return Math.round(f/8*100);});
  const trainPct=kirkPcts.length?Math.round(kirkPcts.reduce((a,b)=>a+b,0)/kirkPcts.length):0;
  const lhData=calcLifecycleHealth(p);
  const lcPct=lhData.score;
  const commsDims=dims.filter(d=>['A1','d1','d7','d8'].includes(d.key));
  const commsAvg=commsDims.length?commsDims.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/commsDims.length:3;
  const commsPct=Math.round(commsAvg/5*100);
  const gs=projGateScore(p);
  const flagCount=getProjFlagCount(p);
  const riskPct=Math.max(0,Math.min(100,gs!==null?Math.round(gs*(flagCount===0?1:flagCount<=2?0.8:0.5)):50));
  // When training has not yet started, drop the 20% training weight and
  // redistribute it proportionally across the other five dimensions.
  const trActive=trainingActive(p);
  const k=trActive?1:1/0.80;
  const w={fw:0.25*k,sent:0.20*k,train:trActive?0.20:0,lc:0.10*k,comms:0.10*k,risk:0.15*k};
  return Math.round(fwPct*w.fw+sentPct*w.sent+trainPct*w.train+lcPct*w.lc+commsPct*w.comms+riskPct*w.risk);
}

// ════════════════════════════════════════════════════════
// VALUE CASE HELPERS
// ════════════════════════════════════════════════════════
function calcValueRealization(vc){
  if(!vc?.successCriteria?.length)return null;
  const criteria=vc.successCriteria.filter(c=>c.metStatus);
  if(!criteria.length)return null;
  const score=criteria.reduce((a,c)=>{
    if(c.metStatus==='Yes')return a+1;
    if(c.metStatus==='Partially')return a+0.5;
    return a;
  },0);
  return Math.round(score/criteria.length*100);
}
function isPostGoLive(p){
  if(!p?.golive)return false;
  return new Date(p.golive)<=new Date();
}

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
    const el=document.getElementById(v);
    el.classList.toggle('active',v===id);
    if(v===id){el.classList.remove('view-fade-in');void el.offsetWidth;el.classList.add('view-fade-in');}
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
  const tsEl=document.getElementById('p-train-start');if(tsEl)tsEl.value=p.trainingStartDate||'';
  document.getElementById('p-users').value=p.estimatedUsers||0;
  document.getElementById('p-status').value=p.status||'Not Started';
  renderProjAgencyChips();
  updateTRButtons();
  const mvBtn=document.getElementById('ib-move-proj');
  if(mvBtn)mvBtn.style.display=releases.length>1?'':'none';
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
  if(id==='lifecycle')renderPLifecycle();
  if(id==='craid')renderPCraid();
  if(id==='gates')showOnboardingCallout('gate-tracker','#psec-gates','Gates are your checkpoints.','Each gate represents a critical transition in your SDLC. Work through the items, mark your status, and attach evidence. When a gate is complete, request sign-off to move forward with confidence.','Start Assessment');
  if(id==='adkar')showOnboardingCallout('adkar','#psec-adkar','ADKAR tells you where readiness is real.','Score each dimension from 1\u20135 based on what you\u2019re observing \u2014 not what you hope is true. Low scores aren\u2019t failures; they\u2019re where your attention needs to go.','Record Scores');
}

// ════════════════════════════════════════════════════════
// MODALS
// ════════════════════════════════════════════════════════
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
let _gPending=false;
document.addEventListener('keydown',e=>{
  const tag=document.activeElement?.tagName;
  const inField=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||document.activeElement?.isContentEditable;
  if(e.key==='Escape'){document.querySelectorAll('.modal-ov.open').forEach(m=>m.classList.remove('open'));closeCommandPalette();if(document.body.classList.contains('focus-mode'))document.body.classList.remove('focus-mode');_gPending=false;return;}
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openCommandPalette();_gPending=false;return;}
  if(inField){_gPending=false;return;}
  if((e.key==='f'||e.key==='F')&&!e.metaKey&&!e.ctrlKey){document.body.classList.toggle('focus-mode');_gPending=false;return;}
  if(e.key==='?'){e.preventDefault();openCommandPalette();_gPending=false;return;}
  if(e.key==='g'||e.key==='G'){_gPending=true;setTimeout(()=>{_gPending=false;},800);return;}
  if(_gPending&&(e.key==='p'||e.key==='P')){e.preventDefault();_gPending=false;goPortfolio();return;}
  if(_gPending&&(e.key==='r'||e.key==='R')){e.preventDefault();_gPending=false;if(activeRelId)openRelease(activeRelId);return;}
  _gPending=false;
});

function openCommandPalette(){
  let ov=document.querySelector('.cmd-palette-ov');
  if(!ov){
    ov=document.createElement('div');ov.className='cmd-palette-ov';
    ov.innerHTML='<div class="cmd-palette"><input class="cmd-palette-inp" placeholder="Search releases, projects, actions\u2026"><div class="cmd-palette-list"><div class="cmd-palette-empty">Start typing to search\u2026</div></div></div>';
    ov.addEventListener('click',function(e){if(e.target===this)closeCommandPalette();});
    document.body.appendChild(ov);
  }
  ov.classList.add('open');
  const inp=ov.querySelector('.cmd-palette-inp');if(inp){inp.value='';inp.focus();}
}
function closeCommandPalette(){const ov=document.querySelector('.cmd-palette-ov');if(ov)ov.classList.remove('open');}
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
  closeModal('add-rel-modal');saveData();renderPortfolio();showSuccess('Release created. Start adding projects to build out the picture.');
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
  touch('rel');schedSave();renderRelView();showSuccess('Project added to this release.');
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

// Move Project to Another Release
function openMoveProject(pid,name){
  moveProjTarget=pid;
  document.getElementById('move-proj-sub').textContent=`Move "${name}" to a different release.`;
  const sel=document.getElementById('move-proj-select');
  sel.innerHTML=releases.filter(r=>r.id!==activeRelId).map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');
  openModal('move-proj-modal');
  setTimeout(()=>sel.focus(),50);
}
function confirmMoveProject(){
  const targetRelId=parseInt(document.getElementById('move-proj-select').value);
  if(!targetRelId)return;
  const srcRel=getRel();if(!srcRel)return;
  const idx=srcRel.projects.findIndex(p=>p.id===moveProjTarget);
  if(idx<0)return;
  const tgtRel=releases.find(r=>r.id===targetRelId);
  if(!tgtRel)return;
  const [proj]=srcRel.projects.splice(idx,1);
  tgtRel.projects.push(proj);
  logAudit('project_moved','project',proj.name,{fromRelease:srcRel.name,toRelease:tgtRel.name});
  closeModal('move-proj-modal');moveProjTarget=null;
  touch('rel');saveData();
  showSaveIndicator('Moved to '+tgtRel.name);
  openRelease(targetRelId);
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
  showSaveIndicator('Pulling your portfolio together\u2026');
  showOnboardingCallout('role-switcher','#v-portfolio .top-bar .top-right','See AdoptIQ through your stakeholder\u2019s eyes.','Switch roles to preview exactly what Executives, Client Viewers, and Team members can see and do.','Got it');
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
      <div class="hero-h">Your portfolio is ready<br>when you are.</div>
      <div class="hero-sub">Add your first release to start tracking change readiness across your organization. AdoptIQ integrates ADKAR, Kirkpatrick, and SDLC gate methodology into a single command center.</div>
      <div class="hero-features">
        <div class="hero-feat"><div class="hero-feat-icon"><i class="ph ph-squares-four"></i></div><div><div class="hero-feat-t">4-Readiness Tracker</div><div class="hero-feat-d">Map training dependencies across the full SDLC lifecycle</div></div></div>
        <div class="hero-feat"><div class="hero-feat-icon"><i class="ph ph-chart-line-up"></i></div><div><div class="hero-feat-t">${fwName()} Assessment Engine</div><div class="hero-feat-d">Score readiness dimensions across your chosen change framework</div></div></div>
        <div class="hero-feat"><div class="hero-feat-icon"><i class="ph ph-shield-warning"></i></div><div><div class="hero-feat-t">Adoption Risk Scoring</div><div class="hero-feat-d">Quantify stakeholder readiness with 6-factor analysis</div></div></div>
        <div class="hero-feat"><div class="hero-feat-icon"><i class="ph ph-star"></i></div><div><div class="hero-feat-t">Kirkpatrick Measurement</div><div class="hero-feat-d">L1–L4 evaluation framework built into every stakeholder group</div></div></div>
      </div>
      <button class="btn-gold" onclick="openAddRelease()" style="padding:14px 32px;font-size:13px">Add Your First Release</button>
      <div class="hero-cred">Providence Consulting Firm &middot; CPTM &middot; ATD Master Trainer &middot; ADKAR-Aligned</div>
    </div>`;
    document.getElementById('tl-sec').style.display='none';document.getElementById('exec-dash').style.display='none';return;
  }
  wrap.innerHTML=`<div class="card-grid stagger-children">${releases.map(r=>{
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
          <div class="rcm"><div class="rcm-l">Readiness</div><div class="rcm-v">${rl.gateScore!==null?rl.gateScore+'%':'—'}</div></div>
          <div class="rcm"><div class="rcm-l">Open Issues</div><div class="rcm-v">${rl.flags}</div></div>
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
  document.getElementById('people-cap-sec').style.display=releases.length>=1?'block':'none';
  requestAnimationFrame(()=>{
    renderSaturationMap();renderOcmWorkloadBalance();renderPortCraidDashboard();renderTimeline();renderAlerts();renderAuditLog();initReleaseDrag();renderPortfolioCharts();renderTrendCharts();renderAiqChips();renderWhatDataTells();
    if(isReadOnly)applyReadOnlyRestrictions();
  });
}

// ════════════════════════════════════════════════════════
// ASK ADOPTIQ — Natural Language Query Interface
// ════════════════════════════════════════════════════════
const ASK_AIQ_URL='https://yufehucjvviwanbulcok.supabase.co/functions/v1/ask-adoptiq';
const _aiqHistory=[];
const MAX_AIQ_HISTORY=5;

function toggleAiqMobile(){
  const bar=document.getElementById('aiq-bar');
  if(!bar)return;
  bar.classList.toggle('mobile-open');
  if(bar.classList.contains('mobile-open')){
    setTimeout(()=>document.getElementById('aiq-input')?.focus(),100);
    showOnboardingCallout('aiq','.aiq-messages','AIQ reads your actual release data.','Try asking: \u201CWhich release has the lowest readiness?\u201D or \u201CWhat are the biggest risks this quarter?\u201D','Got it');
  }
}

function renderAiqChips(){
  const el=document.getElementById('aiq-chips');
  if(!el)return;
  const suggestions=generateAiqSuggestions();
  let h='';
  suggestions.forEach(s=>{
    h+='<span class="aiq-chip" onclick="askAiqChip(\''+esc(s).replace(/'/g,"\\'")+'\')">'+esc(s)+'</span>';
  });
  // Add history chips if any
  if(_aiqHistory.length){
    h+='<span style="color:rgba(255,255,255,0.2);font-size:9px;padding:4px 0;margin-left:4px">|</span>';
    _aiqHistory.slice().reverse().forEach(q=>{
      h+='<span class="aiq-hist-chip" onclick="askAiqChip(\''+esc(q).replace(/'/g,"\\'")+'\')">'+esc(q)+'</span>';
    });
  }
  el.innerHTML=h;
}

function generateAiqSuggestions(){
  const suggestions=[];
  // Check portfolio state and generate relevant suggestions
  const atRisk=releases.filter(r=>relRollup(r).status==='Critical'||relRollup(r).status==='At Risk');
  const totalFlags=releases.reduce((s,r)=>s+relRollup(r).flags,0);
  const allProjects=releases.flatMap(r=>r.projects||[]);
  const nearestGoLive=releases.filter(r=>r.golive&&new Date(r.golive)>new Date()).sort((a,b)=>new Date(a.golive)-new Date(b.golive))[0];

  if(atRisk.length>0){
    suggestions.push('Which projects need immediate attention?');
  }else{
    suggestions.push('What is the overall readiness of my portfolio?');
  }
  if(totalFlags>0){
    suggestions.push('Summarize all active open issues');
  }
  if(allProjects.length>1){
    suggestions.push('Compare adoption scores across all projects');
  }
  if(nearestGoLive){
    suggestions.push('How ready are we for the next go-live?');
  }
  // Always add a general question
  if(suggestions.length<4){
    suggestions.push('What are the biggest gaps in training readiness?');
  }
  return suggestions.slice(0,4);
}

function collectPortfolioData(){
  return releases.map(rel=>{
    const ru=relRollup(rel);
    return{
      releaseName:rel.name,
      goLiveDate:rel.golive||null,
      status:ru.status,
      overallGateScore:ru.gate,
      riskFlags:ru.flags,
      agencies:rel.agencies||[],
      projects:(rel.projects||[]).map(p=>{
        const dims=getActiveDims();
        const fwScores={};
        dims.forEach(d=>{fwScores[d.word]=p.adkarScores?.[d.key]||3;});
        const shs=(p.stakeholders||[]).map(s=>{
          const sc=adoptScore(s.factors);
          return{
            name:s.name,
            adoptionScore:sc,
            tier:adoptTier(sc).tier,
            kirkpatrickReady:kirkReady(s),
            reinforcementReady:reinReady(s),
            factors:Object.fromEntries(AF.map(f=>([f.label,s.factors?.[f.key]||3])))
          };
        });
        const gs=projGateScore(p);
        const gaps=(p.gapAnalysis?.gaps||[]).map(g=>({description:g.description||'',severity:g.severity||'Medium',status:g.status||'Open'}));
        const flags=getProjFlags(p).map(f=>({gate:f.gate,item:f.item}));
        const pulseInsights=p._pulseInsightsSummary||null;
        return{
          projectName:p.name,
          status:p.status||'In Progress',
          goLiveDate:p.golive||null,
          agencies:p.agencies||[],
          gateReadiness:gs!==null?gs+'%':'Not started',
          frameworkScores:fwScores,
          adoptionScore:Math.round(dims.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/Math.max(dims.length,1)/5*100),
          stakeholders:shs,
          stakeholderCount:shs.length,
          riskFlags:flags,
          gaps:gaps,
          pulseInsights
        };
      })
    };
  });
}

function askAiqChip(question){
  const input=document.getElementById('aiq-input');
  if(input){input.value=question;}
  askAdoptIQ();
}

async function askAdoptIQ(){
  const input=document.getElementById('aiq-input');
  const btn=document.getElementById('aiq-go-btn');
  const area=document.getElementById('aiq-answer-area');
  if(!input||!area)return;
  const question=input.value.trim();
  if(!question)return;

  // Add to history
  const existIdx=_aiqHistory.indexOf(question);
  if(existIdx>=0)_aiqHistory.splice(existIdx,1);
  _aiqHistory.push(question);
  if(_aiqHistory.length>MAX_AIQ_HISTORY)_aiqHistory.shift();

  // Show loading
  area.style.display='block';
  area.innerHTML=`<div class="aiq-response"><div class="aiq-response__header"><div class="aiq-response__tag">${esc(question)}</div></div><div class="aiq-loading"><div class="spinner"></div><div class="aiq-loading-text">Analyzing your release data\u2026</div></div></div>`;
  if(btn){btn.disabled=true;btn.textContent='\u2026';}
  input.select();
  const _aiqLoadEl=area.querySelector('.aiq-loading-text');
  const _aiqT1=setTimeout(()=>{if(_aiqLoadEl)_aiqLoadEl.textContent='Cross-referencing ADKAR scores and gate status\u2026';},2000);
  const _aiqT2=setTimeout(()=>{if(_aiqLoadEl)_aiqLoadEl.textContent='Almost there \u2014 this one\u2019s worth the wait.';},5000);

  // Close mobile bar
  const bar=document.getElementById('aiq-bar');
  if(bar)bar.classList.remove('mobile-open');

  try{
    const portfolioData=collectPortfolioData();
    const response=await fetch(ASK_AIQ_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+TRAJ_ANON_KEY},
      body:JSON.stringify({question,portfolioData})
    });
    if(!response.ok){const err=await response.text();throw new Error(err);}
    const result=await response.json();
    renderAiqAnswer(question,result);
  }catch(err){
    console.error('AIQ request failed');
    area.innerHTML=`<div class="aiq-response"><div class="aiq-response__header"><div class="aiq-response__tag">${esc(question)}</div><button class="aiq-panel__close" onclick="closeAiqAnswer()"><i class="ph ph-x"></i></button></div><div class="aiq-response__body"><div style="color:var(--red);font-size:12px">AIQ is temporarily unavailable. Your data is intact \u2014 try again in a moment.</div></div></div>`;
  }finally{
    clearTimeout(_aiqT1);clearTimeout(_aiqT2);
    if(btn){btn.disabled=false;btn.textContent='Ask AIQ';}
    renderAiqChips();
  }
}

function closeAiqAnswer(){
  const area=document.getElementById('aiq-answer-area');
  if(area){area.style.display='none';area.innerHTML='';}
}

function renderAiqAnswer(question,result){
  const area=document.getElementById('aiq-answer-area');
  if(!area)return;
  let h='<div class="aiq-response">';
  h+='<div class="aiq-response__header"><div class="aiq-response__tag">'+esc(question)+'</div><button class="aiq-panel__close" onclick="closeAiqAnswer()"><i class="ph ph-x"></i></button></div>';
  h+='<div class="aiq-response__body">';

  // Answer text
  if(result.answer_text){
    h+='<div class="aiq-response__text">'+esc(result.answer_text)+'</div>';
  }

  // Data points as metrics
  if(result.data_points?.length&&(result.visualization_type==='metrics'||!result.visualization_type||result.visualization_type==='none')){
    h+='<div class="aiq-metrics">';
    result.data_points.forEach(dp=>{
      h+='<div class="aiq-metric '+(dp.status||'neutral')+'">';
      h+='<div class="aiq-metric-label">'+esc(dp.label)+'</div>';
      h+='<div class="aiq-metric-val">'+esc(String(dp.value))+'</div>';
      if(dp.detail)h+='<div class="aiq-metric-detail">'+esc(dp.detail)+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }

  // Table visualization
  if(result.visualization_type==='table'&&result.visualization_data){
    const vd=result.visualization_data;
    if(vd.title)h+='<div class="aiq-chart-title">'+esc(vd.title)+'</div>';
    h+='<div style="overflow-x:auto"><table class="aiq-table"><thead><tr>';
    (vd.columns||[]).forEach(c=>{h+='<th>'+esc(c)+'</th>';});
    h+='</tr></thead><tbody>';
    (vd.rows||[]).forEach(row=>{
      h+='<tr>';
      (Array.isArray(row)?row:[row]).forEach(cell=>{h+='<td>'+esc(String(cell))+'</td>';});
      h+='</tr>';
    });
    h+='</tbody></table></div>';
  }

  // Chart visualization
  if(result.visualization_type==='chart'&&result.visualization_data){
    const vd=result.visualization_data;
    const canvasId='aiq-chart-'+Date.now();
    if(vd.title)h+='<div class="aiq-chart-title">'+esc(vd.title)+'</div>';
    h+='<div class="aiq-chart-wrap"><canvas id="'+canvasId+'"></canvas></div>';
    // Render chart after DOM update
    setTimeout(()=>{
      const canvas=document.getElementById(canvasId);
      if(!canvas||!window.Chart)return;
      const chartType=vd.chart_type||'bar';
      const cfg={
        type:chartType,
        data:{
          labels:vd.chart_labels||[],
          datasets:[{
            data:vd.chart_values||[],
            backgroundColor:vd.chart_colors||['#0C1F3F','#b8922a','#6366f1','#1d6840','#b83232','#d97706','#0ea5e9'],
            borderColor:chartType==='line'?(vd.chart_colors?.[0]||'#b8922a'):undefined,
            borderWidth:chartType==='line'?2:0,
            fill:chartType==='line'?false:undefined,
            tension:0.3
          }]
        },
        options:{
          responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:chartType==='doughnut',position:'bottom',labels:{font:{size:9}}},tooltip:{bodyFont:{size:10}}},
          scales:chartType==='doughnut'?{}:{y:{beginAtZero:true,ticks:{font:{size:9}}},x:{ticks:{font:{size:9}}}}
        }
      };
      new Chart(canvas,cfg);
    },100);
  }

  // List visualization
  if(result.visualization_type==='list'&&result.visualization_data){
    const vd=result.visualization_data;
    if(vd.title)h+='<div class="aiq-chart-title">'+esc(vd.title)+'</div>';
    h+='<div class="aiq-list">';
    const items=vd.rows||vd.items||[];
    items.forEach(item=>{
      const text=Array.isArray(item)?item.join(' — '):String(item);
      h+='<div class="aiq-list-item"><span class="aiq-list-bullet">▸</span><span>'+esc(text)+'</span></div>';
    });
    h+='</div>';
  }

  // Also show data_points for table/chart/list types
  if(result.data_points?.length&&result.visualization_type&&result.visualization_type!=='metrics'&&result.visualization_type!=='none'){
    h+='<div class="aiq-metrics">';
    result.data_points.slice(0,4).forEach(dp=>{
      h+='<div class="aiq-metric '+(dp.status||'neutral')+'">';
      h+='<div class="aiq-metric-label">'+esc(dp.label)+'</div>';
      h+='<div class="aiq-metric-val">'+esc(String(dp.value))+'</div>';
      if(dp.detail)h+='<div class="aiq-metric-detail">'+esc(dp.detail)+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }

  // Follow-up suggestions
  if(result.follow_up_suggestions?.length){
    h+='<div class="aiq-followups">';
    result.follow_up_suggestions.forEach(s=>{
      h+='<span class="aiq-followup" onclick="askAiqChip(\''+esc(s).replace(/'/g,"\\'")+'\')">'+esc(s)+'</span>';
    });
    h+='</div>';
  }

  h+='</div></div>';
  area.innerHTML=h;
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
  document.getElementById('r-kpi-rg-s').textContent=worstScore<101?worstScore+'% readiness':'Stakeholder group';
  // Open Risks KPI
  const riskEl=document.getElementById('r-kpi-risks');
  const riskSub=document.getElementById('r-kpi-risks-s');
  if(riskEl){
    let openRisks=0,critRisks=0;
    (r.projects||[]).forEach(p=>{(p.craid||[]).forEach(e=>{
      if(e.type==='risk'&&!['Closed','Mitigated'].includes(e.status)){openRisks++;if(e.severity==='Critical')critRisks++;}
    });});
    riskEl.textContent=openRisks;
    riskSub.textContent=critRisks?critRisks+' critical':'Across all projects';
  }
  // OCM Coverage KPI
  const ocmEl=document.getElementById('r-kpi-ocm');
  const ocmSub=document.getElementById('r-kpi-ocm-s');
  if(ocmEl){
    const projs=r.projects||[];
    const trainFilled=projs.filter(p=>(p.resources?.ocm_train||[]).some(x=>(x.name||'').trim())).length;
    const implFilled=projs.filter(p=>(p.resources?.ocm_impl||[]).some(x=>(x.name||'').trim())).length;
    const totalSlots=projs.length*2;const filledSlots=trainFilled+implFilled;
    if(projs.length){
      ocmEl.textContent=Math.round(filledSlots/totalSlots*100)+'%';
      ocmSub.textContent=trainFilled+'/'+projs.length+' Train · '+implFilled+'/'+projs.length+' Impl';
    }else{ocmEl.textContent='—';ocmSub.textContent='No projects';}
  }
}
function renderRelProjCards(){
  const r=getRel();if(!r)return;
  const grid1=document.getElementById('rel-proj-cards');
  const grid2=document.getElementById('rel-proj-list');
  if(!r.projects||!r.projects.length){
    const em='<div class="es"><div class="es-rule"></div><h4 class="es-hd">No projects tied to this release yet.</h4><p class="es-txt">Projects define the work stream. Add at least one to begin tracking milestones and stakeholder impact.</p></div>';
    grid1.innerHTML=em;grid2.innerHTML=em;return;
  }
  const cards=r.projects.map(p=>{
    const gs=projGateScore(p);const fl=projFlagCount(p);const adk=projAdkarAvg(p);const st=projStatus(p);
    const noTrain=!(p.resources?.ocm_train||[]).some(x=>(x.name||'').trim());
    const noImpl=!(p.resources?.ocm_impl||[]).some(x=>(x.name||'').trim());
    const ocmGapHtml=(noTrain||noImpl)?`<div class="pc-ocm-gaps">${noTrain?'<span class="pc-ocm-gap">No OCM Training</span>':''}${noImpl?'<span class="pc-ocm-gap">No OCM Impl</span>':''}</div>`:'';
    return`<div class="pc" tabindex="0" draggable="true" data-proj-id="${p.id}" onclick="openProject(${p.id})" onkeydown="if(event.key==='Enter')openProject(${p.id})" role="button" aria-label="Open project ${esc(p.name)}">
      <div class="pc-hd">
        <div style="display:flex;align-items:center;justify-content:space-between"><div class="pc-name">${esc(p.name)}</div><span class="drag-handle" title="Drag to reorder">&#x2630;</span></div>
        <div class="chip-row">${(p.agencies||[]).map(a=>`<span class="chip chip-white">${esc(a)}</span>`).join('')}</div>
        <div class="pc-tr-badge ${p.trainingRequired?'pc-tr-yes':'pc-tr-no'}">${p.trainingRequired?'Training Required':'No Training'}</div>${ocmGapHtml}
      </div>
      <div class="pc-bd">
        <div class="pc-metrics">
          <div class="pcm"><div class="pcm-l">Readiness</div><div class="pcm-v">${gs!==null?gs+'%':'—'}</div></div>
          <div class="pcm"><div class="pcm-l">Open Issues</div><div class="pcm-v">${fl}</div></div>
          <div class="pcm"><div class="pcm-l">${fwShort()}</div><div class="pcm-v">${adk}/5</div></div>
        </div>
        <div class="pc-foot">
          <span class="status-chip ${st.cls}">${st.label}</span>
          <div class="pc-acts">
            <button class="btn-del-proj" onclick="event.stopPropagation();openDelProject(${p.id},'${esc(p.name).replace(/'/g,"\\'")}')">Remove</button>
            ${releases.length>1?`<button class="btn-move-proj" onclick="event.stopPropagation();openMoveProject(${p.id},'${esc(p.name).replace(/'/g,"\\'")}')">Move</button>`:''}<button class="btn-open-sm" onclick="event.stopPropagation();openProject(${p.id})">Open</button>
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
  if(!projs.length){gp.innerHTML='<div class="es"><div class="es-rule"></div><h4 class="es-hd">This gate hasn\u2019t been assessed.</h4><p class="es-txt">Gate assessments confirm your team is ready to advance. Add projects to begin tracking readiness.</p></div>';}
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
  if(!allFlags.length){fp.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">No active flags. Portfolio is on track.</p></div>';}
  else{fp.innerHTML=allFlags.slice(0,5).map(f=>`<div class="fpv"><div class="fpv-g">${esc(f.gate)} — ${esc(f.proj)}</div><div class="fpv-i">${esc(f.item)}</div></div>`).join('');}
  renderRelCraidSummary();
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
  const tsField=document.getElementById('ib-train-start');
  if(tsField)tsField.style.display=p.trainingRequired?'':'none';
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
  showSaveIndicator('Assembling your gate status\u2026');
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
  const gate=GATE_DEFS.find(g=>g.id===gid);
  if(gate&&gate.items.every((_,i)=>p.gateState[gid+'_'+i]))showSuccess('Gate assessment recorded. Ready for the next one.');
  else showSuccess('Gate item updated.');
}

const HMS=['Not Started','Complete','Partial','Blocking','N/A'];
const HMS_TIPS={'Not Started':'No progress on this item yet.','Complete':'All criteria for this item are met and documented.','Partial':'Some criteria are met. Note what\u2019s outstanding before requesting sign-off.','Blocking':'This item hasn\u2019t been addressed. Resolve it before advancing the gate.','N/A':'This item doesn\u2019t apply to this release. Document the reason.'};
function renderPDepHM(){
  const p=getProj();if(!p)return;
  const t=document.getElementById('p-dep-hm');
  let h=`<thead><tr><th class="hm-rh">Gate</th>`;WS.forEach(w=>{h+=`<th>${w}</th>`;});h+='</tr></thead><tbody>';
  GL.forEach((gl,gi)=>{
    h+=`<tr><td class="hm-rl">${gl}</td>`;
    WS.forEach((_,wi)=>{
      const k=`${gi}_${wi}`,s=p.depHM[k]||0;
      const nd=p.depNotes[k]?'<span class="note-dot"></span>':'';
      h+=`<td><div class="hm-cw"><div class="hm-cell" data-s="${s}" title="${HMS_TIPS[HMS[s]]||''}" onclick="cyclePHMCell('${k}')" tabindex="0" onkeydown="if(event.key==='Enter')cyclePHMCell('${k}')">${nd}${HMS[s]}</div></div></td>`;
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
  if(!f.length){pan.innerHTML='<div class="nfs"><div class="nfs-rule"></div><p class="nfs-txt">No active open issues. Mark gate items Incomplete in the Gate Tracker to generate flags.</p></div>';return;}
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
  showSaveIndicator('Calculating readiness dimensions\u2026');
  const p=getProj();if(!p)return;
  const dims=getActiveDims();
  const fw=getFramework();
  const eye=document.getElementById('assess-eye');if(eye)eye.textContent=fw.name;
  const head=document.getElementById('assess-head');if(head)head.textContent=fw.name+' Readiness Assessment';
  const pt=document.getElementById('assess-pt');if(pt)pt.textContent=fw.name+' Readiness by Dimension';
  const navBtn=document.getElementById('nav-adkar-btn');if(navBtn)navBtn.textContent=fw.name.split(' ')[0];
  // Show/hide guided assessment button (ADKAR only)
  const adkarActions=document.getElementById('adkar-actions');
  if(adkarActions)adkarActions.style.display=isAdkarFramework()?'':'none';
  // Clear guided container if not active
  if(!_guidedActive){const gc=document.getElementById('guided-adkar-container');if(gc)gc.innerHTML='';}
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
    <div class="ak-col"><div class="ak-hd" title="${esc(d.desc)}"><div class="ak-ltr">${esc(d.letter)}</div><div class="ak-wrd">${esc(d.word)}</div></div>
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
  updatePAdkarSummary();renderPKPIs();touch('proj');schedSave();showSuccess('ADKAR score saved.');
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
  if(dims.every(d=>p.adkarScores[d.key]&&p.adkarScores[d.key]>0))showSuccess('All five dimensions scored. Readiness picture is complete.');
}

// ═══ ADKAR Guided Assessment Mode ═══
let _guidedStep=0;
let _guidedActive=false;

function isAdkarFramework(){
  const b=getBrand();
  const fwId=b.frameworkId||'adkar';
  return fwId==='adkar';
}

function enterGuidedAdkar(){
  if(!isAdkarFramework())return;
  _guidedActive=true;
  _guidedStep=0;
  const container=document.getElementById('guided-adkar-container');
  const grid=document.getElementById('p-adkar-grid');
  const sum=document.querySelector('#psec-adkar .ak-sum');
  const panelBody=document.querySelector('#psec-adkar .pb.np');
  if(grid)grid.style.display='none';
  if(sum)sum.style.display='none';
  if(!container){
    const div=document.createElement('div');
    div.id='guided-adkar-container';
    if(panelBody)panelBody.prepend(div);
  }
  // Show ADKAR Journey framing on first use
  const seen=JSON.parse(localStorage.getItem('adoptiq-onboarding')||'{}');
  if(!seen['adkar-journey']){
    renderAdkarJourney();
  } else {
    renderGuidedStep();
  }
}

function exitGuidedAdkar(){
  _guidedActive=false;
  const container=document.getElementById('guided-adkar-container');
  const grid=document.getElementById('p-adkar-grid');
  const sum=document.querySelector('#psec-adkar .ak-sum');
  if(container)container.remove();
  if(grid)grid.style.display='';
  if(sum)sum.style.display='';
  renderPAdkar();
}

function renderAdkarJourney(){
  const container=document.getElementById('guided-adkar-container');
  if(!container)return;
  container.innerHTML=`
    <div class="guided-journey">
      <div class="guided-journey-text">
        <p>Every person going through a change moves through five stages \u2014 in order.</p>
        <p>Your job isn\u2019t to push people through them.<br>Your job is to find out where they\u2019re stuck, and remove what\u2019s blocking them.</p>
        <p><strong>ADKAR tells you where to look.</strong></p>
      </div>
      <div class="guided-journey-chain">
        <div class="guided-chain-step"><div class="guided-chain-q">WHY is it happening?</div><div class="guided-chain-dim">Awareness</div></div>
        <div class="guided-chain-arrow"><i class="ph ph-arrow-right"></i></div>
        <div class="guided-chain-step"><div class="guided-chain-q">Do they WANT it?</div><div class="guided-chain-dim">Desire</div></div>
        <div class="guided-chain-arrow"><i class="ph ph-arrow-right"></i></div>
        <div class="guided-chain-step"><div class="guided-chain-q">Do they know HOW?</div><div class="guided-chain-dim">Knowledge</div></div>
        <div class="guided-chain-arrow"><i class="ph ph-arrow-right"></i></div>
        <div class="guided-chain-step"><div class="guided-chain-q">CAN they do it?</div><div class="guided-chain-dim">Ability</div></div>
        <div class="guided-chain-arrow"><i class="ph ph-arrow-right"></i></div>
        <div class="guided-chain-step"><div class="guided-chain-q">Will it STICK?</div><div class="guided-chain-dim">Reinforcement</div></div>
      </div>
      <div class="guided-journey-note">Can\u2019t skip. Can\u2019t reverse. Low score here \u2192 everything to the right is unreliable.</div>
      <div class="guided-journey-actions">
        <button class="btn-sm" onclick="dismissOnboarding(null,'adkar-journey');renderGuidedStep();">Begin Assessment</button>
        <button class="btn-sm btn-ghost" onclick="dismissOnboarding(null,'adkar-journey');exitGuidedAdkar();">Skip \u2014 I know ADKAR</button>
      </div>
    </div>`;
}

function renderGuidedStep(){
  const container=document.getElementById('guided-adkar-container');
  if(!container)return;
  const p=getProj();if(!p)return;
  const dimKey=ADKAR_DIM_ORDER[_guidedStep];
  const g=ADKAR_GUIDED[dimKey];
  if(!g)return;
  const dims=getActiveDims();
  const dim=dims.find(d=>d.key===dimKey)||dims[_guidedStep];
  if(!dim)return;
  const currentScore=p.adkarScores[dimKey]||0;
  const isLast=_guidedStep===4;
  const nextDimName=!isLast?ADKAR_DIM_NAMES[ADKAR_DIM_ORDER[_guidedStep+1]]:'';

  container.innerHTML=`
    <div class="guided-panel">
      <div class="guided-progress">
        ${ADKAR_DIM_ORDER.map((dk,i)=>`<div class="guided-dot${i<_guidedStep?' done':i===_guidedStep?' active':''}">
          <div class="guided-dot-num">${i+1}</div>
          <div class="guided-dot-label">${ADKAR_DIM_NAMES[dk]}</div>
        </div>${i<4?'<div class="guided-dot-line'+(i<_guidedStep?' done':'')+'"></div>':''}`).join('')}
      </div>

      <div class="guided-header">
        <div class="guided-dim-badge">${esc(dim.letter)}</div>
        <div>
          <div class="guided-dim-word">${esc(dim.word)}</div>
          <div class="guided-step-label">Step ${_guidedStep+1} of 5</div>
        </div>
      </div>

      <blockquote class="guided-question">${esc(g.question)}</blockquote>

      <div class="guided-field-prompt">
        <div class="guided-prompt-label">Before you score</div>
        <p>${esc(g.fieldPrompt).replace(/\n/g,'<br>')}</p>
      </div>

      <details class="guided-coaching">
        <summary><i class="ph ph-lightbulb"></i> Coaching tip for new consultants</summary>
        <div class="guided-coaching-body">${esc(g.coachingTip).replace(/\n/g,'<br>')}</div>
      </details>

      <div class="guided-anchors">
        <div class="guided-anchors-label">Select your score</div>
        ${g.anchors.map(a=>`<button class="guided-anchor${currentScore===a.score?' selected':''}" onclick="setGuidedScore('${dimKey}',${a.score})">
          <div class="guided-anchor-score">${a.score}</div>
          <div class="guided-anchor-info">
            <div class="guided-anchor-label">${esc(a.label)}</div>
            <div class="guided-anchor-desc">${esc(a.desc)}</div>
          </div>
        </button>`).join('')}
      </div>

      ${currentScore>0&&currentScore<3?`<div class="guided-barrier">
        <div class="guided-barrier-hd"><i class="ph ph-warning-circle"></i> ${esc(dim.word)} is your barrier</div>
        <p>${esc(g.barrier).replace(/\n/g,'<br>')}</p>
      </div>`:''}

      <div class="guided-notes-section">
        <label class="guided-notes-label">Qualitative Notes <span>(optional)</span></label>
        <textarea class="guided-notes" placeholder="What are you observing in this group?" oninput="updatePAdkarNote('${dimKey}',this.value)">${esc(p.adkarNotes[dimKey]||'')}</textarea>
      </div>

      <div class="guided-nav">
        ${_guidedStep>0?'<button class="btn-sm btn-ghost" onclick="guidedBack()"><i class="ph ph-arrow-left"></i> Back</button>':'<div></div>'}
        <button class="btn-sm"${currentScore===0?' disabled':''} onclick="${isLast?'renderGuidedSummary()':'guidedNext()'}">
          ${isLast?'View Summary':'Next: '+nextDimName+' <i class="ph ph-arrow-right"></i>'}
        </button>
      </div>
    </div>`;
}

function setGuidedScore(dimKey,score){
  const p=getProj();if(!p)return;
  p.adkarScores[dimKey]=score;
  touch('proj');schedSave();
  renderGuidedStep();
}

function guidedNext(){
  if(_guidedStep<4){_guidedStep++;renderGuidedStep();}
}
function guidedBack(){
  if(_guidedStep>0){_guidedStep--;renderGuidedStep();}
}

function renderAdkarJourneyRef(){
  if(!isAdkarFramework())return;
  _guidedActive=true;
  const container=document.getElementById('guided-adkar-container');
  const grid=document.getElementById('p-adkar-grid');
  const sum=document.querySelector('#psec-adkar .ak-sum');
  if(grid)grid.style.display='none';
  if(sum)sum.style.display='none';
  renderAdkarJourney();
}

function renderGuidedSummary(){
  const container=document.getElementById('guided-adkar-container');
  if(!container)return;
  const p=getProj();if(!p)return;
  const dims=getActiveDims();
  const scores=ADKAR_DIM_ORDER.map(dk=>p.adkarScores[dk]||3);
  const avg=+(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);

  // Find barrier (lowest score, earliest in sequence if tied)
  let barrierIdx=0;let barrierScore=scores[0];
  scores.forEach((s,i)=>{if(s<barrierScore){barrierScore=s;barrierIdx=i;}});
  const barrierKey=ADKAR_DIM_ORDER[barrierIdx];
  const barrierG=ADKAR_GUIDED[barrierKey];

  // Find interpretation
  const interp=ADKAR_GUIDED_INTERP.find(r=>avg>=r.min)||ADKAR_GUIDED_INTERP[ADKAR_GUIDED_INTERP.length-1];

  // Sequential dependency warnings
  const seqWarnings=[];
  for(let i=0;i<4;i++){
    if(scores[i]<scores[i+1]){
      seqWarnings.push({upstream:ADKAR_DIM_NAMES[ADKAR_DIM_ORDER[i]],downstream:ADKAR_DIM_NAMES[ADKAR_DIM_ORDER[i+1]],upIdx:i});
    }
  }

  // Dimensions below 3 with interventions
  const lowDims=ADKAR_DIM_ORDER.filter(dk=>(p.adkarScores[dk]||3)<3).map(dk=>({
    key:dk,name:ADKAR_DIM_NAMES[dk],score:p.adkarScores[dk],
    intervention:ADKAR_GUIDED[dk].intervention[0]
  }));

  // Radar chart data (simple SVG)
  const radarPoints=scores.map((s,i)=>{
    const angle=(Math.PI*2*i/5)-(Math.PI/2);
    const r=s/5*90;
    return{x:100+r*Math.cos(angle),y:100+r*Math.sin(angle)};
  });
  const radarPoly=radarPoints.map(p=>p.x+','+p.y).join(' ');
  const radarGrid=[1,2,3,4,5].map(level=>{
    const pts=Array.from({length:5},(_,i)=>{
      const angle=(Math.PI*2*i/5)-(Math.PI/2);
      const r=level/5*90;
      return(100+r*Math.cos(angle))+','+(100+r*Math.sin(angle));
    }).join(' ');
    return`<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  }).join('');
  const radarLabels=ADKAR_DIM_ORDER.map((dk,i)=>{
    const angle=(Math.PI*2*i/5)-(Math.PI/2);
    const r=110;
    const x=100+r*Math.cos(angle);const y=100+r*Math.sin(angle);
    return`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="rgba(255,255,255,0.6)" font-size="9" font-family="var(--font-body)">${ADKAR_DIM_NAMES[dk].charAt(0)}</text>`;
  }).join('');

  container.innerHTML=`
    <div class="guided-panel guided-summary">
      <div class="guided-summary-hd">
        <div>
          <div class="guided-summary-title">ADKAR Readiness Summary</div>
          <div class="guided-summary-sub">${esc(p.name||'Project')}</div>
        </div>
        <div class="guided-summary-score">
          <div class="guided-summary-avg">${avg}</div>
          <div class="guided-summary-max">/5</div>
        </div>
      </div>

      <div class="guided-summary-interp ${interp.cls}">
        <div class="guided-interp-label">${esc(interp.label)}</div>
        <div class="guided-interp-text">${esc(interp.text)}</div>
      </div>

      <div class="guided-summary-body">
        <div class="guided-radar-wrap">
          <svg viewBox="0 0 200 200" class="guided-radar">
            ${radarGrid}
            <polygon points="${radarPoly}" fill="rgba(229,204,148,0.2)" stroke="var(--gold)" stroke-width="2"/>
            ${radarPoints.map((pt,i)=>`<circle cx="${pt.x}" cy="${pt.y}" r="4" fill="${scores[i]<3?'var(--color-amber,#d97706)':'var(--gold)'}" stroke="var(--nav-bg)" stroke-width="2"/>`).join('')}
            ${radarLabels}
          </svg>
          <div class="guided-radar-legend">
            ${ADKAR_DIM_ORDER.map((dk,i)=>`<div class="guided-radar-item${i===barrierIdx?' barrier':''}">
              <span class="guided-radar-ltr">${ADKAR_DIM_NAMES[dk].charAt(0)}</span>
              <span class="guided-radar-name">${ADKAR_DIM_NAMES[dk]}</span>
              <span class="guided-radar-score">${scores[i]}</span>
            </div>`).join('')}
          </div>
        </div>

        <div class="guided-barrier-summary">
          <div class="guided-barrier-hd"><i class="ph ph-warning-circle"></i> Barrier: ${esc(ADKAR_DIM_NAMES[barrierKey])}</div>
          <p>${esc(barrierG.barrier.split('\n')[0])}</p>
          <p class="guided-barrier-action">Address this first. Until ${esc(ADKAR_DIM_NAMES[barrierKey])} improves, downstream scores will not hold.</p>
        </div>

        ${seqWarnings.length?`<div class="guided-seq-warnings">
          ${seqWarnings.map(w=>`<div class="guided-seq-warn">
            <i class="ph ph-warning-circle"></i>
            <div><strong>${esc(w.upstream)}</strong> is scored lower than <strong>${esc(w.downstream)}</strong>. ADKAR is sequential \u2014 ${esc(w.downstream)} cannot be reliable without a solid ${esc(w.upstream)}.
            <button class="guided-review-btn" onclick="_guidedStep=${w.upIdx};renderGuidedStep();">Review ${esc(w.upstream)} score</button></div>
          </div>`).join('')}
        </div>`:''}

        ${lowDims.length?`<div class="guided-interventions">
          <div class="guided-interventions-hd">Recommended Interventions</div>
          ${lowDims.map(d=>`<div class="guided-intervention-item">
            <div class="guided-intervention-dim">${esc(d.name)} <span class="guided-intervention-score">${d.score}/5</span></div>
            <div class="guided-intervention-text">${esc(d.intervention)}</div>
          </div>`).join('')}
        </div>`:''}

        <div class="guided-client-lang">
          <div class="guided-client-lang-hd"><i class="ph ph-quotes"></i> Client-Facing Language</div>
          <blockquote>${esc(barrierG.clientLang)}</blockquote>
        </div>
      </div>

      <div class="guided-nav">
        <button class="btn-sm btn-ghost" onclick="_guidedStep=4;renderGuidedStep();"><i class="ph ph-arrow-left"></i> Back to Reinforcement</button>
        <button class="btn-sm" onclick="exitGuidedAdkar();">Done \u2014 Return to Overview</button>
      </div>
    </div>`;

  updatePAdkarSummary();
}

function addPSH(){
  const p=getProj();if(!p)return;
  const inp=document.getElementById('p-sh-inp');const name=inp.value.trim();if(!name)return;
  p.stakeholders.push({id:uid(),name,
    agency:'',stakeholderType:'end_user_group',roleCategory:'',
    factors:{resistance:3,env:3,window:3,complexity:3,saturation:3,leadership:3},objectives:[],
    kirk:{L1:{method:'',timing:''},L2:{method:'',assessment:''},L3:{interval:'30',observable:''},L4:{outcome:'',metric:''}},
    rein:{owner:'',activities:'',intervals:['30 Days'],escalation:''},
    trust:3,trustHistory:[],preconceptions:[],touchpoints:[],
    anxietyIndicators:{whatDoesThisMeanFreq:0,extraReviewCycles:0,escalations:0,attendanceDrop:false}});
  inp.value='';renderPSH();renderPKPIs();touch('proj');schedSave();
}
function removePSH(id){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);const label=sh?sh.name:'this group';if(!confirm('Remove stakeholder group "'+label+'"? This will delete all objectives, measurement data, reinforcement plans, and touchpoints for this group.'))return;p.stakeholders=p.stakeholders.filter(s=>s.id!==id);renderPSH();renderPKPIs();touch('proj');schedSave();}
function migrateStakeholders(p){
  if(!p||!p.stakeholders)return;
  p.stakeholders.forEach(sh=>{
    if(sh.agency===undefined)sh.agency='';
    if(sh.stakeholderType===undefined)sh.stakeholderType='end_user_group';
    if(sh.roleCategory===undefined)sh.roleCategory='';
    if(sh.trust===undefined)sh.trust=3;
    if(!sh.trustHistory)sh.trustHistory=[];
    if(!sh.preconceptions)sh.preconceptions=[];
    if(!sh.touchpoints)sh.touchpoints=[];
    if(!sh.anxietyIndicators)sh.anxietyIndicators={whatDoesThisMeanFreq:0,extraReviewCycles:0,escalations:0,attendanceDrop:false};
  });
}
function updatePSHField(id,field,val){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh[field]=val;touch('proj');schedSave();renderPAHM();}
function removeMember(shId,memberIdx){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===shId);if(!sh||!sh.members)return;
  const name=sh.members[memberIdx]||'this member';
  if(!confirm('Remove "'+name+'" from '+sh.name+'?'))return;
  sh.members.splice(memberIdx,1);
  touch('proj');schedSave();_shActiveTab[shId]=0;renderPSH();
}
function addMember(shId){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===shId);if(!sh)return;
  const name=prompt('Enter member name:');
  if(!name||!name.trim())return;
  if(!sh.members)sh.members=[];
  sh.members.push(name.trim());
  touch('proj');schedSave();_shActiveTab[shId]=0;renderPSH();
}
const _shActiveTab={};
function switchSHTab(shId,idx){
  _shActiveTab[shId]=idx;
  const card=document.getElementById('shcard-'+shId);if(!card)return;
  card.querySelectorAll('.sh-tab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  card.querySelectorAll('.sh-tab-panel').forEach((p,i)=>p.classList.toggle('active',i===idx));
}
function renderPSH(){
  const p=getProj();if(!p)return;migrateStakeholders(p);const wrap=document.getElementById('p-sh-wrap');
  if(!p.stakeholders.length){wrap.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">No ADKAR scores recorded.</p><p class="es-txt">ADKAR tells you where readiness is real and where it\u2019s assumed. Start with Awareness \u2014 it\u2019s the foundation everything else depends on.</p></div>';renderPAHM();return;}
  const adkarR=p.adkarScores['R'];
  const rNote=adkarR>=4?'Strong reinforcement environment. Sustain through scheduled check-ins.':adkarR>=3?'Moderate reinforcement signals. Supervisor activation recommended before go-live.':adkarR>=2?'Reinforcement gaps identified. Structured coaching and floor support required.':'Critical reinforcement deficit. Adoption sustainability is at high risk without immediate intervention.';
  const tabNames=['Identity','Adoption Factors','Objectives & Measurement','Reinforcement','Readiness'];
  wrap.innerHTML=p.stakeholders.map(sh=>{
    const sc=adoptScore(sh.factors),{tier,cls}=adoptTier(sc);
    const kr=kirkReady(sh),rr=reinReady(sh);const loc=sh.objectives.filter(o=>o.trim()).length;
    const at=_shActiveTab[sh.id]||1;
    const typeLabel=sh.stakeholderType==='decision_maker'?'Decision-Maker':'End-User Group';
    const memberList=sh.members&&sh.members.length?sh.members:[];
    return`<div class="sh-card" id="shcard-${sh.id}"><div class="sh-hd">
      <div class="sh-name">${esc(sh.name)}${memberList.length?` <span style="font-size:11px;font-weight:400;color:var(--ink-60)">(${memberList.length} members)</span>`:''}</div>
      <div class="adopt-badge ${cls}">${sc}% — ${tier}</div>
      <button class="btn-rm-sh" onclick="removePSH(${sh.id})">&times;</button>
    </div>
    <div class="sh-tabs">${tabNames.map((t,i)=>`<button class="sh-tab${i===at?' active':''}" onclick="switchSHTab(${sh.id},${i})">${t}</button>`).join('')}</div>
    <!-- Tab 0: Identity -->
    <div class="sh-tab-panel${at===0?' active':''}">
      <div class="sh-identity-grid">
        <div class="sh-id-field"><label>Agency / Organization</label><input class="sh-id-inp" value="${esc(sh.agency)}" placeholder="e.g. Department of Labor" oninput="updatePSHField(${sh.id},'agency',this.value)"></div>
        <div class="sh-id-field"><label>Stakeholder Type</label><select class="sh-id-inp" onchange="updatePSHField(${sh.id},'stakeholderType',this.value)">
          <option value="end_user_group"${sh.stakeholderType==='end_user_group'?' selected':''}>End-User Group</option>
          <option value="decision_maker"${sh.stakeholderType==='decision_maker'?' selected':''}>Decision-Maker</option></select></div>
        <div class="sh-id-field"><label>Role Category</label><input class="sh-id-inp" value="${esc(sh.roleCategory)}" placeholder="e.g. Case Workers, Supervisors" oninput="updatePSHField(${sh.id},'roleCategory',this.value)"></div>
      </div>
      <div style="margin-top:12px;padding:10px 12px;background:var(--bg-alt,#f7f8fa);border-radius:8px">
        <div style="font-size:11px;font-weight:700;color:var(--ink-60);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Members (${memberList.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${memberList.map((m,mi)=>`<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:var(--bg,#fff);border:1px solid var(--border,#e0e0e0);border-radius:4px;font-size:12px;color:var(--ink)">${esc(m)}<button onclick="removeMember(${sh.id},${mi})" style="background:none;border:none;color:var(--ink-60);cursor:pointer;font-size:14px;line-height:1;padding:0 2px" title="Remove ${esc(m)}">&times;</button></span>`).join('')}</div>
        <button onclick="addMember(${sh.id})" style="margin-top:8px;background:none;border:1px dashed var(--border,#ccc);border-radius:4px;padding:4px 12px;font-size:12px;color:var(--ink-60);cursor:pointer">+ Add Member</button>
      </div>
    </div>
    <!-- Tab 1: Adoption Factors -->
    <div class="sh-tab-panel${at===1?' active':''}">
      <div class="sh-factors">${AF.map(f=>`<div class="sh-fac"><label>${f.label}</label>
        <div class="fac-row"><input type="range" class="fac-sl" min="1" max="5" value="${sh.factors[f.key]}" oninput="updatePFac(${sh.id},'${f.key}',this.value)">
        <div class="fac-vl" id="pfv-${sh.id}-${f.key}">${sh.factors[f.key]}</div></div>
        <div class="fac-desc" id="pfd-${sh.id}-${f.key}">${FD[sh.factors[f.key]]}</div></div>`).join('')}</div>
    </div>
    <!-- Tab 2: Objectives & Measurement -->
    <div class="sh-tab-panel${at===2?' active':''}">
      <div style="margin-bottom:24px">
        <h4 style="margin:0 0 8px;font-size:13px;font-weight:700;color:var(--ink)">Learning Objectives <span class="exp-badge ${loc>0?'ready':'needed'}">${loc>0?loc+' Defined':'Not Started'}</span></h4>
        <div class="lo-hint">Write in performance terms: the learner will be able to [verb] [skill/behavior] [condition/standard].</div>
        <ul class="lo-list">${sh.objectives.map((o,i)=>`<li class="lo-item"><span class="lo-num">0${i+1}</span>
          <input class="lo-inp" value="${esc(o)}" placeholder="The learner will be able to..." oninput="updatePLO(${sh.id},${i},this.value)">
          <button class="btn-lo-rm" onclick="removePLO(${sh.id},${i})">&times;</button></li>`).join('')}</ul>
        <button class="btn-lo-add" onclick="addPLO(${sh.id})">+ Add Objective</button>
      </div>
      <h4 style="margin:0 0 8px;font-size:13px;font-weight:700;color:var(--ink)">Measurement Framework — Kirkpatrick <span class="exp-badge ${kr}">${badgeLabel(kr)}</span></h4>
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
    <!-- Tab 3: Reinforcement -->
    <div class="sh-tab-panel${at===3?' active':''}">
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
    <!-- Tab 4: Readiness -->
    <div class="sh-tab-panel${at===4?' active':''}">
      ${renderTrustSection(sh)}
    </div>
    </div>`;
  }).join('');
  renderPAHM();
}

function renderTrustSection(sh){
  const trust=sh.trust||3;
  const trustLabels=['','Active Distrust','Skeptical','Neutral','Cautiously Optimistic','High Trust'];
  const trustColors={1:'var(--red)',2:'var(--amber)',3:'var(--ink-60)',4:'var(--gold)',5:'var(--green)'};
  const ai=sh.anxietyIndicators||{};
  const highAnxiety=(ai.whatDoesThisMeanFreq||0)>5||(ai.extraReviewCycles||0)>2||(ai.escalations||0)>1||ai.attendanceDrop;
  const tps=sh.touchpoints||[];
  const increased=tps.filter(t=>t.trustImpact==='Increased').length;
  const decreased=tps.filter(t=>t.trustImpact==='Decreased').length;
  const noChange=tps.filter(t=>t.trustImpact==='No Change').length;
  const prec=sh.preconceptions||[];
  const ps=sh.id&&window.releases?getProj()?.pulseResults?.[sh.id]?.scores||{}:{};
  const sentSc=sentimentScore(sh,ps);
  const sentSW=getSoWhat('sentiment',sentSc,{
    recentNoChange:tps.slice(-3).filter(t=>t.trustImpact==='No Change').length,
    trust,
    trustDeclining:(sh.trustHistory||[]).length>=2&&sh.trustHistory[sh.trustHistory.length-1].value<sh.trustHistory[sh.trustHistory.length-2].value,
    highAnxiety
  });
  return`<div class="exp-sec"><button class="exp-tog" onclick="toggleExp('ptrust-${sh.id}',this)" aria-expanded="false">
    <div class="exp-tog-l">Emotional Readiness &amp; Trust<span class="exp-badge" style="background:${trustColors[trust]||'var(--ink-60)'};color:#fff">${trustLabels[trust]||'Level '+trust}</span></div>
    <span class="exp-arr" id="parr-trust-${sh.id}"><i class="ph ph-caret-down"></i></span></button>
    <div class="exp-body" id="ptrust-${sh.id}">
      <div class="trust-section">
        <div class="trust-score-row">
          <div class="trust-sent-card">
            <div class="trust-sent-val" style="color:${sentSc>=60?'var(--green)':sentSc>=40?'var(--gold)':'var(--red)'}">${sentSc}%</div>
            <div class="trust-sent-lbl">Sentiment Score</div>
            ${sentSW?`<div class="so-what-line">${esc(sentSW)}</div>`:''}
          </div>
          <div class="trust-breakdown">
            <div class="trust-mod-row"><span>Base readiness score</span><span>${adoptScore(sh.factors)}%</span></div>
            <div class="trust-mod-row"><span>Trust modifier</span><span style="color:${trust<3?'var(--red)':trust>3?'var(--green)':'var(--ink-60)'}">${trust<3?'−'+(3-trust)*8:trust>3?'+'+(trust-3)*4:'0'}pts</span></div>
            <div class="trust-mod-row"><span>Anxiety modifier</span><span style="color:${highAnxiety?'var(--red)':'var(--ink-60)'}'">${highAnxiety?'−'+([(ai.whatDoesThisMeanFreq||0)>5,(ai.extraReviewCycles||0)>2,(ai.escalations||0)>1,ai.attendanceDrop].filter(Boolean).length*5):'0'}pts</span></div>
            <div class="trust-mod-row"><span>Touchpoint modifier</span><span style="color:${increased>decreased?'var(--green)':decreased>increased?'var(--red)':'var(--ink-60)'}">${increased>0||decreased>0?((increased-decreased)*5>0?'+':'')+Math.max(-30,Math.min(15,(increased-decreased)*5)+'pts'):'0pts'}</span></div>
          </div>
        </div>
        <div class="trust-field"><label>Trust Level</label>
          <div class="trust-selector">${[1,2,3,4,5].map(v=>`<button class="trust-btn ${trust===v?'active':''}" onclick="updateSHTrust(${sh.id},${v})" title="${trustLabels[v]}">${v}<div class="trust-btn-lbl">${trustLabels[v]}</div></button>`).join('')}</div>
        </div>
        ${sh.trustHistory?.length>=2?`<div class="trust-history-spark">${renderTrustSparkline(sh.trustHistory)}</div>`:''}
        <button class="btn-add-sm" onclick="recordTrustUpdate(${sh.id})">+ Record Trust Update</button>
        <div class="trust-field" style="margin-top:16px"><label>Preconceptions</label>
          <div class="preconcepts-list">${prec.map((pc,i)=>`<div class="preconcept-item">
            <span class="preconcept-text">${esc(pc.text)}</span>
            <select class="pc-status-sel" onchange="updatePreconception(${sh.id},${i},'status',this.value)">
              <option ${pc.status==='Active'?'selected':''}>Active</option>
              <option ${pc.status==='Being Addressed'?'selected':''}>Being Addressed</option>
              <option ${pc.status==='Resolved'?'selected':''}>Resolved</option>
            </select>
            <span class="pc-status-badge pc-${(pc.status||'Active').toLowerCase().replace(' ','-')}">${pc.status||'Active'}</span>
            <button class="btn-rm-sm" onclick="removePreconception(${sh.id},${i})">&times;</button>
          </div>`).join('')}</div>
          <button class="btn-add-sm" onclick="addPreconception(${sh.id})">+ Add Preconception</button>
        </div>
        <div class="trust-field" style="margin-top:16px"><label>Anxiety Indicators</label>
          <div class="anxiety-grid">
            <div class="anxiety-row"><span>"What does this mean?" frequency</span><input class="inp-sm" type="number" min="0" value="${ai.whatDoesThisMeanFreq||0}" oninput="updateSHAnxiety(${sh.id},'whatDoesThisMeanFreq',+this.value)">${(ai.whatDoesThisMeanFreq||0)>5?'<span class="anxiety-warn"><i class="ph ph-warning"></i> High</span>':''}</div>
            <div class="anxiety-row"><span>Extra review cycle requests</span><input class="inp-sm" type="number" min="0" value="${ai.extraReviewCycles||0}" oninput="updateSHAnxiety(${sh.id},'extraReviewCycles',+this.value)">${(ai.extraReviewCycles||0)>2?'<span class="anxiety-warn"><i class="ph ph-warning"></i> High</span>':''}</div>
            <div class="anxiety-row"><span>Escalations to leadership</span><input class="inp-sm" type="number" min="0" value="${ai.escalations||0}" oninput="updateSHAnxiety(${sh.id},'escalations',+this.value)">${(ai.escalations||0)>1?'<span class="anxiety-warn"><i class="ph ph-warning"></i> High</span>':''}</div>
            <div class="anxiety-row"><span>Attendance/participation drop-off</span><label class="toggle-label"><input type="checkbox" ${ai.attendanceDrop?'checked':''} onchange="updateSHAnxiety(${sh.id},'attendanceDrop',this.checked)"><span class="toggle-pill"></span></label>${ai.attendanceDrop?'<span class="anxiety-warn"><i class="ph ph-warning"></i> Active</span>':''}</div>
          </div>
        </div>
        <div class="trust-field" style="margin-top:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><label>Engagement Touchpoints</label><button class="btn-add-sm" onclick="openAddTouchpoint(${sh.id})">+ Log Touchpoint</button></div>
          ${tps.length?`<div class="tp-summary"><span class="tp-sum increased">↑ ${increased} Increased</span><span class="tp-sum no-change">→ ${noChange} No Change</span><span class="tp-sum decreased">↓ ${decreased} Decreased</span></div>`:''}
          <div class="tp-list">${tps.map((tp,i)=>`<div class="tp-item">
            <span class="tp-impact-icon ${tp.trustImpact==='Increased'?'ti-up':tp.trustImpact==='Decreased'?'ti-down':'ti-neutral'}">${tp.trustImpact==='Increased'?'↑':tp.trustImpact==='Decreased'?'↓':'→'}</span>
            <div class="tp-detail"><div class="tp-desc">${esc(tp.description)}</div><div class="tp-meta">${tp.type} · ${fmtDate(tp.date)} · <span style="color:${tp.trustImpact==='Increased'?'var(--green)':tp.trustImpact==='Decreased'?'var(--red)':'var(--ink-60)'}">${tp.trustImpact}</span></div></div>
            <button class="btn-rm-sm" onclick="removeTouchpoint(${sh.id},${i})">&times;</button>
          </div>`).join('')||'<div class="es-txt" style="font-size:12px;padding:8px 0">No engagement touchpoints recorded. Log stakeholder interactions to track adoption momentum.</div>'}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
function renderTrustSparkline(history){
  const pts=history.slice(-6);if(pts.length<2)return'';
  const vals=pts.map(p=>p.value||3);
  const max=5,min=1,h=40,w=120;
  const points=vals.map((v,i)=>{const x=Math.round(i/(vals.length-1)*(w-8))+4;const y=h-Math.round((v-min)/(max-min)*(h-8))-4;return`${x},${y}`;}).join(' ');
  const lastColor=vals[vals.length-1]>=4?'var(--green)':vals[vals.length-1]>=3?'var(--gold)':'var(--red)';
  return`<div class="trust-spark-wrap"><div class="trust-spark-lbl">Trust trend (last ${pts.length} entries)</div><svg width="${w}" height="${h}" class="trust-spark"><polyline points="${points}" fill="none" stroke="${lastColor}" stroke-width="2"/></svg></div>`;
}
function updateSHTrust(id,val){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;
  sh.trust=val;renderPSH();touch('proj');schedSave();
}
function recordTrustUpdate(id){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;
  if(!sh.trustHistory)sh.trustHistory=[];
  const note=prompt('Optional note for this trust update (press OK to save):','');
  if(note===null)return;
  sh.trustHistory.push({date:new Date().toISOString().split('T')[0],value:sh.trust||3,note});
  touch('proj');schedSave();renderPSH();
}
function addPreconception(id){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;
  if(!sh.preconceptions)sh.preconceptions=[];
  const text=prompt('Describe the preconception this stakeholder group holds:');
  if(!text)return;
  sh.preconceptions.push({id:uid(),text,status:'Active'});
  renderPSH();touch('proj');schedSave();
}
function removePreconception(shId,idx){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===shId);if(!sh||!sh.preconceptions)return;
  if(!confirm('Remove this preconception?'))return;
  sh.preconceptions.splice(idx,1);renderPSH();touch('proj');schedSave();
}
function updatePreconception(shId,idx,field,val){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===shId);if(!sh||!sh.preconceptions||!sh.preconceptions[idx])return;
  sh.preconceptions[idx][field]=val;renderPSH();touch('proj');schedSave();
}
function updateSHAnxiety(id,field,val){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;
  if(!sh.anxietyIndicators)sh.anxietyIndicators={whatDoesThisMeanFreq:0,extraReviewCycles:0,escalations:0,attendanceDrop:false};
  sh.anxietyIndicators[field]=val;renderPSH();touch('proj');schedSave();
}
function openAddTouchpoint(shId){
  let existing=document.getElementById('add-tp-modal');if(existing)existing.remove();
  const modal=document.createElement('div');modal.id='add-tp-modal';modal.className='modal-ov';
  modal.innerHTML=`<div class="modal-box" style="max-width:480px">
    <div class="modal-hd"><div class="modal-title">Log Engagement Touchpoint</div><button class="modal-close" onclick="document.getElementById('add-tp-modal').remove()">&times;</button></div>
    <div class="modal-bd">
      <div class="field-group"><label>Date</label><input class="inp-std" id="tp-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="field-group"><label>Type</label><select class="inp-std" id="tp-type"><option>Meeting</option><option>Demo</option><option>Q&A Session</option><option>Leadership Lab</option><option>Training Session</option><option>Walkthrough</option><option>Other</option></select></div>
      <div class="field-group"><label>Description</label><input class="inp-std" id="tp-desc" placeholder="Brief description of the engagement activity"></div>
      <div class="field-group"><label>Impact on Trust</label>
        <div class="tp-impact-btns">
          <button class="tp-impact-btn" id="tpi-inc" onclick="selectTPImpact('Increased')" style="border-color:var(--green)">↑ Increased</button>
          <button class="tp-impact-btn" id="tpi-nc" onclick="selectTPImpact('No Change')">→ No Change</button>
          <button class="tp-impact-btn" id="tpi-dec" onclick="selectTPImpact('Decreased')" style="border-color:var(--red)">↓ Decreased</button>
        </div>
      </div>
    </div>
    <div class="modal-ft"><button class="btn-cancel" onclick="document.getElementById('add-tp-modal').remove()">Cancel</button><button class="btn-gold" onclick="saveTouchpoint(${shId})">Save Touchpoint</button></div>
  </div>`;
  document.body.appendChild(modal);requestAnimationFrame(()=>modal.classList.add('open'));
  modal.addEventListener('click',function(e){if(e.target===this)this.remove();});
  window._selectedTPImpact='No Change';
  document.getElementById('tpi-nc').classList.add('active');
}
function selectTPImpact(val){
  window._selectedTPImpact=val;
  ['inc','nc','dec'].forEach(k=>{document.getElementById('tpi-'+k)?.classList.remove('active');});
  const key=val==='Increased'?'inc':val==='No Change'?'nc':'dec';
  document.getElementById('tpi-'+key)?.classList.add('active');
}
function saveTouchpoint(shId){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===shId);if(!sh)return;
  if(!sh.touchpoints)sh.touchpoints=[];
  const date=document.getElementById('tp-date')?.value||new Date().toISOString().split('T')[0];
  const type=document.getElementById('tp-type')?.value||'Meeting';
  const desc=document.getElementById('tp-desc')?.value.trim()||'';
  sh.touchpoints.push({id:uid(),date,type,description:desc,trustImpact:window._selectedTPImpact||'No Change'});
  document.getElementById('add-tp-modal')?.remove();
  renderPSH();touch('proj');schedSave();
}
function removeTouchpoint(shId,idx){
  const p=getProj();if(!p)return;
  const sh=p.stakeholders.find(s=>s.id===shId);if(!sh||!sh.touchpoints)return;
  if(!confirm('Remove this touchpoint?'))return;
  sh.touchpoints.splice(idx,1);renderPSH();touch('proj');schedSave();
}
function updatePFac(id,key,val){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.factors[key]=parseInt(val);const ve=document.getElementById(`pfv-${id}-${key}`);const de=document.getElementById(`pfd-${id}-${key}`);if(ve)ve.textContent=val;if(de)de.textContent=FD[parseInt(val)];renderPSH();renderPKPIs();touch('proj');schedSave();}
function addPLO(id){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;sh.objectives.push('');renderPSH();const b=document.getElementById('plo-'+id);if(b){b.classList.add('open');const a=document.getElementById('parr-lo-'+id);if(a)a.classList.add('open');}touch('proj');schedSave();}
function removePLO(id,idx){const p=getProj();if(!p)return;const sh=p.stakeholders.find(s=>s.id===id);if(!sh)return;if(!confirm('Remove this learning objective?'))return;sh.objectives.splice(idx,1);renderPSH();touch('proj');schedSave();}
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
  const p=getProj();if(!p)return;migrateStakeholders(p);const pan=document.getElementById('p-ahm-panel');
  if(!p.stakeholders.length){pan.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">Score stakeholder groups in the Adoption Scoring tab to see where readiness is real and where it\u2019s assumed.</p></div>';return;}
  const cols=[...AF.map(f=>f.label),'Measurement','Reinforcement','Adoption Score'];
  const colSpan=cols.length+1;
  // Group by agency, decision_makers first
  const sorted=[...p.stakeholders].sort((a,b)=>{
    const ta=a.stakeholderType==='decision_maker'?0:1,tb=b.stakeholderType==='decision_maker'?0:1;
    if(ta!==tb)return ta-tb;
    return(a.agency||'').localeCompare(b.agency||'');
  });
  const groups={};sorted.forEach(sh=>{const key=sh.agency||'Unassigned';if(!groups[key])groups[key]=[];groups[key].push(sh);});
  let h='<div style="overflow-x:auto"><table class="ahm-tbl"><thead><tr><th class="ahm-rh">Group</th>';cols.forEach(c=>{h+=`<th>${c}</th>`;});h+='</tr></thead><tbody>';
  const agencyKeys=Object.keys(groups);
  const showGroups=agencyKeys.length>1||agencyKeys[0]!=='Unassigned';
  agencyKeys.forEach(agency=>{
    if(showGroups)h+=`<tr class="ahm-group-row"><td colspan="${colSpan}" class="ahm-group-hd">${esc(agency)}</td></tr>`;
    groups[agency].forEach(sh=>{
      const sc=adoptScore(sh.factors),{tier,cls}=adoptTier(sc);
      const kr=kirkReady(sh),rr=reinReady(sh);const krCls=kr==='ready'?'low':kr==='partial'?'mod':'crit';const rrCls=rr==='ready'?'low':rr==='partial'?'mod':'crit';
      const typeBadge=sh.stakeholderType==='decision_maker'?'<span class="ahm-type-badge dm">DM</span>':'';
      h+=`<tr><td class="ahm-rl">${typeBadge}${esc(sh.name)}</td>`;
      AF.forEach(f=>{const v=sh.factors[f.key],t=facTier(v);h+=`<td class="ahm-cw"><div class="ahm-cell ${t}">${TIER_MAP[t]}<br><span style="font-size:9px;opacity:0.65">${v}/5</span></div></td>`;});
      h+=`<td class="ahm-cw"><div class="ahm-cell ${krCls}">${badgeLabel(kr)}</div></td>`;
      h+=`<td class="ahm-cw"><div class="ahm-cell ${rrCls}">${badgeLabel(rr)}</div></td>`;
      h+=`<td class="ahm-cw"><div class="ahm-cell ${cls}" style="font-size:11px">${sc}%<br><span style="font-size:9px;opacity:0.65">${tier}</span></div></td></tr>`;
    });
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
  if(!allRes.length){qv.innerHTML='<div class="es" style="padding:16px"><div class="es-rule"></div><p class="es-txt">No resources assigned yet. Add team assignments in the Resources tab to track capacity and workload.</p></div>';return;}
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
  document.getElementById('p-kpi-rg-s').textContent=hr.score!==null?hr.score+'% readiness':'Stakeholder group';
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

  // Change Readiness (25%)
  const fwScores=dims.map(d=>p.adkarScores?.[d.key]||3);
  const fwAvg=fwScores.length?fwScores.reduce((a,b)=>a+b,0)/fwScores.length:3;
  const fwPct=Math.round(fwAvg/5*100);

  // People & Trust (20%) — multi-source: trust, anxiety, touchpoints, pulse
  const sentPct=shs.length?Math.round(shs.reduce((a,sh)=>{
    const ps=p.pulseResults?.[sh.id]?.scores||{};
    return a+sentimentScore(sh,ps);
  },0)/shs.length):50;

  // Training Effectiveness (20%)
  const kirkPcts=shs.map(sh=>{
    if(!sh?.kirk)return 0;
    let f=0;const k=sh.kirk;
    if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;
    if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;
    return Math.round(f/8*100);
  });
  const trainPct=kirkPcts.length?Math.round(kirkPcts.reduce((a,b)=>a+b,0)/kirkPcts.length):0;

  // Lifecycle Health (10%) — SDLC signals
  const lhData=calcLifecycleHealth(p);
  const lcPct=lhData.score;

  // Communications Completion (10%)
  const commsDims=dims.filter(d=>['A1','d1','d7','d8'].includes(d.key));
  const commsAvg=commsDims.length?commsDims.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/commsDims.length:3;
  const commsPct=Math.round(commsAvg/5*100);

  // Open Issues (15%)
  const gs=projGateScore(p);
  const flagCount=getProjFlagCount(p);
  const riskPct=Math.max(0,Math.min(100, gs!==null ? Math.round(gs*(flagCount===0?1:flagCount<=2?0.8:0.5)) : 50));

  // Weighted total — when training is not yet active, drop the 20% training
  // weight and renormalize the remaining five dimensions back to 100%.
  const trActive=trainingActive(p);
  const k=trActive?1:1/0.80;
  const wTot={fw:0.25*k,sent:0.20*k,train:trActive?0.20:0,lc:0.10*k,comms:0.10*k,risk:0.15*k};
  const totalScore=Math.round(fwPct*wTot.fw + sentPct*wTot.sent + trainPct*wTot.train + lcPct*wTot.lc + commsPct*wTot.comms + riskPct*wTot.risk);

  // Data confidence
  const conf=calcDataConfidence(p);

  // Determine tier
  let tierKey='critical';
  if(totalScore>=85)tierKey='champion';
  else if(totalScore>=65)tierKey='ontrack';
  else if(totalScore>=40)tierKey='atrisk';

  const pctLabel=w=>Math.round(w*100)+'%';
  const components=[
    {label:'Change Readiness',weight:pctLabel(wTot.fw),pct:fwPct,color:'var(--navy)',dsType:getDataSourceType('framework',p)},
    {label:'People & Trust',weight:pctLabel(wTot.sent),pct:sentPct,color:'var(--gold)',dsType:getDataSourceType('sentiment',p)},
    {label:'Training & Preparedness',weight:trActive?pctLabel(wTot.train):'—',pct:trActive?trainPct:null,color:'var(--green)',dsType:getDataSourceType('training',p),pending:!trActive,pendingLabel:'Training not yet started'},
    {label:'Project Health',weight:pctLabel(wTot.lc),pct:lcPct,color:'#6B5EA8',dsType:getDataSourceType('lifecycle',p)},
    {label:'Communication',weight:pctLabel(wTot.comms),pct:commsPct,color:'#4A6FA5',dsType:getDataSourceType('comms',p)},
    {label:'Open Issues',weight:pctLabel(wTot.risk),pct:riskPct,color:riskPct>=70?'var(--green)':riskPct>=40?'var(--amber)':'var(--red)',dsType:getDataSourceType('risk',p)}
  ];

  const modal=document.createElement('div');
  modal.id='score-explainer-modal';
  modal.className='score-modal';
  modal.innerHTML=`<div class="score-modal-box">
    <button class="score-modal-close" onclick="document.getElementById('score-explainer-modal').classList.remove('open')" aria-label="Close">&times;</button>
    <h2>How This Score Works</h2>
    <p style="font-size:13px;color:var(--ink-60);margin:8px 0 20px">This score measures how prepared your organization is for this change. It combines six areas of readiness, each weighted by how much it affects successful adoption.</p>

    <h3>Score Confidence</h3>
    <div class="score-conf-wrap">
      <div class="score-conf-bar">
        <div class="dc-seg dc-measured" style="width:${conf.measured}%" title="Measured"></div>
        <div class="dc-seg dc-observed" style="width:${conf.observed}%" title="Observed"></div>
        <div class="dc-seg dc-estimated" style="width:${conf.estimated}%" title="Estimated"></div>
      </div>
      <div class="score-conf-leg">
        <span class="dc-leg"><span class="dc-dot dc-measured"></span>Measured ${conf.measured}%</span>
        <span class="dc-leg"><span class="dc-dot dc-observed"></span>Observed ${conf.observed}%</span>
        <span class="dc-leg"><span class="dc-dot dc-estimated"></span>Estimated ${conf.estimated}%</span>
      </div>
      ${conf.estimated>50?`<div class="score-conf-warn"><i class="ph ph-warning"></i> More than half of this score relies on estimated inputs. Add lifecycle signals, trust assessments, or pulse surveys to increase confidence.</div>`:''}
    </div>

    <h3>Formula Breakdown</h3>
    <div class="score-composite-val">Overall Score: ${totalScore}%</div>
    ${components.map(c=>c.pending?`<div class="score-bar-row" style="opacity:.55">
      <div class="score-bar-label">${c.label} ${dataSourceBadge(c.dsType)}</div>
      <div class="score-bar-track" style="background:rgba(255,255,255,0.04)"><div class="score-bar-val" style="padding:4px 8px;font-style:italic;color:var(--ink-60)">${c.pendingLabel}</div></div>
      <div class="score-bar-weight">${c.weight}</div>
    </div>`:`<div class="score-bar-row">
      <div class="score-bar-label">${c.label} ${dataSourceBadge(c.dsType)}</div>
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
      <strong>How We Calculate This:</strong> People & Trust is calculated from multiple data sources — engagement outcomes, trust assessments, concern indicators, and survey results (when available). No single data source drives the score. Scores marked <em>Estimated</em> would be strengthened by adding real data (surveys, project metrics, or documented observations). Training & Preparedness gives greater weight to whether people are actually applying skills on the job over whether they completed a course.
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
  pop.innerHTML=`<div class="score-composite-val" style="font-size:14px;margin-bottom:6px">Gate Score Thresholds</div>
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

  // Confidence reflects how much of the expected data has been filled in with
  // meaningful answers — not whether arrays exist. A project with 5 empty
  // data areas should not report High Confidence.
  const totalGateItems=GATE_DEFS.reduce((a,g)=>a+g.items.length,0);
  const answeredItems=GATE_DEFS.reduce((a,g)=>a+g.items.filter((_,i)=>{
    const v=p.gateState[g.id+'_'+i];return v&&v!=='gray';
  }).length,0);
  const gatePct=totalGateItems?answeredItems/totalGateItems:0;
  const shDepth=Math.min(1,stakeholderData.length/3);
  const fwTouched=dims.length?dims.filter(d=>(p.adkarScores?.[d.key]??3)!==3).length/dims.length:0;
  const completeness=gatePct*0.5 + shDepth*0.25 + fwTouched*0.25;
  const confidence=completeness>=0.70?'High':completeness>=0.40?'Medium':'Low';

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
  const trActive=trainingActive(p);
  const w=adoptionWeights(trActive);
  const currentAdoptionScore=Math.round(fwPct*w.fw+sentPct*w.sent+trainPctCalc*w.train+commsPct*w.comms+riskPct*w.risk);

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
    trainingCompletionRate:trActive?trainRate:null,
    trainingActive:trActive,
    trainingStartDate:p.trainingStartDate||null,
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
      const icon=dir==='positive'?'<i class="ph ph-arrow-up"></i>':dir==='negative'?'<i class="ph ph-arrow-down"></i>':'<i class="ph ph-caret-right"></i>';
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
      bannerEl.innerHTML=`<strong><i class="ph ph-warning"></i> Trajectory Alert:</strong> Based on current trends, this project is projected to score <strong>${w.score}%</strong> at <strong>${esc(w.gate)}</strong>. Consider intervention in <strong>${esc(w.dimension)}</strong>: ${esc(w.recommendation)}`;
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
// BEHAVIORAL DATA UPLOAD ARCHITECTURE (FUTURE — Phase 2)
// ════════════════════════════════════════════════════════
// Extends the import system to support uploading tangible
// behavioral data from external systems via CSV/XLSX:
//
// IMPORT TARGETS:
//   'lms'        → Training completion data (per learner/group)
//   'helpdesk'   → Support ticket data post-go-live
//   'sysusage'   → System usage/login data post-go-live
//
// LMS FIELD MAPPINGS (target: 'lms'):
//   learner/group  → stakeholder group name (fuzzy match)
//   course/module  → training module identifier
//   completionDate → date of completion
//   score/grade    → assessment score (maps to Kirkpatrick L2)
//   timeOnTask     → minutes spent (engagement indicator)
//   status         → complete/incomplete/in-progress
//   attempts       → number of attempts (struggle indicator)
//
// HELPDESK FIELD MAPPINGS (target: 'helpdesk'):
//   ticketId       → unique identifier
//   createdDate    → ticket creation date
//   category       → ticket category (maps to impact area)
//   priority       → severity level
//   resolvedDate   → resolution date
//   group/team     → affected stakeholder group (fuzzy match)
//   description    → ticket description (for theme analysis)
//
// SYSTEM USAGE FIELD MAPPINGS (target: 'sysusage'):
//   user/group     → stakeholder group name (fuzzy match)
//   loginDate      → date of login
//   feature/module → feature used
//   duration       → session duration (minutes)
//   errorsEncountered → count of errors in session
//   workaroundUsed → boolean indicator
//
// DATA FLOW:
//   Upload CSV/XLSX → parse → fuzzy match to stakeholder groups
//   → aggregate per group → store in p.behavioralData.{lms|helpdesk|sysusage}
//   → feed into sentimentScore() as Measured inputs
//   → feed into Lifecycle Health (deployment phase)
//   → feed into journey timeline (when journey view is built)
//
// STORAGE MODEL (future p.behavioralData):
//   {
//     lms: {
//       imported: ISO timestamp,
//       records: [{group,module,completionDate,score,timeOnTask,status,attempts}],
//       summary: {totalLearners,completionRate,avgScore,avgTimeOnTask}
//     },
//     helpdesk: {
//       imported: ISO timestamp,
//       records: [{ticketId,createdDate,category,priority,resolvedDate,group,description}],
//       summary: {totalTickets,avgResolutionDays,topCategories[],ticketsByWeek[]}
//     },
//     sysusage: {
//       imported: ISO timestamp,
//       records: [{group,loginDate,feature,duration,errorsEncountered,workaroundUsed}],
//       summary: {uniqueUsers,avgSessionDuration,loginFrequency,topFeatures[],errorRate}
//     }
//   }
//
// SCORING IMPACT:
//   - LMS data → Training Effectiveness moves from Observed to Measured
//   - Helpdesk data → feeds deployment.supportTickets* as Measured
//   - System usage → new "Adoption Behavior" metric (login frequency, feature usage)
//   - All three feed Data Confidence from Estimated → Measured
//
// PREREQUISITES:
//   - Extend FIELD_ALIASES with lms/helpdesk/sysusage field synonyms
//   - Add 'lms','helpdesk','sysusage' to openDocImport() target options
//   - Add p.behavioralData to newProject() default
//   - Add summary cards to project Overview tab
//   - Update getDataSourceType() to check behavioralData
// ════════════════════════════════════════════════════════
let _importTarget=null;
let _importParsed=[];

function openDocImport(target){
  _smartImportMode=false;
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
      <div class="import-sub">Upload a document to auto-populate ${targetLabels[target]||target} data. Supports .xlsx, .csv, .docx, .pdf, .pptx, and .txt files.</div></div>
      <button class="btn-ghost" onclick="document.getElementById('doc-import-modal').classList.remove('open')" style="font-size:22px;padding:0 6px;line-height:1">&times;</button>
    </div>
    <div class="import-drop" id="import-drop-zone" onclick="document.getElementById('import-file-input').click()">
      <div class="import-drop-icon">📄</div>
      <div class="import-drop-text">Drag &amp; drop your file here or <strong>browse</strong></div>
      <div class="import-drop-formats">.xlsx &nbsp; .csv &nbsp; .docx &nbsp; .pdf &nbsp; .pptx &nbsp; .txt</div>
    </div>
    <input type="file" id="import-file-input" accept=".xlsx,.xls,.csv,.docx,.pdf,.pptx,.txt" style="display:none" onchange="handleImportFile(this.files[0])">
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

let _smartImportMode=false;
function openDocImportSmart(docType){
  _smartImportMode=true;
  _importTarget=null;
  _importParsed=[];
  const isTraining=docType==='trainingplan';
  const title=isTraining?'Import Training Plan':'Import Change Plan';
  const sub=isTraining
    ?'Upload your training plan document. AdoptIQ will extract learning objectives, training risks, reinforcement activities, and success criteria automatically.'
    :'Upload a full change plan document. AdoptIQ will classify rows into Impact Assessment, Gap Analysis, or Stakeholder sections automatically.';
  let existing=document.getElementById('doc-import-modal');
  if(existing)existing.remove();
  const modal=document.createElement('div');
  modal.id='doc-import-modal';
  modal.className='import-modal';
  modal.innerHTML=`<div class="import-modal-box">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h2>${title}</h2>
      <div class="import-sub">${sub}</div></div>
      <button class="btn-ghost" onclick="document.getElementById('doc-import-modal').classList.remove('open')" style="font-size:22px;padding:0 6px;line-height:1">&times;</button>
    </div>
    <div class="import-drop" id="import-drop-zone" onclick="document.getElementById('import-file-input').click()">
      <div class="import-drop-icon">📄</div>
      <div class="import-drop-text">Drag &amp; drop your file here or <strong>browse</strong></div>
      <div class="import-drop-formats">.xlsx &nbsp; .csv &nbsp; .docx &nbsp; .pdf &nbsp; .pptx &nbsp; .txt</div>
    </div>
    <input type="file" id="import-file-input" accept=".xlsx,.xls,.csv,.docx,.pdf,.pptx,.txt" style="display:none" onchange="handleImportFile(this.files[0])">
    <div id="import-preview-area"></div>
    <div id="import-status-area"></div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
  const dropZone=modal.querySelector('#import-drop-zone');
  dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag-over');});
  dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.classList.remove('drag-over');
    if(e.dataTransfer.files.length)handleImportFile(e.dataTransfer.files[0]);});
  requestAnimationFrame(()=>modal.classList.add('open'));
}

// ── Section title keywords for classifying slides/headings ──
const SECTION_KEYWORDS={
  impact:['impact','change impact','impact assessment','change assessment','impacted','affected groups','affected populations','impacted groups','current state','future state','as-is','to-be','change readiness','readiness assessment'],
  gaps:['gap','gaps','gap analysis','risk','risks','issues','findings','mitigation','remediation','identified gaps'],
  stakeholders:['stakeholder','stakeholders','stakeholder analysis','audience','audiences','population','affected group','stakeholder groups','stakeholder assessment','stakeholder map','stakeholder engagement'],
  training:['training','training plan','learning','curriculum','course','learning objectives','training schedule','training strategy','training approach','training objectives'],
  communications:['communication','communications','communication plan','messaging','key messages','communication strategy','communication approach'],
  craid:['change request','change requests','risk register','risk log','assumptions','dependencies','constraints','craid','raid','risks & mitigation','risks and mitigation','risk mitigation'],
  resistance:['resistance','resistance management','resistance plan','change resistance'],
  engagement:['engagement','engagement proof','stakeholder engagement proof','engagement activities','engagement plan','engagement log','proof of engagement'],
  successcriteria:['success criteria','success measures','success metrics','success evaluation','success factors','key performance indicators','kpi','kpis','evaluation criteria','measurement plan','measures of success','measure of success'],
  reinforcement:['reinforcement','reinforcement plan','sustainability','sustainment','post-go-live support','post go-live support','post-go-live','hypercare','support model','go-live support','closeout','close out','close-out','closeout activities','post-go-live focus','focus group','focus groups','war room','cutover','cutover plan','post-training support','post training support'],
  trainingmeta:['training delivery','delivery strategy','training materials','training readiness','readiness requirements','training resources','training logistics','summary of new system','new system functionality'],
  journeymap:['journey map','journey mapping','user journey','customer journey','as-is process','to-be process','process map','process flow','swimlane'],
  overview:['executive summary','project overview','agenda','table of contents','project scope','level of effort','change management plan','organizational change management','purpose'],
  timeline:['project timeline','project schedule','milestone','milestones','project plan','implementation timeline','implementation schedule']
};
// Map categories to import targets — only overview/timeline/journeymap are skipped
const SECTION_TARGET_MAP={
  impact:'impact',gaps:'gaps',stakeholders:'stakeholders',
  training:'training',communications:'comms',craid:'craid',
  resistance:'craid',engagement:'engagement',
  successcriteria:'successcriteria',reinforcement:'reinforcement',
  trainingmeta:'skip',journeymap:'skip',overview:'skip',timeline:'skip'
};
// All valid import targets (for result structure)
const IMPORT_TARGETS=['impact','gaps','stakeholders','craid','training','comms','reinforcement','successcriteria','engagement'];

function classifySectionByTitle(title){
  if(!title)return null;
  const t=title.toLowerCase().trim();
  let bestCat=null,bestScore=0;
  for(const[cat,keywords] of Object.entries(SECTION_KEYWORDS)){
    for(const kw of keywords){
      const re=new RegExp('\\b'+kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b');
      if(re.test(t)){
        const score=kw.split(' ').length;
        if(score>bestScore){bestScore=score;bestCat=cat;}
      }
    }
  }
  return bestCat;
}
// Returns ALL matching categories for a title (for slides like "Impact Assessment & Gap Analysis")
function classifySectionByTitleMulti(title){
  if(!title)return[];
  const t=title.toLowerCase().trim();
  const found=new Set();
  for(const[cat,keywords] of Object.entries(SECTION_KEYWORDS)){
    for(const kw of keywords){
      const re=new RegExp('\\b'+kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b');
      if(re.test(t)){found.add(cat);break;}
    }
  }
  // Priority rules: prevent training from stealing sections meant for other targets
  if(found.has('training')&&found.has('trainingmeta'))found.delete('training');
  if(found.has('training')&&found.has('reinforcement'))found.delete('training');
  if(found.has('training')&&found.has('successcriteria'))found.delete('training');
  return[...found];
}

function classifySectionByHeaders(rows){
  if(!rows.length||!rows[0])return null;
  const headers=Object.keys(rows[0]);
  function countMatches(fields){
    let ct=0;
    headers.forEach(h=>{const m=fuzzyMatch(h,FIELD_ALIASES);if(m&&fields.includes(m))ct++;});
    return ct;
  }
  // Check all targets using TARGET_FIELDS, excluding 'name' (too generic to be discriminating)
  const scores={};
  for(const[t,fields] of Object.entries(TARGET_FIELDS)){
    scores[t]=countMatches(fields.filter(f=>f!=='name'&&f!=='description'&&f!=='text'));
  }
  let best=null,bestScore=0;
  for(const[t,s] of Object.entries(scores)){if(s>bestScore){best=t;bestScore=s;}}
  return bestScore>0?best:null;
}

function classifyDocumentSections(sections){
  const result={skipped:[]};
  IMPORT_TARGETS.forEach(t=>{result[t]=[];});
  sections.forEach(sec=>{
    // Try multi-target title classification (e.g. "Impact Assessment & Gap Analysis")
    const cats=classifySectionByTitleMulti(sec.title);
    const targets=cats.map(c=>SECTION_TARGET_MAP[c]).filter(t=>t&&t!=='skip');
    const uniqueTargets=[...new Set(targets)];
    const skipCats=cats.filter(c=>SECTION_TARGET_MAP[c]==='skip');

    if(sec.rows.length){
      // Structured rows: process for each matched target
      if(uniqueTargets.length>0){
        // Disambiguate: if stakeholders + another target both matched, use headers to decide
        // If headers don't match stakeholders, drop it (e.g. "Stakeholder Engagement Activities"
        // has engagement columns, not stakeholder matrix columns)
        let finalTargets=uniqueTargets;
        if(uniqueTargets.length>1&&uniqueTargets.includes('stakeholders')){
          const headerTarget=classifySectionByHeaders(sec.rows);
          if(headerTarget&&headerTarget!=='stakeholders'){
            finalTargets=uniqueTargets.filter(t=>t!=='stakeholders');
          }
        }
        // Disambiguate gaps vs craid: use headers to decide
        if(finalTargets.includes('gaps')&&finalTargets.includes('craid')){
          const headerTarget=classifySectionByHeaders(sec.rows);
          if(headerTarget==='craid'||Object.keys(sec.rows[0]||{}).some(h=>h.toLowerCase().includes('mitigation'))){
            finalTargets=finalTargets.filter(t=>t!=='gaps');
          }else if(headerTarget==='gaps'){
            finalTargets=finalTargets.filter(t=>t!=='craid');
          }
        }
        finalTargets.forEach(target=>{
          const mapped=mapImportRows(sec.rows,target);
          if(mapped.length){
            result[target].push(...mapped.map(r=>Object.assign(r,{_source:sec.source,_title:sec.title})));
          }
        });
      }else if(skipCats.length){
        result.skipped.push({title:sec.title,source:sec.source,rowCount:sec.rows.length,reason:skipCats[0]||'unrecognized'});
      }else{
        // No title match — try header-based classification
        const headerTarget=classifySectionByHeaders(sec.rows);
        const target=headerTarget||'impact';
        const mapped=mapImportRows(sec.rows,target);
        if(mapped.length){
          result[target].push(...mapped.map(r=>Object.assign(r,{_source:sec.source,_title:sec.title})));
        }
      }
    }else if(sec.bodyTexts&&sec.bodyTexts.length){
      // No structured rows — use body text
      let target=uniqueTargets.length?uniqueTargets[0]:null;
      if(!target&&skipCats.length){
        result.skipped.push({title:sec.title,source:sec.source,rowCount:sec.bodyTexts.length,reason:skipCats[0]||'unrecognized'});
        return;
      }
      if(!target){
        // Try to guess from body text content keywords
        const combined=sec.bodyTexts.join(' ').toLowerCase();
        for(const[c,kws] of Object.entries(SECTION_KEYWORDS)){
          if(kws.some(kw=>combined.includes(kw))){
            const t=SECTION_TARGET_MAP[c];
            if(t&&t!=='skip'){target=t;break;}
          }
        }
      }
      if(!target)return;
      // For multi-target text, process for each target
      const textTargets=uniqueTargets.length>1?uniqueTargets:[target];
      textTargets.forEach(tgt=>{
        // Sanity check: if routing to 'gaps' but the body is dominated by
        // name-shaped lines, it's almost certainly a stakeholder/roster slide
        // that matched 'gap' in the title (e.g. "Stakeholder Engagement Gaps").
        // Demote to skipped rather than pollute the gap list.
        if(tgt==='gaps'){
          const nameLike=sec.bodyTexts.filter(l=>/^[A-Z][a-z]+(?:\s+[A-Z][a-z'\u2019-]+){1,2}$/.test((l||'').trim())).length;
          const ratio=sec.bodyTexts.length?nameLike/sec.bodyTexts.length:0;
          if(ratio>0.4){
            result.skipped.push({title:sec.title,source:sec.source,rowCount:sec.bodyTexts.length,reason:'ambiguous (name-dominant body)'});
            return;
          }
        }
        const entries=_textLinesToEntries(sec.bodyTexts,tgt);
        if(entries.length){
          result[tgt].push(...entries.map(r=>Object.assign(r,{_selected:true,_source:sec.source,_title:sec.title})));
        }
      });
    }
  });
  // Post-process: detect agency header rows in stakeholders and assign agency to subsequent rows
  _assignAgenciesFromHeaders(result.stakeholders);
  // Post-process: filter noise entries (dates, bare numbers, etc.) from all targets
  _filterNoiseEntries(result);
  // Deduplicate entries within each target (same name/description).
  // Key selection is target-specific: for gaps/craid the meaningful content lives
  // in `description`/`text`, not `name` (which is a short topic label from table
  // rows like "Notices"). Using `name` first would let three rows with the same
  // long description but different short labels all survive.
  // Normalize aggressively: lowercase, collapse whitespace, strip leading/trailing
  // punctuation so "Work and Work activity: X" and "Work and Work activity: X " match.
  const keyFieldOrder={
    gaps:['description','text','name'],
    craid:['description','text','name'],
    impact:['name','description','text'],
    stakeholders:['name','description','text'],
    training:['text','name','description'],
    comms:['text','name','description'],
    reinforcement:['text','name','description'],
    successcriteria:['text','name','description'],
    engagement:['text','name','description']
  };
  function normalizeKey(s){
    return(s||'')
      .toLowerCase()
      .replace(/\s+/g,' ')
      .replace(/^[\s\W_]+|[\s\W_]+$/g,'')
      .trim();
  }
  IMPORT_TARGETS.forEach(t=>{
    const seen=new Set();
    const order=keyFieldOrder[t]||['name','description','text'];
    result[t]=result[t].filter(r=>{
      let key='';
      for(const f of order){if(r[f]){key=normalizeKey(r[f]);if(key)break;}}
      if(!key||key.length<4||seen.has(key))return false;
      seen.add(key);return true;
    });
  });
  return result;
}

// Detect agency header rows in stakeholder data and propagate agency to subsequent rows
// Agency headers are rows like "Key Stakeholders of Department of X (ABBR)" that have a name
// but no role, influence, or sentiment — they serve as group headers in the source table
function _assignAgenciesFromHeaders(stakeholders){
  if(!stakeholders.length)return;
  // Group by source slide so we only detect headers within the same slide
  const bySource={};
  stakeholders.forEach((sh,i)=>{const src=sh._source||'';if(!bySource[src])bySource[src]=[];bySource[src].push({sh,idx:i});});
  const headerIndices=new Set();
  Object.values(bySource).forEach(group=>{
    let currentAgency='';
    group.forEach(({sh,idx})=>{
      const name=(sh.name||'').trim();
      const hasRole=!!(sh.role||'').trim();
      const hasInfluence=!!(sh.influence||'').trim();
      const hasSentiment=!!(sh.sentiment||'').trim();
      // A header row: has a name that looks like an org/department label, but no individual-level fields
      const looksLikeHeader=!hasRole&&!hasInfluence&&!hasSentiment&&name.length>10&&(
        /\b(department|dept|office|agency|division|bureau|commission|authority|board|council|ministry)\b/i.test(name)||
        /\bkey\s+stakeholders?\s+(of|for|from|in)\b/i.test(name)||
        /\bstakeholders?\s+(of|for|from|in)\b/i.test(name)||
        /\([A-Z]{2,8}\)\s*$/.test(name) // ends with abbreviation like (DHCF)
      );
      if(looksLikeHeader){
        // Extract agency: prefer abbreviation in parens, else use full name
        const abbrMatch=name.match(/\(([A-Z]{2,8})\)\s*$/);
        currentAgency=abbrMatch?abbrMatch[1]:name.replace(/^key\s+stakeholders?\s+(of|for|from|in)\s+/i,'').trim();
        headerIndices.add(idx);
      }else if(currentAgency){
        sh.agency=currentAgency;
      }
    });
  });
  // Remove header rows (they're labels, not actual stakeholders)
  // Iterate in reverse so splice indices stay correct
  const sortedIndices=[...headerIndices].sort((a,b)=>b-a);
  sortedIndices.forEach(i=>stakeholders.splice(i,1));
}

// Filter out noise entries that got through table parsing
function _filterNoiseEntries(result){
  const noiseRe=[
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{2,4}$/i,
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /^\d{1,4}$/,
    /^page\s+\d+/i,
    /confidential/i,
    /^dc\s+government/i,
    /^(draft|final|version)\s*\d*/i,
    /^©/,
    /^for internal use only$/i,
    /^[\u200B\u200C\u200D\uFEFF\u00AD\s]*$/,  // zero-width spaces and soft hyphens only
  ];
  // Patterns for entries that are clearly just labels/headers, not data
  const labelPatterns=[
    /^\(.+\)$/,                          // "(Internal & External)" — parenthetical labels
  ];
  function isNoise(val){return noiseRe.some(re=>re.test(val.trim()));}
  function isLabel(val){return labelPatterns.some(re=>re.test(val.trim()));}
  // Check if a value looks like a person's name
  function isPersonName(val){
    const v=val.trim();
    // Title + name: "Mr. Smith", "Dr. Jane Doe"
    if(/^(mr|mrs|ms|dr|miss|prof)\.?\s+\w+/i.test(v)&&v.split(/\s+/).length<=4)return true;
    // Bare First Last or First Middle Last — 2–3 capitalized words, no trailing punctuation
    if(/^[A-Z][a-z]+(?:\s+[A-Z][a-z'\u2019-]+){1,2}$/.test(v))return true;
    return false;
  }
  // Check if a value is a label/heading stub rather than a gap description.
  // Real gap descriptions should have predicate structure (multiple words or
  // a colon/em-dash separator). Bare acronyms and single words are headings.
  function looksLikeLabelNotGap(val){
    const v=val.trim();
    if(/^[A-Z]{2,8}$/.test(v))return true;              // bare acronym
    if(v.length<4)return true;                          // too short to be a gap
    if(v.split(/\s+/).length<3&&!/[:\u2013\u2014\u2015\-]/.test(v))return true;
    return false;
  }
  // Impact: filter noise and entries with no meaningful content fields
  result.impact=result.impact.filter(r=>{
    const name=(r.name||'').trim();
    if(!name)return false;
    if(isNoise(name)||isLabel(name))return false;
    return true;
  });
  // Gaps: filter noise, person names, and heading stubs
  result.gaps=result.gaps.filter(r=>{
    const desc=(r.description||r.name||'').trim();
    if(!desc)return false;
    if(isNoise(desc)||isLabel(desc))return false;
    if(isPersonName(desc))return false;
    if(looksLikeLabelNotGap(desc))return false;
    return true;
  });
  // Stakeholders: filter noise, generic labels, section sub-headers, and scope descriptions
  const stakeholderNoiseRe=[
    /^(in\s+scope|out\s+of\s+scope|primary\s+audience|secondary\s+audience|key\s+audience|target\s+audience)$/i,
  ];
  result.stakeholders=result.stakeholders.filter(r=>{
    const name=(r.name||'').trim();
    if(!name)return false;
    if(isNoise(name)||isLabel(name))return false;
    if(stakeholderNoiseRe.some(re=>re.test(name)))return false;
    // Filter scope descriptions — sentences that describe training topics, not stakeholder groups.
    // Scope items typically end with a period and contain process/topic language, not role/group names.
    // Stakeholder names are short role titles (e.g. "DHS Service Center caseworkers") not full sentences.
    if(name.endsWith('.')&&name.length>25)return false;
    // Out-of-scope markers: "(managed separately...)" or similar parenthetical disclaimers
    if(/\(managed\s+separately/i.test(name))return false;
    // Scope/topic descriptions — not role/group names
    if(/\b(functionality|workflows?\s+for|navigation\s+and|interpretation\s+and|application\s+of)\b/i.test(name))return false;
    return true;
  });
  // All other targets: filter noise from primary text field
  ['craid','training','comms','reinforcement','successcriteria','engagement'].forEach(t=>{
    if(!result[t])return;
    result[t]=result[t].filter(r=>{
      const val=(r.name||r.text||r.description||'').trim();
      if(!val)return false;
      if(isNoise(val)||isLabel(val))return false;
      return true;
    });
  });
}

function _textLinesToEntries(lines,target){
  const meaningful=lines.map(l=>l.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g,'').trim()).filter(l=>l.length>3);
  if(!meaningful.length)return[];
  const entries=[];
  meaningful.forEach(line=>{
    const trimmed=line.replace(/^[\s•\-*►▪◦‣→\d.)]+/,'').trim();
    if(!trimmed)return;
    if(target==='impact'){
      const parts=trimmed.split(/\s*[:\u2013\u2014–—]\s*/,2);
      entries.push({name:parts[0],currentState:'',futureState:parts[1]||'',level:'Medium'});
    }else if(target==='gaps'){
      entries.push({description:trimmed,severity:'Medium',trainingImpact:'',status:'Open'});
    }else if(target==='stakeholders'){
      const parts=trimmed.split(/\s*[:\u2013\u2014–—]\s*/,2);
      entries.push({name:parts[0],role:parts[1]||'',agency:'',influence:'',sentiment:''});
    }else if(target==='craid'){
      entries.push({text:trimmed,type:'risk',severity:'Medium',status:'Open'});
    }else if(target==='training'){
      entries.push({text:trimmed});
    }else if(target==='comms'){
      entries.push({text:trimmed});
    }else if(target==='reinforcement'){
      entries.push({text:trimmed});
    }else if(target==='successcriteria'){
      entries.push({text:trimmed});
    }else if(target==='engagement'){
      entries.push({text:trimmed});
    }
  });
  return entries;
}

// For single-table files (CSV, single-sheet XLSX), classify into one target
function classifySingleTable(rows){
  if(!rows.length)return{target:'impact',rows:[],unmapped:[]};
  const target=classifySectionByHeaders(rows)||'impact';
  const mapped=mapImportRows(rows,target);
  const mappedHeaders=new Set();
  Object.keys(rows[0]).forEach(h=>{const m=fuzzyMatch(h,FIELD_ALIASES);if(m)mappedHeaders.add(h);});
  const unmapped=Object.keys(rows[0]).filter(h=>!mappedHeaders.has(h));
  return{target,rows:mapped,unmapped};
}

let _multiSectionData=null;

function renderMultiSectionPreview(container,result){
  _multiSectionData=result;
  const targetLabels={impact:'Impact Assessment',gaps:'Gap Analysis',stakeholders:'Stakeholder Groups',
    craid:'CRAID Log',training:'Training Plan',comms:'Communications',
    reinforcement:'Reinforcement / Post-Go-Live',successcriteria:'Success Criteria',engagement:'Engagement Proof'};
  const activeSections=IMPORT_TARGETS.filter(t=>result[t]&&result[t].length>0);
  const totalItems=activeSections.reduce((s,t)=>s+result[t].length,0);
  let html='<div class="import-preview">';
  // Summary header
  html+='<div class="import-classify-hd" style="flex-direction:column;align-items:flex-start;gap:6px">';
  html+='<strong style="font-size:14px">Document Analysis Complete</strong>';
  html+='<div style="display:flex;gap:12px;flex-wrap:wrap">';
  activeSections.forEach(t=>{
    html+=`<span class="import-section-badge import-section-${t}">${targetLabels[t]}: ${result[t].length} item${result[t].length!==1?'s':''}</span>`;
  });
  if(result.skipped.length){
    html+=`<span class="import-section-badge import-section-skip">${result.skipped.length} section${result.skipped.length!==1?'s':''} skipped</span>`;
  }
  html+='</div></div>';
  if(!activeSections.length){
    html+='<div class="import-status error">Could not classify any sections. Ensure your document contains recognizable change plan content.</div>';
    html+='</div>';
    container.innerHTML=html;
    return;
  }
  // Merge mode
  html+='<div class="import-merge-opts"><label><input type="radio" name="import-merge" value="append" checked> Append to existing</label><label><input type="radio" name="import-merge" value="replace"> Replace existing</label></div>';
  // Section tabs
  html+='<div class="import-sec-tabs">';
  activeSections.forEach((t,i)=>{
    html+=`<button class="import-sec-tab${i===0?' active':''}" data-target="${t}" onclick="switchImportSecTab('${t}')">${targetLabels[t]} (${result[t].length})</button>`;
  });
  html+='</div>';
  // Section panels
  activeSections.forEach((t,i)=>{
    const items=result[t];
    const cols=getPreviewColumns(t);
    html+=`<div class="import-sec-panel${i===0?' active':''}" id="import-sec-${t}">`;
    html+='<div style="overflow-x:auto"><table class="import-tbl"><thead><tr><th class="import-check"><input type="checkbox" checked onchange="toggleSmartSection(\''+t+'\',this.checked)"></th><th style="font-size:10px;color:var(--ink-60)">Source</th>';
    cols.forEach(c=>{html+='<th>'+c.label+'</th>';});
    html+='</tr></thead><tbody>';
    items.forEach((item,idx)=>{
      html+='<tr><td class="import-check"><input type="checkbox" '+(item._selected?'checked':'')+' onchange="toggleSmartRow(\''+t+'\','+idx+',this.checked)"></td>';
      html+='<td style="font-size:10px;color:var(--ink-60);white-space:nowrap">'+esc(item._source||'')+'</td>';
      cols.forEach(c=>{
        let val=item[c.key]||'';
        if(val.length>60)val=val.substring(0,60)+'…';
        html+='<td>'+esc(val)+'</td>';
      });
      html+='</tr>';
    });
    html+='</tbody></table></div></div>';
  });
  // Skipped sections info
  if(result.skipped.length){
    html+='<div class="import-skipped"><strong>Skipped sections:</strong> ';
    html+=result.skipped.map(s=>esc(s.title||s.source)+' ('+s.rowCount+' rows — '+s.reason+')').join(', ');
    html+='</div>';
  }
  // Actions
  html+='<div class="import-acts"><button class="btn-ghost" onclick="document.getElementById(\'doc-import-modal\').classList.remove(\'open\')">Cancel</button>';
  html+=`<button class="btn-gold" onclick="commitMultiSectionImport()">Import ${totalItems} Item${totalItems!==1?'s':''}</button></div></div>`;
  container.innerHTML=html;
}

function switchImportSecTab(target){
  document.querySelectorAll('.import-sec-tab').forEach(t=>t.classList.toggle('active',t.dataset.target===target));
  document.querySelectorAll('.import-sec-panel').forEach(p=>p.classList.toggle('active',p.id==='import-sec-'+target));
}
function toggleSmartSection(target,checked){
  if(_multiSectionData&&_multiSectionData[target])_multiSectionData[target].forEach(r=>r._selected=checked);
}
function toggleSmartRow(target,idx,checked){
  if(_multiSectionData&&_multiSectionData[target]&&_multiSectionData[target][idx])_multiSectionData[target][idx]._selected=checked;
}

function commitMultiSectionImport(){
  const p=getProj();if(!p)return;
  if(!_multiSectionData)return;
  const mergeMode=document.querySelector('input[name="import-merge"]:checked')?.value||'append';
  let totalImported=0;
  const breakdown=[];
  // Helper to get selected items for a target
  function sel(t){return(_multiSectionData[t]||[]).filter(r=>r._selected);}

  // ── Impact Assessment ──
  const impactItems=sel('impact');
  if(impactItems.length){
    if(!p.impactAssessment)p.impactAssessment={groups:[]};
    if(mergeMode==='replace')p.impactAssessment.groups=[];
    impactItems.forEach(item=>{
      const lvl=normalizeLevel(item.level);
      const ct=item.changeTypes?item.changeTypes.split(/[,;]/).map(s=>s.trim()).filter(s=>s):[];
      p.impactAssessment.groups.push({
        name:item.name||'Imported Group',level:lvl,
        changeTypes:ct.length?ct:['Process'],
        currentState:item.currentState||'',futureState:item.futureState||'',actions:[]
      });
    });
    totalImported+=impactItems.length;breakdown.push(impactItems.length+' impact');
  }

  // ── Gap Analysis ──
  const gapItems=sel('gaps');
  if(gapItems.length){
    if(!p.gapAnalysis)p.gapAnalysis={gaps:[]};
    if(mergeMode==='replace')p.gapAnalysis.gaps=[];
    gapItems.forEach(item=>{
      p.gapAnalysis.gaps.push({
        id:uid(),description:item.description||item.name||item.text||'',
        severity:normalizeSeverity(item.severity),
        trainingImpact:item.trainingImpact||'',status:item.status||''
      });
    });
    totalImported+=gapItems.length;breakdown.push(gapItems.length+' gap');
  }

  // ── Stakeholders ──
  const shItems=sel('stakeholders');
  if(shItems.length){
    if(mergeMode==='replace')p.stakeholders=[];
    // Group imported stakeholders by agency — OCM adoption scoring is done at the group/agency
    // level, not per individual. If multiple rows share the same agency, consolidate into one
    // group using the agency name, and store the individual names as role context.
    const byAgency={};
    shItems.forEach(item=>{
      const agency=(item.agency||'').trim();
      const name=(item.name||'').trim();
      if(agency){
        if(!byAgency[agency])byAgency[agency]={names:[],roles:new Set(),items:[]};
        byAgency[agency].names.push(name);
        if(item.role)byAgency[agency].roles.add(item.role);
        if(item.roleCategory)byAgency[agency].roles.add(item.roleCategory);
        byAgency[agency].items.push(item);
      }else{
        // No agency — treat each as its own group (could be role-based entries from DOCX)
        byAgency['_solo_'+name]={names:[name],roles:new Set(),items:[item],solo:true};
      }
    });
    let shCount=0;
    Object.entries(byAgency).forEach(([key,group])=>{
      const isSolo=group.solo||group.names.length===1;
      const groupName=isSolo?group.names[0]:key;
      const roleCategory=isSolo?(group.items[0].roleCategory||''):Array.from(group.roles).join(', ');
      // For multi-person groups, store individual names in preconceptions-free notes
      const stakeholderType=group.items[0].stakeholderType||'end_user_group';
      const newSH={
        id:uid(),name:groupName,
        agency:isSolo?(group.items[0].agency||''):key,
        stakeholderType,roleCategory,
        factors:{resistance:3,env:3,window:3,complexity:3,saturation:3,leadership:3},
        objectives:[],kirk:{L1:{},L2:{},L3:{},L4:{}},
        rein:{owner:'',activities:'',intervals:[],escalation:''},
        trust:3,trustHistory:[],preconceptions:[],touchpoints:[],
        anxietyIndicators:{whatDoesThisMeanFreq:0,extraReviewCycles:0,escalations:0,attendanceDrop:false}
      };
      // If consolidating multiple people, show distinct roles and store member names
      if(!isSolo&&group.names.length>1){
        // Collect distinct functional roles/titles from items (role, needs, influence fields)
        const distinctRoles=Array.from(group.roles).filter(r=>r&&r.trim());
        // Also collect any unique names that look like role titles (not person names)
        const nameBasedRoles=[...new Set(group.items.map(it=>(it.roleCategory||'').trim()).filter(Boolean))];
        const allRoles=[...new Set([...distinctRoles,...nameBasedRoles])];
        newSH.roleCategory=allRoles.length?allRoles.join(', '):'';
        // Store individual member names for reference
        newSH.members=group.names.filter(n=>n.trim());
      }
      p.stakeholders.push(newSH);
      shCount++;
    });
    totalImported+=shCount;breakdown.push(shCount+' stakeholder');
  }

  // ── CRAID Log (risks, issues, change requests, resistance items) ──
  const craidItems=sel('craid');
  if(craidItems.length){
    if(!p.craid)p.craid=[];
    if(mergeMode==='replace')p.craid=[];
    craidItems.forEach(item=>{
      p.craid.push({
        id:uid(),
        type:item.type||'risk',
        title:item.name||item.text||'',
        description:item.description||item.text||'',
        severity:normalizeSeverity(item.severity)||'Medium',
        status:item.status||'Open',
        owner:item.owner||'',dueDate:item.dueDate||'',
        probability:item.probability||'',impact:item.impact||'',mitigation:item.mitigation||''
      });
    });
    totalImported+=craidItems.length;breakdown.push(craidItems.length+' CRAID');
  }

  // ── Training Plan → Stakeholder Learning Objectives ──
  const trainingItems=sel('training');
  if(trainingItems.length){
    // Add training items as learning objectives to all stakeholders
    const objTexts=trainingItems.map(item=>item.name||item.text||item.description||'').filter(t=>t);
    if(p.stakeholders.length){
      p.stakeholders.forEach(sh=>{
        if(!sh.objectives)sh.objectives=[];
        objTexts.forEach(obj=>{
          if(!sh.objectives.includes(obj))sh.objectives.push(obj);
        });
      });
    }else{
      // No stakeholders yet — create a general one to hold the training data
      p.stakeholders.push({
        id:uid(),name:'All End Users',agency:'',stakeholderType:'end_user_group',roleCategory:'',
        factors:{resistance:3,env:3,window:3,complexity:3,saturation:3,leadership:3},
        objectives:objTexts,kirk:{L1:{},L2:{},L3:{},L4:{}},
        rein:{owner:'',activities:'',intervals:[],escalation:''},
        trust:3,trustHistory:[],preconceptions:[],touchpoints:[],
        anxietyIndicators:{whatDoesThisMeanFreq:0,extraReviewCycles:0,escalations:0,attendanceDrop:false}
      });
    }
    totalImported+=trainingItems.length;breakdown.push(trainingItems.length+' training');
  }

  // ── Communications Plan → Stakeholder Touchpoints ──
  const commsItems=sel('comms');
  if(commsItems.length&&p.stakeholders.length){
    const today=new Date().toISOString().slice(0,10);
    p.stakeholders.forEach(sh=>{
      if(!sh.touchpoints)sh.touchpoints=[];
    });
    commsItems.forEach(item=>{
      const desc=item.name||item.text||item.description||'';
      const audience=(item.audience||'').toLowerCase();
      // Try to match to specific stakeholders by audience, else add to all
      let matched=false;
      if(audience){
        p.stakeholders.forEach(sh=>{
          if(sh.name.toLowerCase().includes(audience)||audience.includes(sh.name.toLowerCase())){
            sh.touchpoints.push({date:item.timing||today,type:'Communication',description:desc,trustImpact:'neutral'});
            matched=true;
          }
        });
      }
      if(!matched){
        // Add to first stakeholder as a general comms record
        p.stakeholders[0].touchpoints.push({date:item.timing||today,type:'Communication',description:desc,trustImpact:'neutral'});
      }
    });
    totalImported+=commsItems.length;breakdown.push(commsItems.length+' comms');
  }

  // ── Reinforcement / Post-Go-Live → Stakeholder Reinforcement Plans ──
  const reinItems=sel('reinforcement');
  if(reinItems.length){
    const reinText=reinItems.map(item=>item.name||item.text||item.description||'').filter(t=>t).join('\n• ');
    if(p.stakeholders.length){
      p.stakeholders.forEach(sh=>{
        if(!sh.rein)sh.rein={owner:'',activities:'',intervals:[],escalation:''};
        sh.rein.activities=sh.rein.activities?(sh.rein.activities+'\n• '+reinText):('• '+reinText);
      });
    }
    totalImported+=reinItems.length;breakdown.push(reinItems.length+' reinforcement');
  }

  // ── Success Criteria → Value Case ──
  // Cap to 3 — the Value Case section is meant to track a small set of
  // meaningful outcomes, not every bullet point in the source document.
  const scItems=sel('successcriteria').slice(0,3);
  if(scItems.length){
    if(!p.valueCase)p.valueCase={statement:'',requestor:'',impactLevel:'',successCriteria:[],unintendedConsequences:''};
    if(mergeMode==='replace')p.valueCase.successCriteria=[];
    scItems.forEach(item=>{
      p.valueCase.successCriteria.push({
        id:uid(),
        criterion:item.name||item.text||item.description||'',
        metStatus:null,
        actualOutcome:'',
        notes:''
      });
    });
    p.valueCase._scSeeded=true;
    totalImported+=scItems.length;breakdown.push(scItems.length+' success criteria');
  }

  // ── Engagement Proof → Stakeholder Touchpoints ──
  const engItems=sel('engagement');
  if(engItems.length&&p.stakeholders.length){
    const today=new Date().toISOString().slice(0,10);
    p.stakeholders.forEach(sh=>{
      if(!sh.touchpoints)sh.touchpoints=[];
    });
    engItems.forEach(item=>{
      const desc=item.name||item.text||item.description||'';
      // Add engagement proof to first stakeholder or try to match
      p.stakeholders[0].touchpoints.push({
        date:item.date||today,type:'Engagement',description:desc,trustImpact:'positive'
      });
    });
    totalImported+=engItems.length;breakdown.push(engItems.length+' engagement');
  }

  // Re-render all affected sections
  if(impactItems.length)renderPImpact();
  if(gapItems.length)renderPGaps();
  if(shItems.length||trainingItems.length||commsItems.length||reinItems.length||engItems.length){renderPSH();renderPKPIs();}
  if(craidItems.length&&typeof renderPCraid==='function')renderPCraid();
  if(scItems.length&&typeof renderPOverview==='function')renderPOverview();
  touch('proj');schedSave();
  const statusArea=document.getElementById('import-status-area');
  if(statusArea)statusArea.innerHTML='<div class="import-status success">Imported '+totalImported+' items ('+breakdown.join(', ')+')!</div>';
  setTimeout(()=>{
    const modal=document.getElementById('doc-import-modal');
    if(modal)modal.classList.remove('open');
  },1500);
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
    }else if(ext==='pdf'){
      const data=await file.arrayBuffer();
      rows=await parsePDF(data);
    }else if(ext==='pptx'){
      const data=await file.arrayBuffer();
      rows=await parsePPTX(data);
    }else if(ext==='txt'){
      const text=await file.text();
      rows=parseTXT(text);
    }else{
      statusArea.innerHTML='<div class="import-status error">Unsupported file format. Please use .xlsx, .csv, .docx, .pdf, .pptx, or .txt</div>';
      return;
    }
    if(!rows.length){
      statusArea.innerHTML='<div class="import-status error">No data found in file. Ensure your document contains a table or structured data.</div>';
      return;
    }
    // Smart mode: auto-classify; standard mode: map to target
    if(_smartImportMode){
      // Check if parsers returned multi-section data (array of {title,rows,...})
      const isMultiSection=Array.isArray(rows)&&rows.length>0&&rows[0].title!==undefined&&rows[0].rows!==undefined;
      if(isMultiSection){
        const result=classifyDocumentSections(rows);
        const total=IMPORT_TARGETS.reduce((s,t)=>s+(result[t]?result[t].length:0),0);
        if(!total){
          statusArea.innerHTML='<div class="import-status error">Could not classify document sections. Ensure your document contains recognizable change plan content.</div>';
          return;
        }
        statusArea.innerHTML='';
        renderMultiSectionPreview(previewArea,result);
      }else{
        // Single table (CSV, single-sheet XLSX) — classify as one section
        const classified=classifySingleTable(rows);
        if(!classified.rows.length){
          statusArea.innerHTML='<div class="import-status error">Could not map document structure. Ensure your file has recognizable column headers.</div>';
          return;
        }
        // Wrap as multi-section for consistent UI
        const result={impact:[],gaps:[],stakeholders:[],skipped:[]};
        result[classified.target]=classified.rows;
        statusArea.innerHTML='';
        renderMultiSectionPreview(previewArea,result);
      }
    }else{
      _importParsed=mapImportRows(rows,_importTarget);
      if(!_importParsed.length){
        statusArea.innerHTML='<div class="import-status error">Could not map document structure to '+_importTarget+' fields. Ensure your file has recognizable column headers.</div>';
        return;
      }
      statusArea.innerHTML='';
      renderImportPreview(previewArea,_importParsed,_importTarget);
    }
  }catch(err){
    console.error('Import parse error:',err);
    statusArea.innerHTML='<div class="import-status error">Error parsing file: '+esc(err.message)+'</div>';
  }
}

function parseCSV(text){
  // RFC 4180 compliant: handles embedded newlines, escaped quotes ("")
  const rows=[];let row=[];let cell='';let inQ=false;let i=0;
  while(i<text.length){
    const c=text[i];
    if(inQ){
      if(c==='"'&&text[i+1]==='"'){cell+='"';i+=2;continue;}
      if(c==='"'){inQ=false;i++;continue;}
      cell+=c;i++;
    }else{
      if(c==='"'&&cell===''){inQ=true;i++;continue;}
      if(c===','){row.push(cell.trim());cell='';i++;continue;}
      if(c==='\r'&&text[i+1]==='\n'){row.push(cell.trim());if(row.some(v=>v))rows.push(row);row=[];cell='';i+=2;continue;}
      if(c==='\n'||c==='\r'){row.push(cell.trim());if(row.some(v=>v))rows.push(row);row=[];cell='';i++;continue;}
      cell+=c;i++;
    }
  }
  row.push(cell.trim());if(row.some(v=>v))rows.push(row);
  if(rows.length<2)return[];
  const headers=rows[0];
  return rows.slice(1).map(r=>{
    const obj={};
    headers.forEach((h,j)=>{obj[h]=r[j]||'';});
    return obj;
  }).filter(obj=>Object.values(obj).some(v=>v));
}

function parseXLSX(data){
  if(!window.XLSX){showSuccess('Excel parser is loading. Try again in a moment.');return[];}
  const wb=XLSX.read(data,{type:'array'});
  if(!_smartImportMode||wb.SheetNames.length===1){
    const ws=wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws,{defval:''});
  }
  // Smart mode: each sheet is a section
  return wb.SheetNames.map((name,i)=>{
    const ws=wb.Sheets[name];
    const rows=XLSX.utils.sheet_to_json(ws,{defval:''});
    return{title:name,slideNum:i+1,rows,bodyTexts:[],source:'Sheet: '+name};
  }).filter(s=>s.rows.length>0);
}

async function parseDOCX(data){
  if(!window.mammoth){showSuccess('Document parser is loading. Try again in a moment.');return[];}
  const result=await mammoth.convertToHtml({arrayBuffer:data});
  const html=result.value;
  const div=document.createElement('div');
  div.innerHTML=html;
  if(!_smartImportMode) return _parseDOCXFlat(div);
  // Smart mode: extract sections by heading
  const sections=[];
  let currentTitle='';let currentBody=[];let secIdx=0;
  function flushSection(){
    if(!currentBody.length&&!currentTitle)return;
    // Check for tables in the accumulated body nodes
    const wrap=document.createElement('div');
    currentBody.forEach(n=>wrap.appendChild(n.cloneNode(true)));
    const tables=wrap.querySelectorAll('table');
    let rows=[];
    if(tables.length){
      tables.forEach(tbl=>{
        const thRow=tbl.querySelector('tr');if(!thRow)return;
        const headers=Array.from(thRow.querySelectorAll('th,td')).map(c=>c.textContent.trim());
        tbl.querySelectorAll('tr').forEach((tr,i)=>{
          if(i===0)return;
          const cells=Array.from(tr.querySelectorAll('td')).map(c=>c.textContent.trim());
          const obj={};
          headers.forEach((h,j)=>{obj[h]=cells[j]||'';});
          if(Object.values(obj).some(v=>v))rows.push(obj);
        });
      });
    }
    // Also extract text lines for text-based parsing
    const bodyTexts=[];
    wrap.querySelectorAll('p,li').forEach(el=>{
      if(el.closest('table'))return;
      const t=el.textContent.trim();if(t)bodyTexts.push(t);
    });
    if(!rows.length&&bodyTexts.length)rows=_parseSlideText(bodyTexts);
    if(rows.length||bodyTexts.length){
      secIdx++;
      sections.push({title:currentTitle,slideNum:secIdx,rows,bodyTexts,source:'Section '+(secIdx)});
    }
    currentTitle='';currentBody=[];
  }
  // Walk child nodes, split on headings (also detect bold numbered paragraphs
  // common in OCM documents that don't use Word heading styles)
  Array.from(div.children).forEach(node=>{
    const isHeading=/^H[1-4]$/i.test(node.tagName);
    const isBoldNumbered=node.tagName==='P'&&node.querySelector('strong')&&
      /^\d+\.\s/.test(node.textContent.trim())&&
      node.textContent.trim()===node.querySelector('strong')?.textContent.trim();
    if(isHeading||isBoldNumbered){
      flushSection();
      currentTitle=node.textContent.trim().replace(/^\d+\.\s*/,'');
    }else{
      currentBody.push(node);
    }
  });
  flushSection();
  if(sections.length)return sections;
  // Fallback: if no headings found, treat whole doc as one section
  return _parseDOCXFlat(div);
}
function _parseDOCXFlat(div){
  const tables=div.querySelectorAll('table');
  if(tables.length){
    const tbl=tables[0];const thRow=tbl.querySelector('tr');if(!thRow)return[];
    const headers=Array.from(thRow.querySelectorAll('th,td')).map(c=>c.textContent.trim());
    const rows=[];
    tbl.querySelectorAll('tr').forEach((tr,i)=>{
      if(i===0)return;
      const cells=Array.from(tr.querySelectorAll('td')).map(c=>c.textContent.trim());
      const obj={};headers.forEach((h,j)=>{obj[h]=cells[j]||'';});
      if(Object.values(obj).some(v=>v))rows.push(obj);
    });
    return rows;
  }
  const textLines=div.textContent.split(/\n/).filter(l=>l.trim());
  return parseTXT(textLines.join('\n'));
}

async function parsePDF(data){
  if(!window.pdfjsLib){showSuccess('PDF parser is loading. Try again in a moment.');return[];}
  const pdf=await pdfjsLib.getDocument({data}).promise;
  // Smart mode: extract by headings (using font size) → sections
  if(_smartImportMode){
    return _parsePDFSections(pdf);
  }
  // For complex PDFs (multi-page tables, change plans), browser-based extraction
  // struggles with table detection. Extract text and try structured parsing.
  let fullText='';
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    const vp=page.getViewport({scale:1});
    // Sort items by position to reconstruct reading order
    const items=content.items.filter(it=>it.str.trim()).map(it=>({
      text:it.str,x:Math.round(it.transform[4]),y:Math.round(vp.height-it.transform[5])
    })).sort((a,b)=>a.y-b.y||a.x-b.x);
    let lastY=null;let line='';
    items.forEach(item=>{
      if(lastY!==null&&Math.abs(item.y-lastY)>5){fullText+=line+'\n';line='';}
      line+=(line?'\t':'')+item.text;
      lastY=item.y;
    });
    if(line)fullText+=line+'\n';
  }
  // Try to parse as tab-delimited or structured text
  const rows=parseTXT(fullText);
  if(rows.length<2){
    // PDF tables are too complex for browser extraction
    // Show guidance to use the converter tool
    const statusArea=document.getElementById('import-status-area');
    if(statusArea){
      statusArea.innerHTML='<div class="import-status error" style="line-height:1.6">'
        +'<strong>This PDF has complex tables that need server-side extraction.</strong><br>'
        +'Run this command in your terminal first:<br>'
        +'<code style="display:block;margin:8px 0;padding:8px;background:rgba(0,0,0,0.15);border-radius:4px;font-size:12px">'
        +'python3 tools/pdf-to-csv.py "path/to/your-file.pdf"</code>'
        +'Then import the generated CSV files instead.</div>';
    }
    return[];
  }
  return rows;
}

// Smart-mode PDF: extract sections by detecting headings via font-size.
// Groups text items into lines, determines the body-text font size,
// and treats anything notably larger as a section heading. Lines between
// headings become bodyTexts for that section.
async function _parsePDFSections(pdf){
  // Collect lines from every page with their font size.
  const allLines=[];  // {text, size, page}
  for(let pi=1;pi<=pdf.numPages;pi++){
    const page=await pdf.getPage(pi);
    const content=await page.getTextContent();
    const vp=page.getViewport({scale:1});
    // Each item: position + font height (transform[3] is Y scale ≈ font size)
    const items=content.items.filter(it=>it.str.trim()).map(it=>({
      text:it.str,
      x:Math.round(it.transform[4]),
      y:Math.round(vp.height-it.transform[5]),
      size:Math.round(Math.abs(it.transform[3]||it.transform[0]||10))
    })).sort((a,b)=>a.y-b.y||a.x-b.x);
    // Group items into visual lines by Y-position proximity
    let lastY=null;let lineText='';let lineMaxSize=0;
    items.forEach(it=>{
      if(lastY!==null&&Math.abs(it.y-lastY)>5){
        if(lineText.trim())allLines.push({text:lineText.trim(),size:lineMaxSize,page:pi});
        lineText='';lineMaxSize=0;
      }
      lineText+=(lineText?' ':'')+it.text;
      if(it.size>lineMaxSize)lineMaxSize=it.size;
      lastY=it.y;
    });
    if(lineText.trim())allLines.push({text:lineText.trim(),size:lineMaxSize,page:pi});
  }
  if(!allLines.length)return[];
  // Determine body-text size: the most common font size across all lines.
  const sizeCount={};
  allLines.forEach(l=>{sizeCount[l.size]=(sizeCount[l.size]||0)+1;});
  let bodySize=0,bodyCount=0;
  Object.entries(sizeCount).forEach(([s,c])=>{if(c>bodyCount){bodySize=+s;bodyCount=c;}});
  // Heading threshold: 20% larger than body (rounded). Also require the line
  // to be reasonably short — long paragraphs in a heading font are unusual.
  const headingThreshold=Math.max(bodySize+1,Math.ceil(bodySize*1.2));
  function isHeading(l){
    if(l.size<headingThreshold)return false;
    if(l.text.length>120)return false;
    return true;
  }
  // Split into sections on heading lines.
  const sections=[];
  let currentTitle='';let currentBody=[];let currentPage=1;let secIdx=0;
  function flushSection(){
    if(!currentBody.length&&!currentTitle)return;
    // Filter trivially noisy lines (page numbers, dates, confidentiality)
    const body=_filterSlideNoise(currentBody.map(l=>l.text),currentTitle);
    if(body.length||currentTitle){
      secIdx++;
      sections.push({title:currentTitle,slideNum:secIdx,rows:[],bodyTexts:body,source:'Page '+currentPage});
    }
    currentTitle='';currentBody=[];
  }
  allLines.forEach(l=>{
    if(isHeading(l)){
      flushSection();
      currentTitle=l.text;
      currentPage=l.page;
    }else{
      if(!currentBody.length)currentPage=l.page;
      currentBody.push(l);
    }
  });
  flushSection();
  // Fallback: if no headings detected at all, treat each page as one section.
  if(!sections.length||sections.length===1&&!sections[0].title){
    const byPage={};
    allLines.forEach(l=>{if(!byPage[l.page])byPage[l.page]=[];byPage[l.page].push(l.text);});
    return Object.entries(byPage).map(([p,lines],i)=>({
      title:'Page '+p,slideNum:i+1,rows:[],
      bodyTexts:_filterSlideNoise(lines,''),source:'Page '+p
    }));
  }
  return sections;
}

async function parsePPTX(data){
  if(!window.JSZip){showSuccess('Presentation parser is loading. Try again in a moment.');return[];}
  const zip=await JSZip.loadAsync(data);
  const slideFiles=Object.keys(zip.files).filter(f=>f.match(/^ppt\/slides\/slide\d+\.xml$/)).sort((a,b)=>parseInt(a.match(/slide(\d+)/)[1])-parseInt(b.match(/slide(\d+)/)[1]));
  // If not in smart mode, use legacy flat parsing
  if(!_smartImportMode) return _parsePPTXFlat(zip,slideFiles);
  // Smart mode: extract slide-by-slide sections
  const sections=[];
  for(let si=0;si<slideFiles.length;si++){
    const sf=slideFiles[si];
    const xml=await zip.files[sf].async('text');
    const parser=new DOMParser();
    const doc=parser.parseFromString(xml,'application/xml');
    const ns='http://schemas.openxmlformats.org/drawingml/2006/main';
    // Get slide title from title placeholder or first large text
    let title='';
    const spNodes=doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main','sp');
    for(const sp of Array.from(spNodes)){
      const nvPr=sp.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main','nvSpPr')[0];
      const ph=nvPr?.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main','ph')[0];
      const phType=ph?.getAttribute('type')||'';
      if(phType==='title'||phType==='ctrTitle'){
        const tNodes=sp.getElementsByTagNameNS(ns,'t');
        title=Array.from(tNodes).map(t=>t.textContent.trim()).join(' ');
        break;
      }
    }
    // If no title placeholder found, use first text block
    if(!title){
      const allT=doc.getElementsByTagNameNS(ns,'t');
      if(allT.length)title=allT[0].textContent.trim();
    }
    // Extract tables
    const tblNodes=doc.getElementsByTagNameNS(ns,'tbl');
    let rows=[];
    const singleRowTexts=[];
    if(tblNodes.length){
      Array.from(tblNodes).forEach(tbl=>{
        const trNodes=tbl.getElementsByTagNameNS(ns,'tr');
        const tblRows=[];
        Array.from(trNodes).forEach(tr=>{
          // Get cell text — each cell may have multiple <a:t> nodes
          const tcNodes=tr.getElementsByTagNameNS(ns,'tc');
          const cellTexts=Array.from(tcNodes).map(tc=>{
            const tNodes=tc.getElementsByTagNameNS(ns,'t');
            return Array.from(tNodes).map(t=>t.textContent.trim()).join(' ');
          });
          tblRows.push(cellTexts);
        });
        if(tblRows.length>=2){
          const headers=tblRows[0];
          tblRows.slice(1).forEach(r=>{
            const obj={};
            headers.forEach((h,i)=>{obj[h]=r[i]||'';});
            if(Object.values(obj).some(v=>v))rows.push(obj);
          });
        }else if(tblRows.length===1){
          // Single-row table (e.g. KPI metrics) — capture as body text
          const line=tblRows[0].filter(c=>c.trim()).join(' — ');
          if(line.trim())singleRowTexts.push(line.trim());
        }
      });
    }
    // Extract body text from ALL shapes (sp, graphicFrame, etc.)
    let bodyTexts=[];
    const pNS='http://schemas.openxmlformats.org/presentationml/2006/main';
    // Collect shapes to exclude: titles, footers, slide numbers, dates
    const skipShapes=new Set();
    const skipTypes=new Set(['title','ctrTitle','ftr','sldNum','dt','hdr']);
    for(const sp of Array.from(spNodes)){
      const nvPr=sp.getElementsByTagNameNS(pNS,'nvSpPr')[0];
      const ph=nvPr?.getElementsByTagNameNS(pNS,'ph')[0];
      const phType=ph?.getAttribute('type')||'';
      if(skipTypes.has(phType))skipShapes.add(sp);
    }
    // Get all shapes including sp and any other containers
    const allShapes=[...Array.from(spNodes),...Array.from(doc.getElementsByTagNameNS(pNS,'graphicFrame')||[])];
    for(const shape of allShapes){
      if(skipShapes.has(shape))continue;
      // Skip if contains a table
      if(shape.getElementsByTagNameNS(ns,'tbl').length)continue;
      const pNodes=shape.getElementsByTagNameNS(ns,'p');
      Array.from(pNodes).forEach(p=>{
        const line=Array.from(p.getElementsByTagNameNS(ns,'t')).map(t=>t.textContent.trim()).join(' ');
        if(line.trim())bodyTexts.push(line.trim());
      });
    }
    // Fallback: if no body text from shapes, grab all non-title text from the slide
    if(!bodyTexts.length&&!rows.length){
      const allParagraphs=doc.getElementsByTagNameNS(ns,'p');
      const titleText=title.toLowerCase();
      Array.from(allParagraphs).forEach(p=>{
        // Skip paragraphs inside tables
        if(p.closest&&p.closest('tbl'))return;
        let parent=p.parentNode;
        while(parent){if(parent.localName==='tbl')return;parent=parent.parentNode;}
        const line=Array.from(p.getElementsByTagNameNS(ns,'t')).map(t=>t.textContent.trim()).join(' ');
        if(line.trim()&&line.trim().toLowerCase()!==titleText)bodyTexts.push(line.trim());
      });
    }
    // Merge single-row table text into body texts
    if(singleRowTexts.length)bodyTexts.push(...singleRowTexts);
    // Filter noise from body text
    bodyTexts=_filterSlideNoise(bodyTexts,title);
    // If no table rows, try parsing body text as structured data
    if(!rows.length&&bodyTexts.length){
      rows=_parseSlideText(bodyTexts);
    }
    if(rows.length||bodyTexts.length){
      sections.push({title,slideNum:si+1,rows,bodyTexts,source:'Slide '+(si+1)});
    }
  }
  // Return sections for smart classification
  return sections;
}
// Filter common PPTX noise: footers, page numbers, confidentiality notices, dates
function _filterSlideNoise(lines,title){
  const noisePatterns=[
    /^\|?\s*\d+\s*\|?$/,                    // page numbers like "| 41" or "3"
    /^page\s+\d+/i,                          // "Page 3"
    /confidential/i,                         // confidentiality notices
    /for internal use only/i,
    /privileged/i,
    /do not distribute/i,
    /proprietary/i,
    /all rights reserved/i,
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,  // dates like 01/15/2026
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{4}$/i, // "Jun 01, 2026"
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /^\d+$/,                                 // bare numbers
    /^dc\s+government/i,                     // government headers
    /^(draft|final|version)\s*\d*/i,         // document status labels
    /^©/,                                    // copyright
  ];
  const titleLower=(title||'').toLowerCase();
  return lines.filter(line=>{
    const t=line.trim();
    if(t.length<3)return false;               // too short to be meaningful
    if(t.toLowerCase()===titleLower)return false; // duplicate of title
    return!noisePatterns.some(p=>p.test(t));
  });
}

// Parse slide body text into structured rows
function _parseSlideText(lines){
  const rows=[];
  // Try key:value pairs (bullet points like "Name: John Smith")
  let current={};let kvCount=0;
  lines.forEach(line=>{
    const kv=line.match(/^[\s•\-*►▪◦‣→]*(.+?):\s*(.+)/);
    if(kv){
      current[kv[1].trim()]=kv[2].trim();kvCount++;
    }else if(Object.keys(current).length>0){
      rows.push(current);current={};
    }
  });
  if(Object.keys(current).length>0)rows.push(current);
  if(rows.length)return rows;
  // Try comma/tab delimited
  if(lines.length>=2){
    const delim=lines[0].includes('\t')?'\t':lines[0].includes(',')?',':null;
    if(delim){
      const headers=lines[0].split(delim).map(h=>h.trim());
      lines.slice(1).forEach(l=>{
        const vals=l.split(delim);
        const obj={};
        headers.forEach((h,i)=>{obj[h]=vals[i]?.trim()||'';});
        if(Object.values(obj).some(v=>v))rows.push(obj);
      });
      if(rows.length)return rows;
    }
  }
  // No structured format found — return empty, let classifyDocumentSections
  // handle the bodyTexts directly via _textLinesToEntries
  return[];
}
// Legacy flat PPTX parsing for non-smart imports
async function _parsePPTXFlat(zip,slideFiles){
  const ns='http://schemas.openxmlformats.org/drawingml/2006/main';
  let allText='';
  for(const sf of slideFiles){
    const xml=await zip.files[sf].async('text');
    const parser=new DOMParser();
    const doc=parser.parseFromString(xml,'application/xml');
    const textNodes=doc.getElementsByTagNameNS(ns,'t');
    const slideTexts=[];
    Array.from(textNodes).forEach(n=>{if(n.textContent.trim())slideTexts.push(n.textContent.trim());});
    allText+=slideTexts.join('\n')+'\n';
  }
  for(const sf of slideFiles){
    const xml=await zip.files[sf].async('text');
    const parser=new DOMParser();
    const doc=parser.parseFromString(xml,'application/xml');
    const tblNodes=doc.getElementsByTagNameNS(ns,'tbl');
    if(tblNodes.length){
      const rows=[];
      Array.from(tblNodes).forEach(tbl=>{
        const trNodes=tbl.getElementsByTagNameNS(ns,'tr');
        Array.from(trNodes).forEach(tr=>{
          const cells=tr.getElementsByTagNameNS(ns,'t');
          const row=Array.from(cells).map(c=>c.textContent.trim());
          rows.push(row);
        });
      });
      if(rows.length>=2){
        const headers=rows[0];
        return rows.slice(1).map(r=>{
          const obj={};
          headers.forEach((h,i)=>{obj[h]=r[i]||'';});
          return obj;
        }).filter(obj=>Object.values(obj).some(v=>v));
      }
    }
  }
  return parseTXT(allText);
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
  name:['name','group','stakeholder','audience','team','department','population','group name','stakeholder group','stakeholder name','topic description','topic','change/ topic description','change/topic description','change/ topic','ocm activities','ocm activity'],
  level:['level','impact','impact level','severity','priority','impact rating'],
  currentState:['current','current state','as-is','as is','current process','from','users impact','user impact','impact on users','impact to users'],
  futureState:['future','future state','to-be','to be','target state','to','desired state','system impact','impact on system','system change','system changes'],
  changeTypes:['change type','change types','type','types','impact type','impact area','area'],
  // Gap fields
  description:['description','gap','gap description','issue','finding','detail','details','gap detail','identified gaps','identified gap','objective'],
  severity:['severity','priority','level','risk','rating','criticality','risk level'],
  trainingImpact:['training','training impact','impact','adoption impact','recommendation','mitigation','remediation','system impact'],
  status:['status','state','progress','resolution'],
  // Stakeholder fields (for adoption scoring)
  role:['role','title','position','job title','function','interests'],
  influence:['influence','power','authority'],
  sentiment:['sentiment','attitude','disposition','readiness'],
  needs:['needs','expectations','requirements'],
  agency:['agency','organization','org','department','dept','division'],
  stakeholderType:['stakeholder type','type','category','classification'],
  roleCategory:['role category','role type','job category','job family'],
  // CRAID fields
  mitigation:['mitigation','mitigation strategy','mitigation plan','response','action','corrective action'],
  probability:['probability','likelihood','chance'],
  impact:['impact','business impact','impact description'],
  // Training/Comms/Reinforcement/SuccessCriteria/Engagement fields
  text:['text','content','activity','item','task','action item','deliverable'],
  audience:['audience','target','target audience','recipients','who','group'],
  method:['method','approach','measurement','how','evaluation method'],
  channel:['channel','medium','vehicle','format'],
  timing:['timing','when','timeline','due date','target date'],
  date:['date','event date','activity date','schedule'],
  owner:['owner','responsible','assigned to','lead','poc','responsible party'],
  frequency:['frequency','cadence','interval','how often'],
  metric:['metric','measure','kpi','indicator','success measure'],
  target:['target','goal','threshold','benchmark','target value'],
  outcome:['outcome','result','finding','observation']
};

function fuzzyMatch(header,fieldAliases){
  const h=header.toLowerCase().trim();
  // Pass 1: exact match (highest priority)
  for(const[field,aliases] of Object.entries(fieldAliases)){
    if(aliases.some(a=>h===a))return field;
  }
  // Pass 2: word-boundary match
  for(const[field,aliases] of Object.entries(fieldAliases)){
    for(const a of aliases){
      const re=new RegExp('\\b'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b');
      if(re.test(h))return field;
    }
  }
  return null;
}

// Target-scoped alias sets: prioritize the right fields per target
const TARGET_FIELDS={
  impact:['name','level','currentState','futureState','changeTypes'],
  gaps:['name','description','severity','trainingImpact','status'],
  stakeholders:['name','role','influence','sentiment','needs','agency','stakeholderType','roleCategory'],
  craid:['name','description','severity','status','type','owner','mitigation','probability','impact'],
  training:['name','description','audience','method','schedule'],
  comms:['name','description','audience','channel','timing','owner'],
  reinforcement:['name','description','owner','timing','frequency'],
  successcriteria:['name','description','metric','target','method'],
  engagement:['name','description','date','type','outcome','audience']
};

function mapImportRows(rows,target){
  if(!rows.length)return[];
  const headers=Object.keys(rows[0]);
  const fieldMap={};
  const targetFields=TARGET_FIELDS[target]||[];
  // Build target-scoped aliases: only include fields relevant to this target
  const scopedAliases={};
  targetFields.forEach(f=>{if(FIELD_ALIASES[f])scopedAliases[f]=FIELD_ALIASES[f];});
  // Pass 1: match headers against target-scoped aliases first
  headers.forEach(h=>{
    const match=fuzzyMatch(h,scopedAliases);
    if(match)fieldMap[h]=match;
  });
  // Pass 2: remaining unmatched headers against full aliases (for cross-target columns)
  headers.forEach(h=>{
    if(fieldMap[h])return;
    const match=fuzzyMatch(h,FIELD_ALIASES);
    if(match)fieldMap[h]=match;
  });
  // If no name column found, try first column
  const hasName=Object.values(fieldMap).includes('name');
  if(!hasName&&headers.length>0)fieldMap[headers[0]]='name';
  // For gaps: if no description but has name, copy name to description
  if(target==='gaps'&&!Object.values(fieldMap).includes('description')){
    const nameHeader=Object.entries(fieldMap).find(([_,f])=>f==='name');
    if(nameHeader)fieldMap[nameHeader[0]]='description';
  }

  // Deduplicate: if multiple headers map to same field, keep the first (target-scoped) match
  const usedFields=new Set();
  const finalMap={};
  Object.entries(fieldMap).forEach(([header,field])=>{
    if(!usedFields.has(field)){
      finalMap[header]=field;
      usedFields.add(field);
    }
  });
  return rows.map((row,idx)=>{
    const mapped={_selected:true,_idx:idx};
    Object.entries(finalMap).forEach(([header,field])=>{
      mapped[field]=row[header]||'';
    });
    headers.forEach(h=>{
      if(!finalMap[h])mapped['_raw_'+h]=row[h]||'';
    });
    return mapped;
  }).filter(m=>m.name||m.description||m.text);
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
  if(target==='stakeholders')return[{key:'name',label:'Group Name'},{key:'agency',label:'Agency'},{key:'role',label:'Role'},{key:'influence',label:'Influence'},{key:'sentiment',label:'Sentiment'}];
  if(target==='craid')return[{key:'text',label:'Description'},{key:'name',label:'Title'},{key:'type',label:'Type'},{key:'severity',label:'Severity'},{key:'status',label:'Status'}];
  if(target==='training')return[{key:'text',label:'Training Activity'},{key:'name',label:'Title'},{key:'description',label:'Details'},{key:'audience',label:'Audience'}];
  if(target==='comms')return[{key:'text',label:'Communication'},{key:'name',label:'Title'},{key:'description',label:'Details'},{key:'audience',label:'Audience'}];
  if(target==='reinforcement')return[{key:'text',label:'Activity'},{key:'name',label:'Title'},{key:'description',label:'Details'},{key:'owner',label:'Owner'}];
  if(target==='successcriteria')return[{key:'text',label:'Criterion'},{key:'name',label:'Title'},{key:'description',label:'Details'},{key:'metric',label:'Metric'}];
  if(target==='engagement')return[{key:'text',label:'Activity'},{key:'name',label:'Title'},{key:'description',label:'Details'},{key:'date',label:'Date'}];
  return[{key:'name',label:'Name'},{key:'text',label:'Content'}];
}

function toggleImportRow(idx,checked){if(_importParsed[idx])_importParsed[idx]._selected=checked;}
function toggleAllImportRows(checked){_importParsed.forEach(item=>item._selected=checked);}

function commitImport(){
  const p=getProj();if(!p)return;
  const selected=_importParsed.filter(item=>item._selected);
  if(!selected.length){showSuccess('Select at least one row to import.');return;}
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
        agency:item.agency||'',
        stakeholderType:item.stakeholderType||'end_user_group',
        roleCategory:item.roleCategory||'',
        factors:{resistance:3,env:3,window:3,complexity:3,saturation:3,leadership:3},
        objectives:[],
        kirk:{L1:{},L2:{},L3:{},L4:{}},
        rein:{owner:'',activities:'',intervals:[],escalation:''},
        trust:3,trustHistory:[],preconceptions:[],touchpoints:[],
        anxietyIndicators:{whatDoesThisMeanFreq:0,extraReviewCycles:0,escalations:0,attendanceDrop:false}
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

function bulkClear(target){
  const labels={impact:'impact groups',gaps:'gaps',stakeholders:'stakeholder groups'};
  const label=labels[target]||target;
  const p=getProj();if(!p)return;
  if(!confirm('Clear all '+label+'? This cannot be undone.'))return;
  if(target==='impact'){
    if(p.impactAssessment)p.impactAssessment.groups=[];
    renderPImpact();
  }else if(target==='gaps'){
    if(p.gapAnalysis)p.gapAnalysis.gaps=[];
    renderPGaps();
  }else if(target==='stakeholders'){
    p.stakeholders=[];
    renderPSH();renderPKPIs();
  }
  touch('proj');schedSave();
  showSuccess('All '+label+' cleared.');
}

function normalizeLevel(val){
  if(!val)return'Medium';
  const v=val.toLowerCase().trim();
  if(/\bhigh\b/.test(v)||v==='3'||/\bmajor\b/.test(v))return'High';
  if(/\blow\b/.test(v)||v==='1'||/\bminor\b/.test(v))return'Low';
  return'Medium';
}
function normalizeSeverity(val){
  if(!val)return'Medium';
  const v=val.toLowerCase().trim();
  if(/\bcritical\b/.test(v)||v==='4'||/\bblocker\b/.test(v))return'Critical';
  if(/\bhigh\b/.test(v)||v==='3'||/\bmajor\b/.test(v))return'High';
  if(/\blow\b/.test(v)||v==='1'||/\bminor\b/.test(v))return'Low';
  return'Medium';
}

function renderPOverview(){
  const p=getProj();if(!p)return;
  renderPKPIs();
  renderTrajectoryCard();
  renderDataConfidenceBar(p);
  renderValueCase(p);
  renderProofPoints(p);
  const fp=document.getElementById('p-ov-flags');const flags=getPFlags().slice(0,4);
  if(!flags.length){fp.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">No active flags. Portfolio is on track.</p></div>';}
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

// ════════════════════════════════════════════════════════
// DATA CONFIDENCE BAR
// ════════════════════════════════════════════════════════
function renderDataConfidenceBar(p){
  const el=document.getElementById('p-data-confidence-bar');if(!el)return;
  const conf=calcDataConfidence(p);
  const totalScore=calcCompositeScore(p);
  const sw=getSoWhat('adoptionScore',totalScore,{
    weakestComponent:getWeakestComponent(p),
    nextGate:getNextGate(p),
    topDrivers:getTopDrivers(p)
  });
  el.innerHTML=`<div class="data-conf-wrap">
    <div class="data-conf-hdr">
      <div class="data-conf-title">Score Confidence</div>
      <div class="data-conf-legend">
        <span class="dc-leg"><span class="dc-dot dc-measured"></span>Measured ${conf.measured}%</span>
        <span class="dc-leg"><span class="dc-dot dc-observed"></span>Observed ${conf.observed}%</span>
        <span class="dc-leg"><span class="dc-dot dc-estimated"></span>Estimated ${conf.estimated}%</span>
      </div>
    </div>
    <div class="data-conf-bar">
      <div class="dc-seg dc-measured" style="width:${conf.measured}%" title="Measured: driven by system data, surveys, or lifecycle metrics"></div>
      <div class="dc-seg dc-observed" style="width:${conf.observed}%" title="Observed: practitioner-assessed with documented evidence"></div>
      <div class="dc-seg dc-estimated" style="width:${conf.estimated}%" title="Estimated: subjective judgment without supporting evidence"></div>
    </div>
    ${conf.estimated>50?`<div class="data-conf-note"><i class="ph ph-warning"></i> More than half of this score relies on estimated inputs. Add lifecycle signals, trust assessments, or pulse surveys to increase confidence.</div>`:''}
    ${sw?`<div class="so-what-line">${esc(sw)}</div>`:''}
  </div>`;
}
function getWeakestComponent(p){
  const shs=p.stakeholders||[];
  const dims=getActiveDims();
  const fwScores=dims.map(d=>p.adkarScores?.[d.key]||3);
  const fwPct=fwScores.length?Math.round(fwScores.reduce((a,b)=>a+b,0)/fwScores.length/5*100):0;
  const sentPct=shs.length?Math.round(shs.reduce((a,sh)=>a+sentimentScore(sh,p.pulseResults?.[sh.id]?.scores||{}),0)/shs.length):50;
  const kirkPcts=shs.map(sh=>{if(!sh?.kirk)return 0;let f=0;const k=sh.kirk;if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;return Math.round(f/8*100);});
  const trainPct=kirkPcts.length?Math.round(kirkPcts.reduce((a,b)=>a+b,0)/kirkPcts.length):0;
  const lhScore=calcLifecycleHealth(p).score;
  const scored={'Change Readiness':fwPct,'People & Trust':sentPct,'Project Health':lhScore};
  if(trainingActive(p))scored['Training & Preparedness']=trainPct;
  const min=Object.entries(scored).sort((a,b)=>a[1]-b[1])[0];
  return min?min[0]:'people and trust';
}
function getNextGate(p){
  for(let i=0;i<GATE_DEFS.length;i++){
    const g=GATE_DEFS[i];
    const reds=g.items.filter((_,j)=>p.gateState[g.id+'_'+j]==='red').length;
    if(reds>0)return'Checkpoint '+(i+1);
  }
  return'the next gate';
}
function getTopDrivers(p){
  const flags=getProjFlagCount(p);
  const shs=p.stakeholders||[];
  const lowTrust=shs.filter(sh=>(sh.trust||3)<3).length;
  const parts=[];
  if(flags>0)parts.push(`${flags} active open issue${flags>1?'s':''}`);
  if(lowTrust>0)parts.push(`${lowTrust} stakeholder group${lowTrust>1?'s':''} with low trust`);
  const lh=calcLifecycleHealth(p);
  const redSigs=lh.signals.filter(s=>s.strength==='red').length;
  if(redSigs>0)parts.push(`${redSigs} critical lifecycle signal${redSigs>1?'s':''}`);
  return parts.length?parts.slice(0,2).join(' and '):'open issues and low trust';
}

// ════════════════════════════════════════════════════════
// VALUE CASE
// ════════════════════════════════════════════════════════
function renderValueCase(p){
  const el=document.getElementById('p-value-case-wrap');if(!el||el.dataset.dismissed==='1')return;
  if(!p.valueCase)p.valueCase={statement:'',requestor:'',impactLevel:'',successCriteria:[],unintendedConsequences:''};
  const vc=p.valueCase;
  if(!Array.isArray(vc.successCriteria))vc.successCriteria=[];
  // Seed 3 default empty rows for new projects so users aren't starting from
  // zero. _scSeeded guards against re-seeding after intentional deletes.
  if(vc.successCriteria.length===0 && !vc._scSeeded){
    for(let i=0;i<3;i++){
      vc.successCriteria.push({id:uid(),criterion:'',metStatus:null,actualOutcome:'',notes:''});
    }
    vc._scSeeded=true;
    touch('proj');schedSave();
  }
  const postGL=isPostGoLive(p);
  const vr=calcValueRealization(vc);
  const impactLevels=['High','Medium','Low'];
  const vrColor=vr===null?'var(--ink-60)':vr>=80?'var(--green)':vr>=50?'var(--amber)':'var(--red)';
  el.innerHTML=`<div class="exp-sec panel" style="margin-bottom:20px">
    <button class="exp-tog" onclick="toggleExp('vc-body',this)" aria-expanded="false" style="width:100%;padding:16px 20px;background:transparent;border:none;cursor:pointer;text-align:left">
      <div class="exp-tog-l" style="flex:1">
        <span class="exp-sec-title">Value Case</span>
        <span class="exp-badge" style="font-weight:400;font-size:11px;color:var(--ink-60);margin-left:8px">What this project is supposed to deliver — and whether it did</span>
        ${vr!==null?`<span class="exp-badge" style="background:${vrColor};color:#fff">${vr}% Realized</span>`:''}
      </div>
      <span class="exp-arr"><i class="ph ph-caret-down"></i></span>
    </button>
    <div class="exp-body" id="vc-body" style="padding:0 20px 20px">
    <div class="panel-hd" style="padding:0;margin-bottom:16px">
      <div></div>
      ${vr!==null?`<div class="value-score" style="color:${vrColor}">${vr}% Value Realized</div>`:''}
    </div>
    <div class="pb">
      <div class="vc-grid">
        <div class="vc-col">
          <div class="vc-section-label">Expected Value</div>
          <div class="vc-field"><label>Value Statement</label>
            <textarea class="vc-ta" placeholder="e.g. This functionality reduces manual income calculation from 15 minutes to 2 minutes per case" oninput="updateVC('statement',this.value)">${esc(vc.statement)}</textarea></div>
          <div class="vc-field"><label>Requestor / Sponsor</label>
            <input class="inp-std" placeholder="Who requested this and why" value="${esc(vc.requestor)}" oninput="updateVC('requestor',this.value)"></div>
          <div class="vc-field"><label>Expected Impact Level</label>
            <div class="impact-pill-row">${impactLevels.map(l=>`<button class="impact-pill ${vc.impactLevel===l?'active':''}" onclick="updateVC('impactLevel','${l}')">${l}</button>`).join('')}</div></div>
          <div class="vc-field"><label>Success Criteria</label>
            <div id="vc-criteria-list">${renderVCCriteria(vc,postGL)}</div>
            <button class="btn-add-sm" onclick="addVCCriterion()">+ Add Criterion</button></div>
        </div>
        ${postGL?`<div class="vc-col">
          <div class="vc-section-label">Actual Outcomes <span class="vc-postgl-badge">Post Go-Live</span></div>
          <div class="vc-field"><label>Actual vs. Expected Impact</label>
            <textarea class="vc-ta" placeholder="Did this deliver what was promised? What changed?" oninput="updateVC('actualImpact',this.value)">${esc(vc.actualImpact||'')}</textarea></div>
          <div class="vc-field"><label>Unintended Consequences</label>
            <textarea class="vc-ta" placeholder="Positive or negative outcomes that weren't planned..." oninput="updateVC('unintendedConsequences',this.value)">${esc(vc.unintendedConsequences)}</textarea></div>
          ${vr!==null?`<div class="vc-realization-bar">
            <div class="vc-real-label">Value Realization Score</div>
            <div class="vc-real-track"><div class="vc-real-fill" style="width:${vr}%;background:${vrColor}"></div></div>
            <div class="vc-real-val" style="color:${vrColor}">${vr}%</div>
          </div>`:''}
        </div>`:'<div class="vc-col"><div class="vc-pending"><div class="vc-pending-icon"><i class="ph ph-clock"></i></div><div class="vc-pending-txt">Actual Outcomes</div><div class="vc-pending-sub">This section unlocks after the go-live date to capture whether this project delivered its expected value.</div></div></div>'}
      </div>
    </div>
    </div>
  </div>`;
}
function renderVCCriteria(vc,postGL){
  if(!vc.successCriteria||!vc.successCriteria.length)return'<div class="vc-criteria-empty">No success criteria defined. Add measurable criteria to track whether this project delivers its expected value.</div>';
  const statuses=['Yes','Partially','No'];
  const statusColors={Yes:'var(--green)',Partially:'var(--amber)',No:'var(--red)'};
  return vc.successCriteria.map((c,i)=>`<div class="vc-criterion-row">
    <input class="inp-std" style="flex:1" value="${esc(c.criterion)}" placeholder="e.g. Processing time reduced by 80%" oninput="updateVCCriterion(${i},'criterion',this.value)">
    ${postGL?`<div class="vc-status-pills">${statuses.map(s=>`<button class="vc-status-pill ${c.metStatus===s?'active':''}" style="${c.metStatus===s?'background:'+statusColors[s]+';color:#fff':''}" onclick="updateVCCriterion(${i},'metStatus','${s}')">${s}</button>`).join('')}</div>`:''}
    <button class="btn-rm-sm" onclick="removeVCCriterion(${i})">&times;</button>
  </div>`).join('');
}
function updateVC(field,val){const p=getProj();if(!p)return;if(!p.valueCase)p.valueCase={statement:'',requestor:'',impactLevel:'',successCriteria:[],unintendedConsequences:''};p.valueCase[field]=val;if(field==='impactLevel')renderValueCase(p);touch('proj');schedSave();}
function addVCCriterion(){const p=getProj();if(!p)return;if(!p.valueCase)p.valueCase={statement:'',requestor:'',impactLevel:'',successCriteria:[],unintendedConsequences:''};p.valueCase.successCriteria.push({id:uid(),criterion:'',metStatus:null,actualOutcome:'',notes:''});renderValueCase(p);touch('proj');schedSave();}
function removeVCCriterion(i){const p=getProj();if(!p||!p.valueCase)return;if(!confirm('Remove this success criterion?'))return;p.valueCase.successCriteria.splice(i,1);renderValueCase(p);touch('proj');schedSave();}
function updateVCCriterion(i,field,val){const p=getProj();if(!p||!p.valueCase)return;if(p.valueCase.successCriteria[i])p.valueCase.successCriteria[i][field]=val;renderValueCase(p);touch('proj');schedSave();}

// ════════════════════════════════════════════════════════
// PROOF POINTS
// ════════════════════════════════════════════════════════
const PROOF_SOURCES=['Meeting Notes','System Data','Survey Response','Defect Log','Attendance Record','Facilitation Notes','Other'];
const PROOF_DIMS=['Change Readiness','People & Trust','Training & Preparedness','Project Health','Communication','Open Issues','Overall Readiness'];
function renderProofPoints(p){
  const el=document.getElementById('p-proof-points-wrap');if(!el)return;
  if(!p.proofPoints)p.proofPoints=[];
  const pts=p.proofPoints;
  el.innerHTML=`<div class="exp-sec panel" style="margin-bottom:20px">
    <button class="exp-tog" onclick="toggleExp('pp-body',this)" aria-expanded="false" style="width:100%;padding:16px 20px;background:transparent;border:none;cursor:pointer;text-align:left">
      <div class="exp-tog-l" style="flex:1">
        <span class="exp-sec-title">Proof Points</span>
        ${pts.length?`<span class="exp-badge ready">${pts.length} logged</span>`:'<span class="exp-badge needed">None yet</span>'}
      </div>
      <span class="exp-arr"><i class="ph ph-caret-down"></i></span>
    </button>
    <div class="exp-body" id="pp-body" style="padding:0 20px 20px">
    <div class="panel-hd" style="padding:0;margin-bottom:16px">
      <div class="ps-text">Hard evidence that connects raw observations to gate decisions — making your readiness assessment defensible to leadership.</div>
      <button class="btn-gold" onclick="openAddProofPoint()">+ Add</button>
    </div>
    <div>
      ${!pts.length?`<div class="es"><div class="es-rule"></div><p class="es-txt">No proof points logged yet. Add evidence from meetings, testing, or engagement sessions to build a defensible readiness record.</p></div>`
      :pts.map((pt,i)=>`<div class="pp-card">
        <div class="pp-hd">
          <div class="pp-what">${esc(pt.what)}</div>
          <div class="pp-meta"><span class="pp-date">${fmtDate(pt.when)}</span><span class="pp-source">Source: ${esc(pt.source)}</span></div>
          <button class="btn-rm-sm" onclick="removeProofPoint(${i})">&times;</button>
        </div>
        <div class="pp-proves"><span class="pp-proves-lbl">Proves:</span> ${esc(pt.proves)}</div>
        <div class="pp-tags">${(pt.dimensionTags||[]).map(t=>`<span class="pp-tag">${esc(t)}</span>`).join('')}</div>
      </div>`).join('')}
    </div>
    </div>
  </div>`;
}
function openAddProofPoint(){
  let existing=document.getElementById('add-pp-modal');if(existing)existing.remove();
  const modal=document.createElement('div');modal.id='add-pp-modal';modal.className='modal-ov';
  modal.innerHTML=`<div class="modal-box" style="max-width:540px">
    <div class="modal-hd"><div class="modal-title">Add Proof Point</div><button class="modal-close" onclick="document.getElementById('add-pp-modal').remove()">&times;</button></div>
    <div class="modal-bd">
      <div class="field-group"><label>What happened</label><input class="inp-std" id="pp-what" placeholder="Factual statement of what occurred"></div>
      <div class="field-group"><label>When</label><input class="inp-std" id="pp-when" type="date"></div>
      <div class="field-group"><label>What it proves</label><input class="inp-std" id="pp-proves" placeholder="Interpretation — what does this evidence indicate?"></div>
      <div class="field-group"><label>Source</label><select class="inp-std" id="pp-source">${PROOF_SOURCES.map(s=>`<option>${s}</option>`).join('')}</select></div>
      <div class="field-group"><label>Dimension Tags</label><div class="pp-tag-checks">${PROOF_DIMS.map(d=>`<label class="pp-tag-check"><input type="checkbox" value="${d}" id="pp-tag-${d.replace(/\s/g,'-')}"> ${d}</label>`).join('')}</div></div>
    </div>
    <div class="modal-ft"><button class="btn-cancel" onclick="document.getElementById('add-pp-modal').remove()">Cancel</button><button class="btn-gold" onclick="saveProofPoint()">Save Proof Point</button></div>
  </div>`;
  document.body.appendChild(modal);requestAnimationFrame(()=>modal.classList.add('open'));
  modal.addEventListener('click',function(e){if(e.target===this)this.remove();});
}
function saveProofPoint(){
  const p=getProj();if(!p)return;
  if(!p.proofPoints)p.proofPoints=[];
  const what=document.getElementById('pp-what')?.value.trim();
  const when=document.getElementById('pp-when')?.value;
  const proves=document.getElementById('pp-proves')?.value.trim();
  const source=document.getElementById('pp-source')?.value;
  if(!what)return;
  const tags=PROOF_DIMS.filter(d=>{const el=document.getElementById('pp-tag-'+d.replace(/\s/g,'-'));return el&&el.checked;});
  p.proofPoints.push({id:uid(),what,when,proves,source,dimensionTags:tags});
  document.getElementById('add-pp-modal')?.remove();
  renderProofPoints(p);touch('proj');schedSave();showSuccess('Evidence attached.');
}
function removeProofPoint(i){const p=getProj();if(!p||!p.proofPoints)return;if(!confirm('Remove this proof point?'))return;p.proofPoints.splice(i,1);renderProofPoints(p);touch('proj');schedSave();}

// ════════════════════════════════════════════════════════
// LIFECYCLE SIGNALS TAB
// ════════════════════════════════════════════════════════
function renderPLifecycle(){
  const p=getProj();if(!p)return;
  if(!p.lifecycleSignals)p.lifecycleSignals={requirements:{onSchedule:null,daysVariance:0,reviewCycles:0,disputes:false,disputeNotes:''},design:{reviewsDelayed:null,delayDays:0,scopeChangeRequests:0,workaroundRequests:0,workaroundNotes:''},testing:{qaDefects:0,uatDefects:0,uatParticipationRate:0,testingApproach:''},deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:0,supportTicketsMonth1:0,workaroundRequestsPostGL:0}};
  const ls=p.lifecycleSignals;
  const lh=calcLifecycleHealth(p);
  const lhColor=lh.score>=80?'var(--green)':lh.score>=60?'var(--gold)':lh.score>=40?'var(--amber)':'var(--red)';
  const lhSW=getSoWhat('lifecycleHealth',lh.score,{});
  const el=document.getElementById('p-lifecycle-container');if(!el)return;
  el.innerHTML=`
  <div class="lh-score-banner">
    <div class="lh-score-main">
      <div class="lh-score-val" style="color:${lhColor}">${lh.hasData?lh.score+'%':'—'}</div>
      <div class="lh-score-lbl">Lifecycle Health Score</div>
      ${lhSW&&lh.hasData?`<div class="so-what-line">${esc(lhSW)}</div>`:''}
    </div>
    ${lh.hasData?`<div class="lh-sig-summary">${['green','yellow','red'].map(s=>{const n=lh.signals.filter(x=>x.strength===s).length;return n?`<span class="sig-badge sig-${s}">${n} ${s==='green'?'Healthy':s==='yellow'?'Watch':'Concern'}</span>`:''}).join('')}</div>`:'<div class="lh-no-data">Enter signal data below to generate a Lifecycle Health score.</div>'}
  </div>

  <div class="lc-phase-grid">
    <div class="panel lc-phase">
      <div class="panel-hd"><div><div class="pt">Requirements Phase</div><div class="ps-text">Signals from the requirements and scoping stage</div></div></div>
      <div class="pb">
        <div class="sig-row">
          <div class="sig-label">Requirements completed on schedule?</div>
          <div class="sig-controls">
            <button class="sig-yn ${ls.requirements.onSchedule===true?'active-yes':''}" onclick="updateLS('requirements','onSchedule',true)">Yes</button>
            <button class="sig-yn ${ls.requirements.onSchedule===false?'active-no':''}" onclick="updateLS('requirements','onSchedule',false)">No</button>
          </div>
          ${ls.requirements.onSchedule===false?`<div class="sig-sub-field"><label>Days variance</label><input class="inp-sm" type="number" min="0" value="${ls.requirements.daysVariance||0}" onchange="updateLS('requirements','daysVariance',+this.value)"></div>`:''}
          ${signalStrengthBadge(ls.requirements.onSchedule===true?'green':ls.requirements.onSchedule===false?(ls.requirements.daysVariance>5?'red':'yellow'):'green')}
        </div>
        <div class="sig-row">
          <div class="sig-label">Number of review cycles required</div>
          <input class="inp-sm" type="number" min="0" value="${ls.requirements.reviewCycles||0}" onchange="updateLS('requirements','reviewCycles',+this.value)">
          ${ls.requirements.reviewCycles>=4?signalStrengthBadge('red'):ls.requirements.reviewCycles>=3?signalStrengthBadge('yellow'):signalStrengthBadge('green')}
        </div>
        <div class="sig-row">
          <div class="sig-label">Unresolved disputes or disagreements?</div>
          <div class="sig-controls">
            <button class="sig-yn ${ls.requirements.disputes?'active-no':''}" onclick="updateLS('requirements','disputes',true)">Yes</button>
            <button class="sig-yn ${!ls.requirements.disputes?'active-yes':''}" onclick="updateLS('requirements','disputes',false)">No</button>
          </div>
          ${signalStrengthBadge(ls.requirements.disputes?'red':'green')}
        </div>
        ${ls.requirements.disputes?`<div class="sig-row"><div class="sig-label">Dispute notes</div><textarea class="inp-ta-sm" placeholder="Describe the nature of disputes..." onchange="updateLS('requirements','disputeNotes',this.value)">${esc(ls.requirements.disputeNotes)}</textarea></div>`:''}
        ${ls.requirements.disputes?`<div class="sig-redNote">Unresolved disputes at requirements phase are a leading indicator of resistance and rework.</div>`:''}
      </div>
    </div>

    <div class="panel lc-phase">
      <div class="panel-hd"><div><div class="pt">Design Phase</div><div class="ps-text">Signals from design reviews and stakeholder engagement</div></div></div>
      <div class="pb">
        <div class="sig-row">
          <div class="sig-label">Design reviews delayed?</div>
          <div class="sig-controls">
            <button class="sig-yn ${ls.design.reviewsDelayed===true?'active-no':''}" onclick="updateLS('design','reviewsDelayed',true)">Yes</button>
            <button class="sig-yn ${ls.design.reviewsDelayed===false?'active-yes':''}" onclick="updateLS('design','reviewsDelayed',false)">No</button>
          </div>
          ${ls.design.reviewsDelayed?`<div class="sig-sub-field"><label>Days delayed</label><input class="inp-sm" type="number" min="0" value="${ls.design.delayDays||0}" onchange="updateLS('design','delayDays',+this.value)"></div>`:''}
          ${signalStrengthBadge(ls.design.reviewsDelayed?(ls.design.delayDays>5?'red':'yellow'):'green')}
        </div>
        <div class="sig-row">
          <div class="sig-label">Scope change requests from stakeholders</div>
          <input class="inp-sm" type="number" min="0" value="${ls.design.scopeChangeRequests||0}" onchange="updateLS('design','scopeChangeRequests',+this.value)">
          ${ls.design.scopeChangeRequests>=3?signalStrengthBadge('red'):ls.design.scopeChangeRequests>=1?signalStrengthBadge('yellow'):signalStrengthBadge('green')}
        </div>
        <div class="sig-row">
          <div class="sig-label">Stakeholder workaround requests</div>
          <input class="inp-sm" type="number" min="0" value="${ls.design.workaroundRequests||0}" onchange="updateLS('design','workaroundRequests',+this.value)">
          ${ls.design.workaroundRequests>=3?signalStrengthBadge('red'):ls.design.workaroundRequests>=1?signalStrengthBadge('yellow'):signalStrengthBadge('green')}
        </div>
        ${ls.design.workaroundRequests>0?`<div class="sig-redNote">Stakeholders requesting workarounds during design is a leading indicator of adoption resistance. Each request represents a stakeholder who does not believe the system will meet their needs. Document the underlying concern for each request.</div>`:''}
        ${ls.design.workaroundRequests>0?`<div class="sig-row"><div class="sig-label">Workaround notes</div><textarea class="inp-ta-sm" placeholder="Describe each workaround request and the underlying concern..." onchange="updateLS('design','workaroundNotes',this.value)">${esc(ls.design.workaroundNotes)}</textarea></div>`:''}
      </div>
    </div>

    <div class="panel lc-phase">
      <div class="panel-hd"><div><div class="pt">Testing / QA Phase</div><div class="ps-text">Quality and participation signals from testing</div></div></div>
      <div class="pb">
        <div class="sig-row">
          <div class="sig-label">QA defects found</div>
          <input class="inp-sm" type="number" min="0" value="${ls.testing.qaDefects||0}" onchange="updateLS('testing','qaDefects',+this.value)">
        </div>
        <div class="sig-row">
          <div class="sig-label">UAT defects found</div>
          <input class="inp-sm" type="number" min="0" value="${ls.testing.uatDefects||0}" onchange="updateLS('testing','uatDefects',+this.value)">
        </div>
        ${(ls.testing.qaDefects>0||ls.testing.uatDefects>0)?`<div class="sig-row">
          <div class="sig-label">QA-to-UAT defect ratio (auto-calculated)</div>
          <div class="sig-ratio-val">${ls.testing.uatDefects>0?Math.round(ls.testing.qaDefects/ls.testing.uatDefects)+':1':ls.testing.qaDefects>0?'∞ (no UAT defects)':'—'}</div>
          ${ls.testing.uatDefects>0?signalStrengthBadge(ls.testing.qaDefects/ls.testing.uatDefects>=50?'red':ls.testing.qaDefects/ls.testing.uatDefects>=10?'yellow':'green'):''}
        </div>
        ${ls.testing.uatDefects>0&&ls.testing.qaDefects/ls.testing.uatDefects>=50?`<div class="sig-redNote">UAT found ${ls.testing.uatDefects} defect${ls.testing.uatDefects!==1?'s':''} while QA found ${ls.testing.qaDefects}. Users may not be testing thoroughly or are accepting known issues. This is a leading indicator of post-go-live resistance.</div>`:''}
        ${ls.testing.uatDefects>0&&ls.testing.qaDefects/ls.testing.uatDefects>=10&&ls.testing.qaDefects/ls.testing.uatDefects<50?`<div class="sig-yellowNote">QA-to-UAT ratio is elevated. Verify UAT test coverage is comprehensive and testers are exercising real-world scenarios.</div>`:''}
        `:''}
        <div class="sig-row">
          <div class="sig-label">UAT participation rate (%)</div>
          <input class="inp-sm" type="number" min="0" max="100" value="${ls.testing.uatParticipationRate||0}" onchange="updateLS('testing','uatParticipationRate',+this.value)">
          ${ls.testing.uatParticipationRate?signalStrengthBadge(ls.testing.uatParticipationRate<60?'red':ls.testing.uatParticipationRate<80?'yellow':'green'):''}
        </div>
        <div class="sig-row">
          <div class="sig-label">Testing approach</div>
          <select class="inp-std" onchange="updateLS('testing','testingApproach',this.value)">
            <option value="" ${!ls.testing.testingApproach?'selected':''}>Select...</option>
            <option value="guided" ${ls.testing.testingApproach==='guided'?'selected':''}>Guided (specific scenarios)</option>
            <option value="exploratory" ${ls.testing.testingApproach==='exploratory'?'selected':''}>Exploratory (open-ended)</option>
            <option value="mixed" ${ls.testing.testingApproach==='mixed'?'selected':''}>Mixed</option>
          </select>
        </div>
      </div>
    </div>

    <div class="panel lc-phase">
      <div class="panel-hd"><div><div class="pt">Training Schedule</div><div class="ps-text">Schedule stability and readiness signals for end-user training</div></div></div>
      <div class="pb">
        <div class="sig-row">
          <div class="sig-label">Training start date changes</div>
          <input class="inp-sm" type="number" min="0" value="${ls.training?.startDateChanges||0}" onchange="updateLS('training','startDateChanges',+this.value)">
          ${(ls.training?.startDateChanges||0)>=3?signalStrengthBadge('red'):(ls.training?.startDateChanges||0)>=1?signalStrengthBadge('yellow'):signalStrengthBadge('green')}
        </div>
        ${(ls.training?.startDateChanges||0)>0?`<div class="sig-row" style="flex-direction:column;align-items:flex-start">
          <div class="sig-label" style="margin-bottom:8px">Reasons for date changes <span style="font-size:10px;color:var(--ink-60)">(select all that apply)</span></div>
          <div class="sig-reason-checks">
            ${['UAT delays','Training environment defects','Insufficient time scoped','System scope changes','Resource unavailability','Other'].map(r=>`<label class="sig-reason-cb"><input type="checkbox" ${(ls.training?.startDateReasons||[]).includes(r)?'checked':''} onchange="updateLSReasons('training','startDateReasons','${r}',this.checked)"> ${r}</label>`).join('')}
          </div>
        </div>
        ${(ls.training?.startDateReasons||[]).includes('Training environment defects')||(ls.training?.startDateReasons||[]).includes('UAT delays')?`<div class="sig-redNote">Training schedule instability from ${(ls.training?.startDateReasons||[]).slice(0,2).join(' and ').toLowerCase()} is a leading indicator of insufficient preparation time for end users — a well-documented predictor of post-go-live resistance.</div>`:''}
        `:''}
        <div class="sig-row">
          <div class="sig-label">Training environment defects</div>
          <input class="inp-sm" type="number" min="0" value="${ls.training?.envDefects||0}" onchange="updateLS('training','envDefects',+this.value)">
          ${(ls.training?.envDefects||0)>0?signalStrengthBadge((ls.training?.envDefects||0)>3?'red':'yellow'):''}
        </div>
        <div class="sig-row">
          <div class="sig-label">Training scope was underestimated?</div>
          <div class="sig-controls">
            <button class="sig-yn ${ls.training?.scopeUnderestimated?'active-no':''}" onclick="updateLS('training','scopeUnderestimated',true)">Yes</button>
            <button class="sig-yn ${!ls.training?.scopeUnderestimated?'active-yes':''}" onclick="updateLS('training','scopeUnderestimated',false)">No</button>
          </div>
          ${ls.training?.scopeUnderestimated?signalStrengthBadge('yellow'):''}
        </div>
        ${ls.training?.scopeUnderestimated?`<div class="sig-yellowNote">Underestimated training scope leads to compressed timelines, reduced reinforcement planning, and lower confidence in L3/L4 behavior transfer outcomes.</div>`:''}
        ${ls.training?.scopeUnderestimated?`<div class="sig-row"><div class="sig-label">Scope notes</div><textarea class="inp-ta-sm" placeholder="What was underestimated? (e.g. not enough time for end-user practice, UAT participation overlapped with training window)" onchange="updateLS('training','scopeNotes',this.value)">${esc(ls.training?.scopeNotes||'')}</textarea></div>`:''}
        <div class="sig-row">
          <div class="sig-label">Training material rework cycles</div>
          <input class="inp-sm" type="number" min="0" value="${ls.training?.materialReworkCycles||0}" onchange="updateLS('training','materialReworkCycles',+this.value)">
          ${(ls.training?.materialReworkCycles||0)>=3?signalStrengthBadge('red'):(ls.training?.materialReworkCycles||0)>=2?signalStrengthBadge('yellow'):''}
        </div>
      </div>
    </div>

    <div class="panel lc-phase">
      <div class="panel-hd"><div><div class="pt">Deployment / Go-Live</div><div class="ps-text">Post-deployment adoption signals</div></div></div>
      <div class="pb">
        <div class="sig-row">
          <div class="sig-label">Number of go-live date changes</div>
          <input class="inp-sm" type="number" min="0" value="${ls.deployment.goliveDateChanges||0}" onchange="updateLS('deployment','goliveDateChanges',+this.value)">
          ${signalStrengthBadge(ls.deployment.goliveDateChanges>=2?'red':ls.deployment.goliveDateChanges>=1?'yellow':'green')}
        </div>
        <div class="sig-row">
          <div class="sig-label">Parallel operations extended?</div>
          <div class="sig-controls">
            <button class="sig-yn ${ls.deployment.parallelOpsExtended?'active-no':''}" onclick="updateLS('deployment','parallelOpsExtended',true)">Yes</button>
            <button class="sig-yn ${!ls.deployment.parallelOpsExtended?'active-yes':''}" onclick="updateLS('deployment','parallelOpsExtended',false)">No</button>
          </div>
          ${ls.deployment.parallelOpsExtended?`<div class="sig-sub-field"><label>Additional days</label><input class="inp-sm" type="number" min="0" value="${ls.deployment.parallelOpsDays||0}" onchange="updateLS('deployment','parallelOpsDays',+this.value)"></div>`:''}
          ${signalStrengthBadge(ls.deployment.parallelOpsExtended?'yellow':'green')}
        </div>
        <div class="sig-row">
          <div class="sig-label">Support tickets — first week</div>
          <input class="inp-sm" type="number" min="0" value="${ls.deployment.supportTicketsWeek1||0}" onchange="updateLS('deployment','supportTicketsWeek1',+this.value)">
          ${ls.deployment.supportTicketsWeek1?signalStrengthBadge(ls.deployment.supportTicketsWeek1>50?'red':ls.deployment.supportTicketsWeek1>20?'yellow':'green'):''}
        </div>
        <div class="sig-row">
          <div class="sig-label">Support tickets — first month</div>
          <input class="inp-sm" type="number" min="0" value="${ls.deployment.supportTicketsMonth1||0}" onchange="updateLS('deployment','supportTicketsMonth1',+this.value)">
        </div>
        <div class="sig-row">
          <div class="sig-label">Post-go-live workaround requests</div>
          <input class="inp-sm" type="number" min="0" value="${ls.deployment.workaroundRequestsPostGL||0}" onchange="updateLS('deployment','workaroundRequestsPostGL',+this.value)">
          ${ls.deployment.workaroundRequestsPostGL?signalStrengthBadge(ls.deployment.workaroundRequestsPostGL>2?'red':ls.deployment.workaroundRequestsPostGL>0?'yellow':'green'):''}
        </div>
        ${ls.deployment.workaroundRequestsPostGL>0?`<div class="sig-redNote">${ls.deployment.workaroundRequestsPostGL} post-go-live workaround request${ls.deployment.workaroundRequestsPostGL!==1?'s':''} indicate users are not adopting the intended process. Targeted coaching intervention recommended.</div>`:''}
      </div>
    </div>
  </div>`;
}
function updateLS(phase,field,val){
  const p=getProj();if(!p)return;
  if(!p.lifecycleSignals)p.lifecycleSignals={requirements:{onSchedule:null,daysVariance:0,reviewCycles:0,disputes:false,disputeNotes:''},design:{reviewsDelayed:null,delayDays:0,scopeChangeRequests:0,workaroundRequests:0,workaroundNotes:''},testing:{qaDefects:0,uatDefects:0,uatParticipationRate:0,testingApproach:''},training:{startDateChanges:0,startDateReasons:[],envDefects:0,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:0},deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:0,supportTicketsMonth1:0,workaroundRequestsPostGL:0}};
  if(!p.lifecycleSignals[phase])p.lifecycleSignals[phase]={};
  p.lifecycleSignals[phase][field]=val;
  renderPLifecycle();touch('proj');schedSave();
}
function updateLSReasons(phase,field,reason,checked){
  const p=getProj();if(!p)return;
  if(!p.lifecycleSignals)p.lifecycleSignals={};
  if(!p.lifecycleSignals[phase])p.lifecycleSignals[phase]={};
  if(!Array.isArray(p.lifecycleSignals[phase][field]))p.lifecycleSignals[phase][field]=[];
  if(checked){if(!p.lifecycleSignals[phase][field].includes(reason))p.lifecycleSignals[phase][field].push(reason);}
  else{p.lifecycleSignals[phase][field]=p.lifecycleSignals[phase][field].filter(r=>r!==reason);}
  renderPLifecycle();touch('proj');schedSave();
}

function renderProjCharts(){
  getActiveDims();
  const p=getProj();if(!p)return;
  // Readiness Donut
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
  showSaveIndicator('Rendering trend data\u2026');
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
  renderExecAttention();renderExecRAGSummary();renderExecGoLiveStrip();renderExecTopRisks();renderExecAgencyHM();renderExecNarratives();renderComplexityHeatmap();renderValueRealization();
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
    const sc=adoptScore(sh.factors);if(sc<40)items.push({sev:'warn',label:`${esc(r.name)} › ${esc(p.name)}`,sub:`${esc(sh.name)} at ${sc}% readiness`});
  });});});

  if(!items.length){el.innerHTML='<div class="es" style="padding:30px"><p class="es-txt" style="color:var(--green);font-weight:600"><i class="ph ph-check-circle"></i> No critical items. Portfolio is healthy.</p></div>';return;}
  el.innerHTML=items.slice(0,8).map(it=>`<div class="exec-attn-item">
    <div class="exec-attn-icon ${it.sev}">${it.sev==='crit'?'!':'<i class="ph ph-warning"></i>'}</div>
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
    if(d!==null&&d<0)risks.push({sev:3,text:`${esc(r.name)} is ${Math.abs(d)} days overdue with ${rl.gateScore||0}% readiness.`});
    if(d!==null&&d>=0&&d<=14&&rl.gateScore!==null&&rl.gateScore<50)risks.push({sev:3,text:`${esc(r.name)} goes live in ${d} days but readiness is only ${rl.gateScore}%.`});
    r.projects.forEach(p=>{
      const fl=projFlagCount(p);if(fl>=3)risks.push({sev:2,text:`${esc(p.name)} (${esc(r.name)}) has ${fl} active open issues requiring immediate attention.`});
      const uatEmpty=!(p.resources?.uat?.length&&p.resources.uat.some(e=>e.name));
      if(uatEmpty&&d!==null&&d<=30&&d>=0)risks.push({sev:2,text:`${esc(p.name)} has no UAT resources assigned with go-live in ${d} days.`});
      p.stakeholders.forEach(sh=>{const sc=adoptScore(sh.factors);if(sc<40)risks.push({sev:1,text:`${esc(sh.name)} (${esc(p.name)}) at ${sc}% readiness — critical risk tier.`});});
    });
  });
  risks.sort((a,b)=>b.sev-a.sev);
  if(!risks.length){el.innerHTML='<div class="es" style="padding:20px"><p class="es-txt" style="color:var(--green);font-weight:600">No critical risks identified. Portfolio risk posture is healthy.</p></div>';return;}
  el.innerHTML=risks.slice(0,5).map(r=>`<div class="exec-attn-item"><div class="exec-attn-icon ${r.sev>=2?'crit':'warn'}">${r.sev>=2?'!':'<i class="ph ph-warning"></i>'}</div><div class="exec-attn-txt"><div class="exec-attn-sub">${r.text}</div></div></div>`).join('');
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
  let h='<thead><tr><th class="phm-rh">Agency</th><th>Releases</th><th>Avg Readiness</th><th>Avg '+fwShort()+'</th><th>Open Issues</th></tr></thead><tbody>';
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
  if(uatMissing)insights.push({icon:'!',cls:'warn',text:`${uatMissing} project${uatMissing>1?'s have':' has'} no testing resources assigned and launch${uatMissing>1?'':' is'} within 30 days.`});
  // Low readiness
  const lowGate=releases.filter(r=>{const rl=relRollup(r);return rl.gateScore!==null&&rl.gateScore<50;});
  if(lowGate.length)insights.push({icon:'!',cls:'warn',text:`${lowGate.length} release${lowGate.length>1?'s are':' is'} below 50% readiness: ${lowGate.map(r=>r.name).join(', ')}. These are not ready to proceed.`});
  // Critical groups
  let critSH=0;
  releases.forEach(r=>r.projects.forEach(p=>p.stakeholders.forEach(sh=>{if(adoptScore(sh.factors)<40)critSH++;})));
  if(critSH)insights.push({icon:'!',cls:'warn',text:`${critSH} affected group${critSH>1?'s are':' is'} at critical risk — below 40% readiness. Without intervention, these groups are unlikely to adopt the change.`});
  // Competing launches
  const goLives=releases.filter(r=>r.golive).map(r=>({name:r.name,d:new Date(r.golive)})).sort((a,b)=>a.d-b.d);
  for(let i=1;i<goLives.length;i++){const diff=Math.abs(goLives[i].d-goLives[i-1].d)/86400000;
    if(diff<=7)insights.push({icon:'!',cls:'warn',text:`${goLives[i-1].name} and ${goLives[i].name} launch within ${Math.round(diff)} day${Math.round(diff)===1?'':'s'} of each other — people and resources will be stretched thin.`});}
  // High readiness
  const highReady=releases.filter(r=>{const rl=relRollup(r);return rl.gateScore!==null&&rl.gateScore>=80;});
  if(highReady.length)insights.push({icon:'—',cls:'good',text:`${highReady.length} release${highReady.length>1?'s are':' is'} at 80%+ readiness: ${highReady.map(r=>r.name).join(', ')}. On track.`});
  // Strong change readiness scores
  const strongAdkar=releases.filter(r=>{const rl=relRollup(r);return rl.adkar!==null&&parseFloat(rl.adkar)>=4;});
  if(strongAdkar.length)insights.push({icon:'—',cls:'good',text:`${strongAdkar.length} release${strongAdkar.length>1?'s show':' shows'} strong change readiness scores (4+/5).`});
  if(!insights.length)insights.push({icon:'—',cls:'neutral',text:'Not enough data to generate insights yet. Add projects and complete the readiness checklists to begin.'});
  return insights;
}

function renderExecNarratives(){
  const el=document.getElementById('exec-narratives');if(!el)return;
  const insights=generatePortfolioNarratives();
  el.innerHTML=insights.map(i=>`<div class="trend-insight ${i.cls}">
    <div class="trend-insight-icon ${i.cls}">${i.icon}</div><div>${i.text}</div>
  </div>`).join('');
}

// ════════════════════════════════════════════════════════
// "WHAT THE DATA IS TELLING US" — Enhanced Portfolio Section
// ════════════════════════════════════════════════════════
function generateWhatDataTells(){
  const insights=[];
  const allProjects=[];
  releases.forEach(r=>r.projects.forEach(p=>{allProjects.push({p,r});}));

  // 1. Score Trajectory Alert — adoption score declining 2+ consecutive snapshots
  // We infer decline from gate score drops across gates
  allProjects.forEach(({p,r})=>{
    const gateScores=GATE_DEFS.map(g=>{
      const tot=g.items.length,grn=g.items.filter((_,i)=>p.gateState[g.id+'_'+i]==='green').length;
      return tot?Math.round(grn/tot*100):null;
    }).filter(s=>s!==null);
    if(gateScores.length>=3){
      const last3=gateScores.slice(-3);
      if(last3[2]<last3[1]&&last3[1]<last3[0]){
        const drop=last3[0]-last3[2];
        const trustDrop=p.stakeholders.some(sh=>(sh.trustHistory||[]).length>=2&&sh.trustHistory[sh.trustHistory.length-1].value<sh.trustHistory[sh.trustHistory.length-2].value);
        const driver=trustDrop?'stakeholder trust is trending negative':'gate completion rate is declining';
        insights.push({severity:'critical',icon:'!',text:`${p.name} readiness has declined for 3 consecutive review cycles. Primary driver: ${driver}. This project is losing ground — intervention is needed before the next milestone.`,source:'Readiness Progression',link:{rel:r.id,proj:p.id,tab:'gates'}});
      }
    }
  });

  // 2. Resource Mismatch — High/Critical complexity but low OCM resources
  allProjects.forEach(({p,r})=>{
    const cx=calcComplexity(p);
    if(cx.rating==='High'||cx.rating==='Critical'){
      const ocmResources=(p.resources?.ocm_train||[]).filter(e=>e.name).length+(p.resources?.ocm_impl||[]).filter(e=>e.name).length;
      if(ocmResources===0){
        insights.push({severity:'critical',icon:'!',text:`${p.name} is rated ${cx.rating} complexity but has no change management resources assigned. Without dedicated OCM support, this project is significantly more likely to fail at go-live.`,source:'Complexity & Resources',link:{rel:r.id,proj:p.id,tab:'resources'}});
      }
    }
  });

  // 3. Cross-Portfolio Training Transfer Gap — avg L2 high but avg L3 low
  let l2Total=0,l3Total=0,l2Count=0,l3Count=0;
  allProjects.forEach(({p})=>{
    p.stakeholders.forEach(sh=>{
      const k=sh.kirk||{};
      if(k.L2?.assessment&&k.L3?.observable){
        l2Count++;l3Count++;
        // Score as 1-5 based on field filled — proxy: field has content
        l2Total+=k.L2.assessment.length>30?4:k.L2.assessment.length>10?3:2;
        l3Total+=k.L3.observable.length>30?4:k.L3.observable.length>10?3:2;
      }
    });
  });
  if(l2Count>=3&&l2Count===l3Count){
    const l2Avg=(l2Total/l2Count).toFixed(1),l3Avg=(l3Total/l3Count).toFixed(1);
    if(parseFloat(l2Avg)>=3.5&&parseFloat(l3Avg)<2.5){
      insights.push({severity:'warn',icon:'!',text:`Across ${l2Count} stakeholder groups, training plans are well-defined but on-the-job application strategies are weak. People are being taught how to use the system but not supported in actually changing how they work. Consider a portfolio-wide reinforcement review.`,source:'Training Transfer Assessment',link:null});
    }
  }

  // 4. Workaround Red Flag — design phase workaround requests
  allProjects.forEach(({p,r})=>{
    const wr=(p.lifecycleSignals?.design?.workaroundRequests)||0;
    if(wr>=3){
      insights.push({severity:'critical',icon:'!',text:`${p.name} logged ${wr} workaround requests during design. In ${wr} documented cases, stakeholders do not believe the system will meet their needs. This is a strong early indicator of adoption resistance.`,source:'Lifecycle Signals — Design Phase',link:{rel:r.id,proj:p.id,tab:'lifecycle'}});
    } else if(wr>=1){
      insights.push({severity:'warn',icon:'!',text:`${p.name} logged ${wr} workaround request${wr>1?'s':''} during design. Monitor closely — this can escalate into adoption resistance.`,source:'Lifecycle Signals — Design Phase',link:{rel:r.id,proj:p.id,tab:'lifecycle'}});
    }
  });

  // 5. Saturation Alert — multiple projects with shared go-live windows
  const goLiveProjects=allProjects.filter(({p})=>p.golive).sort((a,b)=>new Date(a.p.golive)-new Date(b.p.golive));
  for(let i=1;i<goLiveProjects.length;i++){
    const diff=Math.abs(new Date(goLiveProjects[i].p.golive)-new Date(goLiveProjects[i-1].p.golive))/86400000;
    if(diff<=30){
      insights.push({severity:'warn',icon:'!',text:`${goLiveProjects[i-1].p.name} and ${goLiveProjects[i].p.name} launch within ${Math.round(diff)} days of each other. People affected by both will be managing two major changes simultaneously. Consider staggering timelines to reduce overload.`,source:'Portfolio Launch Timeline',link:null});
    }
  }

  // 6. Low Trust Alert
  allProjects.forEach(({p,r})=>{
    const lowTrust=p.stakeholders.filter(sh=>(sh.trust||3)<=2);
    if(lowTrust.length>0){
      insights.push({severity:'critical',icon:'!',text:`${p.name} has ${lowTrust.length} stakeholder group${lowTrust.length>1?'s':''} with low trust (${lowTrust.map(sh=>sh.name).join(', ')}). These groups are skeptical or actively distrustful of the change. Without direct intervention, adoption will fail regardless of training quality.`,source:'Stakeholder Trust Assessments',link:{rel:r.id,proj:p.id,tab:'adoption'}});
    }
  });

  // Merge with base narratives as lower-priority items
  const base=generatePortfolioNarratives().filter(i=>i.cls!=='neutral');
  base.forEach(i=>insights.push({severity:i.cls==='warn'?'warn':'good',icon:i.icon,text:i.text,source:'Portfolio Analytics',link:null}));

  if(!insights.length)insights.push({severity:'good',icon:'—',text:'No critical signals detected across the portfolio. Continue monitoring as projects approach key milestones.',source:'Portfolio Analytics',link:null});
  return insights.slice(0,8);
}
let _wdtCollapsed=true;
function renderWhatDataTells(){
  const el=document.getElementById('what-data-tells');if(!el)return;
  if(sessionStorage.getItem('wdt_dismissed')==='1'){el.innerHTML='';return;}
  const insights=generateWhatDataTells();
  el.innerHTML=`<div class="wdt-wrap">
    <div class="wdt-hdr">
      <div class="wdt-hdr-left">
        <div class="wdt-title">What the Data Is Telling Us</div>
        <div class="wdt-sub">Top signals across all active projects</div>
      </div>
      <div class="wdt-hdr-actions">
        <button class="wdt-toggle-btn" onclick="toggleWDT()" id="wdt-toggle">${_wdtCollapsed?'Show ▾':'Hide ▴'}</button>
        <button class="wdt-dismiss-btn" onclick="dismissWDT()" title="Dismiss until next visit">&times;</button>
      </div>
    </div>
    <div class="wdt-body${_wdtCollapsed?' collapsed':''}" id="wdt-body" style="max-height:${_wdtCollapsed?'0':'2000px'}">
      <div class="wdt-list">${insights.map(i=>`<div class="insight-card ${i.severity}">
        <div class="ic-dot ${i.severity}"></div>
        <div class="ic-body">
          <div class="ic-text">${esc(i.text)}</div>
          <div class="ic-source">Source: ${esc(i.source)}${i.link?` — <a href="#" class="ic-link" onclick="openProjectFromPortfolio('${i.link.rel}','${i.link.proj}','${i.link.tab||'overview'}');return false">View Details</a>`:''}</div>
        </div>
      </div>`).join('')}
      </div>
    </div>
  </div>`;
}
function toggleWDT(){
  _wdtCollapsed=!_wdtCollapsed;
  const body=document.getElementById('wdt-body');
  const btn=document.getElementById('wdt-toggle');
  if(body){body.classList.toggle('collapsed',_wdtCollapsed);body.style.maxHeight=_wdtCollapsed?'0':'2000px';}
  if(btn)btn.textContent=_wdtCollapsed?'Show ▾':'Hide ▴';
}
function dismissWDT(){
  sessionStorage.setItem('wdt_dismissed','1');
  const el=document.getElementById('what-data-tells');
  if(el)el.innerHTML='';
}
function openProjectFromPortfolio(relId,projId,tab){
  activeRelId=parseInt(relId)||relId;activeProjId=parseInt(projId)||projId;
  openProject(activeProjId);
  setTimeout(()=>{
    const btn=document.querySelector(`#proj-nav-tabs .nav-btn[onclick*="'${tab}'"]`);
    if(btn)btn.click();
  },200);
}

// ════════════════════════════════════════════════════════
// PORTFOLIO COMPLEXITY HEATMAP
// ════════════════════════════════════════════════════════
function renderComplexityHeatmap(){
  const el=document.getElementById('exec-complexity-hm');if(!el)return;
  const allProjects=[];
  releases.forEach(r=>r.projects.forEach(p=>allProjects.push({p,r})));
  if(!allProjects.length){el.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">Add projects to see complexity analysis. Complexity scoring helps you anticipate change fatigue and resource pressure.</p></div>';return;}
  const rated=allProjects.map(({p,r})=>{
    const cx=calcComplexity(p);
    const as=calcCompositeScore(p);
    return{name:p.name,release:r.name,rating:cx.rating,effort:cx.effort,score:cx.score,adoptionScore:as};
  }).sort((a,b)=>b.score-a.score);
  const colorMap={Critical:'var(--red)',High:'#C28E00',Medium:'var(--gold)',Low:'var(--green)'};
  const bgMap={Critical:'rgba(139,26,26,0.1)',High:'rgba(194,142,0,0.1)',Medium:'rgba(184,146,42,0.08)',Low:'rgba(29,104,64,0.08)'};
  el.innerHTML=`<div class="cx-heatmap">
    <div class="cx-sub">Where OCM energy needs to be concentrated</div>
    <div class="cx-grid">${rated.map(p=>`<div class="cx-card" style="border-left:4px solid ${colorMap[p.rating]};background:${bgMap[p.rating]}">
      <div class="cx-card-name">${esc(p.name)}</div>
      <div class="cx-card-rel">${esc(p.release)}</div>
      <div class="cx-card-metrics">
        <div class="cx-metric"><span class="cx-metric-val" style="color:${colorMap[p.rating]}">${p.rating}</span><span class="cx-metric-lbl">Complexity</span></div>
        <div class="cx-metric"><span class="cx-metric-val">${p.effort}</span><span class="cx-metric-lbl">OCM Effort</span></div>
        <div class="cx-metric"><span class="cx-metric-val">${p.adoptionScore}%</span><span class="cx-metric-lbl">Adoption</span></div>
      </div>
    </div>`).join('')}</div>
  </div>`;
}

// ════════════════════════════════════════════════════════
// PORTFOLIO VALUE REALIZATION
// ════════════════════════════════════════════════════════
function renderValueRealization(){
  const el=document.getElementById('exec-value-realization');if(!el)return;
  const postGL=[];
  releases.forEach(r=>r.projects.forEach(p=>{if(isPostGoLive(p))postGL.push({p,r});}));
  if(!postGL.length){el.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">Value realization unlocks after go-live. This is where you\u2019ll measure whether the change delivered what was promised.</p></div>';return;}
  let delivered=0,partial=0,notDelivered=0,notAssessed=0;
  const items=postGL.map(({p,r})=>{
    const vr=calcValueRealization(p.valueCase);
    if(vr===null){notAssessed++;return{name:p.name,release:r.name,vr:null,status:'Not Assessed',color:'var(--ink-60)',criteria:0,met:0};}
    const total=p.valueCase.successCriteria.filter(c=>c.metStatus).length;
    const metCount=p.valueCase.successCriteria.filter(c=>c.metStatus==='Yes').length;
    if(vr>=80){delivered++;return{name:p.name,release:r.name,vr,status:'Delivered',color:'var(--green)',criteria:total,met:metCount};}
    if(vr>=50){partial++;return{name:p.name,release:r.name,vr,status:'Partially Delivered',color:'var(--amber)',criteria:total,met:metCount};}
    notDelivered++;return{name:p.name,release:r.name,vr,status:'Did Not Deliver',color:'var(--red)',criteria:total,met:metCount};
  });
  el.innerHTML=`<div class="vr-wrap">
    <div class="vr-sub">Are we getting what we paid for?</div>
    <div class="vr-summary">
      <div class="vr-sum-card" style="border-left:4px solid var(--green)"><div class="vr-sum-val">${delivered}</div><div class="vr-sum-lbl">Delivered</div></div>
      <div class="vr-sum-card" style="border-left:4px solid var(--amber)"><div class="vr-sum-val">${partial}</div><div class="vr-sum-lbl">Partially Delivered</div></div>
      <div class="vr-sum-card" style="border-left:4px solid var(--red)"><div class="vr-sum-val">${notDelivered}</div><div class="vr-sum-lbl">Did Not Deliver</div></div>
      ${notAssessed?`<div class="vr-sum-card" style="border-left:4px solid var(--ink-60)"><div class="vr-sum-val">${notAssessed}</div><div class="vr-sum-lbl">Not Assessed</div></div>`:''}
    </div>
    <div class="vr-list">${items.map(i=>`<div class="vr-item">
      <div class="vr-item-name">${esc(i.name)}<span class="vr-item-rel">${esc(i.release)}</span></div>
      <div class="vr-item-right">
        ${i.vr!==null?`<div class="vr-item-bar-wrap"><div class="vr-item-bar"><div class="vr-item-fill" style="width:${i.vr}%;background:${i.color}"></div></div></div>
        <div class="vr-item-val" style="color:${i.color}">${i.vr}%</div>`:`<span style="color:var(--ink-60);font-size:12px">No criteria assessed</span>`}
        <div class="vr-item-status" style="color:${i.color}">${i.status}</div>
      </div>
    </div>`).join('')}</div>
  </div>`;
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
  if(!recs.length){el.innerHTML='<div class="es" style="padding:30px"><p class="es-txt" style="color:var(--green);font-weight:600"><i class="ph ph-check-circle"></i> All gate items are complete. No actions required.</p></div>';return;}
  el.innerHTML=recs.slice(0,6).map(r=>`<div class="rec-item">
    <div class="rec-icon ${r.sev}">${r.sev==='red'?'!':'<i class="ph ph-warning"></i>'}</div>
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

  // Composite adoption score — drop training weight until it's active.
  const trActive=trainingActive(p);
  const w=adoptionWeights(trActive);
  const currentAdoptionScore=Math.round(fwPct*w.fw+sentPct*w.sent+trainPct*w.train+commsPct*w.comms+riskPct*w.risk);
  let tier='Critical';
  if(currentAdoptionScore>=85)tier='Champion';
  else if(currentAdoptionScore>=65)tier='On Track';
  else if(currentAdoptionScore>=40)tier='At Risk';

  // Gaps
  const gaps=(p.gapAnalysis?.gaps||[]).map(g=>({description:g.description||'',severity:g.severity||'Medium',status:g.status||'Open'}));
  const pctLabel=v=>Math.round(v*100)+'%';

  return{
    projectName:p.name,
    frameworkName:fwName(),
    goLiveDate:p.golive||null,
    trainingActive:trActive,
    trainingStartDate:p.trainingStartDate||null,
    currentAdoptionScore,tier,
    scoringComponents:{
      frameworkAssessment:{score:fwPct,weight:pctLabel(w.fw),scores:fwScores},
      stakeholderSentiment:{score:sentPct,weight:pctLabel(w.sent),supporters,neutral,resistant,total:shs.length},
      trainingEffectiveness:{score:trActive?trainPct:null,weight:trActive?pctLabel(w.train):'—',pending:!trActive,pendingLabel:'Training not yet started',kirkpatrickDetails:stakeholderBreakdown.map(s=>({name:s.name,kirkReady:s.kirkpatrickReady,reinReady:s.reinforcementReady}))},
      commsCompletion:{score:commsPct,weight:pctLabel(w.comms)},
      riskAdjustment:{score:riskPct,weight:pctLabel(w.risk),activeFlags:flags.length}
    },
    stakeholders:stakeholderBreakdown,
    gateHistory,
    riskFlags:flags.map(f=>({gate:f.gate,sub:f.sub,item:f.item,consequence:f.consequence})),
    gaps,
    acknowledgedRecs:p.acknowledgedRecs||[],
    pulseInsights:p._pulseInsightsSummary||null,
    saturationForecast:window._saturationForecastSummary||null
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
    list.innerHTML='<div class="smart-recs-loading" style="color:var(--green)"><i class="ph ph-check"></i> No urgent recommendations at this time.</div>';
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
          <button class="smart-rec-btn ack" onclick="ackSmartRec(${i})" title="Acknowledge"${isAcked?' disabled':''}><i class="ph ph-check"></i>${isAcked?' Acknowledged':''}</button>
          <button class="smart-rec-btn dismiss" onclick="dismissSmartRec(${i})" title="Dismiss"><i class="ph ph-x"></i></button>
        </div>
      </div>
      <div class="smart-rec-action">${esc(r.action)}</div>
      <div class="smart-rec-meta">
        <div class="smart-rec-trigger"><strong>Data trigger:</strong> ${esc(r.data_trigger)}</div>
        <div class="smart-rec-impact"><i class="ph ph-arrow-up"></i> ${esc(r.estimated_impact)}</div>
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
    if(btn){btn.disabled=true;btn.innerHTML='<i class="ph ph-check"></i> Acknowledged';}
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
  if(!groups.length){el.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">Add impacted groups to begin the impact assessment. Map who\u2019s affected, how, and what support they\u2019ll need.</p></div>';return;}
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
  const g=p.impactAssessment.groups[gi];const label=g?g.name:'this group';
  if(!confirm('Remove impact group "'+label+'"? This will delete the group and all its readiness actions.'))return;
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
  if(!confirm('Remove this readiness action?'))return;
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
  h+='<button class="btn-outline" onclick="bulkClear(\'gaps\')" title="Clear all gaps" style="color:var(--red-bright);border-color:var(--red-bright)"><i class="ph ph-trash"></i> Clear All</button>';
  h+='<span style="font-size:10px;color:var(--ink-60);font-style:italic">Gaps received from implementation team — focus on training/adoption impact</span></div>';
  if(gaps.length===0){
    h+='<div style="text-align:center;padding:40px;color:var(--ink-35);font-size:12px">No gaps recorded yet. Click "+ Add Gap" to log gaps from the implementation team\'s analysis.</div>';
  }else{
    gaps.forEach(g=>{
      h+='<div class="gap-row">';
      h+='<div class="gap-row-head">';
      h+='<span class="sev-badge '+sevCls(g.severity)+'">'+g.severity+'</span>';
      h+='<select class="gap-sev-sel" onchange="updateGap('+g.id+',\'severity\',this.value)">';
      GAP_SEVERITIES.forEach(sv=>{h+='<option'+(sv===g.severity?' selected':'')+'>'+sv+'</option>';});
      h+='</select>';
      h+='<button class="btn-del-sm" onclick="removeGap('+g.id+')" title="Remove gap">&times;</button>';
      h+='</div>';
      h+='<div class="gap-row-fields">';
      h+='<div class="gap-field gap-field-desc"><label>Gap Description</label><textarea rows="2" oninput="updateGap('+g.id+',\'description\',this.value)" placeholder="What gap was identified by the implementation team?">'+esc(g.description)+'</textarea></div>';
      h+='<div class="gap-field gap-field-impact"><label>Training / Adoption Impact</label><textarea rows="2" oninput="updateGap('+g.id+',\'trainingImpact\',this.value)" placeholder="How does this affect training or adoption? How will OCM address it?">'+esc(g.trainingImpact)+'</textarea></div>';
      h+='</div></div>';
    });
  }
  el.innerHTML=h;
}

// ════════════════════════════════════════════════════════
// FEATURE: CRAID LOG (Constraints, Risks, Assumptions, Issues, Dependencies)
// ════════════════════════════════════════════════════════
const CRAID_TYPES=[
  {key:'risk',label:'Risk',abbr:'R',color:'#b83232'},
  {key:'assumption',label:'Assumption',abbr:'A',color:'#2563eb'},
  {key:'issue',label:'Issue',abbr:'I',color:'#d97706'},
  {key:'dependency',label:'Dependency',abbr:'D',color:'#7c3aed'},
  {key:'constraint',label:'Constraint',abbr:'C',color:'#6b7280'}
];
const CRAID_STATUSES=['Open','In Progress','Mitigated','Closed','Validated','Invalidated'];
const CRAID_SEVERITIES=['Critical','High','Medium','Low'];
const CRAID_PROBABILITIES=['Very Likely','Likely','Possible','Unlikely'];
const CRAID_CONSTRAINT_TYPES=['Schedule','Budget','Resource','Technical','Regulatory'];
let _craidFilter={type:'all',status:'all'};

function newCraidEntry(type){
  return{id:uid(),type:type||'risk',title:'',description:'',status:'Open',severity:'Medium',
    owner:'',dueDate:'',created:new Date().toISOString(),
    probability:'',impact:'',mitigation:'',dependsOn:'',validationMethod:'',constraintType:''};
}

function craidSummary(p){
  const items=p.craid||[];
  const open=items.filter(e=>!['Closed','Mitigated','Validated','Invalidated'].includes(e.status));
  const r={total:items.length,open:open.length};
  CRAID_TYPES.forEach(t=>{r[t.key]=open.filter(e=>e.type===t.key).length;r[t.key+'Total']=items.filter(e=>e.type===t.key).length;});
  r.critical=open.filter(e=>e.severity==='Critical').length;
  return r;
}

function addCraidEntry(type){
  const p=getProj();if(!p)return;
  if(!p.craid)p.craid=[];
  const entry=newCraidEntry(type);
  p.craid.unshift(entry);
  touch('proj');schedSave();renderPCraid();
  logAudit('craid_added',entry.type,p.name,{entryType:entry.type});
}
function updateCraidField(entryId,field,value){
  const p=getProj();if(!p)return;
  const entry=(p.craid||[]).find(e=>e.id===entryId);
  if(!entry)return;
  entry[field]=value;
  touch('proj');schedSave();
}
function removeCraidEntry(entryId){
  const p=getProj();if(!p)return;
  const idx=(p.craid||[]).findIndex(e=>e.id===entryId);
  if(idx<0)return;
  const entry=p.craid[idx];
  const label=(entry.title||entry.description||'').substring(0,60);
  if(!confirm('Remove CRAID entry "'+label+'"?'))return;
  p.craid.splice(idx,1);
  touch('proj');schedSave();renderPCraid();
  logAudit('craid_removed',entry.type,p.name,{title:entry.title});
}
function setCraidFilter(type,status){
  if(type!==undefined)_craidFilter.type=type;
  if(status!==undefined)_craidFilter.status=status;
  renderPCraid();
}

function renderPCraid(){
  const p=getProj();if(!p)return;
  if(!p.craid)p.craid=[];
  const el=document.getElementById('ptab-craid');if(!el)return;
  const s=craidSummary(p);
  const sevCls=sev=>sev==='Critical'?'sev-crit':sev==='High'?'sev-high':sev==='Medium'?'sev-med':'sev-low';
  const typeCfg=t=>CRAID_TYPES.find(c=>c.key===t)||CRAID_TYPES[0];

  // Summary strip
  let h='<div class="sat-alert-strip">';
  CRAID_TYPES.forEach(t=>{
    h+='<div class="sat-alert-item" style="cursor:pointer;border-bottom:3px solid '+t.color+'" onclick="setCraidFilter(\''+t.key+'\')">';
    h+='<span class="sat-alert-val'+(s[t.key]?' sev-crit':'')+'">'+s[t.key]+'</span>';
    h+='<span class="sat-alert-lbl">'+t.label+'s</span></div>';
  });
  h+='</div>';

  // Filter row
  h+='<div class="craid-filters">';
  h+='<div class="craid-filter-group">';
  h+='<button class="craid-fbtn'+(_craidFilter.type==='all'?' active':'')+'" onclick="setCraidFilter(\'all\')">All</button>';
  CRAID_TYPES.forEach(t=>{
    h+='<button class="craid-fbtn'+(_craidFilter.type===t.key?' active':'')+'" style="'+ (_craidFilter.type===t.key?'border-color:'+t.color:'')+'" onclick="setCraidFilter(\''+t.key+'\')">'+t.abbr+'</button>';
  });
  h+='</div>';
  h+='<div class="craid-filter-group">';
  h+='<button class="craid-fbtn'+(_craidFilter.status==='all'?' active':'')+'" onclick="setCraidFilter(undefined,\'all\')">All Status</button>';
  h+='<button class="craid-fbtn'+(_craidFilter.status==='open'?' active':'')+'" onclick="setCraidFilter(undefined,\'open\')">Open</button>';
  h+='<button class="craid-fbtn'+(_craidFilter.status==='closed'?' active':'')+'" onclick="setCraidFilter(undefined,\'closed\')">Closed</button>';
  h+='</div>';
  h+='<div class="craid-add-group">';
  CRAID_TYPES.forEach(t=>{
    h+='<button class="btn-outline craid-add-btn" style="border-color:'+t.color+';color:'+t.color+'" onclick="addCraidEntry(\''+t.key+'\')" title="Add '+t.label+'">+ '+t.label+'</button>';
  });
  h+='</div></div>';

  // Filter entries
  let items=p.craid;
  if(_craidFilter.type!=='all')items=items.filter(e=>e.type===_craidFilter.type);
  if(_craidFilter.status==='open')items=items.filter(e=>!['Closed','Mitigated','Validated','Invalidated'].includes(e.status));
  if(_craidFilter.status==='closed')items=items.filter(e=>['Closed','Mitigated','Validated','Invalidated'].includes(e.status));

  if(!items.length){
    h+='<div class="wkl-empty">No '+ (_craidFilter.type!=='all'?typeCfg(_craidFilter.type).label.toLowerCase()+'s':'entries')+' found. Use the buttons above to add entries.</div>';
  }else{
    items.forEach(entry=>{
      const tc=typeCfg(entry.type);
      const isClosed=['Closed','Mitigated','Validated','Invalidated'].includes(entry.status);
      h+='<div class="craid-entry'+(isClosed?' craid-closed':'')+'" style="border-left-color:'+tc.color+'">';
      // Header
      h+='<div class="craid-entry-hdr">';
      h+='<span class="craid-type-badge" style="background:'+tc.color+'">'+tc.label.toUpperCase()+'</span>';
      h+='<span class="sev-badge '+sevCls(entry.severity)+'">'+entry.severity+'</span>';
      h+='<select class="craid-status-sel" onchange="updateCraidField('+entry.id+',\'status\',this.value);renderPCraid()">';
      CRAID_STATUSES.forEach(st=>{
        const applicable=entry.type==='risk'?true:entry.type==='assumption'?['Open','Validated','Invalidated','Closed'].includes(st):['Open','In Progress','Closed','Mitigated'].includes(st);
        if(applicable)h+='<option'+(st===entry.status?' selected':'')+'>'+st+'</option>';
      });
      h+='</select>';
      h+='<button class="btn-del-sm" onclick="removeCraidEntry('+entry.id+')" title="Remove">&times;</button>';
      h+='</div>';
      // Title
      h+='<div class="craid-field"><input class="craid-title-inp" type="text" value="'+esc(entry.title)+'" placeholder="Title..." oninput="updateCraidField('+entry.id+',\'title\',this.value)"></div>';
      // Description
      h+='<div class="craid-field"><textarea class="craid-desc-inp" rows="2" placeholder="Description..." oninput="updateCraidField('+entry.id+',\'description\',this.value)">'+esc(entry.description)+'</textarea></div>';
      // Type-specific fields
      if(entry.type==='risk'){
        h+='<div class="craid-row">';
        h+='<div class="craid-field craid-field-sm"><label>Probability</label><select onchange="updateCraidField('+entry.id+',\'probability\',this.value)"><option value="">—</option>';
        CRAID_PROBABILITIES.forEach(pr=>{h+='<option'+(pr===entry.probability?' selected':'')+'>'+pr+'</option>';});
        h+='</select></div>';
        h+='<div class="craid-field craid-field-sm"><label>Impact</label><select onchange="updateCraidField('+entry.id+',\'impact\',this.value)"><option value="">—</option>';
        CRAID_SEVERITIES.forEach(sv=>{h+='<option'+(sv===entry.impact?' selected':'')+'>'+sv+'</option>';});
        h+='</select></div>';
        h+='<div class="craid-field craid-field-sm"><label>Severity</label><select onchange="updateCraidField('+entry.id+',\'severity\',this.value);renderPCraid()">';
        CRAID_SEVERITIES.forEach(sv=>{h+='<option'+(sv===entry.severity?' selected':'')+'>'+sv+'</option>';});
        h+='</select></div>';
        h+='</div>';
        h+='<div class="craid-field"><label>Mitigation Plan</label><textarea class="craid-desc-inp" rows="2" placeholder="How will this risk be mitigated?" oninput="updateCraidField('+entry.id+',\'mitigation\',this.value)">'+esc(entry.mitigation)+'</textarea></div>';
      }
      if(entry.type==='assumption'){
        h+='<div class="craid-row">';
        h+='<div class="craid-field craid-field-sm"><label>Severity</label><select onchange="updateCraidField('+entry.id+',\'severity\',this.value);renderPCraid()">';
        CRAID_SEVERITIES.forEach(sv=>{h+='<option'+(sv===entry.severity?' selected':'')+'>'+sv+'</option>';});
        h+='</select></div></div>';
        h+='<div class="craid-field"><label>Validation Method</label><textarea class="craid-desc-inp" rows="1" placeholder="How will this assumption be validated?" oninput="updateCraidField('+entry.id+',\'validationMethod\',this.value)">'+esc(entry.validationMethod)+'</textarea></div>';
      }
      if(entry.type==='dependency'){
        h+='<div class="craid-row">';
        h+='<div class="craid-field craid-field-sm"><label>Severity</label><select onchange="updateCraidField('+entry.id+',\'severity\',this.value);renderPCraid()">';
        CRAID_SEVERITIES.forEach(sv=>{h+='<option'+(sv===entry.severity?' selected':'')+'>'+sv+'</option>';});
        h+='</select></div></div>';
        h+='<div class="craid-field"><label>Depends On</label><input class="craid-title-inp" type="text" value="'+esc(entry.dependsOn)+'" placeholder="What does this depend on?" oninput="updateCraidField('+entry.id+',\'dependsOn\',this.value)"></div>';
      }
      if(entry.type==='constraint'){
        h+='<div class="craid-row">';
        h+='<div class="craid-field craid-field-sm"><label>Type</label><select onchange="updateCraidField('+entry.id+',\'constraintType\',this.value)"><option value="">—</option>';
        CRAID_CONSTRAINT_TYPES.forEach(ct=>{h+='<option'+(ct===entry.constraintType?' selected':'')+'>'+ct+'</option>';});
        h+='</select></div>';
        h+='<div class="craid-field craid-field-sm"><label>Severity</label><select onchange="updateCraidField('+entry.id+',\'severity\',this.value);renderPCraid()">';
        CRAID_SEVERITIES.forEach(sv=>{h+='<option'+(sv===entry.severity?' selected':'')+'>'+sv+'</option>';});
        h+='</select></div></div>';
      }
      if(entry.type==='issue'){
        h+='<div class="craid-row">';
        h+='<div class="craid-field craid-field-sm"><label>Severity</label><select onchange="updateCraidField('+entry.id+',\'severity\',this.value);renderPCraid()">';
        CRAID_SEVERITIES.forEach(sv=>{h+='<option'+(sv===entry.severity?' selected':'')+'>'+sv+'</option>';});
        h+='</select></div></div>';
      }
      // Owner + Due Date
      h+='<div class="craid-row">';
      h+='<div class="craid-field craid-field-sm"><label>Owner</label><input class="craid-title-inp" type="text" value="'+esc(entry.owner)+'" placeholder="Owner" oninput="updateCraidField('+entry.id+',\'owner\',this.value)"></div>';
      h+='<div class="craid-field craid-field-sm"><label>Due Date</label><input class="craid-title-inp" type="date" value="'+esc(entry.dueDate)+'" oninput="updateCraidField('+entry.id+',\'dueDate\',this.value)"></div>';
      h+='</div>';
      h+='</div>';
    });
  }
  el.innerHTML=h;
}

// CRAID — Navigate to project CRAID tab
function openCraidInProject(relId,projId){
  activeRelId=relId;openProject(projId);
  const btns=document.querySelectorAll('#v-project .nav-btn');
  btns.forEach(b=>{if(b.textContent.trim()==='CRAID Log')showProjTab('craid',b);});
}

// CRAID — Release-level rollup
function renderRelCraidSummary(){
  const el=document.getElementById('rel-craid-summary');if(!el)return;
  const r=getRel();if(!r)return;
  const projs=r.projects||[];
  const allItems=[];
  projs.forEach(p=>{(p.craid||[]).forEach(e=>{allItems.push({...e,projName:p.name,projId:p.id});});});
  const open=allItems.filter(e=>!['Closed','Mitigated','Validated','Invalidated'].includes(e.status));
  if(!allItems.length){el.innerHTML='';return;}

  let h='<div class="panel" style="margin-top:16px"><div class="panel-hd"><div><div class="pt">CRAID Summary</div><div class="ps-text">Risks, assumptions, issues, dependencies, and constraints across all projects</div></div></div><div class="pb">';
  // Summary strip
  h+='<div class="sat-alert-strip">';
  CRAID_TYPES.forEach(t=>{
    const cnt=open.filter(e=>e.type===t.key).length;
    h+='<div class="sat-alert-item" style="border-bottom:3px solid '+t.color+'"><span class="sat-alert-val'+(cnt&&t.key==='risk'?' sev-crit':'')+'">'+cnt+'</span><span class="sat-alert-lbl">Open '+t.label+'s</span></div>';
  });
  h+='</div>';
  // Top risks table
  const topRisks=open.filter(e=>e.type==='risk').sort((a,b)=>{
    const si=CRAID_SEVERITIES.indexOf(a.severity)-CRAID_SEVERITIES.indexOf(b.severity);
    return si!==0?si:a.title.localeCompare(b.title);
  }).slice(0,5);
  if(topRisks.length){
    h+='<div style="margin-top:12px"><div class="wkl-sec-title">Top Open Risks</div>';
    h+='<table class="wkl-cr-tbl"><thead><tr><th>Project</th><th>Risk</th><th>P × I</th><th>Owner</th><th>Severity</th></tr></thead><tbody>';
    topRisks.forEach(rk=>{
      const sevCls=rk.severity==='Critical'?'sev-crit':rk.severity==='High'?'sev-high':'sev-med';
      h+='<tr style="cursor:pointer" onclick="openCraidInProject('+r.id+','+rk.projId+')">';
      h+='<td>'+esc(rk.projName)+'</td>';
      h+='<td><strong>'+esc(rk.title||'Untitled')+'</strong></td>';
      h+='<td>'+(rk.probability&&rk.impact?esc(rk.probability)+' × '+esc(rk.impact):'—')+'</td>';
      h+='<td>'+esc(rk.owner||'—')+'</td>';
      h+='<td><span class="sev-badge '+sevCls+'">'+rk.severity+'</span></td>';
      h+='</tr>';
    });
    h+='</tbody></table></div>';
  }
  h+='</div></div>';
  el.innerHTML=h;
}

// CRAID — Portfolio-level rollup
function collectPortCraidData(){
  const allItems=[];
  releases.forEach(r=>{
    (r.projects||[]).forEach(p=>{
      (p.craid||[]).forEach(e=>{allItems.push({...e,projName:p.name,projId:p.id,relName:r.name,relId:r.id});});
    });
  });
  const open=allItems.filter(e=>!['Closed','Mitigated','Validated','Invalidated'].includes(e.status));
  const summary={total:allItems.length,open:open.length,critical:open.filter(e=>e.severity==='Critical').length};
  CRAID_TYPES.forEach(t=>{summary[t.key]=open.filter(e=>e.type===t.key).length;});
  // Per-release breakdown
  const byRelease=releases.map(r=>{
    const relItems=[];
    (r.projects||[]).forEach(p=>{(p.craid||[]).forEach(e=>{relItems.push(e);});});
    const relOpen=relItems.filter(e=>!['Closed','Mitigated','Validated','Invalidated'].includes(e.status));
    return{relId:r.id,relName:r.name,total:relItems.length,open:relOpen.length,
      risks:relOpen.filter(e=>e.type==='risk').length,issues:relOpen.filter(e=>e.type==='issue').length,
      critical:relOpen.filter(e=>e.severity==='Critical').length,high:relOpen.filter(e=>e.severity==='High').length,
      medium:relOpen.filter(e=>e.severity==='Medium').length,low:relOpen.filter(e=>e.severity==='Low').length};
  });
  // Top open risks
  const topRisks=open.filter(e=>e.type==='risk').sort((a,b)=>CRAID_SEVERITIES.indexOf(a.severity)-CRAID_SEVERITIES.indexOf(b.severity)).slice(0,10);
  return{allItems,open,summary,byRelease,topRisks};
}

function renderPortCraidDashboard(){
  const sec=document.getElementById('port-craid-sec');if(!sec)return;
  const data=collectPortCraidData();
  if(!data.allItems.length){sec.style.display='none';return;}
  sec.style.display='block';
  const statEl=document.getElementById('port-craid-stat');
  if(statEl){
    const parts=[];
    if(data.summary.critical)parts.push(data.summary.critical+' critical');
    if(data.summary.risk)parts.push(data.summary.risk+' open risks');
    if(data.summary.issue)parts.push(data.summary.issue+' open issues');
    if(!parts.length)parts.push(data.summary.open+' open items');
    statEl.textContent=parts.join(' · ');
  }
  // Summary strip
  const sumEl=document.getElementById('port-craid-summary');
  if(sumEl){
    let h='<div class="sat-alert-strip">';
    // UAT-120: brand color compliance — use CSS variables instead of hardcoded hex
    h+='<div class="sat-alert-item" style="border-bottom:3px solid var(--red-bright)"><span class="sat-alert-val'+(data.summary.risk?' sev-crit':'')+'">'+data.summary.risk+'</span><span class="sat-alert-lbl">Open Risks</span></div>';
    h+='<div class="sat-alert-item" style="border-bottom:3px solid var(--red-bright)"><span class="sat-alert-val'+(data.summary.critical?' sev-crit':'')+'">'+data.summary.critical+'</span><span class="sat-alert-lbl">Critical</span></div>';
    h+='<div class="sat-alert-item" style="border-bottom:3px solid var(--amber-bright)"><span class="sat-alert-val'+(data.summary.issue?' sev-high':'')+'">'+data.summary.issue+'</span><span class="sat-alert-lbl">Open Issues</span></div>';
    h+='<div class="sat-alert-item" style="border-bottom:3px solid var(--blue-bright)"><span class="sat-alert-val">'+data.summary.assumption+'</span><span class="sat-alert-lbl">Assumptions</span></div>';
    h+='<div class="sat-alert-item" style="border-bottom:3px solid var(--purple)"><span class="sat-alert-val">'+data.summary.dependency+'</span><span class="sat-alert-lbl">Dependencies</span></div>';
    h+='</div>';
    sumEl.innerHTML=h;
  }
  // Top risks table
  const trEl=document.getElementById('port-craid-top-risks');
  if(trEl){
    if(!data.topRisks.length){trEl.innerHTML='';
    }else{
      let h='<div class="wkl-sec-title">Top Open Risks</div><div class="wkl-sec-sub">Highest severity risks across the portfolio</div>';
      h+='<div class="phm-scroll"><table class="wkl-cr-tbl"><thead><tr><th>Release</th><th>Project</th><th>Risk</th><th>P × I</th><th>Owner</th><th>Due</th><th>Severity</th></tr></thead><tbody>';
      data.topRisks.forEach(rk=>{
        const sevCls=rk.severity==='Critical'?'sev-crit':rk.severity==='High'?'sev-high':'sev-med';
        h+='<tr style="cursor:pointer" onclick="openCraidInProject('+rk.relId+','+rk.projId+')">';
        h+='<td>'+esc(rk.relName)+'</td><td>'+esc(rk.projName)+'</td>';
        h+='<td><strong>'+esc(rk.title||'Untitled')+'</strong></td>';
        h+='<td>'+(rk.probability&&rk.impact?esc(rk.probability)+' × '+esc(rk.impact):'—')+'</td>';
        h+='<td>'+esc(rk.owner||'—')+'</td>';
        h+='<td>'+esc(rk.dueDate?fmtDate(rk.dueDate):'—')+'</td>';
        h+='<td><span class="sev-badge '+sevCls+'">'+rk.severity+'</span></td></tr>';
      });
      h+='</tbody></table></div>';
      trEl.innerHTML=h;
    }
  }
  // By release breakdown
  const brEl=document.getElementById('port-craid-by-release');
  if(brEl){
    const activeRels=data.byRelease.filter(r=>r.total>0);
    if(!activeRels.length){brEl.innerHTML='';
    }else{
      let h='<div class="wkl-sec-title">Risk by Release</div><div class="wkl-sec-sub">Open risk and issue distribution per release</div>';
      activeRels.forEach(r=>{
        const total=r.critical+r.high+r.medium+r.low;
        const critPct=total?Math.round(r.critical/total*100):0;
        const highPct=total?Math.round(r.high/total*100):0;
        const medPct=total?Math.round(r.medium/total*100):0;
        const lowPct=total?Math.round(r.low/total*100):0;
        h+='<div class="craid-rel-row" style="cursor:pointer" onclick="openRelease('+r.relId+')">';
        h+='<div class="wkl-rel-name">'+esc(r.relName)+'</div>';
        h+='<div style="flex:1">';
        if(total){
          h+='<div class="craid-sev-bar">';
          if(critPct)h+='<div class="craid-sev-seg craid-seg-crit" style="width:'+critPct+'%" title="Critical: '+r.critical+'"></div>';
          if(highPct)h+='<div class="craid-sev-seg craid-seg-high" style="width:'+highPct+'%" title="High: '+r.high+'"></div>';
          if(medPct)h+='<div class="craid-sev-seg craid-seg-med" style="width:'+medPct+'%" title="Medium: '+r.medium+'"></div>';
          if(lowPct)h+='<div class="craid-sev-seg craid-seg-low" style="width:'+lowPct+'%" title="Low: '+r.low+'"></div>';
          h+='</div>';
        }else{
          h+='<div class="craid-sev-bar"><div class="craid-sev-seg" style="width:100%;background:var(--bg-deep)"></div></div>';
        }
        h+='</div>';
        h+='<div class="wkl-rel-meta">'+r.risks+' risks · '+r.issues+' issues</div>';
        h+='</div>';
      });
      brEl.innerHTML=h;
    }
  }
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
  if(!groups.length){
    el.innerHTML='<div style="text-align:center;padding:40px;color:var(--ink-35);font-size:12px">No stakeholder groups found. Add stakeholders to projects to see saturation data.</div>';return;
  }
  const satHigh=groups.filter(g=>g.projects.length>=3).length;
  const satMod=groups.filter(g=>g.projects.length===2).length;
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
  // Show forecast section if we have saturated groups
  const forecastSec=document.getElementById('sat-forecast-sec');
  if(forecastSec){
    const hasSaturated=groups.some(g=>g.projects.length>=2);
    forecastSec.style.display=hasSaturated?'block':'none';
    // Restore cached forecast if available
    if(hasSaturated&&window._sfCache){renderSFForecastResult(window._sfCache);}
  }
}

function openResourceInProject(relId,projId){
  activeRelId=relId;openProject(projId);
  // Switch to Resources tab (find the nav button by text)
  const btns=document.querySelectorAll('#v-project .nav-btn');
  btns.forEach(b=>{if(b.textContent.trim()==='Resources')showProjTab('resources',b);});
}

// ════════════════════════════════════════════════════════
// FEATURE: OCM WORKLOAD BALANCE DASHBOARD
// ════════════════════════════════════════════════════════
function collectOcmWorkloadData(){
  const OCM_ROLES=[{key:'ocm_train',label:'OCM Training',abbr:'Train'},{key:'ocm_impl',label:'OCM Implementation',abbr:'Impl'}];
  const personMap={};
  const projectGaps=[];
  const releaseStats=[];

  releases.forEach(r=>{
    let relTotalSlots=0,relFilledSlots=0,relResources=new Set();
    (r.projects||[]).forEach(p=>{
      const missing=[];
      OCM_ROLES.forEach(role=>{
        const assigned=(p.resources?.[role.key]||[]).filter(res=>(res.name||'').trim());
        relTotalSlots++;
        if(assigned.length>0){
          relFilledSlots++;
          assigned.forEach(res=>{
            const nm=res.name.trim();const norm=nm.toLowerCase();
            relResources.add(norm);
            if(!personMap[norm])personMap[norm]={name:nm,assignments:[],projIds:new Set(),relIds:new Set()};
            personMap[norm].assignments.push({roleKey:role.key,roleLabel:role.label,roleAbbr:role.abbr,projId:p.id,projName:p.name,relName:r.name,relId:r.id,relGoLive:r.golive});
            personMap[norm].projIds.add(p.id);
            personMap[norm].relIds.add(r.id);
          });
        }else{
          missing.push(role);
        }
      });
      if(missing.length>0){
        projectGaps.push({projId:p.id,projName:p.name,relName:r.name,relId:r.id,missingRoles:missing,missingCount:missing.length});
      }
    });
    const projCount=(r.projects||[]).length;
    releaseStats.push({relId:r.id,relName:r.name,golive:r.golive,phase:r.phase,totalSlots:relTotalSlots,filledSlots:relFilledSlots,fillPct:relTotalSlots?Math.round(relFilledSlots/relTotalSlots*100):0,totalResources:relResources.size,projectCount:projCount});
  });

  const people=Object.values(personMap);
  const totalUnique=people.length;
  const overAllocated=people.filter(p=>p.projIds.size>=3).length;
  const crossRelease=people.filter(p=>p.relIds.size>=2).length;
  const totalGaps=projectGaps.length;
  projectGaps.sort((a,b)=>b.missingCount-a.missingCount);

  return{personMap,people,projectGaps,releaseStats,summary:{totalUnique,overAllocated,crossRelease,totalGaps}};
}

function renderOcmWorkloadBalance(){
  const sec=document.getElementById('people-cap-sec');if(!sec)return;
  const data=collectOcmWorkloadData();
  renderOcmWklSummary(data);
  renderOcmWklRoster(data);
  renderOcmWklReleaseComparison(data);
  renderOcmWklCrossRelease(data);
  // Header stat — shown on combined People & Capacity toggle
  const statEl=document.getElementById('people-cap-stat');
  if(statEl){
    const parts=[];
    if(data.summary.totalGaps)parts.push(data.summary.totalGaps+' gap'+(data.summary.totalGaps!==1?'s':''));
    if(data.summary.crossRelease)parts.push(data.summary.crossRelease+' cross-release');
    if(data.summary.overAllocated)parts.push(data.summary.overAllocated+' over-allocated');
    if(!parts.length)parts.push('All balanced');
    statEl.textContent=parts.join(' · ');
  }
}

function renderOcmWklSummary(data){
  const el=document.getElementById('wkl-summary-strip');if(!el)return;
  const s=data.summary;
  el.innerHTML=`<div class="sat-alert-strip">
    <div class="sat-alert-item"><span class="sat-alert-val">${s.totalUnique}</span><span class="sat-alert-lbl">Total OCM Resources</span></div>
    <div class="sat-alert-item"><span class="sat-alert-val${s.overAllocated?' sev-crit':''}">${s.overAllocated}</span><span class="sat-alert-lbl">Over-Allocated (3+)</span></div>
    <div class="sat-alert-item"><span class="sat-alert-val${s.crossRelease?' sev-high':''}">${s.crossRelease}</span><span class="sat-alert-lbl">Cross-Release Overlap</span></div>
    <div class="sat-alert-item"${data.projectGaps.length?` style="cursor:pointer" onclick="openRelease(${data.projectGaps[0].relId})" title="Go to ${esc(data.projectGaps[0].relName)}"`:''}>
      <span class="sat-alert-val${s.totalGaps?' sev-crit':''}">${s.totalGaps}</span><span class="sat-alert-lbl">Projects w/ Gaps</span></div>
  </div>`;
}

function renderOcmWklRoster(data){
  const el=document.getElementById('wkl-roster');if(!el)return;
  if(!data.people.length){el.innerHTML='<div class="wkl-empty">No OCM resources assigned across portfolio. Assign team members in individual projects to see workload distribution here.</div>';return;}
  // Bucket people by utilization level
  const heavy=[],active=[],available=[];
  data.people.forEach(person=>{
    const pc=person.projIds.size;
    if(pc>=3)heavy.push(person);
    else if(pc===2)active.push(person);
    else available.push(person);
  });
  [heavy,active,available].forEach(arr=>arr.sort((a,b)=>b.projIds.size-a.projIds.size||a.name.localeCompare(b.name)));

  function renderPersonRow(person){
    const projGroups={};
    person.assignments.forEach(a=>{
      if(!projGroups[a.projId])projGroups[a.projId]={projName:a.projName,relName:a.relName,relId:a.relId,projId:a.projId,roles:[]};
      projGroups[a.projId].roles.push(a.roleAbbr);
    });
    const projs=Object.values(projGroups);
    let r='<div class="wkl-roster-row">';
    r+='<div class="wkl-roster-name">'+esc(person.name)+'</div>';
    r+='<div class="wkl-roster-tags">';
    projs.forEach(pr=>{
      const roles=pr.roles.join(' + ');
      const showRel=releases.length>1;
      r+='<span class="wkl-roster-tag" title="'+esc(pr.relName)+' → '+esc(pr.projName)+'" onclick="openResourceInProject('+pr.relId+','+pr.projId+')">'+(showRel?'<span class="wkl-roster-rel">'+esc(pr.relName)+'</span> ':'')+esc(pr.projName)+' <span class="wkl-roster-role">'+esc(roles)+'</span></span>';
    });
    r+='</div></div>';
    return r;
  }

  function renderGroup(label,badgeCls,people,collapsed){
    if(!people.length)return '';
    let g='<details class="wkl-roster-group"'+(collapsed?'':' open')+'>';
    g+='<summary class="wkl-roster-grp-hdr '+badgeCls+'">';
    g+='<span class="wkl-roster-grp-label">'+label+'</span>';
    g+='<span class="wkl-roster-grp-count">'+people.length+'</span>';
    g+='</summary>';
    g+='<div class="wkl-roster-grp-body">';
    people.forEach(p=>{g+=renderPersonRow(p);});
    g+='</div></details>';
    return g;
  }

  let h='';
  h+=renderGroup('Over-Allocated — 3+ Projects','wkl-grp-heavy',heavy,false);
  h+=renderGroup('Multi-Project — 2 Projects','wkl-grp-active',active,false);
  h+=renderGroup('Single Project','wkl-grp-available',available,heavy.length>0||active.length>0);
  el.innerHTML=h;
}

function renderOcmWklReleaseComparison(data){
  const el=document.getElementById('wkl-rel-compare');if(!el)return;
  if(!data.releaseStats.length){el.innerHTML='<div class="wkl-empty">No releases found.</div>';return;}
  // For each release, compute per-role fill rates
  let h='';
  data.releaseStats.forEach(rs=>{
    // Count projects with train assigned and impl assigned
    const rel=releases.find(r=>r.id===rs.relId);if(!rel)return;
    const projs=rel.projects||[];
    const trainFilled=projs.filter(p=>(p.resources?.ocm_train||[]).some(r=>(r.name||'').trim())).length;
    const implFilled=projs.filter(p=>(p.resources?.ocm_impl||[]).some(r=>(r.name||'').trim())).length;
    const trainPct=projs.length?Math.round(trainFilled/projs.length*100):0;
    const implPct=projs.length?Math.round(implFilled/projs.length*100):0;
    const avgPct=Math.round((trainPct+implPct)/2);
    const statusClass=avgPct>=75?'sev-low':avgPct>=50?'sev-high':'sev-crit';
    const statusLabel=avgPct>=75?'Balanced':avgPct>=50?'Moderate':'Under-resourced';
    h+=`<div class="wkl-rel-row">
      <div class="wkl-rel-name">${esc(rs.relName)}</div>
      <div class="wkl-rel-bars">
        <div class="wkl-bar-row">
          <span class="wkl-bar-label">Training</span>
          <div class="wkl-bar-wrap"><div class="wkl-bar-fill wkl-bar-fill-train" style="width:${trainPct}%"></div></div>
          <span class="wkl-rel-pct">${trainPct}%</span>
        </div>
        <div class="wkl-bar-row">
          <span class="wkl-bar-label">Implementation</span>
          <div class="wkl-bar-wrap"><div class="wkl-bar-fill wkl-bar-fill-impl" style="width:${implPct}%"></div></div>
          <span class="wkl-rel-pct">${implPct}%</span>
        </div>
      </div>
      <div class="wkl-rel-meta">${rs.totalResources} resource${rs.totalResources!==1?'s':''} · ${rs.projectCount} project${rs.projectCount!==1?'s':''}</div>
      <div class="wkl-rel-status"><span class="sev-badge ${statusClass}">${statusLabel}</span></div>
    </div>`;
  });
  el.innerHTML=h;
}

function renderOcmWklCrossRelease(data){
  const el=document.getElementById('wkl-cross-rel');if(!el)return;
  const sec=document.getElementById('wkl-cross-rel-sec');
  const crossPeople=data.people.filter(p=>p.relIds.size>=2).sort((a,b)=>b.relIds.size-a.relIds.size||a.name.localeCompare(b.name));
  if(!crossPeople.length){el.innerHTML='';if(sec)sec.style.display='none';return;}
  if(sec)sec.style.display='';
  // Get unique releases for columns
  const relCols=[];const relSet=new Set();
  releases.forEach(r=>{if(!relSet.has(r.id)){relSet.add(r.id);relCols.push({id:r.id,name:r.name,golive:r.golive});}});
  let h='<div class="phm-scroll"><table class="wkl-cr-tbl"><thead><tr><th>Resource</th><th>Releases</th>';
  relCols.forEach(rc=>{h+='<th title="'+esc(rc.name)+'">'+esc(rc.name.length>18?rc.name.substring(0,17)+'…':rc.name)+'</th>';});
  h+='</tr></thead><tbody>';
  crossPeople.forEach(person=>{
    h+='<tr><td class="wkl-cr-name">'+esc(person.name)+'</td>';
    h+='<td><span class="sat-count-badge '+(person.relIds.size>=3?'sat-high':'sat-mod')+'">'+person.relIds.size+'</span></td>';
    relCols.forEach(rc=>{
      const matches=person.assignments.filter(a=>a.relId===rc.id);
      if(matches.length){
        const projNames=[...new Set(matches.map(m=>m.projName))];
        const roles=[...new Set(matches.map(m=>m.roleAbbr))].join(', ');
        // Check for go-live conflict (releases within 30 days of each other)
        let conflict=false;
        if(person.relIds.size>=2&&rc.golive){
          const thisDate=new Date(rc.golive);
          person.assignments.filter(a=>a.relId!==rc.id&&a.relGoLive).forEach(a=>{
            const otherDate=new Date(a.relGoLive);
            if(Math.abs(thisDate-otherDate)<30*86400000)conflict=true;
          });
        }
        h+='<td class="wkl-cr-projs">'+projNames.map(n=>esc(n)).join(', ')+' <span style="color:var(--ink-35)">('+roles+')</span>'+(conflict?'<span class="wkl-cr-conflict">GO-LIVE OVERLAP</span>':'')+'</td>';
      }else{
        h+='<td class="sat-cell-empty" style="color:var(--ink-35)">—</td>';
      }
    });
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  el.innerHTML=h;
}

// ════════════════════════════════════════════════════════
// FEATURE: AI-POWERED SATURATION FORECAST
// ════════════════════════════════════════════════════════
const SAT_FORECAST_URL='https://yufehucjvviwanbulcok.supabase.co/functions/v1/saturation-forecast';
let _sfCurrentMode='forecast';
window._sfCache=null;
window._sfWhatIfCache=null;
window._sfSeqCache=null;

function switchPeopleCapTab(tab){
  const tabs=['workload','saturation'];
  tabs.forEach(t=>{
    const panel=document.getElementById('pctab-'+t);
    const btn=document.getElementById('pctab-btn-'+t);
    if(panel)panel.style.display=t===tab?'block':'none';
    if(btn){btn.classList.toggle('pc-tab-active',t===tab);}
  });
}

function switchSFMode(mode){
  _sfCurrentMode=mode;
  ['forecast','whatif','sequencing'].forEach(m=>{
    const panel=document.getElementById('sf-'+m+'-panel');
    const btn=document.getElementById('sf-btn-'+m);
    if(panel)panel.style.display=m===mode?'block':'none';
    if(btn){btn.classList.toggle('sf-mode-active',m===mode);}
  });
  // Auto-populate What If controls or Sequencing on first switch
  if(mode==='whatif'){renderWhatIfControls();}
  if(mode==='sequencing'&&!window._sfSeqCache){renderSequencingEmpty();}
  else if(mode==='sequencing'&&window._sfSeqCache){renderSequencingResult(window._sfSeqCache);}
}

function collectSaturationData(){
  const groupMap={};
  const projectList=[];
  releases.forEach(r=>{
    (r.projects||[]).forEach(p=>{
      const golive=p.golive||r.golive||'';
      const projEntry={id:p.id,name:p.name,release:r.name,golive,adoptionScore:null};
      // Compute project-level adoption
      if(p.stakeholders?.length){
        const scores=p.stakeholders.map(sh=>adoptScore(sh.factors)).filter(s=>s!==null);
        projEntry.adoptionScore=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
      }
      projectList.push(projEntry);
      (p.stakeholders||[]).forEach(sh=>{
        const norm=sh.name.trim().toLowerCase();
        if(!groupMap[norm])groupMap[norm]={name:sh.name,projects:[]};
        groupMap[norm].projects.push({projectId:p.id,projectName:p.name,release:r.name,golive,adoptionScore:adoptScore(sh.factors),impactLevel:null});
      });
      (p.impactAssessment?.groups||[]).forEach(ig=>{
        const norm=ig.name.trim().toLowerCase();
        if(!groupMap[norm])groupMap[norm]={name:ig.name,projects:[]};
        const existing=groupMap[norm].projects.find(x=>x.projectId===p.id);
        if(existing){existing.impactLevel=ig.level;}
        else{groupMap[norm].projects.push({projectId:p.id,projectName:p.name,release:r.name,golive,adoptionScore:null,impactLevel:ig.level});}
      });
    });
  });
  // Only include saturated groups (2+)
  const saturatedGroups=Object.values(groupMap).filter(g=>g.projects.length>=2).sort((a,b)=>b.projects.length-a.projects.length);
  return{groups:saturatedGroups,projects:projectList};
}

async function runSaturationForecast(){
  const el=document.getElementById('sf-forecast-content');if(!el)return;
  el.innerHTML='<div class="sf-loading"><div class="sf-spinner"></div><div>Analyzing saturation patterns and forecasting change load…</div></div>';
  try{
    const satData=collectSaturationData();
    const response=await fetch(SAT_FORECAST_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+TRAJ_ANON_KEY},
      body:JSON.stringify({saturationData:satData,mode:'forecast'})
    });
    if(!response.ok){const err=await response.text();throw new Error(err);}
    const result=await response.json();
    if(result.error)throw new Error(result.error);
    window._sfCache=result;
    renderSFForecastResult(result);
    // Feed to recommendations
    feedSaturationToRecommendations(result);
  }catch(err){
    console.error('Saturation forecast error:',err);
    el.innerHTML='<div class="sf-empty-state"><div style="color:var(--red-bright);font-size:12px;margin-bottom:12px">Analysis failed: '+esc(err.message)+'</div><button class="sf-analyze-btn" onclick="runSaturationForecast()">Retry</button></div>';
  }
}

function feedSaturationToRecommendations(result){
  if(!result?.portfolioRisk)return;
  // Store for smart recommendations engine
  window._saturationForecastSummary={
    overallSaturation:result.portfolioRisk.overallSaturation,
    peakPeriod:result.portfolioRisk.peakPeriod,
    criticalGroups:result.portfolioRisk.criticalGroups,
    summary:result.portfolioRisk.summary
  };
}

function renderSFForecastResult(result){
  const el=document.getElementById('sf-forecast-content');if(!el)return;
  const forecast=result.forecast||[];
  const risk=result.portfolioRisk||{};
  const months=result.timelineMonths||[];

  let h='';
  // Risk strip
  const satColor=risk.overallSaturation==='critical'?'#b83232':risk.overallSaturation==='high'?'#d97706':risk.overallSaturation==='moderate'?'#2563eb':'#16a34a';
  h+='<div class="sf-risk-strip">';
  h+='<div class="sf-risk-item"><span class="sf-risk-val" style="color:'+satColor+'">'+esc(risk.overallSaturation||'—')+'</span><span class="sf-risk-lbl">Portfolio Saturation</span></div>';
  h+='<div class="sf-risk-item"><span class="sf-risk-val">'+esc(risk.peakPeriod||'—')+'</span><span class="sf-risk-lbl">Peak Period</span></div>';
  h+='<div class="sf-risk-item"><span class="sf-risk-val" style="color:var(--red-bright)">'+(risk.criticalGroups||0)+'</span><span class="sf-risk-lbl">Critical Groups</span></div>';
  h+='<div style="flex:1;min-width:200px;font-size:12px;color:var(--ink);line-height:1.5;align-self:center">'+esc(risk.summary||'')+'</div>';
  h+='</div>';

  // Heatmap table
  if(forecast.length&&months.length){
    h+='<div class="sf-heatmap-wrap"><table class="sf-heatmap"><thead><tr><th style="text-align:left">Stakeholder Group</th><th>Risk</th>';
    months.forEach(m=>{
      const d=new Date(m+'-01');
      const label=d.toLocaleDateString('en-US',{month:'short',year:'2-digit'});
      h+='<th>'+label+'</th>';
    });
    h+='</tr></thead><tbody>';
    forecast.forEach(g=>{
      h+='<tr><td class="sf-hm-grp">'+esc(g.group)+'</td>';
      h+='<td><span class="sf-hm-risk '+(g.burnoutRisk||'low')+'">'+esc(g.burnoutRisk||'low')+'</span></td>';
      months.forEach(m=>{
        const mEntry=(g.monthlyLoad||[]).find(x=>x.month===m);
        const intensity=mEntry?mEntry.intensity:0;
        const cellClass='sf-cell-'+Math.min(10,Math.round(intensity*10));
        const tooltip=mEntry?mEntry.activeProjects?.join(', ')||'':'No active changes';
        const label=intensity>=0.8?'●●●':intensity>=0.6?'●●○':intensity>=0.4?'●○○':intensity>=0.2?'○○○':'○';
        h+='<td class="'+cellClass+'" title="'+esc(g.group)+' — '+esc(m)+': '+(intensity*100).toFixed(0)+'% load\n'+esc(tooltip)+'">'+label+'</td>';
      });
      h+='</tr>';
    });
    h+='</tbody></table></div>';
    // Legend
    h+='<div class="sf-legend"><span class="sf-legend-label">Low</span><div class="sf-legend-bar">';
    for(let i=0;i<=10;i++){
      const colors=['rgba(22,163,106,0.08)','rgba(22,163,106,0.2)','rgba(22,163,106,0.35)','rgba(234,179,8,0.25)','rgba(234,179,8,0.4)','rgba(217,119,6,0.35)','rgba(217,119,6,0.5)','rgba(220,38,38,0.3)','rgba(220,38,38,0.45)','rgba(220,38,38,0.6)','rgba(153,27,27,0.7)'];
      h+='<div class="sf-legend-seg" style="background:'+colors[i]+'"></div>';
    }
    h+='</div><span class="sf-legend-label">Critical</span></div>';
  }

  // Group detail cards
  h+='<div class="sf-group-cards">';
  forecast.forEach(g=>{
    const riskCls='risk-'+(g.burnoutRisk||'low');
    h+='<div class="sf-group-card '+riskCls+'">';
    h+='<div class="sf-gc-name">'+esc(g.group)+'</div>';
    h+='<div class="sf-gc-meta"><span>'+g.projectCount+' projects</span><span>Peak: '+esc(g.peakMonth||'—')+'</span><span>Intensity: '+esc(g.peakIntensity||'—')+'</span></div>';
    h+='<div class="sf-gc-rec">'+esc(g.recommendation||'')+'</div>';
    h+='</div>';
  });
  h+='</div>';

  // Re-analyze button
  h+='<div style="text-align:center;margin-top:16px"><button class="sf-analyze-btn" onclick="runSaturationForecast()">Re-Analyze</button></div>';
  el.innerHTML=h;
}

// ── What If Mode ──
function renderWhatIfControls(){
  const el=document.getElementById('sf-whatif-content');if(!el)return;
  const allProjs=[];
  releases.forEach(r=>{
    (r.projects||[]).forEach(p=>{
      if(p.golive||r.golive){
        allProjs.push({id:p.id,name:p.name,release:r.name,golive:p.golive||r.golive});
      }
    });
  });
  if(!allProjs.length){
    el.innerHTML='<div class="sf-empty-state"><div style="font-size:12px;color:var(--ink-60)">No projects with go-live dates found. Add go-live dates to use What If mode.</div></div>';
    return;
  }
  // Check for cached result
  if(window._sfWhatIfCache){renderWhatIfResult(window._sfWhatIfCache,allProjs);return;}

  let h='<div style="font-size:12px;color:var(--ink-60);margin-bottom:12px">Adjust go-live dates to see how changes affect stakeholder saturation:</div>';
  h+='<div class="sf-whatif-controls" id="sf-wi-controls">';
  allProjs.forEach(pr=>{
    h+='<div class="sf-wi-project" data-proj-id="'+pr.id+'">';
    h+='<div class="sf-wi-name">'+esc(pr.name)+'</div>';
    h+='<div class="sf-wi-orig">Original: '+fmtDate(pr.golive)+'</div>';
    h+='<input type="date" class="sf-wi-date" id="sf-wi-date-'+pr.id+'" value="'+pr.golive+'" onchange="updateWhatIfDelta(\''+pr.id+'\',\''+pr.golive+'\')">';
    h+='<span class="sf-wi-delta same" id="sf-wi-delta-'+pr.id+'">No change</span>';
    h+='</div>';
  });
  h+='</div>';
  h+='<button class="sf-wi-compare-btn" id="sf-wi-compare" onclick="runWhatIfComparison()">Compare Scenarios</button>';
  el.innerHTML=h;
}

function updateWhatIfDelta(projId,originalDate){
  const input=document.getElementById('sf-wi-date-'+projId);
  const delta=document.getElementById('sf-wi-delta-'+projId);
  if(!input||!delta)return;
  const orig=new Date(originalDate);
  const adj=new Date(input.value);
  const diffDays=Math.round((adj-orig)/(1000*60*60*24));
  if(diffDays===0){delta.className='sf-wi-delta same';delta.textContent='No change';}
  else if(diffDays<0){delta.className='sf-wi-delta earlier';delta.textContent=Math.abs(diffDays)+'d earlier';}
  else{delta.className='sf-wi-delta later';delta.textContent=diffDays+'d later';}
}

async function runWhatIfComparison(){
  const btn=document.getElementById('sf-wi-compare');
  if(btn){btn.disabled=true;btn.textContent='Analyzing…';}
  const el=document.getElementById('sf-whatif-content');

  // Collect adjusted dates
  const original=collectSaturationData();
  const adjusted={groups:[],projects:[]};
  releases.forEach(r=>{
    (r.projects||[]).forEach(p=>{
      const dateInput=document.getElementById('sf-wi-date-'+p.id);
      const newGolive=dateInput?dateInput.value:(p.golive||r.golive||'');
      adjusted.projects.push({id:p.id,name:p.name,release:r.name,golive:newGolive});
    });
  });
  // Rebuild groups with adjusted dates
  const groupMap={};
  releases.forEach(r=>{
    (r.projects||[]).forEach(p=>{
      const dateInput=document.getElementById('sf-wi-date-'+p.id);
      const newGolive=dateInput?dateInput.value:(p.golive||r.golive||'');
      (p.stakeholders||[]).forEach(sh=>{
        const norm=sh.name.trim().toLowerCase();
        if(!groupMap[norm])groupMap[norm]={name:sh.name,projects:[]};
        groupMap[norm].projects.push({projectId:p.id,projectName:p.name,release:r.name,golive:newGolive,adoptionScore:adoptScore(sh.factors)});
      });
    });
  });
  adjusted.groups=Object.values(groupMap).filter(g=>g.projects.length>=2);

  try{
    const response=await fetch(SAT_FORECAST_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+TRAJ_ANON_KEY},
      body:JSON.stringify({saturationData:{original,adjusted},mode:'whatif'})
    });
    if(!response.ok){const err=await response.text();throw new Error(err);}
    const result=await response.json();
    if(result.error)throw new Error(result.error);
    window._sfWhatIfCache=result;
    const allProjs=[];
    releases.forEach(r=>(r.projects||[]).forEach(p=>{if(p.golive||r.golive)allProjs.push({id:p.id,name:p.name,release:r.name,golive:p.golive||r.golive});}));
    renderWhatIfResult(result,allProjs);
  }catch(err){
    console.error('What If error:',err);
    if(el){
      const existingControls=el.querySelector('.sf-whatif-controls');
      if(!existingControls)renderWhatIfControls();
      const errDiv=document.createElement('div');
      errDiv.style.cssText='color:var(--red-bright);font-size:12px;margin-top:12px';
      errDiv.textContent='Analysis failed: '+err.message;
      el.appendChild(errDiv);
    }
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Compare Scenarios';}
  }
}

function renderWhatIfResult(result,allProjs){
  const el=document.getElementById('sf-whatif-content');if(!el)return;
  const comp=result.comparison||{};
  const forecast=result.adjustedForecast||[];
  const months=result.timelineMonths||[];

  let h='<div style="font-size:12px;color:var(--ink-60);margin-bottom:12px">Adjust go-live dates and re-compare:</div>';
  h+='<div class="sf-whatif-controls" id="sf-wi-controls">';
  allProjs.forEach(pr=>{
    const dateInput=document.getElementById('sf-wi-date-'+pr.id);
    const currentVal=dateInput?dateInput.value:pr.golive;
    const orig=new Date(pr.golive);const adj=new Date(currentVal);
    const diffDays=Math.round((adj-orig)/(1000*60*60*24));
    const deltaCls=diffDays===0?'same':diffDays<0?'earlier':'later';
    const deltaText=diffDays===0?'No change':diffDays<0?Math.abs(diffDays)+'d earlier':diffDays+'d later';
    h+='<div class="sf-wi-project" data-proj-id="'+pr.id+'">';
    h+='<div class="sf-wi-name">'+esc(pr.name)+'</div>';
    h+='<div class="sf-wi-orig">Original: '+fmtDate(pr.golive)+'</div>';
    h+='<input type="date" class="sf-wi-date" id="sf-wi-date-'+pr.id+'" value="'+currentVal+'" onchange="updateWhatIfDelta(\''+pr.id+'\',\''+pr.golive+'\')">';
    h+='<span class="sf-wi-delta '+deltaCls+'" id="sf-wi-delta-'+pr.id+'">'+deltaText+'</span>';
    h+='</div>';
  });
  h+='</div>';
  h+='<button class="sf-wi-compare-btn" id="sf-wi-compare" onclick="runWhatIfComparison()">Re-Compare</button>';

  // Verdict banner
  const verdictIcon=comp.verdict==='recommended'?'<i class="ph ph-check"></i>':comp.verdict==='neutral'?'<i class="ph ph-minus-circle"></i>':'<i class="ph ph-x"></i>';
  const verdictLabel=comp.verdict==='recommended'?'Recommended Change':comp.verdict==='not_recommended'?'Not Recommended':'Neutral Impact';
  h+='<div class="sf-wi-verdict '+(comp.verdict||'neutral')+'"><span style="font-size:18px;margin-right:6px">'+verdictIcon+'</span>'+verdictLabel+'</div>';

  // Comparison metrics
  h+='<div class="sf-wi-metrics">';
  h+='<div class="sf-wi-metric"><span class="sf-wi-metric-val">'+(comp.originalPeakLoad?Math.round(comp.originalPeakLoad*100)+'%':'—')+'</span><span class="sf-wi-metric-lbl">Original Peak Load</span></div>';
  h+='<div class="sf-wi-metric"><span class="sf-wi-metric-val" style="color:'+(comp.adjustedPeakLoad<comp.originalPeakLoad?'var(--green-vivid)':'var(--red-bright)')+'">'+(comp.adjustedPeakLoad?Math.round(comp.adjustedPeakLoad*100)+'%':'—')+'</span><span class="sf-wi-metric-lbl">Adjusted Peak Load</span></div>';
  h+='<div class="sf-wi-metric"><span class="sf-wi-metric-val" style="color:var(--gold)">'+esc(comp.improvement||'—')+'</span><span class="sf-wi-metric-lbl">Improvement</span></div>';
  h+='<div class="sf-wi-metric"><span class="sf-wi-metric-val">'+comp.originalCriticalMonths+' → '+comp.adjustedCriticalMonths+'</span><span class="sf-wi-metric-lbl">Critical Months</span></div>';
  h+='</div>';

  // Summary
  if(result.summary){
    h+='<div style="font-size:12px;color:var(--ink);line-height:1.6;margin-bottom:12px;padding:10px 14px;background:var(--surface);border-radius:var(--r6)">'+esc(result.summary)+'</div>';
  }

  // Adjusted forecast per group
  if(forecast.length){
    h+='<div class="sf-group-cards">';
    forecast.forEach(g=>{
      const riskCls='risk-'+(g.burnoutRisk||'low');
      h+='<div class="sf-group-card '+riskCls+'">';
      h+='<div class="sf-gc-name">'+esc(g.group)+'</div>';
      h+='<div class="sf-gc-meta"><span>Risk: '+esc(g.burnoutRisk||'—')+'</span></div>';
      if(g.improvement){h+='<div class="sf-gc-rec">'+esc(g.improvement)+'</div>';}
      h+='</div>';
    });
    h+='</div>';
  }
  el.innerHTML=h;
}

// ── Sequencing Mode ──
function renderSequencingEmpty(){
  const el=document.getElementById('sf-sequencing-content');if(!el)return;
  el.innerHTML='<div class="sf-empty-state"><div style="font-size:28px;margin-bottom:8px">🔄</div><div class="sf-title" style="font-size:13px;margin-bottom:4px">AI Sequencing Recommendations</div><div style="font-size:11px;color:var(--ink-60);margin-bottom:12px">Get AI-powered suggestions for optimal project sequencing to minimize change fatigue</div><button class="sf-analyze-btn" onclick="runSequencingAnalysis()">Get Recommendations</button></div>';
}

async function runSequencingAnalysis(){
  const el=document.getElementById('sf-sequencing-content');if(!el)return;
  el.innerHTML='<div class="sf-loading"><div class="sf-spinner"></div><div>Analyzing optimal sequencing strategy…</div></div>';
  try{
    const satData=collectSaturationData();
    const response=await fetch(SAT_FORECAST_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+TRAJ_ANON_KEY},
      body:JSON.stringify({saturationData:satData,mode:'sequencing'})
    });
    if(!response.ok){const err=await response.text();throw new Error(err);}
    const result=await response.json();
    if(result.error)throw new Error(result.error);
    window._sfSeqCache=result;
    renderSequencingResult(result);
  }catch(err){
    console.error('Sequencing error:',err);
    el.innerHTML='<div class="sf-empty-state"><div style="color:var(--red-bright);font-size:12px;margin-bottom:12px">Analysis failed: '+esc(err.message)+'</div><button class="sf-analyze-btn" onclick="runSequencingAnalysis()">Retry</button></div>';
  }
}

function renderSequencingResult(result){
  const el=document.getElementById('sf-sequencing-content');if(!el)return;
  const recs=result.recommendations||[];
  const sequence=result.optimalSequence||[];
  let h='';

  // Summary
  if(result.summary){
    h+='<div class="sf-seq-summary">'+esc(result.summary)+'</div>';
  }

  // Recommendation cards
  if(recs.length){
    h+='<div class="sf-seq-list">';
    recs.forEach((r,i)=>{
      h+='<div class="sf-seq-item">';
      h+='<div class="sf-seq-priority">'+(i+1)+'</div>';
      h+='<div class="sf-seq-body">';
      h+='<div class="sf-seq-action">'+esc(r.action)+'</div>';
      h+='<div class="sf-seq-detail">'+esc(r.detail)+'</div>';
      h+='<div class="sf-seq-tags">';
      if(r.type)h+='<span class="sf-seq-tag type-'+r.type+'">'+esc(r.type)+'</span>';
      if(r.impact)h+='<span class="sf-seq-tag impact-'+r.impact+'">'+esc(r.impact)+' impact</span>';
      if(r.affectedProjects?.length){h+='<span class="sf-seq-tag" style="background:rgba(12,31,63,0.08);color:var(--navy)">'+r.affectedProjects.map(esc).join(', ')+'</span>';}
      h+='</div></div></div>';
    });
    h+='</div>';
  }

  // Optimal sequence timeline
  if(sequence.length){
    h+='<div class="sf-seq-timeline"><div class="sf-seq-timeline-title">Suggested Timeline Adjustments</div>';
    sequence.forEach(s=>{
      h+='<div class="sf-seq-tl-item">';
      h+='<div class="sf-seq-tl-proj">'+esc(s.project)+'</div>';
      h+='<div class="sf-seq-tl-dates"><span>'+fmtDate(s.originalGolive)+'</span><span class="sf-seq-tl-arrow">→</span><span class="sf-seq-tl-new">'+fmtDate(s.suggestedGolive)+'</span></div>';
      h+='<div class="sf-seq-tl-reason">'+esc(s.reason||'')+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }

  // Re-analyze
  h+='<div style="text-align:center;margin-top:16px"><button class="sf-analyze-btn" onclick="runSequencingAnalysis()">Re-Analyze</button></div>';
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
          h+='<div class="pl-trend '+cls+'">'+(delta>=0?'<i class="ph ph-arrow-up"></i>':'<i class="ph ph-arrow-down"></i>')+' '+Math.abs(delta)+'% vs pre-launch prediction</div>';
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
  if(fw.dims.length>=10){showSuccess('Maximum 10 dimensions reached.');return;}
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
        const arrow=g.diff>0.5?'<i class="ph ph-arrow-down"></i>':g.diff<-0.5?'<i class="ph ph-arrow-up"></i>':'<i class="ph ph-minus"></i>';
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

  // ── AI Insights Panel ──
  const totalTextResponses=shs.reduce((a,sh)=>{
    const r=p.pulseResults[sh.id];
    return a+((r?.textResponses||[]).filter(t=>t.concerns||t.prepared).length);
  },0);
  if(totalTextResponses>0||hasAnyResults){
    h+='<div class="pulse-ai-panel" id="pulse-ai-panel">';
    h+='<div class="pulse-ai-hdr" onclick="togglePulseAI()">';
    h+='<h3><span class="ai-sparkle"><i class="ph ph-sparkle"></i></span> AI Pulse Insights</h3>';
    h+='<div class="pulse-ai-acts">';
    const cached=p._pulseInsightsCache;
    if(cached?.timestamp){h+='<span class="pulse-ai-meta">Analyzed '+fmtDate(cached.timestamp.split('T')[0])+'</span>';}
    h+='<button class="pulse-ai-refresh" onclick="event.stopPropagation();refreshPulseInsights()" id="pulse-ai-refresh-btn"'+(totalTextResponses===0?' disabled title="Need text responses to analyze"':'')+'>'+(!cached?'Analyze':'Re-analyze')+'</button>';
    h+='</div></div>';
    h+='<div class="pulse-ai-body" id="pulse-ai-body" style="'+(cached?'':'display:none')+'">';
    if(cached){
      h+=renderPulseInsightsHTML(cached);
    }else if(totalTextResponses>0){
      h+='<div style="text-align:center;padding:20px;color:var(--ink-60);font-size:11px">Click <strong>Analyze</strong> to run AI-powered analysis on '+totalTextResponses+' open-ended responses.</div>';
    }else{
      h+='<div style="text-align:center;padding:20px;color:var(--ink-60);font-size:11px">No open-ended responses to analyze yet. Responses will appear as stakeholders complete surveys.</div>';
    }
    h+='</div></div>';
  }

  el.innerHTML=h;
}
// Sample open-ended responses for demo data generation
const DEMO_CONCERNS=[
  "I'm worried the new system won't handle our edge cases. We've built workarounds over years that just work.",
  "The timeline feels extremely aggressive. We barely finished the last migration and now this?",
  "Nobody has explained how this affects my day-to-day. I keep hearing about 'transformation' but what does that mean for my role?",
  "I've seen three of these initiatives in two years. None of them stuck. Why should I invest energy this time?",
  "My manager doesn't seem to understand the new process either. How can they support us?",
  "Training was too short. One 2-hour session for a completely new workflow is not realistic.",
  "The communication has been confusing — different messages from leadership vs. project team.",
  "I'm concerned about job security. If the system automates half our tasks, what happens to us?",
  "We weren't consulted during the design phase. Now we're told to adopt something that doesn't fit our workflow.",
  "The pilot group had major issues. Why are we rolling out to everyone before those are fixed?",
  "I actually think this could be great if done right. The current system is painful.",
  "Our team is stretched thin already. Adding change on top of our current workload is a recipe for burnout.",
  "The executive sponsor hasn't been visible. It feels like this is a pet project, not a real priority.",
  "I don't understand the urgency. The current system works fine for what I do.",
  "Honestly I'm just going to wait and see. Not going to learn something that might get scrapped in 6 months.",
  "Data migration concerns me most. If we lose historical records, compliance will be a nightmare.",
  "The vendor demos looked good but our environment is way more complex. I doubt it'll be that smooth.",
  "I appreciate the transparency from the project team. The town halls have been helpful.",
  "Can we get more hands-on practice time? Videos and docs aren't enough for something this complex.",
  "I'm excited about the new capabilities but nervous about the transition period."
];
const DEMO_PREPARED=[
  "More hands-on training with realistic scenarios from our actual work, not generic examples.",
  "Regular updates from leadership about what's changing and why, not just email blasts.",
  "A dedicated go-to person for questions during the transition — not just a help desk ticket.",
  "Seeing the pilot team's honest feedback and how issues were actually resolved.",
  "Having my manager walk me through exactly how my role changes step by step.",
  "Extended parallel running period so we can fall back if something goes wrong.",
  "More time. This is being rushed and we need breathing room to learn properly.",
  "Clear documentation of the new processes — not just system training but process training.",
  "Understanding the 'why' better. I get that leadership wants this but I need to understand the benefits for our team.",
  "Job security assurance. Hard to focus on learning when you're worried about being made redundant.",
  "Access to a sandbox environment where I can practice without fear of breaking things.",
  "Peer learning sessions with people who've already made the switch successfully.",
  "Honest communication about what's not working yet, instead of just cheerleading.",
  "Reduced workload during transition — we can't do our old job AND learn a new system at 100%.",
  "Executive sponsorship that's more than a name on a slide. We need visible, active support."
];

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
    const numResp=Math.floor(Math.random()*12)+8;
    // Generate open-ended text responses
    const textResponses=[];
    for(let i=0;i<numResp;i++){
      textResponses.push({
        concerns:DEMO_CONCERNS[Math.floor(Math.random()*DEMO_CONCERNS.length)],
        prepared:DEMO_PREPARED[Math.floor(Math.random()*DEMO_PREPARED.length)]
      });
    }
    p.pulseResults[sh.id]={responses:numResp,scores,textResponses};
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
        // Collect text responses
        const textResponses=responses.filter(r=>r.concerns||r.prepared).map(r=>({concerns:r.concerns||'',prepared:r.prepared||''}));
        if(!p.pulseResults)p.pulseResults={};
        const prev=p.pulseResults[sh.id];
        const newCount=responses.length;
        // Only update if count changed (avoid unnecessary saves)
        if(!prev||prev.responses!==newCount){
          p.pulseResults[sh.id]={responses:newCount,scores:avgScores,textResponses};
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
  const numResp=Math.floor(Math.random()*12)+8;
  const textResponses=[];
  for(let i=0;i<numResp;i++){
    textResponses.push({
      concerns:DEMO_CONCERNS[Math.floor(Math.random()*DEMO_CONCERNS.length)],
      prepared:DEMO_PREPARED[Math.floor(Math.random()*DEMO_PREPARED.length)]
    });
  }
  p.pulseResults[shId]={responses:numResp,scores,textResponses};
  touch('proj');schedSave();renderPPulse();
}

// ════════════════════════════════════════════════════════
// PULSE AI INSIGHTS ENGINE
// ════════════════════════════════════════════════════════
const PULSE_INSIGHTS_URL='https://yufehucjvviwanbulcok.supabase.co/functions/v1/pulse-insights';

function togglePulseAI(){
  const body=document.getElementById('pulse-ai-body');
  if(body)body.style.display=body.style.display==='none'?'':'none';
}

function collectPulseInsightsData(p){
  const shs=p.stakeholders||[];
  const groups=[];
  shs.forEach(sh=>{
    const results=p.pulseResults?.[sh.id];
    if(!results?.textResponses?.length)return;
    groups.push({
      groupName:sh.name,
      responses:results.textResponses.map(t=>({concerns:t.concerns||'',prepared:t.prepared||''}))
    });
  });
  const allResponses=groups.flatMap(g=>g.responses);
  // Determine round number from history
  const roundNumber=(p._pulseInsightsHistory||[]).length+1;
  const previousAnalysis=(p._pulseInsightsHistory||[]).length>0
    ?p._pulseInsightsHistory[p._pulseInsightsHistory.length-1]
    :null;
  return{responses:allResponses,groups,projectName:p.name,frameworkName:fwName(),roundNumber,previousAnalysis};
}

async function callPulseInsights(data){
  const response=await fetch(PULSE_INSIGHTS_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+TRAJ_ANON_KEY},
    body:JSON.stringify(data)
  });
  if(!response.ok){const err=await response.text();throw new Error('API error: '+err);}
  return response.json();
}

function getPulseInsightsCacheKey(p){
  const shs=p.stakeholders||[];
  let hash='';
  shs.forEach(sh=>{
    const r=p.pulseResults?.[sh.id];
    if(r?.textResponses){hash+=sh.id+':'+r.textResponses.length+';';}
  });
  return hash;
}

async function refreshPulseInsights(){
  const p=getProj();if(!p)return;
  const body=document.getElementById('pulse-ai-body');
  const btn=document.getElementById('pulse-ai-refresh-btn');
  if(!body)return;
  body.style.display='';
  body.innerHTML='<div class="pulse-ai-loading"><div class="spinner"></div><div>Analyzing open-ended responses with AI…</div></div>';
  if(btn){btn.disabled=true;btn.textContent='Analyzing…';}
  try{
    const data=collectPulseInsightsData(p);
    if(!data.responses.length){body.innerHTML='<div style="text-align:center;padding:20px;color:var(--ink-60);font-size:11px">No text responses to analyze.</div>';return;}
    const analysis=await callPulseInsights(data);
    analysis.timestamp=new Date().toISOString();
    analysis._cacheKey=getPulseInsightsCacheKey(p);
    // Save to project cache
    p._pulseInsightsCache=analysis;
    // Save to history for trend comparison
    if(!p._pulseInsightsHistory)p._pulseInsightsHistory=[];
    p._pulseInsightsHistory.push({themes:analysis.themes,resistance_signals:analysis.resistance_signals,timestamp:analysis.timestamp});
    // Feed resistance signals into smart recommendations data
    feedPulseToRecommendations(p,analysis);
    touch('proj');schedSave();
    body.innerHTML=renderPulseInsightsHTML(analysis);
    // Render sentiment chart and trend chart
    setTimeout(()=>{
      renderPulseSentimentChart(analysis);
      if((p._pulseInsightsHistory||[]).length>1)renderPulseTrendChart(p);
    },100);
    if(btn){btn.textContent='Re-analyze';}
  }catch(err){
    console.error('Pulse insights error:',err);
    body.innerHTML='<div style="text-align:center;padding:20px;color:var(--red-bright);font-size:11px">Analysis failed: '+esc(err.message)+'</div>';
  }finally{
    if(btn)btn.disabled=false;
  }
}

function feedPulseToRecommendations(p,analysis){
  // Store pulse insights summary on the project so smart recommendations can reference it
  if(!p._pulseInsightsSummary)p._pulseInsightsSummary={};
  p._pulseInsightsSummary={
    topThemes:(analysis.themes||[]).slice(0,5).map(t=>({theme:t.theme,sentiment:t.sentiment,trend:t.trend,count:t.count})),
    resistanceSignals:(analysis.resistance_signals||[]).map(s=>({signal:s.signal,severity:s.severity,group:s.group,type:s.type})),
    sentimentBreakdown:analysis.sentiment_breakdown||{},
    analyzedAt:analysis.timestamp
  };
}

function renderPulseInsightsHTML(analysis){
  let h='';

  // 1. Summary narrative
  if(analysis.summary){
    h+='<div class="pai-section-hd">Executive Summary</div>';
    h+='<div class="pai-summary">';
    analysis.summary.split(/\n\n+/).forEach(para=>{
      h+='<p>'+esc(para.trim())+'</p>';
    });
    h+='</div>';
  }

  // 2. Sentiment breakdown
  if(analysis.sentiment_breakdown){
    h+='<div class="pai-section-hd">Sentiment Distribution</div>';
    h+='<div class="pai-sentiment">';
    h+='<div class="pai-sentiment-chart"><canvas id="pai-sent-canvas" width="100" height="100"></canvas></div>';
    h+='<div class="pai-sentiment-legend">';
    const sb=analysis.sentiment_breakdown;
    h+='<div class="pai-sentiment-item"><div class="pai-sent-dot pai-sent-pos"></div>Positive: '+(sb.positive||0)+'%</div>';
    h+='<div class="pai-sentiment-item"><div class="pai-sent-dot pai-sent-neu"></div>Neutral: '+(sb.neutral||0)+'%</div>';
    h+='<div class="pai-sentiment-item"><div class="pai-sent-dot pai-sent-neg"></div>Negative: '+(sb.negative||0)+'%</div>';
    h+='<div class="pai-sentiment-item"><div class="pai-sent-dot pai-sent-mix"></div>Mixed: '+(sb.mixed||0)+'%</div>';
    h+='</div></div>';
  }

  // 3. Themes
  if(analysis.themes?.length){
    h+='<div class="pai-section-hd">Top Themes <span style="font-weight:400;font-size:10px;color:var(--ink-60)">('+analysis.themes.length+' identified)</span></div>';
    h+='<div class="pai-themes">';
    analysis.themes.forEach(t=>{
      const trendLabel={new:'<i class="ph ph-circle-fill"></i> New',growing:'<i class="ph ph-arrow-up"></i> Growing',stable:'<i class="ph ph-minus"></i> Stable',declining:'<i class="ph ph-arrow-down"></i> Declining',resolved:'<i class="ph ph-check"></i> Resolved'};
      h+='<div class="pai-theme">';
      h+='<div class="pai-theme-name" title="'+(esc(t.description||''))+'">'+esc(t.theme)+'</div>';
      h+='<div class="pai-theme-count">'+t.count+'×</div>';
      h+='<div class="pai-theme-sent '+(t.sentiment||'neutral')+'">'+esc(t.sentiment||'neutral')+'</div>';
      h+='<div class="pai-theme-trend '+(t.trend||'new')+'">'+esc(trendLabel[t.trend]||t.trend||'new')+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }

  // 4. Resistance signals
  if(analysis.resistance_signals?.length){
    h+='<div class="pai-section-hd"><i class="ph ph-warning"></i> Resistance Signals <span style="font-weight:400;font-size:10px;color:var(--ink-60)">('+analysis.resistance_signals.length+' detected)</span></div>';
    h+='<div class="pai-signals">';
    analysis.resistance_signals.forEach(s=>{
      const typeLabels={active_resistance:'Active Resistance',confusion:'Confusion',disengagement:'Disengagement',fear:'Fear',skepticism:'Skepticism'};
      h+='<div class="pai-signal '+(s.severity||'medium')+'">';
      h+='<div class="pai-signal-top">';
      h+='<span class="pai-signal-sev">'+(s.severity||'medium').toUpperCase()+'</span>';
      h+='<span class="pai-signal-type">'+(typeLabels[s.type]||s.type||'')+'</span>';
      if(s.group)h+='<span class="pai-signal-group">'+esc(s.group)+'</span>';
      h+='</div>';
      h+='<div class="pai-signal-text">'+esc(s.signal)+'</div>';
      if(s.recommendation)h+='<div class="pai-signal-rec">→ '+esc(s.recommendation)+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }

  // 5. Key quotes
  if(analysis.key_quotes?.length){
    h+='<div class="pai-section-hd">Key Quotes <span style="font-weight:400;font-size:10px;color:var(--ink-60)">Representative anonymous responses</span></div>';
    h+='<div class="pai-quotes">';
    analysis.key_quotes.forEach(q=>{
      h+='<div class="pai-quote">';
      h+='<div class="pai-quote-text">'+esc(q.quote)+'</div>';
      h+='<div class="pai-quote-meta">';
      if(q.theme)h+='<span class="pai-quote-theme">'+esc(q.theme)+'</span>';
      if(q.source_group)h+='<span class="pai-quote-group">'+esc(q.source_group)+'</span>';
      if(q.sentiment){
        const cls=q.sentiment==='positive'?'pai-sent-pos':q.sentiment==='negative'?'pai-sent-neg':'pai-sent-neu';
        h+='<span class="pai-sent-dot '+cls+'" title="'+esc(q.sentiment)+'"></span>';
      }
      h+='</div></div>';
    });
    h+='</div>';
  }

  // 6. Trend chart placeholder (for multi-round)
  const p=getProj();
  if(p&&(p._pulseInsightsHistory||[]).length>1){
    h+='<div class="pai-section-hd">Theme Trends Across Rounds</div>';
    h+='<div class="pai-trend-chart"><canvas id="pai-trend-canvas"></canvas></div>';
  }

  // Disclaimer
  h+='<div class="pai-disclaimer">Analysis generated by AI based on anonymous survey responses. Use professional judgment when interpreting results.</div>';

  return h;
}

function renderPulseSentimentChart(analysis){
  const canvas=document.getElementById('pai-sent-canvas');
  if(!canvas||!window.Chart)return;
  const sb=analysis.sentiment_breakdown||{};
  new Chart(canvas,{
    type:'doughnut',
    data:{
      labels:['Positive','Neutral','Negative','Mixed'],
      datasets:[{data:[sb.positive||0,sb.neutral||0,sb.negative||0,sb.mixed||0],
        backgroundColor:['#1d6840','#6366f1','#b83232','#d97706'],
        borderWidth:0,hoverOffset:4}]
    },
    options:{responsive:false,maintainAspectRatio:true,
      plugins:{legend:{display:false},tooltip:{bodyFont:{size:10}}},
      cutout:'60%'
    }
  });
}

function renderPulseTrendChart(p){
  const canvas=document.getElementById('pai-trend-canvas');
  if(!canvas||!window.Chart)return;
  const history=p._pulseInsightsHistory||[];
  if(history.length<2)return;

  // Collect all unique theme names across rounds
  const allThemes=new Set();
  history.forEach(h2=>{(h2.themes||[]).forEach(t=>allThemes.add(t.theme));});
  const themeNames=[...allThemes].slice(0,6);// Top 6 themes

  const colors=['#b8922a','#6366f1','#b83232','#1d6840','#d97706','#0ea5e9'];
  const datasets=themeNames.map((name,i)=>({
    label:name,
    data:history.map(h2=>{const t=(h2.themes||[]).find(th=>th.theme===name);return t?t.count:0;}),
    borderColor:colors[i%colors.length],
    backgroundColor:colors[i%colors.length]+'20',
    fill:false,tension:0.3,pointRadius:4,pointHoverRadius:6,borderWidth:2
  }));

  new Chart(canvas,{
    type:'line',
    data:{labels:history.map((_,i)=>'Round '+(i+1)),datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{font:{size:9},usePointStyle:true,pointStyle:'circle',padding:10}},
        tooltip:{bodyFont:{size:10}}},
      scales:{
        y:{beginAtZero:true,title:{display:true,text:'Mentions',font:{size:9}},ticks:{font:{size:9},stepSize:1}},
        x:{ticks:{font:{size:9}}}
      }
    }
  });
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
  if(!flags.length){t+='No active open issues.\n';}
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
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
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
  // Readiness
  y=pdfCheckPage(doc,y,w,h,pg,20);
  y=pdfSection(doc,y,'Readiness',w);
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
  if(!flags.length){doc.setFontSize(8);doc.text('No active open issues.',14,y);y+=6;}
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
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);showSuccess('Report exported. Open it in a new tab to review.');}
}

function exportReleasePDF(){
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
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
    y=pdfSection(doc,y,p.name+' — Readiness',w);
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
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);showSuccess('Report exported. Open it in a new tab to review.');}
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
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
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
  doc.text(`Average Readiness: ${avgGate}%`,mg,y);y+=7;
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
    doc.text(`Status: ${rg.label}   |   Readiness: ${rl.gateScore!==null?rl.gateScore+'%':'—'}   |   Go-Live: ${r.golive?fmtDate(r.golive):'Not set'}`,mg,y);y+=10;
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
      y=pdfSection(doc,y,p.name+' — Readiness',w);
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
  }catch(e){console.error('Handoff PDF export failed');showSuccess('Export didn\u2019t complete. Check your browser settings and try again.');}
}

// ════════════════════════════════════════════════════════
// OCM DELIVERABLE GENERATOR
// ════════════════════════════════════════════════════════
function toggleGenMenu(){const m=document.getElementById('gen-menu');if(m)m.classList.toggle('open');}
document.addEventListener('click',e=>{const m=document.getElementById('gen-menu');if(m&&!e.target.closest('.dropdown-gen'))m.classList.remove('open');});

const NARRATIVE_URL='https://yufehucjvviwanbulcok.supabase.co/functions/v1/deliverable-narrative';
let _genAudienceChoice='practitioner';
let _genAIEnabled=true;
let _genCurrentType=null;
let _genCurrentLabel=null;

function openGenModal(type,label){
  toggleGenMenu();
  _genCurrentType=type;_genCurrentLabel=label;
  let existing=document.getElementById('gen-deliverable-modal');
  if(existing)existing.remove();

  const modal=document.createElement('div');
  modal.id='gen-deliverable-modal';
  modal.className='gen-modal';
  modal.innerHTML=`<div class="gen-modal-box">
    <h2>Generate ${esc(label)}</h2>
    <div class="gen-modal-sub">Select audience depth and AI narrative options</div>
    <div class="gen-aud-label">Audience Level</div>
    <div class="gen-aud-opts">
      <label class="gen-aud-opt${_genAudienceChoice==='executive'?' selected':''}" onclick="selectGenAud('executive',this)">
        <input type="radio" name="gen-aud" value="executive"${_genAudienceChoice==='executive'?' checked':''}>
        <div class="gen-aud-opt-text"><div class="gen-aud-opt-title">Executive</div><div class="gen-aud-opt-desc">High-level strategic summary for C-suite. Concise, impact-focused.</div></div>
      </label>
      <label class="gen-aud-opt${_genAudienceChoice==='practitioner'?' selected':''}" onclick="selectGenAud('practitioner',this)">
        <input type="radio" name="gen-aud" value="practitioner"${_genAudienceChoice==='practitioner'?' checked':''}>
        <div class="gen-aud-opt-text"><div class="gen-aud-opt-title">Practitioner</div><div class="gen-aud-opt-desc">Tactical detail for OCM practitioners and project managers. Methodology-grounded.</div></div>
      </label>
      <label class="gen-aud-opt${_genAudienceChoice==='full'?' selected':''}" onclick="selectGenAud('full',this)">
        <input type="radio" name="gen-aud" value="full"${_genAudienceChoice==='full'?' checked':''}>
        <div class="gen-aud-opt-text"><div class="gen-aud-opt-title">Full</div><div class="gen-aud-opt-desc">Comprehensive analysis for steering committees. All data included with deep narrative.</div></div>
      </label>
    </div>
    <div class="gen-ai-toggle">
      <input type="checkbox" id="gen-ai-check"${_genAIEnabled?' checked':''} onchange="_genAIEnabled=this.checked">
      <label for="gen-ai-check"><strong>AI-Assisted Narrative</strong> — Generate consultant-grade executive summary from live project data</label>
    </div>
    <div class="gen-ai-note">AI narrative supplements existing data tables and charts. It does not replace structured content.</div>
    <div id="gen-status" class="gen-status" style="display:none"></div>
    <div class="gen-modal-acts">
      <button class="btn-outline" onclick="closeGenModal()">Cancel</button>
      <button class="btn-fill" id="gen-go-btn" onclick="executeGenerate()">Generate PDF</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',e=>{if(e.target===modal)closeGenModal();});
  requestAnimationFrame(()=>modal.classList.add('open'));
}

function selectGenAud(val,el){
  _genAudienceChoice=val;
  document.querySelectorAll('.gen-aud-opt').forEach(o=>o.classList.remove('selected'));
  if(el)el.classList.add('selected');
}

function closeGenModal(){
  const m=document.getElementById('gen-deliverable-modal');
  if(m){m.classList.remove('open');setTimeout(()=>m.remove(),200);}
}

function collectNarrativeData(p){
  // Reuse the smart recs data collector which has everything
  const data=collectSmartRecsData(p);
  // Add some extras
  data.kirkpatrickDetails=p.stakeholders.map(s=>{
    const k=s.kirk||{};
    return{name:s.name,
      L1:{method:k.L1?.method||'',timing:k.L1?.timing||''},
      L2:{method:k.L2?.method||'',assessment:k.L2?.assessment||''},
      L3:{interval:k.L3?.interval||'',observable:k.L3?.observable||''},
      L4:{outcome:k.L4?.outcome||'',metric:k.L4?.metric||''}};
  });
  data.reinforcementDetails=p.stakeholders.map(s=>{
    const r2=s.rein||{};
    return{name:s.name,owner:r2.owner||'',activities:r2.activities||'',intervals:r2.intervals||[],escalation:r2.escalation||''};
  });
  data.impactDetails=(p.impactAssessment?.groups||[]).map(g=>({
    name:g.name||'',impactLevel:g.impactLevel||'Medium',changeTypes:g.changeTypes||[],
    currentState:g.currentState||'',futureState:g.futureState||'',
    readinessActions:g.readinessActions?.length||0,completedActions:g.readinessActions?.filter(a=>a.done).length||0
  }));
  return data;
}

async function fetchNarrative(type,audience,data){
  const response=await fetch(NARRATIVE_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+TRAJ_ANON_KEY},
    body:JSON.stringify({deliverableType:type,audience,projectData:data})
  });
  if(!response.ok){
    const err=await response.json().catch(()=>({}));
    throw new Error(err.error||'Narrative generation failed');
  }
  return await response.json();
}

async function executeGenerate(){
  const p=getProj();const r=getRel();if(!p||!r)return;
  const status=document.getElementById('gen-status');
  const btn=document.getElementById('gen-go-btn');

  let narrative=null;

  if(_genAIEnabled){
    if(status){status.style.display='block';status.className='gen-status';status.textContent='Generating AI narrative…';}
    if(btn){btn.disabled=true;btn.textContent='Generating…';}
    try{
      const data=collectNarrativeData(p);
      narrative=await fetchNarrative(_genCurrentType,_genAudienceChoice,data);
    }catch(err){
      if(status){status.className='gen-status error';status.textContent='AI narrative failed: '+err.message+'. Generating without AI.';}
      await new Promise(r2=>setTimeout(r2,1500));
      narrative=null;
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Generate PDF';}
    }
  }

  closeGenModal();

  // Call the appropriate generator with narrative
  const genFns={
    stakeholder:genStakeholderAnalysis,
    training:genTrainingPlan,
    comms:genCommsPlan,
    resistance:genResistancePlan,
    readiness:genReadinessRec
  };
  const fn=genFns[_genCurrentType];
  if(fn)fn(narrative,_genAudienceChoice);
}

// Helper: Insert AI narrative into PDF
function pdfAINarrative(doc,y,w,h,pg,mg,narrativeText,sectionTitle){
  if(!narrativeText)return y;
  y=pdfCheckPage(doc,y,w,h,pg,30);
  // Section label
  doc.setFillColor(240,237,230);doc.roundedRect(mg,y,w-28,16,2,2,'F');
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
  doc.text(sectionTitle||'AI-Assisted Analysis',mg+4,y+10);
  doc.setFontSize(6);doc.setTextColor(140,140,140);doc.setFont('helvetica','italic');
  doc.text('Generated from live project data. Review and adjust as needed.',w-mg,y+10,{align:'right'});
  y+=20;

  // Render narrative paragraphs
  doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
  const paragraphs=narrativeText.split(/\n\n+/).filter(p2=>p2.trim());
  paragraphs.forEach(para=>{
    const lines=doc.splitTextToSize(para.trim(),w-28);
    y=pdfCheckPage(doc,y,w,h,pg,lines.length*4+8);
    doc.text(lines,mg,y);
    y+=lines.length*4+4;
  });
  return y+4;
}

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

function genStakeholderAnalysis(aiNarrative,audience){
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
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
  // AI Narrative (if available)
  if(aiNarrative?.executiveSummary){
    y=pdfAINarrative(doc,y,w,h,pg,mg,aiNarrative.executiveSummary,'AI-Assisted Executive Summary');
  }
  y=pdfSection(doc,y,'1. Executive Summary',w);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  let execText='This analysis covers '+shs.length+' stakeholder group'+(shs.length!==1?'s':'')+' across the '+p.name+' initiative. ';
  if(highRiskGroup)execText+='The highest-risk group is '+highRiskGroup.name+' at '+adoptScore(highRiskGroup.factors)+'% readiness. ';
  execText+='The average readiness across all groups is '+avgAdopt+'%, placing the overall engagement posture at '+overallPosture+'. ';
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
  const coalNarr='The coalition composition below reflects the distribution of stakeholder groups by their readiness. A healthy change coalition requires a critical mass of Champions and Supporters. '+
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
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);showSuccess('Report exported. Open it in a new tab to review.');}
  toggleGenMenu();
  }catch(e){console.error('Stakeholder Analysis PDF export failed');showSuccess('Export didn\u2019t complete. Check your browser settings and try again.');}
}

function genTrainingPlan(aiNarrative,audience){
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
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
  if(aiNarrative?.executiveSummary){y=pdfAINarrative(doc,y,w,h,pg,mg,aiNarrative.executiveSummary,'AI-Assisted Executive Summary');}
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
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);showSuccess('Report exported. Open it in a new tab to review.');}
  toggleGenMenu();
  }catch(e){console.error('Training Plan PDF export failed');showSuccess('Export didn\u2019t complete. Check your browser settings and try again.');}
}

function genCommsPlan(aiNarrative,audience){
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
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
  if(aiNarrative?.executiveSummary){y=pdfAINarrative(doc,y,w,h,pg,mg,aiNarrative.executiveSummary,'AI-Assisted Executive Summary');}
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
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);showSuccess('Report exported. Open it in a new tab to review.');}
  toggleGenMenu();
  }catch(e){console.error('Comms Plan PDF export failed');showSuccess('Export didn\u2019t complete. Check your browser settings and try again.');}
}

function genResistancePlan(aiNarrative,audience){
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
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
  if(aiNarrative?.executiveSummary){y=pdfAINarrative(doc,y,w,h,pg,mg,aiNarrative.executiveSummary,'AI-Assisted Executive Summary');}
  y=pdfSection(doc,y,'1. Executive Summary',w);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  const resistPosture=critSH.length>=3||critGaps.length>0?'critical':critSH.length>=1?'elevated':'manageable';
  let resistExec='The resistance posture for '+p.name+' is currently assessed as '+resistPosture+'. ';
  resistExec+='Of '+shs.length+' stakeholder group'+(shs.length!==1?'s':'')+', '+critSH.length+' exhibit readiness below 60%, indicating active or emerging resistance. ';
  if(flags.length)resistExec+=flags.length+' active open issue'+(flags.length!==1?'s require':' requires')+' attention. ';
  if(critGaps.length)resistExec+=critGaps.length+' critical implementation gap'+(critGaps.length!==1?'s compound':' compounds')+' the resistance risk. ';
  resistExec+=fwShort()+' average is '+adkar+'/5'+(adkar<3?', which is below the minimum threshold for proceeding and signals systemic readiness gaps':'')+'. ';
  // Priority actions
  const priorities=[];
  if(critSH.length)priorities.push('Deploy targeted interventions for '+critSH.length+' at-risk group'+(critSH.length!==1?'s':''));
  if(flags.length)priorities.push('Resolve '+flags.length+' active open issue'+(flags.length!==1?'s':''));
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
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);showSuccess('Report exported. Open it in a new tab to review.');}
  toggleGenMenu();
  }catch(e){console.error('Resistance Plan PDF export failed');showSuccess('Export didn\u2019t complete. Check your browser settings and try again.');}
}

function genReadinessRec(aiNarrative,audience){
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
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
  if(aiNarrative?.executiveSummary){y=pdfAINarrative(doc,y,w,h,pg,mg,aiNarrative.executiveSummary,'AI-Assisted Executive Summary');}
  y=pdfSection(doc,y,'1. Executive Summary',w);
  doc.setFontSize(9);doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');
  let recExec='Based on a comprehensive analysis of readiness ('+(gate||0)+'%), '+fwShort()+' assessment ('+adkar+'/5), '+
    shs.length+' stakeholder group'+(shs.length!==1?'s':'')+', '+flags.length+' active open issue'+(flags.length!==1?'s':'')+', and '+
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
    ['Readiness',(gate||0)+'%',gate>=80?'Pass':gate>=50?'Marginal':'Fail'],
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
    if(flags.length)conditions.push(['Resolve Risk Flags','Resolve '+flags.length+' active open issue'+(flags.length!==1?'s':'')+' identified in the gate review','Before go-live','Project team']);
    if(adkar<3.5){
      const lowDims=dims.filter(d=>(p.adkarScores?.[d.key]||3)<3);
      if(lowDims.length)conditions.push(['Improve '+fwShort()+' Scores','Raise '+lowDims.map(d=>d.word).join(', ')+' score'+(lowDims.length!==1?'s':'')+' to minimum 3/5','Before go-live','OCM Lead']);
    }
    if(gate<80)conditions.push(['Complete Gate Items','Advance readiness from '+(gate||0)+'% to minimum 80%','Before go-live','Project Manager']);
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
      timeNarr+='Based on the volume of unresolved gaps and open issues, a minimum of '+remedWeeks+' additional weeks is recommended for remediation before re-assessment. ';
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
    if(flags.length)nrActions.push('Address '+flags.length+' active open issue'+(flags.length!==1?'s':'')+' through targeted remediation sprints');
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

  // ── 8. Measurement & Evidence ──
  y=pdfCheckPage(doc,y,w,h,pg,120);
  y=pdfSection(doc,y,'8. Measurement & Evidence',w);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  doc.text('This readiness assessment was derived from the following inputs:',mg,y+2);y+=8;
  // Component scores + data sources
  const compScores=[];
  const fwScoresP=dims.map(d=>p.adkarScores?.[d.key]||3);
  const fwPctP=fwScoresP.length?Math.round(fwScoresP.reduce((a,b)=>a+b,0)/fwScoresP.length/5*100):0;
  const sentPctP=shs.length?Math.round(shs.reduce((a,sh)=>{const ps=p.pulseResults?.[sh.id]?.scores||{};return a+sentimentScore(sh,ps);},0)/shs.length):50;
  const kirkPctsP=shs.map(sh=>{if(!sh?.kirk)return 0;let f=0;const k=sh.kirk;if(k.L1?.method)f++;if(k.L1?.timing)f++;if(k.L2?.method)f++;if(k.L2?.assessment)f++;if(k.L3?.observable)f++;if(k.L3?.interval)f++;if(k.L4?.outcome)f++;if(k.L4?.metric)f++;return Math.round(f/8*100);});
  const trainPctP=kirkPctsP.length?Math.round(kirkPctsP.reduce((a,b)=>a+b,0)/kirkPctsP.length):0;
  const lhDataP=calcLifecycleHealth(p);const lcPctP=lhDataP.score;
  const commsDimsP=dims.filter(d=>['A1','d1','d7','d8'].includes(d.key));
  const commsAvgP=commsDimsP.length?commsDimsP.reduce((a,d)=>a+(p.adkarScores?.[d.key]||3),0)/commsDimsP.length:3;
  const commsPctP=Math.round(commsAvgP/5*100);
  const gsP=projGateScore(p);const flagsP=getProjFlagCount(p);
  const riskPctP=Math.max(0,Math.min(100,gsP!==null?Math.round(gsP*(flagsP===0?1:flagsP<=2?0.8:0.5)):50));
  // Drop training weight until it's active; renormalize remaining 80% to 100%.
  const trActiveP=trainingActive(p);
  const kP=trActiveP?1:1/0.80;
  const wP={fw:0.25*kP,sent:0.20*kP,train:trActiveP?0.20:0,lc:0.10*kP,comms:0.10*kP,risk:0.15*kP};
  const pctLabelP=v=>Math.round(v*100)+'%';
  compScores.push({label:fwName()+' Assessment',score:fwPctP,weight:pctLabelP(wP.fw),ds:getDataSourceType('framework',p)});
  compScores.push({label:'People & Trust',score:sentPctP,weight:pctLabelP(wP.sent),ds:getDataSourceType('sentiment',p)});
  compScores.push({label:'Training & Preparedness',score:trActiveP?trainPctP:null,weight:trActiveP?pctLabelP(wP.train):'—',ds:getDataSourceType('training',p),pending:!trActiveP});
  compScores.push({label:'Project Health',score:lcPctP,weight:pctLabelP(wP.lc),ds:getDataSourceType('lifecycle',p)});
  compScores.push({label:'Communication',score:commsPctP,weight:pctLabelP(wP.comms),ds:getDataSourceType('comms',p)});
  compScores.push({label:'Open Issues',score:riskPctP,weight:pctLabelP(wP.risk),ds:getDataSourceType('risk',p)});
  doc.autoTable({startY:y,margin:{left:mg,right:mg},headStyles:{fillColor:[12,31,63],fontSize:7,cellPadding:3},bodyStyles:{fontSize:7,cellPadding:2.5},
    head:[['Component','Score','Weight','Data Source']],
    body:compScores.map(c=>[c.label,c.pending?'Not yet started':c.score+'%',c.weight,c.ds])
  });y=doc.lastAutoTable.finalY+6;
  // Confidence level
  const confP=calcDataConfidence(p);
  const confLevel=confP.measured>66?'High':confP.measured>33?'Medium':'Low';
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(12,31,63);
  doc.text('Confidence Level: '+confLevel,mg,y+2);y+=5;
  doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(80,80,80);
  doc.text('Measured: '+confP.measured+'%  |  Observed: '+confP.observed+'%  |  Estimated: '+confP.estimated+'%',mg,y+2);y+=7;
  // Strongest + weakest — exclude components that are pending (e.g. pre-training)
  const sorted=[...compScores].filter(c=>!c.pending&&typeof c.score==='number').sort((a,b)=>b.score-a.score);
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(29,104,64);
  doc.text('Strongest Indicators:',mg,y+2);y+=5;
  doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  sorted.slice(0,3).forEach((c,i)=>{doc.text((i+1)+'. '+c.label+': '+c.score+'% ('+c.ds+')',mg+4,y+2);y+=4;});y+=3;
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(184,50,50);
  doc.text('Weakest Indicators:',mg,y+2);y+=5;
  doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  sorted.slice(-3).reverse().forEach((c,i)=>{doc.text((i+1)+'. '+c.label+': '+c.score+'% ('+c.ds+')',mg+4,y+2);y+=4;});y+=3;
  // Proof points + lifecycle signals
  const ppCount=(p.proofPoints||[]).length;
  const redSigs=lhDataP.signals.filter(s=>s.strength==='red');
  const yellowSigs=lhDataP.signals.filter(s=>s.strength==='yellow');
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);
  doc.text('Proof Points Cited: '+ppCount+' documented evidence items',mg,y+2);y+=5;
  doc.text('Active Lifecycle Signal Flags: '+redSigs.length+' Concern, '+yellowSigs.length+' Watch',mg,y+2);y+=5;
  redSigs.forEach(s=>{y=pdfCheckPage(doc,y,w,h,pg,8);doc.setTextColor(139,26,26);doc.text('- '+s.label+': '+s.value,mg+4,y+2);y+=4;});
  doc.setTextColor(60,60,60);y+=6;

  // ── 9. ADKAR Readiness ──
  y=pdfCheckPage(doc,y,w,h,pg,60);
  y=pdfSection(doc,y,'9. '+fwShort()+' Readiness',w);
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
    y=pdfSection(doc,y,'10. Stakeholder Readiness Summary',w);
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
    y=pdfSection(doc,y,'11. Risk Flags Requiring Resolution',w);
    const fRows=flags.map(f=>[f.gate||'',f.item||'',f.consequence||'',f.defOwner||'Unassigned']);
    doc.autoTable({startY:y,head:[['Gate','Gap','Consequence','Owner']],body:fRows,
      margin:{left:mg,right:mg},styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[184,50,50],textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,247,244]},didDrawPage:()=>{pg[0]++;}});
    y=doc.lastAutoTable.finalY+10;
  }

  // ── AI-Assisted Risk Narrative ──
  if(aiNarrative?.riskNarrative){
    y=pdfAINarrative(doc,y,w,h,pg,mg,aiNarrative.riskNarrative,'AI-Assisted Risk Narrative');
  }

  pdfFooter(doc,w,h,pg[0]);
  {const blobUrl=URL.createObjectURL(doc.output('blob'));window.open(blobUrl,'_blank');setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);showSuccess('Report exported. Open it in a new tab to review.');}
  toggleGenMenu();
  }catch(e){console.error('Readiness Rec PDF export failed');showSuccess('Export didn\u2019t complete. Check your browser settings and try again.');}
}

function genFullPackage(){
  if(!window.jspdf){showSuccess('PDF engine is loading. Try again in a moment.');return;}
  const p=getProj();const r=getRel();if(!p||!r)return;
  showSuccess('Generating all 5 deliverables. Each will open in a separate tab.');
  toggleGenMenu();
  setTimeout(()=>genStakeholderAnalysis(null,null),100);
  setTimeout(()=>genTrainingPlan(null,null),300);
  setTimeout(()=>genCommsPlan(null,null),500);
  setTimeout(()=>genResistancePlan(null,null),700);
  setTimeout(()=>genReadinessRec(null,null),900);
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
  if(on){isReadOnly=true;document.body.classList.add('readonly-mode');applyReadOnlyRestrictions();}
}
function exitDemo(){
  localStorage.removeItem(storageKey());
  isDemoMode=false;
  isReadOnly=false;
  document.body.classList.remove('readonly-mode');
  setDemoMode(false);
  releases=[];
  showLanding();
}

async function ensureTeam(releaseId){
  try{
    const{data,error:selErr}=await _supabase.from('teams').select('id').eq('release_id',releaseId).eq('owner_id',currentUserId).maybeSingle();
    if(selErr){console.warn('Teams table not found. Run sql/phase4_teams.sql in Supabase.');return null;}
    if(data)return data.id;
    const{data:newTeam,error}=await _supabase.from('teams').insert({release_id:releaseId,owner_id:currentUserId}).select('id').single();
    if(error){console.error('Team creation failed');return null;}
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
  if(mErr){console.error('Invite accept failed');return;}
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
  p1a.craid=[
    {id:uid(),type:'risk',title:'Physician resistance to new documentation workflow',description:'Senior physicians may resist changing established documentation patterns, leading to workarounds that bypass the new system.',status:'Open',severity:'High',owner:'Dr. Rachel Goldman',dueDate:'2026-06-15',created:'2026-04-01T10:00:00Z',probability:'Likely',impact:'High',mitigation:'Conduct physician champion program with 5 early adopters. Offer 1:1 workflow optimization sessions.',dependsOn:'',validationMethod:'',constraintType:''},
    {id:uid(),type:'risk',title:'Training environment not ready 2 weeks before go-live',description:'IT infrastructure team has flagged potential delays in provisioning the training sandbox environment.',status:'In Progress',severity:'Critical',owner:'Asha Patel',dueDate:'2026-05-30',created:'2026-04-02T09:00:00Z',probability:'Possible',impact:'Critical',mitigation:'Identify backup training environment. Prepare offline simulation materials as contingency.',dependsOn:'',validationMethod:'',constraintType:''},
    {id:uid(),type:'assumption',title:'Clinical staff available for 2-day training window',description:'Assumes nursing and physician schedules can accommodate 2 consecutive days of training without impacting patient care.',status:'Open',severity:'High',owner:'Sophia Rodriguez',dueDate:'2026-05-15',created:'2026-04-01T10:00:00Z',probability:'',impact:'',mitigation:'',dependsOn:'',validationMethod:'Confirm with department heads by May 1. Review shift schedules for coverage gaps.',constraintType:''},
    {id:uid(),type:'issue',title:'EHR vendor delayed API documentation by 3 weeks',description:'The vendor has not delivered the integration API specs needed for custom workflow configuration.',status:'Open',severity:'High',owner:'James Mitchell',dueDate:'2026-05-01',created:'2026-04-05T14:00:00Z',probability:'',impact:'',mitigation:'',dependsOn:'',validationMethod:'',constraintType:''},
    {id:uid(),type:'dependency',title:'Lab system interface must be live before clinical workflow training',description:'Training scenarios require real-time lab result display. Lab interface go-live is owned by a separate project team.',status:'Open',severity:'Critical',owner:'Asha Patel',dueDate:'2026-06-01',created:'2026-04-03T11:00:00Z',probability:'',impact:'',mitigation:'',dependsOn:'Lab System Modernization project (IT Infrastructure team)',validationMethod:'',constraintType:''},
    {id:uid(),type:'constraint',title:'Go-live cannot occur during Joint Commission survey window',description:'Regulatory constraint: the hospital cannot introduce major system changes during the scheduled Joint Commission review period (July 10-24).',status:'Open',severity:'High',owner:'Dr. Rachel Goldman',dueDate:'',created:'2026-04-01T10:00:00Z',probability:'',impact:'',mitigation:'',dependsOn:'',validationMethod:'',constraintType:'Regulatory'}
  ];
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
  // Lifecycle signals — moderate project
  p1a.lifecycleSignals={
    requirements:{onSchedule:true,daysVariance:0,reviewCycles:2,disputes:false,disputeNotes:''},
    design:{reviewsDelayed:false,delayDays:0,scopeChangeRequests:1,workaroundRequests:1,workaroundNotes:'Physicians requested verbal order proxy entry workflow'},
    testing:{qaDefects:62,uatDefects:18,uatParticipationRate:76,testingApproach:'mixed'},
    training:{startDateChanges:1,startDateReasons:['System scope changes'],envDefects:3,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:2},
    deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:0,supportTicketsMonth1:0,workaroundRequestsPostGL:0}
  };
  p1a.stakeholders[0].trust=3;
  p1a.stakeholders[0].trustHistory=[{date:'2025-11-01',value:3,note:'Initial'},{date:'2026-01-01',value:3,note:'Stable — physicians cautious but engaged'}];
  p1a.stakeholders[0].touchpoints=[{id:uid(),date:'2025-11-20',type:'Demo',description:'EHR order entry demo for physician champions',trustImpact:'Increased'},{id:uid(),date:'2026-01-15',type:'Q&A Session',description:'Open Q&A — productive but surfaced verbal order concern',trustImpact:'No Change'}];
  p1a.stakeholders[0].anxietyIndicators={whatDoesThisMeanFreq:3,extraReviewCycles:1,escalations:0,attendanceDrop:false};
  p1a.valueCase={statement:'Transition from paper-based charting to integrated electronic health records to improve clinical documentation accuracy and patient safety.',requestor:'Chief Medical Officer',impactLevel:'High',successCriteria:[{id:uid(),criterion:'Documentation compliance above 95%',metStatus:null},{id:uid(),criterion:'Zero clinical safety events attributed to EHR transition',metStatus:null},{id:uid(),criterion:'Physician satisfaction above 3.5/5',metStatus:null}],unintendedConsequences:''};
  p1a.proofPoints=[{id:uid(),what:'Physician champion engagement exceeded target — 8 of 10 department champions actively participating in design reviews',when:'2025-12-01',proves:'Strong coalition building. Physician buy-in is developing through peer involvement rather than top-down mandates.',source:'Meeting Notes',dimensionTags:['People & Trust','Change Readiness']}];
  // Nursing Documentation — moderate risk
  p1b.lifecycleSignals={
    requirements:{onSchedule:true,daysVariance:0,reviewCycles:3,disputes:false,disputeNotes:''},
    design:{reviewsDelayed:true,delayDays:4,scopeChangeRequests:2,workaroundRequests:1,workaroundNotes:'Nurses requested a paper-based fallback for medication scanning during downtime'},
    testing:{qaDefects:78,uatDefects:22,uatParticipationRate:72,testingApproach:'mixed'},
    training:{startDateChanges:1,startDateReasons:['System scope changes'],envDefects:4,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:2},
    deployment:{goliveDateChanges:1,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:0,supportTicketsMonth1:0,workaroundRequestsPostGL:0}
  };
  p1b.stakeholders[0].trust=3;
  p1b.stakeholders[0].trustHistory=[{date:'2025-11-01',value:3,note:'Initial'},{date:'2026-01-01',value:3,note:'Stable — cautious but cooperating'}];
  p1b.stakeholders[0].touchpoints=[{id:uid(),date:'2025-11-20',type:'Training Session',description:'Nursing documentation workflow training — hands-on lab',trustImpact:'Increased'},{id:uid(),date:'2025-12-15',type:'Q&A Session',description:'Open Q&A about BCMA scanning process',trustImpact:'No Change'},{id:uid(),date:'2026-01-10',type:'Walkthrough',description:'Unit-by-unit walkthrough with super users',trustImpact:'Increased'}];
  p1b.stakeholders[0].anxietyIndicators={whatDoesThisMeanFreq:4,extraReviewCycles:1,escalations:0,attendanceDrop:false};
  p1b.stakeholders[0].preconceptions=[{id:uid(),text:'Worried the barcode scanner will slow down medication administration during emergencies',status:'Being Addressed'}];
  p1b.valueCase={statement:'Reduce medication administration errors by implementing barcode-verified medication scanning at point of care.',requestor:'Chief Nursing Officer',impactLevel:'High',successCriteria:[{id:uid(),criterion:'Medication error rate reduced by 60%',metStatus:null},{id:uid(),criterion:'BCMA scan compliance above 95%',metStatus:null},{id:uid(),criterion:'Nurse satisfaction above 3.5/5',metStatus:null}],unintendedConsequences:''};
  p1b.proofPoints=[{id:uid(),what:'72% of nursing staff participated in UAT — below the 80% target but above minimum threshold',when:'2026-01-20',proves:'Acceptable but not strong engagement. Staff who did not participate may struggle post go-live.',source:'Attendance Record',dimensionTags:['People & Trust','Project Health']},{id:uid(),what:'Workaround requested for paper-based medication scanning fallback during system downtime',when:'2025-12-08',proves:'Nurses are planning for system failure before it launches — a sign of low confidence in reliability.',source:'Meeting Notes',dimensionTags:['People & Trust']}];
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
  p2a.craid=[
    {id:uid(),type:'risk',title:'Branch staff turnover during transition',description:'Several branches report 15-20% teller turnover, risking knowledge loss mid-implementation.',status:'Open',severity:'Critical',owner:'David Thompson',dueDate:'2026-07-01',created:'2026-04-01T10:00:00Z',probability:'Very Likely',impact:'High',mitigation:'Build rapid onboarding module for new hires. Cross-train 2 backup tellers per branch.',dependsOn:'',validationMethod:'',constraintType:''},
    {id:uid(),type:'risk',title:'Core banking cutover weekend too short',description:'The 48-hour cutover window may be insufficient if data migration takes longer than planned.',status:'Open',severity:'High',owner:'Lisa Anderson',dueDate:'2026-08-01',created:'2026-04-02T09:00:00Z',probability:'Possible',impact:'Critical',mitigation:'Conduct dry-run migration 4 weeks before go-live. Identify rollback triggers.',dependsOn:'',validationMethod:'',constraintType:''},
    {id:uid(),type:'assumption',title:'All branches have adequate network bandwidth',description:'Training simulations require stable 50Mbps minimum. Rural branches may fall short.',status:'Open',severity:'Medium',owner:'Robert Harrison',dueDate:'2026-06-01',created:'2026-04-03T10:00:00Z',probability:'',impact:'',mitigation:'',dependsOn:'',validationMethod:'IT to conduct bandwidth test at all 150 branches by June 1.',constraintType:''},
    {id:uid(),type:'issue',title:'Compliance training content not yet approved by Legal',description:'Legal review of the anti-fraud training module is 2 weeks behind schedule.',status:'In Progress',severity:'High',owner:'Michelle Lee',dueDate:'2026-05-15',created:'2026-04-05T14:00:00Z',probability:'',impact:'',mitigation:'',dependsOn:'',validationMethod:'',constraintType:''},
    {id:uid(),type:'constraint',title:'No deployments during Q3 earnings blackout',description:'Finance mandates a change freeze during Q3 earnings preparation (Aug 15-Sep 5).',status:'Open',severity:'Medium',owner:'David Thompson',dueDate:'',created:'2026-04-01T10:00:00Z',probability:'',impact:'',mitigation:'',dependsOn:'',validationMethod:'',constraintType:'Schedule'}
  ];
  p2a.stakeholders=[{id:uid(),name:'Branch Tellers',factors:{resistance:3,env:3,window:3,complexity:3,saturation:2,leadership:3},objectives:['Process deposits/withdrawals','Handle wire transfers','Customer authentication verification'],kirk:{L1:{method:'Role-based training modules',timing:'2 weeks pre-go-live'},L2:{method:'Transaction simulation',assessment:'100 test cases'},L3:{observable:'Avg transaction time',interval:'14-day post go-live'},L4:{outcome:'Zero fraudulent transactions',metric:'Risk dashboard'}},rein:{owner:'Branch Managers',activities:'Daily check-ins + super-user support',intervals:['Week 1','Week 2','Week 4'],escalation:'Escalate if transaction errors exceed 0.5%'}}];
  const p2b=newProject('Online Banking',['JPMorgan'],45000);
  p2b.status='Not Started';
  p2b.golive='2026-08-30';
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
  // Teller Platform — on track
  p2a.lifecycleSignals={
    requirements:{onSchedule:true,daysVariance:0,reviewCycles:2,disputes:false,disputeNotes:''},
    design:{reviewsDelayed:false,delayDays:0,scopeChangeRequests:1,workaroundRequests:0,workaroundNotes:''},
    testing:{qaDefects:55,uatDefects:14,uatParticipationRate:82,testingApproach:'mixed'},
    training:{startDateChanges:0,startDateReasons:[],envDefects:2,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:1},
    deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:0,supportTicketsMonth1:0,workaroundRequestsPostGL:0}
  };
  p2a.stakeholders[0].trust=4;
  p2a.stakeholders[0].trustHistory=[{date:'2025-11-01',value:3,note:'Initial'},{date:'2026-01-01',value:4,note:'Improved after simulation training'}];
  p2a.stakeholders[0].touchpoints=[{id:uid(),date:'2025-12-01',type:'Training Session',description:'Transaction simulation with live test data',trustImpact:'Increased'},{id:uid(),date:'2026-01-15',type:'Demo',description:'New fraud detection walkthrough for branch managers',trustImpact:'Increased'}];
  p2a.stakeholders[0].anxietyIndicators={whatDoesThisMeanFreq:2,extraReviewCycles:0,escalations:0,attendanceDrop:false};
  p2a.valueCase={statement:'Modernize the teller platform to reduce average transaction time by 40% and integrate real-time fraud detection at point of service.',requestor:'EVP Retail Banking',impactLevel:'High',successCriteria:[{id:uid(),criterion:'Average transaction time reduced by 40%',metStatus:null},{id:uid(),criterion:'Zero fraudulent transactions in first 90 days',metStatus:null},{id:uid(),criterion:'Branch teller satisfaction above 4.0',metStatus:null}],unintendedConsequences:''};
  p2a.proofPoints=[{id:uid(),what:'82% UAT participation rate — above the 80% target',when:'2026-02-01',proves:'Strong user engagement in testing. Tellers are invested in validating the system before launch.',source:'Attendance Record',dimensionTags:['People & Trust','Project Health']}];
  // Online Banking — early stage, at risk
  p2b.lifecycleSignals={
    requirements:{onSchedule:false,daysVariance:5,reviewCycles:3,disputes:false,disputeNotes:''},
    design:{reviewsDelayed:false,delayDays:0,scopeChangeRequests:2,workaroundRequests:1,workaroundNotes:'Tellers requested an offline mode for customer migration assistance during branch outages'},
    testing:{qaDefects:0,uatDefects:0,uatParticipationRate:0,testingApproach:''},
    training:{startDateChanges:0,startDateReasons:[],envDefects:0,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:0},
    deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:0,supportTicketsMonth1:0,workaroundRequestsPostGL:0}
  };
  p2b.stakeholders[0].trust=3;
  p2b.stakeholders[0].trustHistory=[{date:'2025-11-01',value:3,note:'Initial — cautious about digital migration mandate'}];
  p2b.stakeholders[0].preconceptions=[{id:uid(),text:'Believes digital migration will reduce branch foot traffic and eventually lead to branch closures',status:'Active'},{id:uid(),text:'Thinks customers will resist self-service and blame tellers for pushing them online',status:'Active'}];
  p2b.stakeholders[0].touchpoints=[{id:uid(),date:'2025-12-05',type:'Meeting',description:'Initial briefing on online banking rollout plan',trustImpact:'No Change'}];
  p2b.stakeholders[0].anxietyIndicators={whatDoesThisMeanFreq:6,extraReviewCycles:2,escalations:1,attendanceDrop:false};
  p2b.valueCase={statement:'Launch self-service online banking to reduce in-branch transaction volume by 20% and improve customer satisfaction scores.',requestor:'Chief Digital Officer',impactLevel:'High',successCriteria:[{id:uid(),criterion:'Online transaction adoption rate above 60%',metStatus:null},{id:uid(),criterion:'In-branch volume reduced by 20%',metStatus:null},{id:uid(),criterion:'Customer satisfaction maintained above 4.2',metStatus:null}],unintendedConsequences:''};
  p2b.proofPoints=[{id:uid(),what:'6 "what does this mean" questions from tellers in a single briefing about the digital migration talking points',when:'2025-12-05',proves:'The communication about this change is not clear. Tellers do not understand their role in the migration.',source:'Facilitation Notes',dimensionTags:['Communication','People & Trust']}];
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
  // Lifecycle signals — at risk project (mirrors ABAWD-like scenario)
  p3a.lifecycleSignals={
    requirements:{onSchedule:false,daysVariance:8,reviewCycles:4,disputes:true,disputeNotes:'Production scheduling rules differ across plants. Operators dispute proposed batch sizes.'},
    design:{reviewsDelayed:true,delayDays:7,scopeChangeRequests:3,workaroundRequests:4,workaroundNotes:'Workarounds requested for batch override, manual quality hold, shift handoff report, and downtime entry.'},
    testing:{qaDefects:285,uatDefects:3,uatParticipationRate:38,testingApproach:'guided'},
    training:{startDateChanges:3,startDateReasons:['UAT delays','Training environment defects','Insufficient time scoped'],envDefects:9,scopeUnderestimated:true,scopeNotes:'Original scope did not account for multi-plant workflow variations or shift-specific procedures.',materialReworkCycles:3},
    deployment:{goliveDateChanges:2,parallelOpsExtended:true,parallelOpsDays:14,supportTicketsWeek1:72,supportTicketsMonth1:195,workaroundRequestsPostGL:6}
  };
  // Trust + emotional readiness for Machine Operators (at risk)
  p3a.stakeholders[0].trust=2;
  p3a.stakeholders[0].trustHistory=[{date:'2025-11-01',value:3,note:'Initial assessment'},{date:'2025-12-15',value:2,note:'Dropped after workaround requests rejected'},{date:'2026-01-20',value:2,note:'No improvement after comms push'}];
  p3a.stakeholders[0].preconceptions=[
    {id:uid(),text:'Believes the new MES will slow down production by requiring tablet data entry during shifts',status:'Active'},
    {id:uid(),text:'Had negative experience with a failed barcode scanning rollout in 2023',status:'Being Addressed'}
  ];
  p3a.stakeholders[0].touchpoints=[
    {id:uid(),date:'2025-11-15',type:'Demo',description:'Initial MES walkthrough for floor supervisors',trustImpact:'Increased'},
    {id:uid(),date:'2025-12-10',type:'Q&A Session',description:'Open forum — high volume of skeptical questions about downtime impact',trustImpact:'No Change'},
    {id:uid(),date:'2026-01-08',type:'Leadership Lab',description:'Plant manager session on why the change matters',trustImpact:'No Change'},
    {id:uid(),date:'2026-02-05',type:'Walkthrough',description:'Hands-on guided walkthrough on simulation line',trustImpact:'Increased'}
  ];
  p3a.stakeholders[0].anxietyIndicators={whatDoesThisMeanFreq:9,extraReviewCycles:3,escalations:2,attendanceDrop:true};
  // Warehouse Staff — moderate
  if(p3a.stakeholders[1]){
    p3a.stakeholders[1].trust=3;
    p3a.stakeholders[1].trustHistory=[{date:'2025-11-01',value:3,note:''},{date:'2026-01-01',value:3,note:'Stable'}];
    p3a.stakeholders[1].touchpoints=[{id:uid(),date:'2025-12-01',type:'Training Session',description:'SAP warehouse basics overview',trustImpact:'Increased'}];
    p3a.stakeholders[1].anxietyIndicators={whatDoesThisMeanFreq:3,extraReviewCycles:1,escalations:0,attendanceDrop:false};
  }
  // HR Business Partners — healthy
  if(p3a.stakeholders[2]){
    p3a.stakeholders[2].trust=4;
    p3a.stakeholders[2].trustHistory=[{date:'2025-11-01',value:3,note:''},{date:'2025-12-15',value:4,note:'Positive after executive briefing'},{date:'2026-01-20',value:4,note:'Stable'}];
    p3a.stakeholders[2].preconceptions=[{id:uid(),text:'Concerned about learning curve for older staff',status:'Resolved'}];
    p3a.stakeholders[2].touchpoints=[{id:uid(),date:'2025-11-15',type:'Meeting',description:'Role mapping alignment session',trustImpact:'Increased'},{id:uid(),date:'2026-01-10',type:'Training Session',description:'HRIS module training — positive reception',trustImpact:'Increased'}];
    p3a.stakeholders[2].anxietyIndicators={whatDoesThisMeanFreq:1,extraReviewCycles:0,escalations:0,attendanceDrop:false};
  }
  // Proof points
  p3a.proofPoints=[
    {id:uid(),what:'UAT participation dropped from 78% to 38% between testing rounds 2 and 3',when:'2026-01-15',proves:'User engagement declining as testing fatigue sets in. Remaining testers may not represent real-world usage patterns.',source:'Attendance Record',dimensionTags:['People & Trust','Project Health']},
    {id:uid(),what:'3 separate operator groups asked "what does this mean?" about the same production status field during walkthrough sessions',when:'2026-01-22',proves:'Communication gap on this functionality. Field label and purpose unclear to end users.',source:'Facilitation Notes',dimensionTags:['Communication','Training & Preparedness']},
    {id:uid(),what:'Leadership lab attendance was 100% for session 1 and 55% for session 2',when:'2026-02-01',proves:'Initial interest but declining commitment. Follow-up engagement strategy needed.',source:'Attendance Record',dimensionTags:['People & Trust']},
    {id:uid(),what:'Training start date moved 3 times in 6 weeks due to UAT delays and training environment defects',when:'2026-02-10',proves:'Schedule instability compressing end-user preparation window. L3 measurement reliability at risk.',source:'Meeting Notes',dimensionTags:['Project Health','Training & Preparedness']},
    {id:uid(),what:'4 workaround requests submitted during design review — batch override, manual quality hold, shift handoff, downtime entry',when:'2025-12-20',proves:'Operators do not believe the system will meet their needs in 4 documented workflow areas.',source:'Meeting Notes',dimensionTags:['People & Trust','Project Health']}
  ];
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
  // Client 360 — on track
  p4a.lifecycleSignals={
    requirements:{onSchedule:true,daysVariance:0,reviewCycles:2,disputes:false,disputeNotes:''},
    design:{reviewsDelayed:false,delayDays:0,scopeChangeRequests:0,workaroundRequests:0,workaroundNotes:''},
    testing:{qaDefects:32,uatDefects:9,uatParticipationRate:85,testingApproach:'exploratory'},
    training:{startDateChanges:0,startDateReasons:[],envDefects:1,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:1},
    deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:0,supportTicketsMonth1:0,workaroundRequestsPostGL:0}
  };
  p4a.valueCase={statement:'Consolidate 4 legacy CRM views into a single Client 360 dashboard to reduce account lookup time from 3 minutes to 30 seconds.',requestor:'VP Client Services',impactLevel:'Medium',successCriteria:[{id:uid(),criterion:'Account lookup time reduced to under 30 seconds',metStatus:null},{id:uid(),criterion:'Client-facing staff satisfaction above 4.0',metStatus:null}],unintendedConsequences:''};
  p4a.proofPoints=[{id:uid(),what:'85% UAT participation with exploratory testing approach — users proactively tested edge cases beyond scripted scenarios',when:'2026-02-15',proves:'High engagement and ownership. Users are invested in the quality of the system.',source:'Attendance Record',dimensionTags:['People & Trust','Project Health']}];
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
  // Case Management — complete, delivered value
  p5a.golive='2025-11-30';
  p5a.lifecycleSignals={
    requirements:{onSchedule:true,daysVariance:0,reviewCycles:2,disputes:false,disputeNotes:''},
    design:{reviewsDelayed:false,delayDays:0,scopeChangeRequests:1,workaroundRequests:0,workaroundNotes:''},
    testing:{qaDefects:40,uatDefects:15,uatParticipationRate:90,testingApproach:'mixed'},
    training:{startDateChanges:0,startDateReasons:[],envDefects:1,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:1},
    deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:15,supportTicketsMonth1:35,workaroundRequestsPostGL:1}
  };
  p5a.stakeholders[0].trust=4;
  p5a.stakeholders[0].trustHistory=[{date:'2025-08-01',value:3,note:'Initial'},{date:'2025-10-01',value:4,note:'Improved after hands-on practice'},{date:'2025-12-01',value:5,note:'High confidence post go-live'}];
  p5a.stakeholders[0].touchpoints=[{id:uid(),date:'2025-09-01',type:'Training Session',description:'Case processing workflow — 3-day intensive',trustImpact:'Increased'},{id:uid(),date:'2025-10-15',type:'Walkthrough',description:'Go-live simulation with real caseload data',trustImpact:'Increased'},{id:uid(),date:'2025-12-15',type:'Q&A Session',description:'Post go-live feedback — minor issues resolved',trustImpact:'Increased'}];
  p5a.stakeholders[0].anxietyIndicators={whatDoesThisMeanFreq:1,extraReviewCycles:0,escalations:0,attendanceDrop:false};
  if(p5a.stakeholders[1]){p5a.stakeholders[1].trust=5;p5a.stakeholders[1].touchpoints=[{id:uid(),date:'2025-10-01',type:'Meeting',description:'Executive dashboard review — strong endorsement',trustImpact:'Increased'}];p5a.stakeholders[1].anxietyIndicators={whatDoesThisMeanFreq:0,extraReviewCycles:0,escalations:0,attendanceDrop:false};}
  p5a.valueCase={statement:'Replace legacy case management system to reduce average benefit processing time from 14 days to 5 days and eliminate manual data entry errors.',requestor:'Commissioner of Social Services',impactLevel:'High',successCriteria:[{id:uid(),criterion:'Average processing time reduced to 5 days or less',metStatus:'Yes',actualOutcome:'Average processing time now 4.2 days'},{id:uid(),criterion:'Data entry error rate below 1%',metStatus:'Yes',actualOutcome:'Error rate at 0.6% — below target'},{id:uid(),criterion:'Case worker satisfaction above 4.0',metStatus:'Partially',actualOutcome:'Satisfaction at 3.8 — close but below target due to initial learning curve'},{id:uid(),criterion:'Zero benefit payment delays attributed to system issues',metStatus:'Yes',actualOutcome:'No system-related payment delays in first 90 days'}],unintendedConsequences:'Case workers discovered the new reporting capabilities enabled them to identify at-risk families earlier — leading to proactive outreach that was not part of the original scope.'};
  p5a.proofPoints=[{id:uid(),what:'90% of caseworkers participated in UAT and completed all test scenarios within the target time',when:'2025-10-20',proves:'Strong workforce readiness. The training approach was effective and the system is intuitive enough for the user base.',source:'System Data',dimensionTags:['Training & Preparedness','Project Health']},{id:uid(),what:'Post go-live support tickets averaged 15 per week — well below the 20-ticket threshold',when:'2025-12-15',proves:'Users are self-sufficient. The training and go-live support model worked as designed.',source:'Defect Log',dimensionTags:['Project Health']},{id:uid(),what:'Commissioner received positive feedback from 3 regional directors within the first month',when:'2025-12-30',proves:'Leadership alignment is strong. The change has executive-level support from the field, not just headquarters.',source:'Meeting Notes',dimensionTags:['People & Trust']}];
  // Public Portal — complete, partial delivery
  p5b.golive='2025-11-30';
  p5b.lifecycleSignals={
    requirements:{onSchedule:true,daysVariance:0,reviewCycles:2,disputes:false,disputeNotes:''},
    design:{reviewsDelayed:false,delayDays:0,scopeChangeRequests:2,workaroundRequests:0,workaroundNotes:''},
    testing:{qaDefects:28,uatDefects:8,uatParticipationRate:75,testingApproach:'guided'},
    training:{startDateChanges:0,startDateReasons:[],envDefects:0,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:1},
    deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:22,supportTicketsMonth1:45,workaroundRequestsPostGL:0}
  };
  p5b.stakeholders[0].trust=3;
  p5b.stakeholders[0].trustHistory=[{date:'2025-09-01',value:3,note:'Constituents are a diverse population — trust varies widely'}];
  p5b.stakeholders[0].touchpoints=[{id:uid(),date:'2025-10-01',type:'Demo',description:'Public beta launch with feedback survey',trustImpact:'Increased'}];
  p5b.stakeholders[0].anxietyIndicators={whatDoesThisMeanFreq:3,extraReviewCycles:0,escalations:0,attendanceDrop:false};
  if(p5b.stakeholders[1]){p5b.stakeholders[1].trust=5;p5b.stakeholders[1].touchpoints=[{id:uid(),date:'2025-10-15',type:'Meeting',description:'Dashboard metrics review with Deputy Commissioner',trustImpact:'Increased'}];}
  p5b.valueCase={statement:'Launch a public-facing self-service portal to allow constituents to apply for benefits, check status, and upload documents without visiting an office or calling a hotline.',requestor:'Deputy Commissioner',impactLevel:'High',successCriteria:[{id:uid(),criterion:'50% of new applications submitted online within 6 months',metStatus:'Partially',actualOutcome:'Currently at 38% — adoption growing but below target. Accessibility barriers identified for older demographics.'},{id:uid(),criterion:'Call center volume reduced by 30%',metStatus:'No',actualOutcome:'Call center volume reduced by only 12% — many constituents still call to confirm online submissions were received.'},{id:uid(),criterion:'Constituent satisfaction above 4.0',metStatus:'Partially',actualOutcome:'Satisfaction at 3.6 — positive among younger users but lower among populations with limited technology access.'}],unintendedConsequences:'Unexpected demand from constituents requesting a Spanish-language version of the portal, which was not in the original scope. Now being planned as a Phase 2 enhancement.'};
  p5b.proofPoints=[{id:uid(),what:'Call center volume only reduced 12% vs 30% target — many callers are confirming their online submissions were received',when:'2026-01-15',proves:'Trust in the digital channel is not yet established. Constituents are double-checking their submissions by phone.',source:'System Data',dimensionTags:['People & Trust','Communication']},{id:uid(),what:'22 support tickets in the first week, primarily from users struggling with document upload functionality',when:'2025-12-07',proves:'The document upload UX needs improvement. This is a usability issue, not a training issue.',source:'Defect Log',dimensionTags:['Project Health']}];
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
  // Lifecycle signals — healthy project
  p6a.lifecycleSignals={
    requirements:{onSchedule:true,daysVariance:0,reviewCycles:2,disputes:false,disputeNotes:''},
    design:{reviewsDelayed:false,delayDays:0,scopeChangeRequests:1,workaroundRequests:0,workaroundNotes:''},
    testing:{qaDefects:48,uatDefects:11,uatParticipationRate:92,testingApproach:'mixed'},
    training:{startDateChanges:1,startDateReasons:['Resource unavailability'],envDefects:2,scopeUnderestimated:false,scopeNotes:'',materialReworkCycles:1},
    deployment:{goliveDateChanges:0,parallelOpsExtended:false,parallelOpsDays:0,supportTicketsWeek1:12,supportTicketsMonth1:28,workaroundRequestsPostGL:1}
  };
  // Trust — healthy
  p6a.stakeholders[0].trust=4;
  p6a.stakeholders[0].trustHistory=[{date:'2025-10-01',value:3,note:'Initial'},{date:'2025-12-01',value:4,note:'Strong after parallel run success'},{date:'2026-02-01',value:5,note:'Full confidence post go-live'}];
  p6a.stakeholders[0].touchpoints=[
    {id:uid(),date:'2025-10-15',type:'Training Session',description:'Full payroll processing training — 3-day intensive',trustImpact:'Increased'},
    {id:uid(),date:'2025-11-20',type:'Demo',description:'Parallel run walkthrough with live data comparison',trustImpact:'Increased'},
    {id:uid(),date:'2026-01-15',type:'Q&A Session',description:'Post go-live feedback session — minor issues resolved on the spot',trustImpact:'Increased'}
  ];
  p6a.stakeholders[0].anxietyIndicators={whatDoesThisMeanFreq:1,extraReviewCycles:0,escalations:0,attendanceDrop:false};
  p6a.stakeholders[1].trust=4;
  p6a.stakeholders[1].trustHistory=[{date:'2025-10-01',value:3,note:''},{date:'2025-12-01',value:3,note:'Cautious'},{date:'2026-02-01',value:4,note:'Improved after coaching'}];
  p6a.stakeholders[1].touchpoints=[
    {id:uid(),date:'2025-11-01',type:'Training Session',description:'Report builder workshop',trustImpact:'No Change'},
    {id:uid(),date:'2026-01-10',type:'Walkthrough',description:'One-on-one coaching on advanced reporting',trustImpact:'Increased'}
  ];
  p6a.stakeholders[1].anxietyIndicators={whatDoesThisMeanFreq:2,extraReviewCycles:1,escalations:0,attendanceDrop:false};
  // Value case — delivered
  p6a.valueCase={
    statement:'Consolidate payroll processing from 3 legacy systems to a single modern platform, reducing processing time from 4 days to 1 day per cycle and eliminating manual reconciliation.',
    requestor:'Chief Financial Officer',
    impactLevel:'High',
    successCriteria:[
      {id:uid(),criterion:'Payroll processing time reduced from 4 days to 1 day',metStatus:'Yes',actualOutcome:'Processing now takes 1.2 days — on target'},
      {id:uid(),criterion:'Zero payroll errors for first 3 cycles',metStatus:'Partially',actualOutcome:'1 minor error in cycle 2 related to garnishment — corrected within hours'},
      {id:uid(),criterion:'Manual reconciliation eliminated',metStatus:'Yes',actualOutcome:'Fully automated reconciliation in production'},
      {id:uid(),criterion:'Employee satisfaction above 4.0',metStatus:'Yes',actualOutcome:'Satisfaction score at 4.3 after 60-day survey'}
    ],
    unintendedConsequences:'HR Business Partners discovered the new reporting capabilities enabled workforce analytics they did not have before — leading to an unplanned but positive expansion of HR analytics capability.'
  };
  // Proof points — success evidence
  p6a.proofPoints=[
    {id:uid(),what:'Parallel payroll run produced zero-variance results against legacy system for 2 consecutive cycles',when:'2025-12-15',proves:'System accuracy validated before go-live. Quantitative evidence of readiness.',source:'System Data',dimensionTags:['Project Health','Training & Preparedness']},
    {id:uid(),what:'100% of payroll specialists completed all training modules with a 95% average assessment score',when:'2026-01-10',proves:'Strong knowledge transfer — L2 metrics confirm readiness.',source:'System Data',dimensionTags:['Training & Preparedness']},
    {id:uid(),what:'Post go-live support tickets averaged 12 per week — below the 20-ticket threshold',when:'2026-03-01',proves:'Healthy adoption. Users are self-sufficient with minimal support needs.',source:'Defect Log',dimensionTags:['Project Health']}
  ];
  r6.projects=[p6a];
  releases.push(r6);

  await saveData();setDemoMode(true);renderPortfolio();renderAlerts();showSuccess('You\u2019re in demo mode. Explore freely \u2014 nothing here is real data.');
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
  container.innerHTML='<div style="color:var(--ink-60);font-size:12px;padding:8px 0">Loading release intelligence\u2026</div>';
  const{data,error}=await _supabase.from('audit_log').select('*').eq('user_id',currentUserId).order('created_at',{ascending:false}).limit(50);
  if(error||!data||!data.length){container.innerHTML='<div class="es"><div class="es-rule"></div><p class="es-txt">No activity recorded yet. Actions you take in AdoptIQ will appear here as an audit trail.</p></div>';return;}
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
        alerts.push({id:'overdue-'+r.id,cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> was scheduled to launch <strong>${Math.abs(d)} day${Math.abs(d)===1?'':'s'} ago</strong> and is overdue.`});
      else if(d!==null&&d===0)
        alerts.push({id:'today-'+r.id,cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> launches <strong>today</strong>.`});
      else if(d!==null&&d<=7)
        alerts.push({id:'7day-'+r.id,cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> launches in <strong>${d} day${d===1?'':'s'}</strong>.`});
      else if(d!==null&&d<=30&&rl.status.cls!=='on-track')
        alerts.push({id:'30day-'+r.id,cls:'warn',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> launches in <strong>${d} days</strong> and is not on track.`});
    }
    if(rl.status.cls==='critical')
      alerts.push({id:'crit-'+r.id,cls:'crit',msg:`<span class="alert-link" onclick="openRelease(${r.id})">${esc(r.name)}</span> is <strong>Critical</strong> — ${rl.flags} open issue${rl.flags===1?'':'s'} require attention.`});
  });
  // Deduplicate and filter dismissed
  const seen=new Set();const deduped=alerts.filter(a=>{const k=a.id;if(seen.has(k)||dismissed.includes(k))return false;seen.add(k);return true;});
  if(!deduped.length){bar.style.display='none';return;}
  bar.style.display='block';
  const MAX_VISIBLE=3;
  const visible=deduped.slice(0,MAX_VISIBLE);
  const overflow=deduped.length-MAX_VISIBLE;
  let html=`<div style="max-width:1440px;margin:0 auto;padding:4px 0">`;
  html+=visible.map(a=>`<div class="alert-item" data-alert-id="${a.id}"><span class="alert-dot ${a.cls}"></span><span>${a.msg}</span><button class="alert-dismiss" onclick="dismissAlert('${a.id}')" title="Dismiss">&times;</button></div>`).join('');
  if(overflow>0){
    html+=`<div class="alert-overflow" id="alert-overflow">${deduped.slice(MAX_VISIBLE).map(a=>`<div class="alert-item" data-alert-id="${a.id}"><span class="alert-dot ${a.cls}"></span><span>${a.msg}</span><button class="alert-dismiss" onclick="dismissAlert('${a.id}')" title="Dismiss">&times;</button></div>`).join('')}</div>`;
    html+=`<button class="alert-toggle-btn" id="alert-toggle-btn" onclick="toggleAlertOverflow()">Show ${overflow} more</button>`;
  }
  html+=`</div>`;
  bar.innerHTML=html;
}
function toggleAlertOverflow(){
  const ov=document.getElementById('alert-overflow');
  const btn=document.getElementById('alert-toggle-btn');
  if(!ov||!btn)return;
  const showing=ov.classList.toggle('show');
  btn.textContent=showing?'Show less':'Show '+ov.querySelectorAll('.alert-item').length+' more';
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
      document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg);font-family:DM Sans,sans-serif"><div style="text-align:center;max-width:400px;padding:40px"><div style="font-size:48px;margin-bottom:16px"><i class="ph ph-link-break" style="font-size:48px"></i></div><h2 style="font-family:DM Serif Display,Georgia,serif;margin-bottom:12px">Link Expired or Invalid</h2><p style="color:#666;font-size:14px">This shared dashboard link has expired, been revoked, or does not exist.</p><a href="/" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#b8922a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Go to AdoptIQ</a></div></div>';
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
    console.error('Share link creation failed');return;
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
    return`<span class="trend-delta ${good?'trend-up':'trend-down'}">${up?'<i class="ph ph-arrow-up"></i> +':'<i class="ph ph-arrow-down"></i> '}${Math.abs(val)}${unit} this week</span>`;
  };
  const kpiEl=document.getElementById('trend-kpis');
  if(kpiEl)kpiEl.innerHTML=`
    <div class="trend-kpi"><div class="trend-kpi-label">Readiness</div><div class="trend-kpi-val">${curGate!=null?curGate+'%':'—'}</div>${deltaHtml(gateDelta,'%',false)}</div>
    <div class="trend-kpi"><div class="trend-kpi-label">Risk Flags</div><div class="trend-kpi-val">${curFlags!=null?curFlags:'—'}</div>${deltaHtml(flagDelta,'',true)}</div>
    <div class="trend-kpi"><div class="trend-kpi-label">${fwShort()} Score</div><div class="trend-kpi-val">${curAdkar!=null?curAdkar+'/5':'—'}</div>${deltaHtml(adkarDelta,'',false)}</div>
    <div class="trend-kpi"><div class="trend-kpi-label">Weeks Tracked</div><div class="trend-kpi-val">${recent.length}</div><span class="trend-delta trend-neutral">${labels[0]} — ${labels[labels.length-1]}</span></div>
  `;

  // ── Auto-generated Insights ──
  const insights=[];
  // Gate readiness trajectory
  if(gateDelta!==null){
    if(gateDelta>0)insights.push({icon:'<i class="ph ph-arrow-up"></i>',cls:'good',text:`Portfolio readiness improved by <strong>${gateDelta}%</strong> this week, now at <strong>${curGate}%</strong>.`});
    else if(gateDelta<0)insights.push({icon:'<i class="ph ph-arrow-down"></i>',cls:'warn',text:`Portfolio readiness dropped by <strong>${Math.abs(gateDelta)}%</strong> this week to <strong>${curGate}%</strong> — review incomplete gates.`});
    else insights.push({icon:'—',cls:'neutral',text:`Gate readiness held steady at <strong>${curGate}%</strong>.`});
  }
  // Gate vs target
  if(curGate!=null&&curGate<80)insights.push({icon:'<i class="ph ph-warning-circle"></i>',cls:'warn',text:`Portfolio is <strong>${80-curGate}%</strong> below the 80% go-live readiness target.`});
  else if(curGate!=null&&curGate>=80)insights.push({icon:'<i class="ph ph-check-circle"></i>',cls:'good',text:`Portfolio exceeds the 80% go-live readiness target.`});
  // Risk flags
  if(flagDelta!==null){
    if(flagDelta>0)insights.push({icon:'!',cls:'warn',text:`Risk flags increased by <strong>${flagDelta}</strong> this week (now ${curFlags}). Investigate new incomplete gates.`});
    else if(flagDelta<0)insights.push({icon:'<i class="ph ph-check-circle"></i>',cls:'good',text:`Risk flags decreased by <strong>${Math.abs(flagDelta)}</strong> this week (now ${curFlags}).`});
  }
  // ADKAR stagnation
  if(adkarAvgs.length>=3){
    const last3=adkarAvgs.slice(-3);
    const flat=last3.every((v,_,a)=>v!=null&&Math.abs(v-a[0])<0.2);
    if(flat&&curAdkar!=null&&curAdkar<4)insights.push({icon:'<i class="ph ph-minus-square"></i>',cls:'warn',text:`${fwShort()} scores have been flat at <strong>${curAdkar}/5</strong> for 3+ weeks — reinforcement activities may need attention.`});
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
    if(bestDelta>0)insights.push({icon:'<i class="ph ph-arrow-up"></i>',cls:'good',text:`<strong>${esc(bestName)}</strong> improved the most this week (+${bestDelta}% readiness).`});
    if(worstDelta<0)insights.push({icon:'<i class="ph ph-arrow-down"></i>',cls:'warn',text:`<strong>${esc(worstName)}</strong> declined this week (${worstDelta}% readiness) — may need intervention.`});
  }

  const insEl=document.getElementById('trend-insights');
  const insOverflow=document.getElementById('trend-insights-overflow');
  const insToggle=document.getElementById('trend-insights-toggle');
  if(insEl){
    if(!insights.length){
      insEl.innerHTML='<div class="es"><p class="es-txt">Trends build over time.</p><p class="es-txt">You\u2019ll see readiness trajectories here as scores accumulate across releases. Keep assessing \u2014 the picture will form.</p></div>';
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
  // Readiness with 80% goal line
  destroyChart('trend-gate');
  const gc=document.getElementById('chart-trend-gate');
  if(gc){
    const goalLine=new Array(labels.length).fill(80);
    chartInstances['trend-gate']=new Chart(gc,{type:'line',data:{
      labels,datasets:[
        {label:'Readiness %',data:gateScores,borderColor:CHART_GREEN,backgroundColor:'rgba(29,104,64,0.1)',fill:true,tension:0.3,pointRadius:4,pointBackgroundColor:CHART_GREEN,borderWidth:2},
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

  // ── Re-render charts when details toggle opens ──
  const detWrap=document.getElementById('chart-trend-gate')?.closest('details');
  if(detWrap&&!detWrap._toggleBound){
    detWrap._toggleBound=true;
    detWrap.addEventListener('toggle',()=>{
      if(detWrap.open){
        ['trend-gate','trend-flags','trend-adkar'].forEach(k=>{
          if(chartInstances[k])chartInstances[k].resize();
        });
      }
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
