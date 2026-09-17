/* CareFlow AI demo seed catalogue.
   The legacy-compatible embedded seed in app.js is used by the prototype's
   storage bootstrap; this file documents and exposes the same demo shape for
   future backend migration and keeps the required project tree self-contained. */
window.CAREFLOW_SEED_DATA = {
  departments:[
    {id:'DEP-001',name:'Cardiology',head:'Dr. Amit Sharma',specialty:'Cardiac Care',location:'Clinical Block A',status:'Active'},
    {id:'DEP-002',name:'Neurology',head:'Dr. Neha Verma',specialty:'Neurological Care',location:'Clinical Block B',status:'Active'},
    {id:'DEP-003',name:'Pediatrics',head:'Dr. Pooja Singh',specialty:'Child Health',location:'Clinical Block C',status:'Active'},
    {id:'DEP-004',name:'Dermatology',head:'Dr. Mohit Jain',specialty:'Skin Care',location:'Clinical Block D',status:'Active'}
  ],
  doctors:[
    {id:'DOC-001',name:'Dr. Amit Sharma',department:'Cardiology',specialty:'Cardiology',phone:'9876543210',status:'Available',onlineEligible:true},
    {id:'DOC-002',name:'Dr. Neha Verma',department:'Neurology',specialty:'Neurology',phone:'9876543211',status:'Available',onlineEligible:true},
    {id:'DOC-003',name:'Dr. Raj Patel',department:'Orthopedics',specialty:'Orthopedics',phone:'9876543212',status:'Available',onlineEligible:true},
    {id:'DOC-004',name:'Dr. Pooja Singh',department:'Pediatrics',specialty:'Pediatrics',phone:'9876543213',status:'Available',onlineEligible:true},
    {id:'DOC-005',name:'Dr. Mohit Jain',department:'Dermatology',specialty:'Dermatology',phone:'9876543214',status:'Available',onlineEligible:true},
    {id:'DOC-006',name:'Dr. Sara Khan',department:'General Medicine',specialty:'General Medicine',phone:'9876543215',status:'On Leave',onlineEligible:true}
  ],
  patients:Array.from({length:9},(_,i)=>({id:`PAT-${String(i+1).padStart(3,'0')}`,name:['Rahul Sharma','Priya Verma','Amit Patel','Neha Singh','Vikram Joshi','Anjali Mehta','Suresh Gupta','Kavya Rao','Rohan Singh'][i],dob:`${1980+i*2}-0${(i%9)+1}-15`,gender:i%2?'Female':'Male',blood:['O+','A+','B+','AB+'][i%4],phone:`98${String(76543000+i)}`,allergies:i%3?'None':'Penicillin',diagnosis:'Routine Evaluation',notes:'Demo clinical history',createdDate:new Date().toISOString(),reports:[]})),
  schedules:[
    {id:'SCH-001',doctorId:'DOC-001',day:'Monday',start:'10:00',end:'13:00',type:'OPD',room:'C-101',maxPatients:12},
    {id:'SCH-002',doctorId:'DOC-002',day:'Tuesday',start:'11:00',end:'14:00',type:'ONLINE',room:'Virtual',maxPatients:8},
    {id:'SCH-003',doctorId:'DOC-003',day:'Wednesday',start:'09:00',end:'12:00',type:'OPD',room:'O-201',maxPatients:10},
    {id:'SCH-004',doctorId:'DOC-004',day:'Thursday',start:'10:00',end:'13:00',type:'OPD',room:'P-101',maxPatients:12}
  ],
  leaves:[{id:'LEV-001',doctorId:'DOC-006',from:'2026-09-01',to:'2026-09-10',reason:'Approved leave',status:'Approved'}],
  students:['Aarav Singh','Diya Sharma','Kunal Verma','Meera Patel','Riya Gupta'].map((name,i)=>({id:`STU-${i+1}`,name,year:'MBBS '+(i%4+1),dept:'Medicine',attendance:72+i*5,hostel:`A-${201+i}`})),
  hostel:Array.from({length:12},(_,i)=>({id:`ROOM-${i+1}`,hostel:i<6?'Hostel A':'Hostel B',room:`${i<6?'A':'B'}-${201+i}`,occupant:i<5?['Aarav Singh','Diya Sharma','Kunal Verma','Meera Patel','Riya Gupta'][i]:'',status:i<5?'Occupied':'Available',capacity:2})),
  pharmacy:[{id:'MED-001',name:'Paracetamol 650mg',category:'Tablet',stock:150,expiry:'2027-06-30'},{id:'MED-002',name:'Amoxicillin 500mg',category:'Capsule',stock:80,expiry:'2027-08-15'},{id:'MED-003',name:'Cetirizine',category:'Tablet',stock:120,expiry:'2027-07-20'}],
  labs:[{id:'LAB-001',test:'Complete Blood Count (CBC)',patient:'Rahul Sharma',date:'2026-09-01',status:'Completed'},{id:'LAB-002',test:'Blood Sugar (Fasting)',patient:'Priya Verma',date:'2026-09-02',status:'Completed'},{id:'LAB-003',test:'Liver Function Test',patient:'Amit Patel',date:'2026-09-03',status:'Pending'}],
  appointments:[
    {id:'APT-001',patientId:'PAT-001',patientName:'Rahul Sharma',doctorId:'DOC-001',doctor:'Dr. Amit Sharma',department:'Cardiology',specialty:'Cardiology',date:'2026-09-07',time:'10:00',type:'OPD',room:'C-101',status:'Confirmed'},
    {id:'APT-002',patientId:'PAT-002',patientName:'Priya Verma',doctorId:'DOC-002',doctor:'Dr. Neha Verma',department:'Neurology',specialty:'Neurology',date:'2026-09-08',time:'11:00',type:'ONLINE',room:'Virtual',status:'Pending'},
    {id:'APT-003',patientId:'PAT-003',patientName:'Amit Patel',doctorId:'DOC-003',doctor:'Dr. Raj Patel',department:'Orthopedics',specialty:'Orthopedics',date:'2026-09-09',time:'09:00',type:'OPD',room:'O-201',status:'Completed'},
    {id:'APT-004',patientId:'PAT-004',patientName:'Neha Singh',doctorId:'DOC-004',doctor:'Dr. Pooja Singh',department:'Pediatrics',specialty:'Pediatrics',date:'2026-09-10',time:'10:00',type:'OPD',room:'P-101',status:'Cancelled'},
    {id:'APT-005',patientId:'PAT-005',patientName:'Vikram Joshi',doctorId:'DOC-005',doctor:'Dr. Mohit Jain',department:'Dermatology',specialty:'Dermatology',date:'2026-09-11',time:'12:00',type:'ONLINE',room:'Virtual',status:'Confirmed'}
  ],
  beds:[{id:'B-001',ward:'General',status:'Available',patient:''},{id:'B-002',ward:'General',status:'Occupied',patient:'Rahul Sharma'},{id:'B-003',ward:'ICU',status:'Occupied',patient:'Emergency Case'},{id:'B-004',ward:'ICU',status:'Available',patient:''}],
  billing:[{id:'INV-001',patientId:'PAT-001',patient:'Rahul Sharma',amount:4200,status:'Paid',date:'2026-09-01'}]
};
