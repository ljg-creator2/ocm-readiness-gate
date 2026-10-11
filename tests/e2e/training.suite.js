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
  await ev(pg,()=>{isReadOnly=false;document.body.classList.remove('readonly-mode');const r=releases.find(x=>x.projects.some(p=>p.name==='Clinical Workflow'));const p=r.projects.find(p=>p.name==='Clinical Workflow');openProjectFromPortfolio(r.id,p.id,'deps');});await wait(800);await pg.waitForSelector('#psec-deps.active',{timeout:10000});
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

  // ── Jira import feeds Learning Development and Dependencies (fictional sample) ──
  {
    const csv=require('fs').readFileSync(require('path').join(__dirname,'../fixtures/jira-sample.csv'),'utf8');
    pg=await t.page({wait:2500});
    const okJ2=(n,c,d)=>ok('Jira suggestions',n,c,d);
    await ev(pg,async csv=>{setDemoMode(false);isReadOnly=false;document.body.classList.remove('readonly-mode');const r=newRelease('FY2027R1030',[],'2027-01-15','Development');r.uatComplete='2026-11-15';r.projects=[];releases.push(r);openRelease(r.id);
      openJiraImport();await handleJiraFile(new File([csv],'sample.csv'));applyJiraPlan();closeJiraImport();
      const p=r.projects.find(x=>x.name==='Hub Service Updates');openProjectFromPortfolio(r.id,p.id,'learndev');},csv);await wait(800);await pg.waitForSelector('#psec-learndev.active',{timeout:10000});
    const s1=await ev(pg,()=>({sc:TE.suggestions(getProj(),trCtx(getProj())).scenarios.map(x=>x.label),box:!!document.querySelector('#tr-learndev .tr-suggest'),recs:getProj().training.scenarios.length}));
    okJ2('Items that passed QA are suggested as scenarios',s1.box&&s1.sc.join()==='Hub field mapping'&&s1.recs===0,JSON.stringify(s1));
    await pg.click('#tr-learndev .tr-suggest >> text=Review and add');await wait(300);
    const scf=await ev(pg,()=>({t:document.getElementById('trf-title').value,qa:document.getElementById('trf-qaEvidence').value,uat:document.getElementById('trf-uatEvidence').value}));
    okJ2('Scenario form carries the QA and UAT evidence',scf.t==='Hub field mapping'&&/DEMO-4 passed QA/.test(scf.qa)&&/DEMO-4 passed UAT/.test(scf.uat),JSON.stringify(scf));
    await pg.click('#tr-dlg-save');await wait(300);
    okJ2('Scenario saved and not validated (no training-environment run yet)',await ev(pg,()=>{const sc=getProj().training.scenarios[0];return sc&&sc.jiraKey==='DEMO-4'&&!TE.scenarioValidated(sc);}));
    await ev(pg,()=>showPGroup('deps'));await wait(400);
    const d1=await ev(pg,()=>TE.suggestions(getProj(),trCtx(getProj())).dependencies.map(x=>x.label+'|'+(x.preset.requiredBy||'')+'|'+(x.preset.scenarioIds||[]).length));
    okJ2('Item not past UAT and open environment defect are suggested as dependencies',d1.some(x=>/^Hub service update passes UAT\|2026-11-15/.test(x))&&d1.some(x=>/DEMO-52.*\|\|1$/.test(x)),JSON.stringify(d1));
    await ev(pg,()=>{const k=TE.suggestions(getProj(),trCtx(getProj())).dependencies.find(x=>/DEMO-52/.test(x.label)).key;trAcceptSuggestion('dependencies',k);});await wait(300);
    await pg.fill('#trf-owner','Env Team Lead');await pg.click('#tr-dlg-save');await wait(300);
    const dep=await ev(pg,()=>{const d=getProj().training.dependencies.find(x=>x.jiraKey==='DEMO-52');return d&&{st:d.status,sc:d.scenarioIds.length,ref:d.evidence.ref};});
    okJ2('Defect dependency saved as Blocked and linked to the scenario',dep&&dep.st==='blocked'&&dep.sc===1&&dep.ref==='DEMO-52',JSON.stringify(dep));
    okJ2('The linked scenario now blocks validation of its deliverables',await ev(pg,()=>{const p=getProj();return TE.deliveryReadiness(p,trCtx(p)).state!=='ready';}));
    // Re-import with the defect closed: a review prompt, never an automatic change.
    const csv2=csv.replace('Training env defect,DEMO-52,Bug,Open','Training env defect,DEMO-52,Bug,Closed');
    await ev(pg,async csv=>{const r=releases.find(x=>x.name==='FY2027R1030');openRelease(r.id);openJiraImport();await handleJiraFile(new File([csv],'sample2.csv'));applyJiraPlan();closeJiraImport();
      const p=r.projects.find(x=>x.name==='Hub Service Updates');openProjectFromPortfolio(r.id,p.id,'deps');},csv2);await wait(800);await pg.waitForSelector('#psec-deps.active',{timeout:10000});
    const rv=await ev(pg,()=>{const p=getProj();const s=TE.suggestions(p,trCtx(p)).dependencies.find(x=>x.review);return{label:s&&s.label,st:p.training.dependencies.find(x=>x.jiraKey==='DEMO-52').status,btn:!!document.querySelector('#tr-deps .tr-suggest button')};});
    okJ2('Re-import with the defect closed prompts a review and changes nothing',rv.label==='DEMO-52 is closed in Jira'&&rv.st==='blocked'&&rv.btn,JSON.stringify(rv));
    await pg.click('#tr-deps .tr-suggest button >> text="Review"');await wait(300);
    okJ2('Review opens the dependency to update',await ev(pg,()=>!document.getElementById('tr-dlg').hidden&&/DEMO-52/.test(document.getElementById('trf-title').value)));
    await ev(pg,()=>trCloseDialog());
    okJ2('The prompt does not return after review',await ev(pg,()=>{const p=getProj();return !TE.suggestions(p,trCtx(p)).dependencies.some(x=>x.review);}));
    okJ2('No JS errors',pg._errs.length===0,pg._errs.join(' | '));
    await pg.context().close();
  }

  // ── Environments: list, deployments and refreshes, readiness steps, warnings ──
  {
    pg=await t.page({wait:1500});
    const okE=(n,c,d)=>ok('Environments',n,c,d);
    await ev(pg,()=>landingToDemo());await wait(2500);
    await ev(pg,()=>{isReadOnly=false;document.body.classList.remove('readonly-mode');const r=releases.find(x=>x.name==='Benefits Modernization');openProjectFromPortfolio(r.id,r.projects[0].id,'environments');});await wait(900);await pg.waitForSelector('#psec-environments.active',{timeout:10000});
    const e0=await ev(pg,()=>({rows:document.querySelectorAll('#tr-environments tbody tr').length,ev:document.querySelectorAll('#tr-environments .tr-hist li').length,txt:document.getElementById('tr-environments').innerText}));
    okE('Release environment list and recorded deployment are shown',e0.rows===6&&e0.ev===1&&/ENV-77/.test(e0.txt),JSON.stringify({rows:e0.rows,ev:e0.ev}));
    okE('Before a refresh, the intake scenarios are validated',await ev(pg,()=>getProj().training.scenarios.every(s=>TE.scenarioValidated(s))));
    await pg.click('#tr-environments >> text=Record a deployment or refresh');await wait(300);
    await pg.selectOption('#trf-envName','TRN-2');await pg.selectOption('#trf-kind','refresh');await pg.fill('#trf-ref','DIS-204');await pg.click('#tr-dlg-save');await wait(400);
    const e1=await ev(pg,()=>{const p=getProj();return{flag:p.training.scenarios.filter(s=>s.needsRevalidation).length,pass:p.training.scenarios.every(s=>s.env.status==='pass'),del:TE.deliveryReadiness(p,trCtx(p)).state,ev:document.querySelectorAll('#tr-environments .tr-hist li').length};});
    okE('Refresh marks the scenarios that passed in TRN-2 for a re-run',e1.flag===2&&e1.pass,JSON.stringify(e1));
    okE('Delivery readiness drops until they are re-run',e1.del==='blocked',e1.del);
    okE('The refresh is listed with its reference',e1.ev===2&&await ev(pg,()=>/DIS-204/.test(document.getElementById('tr-environments').innerText)));
    await ev(pg,()=>{const p=getProj();p.training.scenarios.forEach(s=>TE.recordScenarioRun(p,s.id,{status:'pass',environment:'TRN-2',date:trToday(),by:'Tester'},trCtx(p)));});
    okE('Re-running clears the flag',await ev(pg,()=>getProj().training.scenarios.every(s=>TE.scenarioValidated(s))));
    await pg.click('#tr-environments >> text=Add environment');await wait(200);await pg.fill('#trf-name','trn 2');await pg.click('#tr-dlg-save');await wait(200);
    okE('A duplicate environment name is refused',/already has this name/.test(await pg.textContent('#tr-dlg-err')));
    await ev(pg,()=>trCloseDialog());
    // Renewal project: readiness steps and a maintenance-day warning.
    await ev(pg,()=>{const r=releases.find(x=>x.name==='Benefits Modernization');openProjectFromPortfolio(r.id,r.projects[1].id,'environments');});await wait(900);await pg.waitForSelector('#psec-environments.active',{timeout:10000});
    const n0=await ev(pg,()=>getProj().training.dependencies.length);
    await pg.click('#tr-environments >> text=Add readiness steps');await wait(300);
    await pg.selectOption('#trf-envName','TRN-2');await pg.fill('#trf-neededBy','2026-12-01');await pg.locator('#trf-scenarioIds input').first().check();await pg.click('#tr-dlg-save');await wait(300);
    const ch=await ev(pg,n0=>{const d=getProj().training.dependencies.slice(n0);return{n:d.length,crit:d.every(x=>x.critical&&x.scenarioIds.length===1),due:d.map(x=>x.requiredBy)};},n0);
    okE('Readiness steps add five critical, linked dependencies with due dates',ch.n===5&&ch.crit&&ch.due[0]==='2026-11-21'&&ch.due[4]==='2026-11-30',JSON.stringify(ch));
    await ev(pg,()=>{const p=getProj();const d=p.training.deliverables[0];const x=new Date();x.setDate(x.getDate()+((8-x.getDay())%7||7));d.planned.delivery=x.toISOString().slice(0,10);trRenderEnvironments();});
    okE('Delivery planned on a maintenance day is flagged',await ev(pg,()=>/maintenance day for TRN-2/.test(document.getElementById('tr-environments').innerText)));
    await ev(pg,()=>{isReadOnly=true;trRenderEnvironments();});
    okE('View-only hides the record and add buttons',await ev(pg,()=>!/Record a deployment|Add readiness steps|Add environment/.test([...document.querySelectorAll('#tr-environments button')].map(b=>b.textContent).join('|'))));
    okE('No JS errors',pg._errs.length===0,pg._errs.join(' | '));
    await pg.context().close();
  }

  // ── Delivery tracker import (fictional workbook) ──
  {
    const XLSX=require('xlsx');const {sheets}=require('../fixtures/tracker-sample.js');
    const wb=XLSX.utils.book_new();const sh=sheets();Object.keys(sh).forEach(n=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sh[n],{cellDates:true}),n.slice(0,31)));
    const buffer=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
    pg=await t.page({wait:2000});
    const okT=(n,c,d)=>ok('Tracker import',n,c,d);
    await ev(pg,()=>landingToDemo());await wait(2500);
    // Leaving view-only without a reload: clear the demo's disabled buttons as a fresh page would have them.
    await ev(pg,()=>{setDemoMode(false);isReadOnly=false;document.body.classList.remove('readonly-mode');document.querySelectorAll('button[disabled]').forEach(x=>{x.disabled=false;x.style.opacity='';x.style.cursor='';});sbNav('initiatives');});await wait(600);
    const before=await ev(pg,()=>({rel:releases.length,proj:releases.reduce((a,r)=>a+r.projects.length,0)}));
    await pg.click('text=Import delivery tracker');await wait(300);
    okT('Apply is disabled until a file is read',await ev(pg,()=>document.getElementById('tr-dlg-save').disabled));
    await pg.setInputFiles('#trk-file',{name:'tracker.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer});
    await pg.waitForSelector('#trk-plan h3');
    const pv=await ev(pg,()=>({txt:document.getElementById('trk-plan').innerText,sel:document.querySelectorAll('#trk-plan select').length,save:document.getElementById('tr-dlg-save').disabled}));
    okT('Preview lists new releases and projects before anything changes',/2 new releases/.test(pv.txt)&&/3 new projects/.test(pv.txt)&&!pv.save,pv.txt.slice(0,200));
    okT('Nothing is saved by the preview',await ev(pg,b=>releases.length===b.rel,before));
    okT('Unmatched rows ask for a project, with a suggestion',pv.sel===2&&/Use suggestion: Benefit Notices P1/.test(pv.txt));
    await pg.click('#trk-plan >> text=Use suggestion: Benefit Notices P1');
    await pg.click('#tr-dlg-save');await wait(500);
    const after=await ev(pg,()=>{const r=releases.find(x=>x.name==='FY2027R1101');const p=r&&r.projects.find(x=>x.name==='Benefit Notices P1');
      return{rel:releases.length,hold:!!releases.find(x=>x.name==='Release TBD'&&x.holding),golive:p&&p.golive,poc:p&&p.resources.ocm_train.map(x=>x.name).join(','),lead:p&&p.tracker.leadReviewPct,del:p&&p.training.deliverables.map(d=>d.title+':'+d.state).sort().join('|'),alias:p&&p.tracker.aliases.length};});
    okT('Applied: releases, holding area, go-live, owners and lead review %',after.rel===before.rel+2&&after.hold&&after.golive==='2026-11-01'&&after.poc==='Alex Rivera,Sam Lee'&&after.lead===50,JSON.stringify(after));
    okT('Learning deliverables added with tracker status, and the chosen match remembered',after.del==='job aid:in_review|micro-learning:draft'&&after.alias===1,JSON.stringify(after));
    await ev(pg,()=>{const r=releases.find(x=>x.name==='FY2027R1101');openProjectFromPortfolio(r.id,r.projects.find(x=>x.name==='Benefit Notices P1').id,'milestones');});await pg.waitForSelector('#psec-milestones.active',{timeout:10000});await wait(300);
    okT('Milestones shows the tracker checklist with sign-off gates',await ev(pg,()=>{const t=document.getElementById('tr-milestones').innerText;return /Training plan checklist/.test(t)&&/Lead review: 50%/.test(t)&&/Signed/.test(t)&&!/Review Jiras/.test(t);}));
    await ev(pg,()=>showPGroup('brief'));await wait(300);
    okT('Decision brief shows the lead review % separately from the readiness measures',await ev(pg,()=>/Lead review \(delivery tracker\): 50%/.test(document.getElementById('proj-brief').innerText)));
    await ev(pg,()=>{sbNav('initiatives');trTrackerImport();});await wait(300);
    await pg.setInputFiles('#trk-file',{name:'tracker.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer});await pg.waitForSelector('#trk-plan h3');
    okT('Importing the same file again creates nothing new',await ev(pg,()=>{const t=document.getElementById('trk-plan').innerText;return !/new release|new project/.test(t)&&/3 unchanged/.test(t)&&document.querySelectorAll('#trk-plan select').length===1;}));
    await ev(pg,()=>trCloseDialog());
    await ev(pg,()=>{enableReadOnly();applyReadOnlyRestrictions();});
    okT('View-only cannot import',await ev(pg,()=>{const b=document.querySelector('.tr-trk-btn');trTrackerImport();return b.disabled&&document.getElementById('tr-dlg').hidden!==false;}));
    okT('No JS errors',pg._errs.length===0,pg._errs.join(' | '));
    await pg.context().close();
  }

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
  await ev(pg,()=>{const b=getBrand();b.orgTerm='department';saveBrand(b);const r=releases.find(x=>x.name==='Benefits Modernization');openProjectFromPortfolio(r.id,r.projects[0].id,'overview');});await wait(800);await pg.waitForSelector('#psec-overview.active',{timeout:10000});
  const term=await ev(pg,()=>({lbl:[...document.querySelectorAll('#v-project .ib-label')].map(x=>x.textContent).join('|'),chip:document.getElementById('proj-agency-chips').textContent}));
  ok('Organization term','Labels switch to the chosen term',/Departments/.test(term.lbl),term.lbl);
  ok('Organization term','Entered names are not changed',/Riverside County Department of Social Services/.test(term.chip),term.chip);
  await ev(pg,()=>{const b=getBrand();b.orgTerm='agency';saveBrand(b);});
  ok('Demo','No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  await pg.context().close();

  // ── Phone layout: no sideways scroll on any of the eight project tabs ──
  pg=await t.page({vp:{width:390,height:844},wait:1500});
  await ev(pg,()=>landingToDemo());await wait(2500);
  await ev(pg,()=>{const r=releases.find(x=>x.name==='Benefits Modernization');openProjectFromPortfolio(r.id,r.projects[1].id,'overview');});await wait(800);await pg.waitForSelector('#psec-overview.active',{timeout:10000});
  for(const g of ['brief','people','deps','learn','ready','actions','delivery','adoption']){
    await ev(pg,g=>showPGroup(g),g);await wait(350);
    const ov=await ev(pg,()=>document.documentElement.scrollWidth-innerWidth);
    ok('Phone layout','"'+g+'" tab has no sideways scroll',ov<=1,ov+'px');
  }
  await pg.context().close();
};
