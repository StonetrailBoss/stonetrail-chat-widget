import os
from urllib.parse import urlencode


def check_cloudbeds_availability(
    check_in: str,
    check_out: str,
    adults: int = 2,
    children: int = 0,
    rooms: int = 1,
):
    # Placeholder implementation - replace with actual Cloudbeds API call
    return {
        "available": True,
        "rooms": [
            {
                "roomTypeId": "123",
                "name": "Ocean View Suite",
                "rate": 350.00,
                "currency": "USD",
            },
            {
                "roomTypeId": "456",
                "name": "Garden View Room",
                "rate": 250.00,
                "currency": "USD",
            },
        ],
    }

def create_cloudbeds_booking_link(
    check_in: str,
    check_out: str,
    adults: int = 2,
    children: int = 0,
    rooms: int = 1,
    room_type_id: str | None = None,
):
    base_url = os.getenv(
        "BOOKING_ENGINE_URL","https://us2.cloudbeds.com/reservation/XsjT4D",
    )

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