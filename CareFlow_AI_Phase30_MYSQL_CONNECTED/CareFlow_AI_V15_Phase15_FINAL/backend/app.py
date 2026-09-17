from __future__ import annotations

import hashlib, hmac, json, os, secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, EmailStr, field_validator
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, create_engine, delete, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

ROOT=Path(__file__).resolve().parents[1]
# Lightweight .env loader so the project works without an extra dotenv dependency.
ENV_FILE=ROOT/'backend'/'.env'
if ENV_FILE.exists():
    for raw in ENV_FILE.read_text(encoding='utf-8').splitlines():
        line=raw.strip()
        if not line or line.startswith('#') or '=' not in line: continue
        key,value=line.split('=',1); key=key.strip(); value=value.strip().strip('\"').strip("'")
        os.environ.setdefault(key,value)
DATABASE_URL=os.getenv('CAREFLOW_DATABASE_URL',f"sqlite:///{ROOT/'backend'/'careflow.db'}")
# SQLAlchemy's MySQL URL is intentionally explicit: mysql+pymysql://USER:PASSWORD@HOST:3306/DB
if DATABASE_URL.startswith('mysql://'):
    DATABASE_URL='mysql+pymysql://'+DATABASE_URL[len('mysql://'):]
JWT_SECRET=os.getenv('CAREFLOW_JWT_SECRET','careflow-development-secret-change-this-please')
TOKEN_HOURS=int(os.getenv('CAREFLOW_TOKEN_HOURS','8'))
engine=create_engine(DATABASE_URL,future=True,pool_pre_ping=True,connect_args={'check_same_thread':False} if DATABASE_URL.startswith('sqlite') else {})
SessionLocal=sessionmaker(bind=engine,autoflush=False,autocommit=False,expire_on_commit=False)

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__='users'
    id:Mapped[str]=mapped_column(String(64),primary_key=True)
    email:Mapped[str]=mapped_column(String(255),unique=True,index=True)
    name:Mapped[str]=mapped_column(String(255))
    role:Mapped[str]=mapped_column(String(100),index=True)
    department:Mapped[str]=mapped_column(String(255),default='')
    password_hash:Mapped[str]=mapped_column(String(255))
    active:Mapped[bool]=mapped_column(Boolean,default=True)

class CollectionRecord(Base):
    __tablename__='collection_records'
    id:Mapped[str]=mapped_column(String(128),primary_key=True)
    collection:Mapped[str]=mapped_column(String(100),index=True)
    record_id:Mapped[str]=mapped_column(String(128),index=True)
    payload:Mapped[Any]=mapped_column(JSON)
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc),onupdate=lambda:datetime.now(timezone.utc))
    __table_args__=(UniqueConstraint('collection','record_id',name='uq_collection_record'),)

class AuditLog(Base):
    __tablename__='audit_logs'
    id:Mapped[str]=mapped_column(String(128),primary_key=True)
    user_id:Mapped[str]=mapped_column(String(64),index=True)
    role:Mapped[str]=mapped_column(String(100))
    action:Mapped[str]=mapped_column(String(100))
    entity_type:Mapped[str]=mapped_column(String(100))
    entity_id:Mapped[str]=mapped_column(String(128))
    timestamp:Mapped[datetime]=mapped_column(DateTime(timezone=True),index=True)
    previous_hash:Mapped[str]=mapped_column(String(128),default='')
    hash:Mapped[str]=mapped_column(String(128))
    details:Mapped[Any]=mapped_column(JSON,default=dict)

# Normalized high-value tables. The JSON collection layer remains for backwards-compatible prototype modules.
class Patient(Base):
    __tablename__='patients'
    id:Mapped[str]=mapped_column(String(64),primary_key=True)
    name:Mapped[str]=mapped_column(String(255))
    phone:Mapped[str]=mapped_column(String(40),default='')
    dob:Mapped[str]=mapped_column(String(40),default='')
    gender:Mapped[str]=mapped_column(String(30),default='')
    blood_group:Mapped[str]=mapped_column(String(10),default='')
    status:Mapped[str]=mapped_column(String(40),default='Active')
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))

