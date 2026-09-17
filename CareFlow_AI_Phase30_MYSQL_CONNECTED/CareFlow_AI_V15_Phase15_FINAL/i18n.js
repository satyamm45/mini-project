/* CareFlow AI — dashboard-only internationalisation layer.
   Login markup intentionally uses raw English strings and never calls t(). */
(function(){
  'use strict';
  const en={
    Dashboard:'Dashboard', CommandCenter:'Command Center', HospitalAdmin:'Hospital Admin', Departments:'Departments', Doctors:'Doctors',
    DoctorSchedules:'Doctor Schedules', Appointments:'Appointments', Patients:'Patients', AIClinicalAssistant:'AI Clinical Assistant',
    Telemedicine:'Telemedicine', PrescriptionReview:'Prescription Review', Laboratory:'Laboratory', Pharmacy:'Pharmacy', Billing:'Billing',
    BedsWards:'Beds & Wards', OperationsOT:'Operations / OT', CollegeAdmin:'College Admin', MedicalCollege:'Medical College', HostelAdmin:'Hostel Admin',
    HostelManagement:'Hostel Management', Reports:'Reports', BlockchainAudit:'Blockchain Audit', UsersRoles:'Users & Roles', StaffHR:'Staff & HR',
    Finance:'Finance', EmergencyCommand:'Emergency Command', BloodBank:'Blood Bank', Ambulance:'Ambulance', ConsentCenter:'Consent Center', Research:'Research', Settings:'Settings',
    Add:'Add', Edit:'Edit', Delete:'Delete', View:'View', Save:'Save', Cancel:'Cancel', Approve:'Approve', Modify:'Modify', Reject:'Reject',
    Search:'Search', Notifications:'Notifications', SignOut:'Sign out'
  };
  const hi={
    Dashboard:'डैशबोर्ड', CommandCenter:'कमांड सेंटर', HospitalAdmin:'अस्पताल प्रशासन', Departments:'विभाग', Doctors:'डॉक्टर',
    DoctorSchedules:'डॉक्टर शेड्यूल', Appointments:'अपॉइंटमेंट', Patients:'मरीज़', AIClinicalAssistant:'AI क्लिनिकल सहायक', Telemedicine:'टेलीमेडिसिन',
    PrescriptionReview:'प्रिस्क्रिप्शन समीक्षा', Laboratory:'प्रयोगशाला', Pharmacy:'फार्मेसी', Billing:'बिलिंग', BedsWards:'बेड और वार्ड', OperationsOT:'ऑपरेशन / OT',
    CollegeAdmin:'कॉलेज प्रशासन', MedicalCollege:'मेडिकल कॉलेज', HostelAdmin:'हॉस्टल प्रशासन', HostelManagement:'हॉस्टल प्रबंधन', Reports:'रिपोर्ट्स', BlockchainAudit:'ब्लॉकचेन ऑडिट',
    UsersRoles:'यूज़र्स और रोल्स', StaffHR:'स्टाफ और HR', Finance:'वित्त', EmergencyCommand:'आपातकालीन कमांड', BloodBank:'ब्लड बैंक', Ambulance:'एम्बुलेंस', ConsentCenter:'सहमति केंद्र', Research:'अनुसंधान', Settings:'सेटिंग्स',
    Add:'जोड़ें', Edit:'संपादित करें', Delete:'हटाएँ', View:'देखें', Save:'सहेजें', Cancel:'रद्द करें', Approve:'स्वीकृत करें', Modify:'संशोधित करें', Reject:'अस्वीकृत करें', Search:'खोजें', Notifications:'नोटिफिकेशन', SignOut:'साइन आउट'
  };

  // Local icon shim: keeps the strict no-CDN prototype self-contained.
  // It replaces lucide placeholders with accessible Unicode symbols.
  const iconMap={search:'⌕',bell:'◔',x:'×',mail:'✉',lock:'▣',eye:'◉','eye-off':'◌',sparkles:'✦',users:'♟',stethoscope:'⚕',calendar:'▣',bot:'◈',hospital:'✚',building:'▥','building-2':'▥','calendar-clock':'◷',video:'▣','file-text':'▤','flask-conical':'⚗',pill:'●','credit-card':'▣','bed-double':'▱',syringe:'◉','graduation-cap':'♜','book-open':'▤',home:'⌂','bar-chart-3':'▥',link:'↗','user-cog':'⚙','users-round':'♟',banknote:'₹',siren:'⚠',droplet:'●',ambulance:'▰','shield-check':'✓','shield-alert':'⚠','alert-circle':'!','alert-triangle':'⚠','loader-circle':'◌',crown:'♛',box:'□',activity:'•','indian-rupee':'₹','check-circle':'✓'};
  window.lucide={createIcons:function(){document.querySelectorAll('i[data-lucide]').forEach(function(i){if(i.dataset.cfIconDone)return;const name=i.getAttribute('data-lucide')||'activity';i.textContent=iconMap[name]||'•';i.classList.add('cf-icon');i.dataset.cfIconDone='1';});}};
  window.CareFlowI18n={en,hi,t:function(key){const lang=localStorage.getItem('cf_language')==='hi'?'hi':'en';return (lang==='hi'?hi[key]:en[key])||key;}};
  window.t=window.CareFlowI18n.t;
})();
