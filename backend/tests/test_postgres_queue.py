"""Optional actual-PostgreSQL claim check. CI supplies an isolated test service."""
import os,uuid
from concurrent.futures import ThreadPoolExecutor
import pytest
from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.core import Tenant,Property
from app.models.inbox import Conversation,Message
from app.models.messaging import ChannelConnection,DeliveryJob
from app.messaging_worker import claim

@pytest.mark.skipif(not os.getenv('TEST_POSTGRES_URL'),reason='PostgreSQL service not configured locally')
def test_postgres_concurrent_claim_is_exclusive():
 raw=create_engine(os.environ['TEST_POSTGRES_URL'])
 schema='test_'+uuid.uuid4().hex
 with raw.begin() as c:c.execute(text(f'CREATE SCHEMA {schema}'))
 engine=raw.execution_options(schema_translate_map={None:schema});factory=sessionmaker(bind=engine)
 try:
  Base.metadata.create_all(engine)
  with factory() as d:
   t=Tenant(name='Queue test',slug='queue-test');d.add(t);d.flush()
   p=Property(tenant_id=t.id,name='Queue test');d.add(p);d.flush()
   c=Conversation(property_id=p.id,subject='Test');con=ChannelConnection(property_id=p.id,phone_number_id='123456');d.add_all([c,con]);d.flush()
   m=Message(conversation_id=c.id,body='Test',kind='reply');d.add(m);d.flush();d.add(DeliveryJob(message_id=m.id,connection_id=con.id));d.commit()
  with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:claim(factory),range(2)))
  assert len([x for x in results if x])==1
 finally:
  with raw.begin() as c:c.execute(text(f'DROP SCHEMA {schema} CASCADE'))
  raw.dispose()
