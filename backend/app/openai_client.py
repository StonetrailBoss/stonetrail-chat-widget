import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are the Stonetrail Villas & Suites booking assistant.
Help guests check availability, compare rooms, and book directly.
Be warm, professional, concise, and hospitality-focused.
Do not collect credit card information in chat.
Send guests to the official booking page to complete reservations.
"""


def run_hotel_agent(message: str) -> str:
    if not os.getenv("OPENAI_API_KEY"):
        return "Welcome to Stonetrail Villas & Suites. I can help you check availability, view rooms, or connect you with our team."

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ],
    )

    return response.output_text