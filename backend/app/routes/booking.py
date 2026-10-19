from fastapi import APIRouter
from app.config import settings
router = APIRouter(prefix="/api/booking", tags=["booking"])
@router.get("/link")
async def booking_link():
    return {"booking_url": settings.booking_engine_url}
