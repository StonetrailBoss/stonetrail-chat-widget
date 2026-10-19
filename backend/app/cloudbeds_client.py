import os
from urllib.parse import urlencode
from datetime import datetime

import requests

CLOUDBEDS_API_KEY = os.getenv("CLOUDBEDS_API_KEY")
CLOUDBEDS_PROPERTY_ID = os.getenv("CLOUDBEDS_PROPERTY_ID")
CLOUDBEDS_BASE_URL = os.getenv("CLOUDBEDS_BASE_URL", "https://api.cloudbeds.com/api/v1.1").rstrip("/")
BOOKING_ENGINE_URL = os.getenv("BOOKING_ENGINE_URL", "https://us2.cloudbeds.com/reservation/XsjT4D")

HEADERS = {
    "Authorization": f"Bearer {CLOUDBEDS_API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

def _valid_dates(check_in: str, check_out: str) -> tuple[bool, str | None]:
    try:
        start = datetime.strptime(check_in, "%Y-%m-%d").date()
        end = datetime.strptime(check_out, "%Y-%m-%d").date()
    except Exception:
        return False, "Please provide dates in YYYY-MM-DD format."
    if end <= start:
        return False, "Check-out must be after check-in."
    return True, None

def _booking_url(check_in, check_out, adults=2, children=0, rooms=1, room_type_id=None):
    params = {
        "checkin": check_in,
        "checkout": check_out,
        "adults": adults,
        "children": children,
        "rooms": rooms,
    }
    if room_type_id:
        # Keep this generic until the exact Cloudbeds booking-engine parameter for your account is confirmed.
        params["roomTypeId"] = room_type_id
    return f"{BOOKING_ENGINE_URL}?{urlencode(params)}"

def check_availability(check_in: str, check_out: str, adults: int = 2, children: int = 0, rooms: int = 1):
    ok, error = _valid_dates(check_in, check_out)
    if not ok:
        return {"success": False, "error": error, "results": []}

    # IMPORTANT:
    # This currently returns a safe booking-engine handoff rather than confirmed PMS inventory.
    # To show real rates and inventory inside the chat, connect this function to the exact
    # Cloudbeds Booking Engine / PMS API endpoint available to your account.
    return {
        "success": True,
        "bookingUrl": _booking_url(check_in, check_out, adults, children, rooms),
        "results": [
            {
                "roomTypeId": "booking-engine",
                "name": "View Live Availability",
                "description": "Open our secure Cloudbeds booking engine to see real-time room availability and rates for your dates.",
                "rate": None,
                "currency": "",
                "imageUrl": "",
            }
        ],
    }

def create_booking_link(check_in: str, check_out: str, adults: int = 2, children: int = 0, rooms: int = 1, room_type_id: str | None = None):
    ok, error = _valid_dates(check_in, check_out)
    if not ok:
        return {"success": False, "error": error}
    return {"success": True, "bookingUrl": _booking_url(check_in, check_out, adults, children, rooms, room_type_id)}
