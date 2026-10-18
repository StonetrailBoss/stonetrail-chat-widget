"""Run locally/on Render shell: python -m app.bootstrap_staff PROPERTY_ID EMAIL"""
import sys, getpass
from sqlalchemy import select
from app.database import SessionLocal
from app.models.core import Property
from app.models.inbox import Staff
from app.staff_security import hash_password

def main():
    property_id,email=sys.argv[1:]
    password=getpass.getpass("New manager password (12+ characters): ")
    if len(password)<12: raise SystemExit("Password too short")
    with SessionLocal() as db:
        if not db.get(Property,property_id): raise SystemExit("Property not found")
        if db.scalar(select(Staff).where(Staff.email==email.lower())): raise SystemExit("Account already exists")
        db.add(Staff(property_id=property_id,email=email.lower(),password_hash=hash_password(password),role="manager"))
        db.commit()
    print("Manager created")
if __name__=="__main__":main()
