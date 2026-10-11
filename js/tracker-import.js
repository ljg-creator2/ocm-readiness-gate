'use strict';
// ════════════════════════════════════════════════════════
// DELIVERY TRACKER IMPORT
// Reads a Training lead's delivery tracker workbook and plans updates to AdoptIQ.
// Pure functions: workbook rows in, a reviewable plan out, applied only on request.
// Rules (agreed with the client):
//  - The tracker owns its own fields: dates, owners, status, sign-offs. AdoptIQ owns evidence
//    (dependencies, scenario runs, environment events); the import never touches those.
//  - Nothing is deleted. Projects with release "TBD" go to a "Release TBD" holding area.
//  - Tabs and columns are found by their headings; anything unreadable is reported, not guessed.
// Sheets are passed as {sheetName: rows[][]} (first row = row 1).
// ════════════════════════════════════════════════════════
(function(root){
const TI={};
const norm=s=>String(s==null?'':s).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
TI.norm=norm;
const txt=v=>v==null?'':String(v).replace(/\s+/g,' ').trim();
TI.HOLDING='Release TBD';

// Dates arrive as Date objects, Excel serial numbers or text. Returns YYYY-MM-DD or ''.
TI.normDate=function(v){
  if(v==null||v==='')return'';
  if(v instanceof Date&&!isNaN(v))return new Date(Date.UTC(v.getFullYear(),v.getMonth(),v.getDate())).toISOString().slice(0,10);
  if(typeof v==='number'&&v>20000&&v<80000){const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*864e5);return d.toISOString().slice(0,10);}
  const s=String(v).trim();if(!s||/^(tbd|n\/?a|—|-)$/i.test(s))return'';
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];
  m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);if(m){const y=m[3].length===2?'20'+m[3]:m[3];return y+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0');}
  return'';
};
TI.size=function(v){const s=norm(v);if(!s)return'';
  if(/^(xs|xsmall|extrasmall)/.test(s))return'XS';if(/^(xl|xlarge|extralarge)/.test(s))return'XL';if(/^(xxl)/.test(s))return'XXL';
  if(/^s(mall)?/.test(s))return'S';if(/^m(edium)?/.test(s))return'M';if(/^l(arge)?/.test(s))return'L';return'';};
const PROJ_STATUS={notstarted:'Not Started',inprogress:'In Progress',complete:'Complete',completed:'Complete',done:'Complete',onhold:'On Hold',blocked:'Blocked'};
TI.projectStatus=v=>PROJ_STATUS[norm(v)]||'';
// Tracker deliverable status → AdoptIQ learning-deliverable state. N/A rows are skipped.
const DELIV_STATE={planning:'not_started',notstarted:'not_started',inprogress:'draft',draftsubmitted:'in_review',inreview:'in_review',revision:'revision_required',complete:'approved',completed:'approved',blocked:'awaiting_input'};
TI.delivState=v=>DELIV_STATE[norm(v)]||'';
TI.people=v=>txt(v).split(/\s*(?:\/|;|,|&|\band\b)\s*/i).map(s=>s.trim()).filter(s=>s&&!/^\(?assign\)?$/i.test(s));
TI.delivType=function(courseLength,title){const s=norm(courseLength+' '+title);
  if(/jobaid/.test(s))return'job_aid';if(/micro|elearn|module|course|fullday|halfday|day/.test(s))return'course';if(/demo/.test(s))return'demonstration';if(/sim/.test(s))return'simulation';return'other';};

// Find the header row: the first row (within the top 12) holding every required heading.
function findHeader(rows,required){
  for(let i=0;i<Math.min(rows.length,12);i++){const r=(rows[i]||[]).map(c=>norm(c));if(required.every(q=>r.some(c=>c===q||c.startsWith(q))))return i;}
  return -1;
}
function colMap(row,spec){const r=(row||[]).map(c=>norm(c));const out={};Object.keys(spec).forEach(k=>{const alts=[].concat(spec[k]);
  const i=r.findIndex(c=>alts.some(a=>c===a));out[k]=i>=0?i:r.findIndex(c=>alts.some(a=>c.startsWith(a)));});return out;}
const get=(row,i)=>i>=0?row[i]:undefined;