class Doctor(Base):
    __tablename__='doctors'
    id:Mapped[str]=mapped_column(String(64),primary_key=True)
    name:Mapped[str]=mapped_column(String(255))
    specialty:Mapped[str]=mapped_column(String(255),default='')
    department:Mapped[str]=mapped_column(String(255),default='')
    active:Mapped[bool]=mapped_column(Boolean,default=True)

class Appointment(Base):
    __tablename__='appointments'
    id:Mapped[str]=mapped_column(String(64),primary_key=True)
    patient_id:Mapped[str]=mapped_column(ForeignKey('patients.id'))
    doctor_id:Mapped[str]=mapped_column(ForeignKey('doctors.id'))
    start_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),index=True)
    status:Mapped[str]=mapped_column(String(40),default='Scheduled')
    booked_by:Mapped[str]=mapped_column(String(64))
    reason:Mapped[str]=mapped_column(Text,default='')

class Prescription(Base):
    __tablename__='prescriptions'
    id:Mapped[str]=mapped_column(String(64),primary_key=True)
    patient_id:Mapped[str]=mapped_column(ForeignKey('patients.id'))
    doctor_id:Mapped[str]=mapped_column(ForeignKey('doctors.id'))
    status:Mapped[str]=mapped_column(String(50),default='Pending Doctor Review')
    decision:Mapped[str]=mapped_column(String(50),default='')
    doctor_note:Mapped[str]=mapped_column(Text,default='')
    draft:Mapped[Any]=mapped_column(JSON,default=list)
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc),onupdate=lambda:datetime.now(timezone.utc))

class Consent(Base):
    __tablename__='consents'
    id:Mapped[str]=mapped_column(String(64),primary_key=True)
    patient_id:Mapped[str]=mapped_column(String(64),index=True)
    consent_type:Mapped[str]=mapped_column(String(100))
    granted:Mapped[bool]=mapped_column(Boolean,default=False)
    granted_by:Mapped[str]=mapped_column(String(64))
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))

class BaseRequest(BaseModel):
    model_config={'extra':'allow'}

class LoginRequest(BaseModel):
    email:str
    password:str
    role:str

class CollectionSyncRequest(BaseModel): records:Any=Field(default_factory=list)
class DecisionRequest(BaseModel):
    decision:str
    doctor_note:str=''
    draft:list[dict[str,Any]]=Field(default_factory=list)
class AppointmentCreate(BaseModel):
    id:str|None=None; patient_id:str; doctor_id:str; start_at:datetime; reason:str=''
class PrescriptionCreate(BaseModel):
    id:str|None=None; patient_id:str; doctor_id:str; draft:list[dict[str,Any]]=Field(default_factory=list)
class ConsentRequest(BaseModel):
    consent_type:str; granted:bool

DEMO_USERS={
'Chairman':('chairman@careflow.com','Chairman Office','Executive Office'),'Hospital Administrator':('admin@careflow.com','Hospital Administration','Hospital Administration'),'College Administrator':('college@careflow.com','College Administration','Medical College Administration'),'Hostel Administrator':('hostel@careflow.com','Hostel Administration','Hostel Administration'),'Medical Director':('medicaldirector@careflow.com','Dr. Medical Director','Clinical Administration'),'Dean':('dean@careflow.com','Dean Medical College','Medical College'),'HOD':('hod@careflow.com','Dr. Department Head','Clinical Department'),'Doctor':('doctor@careflow.com','Dr. Alexander Smith','Clinical Services'),'Nurse':('nurse@careflow.com','Nurse Clara Jones','Nursing Services'),'Receptionist':('reception@careflow.com','Front Desk Reception','Front Desk'),'Pharmacist':('pharmacy@careflow.com','Pharmacy Officer','Pharmacy'),'Lab Technician':('lab@careflow.com','Laboratory Officer','Laboratory'),'Student':('student@careflow.com','Medical Student','Medical College'),'Patient':('patient@careflow.com','Patient Portal User','Patient Portal')}
COLLECTIONS=['patients','doctors','departments','schedules','appointments','leaves','consultations','prescriptions','labs','pharmacy','billing','beds','operations','students','hostel','users','audit','staff','faculty','finance','emergencies','bloodBank','ambulances','consent','research','settings']
WRITE_PERMISSIONS={
'Chairman':set(COLLECTIONS),'Hospital Administrator':set(COLLECTIONS)-{'students','faculty','research','hostel'},'College Administrator':{'students','faculty','departments','staff','research','consultations'},'Hostel Administrator':{'hostel','students','staff','finance'},'Medical Director':{'patients','doctors','departments','schedules','appointments','leaves','consultations','prescriptions','labs'},'Dean':{'students','faculty','departments','research'},'HOD':{'doctors','departments','schedules','appointments','patients','consultations','prescriptions','labs'},'Doctor':{'patients','appointments','consultations','prescriptions','labs','consent'},'Nurse':{'patients'},'Receptionist':{'patients','appointments','consultations'},'Pharmacist':{'prescriptions','pharmacy'},'Lab Technician':{'labs'},'Student':set(),'Patient':{'appointments','consultations','consent'}}


