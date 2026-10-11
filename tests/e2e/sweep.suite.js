// Page sweep: every screen in light and dark on desktop, and light on phone.
// Checks for script errors, sideways scroll and broken images. (Colour contrast is checked
// separately by hand: four brand colour pairs are knowingly below AA, pending a brand decision.)
'use strict';
const PROJ_TABS=['overview','deps','learndev','readiness','actions','milestones','environments','gates','adkar','lifecycle','flags','craid','impact','gaps','adopthm','trainplan','adoption','pulse','postlaunch','sustain','resources','heatmap'];
const SECTIONS=['command','initiatives','people','risk','training','stakeholders','adoption','reports'];
module.exports=async function(t){
  const {ok,wait,ev}=t;
  const combos=[['light',{width:1440,height:900},'desktop'],['dark',{width:1440,height:900},'desktop'],['light',{width:390,height:844},'phone']];
  for(const [theme,vp,vname] of combos){
    const pg=await t.page({vp,theme,wait:1500});
    const check=async name=>{
      const r=await ev(pg,()=>({ov:document.documentElement.scrollWidth-innerWidth,
        broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.offsetParent&&!/^data:/.test(i.src)).map(i=>i.src.split('/').pop())}));
      ok('Sweep '+theme+' '+vname,name+': no sideways scroll',r.ov<=1,r.ov+'px');
      ok('Sweep '+theme+' '+vname,name+': images load',!r.broken.length,r.broken.join(', '));
    };
    await check('landing');
    for(const [n,f] of [['sign-in','landingToLogin()'],['create account','showSignup()'],['reset password','showForgot()']]){await ev(pg,f=>new Function(f)(),f);await wait(300);await check(n);}
    await ev(pg,()=>showLanding());await ev(pg,()=>landingToDemo());await wait(2000);
    for(const k of SECTIONS){await ev(pg,k=>sbNav(k),k);await wait(500);await check('section '+k);}
    await ev(pg,()=>openRelease(releases[0].id));await wait(700);await check('release');
    for(const tab of PROJ_TABS){
      await ev(pg,tab=>{const r=releases.find(x=>x.name==='Benefits Modernization')||releases[0];openProjectFromPortfolio(r.id,r.projects[r.projects.length-1].id,tab);},tab);await wait(500);
      await check('project '+tab);
    }
    ok('Sweep '+theme+' '+vname,'no script errors on any page',pg._errs.length===0,pg._errs.join(' | '));
    await pg.context().close();
  }
};
