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

@app.post("/api/chat/message")
async def chat_message(payload: dict):
    return {
        "reply": "Welcome to Stonetrail Villas. How can I help you today?"
    }

@app.post("/api/availability/search")
async def availability_search(payload: dict):
    return {
        "results": [
            {
                "roomTypeId": "deluxe-double",
                "name": "Deluxe Double Room",
                "description": "Ocean view with patio",
                "rate": 225,
                "currency": "USD",
                "imageUrl": "https://your-image-url.com/room.jpg"
            }
        ]
    }

@app.post("/api/booking/link")
async def booking_link(payload: dict):
    return {
        "bookingUrl": "https://your-cloudbeds-booking-link"
    }