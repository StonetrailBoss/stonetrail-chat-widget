import re

def wants_human_handoff(message: str) -> bool:
    text=message.lower()
    return bool(re.search(r"\b(human|agent|manager|receptionist|front desk|talk to (someone|a person|staff)|speak to (someone|a person|staff)|transfer me|escalate)\b",text))
