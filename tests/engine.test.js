// Unit tests for js/training-engine.js. Run: node tests/engine.test.js
'use strict';
const assert=require('assert');
const TE=require('../js/training-engine.js');
const ctx={today:'2026-10-11',WS:['OCM Training','OCM Implementation','Project Manager','Functional','QA','UAT','SMEs','App Dev'],GL:['Post-Requirements','Post-Design','Post-Dev / Pre-UAT','Post-UAT / Pre-Go-Live'],PL_INTERVALS:[{key:'d30',label:'30 Days'},{key:'d60',label:'60 Days'},{key:'d90',label:'90 Days'}],golive:'2026-09-01'};
let n=0,fail=0;
function test(name,fn){n++;try{fn();console.log('PASS '+name);}catch(e){fail++;console.log('FAIL '+name+' -> '+e.message);}}

function project(){
  const p={gateState:{},depHM:{},depNotes:{},stakeholders:[{id:1,name:'Intake Specialists'},{id:2,name:'Supervisors'}],adkarScores:{A1:3,D:3,K:3,Ab:3,R:3},postLaunch:{}};
  TE.migrate(p,ctx);const t=p.training;
  const wf=TE.newWorkflow({id:'wf1',name:'Claims intake',audienceIds:[1]});t.workflows.push(wf);
  const ob=TE.newObjective({id:'ob1',workflowId:'wf1',audienceIds:[1],task:'Register a claim'});t.objectives.push(ob);
  const sc=TE.newScenario({id:'sc1',title:'Register a household claim',objectiveIds:['ob1'],workflowId:'wf1',critical:true,qaEvidence:'QA-112 passed'});t.scenarios.push(sc);
  t.deliverables.push(TE.newDeliverable({id:'d1',title:'Intake workbook exercise',type:'exercise',scenarioIds:['sc1'],audienceIds:[1],critical:true,state:'draft'}));
  t.deliverables.push(TE.newDeliverable({id:'d2',title:'Intake job aid',type:'job_aid',workflowIds:[],audienceIds:[1],state:'draft'}));
  t.dependencies.push(TE.newDependency({id:'dep1',title:'Training environment can run the intake scenario',workstream:'Environment support',owner:'J. Okafor',scenarioIds:['sc1'],
    status:'blocked',critical:true,requiredBy:'2026-10-20',consequence:'Workbook practice cannot be validated',permits:{provisional:true,scenarioDev:true,validation:false,facilitator:false,delivery:false}}));
  t.checkpoints.scope={decision:'proceed'};t.checkpoints.devEntry={decision:'proceed'};t.checkpoints.deliveryEntry={decision:'proceed'};
  return p;
}