TI.read=function(sheets){
  const names=Object.keys(sheets||{});const warnings=[];const out={projects:[],deliverables:[],gates:{},goLive:{},warnings,sheetsRead:[]};
  const sheet=re=>names.find(n=>re.test(n.trim()));
  // 1. Projects (the spine)
  const pName=sheet(/^projects$/i);
  if(!pName)warnings.push('No "Projects" tab found, so no projects were read.');
  else{
    const rows=sheets[pName];const h=findHeader(rows,['project','release']);
    if(h<0)warnings.push('The "Projects" tab has no heading row with Project and Release.');
    else{
      const c=colMap(rows[h],{project:'project',release:'release',quarter:'quarter',type:'type',training:'training',size:'size',effort:'effortwks',poc:'poc',team:'team',pm:'pm',ba:'ba',impl:'implpoc',status:'status',pct:'complete',chg:'changeplan',golive:['golive','golivedate']});
      ['size','poc','status'].forEach(k=>{if(c[k]<0)warnings.push('"Projects" tab: no '+k.toUpperCase()+' column found.');});
      for(let i=h+1;i<rows.length;i++){const r=rows[i]||[];const name=txt(get(r,c.project));if(!name)continue;
        // The go-live column has no heading in some versions; take a trailing date if present.
        let gl=TI.normDate(get(r,c.golive));if(!gl){for(let j=r.length-1;j>h&&j>=0;j--){if(j===c.chg)continue;const d=TI.normDate(r[j]);if(d&&j>Math.max(c.status,c.pct)){gl=d;break;}}}
        out.projects.push({name,release:txt(get(r,c.release)),quarter:txt(get(r,c.quarter)),type:txt(get(r,c.type)),training:txt(get(r,c.training)),size:TI.size(get(r,c.size)),
          effortWeeks:txt(get(r,c.effort)),poc:TI.people(get(r,c.poc))[0]||'',team:TI.people(get(r,c.team)),pm:TI.people(get(r,c.pm)),ba:TI.people(get(r,c.ba)),impl:TI.people(get(r,c.impl)),
          status:TI.projectStatus(get(r,c.status)),statusText:txt(get(r,c.status)),changePlan:TI.normDate(get(r,c.chg)),golive:gl});}
      out.sheetsRead.push(pName);
    }
  }
  // 2. Per-project tabs: row 1 "<name> | Go-Live: | <date>", a "Deliverable | Planned Due | Status | Reviewed?" table.
  names.forEach(n=>{
    const rows=sheets[n];if(!rows||!rows.length)return;
    const r0=(rows[0]||[]).map(txt);const gi=r0.findIndex(x=>/^go-?live:?$/i.test(x));if(gi<1)return;
    const h=findHeader(rows,['deliverable','planneddue','status']);if(h<0)return;
    const c=colMap(rows[h],{deliv:'deliverable',due:'planneddue',status:'status',reviewed:'reviewed',notes:'notes',gate:'gate',signed:'signed'});
    const proj=r0[0]||n;const pi=r0.findIndex(x=>/%\s*complete/i.test(x));
    const auto=pi>=0?Number((rows[0]||[])[pi+1]):NaN;
    let override=NaN;(rows.slice(0,h)).forEach(row=>{const k=(row||[]).findIndex(x=>/manual override/i.test(txt(x)));if(k>=0&&row[k+1]!==''&&row[k+1]!=null)override=Number(row[k+1]);});
    const items=[];
    for(let i=h+1;i<rows.length;i++){const r=rows[i]||[];const name=txt(get(r,c.deliv));if(!name)continue;
      items.push({name,due:TI.normDate(get(r,c.due)),status:txt(get(r,c.status)),reviewed:/^y(es)?$/i.test(txt(get(r,c.reviewed))),gate:Number(get(r,c.gate))===1,signed:Number(get(r,c.signed))===1,notes:txt(get(r,c.notes))});}
    const pct=!isNaN(override)?override:auto;
    out.gates[norm(proj)]={project:proj,sheet:n,golive:TI.normDate((rows[0]||[])[gi+1]),leadReviewPct:isNaN(pct)?null:Math.round(pct*(pct<=1?100:1)),items};
    out.sheetsRead.push(n);
  });
  // 3. Quarter tabs give go-live dates when the Projects tab lacks them.
  names.filter(n=>/\bq[1-4]\b/i.test(n)).forEach(n=>{const rows=sheets[n];const h=findHeader(rows,['project','release','golive']);if(h<0)return;
    const c=colMap(rows[h],{project:'project',golive:'golive'});
    for(let i=h+1;i<rows.length;i++){const r=rows[i]||[];const name=txt(get(r,c.project));const d=TI.normDate(get(r,c.golive));if(name&&d)out.goLive[norm(name)]=d;}});
  // 4. Delivery Tracker: one row per training deliverable.
  const dName=sheet(/^delivery tracker$/i);
  if(!dName)warnings.push('No "Delivery Tracker" tab found, so no learning deliverables were read.');
  else{
    const rows=sheets[dName];const h=findHeader(rows,['project','status','trainer']);
    if(h<0)warnings.push('The "Delivery Tracker" tab has no heading row with Project, Status and Trainer(s).');
    else{
      const c=colMap(rows[h],{project:'project',source:'source',golive:'golive',status:'status',size:'size',audience:'audience',course:'courselength',trainer:'trainer',impl:'implementationpoc',pm:'pm',func:'functionalpoc',
        jar:'jar',jad:'jad',uat:'uat',prelim:'prelimplan',final:'finalplan',outline:'outline',materials:'materials',approval:'myapproval',stakeholder:'stakeholderreview',revisions:'revisionsdone',t3:'t3done',ready:'readytodeliver',delivered:'deliverycomplete',notes:'notes'});
      for(let i=h+1;i<rows.length;i++){const r=rows[i]||[];const row=txt(get(r,c.project));if(!row)continue;const st=txt(get(r,c.status));
        if(/^n\/?a$/i.test(st))continue;
        const parts=row.split(/\s+[—–-]\s+/);
        const dates={};['jar','jad','uat','prelim','final','outline','materials','approval','stakeholder','revisions','t3','ready','delivered'].forEach(k=>{dates[k]=TI.normDate(get(r,c[k]));});
        out.deliverables.push({row,projectHint:parts[0],title:parts.length>1?parts.slice(1).join(' — '):row,status:st,state:TI.delivState(st),audience:txt(get(r,c.audience)),
          course:txt(get(r,c.course)),trainers:TI.people(get(r,c.trainer)),golive:TI.normDate(get(r,c.golive)),dates,notes:txt(get(r,c.notes))});}
      out.sheetsRead.push(dName);
    }
  }
  return out;
};

