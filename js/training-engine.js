'use strict';
// ════════════════════════════════════════════════════════
// TRAINING ENGINE (pure logic, no DOM)
// Training-led OCM records: workflows → objectives → scenarios → deliverables,
// upstream dependencies and evidence, checkpoints, actions, outcomes.
// Every measure is derived from these records. Nothing here invents a number:
// missing data returns an explicit state ('not_assessed', 'insufficient').
// Loaded in the browser before js/adoptiq.js (global TE) and by Node tests.
// ════════════════════════════════════════════════════════
(function(root){
const TE={};

// ── Vocabularies ──
TE.DEP_STATUS={
  awaiting:{label:'Awaiting',rank:1},
  partial:{label:'Partial',rank:2},
  blocked:{label:'Blocked',rank:3},
  satisfied:{label:'Satisfied',rank:0},
  exception:{label:'Accepted exception',rank:0}
};
TE.DEP_ORDER=['awaiting','partial','blocked','satisfied','exception'];
// Activities a dependency can permit while it is unresolved. Order is the delivery sequence.
TE.ACTIVITIES=[
  {key:'analysis',label:'Learning analysis'},
  {key:'provisional',label:'Provisional development'},
  {key:'scenarioDev',label:'Scenario-based development'},
  {key:'validation',label:'Validation and review'},
  {key:'facilitator',label:'Facilitator preparation'},
  {key:'delivery',label:'End-user delivery'},
  {key:'followup',label:'Post-launch follow-up'}
];
TE.GATED_ACTIVITIES=['provisional','scenarioDev','validation','facilitator','delivery'];
TE.DELIV_STATES={
  not_started:{label:'Not Started',done:false},
  draft:{label:'Draft',done:false},
  awaiting_input:{label:'Awaiting Input',done:false},
  in_review:{label:'In Review',done:false},
  validated:{label:'Validated',done:true},
  approved:{label:'Approved',done:true},
  released:{label:'Released',done:true},
  revision_required:{label:'Revision Required',done:false}
};
TE.DELIV_ORDER=['not_started','draft','awaiting_input','in_review','validated','approved','released','revision_required'];
TE.DELIV_TYPES={job_aid:'Job aid',facilitator_guide:'Facilitator guide',demonstration:'Demonstration',exercise:'Exercise',simulation:'Simulation',course:'Course',other:'Other'};
TE.SCEN_ENV={not_run:'Not run',pass:'Runs in training environment',fail:'Does not run in training environment'};
TE.READY_STATES={
  not_assessed:{label:'Not Assessed',tone:'n'},
  insufficient:{label:'Insufficient Evidence',tone:'a'},
  ready:{label:'Ready',tone:'g'},
  conditional:{label:'Conditional',tone:'a'},
  blocked:{label:'Blocked',tone:'r'}
};
// Checkpoint families. Legacy gate items keep their keys (g1_0 … g4_5) and are grouped here.
TE.CHECKPOINTS=[
  {key:'scope',label:'Learning scope and impacts',sub:'Who is affected, what changes, what people must learn',legacy:['g1_0','g1_1','g1_2','g1_3','g1_4','g1_5','g2_0']},
  {key:'devEntry',label:'Development entry',sub:'Inputs needed to start building materials',legacy:['g2_1','g2_2','g2_3','g2_4','g2_5','g3_2']},
  {key:'validation',label:'Material and scenario validation',sub:'Scenarios run in the learning environment; content verified',legacy:['g3_0','g3_1','g3_4','g3_5']},
  {key:'deliveryEntry',label:'Delivery entry',sub:'Conditions to start end-user delivery',legacy:['g3_3','g4_0','g4_1','g4_2','g4_5']},
  {key:'governance',label:'Training readiness input to release governance',sub:'Training’s recommendation; final release authority rests with release governance',legacy:['g4_3']},
  {key:'outcomes',label:'Post-launch outcome review',sub:'Did performance hold after launch',legacy:['g4_4']}
];
TE.DECISIONS={'':'Not recorded',proceed:'Proceed',conditional:'Proceed with conditions',hold:'Hold',not_applicable:'Not applicable'};
TE.CAUSES={
  knowledge:'Knowledge or ability gap',practice:'Insufficient practice',system:'System defect or usability',
  access:'Access or permissions',process:'Unclear or inconsistent process',communication:'Communication gap',
  workload:'Workload or capacity',reinforcement:'Reinforcement or managerial support',unknown:'Cause not yet established'
};
TE.TRAINING_CAUSES=['knowledge','practice']; // causes a training intervention can address directly
TE.MEASURE_KINDS={perception:'Perception',learning:'Learning result',performance:'Observed work performance'};
TE.DEFAULT_SETTINGS={staleDays:30,abilityThreshold:80,abilityLowDim:2};

// ── Helpers ──
let _seq=0;
TE.id=function(){return (typeof root.uid==='function')?root.uid():Date.now()*1000+(_seq++%1000);};
function todayISO(ctx){if(ctx&&ctx.today)return ctx.today;const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
TE.today=todayISO;
function daysBetween(a,b){const x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');if(isNaN(x)||isNaN(y))return null;return Math.round((y-x)/864e5);}
TE.daysBetween=daysBetween;
function arr(v){return Array.isArray(v)?v:[];}
function uniq(a){return Array.from(new Set(a.filter(v=>v!==undefined&&v!==null&&v!=='')));}
function byId(list,id){return arr(list).find(x=>String(x.id)===String(id));}
TE.byId=byId;
function isResolved(dep){return dep.status==='satisfied'||dep.status==='exception';}
TE.isResolved=isResolved;
TE.depStatusLabel=s=>(TE.DEP_STATUS[s]||{label:'Awaiting'}).label;
TE.delivStateLabel=s=>(TE.DELIV_STATES[s]||TE.DELIV_STATES.not_started).label;

// ── Data model ──
TE.emptyTraining=function(){
  return{v:2,workflows:[],objectives:[],scenarios:[],deliverables:[],dependencies:[],
    checkpoints:{},actions:[],outcomes:{measures:[],observations:[],diagnoses:[]},
    entryRules:null,history:[],settings:Object.assign({},TE.DEFAULT_SETTINGS),lastReview:'',legacy:{}};
};
TE.newDependency=function(o){return Object.assign({id:TE.id(),title:'',workstream:'',owner:'',workflowIds:[],scenarioIds:[],audienceIds:[],deliverableIds:[],
  requiredBy:'',acceptance:'',evidence:{ref:'',version:'',environment:'',verified:false,date:''},status:'awaiting',critical:false,
  consequence:'',permits:{provisional:true,scenarioDev:false,validation:false,facilitator:false,delivery:false},permittedNote:'',
  next:{action:'',owner:'',due:''},exception:null,phase:null,source:'',created:'',updated:''},o||{});};
TE.newScenario=function(o){return Object.assign({id:TE.id(),title:'',objectiveIds:[],workflowId:'',preconditions:'',permissions:'',data:'',expected:'',
  qaEvidence:'',uatEvidence:'',env:{status:'not_run',date:'',environment:'',by:'',note:''},limitations:'',critical:false,needsRevalidation:null},o||{});};
TE.newDeliverable=function(o){return Object.assign({id:TE.id(),title:'',type:'job_aid',objectiveIds:[],scenarioIds:[],audienceIds:[],workflowIds:[],
  state:'not_started',owner:'',link:'',required:true,critical:false,reviews:[],revisions:[],revisionFlag:null,
  planned:{start:'',due:'',delivery:''},actual:{start:'',done:''}},o||{});};
TE.newObjective=function(o){return Object.assign({id:TE.id(),audienceIds:[],workflowId:'',task:'',performance:'',criteria:'',support:'',method:''},o||{});};
TE.newWorkflow=function(o){return Object.assign({id:TE.id(),name:'',change:'',audienceIds:[],version:''},o||{});};

// Suggested entry conditions. Editable per project; never presented as SOP mandates.
TE.defaultEntryRules=function(){return{
  provisional:[{id:'r-prov-scope',kind:'checkpoint',ref:'scope',label:'Learning scope and impacts reviewed',enabled:true}],
  scenarioDev:[{id:'r-sdev-entry',kind:'checkpoint',ref:'devEntry',label:'Development entry reviewed',enabled:true}],
  validation:[{id:'r-val-env',kind:'scenarios_run',label:'Linked scenarios run in the training environment',enabled:true}],
  facilitator:[{id:'r-fac-val',kind:'deliverable_done',label:'Deliverable validated or approved',enabled:true}],
  delivery:[{id:'r-del-crit',kind:'critical_scenarios',label:'Critical scenarios validated',enabled:true},
    {id:'r-del-ck',kind:'checkpoint',ref:'deliveryEntry',label:'Delivery entry reviewed',enabled:true},
    {id:'r-del-uat',kind:'dependency_tag',ref:'uat',label:'UAT acceptance recorded (optional rule; enable if your governance requires it)',enabled:false}]
};};

// Idempotent, additive migration. Legacy fields are left untouched.
// ctx: {WS:[workstream names], GL:[gate phase labels], PL_INTERVALS:[{key,label}], golive:'YYYY-MM-DD', today}
TE.migrate=function(p,ctx){
  ctx=ctx||{};
  if(!p.training||typeof p.training!=='object')p.training=TE.emptyTraining();
  const t=p.training;const e=TE.emptyTraining();
  Object.keys(e).forEach(k=>{if(t[k]===undefined||t[k]===null&&k!=='entryRules')t[k]=e[k];});
  ['workflows','objectives','scenarios','deliverables','dependencies','actions','history'].forEach(k=>{if(!Array.isArray(t[k]))t[k]=[];});
  if(!t.outcomes||typeof t.outcomes!=='object')t.outcomes=e.outcomes;
  ['measures','observations','diagnoses'].forEach(k=>{if(!Array.isArray(t.outcomes[k]))t.outcomes[k]=[];});
  t.settings=Object.assign({},TE.DEFAULT_SETTINGS,t.settings||{});
  if(!t.entryRules)t.entryRules=TE.defaultEntryRules();
  if(!t.legacy)t.legacy={};
  // Normalize records in place, so references held by open editors stay valid.
  const fill=(o,k,def)=>{if(!o[k]||typeof o[k]!=='object')o[k]={};Object.keys(def).forEach(x=>{if(o[k][x]===undefined)o[k][x]=def[x];});};
  const base=(o,def)=>{Object.keys(def).forEach(x=>{if(o[x]===undefined)o[x]=def[x];});};
  t.dependencies.forEach(d=>{base(d,TE.newDependency(d.id!=null?{id:d.id}:{}));fill(d,'evidence',{ref:'',version:'',environment:'',verified:false,date:''});
    fill(d,'permits',{provisional:true,scenarioDev:false,validation:false,facilitator:false,delivery:false});fill(d,'next',{action:'',owner:'',due:''});});
  t.scenarios.forEach(s=>{base(s,TE.newScenario(s.id!=null?{id:s.id}:{}));fill(s,'env',{status:'not_run',date:'',environment:'',by:'',note:''});});
  t.deliverables.forEach(d=>{base(d,TE.newDeliverable(d.id!=null?{id:d.id}:{}));fill(d,'planned',{start:'',due:'',delivery:''});fill(d,'actual',{start:'',done:''});
    ['reviews','revisions'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[];});});
  // ADKAR: record which dimensions were actually rated (old data defaulted every dimension to 3).
  if(p.adkarScores&&!Array.isArray(p.adkarRated))p.adkarRated=Object.keys(p.adkarScores).filter(k=>+p.adkarScores[k]!==3);
  // Legacy dependency heat map: each non-default cell becomes a dependency record once.
  if(!t.legacy.heatmap&&p.depHM&&ctx.WS&&ctx.GL){
    const map={1:'satisfied',2:'partial',3:'blocked'};
    Object.keys(p.depHM).forEach(k=>{
      const v=+p.depHM[k];if(!map[v])return;
      const parts=k.split('_');const gi=+parts[0],wi=+parts[1];
      if(t.dependencies.some(d=>d.legacyKey===k))return;
      t.dependencies.push(TE.newDependency({title:(ctx.WS[wi]||'Workstream')+' input: '+(ctx.GL[gi]||'phase'),workstream:ctx.WS[wi]||'',
        status:map[v],phase:gi,legacyKey:k,source:'legacy-heatmap',consequence:(p.depNotes&&p.depNotes[k])||'',
        created:todayISO(ctx),updated:todayISO(ctx)}));
    });
    t.legacy.heatmap=true;
  }
  // Legacy 30/60/90 adoption tracker values become observations of one measure.
  if(!t.legacy.postLaunch&&p.postLaunch&&ctx.PL_INTERVALS){
    const obs=[];
    Object.keys(p.postLaunch).forEach(shId=>{
      const d=p.postLaunch[shId]||{};
      ctx.PL_INTERVALS.forEach(iv=>{const o=d[iv.key];if(!o||o.adoption===undefined||o.adoption===null||o.adoption===''||isNaN(+o.adoption))return;
        let date='';if(ctx.golive){const g=new Date(ctx.golive+'T12:00:00');g.setDate(g.getDate()+parseInt(iv.key.slice(1),10));date=g.toISOString().slice(0,10);}
        obs.push({audienceId:shId,date,value:+o.adoption,note:iv.label+' (imported from the earlier adoption tracker)'});});
    });
    if(obs.length){
      const m={id:TE.id(),name:'Adoption score (earlier tracker)',kind:'performance',audienceIds:uniq(obs.map(o=>o.audienceId)),baseline:'',target:'',unit:'%',direction:'up',window:{start:'',end:''},source:'Imported'};
      t.outcomes.measures.push(m);
      obs.forEach(o=>t.outcomes.observations.push(Object.assign({id:TE.id(),measureId:m.id,n:'',evidence:''},o)));
    }
    t.legacy.postLaunch=true;
  }
  return t;
};

// ── History ──
TE.log=function(p,entry,ctx){
  const t=p.training;const h=Object.assign({id:TE.id(),date:todayISO(ctx),by:(ctx&&ctx.by)||''},entry);
  t.history.unshift(h);if(t.history.length>500)t.history.length=500;return h;
};

// ── Links ──
// Deliverables affected by a dependency: linked directly, through a linked scenario, or through a linked workflow.
TE.depAffects=function(p,dep){
  const t=p.training;
  const scen=new Set(arr(dep.scenarioIds).map(String));
  arr(dep.workflowIds).forEach(w=>t.scenarios.forEach(s=>{if(String(s.workflowId)===String(w))scen.add(String(s.id));}));
  const dels=new Set(arr(dep.deliverableIds).map(String));
  t.deliverables.forEach(d=>{
    if(arr(d.scenarioIds).some(s=>scen.has(String(s))))dels.add(String(d.id));
    if(arr(d.workflowIds).some(w=>arr(dep.workflowIds).map(String).includes(String(w))))dels.add(String(d.id));
  });
  const aud=new Set(arr(dep.audienceIds).map(String));
  t.deliverables.filter(d=>dels.has(String(d.id))).forEach(d=>arr(d.audienceIds).forEach(a=>aud.add(String(a))));
  return{scenarioIds:Array.from(scen),deliverableIds:Array.from(dels),audienceIds:Array.from(aud)};
};
TE.depsFor=function(p,deliv){
  return p.training.dependencies.filter(dep=>TE.depAffects(p,dep).deliverableIds.includes(String(deliv.id)));
};
TE.scenarioValidated=function(s){return !!s&&s.env&&s.env.status==='pass'&&!s.needsRevalidation;};

// ── Activity gating per deliverable ──
// A dependency blocks only the activities it does not permit, and only for linked work.
TE.activityStatus=function(p,deliv){
  const t=p.training;const deps=TE.depsFor(p,deliv);const res={};
  const rules=t.entryRules||TE.defaultEntryRules();
  TE.GATED_ACTIVITIES.forEach(act=>{
    const blockers=[];const conditions=[];
    deps.forEach(d=>{
      if(d.status==='exception'){conditions.push({type:'exception',dep:d,text:'Accepted exception: '+d.title});return;}
      if(d.status==='satisfied')return;
      if(d.permits&&d.permits[act])return;
      blockers.push({type:'dependency',dep:d,text:d.title+' ('+TE.depStatusLabel(d.status)+')'});
    });
    arr(rules[act]).filter(r=>r.enabled!==false).forEach(r=>{
      const r1=TE.ruleMet(p,r,deliv);if(!r1.met)(r1.soft?conditions:blockers).push({type:'rule',rule:r,text:r1.text});
    });
    res[act]={ok:blockers.length===0,conditional:blockers.length===0&&conditions.length>0,blockers,conditions};
  });
  return res;
};
TE.ruleMet=function(p,r,deliv){
  const t=p.training;
  // A checkpoint on Hold blocks; one not yet reviewed is a condition, so work can start while the review is pending.
  if(r.kind==='checkpoint'){const c=t.checkpoints[r.ref]||{};const cp=TE.CHECKPOINTS.find(x=>x.key===r.ref);const lbl=cp?cp.label:r.ref;
    if(c.decision==='hold')return{met:false,text:lbl+' is on hold'};
    if(!c.decision)return{met:false,soft:true,text:lbl+' not yet reviewed'};
    if(c.decision==='conditional')return{met:false,soft:true,text:lbl+': proceed with conditions'+(c.conditions?' ('+c.conditions+')':'')};
    return{met:true,text:''};}
  if(r.kind==='scenarios_run'){const sc=arr(deliv.scenarioIds).map(id=>byId(t.scenarios,id)).filter(Boolean);const bad=sc.filter(s=>!TE.scenarioValidated(s));
    return{met:!bad.length,text:bad.map(s=>'Scenario not validated: '+s.title).join('; ')};}
  if(r.kind==='critical_scenarios'){const sc=arr(deliv.scenarioIds).map(id=>byId(t.scenarios,id)).filter(s=>s&&s.critical);const bad=sc.filter(s=>!TE.scenarioValidated(s));
    return{met:!bad.length,text:bad.map(s=>'Critical scenario not validated: '+s.title).join('; ')};}
  if(r.kind==='deliverable_done'){const ok=(TE.DELIV_STATES[deliv.state]||{}).done&&!deliv.revisionFlag;return{met:!!ok,text:'Deliverable is '+TE.delivStateLabel(deliv.state)+(deliv.revisionFlag?' and flagged for review':'')};}
  if(r.kind==='dependency_tag'){const d=t.dependencies.filter(x=>String(x.workstream||'').toLowerCase().includes(String(r.ref).toLowerCase()));
    const ok=d.length>0&&d.every(isResolved);return{met:ok,text:d.length?'UAT acceptance dependency not satisfied':'No UAT acceptance dependency recorded'};}
  if(r.kind==='date'){const ok=r.date&&todayISO()>=r.date;return{met:!!ok,text:'Not before '+(r.date||'(date not set)')};}
  return{met:true,text:''};
};

// ── Change propagation ──
// Updating a dependency flags affected work for review. It never marks anything validated or ready.
TE.updateDependency=function(p,depId,patch,ctx){
  const t=p.training;const dep=byId(t.dependencies,depId);if(!dep)return null;
  const before=JSON.parse(JSON.stringify(dep));
  Object.keys(patch).forEach(k=>{if(k==='evidence'||k==='permits'||k==='next')dep[k]=Object.assign({},dep[k]||{},patch[k]);else dep[k]=patch[k];});
  if(dep.status==='exception'){
    const ex=dep.exception||{};
    if(!ex.rationale||!ex.approver||!ex.date){Object.assign(dep,before);return{error:'An accepted exception needs a rationale, the authorizing approver and a date.'};}
  }
  dep.updated=todayISO(ctx);
  const aff=TE.depAffects(p,dep);
  const evidenceChanged=['ref','version','environment'].some(k=>(before.evidence||{})[k]!==(dep.evidence||{})[k]);
  const regressed=isResolved(before)&&!isResolved(dep);
  const flagged={scenarios:[],deliverables:[]};
  if(evidenceChanged||regressed){
    const reason=regressed?'Dependency “'+dep.title+'” changed from '+TE.depStatusLabel(before.status)+' to '+TE.depStatusLabel(dep.status)
      :'Evidence for “'+dep.title+'” changed'+((dep.evidence||{}).version?' (now '+dep.evidence.version+')':'');
    aff.scenarioIds.forEach(id=>{const s=byId(t.scenarios,id);if(s&&s.env&&s.env.status==='pass'){s.needsRevalidation={reason,date:todayISO(ctx),sourceId:dep.id};flagged.scenarios.push(s.id);}});
    aff.deliverableIds.forEach(id=>{const d=byId(t.deliverables,id);if(d&&d.state!=='not_started'){d.revisionFlag={reason,date:todayISO(ctx),sourceType:'dependency',sourceId:dep.id,resolved:false};flagged.deliverables.push(d.id);}});
  }
  if(before.status!==dep.status||evidenceChanged||before.requiredBy!==dep.requiredBy){
    TE.log(p,{type:'dependency',refId:dep.id,text:dep.title+': '+(before.status!==dep.status?TE.depStatusLabel(before.status)+' → '+TE.depStatusLabel(dep.status):evidenceChanged?'evidence updated':'required-by date changed to '+(dep.requiredBy||'none')),
      before:{status:before.status,requiredBy:before.requiredBy,evidence:before.evidence},after:{status:dep.status,requiredBy:dep.requiredBy,evidence:dep.evidence},
      flagged:flagged.scenarios.length+flagged.deliverables.length},ctx);
  }
  if(!isResolved(dep)&&dep.next&&dep.next.action)TE.ensureAction(p,{type:'dependency',id:dep.id},{title:dep.next.action,owner:dep.next.owner,due:dep.next.due},ctx);
  return{dep,affected:aff,flagged};
};
// A workflow or system change flags exactly the linked objectives' scenarios and deliverables.
TE.recordWorkflowChange=function(p,wfId,summary,ctx){
  const t=p.training;const wf=byId(t.workflows,wfId);if(!wf)return null;
  const reason='Workflow change: '+wf.name+(summary?' — '+summary:'');
  const objIds=t.objectives.filter(o=>String(o.workflowId)===String(wfId)).map(o=>String(o.id));
  const scen=t.scenarios.filter(s=>String(s.workflowId)===String(wfId)||arr(s.objectiveIds).some(o=>objIds.includes(String(o))));
  const scenIds=scen.map(s=>String(s.id));
  const dels=t.deliverables.filter(d=>arr(d.workflowIds).map(String).includes(String(wfId))||arr(d.objectiveIds).some(o=>objIds.includes(String(o)))||arr(d.scenarioIds).some(s=>scenIds.includes(String(s))));
  scen.forEach(s=>{if(s.env&&s.env.status==='pass')s.needsRevalidation={reason,date:todayISO(ctx),sourceId:wf.id};});
  dels.forEach(d=>{if(d.state!=='not_started')d.revisionFlag={reason,date:todayISO(ctx),sourceType:'workflow',sourceId:wf.id,resolved:false};});
  TE.log(p,{type:'workflow',refId:wf.id,text:reason,flagged:scen.length+dels.length},ctx);
  return{scenarios:scen.map(s=>s.id),deliverables:dels.map(d=>d.id)};
};
TE.recordScenarioRun=function(p,scenId,env,ctx){
  const s=byId(p.training.scenarios,scenId);if(!s)return null;
  const before=s.env&&s.env.status;
  s.env=Object.assign({},s.env||{},env);
  if(env.status==='pass')s.needsRevalidation=null;
  TE.log(p,{type:'scenario',refId:s.id,text:s.title+': '+(TE.SCEN_ENV[before]||'Not run')+' → '+(TE.SCEN_ENV[s.env.status]||s.env.status)+(s.env.environment?' ('+s.env.environment+')':'')},ctx);
  return s;
};
TE.setDeliverableState=function(p,delId,state,ctx,note){
  const d=byId(p.training.deliverables,delId);if(!d||!TE.DELIV_STATES[state])return null;
  const before=d.state;d.state=state;
  if(state==='revision_required'&&!d.revisionFlag)d.revisionFlag={reason:note||'Marked for revision',date:todayISO(ctx),sourceType:'manual',resolved:false};
  if((state==='validated'||state==='approved')&&d.revisionFlag)d.revisionFlag=null;
  TE.log(p,{type:'deliverable',refId:d.id,text:d.title+': '+TE.delivStateLabel(before)+' → '+TE.delivStateLabel(state)+(note?' ('+note+')':'')},ctx);
  return d;
};

// ── Actions (one record per piece of work) ──
TE.sourceKey=s=>s?(s.type+':'+s.id):'';
TE.ensureAction=function(p,source,fields,ctx){
  const t=p.training;const key=TE.sourceKey(source);
  let a=key?t.actions.find(x=>TE.sourceKey(x.source)===key&&x.status!=='done'):null;
  if(a){Object.keys(fields||{}).forEach(k=>{if(fields[k])a[k]=fields[k];});return a;}
  a=Object.assign({id:TE.id(),title:'',owner:'',due:'',status:'open',source:source||{type:'manual',id:''},created:todayISO(ctx)},fields||{});
  t.actions.push(a);return a;
};
TE.openActions=p=>p.training.actions.filter(a=>a.status!=='done');

// ── Measures ──
// Each returns {state, label, value, num, den, detail, definition}. No blended composite.
TE.measureDefs={
  coverage:'Share of applicable readiness criteria that have been assessed (any status recorded). Says nothing about whether the criteria are met.',
  input:'Share of required upstream dependencies that are Satisfied or covered by an accepted exception. Blocked and partial inputs are listed.',
  material:'Share of required learning deliverables that are Validated, Approved or Released and not flagged for review.',
  delivery:'Whether end-user delivery can start: Ready, Conditional, Blocked, Insufficient Evidence or Not Assessed. A critical unmet condition always sets Blocked.',
  ability:'Share of learner groups with recorded results that meet the performance threshold. Only groups with results count.',
  adoption:'Measures with post-launch observations at or beyond their target. Measures without observations are reported, not counted.',
  evidence:'Evidence behind resolved inputs, validated scenarios and completed deliverables: verified, provisional, stale or missing.'
};
function pct(n,d){return d?Math.round(n/d*100):null;}
TE.measures=function(p,ctx){
  const t=p.training;const st=t.settings||TE.DEFAULT_SETTINGS;const out={};
  // Coverage from the gate criteria that apply.
  const gs=p.gateState||{};const keys=[];
  TE.CHECKPOINTS.forEach(c=>c.legacy.forEach(k=>keys.push(k)));
  const applicable=keys.filter(k=>gs[k]!=='na');const assessed=applicable.filter(k=>gs[k]);
  out.coverage={key:'coverage',label:'Assessment coverage',num:assessed.length,den:applicable.length,value:pct(assessed.length,applicable.length),
    state:applicable.length?(assessed.length?'assessed':'not_assessed'):'not_assessed',detail:assessed.length+' of '+applicable.length+' criteria assessed'};
  // Input readiness.
  const deps=t.dependencies;const res=deps.filter(isResolved);const blocked=deps.filter(d=>d.status==='blocked');
  out.input={key:'input',label:'Input readiness',num:res.length,den:deps.length,value:pct(res.length,deps.length),
    state:deps.length?(blocked.some(d=>d.critical)?'blocked':res.length===deps.length?(deps.some(d=>d.status==='exception')?'conditional':'ready'):'conditional'):'not_assessed',
    detail:deps.length?res.length+' of '+deps.length+' inputs resolved'+(blocked.length?' · '+blocked.length+' blocked':''):'No upstream dependencies recorded',blocked};
  // Material readiness.
  const req=t.deliverables.filter(d=>d.required!==false);
  const done=req.filter(d=>(TE.DELIV_STATES[d.state]||{}).done&&!d.revisionFlag);
  const critOpen=req.filter(d=>d.critical&&!done.includes(d));
  out.material={key:'material',label:'Material readiness',num:done.length,den:req.length,value:pct(done.length,req.length),
    state:req.length?(done.length===req.length?'ready':critOpen.length?'conditional':'conditional'):'not_assessed',
    detail:req.length?done.length+' of '+req.length+' deliverables validated or approved'+(critOpen.length?' · '+critOpen.length+' critical outstanding':''):'No learning deliverables recorded',critOpen};
  out.delivery=TE.deliveryReadiness(p,ctx);
  // Learner ability.
  const groups=arr(p.stakeholders).filter(sh=>sh&&sh.training&&sh.training.pass!==undefined&&sh.training.pass!==null&&sh.training.pass!==''&&!isNaN(+sh.training.pass));
  const meet=groups.filter(sh=>+sh.training.pass>=st.abilityThreshold);
  const ab=p.adkarRated&&p.adkarRated.includes('Ab')?+(p.adkarScores||{}).Ab:null;
  out.ability={key:'ability',label:'Learner ability',num:meet.length,den:groups.length,value:pct(meet.length,groups.length),
    state:groups.length?(meet.length===groups.length?'ready':'conditional'):'not_assessed',
    detail:groups.length?meet.length+' of '+groups.length+' groups at or above '+st.abilityThreshold+'% on assessment':'No learner assessment results recorded',
    adkarAbility:ab,abilityLow:ab!==null&&ab<=st.abilityLowDim};
  if(out.ability.abilityLow&&out.ability.state==='ready')out.ability.state='conditional';
  // Adoption outcomes.
  const ms=t.outcomes.measures;const obsBy={};
  t.outcomes.observations.forEach(o=>{(obsBy[o.measureId]=obsBy[o.measureId]||[]).push(o);});
  let onTarget=0,observed=0;
  ms.forEach(m=>{const o=(obsBy[m.id]||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).pop();if(!o)return;observed++;
    if(m.target!==''&&m.target!==null&&m.target!==undefined&&!isNaN(+m.target)){const ok=m.direction==='down'?+o.value<=+m.target:+o.value>=+m.target;if(ok)onTarget++;}});
  out.adoption={key:'adoption',label:'Adoption outcomes',num:onTarget,den:observed,value:pct(onTarget,observed),
    state:!ms.length?'not_assessed':!observed?'not_observed':onTarget===observed?'ready':'conditional',
    detail:!ms.length?'No outcome measures defined':!observed?ms.length+' measure'+(ms.length===1?'':'s')+' defined, no observations yet':onTarget+' of '+observed+' observed measures at target'};
  out.evidence=TE.evidenceQuality(p,ctx);
  Object.keys(out).forEach(k=>{out[k].definition=TE.measureDefs[k];});
  return out;
};
TE.evidenceQuality=function(p,ctx){
  const t=p.training;const st=t.settings||TE.DEFAULT_SETTINGS;const today=todayISO(ctx);
  const c={verified:0,provisional:0,stale:0,missing:0};const items=[];
  function grade(ref,verified,date,label){
    let g;if(!ref)g='missing';else if(date&&daysBetween(date,today)>st.staleDays)g='stale';else g=verified?'verified':'provisional';
    c[g]++;items.push({label,grade:g});
  }
  t.dependencies.filter(isResolved).forEach(d=>grade((d.evidence||{}).ref||(d.status==='exception'&&d.exception&&d.exception.rationale),(d.evidence||{}).verified||d.status==='exception',(d.evidence||{}).date||d.updated,'Input: '+d.title));
  t.scenarios.filter(s=>s.env&&s.env.status==='pass').forEach(s=>grade(s.env.environment&&s.env.date?s.env.environment:'',!!s.env.by,s.env.date,'Scenario: '+s.title));
  t.deliverables.filter(d=>(TE.DELIV_STATES[d.state]||{}).done).forEach(d=>{const r=arr(d.reviews).slice().pop();grade(r?(r.reviewer||'review'):'',!!(r&&r.reviewer),r&&r.date,'Deliverable: '+d.title);});
  const n=items.length;
  return{key:'evidence',label:'Evidence quality',counts:c,items,num:c.verified,den:n,value:pct(c.verified,n),
    state:!n?'not_assessed':c.missing?'insufficient':c.stale||c.provisional?'conditional':'ready',
    detail:n?c.verified+' verified · '+c.provisional+' provisional · '+c.stale+' stale · '+c.missing+' missing':'Nothing resolved or validated yet'};
};
// Delivery readiness. Critical unmet conditions override every average.
TE.deliveryReadiness=function(p,ctx){
  const t=p.training;const reasons=[];const conditions=[];
  const req=t.deliverables.filter(d=>d.required!==false);
  if(!req.length&&!t.dependencies.length&&!t.scenarios.length)
    return{key:'delivery',label:'Delivery readiness',state:'not_assessed',reasons:[{text:'No learning deliverables, scenarios or dependencies are recorded for this project.'}],conditions,detail:'Not assessed'};
  // Critical blockers.
  t.dependencies.filter(d=>d.critical&&!isResolved(d)&&!(d.permits&&d.permits.delivery)).forEach(d=>reasons.push({critical:true,kind:'dependency',id:d.id,text:'Critical input '+TE.depStatusLabel(d.status).toLowerCase()+': '+d.title+(d.consequence?' — '+d.consequence:'')}));
  t.scenarios.filter(s=>s.critical&&!TE.scenarioValidated(s)).forEach(s=>reasons.push({critical:true,kind:'scenario',id:s.id,text:'Critical scenario not validated in the training environment: '+s.title+(s.needsRevalidation?' (needs revalidation: '+s.needsRevalidation.reason+')':s.env&&s.env.status==='fail'?' (fails: '+(s.env.note||'see scenario')+')':'')}));
  req.filter(d=>d.critical&&!((TE.DELIV_STATES[d.state]||{}).done&&!d.revisionFlag)).forEach(d=>reasons.push({critical:true,kind:'deliverable',id:d.id,text:'Critical deliverable not ready: '+d.title+' ('+TE.delivStateLabel(d.state)+(d.revisionFlag?', review flagged':'')+')'}));
  // Per-deliverable delivery gating (non-critical blockers become conditions).
  req.forEach(d=>{const a=TE.activityStatus(p,d).delivery;
    if(!a.ok&&!d.critical)a.blockers.forEach(b=>conditions.push({kind:'deliverable',id:d.id,text:d.title+': '+b.text}));
    a.conditions.forEach(c=>conditions.push(c.dep?{kind:'exception',id:c.dep.id,text:d.title+': '+c.text}:{kind:'checkpoint',id:(c.rule&&c.rule.ref)||'',text:c.text}));});
  t.dependencies.filter(d=>!d.critical&&!isResolved(d)&&!(d.permits&&d.permits.delivery)).forEach(d=>conditions.push({kind:'dependency',id:d.id,text:'Input '+TE.depStatusLabel(d.status).toLowerCase()+': '+d.title}));
  let state;
  if(reasons.length)state='blocked';
  else{
    const ev=TE.evidenceQuality(p,ctx);
    if(ev.counts.missing)state='insufficient';
    else if(conditions.length||req.some(d=>!((TE.DELIV_STATES[d.state]||{}).done)))state='conditional';
    else state='ready';
    if(state==='insufficient')reasons.push({kind:'evidence',text:ev.counts.missing+' resolved item'+(ev.counts.missing===1?' has':'s have')+' no evidence reference.'});
  }
  const uniqConds=[];const seen=new Set();conditions.forEach(c=>{if(!seen.has(c.text)){seen.add(c.text);uniqConds.push(c);}});
  return{key:'delivery',label:'Delivery readiness',state,reasons,conditions:uniqConds,detail:TE.READY_STATES[state].label+(reasons.length&&state==='blocked'?' — '+reasons.length+' critical condition'+(reasons.length===1?'':'s')+' unmet':'')};
};
// Material development readiness (separate from delivery).
TE.developmentReadiness=function(p){
  const t=p.training;const req=t.deliverables.filter(d=>d.required!==false&&!(TE.DELIV_STATES[d.state]||{}).done);
  if(!t.deliverables.length)return{state:'not_assessed',label:'Not Assessed',proceed:[],blocked:[]};
  const proceed=[],blocked=[];
  req.forEach(d=>{const a=TE.activityStatus(p,d);
    if(a.scenarioDev.ok)proceed.push({d,mode:'scenario',conditional:a.scenarioDev.conditional});
    else if(a.provisional.ok)proceed.push({d,mode:'provisional',why:a.scenarioDev.blockers.map(b=>b.text)});
    else blocked.push({d,why:a.provisional.blockers.map(b=>b.text)});
  });
  const state=!req.length?'ready':!proceed.length?'blocked':blocked.length||proceed.some(x=>x.mode==='provisional'||x.conditional)?'conditional':'ready';
  const labels={ready:'Proceed',conditional:'Proceed with conditions',blocked:'Blocked',not_assessed:'Not Assessed'};
  return{state,label:labels[state],proceed,blocked};
};

// ── Checkpoints ──
TE.checkpointState=function(p,key){
  const cp=TE.CHECKPOINTS.find(c=>c.key===key);const gs=p.gateState||{};
  const rec=(p.training.checkpoints||{})[key]||{};
  const items=cp.legacy.map(k=>({key:k,status:gs[k]||''}));
  const applicable=items.filter(i=>i.status!=='na');
  const assessed=applicable.filter(i=>i.status);
  const red=applicable.filter(i=>i.status==='red'),amber=applicable.filter(i=>i.status==='yellow');
  let state;
  if(!assessed.length&&!rec.decision)state='not_assessed';
  else if(red.length)state='blocked';
  else if(assessed.length<applicable.length)state='insufficient';
  else if(amber.length||rec.decision==='conditional'||rec.exceptions)state='conditional';
  else state='ready';
  return{cp,rec,items,applicable:applicable.length,assessed:assessed.length,red:red.length,amber:amber.length,state};
};

// ── Decision brief ──
TE.recommendation=function(p,ctx){
  const del=TE.deliveryReadiness(p,ctx);
  const map={not_assessed:'Not assessed',insufficient:'Not ready: evidence incomplete',ready:'Ready for delivery',conditional:'Ready with conditions',blocked:'Not ready for delivery'};
  return{state:del.state,label:map[del.state],del};
};
TE.brief=function(p,ctx){
  const t=p.training;const del=TE.deliveryReadiness(p,ctx);const dev=TE.developmentReadiness(p);
  const blockedItems=del.reasons.filter(r=>r.critical);
  const affected={audiences:new Set(),scenarios:new Set(),deliverables:new Set()};
  t.dependencies.filter(d=>!isResolved(d)).forEach(d=>{const a=TE.depAffects(p,d);a.audienceIds.forEach(x=>affected.audiences.add(x));a.scenarioIds.forEach(x=>affected.scenarios.add(x));a.deliverableIds.forEach(x=>affected.deliverables.add(x));});
  t.scenarios.filter(s=>s.critical&&!TE.scenarioValidated(s)).forEach(s=>{affected.scenarios.add(String(s.id));t.deliverables.filter(d=>arr(d.scenarioIds).map(String).includes(String(s.id))).forEach(d=>{affected.deliverables.add(String(d.id));arr(d.audienceIds).forEach(a=>affected.audiences.add(String(a)));});});
  const since=t.lastReview||'';
  const changes=t.history.filter(h=>!since||String(h.date)>since).slice(0,12);
  const actions=TE.openActions(p).slice().sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999')));
  const rec=TE.recommendation(p,ctx);
  let decision;
  if(del.state==='blocked')decision='Resolve the critical conditions above or revise the delivery plan.';
  else if(del.state==='conditional')decision='Accept the listed conditions for delivery, or hold until they clear.';
  else if(del.state==='insufficient')decision='Supply the missing evidence before a recommendation is made.';
  else if(del.state==='ready')decision='Confirm Training’s readiness input to release governance.';
  else decision='Record deliverables, scenarios and dependencies to assess readiness.';
  const lastEv=[].concat(t.dependencies.map(d=>(d.evidence||{}).date||''),t.scenarios.map(s=>(s.env||{}).date||''),t.deliverables.map(d=>{const r=arr(d.reviews).slice().pop();return r?r.date:'';})).filter(Boolean).sort().pop()||'';
  return{rec,del,dev,canProceed:dev.proceed,devBlocked:dev.blocked,blocked:blockedItems,conditions:del.conditions,
    affected:{audiences:Array.from(affected.audiences),scenarios:Array.from(affected.scenarios),deliverables:Array.from(affected.deliverables)},
    changes,since,actions,decision,authority:(t.checkpoints.governance||{}).authority||'Release governance (Go/No-Go)',lastEvidence:lastEv,lastReview:t.lastReview||''};
};

// ── Heat map summary (derived; never a place to enter scores) ──
TE.heatCell=function(p,gi,wsName){
  const deps=p.training.dependencies.filter(d=>(d.phase===gi||d.phase===String(gi))&&String(d.workstream)===String(wsName));
  if(!deps.length)return{state:'none',deps};
  const worst=deps.reduce((m,d)=>((TE.DEP_STATUS[d.status]||{}).rank||0)>((TE.DEP_STATUS[m.status]||{}).rank||0)?d:m,deps[0]);
  return{state:worst.status,deps};
};

// ── Suggestions from data already entered elsewhere ──
// Drafts only: nothing becomes a Training record until a person reviews and saves it.
// Sources: open CRAID entries of type Dependency, and Impact Assessment groups.
TE.CRAID_CLOSED=/^(closed|mitigated|validated|invalidated|resolved|done)$/i;
TE.suggestions=function(p,ctx){
  ctx=ctx||{};const t=p.training;const done=(t.suggest&&t.suggest.done)||{};const out={dependencies:[],workflows:[],scenarios:[]};
  const has=(list,key)=>arr(list).some(r=>r.suggestKey===key);
  arr(p.craid).forEach(c=>{
    if(String(c.type||'').toLowerCase()!=='dependency'||TE.CRAID_CLOSED.test(String(c.status||'').trim()))return;
    const key='craid:'+c.id;if(done[key]||has(t.dependencies,key)||t.dependencies.some(d=>String(d.craidId)===String(c.id)))return;
    out.dependencies.push({key,source:'CRAID log',label:c.title||c.description||'Untitled dependency',
      note:[c.severity?'Severity '+c.severity:'',c.dependsOn?'Depends on '+c.dependsOn:'',c.dueDate?'Due '+c.dueDate:''].filter(Boolean).join(' · '),
      preset:{title:c.title||'',owner:c.owner||'',requiredBy:c.dueDate||'',consequence:c.description||'',craidId:c.id,source:'craid',status:'awaiting',suggestKey:key}});
  });
  const groups=(p.impactAssessment&&arr(p.impactAssessment.groups))||[];
  groups.forEach((g,i)=>{
    if(!g||(!g.futureState&&!g.currentState))return;
    const name=String(g.name||'Group '+(i+1));const key='impact:'+name.toLowerCase();
    if(done[key]||has(t.workflows,key)||t.workflows.some(w=>String(w.impactGroup||'').toLowerCase()===name.toLowerCase()))return;
    const sh=arr(p.stakeholders).find(s=>String(s.name||'').trim().toLowerCase()===name.trim().toLowerCase());
    out.workflows.push({key,source:'Impact Assessment',label:name,note:[g.level?g.level+' impact':'',arr(g.changeTypes).join(', ')].filter(Boolean).join(' · '),
      preset:{name:name+': changed way of working',change:[g.currentState?'Today: '+g.currentState:'',g.futureState?'After: '+g.futureState:''].filter(Boolean).join(' '),
        audienceIds:sh?[sh.id]:[],impactGroup:name,suggestKey:key}});
  });
  // Jira import: OCM-tagged items and training-environment defects.
  const j=p.jira;
  if(j&&Array.isArray(j.items)){
    const src='Jira import';
    j.items.forEach(it=>{
      if(!it||!it.key)return;const summary=it.summary||it.key;
      const openDefects=arr(it.defects).filter(d=>d.open===true);
      // Passed QA: a candidate training scenario, with its test evidence.
      if(it.qaPassed){const key='jira-sc:'+it.key;
        if(!done[key]&&!has(t.scenarios,key)&&!t.scenarios.some(s=>s.jiraKey===it.key))
          out.scenarios.push({key,source:src,label:summary,note:[it.key,it.uatPassed?'passed QA and UAT':'passed QA',openDefects.length?openDefects.length+' open defect'+(openDefects.length===1?'':'s'):''].filter(Boolean).join(' · '),
            preset:{title:summary,qaEvidence:it.key+' passed QA ('+(it.status||'status not given')+')',uatEvidence:it.uatPassed?it.key+' passed UAT':'',
              limitations:openDefects.length?'Open defects: '+openDefects.map(d=>d.key+(d.summary?' '+d.summary:'')).join('; '):'',jiraKey:it.key,suggestKey:key}});}
      // Not past UAT: Training depends on UAT for validated, scenario-based materials.
      const dep=t.dependencies.find(d=>d.jiraKey===it.key&&d.jiraKind!=='defect');
      if(!it.uatPassed){const key='jira-dep:'+it.key;
        if(!done[key]&&!dep&&!has(t.dependencies,key))
          out.dependencies.push({key,source:src,label:summary+' passes UAT',note:[it.key,it.qaPassed?'passed QA, in UAT':'in build or QA',ctx.uatComplete?'UAT due '+ctx.uatComplete:''].filter(Boolean).join(' · '),
            preset:{title:summary+' passes UAT',workstream:'UAT',requiredBy:ctx.uatComplete||'',status:it.qaPassed?'partial':'awaiting',
              acceptance:it.key+' shows UAT passed in Jira',evidence:{ref:it.key,version:'',environment:'',verified:false,date:''},
              consequence:'Materials for this change can be drafted but not validated until it passes UAT.',
              permits:{provisional:true,scenarioDev:!!it.qaPassed,validation:false,facilitator:false,delivery:false},jiraKey:it.key,jiraKind:'uat',source:'jira',suggestKey:key}});}
      // A later import shows progress on a tracked item: prompt a review, never change the record.
      else if(dep&&!isResolved(dep)){const key='jira-upd:'+it.key+':uat';
        if(!done[key])out.dependencies.push({key,source:src,label:it.key+' now shows UAT passed',note:'Review "'+dep.title+'" and record the evidence if you agree',review:dep.id,preset:{}});}
    });
    arr(j.trainDefectList).filter(d=>d&&d.open!==false).forEach(d=>{
      const key='jira-def:'+d.key;
      const tracked=t.dependencies.find(x=>x.jiraKey===d.key&&x.jiraKind==='defect');
      if(!tracked){if(done[key]||has(t.dependencies,key))return;
        const linkedSc=t.scenarios.filter(s=>arr(d.links).includes(s.jiraKey)).map(s=>s.id);
        out.dependencies.push({key,source:src,label:'Training environment defect '+d.key+(d.summary?': '+d.summary:''),note:[d.status||'',linkedSc.length?linkedSc.length+' linked scenario'+(linkedSc.length===1?'':'s'):'',arr(d.links).length?'linked to '+arr(d.links).join(', '):''].filter(Boolean).join(' · '),
          preset:{title:'Training environment defect '+d.key+' resolved'+(d.summary?': '+d.summary:''),workstream:'Environment support',status:'blocked',scenarioIds:linkedSc,
            evidence:{ref:d.key,version:'',environment:'',verified:false,date:''},consequence:'Linked scenarios may not run in the training environment until this is fixed.',
            permits:{provisional:true,scenarioDev:true,validation:false,facilitator:false,delivery:false},jiraKey:d.key,jiraKind:'defect',source:'jira',suggestKey:key}});}
    });
    // Defects tracked earlier that a later import no longer lists as open.
    t.dependencies.filter(x=>x.jiraKind==='defect'&&!isResolved(x)).forEach(x=>{
      const d=arr(j.trainDefectList).find(y=>y.key===x.jiraKey);
      if(d&&d.open===false){const key='jira-upd:'+x.jiraKey+':closed';if(!done[key])out.dependencies.push({key,source:src,label:x.jiraKey+' is closed in Jira',note:'Review "'+x.title+'" and record the evidence if you agree',review:x.id,preset:{}});}
    });
  }
  return out;
};
TE.markSuggestion=function(p,key,state){const t=p.training;if(!t.suggest||typeof t.suggest!=='object')t.suggest={done:{}};if(!t.suggest.done)t.suggest.done={};
  if(state)t.suggest.done[key]=state;else delete t.suggest.done[key];};

// ── Milestones (dependency-based) ──
// Per deliverable: planned/actual dates and whether each activity may start now.
TE.milestones=function(p,ctx){
  const t=p.training;const rows=[];
  t.deliverables.forEach(d=>{const a=TE.activityStatus(p,d);
    rows.push({d,acts:TE.GATED_ACTIVITIES.map(k=>({key:k,label:(TE.ACTIVITIES.find(x=>x.key===k)||{}).label,ok:a[k].ok,conditional:a[k].conditional,blockers:a[k].blockers})),
      planned:d.planned||{},actual:d.actual||{},late:!!(d.planned&&d.planned.due&&!(TE.DELIV_STATES[d.state]||{}).done&&todayISO(ctx)>d.planned.due)});});
  // Dependencies whose required-by date is after a linked deliverable's planned start put that start at risk.
  const risks=[];
  t.dependencies.filter(dep=>!isResolved(dep)&&dep.requiredBy).forEach(dep=>{
    TE.depAffects(p,dep).deliverableIds.forEach(id=>{const d=byId(t.deliverables,id);if(!d)return;
      const ref=(d.planned||{}).delivery||(d.planned||{}).due;
      if(ref&&dep.requiredBy>ref)risks.push({dep,d,text:dep.title+' is required by '+dep.requiredBy+', after '+d.title+' is planned ('+ref+'). Proposed schedule change; practitioner review required.'});
      else if(todayISO(ctx)>dep.requiredBy)risks.push({dep,d,text:dep.title+' was required by '+dep.requiredBy+' and is still '+TE.depStatusLabel(dep.status).toLowerCase()+'. Review the plan for '+d.title+'.'});
    });});
  return{rows,risks};
};

// ── Environments ──
// Each release keeps its environment list (r.trEnv.list) and the events recorded against it
// (r.trEnv.events). Organization specifics (names such as TRN1-TRN5, maintenance windows,
// team names) are settings, not code. Defaults are generic.
TE.ENV_TYPES={qa:'QA',uat:'UAT',preprod:'Pre-production',training:'Training',lms:'LMS',prod:'Production',other:'Other'};
TE.ENV_EVENTS={deploy:'Code deployed',refresh:'Refreshed',golden:'Golden copy updated',logins:'Training logins reset',other:'Other change'};
TE.DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
TE.envKey=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]/g,'');
TE.newEnvironment=function(o){return Object.assign({id:TE.id(),name:'',type:'training',purpose:'',pii:false,logins:'',maintDays:[],maintStart:'',maintEnd:'',noticeDays:''},o||{});};
TE.defaultEnvironments=function(){return[
  TE.newEnvironment({name:'QA',type:'qa',purpose:'Quality assurance testing'}),
  TE.newEnvironment({name:'UAT',type:'uat',purpose:'End-to-end and subject-matter-expert testing'}),
  TE.newEnvironment({name:'Pre-production',type:'preprod',purpose:'Final validation before release'}),
  TE.newEnvironment({name:'Training',type:'training',purpose:'Learner practice and facilitator rehearsal'}),
  TE.newEnvironment({name:'Production',type:'prod',purpose:'Live operations',pii:true})];};
TE.envOf=(list,name)=>arr(list).find(e=>TE.envKey(e.name)===TE.envKey(name))||null;
TE.isPracticeEnv=e=>!!e&&(e.type==='training'||e.type==='lms');
// A deployment, refresh or data reset can break a scenario that ran before it. Scenarios that passed in
// that environment on or before the event date are marked for a re-run (their run history is kept).
TE.recordEnvEvent=function(projects,ev,ctx){
  const k=TE.envKey(ev.envName);const date=ev.date||todayISO(ctx);const label=(TE.ENV_EVENTS[ev.kind]||'Changed').toLowerCase();
  const res={scenarios:0,projects:0};
  arr(projects).forEach(p=>{
    if(!p||!p.training)return;let n=0;
    p.training.scenarios.forEach(s=>{
      if(!s.env||s.env.status!=='pass'||TE.envKey(s.env.environment)!==k)return;
      if(s.env.date&&s.env.date>date)return;
      s.needsRevalidation={reason:ev.envName+' '+label+' on '+date+(ev.ref?' ('+ev.ref+')':'')+'. Re-run before relying on this scenario.',date,sourceType:'environment'};n++;
    });
    TE.log(p,{type:'environment',text:ev.envName+': '+(TE.ENV_EVENTS[ev.kind]||'Changed')+(ev.ref?' ('+ev.ref+')':'')+(n?'. '+n+' scenario'+(n===1?'':'s')+' need'+(n===1?'s':'')+' a re-run':''),flagged:n},Object.assign({},ctx,{today:date}));
    if(n){res.scenarios+=n;res.projects++;}
  });
  return res;
};
// Five linked dependencies that make a training environment ready, with suggested lead times.
TE.ENV_CHAIN=[
  {step:'Deployment requested',ws:'Environment team',lead:10,detail:'Request submitted to infrastructure (with the release and the environment named)'},
  {step:'Code deployed and smoke-tested',ws:'Infrastructure',lead:7,detail:'Environment refreshed from the golden copy, code deployed, login and integrations checked'},
  {step:'Environment validated and regression-tested',ws:'Environment team',lead:5,detail:'Defect fixes and new functionality confirmed in the environment'},
  {step:'Training data staged',ws:'Environment and training teams',lead:3,detail:'Base cases tested, staging sheet prepared, cases created'},
  {step:'Training cases checked',ws:'Environment team',lead:1,detail:'Quality check of the created cases'}];
TE.envChain=function(envName,neededBy,scenarioIds){
  const minus=(d,n)=>{if(!d)return'';const x=new Date(d+'T12:00:00');x.setDate(x.getDate()-n);return x.toISOString().slice(0,10);};
  return TE.ENV_CHAIN.map((c,i)=>TE.newDependency({title:envName+': '+c.step+' ('+(i+1)+' of '+TE.ENV_CHAIN.length+')',workstream:c.ws,acceptance:c.detail,requiredBy:minus(neededBy,c.lead),
    critical:true,scenarioIds:arr(scenarioIds).slice(),status:'awaiting',source:'env-chain',envName,phase:2,
    consequence:'Scenarios that use '+envName+' cannot be validated until this step is done.',
    permits:{provisional:true,scenarioDev:true,validation:false,facilitator:false,delivery:false}}));
};
// Plain warnings about environment use. Advisory only; nothing is blocked by them.
TE.envWarnings=function(p,list){
  const t=p.training;const out=[];
  t.scenarios.forEach(s=>{
    const e=s.env&&s.env.environment?TE.envOf(list,s.env.environment):null;
    if(!e)return;
    if(e.pii)out.push({kind:'pii',id:s.id,text:'"'+s.title+'" is set to '+e.name+', which holds personal data. Learner practice should use a training environment.'});
    if(s.env.status==='pass'&&!TE.isPracticeEnv(e))out.push({kind:'not-training',id:s.id,text:'"'+s.title+'" was run in '+e.name+' ('+(TE.ENV_TYPES[e.type]||e.type)+'). A pass there does not show it works where learners practise.'});
  });
  t.deliverables.forEach(d=>{
    const dt=d.planned&&d.planned.delivery;if(!dt||d.state==='released')return;
    const day=new Date(dt+'T12:00:00').getDay();
    const envs=[...new Set(arr(d.scenarioIds).map(id=>byId(t.scenarios,id)).filter(s=>s&&s.env&&s.env.environment).map(s=>s.env.environment))].map(n=>TE.envOf(list,n)).filter(Boolean);
    envs.forEach(e=>{if(arr(e.maintDays).map(Number).includes(day))out.push({kind:'maintenance',id:d.id,text:'"'+d.title+'" is planned for '+TE.DAYS[day]+' '+dt+', a maintenance day for '+e.name+(e.maintStart?' ('+e.maintStart+(e.maintEnd?'–'+e.maintEnd:'')+')':'')+'. Confirm the session avoids the window.'});});
  });
  return out;
};

if(typeof module!=='undefined'&&module.exports)module.exports=TE;
root.TE=TE;
})(typeof window!=='undefined'?window:globalThis);
