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

allowed_origins = [origin.strip() for origin in os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

from app.database import Base, engine
from app.routes.admin import router as admin_router
app.include_router(admin_router)

@app.get("/healthz")
def readiness():
    return {"status": "ok"}

app.include_router(chat_router)
app.include_router(availability_router)
app.include_router(booking_router)
app.include_router(whatsapp_router)


@app.get("/")
def health_check():
    return {"status": "online", "service": "stonetrail-chat-backend"}
