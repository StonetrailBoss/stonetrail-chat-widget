# Stonetrail Chat Widget Review

## What was not working

1. `frontend/src/App.jsx` imported `./StonetrailChatWidget`, but that file was not inside `src/`. The actual component was at `frontend/stonetrail_chat_widget.jsx`, so Vite would fail to resolve the component. I copied it to `frontend/src/StonetrailChatWidget.jsx` and updated the import.

2. The widget looked like it was checking Cloudbeds, but the backend only returned mock availability. That means a guest could be shown a fake room/rate unless this is changed. I changed the result to a safer "View Live Availability" handoff until the exact Cloudbeds API endpoint for your account is wired in.

3. CORS was wide open with `allow_origins=["*"]`. I changed it to read `ALLOWED_ORIGINS` from environment variables.

4. `.env` files were included in the zip. Do not commit or share live API keys. I removed them from this reviewed package and added `.env.example` files. Rotate any keys that were inside the shared zip.

5. The frontend had Vite starter CSS that constrained the root container. I simplified `index.css` so the floating widget can render cleanly on a website.

## Recommended booking flow

- Chat answers general questions about rooms, policies, airport transfer, location, and amenities.
- For booking intent, collect check-in, check-out, adults, children, and rooms.
- Search availability through Cloudbeds only if your Cloudbeds API access supports real-time inventory/rates.
- For secure checkout and payment, hand the guest to the official Cloudbeds booking engine.
- Escalate to staff for discounts, long stays, group bookings, complaints, accessibility needs, or anything the bot cannot verify.

## Next integration work

Wire `backend/app/cloudbeds_client.py` to the approved Cloudbeds Booking Engine/PMS endpoint available to your account. Keep API keys only on the backend. Never expose Cloudbeds credentials in React.
