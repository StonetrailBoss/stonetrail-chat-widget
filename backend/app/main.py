from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Stonetrail Chat Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "service": "stonetrail-chat-backend"}

@app.post("/api/chat/message")
async def chat_message(payload: dict):
    return {
        "reply": "Welcome to Stonetrail Villas & Suites. How can I help you today?"
    }

@app.post("/api/availability/search")
async def availability_search(payload: dict):
    return {
        "results": [
            {
                "roomTypeId": "deluxe-double",
                "name": "Deluxe Double Room",
                "description": "Spacious room with patio and Caribbean Sea views.",
                "rate": 225,
                "currency": "USD",
                "imageUrl": ""
            }
        ]
    }

@app.post("/api/booking/link")
async def booking_link(payload: dict):
    return {
        "bookingUrl": "https://hotels.cloudbeds.com/reservation/YOUR_PROPERTY_ID"
    }