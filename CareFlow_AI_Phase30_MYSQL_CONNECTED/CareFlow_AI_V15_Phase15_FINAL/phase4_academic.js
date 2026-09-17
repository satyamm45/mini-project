(() => {
  'use strict';
  const S={events:'cf8_academic_events',postings:'cf8_clinical_postings',assessments:'cf8_assessments',cases:'cf8_learning_cases'};
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return[]}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=x=>String(x??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uid=p=>`${p}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*90+10)}`;
  const role=()=>document.getElementById('user-role')?.textContent||'';
  const writeOK=()=>['Chairman','College Administrator','Dean','Dean / Principal','Head of Department','HOD'].includes(role());
  function seed(){
    if(!read(S.events).length)write(S.events,[{id:'EVT-001',title:'MBBS Internal Assessment',type:'Examination',date:'2026-09-12',department:'Medicine',status:'Scheduled'},{id:'EVT-002',title:'Clinical Skills Workshop',type:'Clinical Skills',date:'2026-09-15',department:'Surgery',status:'Scheduled'}]);
    if(!read(S.postings).length)write(S.postings,[{id:'POST-001',student:'STU-1',studentName:'Aarav Singh',unit:'Medicine Ward',supervisor:'Dr. Amit Sharma',from:'2026-09-01',to:'2026-09-14',status:'Active'},{id:'POST-002',student:'STU-2',studentName:'Diya Sharma',unit:'Cardiology OPD',supervisor:'Dr. Neha Verma',from:'2026-09-08',to:'2026-09-21',status:'Planned'}]);
    if(!read(S.assessments).length)write(S.assessments,[{id:'ASM-001',student:'Aarav Singh',subject:'Clinical Examination',score:82,max:100,status:'Graded'},{id:'ASM-002',student:'Diya Sharma',subject:'Pharmacology Viva',score:76,max:100,status:'Graded'}]);
    if(!read(S.cases).length)write(S.cases,[{id:'CASE-001',title:'Chest Pain — Synthetic Case',specialty:'Cardiology',difficulty:'Intermediate',privacy:'Synthetic',status:'Published'},{id:'CASE-002',title:'Acute Headache — Synthetic Case',specialty:'Neurology',difficulty:'Advanced',privacy:'Synthetic',status:'Draft'}]);
  }
  const modal=(title,body,foot)=>{if(window.showModal)window.showModal(title,body,foot);else alert(title)};
  function crud(k,kind){
    if(!writeOK()){alert('Your role has view-only academic access.');return;}
    const current=read(k); let item=null;
    if(kind==='event') item={id:uid('EVT'),title:prompt('Event title:','New Academic Event'),type:prompt('Type:','Teaching'),date:prompt('Date (YYYY-MM-DD):','2026-09-20'),department:prompt('Department:','Medicine'),status:'Scheduled'};
    if(kind==='posting') item={id:uid('POST'),student:prompt('Student ID:','STU-1'),studentName:prompt('Student name:',''),unit:prompt('Clinical unit:','Medicine Ward'),supervisor:prompt('Supervisor:',''),from:prompt('From (YYYY-MM-DD):','2026-09-20'),to:prompt('To (YYYY-MM-DD):','2026-10-03'),status:'Planned'};
    if(kind==='assessment') item={id:uid('ASM'),student:prompt('Student:',''),subject:prompt('Subject:','Clinical Assessment'),score:Number(prompt('Score:','80')),max:100,status:'Graded'};
    if(kind==='case') item={id:uid('CASE'),title:prompt('Case title:','Synthetic Case'),specialty:prompt('Specialty:','General Medicine'),difficulty:prompt('Difficulty:','Intermediate'),privacy:'Synthetic',status:'Draft'};
    if(!item||Object.values(item).some(v=>v===null||v===undefined||v===''))return;
    current.push(item);write(k,current);if(window.addAudit)window.addAudit(`${kind.toUpperCase()}_CREATED`,item.id);render();
  }
  function edit(k,id,kind){if(!writeOK()){alert('View-only academic access.');return;}const a=read(k),i=a.findIndex(x=>x.id===id);if(i<0)return;const old=a[i], field=kind==='event'?'title':kind==='posting'?'unit':kind==='assessment'?'score':'title';const v=prompt(`Edit ${field}:`,old[field]);if(v===null)return;a[i]={...old,[field]:kind==='assessment'?Number(v):v};write(k,a);if(window.addAudit)window.addAudit(`${kind.toUpperCase()}_UPDATED`,id);render();}
  function del(k,id){if(!writeOK())return; if(!confirm('Delete this record? This action cannot be undone.'))return;write(k,read(k).filter(x=>x.id!==id));if(window.addAudit)window.addAudit(`${kind.toUpperCase()}_DELETED`,id);render();}
  function table(title,arr,cols,k,kind){return `<div class="panel phase4-panel"><div class="panel-header"><div><h3>${title}</h3><p>${arr.length} records · changes preserve untouched fields</p></div>${writeOK()?`<button class="btn btn-primary btn-sm" onclick="window.cf4Add('${k}','${kind}')">Add</button>`:''}</div><div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${arr.map(x=>`<tr>${cols.map(c=>`<td>${esc(x[c.toLowerCase().replaceAll(' ','') ]??x[c]??'-')}</td>`).join('')}<td><div class="row-actions">${writeOK()?`<button class="btn btn-sm btn-outline" onclick="window.cf4Edit('${k}','${x.id}','${kind}')">Edit</button><button class="btn btn-sm btn-danger" onclick="window.cf4Delete('${k}','${x.id}')">Delete</button>`:'View only'}</div></td></tr>`).join('')||`<tr><td colspan="${cols.length+1}" class="empty">No records.</td></tr>`}</tbody></table></div></div>`}
  const val=(x,key)=>x[key]??'-';
  function render(){
    const c=document.getElementById('view-medical-college');if(!c)return;
    const events=read(S.events),post=read(S.postings),asm=read(S.assessments),cases=read(S.cases);
    let hub=document.getElementById('phase4-academic-hub'); if(!hub){hub=document.createElement('div');hub.id='phase4-academic-hub';c.appendChild(hub);}
    hub.innerHTML=`<div class="phase4-hero"><div><span class="section-kicker">PHASE 4 · MEDICAL COLLEGE</span><h3>Academic & Clinical Education Control Center</h3><p>Structured academic operations with attendance exceptions, clinical postings, assessments and synthetic case learning.</p></div><div class="phase4-badge">${writeOK()?'EDIT MODE':'VIEW MODE'}</div></div><div class="stats-grid"><div class="stat-card"><div><span class="stat-label">Academic Events</span><h3>${events.length}</h3></div></div><div class="stat-card"><div><span class="stat-label">Active Postings</span><h3>${post.filter(x=>x.status==='Active').length}</h3></div></div><div class="stat-card"><div><span class="stat-label">Assessments</span><h3>${asm.length}</h3></div></div><div class="stat-card"><div><span class="stat-label">Learning Cases</span><h3>${cases.length}</h3></div></div></div><div class="phase4-grid">${table('Academic Calendar',events,['ID','Title','Type','Date','Department','Status'],'cf8_academic_events','event')}${table('Clinical Postings',post,['ID','Student','Unit','Supervisor','From','To','Status'],'cf8_clinical_postings','posting')}</div><div class="phase4-grid">${table('Assessments',asm,['ID','Student','Subject','Score','Max','Status'],'cf8_assessments','assessment')}${table('Case Library',cases,['ID','Title','Specialty','Difficulty','Privacy','Status'],'cf8_learning_cases','case')}</div>`;
  }
  window.cf4Add=(k,kind)=>crud(k,kind);window.cf4Edit=(k,id,kind)=>edit(k,id,kind);window.cf4Delete=(k,id)=>del(k,id);
  function attach(){seed();render();const old=window.navigate;if(typeof old==='function'&&!window.__cf4){window.__cf4=true;window.navigate=v=>{old(v);setTimeout(()=>{if(v==='medical-college')render();},60)}}}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(attach,250));
})();
