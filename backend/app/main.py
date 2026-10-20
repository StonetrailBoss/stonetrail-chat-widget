from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import Base, engine
from app.routes import chat, availability, booking, staff
from app import models  # register SQLAlchemy models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Scaffold only: production schema changes should use Alembic migrations.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="Stonetrail Guest Experience API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[s.strip() for s in settings.cors_origins.split(",") if s.strip()], allow_credentials=False, allow_methods=["GET", "POST", "DELETE", "PATCH", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])
app.include_router(chat.router)
app.include_router(staff.router)
app.include_router(availability.router)
app.include_router(booking.router)

@app.get("/health")
async def health(): return {"status":"ok"}
