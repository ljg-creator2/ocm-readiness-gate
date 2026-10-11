// Jira import, program mapping, change impact, read-only guards and timeline arithmetic.
// Uses tests/fixtures/jira-sample.csv (fictional). Never add a real Jira export to the repository.
'use strict';
const fs=require('fs'),path=require('path');
module.exports=async function(t){
  const pg=await t.page({vp:{width:1400,height:1000},wait:2500});
  const fake=fs.readFileSync(path.join(__dirname,'../fixtures/jira-sample.csv'),'utf8');
  const res=await pg.evaluate(async([fake])=>{
    const R=[];const ok=(id,name,cond,detail)=>R.push({id,name,pass:!!cond,detail:detail===undefined?'':String(detail)});
    const reset=()=>{localStorage.removeItem('adoptiq_jira_programs');localStorage.removeItem('adoptiq_jira_map');localStorage.removeItem('adoptiq_training_standard');setDemoMode(false);isReadOnly=false;document.body.classList.remove('readonly-mode');};
    const mkRel=(name)=>{const r=newRelease(name,[],'2027-01-15','Development');r.uatComplete='2026-11-15';r.projects=[];releases.push(r);openRelease(r.id);return r;};
    const imp=async(txt,isB64)=>{openJiraImport();const f=isB64?new File([Uint8Array.from(atob(txt),c=>c.charCodeAt(0))],'x.csv'):new File([txt],'f.csv');await handleJiraFile(f);};
    const csv=rows=>rows.map(r=>r.map(c=>/[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c).join(',')).join('\n');
    const auds=TT_DEFAULT.audiences.map(a=>a.id);

    // 1. Feature, fictional file
    reset();let r=mkRel('FY2027R1030');await imp(fake);
    ok('F1','Program table lists programs from file',document.querySelectorAll('#jira-preview .prog-map tbody tr').length===2);
    setProgMap('SNAP','dhs',true);setProgMap('Medicaid MAGI','medicaid',true);
    ok('F2','Map saved on the release (team-shared)',r.jiraProgMap&&r.jiraProgMap.SNAP[0]==='dhs',JSON.stringify(r.jiraProgMap));
    applyJiraPlan();closeJiraImport();
    let p=r.projects[0];openProject(p.id);
    let ci=jiraChangeImpact(p);
    ok('F3','Audience counts',ci.byAud.map(a=>a.name+':'+a.count).join(',')==='DHS:2,Medicaid Branch:1',ci.byAud.map(a=>a.name+':'+a.count));
    const gid=ci.gaps.map(g=>g.id+':'+g.n).join(',');
    ok('F4','Gaps: acceptance 1, business review 1, untriaged 1',gid.includes('accept:1')&&gid.includes('biz:1')&&gid.includes('triage:1'),gid);
    ok('F5','Jira impact summary picked up',ci.notes.length===1);
    await imp(fake);ok('F6','Mapping persists on re-import',document.querySelectorAll('#jira-preview .prog-map input:checked').length===2);closeJiraImport();openProject(p.id);
    renderPTrainPlan();const card=document.getElementById('ptab-trainplan').innerText;
    ok('F7','Card shows impact, gaps and program map',/Change impact/.test(card)&&/Gaps to close/.test(card)&&/Who each program affects/.test(card));
    const acts=pilotStatus(p).actions.map(a=>a.text).join(' | ');
    ok('F8','Next Actions include missing audience + gaps',/DHS is affected/.test(acts)&&/acceptance criteria/.test(acts),acts.slice(0,200));
    toggleTTAud('medicaid',true);
    ok('F9','Add to timeline adds audience and stakeholder group',(p.trainingTimeline.audiences||[]).includes('medicaid')&&p.stakeholders.some(s=>s.name==='Medicaid Branch'));
    let popup='';const wo=window.open;window.open=()=>({document:{open(){},write(h){popup=h;},close(){}}});exportStatusReport();window.open=wo;
    ok('F10','Status report has Impact by audience, no duplicate gap line',/Impact by audience/.test(popup)&&!/Gaps in Jira/.test(popup));

    // 2. Negative tests
    reset();r=mkRel('FY2027R1030');
    const H=['Summary','Issue key','Issue Type','Status','Fix versions','Custom field (OCM Needed?)','Custom field (Impacted Programs)','Parent summary'];
    await imp(csv([H,['A','X-1','Story','OCM Ready','FY2027R1030','Yes','SNAP','Epic A'],['B','X-2','Story','In QA','FY2027R1030','Yes','','Epic A']]));applyJiraPlan();closeJiraImport();
    p=r.projects[0];ci=jiraChangeImpact(p);
    ok('N1','No Acceptance Criteria column → no false "no acceptance criteria" gap',!ci.gaps.some(g=>g.id==='accept'),ci.gaps.map(g=>g.id));
    ok('N2','No Business Review column → no review gap',!ci.gaps.some(g=>g.id==='biz'));
    ok('N3','Empty program cell → flagged as no impacted program',ci.gaps.some(g=>g.id==='map'&&/X-2/.test(g.keys.join())));
    reset();r=mkRel('FY2027R1030');
    const H2=H.concat(['Custom field (Business Review Status)','Custom field (Acceptance Criteria)']);
    await imp(csv([H2,['A','X-1','Story','OCM Ready','FY2027R1030','Yes','Prog "Q", Inc','Epic A','Not Approved','x'],['B','X-2','Story','OCM Ready','FY2027R1030','Yes','SNAP','Epic A','Approved','x'],['C','X-3','Story','OCM Ready','FY2027R1030','Yes','SNAP','Epic A','Rejected','x']]));
    const progRow=[...document.querySelectorAll('#jira-preview .prog-map tbody td:first-child')].map(t=>t.textContent);
    ok('N4','Program name with quotes/commas renders escaped',progRow.includes('Prog "Q", Inc'),progRow);
    const cb=document.querySelector('#jira-preview .prog-map input[data-prog^="Prog"]');cb.checked=true;cb.dispatchEvent(new Event('change'));
    ok('N5','Checkbox on that program saves correctly',(r.jiraProgMap['Prog "Q", Inc']||[]).length===1,JSON.stringify(r.jiraProgMap));
    applyJiraPlan();closeJiraImport();p=r.projects[0];ci=jiraChangeImpact(p);
    const biz=ci.gaps.find(g=>g.id==='biz');
    ok('N6','"Not Approved" and "Rejected" are gaps; "Approved" is not',biz&&biz.n===2&&!biz.keys.includes('X-2'),biz&&biz.keys);

    // 3. Legacy snapshot
    reset();r=mkRel('Legacy');const lp=newProject('Legacy proj',[],0);r.projects.push(lp);
    lp.jira={importedAt:new Date().toISOString(),items:[{key:'L-1',summary:'s',status:'OCM Ready',ready:true,qaPassed:true,uatPassed:true,defects:[],programs:'SNAP, TANF'}]};
    r.jiraProgMap={SNAP:['dhs'],TANF:['dhs']};
    ci=jiraChangeImpact(lp);
    ok('L1','Legacy data: programs still map from old string field',ci.byAud.length===1&&ci.byAud[0].programs.join()==='SNAP,TANF',JSON.stringify(ci.byAud));
    ok('L2','Legacy data: no false gaps',ci.gaps.length===0,ci.gaps.map(g=>g.id));

    // 4. Roles
    openProject(lp.id);lp.trainingTimeline={audiences:[]};lp.stakeholders=[];
    isReadOnly=true;renderPTrainPlan();
    const roHtml=document.getElementById('ptab-trainplan').innerHTML;
    ok('R1','Read-only: no Add to timeline button',!/Add to timeline/.test(roHtml));
    ok('R2','Read-only: program checkboxes disabled',[...document.querySelectorAll('#ptab-trainplan .prog-map input')].every(i=>i.disabled));
    toggleTTAud('dhs',true);setProgMap('SNAP','ddcc',true);
    ok('R3','Read-only: direct calls change nothing',!(lp.trainingTimeline.audiences||[]).length&&!r.jiraProgMap.SNAP.includes('ddcc'));
    isReadOnly=false;

    // 5. Team sync: map comes from release even with browser storage cleared
    localStorage.removeItem('adoptiq_jira_programs');
    ok('S1','Map survives cleared browser storage (stored in release data)',jiraChangeImpact(lp).byAud.length===1);
    ok('S2','Map included in saved release JSON',/jiraProgMap/.test(JSON.stringify(releases)));

    const r0=releases.find(x=>x.name==='FY2027R1030'&&x.projects.length&&x.projects[0].jira);
    // 7. Regression: DCAS timeline worked examples
    reset();r=mkRel('TT');const tp=newProject('TT',[],0);r.projects.push(tp);tp.size='L';tp.trainingTimeline={audiences:['dhs'],course:'full'};
    let t=calcTrainingTimeline(tp);ok('T1','L / DHS / full-day = 67.5–72.5 business days',t.lo===67.5&&t.hi===72.5,t.lo+'–'+t.hi);
    tp.size='XL';tp.trainingTimeline.course='two';t=calcTrainingTimeline(tp);ok('T2','XL / DHS / 2-day = 93.5–103.5 business days',t.lo===93.5&&t.hi===103.5,t.lo+'–'+t.hi);
    openProject(tp.id);let okOv=true;try{if(!pilotOn())togglePilotView();renderPilotOverview(tp);const q=r0.projects[0];openProject(q.id);renderPilotOverview(q);okOv=/Next/i.test(document.getElementById('psec-overview').innerText)||'no Next Actions text';}catch(e){okOv=e.message;}
    ok('T3','Pilot Overview renders',okOv===true,okOv);
    return R;
  },[fake]);
  res.forEach(x=>t.ok('Jira & timeline',x.id+' '+x.name,x.pass,x.detail));
  t.ok('Jira & timeline','No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  await pg.context().close();
};
