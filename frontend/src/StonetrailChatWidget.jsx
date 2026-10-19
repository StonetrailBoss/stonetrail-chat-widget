import { useCallback, useEffect, useRef, useState } from "react";
import "./Widget.css";

export default function StonetrailChatWidget({ apiBaseUrl }) {
  const base = (apiBaseUrl || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [humanOwned, setHumanOwned] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [notice, setNotice] = useState("");
  const [rooms, setRooms] = useState([]);
  const [bookingUrl, setBookingUrl] = useState("");
  const [searching, setSearching] = useState(false);
  const [dates, setDates] = useState({ checkIn: "", checkOut: "", adults: 2, children: 0, rooms: 1 });
  const token = useRef(null);
  const creating = useRef(null);
  const pending = useRef(null);
  const generation = useRef(0);
  const transcript = useRef(null);
  const storageKey = "stonetrail_visitor_v2:" + base;

  const ensureSession = useCallback(async () => {
    if (token.current) return token.current;
    if (creating.current) return creating.current;
    creating.current = (async () => {
      try {
        const cached = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        if (cached?.sessionToken && Date.parse(cached.expiresAt) > Date.now()) {
          token.current = cached.sessionToken;
          return token.current;
        }
      } catch { /* Storage may be blocked by the browser; memory-only sessions still work. */ }
      const response = await fetch(base + "/api/chat/session", { method: "POST", credentials: "omit" });
      if (!response.ok) throw new Error("Chat is unavailable. Please contact the hotel directly.");
      const data = await response.json();
      token.current = data.sessionToken;
      try { sessionStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* memory only */ }
      return token.current;
    })();
    try { return await creating.current; } finally { creating.current = null; }
  }, [base, storageKey]);

  const visitorFetch = useCallback(async (path, options = {}) => {
    const capability = await ensureSession();
    const response = await fetch(base + "/api/chat" + path, {
      ...options, credentials: "omit",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + capability, ...options.headers },
    });
    if (!response.ok) {
      if (response.status === 401) setExpired(true);
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Chat connection interrupted. Please try again.");
    }
    return response.status === 204 ? null : response.json();
  }, [base, ensureSession]);

  const refresh = useCallback(async (signal, current) => {
    const data = await visitorFetch("/messages", { signal });
    if (current !== generation.current) return;
    setMessages(data.messages);
    setHumanOwned(data.humanOwned);
  }, [visitorFetch]);

  useEffect(() => {
    if (!open || expired) return;
    const controller = new AbortController();
    let running = false;
    const tick = async () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try { await refresh(controller.signal, generation.current); }
      catch (e) { if (e.name !== "AbortError" && !controller.signal.aborted) setError(e.message); }
      finally { running = false; }
    };
    tick();
    const interval = setInterval(tick, 3000);
    return () => { clearInterval(interval); controller.abort(); };
  }, [open, expired, refresh]);

  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages]);

  async function send(text = input) {
    const clean = text.trim();
    if (!clean || sending || expired) return;
    const current = generation.current;
    if (pending.current?.message !== clean) pending.current = { message: clean, requestId: crypto.randomUUID() };
    setSending(true); setError("");
    try {
      await visitorFetch("/message", { method: "POST", body: JSON.stringify(pending.current) });
      if (current !== generation.current) return;
      pending.current = null; setInput("");
      await refresh(undefined, current);
    } catch (e) { if (current === generation.current) setError(e.message); }
    finally { if (current === generation.current) setSending(false); }
  }

  async function newChat() {
    // Revoke the previous visitor capability before clearing it.
    try { if (creating.current) await creating.current; if (token.current) await visitorFetch("/session", { method: "DELETE" }); }
    catch (e) { if (!expired) { setError(e.message); return; } }
    generation.current += 1; token.current = null; creating.current = null; pending.current = null;
    try { sessionStorage.removeItem(storageKey); } catch { /* memory only */ }
    setMessages([]); setExpired(false); setHumanOwned(false); setError(""); setInput(""); setSending(false);
    try { await refresh(undefined, generation.current); } catch (e) { setError(e.message); }
  }

  async function publicApi(path, payload) {
    const response = await fetch(base + path, { method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error("This service is unavailable. Please contact the hotel.");
    return response.json();
  }

  async function availability(e) {
    e.preventDefault(); setSearching(true); setError(""); setBookingUrl(""); setRooms([]);
    try {
      if (dates.checkOut <= dates.checkIn) throw new Error("Check-out must be after check-in.");
      const data = await publicApi("/api/availability/search", dates);
      if (data.success === false) throw new Error(data.error || "Availability lookup unavailable.");
      setRooms(data.results || []);
      setNotice(data.bookingUrl ? "Continue to Cloudbeds to confirm live availability and rates." : "Please ask our team about availability.");
    } catch (e) { setError(e.message); } finally { setSearching(false); }
  }

  async function booking(roomTypeId) {
    setSearching(true); setError("");
    try {
      const data = await publicApi("/api/booking/link", { ...dates, roomTypeId: roomTypeId === "booking-engine" ? undefined : roomTypeId });
      const url = new URL(data.bookingUrl);
      if (url.protocol !== "https:") throw new Error("Booking link unavailable.");
      setBookingUrl(url.href);
    } catch (e) { setError(e.message); } finally { setSearching(false); }
  }

  return <div className="stv-widget">
    {open && <section className="stv-panel" aria-label="Stonetrail guest chat">
      <header className="stv-header"><div><small>STONETRAIL VILLAS & SUITES</small><h2>How can we help?</h2><p>{humanOwned ? "Our team has your conversation" : "Guest assistance"}</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button></header>
      <div className="stv-transcript" ref={transcript} role="log" aria-live="polite" aria-relevant="additions">
        <p className="stv-welcome">Welcome to Stonetrail Villas & Suites. Ask about your stay, check availability, or request our team.</p>
        {messages.map(m => <article className={m.kind === "guest" ? "stv-guest" : "stv-answer"} key={m.id}><small>{m.kind === "guest" ? "You" : m.kind === "reply" ? "Stonetrail team" : "Stonetrail"}</small><p>{m.body}</p></article>)}
      </div>
      <div className="stv-tools"><button onClick={() => send("I would like to speak to a person")} disabled={sending || expired}>Talk to our team</button><button onClick={newChat} disabled={sending}>New chat</button></div>
      <details className="stv-booking"><summary>Check room availability</summary><form onSubmit={availability}><div className="stv-grid">{["checkIn", "checkOut"].map((name, i) => <label key={name}>{i ? "Check-out" : "Check-in"}<input type="date" value={dates[name]} onChange={e => setDates({ ...dates, [name]: e.target.value })} required /></label>)}{["adults", "children", "rooms"].map(name => <label key={name}>{name}<input type="number" value={dates[name]} min={name === "children" ? 0 : 1} max="20" onChange={e => setDates({ ...dates, [name]: Number(e.target.value) })} required /></label>)}</div><button disabled={searching}>Search rooms</button></form><p role="status">{notice}</p>{rooms.map((room, i) => <article key={room.roomTypeId || i}><strong>{room.name}</strong><p>{room.description}</p>{room.rate != null && <p>{room.currency || "USD"} {room.rate}</p>}<button disabled={searching} onClick={() => booking(room.roomTypeId)}>Get booking link</button></article>)}{bookingUrl && <a href={bookingUrl} target="_blank" rel="noopener noreferrer">Continue to secure booking</a>}</details>
      {error && <p className="stv-error" role="alert">{error}{expired && " Select New chat to reconnect."}</p>}
      <form className="stv-compose" onSubmit={e => { e.preventDefault(); send(); }}><label htmlFor="stv-message">Your message</label><div><input id="stv-message" value={input} onChange={e => setInput(e.target.value)} maxLength={4000} disabled={expired} autoComplete="off" placeholder="Ask us about your stay…" /><button disabled={sending || expired || !input.trim()}>{sending ? "Sending…" : "Send"}</button></div></form>
    </section>}
    <button className="stv-launcher" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Close chat" : "Chat with Stonetrail"}</button>
  </div>;
}
