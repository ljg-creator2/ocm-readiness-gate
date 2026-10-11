'use strict';
// ════════════════════════════════════════════════════════
// TRAINING-LED OCM: screens
// Decision brief, Dependencies & Evidence, Learning Development, Readiness & Gates,
// Actions & Risks, Delivery milestones and Outcomes. All logic lives in
// js/training-engine.js (TE); this file renders records and writes edits back.
// Loaded after js/adoptiq.js.
// ════════════════════════════════════════════════════════
const TR_WORKSTREAMS=['Environment support','Functional','App Dev','QA','UAT','OCM Implementation','OCM Training','Project Manager','SMEs','Release management'];
function trCtx(p){let uat='';try{uat=p?projTTDates(p).uatComplete:'';}catch(e){}return{WS,GL,PL_INTERVALS,golive:p?projGoLive(p):'',uatComplete:uat||'',by:(window._cc&&_cc.userName)||'',today:trToday()};}
function trToday(){return TE.today();}
function trProj(){const p=getProj();if(p)TE.migrate(p,trCtx(p));return p;}
function trCanEdit(){return !isReadOnly;}
function trSaved(msg){touch('proj');schedSave();if(msg)showSuccess(msg);trRefresh();}
function trRefresh(){
  const act=document.querySelector('#v-project .tab-sec.active');const id=act?act.id.replace('psec-',''):'';
  renderProjBrief();
  const map={deps:trRenderDeps,learndev:trRenderLearnDev,readiness:trRenderReadiness,actions:trRenderActions,milestones:trRenderMilestones,postlaunch:trRenderOutcomes,heatmap:renderPDepHM};
  if(map[id])map[id]();
}
const TR_TONE={ready:'st-g',conditional:'st-w',insufficient:'st-w',blocked:'st-c',not_assessed:'st-n',not_observed:'st-n',assessed:'st-n',
  satisfied:'st-g',exception:'st-w',partial:'st-w',awaiting:'st-n',
  validated:'st-g',approved:'st-g',released:'st-g',in_review:'st-w',awaiting_input:'st-w',revision_required:'st-r',draft:'st-n',not_started:'st-n'};
// The .st badge draws its own shape (circle, diamond, triangle, square); the word is always shown.
function trChip(state,label){const c=TR_TONE[state]||'st-n';return'<span class="st '+c+'">'+esc(label||(TE.READY_STATES[state]||{}).label||state)+'</span>';}
function trName(list,id){const x=TE.byId(list,id);return x?(x.name||x.title||x.task||'Untitled'):'(removed)';}
function trNames(list,ids){return (ids||[]).map(id=>trName(list,id)).filter(Boolean);}
function trAud(p,ids){return trNames(p.stakeholders||[],ids);}
function trD(d){return d?fmtDate(d):'—';}
function trQ(v){return "'"+String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";}
function trEmpty(t,d,btn){return'<div class="tr-empty"><strong>'+esc(t)+'</strong><span>'+esc(d)+'</span>'+(btn&&trCanEdit()?btn:'')+'</div>';}
function trBtn(label,on,cls){return'<button type="button" class="'+(cls||'btn-outline btn-sm')+'" onclick="'+on+'">'+label+'</button>';}

// ── Accessible edit drawer (one instance) ──
let _trDlgReturn=null,_trDlgSave=null;
function trDialog(title,bodyHtml,onSave,opts){
  opts=opts||{};let dlg=document.getElementById('tr-dlg');
  if(!dlg){dlg=document.createElement('div');dlg.id='tr-dlg';dlg.className='tr-dlg';dlg.hidden=true;
    dlg.innerHTML='<div class="tr-dlg-scrim" onclick="trCloseDialog()"></div><div class="tr-dlg-panel" role="dialog" aria-modal="true" aria-labelledby="tr-dlg-h"><div class="tr-dlg-hd"><h2 id="tr-dlg-h"></h2><button type="button" class="tr-x" onclick="trCloseDialog()" aria-label="Close"><i class="ph ph-x"></i></button></div><div class="tr-dlg-b" id="tr-dlg-b"></div><div class="tr-dlg-ft"><p class="tr-dlg-err" id="tr-dlg-err" role="alert"></p><button type="button" class="btn-outline" onclick="trCloseDialog()">Cancel</button><button type="button" class="btn-primary" id="tr-dlg-save" onclick="trDialogSave()">Save</button></div></div>';
    document.body.appendChild(dlg);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dlg.hidden){e.preventDefault();trCloseDialog();}});
    dlg.addEventListener('keydown',e=>{
      if(e.key!=='Tab')return;const f=[...dlg.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.offsetParent!==null);
      if(!f.length)return;const first=f[0],last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
  }
  _trDlgReturn=document.activeElement;_trDlgSave=onSave;
  dlg.querySelector('#tr-dlg-h').textContent=title;dlg.querySelector('#tr-dlg-b').innerHTML=bodyHtml;dlg.querySelector('#tr-dlg-err').textContent='';
  const ro=!trCanEdit()||!onSave;dlg.querySelector('#tr-dlg-save').hidden=ro;
  if(ro)dlg.querySelectorAll('#tr-dlg-b input,#tr-dlg-b select,#tr-dlg-b textarea').forEach(x=>x.disabled=true);
  dlg.querySelector('#tr-dlg-save').textContent=opts.saveLabel||'Save';
  dlg.hidden=false;document.body.classList.add('tr-dlg-open');
  setTimeout(()=>{const f=dlg.querySelector('#tr-dlg-b input:not([disabled]),#tr-dlg-b select:not([disabled]),#tr-dlg-b textarea:not([disabled])')||dlg.querySelector('.tr-x');if(f)f.focus();},30);
}
function trCloseDialog(){const dlg=document.getElementById('tr-dlg');if(!dlg||dlg.hidden)return;dlg.hidden=true;document.body.classList.remove('tr-dlg-open');_trDlgSave=null;if(_trDlgReturn&&_trDlgReturn.focus)try{_trDlgReturn.focus();}catch(e){}}
function trDialogSave(){if(!_trDlgSave||!trCanEdit())return;const err=_trDlgSave();if(err){document.getElementById('tr-dlg-err').textContent=err;return;}trCloseDialog();}

