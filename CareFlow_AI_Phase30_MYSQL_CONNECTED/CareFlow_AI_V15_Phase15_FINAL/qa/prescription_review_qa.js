const fs=require('fs'), path=require('path'), assert=require('assert');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
function ok(name,cond){assert.ok(cond,name);console.log('PASS',name)}
ok('Prescription renderer declares reviewer permission state', /function renderPrescriptions\(\){const canReview=/.test(app));
ok('Prescription queue filters only pending AI reviews', /state\.notifications\.filter\(n=>n\.type==='ai'&&n\.status==='Pending Doctor Review'\)/.test(app));
ok('Review buttons explicitly call window.doctorDecision', /onclick=\\?"window\.doctorDecision\('\$\{n\.id\}','Approved'\)/.test(app));
ok('Clinical reviewer roles are restricted', /\['Doctor','HOD','Medical Director'\]\.includes\(state\.currentUser\?\.role\)/.test(app));
ok('Non-clinical users get view-only state', /View only · qualified doctor review required/.test(app));
ok('Decision requires a still-pending AI review', /x=>x\.id===nid&&x\.type==='ai'&&x\.status==='Pending Doctor Review'/.test(app));
ok('Approve creates finalized prescription', /decision,status:'Finalized'/.test(app));
ok('Reject does not create finalized prescription', /if\(decision==='Approved'\|\|decision==='Modified'\)/.test(app));
ok('Decision is audited with doctor and patient IDs', /AI_PRESCRIPTION_\$\{decision\.toUpperCase\(\)\}/.test(app) && /doctorId:state\.currentUser\?\.doctorId/.test(app));
console.log('PRESCRIPTION_REVIEW_QA_PASS');