// ── Planning ──
// releases: AdoptIQ releases array. aliases: {normalized tracker project text: projectId} remembered from earlier imports.
TI.ROLE={poc:'ocm_train',pm:'pm',ba:'func',impl:'ocm_impl'};
TI.ROLE_LABEL={ocm_train:'OCM Training',pm:'Project Manager',func:'Functional',ocm_impl:'OCM Implementation'};
function findProject(releases,name){const k=norm(name);for(const r of releases)for(const p of (r.projects||[]))if(norm(p.name)===k)return{r,p};return null;}
TI.plan=function(parsed,releases,opts){
  opts=opts||{};const aliases=Object.assign({},opts.aliases||{});
  releases.forEach(r=>(r.projects||[]).forEach(p=>(((p.tracker||{}).aliases)||[]).forEach(a=>{aliases[a]=p.id;})));
  const plan={releases:[],projects:[],deliverables:[],unmatched:[],warnings:parsed.warnings.slice(),counts:{}};
  const relKey=id=>(!id||/^tbd$/i.test(id))?TI.HOLDING:id;
  const relByName=n=>releases.find(r=>norm(r.name)===norm(n));
  const seenRel={};
  parsed.projects.forEach(tp=>{
    const rk=relKey(tp.release);
    if(!seenRel[rk]){const ex=relByName(rk);seenRel[rk]={key:rk,name:rk,existing:ex||null,isNew:!ex,holding:rk===TI.HOLDING};plan.releases.push(seenRel[rk]);}
    const g=parsed.gates[norm(tp.name)];const golive=tp.golive||(g&&g.golive)||parsed.goLive[norm(tp.name)]||'';
    const hit=findProject(releases,tp.name);const p=hit&&hit.p;
    const ch=[];const add=(field,label,from,to)=>{if(to!==''&&to!=null&&String(from||'')!==String(to))ch.push({field,label,from:from||'',to});};
    add('golive','Go-live',p&&p.golive,golive);add('size','Size',p&&p.size,tp.size);add('status','Status',p&&p.status,tp.status);
    const curRes=k=>p&&p.resources&&Array.isArray(p.resources[k])&&p.resources[k][0]?p.resources[k][0].name:'';
    add('res:ocm_train','OCM Training (POC)',curRes('ocm_train'),tp.poc);add('res:pm','Project Manager',curRes('pm'),tp.pm[0]||'');add('res:func','Functional (BA)',curRes('func'),tp.ba[0]||'');add('res:ocm_impl','OCM Implementation',curRes('ocm_impl'),tp.impl[0]||'');
    const team=tp.team.filter(n=>norm(n)!==norm(tp.poc));
    const curTeam=p&&p.resources&&Array.isArray(p.resources.ocm_train)?p.resources.ocm_train.slice(1).map(x=>x.name):[];
    if(team.length&&team.join(', ')!==curTeam.join(', '))ch.push({field:'team',label:'Training team',from:curTeam.join(', '),to:team.join(', ')});
    if(g&&g.leadReviewPct!=null&&(!p||!p.tracker||p.tracker.leadReviewPct!==g.leadReviewPct))ch.push({field:'leadReview',label:'Lead review %',from:p&&p.tracker&&p.tracker.leadReviewPct!=null?p.tracker.leadReviewPct+'%':'',to:g.leadReviewPct+'%'});
    const move=!!(hit&&norm(hit.r.name)!==norm(rk));
    plan.projects.push({name:tp.name,release:rk,existing:hit?{relId:hit.r.id,projId:p.id,relName:hit.r.name}:null,isNew:!hit,move,changes:ch,data:Object.assign({},tp,{golive,team}),gates:g||null});
  });
  // Deliverables: match each tracker row to a project by alias, then by name prefix, then by containment.
  const allProjects=[];plan.projects.forEach(pp=>allProjects.push({name:pp.name,key:pp.name}));
  releases.forEach(r=>(r.projects||[]).forEach(p=>{if(!allProjects.some(x=>norm(x.name)===norm(p.name)))allProjects.push({name:p.name,key:p.name,id:p.id});}));
  parsed.deliverables.forEach(d=>{
    let target=null;const ak=norm(d.projectHint);
    if(aliases[ak]){for(const r of releases)for(const p of (r.projects||[]))if(String(p.id)===String(aliases[ak]))target=p.name;}
    if(!target){const ex=allProjects.find(x=>norm(x.name)===ak);if(ex)target=ex.name;}
    if(!target){const c=allProjects.filter(x=>norm(x.name).length>3&&(ak.includes(norm(x.name))||norm(x.name).includes(ak)));if(c.length===1)target=c[0].name;}
    const item={key:'tracker:'+norm(d.row),row:d.row,title:d.title,project:target,data:d,adhoc:/^ad-?hoc/i.test(d.projectHint)};
    if(target)plan.deliverables.push(item);else{item.suggest=item.adhoc?'':TI.suggestProject(d.projectHint,allProjects.map(x=>x.name));plan.unmatched.push(item);}
  });
  plan.counts={newReleases:plan.releases.filter(r=>r.isNew).length,newProjects:plan.projects.filter(p=>p.isNew).length,
    changedProjects:plan.projects.filter(p=>!p.isNew&&(p.changes.length||p.move)).length,deliverables:plan.deliverables.length,unmatched:plan.unmatched.length};
  return plan;
};

