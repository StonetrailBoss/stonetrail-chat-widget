import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base,get_db
from app.models.core import Tenant,Property
from app.models.inbox import Staff,Conversation,Message
from app.staff_security import hash_password

@pytest.fixture
def env():
 e=create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
 Base.metadata.create_all(e); factory=sessionmaker(bind=e)
 with factory() as d:
  t=Tenant(name='Test',slug='test');d.add(t);d.flush()
  a=Property(name='A',tenant_id=t.id);b=Property(name='B',tenant_id=t.id);d.add_all([a,b]);d.flush()
  for email,role,prop in [('manager','manager',a),('agent','agent',a),('auditor','auditor',a),('other','manager',b)]:
   d.add(Staff(email=email+'@test.com',role=role,property_id=prop.id,password_hash=hash_password('correct-password')))
  d.commit()
 def override():
  with factory() as d:yield d
 app.dependency_overrides[get_db]=override
 yield TestClient(app),factory
 app.dependency_overrides.clear();e.dispose()

def auth(c,name):
 r=c.post('/api/staff/login',json={'email':name+'@test.com','password':'correct-password'})
 assert r.status_code==200,r.text
 return {'Authorization':'Bearer '+r.json()['access_token']}

def test_sessions_and_permissions(env):
 c,_=env
 assert c.get('/api/staff/conversations').status_code==401
 assert c.post('/api/staff/login',json={'email':'manager@test.com','password':'bad'}).status_code==401
 h=auth(c,'manager')
 assert c.get('/api/staff/me',headers=h).json()['role']=='manager'
 assert c.post('/api/staff/logout',headers=h).status_code==204
 assert c.get('/api/staff/me',headers=h).status_code==401
 assert c.post('/api/staff/users',headers=auth(c,'agent'),json={'email':'x@test.com','password':'new-password-123'}).status_code==403

def test_inbox_isolation_and_handoff(env):
 c,f=env;h=auth(c,'manager')
 r=c.post('/api/staff/conversations',headers=h,json={'subject':'Arrival','body':'Need transfer'})
 assert r.status_code==201,r.text
 cid=r.json()['id'];url='/api/staff/conversations/'+cid
 assert c.get(url,headers=auth(c,'other')).status_code==404
 assert c.get('/api/staff/conversations',headers=auth(c,'other')).json()==[]
 assert c.post(url+'/messages',headers=auth(c,'auditor'),json={'body':'No'}).status_code==403
 assert c.patch(url,headers=auth(c,'agent'),json={'human_owned':False}).status_code==403
 other=c.get('/api/staff/me',headers=auth(c,'other')).json()['id']
 assert c.patch(url,headers=h,json={'assigned_to':other}).status_code==422
 assert c.post(url+'/messages',headers=h,json={'body':'Transfer noted','kind':'reply'}).json()['status']=='local_only'
 assert len(c.get(url,headers=h).json()['messages'])==2
 assert c.patch(url,headers=h,json={'status':'closed'}).status_code==200
 assert c.post(url+'/messages',headers=h,json={'body':'Closed'}).status_code==409
 assert c.patch(url,headers=h,json={'status':'open'}).status_code==200
 assert all(x['status']=='not_connected' for x in c.get('/api/staff/channels',headers=h).json())