def hpw(password,salt=None):
    salt=salt or secrets.token_bytes(16); d=hashlib.pbkdf2_hmac('sha256',password.encode(),salt,210000)
    return f'pbkdf2_sha256$210000${salt.hex()}${d.hex()}'
def vpw(password,stored):
    try:
        scheme,rounds,salt,digest=stored.split('$'); cand=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),int(rounds)).hex(); return scheme=='pbkdf2_sha256' and hmac.compare_digest(cand,digest)
    except Exception:return False
def token(user):
    now=datetime.now(timezone.utc); return jwt.encode({'sub':user.id,'email':user.email,'role':user.role,'iat':now,'exp':now+timedelta(hours=TOKEN_HOURS)},JWT_SECRET,algorithm='HS256')
def db_session():
    db=SessionLocal()
    try:yield db
    finally:db.close()
def current_user(authorization:str|None=Header(default=None),db:Session=Depends(db_session)):
    if not authorization or not authorization.lower().startswith('bearer '):raise HTTPException(401,'Authentication required')
    try:uid=jwt.decode(authorization.split(' ',1)[1],JWT_SECRET,algorithms=['HS256']).get('sub')
    except jwt.PyJWTError:raise HTTPException(401,'Invalid or expired session')
    user=db.get(User,uid)
    if not user or not user.active:raise HTTPException(401,'User is inactive or missing')
    return user
def user_dict(u):return {'id':u.id,'email':u.email,'name':u.name,'role':u.role,'department':u.department}
def audit(db,user,action,etype,eid,details=None):
    now=datetime.now(timezone.utc).replace(tzinfo=None); last=db.scalar(select(AuditLog).order_by(AuditLog.timestamp.desc(),AuditLog.id.desc()).limit(1)); prev=last.hash if last else 'GENESIS'; aid=f'AUD-{secrets.token_hex(8)}'
    canonical=json.dumps({'id':aid,'userId':user.id,'role':user.role,'action':action,'entityType':etype,'entityId':str(eid),'timestamp':now.isoformat(),'prevHash':prev,'details':details or {}},sort_keys=True,separators=(',',':')); digest=hashlib.sha256(canonical.encode()).hexdigest()
    db.add(AuditLog(id=aid,user_id=user.id,role=user.role,action=action,entity_type=etype,entity_id=str(eid),timestamp=now,previous_hash=prev,hash=digest,details=details or {})); db.commit(); return digest

def can_write(u,c):return c in WRITE_PERMISSIONS.get(u.role,set())
def get_collection(db,c):
    rows=db.scalars(select(CollectionRecord).where(CollectionRecord.collection==c)).all()
    if c=='settings':
        r=next((x for x in rows if x.record_id=='__singleton__'),None); return r.payload if r else {}
    return [r.payload for r in rows]
