import json,uuid
from datetime import timedelta
import pytest
from sqlalchemy import select
from app.models.core import Property,utcnow
from app.models.inbox import Message,Conversation
from app.models.website import WebsiteSession,WebsiteRateBucket
from app import main
from app.routes import chat
from test_staff import env,auth

ORIGIN='https://stonetrailvillas.com'
@pytest.fixture
def website(env,monkeypatch):
 c,f=env;h=auth(c,'manager')
 prop=c.get('/api/staff/me',headers=h).json()['property_id']
 monkeypatch.setenv('WEBSITE_PROPERTY_ID',prop)
 monkeypatch.setenv('WEBSITE_ALLOWED_ORIGINS',ORIGIN+',https://www.stonetrailvillas.com')
 monkeypatch.setenv('WEBSITE_AI_ENABLED','false')
 monkeypatch.setenv('WEBSITE_RATE_LIMIT_SECRET','test-rate-secret')
 return c,f,h

def visitor(c,origin=ORIGIN):
 r=c.post('/api/chat/session',headers={'Origin':origin})
 assert r.status_code==201,r.text
 return {'Origin':origin,'Authorization':'Bearer '+r.json()['sessionToken']}
def send(c,v,text='Hello',requestid=None):
 return c.post('/api/chat/message',headers=v,json={'message':text,'requestId':requestid or str(uuid.uuid4())})
def conversation(c,h):return c.get('/api/staff/conversations',headers=h).json()[0]['id']

def test_cors_godaddy_preflight():
 from fastapi.testclient import TestClient
 c=TestClient(main.app)
 for origin in [ORIGIN,'https://www.stonetrailvillas.com']:
  for path in ['/api/chat/session','/api/chat/message','/api/availability/search']:
   r=c.options(path,headers={'Origin':origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'})
   assert r.status_code==200,r.text
   assert r.headers['access-control-allow-origin']==origin
 r=c.options('/api/chat/message',headers={'Origin':'https://other.example','Access-Control-Request-Method':'POST'})
 assert r.status_code==400
 assert 'access-control-allow-origin' not in r.headers

def test_visitor_token_and_origin_isolation(website):
 c,f,h=website;v=visitor(c)
 assert c.get('/api/chat/messages',headers={'Origin':ORIGIN}).status_code==401
 assert c.get('/api/chat/messages',headers={**v,'Origin':'https://www.stonetrailvillas.com'}).status_code==401
 assert c.get('/api/chat/messages',headers={**v,'Origin':'https://other.example'}).status_code==403
 assert c.post('/api/chat/session').status_code==403
 assert 'sessionToken' not in c.get('/api/chat/messages',headers=v).text
 with f() as d:
  s=d.scalar(select(WebsiteSession));assert s.token_hash not in v['Authorization'];s.expires_at=utcnow()-timedelta(seconds=1);d.commit()
 assert c.get('/api/chat/messages',headers=v).status_code==401

def test_guest_staff_roundtrip_private_notes_and_duplicates(website):
 c,f,h=website;v=visitor(c);requestid=str(uuid.uuid4())
 assert send(c,v,requestid=requestid).status_code==200
 assert send(c,v,requestid=requestid).status_code==200
 assert send(c,v,text='Different',requestid=requestid).status_code==409
 i=conversation(c,h);url='/api/staff/conversations/'+i+'/messages'
 assert c.post(url,headers=h,json={'body':'Private staff note','kind':'note'}).status_code==201
 headers={**h,'Idempotency-Key':'website-reply-000001'}
 response=c.post(url,headers=headers,json={'body':'Hello from reception','kind':'reply'})
 assert response.status_code==201,response.text
 assert response.json()['status']=='available'
 assert c.post(url,headers=headers,json={'body':'Hello from reception','kind':'reply'}).json()['message_id']==response.json()['message_id']
 feed=c.get('/api/chat/messages',headers=v)
 assert feed.headers['cache-control']=='no-store'
 assert 'Private staff note' not in feed.text
 assert len([m for m in feed.json()['messages'] if m['kind']=='guest'])==1
 assert len([m for m in feed.json()['messages'] if m['body']=='Hello from reception'])==1
 other=visitor(c);assert c.get('/api/chat/messages',headers=other).json()['messages']==[]
 assert c.get('/api/staff/conversations/'+i,headers=auth(c,'other')).status_code==404
 assert c.delete('/api/chat/session',headers=v).status_code==204
 assert c.get('/api/chat/messages',headers=v).status_code==401
 assert c.post(url,headers={**h,'Idempotency-Key':'website-reply-000002'},json={'body':'Expired','kind':'reply'}).status_code==409

def test_handoff_blocks_ai_and_new_messages_remain_human(website,monkeypatch):
 c,f,h=website;monkeypatch.setenv('WEBSITE_AI_ENABLED','true');v=visitor(c)
 def forbidden(*a,**k):raise AssertionError('AI must not run after handoff')
 monkeypatch.setattr(chat,'run_hotel_agent',forbidden)
 assert send(c,v,'I need to speak to a person').status_code==200
 assert send(c,v,'What is next?').status_code==200
 feed=c.get('/api/chat/messages',headers=v).json();assert feed['humanOwned']
 assert not [m for m in feed['messages'] if m['kind']=='ai']

def test_staff_takeover_during_generation_and_history_excludes_notes(website,monkeypatch):
 c,f,h=website;monkeypatch.setenv('WEBSITE_AI_ENABLED','true');v=visitor(c)
 def model(text,history=None):
  i=conversation(c,h)
  c.post('/api/staff/conversations/'+i+'/messages',headers=h,json={'kind':'note','body':'Internal only'})
  assert all(x['content']!='Internal only' for x in history)
  assert c.patch('/api/staff/conversations/'+i,headers=h,json={'human_owned':True}).status_code==200
  return 'Must be discarded'
 monkeypatch.setattr(chat,'run_hotel_agent',model)
 assert send(c,v).status_code==200
 feed=c.get('/api/chat/messages',headers=v).json();assert feed['humanOwned'];assert not [m for m in feed['messages'] if m['kind']=='ai']

def test_ai_reply_and_guest_history(website,monkeypatch):
 c,f,h=website;monkeypatch.setenv('WEBSITE_AI_ENABLED','true');v=visitor(c);calls=[]
 def model(text,history=None):calls.append(history);return 'Welcome'
 monkeypatch.setattr(chat,'run_hotel_agent',model)
 assert send(c,v).status_code==200
 assert send(c,v,'Is there parking?').status_code==200
 assert calls[1]==[{'role':'user','content':'Hello'},{'role':'assistant','content':'Welcome'}]
 assert len([m for m in c.get('/api/chat/messages',headers=v).json()['messages'] if m['kind']=='ai'])==2

def test_guest_rate_limit_and_property_configuration(website,monkeypatch):
 from app.services import website_service
 fixed=utcnow();monkeypatch.setattr(website_service,'utcnow',lambda:fixed)
 c,f,h=website;v=visitor(c)
 for _ in range(30):assert send(c,v).status_code==200
 assert send(c,v).status_code==429
 monkeypatch.setenv('WEBSITE_PROPERTY_ID','missing-property')
 assert c.post('/api/chat/session',headers={'Origin':ORIGIN}).status_code==503
