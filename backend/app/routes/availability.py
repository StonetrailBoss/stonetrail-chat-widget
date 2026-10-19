from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.cloudbeds_client import availability
router = APIRouter(prefix="/api/availability", tags=["availability"])
class AvailabilityRequest(BaseModel):
    check_in: date
    check_out: date
    adults: int = Field(default=2, ge=1, le=20)
@router.post("/search")
async def search(payload: AvailabilityRequest):
    if payload.check_out <= payload.check_in:
        raise HTTPException(422, "Check-out must be after check-in")
    return await availability(payload.check_in.isoformat(), payload.check_out.isoformat(), payload.adults)
