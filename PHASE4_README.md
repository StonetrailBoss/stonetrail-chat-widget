# Website chat, staff takeover and GoDaddy widget

This release connects the Stonetrail website widget to the persistent staff inbox while preserving FastAPI, React/Vite and Render infrastructure. The primary widget runs on stonetrailvillas.com hosted by GoDaddy; the API, PostgreSQL and staff dashboard remain on Render. No deployment has been performed.

## Delivered

- Website conversations and guest messages persist in the staff inbox.
- Staff reply in the existing /staff interface. Website replies become available in the guest widget through polling; internal notes and internal system events never appear in the guest feed.
- Visitor sessions use a server-generated 48-byte random bearer capability. Only its SHA-256 digest is stored in the database. Capabilities are bound to the origin where issued, expire after 24 hours, and can be revoked by New chat. They do not verify guest identity or authorize reservation access.
- Guest message request IDs and staff reply idempotency keys prevent duplicate records after a retry.
- Human requests and staff replies place the conversation in human handling. AI responses are blocked while staff owns the conversation; a response generated during takeover is discarded before it is stored. Only a manager can release it, clearing the assignment first.
- Website AI is disabled by default. When enabled it uses up to 30 preceding guest/AI/staff reply messages for context; internal notes are excluded. A model error falls back to staff handling.
- A standalone browser bundle mounts into a shadow root, isolating widget styles from the host website. It contains no staff dashboard or provider credentials. Runtime API configuration means this bundle does not require rebuilding merely to change the Render API hostname.
- Both official website origins are covered by the backend CORS default. An explicit ALLOWED_ORIGINS environment value overrides this default and must include the actual origins.
- Database-backed limits: 20 session creations/hour per client address, 30 new messages/minute/session and 60 feed polls/minute/session. Address keys are HMAC digests, not raw IPs; use the same WEBSITE_RATE_LIMIT_SECRET across API instances. These limits supplement visitor capability checks; CORS alone does not prevent bots.
- Existing Cloudbeds availability/booking handoff remains supported. The widget describes it as a link to Cloudbeds to confirm inventory and rates; this release does not implement PMS inventory lookup.

## GoDaddy installation

The ready-built file is `deployment/godaddy/stonetrail-widget.js`. `deployment/godaddy/install-snippet.html` contains the script tag to adapt.

1. Deploy the backend source with migration 0004, keeping the existing Render staff frontend.
2. Set WEBSITE_PROPERTY_ID to the local database property UUID shown by `/api/staff/me` after staff login. This is not CLOUDBEDS_PROPERTY_ID. One website property is configured per backend deployment in this release.
3. Set these API environment variables:

```env
ALLOWED_ORIGINS=https://stonetrailvillas.com,https://www.stonetrailvillas.com,https://YOUR-STAFF-FRONTEND.onrender.com
WEBSITE_ALLOWED_ORIGINS=https://stonetrailvillas.com,https://www.stonetrailvillas.com
WEBSITE_PROPERTY_ID=YOUR-LOCAL-DATABASE-PROPERTY-ID
WEBSITE_AI_ENABLED=false
```

The Render Blueprint generates WEBSITE_RATE_LIMIT_SECRET; retain that value across API instances. The Blueprint's explicit AI default is false and is reapplied on sync. No website guest session is created until a valid property is configured.

4. Upload the built widget JavaScript to `/assets/stonetrail-widget.js` on the website through the hosting workflow available for your GoDaddy plan.
5. Add this once in the page footer or a supported custom-code area, replacing the API placeholder:

```html
<script
  defer
  src="/assets/stonetrail-widget.js"
  data-api-base-url="https://YOUR-ACTUAL-API-SERVICE.onrender.com"
></script>
```

6. Open the website, click Chat with Stonetrail and send a test message. Sign in to the Render /staff dashboard, open Website guest inquiry and select Reply to website visitor. The reply should appear in the guest widget within roughly three seconds while it is open and the tab is visible.
7. Add an internal note and confirm it stays out of the guest transcript. Request a person, verify human handling, and test New chat. After checking handoff behavior, optionally enable WEBSITE_AI_ENABLED on the API.

Do not upload the source tree, .env files or backend credentials to the public website. This script is for direct page embedding. If GoDaddy Website Builder renders custom HTML inside an iframe, inspect that frame's actual origin and explicitly include it in both origin lists only if you trust it. An origin of `null` is deliberately rejected; use a direct script-capable page or a frame hosted on your own domain. The widget uses no third-party cookies.

