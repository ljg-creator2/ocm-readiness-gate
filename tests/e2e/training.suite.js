// Training-led OCM: editing journey, record rules, sign-in drawer, demo story, organization term, phone layout.
'use strict';
module.exports=async function(t){
  const {ok,wait,ev}=t;
  // ── Editing journey (view-only switched off on the demo data) ──
  let pg=await t.page({wait:1500});
  await ev(pg,()=>landingToDemo());await wait(2500);
  await ev(pg,()=>{isReadOnly=false;document.body.classList.remove('readonly-mode');const r=releases[0],p=r.projects[0];openProjectFromPortfolio(r.id,p.id,'overview');});
  await wait(800);
  const okJ=(n,c,d)=>ok('Training journey',n,c,d);
  const fill=async(sel,v)=>{await pg.fill(sel,v);};
  const save=async()=>{await pg.click('#tr-dlg-save');await pg.waitForTimeout(300);};
  // Learning development: workflow, scenario, deliverables
  await pg.evaluate(()=>showPGroup('learn'));await pg.waitForTimeout(300);
  await pg.click('#tr-learndev >> text=Add workflow');await fill('#trf-name','Claims intake');
  await pg.locator('#trf-audienceIds input').first().check();await save();
  okJ('workflow saved',await pg.evaluate(()=>getProj().training.workflows.length===1),'');
  await pg.click('#tr-learndev >> text=Add objective');await fill('#trf-task','Register a household claim');await pg.selectOption('#trf-workflowId',{index:1});await save();
  await pg.click('#tr-learndev >> text=Add scenario');await fill('#trf-title','Register a household claim');await pg.check('#trf-critical');await pg.selectOption('#trf-workflowId',{index:1});await pg.locator('#trf-objectiveIds input').first().check();await fill('#trf-qaEvidence','QA-112 passed');await save();
  await pg.click('#tr-learndev >> text=Add deliverable');await fill('#trf-title','Intake workbook exercise');await pg.selectOption('#trf-type','exercise');await pg.selectOption('#trf-state','draft');await pg.check('#trf-critical');await pg.locator('#trf-scenarioIds input').first().check();await save();
  await pg.click('#tr-learndev >> text=Add deliverable');await fill('#trf-title','Intake job aid');await pg.selectOption('#trf-state','draft');await save();
  const t1=await pg.evaluate(()=>{const t=getProj().training;return{sc:t.scenarios.length,d:t.deliverables.length,link:t.deliverables[0].scenarioIds.length}});
  okJ('scenario + 2 deliverables linked',t1.sc===1&&t1.d===2&&t1.link===1,JSON.stringify(t1));
  // Dependency: required fields enforced
  await pg.evaluate(()=>showPGroup('deps'));await pg.waitForTimeout(300);
  await pg.click('#tr-deps >> text=Add dependency');await save();
  okJ('required fields enforced',(await pg.textContent('#tr-dlg-err')).includes('Required'),await pg.textContent('#tr-dlg-err'));
  await fill('#trf-title','Training environment can run the intake scenario');await pg.check('#trf-critical');await fill('#trf-workstream','Environment support');await fill('#trf-owner','J. Okafor');
  await fill('#trf-requiredBy','2026-10-20');await pg.selectOption('#trf-phase','2');await pg.locator('#trf-scenarioIds input').first().check();await pg.selectOption('#trf-status','blocked');
  await fill('#trf-consequence','Workbook practice cannot be validated');await pg.check('#trf-permits-scenarioDev');
  await fill('#trf-next-action','Restore learner permissions in TRN-2');await fill('#trf-next-owner','J. Okafor');await fill('#trf-next-due','2026-10-15');await save();
  const t2=await pg.evaluate(()=>{const p=getProj(),t=p.training;const b=TE.brief(p,trCtx(p));return{deps:t.dependencies.length,acts:t.actions.length,rec:b.rec.state,del:b.del.state,dev:b.dev.state,proceed:b.canProceed.map(x=>x.d.title),rows:document.querySelectorAll('#tr-deps tbody tr').length}});
  okJ('dependency recorded, action created once',t2.deps===1&&t2.acts===1&&t2.rows===1,JSON.stringify(t2));
  okJ('delivery blocked, development continues',t2.del==='blocked'&&t2.dev!=='blocked'&&t2.proceed.length===2,JSON.stringify(t2));
  // Exception without approver is rejected
  await pg.click('#tr-deps .tr-rowlink');await pg.selectOption('#trf-status','exception');await fill('#trf-exception-rationale','Use a recorded demonstration');await save();
  const e=await pg.textContent('#tr-dlg-err');okJ('exception needs approver and date',/approver|date/i.test(e),e);
  await pg.click('.tr-dlg-ft >> text=Cancel');
  okJ('status unchanged after rejected exception',await pg.evaluate(()=>getProj().training.dependencies[0].status==='blocked'),'');
  // Resolve with evidence; scenario still not validated
  await pg.click('#tr-deps .tr-rowlink');await pg.selectOption('#trf-status','satisfied');await fill('#trf-evidence-ref','ENV-77');await fill('#trf-evidence-version','R1030');await fill('#trf-evidence-date','2026-10-11');await pg.check('#trf-evidence-verified');await save();
  okJ('resolving the dependency does not validate the scenario',await pg.evaluate(()=>{const p=getProj();return !TE.scenarioValidated(p.training.scenarios[0])&&TE.deliveryReadiness(p,trCtx(p)).state==='blocked';}),'');
  // Run scenario
  await pg.evaluate(()=>showPGroup('learn'));await pg.waitForTimeout(300);
  await pg.click('#tr-learndev >> text=Record a run');await pg.selectOption('#trf-status','pass');await fill('#trf-environment','TRN-2');await save();
  okJ('scenario validated after a passing run',await pg.evaluate(()=>TE.scenarioValidated(getProj().training.scenarios[0])),'');
  // Approve deliverables, then evidence version change flags linked work
  await pg.evaluate(()=>{const p=getProj();p.training.deliverables.forEach(d=>{TE.setDeliverableState(p,d.id,'approved',trCtx(p));d.reviews.push({date:'2026-10-11',reviewer:'SME',outcome:'Approved'});});trRefresh();});
  await pg.evaluate(()=>showPGroup('deps'));await pg.waitForTimeout(200);await pg.click('#tr-filters >> text=All').catch(()=>{});
  await pg.evaluate(()=>{_trDepFilter='all';trRenderDeps();});
  await pg.click('#tr-deps .tr-rowlink');await fill('#trf-evidence-version','R1031');await save();
  const t3=await pg.evaluate(()=>{const t=getProj().training;return{sc:!!t.scenarios[0].needsRevalidation,d0:!!t.deliverables[0].revisionFlag,d1:!!t.deliverables[1].revisionFlag,st:t.deliverables[0].state}});
  okJ('version change flags linked scenario and deliverable only',t3.sc&&t3.d0&&!t3.d1&&t3.st==='approved',JSON.stringify(t3));
  // Heat map derived
  await pg.evaluate(()=>goPTab('heatmap'));await pg.waitForTimeout(300);
  const hm=await pg.evaluate(()=>[...document.querySelectorAll('#p-dep-hm .hm-cell')].filter(c=>c.dataset.s!=='0').map(c=>c.textContent));
  okJ('heat map shows the record',hm.length===1&&/Satisfied/.test(hm[0]),JSON.stringify(hm));
  // Gate red -> one action; consequence pairing
  await pg.evaluate(()=>{setPGate('g1',5,'red');setPGate('g1',5,'red');setPGate('g1',5,'red');});
  const t4=await pg.evaluate(()=>{const p=getProj();return{a:p.training.actions.filter(a=>a.source.type==='gate').length,c:getProjFlags(p).find(f=>f.key==='g1_5')?.consequence}});
  okJ('gate criterion creates one action',t4.a===1,JSON.stringify(t4));
  okJ('Gate 1 item 6 has its own consequence',/resources are unconfirmed/.test(t4.c||''),t4.c);
  // ADKAR rated tracking
  await pg.evaluate(()=>{const p=getProj();p.adkarRated=[];updatePAdkar('Ab','2');});
  okJ('ADKAR rating recorded',await pg.evaluate(()=>getProj().adkarRated.includes('Ab')),'');
  // Brief renders, every status clickable
  await pg.evaluate(()=>showPGroup('brief'));await pg.waitForTimeout(300);
  okJ('brief has blocked/proceed sections',await pg.evaluate(()=>/What can proceed/.test(document.getElementById('proj-brief').textContent)),'');
  // Read-only: dialog opens without save
  await pg.evaluate(()=>{isReadOnly=true;showPGroup('deps');});await pg.waitForTimeout(200);
  await pg.click('#tr-deps .tr-rowlink');
  okJ('read-only dialog hides Save and disables fields',await pg.evaluate(()=>document.getElementById('tr-dlg-save').hidden&&document.getElementById('trf-title').disabled),'');
  await pg.keyboard.press('Escape');okJ('Escape closes and returns focus',await pg.evaluate(()=>document.getElementById('tr-dlg').hidden&&document.activeElement.classList.contains('tr-rowlink')),'');
  await pg.evaluate(()=>{isReadOnly=false;});
  // Save and reopen: persistence through JSON round trip
  const rt=await pg.evaluate(()=>{const p=getProj();const c=JSON.parse(JSON.stringify(p));TE.migrate(c,trCtx(c));return c.training.dependencies.length===1&&c.training.deliverables.length===2&&c.training.history.length>5;});
  okJ('JSON round trip keeps records',rt,'');
  okJ('No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  await pg.context().close();

  // ── Suggestions from data already entered (CRAID log, Impact Assessment, Resources) ──
  pg=await t.page({wait:1500});
  await ev(pg,()=>landingToDemo());await wait(2500);
  await ev(pg,()=>{isReadOnly=false;document.body.classList.remove('readonly-mode');const r=releases.find(x=>x.projects.some(p=>p.name==='Clinical Workflow'));const p=r.projects.find(p=>p.name==='Clinical Workflow');openProjectFromPortfolio(r.id,p.id,'deps');});await wait(800);
  const okS=(n,c,d)=>ok('Suggestions',n,c,d);
  const before=await ev(pg,()=>({deps:getProj().training.dependencies.length,box:!!document.querySelector('#tr-deps .tr-suggest'),items:TE.suggestions(getProj()).dependencies.map(x=>x.label)}));
  okS('Open CRAID dependencies are suggested, not created',before.box&&before.items.length>=1,JSON.stringify(before));
  await pg.click('#tr-deps .tr-suggest >> text=Review and add');await wait(300);
  const pre=await ev(pg,()=>({title:document.getElementById('trf-title').value,owner:document.getElementById('trf-owner').value,ws:document.getElementById('trf-workstream').value,due:document.getElementById('trf-requiredBy').value}));
  okS('Review opens the form pre-filled from the CRAID entry',pre.title===before.items[0]&&!!pre.owner&&!!pre.due,JSON.stringify(pre));
  okS('Workstream is filled from the owner\'s role in Resources',pre.ws==='Project Manager',pre.ws);
  await pg.click('#tr-dlg-save');await wait(300);
  const after=await ev(pg,()=>{const t=getProj().training;return{deps:t.dependencies.length,craid:t.dependencies.some(d=>d.craidId),left:TE.suggestions(getProj()).dependencies.length,box:!!document.querySelector('#tr-deps .tr-suggest')};});
  okS('Saving adds one record linked to the CRAID entry and clears the suggestion',after.deps===before.deps+1&&after.craid&&after.left===before.items.length-1,JSON.stringify(after));
  await pg.click('#tr-deps >> text=Add dependency');await wait(200);
  await pg.fill('#trf-workstream','Functional');await pg.dispatchEvent('#trf-workstream','input');
  const own=await ev(pg,()=>document.getElementById('trf-owner').value);
  okS('Choosing a workstream fills the accountable person from Resources',own==='Dr. Emily Wilson',own);
  await pg.fill('#trf-owner','Someone Else');await pg.fill('#trf-workstream','QA');await pg.dispatchEvent('#trf-workstream','input');
  okS('A person typed by hand is never overwritten',await ev(pg,()=>document.getElementById('trf-owner').value)==='Someone Else');
  await ev(pg,()=>trCloseDialog());
  await ev(pg,()=>showPGroup('learn'));await wait(400);
  const wfs=await ev(pg,()=>({labels:TE.suggestions(getProj()).workflows.map(x=>x.label),box:!!document.querySelector('#tr-learndev .tr-suggest')}));const wf=wfs.labels;
  okS('Impact Assessment groups are suggested as changed workflows',wf.length>=1&&wfs.box,JSON.stringify(wfs));
  await pg.click('#tr-learndev .tr-suggest >> text=Dismiss');await wait(300);
  okS('Dismiss removes one suggestion and adds nothing',await ev(pg,n=>TE.suggestions(getProj()).workflows.length===n-1&&getProj().training.workflows.length===0,wf.length));
  await pg.click('#tr-learndev .tr-suggest >> text=Review and add');await wait(300);
  const wfv=await ev(pg,()=>({name:document.getElementById('trf-name').value,change:document.getElementById('trf-change').value}));
  okS('Workflow form is pre-filled with today and after',/changed way of working/.test(wfv.name)&&/Today:/.test(wfv.change)&&/After:/.test(wfv.change),JSON.stringify(wfv));
  await pg.click('#tr-dlg-save');await wait(300);
  okS('Saved workflow is linked to its impact group',await ev(pg,()=>getProj().training.workflows.length===1&&!!getProj().training.workflows[0].impactGroup));
  await ev(pg,()=>{isReadOnly=true;showPGroup('deps');});await wait(300);
  okS('View-only shows suggestions without add buttons',await ev(pg,()=>{const b=document.querySelector('#tr-deps .tr-suggest');return !b||!b.querySelector('button');}));
  okS('No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  await pg.context().close();

  // ── Sign-in drawer over the landing page ──
  pg=await t.page({wait:1500});
  await pg.focus('.ld-signin');await pg.click('.ld-signin');await wait(400);
  const st=await ev(pg,()=>({land:document.getElementById('v-landing').classList.contains('active'),inert:document.getElementById('v-landing').inert,role:document.getElementById('v-login').getAttribute('role'),modal:document.getElementById('v-login').getAttribute('aria-modal'),focus:document.activeElement.id}));
  ok('Sign-in drawer','Opens over the landing page as a modal dialog',st.land&&st.inert&&st.role==='dialog'&&st.modal==='true',JSON.stringify(st));
  ok('Sign-in drawer','Focus starts on the email field',st.focus==='signin-email',st.focus);
  let inside=true;for(let i=0;i<25;i++){await pg.keyboard.press('Tab');if(!(await ev(pg,()=>document.getElementById('v-login').contains(document.activeElement))))inside=false;}
  for(let i=0;i<25;i++){await pg.keyboard.press('Shift+Tab');if(!(await ev(pg,()=>document.getElementById('v-login').contains(document.activeElement))))inside=false;}
  ok('Sign-in drawer','Tab and Shift+Tab stay inside',inside);
  await pg.keyboard.press('Escape');await wait(200);
  const esc=await ev(pg,()=>({login:document.getElementById('v-login').classList.contains('active'),land:document.getElementById('v-landing').classList.contains('active'),inert:document.getElementById('v-landing').inert,focus:document.activeElement.className}));
  ok('Sign-in drawer','Escape returns to the landing page with focus on Sign In',!esc.login&&esc.land&&!esc.inert&&/ld-signin/.test(esc.focus),JSON.stringify(esc));
  await pg.click('.ld-signin');await wait(300);await pg.click('.si-close');await wait(200);
  ok('Sign-in drawer','Close button returns to the landing page',await ev(pg,()=>!document.getElementById('v-login').classList.contains('active')&&document.getElementById('v-landing').classList.contains('active')));
  await pg.click('.ld-signin');await wait(300);await ev(pg,()=>hideLogin());
  ok('Sign-in drawer','Successful sign-in path clears drawer and landing',await ev(pg,()=>!document.getElementById('v-login').classList.contains('active')&&!document.getElementById('v-landing').classList.contains('active')&&!document.body.classList.contains('si-open')));
  await pg.context().close();

  // ── Demo story, Command Center feed, organization term ──
  pg=await t.page({wait:1500});
  await ev(pg,()=>landingToDemo());await wait(2500);
  const info=await ev(pg,()=>{const r=releases.find(x=>x.name==='Benefits Modernization');const o={};r.projects.forEach(p=>{const c=trCtx(p);const b=TE.brief(p,c);o[p.name]={del:b.del.state,dev:b.dev.state,proceed:b.canProceed.length,hist:p.training.history.length};});return o;});
  const I=info['Benefits Claims Intake'],N=info['Benefits Renewal Notices'];
  ok('Demo','Claims Intake is Ready for delivery with a dated history',I&&I.del==='ready'&&I.hist>20,JSON.stringify(I));
  ok('Demo','Renewal Notices: delivery blocked, development continues',N&&N.del==='blocked'&&N.dev!=='blocked'&&N.proceed>=1,JSON.stringify(N));
  ok('Demo','KPI 2 is Delivery Readiness from the records',await ev(pg,()=>{const d=ccDeliveryReadiness(ccProjects().filter(x=>ccActive(x.p)));const v=document.querySelectorAll('.cc-kpi')[1];return /Delivery Readiness/.test(v.textContent)&&v.querySelector('.cc-kpi-v').textContent.replace(/\s+/g,' ').trim()===(d.assessed?d.ready+' of '+d.assessed:'—');}));
  ok('Demo','Training dependencies and deliveries appear as milestones',await ev(pg,()=>ccMilestones().some(m=>/Input needed|Planned delivery/.test(m.name))));
  ok('Demo','Training record changes appear in Recent Activity',await ev(pg,()=>ccActivity().some(a=>/Benefits/.test(a.sub)&&/Blocked|observed|Satisfied/.test(a.title))));
  await ev(pg,()=>{const b=getBrand();b.orgTerm='department';saveBrand(b);const r=releases.find(x=>x.name==='Benefits Modernization');openProjectFromPortfolio(r.id,r.projects[0].id,'overview');});await wait(800);
  const term=await ev(pg,()=>({lbl:[...document.querySelectorAll('#v-project .ib-label')].map(x=>x.textContent).join('|'),chip:document.getElementById('proj-agency-chips').textContent}));
  ok('Organization term','Labels switch to the chosen term',/Departments/.test(term.lbl),term.lbl);
  ok('Organization term','Entered names are not changed',/Riverside County Department of Social Services/.test(term.chip),term.chip);
  await ev(pg,()=>{const b=getBrand();b.orgTerm='agency';saveBrand(b);});
  ok('Demo','No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  await pg.context().close();

  // ── Phone layout: no sideways scroll on any of the eight project tabs ──
  pg=await t.page({vp:{width:390,height:844},wait:1500});
  await ev(pg,()=>landingToDemo());await wait(2500);
  await ev(pg,()=>{const r=releases.find(x=>x.name==='Benefits Modernization');openProjectFromPortfolio(r.id,r.projects[1].id,'overview');});await wait(800);
  for(const g of ['brief','people','deps','learn','ready','actions','delivery','adoption']){
    await ev(pg,g=>showPGroup(g),g);await wait(350);
    const ov=await ev(pg,()=>document.documentElement.scrollWidth-innerWidth);
    ok('Phone layout','"'+g+'" tab has no sideways scroll',ov<=1,ov+'px');
  }
  await pg.context().close();
};
