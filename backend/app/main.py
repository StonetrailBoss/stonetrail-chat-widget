import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router as chat_router
from app.routes.availability import router as availability_router
from app.routes.booking import router as booking_router

load_dotenv()

app = FastAPI(title="Stonetrail Chat Backend")

origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,https://www.stonetrailvillas.com,https://stonetrailvillas.com").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat_router)
app.include_router(availability_router)
app.include_router(booking_router)

@app.get("/")
def health_check():
    return {"status": "online", "service": "stonetrail-chat-backend"}
