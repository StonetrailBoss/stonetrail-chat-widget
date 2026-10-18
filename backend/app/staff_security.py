import hashlib, hmac, secrets
from datetime import datetime, timezone
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inbox import Staff, StaffSession

def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return salt + ":" + digest

def verify_password(password, stored):
    salt, expected = stored.split(":")
    actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return hmac.compare_digest(actual, expected)

def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()

def current_staff(authorization: str = Header(default=""), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Staff login required")
    session = db.get(StaffSession, token_hash(authorization[7:]))
    if not session or session.expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")
    user = db.get(Staff, session.staff_id)
    if not user or not user.active:
        raise HTTPException(401, "Account unavailable")
    return user

def manager(user: Staff = Depends(current_staff)):
    if user.role != "manager":
        raise HTTPException(403, "Manager role required")
    return user
