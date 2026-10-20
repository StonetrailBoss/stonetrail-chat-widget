import os
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["ADMIN_API_KEY"] = "test-staff-key"
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.routes import chat
from app.services.openai_service import ConciergeDecision

def test_chat_handoff(monkeypatch):
    ai = AsyncMock(return_value=ConciergeDecision(reply="I can request staff assistance.",
                   escalate=True, channel="staff_chat", summary="Needs assistance"))
    notify = AsyncMock(side_effect=chat.HTTPException(502, "Provider down"))
    monkeypatch.setattr(chat, "answer", ai)
    monkeypatch.setattr(chat, "notify_staff", notify)
    with TestClient(app) as c:
        assert sum(r.path == "/api/chat/session" and "POST" in r.methods
                   for r in chat.router.routes if hasattr(r, "methods")) == 1
        session = c.post("/api/chat/session").json()
        headers = {"Authorization": "Bearer " + session["sessionToken"]}
        payload = {"message": "Can someone help me?", "requestId": "request-one"}
        result = c.post("/api/chat/message", headers=headers, json=payload)
        assert result.status_code == 200
        assert result.json()["humanOwned"]
        assert result.json()["notification"] == "failed"
        assert c.post("/api/chat/message", headers=headers, json=payload).json() == result.json()
        assert ai.await_count == 1
        assert c.get("/api/chat/messages").status_code == 401
        other = c.post("/api/chat/session").json()
        assert c.get("/api/chat/messages", headers={"Authorization": "Bearer " + other["sessionToken"]}).json()["messages"] == []
        assert c.get("/api/staff/conversations").status_code == 401
        staff = {"Authorization": "Bearer test-staff-key"}
        id = c.get("/api/staff/conversations", headers=staff).json()[-1]["id"]
        # Identify the escalated conversation, independent of timestamp ordering.
        id = next(x["id"] for x in c.get("/api/staff/conversations", headers=staff).json() if x["human_owned"])
        assert c.post(f"/api/staff/conversations/{id}/messages", headers=staff, json={"body": "Hello from staff"}).status_code == 200
        transcript = c.get("/api/chat/messages", headers=headers).json()
        assert transcript["messages"][-1]["kind"] == "reply"
        assert transcript["messages"][-1]["body"] == "Hello from staff"
        c.post("/api/chat/message", headers=headers, json={"message": "Thank you", "requestId": "two"})
        assert ai.await_count == 2
        assert ai.call_args.args[2] is True
        assert len(c.get("/api/chat/messages", headers=headers).json()["messages"]) == 4
        assert c.delete("/api/chat/session", headers=headers).status_code == 204
        assert c.get("/api/chat/messages", headers=headers).status_code == 401

def test_ai_failure_does_not_save_partial_message(monkeypatch):
    monkeypatch.setattr(chat, "answer", AsyncMock(side_effect=RuntimeError("API unavailable")))
    with TestClient(app) as c:
        token = c.post("/api/chat/session", json={}).json()["sessionToken"]
        headers = {"Authorization": "Bearer " + token}
        assert c.post("/api/chat/message", headers=headers, json={"message": "Hello", "requestId": "one"}).status_code == 503
        assert c.get("/api/chat/messages", headers=headers).json()["messages"] == []
        assert c.options("/api/chat/session", headers={"Origin": "https://stonetrailvillas.com",
                      "Access-Control-Request-Method": "DELETE"}).status_code == 200


def test_normal_message_and_notification_success(monkeypatch):
    ai = AsyncMock(return_value=ConciergeDecision(reply="Welcome!", escalate=False,
                                                channel="staff_chat", summary="Greeting"))
    notify = AsyncMock(return_value=2)
    monkeypatch.setattr(chat, "answer", ai)
    monkeypatch.setattr(chat, "notify_staff", notify)
    with TestClient(app) as c:
        token = c.post("/api/chat/session").json()["sessionToken"]
        headers = {"Authorization": "Bearer " + token}
        result = c.post("/api/chat/message", headers=headers, json={"message": "Hi", "requestId": "a"}).json()
        assert result["reply"] == "Welcome!"
        assert result["actions"] == []
        notify.assert_not_awaited()
        ai.return_value = ConciergeDecision(reply="You can use WhatsApp.", escalate=True,
                                            channel="whatsapp", summary="Wants staff")
        chat.settings.whatsapp_guest_number = "17840000000"
        result = c.post("/api/chat/message", headers=headers, json={"message": "Staff on WhatsApp?", "requestId": "b"}).json()
        assert result["notification"] == "submitted"
        assert result["preferred_channel"] == "whatsapp"
        assert any(a["url"].startswith("https://wa.me/") for a in result["actions"] if a.get("url"))
        assert c.post("/api/chat/message", headers=headers, json={"message": "different", "requestId": "b"}).status_code == 409
        notify.assert_awaited_once()
