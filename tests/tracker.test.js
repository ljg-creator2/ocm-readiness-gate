// Unit tests for js/tracker-import.js against a fictional tracker. Run: node tests/tracker.test.js
'use strict';
const assert=require('assert');const TI=require('../js/tracker-import.js');const TE=require('../js/training-engine.js');
const {sheets}=require('./fixtures/tracker-sample.js');
let n=0,fail=0;function test(name,fn){n++;try{fn();console.log('PASS '+name);}catch(e){fail++;console.log('FAIL '+name+' -> '+e.message);}}
let seq=0;const f=()=>({newRelease:name=>({id:++seq,name,projects:[],golive:''}),newProject:name=>({id:++seq,name,resources:{},stakeholders:[],gateState:{}}),
  migrate:p=>{['ocm_train','pm','func','ocm_impl'].forEach(k=>{if(!Array.isArray(p.resources[k]))p.resources[k]=[];});TE.migrate(p,{});},TE,ctx:{},today:'2026-10-11'});

test('reads projects, project tabs and deliverable rows by heading',()=>{
  const r=TI.read(sheets());
  assert.deepStrictEqual(r.projects.map(p=>p.name),['Benefit Notices P1','Portal Login Update','Eligibility Rules Refresh']);
  const p=r.projects[0];assert.strictEqual(p.golive,'2026-11-01');assert.strictEqual(p.size,'M');assert.strictEqual(p.poc,'Alex Rivera');assert.deepStrictEqual(p.team,['Alex Rivera','Sam Lee']);
  assert.strictEqual(r.projects[1].size,'S','"Small" becomes S');assert.strictEqual(r.projects[2].poc,'','(assign) is not a person');assert.strictEqual(r.projects[2].golive,'');
  assert.strictEqual(r.gates[TI.norm('Benefit Notices P1')].leadReviewPct,50);assert.strictEqual(r.gates[TI.norm('Benefit Notices P1')].items.length,4);
  assert.strictEqual(r.deliverables.length,3,'N/A rows are skipped');assert.deepStrictEqual(r.warnings,[]);
});
test('missing tabs are reported, not guessed',()=>{const s=sheets();delete s['Delivery Tracker'];const r=TI.read(s);assert.ok(r.warnings.some(w=>/Delivery Tracker/.test(w)));});
test('plan: new releases (TBD to holding area), new projects, matched and unmatched deliverables',()=>{
  const pl=TI.plan(TI.read(sheets()),[]);
  assert.deepStrictEqual(pl.releases.map(r=>r.name).sort(),['FY2027R1101',TI.HOLDING].sort());
  assert.strictEqual(pl.counts.newProjects,3);
  assert.deepStrictEqual(pl.deliverables.map(d=>d.project),['Benefit Notices P1']);
  assert.deepStrictEqual(pl.unmatched.map(u=>u.row),['Notices P1 wave — micro-learning','Ad-hoc: Huddle']);
  assert.strictEqual(pl.unmatched[1].adhoc,true);assert.strictEqual(pl.unmatched[0].suggest,'Benefit Notices P1','offered as a hint');
});
test('apply creates records, then a second import updates in place and remembers choices',()=>{
  const releases=[];const F=f();
  let pl=TI.plan(TI.read(sheets()),releases);pl.file='tracker.xlsx';
  let res=TI.apply(pl,releases,F,{[pl.unmatched[0].key]:'Benefit Notices P1'});
  assert.strictEqual(res.releases,2);assert.strictEqual(res.projects,3);assert.strictEqual(res.deliverables,2);
  const p=releases.find(r=>r.name==='FY2027R1101').projects.find(x=>x.name==='Benefit Notices P1');
  assert.strictEqual(p.golive,'2026-11-01');assert.strictEqual(p.size,'M');assert.deepStrictEqual(p.resources.ocm_train.map(x=>x.name),['Alex Rivera','Sam Lee']);
  assert.strictEqual(p.resources.pm[0].name,'Jordan Park');assert.strictEqual(p.tracker.leadReviewPct,50);
  const d=p.training.deliverables.find(x=>x.title==='job aid');assert.strictEqual(d.state,'in_review');assert.strictEqual(d.planned.due,'2026-10-09');assert.strictEqual(d.type,'job_aid');
  assert.ok(releases.find(r=>r.name===TI.HOLDING).holding);
  // Tracker changes: new POC, status complete. Evidence in AdoptIQ is left alone.
  p.training.dependencies.push(TE.newDependency({title:'Env ready',status:'blocked'}));p.resources.ocm_train[0].contact='alex@example.org';
  const s=sheets();s.Projects[4][7]='Sam Lee';s.Projects[4][12]='Complete';s['Delivery Tracker'][5][3]='Complete';
  pl=TI.plan(TI.read(s),releases);
  const pp=pl.projects.find(x=>x.name==='Benefit Notices P1');assert.ok(pp.changes.some(c=>c.field==='res:ocm_train'&&c.to==='Sam Lee'));assert.ok(pp.changes.some(c=>c.field==='status'));
  assert.strictEqual(pl.unmatched.length,1,'the remembered row now matches; only ad-hoc remains');
  res=TI.apply(pl,releases,F,{});
  assert.strictEqual(res.projects,0);assert.strictEqual(res.deliverables,0);assert.strictEqual(res.deliverablesUpdated,2);
  assert.deepStrictEqual(p.resources.ocm_train.map(x=>x.name),['Sam Lee','Alex Rivera'],'POC first, then the rest of the Team column');
  assert.strictEqual(p.resources.ocm_train[1].contact,'alex@example.org','contact details kept');
  assert.strictEqual(p.status,'Complete');assert.strictEqual(p.training.deliverables.find(x=>x.title==='job aid').state,'approved');
  assert.strictEqual(p.training.dependencies[0].status,'blocked','evidence untouched');
  assert.strictEqual(releases.reduce((a,r)=>a+r.projects.length,0),3,'nothing duplicated or deleted');
});
test('project moves when the tracker gives it a new release',()=>{
  const releases=[];TI.apply(TI.plan(TI.read(sheets()),releases),releases,f(),{});
  const s=sheets();s.Projects[6][1]='FY2027R0207';const pl=TI.plan(TI.read(s),releases);
  assert.ok(pl.projects.find(p=>p.name==='Eligibility Rules Refresh').move);
  TI.apply(pl,releases,f(),{});
  assert.ok(releases.find(r=>r.name==='FY2027R0207').projects.some(p=>p.name==='Eligibility Rules Refresh'));
  assert.ok(!releases.find(r=>r.name===TI.HOLDING).projects.some(p=>p.name==='Eligibility Rules Refresh'));
});
test('dates from Excel serials and text',()=>{assert.strictEqual(TI.normDate(46327),'2026-11-01');assert.strictEqual(TI.normDate('11/01/2026'),'2026-11-01');assert.strictEqual(TI.normDate('TBD'),'');});
console.log('\n'+(n-fail)+'/'+n+' passed');process.exit(fail?1:0);
