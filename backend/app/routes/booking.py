from fastapi import APIRouter
from app.cloudbeds_client import create_booking_link

router = APIRouter()


@router.post("/api/booking/link")
async def booking_link(payload: dict):
    return create_cloudbeds_booking_link(
        check_in=payload.get("checkIn"),
        check_out=payload.get("checkOut"),
        adults=payload.get("adults", 2),
        children=payload.get("children", 0),
        rooms=payload.get("rooms", 1),
        room_type_id=payload.get("roomTypeId"),
    )