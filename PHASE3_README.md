> For website chat behavior and GoDaddy deployment, read PHASE4_README.md. It supersedes this guide’s statement that website chat remains separate from the inbox.

# WhatsApp inbox bridge and delivery worker

This increment extends the existing FastAPI + React/Vite application and Render Blueprint. Read this guide after PHASE2_README.md; it supersedes Phase 2's statements that all inbox replies are local and WhatsApp bypasses inbox ownership. The website chat remains a separate flow.

## What now works in code

- Verified-signature WhatsApp webhooks persist guest messages to property-scoped conversations. The server acknowledges after a database commit; AI/provider calls are no longer part of webhook handling.
- Mapping is explicit by Meta phone number ID; unknown accounts are ignored rather than routed to a default property. This release supports one configured WhatsApp credential set per backend deployment. It does not yet support credential storage for multiple hotels.
- Incoming provider IDs and status events are deduplicated. Replayed batches do not create duplicate messages/jobs.
- Staff replies use a durable PostgreSQL outbox, request idempotency keys, delivery receipts and visible delivery errors. Notes and replies on manually created conversations remain local records.
- Staff ownership, human requests, non-text messages and closed conversations block AI handling. Pending AI replies are cancelled on takeover; generated answers are discarded if takeover occurs during generation. Only managers can release ownership, and assignment must first be cleared.
- Human requests create an internal event and one queued, fixed guest acknowledgement per inbound request. Delivery still requires sending to be enabled and an open reply window. This is a system acknowledgement, not an AI reply. External management WhatsApp alerts are not implemented; staff must monitor the inbox.
- Free-form replies require an inbound message within 24 hours. Approved-template sending is not implemented, so expired windows are blocked.
- Statuses distinguish queued, accepted, sent, delivered, read, failed, cancelled and unknown. Provider acceptance alone is not presented as delivered. Out-of-order receipts cannot regress read/delivered to sent. Early receipts are reconciled after send acceptance.
- Ambiguous network results and interrupted sends are quarantined as unknown, never automatically resent. This deliberately favors duplicate prevention. There is no automatic retry/backoff or reconciliation UI yet; inspect the inbox and provider logs before creating a replacement reply.
- Channel status reports configured/unverified, inbound verified, or send/receive verified based on actual observed events. Status shows historical evidence; it is not a continuous connection-health probe.
- Attachment messages are represented as placeholders and routed to staff; downloading/previewing media is pending.

## Local launch

Use Python 3.12. From backend:

```sh
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload
```

From frontend:

```sh
npm ci
npm run dev
```

Open /staff and sign in using the manager created in Phase 2. The new channel settings panel maps a WhatsApp phone number ID to that manager's property. Staff can assign, request human handling and release to AI. Staff replies show queue/delivery states in the transcript; use Refresh transcript for receipt updates. Double-submission protection preserves the request key after an API error while the same draft remains open.

Run the worker separately from backend, using the same database and provider configuration:

```sh
python -m app.messaging_worker
```

SQLite supports development/tests only. Production concurrency requires PostgreSQL row locks. The worker does no delivery work while WHATSAPP_SEND_ENABLED=false.

## Render deployment

render.yaml now includes stonetrail-messaging-worker, with a database-backed queue shared with stonetrail-api. No Redis or AWS service is needed for this increment. The API pre-deploy step applies migration 0003; the worker can recover from starting before that migration finishes.

The Blueprint uses current compute plan identifiers from Render's reference (web/worker 0.5c-512mb and Postgres 0.1c-256mb). Review the plan diff before applying to an already deployed service. Paid worker resources are only provisioned when you apply the Blueprint. No services were deployed during this build.

Configuration on the API, shared by the worker through Blueprint references:

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | Same Render PostgreSQL instance for API and worker |
| WHATSAPP_PHONE_NUMBER_ID | Exact Meta account identifier to map in /staff |
| WHATSAPP_ACCESS_TOKEN | Provider credential, secret |
| META_APP_SECRET | Webhook HMAC secret |
| WHATSAPP_API_VERSION | Explicit currently supported version from your Meta app; no hardcoded version fallback |
| WHATSAPP_VERIFY_TOKEN | Callback verification secret; API only |
| WHATSAPP_SEND_ENABLED | Defaults false; enable deliberately on API and worker when ready |
| WHATSAPP_AI_ENABLED | Defaults false; optional AI handling after handoff behavior is verified |
| OPENAI_API_KEY | Optional AI credential |
| ALLOWED_ORIGINS | Actual frontend/hotel origins; API only |

Blueprint literals keep sending and AI off on sync. To enable through IaC, change those literals in your reviewed deployment branch and resync; otherwise set both services consistently in Render. Service environment references refresh on Blueprint sync, so rotating an API credential requires resync/redeployment of the worker too.

1. Apply the source to your development branch and run checks.
2. Deploy/apply the Render Blueprint and set provider secrets. Use the existing Phase 2 bootstrap instructions for a fresh database.
3. Map WHATSAPP_PHONE_NUMBER_ID to the property through the manager channel settings.
4. Register `https://YOUR-API-HOST/whatsapp/webhook` as the Meta callback and supply WHATSAPP_VERIFY_TOKEN. Subscribe the app/account to messages using Meta's current dashboard and required permissions.
5. Send a message from an authorized test number and confirm it appears in the staff inbox. Replay verification is covered by automated tests; provider setup must be checked live.
6. Enable sending with AI still disabled, submit a staff reply, and confirm accepted and delivered/read events from Meta.
7. Test human requests and staff takeover before optionally enabling AI. A provider request already in flight cannot be recalled; PostgreSQL serializes send authorization with takeover.
8. Remove ADMIN_BOOTSTRAP_TOKEN after initial tenant/property setup. The old /whatsapp/send endpoint now returns 410, preventing a shared-token bypass of the delivery queue.

## Validation performed

- 15 backend tests passed, including existing foundation/staff tests and new signed ingestion, replay, property routing, request idempotency, expiry, delivery receipts, early receipts, unknown-outcome handling, disabled sending and AI takeover tests. Provider/model calls were mocked; no guest messages or reservations were sent.
- One optional PostgreSQL concurrency test is skipped locally because a PostgreSQL server is unavailable. A dedicated GitHub Actions PostgreSQL service/job runs migrations and this test after you push. This CI job has not been executed here.
- SQLite migration upgrade to 0003, downgrade to 0002 and re-upgrade passed.
- Render Blueprint validation against https://render.com/schema/render.yaml.json passed. This checks structure, not account provisioning or provider credentials.
- React/Vite production build passed. Browser end-to-end checks have not been run.
- Render deployment and live Meta permissions, webhook subscription, API version and send/receive remain unverified. Meta's developer page could not be fully retrieved in this environment; verify these items against the current official documentation before activation.

## Remaining work

Website chat persistence/polling and inbox handoff, Cloudbeds reservation/guest synchronization, guest/reservation identity matching, approved templates for management alerts and out-of-window replies, media access, automated retries for definitively rejected transient sends, reconciliation tools, login rate limiting/MFA/password reset and production retention/backup checks remain pending. Existing website chat is not linked to WhatsApp conversation ownership.

Official references:
- https://render.com/docs/blueprint-spec
- https://developers.facebook.com/docs/whatsapp/cloud-api/
- https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api
