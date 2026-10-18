# Stonetrail Guest Experience — Phase 1 foundation

This is an incremental extension of the uploaded FastAPI + React/Vite application, **not** a completed Cloudbeds Guest Experience clone.

## Local development

1. `cd backend && python -m venv .venv && source .venv/bin/activate`
2. `pip install -r requirements.txt` (also install `pytest` for tests).
3. Copy `.env.example` from repository root to `.env`, supply credentials only locally.
4. `alembic upgrade head`
5. `uvicorn app.main:app --reload --port 8000`
6. In another shell: `cd frontend && npm install && VITE_API_BASE_URL=http://localhost:8000 npm run dev`
7. API docs: `http://localhost:8000/docs`; health: `/healthz`.

## Render deployment

1. Push the sanitized source to a **private** GitHub repository. This archive intentionally excludes `.git` and `.env`.
2. In Render, create a Blueprint from `render.yaml`; review service plans and available region.
3. Set all `sync: false` variables in the Render dashboard. Generate a long random `ADMIN_BOOTSTRAP_TOKEN`.
4. Set `VITE_API_BASE_URL` to the actual deployed backend HTTPS URL, and `ALLOWED_ORIGINS` to the exact deployed frontend and hotel origins (comma separated).
5. Confirm the backend `/healthz` endpoint and browser CORS behavior.
6. Register the WhatsApp webhook HTTPS URL and configure `META_APP_SECRET` for request-signature verification.

## Scope and security

- Added tenant, property, guest, and reservation tables plus initial Alembic migration.
- Added token-protected bootstrap tenant/property endpoints. **Shared admin token is a temporary bootstrap mechanism, not a staff authentication system.** Do not expose it in frontend code.
- Protected manual WhatsApp send endpoint; incoming Meta webhooks require valid `X-Hub-Signature-256`.
- Existing Cloudbeds and AI routes are preserved. They are not yet fully tenant-isolated or authorization-hardened. Do not treat this as a production-ready guest data application.
- All real credentials from the original archive should be rotated if exposed. `.env` and `.git` are excluded from this deliverable.

## Next implementation milestones

1. Staff login with managed identity provider, RBAC, tenant isolation enforcement and audit log.
2. PMS adapter and sync jobs, webhook idempotency, reservation reconciliation.
3. Persistent unified inbox, Meta/WhatsApp inbound/outbound processing, channel adapter abstraction.
4. AI concierge with safe tool permissions and staff handoff.
5. Guest journey workflows, registration and check-in portal, upselling and payments.

## Testing

`cd backend && pip install pytest && pytest -q tests`

External Cloudbeds, WhatsApp, and OpenAI integrations require real test accounts and were not validated by these local tests.
