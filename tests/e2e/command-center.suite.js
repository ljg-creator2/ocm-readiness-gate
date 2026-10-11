// Command Center figures, search, sidebar sections, alerts and view-only behaviour.
'use strict';
module.exports=async function(t){
  const pg=await t.page({vp:{width:1440,height:900},wait:2000});
  await pg.evaluate(()=>landingToDemo());await t.wait(2500);
  const R=await pg.evaluate(async()=>{const R=[];const ok=(n,c,d)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' → '+d));
    const k=ccKpis();const vals=[...document.querySelectorAll('.cc-kpi-v')].map(e=>e.textContent.trim());
    const act=ccProjects().filter(x=>ccActive(x.p));
    ok('Active Initiatives = active projects',vals[0]===String(act.length),vals[0]+' vs '+act.length);
    {const d=ccDeliveryReadiness(act);ok('Delivery readiness KPI = engine counts',vals[1]===(d.assessed?d.ready+' of '+d.assessed:'—'),vals[1]);}
    ok('At-Risk = active projects not On Track',vals[2]===String(act.filter(x=>projRAG(x.p,projGoLive(x.p)).rag!=='green').length),vals[2]);
    ok('Initiatives brief labels gate completion as legacy',(()=>{sbNav('initiatives');const v=document.querySelector('#port-brief .erb-metric-l')?.textContent;sbNav('command');return /Gate completion/.test(v||'');})(),'label');
    const ms=ccMilestones();ok('Milestones sorted and on/after today',ms.every((m,i)=>i===0||ms[i-1].iso<=m.iso)&&ms.every(m=>m.iso>=new Date().toISOString().slice(0,10)),JSON.stringify(ms.slice(0,3)));
    const golives=releases.map(r=>r.golive).filter(d=>d>=new Date().toISOString().slice(0,10));
    ok('Every upcoming release go-live is a milestone',golives.every(g=>ms.some(m=>m.iso===g&&m.kind==='golive')),golives);
    const av=ccActivity();ok('Activity newest first, none in the future',av.every((a,i)=>i===0||new Date(av[i-1].t)>=new Date(a.t))&&av.every(a=>new Date(a.t)<=Date.now()+60000),'order');
    ccSearch('a');const all=ccProjects();let reach=true;all.forEach(({p})=>{ccSearch(p.name.slice(0,6));if(![...document.querySelectorAll('#cc-results button')].some(b=>b.textContent.includes(p.name)))reach=false;});ok('Search reaches every initiative',reach,'missing');ccSearch('');
    const secs=['initiatives','people','risk','training','stakeholders','adoption','reports','command'];let sv=true;secs.forEach(k=>{sbNav(k);const pg=document.getElementById('v-portfolio').dataset.page;const cur=document.querySelector('.sb-item[aria-current]')?.dataset.sb;if(cur!==k)sv=false;if(k==='command'&&pg!=='command')sv=false;if(k==='initiatives'&&pg!=='initiatives')sv=false;if(!['command','initiatives'].includes(k)&&(pg!=='section'||!document.querySelector('#pf-section .sx-h')))sv=false;});ok('Sidebar opens every section',sv,'nav');
    // Sidebar → project tab
    sbNav('risk');const btn=[...document.querySelectorAll('#pf-section button')].find(b=>b.textContent==='CRAID Log');btn.click();await new Promise(r=>setTimeout(r,500));
    ok('Section index opens the project tab',document.getElementById('v-project').classList.contains('active')&&document.querySelector('#proj-nav-tabs .nav-btn.active')?.textContent.includes('CRAID'),document.querySelector('#proj-nav-tabs .nav-btn.active')?.textContent);
    ok('Sidebar visible on project page',document.body.classList.contains('app-shell')&&getComputedStyle(document.getElementById('app-sidebar')).display!=='none','shell');
    sbNav('command');ok('Back to Command Center from project',document.getElementById('v-portfolio').classList.contains('active')&&document.getElementById('v-portfolio').dataset.page==='command','back');
    ok('Bell count = alerts',(document.querySelector('.cc-dot')?.textContent||'0')===String((window._ccAlerts||[]).length),'bell');
    ok('Exactly six Command Center parts',document.querySelectorAll('#cc .cc-kpi').length===4&&document.querySelectorAll('#cc .cc-card').length===4&&!!document.querySelector('#cc .cc-greet')&&!!document.querySelector('#cc .cc-hd'),'parts');
    // view-only
    isReadOnly=true;document.body.classList.add('readonly-mode');renderPortfolio();await new Promise(r=>setTimeout(r,500));applyReadOnlyRestrictions();
    ok('View-only: sidebar nav still works',(()=>{sbNav('risk');return document.getElementById('v-portfolio').dataset.page==='section';})(),'ro');
    isReadOnly=false;document.body.classList.remove('readonly-mode');
    // landing has no sidebar
    document.getElementById('v-portfolio').classList.remove('active');showLanding();await new Promise(r=>setTimeout(r,100));
    ok('No sidebar on landing',!document.body.classList.contains('app-shell'),'shell on landing');
    return R;});
  R.forEach(x=>{const pass=x.startsWith('PASS ');const m=x.slice(5).split(' → ');t.ok('Command Center',m[0],pass,m[1]);});
  t.ok('Command Center','No JS errors',pg._errs.length===0,pg._errs.join(' | '));
  await pg.context().close();
};
