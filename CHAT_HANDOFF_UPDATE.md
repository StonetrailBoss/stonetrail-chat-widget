# Stonetrail guest experience: AI chat and staff handoff

This update supersedes earlier phase instructions for chat and the staff inbox.
It preserves FastAPI, React/Vite, GoDaddy embedding and Render Blueprints.

## Behavior
1. Widget creates a database-backed, 24-hour visitor session.
2. Every submitted guest chat message goes through the backend to OpenAI.
3. OpenAI returns a validated reply, escalation flag, preferred channel and summary.
4. When escalation is requested, the conversation enters the staff inbox and the
   backend attempts WhatsApp staff notifications. Notification submission is not
   proof of delivery. Failure does not remove the conversation from the inbox.
5. Guest sees staff chat, plus WhatsApp and phone links when configured.
6. Staff can take over, reply in the website widget, or release back to AI.
   During takeover, every guest message is still classified by OpenAI, while AI
   responses are suppressed. OpenAI downtime returns a retryable error; no partial
   guest message is saved.
7. Request IDs deduplicate successful guest sends. A database row lock serializes
   guest sends and staff takeover on PostgreSQL.

OpenAI structured-output documentation:
https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat

## Deploy on Render
Merge the included backend, frontend and render.yaml into your existing repository.
Deploy the backend with root directory backend and:
  pip install -r requirements.txt
  uvicorn app.main:app --host 0.0.0.0 --port $PORT

The Blueprint creates PostgreSQL and supplies DATABASE_URL. Keep your existing
database on an existing service; do not create a replacement database accidentally.
Startup adds visitor_sessions and chat_requests tables via create_all; existing
conversation and message columns are unchanged. Use reviewed migrations before
expanding this pilot's schema further.

Required settings:
- OPENAI_API_KEY (server only)
- OPENAI_MODEL (defaults to existing gpt-4.1-mini)
- ADMIN_API_KEY (long random staff secret; Blueprint generates one for new services)
- CORS_ORIGINS=https://stonetrailvillas.com,https://www.stonetrailvillas.com
  Add the exact staff UI origin if hosted elsewhere.

Optional contact settings:
- WHATSAPP_GUEST_NUMBER: hotel's public WhatsApp number, international digits only.
- HOTEL_PHONE: hotel's telephone number, preferably +countrycode...
- WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_STAFF_NUMBERS:
  server-side outbound notification configuration, comma-separated staff numbers.
  Configure the hotel and Alexis numbers here. No numbers have been invented.
  The existing notifier sends free-form text. It requires an open WhatsApp
  customer-service window; approved templates outside that window are not yet
  implemented. Failures show in the widget; the inbox remains usable.
  Automatic notification is attempted once per new handoff, with no durable
  delivery queue, retry worker or delivery webhook.

OpenAI never selects arbitrary URLs or recipients: backend configuration owns
both. WhatsApp links open WhatsApp for the guest; telephone links open the dialer.
This update does not place an automatic voice/WhatsApp call or synchronize
WhatsApp messages back into the website conversation.

## GoDaddy widget
The updated compiled file is deployment/godaddy/stonetrail-widget.js.
Upload it to /assets/stonetrail-widget.js and use install-snippet.html, setting
data-api-base-url to your actual HTTPS Render API origin. Clear the website/CDN
cache. Previous visitor sessions are intentionally reset by this update.

To rebuild:
  cd frontend
  npm ci
  npm run build:widget
Copy widget-dist/stonetrail-widget.js to deployment/godaddy/stonetrail-widget.js.

## Staff inbox
Build with VITE_API_BASE_URL set to the same Render HTTPS API origin:
  cd frontend
  npm ci
  VITE_API_BASE_URL=https://YOUR-SERVICE.onrender.com npm run build
Host frontend/dist on your chosen frontend host. Configure SPA fallback to
index.html for /staff, then visit /staff and enter ADMIN_API_KEY.
Never place ADMIN_API_KEY in the public embed or any VITE_ environment variable.

This is a shared-key pilot inbox, replacing the prior UI whose user-login,
roles, assignments and channel-management endpoints were absent. Individual
staff accounts, role enforcement, audit logging, recovery, and managed SSO remain
future work. Access key stays in browser memory. Guest tokens are random, stored
hashed in the database, scoped to one conversation, expiring and revocable.

## Availability
The date form now uses the backend's snake_case fields and GET booking-link
endpoint. Room-type lookup remains explicitly unverified and does not assert
live inventory or prices. Continue to Cloudbeds to confirm and book. Rooms and
children filters are not implemented by the current availability adapter.

## Validation
Backend: install backend/requirements.txt plus aiosqlite for tests, then run
python -m pytest -q from backend.
Three integration tests cover routing, normal replies, escalation, notification
success/failure, duplicate IDs, staff replies, isolation, revocation, AI errors and
CORS. OpenAI and WhatsApp are mocked; no live messages or paid API calls were made.
Frontend production app and GoDaddy widget builds pass. Browser interaction and
live Render/GoDaddy deployment still require verification with your configuration.

This is the chat and handoff foundation, not a complete replacement for every
Cloudbeds Guest Experience capability. Outbound WhatsApp templates, inbound
WhatsApp/webhooks, staff identities, operational queues, guest knowledge
management, full reservation integration and monitoring remain separate stages.
