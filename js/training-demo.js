'use strict';
// ════════════════════════════════════════════════════════
// TRAINING-LED DEMO (fictional)
// Riverside County Department of Social Services, Benefits Modernization.
// Every record is built through the engine (js/training-engine.js) with dated
// steps, so history, flags and the recommendation come from the records.
//   Benefits Claims Intake: the full story, now post-launch.
//   Benefits Renewal Notices: mid-flight, a critical input is blocked today.
// Called from loadDemoData() after the legacy demo dates are shifted.
// ════════════════════════════════════════════════════════
function trSeedDemo(){
  if(typeof TE==='undefined')return;
  const day=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
  const ORG='Riverside County Department of Social Services';
  const r=newRelease('Benefits Modernization',[ORG],day(40),'Development');
  const mkSh=(name,_n,extra)=>Object.assign({id:uid(),name,factors:{resistance:3,env:3,window:3,complexity:3,saturation:3,leadership:3},objectives:[],
    kirk:{L1:{method:'',timing:''},L2:{method:'',assessment:''},L3:{interval:'30',observable:''},L4:{outcome:'',metric:''}},rein:{owner:'',activities:'',intervals:['30 Days'],escalation:''}},extra||{});

  // ── Project 1: Benefits Claims Intake (complete story) ──
  const p=newProject('Benefits Claims Intake',[ORG],310);
  p.status='Complete';p.size='M';p.golive=day(-27); // launched; post-launch observations continuemigrateResources(p);
  p.resources.ocm_train=[{name:'Dana Whitfield',contact:''}];p.resources.ocm_impl=[{name:'Marcus Lee',contact:''}];p.resources.pm=[{name:'Priya Raman',contact:''}];
  const intake=mkSh('Intake Specialists',240,{training:{completion:96,pass:88,confidence:4}});
  const sup=mkSh('Intake Supervisors',30,{training:{completion:100,pass:93,confidence:4}});
  p.stakeholders=[intake,sup];
  p.gateState={g1_0:'green',g1_1:'green',g1_2:'green',g1_3:'green',g1_4:'green',g1_5:'green',g2_0:'green',g2_1:'green',g2_2:'green',g2_3:'green',g2_4:'green',g2_5:'green',
    g3_0:'green',g3_1:'green',g3_2:'green',g3_3:'green',g3_4:'green',g3_5:'green',g4_0:'green',g4_1:'green',g4_2:'green',g4_3:'green',g4_4:'yellow',g4_5:'green'};
  p.adkarScores={A1:4,D:4,K:4,Ab:3,R:3};p.adkarRated=['A1','D','K','Ab','R'];
  TE.migrate(p,{});const t=p.training;const at=n=>({today:day(n),by:'Dana Whitfield'});
  // 1. The changed workflow and who it affects
  t.workflows.push(TE.newWorkflow({id:'d-wf1',name:'Claims intake',change:'Household eligibility is checked at registration, before a claim is assigned. Intake Specialists complete a new eligibility screen.',audienceIds:[intake.id,sup.id],version:'FDD v3'}));
  TE.log(p,{type:'workflow',refId:'d-wf1',text:'Workflow recorded: Claims intake (household eligibility at registration)'},at(-78));
  t.objectives.push(TE.newObjective({id:'d-ob1',workflowId:'d-wf1',audienceIds:[intake.id],task:'Register a household claim with the new eligibility check',performance:'Registers the claim and completes the eligibility screen without supervisor help',criteria:'Workbook exercise completed with no errors; observed on the job in week 2',method:'Scenario-based exercise and floor observation',support:'Job aid at each workstation'}));
  t.objectives.push(TE.newObjective({id:'d-ob2',workflowId:'d-wf1',audienceIds:[sup.id],task:'Review eligibility exceptions routed to the supervisor queue',performance:'Clears the exception queue daily',criteria:'Queue cleared within one business day',method:'Floor observation'}));
  // 2. Scenario and materials
  t.scenarios.push(TE.newScenario({id:'d-sc1',title:'Register a household claim',workflowId:'d-wf1',objectiveIds:['d-ob1'],critical:true,preconditions:'Learner account with the Intake role; test household with two members',permissions:'Intake role, eligibility screen',data:'Household test record HH-204',expected:'Claim registered and routed with eligibility recorded',qaEvidence:'QA-112 passed (build R1029)'}));
  t.scenarios.push(TE.newScenario({id:'d-sc2',title:'Route an eligibility exception',workflowId:'d-wf1',objectiveIds:['d-ob2'],qaEvidence:'QA-118 passed'}));
  t.deliverables.push(TE.newDeliverable({id:'d-d1',title:'Intake workbook exercise',type:'exercise',scenarioIds:['d-sc1'],objectiveIds:['d-ob1'],audienceIds:[intake.id],critical:true,state:'draft',owner:'Dana Whitfield',
    planned:{start:day(-74),due:day(-45),delivery:day(-40)},actual:{start:day(-74),done:''}}));
  t.deliverables.push(TE.newDeliverable({id:'d-d2',title:'Eligibility screen job aid',type:'job_aid',workflowIds:['d-wf1'],objectiveIds:['d-ob1'],audienceIds:[intake.id],state:'draft',owner:'Dana Whitfield',
    planned:{start:day(-74),due:day(-55),delivery:day(-40)},actual:{start:day(-74),done:''}}));
  t.deliverables.push(TE.newDeliverable({id:'d-d3',title:'Supervisor exception-queue guide',type:'job_aid',scenarioIds:['d-sc2'],objectiveIds:['d-ob2'],audienceIds:[sup.id],state:'draft',owner:'Dana Whitfield',
    planned:{start:day(-70),due:day(-50),delivery:day(-38)},actual:{start:day(-70),done:''}}));
  TE.log(p,{type:'deliverable',text:'Deliverables recorded: workbook exercise, eligibility job aid, supervisor guide (Draft)'},at(-74));
  t.checkpoints.scope={decision:'proceed',reviewer:'Dana Whitfield',date:day(-74),evidence:'Impact analysis and stakeholder matrix reviewed'};
  t.checkpoints.devEntry={decision:'proceed',reviewer:'Dana Whitfield',date:day(-72),evidence:'FDD v3 and QA-112 scenario evidence'};
  TE.log(p,{type:'checkpoint',refId:'devEntry',text:'Development entry: Proceed (Dana Whitfield)'},at(-72));
  // 3. QA passes, but the scenario cannot run in the training environment
  TE.recordScenarioRun(p,'d-sc1',{status:'fail',environment:'TRN-2',date:day(-66),by:'Dana Whitfield',note:'Learner role cannot open the eligibility screen (permission missing in TRN-2).'},at(-66));
  const dep=TE.newDependency({id:'d-dep1',title:'Training environment can run the intake scenario',workstream:'Environment support',owner:'J. Okafor',scenarioIds:['d-sc1'],audienceIds:[intake.id],
    acceptance:'A learner account completes "Register a household claim" end to end in TRN-2',critical:true,requiredBy:day(-50),phase:2,consequence:'Workbook practice cannot be validated; delivery of the exercise cannot start.',
    permits:{provisional:true,scenarioDev:true,validation:false,facilitator:false,delivery:false},permittedNote:'Exercise steps can be drafted from QA evidence; they must be re-run in TRN-2 before review.',created:day(-66)});
  t.dependencies.push(dep);
  TE.updateDependency(p,'d-dep1',{status:'blocked',next:{action:'Add the eligibility-screen permission to the TRN-2 learner role',owner:'J. Okafor',due:day(-55)}},at(-66));
  TE.log(p,{type:'dependency',refId:'d-dep1',text:'Dependency recorded: Training environment can run the intake scenario (Blocked)'},at(-66));
  // 4. Unaffected job-aid development continues
  TE.setDeliverableState(p,'d-d2','in_review',at(-60));
  TE.byId(t.deliverables,'d-d2').reviews.push({date:day(-57),reviewer:'Marcus Lee',outcome:'Approved',note:'Matches FDD v3 screen layout'});
  TE.setDeliverableState(p,'d-d2','approved',at(-57));TE.byId(t.deliverables,'d-d2').actual.done=day(-57);
  // 5. The environment owner resolves it and supplies evidence
  TE.updateDependency(p,'d-dep1',{status:'satisfied',evidence:{ref:'ENV-77',version:'R1030',environment:'TRN-2',verified:true,date:day(-52)}},at(-52));
  const a=t.actions.find(x=>x.source&&x.source.type==='dependency'&&x.source.id==='d-dep1');if(a){a.status='done';a.closed=day(-52);}
  // 6. Training validates the scenario and reviews the materials
  TE.recordScenarioRun(p,'d-sc1',{status:'pass',environment:'TRN-2',date:day(-50),by:'Dana Whitfield',note:'Completed end to end with learner account TRN-L14.'},at(-50));
  TE.recordScenarioRun(p,'d-sc2',{status:'pass',environment:'TRN-2',date:day(-50),by:'Dana Whitfield'},at(-50));
  TE.setDeliverableState(p,'d-d1','in_review',at(-49));
  TE.byId(t.deliverables,'d-d1').reviews.push({date:day(-47),reviewer:'Marcus Lee (SME)',outcome:'Approved with changes',note:'Add the two-member household variation'});
  TE.byId(t.deliverables,'d-d1').revisions.push({what:'Added the two-member household variation',why:'SME review',by:'Dana Whitfield',date:day(-46),approval:'Approved'});
  TE.setDeliverableState(p,'d-d1','validated',at(-46));TE.setDeliverableState(p,'d-d1','approved',at(-45));TE.byId(t.deliverables,'d-d1').actual.done=day(-45);
  TE.setDeliverableState(p,'d-d3','approved',at(-48));TE.byId(t.deliverables,'d-d3').reviews.push({date:day(-48),reviewer:'Priya Raman',outcome:'Approved'});TE.byId(t.deliverables,'d-d3').actual.done=day(-48);
  t.checkpoints.validation={decision:'proceed',reviewer:'Dana Whitfield',date:day(-46),evidence:'Both scenarios pass in TRN-2; SME review complete'};
  t.checkpoints.deliveryEntry={decision:'proceed',reviewer:'Dana Whitfield',date:day(-44),evidence:'Facilitators rehearsed in TRN-2; rosters confirmed'};
  TE.log(p,{type:'checkpoint',refId:'deliveryEntry',text:'Delivery entry: Proceed. Recommendation moved from Not ready for delivery to Ready for delivery.'},at(-44));
  // 7. Delivery and the release decision
  t.checkpoints.governance={decision:'proceed',reviewer:'Priya Raman',date:day(-30),authority:'Benefits Program Governance Board (Go/No-Go)',evidence:'Training recommendation: Ready for delivery'};
  TE.log(p,{type:'checkpoint',refId:'governance',text:'Go/No-Go: Proceed (Benefits Program Governance Board)'},at(-30));
  t.lastReview=day(-30);
  ['d-d1','d-d2','d-d3'].forEach(id=>TE.setDeliverableState(p,id,'released',at(-29)));
  // 8. Post-launch: measures set before launch, observations after
  const m1={id:'d-m1',name:'Claims registered without rework',kind:'performance',audienceIds:[intake.id],baseline:'82',target:'92',unit:'%',direction:'up',window:{start:day(-20),end:day(15)},source:'Case system rework report'};
  const m2={id:'d-m2',name:'Eligibility exceptions cleared within one day',kind:'performance',audienceIds:[sup.id],baseline:'70',target:'90',unit:'%',direction:'up',window:{start:day(-20),end:day(15)},source:'Exception queue report'};
  const m3={id:'d-m3',name:'Confidence using the eligibility screen',kind:'perception',audienceIds:[intake.id],baseline:'',target:'4',unit:'/5',direction:'up',window:{start:day(-20),end:day(0)},source:'Pulse survey'};
  t.outcomes.measures.push(m1,m2,m3);TE.log(p,{type:'measure',text:'Outcome measures defined before launch: rework, exception queue, confidence'},at(-35));
  const obs=(m,n,v,size,note)=>{t.outcomes.observations.push({id:TE.id(),measureId:m.id,date:day(n),value:v,n:size,evidence:m.source,note:note||''});TE.log(p,{type:'observation',refId:m.id,text:m.name+': '+v+m.unit+' observed'},at(n));};
  obs(m1,-20,86,140);obs(m2,-20,78,62);obs(m3,-19,3.6,180);
  t.outcomes.diagnoses.push({id:TE.id(),date:day(-15),audienceIds:[intake.id],causes:['practice','process'],note:'Errors cluster on households with a member who moved out. Specialists read the definition of household differently; the screen itself works.'});
  TE.log(p,{type:'diagnosis',text:'Adoption diagnosis: insufficient practice; unclear process (household definition)'},at(-15));
  obs(m1,-13,90,151,'After the household-definition practice session and the policy clarification');obs(m2,-13,86,58);
  obs(m1,-6,93,148);obs(m2,-6,91,60);obs(m3,-5,4.1,166);

  // ── Project 2: Benefits Renewal Notices (blocked today) ──
  const q=newProject('Benefits Renewal Notices',[ORG],180);
  q.status='In Progress';q.size='S';q.golive=day(40);migrateResources(q);
  q.resources.ocm_train=[{name:'Dana Whitfield',contact:''}];q.resources.pm=[{name:'Priya Raman',contact:''}];
  const rn=mkSh('Renewal Caseworkers',180);q.stakeholders=[rn];
  q.gateState={g1_0:'green',g1_1:'green',g1_2:'green',g1_3:'green',g1_4:'green',g1_5:'yellow',g2_0:'green',g2_1:'yellow',g2_2:'green',g2_3:'green',g3_0:'red'};
  TE.migrate(q,{});const u=q.training;const qa=n=>({today:day(n),by:'Dana Whitfield'});
  u.workflows.push(TE.newWorkflow({id:'r-wf1',name:'Renewal notice review',change:'Caseworkers review system-generated renewal notices in a new queue before they are mailed.',audienceIds:[rn.id],version:'FDD v2'}));
  u.objectives.push(TE.newObjective({id:'r-ob1',workflowId:'r-wf1',audienceIds:[rn.id],task:'Review a renewal notice and release or correct it',performance:'Releases correct notices and corrects address or income errors before mailing',criteria:'Simulation completed with no released errors',method:'Simulation, then queue sampling in week 1'}));
  u.scenarios.push(TE.newScenario({id:'r-sc1',title:'Review and release a renewal notice',workflowId:'r-wf1',objectiveIds:['r-ob1'],critical:true,jiraKey:'RN-101',qaEvidence:'QA-301 passed (build R1104)'}));
  u.deliverables.push(TE.newDeliverable({id:'r-d1',title:'Notice review simulation',type:'simulation',scenarioIds:['r-sc1'],objectiveIds:['r-ob1'],audienceIds:[rn.id],critical:true,state:'draft',owner:'Dana Whitfield',planned:{start:day(-10),due:day(18),delivery:day(25)},actual:{start:day(-10),done:''}}));
  u.deliverables.push(TE.newDeliverable({id:'r-d2',title:'Renewal queue quick reference',type:'job_aid',workflowIds:['r-wf1'],audienceIds:[rn.id],state:'in_review',owner:'Dana Whitfield',planned:{start:day(-10),due:day(5),delivery:day(25)},actual:{start:day(-10),done:''}}));
  u.checkpoints.scope={decision:'proceed',reviewer:'Dana Whitfield',date:day(-12)};
  TE.log(q,{type:'workflow',text:'Workflow recorded: Renewal notice review'},qa(-12));
  TE.recordScenarioRun(q,'r-sc1',{status:'fail',environment:'TRN-2',date:day(-4),by:'Dana Whitfield',note:'Renewal queue is empty in TRN-2; no notice data has been loaded.'},qa(-4));
  u.dependencies.push(TE.newDependency({id:'r-dep1',title:'Renewal notice test data loaded in TRN-2',workstream:'App Dev',owner:'S. Alvarez',scenarioIds:['r-sc1'],critical:true,requiredBy:day(7),phase:2,
    consequence:'The simulation cannot be validated, so caseworker delivery cannot be scheduled.',permits:{provisional:true,scenarioDev:true,validation:false,facilitator:false,delivery:false},created:day(-4)}));
  TE.updateDependency(q,'r-dep1',{status:'blocked',next:{action:'Load 25 renewal notices into the TRN-2 queue',owner:'S. Alvarez',due:day(3)}},qa(-4));
  u.dependencies.push(TE.newDependency({id:'r-dep2',title:'Final notice template wording',workstream:'Functional',owner:'Marcus Lee',deliverableIds:['r-d2'],requiredBy:day(5),phase:1,status:'partial',
    consequence:'Quick reference screenshots may change.',permits:{provisional:true,scenarioDev:true,validation:true,facilitator:false,delivery:false},created:day(-8)}));
  TE.log(q,{type:'dependency',refId:'r-dep2',text:'Dependency recorded: Final notice template wording (Partial)'},qa(-8));

  // Newest first, by date (records were written in story order).
  [p,q].forEach(x=>x.training.history.sort((a,b)=>String(b.date).localeCompare(String(a.date))));
  // A fictional Jira import, so the Jira suggestions can be seen in the demo.
  q.jira={importedAt:new Date(day(-2)+'T09:00:00').toISOString(),file:'renewals-sample.csv',version:'R1104',uatDefects:0,trainDefects:1,bugs:1,untriaged:[],
    items:[{key:'RN-101',summary:'Renewal notice review queue',status:'In UAT',ready:false,qaPassed:true,uatPassed:false,created:day(-30),defects:[],programs:'Renewals',programList:['Renewals'],hasAccept:true},
      {key:'RN-102',summary:'Correct an address before mailing',status:'UAT Passed',ready:true,qaPassed:true,uatPassed:true,created:day(-30),defects:[{key:'RN-150',summary:'Learner role cannot release notices in TRN-2',status:'Open',open:true}],programs:'Renewals',programList:['Renewals'],hasAccept:true}],
    trainDefectList:[{key:'RN-150',summary:'Learner role cannot release notices in TRN-2',status:'Open',open:true,links:['RN-102']}]};
  r.projects=[p,q];releases.push(r);
}
