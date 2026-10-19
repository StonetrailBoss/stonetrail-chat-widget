# Stonetrail Guest Experience Platform

FastAPI API and staff dashboard on Render; website guest widget on the GoDaddy-hosted stonetrailvillas.com website. Infrastructure is defined by render.yaml.

Start with **[PHASE4_README.md](PHASE4_README.md)** for current setup and limitations. It includes CORS configuration, visitor sessions, staff replies, migration 0004 and GoDaddy installation.

- `backend/`: persistent staff inbox, website chat and WhatsApp bridge.
- `frontend/`: React/Vite staff app and guest widget source.
- `deployment/godaddy/stonetrail-widget.js`: built standalone widget, with runtime API URL configuration.
- `deployment/godaddy/install-snippet.html`: script tag to adapt to the actual Render API host.
- `render.yaml`: API, PostgreSQL, staff frontend and messaging worker.

For a new database, follow the tenant/property and first-manager bootstrap steps in PHASE2_README.md, then the current Phase 4 guide. WhatsApp configuration remains documented in PHASE3_README.md. Read their newer-release banners before following older behavior descriptions.

This is an incremental implementation. No live services were deployed by the source delivery. AI and WhatsApp sending default to disabled. Cloudbeds availability is currently a booking-engine handoff; PMS synchronization, guest identity verification and digital check-in remain future work.
