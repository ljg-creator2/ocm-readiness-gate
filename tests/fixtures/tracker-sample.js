// A fictional delivery tracker with the same tabs and headings as a real one.
// Used by tests/tracker.test.js and the browser suite. No real names or projects.
'use strict';
function sheets(){
  const projects=[
    ['Projects — Active Portfolio'],['Active releases.'],[],
    ['Project','Release','Quarter','Type','Training','Size','Effort (wks)','POC','Team','PM','BA','Impl POC','Status','% Complete','Change Plan → PMs','Open'],
    ['Benefit Notices P1','FY2027R1101','FY2027 Q1 (Oct-Dec)','Benefits','Full','M',8,'Alex Rivera','Alex Rivera / Sam Lee','Jordan Park','Casey Nguyen','Morgan Diaz','In Progress',0.5,new Date(2026,9,4),'Open',new Date(2026,10,1)],
    ['Portal Login Update','FY2027R1101','FY2027 Q1 (Oct-Dec)','Tech','Awareness','Small',4,'Sam Lee','','Jordan Park','','','Not Started',0,'','Open',new Date(2026,10,1)],
    ['Eligibility Rules Refresh','TBD','FY2027 Q2 (Jan-Mar)','Annual Updates','Full','L',12,'(assign)','','Taylor Brooks','','','In Progress',0,'','Open','TBD']
  ];
  const tab=(name,gl,pct)=>[
    [name,'Go-Live:',gl,'% Complete',pct,pct,'In Progress'],['Project group: '+name+'  |  Release: X','Size:','M','Auto % (reviewed gates)',pct],['← Back','Window days:',56,3,'Manual override %',''],
    ['Deliverable','Planned Due','Status','Reviewed?','Notes','gate','signed'],
    ['Preliminary training plan -> to me',new Date(2026,8,6),'Complete','Yes','→ your review',1,1],
    ['Training needs analysis',new Date(2026,8,6),'Complete','','',0,0],
    ['Training materials -> to me',new Date(2026,9,2),'In Review','No','→ your review',1,0],
    ['Review Jiras for training implications','','N/A','','',0,0]];
  const tracker=[
    ['Delivery Tracker'],['Lead-owned.'],['LEGEND'],[],
    ['Project','Source','Go-Live / Target','Status','Size','Audience','Course Length','Trainer(s)','Implementation POC','PM','Functional POC','JAR / Intake','JAD Date','UAT (release)','Prelim Plan → to me','Final Plan → to me','Outline → to me','Materials → to me','MY APPROVAL (to stakeholders)','Stakeholder Review Done','Revisions Done','T3 Done','Ready to Deliver','Delivery Complete','Ready by Go-Live?','Next Due to Me','Days to Next','Notes'],
    ['Benefit Notices P1 — job aid','Release',new Date(2026,10,1),'In Review','Medium','Intake Workers','Job aid','A. Rivera','','','',new Date(2026,7,1),new Date(2026,7,20),new Date(2026,9,15),new Date(2026,8,6),new Date(2026,8,13),new Date(2026,8,20),new Date(2026,9,2),new Date(2026,9,9),'','','',new Date(2026,9,25),new Date(2026,9,30),'On track','','',''],
    ['Notices P1 wave — micro-learning','Release',new Date(2026,10,1),'In Progress','Medium','Intake Workers','Micro-learning','S. Lee','','','','','',new Date(2026,9,15),'','','','','','','','','',new Date(2026,9,30),'','','',''],
    ['Ad-hoc: Huddle','Ad-hoc','','Planning','Small','Supervisors','Huddle','S. Lee','','','','','','','','','','','','','','','','','','','',''],
    ['Portal Login Update — info session','Release','','N/A','Small','All staff','Info session','S. Lee','','','','','','','','','','','','','','','','','','','','']];
  return{'Start Here':[['OCM Delivery Tracker']],'Projects':projects,'Delivery Tracker':tracker,
    'Benefit Notices P1':tab('Benefit Notices P1',new Date(2026,10,1),0.5),'Portal Login Update':tab('Portal Login Update',new Date(2026,10,1),0),
    'FY2027 Q1 (Oct-Dec)':[['Q1'],['←'],['Project','Release','Type','Go-Live','Size'],['Benefit Notices P1','FY2027R1101','Benefits',new Date(2026,10,1),'M']]};
}
module.exports={sheets};