// ── Form helpers (fields: {k,label,type,opts,help,req,ph}) ──
function trGet(o,k){return k.split('.').reduce((a,x)=>a==null?a:a[x],o);}
function trSet(o,k,v){const ks=k.split('.');let a=o;ks.slice(0,-1).forEach(x=>{if(!a[x]||typeof a[x]!=='object')a[x]={};a=a[x];});a[ks[ks.length-1]]=v;}
function trFid(k){return'trf-'+k.replace(/\./g,'-');}
function trForm(fields,rec){
  return fields.map(f=>{
    if(f.type==='section')return'<h3 class="tr-fs">'+esc(f.label)+'</h3>'+(f.help?'<p class="tr-help">'+esc(f.help)+'</p>':'');
    const id=trFid(f.k),v=trGet(rec,f.k);let inp;
    const lab='<label for="'+id+'">'+esc(f.label)+(f.req?' <span class="tr-req" aria-hidden="true">*</span>':'')+'</label>';
    if(f.type==='textarea')inp='<textarea id="'+id+'" rows="'+(f.rows||3)+'"'+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+'>'+esc(v||'')+'</textarea>';
    else if(f.type==='select')inp='<select id="'+id+'">'+f.opts.map(o=>'<option value="'+esc(String(o[0]))+'"'+(String(o[0])===String(v==null?'':v)?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
    else if(f.type==='check')return'<div class="tr-f tr-f-check"><input type="checkbox" id="'+id+'"'+(v?' checked':'')+'><label for="'+id+'">'+esc(f.label)+'</label>'+(f.help?'<p class="tr-help">'+esc(f.help)+'</p>':'')+'</div>';
    else if(f.type==='multi'){
      const sel=(v||[]).map(String);
      if(!f.opts.length)return'<fieldset class="tr-f"><legend>'+esc(f.label)+'</legend><p class="tr-help">'+esc(f.none||'Nothing to link yet.')+'</p></fieldset>';
      return'<fieldset class="tr-f"><legend>'+esc(f.label)+'</legend><div class="tr-multi" id="'+id+'">'+f.opts.map((o,i)=>'<label class="tr-opt"><input type="checkbox" value="'+esc(String(o[0]))+'"'+(sel.includes(String(o[0]))?' checked':'')+'> '+esc(o[1])+'</label>').join('')+'</div>'+(f.help?'<p class="tr-help">'+esc(f.help)+'</p>':'')+'</fieldset>';
    }
    else inp='<input type="'+(f.type==='date'?'date':f.type==='url'?'url':'text')+'" id="'+id+'" value="'+esc(v||'')+'"'+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+(f.list?' list="'+f.list+'"':'')+'>';
    return'<div class="tr-f'+(f.half?' tr-half':'')+'">'+lab+inp+(f.help?'<p class="tr-help">'+esc(f.help)+'</p>':'')+'</div>';
  }).join('');
}
function trCollect(fields,rec){
  const out=JSON.parse(JSON.stringify(rec||{}));
  fields.forEach(f=>{if(f.type==='section')return;const el=document.getElementById(trFid(f.k));if(!el)return;
    let v;if(f.type==='check')v=el.checked;else if(f.type==='multi')v=[...el.querySelectorAll('input:checked')].map(x=>{const s=x.value;return /^\d+$/.test(s)&&s.length>6?Number(s):s;});else v=el.value.trim();
    trSet(out,f.k,v);});
  return out;
}
function trMissing(fields,rec){const m=fields.filter(f=>f.req&&!trGet(rec,f.k)).map(f=>f.label);return m.length?'Required: '+m.join(', ')+'.':'';}
function trOpts(list,lbl){return (list||[]).map(x=>[x.id,lbl?lbl(x):(x.name||x.title||x.task||'Untitled')]);}
function trWsList(){return '<datalist id="tr-ws">'+TR_WORKSTREAMS.concat(WS).filter((v,i,a)=>a.indexOf(v)===i).map(w=>'<option value="'+esc(w)+'">').join('')+'</datalist>';}

// ════════════ DECISION BRIEF (Overview) ════════════
function renderProjBrief(){
  const el=document.getElementById('proj-brief');const p=trProj();if(!el||!p)return;
  const t=p.training,ctx=trCtx(p),b=TE.brief(p,ctx),m=TE.measures(p,ctx);
  const aud=trAud(p,b.affected.audiences),sc=trNames(t.scenarios,b.affected.scenarios),dl=trNames(t.deliverables,b.affected.deliverables);
  const recTone={ready:'erb-g',conditional:'erb-r',insufficient:'erb-r',blocked:'erb-c',not_assessed:''}[b.rec.state]||'';
  const li=(arr,fn,empty)=>arr.length?'<ul class="trb-list">'+arr.map(fn).join('')+'</ul>':'<p class="trb-none">'+esc(empty)+'</p>';
  const open=(kind,id)=>(kind==='dependency'||kind==='exception')?'trEditDep('+trQ(id)+')':(kind==='checkpoint'&&id)?'trEditCheckpoint('+trQ(id)+')':kind==='scenario'?'trEditScenario('+trQ(id)+')':kind==='deliverable'?'trEditDeliverable('+trQ(id)+')':'goPTab(\'readiness\')';
  const proceed=b.canProceed.map(x=>({t:x.d.title,s:x.mode==='provisional'?'Provisional development only: '+(x.why||[]).join('; '):x.conditional?'Scenario-based development, with conditions':'Scenario-based development',id:x.d.id}));
  el.innerHTML='<section class="erb trb '+recTone+'" aria-labelledby="trb-h">'
    +'<div class="erb-top"><div><div class="erb-eye">Training readiness recommendation · input to release governance</div>'
    +'<h2 class="erb-pos" id="trb-h">'+esc(b.rec.label)+(String(b.rec.label).toLowerCase()===String((TE.READY_STATES[b.rec.state]||{}).label||'').toLowerCase()?'':' '+trChip(b.rec.state))+'</h2>'
    +'<p class="trb-narr"><strong>Material development</strong> <button type="button" class="trb-state" onclick="goPTab(\'milestones\')">'+trChip(b.dev.state,b.dev.label)+'</button> <strong>Training delivery</strong> <button type="button" class="trb-state" onclick="trExplain(\'delivery\')">'+trChip(b.del.state)+'</button></p>'
    +'<p class="ev-line"><strong>Decision needed:</strong> '+esc(b.decision)+' <strong>Decision authority:</strong> '+esc(b.authority)+'</p>'
    +'<p class="ev-line"><strong>Evidence last updated:</strong> '+trD(b.lastEvidence)+' · <strong>Last review:</strong> '+trD(b.lastReview)+(trCanEdit()?' <button type="button" class="btn-text" onclick="trMarkReviewed()">Mark reviewed today</button>':'')+'</p></div>'
    +'<div class="trb-measures">'+['input','material','delivery','ability'].map(k=>trMeasureMini(m[k])).join('')+'</div></div>'
    +'<div class="trb-grid">'
    +'<div><h3 class="erb-h">What is blocked and why</h3>'+li(b.blocked,r=>'<li><button type="button" class="trb-link" onclick="'+open(r.kind,r.id)+'">'+trChip('blocked','Blocked')+' <span>'+esc(r.text)+'</span></button></li>','No critical condition is blocking delivery.')
    +(b.conditions.length?'<h3 class="erb-h">Conditions</h3>'+li(b.conditions.slice(0,5),r=>'<li><button type="button" class="trb-link" onclick="'+open(r.kind,r.id)+'">'+trChip('conditional','Condition')+' <span>'+esc(r.text)+'</span></button></li>',''):'')
    +'<h3 class="erb-h">What can proceed</h3>'+li(proceed,x=>'<li><button type="button" class="trb-link" onclick="trEditDeliverable('+trQ(x.id)+')">'+trChip('ready','Proceed')+' <span><strong>'+esc(x.t)+'</strong> — '+esc(x.s)+'</span></button></li>',!t.deliverables.length?'No learning deliverables recorded yet.':t.deliverables.every(d=>(TE.DELIV_STATES[d.state]||{}).done)?'Development is finished for every recorded deliverable; see delivery status above.':'No deliverables can proceed yet.')+'</div>'
    +'<div><h3 class="erb-h">Affected work</h3><dl class="trb-dl"><dt>Audiences</dt><dd>'+(aud.length?esc(aud.join(', ')):'None')+'</dd><dt>Scenarios</dt><dd>'+(sc.length?esc(sc.join(', ')):'None')+'</dd><dt>Deliverables</dt><dd>'+(dl.length?esc(dl.join(', ')):'None')+'</dd></dl>'
    +'<h3 class="erb-h">Required actions</h3>'+li(b.actions.slice(0,5),a=>'<li><span class="trb-act"><strong>'+esc(a.title)+'</strong><span>'+esc(a.owner||'No owner')+' · due '+trD(a.due)+'</span></span></li>','No open actions.')
    +'<h3 class="erb-h">Changes since '+(b.since?'the last review ('+trD(b.since)+')':'records began')+'</h3>'+li(b.changes.slice(0,5),h=>'<li><span class="trb-act"><span>'+esc(h.text)+'</span><span>'+trD(h.date)+(h.flagged?' · '+h.flagged+' item'+(h.flagged===1?'':'s')+' flagged for review':'')+'</span></span></li>','No changes recorded.')
    +'</div></div>'
    +'<div class="erb-acts"><button class="btn-primary dz-keep" onclick="goPTab(\'deps\')">Dependencies &amp; evidence</button><button class="btn-outline dz-keep" onclick="goPTab(\'readiness\')">All readiness measures</button><button class="btn-outline dz-keep" onclick="exportStatusReport()">Status report</button><button class="btn-outline dz-keep" onclick="trShowHistory()">Record history</button></div>'
    +'<p class="ai-note">Training supplies this recommendation from the records above. Final release authority rests with the designated release governance.</p></section>';
}
function trMeasureMini(x){
  const v=x.value!==null&&x.value!==undefined&&x.key!=='delivery'?x.value+'%':'';
  return'<button type="button" class="trb-m" onclick="trExplain('+trQ(x.key)+')" title="'+esc(x.definition||'')+'"><span class="trb-m-l">'+esc(x.label)+'</span><span class="trb-m-v">'+(v||trChip(x.state))+'</span><span class="trb-m-s">'+esc(x.detail||'')+'</span></button>';
}
function trExplain(key){
  const p=trProj();if(!p)return;const m=TE.measures(p,trCtx(p))[key];if(!m)return;
  let body='<p class="tr-help">'+esc(m.definition)+'</p><p><strong>Current:</strong> '+trChip(m.state)+' '+esc(m.detail||'')+'</p>';
  if(key==='delivery'){body+=(m.reasons.length?'<h3 class="tr-fs">Reasons</h3><ul class="tr-ul">'+m.reasons.map(r=>'<li>'+esc(r.text)+'</li>').join('')+'</ul>':'')+(m.conditions.length?'<h3 class="tr-fs">Conditions</h3><ul class="tr-ul">'+m.conditions.map(r=>'<li>'+esc(r.text)+'</li>').join('')+'</ul>':'');}
  if(key==='input'&&m.blocked&&m.blocked.length)body+='<h3 class="tr-fs">Blocked inputs</h3><ul class="tr-ul">'+m.blocked.map(d=>'<li>'+esc(d.title)+' — '+esc(d.owner||d.workstream||'no owner')+'</li>').join('')+'</ul>';
  if(key==='evidence')body+='<ul class="tr-ul">'+m.items.map(i=>'<li>'+esc(i.label)+': '+esc(i.grade)+'</li>').join('')+'</ul>';
  if(key==='ability'&&m.adkarAbility!==null)body+='<p>ADKAR Ability is rated '+m.adkarAbility+'/5'+(m.abilityLow?', which caps this measure at Conditional.':'.')+'</p>';
  trDialog(m.label,body,null);
}
function trShowHistory(){
  const p=trProj();if(!p)return;const h=p.training.history.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  trDialog('Record history',h.length?'<p class="tr-help">Every change to Training records, newest first. Entries are written when records change and are not edited afterwards.</p><ol class="tr-hist">'+h.map(x=>'<li><span class="mono">'+trD(x.date)+'</span><span>'+esc(x.text||'')+(x.flagged?' <em>('+x.flagged+' item'+(x.flagged===1?'':'s')+' flagged for review)</em>':'')+(x.by?'<span class="tr-sub">'+esc(x.by)+'</span>':'')+'</span></li>').join('')+'</ol>':'<p class="tr-help">No changes recorded yet.</p>',null);
}
function trMarkReviewed(){const p=trProj();if(!p||!trCanEdit())return;p.training.lastReview=trToday();TE.log(p,{type:'review',text:'Readiness reviewed'},trCtx(p));trSaved('Review date recorded.');}

// ════════════ SUGGESTIONS (from data already entered) ════════════
// Owner and workstream come from the project's Resources tab.
function trOwnerFor(p,ws){const r=RES_ROLES.find(x=>x.label.toLowerCase()===String(ws||'').trim().toLowerCase());return r?getEffectiveRes(p,r.key,'name'):'';}
function trWorkstreamFor(p,owner){if(!owner)return'';const r=RES_ROLES.find(x=>(p.resources&&Array.isArray(p.resources[x.key])?p.resources[x.key]:[]).some(m=>m&&m.name&&m.name.trim().toLowerCase()===owner.trim().toLowerCase()));return r?r.label:'';}
function trSuggestBox(p,kind){
  const list=TE.suggestions(p,trCtx(p))[kind];if(!list.length)return'';
  const reviews=list.filter(x=>x.review),adds=list.filter(x=>!x.review);
  const noun={dependencies:['dependency','dependencies'],workflows:['changed workflow','changed workflows'],scenarios:['scenario','scenarios']}[kind];
  const src=[...new Set(list.map(x=>x.source))].join(' and ');
  const item=x=>'<li><span class="tr-suggest-t"><strong>'+esc(x.label)+'</strong><span class="tr-sub">'+esc(x.source)+(x.note?' · '+esc(x.note):'')+'</span></span>'
    +(trCanEdit()?'<span class="tr-suggest-a">'+(x.review?trBtn('Review','trReviewSuggestion('+trQ(x.key)+','+trQ(x.review)+')','btn-primary btn-sm'):trBtn('Review and add','trAcceptSuggestion('+trQ(kind)+','+trQ(x.key)+')','btn-primary btn-sm'))+trBtn('Dismiss','trDismissSuggestion('+trQ(x.key)+')','btn-text')+'</span>':'')+'</li>';
  const ul=arr=>{if(arr.length<=6)return'<ul>'+arr.map(item).join('')+'</ul>';return'<ul>'+arr.slice(0,6).map(item).join('')+'</ul><details class="tr-more"><summary>Show '+(arr.length-6)+' more</summary><ul>'+arr.slice(6).map(item).join('')+'</ul></details>';};
  const title=(adds.length?adds.length+' suggested '+noun[adds.length===1?0:1]:'')+(adds.length&&reviews.length?' and ':'')+(reviews.length?reviews.length+' update'+(reviews.length===1?'':'s')+' to review':'')+' from your '+src;
  return'<section class="tr-suggest" aria-labelledby="trs-'+kind+'"><div class="tr-suggest-hd"><h3 id="trs-'+kind+'">'+esc(title)+'</h3>'
    +'<p class="tr-help">Drafted from what is already entered. Nothing is added or changed until you review and save it.</p></div>'
    +(reviews.length?ul(reviews):'')+(adds.length?ul(adds):'')
    +(trCanEdit()?'':'<p class="tr-help">View-only: someone with edit access can add these.</p>')+'</section>';
}
function trReviewSuggestion(key,depId){const p=trProj();if(!p||!trCanEdit())return;TE.markSuggestion(p,key,'reviewed');touch('proj');schedSave();trEditDep(depId);}
function trAcceptSuggestion(kind,key){
  const p=trProj();if(!p||!trCanEdit())return;const x=TE.suggestions(p)[kind].find(y=>y.key===key);if(!x)return;
  const pre=JSON.parse(JSON.stringify(x.preset));
  if(kind==='dependencies'){if(!pre.workstream)pre.workstream=trWorkstreamFor(p,pre.owner);if(!pre.owner&&pre.workstream)pre.owner=trOwnerFor(p,pre.workstream);trEditDep(null,pre);}
  else if(kind==='scenarios')trEditScenario(null,pre);
  else trEditWorkflow(null,pre);
}
function trDismissSuggestion(key){const p=trProj();if(!p||!trCanEdit())return;TE.markSuggestion(p,key,'dismissed');TE.log(p,{type:'suggestion',text:'Suggestion dismissed: '+key},trCtx(p));trSaved('Suggestion dismissed.');}
// Fill the accountable person from Resources when the workstream is chosen (only while the field is empty or still auto-filled).
function trWireOwnerFill(p){
  const ws=document.getElementById('trf-workstream'),ow=document.getElementById('trf-owner');if(!ws||!ow||ws.disabled)return;
  let auto=false;const hint=document.createElement('p');hint.className='tr-help';hint.id='trf-owner-hint';ow.insertAdjacentElement('afterend',hint);
  const fill=()=>{const n=trOwnerFor(p,ws.value);if(n&&(!ow.value||auto)){ow.value=n;auto=true;hint.textContent='Filled from Resources. Change it if someone else is accountable.';}else if(!n&&auto){hint.textContent='';}};
  ow.addEventListener('input',()=>{auto=false;hint.textContent='';});ws.addEventListener('input',fill);ws.addEventListener('change',fill);fill();
}

// ════════════ DEPENDENCIES & EVIDENCE ════════════
let _trDepFilter='open';
function trRenderDeps(){
  const el=document.getElementById('tr-deps');const p=trProj();if(!el||!p)return;const t=p.training;
  const counts={};TE.DEP_ORDER.forEach(s=>counts[s]=t.dependencies.filter(d=>d.status===s).length);
  const list=t.dependencies.filter(d=>_trDepFilter==='all'||(_trDepFilter==='open'?!TE.isResolved(d):d.status===_trDepFilter))
    .sort((a,b)=>(b.critical-a.critical)||((TE.DEP_STATUS[b.status].rank)-(TE.DEP_STATUS[a.status].rank))||String(a.requiredBy||'9').localeCompare(String(b.requiredBy||'9')));
  const f=(k,l)=>'<button type="button" class="tr-filter'+(_trDepFilter===k?' on':'')+'" aria-pressed="'+(_trDepFilter===k)+'" onclick="_trDepFilter='+trQ(k)+';trRenderDeps()">'+esc(l)+'</button>';
  const permits=d=>TE.GATED_ACTIVITIES.filter(a=>d.permits&&d.permits[a]).map(a=>(TE.ACTIVITIES.find(x=>x.key===a)||{}).label);
  el.innerHTML=trSuggestBox(p,'dependencies')+'<div class="tr-bar"><div class="tr-filters" role="group" aria-label="Filter by status">'+f('open','Unresolved ('+(t.dependencies.length-counts.satisfied-counts.exception)+')')+f('blocked','Blocked ('+counts.blocked+')')+f('exception','Exceptions ('+counts.exception+')')+f('satisfied','Satisfied ('+counts.satisfied+')')+f('all','All ('+t.dependencies.length+')')+'</div>'
    +(trCanEdit()?trBtn('<i class="ph ph-plus"></i> Add dependency','trEditDep()','btn-primary btn-sm'):'')+'</div>'
    +(list.length?'<div class="dt-wrap"><table class="dt tr-table"><thead><tr><th scope="col">Required input</th><th scope="col">Owner</th><th scope="col">Needed by</th><th scope="col">Status</th><th scope="col">Consequence for Training</th><th scope="col">Can continue</th><th scope="col">Next action</th></tr></thead><tbody>'
      +list.map(d=>{const a=TE.depAffects(p,d);const late=d.requiredBy&&!TE.isResolved(d)&&trToday()>d.requiredBy;
        return'<tr><td><button type="button" class="tr-rowlink" onclick="trEditDep('+trQ(d.id)+')">'+(d.critical?'<span class="tr-crit">Critical</span> ':'')+esc(d.title||'Untitled')+'</button><div class="tr-sub">'+a.scenarioIds.length+' scenario'+(a.scenarioIds.length===1?'':'s')+' · '+a.deliverableIds.length+' deliverable'+(a.deliverableIds.length===1?'':'s')+(a.audienceIds.length?' · '+esc(trAud(p,a.audienceIds).join(', ')):'')+(d.source==='legacy-heatmap'?' · from the earlier dependency map':d.source==='craid'?' · from the CRAID log':d.jiraKey?' · Jira '+d.jiraKey:'')+'</div></td>'
        +'<td>'+esc(d.workstream||'—')+'<div class="tr-sub">'+esc(d.owner||'No accountable person')+'</div></td>'
        +'<td class="mono'+(late?' tr-late':'')+'">'+trD(d.requiredBy)+(late?'<div class="tr-sub">Past due</div>':'')+'</td>'
        +'<td>'+trChip(d.status,TE.depStatusLabel(d.status))+(d.evidence&&d.evidence.ref?'<div class="tr-sub">Evidence: '+esc(d.evidence.ref)+(d.evidence.version?' · '+esc(d.evidence.version):'')+'</div>':TE.isResolved(d)?'<div class="tr-sub tr-late">No evidence reference</div>':'')+'</td>'
        +'<td>'+esc(d.consequence||'—')+'</td><td>'+(permits(d).length?esc(permits(d).join(', ')):'Nothing linked')+'</td>'
        +'<td>'+(d.next&&d.next.action?esc(d.next.action)+'<div class="tr-sub">'+esc(d.next.owner||'No owner')+' · '+trD(d.next.due)+'</div>':'—')+'</td></tr>';}).join('')+'</tbody></table></div>'
      :trEmpty(_trDepFilter==='open'?'No unresolved dependencies.':'Nothing in this view.','Record each upstream input Training needs: what it is, who supplies it, when it is needed and what Training can do meanwhile.',trBtn('Add dependency','trEditDep()','btn-primary btn-sm')))
    +'<p class="tr-help">The Dependency Map view summarises these records by phase and workstream. Edit the records, not the map.</p>';
}
function trDepFields(p){
  const t=p.training;
  return[
    {type:'section',label:'What Training needs'},
    {k:'title',label:'Required input',req:true,ph:'e.g. Training environment can run the intake scenario'},
    {k:'acceptance',label:'Acceptance criteria',type:'textarea',rows:2,ph:'What “satisfied” means'},
    {k:'critical',label:'Critical: delivery cannot proceed while this is unresolved',type:'check'},
    {k:'workstream',label:'Owning workstream',list:'tr-ws',half:true,req:true},{k:'owner',label:'Accountable person',half:true,req:true},
    {k:'requiredBy',label:'Required by',type:'date',half:true},{k:'phase',label:'Lifecycle phase',type:'select',half:true,opts:[['','Not set']].concat(GL.map((g,i)=>[i,g]))},
    {type:'section',label:'Affected work'},
    {k:'workflowIds',label:'Changed workflows',type:'multi',opts:trOpts(t.workflows),none:'No workflows recorded yet (Learning Development).'},
    {k:'scenarioIds',label:'Scenarios',type:'multi',opts:trOpts(t.scenarios),none:'No scenarios recorded yet.'},
    {k:'deliverableIds',label:'Learning deliverables',type:'multi',opts:trOpts(t.deliverables),none:'No deliverables recorded yet.'},
    {k:'audienceIds',label:'Audiences',type:'multi',opts:trOpts(p.stakeholders||[]),none:'No stakeholder groups recorded yet.'},
    {type:'section',label:'Status and evidence'},
    {k:'status',label:'Status',type:'select',half:true,opts:TE.DEP_ORDER.map(s=>[s,TE.depStatusLabel(s)])},
    {k:'evidence.ref',label:'Evidence reference',half:true,ph:'Test ID, ticket, sign-off'},
    {k:'evidence.version',label:'Version',half:true,ph:'Build or release'},{k:'evidence.environment',label:'Environment',half:true,ph:'e.g. TRN-2'},
    {k:'evidence.date',label:'Evidence date',type:'date',half:true},{k:'evidence.verified',label:'Evidence verified by Training',type:'check'},
    {type:'section',label:'Accepted exception',help:'Only for status “Accepted exception”. An exception is recorded separately and never counts as satisfied.'},
    {k:'exception.rationale',label:'Rationale',type:'textarea',rows:2},{k:'exception.approver',label:'Authorized approver',half:true},{k:'exception.date',label:'Approval date',type:'date',half:true},
    {k:'exception.review',label:'Review conditions',ph:'When the exception must be revisited'},
    {type:'section',label:'Consequence and permitted work'},
    {k:'consequence',label:'Consequence for Training',type:'textarea',rows:2,ph:'What cannot proceed or will need rework'},
    {k:'permits.provisional',label:'Provisional development can continue',type:'check'},{k:'permits.scenarioDev',label:'Scenario-based development can continue',type:'check'},
    {k:'permits.validation',label:'Validation and review can continue',type:'check'},{k:'permits.facilitator',label:'Facilitator preparation can continue',type:'check'},
    {k:'permits.delivery',label:'End-user delivery can continue',type:'check'},
    {k:'permittedNote',label:'Notes on permitted work',type:'textarea',rows:2},
    {type:'section',label:'Next action'},
    {k:'next.action',label:'Next action'},{k:'next.owner',label:'Action owner',half:true},{k:'next.due',label:'Due',type:'date',half:true}
  ];
}
function trEditDep(id,preset){
  const p=trProj();if(!p)return;const t=p.training;
  const rec=id?TE.byId(t.dependencies,id):TE.newDependency(Object.assign({created:trToday()},preset||{}));if(!rec)return;
  const fields=trDepFields(p);const before=JSON.parse(JSON.stringify(rec));
  let body=trWsList()+'<div class="tr-form">'+trForm(fields,rec)+'</div>';
  if(id){const a=TE.depAffects(p,rec);body+='<p class="tr-help">Saving a change to status, evidence or version flags the '+a.scenarioIds.length+' linked scenario(s) and '+a.deliverableIds.length+' deliverable(s) for review where needed. Nothing is marked validated automatically.</p>';
    if(trCanEdit())body+='<p><button type="button" class="btn-text tr-danger" onclick="trDeleteRec(\'dependencies\','+trQ(id)+')">Delete this dependency</button></p>';}
  trDialog(id?'Dependency':'New dependency',body,()=>{
    const v=trCollect(fields,rec);v.phase=v.phase===''?null:+v.phase;
    const miss=trMissing(fields,v);if(miss)return miss;
    if(v.status!=='exception')v.exception=before.exception&&before.exception.rationale?before.exception:null;
    if(!id){const n=TE.newDependency(Object.assign({},v,{status:'awaiting',created:trToday(),updated:trToday()}));t.dependencies.push(n);
      const r=TE.updateDependency(p,n.id,{status:v.status,exception:v.exception,next:v.next},trCtx(p));
      if(r&&r.error){t.dependencies.pop();return r.error;}
      if(n.craidId)TE.markSuggestion(p,'craid:'+n.craidId,'added');
      TE.log(p,{type:'dependency',refId:n.id,text:'Dependency recorded: '+n.title+' ('+TE.depStatusLabel(n.status)+')'+(n.craidId?' from the CRAID log':n.jiraKey?' from Jira '+n.jiraKey:'')},trCtx(p));trSaved('Dependency added.');return;}
    const patch={};Object.keys(v).forEach(k=>{patch[k]=v[k];});
    const r=TE.updateDependency(p,id,patch,trCtx(p));if(r&&r.error)return r.error;
    const nf=r?(r.flagged.scenarios.length+r.flagged.deliverables.length):0;
    trSaved(nf?'Saved. '+nf+' linked item'+(nf===1?' is':'s are')+' flagged for review.':'Dependency saved.');
  });  trWireOwnerFill(p);
}
function trDeleteRec(kind,id){
  const p=trProj();if(!p||!trCanEdit())return;const list=p.training[kind];const i=list.findIndex(x=>String(x.id)===String(id));if(i<0)return;
  const name=list[i].title||list[i].name||list[i].task||'record';
  if(!confirm('Delete “'+name+'”? Links from other records are removed too.'))return;
  list.splice(i,1);
  ['dependencies','scenarios','deliverables','objectives'].forEach(k=>p.training[k].forEach(r=>['scenarioIds','deliverableIds','objectiveIds','workflowIds'].forEach(f=>{if(Array.isArray(r[f]))r[f]=r[f].filter(x=>String(x)!==String(id));})));
  TE.log(p,{type:'delete',text:'Deleted: '+name},trCtx(p));trCloseDialog();trSaved('Deleted.');
}
// Dependency map (heat map) is now a summary of the dependency records.
function renderPDepHM(){
  const p=trProj();if(!p)return;const t=document.getElementById('p-dep-hm');if(!t)return;const deps=p.training.dependencies;
  // Columns: the standard workstreams plus any other owning workstream used in a record.
  const cols=WS.concat(deps.map(d=>d.workstream).filter(w=>w&&!WS.includes(w))).filter((v,i,a)=>a.indexOf(v)===i);
  const rows=GL.map((g,i)=>({gi:i,label:g}));if(deps.some(d=>d.phase===null||d.phase===''||d.phase===undefined))rows.push({gi:null,label:'Phase not set'});
  const sMap={none:0,satisfied:1,partial:2,blocked:3,awaiting:0,exception:2};
  let h='<thead><tr><th class="hm-rh" scope="col">Phase</th>'+cols.map(w=>'<th scope="col">'+esc(w)+'</th>').join('')+'</tr></thead><tbody>';
  rows.forEach(r=>{h+='<tr><th scope="row" class="hm-rl">'+esc(r.label)+'</th>';
    cols.forEach(w=>{const c=TE.heatCell(p,r.gi,w);if(r.gi===null)c.deps=deps.filter(d=>(d.phase===null||d.phase===''||d.phase===undefined)&&d.workstream===w),c.state=c.deps.length?c.deps.reduce((m,d)=>((TE.DEP_STATUS[d.status]||{}).rank||0)>((TE.DEP_STATUS[m.status]||{}).rank||0)?d:m).status:'none';
      const lbl=c.state==='none'?'None recorded':TE.depStatusLabel(c.state)+(c.deps.length>1?' ('+c.deps.length+')':'');
      h+='<td><div class="hm-cw"><button type="button" class="hm-cell" data-s="'+sMap[c.state]+'" onclick="trHeatOpen('+(r.gi===null?'null':r.gi)+','+trQ(w)+')" title="'+esc(c.deps.map(d=>d.title).join('; ')||'Add a dependency for this phase and workstream')+'">'+esc(lbl)+'</button></div></td>';});
    h+='</tr>';});
  t.innerHTML=h+'</tbody>';
}
function trHeatOpen(gi,w){const p=trProj();if(!p)return;
  const deps=p.training.dependencies.filter(d=>(gi===null?(d.phase===null||d.phase===''||d.phase===undefined):String(d.phase)===String(gi))&&d.workstream===w);
  if(deps.length===1)return trEditDep(deps[0].id);
  if(deps.length>1){_trDepFilter='all';goPTab('deps');return;}
  if(trCanEdit())trEditDep(null,{phase:gi,workstream:w});}
function cyclePHMCell(){/* retired: the map is derived from dependency records */}

// ════════════ LEARNING DEVELOPMENT ════════════
function trRenderLearnDev(){
  const el=document.getElementById('tr-learndev');const p=trProj();if(!el||!p)return;const t=p.training;
  const sect=(title,sub,btn,body)=>'<section class="panel tr-panel"><div class="panel-hd"><div><div class="pt">'+title+'</div><div class="ps-text">'+sub+'</div></div>'+(trCanEdit()?btn:'')+'</div><div class="pb">'+body+'</div></section>';
  const wf=t.workflows.length?'<div class="dt-wrap"><table class="dt tr-table"><thead><tr><th scope="col">Workflow</th><th scope="col">What changes</th><th scope="col">Audiences</th><th scope="col">Linked work</th><th scope="col"><span class="cc-sr">Actions</span></th></tr></thead><tbody>'+t.workflows.map(w=>{
      const ob=t.objectives.filter(o=>String(o.workflowId)===String(w.id)).length,sc=t.scenarios.filter(s=>String(s.workflowId)===String(w.id)).length;
      return'<tr><td><button type="button" class="tr-rowlink" onclick="trEditWorkflow('+trQ(w.id)+')">'+esc(w.name||'Untitled')+'</button>'+(w.version?'<div class="tr-sub">'+esc(w.version)+'</div>':'')+'</td><td>'+esc(w.change||'—')+'</td><td>'+esc(trAud(p,w.audienceIds).join(', ')||'—')+'</td><td>'+ob+' objective'+(ob===1?'':'s')+' · '+sc+' scenario'+(sc===1?'':'s')+'</td><td>'+(trCanEdit()?trBtn('Record a change','trWorkflowChange('+trQ(w.id)+')'):'')+'</td></tr>';}).join('')+'</tbody></table></div>'
    :trEmpty('No changed workflows yet.','Start with the workflow that changes for people. Objectives, scenarios and materials link to it.');
  const ob=t.objectives.length?'<div class="dt-wrap"><table class="dt tr-table"><thead><tr><th scope="col">Changed task</th><th scope="col">Audience</th><th scope="col">Expected performance</th><th scope="col">Evaluation criteria</th></tr></thead><tbody>'+t.objectives.map(o=>
      '<tr><td><button type="button" class="tr-rowlink" onclick="trEditObjective('+trQ(o.id)+')">'+esc(o.task||'Untitled')+'</button><div class="tr-sub">'+esc(trName(t.workflows,o.workflowId))+'</div></td><td>'+esc(trAud(p,o.audienceIds).join(', ')||'—')+'</td><td>'+esc(o.performance||'—')+'</td><td>'+esc(o.criteria||'—')+'</td></tr>').join('')+'</tbody></table></div>'
    :trEmpty('No learning objectives yet.','Each objective names the audience, the changed task, the expected performance and how it is evaluated.');
  const sc=t.scenarios.length?'<div class="dt-wrap"><table class="dt tr-table"><thead><tr><th scope="col">Scenario</th><th scope="col">QA / UAT evidence</th><th scope="col">Training environment</th><th scope="col">Used by</th></tr></thead><tbody>'+t.scenarios.map(s=>{
      const used=t.deliverables.filter(d=>(d.scenarioIds||[]).map(String).includes(String(s.id)));
      return'<tr><td><button type="button" class="tr-rowlink" onclick="trEditScenario('+trQ(s.id)+')">'+(s.critical?'<span class="tr-crit">Critical</span> ':'')+esc(s.title||'Untitled')+'</button><div class="tr-sub">'+esc(trName(t.workflows,s.workflowId))+'</div></td>'
      +'<td>'+esc(s.qaEvidence||'No QA evidence')+(s.uatEvidence?'<div class="tr-sub">UAT: '+esc(s.uatEvidence)+'</div>':'')+'</td>'
      +'<td>'+(s.needsRevalidation?trChip('revision_required','Needs revalidation')+'<div class="tr-sub">'+esc(s.needsRevalidation.reason)+'</div>':trChip(s.env.status==='pass'?'validated':s.env.status==='fail'?'blocked':'not_assessed',TE.SCEN_ENV[s.env.status]))+(s.env.environment?'<div class="tr-sub">'+esc(s.env.environment)+' · '+trD(s.env.date)+'</div>':'')
      +(trCanEdit()?'<div>'+trBtn('Record a run','trScenarioRun('+trQ(s.id)+')','btn-text')+'</div>':'')+'</td>'
      +'<td>'+esc(used.map(d=>d.title).join(', ')||'—')+'</td></tr>';}).join('')+'</tbody></table></div>'
    :trEmpty('No scenarios yet.','Record the training-critical scenarios, their QA or UAT evidence and whether they run in the learning environment.');
  el.innerHTML='<p class="tr-help tr-lead">Author content in your existing tools. AdoptIQ keeps the links, reviews and the reasons materials need to change.</p>'+trSuggestBox(p,'workflows')+trSuggestBox(p,'scenarios')
    +sect('Changed workflows','What changes for people, and who it affects',trBtn('<i class="ph ph-plus"></i> Add workflow','trEditWorkflow()'),wf)
    +sect('Learning objectives','Audience, changed task, expected performance, evaluation',trBtn('<i class="ph ph-plus"></i> Add objective','trEditObjective()'),ob)
    +sect('Training scenarios','Evidence that each scenario runs where learners will practise',trBtn('<i class="ph ph-plus"></i> Add scenario','trEditScenario()'),sc)
    +sect('Learning deliverables','State, reviews and what each one is waiting on',trBtn('<i class="ph ph-plus"></i> Add deliverable','trEditDeliverable()'),trDelivTable(p));
}
function trDelivTable(p){
  const t=p.training;if(!t.deliverables.length)return trEmpty('No learning deliverables yet.','Job aids, facilitator guides, demonstrations, exercises, simulations and courses. Link each to its objectives and scenarios.');
  return'<div class="dt-wrap"><table class="dt tr-table"><thead><tr><th scope="col">Deliverable</th><th scope="col">State</th><th scope="col">Development</th><th scope="col">Delivery</th><th scope="col">Owner</th></tr></thead><tbody>'+t.deliverables.map(d=>{
    const a=TE.activityStatus(p,d);const dev=a.scenarioDev.ok?trChip(a.scenarioDev.conditional?'conditional':'ready',a.scenarioDev.conditional?'With conditions':'Can proceed'):a.provisional.ok?trChip('conditional','Provisional only'):trChip('blocked','Blocked');
    const del=a.delivery.ok?trChip(a.delivery.conditional?'conditional':'ready',a.delivery.conditional?'With conditions':'Can proceed'):trChip('blocked','Blocked');
    const why=a.delivery.ok?'':'<div class="tr-sub">'+esc(a.delivery.blockers.map(b=>b.text).slice(0,2).join('; '))+'</div>';
    return'<tr><td><button type="button" class="tr-rowlink" onclick="trEditDeliverable('+trQ(d.id)+')">'+(d.critical?'<span class="tr-crit">Critical</span> ':'')+esc(d.title||'Untitled')+'</button><div class="tr-sub">'+esc(TE.DELIV_TYPES[d.type]||'Other')+(d.link?' · <a href="'+esc(d.link)+'" target="_blank" rel="noopener">Open source file</a>':'')+'</div></td>'
      +'<td>'+trChip(d.state,TE.delivStateLabel(d.state))+(d.revisionFlag?'<div class="tr-sub tr-late">Review flagged: '+esc(d.revisionFlag.reason)+'</div>':'')+'</td>'
      +'<td>'+dev+'</td><td>'+del+why+'</td><td>'+esc(d.owner||'—')+'</td></tr>';}).join('')+'</tbody></table></div>';
}
function trEditWorkflow(id,preset){
  const p=trProj();if(!p)return;const t=p.training;const rec=id?TE.byId(t.workflows,id):TE.newWorkflow(preset||{});if(!rec)return;
  const fields=[{k:'name',label:'Workflow',req:true,ph:'e.g. Claims intake'},{k:'change',label:'What changes',type:'textarea',rows:3},{k:'version',label:'Design or release reference',ph:'e.g. FDD v3, R1030'},
    {k:'audienceIds',label:'Affected audiences',type:'multi',opts:trOpts(p.stakeholders||[]),none:'Add stakeholder groups in People & Learning Impacts first.'}];
  trDialog(id?'Changed workflow':'New changed workflow','<div class="tr-form">'+trForm(fields,rec)+'</div>'+(id&&trCanEdit()?'<p><button type="button" class="btn-text tr-danger" onclick="trDeleteRec(\'workflows\','+trQ(id)+')">Delete this workflow</button></p>':''),()=>{
    const v=trCollect(fields,rec);const miss=trMissing(fields,v);if(miss)return miss;
    if(id)Object.assign(rec,v);else{t.workflows.push(Object.assign(rec,v));if(rec.impactGroup)TE.markSuggestion(p,'impact:'+String(rec.impactGroup).toLowerCase(),'added');
      TE.log(p,{type:'workflow',refId:rec.id,text:'Workflow recorded: '+rec.name+(rec.impactGroup?' from the Impact Assessment':'')},trCtx(p));}
    trSaved('Workflow saved.');});
}
function trWorkflowChange(id){
  const p=trProj();if(!p)return;const w=TE.byId(p.training.workflows,id);if(!w)return;
  const fields=[{k:'summary',label:'What changed',type:'textarea',rows:3,req:true,ph:'e.g. New eligibility field added to step 3'},{k:'version',label:'New design or release reference'}];
  trDialog('Record a change to '+w.name,'<p class="tr-help">Recording the change flags the linked scenarios and deliverables for review. Their state is not changed.</p><div class="tr-form">'+trForm(fields,{version:w.version})+'</div>',()=>{
    const v=trCollect(fields,{});if(!v.summary)return'Describe what changed.';if(v.version)w.version=v.version;
    const r=TE.recordWorkflowChange(p,id,v.summary,trCtx(p));const n=r.scenarios.length+r.deliverables.length;
    trSaved(n?n+' linked item'+(n===1?'':'s')+' flagged for review.':'Change recorded. No linked materials to review.');},{saveLabel:'Record change'});
}
function trEditObjective(id){
  const p=trProj();if(!p)return;const t=p.training;const rec=id?TE.byId(t.objectives,id):TE.newObjective();if(!rec)return;
  const fields=[{k:'task',label:'Changed task',req:true,ph:'e.g. Register a household claim with the new eligibility check'},{k:'workflowId',label:'Workflow',type:'select',opts:[['','Not linked']].concat(trOpts(t.workflows))},
    {k:'audienceIds',label:'Audience',type:'multi',opts:trOpts(p.stakeholders||[]),none:'Add stakeholder groups first.'},
    {k:'performance',label:'Expected performance',type:'textarea',rows:2},{k:'criteria',label:'Evaluation criteria',type:'textarea',rows:2,ph:'How you will know they can do it'},
    {k:'support',label:'Learning support required',half:true},{k:'method',label:'Evaluation method',half:true}];
  trDialog(id?'Learning objective':'New learning objective','<div class="tr-form">'+trForm(fields,rec)+'</div>'+(id&&trCanEdit()?'<p><button type="button" class="btn-text tr-danger" onclick="trDeleteRec(\'objectives\','+trQ(id)+')">Delete this objective</button></p>':''),()=>{
    const v=trCollect(fields,rec);const miss=trMissing(fields,v);if(miss)return miss;
    if(id)Object.assign(rec,v);else t.objectives.push(Object.assign(rec,v));trSaved('Objective saved.');});
}
function trEditScenario(id,preset){
  const p=trProj();if(!p)return;const t=p.training;const rec=id?TE.byId(t.scenarios,id):TE.newScenario(preset||{});if(!rec)return;
  const fields=[{k:'title',label:'Scenario',req:true},{k:'critical',label:'Critical: delivery cannot proceed until this is validated',type:'check'},
    {k:'workflowId',label:'Workflow',type:'select',half:true,opts:[['','Not linked']].concat(trOpts(t.workflows))},
    {k:'objectiveIds',label:'Objectives',type:'multi',opts:trOpts(t.objectives,o=>o.task),none:'No objectives yet.'},
    {k:'preconditions',label:'Preconditions',type:'textarea',rows:2},{k:'permissions',label:'Permissions needed',half:true},{k:'data',label:'Data needed',half:true},
    {k:'expected',label:'Expected result',type:'textarea',rows:2},
    {k:'qaEvidence',label:'QA evidence',half:true,ph:'Test case and result'},{k:'uatEvidence',label:'UAT evidence',half:true},
    {k:'limitations',label:'Known limitations or accepted workarounds',type:'textarea',rows:2}];
  const env=rec.env||{};const envLine=id?'<p><strong>Training environment:</strong> '+(rec.needsRevalidation?trChip('revision_required','Needs revalidation')+' '+esc(rec.needsRevalidation.reason):trChip(env.status==='pass'?'validated':env.status==='fail'?'blocked':'not_assessed',TE.SCEN_ENV[env.status]||'Not run'))+(env.environment?' · '+esc(env.environment)+' · '+trD(env.date):'')+'</p>':'';
  trDialog(id?'Scenario':'New scenario',envLine+'<div class="tr-form">'+trForm(fields,rec)+'</div>'+(id&&trCanEdit()?'<p>'+trBtn('Record a run in the training environment','trScenarioRun('+trQ(id)+')','btn-outline btn-sm')+' <button type="button" class="btn-text tr-danger" onclick="trDeleteRec(\'scenarios\','+trQ(id)+')">Delete</button></p>':''),()=>{
    const v=trCollect(fields,rec);const miss=trMissing(fields,v);if(miss)return miss;
    if(id)Object.assign(rec,v);else{t.scenarios.push(Object.assign(rec,v));TE.log(p,{type:'scenario',refId:rec.id,text:'Scenario recorded: '+rec.title+(rec.jiraKey?' (from Jira '+rec.jiraKey+')':'')},trCtx(p));}trSaved('Scenario saved.');});
}
function trScenarioRun(id){
  const p=trProj();if(!p)return;const s=TE.byId(p.training.scenarios,id);if(!s)return;
  const rec={status:s.env.status==='not_run'?'pass':s.env.status,environment:s.env.environment,date:trToday(),by:(window._cc&&_cc.userName)||'',note:''};
  const fields=[{k:'status',label:'Result',type:'select',opts:[['pass','Runs in the training environment'],['fail','Does not run in the training environment'],['not_run','Not run']]},
    {k:'environment',label:'Environment',req:true,half:true,ph:'e.g. TRN-2'},{k:'date',label:'Date',type:'date',half:true,req:true},{k:'by',label:'Run by',half:true},{k:'note',label:'What happened',type:'textarea',rows:2}];
  trDialog('Run: '+s.title,'<p class="tr-help">A passing run in the learning environment is what validates a scenario for practice. QA or UAT results alone do not.</p><div class="tr-form">'+trForm(fields,rec)+'</div>',()=>{
    const v=trCollect(fields,rec);const miss=trMissing(fields,v);if(miss)return miss;TE.recordScenarioRun(p,id,v,trCtx(p));trSaved('Run recorded.');},{saveLabel:'Record run'});
}
function trEditDeliverable(id){
  const p=trProj();if(!p)return;const t=p.training;const rec=id?TE.byId(t.deliverables,id):TE.newDeliverable();if(!rec)return;
  const fields=[{k:'title',label:'Deliverable',req:true},{k:'type',label:'Type',type:'select',half:true,opts:Object.keys(TE.DELIV_TYPES).map(k=>[k,TE.DELIV_TYPES[k]])},
    {k:'state',label:'State',type:'select',half:true,opts:TE.DELIV_ORDER.map(s=>[s,TE.delivStateLabel(s)])},
    {k:'owner',label:'Owner',half:true},{k:'link',label:'Link to the source file',type:'url',half:true,ph:'SharePoint, LMS or authoring tool'},
    {k:'critical',label:'Critical for delivery',type:'check'},{k:'required',label:'Required for this release',type:'check'},
    {k:'objectiveIds',label:'Objectives',type:'multi',opts:trOpts(t.objectives,o=>o.task),none:'No objectives yet.'},
    {k:'scenarioIds',label:'Scenarios',type:'multi',opts:trOpts(t.scenarios),none:'No scenarios yet.'},
    {k:'workflowIds',label:'Workflows',type:'multi',opts:trOpts(t.workflows),none:'No workflows yet.'},
    {k:'audienceIds',label:'Audiences',type:'multi',opts:trOpts(p.stakeholders||[]),none:'No stakeholder groups yet.'},
    {type:'section',label:'Dates'},{k:'planned.start',label:'Planned start',type:'date',half:true},{k:'planned.due',label:'Planned completion',type:'date',half:true},
    {k:'planned.delivery',label:'Planned delivery',type:'date',half:true},{k:'actual.start',label:'Actual start',type:'date',half:true},{k:'actual.done',label:'Actual completion',type:'date',half:true}];
  let extra='';
  if(id){
    const a=TE.activityStatus(p,rec);
    extra='<h3 class="tr-fs">What it is waiting on</h3><ul class="tr-ul">'+TE.GATED_ACTIVITIES.map(k=>{const x=a[k];const l=(TE.ACTIVITIES.find(y=>y.key===k)||{}).label;
      return'<li>'+trChip(x.ok?(x.conditional?'conditional':'ready'):'blocked',x.ok?(x.conditional?'With conditions':'Can proceed'):'Blocked')+' '+esc(l)+(x.blockers.length?': '+esc(x.blockers.map(b=>b.text).join('; ')):'')+(x.conditions.length?': '+esc(x.conditions.map(c=>c.text).join('; ')):'')+'</li>';}).join('')+'</ul>'
      +(rec.revisionFlag?'<p class="tr-flag"><strong>Review flagged '+trD(rec.revisionFlag.date)+':</strong> '+esc(rec.revisionFlag.reason)+(trCanEdit()?' '+trBtn('Mark reviewed, no change needed','trClearFlag('+trQ(id)+')','btn-text'):'')+'</p>':'')
      +'<h3 class="tr-fs">Reviews and approvals</h3>'+(rec.reviews.length?'<ul class="tr-ul">'+rec.reviews.map(r=>'<li>'+trD(r.date)+' · '+esc(r.reviewer||'')+' · '+esc(r.outcome||'')+(r.note?' — '+esc(r.note):'')+'</li>').join('')+'</ul>':'<p class="tr-help">No reviews recorded.</p>')
      +(trCanEdit()?trBtn('Add review','trAddReview('+trQ(id)+')','btn-text'):'')
      +'<h3 class="tr-fs">Revision history</h3>'+(rec.revisions.length?'<ul class="tr-ul">'+rec.revisions.map(r=>'<li>'+trD(r.date)+' · '+esc(r.what)+(r.why?' (why: '+esc(r.why)+')':'')+(r.by?' · '+esc(r.by):'')+(r.approval?' · '+esc(r.approval):'')+'</li>').join('')+'</ul>':'<p class="tr-help">No revisions recorded.</p>')
      +(trCanEdit()?trBtn('Add revision','trAddRevision('+trQ(id)+')','btn-text')+' <button type="button" class="btn-text tr-danger" onclick="trDeleteRec(\'deliverables\','+trQ(id)+')">Delete</button>':'');
  }
  trDialog(id?'Learning deliverable':'New learning deliverable','<div class="tr-form">'+trForm(fields,rec)+'</div>'+extra,()=>{
    const v=trCollect(fields,rec);const miss=trMissing(fields,v);if(miss)return miss;
    const newState=v.state;v.state=rec.state;
    if(id){Object.assign(rec,v);if(newState!==rec.state)TE.setDeliverableState(p,id,newState,trCtx(p));}
    else{Object.assign(rec,v,{state:newState});t.deliverables.push(rec);TE.log(p,{type:'deliverable',refId:rec.id,text:'Deliverable recorded: '+rec.title+' ('+TE.delivStateLabel(newState)+')'},trCtx(p));}
    trSaved('Deliverable saved.');});
}
function trClearFlag(id){const p=trProj();if(!p||!trCanEdit())return;const d=TE.byId(p.training.deliverables,id);if(!d)return;
  TE.log(p,{type:'deliverable',refId:id,text:d.title+': review completed, no change needed ('+(d.revisionFlag?d.revisionFlag.reason:'')+')'},trCtx(p));d.revisionFlag=null;trCloseDialog();trSaved('Flag cleared.');}
function trAddReview(id){
  const p=trProj();if(!p)return;const d=TE.byId(p.training.deliverables,id);if(!d)return;
  const fields=[{k:'reviewer',label:'Reviewer',req:true,half:true},{k:'date',label:'Date',type:'date',req:true,half:true},{k:'outcome',label:'Outcome',type:'select',opts:[['Approved','Approved'],['Approved with changes','Approved with changes'],['Changes required','Changes required'],['Comments only','Comments only']]},{k:'note',label:'Notes',type:'textarea',rows:2}];
  trDialog('Review: '+d.title,'<div class="tr-form">'+trForm(fields,{date:trToday()})+'</div>',()=>{const v=trCollect(fields,{});const m=trMissing(fields,v);if(m)return m;d.reviews.push(v);
    TE.log(p,{type:'review',refId:id,text:d.title+': review by '+v.reviewer+' — '+v.outcome},trCtx(p));trSaved('Review recorded.');},{saveLabel:'Add review'});
}
function trAddRevision(id){
  const p=trProj();if(!p)return;const d=TE.byId(p.training.deliverables,id);if(!d)return;
  const fields=[{k:'what',label:'What changed',req:true},{k:'why',label:'Why',ph:d.revisionFlag?d.revisionFlag.reason:''},{k:'by',label:'By',half:true},{k:'date',label:'Date',type:'date',half:true,req:true},{k:'approval',label:'Approval status',ph:'e.g. Awaiting SME approval'}];
  trDialog('Revision: '+d.title,'<div class="tr-form">'+trForm(fields,{date:trToday(),why:d.revisionFlag?d.revisionFlag.reason:''})+'</div>',()=>{const v=trCollect(fields,{});const m=trMissing(fields,v);if(m)return m;d.revisions.push(v);
    TE.log(p,{type:'revision',refId:id,text:d.title+': revised — '+v.what},trCtx(p));trSaved('Revision recorded.');},{saveLabel:'Add revision'});
}

// ════════════ READINESS & GATES ════════════
function trRenderReadiness(){
  const el=document.getElementById('tr-readiness');const p=trProj();if(!el||!p)return;const m=TE.measures(p,trCtx(p));
  const card=x=>'<button type="button" class="tr-mcard" onclick="trExplain('+trQ(x.key)+')"><span class="tr-mcard-l">'+esc(x.label)+'</span><span class="tr-mcard-v">'+(x.key!=='delivery'&&x.value!==null&&x.value!==undefined?x.value+'%':'')+' '+(x.state==='assessed'?'':trChip(x.state))+'</span><span class="tr-mcard-s">'+esc(x.detail||'')+'</span><span class="tr-mcard-d">'+esc(x.definition)+'</span></button>';
  const dims=getActiveDims();const rated=p.adkarRated||[];
  const adk='<div class="tr-adkar">'+dims.map(d=>{const r=rated.includes(d.key);const v=r?+(p.adkarScores||{})[d.key]:null;
    return'<div class="tr-adk'+(v!==null&&v<=2?' low':'')+'"><span class="tr-adk-l">'+esc(d.word)+'</span><span class="tr-adk-v">'+(v===null?'Not assessed':v+'/5')+'</span></div>';}).join('')+'</div>';
  const cps=TE.CHECKPOINTS.map(c=>{const s=TE.checkpointState(p,c.key);const r=s.rec;
    return'<tr><td><button type="button" class="tr-rowlink" onclick="trEditCheckpoint('+trQ(c.key)+')">'+esc(c.label)+'</button><div class="tr-sub">'+esc(c.sub)+'</div></td>'
      +'<td>'+s.assessed+' of '+s.applicable+' assessed'+(s.red?'<div class="tr-sub tr-late">'+s.red+' not met</div>':'')+(s.amber?'<div class="tr-sub">'+s.amber+' partial</div>':'')+'</td>'
      +'<td>'+trChip(s.state)+'</td><td>'+esc(TE.DECISIONS[r.decision||'']||'Not recorded')+(r.conditions?'<div class="tr-sub">Conditions: '+esc(r.conditions)+'</div>':'')+'</td>'
      +'<td>'+esc(r.reviewer||'—')+'<div class="tr-sub">'+trD(r.date)+'</div></td></tr>';}).join('');
  el.innerHTML='<p class="tr-help tr-lead">Seven separate measures. None of them is a blended score, and a critical unmet condition always sets delivery readiness to Blocked.</p>'
    +'<div class="tr-mgrid">'+['coverage','input','material','delivery','ability','adoption','evidence'].map(k=>card(m[k])).join('')+'</div>'
    +'<section class="panel tr-panel"><div class="panel-hd"><div><div class="pt">Checkpoints</div><div class="ps-text">Each checkpoint records evidence, reviewer, conditions, exceptions and the decision. Criteria are scored in the Gate Tracker.</div></div>'+trBtn('Open criteria','goPTab(\'gates\')','btn-outline btn-sm dz-keep')+'</div><div class="pb"><div class="dt-wrap"><table class="dt tr-table"><thead><tr><th scope="col">Checkpoint</th><th scope="col">Criteria</th><th scope="col">State</th><th scope="col">Decision</th><th scope="col">Reviewer</th></tr></thead><tbody>'+cps+'</tbody></table></div></div></section>'
    +'<section class="panel tr-panel"><div class="panel-hd"><div><div class="pt">'+esc(fwName())+' by dimension</div><div class="ps-text">Shown dimension by dimension so an average cannot hide a low Ability score. Unrated dimensions are shown as not assessed.</div></div>'+trBtn('Open assessment','goPTab(\'adkar\')','btn-outline btn-sm dz-keep')+'</div><div class="pb">'+adk+'</div></section>';
}
function trEditCheckpoint(key){
  const p=trProj();if(!p)return;const t=p.training;const s=TE.checkpointState(p,key);const rec=Object.assign({decision:'',reviewer:'',date:'',evidence:'',conditions:'',exceptions:'',notes:'',authority:''},t.checkpoints[key]||{});
  const fields=[{k:'decision',label:'Decision',type:'select',opts:Object.keys(TE.DECISIONS).map(k=>[k,TE.DECISIONS[k]])},{k:'reviewer',label:'Reviewer',half:true},{k:'date',label:'Assessment date',type:'date',half:true},
    {k:'evidence',label:'Evidence reviewed',type:'textarea',rows:2},{k:'conditions',label:'Conditions',type:'textarea',rows:2},{k:'exceptions',label:'Exceptions',type:'textarea',rows:2},{k:'notes',label:'Notes',type:'textarea',rows:2}]
    .concat(key==='governance'?[{k:'authority',label:'Decision authority',ph:'e.g. DCAS leadership at Go/No-Go'}]:[]);
  const flags=getProjFlags(p).filter(f=>s.cp.legacy.includes(f.key));
  const acts=TE.openActions(p).filter(a=>a.source&&a.source.type==='gate'&&s.cp.legacy.includes(String(a.source.id)));
  const body='<p class="tr-help">'+esc(s.cp.sub)+'. Criteria: '+s.assessed+' of '+s.applicable+' assessed.</p>'
    +(flags.length?'<h3 class="tr-fs">Criteria not met</h3><ul class="tr-ul">'+flags.map(f=>'<li>'+esc(f.item)+'<div class="tr-sub">'+esc(f.consequence)+'</div></li>').join('')+'</ul>':'')
    +(acts.length?'<h3 class="tr-fs">Outstanding actions</h3><ul class="tr-ul">'+acts.map(a=>'<li>'+esc(a.title)+' · '+esc(a.owner||'No owner')+' · '+trD(a.due)+'</li>').join('')+'</ul>':'')
    +'<div class="tr-form">'+trForm(fields,rec)+'</div>';
  trDialog(s.cp.label,body,()=>{const v=trCollect(fields,rec);t.checkpoints[key]=v;
    TE.log(p,{type:'checkpoint',refId:key,text:s.cp.label+': '+(TE.DECISIONS[v.decision]||'decision cleared')+(v.reviewer?' ('+v.reviewer+')':'')},trCtx(p));trSaved('Checkpoint saved.');});
}

// ════════════ ACTIONS & RISKS ════════════
function trRenderActions(){
  const el=document.getElementById('tr-actions');const p=trProj();if(!el||!p)return;const t=p.training;
  const src=a=>{const s=a.source||{};if(s.type==='gate'){const f=getProjFlags(p).find(x=>x.key===s.id);return'Checkpoint criterion'+(f?': '+f.item:'');}
    if(s.type==='dependency')return'Dependency: '+trName(t.dependencies,s.id);if(s.type==='craid'){const c=(p.craid||[]).find(x=>String(x.id)===String(s.id));return'CRAID: '+(c?(c.title||c.description||''):'entry');}return'Recorded directly';};
  const open=t.actions.filter(a=>a.status!=='done').sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999'))),done=t.actions.filter(a=>a.status==='done');
  const craidOpen=(p.craid||[]).filter(c=>(c.type==='issue'||c.type==='risk')&&!/closed|mitigated|invalidated/i.test(c.status||'')&&!t.actions.some(a=>a.source&&a.source.type==='craid'&&String(a.source.id)===String(c.id)));
  const row=a=>'<tr><td><button type="button" class="tr-rowlink" onclick="trEditAction('+trQ(a.id)+')">'+esc(a.title||'Untitled')+'</button><div class="tr-sub">'+esc(src(a))+'</div></td><td>'+esc(a.owner||'No owner')+'</td><td class="mono'+(a.due&&a.status!=='done'&&trToday()>a.due?' tr-late':'')+'">'+trD(a.due)+'</td><td>'+(a.status==='done'?trChip('ready','Done'):trChip('awaiting','Open'))+'</td><td>'+(trCanEdit()?trBtn(a.status==='done'?'Reopen':'Mark done','trToggleAction('+trQ(a.id)+')','btn-text'):'')+'</td></tr>';
  el.innerHTML='<p class="tr-help tr-lead">One record per piece of work. A checkpoint criterion marked not met, a dependency’s next action or a CRAID entry each create a single action, shown wherever it is relevant.</p>'
    +'<div class="tr-bar"><span></span>'+(trCanEdit()?trBtn('<i class="ph ph-plus"></i> Add action','trEditAction()','btn-primary btn-sm'):'')+'</div>'
    +(open.length?'<div class="dt-wrap"><table class="dt tr-table"><thead><tr><th scope="col">Action</th><th scope="col">Owner</th><th scope="col">Due</th><th scope="col">Status</th><th scope="col"><span class="cc-sr">Change status</span></th></tr></thead><tbody>'+open.map(row).join('')+'</tbody></table></div>':trEmpty('No open actions.','Actions appear here when a criterion is not met, a dependency has a next action, or you add one.'))
    +(craidOpen.length?'<section class="panel tr-panel"><div class="panel-hd"><div><div class="pt">Open CRAID risks and issues without an action</div><div class="ps-text">Create an action to assign an owner and date; the entry stays in the CRAID log.</div></div>'+trBtn('Open CRAID log','goPTab(\'craid\')','btn-outline btn-sm dz-keep')+'</div><div class="pb"><ul class="tr-ul">'+craidOpen.map(c=>'<li><strong>'+esc((c.type||'').toUpperCase())+'</strong> '+esc(c.title||c.description||'Untitled')+(trCanEdit()?' '+trBtn('Create action','trActionFromCraid('+trQ(c.id)+')','btn-text'):'')+'</li>').join('')+'</ul></div></section>':'')
    +(done.length?'<details class="tr-done"><summary>Completed actions ('+done.length+')</summary><div class="dt-wrap"><table class="dt tr-table"><tbody>'+done.map(row).join('')+'</tbody></table></div></details>':'');
}
function trEditAction(id,preset){
  const p=trProj();if(!p)return;const t=p.training;const rec=id?TE.byId(t.actions,id):Object.assign({id:TE.id(),title:'',owner:'',due:'',status:'open',source:{type:'manual',id:''},created:trToday()},preset||{});if(!rec)return;
  const fields=[{k:'title',label:'Action',req:true},{k:'owner',label:'Owner',half:true},{k:'due',label:'Due',type:'date',half:true},{k:'status',label:'Status',type:'select',opts:[['open','Open'],['done','Done']]}];
  trDialog(id?'Action':'New action','<div class="tr-form">'+trForm(fields,rec)+'</div>',()=>{const v=trCollect(fields,rec);const m=trMissing(fields,v);if(m)return m;
    if(id)Object.assign(rec,v);else t.actions.push(Object.assign(rec,v));TE.log(p,{type:'action',refId:rec.id,text:'Action '+(id?'updated':'added')+': '+rec.title},trCtx(p));trSaved('Action saved.');});
}
function trToggleAction(id){const p=trProj();if(!p||!trCanEdit())return;const a=TE.byId(p.training.actions,id);if(!a)return;a.status=a.status==='done'?'open':'done';a.closed=a.status==='done'?trToday():'';
  TE.log(p,{type:'action',refId:id,text:'Action '+(a.status==='done'?'completed':'reopened')+': '+a.title},trCtx(p));trSaved();}
function trActionFromCraid(cid){const p=trProj();if(!p)return;const c=(p.craid||[]).find(x=>String(x.id)===String(cid));if(!c)return;
  trEditAction(null,{title:'Resolve: '+(c.title||c.description||'CRAID entry'),owner:c.owner||'',due:c.dueDate||c.due||'',source:{type:'craid',id:c.id}});}
// Gate criterion marked not met → one action (called from the gate tracker).
function trGateChanged(key,state){
  const p=getProj();if(!p||isReadOnly)return;TE.migrate(p,trCtx(p));
  if(state==='red'){const f=getProjFlags(p).find(x=>x.key===key);TE.ensureAction(p,{type:'gate',id:key},{title:'Resolve: '+(f?f.item:key)},trCtx(p));}
}

// ════════════ DELIVERY MILESTONES ════════════
function trRenderMilestones(){
  const el=document.getElementById('tr-milestones');const p=trProj();if(!el||!p)return;const t=p.training;const ms=TE.milestones(p,trCtx(p));
  const head=TE.GATED_ACTIVITIES.map(k=>'<th scope="col">'+esc((TE.ACTIVITIES.find(x=>x.key===k)||{}).label)+'</th>').join('');
  const cell=a=>'<td title="'+esc(a.blockers.map(b=>b.text).join('; '))+'">'+trChip(a.ok?(a.conditional?'conditional':'ready'):'blocked',a.ok?(a.conditional?'Conditions':'Can start'):'Blocked')+(a.ok?'':'<div class="tr-sub">'+esc(a.blockers.map(b=>b.text).slice(0,1).join(''))+'</div>')+'</td>';
  const rules=t.entryRules||TE.defaultEntryRules();
  el.innerHTML='<p class="tr-help tr-lead">Each deliverable moves through these activities on its own schedule. A blocked exercise does not hold up unrelated materials, and development can proceed while delivery waits.</p>'
    +(ms.risks.length?'<div class="tr-flag" role="status"><strong>Proposed schedule changes for your review</strong><ul class="tr-ul">'+ms.risks.map(r=>'<li>'+esc(r.text)+'</li>').join('')+'</ul></div>':'')
    +(ms.rows.length?'<div class="dt-wrap"><table class="dt tr-table tr-ms"><thead><tr><th scope="col">Deliverable</th>'+head+'<th scope="col">Planned</th><th scope="col">Actual</th></tr></thead><tbody>'+ms.rows.map(r=>
      '<tr><td><button type="button" class="tr-rowlink" onclick="trEditDeliverable('+trQ(r.d.id)+')">'+esc(r.d.title)+'</button><div class="tr-sub">'+trChip(r.d.state,TE.delivStateLabel(r.d.state))+'</div></td>'+r.acts.map(cell).join('')
      +'<td class="mono">'+(r.planned.start?'Start '+trD(r.planned.start)+'<br>':'')+(r.planned.due?'Done '+trD(r.planned.due)+'<br>':'')+(r.planned.delivery?'Deliver '+trD(r.planned.delivery):'')+(r.planned.start||r.planned.due||r.planned.delivery?'':'—')+(r.late?'<div class="tr-sub tr-late">Past planned completion</div>':'')+'</td>'
      +'<td class="mono">'+(r.actual.start?'Started '+trD(r.actual.start)+'<br>':'')+(r.actual.done?'Done '+trD(r.actual.done):'')+(r.actual.start||r.actual.done?'':'—')+'</td></tr>').join('')+'</tbody></table></div>'
      :trEmpty('No deliverables to schedule yet.','Add learning deliverables in Learning Development to see what can start now.'))
    +'<section class="panel tr-panel"><div class="panel-hd"><div><div class="pt">Entry conditions</div><div class="ps-text">Suggested defaults. Turn rules on or off to match your governance; none of them is an SOP requirement unless your governance makes it one.</div></div></div><div class="pb">'
    +TE.GATED_ACTIVITIES.map(k=>'<div class="tr-rules"><h3 class="tr-fs">'+esc((TE.ACTIVITIES.find(x=>x.key===k)||{}).label)+'</h3>'+((rules[k]||[]).length?(rules[k]||[]).map(r=>'<label class="tr-opt"><input type="checkbox" '+(r.enabled!==false?'checked':'')+(trCanEdit()?'':' disabled')+' onchange="trToggleRule('+trQ(k)+','+trQ(r.id)+',this.checked)"> '+esc(r.label)+'</label>').join(''):'<p class="tr-help">No entry rules. Linked dependencies still apply.</p>')+'</div>').join('')
    +'<p class="tr-help">Linked dependencies always apply: an unresolved dependency blocks only the activities it does not permit, and only for the work linked to it.</p></div></section>';
}
function trToggleRule(act,rid,on){const p=trProj();if(!p||!trCanEdit())return;const r=(p.training.entryRules[act]||[]).find(x=>x.id===rid);if(!r)return;r.enabled=!!on;
  TE.log(p,{type:'rule',text:'Entry condition '+(on?'enabled':'disabled')+': '+r.label},trCtx(p));trSaved();}

// ════════════ ADOPTION OUTCOMES ════════════
function trRenderOutcomes(){
  const el=document.getElementById('tr-outcomes');const p=trProj();if(!el||!p)return;const o=p.training.outcomes;const gl=projGoLive(p);const launched=gl&&trToday()>=gl;
  const obsFor=id=>o.observations.filter(x=>String(x.measureId)===String(id)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const mrow=m=>{const ob=obsFor(m.id);const last=ob[ob.length-1];
    const met=last&&m.target!==''&&!isNaN(+m.target)?(m.direction==='down'?+last.value<=+m.target:+last.value>=+m.target):null;
    return'<tr><td><button type="button" class="tr-rowlink" onclick="trEditMeasure('+trQ(m.id)+')">'+esc(m.name)+'</button><div class="tr-sub">'+esc(TE.MEASURE_KINDS[m.kind]||m.kind)+(m.audienceIds&&m.audienceIds.length?' · '+esc(trAud(p,m.audienceIds).join(', ')):'')+'</div></td>'
      +'<td class="mono">'+(m.baseline!==''?esc(m.baseline)+esc(m.unit||''):'Not set')+'</td><td class="mono">'+(m.target!==''?(m.direction==='down'?'≤ ':'≥ ')+esc(m.target)+esc(m.unit||''):'Not set')+'</td>'
      +'<td>'+(m.window&&(m.window.start||m.window.end)?trD(m.window.start)+' – '+trD(m.window.end):'Not set')+'</td>'
      +'<td>'+(last?'<span class="mono">'+esc(last.value)+esc(m.unit||'')+'</span> '+(met===null?'':trChip(met?'ready':'conditional',met?'At target':'Below target'))+'<div class="tr-sub">'+trD(last.date)+(last.n?' · n='+esc(last.n):'')+' · '+ob.length+' observation'+(ob.length===1?'':'s')+'</div>':'<span class="tr-sub">No observations</span>')+'</td>'
      +'<td>'+(trCanEdit()?trBtn('Record observation','trAddObservation('+trQ(m.id)+')','btn-text'):'')+'</td></tr>';};
  const dg=o.diagnoses.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  el.innerHTML='<p class="tr-help tr-lead">Define each measure, its baseline, target and measurement window before launch. Observations are recorded separately after launch. Perceptions, learning results and observed work performance are kept distinct.</p>'
    +(launched?'':'<p class="tr-flag">Go-live '+(gl?'is '+trD(gl):'is not set')+'. Set measures now; observations start after launch.</p>')
    +'<section class="panel tr-panel"><div class="panel-hd"><div><div class="pt">Outcome measures</div><div class="ps-text">What will show whether performance holds</div></div>'+(trCanEdit()?trBtn('<i class="ph ph-plus"></i> Add measure','trEditMeasure()','btn-primary btn-sm'):'')+'</div><div class="pb">'
    +(o.measures.length?'<div class="dt-wrap"><table class="dt tr-table"><thead><tr><th scope="col">Measure</th><th scope="col">Baseline</th><th scope="col">Target</th><th scope="col">Window</th><th scope="col">Latest observation</th><th scope="col"><span class="cc-sr">Record</span></th></tr></thead><tbody>'+o.measures.map(mrow).join('')+'</tbody></table></div>'
      :trEmpty('No outcome measures yet.','Example: claim-registration error rate for Intake Specialists, baseline 9%, target 4% or lower, weeks 2–6 after go-live.'))+'</div></section>'
    +'<section class="panel tr-panel"><div class="panel-hd"><div><div class="pt">Adoption diagnosis</div><div class="ps-text">Record every contributing cause. Training is suggested only where the cause is knowledge, ability or practice.</div></div>'+(trCanEdit()?trBtn('<i class="ph ph-plus"></i> Add diagnosis','trEditDiagnosis()','btn-outline btn-sm'):'')+'</div><div class="pb">'
    +(dg.length?'<ul class="tr-ul tr-diag">'+dg.map(d=>{const train=d.causes.some(c=>TE.TRAINING_CAUSES.includes(c));const other=d.causes.filter(c=>!TE.TRAINING_CAUSES.includes(c));
      return'<li><strong>'+esc(trAud(p,d.audienceIds||[]).join(', ')||'All audiences')+'</strong> · '+trD(d.date)+'<div>'+d.causes.map(c=>'<span class="chip">'+esc(TE.CAUSES[c]||c)+'</span>').join(' ')+'</div>'+(d.note?'<div class="tr-sub">'+esc(d.note)+'</div>':'')
        +'<div class="tr-sub">'+(train?'Training can address part of this.':'')+(other.length?' Other owners are needed for: '+esc(other.map(c=>TE.CAUSES[c]).join(', '))+'.':'')+'</div></li>';}).join('')+'</ul>'
      :trEmpty('No diagnoses recorded.','When a measure falls short, record why. More than one cause can apply.'))+'</div></section>';
}
function trEditMeasure(id){
  const p=trProj();if(!p)return;const o=p.training.outcomes;const rec=id?TE.byId(o.measures,id):{id:TE.id(),name:'',kind:'performance',audienceIds:[],baseline:'',target:'',unit:'',direction:'up',window:{start:'',end:''},source:''};if(!rec)return;
  const fields=[{k:'name',label:'Measure',req:true,ph:'e.g. Claims registered without rework'},{k:'kind',label:'Type',type:'select',half:true,opts:Object.keys(TE.MEASURE_KINDS).map(k=>[k,TE.MEASURE_KINDS[k]])},
    {k:'direction',label:'Better is',type:'select',half:true,opts:[['up','Higher'],['down','Lower']]},{k:'baseline',label:'Baseline',half:true},{k:'target',label:'Target',half:true},{k:'unit',label:'Unit',half:true,ph:'%, minutes, count'},
    {k:'source',label:'Data source',half:true},{k:'window.start',label:'Window starts',type:'date',half:true},{k:'window.end',label:'Window ends',type:'date',half:true},
    {k:'audienceIds',label:'Audiences',type:'multi',opts:trOpts(p.stakeholders||[]),none:'No stakeholder groups yet.'}];
  trDialog(id?'Outcome measure':'New outcome measure','<div class="tr-form">'+trForm(fields,rec)+'</div>',()=>{const v=trCollect(fields,rec);const m=trMissing(fields,v);if(m)return m;
    if(id)Object.assign(rec,v);else{o.measures.push(Object.assign(rec,v));TE.log(p,{type:'measure',refId:rec.id,text:'Outcome measure defined: '+rec.name},trCtx(p));}trSaved('Measure saved.');});
}
function trAddObservation(mid){
  const p=trProj();if(!p)return;const o=p.training.outcomes;const m=TE.byId(o.measures,mid);if(!m)return;
  const fields=[{k:'value',label:'Value'+(m.unit?' ('+m.unit+')':''),req:true,half:true},{k:'date',label:'Date',type:'date',req:true,half:true},{k:'n',label:'Sample size',half:true},{k:'evidence',label:'Evidence or source',half:true},{k:'note',label:'Note',type:'textarea',rows:2}];
  trDialog('Observation: '+m.name,'<div class="tr-form">'+trForm(fields,{date:trToday()})+'</div>',()=>{const v=trCollect(fields,{});const e=trMissing(fields,v);if(e)return e;if(isNaN(+v.value))return'Value must be a number.';
    o.observations.push(Object.assign({id:TE.id(),measureId:m.id},v,{value:+v.value}));TE.log(p,{type:'observation',refId:m.id,text:m.name+': '+v.value+(m.unit||'')+' observed'},trCtx(p));trSaved('Observation recorded.');},{saveLabel:'Record'});
}
function trEditDiagnosis(){
  const p=trProj();if(!p)return;const o=p.training.outcomes;
  const fields=[{k:'audienceIds',label:'Audiences',type:'multi',opts:trOpts(p.stakeholders||[]),none:'No stakeholder groups yet.'},{k:'causes',label:'Contributing causes',type:'multi',opts:Object.keys(TE.CAUSES).map(k=>[k,TE.CAUSES[k]])},
    {k:'date',label:'Date',type:'date',half:true,req:true},{k:'note',label:'What you observed',type:'textarea',rows:3}];
  trDialog('New adoption diagnosis','<div class="tr-form">'+trForm(fields,{date:trToday(),causes:[]})+'</div>',()=>{const v=trCollect(fields,{});const e=trMissing(fields,v);if(e)return e;if(!v.causes.length)return'Choose at least one cause, or “Cause not yet established”.';
    o.diagnoses.push(Object.assign({id:TE.id()},v));TE.log(p,{type:'diagnosis',text:'Adoption diagnosis recorded: '+v.causes.map(c=>TE.CAUSES[c]).join(', ')},trCtx(p));trSaved('Diagnosis recorded.');});
}

// ════════════ PROJECT NAVIGATION (eight tabs) ════════════
// Every existing tab is kept; it now lives under one of eight primary tabs.
const TR_GROUPS=[
  {key:'brief',label:'Overview & Decision Brief',tabs:['overview','lifecycle']},
  {key:'people',label:'People & Learning Impacts',tabs:['impact','adoption']},
  {key:'deps',label:'Dependencies & Evidence',tabs:['deps','heatmap','gaps']},
  {key:'learn',label:'Learning Development',tabs:['learndev']},
  {key:'ready',label:'Readiness & Gates',tabs:['readiness','gates','adkar','adopthm']},
  {key:'actions',label:'Actions & Risks',tabs:['actions','flags','craid']},
  {key:'delivery',label:'Delivery & Capacity',tabs:['milestones','trainplan','resources']},
  {key:'adoption',label:'Adoption & Sustainment',tabs:['postlaunch','pulse','sustain']}
];
function trGroupOf(tab){return TR_GROUPS.find(g=>g.tabs.includes(tab))||TR_GROUPS[0];}
function trSyncNav(tab){
  const g=trGroupOf(tab);
  document.querySelectorAll('#proj-groups .pg-btn').forEach(b=>{const on=b.dataset.group===g.key;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');});
  let shown=0;
  document.querySelectorAll('#proj-nav-tabs .nav-btn').forEach(b=>{const m=(b.getAttribute('onclick')||'').match(/showProjTab\('(\w+)'/);const inG=m&&g.tabs.includes(m[1]);
    b.classList.toggle('pg-out',!inG);if(inG&&!b.classList.contains('pilot-hidden'))shown++;});
  const row=document.getElementById('proj-nav-tabs');if(row)row.classList.toggle('pg-single',shown<=1);
  // Hide a primary tab when pilot view hides every view inside it.
  document.querySelectorAll('#proj-groups .pg-btn').forEach(btn=>{const gr=TR_GROUPS.find(x=>x.key===btn.dataset.group);
    const vis=gr&&gr.tabs.some(t=>{const nb=document.querySelector('#proj-nav-tabs .nav-btn[onclick*="\''+t+'\'"]');return nb&&!nb.classList.contains('pilot-hidden');});
    btn.hidden=!vis;});
}
function showPGroup(key){const g=TR_GROUPS.find(x=>x.key===key);if(!g)return;
  const first=g.tabs.map(t=>document.querySelector('#proj-nav-tabs .nav-btn[onclick*="\''+t+'\'"]')).find(b=>b&&!b.classList.contains('pilot-hidden'))||document.querySelector('#proj-nav-tabs .nav-btn[onclick*="\''+g.tabs[0]+'\'"]');
  if(first)first.click();}
function trTabRendered(id){
  trSyncNav(id);
  if(id==='deps')trRenderDeps();if(id==='learndev')trRenderLearnDev();if(id==='readiness')trRenderReadiness();if(id==='actions')trRenderActions();
  if(id==='milestones')trRenderMilestones();if(id==='postlaunch')trRenderOutcomes();if(id==='heatmap')renderPDepHM();
}
