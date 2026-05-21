import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, CalendarDays, Users, BedDouble, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Stonetrail Villas Chat Booking Widget
 * ------------------------------------------------------------
 * Drop this component into your website or React app.
 * It expects a backend API with these endpoints:
 *   POST /api/chat/message
 *   POST /api/availability/search
 *   POST /api/booking/link
 *
 * Recommended backend: Python FastAPI on Render with Cloudbeds credentials
 * stored as environment variables. Never expose Cloudbeds API keys here.
 */

const API_BASE_URL = "https://stonetrail-chat-widget.onrender.com";

const quickActions = [
  "Check availability",
  "View room options",
  "Airport transfer",
  "Talk to staff",
];

function createSessionId() {
  const existing = localStorage.getItem("stv_chat_session_id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("stv_chat_session_id", id);
  return id;
}

export default function StonetrailChatWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      type: "text",
      content:
        "Welcome to Stonetrail Villas & Suites. I can help you check availability, compare rooms, and book your stay directly.",
    },
  ]);
  const [bookingForm, setBookingForm] = useState({
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    rooms: 1,
  });
  const [availability, setAvailability] = useState([]);
  const sessionId = useMemo(() => createSessionId(), []);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, availability, loading]);

  async function sendMessage(text = input) {
    const cleanText = text.trim();
    if (!cleanText) return;

    setMessages((prev) => [...prev, { role: "user", type: "text", content: cleanText }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: cleanText,
          pageUrl: window.location.href,
        }),
      });

      if (!response.ok) throw new Error("Chat API request failed");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: data.type || "text",
          content: data.reply || "I can help with that. Would you like to check availability?",
          actions: data.actions || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content:
            "I’m having trouble connecting right now. Please call or WhatsApp Stonetrail Villas for immediate assistance.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function searchAvailability() {
    if (!bookingForm.checkIn || !bookingForm.checkOut) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: "Please select both check-in and check-out dates so I can search availability.",
        },
      ]);
      return;
    }

    setLoading(true);
    setAvailability([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/availability/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...bookingForm }),
      });

      if (!response.ok) throw new Error("Availability API request failed");
      const data = await response.json();
      setAvailability(data.results || []);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: data.results?.length
            ? "Great news — I found available options for your stay."
            : "I could not find availability for those dates. Would you like to try different dates?",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: "I could not check availability right now. Please try again or contact us directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function getBookingLink(roomTypeId) {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/booking/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, roomTypeId, ...bookingForm }),
      });

      if (!response.ok) throw new Error("Booking link API request failed");
      const data = await response.json();
      window.open(data.bookingUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: "I could not generate the booking link. Please use our Book Now button or contact us directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="mb-4 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
          >
            <div className="flex items-center justify-between bg-[#102820] px-4 py-3 text-white">
              <div>
                <div className="text-sm font-semibold">Stonetrail Villas</div>
                <div className="text-xs text-white/75">Booking Assistant</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <div className="h-[460px] overflow-y-auto bg-[#f7f4ee] px-4 py-4">
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-[#102820] text-white"
                          : "bg-white text-neutral-800 shadow-sm"
                      }`}
                    >
                      {message.content}
                      {message.actions?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.actions.map((action, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(action.label || action)}
                              className="rounded-full border border-neutral-200 px-3 py-1 text-xs hover:bg-neutral-50"
                            >
                              {action.label || action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <AvailabilityForm
                  bookingForm={bookingForm}
                  setBookingForm={setBookingForm}
                  searchAvailability={searchAvailability}
                  loading={loading}
                />

                {availability.map((room) => (
                  <RoomCard key={room.roomTypeId} room={room} onBook={getBookingLink} />
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-neutral-600 shadow-sm">
                      <Loader2 size={16} className="animate-spin" /> Checking...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="border-t bg-white p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask about rooms or availability..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button onClick={() => sendMessage()} className="rounded-full bg-[#102820] p-2 text-white">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#102820] text-white shadow-xl hover:bg-[#173b30]"
        aria-label="Open Stonetrail Villas chat"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}

function AvailabilityForm({ bookingForm, setBookingForm, searchAvailability, loading }) {
  function updateField(field, value) {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-800">
        <CalendarDays size={16} /> Check Availability
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-600">
          Check-in
          <input
            type="date"
            value={bookingForm.checkIn}
            onChange={(e) => updateField("checkIn", e.target.value)}
            className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-neutral-600">
          Check-out
          <input
            type="date"
            value={bookingForm.checkOut}
            onChange={(e) => updateField("checkOut", e.target.value)}
            className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-neutral-600">
          Adults
          <input
            type="number"
            min="1"
            value={bookingForm.adults}
            onChange={(e) => updateField("adults", Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-neutral-600">
          Children
          <input
            type="number"
            min="0"
            value={bookingForm.children}
            onChange={(e) => updateField("children", Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
          />
        </label>
      </div>
      <button
        onClick={searchAvailability}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#102820] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173b30] disabled:opacity-60"
      >
        <Users size={16} /> Search Rooms
      </button>
    </div>
  );
}

function RoomCard({ room, onBook }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {room.imageUrl && <img src={room.imageUrl} alt={room.name} className="h-32 w-full object-cover" />}
      <div className="p-3">
        <div className="flex items-start gap-2">
          <BedDouble size={18} className="mt-0.5 text-[#102820]" />
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">{room.name}</h4>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">{room.description}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-neutral-900">
            {room.currency || "USD"} {room.rate || "—"}
          </div>
          <button
            onClick={() => onBook(room.roomTypeId)}
            className="rounded-full bg-[#102820] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173b30]"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
