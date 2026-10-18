# Staff authentication and persistent inbox — development increment

Extends the supplied Phase 1 FastAPI + React/Vite code. Hosting remains Render with render.yaml. No AWS infrastructure is introduced. This is an integration foundation, not a complete guest experience platform or a production launch.

## Included
- Staff login, server-side hashed bearer sessions, eight-hour expiry, logout revocation; passwords use salted scrypt. Browser tokens stay in memory and are cleared on reload.
- Manager, agent and read-only auditor roles, scoped to one property per staff account. Managers can create staff via POST /api/staff/users. Tenant/property bootstrap remains a separate deployment administration operation.
- Persistent conversations, intake records, assignment, open/pending/closed state, notes, local reply records and audit events.
- Validated guest/reservation association by ID, including same-property checks. Automatic identity matching is pending.
- Staff interface at /staff; original guest widget remains at /.
- Inbox list polls every ten seconds; transcript refresh is manual.
- Separate Alembic migration 0002. Fixed original migration import path and constrained migration 0001 to its original tables.
- OpenAI client now initializes on demand, so starting the server does not require an API key.

## Run locally
From backend, create/activate a Python 3.12 virtual environment, then:

```sh
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Set DATABASE_URL, ALLOWED_ORIGINS and integration settings using the existing environment example. If this is a new database, use Phase 1's token-protected APIs to create the tenant and property, then run from backend:

```sh
python -m app.bootstrap_staff PROPERTY_ID manager@example.com
```

Enter a unique password of at least 12 characters when prompted. Remove ADMIN_BOOTSTRAP_TOKEN after setup to disable shared-token endpoints (including legacy manual WhatsApp sending). Additional staff can be created through the authenticated manager API documented at /docs. Do not put credentials into source files.

From frontend:

```sh
npm ci
npm run dev
```

Open http://localhost:5173/staff. Set VITE_API_BASE_URL when the API runs elsewhere.

## Render
Apply this source to your development branch. Existing render.yaml retains the API, static frontend and managed PostgreSQL. Its pre-deploy migration applies 0002. Set the frontend API URL and explicit backend CORS origins for your actual domains. Run the bootstrap command in the backend service shell against the target property. No Render resources have been deployed by this delivery.

## Verification
Five backend tests cover health/bootstrap, login/logout, role permissions, property isolation, local messages, conversation states and assignment/handoff rules. SQLite migration upgrade/downgrade/upgrade is checked separately. Frontend production build is checked. PostgreSQL execution, browser end-to-end tests, and external provider delivery remain unverified.

## Deliberate limits and next work
No new inbox channel is connected. Manual reply records are not transmitted. Existing guest widget/WhatsApp paths are preserved but are not bridged into this inbox; the inbox human-owned flag does not yet stop those legacy AI paths. Do not use this increment as an end-to-end handoff implementation.

Next increment: bridge authenticated provider ingestion into persistent conversations, deduplicate webhook events, enforce handoff ownership in the AI service, add an outbound delivery queue with provider acknowledgments, and verify WhatsApp send/receive. Then Cloudbeds synchronization can populate guest/reservation matching.

Before production: distributed login rate limiting, MFA/password reset, account suspension/session management UI, pagination/search, retention policy, PostgreSQL integration tests and backup/restore verification. Sessions currently require re-login after browser reload. Staff creation is API-only. The application does not yet implement the full original prompt.
