import { useEffect, useState } from "react";
import "./StaffInbox.css";
const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
export default function StaffInbox() {
  const [key, setKey] = useState(""), [token, setToken] = useState("");
  const [items, setItems] = useState([]), [selected, setSelected] = useState(null);
  const [thread, setThread] = useState(null), [body, setBody] = useState("");
  const [error, setError] = useState(""), [sending, setSending] = useState(false);
  async function api(path, options = {}) {
    const response = await fetch(base + "/api/staff" + path, {
      ...options, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    });
    if (!response.ok) throw Error("Staff request failed (" + response.status + ")");
    return response.json();
  }
  useEffect(() => {
    if (!token) return;
    let active = true;
    async function tick() {
      try {
        const list = await api("/conversations");
        const detail = selected ? await api("/conversations/" + selected) : null;
        if (active) { setItems(list); setThread(detail); setError(""); }
      } catch (e) { if (active) setError(e.message); }
    }
    tick(); const interval = setInterval(tick, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [token, selected]); // Access key stays in memory; never store it in the website embed.
  async function change(human_owned) {
    try {
      await api("/conversations/" + selected, { method: "PATCH", body: JSON.stringify({ human_owned }) });
      setThread(await api("/conversations/" + selected));
    } catch (e) { setError(e.message); }
  }
  async function send(e) {
    e.preventDefault(); if (sending || !body.trim()) return;
    setSending(true);
    try {
      await api("/conversations/" + selected + "/messages", { method: "POST", body: JSON.stringify({ body }) });
      setBody(""); setThread(await api("/conversations/" + selected));
    } catch (e) { setError(e.message); } finally { setSending(false); }
  }
  return <main className="staff"><h1>Stonetrail staff inbox</h1>
    {error && <p role="alert">{error}</p>}
    {!token ? <form onSubmit={e => { e.preventDefault(); setToken(key); setKey(""); }}>
      <label>Staff access key<input type="password" value={key} onChange={e => setKey(e.target.value)} required /></label>
      <button>Open inbox</button></form> : <>
      <button onClick={() => { setToken(""); setItems([]); setThread(null); setSelected(null); }}>Sign out</button>
      <div className="inbox"><aside>{items.map(c => <button className="thread" key={c.id} onClick={() => { setSelected(c.id); setThread(null); }}>
        {c.subject} · {c.human_owned ? "Staff requested" : "AI handling"}</button>)}</aside>
      <section>{thread && <><p>{thread.human_owned ? "Staff handling" : "AI handling"}</p>
        <button onClick={() => change(true)}>Take over</button><button onClick={() => change(false)}>Release to AI</button>
        {thread.messages.map(m => <article key={m.id}><small>{m.role}</small><p>{m.body}</p></article>)}
        <form onSubmit={send}><label>Reply to guest<textarea value={body} onChange={e => setBody(e.target.value)} maxLength={4000} required /></label>
          <button disabled={sending}>{sending ? "Saving…" : "Send reply"}</button></form></>}</section></div></>}
  </main>;
}
