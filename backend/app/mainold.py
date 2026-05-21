import os
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

CLOUDBEDS_API_KEY = os.getenv("CLOUDBEDS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
BOOKING_ENGINE_URL = os.getenv("BOOKING_ENGINE_URL")


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "online"}



openai_client = OpenAI(api_key=OPENAI_API_KEY)

@app.post("/api/chat/message")
async def chat_message(payload: dict):
    user_message = payload.get("message", "")

    response = openai_client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {
                "role": "system",
                "content": """
                You are the booking assistant for Stonetrail Villas & Suites
                in St. Vincent and the Grenadines. Help guests with room
                questions, availability, policies, airport transfers, and
                direct booking. Be polite, concise, and hospitality-focused.
                """
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
    )

    return {
        "reply": response.output_text
    }




def cloudbeds_get(endpoint: str, params: dict | None = None):
    response = requests.get(
        f"{CLOUDBEDS_BASE_URL}/{endpoint}",
        headers={
            "Authorization": f"Bearer {CLOUDBEDS_API_KEY}"
        },
        params=params or {},
        timeout=20
    )

    response.raise_for_status()
    return response.json()

 
 

@app.get("/api/test-env")
def test_env():
    return {
        "cloudbeds_loaded": bool(CLOUDBEDS_API_KEY),
        "openai_loaded": bool(OPENAI_API_KEY),
        "booking_url_loaded": bool(BOOKING_ENGINE_URL)
    }

 