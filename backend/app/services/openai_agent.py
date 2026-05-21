import os
import json
from typing import Dict, Any, List

from openai import OpenAI

from app.services.cloudbeds_client import (
    check_cloudbeds_availability,
    create_cloudbeds_booking_link,
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


SYSTEM_PROMPT = """
You are the Stonetrail Villas & Suites booking assistant.

Your job is to help website visitors check availability, compare rooms,
understand hotel policies, and book directly.

Be warm, professional, concise, and hospitality-focused.

Before checking availability, collect:
- check-in date
- check-out date
- number of adults
- number of children
- number of rooms

Never invent availability, rates, taxes, fees, or policies.
Use Cloudbeds data as the source of truth.

Do not collect credit card information in chat.

For payments and final reservation confirmation, send the guest to the
official Cloudbeds booking page.

Escalate to staff when:
- guest asks for discounts
- guest wants group booking
- guest wants long-stay pricing
- guest has a complaint
- guest asks something you cannot verify
"""


TOOLS = [
    {
        "type": "function",
        "name": "check_availability",
        "description": "Check room availability and rates from Cloudbeds.",
        "parameters": {
            "type": "object",
            "properties": {
                "check_in": {"type": "string", "description": "YYYY-MM-DD"},
                "check_out": {"type": "string", "description": "YYYY-MM-DD"},
                "adults": {"type": "integer"},
                "children": {"type": "integer"},
                "rooms": {"type": "integer"},
            },
            "required": ["check_in", "check_out", "adults", "children", "rooms"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_booking_link",
        "description": "Generate a Cloudbeds booking link for the guest.",
        "parameters": {
            "type": "object",
            "properties": {
                "check_in": {"type": "string", "description": "YYYY-MM-DD"},
                "check_out": {"type": "string", "description": "YYYY-MM-DD"},
                "adults": {"type": "integer"},
                "children": {"type": "integer"},
                "rooms": {"type": "integer"},
                "room_type_id": {"type": "string"},
            },
            "required": [
                "check_in",
                "check_out",
                "adults",
                "children",
                "rooms",
                "room_type_id",
            ],
            "additionalProperties": False,
        },
    },
]


def _run_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Routes OpenAI tool calls to your backend functions.
    """

    if name == "check_availability":
        return check_cloudbeds_availability(
            check_in=arguments["check_in"],
            check_out=arguments["check_out"],
            adults=arguments["adults"],
            children=arguments["children"],
            rooms=arguments["rooms"],
        )

    if name == "get_booking_link":
        return create_cloudbeds_booking_link(
            check_in=arguments["check_in"],
            check_out=arguments["check_out"],
            adults=arguments["adults"],
            children=arguments["children"],
            rooms=arguments["rooms"],
            room_type_id=arguments["room_type_id"],
        )

    return {"error": f"Unknown tool: {name}"}


def run_hotel_agent(
    user_message: str,
    conversation_history: List[Dict[str, str]] | None = None,
) -> Dict[str, Any]:
    """
    Main function called by your FastAPI route.
    """

    conversation_history = conversation_history or []

    input_messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    input_messages.extend(conversation_history)

    input_messages.append(
        {
            "role": "user",
            "content": user_message,
        }
    )

    response = client.responses.create(
        model=MODEL,
        input=input_messages,
        tools=TOOLS,
    )

    tool_outputs = []

    for item in response.output:
        if item.type == "function_call":
            tool_args = json.loads(item.arguments)

            tool_result = _run_tool(
                name=item.name,
                arguments=tool_args,
            )

            tool_outputs.append(
                {
                    "type": "function_call_output",
                    "call_id": item.call_id,
                    "output": json.dumps(tool_result),
                }
            )

    if tool_outputs:
        follow_up = client.responses.create(
            model=MODEL,
            input=input_messages + response.output + tool_outputs,
            tools=TOOLS,
        )

        return {
            "reply": follow_up.output_text,
            "raw": follow_up.model_dump(),
        }

    return {
        "reply": response.output_text,
        "raw": response.model_dump(),
    }