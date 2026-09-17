(() => {
  'use strict';
  const HOSPITAL_VIEWS = ['departments','doctors','schedules','appointments','patients','laboratory','pharmacy','billing','beds','operations','emergency','blood-bank','ambulance'];
  const LABELS = {
    departments:'Departments', doctors:'Doctors & Specialists', schedules:'Schedules', appointments:'Appointments',
    patients:'Patient Records', laboratory:'Laboratory', pharmacy:'Pharmacy', billing:'Billing', beds:'Beds & Wards',
    operations:'Operations / OT', emergency:'Emergency Command', 'blood-bank':'Blood Bank', ambulance:'Ambulance'
  };
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = x => Number(x) || 0;
  const now = () => new Date().toISOString();
  const audit = (action, entityId='SYSTEM') => {
    const list = read('cf8_audit');
    list.push({ id:'AUD-'+Date.now().toString(36).toUpperCase(), action, entityId, userId:'CURRENT_SESSION', timestamp:now(), source:'PHASE3_HOSPITAL_CONTROLS' });
    localStorage.setItem('cf8_audit', JSON.stringify(list));
  };
  const safeArray = key => Array.isArray(read(key)) ? read(key) : [];

  function hospitalHealth() {
    const patients=safeArray('cf8_patients'), doctors=safeArray('cf8_doctors'), schedules=safeArray('cf8_schedules'), appointments=safeArray('cf8_appointments');
    const leaves=safeArray('cf8_leaves'), beds=safeArray('cf8_beds'), labs=safeArray('cf8_labs'), pharmacy=safeArray('cf8_pharmacy');
    const checks = [
      ['Patient references', appointments.every(a=>!a.patientId || patients.some(p=>p.id===a.patientId))],
      ['Doctor references', appointments.every(a=>!a.doctorId || doctors.some(d=>d.id===a.doctorId))],
      ['Schedule references', schedules.every(s=>!s.doctorId || doctors.some(d=>d.id===s.doctorId))],
      ['Appointment schedules', appointments.every(a=>!a.scheduleId || schedules.some(s=>s.id===a.scheduleId))],
      ['Doctor schedule overlap', doctors.every(d=>{const ss=schedules.filter(s=>s.doctorId===d.id); for(let i=0;i<ss.length;i++)for(let j=i+1;j<ss.length;j++){if(String(ss[i].day).toLowerCase()!==String(ss[j].day).toLowerCase())continue;const a=String(ss[i].start).split(':').map(Number),b=String(ss[i].end).split(':').map(Number),c=String(ss[j].start).split(':').map(Number),e=String(ss[j].end).split(':').map(Number);const am=a[0]*60+a[1],bm=b[0]*60+b[1],cm=c[0]*60+c[1],em=e[0]*60+e[1];if(Math.max(am,cm)<Math.min(bm,em))return false;}return true;})],
      ['Bed records', beds.every(b=>b.id && b.status)],
      ['Lab records', labs.every(x=>x.id)],
      ['Pharmacy records', pharmacy.every(x=>x.id)]
    ];
    return {checks, score:Math.round(checks.filter(x=>x[1]).length/checks.length*100)};
  }

  function injectHospitalCommandCenter() {
    const v=document.getElementById('view-hospital'); if(!v || document.getElementById('phase3-hospital-center')) return;
    const patients=safeArray('cf8_patients'), doctors=safeArray('cf8_doctors'), appointments=safeArray('cf8_appointments'), beds=safeArray('cf8_beds');
    const emergency=safeArray('cf8_emergencies'), leaves=safeArray('cf8_leaves');
    const critical=emergency.filter(x=>x.priority==='Critical'&&x.status==='Active').length;
    const pending=appointments.filter(x=>x.status==='Pending').length;
    const occupied=beds.filter(x=>x.status==='Occupied').length;
    const health=hospitalHealth();
    const panel=document.createElement('div'); panel.id='phase3-hospital-center'; panel.className='panel phase3-command-center';
    panel.innerHTML=`<div class="panel-header"><div><span class="section-kicker">PHASE 3 · HOSPITAL OPERATIONS</span><h3>Hospital Operations Control Center</h3><p>Operational overview, exception monitoring and data-integrity checks across the clinical modules.</p></div><div class="phase3-score"><span>Readiness</span><strong>${health.score}%</strong></div></div>
      <div class="phase3-kpis"><div><span>Patients</span><strong>${patients.length}</strong></div><div><span>Doctors</span><strong>${doctors.length}</strong></div><div><span>Pending Appointments</span><strong>${pending}</strong></div><div><span>Bed Occupancy</span><strong>${beds.length?Math.round(occupied/beds.length*100):0}%</strong></div><div><span>Critical Emergencies</span><strong>${critical}</strong></div><div><span>Approved Leaves</span><strong>${leaves.filter(x=>x.status==='Approved').length}</strong></div></div>
      <div class="phase3-actions"><button class="btn btn-primary" onclick="navigate('patients')">Patient Flow</button><button class="btn btn-outline" onclick="navigate('doctors')">Clinical Workforce</button><button class="btn btn-outline" onclick="navigate('schedules')">Scheduling</button><button class="btn btn-outline" onclick="navigate('beds')">Capacity</button><button class="btn btn-outline" onclick="navigate('emergency')">Emergency</button><button class="btn btn-outline" onclick="window.runHospitalIntegrityCheck()">Run Integrity Check</button></div>
      <div id="phase3-health-output" class="phase3-health-output hidden"></div>`;
    v.appendChild(panel); if(window.lucide)window.lucide.createIcons();
  }

  window.runHospitalIntegrityCheck=()=>{
    const out=document.getElementById('phase3-health-output'); if(!out)return;
    const h=hospitalHealth(); out.classList.remove('hidden');
    out.innerHTML=`<div class="phase3-check-head"><strong>Hospital data integrity</strong><span class="tag ${h.score===100?'success':'warning'}">${h.score}% PASS</span></div>`+h.checks.map(([name,ok])=>`<div class="phase3-check-row"><span>${esc(name)}</span><strong class="${ok?'ok':'bad'}">${ok?'PASS':'CHECK'}</strong></div>`).join('');
    audit('HOSPITAL_INTEGRITY_CHECK');
  };

  function addTableControls(view) {
    const el=document.getElementById('view-'+view); if(!el || el.querySelector('.phase3-table-tools')) return;
    const table=el.querySelector('table'); if(!table)return;
    const wrap=document.createElement('div'); wrap.className='phase3-table-tools';
    wrap.innerHTML=`<div class="phase3-search"><i data-lucide="search"></i><input id="phase3-search-${view}" type="search" placeholder="Search ${esc(LABELS[view]||'records')}..." autocomplete="off"></div><button class="btn btn-sm btn-outline" type="button" onclick="window.phase3ClearSearch('${view}')">Clear</button><span class="phase3-result-count" id="phase3-count-${view}"></span>`;
    table.parentNode.insertBefore(wrap,table);
    const input=wrap.querySelector('input');
    const filter=()=>{
      const q=input.value.trim().toLowerCase(); let visible=0;
      table.querySelectorAll('tbody tr').forEach(tr=>{const ok=!q||tr.textContent.toLowerCase().includes(q);tr.style.display=ok?'':'none';if(ok)visible++;});
      const total=table.querySelectorAll('tbody tr').length; const c=document.getElementById('phase3-count-'+view);if(c)c.textContent=`${visible} of ${total} records`;
    };
    input.addEventListener('input',filter); filter(); if(window.lucide)window.lucide.createIcons();
  }
  window.phase3ClearSearch=view=>{const i=document.getElementById('phase3-search-'+view);if(i){i.value='';i.dispatchEvent(new Event('input'));i.focus();}};

  function injectOperationalBadges(view){
    const el=document.getElementById('view-'+view);if(!el)return;
    const table=el.querySelector('table');if(!table)return;
    if(view==='appointments'){
      const data=safeArray('cf8_appointments'); const invalid=data.filter(a=>a.doctorId&&!safeArray('cf8_doctors').some(d=>d.id===a.doctorId)).length;
      if(!el.querySelector('.phase3-inline-alert')){const p=document.createElement('div');p.className='alert-card '+(invalid?'danger':'success')+' phase3-inline-alert';p.innerHTML=`<i data-lucide="${invalid?'alert-triangle':'shield-check'}"></i><p>${invalid?`${invalid} appointment(s) have invalid doctor references. Review before operational use.`:'Appointment references are consistent with the current doctor catalogue.'}</p></div>`;table.parentNode.insertBefore(p,table);}
    }
    if(view==='doctors'){
      const doctors=safeArray('cf8_doctors');const unavailable=doctors.filter(d=>d.status!=='Available').length;
      if(!el.querySelector('.phase3-inline-alert')){const p=document.createElement('div');p.className='alert-card info phase3-inline-alert';p.innerHTML=`<i data-lucide="calendar-clock"></i><p>${unavailable} doctor(s) currently marked unavailable. Appointment availability is governed by schedule/leave rules.</p></div>`;table.parentNode.insertBefore(p,table);}
    }
    if(window.lucide)window.lucide.createIcons();
  }

  function enhanceView(view){ addTableControls(view); injectOperationalBadges(view); }
  function attach(){
    const originalNavigate=window.navigate;
    if(typeof originalNavigate==='function'&&!window.__careflowPhase3){
      window.__careflowPhase3=true;
      window.navigate=(target)=>{originalNavigate(target);setTimeout(()=>{if(target==='hospital')injectHospitalCommandCenter();if(HOSPITAL_VIEWS.includes(target))enhanceView(target);},80);};
    }
    setTimeout(()=>{injectHospitalCommandCenter();HOSPITAL_VIEWS.forEach(enhanceView);},150);
  }
  document.addEventListener('DOMContentLoaded',attach);
})();