def replace_collection(db,c,records):
    db.execute(delete(CollectionRecord).where(CollectionRecord.collection==c)); now=datetime.now(timezone.utc)
    if c=='settings':db.add(CollectionRecord(id=f'{c}::__singleton__',collection=c,record_id='__singleton__',payload=records,updated_at=now))
    else:
        if not isinstance(records,list):raise HTTPException(422,f"Collection '{c}' must be an array")
        ids=set()
        for item in records:
            if not isinstance(item,dict):raise HTTPException(422,'Records must be objects')
            rid=str(item.get('id') or secrets.token_hex(8))
            if rid in ids:raise HTTPException(422,f'Duplicate record id: {rid}')
            ids.add(rid); db.add(CollectionRecord(id=f'{c}::{rid}',collection=c,record_id=rid,payload=item,updated_at=now))
    db.commit()

def seed_users(db):
    for role,(email,name,dept) in DEMO_USERS.items():
        if not db.scalar(select(User).where(User.email==email)):db.add(User(id=f'USR-{secrets.token_hex(6)}',email=email,name=name,role=role,department=dept,password_hash=hpw('password')))
    db.commit()

def init_db():Base.metadata.create_all(engine); \
    (lambda db:(seed_users(db),db.close()))(SessionLocal())
init_db()

app=FastAPI(title='CareFlow AI Backend',version='2.0.0')
app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_credentials=False,allow_methods=['*'],allow_headers=['*'])

@app.get('/api/health')
def health(db:Session=Depends(db_session)):
    db.execute(select(User).limit(1)).first(); return {'status':'ok','service':'careflow-api','version':'2.0.0','database':'connected','time':datetime.now(timezone.utc).isoformat()}
@app.get('/api/db/info')
def db_info(u=Depends(current_user)):
    safe_url=DATABASE_URL
    if '://' in safe_url and '@' in safe_url:
        prefix,rest=safe_url.split('://',1)
        creds,host=rest.rsplit('@',1)
        if ':' in creds:
            user=creds.split(':',1)[0]
            safe_url=f'{prefix}://{user}:***@{host}'
    return {'connected':True,'driver':engine.url.drivername,'backend':engine.url.get_backend_name(),'database':engine.url.database,'url':safe_url}

@app.post('/api/auth/login')
def login(body:LoginRequest,db:Session=Depends(db_session)):
    u=db.scalar(select(User).where(User.email==body.email.strip().lower()))
    if not u or u.role!=body.role or not vpw(body.password,u.password_hash):raise HTTPException(401,'Invalid credentials')
    return {'token':token(u),'user':user_dict(u)}
@app.get('/api/me')
def me(u=Depends(current_user)):return user_dict(u)
@app.get('/api/permissions')
def permissions(u=Depends(current_user)):return {'role':u.role,'writableCollections':sorted(WRITE_PERMISSIONS.get(u.role,set()))}
@app.get('/api/bootstrap')
def bootstrap(u=Depends(current_user),db:Session=Depends(db_session)):
    data={c:get_collection(db,c) for c in COLLECTIONS}; initialized=any((isinstance(v,list) and v) or (isinstance(v,dict) and v) for v in data.values())
    return {'initialized':bool(initialized),'user':user_dict(u),'data':data}
@app.post('/api/migrate')
def migrate(body:dict[str,Any],u=Depends(current_user),db:Session=Depends(db_session)):
    if db.scalar(select(CollectionRecord.id).limit(1)):raise HTTPException(409,'Backend is already initialized')
    data=body.get('data') or {}
    for c in COLLECTIONS:
        if c in data:replace_collection(db,c,data[c])
    audit(db,u,'MIGRATE','System','bootstrap',{'collections':list(data.keys())}); return {'ok':True,'initialized':True}
@app.get('/api/collections/{collection}')
def read_collection(collection,u=Depends(current_user),db:Session=Depends(db_session)):
    if collection not in COLLECTIONS:raise HTTPException(404,'Unknown collection')
    return {'collection':collection,'records':get_collection(db,collection)}
