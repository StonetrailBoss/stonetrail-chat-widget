import { createRoot } from "react-dom/client";
import Widget from "./StonetrailChatWidget.jsx";
import css from "./Widget.css?inline";

export function mount({ apiBaseUrl, parent = document.body } = {}) {
  if (document.getElementById("stonetrail-widget-host")) return;
  const url = new URL(apiBaseUrl || "");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Stonetrail widget requires an HTTPS API URL");
  const host = document.createElement("div"); host.id = "stonetrail-widget-host";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style"); style.textContent = css;
  const container = document.createElement("div"); shadow.append(style, container); parent.append(host);
  const root = createRoot(container);
  root.render(<Widget apiBaseUrl={url.origin} />);
  return () => { root.unmount(); host.remove(); };
}
const script = document.currentScript;
if (script?.dataset.apiBaseUrl) {
  const start = () => mount({ apiBaseUrl: script.dataset.apiBaseUrl });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
