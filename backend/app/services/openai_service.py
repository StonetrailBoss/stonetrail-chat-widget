from openai import AsyncOpenAI
from app.config import settings

SYSTEM_PROMPT = """You are the helpful virtual concierge for Stonetrail Villas & Suites in Indian Bay, St. Vincent and the Grenadines. Answer guest questions naturally and concisely. Never invent prices, availability, confirmed reservations, policies or amenities. When asked about room availability or bookings, explain that live availability must be verified by the booking system. Direct bookings can use the supplied booking link. When a guest requests a human, suggest staff escalation. Do not request credit card numbers or sensitive payment data in chat."""

async def answer(messages: list[dict], booking_url: str) -> str:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=25.0, max_retries=1)
    result = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[{"role":"system", "content": SYSTEM_PROMPT + f" Booking link: {booking_url}"}, *messages],
        temperature=0.3,
    )
    return result.choices[0].message.content or "Please try again."
