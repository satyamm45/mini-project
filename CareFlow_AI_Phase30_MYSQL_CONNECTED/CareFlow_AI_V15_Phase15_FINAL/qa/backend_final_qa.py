import os, sys, tempfile
from datetime import datetime, timezone
fd,path=tempfile.mkstemp(suffix='.db');os.close(fd)
os.environ['CAREFLOW_DATABASE_URL']='sqlite:///'+path
from fastapi.testclient import TestClient
from backend.app import app
c=TestClient(app)
def login(e,r):
    x=c.post('/api/auth/login',json={'email':e,'password':'password','role':r}); assert x.status_code==200,x.text; return {'Authorization':'Bearer '+x.json()['token']}
doc=login('doctor@careflow.com','Doctor'); rec=login('reception@careflow.com','Receptionist'); student=login('student@careflow.com','Student'); admin=login('admin@careflow.com','Hospital Administrator')
assert c.get('/api/health').status_code==200
assert c.post('/api/v1/patients',headers=student,json={'name':'blocked'}).status_code==403
assert c.post('/api/v1/patients',headers=doc,json={'id':'QA-P','name':'QA Patient'}).status_code==200
assert c.post('/api/v1/doctors',headers=admin,json={'id':'QA-D','name':'QA Doctor'}).status_code==200
payload={'patient_id':'QA-P','doctor_id':'QA-D','start_at':datetime(2032,1,1,9,tzinfo=timezone.utc).isoformat()}
assert c.post('/api/v1/appointments',headers=rec,json=payload).status_code==200
assert c.post('/api/v1/appointments',headers=rec,json=payload).status_code==409
rx=c.post('/api/v1/prescriptions',headers=doc,json={'patient_id':'QA-P','doctor_id':'QA-D','draft':[{'medicine':'QA'}]});assert rx.status_code==200
rid=rx.json()['record']['id'];assert c.post(f'/api/v1/prescriptions/{rid}/decision',headers=doc,json={'decision':'Approved'}).status_code==200
assert c.post(f'/api/v1/prescriptions/{rid}/decision',headers=doc,json={'decision':'Rejected'}).status_code==409
assert c.get('/api/audit/verify',headers=doc).json()['valid'] is True
assert c.get('/api/v1/dashboard/summary',headers=doc).status_code==200
os.remove(path);print('BACKEND_PHASE16_30_FINAL_QA_PASS')
