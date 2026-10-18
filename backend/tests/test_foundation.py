import os
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ADMIN_BOOTSTRAP_TOKEN"] = "test-secret"
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from app import database
from app.models import core
from app.main import app

def test_health():
    assert TestClient(app).get("/healthz").json() == {"status": "ok"}

def test_admin_requires_token():
    assert TestClient(app).get("/api/admin/tenants").status_code == 401

def test_tenant_creation():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database import get_db, Base
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    def db_override():
        with sessionmaker(bind=engine)() as db: yield db
    app.dependency_overrides[get_db] = db_override
    try:
        client = TestClient(app)
        headers = {"x-admin-token": "test-secret"}
        result = client.post("/api/admin/tenants", json={"name":"Stonetrail","slug":"stonetrail"}, headers=headers)
        assert result.status_code == 201, result.text
        assert len(client.get("/api/admin/tenants", headers=headers).json()) == 1
    finally:
        app.dependency_overrides.clear()