@app.put('/api/collections/{collection}')
def sync_collection(collection,body:CollectionSyncRequest,u=Depends(current_user),db:Session=Depends(db_session)):
    if collection not in COLLECTIONS:raise HTTPException(404,'Unknown collection')
    if not can_write(u,collection):raise HTTPException(403,f"Role '{u.role}' cannot modify {collection}")
    replace_collection(db,collection,body.records); audit(db,u,'SYNC','Collection',collection,{'count':len(body.records) if isinstance(body.records,list) else 1}); return {'ok':True,'collection':collection}

# Normalized API: patients/doctors
@app.get('/api/v1/patients')
def patients(q:str='',limit:int=Query(100,ge=1,le=500),u=Depends(current_user),db:Session=Depends(db_session)):
    stmt=select(Patient).order_by(Patient.created_at.desc()).limit(limit)
    if q:stmt=stmt.where(Patient.name.ilike(f'%{q}%'))
    rows=db.scalars(stmt).all();
    if u.role=='Patient':
        # Patient portal has no credentials in the prototype, so this role returns an empty server-scoped list.
        rows=[]
    return {'records':[{'id':p.id,'name':p.name,'phone':p.phone,'dob':p.dob,'gender':p.gender,'bloodGroup':p.blood_group,'status':p.status} for p in rows]}
@app.post('/api/v1/patients')
def create_patient(body:dict[str,Any],u=Depends(current_user),db:Session=Depends(db_session)):
    if not can_write(u,'patients'):raise HTTPException(403,'Patient write permission required')
    pid=str(body.get('id') or f'PAT-{secrets.token_hex(5)}')
    if db.get(Patient,pid):raise HTTPException(409,'Patient ID already exists')
    p=Patient(id=pid,name=str(body.get('name','')).strip(),phone=str(body.get('phone','')),dob=str(body.get('dob','')),gender=str(body.get('gender','')),blood_group=str(body.get('bloodGroup','')),status=str(body.get('status','Active')))
    if not p.name:raise HTTPException(422,'Patient name is required')
    db.add(p);db.commit();audit(db,u,'CREATE','Patient',pid);return {'ok':True,'record':{'id':p.id,'name':p.name}}
@app.patch('/api/v1/patients/{pid}')
def update_patient(pid:str, body:dict[str,Any], u=Depends(current_user), db:Session=Depends(db_session)):
    if not can_write(u,'patients'): raise HTTPException(403,'Patient write permission required')
    p=db.get(Patient,pid)
    if not p: raise HTTPException(404,'Patient not found')
    for src,dst in {'name':'name','phone':'phone','dob':'dob','gender':'gender','bloodGroup':'blood_group','status':'status'}.items():
        if src in body: setattr(p,dst,str(body[src]))
    if not p.name.strip(): raise HTTPException(422,'Patient name is required')
    db.commit(); audit(db,u,'UPDATE','Patient',pid); return {'ok':True,'record':{'id':p.id,'name':p.name,'phone':p.phone,'dob':p.dob,'gender':p.gender,'bloodGroup':p.blood_group,'status':p.status}}

@app.delete('/api/v1/patients/{pid}')
def delete_patient(pid:str,u=Depends(current_user),db:Session=Depends(db_session)):
    if not can_write(u,'patients'): raise HTTPException(403,'Patient write permission required')
    p=db.get(Patient,pid)
    if not p: raise HTTPException(404,'Patient not found')
    if db.scalar(select(func.count()).select_from(Appointment).where(Appointment.patient_id==pid)):
        raise HTTPException(409,'Patient has appointments; archive/status-change instead of destructive delete')
    db.delete(p);db.commit();audit(db,u,'DELETE','Patient',pid);return {'ok':True,'deleted':pid}

@app.get('/api/v1/doctors')
def doctors(q:str='',u=Depends(current_user),db:Session=Depends(db_session)):
    stmt=select(Doctor).where(Doctor.active.is_(True));
    if q:stmt=stmt.where(Doctor.name.ilike(f'%{q}%'))
    return {'records':[{'id':d.id,'name':d.name,'specialty':d.specialty,'department':d.department} for d in db.scalars(stmt).all()]}
