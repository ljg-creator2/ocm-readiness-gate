// Runs every automated check: engine unit tests, then the browser suites.
// Usage: cd tests && npm install && npx playwright install chromium && npm test
// One suite: node run-all.js training
'use strict';
const {execFileSync}=require('child_process');const path=require('path');
const {runSuite}=require('./e2e/harness');
const SUITES=['training','uat','command-center','jira','sweep'];
(async()=>{
  const only=process.argv[2];let failed=0;const lines=[];
  if(!only||only==='engine'){
    try{execFileSync(process.execPath,[path.join(__dirname,'engine.test.js')],{stdio:'inherit'});lines.push('engine: passed');}
    catch(e){failed++;lines.push('engine: FAILED');}
  }
  for(const s of SUITES){
    if(only&&only!==s)continue;
    const r=await runSuite(s,require('./e2e/'+s+'.suite.js'));
    if(r.passed!==r.total||!r.total)failed++;
    lines.push(s+': '+r.passed+'/'+r.total);
  }
  console.log('\n── Summary ──\n'+lines.join('\n'));
  process.exit(failed?1:0);
})();
