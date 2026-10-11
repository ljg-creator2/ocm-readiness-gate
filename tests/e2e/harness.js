// Shared browser-test harness. Serves the repo on a local port, blocks every outside
// request (so results never depend on the network or on live Supabase), serves the
// chart, icon and spreadsheet libraries from tests/node_modules, and replaces the
// Supabase client with an in-page stand-in that records auth calls.
'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const NM=path.resolve(__dirname,'../node_modules');
const MIME={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
  '.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.woff2':'font/woff2','.csv':'text/csv','.txt':'text/plain'};

function startServer(){
  return new Promise(res=>{
    const srv=http.createServer((req,resp)=>{
      const p=decodeURIComponent(req.url.split('?')[0]);const f=path.join(ROOT,p==='/'?'index.html':p);
      if(!f.startsWith(ROOT)){resp.writeHead(403);return resp.end();}
      fs.readFile(f,(e,d)=>{if(e){resp.writeHead(404);return resp.end('Not found');}resp.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});resp.end(d);});
    });
    srv.listen(0,'127.0.0.1',()=>res({base:'http://127.0.0.1:'+srv.address().port,close:()=>srv.close()}));
  });
}

const LOCAL_LIBS=[
  [/chart\.umd(\.min)?\.js/,()=>path.join(NM,'chart.js/dist/chart.umd.js')],
  [/xlsx\.full\.min\.js/,()=>path.join(NM,'xlsx/dist/xlsx.full.min.js')],
  [/@phosphor-icons\/web.*\/src\/(regular|bold)\/(.+)$/,u=>path.join(NM,'@phosphor-icons/web/src',u.split('/src/')[1].split('?')[0])]
];

async function launch(){
  // No proxy: every outside request is served locally or blocked by openPage().
  return chromium.launch({proxy:undefined,args:['--no-proxy-server']});
}

// opts: {vp:{width,height}, az:boolean (Microsoft sign-in enabled), wait:ms, theme:'light'|'dark'}
async function openPage(browser,base,opts={}){
  const ctx=await browser.newContext({viewport:opts.vp||{width:1440,height:900}});
  const pg=await ctx.newPage();pg._errs=[];
  pg.on('pageerror',e=>pg._errs.push(e.message));
  await pg.addInitScript(()=>{
    window.__calls=[];window.__opened=[];
    window.open=function(u){const w={html:'',document:{open(){},write(h){w.html+=h;},close(){}},close(){},focus(){},print(){}};window.__opened.push(w);return w;};
    const auth={getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
      signInWithPassword:async a=>{__calls.push(['pw',a.email]);return{data:{},error:{message:'Invalid login credentials'}};},
      signInWithOAuth:async a=>{__calls.push(['oauth',a.provider]);return{error:null};},
      resetPasswordForEmail:async e=>{__calls.push(['reset',e]);return{error:null};},
      signUp:async a=>{__calls.push(['signup',a.email]);return{data:{},error:null};},
      signOut:async()=>{__calls.push(['signout']);return{error:null};},updateUser:async()=>({data:{},error:null})};
    const mk=()=>new Proxy(function(){},{get:(t,k)=>k==='then'?(r=>r({data:null,error:null})):mk(),apply:()=>mk()});
    Object.defineProperty(window,'supabase',{value:{createClient:()=>new Proxy({auth},{get:(t,k)=>k==='auth'?auth:mk()})},writable:true});
  });
  await pg.route('**/*',route=>{
    const u=route.request().url();
    if(u.startsWith(base))return route.continue();
    if(/\/auth\/v1\/settings/.test(u))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({external:{azure:!!opts.az}})});
    for(const [re,f] of LOCAL_LIBS)if(re.test(u)){const p=f(u);if(fs.existsSync(p))return route.fulfill({path:p,contentType:MIME[path.extname(p)]||'application/javascript'});}
    if(/supabase-js/.test(u))return route.fulfill({status:200,contentType:'application/javascript',body:'/* stubbed in tests */'});
    return route.abort();
  });
  if(opts.theme)await pg.addInitScript(th=>{try{localStorage.setItem('ocm_theme',th);}catch(e){}},opts.theme);
  // Bring each click target to the middle of the screen first, so fixed elements at the
  // screen edge (the floating help button, toasts) never sit on top of it.
  const click=pg.click.bind(pg);
  pg.click=async(sel,o)=>{await pg.locator(sel).first().evaluate(e=>e.scrollIntoView({block:'center',inline:'center'})).catch(()=>{});return click(sel,o);};
  await pg.goto(base+'/index.html');await pg.waitForTimeout(opts.wait||1200);
  return pg;
}

// Runs a suite: suite(t) where t={ok, page, wait, ev, base, browser}.
async function runSuite(name,suite){
  const srv=await startServer();const browser=await launch();
  const R=[];
  const ok=(area,label,pass,detail)=>{R.push({area,label,pass:!!pass});console.log((pass?'PASS ':'FAIL ')+name+' | '+area+' | '+label+(pass||detail===undefined?'':' -> '+String(detail).slice(0,300)));};
  const t={ok,base:srv.base,browser,page:o=>openPage(browser,srv.base,o),wait:ms=>new Promise(r=>setTimeout(r,ms)),ev:(pg,f,a)=>pg.evaluate(f,a)};
  try{await suite(t);}catch(e){const m=String(e.message||e).replace(/\x1b\[[0-9;]*m/g,'');ok('Suite','completed without crashing',false,'');console.log(m.slice(0,2500));}
  finally{await browser.close();srv.close();}
  const passed=R.filter(r=>r.pass).length;
  console.log(name+': '+passed+'/'+R.length+' passed\n');
  return{name,passed,total:R.length};
}
module.exports={runSuite,ROOT};
