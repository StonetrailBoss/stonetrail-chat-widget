from fastapi import APIRouter
from app.openai_client import run_hotel_agent

router = APIRouter()


@router.post("/api/chat/message")
async def chat_message(payload: dict):
    message = payload.get("message", "")

    reply = run_hotel_agent(message)

    return {
        "type": "text",
        "reply": reply,
        "actions": [
            {"label": "Check availability"},
            {"label": "View room options"},
            {"label": "Airport transfer"},
            {"label": "Talk to staff"},
        ],
    }

from pydantic import BaseModel
from app.openai_client import client
from app.cloudbeds_client import check_availability
import json

router = APIRouter()

class ChatRequest(BaseModel):
    message: str


tools = [
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": "Check hotel room availability",
            "parameters": {
                "type": "object",
                "properties": {
                    "check_in": {
                        "type": "string"
                    },
                    "check_out": {
                        "type": "string"
                    },
                    "adults": {
                        "type": "integer"
                    }
                },
                "required": [
                    "check_in",
                    "check_out",
                    "adults"
                ]
            }
        }
    }
]