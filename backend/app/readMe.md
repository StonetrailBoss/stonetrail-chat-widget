backend/
└── app/
    ├── main.py
    ├── cloudbeds_client.py
    ├── openai_client.py
    ├── whatsapp_client.py          # NEW
    ├── routes/
    │   ├── chat.py
    │   ├── availability.py
    │   ├── booking.py
    │   └── whatsapp.py             # NEW
    ├── services/
    │   ├── __init__.py
    │   ├── conversation_service.py  # NEW
    │   └── whatsapp_service.py      # NEW
    └── models/
        └── __init__.py