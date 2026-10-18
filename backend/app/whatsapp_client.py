"""Official Cloud API adapter. No network access without explicit enablement."""
import os,re
import httpx

class DeliveryError(Exception):
    def __init__(self,code,ambiguous=False):
        self.code=code;self.ambiguous=ambiguous
        super().__init__(code)

def configured():
    return all(os.getenv(k) for k in ("WHATSAPP_ACCESS_TOKEN","WHATSAPP_PHONE_NUMBER_ID","WHATSAPP_API_VERSION","META_APP_SECRET"))

async def send_whatsapp_text(to: str,message: str):
    if os.getenv("WHATSAPP_SEND_ENABLED","false").lower()!="true":
        raise DeliveryError("sending_disabled")
    if not configured():raise DeliveryError("configuration_missing")
    version=os.environ["WHATSAPP_API_VERSION"]
    if not re.fullmatch(r"v\d+\.\d+",version):raise DeliveryError("invalid_api_version")
    if not re.fullmatch(r"\d{5,20}",to):raise DeliveryError("invalid_recipient")
    url=f"https://graph.facebook.com/{version}/{os.environ['WHATSAPP_PHONE_NUMBER_ID']}/messages"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r=await client.post(url,json={"messaging_product":"whatsapp","to":to,"type":"text","text":{"body":message}},headers={"Authorization":"Bearer "+os.environ["WHATSAPP_ACCESS_TOKEN"]})
    except httpx.RequestError as exc:
        # Timeout may occur after Meta accepted a message. Never resend automatically.
        raise DeliveryError("transport_outcome_unknown",ambiguous=True) from exc
    if r.status_code>=500:raise DeliveryError("provider_outcome_unknown",ambiguous=True)
    if not r.is_success:raise DeliveryError(f"provider_http_{r.status_code}")
    try:return {"messages":[{"id":r.json()["messages"][0]["id"]}]}
    except (ValueError,KeyError,IndexError,TypeError) as exc:
        raise DeliveryError("provider_response_unknown",ambiguous=True) from exc
