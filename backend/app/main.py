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

#allowed_origins = [
#    "http://localhost:5173",
#    "http://localhost:3000",
#    "https://stonetrailvillas.com",
#    "https://www.stonetrailvillas.com",
    # add your actual deployed frontend URL here
#    "https://stonetrail-chat-widget.onrender.com",
#]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
