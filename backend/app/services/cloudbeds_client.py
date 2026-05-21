import os
from urllib.parse import urlencode


def check_cloudbeds_availability(
    check_in: str,
    check_out: str,
    adults: int,
    children: int = 0,
    rooms: int = 1,
):
    """
    Temporary mock function.
    Replace later with real Cloudbeds API call.
    """

    return {
        "available": True,
        "results": [
            {
                "roomTypeId": "deluxe-double",
                "name": "Deluxe Double Room",
                "description": "Spacious room with patio and Caribbean Sea views.",
                "rate": 225,
                "currency": "USD",
            }
        ],
    }


def create_cloudbeds_booking_link(
    check_in: str,
    check_out: str,
    adults: int,
    children: int = 0,
    rooms: int = 1,
    room_type_id: str | None = None,
):
    """
    Creates a booking engine link.
    """

    base_url = os.getenv("BOOKING_ENGINE_URL", "https://us2.cloudbeds.com/reservation/XsjT4D")

    params = {
        "checkin": check_in,
        "checkout": check_out,
        "adults": adults,
        "children": children,
        "rooms": rooms,
    }

    if room_type_id:
        params["roomTypeId"] = room_type_id

    return {
        "bookingUrl": f"{base_url}?{urlencode(params)}"
    }