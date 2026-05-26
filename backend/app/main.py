import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router as chat_router
from app.routes.availability import router as availability_router
from app.routes.booking import router as booking_router
from app.routes.whatsapp import router as whatsapp_router

load_dotenv()

app = FastAPI(title="Stonetrail Chat Backend")

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,https://www.stonetrailvillas.com,https://stonetrailvillas.com",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(availability_router)
app.include_router(booking_router)
app.include_router(whatsapp_router)


@app.get("/")
def health_check():
    return {"status": "online", "service": "stonetrail-chat-backend"}
