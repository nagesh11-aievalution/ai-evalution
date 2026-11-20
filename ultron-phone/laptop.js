// Phone -> laptop link. Speaks the protocol in laptop-bridge/PROTOCOL.md.
//   GET  {url}/ultron/ping     -> { ok, name, version }
//   POST {url}/ultron/command  { text, source, device, sent_at } -> { ok, reply }
// Every request carries the shared token in the X-Ultron-Token header.

function base(url) {
  return (url || "").trim().replace(/\/+$/, "");
}

async function call(cfg, path, { method = "GET", body, timeoutMs = 25000 } = {}) {
  const url = base(cfg.laptopUrl);
  if (!url) throw new Error("No laptop URL set. Add it in Settings → Laptop link.");
  if (location.protocol === "https:" && url.startsWith("http:")) {
    throw new Error("This app runs on https, so the laptop link must be https too (see laptop-bridge/README.md).");
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url + path, {
      method,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Ultron-Token": cfg.laptopToken || "",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error("Laptop rejected the token. Check that it matches ULTRON_TOKEN on the laptop.");
    if (!res.ok) throw new Error(data.error || `Laptop answered HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Laptop didn't answer in time. Is it on and is the bridge running?");
    if (err instanceof TypeError) throw new Error("Can't reach the laptop. Check the URL, the network, and that the bridge is running.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const laptop = {
  configured: (cfg) => !!base(cfg.laptopUrl),
  ping: (cfg) => call(cfg, "/ultron/ping", { timeoutMs: 6000 }),
  async send(cfg, text) {
    const data = await call(cfg, "/ultron/command", {
      method: "POST",
      body: {
        text,
        source: "phone",
        device: navigator.userAgent,
        sent_at: new Date().toISOString(),
      },
    });
    return data.reply ?? "(laptop sent no reply)";
  },
};