If the site enforces a Content Security Policy, it must permit the bundle in script-src, the actual Render API in connect-src, and the widget's inline shadow-root stylesheet under the site's style policy. Review this with the existing site configuration; this release does not edit the website CSP. Do not add duplicate legacy widgets alongside this bundle.

## Frontend builds

For the Render staff app, set VITE_API_BASE_URL before building, as in prior phases:

```sh
cd frontend
npm ci
npm run build
```

For the standalone GoDaddy widget:

```sh
npm run build:widget
```

Copy `frontend/widget-dist/stonetrail-widget.js` into the GoDaddy asset location. The extra CSS emitted by Vite is not required for this embedding: the JS injects its stylesheet into its shadow root. The React app still imports the CSS normally for local development.

The old top-level `frontend/stonetrail_chat_widget.jsx` now re-exports the maintained component rather than keeping a separate implementation.

## Backend API change and rollout

The guest chat endpoint now requires a visitor bearer capability and a request ID. A caller-provided sessionId is no longer accepted as access to a conversation. Update backend and widget together during a controlled deployment window; older widgets cannot use the new chat contract. Availability and booking-link endpoints retain their existing paths.

| Method and path | Behavior |
| --- | --- |
| POST /api/chat/session | Create a visitor capability; requires an allowed Origin |
| POST /api/chat/message | Persist a guest message; JSON contains message and requestId |
| GET /api/chat/messages | Latest 100 visible transcript entries, human ownership and conversation status |
| DELETE /api/chat/session | Revoke the visitor capability |

All authenticated guest requests need `Authorization: Bearer TOKEN` and the original allowed Origin. Tokens are never put into URLs. The widget stores the visitor capability in sessionStorage when available; otherwise it keeps it only in memory. New chat revokes the previous capability and starts a separate conversation. Full transcripts remain available to authorized staff; only the latest 100 visible entries are returned to the widget.

Run from backend after installing requirements:

```sh
alembic upgrade head
uvicorn app.main:app --reload
```

For localhost testing, include `http://localhost:5173` in both origin lists and set the local database property ID. The website bridge does not depend on the WhatsApp worker or WHATSAPP_SEND_ENABLED. Website ownership and WhatsApp ownership refer to separate conversations; no unverified identity merge is performed.

## Validation and remaining checks

- 23 backend tests passed; one optional PostgreSQL test was skipped locally.
- Backend tests cover CORS preflight for apex/www, unapproved origins, visitor tokens, origin binding, expiry/revocation, private-note filtering, staff replies, request deduplication, AI history, takeover during generation and rate limits, in addition to prior staff/WhatsApp tests.
- SQLite migration upgrade/downgrade/upgrade verifies existing tenant data survives.
- Both the React/Vite staff build and standalone widget build pass.
- Render Blueprint validation against its published JSON schema passes.
- A browser smoke test is included at frontend/tests/widget.e2e.cjs. It could not execute here because the required Chromium binary was absent and its download failed. It is not a passed browser/UI test. It is designed for a local fixture with a disposable database and checks embedding, a mobile viewport, shadow-root style isolation, a staff/guest round trip and private-note isolation.
- The optional PostgreSQL queue-concurrency test remains skipped locally. Existing CI is configured to run it against a dedicated PostgreSQL service. Live GoDaddy, Render, Cloudbeds and Meta integration have not been exercised.

For the browser test, install Playwright with Chromium in a development environment, build the staff app using the test API URL, and supply E2E_API_URL, E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD for a disposable local test database. Default fixture origins are http://127.0.0.1:4177 and API http://127.0.0.1:8177. Set both allowed-origin variables accordingly. Do not run this fixture against production.

Remaining work includes Cloudbeds reservation/guest synchronization and verified identity matching, management notifications, media, automated journeys, digital check-in, pagination/history loading in the guest widget, staff authentication hardening and transcript-retention policies. The server keeps expired chat records; revocation controls visitor access and does not delete staff records. IP rate limiting relies on the ASGI client address; verify trusted proxy settings in the Render deployment before treating it as a distributed abuse-control boundary.

Technical references:
- https://starlette.dev/middleware/
- https://vite.dev/guide/build
- https://render.com/docs/blueprint-spec
