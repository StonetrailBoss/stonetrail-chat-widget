import asyncio,hashlib,hmac,json
from datetime import timedelta
import pytest
from sqlalchemy import select,func
from app.models.core import utcnow
from app.models.inbox import Conversation,Message
from app.models.messaging import ConversationRoute,DeliveryJob
from app import messaging_worker as worker
from app.whatsapp_client import DeliveryError
from test_staff import env,auth

@pytest.fixture
def messaging(env,monkeypatch):
 c,f=env
 for k,v in {'WHATSAPP_PHONE_NUMBER_ID':'123456','WHATSAPP_ACCESS_TOKEN':'test-only','WHATSAPP_API_VERSION':'v99.0','META_APP_SECRET':'test-secret','WHATSAPP_SEND_ENABLED':'true','WHATSAPP_AI_ENABLED':'false'}.items():monkeypatch.setenv(k,v)
 h=auth(c,'manager')
 assert c.post('/api/staff/channels/whatsapp',headers=h,json={'phone_number_id':'123456'}).status_code==200
 async def forbidden(*a,**k):raise AssertionError('Unexpected provider send')
 monkeypatch.setattr(worker,'send_whatsapp_text',forbidden)
 return c,f,h

def payload(mid='wamid.in',body='Hello',phone='123456',kind='text'):
 return {'object':'whatsapp_business_account','entry':[{'changes':[{'field':'messages','value':{'metadata':{'phone_number_id':phone},'messages':[{'id':mid,'from':'17845551234','timestamp':str(int(utcnow().timestamp())),'type':kind,'text':{'body':body}}]}}]}]}
def post(c,p,valid=True):
 raw=json.dumps(p).encode();sig='sha256='+hmac.new(b'test-secret',raw,hashlib.sha256).hexdigest()
 return c.post('/whatsapp/webhook',content=raw,headers={'Content-Type':'application/json','x-hub-signature-256':sig if valid else 'wrong'})
def cid(c,h):return c.get('/api/staff/conversations',headers=h).json()[0]['id']
def reply(c,h,i,body='We can arrange that',idem='request-1234567890'):
 return c.post('/api/staff/conversations/'+i+'/messages',headers={**h,'Idempotency-Key':idem},json={'kind':'reply','body':body})

def test_signed_ingestion_replay_and_mapping(messaging):
 c,f,h=messaging
 assert post(c,payload(),False).status_code==403
 assert post(c,payload()).json()['stored']==1
 assert post(c,payload()).json()['duplicates']==1
 assert len(c.get('/api/staff/conversations/'+cid(c,h),headers=h).json()['messages'])==1
 assert post(c,payload('other',phone='999999')).json()['stored']==0
 assert c.get('/api/staff/conversations',headers=auth(c,'other')).json()==[]
 assert c.post('/api/staff/channels/whatsapp',headers=auth(c,'other'),json={'phone_number_id':'123456'}).status_code==409
 assert c.get('/api/staff/channels',headers=h).json()[0]['status']=='inbound_verified'

def test_reply_idempotency_and_window(messaging,monkeypatch):
 c,f,h=messaging;post(c,payload());i=cid(c,h)
 a=reply(c,h,i);assert a.status_code==201,a.text
 assert a.json()['status']=='queued'
 assert reply(c,h,i).json()['message_id']==a.json()['message_id']
 assert reply(c,h,i,body='Different').status_code==409
 with f() as d:
  assert d.scalar(select(func.count()).select_from(DeliveryJob))==1
  route=d.scalar(select(ConversationRoute));route.last_inbound_at=utcnow()-timedelta(hours=25);d.commit()
 assert reply(c,h,i,idem='different-request-1').status_code==409
 monkeypatch.setenv('WHATSAPP_SEND_ENABLED','false')
 assert reply(c,h,i,idem='different-request-2').status_code==409
 with f() as d:assert d.scalar(select(func.count()).select_from(DeliveryJob))==1

def test_worker_receipts_and_no_resend(messaging,monkeypatch):
 c,f,h=messaging;post(c,payload());i=cid(c,h);reply(c,h,i);calls=[]
 async def send(to,text):calls.append(to);return {'messages':[{'id':'wamid.out'}]}
 monkeypatch.setattr(worker,'send_whatsapp_text',send)
 assert asyncio.run(worker.process_one(f));assert not asyncio.run(worker.process_one(f));assert len(calls)==1
 event=payload();v=event['entry'][0]['changes'][0]['value'];v.pop('messages');v['statuses']=[{'id':'wamid.out','status':'read','timestamp':str(int(utcnow().timestamp()))}]
 assert post(c,event).json()['stored']==1
 v['statuses'][0]['status']='sent';post(c,event)
 assert c.get('/api/staff/conversations/'+i,headers=h).json()['messages'][-1]['delivery_status']=='read'
 assert c.get('/api/staff/channels',headers=h).json()[0]['status']=='verified_send_receive'