@app.post('/api/v1/doctors')
def create_doctor(body:dict[str,Any],u=Depends(current_user),db:Session=Depends(db_session)):
    if not can_write(u,'doctors'):raise HTTPException(403,'Doctor write permission required')
    did=str(body.get('id') or f'DOC-{secrets.token_hex(5)}');
    if db.get(Doctor,did):raise HTTPException(409,'Doctor ID already exists')
    d=Doctor(id=did,name=str(body.get('name','')).strip(),specialty=str(body.get('specialty','')),department=str(body.get('department','')))
    if not d.name:raise HTTPException(422,'Doctor name is required')
    db.add(d);db.commit();audit(db,u,'CREATE','Doctor',did);return {'ok':True,'record':{'id':d.id,'name':d.name}}

# Appointment engine: conflict-safe and server authoritative.
@app.patch('/api/v1/appointments/{aid}')
def update_appointment(aid:str, body:dict[str,Any],u=Depends(current_user),db:Session=Depends(db_session)):
    if not can_write(u,'appointments'): raise HTTPException(403,'Appointment write permission required')
    a=db.get(Appointment,aid)
    if not a: raise HTTPException(404,'Appointment not found')
    if 'status' in body:
        status=str(body['status'])
        if status not in {'Scheduled','Confirmed','Completed','Cancelled','No-show'}: raise HTTPException(422,'Invalid appointment status')
        a.status=status
    if 'reason' in body: a.reason=str(body['reason'])
    db.commit();audit(db,u,'UPDATE','Appointment',aid);return {'ok':True,'record':{'id':a.id,'status':a.status,'reason':a.reason}}

@app.post('/api/v1/appointments')
def create_appointment(body:AppointmentCreate,u=Depends(current_user),db:Session=Depends(db_session)):
    if u.role not in {'Patient','Receptionist','Hospital Administrator','Medical Director','HOD'}:raise HTTPException(403,'Appointment booking is restricted')
    if not db.get(Patient,body.patient_id) or not db.get(Doctor,body.doctor_id):raise HTTPException(404,'Patient or doctor not found')
    if body.start_at.tzinfo is None: body.start_at=body.start_at.replace(tzinfo=timezone.utc)
    end=body.start_at+timedelta(minutes=30)
    conflicts=db.scalars(select(Appointment).where(Appointment.doctor_id==body.doctor_id,Appointment.status.in_(['Scheduled','Confirmed']),Appointment.start_at>=body.start_at-timedelta(minutes=29),Appointment.start_at<end)).all()
    if conflicts:raise HTTPException(409,'Doctor is already booked for this time slot')
    aid=body.id or f'APT-{secrets.token_hex(5)}';
    if db.get(Appointment,aid):raise HTTPException(409,'Appointment ID already exists')
    a=Appointment(id=aid,patient_id=body.patient_id,doctor_id=body.doctor_id,start_at=body.start_at,status='Scheduled',booked_by=u.id,reason=body.reason);db.add(a);db.commit();audit(db,u,'CREATE','Appointment',aid,{'patientId':body.patient_id,'doctorId':body.doctor_id});return {'ok':True,'record':{'id':aid,'status':a.status}}
@app.get('/api/v1/appointments')
def list_appointments(u=Depends(current_user),db:Session=Depends(db_session)):
    stmt=select(Appointment).order_by(Appointment.start_at.desc())
    if u.role=='Doctor':
        d=db.scalar(select(Doctor).where(Doctor.name==u.name));
        if d:stmt=stmt.where(Appointment.doctor_id==d.id)
    rows=db.scalars(stmt).all();return {'records':[{'id':a.id,'patientId':a.patient_id,'doctorId':a.doctor_id,'startAt':a.start_at.isoformat(),'status':a.status,'reason':a.reason} for a in rows]}

# Prescription server workflow.
@app.get('/api/v1/prescriptions')
def list_prescriptions(status:str|None=None,u=Depends(current_user),db:Session=Depends(db_session)):
    stmt=select(Prescription).order_by(Prescription.updated_at.desc())
    if status: stmt=stmt.where(Prescription.status==status)
    rows=db.scalars(stmt).all()
    return {'records':[{'id':p.id,'patientId':p.patient_id,'doctorId':p.doctor_id,'status':p.status,'decision':p.decision,'doctorNote':p.doctor_note,'draft':p.draft or []} for p in rows]}