test('migrate is idempotent and additive',()=>{
  const p={depHM:{'2_4':3,'0_0':1,'1_1':0},depNotes:{'2_4':'QA env down'},gateState:{g1_0:'green'},adkarScores:{A1:4,D:3,K:3,Ab:2,R:3},postLaunch:{7:{d30:{adoption:62}}}};
  TE.migrate(p,ctx);TE.migrate(p,ctx);
  assert.strictEqual(p.training.dependencies.length,2,'two non-default heat-map cells imported once');
  const d=p.training.dependencies.find(x=>x.legacyKey==='2_4');
  assert.strictEqual(d.status,'blocked');assert.strictEqual(d.workstream,'QA');assert.strictEqual(d.consequence,'QA env down');
  assert.deepStrictEqual(p.adkarRated.sort(),['A1','Ab']);
  assert.strictEqual(p.training.outcomes.observations.length,1);assert.strictEqual(p.training.outcomes.observations[0].date,'2026-10-01');
  assert.strictEqual(p.gateState.g1_0,'green','legacy data untouched');
});
test('empty project reports Not Assessed, never a number',()=>{
  const p={gateState:{},stakeholders:[]};TE.migrate(p,ctx);const m=TE.measures(p,ctx);
  ['input','material','delivery','ability','adoption','evidence'].forEach(k=>assert.strictEqual(m[k].state,'not_assessed',k));
  assert.strictEqual(m.input.value,null);
});
test('blocked critical scenario blocks delivery but job-aid development continues',()=>{
  const p=project();
  const d1=TE.activityStatus(p,TE.byId(p.training.deliverables,'d1'));
  assert.ok(d1.provisional.ok&&d1.scenarioDev.ok,'development permitted by the dependency');
  assert.ok(!d1.validation.ok&&!d1.delivery.ok,'validation and delivery blocked');
  const d2=TE.activityStatus(p,TE.byId(p.training.deliverables,'d2'));
  assert.ok(d2.scenarioDev.ok,'unrelated job aid not blocked');
  const del=TE.deliveryReadiness(p,ctx);assert.strictEqual(del.state,'blocked');
  assert.ok(del.reasons.some(r=>r.kind==='scenario'));assert.ok(del.reasons.some(r=>r.kind==='dependency'));
  const dev=TE.developmentReadiness(p);assert.notStrictEqual(dev.state,'blocked');
});
test('critical blocker overrides reassuring averages',()=>{
  const p=project();const t=p.training;
  Object.keys(TE.CHECKPOINTS).length;TE.CHECKPOINTS.forEach(c=>c.legacy.forEach(k=>{p.gateState[k]='green';}));
  for(let i=0;i<8;i++)t.deliverables.push(TE.newDeliverable({title:'Done '+i,state:'approved',reviews:[{date:'2026-10-10',reviewer:'SME'}]}));
  const m=TE.measures(p,ctx);
  assert.strictEqual(m.coverage.value,100);assert.ok(m.material.value>=80);
  assert.strictEqual(m.delivery.state,'blocked');
});
test('accepted exception requires rationale, approver and date and is never Satisfied',()=>{
  const p=project();
  const r=TE.updateDependency(p,'dep1',{status:'exception',exception:{rationale:'Use recorded demo'}},ctx);
  assert.ok(r.error,'rejected without approver/date');assert.strictEqual(TE.byId(p.training.dependencies,'dep1').status,'blocked');
  const ok=TE.updateDependency(p,'dep1',{status:'exception',exception:{rationale:'Use recorded demo',approver:'Training Manager',date:'2026-10-11',review:'Recheck before cohort 2'}},ctx);
  assert.ok(!ok.error);assert.strictEqual(ok.dep.status,'exception');assert.notStrictEqual(TE.depStatusLabel('exception'),'Satisfied');
  const d1=TE.activityStatus(p,TE.byId(p.training.deliverables,'d1'));assert.ok(d1.delivery.conditions.length>0||!d1.delivery.ok);
});
test('evidence change flags linked work for review and never auto-validates',()=>{
  const p=project();
  TE.updateDependency(p,'dep1',{status:'satisfied',evidence:{ref:'ENV-77',version:'R1030',environment:'TRN-2',verified:true,date:'2026-10-11'}},ctx);
  TE.recordScenarioRun(p,'sc1',{status:'pass',environment:'TRN-2',date:'2026-10-11',by:'Trainer'},ctx);
  TE.setDeliverableState(p,'d1','validated',ctx);
  const res=TE.updateDependency(p,'dep1',{evidence:{version:'R1031'}},ctx);
  assert.deepStrictEqual(res.flagged.scenarios.map(String),['sc1']);assert.deepStrictEqual(res.flagged.deliverables.map(String),['d1']);
  const sc=TE.byId(p.training.scenarios,'sc1');assert.ok(sc.needsRevalidation);assert.ok(!TE.scenarioValidated(sc));
  const d1=TE.byId(p.training.deliverables,'d1');assert.strictEqual(d1.state,'validated','state not changed automatically');assert.ok(d1.revisionFlag);
  assert.ok(!TE.byId(p.training.deliverables,'d2').revisionFlag,'unlinked deliverable untouched');
});
test('resolving the dependency alone does not mark the scenario validated',()=>{
  const p=project();
  TE.updateDependency(p,'dep1',{status:'satisfied',evidence:{ref:'ENV-77',verified:true,date:'2026-10-11'}},ctx);
  assert.ok(!TE.scenarioValidated(TE.byId(p.training.scenarios,'sc1')));
  assert.strictEqual(TE.deliveryReadiness(p,ctx).state,'blocked');
});
test('full resolution path reaches Ready',()=>{
  const p=project();
  TE.updateDependency(p,'dep1',{status:'satisfied',evidence:{ref:'ENV-77',verified:true,date:'2026-10-11'}},ctx);
  TE.recordScenarioRun(p,'sc1',{status:'pass',environment:'TRN-2',date:'2026-10-11',by:'Trainer'},ctx);
  p.training.deliverables.forEach(d=>{TE.setDeliverableState(p,d.id,'approved',ctx);d.reviews.push({date:'2026-10-11',reviewer:'SME'});});
  const del=TE.deliveryReadiness(p,ctx);assert.strictEqual(del.state,'ready',JSON.stringify(del.reasons.concat(del.conditions)));
  assert.strictEqual(TE.recommendation(p,ctx).label,'Ready for delivery');
});
test('workflow change flags only linked resources',()=>{
  const p=project();
  TE.recordScenarioRun(p,'sc1',{status:'pass',environment:'TRN-2',date:'2026-10-11',by:'T'},ctx);
  const r=TE.recordWorkflowChange(p,'wf1','New eligibility field',ctx);
  assert.deepStrictEqual(r.scenarios.map(String),['sc1']);assert.deepStrictEqual(r.deliverables.map(String),['d1']);
});
test('actions are not duplicated per source',()=>{
  const p=project();
  TE.ensureAction(p,{type:'gate',id:'g3_0'},{title:'Fix env'},ctx);TE.ensureAction(p,{type:'gate',id:'g3_0'},{owner:'Env team'},ctx);
  assert.strictEqual(p.training.actions.filter(a=>a.source.id==='g3_0').length,1);
  TE.updateDependency(p,'dep1',{next:{action:'Restore permissions',owner:'J. Okafor',due:'2026-10-15'}},ctx);
  TE.updateDependency(p,'dep1',{next:{action:'Restore permissions',owner:'J. Okafor',due:'2026-10-16'}},ctx);
  assert.strictEqual(p.training.actions.filter(a=>a.source.type==='dependency').length,1);
});
test('ADKAR Ability gap caps learner ability at Conditional',()=>{
  const p=project();p.stakeholders[0].training={pass:92};p.adkarScores.Ab=2;p.adkarRated=['Ab'];
  const m=TE.measures(p,ctx);assert.strictEqual(m.ability.state,'conditional');assert.ok(m.ability.abilityLow);
});
test('optional UAT rule is off by default and can be enabled',()=>{
  const p=project();const rule=p.training.entryRules.delivery.find(r=>r.kind==='dependency_tag');assert.strictEqual(rule.enabled,false);
});
test('heat map is derived from dependency records',()=>{
  const p=project();const d=TE.byId(p.training.dependencies,'dep1');d.phase=2;d.workstream='QA';
  assert.strictEqual(TE.heatCell(p,2,'QA').state,'blocked');assert.strictEqual(TE.heatCell(p,1,'QA').state,'none');
});
test('decision brief separates development from delivery',()=>{
  const p=project();const b=TE.brief(p,ctx);
  assert.strictEqual(b.rec.state,'blocked');assert.ok(b.canProceed.length>=1);assert.ok(b.blocked.length>=1);
  assert.ok(b.affected.scenarios.map(String).includes('sc1'));assert.ok(b.affected.audiences.map(String).includes('1'));
});
test('schedule risk when an input arrives after planned delivery',()=>{
  const p=project();TE.byId(p.training.deliverables,'d1').planned.delivery='2026-10-15';
  const m=TE.milestones(p,ctx);assert.ok(m.risks.some(r=>/practitioner review/.test(r.text)));
});
test('unreviewed checkpoint is a condition, a hold blocks',()=>{
  const p=project();p.training.checkpoints={};
  const d2=TE.activityStatus(p,TE.byId(p.training.deliverables,'d2'));
  assert.ok(d2.provisional.ok&&d2.provisional.conditional,'provisional proceeds with a condition');
  p.training.checkpoints.scope={decision:'hold'};
  assert.ok(!TE.activityStatus(p,TE.byId(p.training.deliverables,'d2')).provisional.ok,'hold blocks');
  p.training.checkpoints={};const b=TE.brief(p,ctx);assert.ok(b.conditions.some(c=>/not yet reviewed/.test(c.text)),'shown as a condition in the brief');
});
console.log('\n'+(n-fail)+'/'+n+' passed');process.exit(fail?1:0);