def test_unknown_send_quarantined(messaging,monkeypatch):
 c,f,h=messaging;post(c,payload());reply(c,h,cid(c,h))
 async def timeout(*a):raise DeliveryError('transport_outcome_unknown',ambiguous=True)
 monkeypatch.setattr(worker,'send_whatsapp_text',timeout)
 assert asyncio.run(worker.process_one(f));assert not asyncio.run(worker.process_one(f))
 with f() as d:
  j=d.scalar(select(DeliveryJob));assert j.state=='unknown';assert j.attempts==1

def test_handoff_during_ai_generation(messaging,monkeypatch):
 c,f,h=messaging;monkeypatch.setenv('WHATSAPP_AI_ENABLED','true');post(c,payload());i=cid(c,h)
 def generating(text):
  assert post(c,payload('wamid.handoff','I need the manager')).status_code==200
  return 'Must not be sent'
 monkeypatch.setattr(worker,'run_hotel_agent',generating)
 assert asyncio.run(worker.process_one(f))
 with f() as d:
  assert d.get(Conversation,i).human_owned
  assert not list(d.scalars(select(Message).where(Message.kind=='ai')))
  assert d.scalar(select(DeliveryJob)).state=='cancelled'
 post(c,payload('wamid.next','Any update?'))
 with f() as d:
  assert not list(d.scalars(select(DeliveryJob).where(DeliveryJob.purpose=='ai_reply')))
  assert len(list(d.scalars(select(DeliveryJob).where(DeliveryJob.purpose=='handoff_ack'))))==1

def test_staff_takeover_cancels_queued_ai(messaging,monkeypatch):
 c,f,h=messaging;monkeypatch.setenv('WHATSAPP_AI_ENABLED','true');post(c,payload());i=cid(c,h)
 monkeypatch.setattr(worker,'run_hotel_agent',lambda text:'Welcome')
 assert asyncio.run(worker.process_one(f))
 assert c.patch('/api/staff/conversations/'+i,headers=h,json={'human_owned':True}).status_code==200
 assert not asyncio.run(worker.process_one(f))
 with f() as d:assert d.scalar(select(DeliveryJob).where(DeliveryJob.purpose=='ai_reply')).state=='cancelled'

def test_unsupported_attachment_and_verification(messaging,monkeypatch):
 c,f,h=messaging;assert post(c,payload(kind='image')).status_code==200
 detail=c.get('/api/staff/conversations/'+cid(c,h),headers=h).json()
 assert detail['human_owned'];assert 'attachment retrieval pending' in detail['messages'][0]['body']
 monkeypatch.setenv('WHATSAPP_VERIFY_TOKEN','verify-test')
 r=c.get('/whatsapp/webhook',params={'hub.mode':'subscribe','hub.verify_token':'verify-test','hub.challenge':'12345'})
 assert r.text=='12345';assert r.headers['content-type'].startswith('text/plain')
 assert c.post('/whatsapp/send',json={}).status_code==410

def test_early_receipt_reconciles_after_provider_acceptance(messaging,monkeypatch):
 c,f,h=messaging;post(c,payload());i=cid(c,h);reply(c,h,i)
 event=payload();v=event['entry'][0]['changes'][0]['value'];v.pop('messages');v['statuses']=[{'id':'wamid.early','status':'delivered','timestamp':str(int(utcnow().timestamp()))}]
 assert post(c,event).status_code==200
 async def send(*a):return {'messages':[{'id':'wamid.early'}]}
 monkeypatch.setattr(worker,'send_whatsapp_text',send)
 assert asyncio.run(worker.process_one(f))
 assert c.get('/api/staff/conversations/'+i,headers=h).json()['messages'][-1]['delivery_status']=='delivered'

def test_disabled_worker_never_claims_jobs(messaging,monkeypatch):
 c,f,h=messaging;post(c,payload());reply(c,h,cid(c,h));monkeypatch.setenv('WHATSAPP_SEND_ENABLED','false')
 assert not asyncio.run(worker.process_one(f))
 with f() as d:assert d.scalar(select(DeliveryJob)).state=='queued'

def test_invalid_signed_payload_rejected(messaging):
 c,f,h=messaging
 assert post(c,{'object':'whatsapp_business_account','entry':'invalid'}).status_code==422
