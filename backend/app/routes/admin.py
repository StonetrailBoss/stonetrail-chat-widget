"""Initial bootstrap endpoints; replace shared admin token with staff identity + RBAC in next milestone."""
import os
import secrets
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.core import Tenant, Property

router = APIRouter(prefix="/api/admin", tags=["administration"])

def require_admin(x_admin_token: str | None = Header(default=None)):
    expected = os.getenv("ADMIN_BOOTSTRAP_TOKEN")
    if not expected or not x_admin_token or not secrets.compare_digest(x_admin_token, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")

class TenantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=80)

class PropertyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    pms_property_id: str | None = None

@router.post("/tenants", dependencies=[Depends(require_admin)], status_code=201)
def create_tenant(data: TenantCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Tenant).where(Tenant.slug == data.slug)):
        raise HTTPException(409, "Tenant slug already exists")
    item = Tenant(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "name": item.name, "slug": item.slug}

@router.post("/tenants/{tenant_id}/properties", dependencies=[Depends(require_admin)], status_code=201)
def create_property(tenant_id: str, data: PropertyCreate, db: Session = Depends(get_db)):
    if not db.get(Tenant, tenant_id):
        raise HTTPException(404, "Tenant not found")
    item = Property(tenant_id=tenant_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "tenant_id": tenant_id, "name": item.name}

@router.get("/tenants", dependencies=[Depends(require_admin)])
def list_tenants(db: Session = Depends(get_db)):
    return [{"id": t.id, "name": t.name, "slug": t.slug} for t in db.scalars(select(Tenant).order_by(Tenant.name)).all()]