@app.post('/api/v1/prescriptions')
def create_prescription(body:PrescriptionCreate,u=Depends(current_user),db:Session=Depends(db_session)):
    if u.role not in {'Doctor','HOD','Medical Director'}:raise HTTPException(403,'Clinical prescription creation requires reviewer role')
    if not db.get(Patient,body.patient_id):raise HTTPException(404,'Patient not found')
    did=body.doctor_id; d=db.get(Doctor,did)
    if not d:raise HTTPException(404,'Doctor not found')
    pid=body.id or f'RX-{secrets.token_hex(5)}';
    if db.get(Prescription,pid):raise HTTPException(409,'Prescription ID already exists')
    p=Prescription(id=pid,patient_id=body.patient_id,doctor_id=did,status='Pending Doctor Review',draft=body.draft);db.add(p);db.commit();audit(db,u,'CREATE','Prescription',pid);return {'ok':True,'record':{'id':pid,'status':p.status}}
@app.post('/api/v1/prescriptions/{pid}/decision')
def prescription_decision(pid,body:DecisionRequest,u=Depends(current_user),db:Session=Depends(db_session)):
    if u.role not in {'Doctor','HOD','Medical Director'}:raise HTTPException(403,'Clinical reviewer role required')
    if body.decision not in {'Approved','Modified','Rejected'}:raise HTTPException(422,'Invalid prescription decision')
    p=db.get(Prescription,pid)
    if not p:raise HTTPException(404,'Prescription not found')
    if p.status not in {'Pending Doctor Review','Pending Review','PENDING_REVIEW'}:raise HTTPException(409,'Prescription is no longer pending review')
    p.decision=body.decision;p.status='Finalized' if body.decision in {'Approved','Modified'} else 'Rejected';p.doctor_note=body.doctor_note
    if body.draft:p.draft=body.draft
    db.commit();audit(db,u,'PRESCRIPTION_'+body.decision.upper(),'Prescription',pid,{'doctorNote':body.doctor_note});return {'ok':True,'prescription':{'id':p.id,'status':p.status,'decision':p.decision,'doctorNote':p.doctor_note,'draft':p.draft}}

@app.post('/api/v1/consents')
def set_consent(body:ConsentRequest,u=Depends(current_user),db:Session=Depends(db_session)):
    if u.role not in {'Patient','Doctor','Hospital Administrator','Medical Director'}:raise HTTPException(403,'Consent permission required')
    cid=f'{body.consent_type}::{u.id}'; row=db.get(Consent,cid); 
    if row:row.granted=body.granted;row.updated_at=datetime.now(timezone.utc)
    else:db.add(Consent(id=cid,patient_id=u.id,consent_type=body.consent_type,granted=body.granted,granted_by=u.id))
    db.commit();audit(db,u,'CONSENT_'+('GRANTED' if body.granted else 'REVOKED'),'Consent',cid);return {'ok':True,'granted':body.granted}

