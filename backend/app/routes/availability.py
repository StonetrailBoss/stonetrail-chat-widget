from fastapi import APIRouter
from app.cloudbeds_client import check_availability

router = APIRouter()


@router.post("/api/availability/search")
async def availability_search(payload: dict):
    return check_cloudbeds_availability(
        check_in=payload.get("checkIn"),
        check_out=payload.get("checkOut"),
        adults=payload.get("adults", 2),
        children=payload.get("children", 0),
        rooms=payload.get("rooms", 1),
    )