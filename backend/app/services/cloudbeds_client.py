import httpx
from fastapi import HTTPException
from app.config import settings

async def availability(start_date: str, end_date: str, adults: int):
    if not settings.cloudbeds_api_key or not settings.cloudbeds_property_id:
        raise HTTPException(503, "Cloudbeds integration is not configured")
    headers = {"Authorization": f"Bearer {settings.cloudbeds_api_key}"}
    params = {"propertyID": settings.cloudbeds_property_id, "startDate": start_date, "endDate": end_date, "adults": adults}
    # Confirm this endpoint and response mapping against your Cloudbeds account/API version.
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            response = await client.get(f"{settings.cloudbeds_base_url.rstrip('/')}/getRoomTypes", headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(502, "Cloudbeds service unavailable") from exc
    return {"verification_status": "unverified", "room_types": data, "booking_url": settings.booking_engine_url,
            "note": "Room types are not a confirmed live availability or rate quote. Complete availability and booking through the booking engine."}
