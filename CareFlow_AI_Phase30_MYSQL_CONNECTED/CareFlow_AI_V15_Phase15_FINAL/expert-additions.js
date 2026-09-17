(() => {
  'use strict';

  const KEYS = [
    'cf8_patients','cf8_doctors','cf8_departments','cf8_schedules',
    'cf8_appointments','cf8_leaves','cf8_consultations','cf8_prescriptions',
    'cf8_labs','cf8_pharmacy','cf8_billing','cf8_beds','cf8_operations',
    'cf8_students','cf8_hostel','cf8_users','cf8_audit','cf8_staff',
    'cf8_faculty','cf8_finance','cf8_emergencies','cf8_blood_bank',
    'cf8_ambulances','cf8_consent','cf8_research','cf8_settings'
  ];

  const safeParse = (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };

  const readAll = () => Object.fromEntries(KEYS.map(k => [k, safeParse(k, k === 'cf8_settings' ? {} : [])]));

  const downloadJson = (name, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const injectGovernance = () => {
    const v = document.getElementById('view-settings');
    if (!v || document.getElementById('expert-governance-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'expert-governance-panel';
    panel.className = 'panel';
    panel.style.marginTop = '18px';
    panel.innerHTML = `
      <div class="panel-header">
        <div><h3>Platform Governance & Recovery</h3><p>Local prototype controls for backup, restore and integrity checks.</p></div>
        <span class="tag info">Control Plane</span>
      </div>
      <div class="governance-actions">
        <button class="btn btn-outline" id="expert-export"><i data-lucide="download"></i>Export Full Data</button>
        <button class="btn btn-outline" id="expert-import"><i data-lucide="upload"></i>Import Backup</button>
        <button class="btn btn-outline" id="expert-health"><i data-lucide="activity"></i>Run Health Check</button>
        <button class="btn btn-danger" id="expert-reset"><i data-lucide="rotate-ccw"></i>Reset Demo Data</button>
      </div>
      <div id="expert-health-output" class="governance-output hidden"></div>
      <input id="expert-import-file" type="file" accept="application/json" style="display:none">
    `;
    v.appendChild(panel);

    const q = id => document.getElementById(id);
    q('expert-export').onclick = () => downloadJson('careflow-full-backup.json', {exportedAt:new Date().toISOString(), data:readAll()});
    q('expert-import').onclick = () => q('expert-import-file').click();
    q('expert-import-file').onchange = async e => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        const data = parsed.data || parsed;
        for (const key of KEYS) if (Object.prototype.hasOwnProperty.call(data,key)) localStorage.setItem(key, JSON.stringify(data[key]));
        alert('Backup imported. Reloading the application.'); location.reload();
      } catch (err) { alert('Invalid backup file: ' + err.message); }
    };
    q('expert-reset').onclick = () => {
      if (!confirm('Reset all CareFlow demo data stored in this browser? This cannot be undone.')) return;
      KEYS.forEach(k => localStorage.removeItem(k));
      alert('Demo data reset. Reloading with fresh seed data.'); location.reload();
    };
    q('expert-health').onclick = () => {
      const d = readAll();
      const checks = [
        ['Patients collection', Array.isArray(d.cf8_patients)],
        ['Doctors collection', Array.isArray(d.cf8_doctors)],
        ['Appointments collection', Array.isArray(d.cf8_appointments)],
        ['Schedules collection', Array.isArray(d.cf8_schedules)],
        ['Audit collection', Array.isArray(d.cf8_audit)],
        ['Settings object', d.cf8_settings && !Array.isArray(d.cf8_settings)],
        ['Appointment doctor references', Array.isArray(d.cf8_appointments) && d.cf8_appointments.every(a => !a.doctorId || d.cf8_doctors.some(x=>x.id===a.doctorId))],
        ['Appointment patient references', Array.isArray(d.cf8_appointments) && d.cf8_appointments.every(a => !a.patientId || d.cf8_patients.some(x=>x.id===a.patientId))],
        ['Schedule doctor references', Array.isArray(d.cf8_schedules) && d.cf8_schedules.every(s => !s.doctorId || d.cf8_doctors.some(x=>x.id===s.doctorId))],
        ['Consent patient references', Array.isArray(d.cf8_consent) && d.cf8_consent.every(c => !c.patientId || d.cf8_patients.some(x=>x.id===c.patientId))]
      ];
      q('expert-health-output').classList.remove('hidden');
      q('expert-health-output').innerHTML = checks.map(([label,ok]) => `<div class="health-row"><span>${label}</span><strong class="${ok?'ok':'bad'}">${ok?'PASS':'CHECK'}</strong></div>`).join('');
    };
    if (window.lucide) lucide.createIcons();
  };

  const injectExecutiveControls = () => {
    const overview = document.getElementById('view-overview');
    if (!overview || document.getElementById('expert-executive-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'expert-executive-panel'; panel.className = 'panel'; panel.style.marginTop = '18px';
    const audit = safeParse('cf8_audit', []);
    const emergencies = safeParse('cf8_emergencies', []);
    const leaves = safeParse('cf8_leaves', []);
    const appointments = safeParse('cf8_appointments', []);
    const pending = appointments.filter(a => a.status === 'Pending').length;
    const critical = emergencies.filter(e => e.priority === 'Critical' && e.status === 'Active').length;
    const activeLeaves = leaves.filter(l => l.status === 'Approved').length;
    panel.innerHTML = `
      <div class="panel-header"><div><h3>Executive Exception Monitor</h3><p>Chairman-level view of issues that need attention rather than routine transactions.</p></div><span class="tag warning">Exception Only</span></div>
      <div class="exception-grid">
        <div class="exception-card ${critical?'danger':''}"><span>Critical Emergencies</span><strong>${critical}</strong></div>
        <div class="exception-card ${pending?'warning':''}"><span>Pending Appointments</span><strong>${pending}</strong></div>
        <div class="exception-card"><span>Approved Doctor Leaves</span><strong>${activeLeaves}</strong></div>
        <div class="exception-card"><span>Audit Events</span><strong>${audit.length}</strong></div>
      </div>
      <div class="alert-card info" style="margin-top:14px"><i data-lucide="shield-check"></i><p>Routine operational work remains inside the relevant administrator domains. This panel surfaces exceptions and organization-wide signals.</p></div>`;
    overview.appendChild(panel);
    if (window.lucide) lucide.createIcons();
  };

  const attach = () => {
    const originalNavigate = window.navigate;
    if (typeof originalNavigate === 'function' && !window.__careflowExpertNavigate) {
      window.__careflowExpertNavigate = true;
      window.navigate = (target) => {
        originalNavigate(target);
        setTimeout(() => {
          if (target === 'settings') injectGovernance();
          if (target === 'overview') injectExecutiveControls();
        }, 30);
      };
    }
    setTimeout(() => { injectExecutiveControls(); }, 60);
  };

  document.addEventListener('DOMContentLoaded', attach);
})();
