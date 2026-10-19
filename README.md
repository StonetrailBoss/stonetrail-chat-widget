# Stonetrail Guest Experience Backend (replacement scaffold)

FastAPI + PostgreSQL on Render. This is a **new scaffold**, not a merge of an existing uploaded ZIP. Review before production.

## Start locally
1. `cd backend && python -m venv .venv && source .venv/bin/activate`
2. `pip install -r requirements.txt`
3. `cp .env.example .env` and configure a local PostgreSQL database and API credentials.
4. `uvicorn app.main:app --reload`
5. Visit `http://localhost:8000/docs`; run `pytest -q`.

## Endpoints
- `POST /api/chat/session` body `{ "guest_name": "Guest" }` (or `{}`)
- `POST /api/chat/message` body `{ "session_id": "...", "message": "Hello" }`
- `GET /api/chat/history/{session_id}`
- `POST /api/chat/escalate` body `{ "session_id": "...", "summary": "..." }`
- `POST /api/availability/search` body `{ "check_in":"2026-11-15", "check_out":"2026-11-20", "adults":2 }`
- `GET /api/booking/link`; `GET /health`

## Render and GoDaddy
Connect the repository as a Render Blueprint using `render.yaml`. Set secrets in Render dashboard. The application automatically converts Render PostgreSQL URLs to the `postgresql+asyncpg://` driver scheme. Set `VITE_API_BASE_URL=https://<render-service>.onrender.com` in the React widget build. GoDaddy serves the frontend; only the API is on Render. Rebuild the frontend after changing Vite variables. CORS allows both apex and www domains, plus local dev only when added.

## Critical production follow-ups
- **Security:** Guest session IDs are bearer credentials; enforce ownership/guest verification, rate limiting, anti-abuse protections, retention policy, and secure admin authentication before production. Avoid exposing history to guessed/stolen IDs. Restrict CORS to known origins (CORS is not authentication).
- **Cloudbeds:** The included endpoint retrieves room types only; it does NOT verify live availability or rates. Replace with an account-verified Cloudbeds availability workflow and map API responses before showing availability claims. Confirm scopes and API version.
- **WhatsApp:** Staff numbers require opted-in messaging and an active WhatsApp service window for free-form messages; otherwise use approved templates. Configure and validate signed webhook callbacks for delivery and inbound messages.
- **Persistence:** `create_all` is only for scaffolding; add Alembic migrations, backups, and retention/deletion workflows.
- **Conversation:** All normal messages call OpenAI. Tool calling, vetted hotel knowledge base, Cloudbeds live search, guest identity, prompt-injection controls, structured booking handoff, and cost/usage controls are next-stage work.
- **Reliability:** Add integration tests with mocks for OpenAI, Cloudbeds and Meta, monitoring, and retry/idempotency handling.
- **Render:** Use the linked managed PostgreSQL service and verify connection health after deployment.

## Example session test
`curl -X POST http://localhost:8000/api/chat/session -H 'Content-Type: application/json' -d '{}'`
