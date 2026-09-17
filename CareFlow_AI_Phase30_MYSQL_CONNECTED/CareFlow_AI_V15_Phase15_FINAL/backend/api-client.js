/* CareFlow AI backend bridge.
   The frontend remains usable offline, while authenticated sessions synchronize
   the existing local data layer with the backend. This makes the migration
   incremental instead of replacing every existing CRUD handler at once. */
(() => {
  'use strict';
  const TOKEN_KEY='cf_backend_token';
  const API_BASE=(window.CAREFLOW_API_BASE||'').replace(/\/$/,'');
  const apiUrl=path=>`${API_BASE}${path}`;
  const token=()=>sessionStorage.getItem(TOKEN_KEY)||'';
  const headers=()=>({ 'Content-Type':'application/json', ...(token()?{Authorization:`Bearer ${token()}`}:{}) });

  async function request(path, options={}) {
    const res=await fetch(apiUrl(path),{...options,headers:{...headers(),...(options.headers||{})}});
    let body=null; try{body=await res.json();}catch{}
    if(!res.ok) throw new Error(body?.detail||`Backend request failed (${res.status})`);
    return body;
  }

  async function login(email,password,role){
    const body=await request('/api/auth/login',{method:'POST',body:JSON.stringify({email,password,role})});
    sessionStorage.setItem(TOKEN_KEY,body.token);
    sessionStorage.setItem('cf_backend_user',JSON.stringify(body.user));
    return body.user;
  }

  const STORAGE={patients:'cf8_patients',doctors:'cf8_doctors',departments:'cf8_departments',schedules:'cf8_schedules',appointments:'cf8_appointments',leaves:'cf8_leaves',consultations:'cf8_consultations',prescriptions:'cf8_prescriptions',labs:'cf8_labs',pharmacy:'cf8_pharmacy',billing:'cf8_billing',beds:'cf8_beds',operations:'cf8_operations',students:'cf8_students',hostel:'cf8_hostel',users:'cf8_users',audit:'cf8_audit',staff:'cf8_staff',faculty:'cf8_faculty',finance:'cf8_finance',emergencies:'cf8_emergencies',bloodBank:'cf8_blood_bank',ambulances:'cf8_ambulances',consent:'cf8_consent',research:'cf8_research',settings:'cf8_settings'};

  function localSnapshot(){
    const data={};
    Object.entries(STORAGE).forEach(([k,key])=>{try{const raw=localStorage.getItem(key);if(raw!==null)data[k]=JSON.parse(raw);}catch{}});
    return data;
  }

  async function bootstrap(){
    if(!token()) return null;
    return await request('/api/bootstrap');
  }

  async function applyBootstrap(body){
    Object.entries(body?.data||{}).forEach(([k,v])=>{
      const key=STORAGE[k];
      if(key && v!==undefined && (k==='settings' || (Array.isArray(v) && v.length))) localStorage.setItem(key,JSON.stringify(v));
    });
  }

  async function bootstrapAndMigrate(){
    if(!token()) return null;
    let body=await bootstrap();
    if(!body?.initialized){
      const local=localSnapshot();
      await request('/api/migrate',{method:'POST',body:JSON.stringify({data:local})});
      body=await bootstrap();
    }
    await applyBootstrap(body);
    return body;
  }

  async function syncCollection(name,records){
    if(!token()) return null;
    try{return await request(`/api/collections/${encodeURIComponent(name)}`,{method:'PUT',body:JSON.stringify({records})});}
    catch(err){console.warn('CareFlow backend sync skipped:',name,err.message);return null;}
  }

  async function health(){try{return await request('/api/health');}catch{return null;}}
  function logout(){sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem('cf_backend_user');}

  window.CareFlowAPI={login,bootstrap,bootstrapAndMigrate,syncCollection,health,logout,isConnected:()=>!!token()};
})();