@app.post('/api/v1/migrate-normalized')
def migrate_normalized(u=Depends(current_user),db:Session=Depends(db_session)):
    if u.role not in {'Chairman','Hospital Administrator'}: raise HTTPException(403,'Administrative migration permission required')
    counts={'patients':0,'doctors':0,'appointments':0,'prescriptions':0}
    for item in get_collection(db,'patients'):
        pid=str(item.get('id',''))
        if pid and not db.get(Patient,pid):
            db.add(Patient(id=pid,name=str(item.get('name','Unknown')),phone=str(item.get('phone','')),dob=str(item.get('dob','')),gender=str(item.get('gender','')),blood_group=str(item.get('bloodGroup','')),status=str(item.get('status','Active'))));counts['patients']+=1
    for item in get_collection(db,'doctors'):
        did=str(item.get('id',''))
        if did and not db.get(Doctor,did):
            db.add(Doctor(id=did,name=str(item.get('name','Unknown')),specialty=str(item.get('specialty','')),department=str(item.get('department','')),active=True));counts['doctors']+=1
    db.commit()
    # Only import appointments/prescriptions when their referenced normalized entities exist.
    for item in get_collection(db,'appointments'):
        aid=str(item.get('id','')); pid=str(item.get('patientId',item.get('patient_id','')));did=str(item.get('doctorId',item.get('doctor_id','')));raw=item.get('startAt',item.get('dateTime',item.get('start_at')))
        if aid and pid and did and raw and db.get(Patient,pid) and db.get(Doctor,did) and not db.get(Appointment,aid):
            try: dt=datetime.fromisoformat(str(raw).replace('Z','+00:00')); dt=dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except ValueError: continue
            db.add(Appointment(id=aid,patient_id=pid,doctor_id=did,start_at=dt,status=str(item.get('status','Scheduled')),booked_by=u.id,reason=str(item.get('reason',''))));counts['appointments']+=1
    for item in get_collection(db,'prescriptions'):
        rid=str(item.get('id',''));pid=str(item.get('patientId',item.get('patient_id','')));did=str(item.get('doctorId',item.get('doctor_id','')))
        if rid and pid and did and db.get(Patient,pid) and db.get(Doctor,did) and not db.get(Prescription,rid):
            db.add(Prescription(id=rid,patient_id=pid,doctor_id=did,status=str(item.get('status','Pending Doctor Review')),decision=str(item.get('decision','')),doctor_note=str(item.get('doctorNote',item.get('doctor_note',''))),draft=item.get('draft',item.get('medications',[])) or []));counts['prescriptions']+=1
    db.commit();audit(db,u,'NORMALIZE_MIGRATION','System','v1',counts);return {'ok':True,'counts':counts}

@app.get('/api/audit')
def audit_list(limit:int=Query(100,ge=1,le=1000),u=Depends(current_user),db:Session=Depends(db_session)):
    rows=db.scalars(select(AuditLog).order_by(AuditLog.timestamp.desc(),AuditLog.id.desc()).limit(limit)).all();return {'records':[{'id':r.id,'userId':r.user_id,'role':r.role,'action':r.action,'entityType':r.entity_type,'entityId':r.entity_id,'timestamp':r.timestamp.isoformat(),'hash':r.hash,'previousHash':r.previous_hash} for r in rows]}
@app.get('/api/audit/verify')
def verify_audit(u=Depends(current_user),db:Session=Depends(db_session)):
    rows=db.scalars(select(AuditLog).order_by(AuditLog.timestamp.asc(),AuditLog.id.asc())).all();prev='GENESIS'
    for i,r in enumerate(rows,1):
        canonical=json.dumps({'id':r.id,'userId':r.user_id,'role':r.role,'action':r.action,'entityType':r.entity_type,'entityId':r.entity_id,'timestamp':r.timestamp.isoformat(),'prevHash':r.previous_hash,'details':r.details or {}},sort_keys=True,separators=(',',':'));expected=hashlib.sha256(canonical.encode()).hexdigest()
        if r.previous_hash!=prev or not hmac.compare_digest(r.hash,expected):return {'valid':False,'checked':i,'failedId':r.id}
        prev=r.hash
    return {'valid':True,'checked':len(rows),'head':prev}
@app.get('/api/v1/dashboard/summary')
def summary(u=Depends(current_user),db:Session=Depends(db_session)):
    return {'patients':db.scalar(select(func.count()).select_from(Patient)) or 0,'doctors':db.scalar(select(func.count()).select_from(Doctor)) or 0,'appointments':db.scalar(select(func.count()).select_from(Appointment)) or 0,'pendingPrescriptions':db.scalar(select(func.count()).select_from(Prescription).where(Prescription.status.like('Pending%'))) or 0,'auditEvents':db.scalar(select(func.count()).select_from(AuditLog)) or 0}

if (ROOT/'index.html').exists():app.mount('/',StaticFiles(directory=ROOT,html=True),name='frontend')