// A best guess for a free-form name ("Retro Med" → "Retroactive Medicaid"). Offered for the person to confirm, never applied on its own.
const STOP=new Set(['the','and','of','p','phase','project','updates','update','changes','change','technical','tech']);
const toks=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/&/g,' ').replace(/phase\s*(\d+)/g,'p$1').split(/[^a-z0-9]+/).filter(t=>t&&!STOP.has(t));
TI.suggestProject=function(hint,names){
  const h=toks(hint);if(!h.length)return'';
  const score=n=>{const t=toks(n);if(!t.length)return 0;let hit=0;h.forEach(a=>{if(t.some(b=>b===a||(a.length>=3&&b.startsWith(a))||(b.length>=3&&a.startsWith(b))))hit++;});return hit/Math.min(h.length,t.length)*(hit>=2||Math.min(h.length,t.length)===1?1:0.5);};
  const ranked=names.map(n=>({n,s:score(n)})).sort((a,b)=>b.s-a.s);
  return ranked[0]&&ranked[0].s>=0.6&&(!ranked[1]||ranked[1].s<ranked[0].s)?ranked[0].n:'';
};

// ── Applying ──
// f: {newRelease(name), newProject(name), migrate(p), TE, ctx, today}. choices: {unmatchedKey: projectName}.
TI.apply=function(plan,releases,f,choices){
  choices=choices||{};const today=f.today||new Date().toISOString().slice(0,10);
  const res={releases:0,projects:0,updated:0,moved:0,deliverables:0,deliverablesUpdated:0};
  const relFor=key=>{let r=releases.find(x=>norm(x.name)===norm(key));if(!r){r=f.newRelease(key);if(key===TI.HOLDING)r.holding=true;releases.push(r);res.releases++;}return r;};
  const projByName=n=>{for(const r of releases)for(const p of (r.projects||[]))if(norm(p.name)===norm(n))return{r,p};return null;};
  plan.projects.forEach(pp=>{
    const r=relFor(pp.release);let hit=projByName(pp.name);let p;
    if(!hit){p=f.newProject(pp.name);p.status=pp.data.status||'In Progress';r.projects.push(p);res.projects++;}
    else{p=hit.p;if(norm(hit.r.name)!==norm(r.name)){hit.r.projects=hit.r.projects.filter(x=>x!==p);r.projects.push(p);res.moved++;}if(pp.changes.length)res.updated++;}
    f.migrate(p);const d=pp.data;
    if(d.golive)p.golive=d.golive;if(d.size)p.size=d.size;if(d.status)p.status=d.status;
    // The tracker owns these owners: the list becomes the tracker's names, keeping any contact details already entered.
    const setRes=(k,names)=>{names=names.filter(Boolean);if(!names.length)return;const cur=Array.isArray(p.resources[k])?p.resources[k]:[];
      p.resources[k]=names.map(n=>cur.find(x=>x&&norm(x.name)===norm(n))||{name:n,contact:''});};
    setRes('ocm_train',[d.poc].concat(d.team||[]));setRes('pm',d.pm);setRes('func',d.ba);setRes('ocm_impl',d.impl);
    p.tracker=Object.assign({},p.tracker||{},{type:d.type,quarter:d.quarter,trainingLevel:d.training,effortWeeks:d.effortWeeks,changePlanToPMs:d.changePlan,statusText:d.statusText,
      importedAt:today,file:plan.file||'',leadReviewPct:pp.gates?pp.gates.leadReviewPct:(p.tracker||{}).leadReviewPct,gates:pp.gates?pp.gates.items:((p.tracker||{}).gates||[])});
    if(!Array.isArray(p.tracker.aliases))p.tracker.aliases=[];
    if(f.TE)f.TE.log(p,{type:'tracker',text:'Delivery tracker imported'+(pp.isNew?': project created':pp.changes.length?': '+pp.changes.map(c=>c.label).join(', ')+' updated':': no changes')},Object.assign({},f.ctx||{},{today}));
    if(d.golive&&r.holding!==true&&(!r.golive||d.golive>r.golive))r.golive=d.golive;
  });
  const items=plan.deliverables.concat(plan.unmatched.filter(u=>choices[u.key]).map(u=>Object.assign({},u,{project:choices[u.key],alias:true})));
  items.forEach(it=>{
    const hit=projByName(it.project);if(!hit)return;const p=hit.p;f.migrate(p);const t=p.training;const d=it.data;
    if(it.alias){p.tracker=p.tracker||{};p.tracker.aliases=Array.from(new Set((p.tracker.aliases||[]).concat([norm(d.projectHint)])));}
    let rec=t.deliverables.find(x=>x.trackerKey===it.key);const isNew=!rec;
    const planned={start:d.dates.prelim||d.dates.jar||'',due:d.dates.approval||d.dates.materials||'',delivery:d.dates.delivered||d.dates.ready||''};
    if(!rec){rec=f.TE.newDeliverable({title:d.title,type:TI.delivType(d.course,d.title),trackerKey:it.key,source:'tracker',state:'not_started'});t.deliverables.push(rec);res.deliverables++;}
    else res.deliverablesUpdated++;
    rec.owner=d.trainers.join(', ')||rec.owner;rec.planned=Object.assign({},rec.planned,Object.fromEntries(Object.entries(planned).filter(([,v])=>v)));
    rec.tracker={row:d.row,audience:d.audience,course:d.course,status:d.status,dates:d.dates,notes:d.notes,importedAt:today};
    const sh=(p.stakeholders||[]).find(s=>d.audience&&norm(s.name)===norm(d.audience));if(sh&&!rec.audienceIds.map(String).includes(String(sh.id)))rec.audienceIds.push(sh.id);
    if(d.state&&d.state!==rec.state)f.TE.setDeliverableState(p,rec.id,d.state,Object.assign({},f.ctx||{},{today}),'Status in the delivery tracker');
    if(isNew&&f.TE)f.TE.log(p,{type:'deliverable',refId:rec.id,text:'Deliverable added from the delivery tracker: '+rec.title},Object.assign({},f.ctx||{},{today}));
    if(d.dates.uat&&hit.r&&!hit.r.holding)hit.r.uatComplete=d.dates.uat;
  });
  return res;
};

if(typeof module!=='undefined'&&module.exports)module.exports=TI;
root.TI=TI;
})(typeof window!=='undefined'?window:globalThis);
