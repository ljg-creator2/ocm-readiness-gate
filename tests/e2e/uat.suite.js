// User journeys: landing, sign-in, Command Center, sidebar, account menu, project tabs, exports, view-only, mobile, keyboard.
'use strict';
module.exports=async function(t){
  const {ok,wait,ev}=t;const page=o=>t.page(Object.assign({vp:{width:1536,height:1024},wait:1500},o||{}));
  let pg;

  // ── LANDING ──
  pg=await page();
  ok('Landing','Opens on landing page',await pg.isVisible('#v-landing .ld-h1'));
  ok('Landing','Headline copy exact',(await pg.innerText('.ld-h1')).replace(/\s+/g,' ').trim()==='Know where change stands. Know what to do next.',await pg.innerText('.ld-h1'));
  ok('Landing','Supporting copy exact',(await pg.textContent('.ld-lead')).trim()==='AdoptIQ brings people, readiness, training, risk, and adoption into one connected workspace for change teams.');
  for(const id of ['ld-platform','ld-pillars','ld-action','ld-about'])ok('Landing','Nav anchor #'+id+' exists',await ev(pg,i=>!!document.getElementById(i),id),id);
  await pg.click('.ld-btn-ghost');await wait(400);
  ok('Landing','Watch Overview opens video modal',await ev(pg,()=>document.getElementById('ld-video')?.classList.contains('open')));
  await pg.keyboard.press('Escape');await wait(200);
  ok('Landing','Escape closes video modal',await ev(pg,()=>!document.getElementById('ld-video')?.classList.contains('open')));
  const sl0=await ev(pg,()=>document.getElementById('ld-cards').scrollLeft);
  await pg.setViewportSize({width:700,height:900});await wait(200);
  await ev(pg,()=>landingCards(1));await wait(700);
  ok('Landing','Card arrows scroll the carousel (narrow)',await ev(pg,()=>document.getElementById('ld-cards').scrollLeft)>sl0);
  await pg.setViewportSize({width:1536,height:1024});
  await pg.click('#v-landing .ld-nav .ld-btn-sm');await wait(400);
  ok('Landing','Request a Demo opens booking form',await pg.isVisible('#booking-modal'));
  await ev(pg,()=>document.getElementById('booking-modal')?.remove());
  await pg.click('.ld-icon');await wait(2200);
  ok('Landing','Search icon opens demo and focuses search',await ev(pg,()=>document.activeElement?.id==='cc-q'));
  ok('Landing','No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  await pg.context().close();

  // ── SIGN-IN ──
  pg=await page();
  await pg.click('.ld-signin');await wait(300);
  ok('Sign-in','Sign In opens split-screen sign-in',await pg.isVisible('.si-brand')&&await pg.isVisible('#login-signin'));
  await pg.click('#login-signin .si-btn');await wait(200);
  ok('Sign-in','Empty submit shows validation',(await pg.textContent('#login-err')).includes('Please enter'));
  await pg.fill('#signin-email','a@b.gov');await pg.fill('#signin-pw','x');await pg.press('#signin-pw','Enter');await wait(300);
  ok('Sign-in','Enter key submits; bad password shows error',(await pg.textContent('#login-err')).includes('Invalid'));
  await pg.click('.si-eye');ok('Sign-in','Show password toggle',await pg.getAttribute('#signin-pw','type')==='text');
  await pg.click('.si-eye');ok('Sign-in','Hide password toggle',await pg.getAttribute('#signin-pw','type')==='password');
  await pg.click('.si-ms');await wait(500);
  ok('Sign-in','Microsoft (provider off) explains it is not enabled',(await pg.textContent('#login-err')).includes("isn't enabled"));
  await pg.click('.si-link');await wait(200);
  ok('Sign-in','Forgot password opens reset form',await pg.isVisible('#login-forgot'));
  await pg.click('#login-forgot .si-btn');await wait(200);
  ok('Sign-in','Reset requires email',(await pg.textContent('#forgot-err')).includes('Please enter'));
  await pg.fill('#forgot-email','a@b.gov');await pg.click('#login-forgot .si-btn');await wait(300);
  ok('Sign-in','Reset sends link',(await ev(pg,()=>JSON.stringify(__calls))).includes('reset'));
  await wait(2200);
  ok('Sign-in','Returns to sign-in after reset',await pg.isVisible('#login-signin'));
  await pg.click('text=Create an account');await wait(200);
  ok('Sign-in','Create account form opens',await pg.isVisible('#login-signup'));
  await pg.fill('#signup-email','a@b.gov');await pg.fill('#signup-pw','short');await pg.fill('#signup-confirm','short');await pg.click('#login-signup .si-btn');await wait(200);
  ok('Sign-in','Weak password rejected',(await pg.textContent('#signup-err')).length>0,await pg.textContent('#signup-err'));
  await pg.fill('#signup-pw','Str0ng!Passw0rd#');await pg.fill('#signup-confirm','Str0ng!Passw0rd#x');await pg.click('#login-signup .si-btn');await wait(200);
  ok('Sign-in','Mismatched confirm rejected',(await pg.textContent('#signup-err')).includes('match'));
  await pg.fill('#signup-confirm','Str0ng!Passw0rd#');await pg.click('#login-signup .si-btn');await wait(400);
  ok('Sign-in','Valid sign-up calls Supabase and shows verify screen',(await ev(pg,()=>JSON.stringify(__calls))).includes('signup')&&await pg.isVisible('#login-verify'));
  await pg.click('#login-verify .si-btn');await wait(200);
  await pg.uncheck('#signin-remember');await pg.fill('#signin-email','a@b.gov');await pg.fill('#signin-pw','x');await pg.click('#login-signin .si-btn');await wait(300);
  ok('Sign-in','Keep me signed in: unchecked does not persist on failed sign-in',await ev(pg,()=>localStorage.getItem('adoptiq_session_only'))===null);
  await pg.click('.si-logo');await wait(300);
  ok('Sign-in','Logo returns to landing',await pg.isVisible('#v-landing .ld-h1'));
  ok('Sign-in','No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  await pg.context().close();
  pg=await page({az:true});
  await ev(pg,()=>landingToLogin());await pg.click('.si-ms');await wait(500);
  ok('Sign-in','Microsoft (provider on) starts Azure sign-in',(await ev(pg,()=>JSON.stringify(__calls))).includes('azure'));
  await pg.context().close();

  // ── COMMAND CENTER ──
  pg=await page();
  await ev(pg,()=>landingToDemo());await wait(2000);
  ok('Command Center','Five rows in order',JSON.stringify(await ev(pg,()=>[...document.querySelectorAll('#cc > :not(p)')].map(e=>e.className.split(' ').pop())))===JSON.stringify(['cc-hd','cc-top','cc-kpis','cc-row3','cc-activity','cc-milestones']),await ev(pg,()=>[...document.querySelectorAll('#cc > *')].map(e=>e.className).join(',')));
  ok('Command Center','No removed panels (Ecosystem / Top Initiatives / Initiative Health)',await ev(pg,()=>!/Ecosystem|Top Initiatives|Initiative Health/i.test(document.getElementById('cc').innerText)));
  ok('Command Center','Background is pure white',await ev(pg,()=>getComputedStyle(document.getElementById('v-portfolio')).backgroundColor)==='rgb(255, 255, 255)');
  ok('Command Center','Four KPI cards',await ev(pg,()=>document.querySelectorAll('.cc-kpi').length)===4);
  ok('Command Center','KPI Active Initiatives = data',await ev(pg,()=>+document.querySelector('.cc-kpi .cc-kpi-v').textContent===ccKpis().active.v));
  ok('Command Center','Readiness chart drawn',await ev(pg,()=>!!_cc.chart&&_cc.chart.data.datasets.length===3));
  ok('Command Center','Milestone timeline is horizontal',await ev(pg,()=>{const i=[...document.querySelectorAll('.cc-tl-i')];return i.length>1&&i[1].getBoundingClientRect().left>i[0].getBoundingClientRect().left&&Math.abs(i[1].getBoundingClientRect().top-i[0].getBoundingClientRect().top)<2}));
  ok('Command Center','Recent Activity spans full width',await ev(pg,()=>{const a=document.querySelector('.cc-activity').getBoundingClientRect(),k=document.querySelector('.cc-kpis').getBoundingClientRect();return Math.abs(a.width-k.width)<2}));
  const pname=await ev(pg,()=>releases.find(r=>r.projects.length).projects[0].name);
  await pg.fill('#cc-q',pname.slice(0,6));await wait(300);
  ok('Command Center','Search returns results',await ev(pg,()=>document.querySelectorAll('#cc-results button').length)>0);
  await pg.click('#cc-results button');await wait(800);
  ok('Command Center','Search result opens the item',await ev(pg,()=>document.getElementById('v-project').classList.contains('active')||document.getElementById('v-release').classList.contains('active')));
  await ev(pg,()=>sbNav('command'));await wait(500);
  await pg.click('[aria-label^="Notifications"]');await wait(200);
  ok('Command Center','Bell opens notifications',await ev(pg,()=>document.getElementById('cc-bell').classList.contains('open')));
  await pg.keyboard.press('Escape');
  await pg.click('[aria-label="Help"]');await wait(200);
  ok('Command Center','Help menu opens',await ev(pg,()=>document.getElementById('cc-help').classList.contains('open')));
  await pg.keyboard.press('Escape');
  const m0=await ev(pg,()=>ccSelMonth());
  await pg.selectOption('.cc-month select',{index:5});await wait(400);
  ok('Command Center','Month selector changes period',await ev(pg,()=>ccSelMonth())!==m0);
  await ev(pg,()=>{_cc.month=null;renderCommandCenter();});await wait(300);
  const nAct=await ev(pg,()=>ccActionItems().items.length);
  if(nAct>4){await pg.click('#cc-act-h ~ .cc-link');await wait(300);ok('Command Center','My Action Items View All expands',await ev(pg,()=>document.querySelectorAll('.cc-actions .cc-list li').length)===nAct);}
  await pg.click('.cc-actions .cc-li-t');await wait(800);
  ok('Command Center','Action item opens its project tab',await ev(pg,()=>document.getElementById('v-project').classList.contains('active')));
  await ev(pg,()=>sbNav('command'));await wait(500);
  const tl0=await ev(pg,()=>document.getElementById('cc-tl')?.scrollLeft||0);
  if(await pg.isVisible('.cc-tl-next')){await pg.click('.cc-tl-next');await wait(700);ok('Command Center','Milestone arrow scrolls timeline',await ev(pg,()=>document.getElementById('cc-tl').scrollLeft)>tl0);}
  await pg.click('.cc-tl-n');await wait(800);
  ok('Command Center','Milestone opens its release/project',await ev(pg,()=>document.getElementById('v-release').classList.contains('active')||document.getElementById('v-project').classList.contains('active')));
  ok('Command Center','No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  // ── SIDEBAR + ACCOUNT MENU ──
  for(const k of ['command','initiatives','people','risk','training','stakeholders','adoption','reports']){
    await ev(pg,k=>sbNav(k),k);await wait(350);
    ok('Sidebar','"'+k+'" opens and is marked current',await ev(pg,k=>document.querySelector('.sb-item[data-sb="'+k+'"]').getAttribute('aria-current')==='page',k));
  }
  await ev(pg,()=>sbNav('command'));await wait(300);
  await pg.click('#sb-user');await wait(200);
  ok('Account menu','Opens from profile block',await pg.isVisible('#sb-tools'));
  ok('Account menu','Sign out hidden in demo (read-only) as designed',await ev(pg,()=>getComputedStyle(document.querySelector('#sb-tools .btn-signout')).display==='none'));
  ok('Account menu','Contains role switch, profile, theme, sign out',await ev(pg,()=>{const t=document.getElementById('sb-tools').innerText;return /Profile and password/.test(t)&&/Theme/.test(t)&&!!document.querySelector('#sb-tools .btn-signout')&&!!document.querySelector('#sb-tools #view-role-select')}));
  await pg.selectOption('#view-role-select','exec_sponsor');await wait(400);
  ok('Account menu','Role switch updates profile label',(await pg.textContent('#sb-urole')).includes('Executive'));
  await pg.selectOption('#view-role-select','admin');await wait(300);
  await ev(pg,()=>sbMenu(true));await wait(100);await pg.click('#sb-tools >> text=Theme');await wait(400);
  ok('Account menu','Theme toggles to dark',await ev(pg,()=>document.documentElement.getAttribute('data-theme'))==='dark');
  await ev(pg,()=>toggleTheme());await wait(300);
  ok('Account menu','Theme toggles back to light',await ev(pg,()=>document.documentElement.getAttribute('data-theme'))==='light');
  await ev(pg,()=>sbMenu(true));await wait(100);await pg.keyboard.press('Escape');await wait(100);
  ok('Account menu','Escape closes menu',!(await pg.isVisible('#sb-tools')));
  // ── RELEASE + PROJECT ──
  const rid=await ev(pg,()=>releases[0].id);
  await ev(pg,id=>openRelease(id),rid);await wait(700);
  ok('Release','Release page opens with sidebar',await ev(pg,()=>document.getElementById('v-release').classList.contains('active')&&document.body.classList.contains('app-shell')));
  const tabs=['overview','deps','learndev','readiness','actions','milestones','environments','gates','adkar','lifecycle','flags','craid','impact','gaps','adopthm','trainplan','adoption','pulse','postlaunch','sustain','resources','heatmap'];
  for(const t of tabs){
    const before=pg._errs.length;
    await ev(pg,t=>{const r=releases.find(x=>x.projects&&x.projects.length);openProjectFromPortfolio(r.id,r.projects[0].id,t);},t);await wait(450);
    ok('Project tabs','"'+t+'" renders without errors',await ev(pg,t=>document.getElementById('psec-'+t)?.classList.contains('active')&&document.getElementById('psec-'+t).innerText.trim().length>0,t)&&pg._errs.length===before,pg._errs.slice(before).join(' | '));
  }
  // ── EXPORTS ──
  for(const f of ['exportStatusReport','exportHandoffPDF','exportReleasePDF'])ok('Exports',f+' available',await ev(pg,f=>typeof window[f]==='function',f));
  await ev(pg,()=>{window.__opened=[];});
  await ev(pg,()=>{const r=releases.find(x=>x.projects&&x.projects.length);openProjectFromPortfolio(r.id,r.projects[0].id,'overview');});await wait(400);
  const e0=pg._errs.length;await ev(pg,()=>exportStatusReport());await wait(600);
  ok('Exports','Status report generates',pg._errs.length===e0&&(await ev(pg,()=>window.__opened.length))>0,pg._errs.slice(e0).join(' | '));
  ok('Release/Project','No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  // ── VIEW-ONLY ──
  await ev(pg,()=>{sbNav('command');enableReadOnly();});await wait(500);
  ok('View-only','Command Center still renders',await ev(pg,()=>document.querySelectorAll('.cc-kpi').length===4));
  ok('View-only','Body flagged read-only',await ev(pg,()=>document.body.classList.contains('readonly-mode')));
  await pg.context().close();

  // ── MOBILE ──
  pg=await page({vp:{width:390,height:844}});
  await ev(pg,()=>landingToDemo());await wait(1800);
  ok('Mobile','Sidebar hidden by default',await ev(pg,()=>document.querySelector('.sb').getBoundingClientRect().right<=0));
  await pg.click('#cc .sb-open');await wait(400);
  ok('Mobile','Menu button opens navigation drawer',await ev(pg,()=>document.querySelector('.sb').getBoundingClientRect().left>=0));
  await pg.click('.sb-item[data-sb="initiatives"]');await wait(500);
  ok('Mobile','Choosing a section closes the drawer',await ev(pg,()=>!document.body.classList.contains('sb-drawer')));
  ok('Mobile','No horizontal scroll',await ev(pg,()=>document.documentElement.scrollWidth<=innerWidth+1));
  await pg.context().close();

  // ── KEYBOARD ──
  pg=await page();
  await ev(pg,()=>landingToLogin());await wait(300);
  await pg.focus('#signin-email');await pg.keyboard.press('Tab');
  ok('Keyboard','Tab moves email → password',await ev(pg,()=>document.activeElement.id)==='signin-pw');
  await pg.context().close();
};
