import { settings, history, transcript, notes } from "./store.js";
import { Listener, canListen, speak, stopSpeaking, unlockSpeech, listVoices, onVoicesChanged } from "./voice.js";
import { Brain } from "./brain.js";
import { laptop } from "./laptop.js";

const $ = (id) => document.getElementById(id);
const log = $("log");
const orb = $("orb");
const statusEl = $("status");
const input = $("input");
const micBtn = $("micBtn");

let cfg = settings.get();
let busy = false;

// ---------- rendering ----------

function scrollDown() {
  requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
}

function addMsg(role, text, persist = true) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.textContent = text;
  log.appendChild(el);
  if (persist) transcript.push({ role, text });
  scrollDown();
}

function addCard({ title, body, buttons = [] }) {
  const card = document.createElement("div");
  card.className = "card";
  const t = document.createElement("div");
  t.className = "card-title";
  t.textContent = title;
  const b = document.createElement("div");
  b.className = "card-body";
  b.textContent = body || "";
  const actions = document.createElement("div");
  actions.className = "card-actions";
  for (const btn of buttons) {
    let el;
    if (btn.href) {
      el = document.createElement("a");
      el.href = btn.href;
      if (/^https:/.test(btn.href)) { el.target = "_blank"; el.rel = "noopener"; }
    } else {
      el = document.createElement("button");
      el.type = "button";
      el.addEventListener("click", () => Promise.resolve(btn.onClick?.()).catch((e) => addMsg("sys", e.message || String(e), false)));
    }
    el.className = "btn";
    el.textContent = btn.label;
    el.addEventListener("click", () => card.classList.add("done"));
    actions.appendChild(el);
  }
  card.append(t, b, actions);
  log.appendChild(card);
  scrollDown();
}

function setState(state, text) {
  orb.dataset.state = state;
  if (text != null) statusEl.textContent = text;
}

function idleText() {
  return canListen ? "Tap the core to talk" : "Type a command (voice needs Chrome or Safari)";
}

function refreshBadge() {
  const mode = brain.mode();
  $("modeBadge").textContent = mode === "claude" ? cfg.model.replace(/^claude-/, "") : mode;
}

// ---------- brain ----------

const ui = {
  card: addCard,
  settings: () => cfg,
  botText: (t) => addMsg("bot", t),
  status: (t) => setState("thinking", t),
  alarm: (t) => {
    addMsg("bot", t);
    if (cfg.speak) speak(t, { voiceURI: cfg.voiceURI, lang: cfg.lang });
  },
};

const brain = new Brain(ui);

async function handle(text) {
  text = text.trim();
  if (!text || busy) return;
  busy = true;
  stopSpeaking();
  addMsg("user", text);
  setState("thinking", "Thinking…");
  let reply = "";
  try {
    reply = await brain.respond(text);
  } finally {
    busy = false;
  }
  if (cfg.speak && reply) {
    setState("speaking", "Speaking…");
    await speak(reply, { voiceURI: cfg.voiceURI, lang: cfg.lang });
  }
  setState("idle", idleText());
  if (cfg.handsFree && canListen && document.visibilityState === "visible") listen();
}

// ---------- voice ----------

const listener = new Listener({
  onInterim: (t) => setState("listening", t || "Listening…"),
  onFinal: (t) => handle(t),
  onEnd: (gotText) => {
    micBtn.classList.remove("on");
    if (!gotText && !busy) setState("idle", idleText());
  },
  onError: (msg) => {
    micBtn.classList.remove("on");
    setState("error", msg);
    setTimeout(() => !busy && setState("idle", idleText()), 4000);
  },
});

function listen() {
  stopSpeaking();
  micBtn.classList.add("on");
  setState("listening", "Listening…");
  listener.start(cfg.lang);
}

function toggleListen() {
  unlockSpeech();
  if (busy) return;
  if (listener.active) listener.stop();
  else listen();
}

orb.addEventListener("click", toggleListen);
micBtn.addEventListener("click", toggleListen);

$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  unlockSpeech();
  const t = input.value;
  input.value = "";
  handle(t);
});

// ---------- settings ----------

const dlg = $("settings");

function fillVoices() {
  const sel = $("setVoice");
  const voices = listVoices();
  sel.innerHTML = "";
  const def = document.createElement("option");
  def.value = "";
  def.textContent = "System default";
  sel.appendChild(def);
  for (const v of voices) {
    const o = document.createElement("option");
    o.value = v.voiceURI;
    o.textContent = `${v.name} (${v.lang})`;
    sel.appendChild(o);
  }
  sel.value = cfg.voiceURI || "";
}
onVoicesChanged(fillVoices);

function openSettings() {
  $("setBrain").value = cfg.brain;
  $("setKey").value = cfg.apiKey;
  $("setModel").value = cfg.model;
  $("setEffort").value = cfg.effort;
  $("setName").value = cfg.name;
  $("setSpeak").checked = cfg.speak;
  $("setHands").checked = cfg.handsFree;
  $("setLang").value = cfg.lang;
  $("setLaptopUrl").value = cfg.laptopUrl;
  $("setLaptopToken").value = cfg.laptopToken;
  $("laptopResult").textContent = "";
  fillVoices();
  dlg.showModal();
}

function readForm() {
  return {
    ...cfg,
    brain: $("setBrain").value,
    apiKey: $("setKey").value.trim(),
    model: $("setModel").value.trim() || "claude-opus-5-5",
    effort: $("setEffort").value,
    name: $("setName").value.trim(),
    speak: $("setSpeak").checked,
    handsFree: $("setHands").checked,
    voiceURI: $("setVoice").value,
    lang: $("setLang").value.trim() || navigator.language || "en-US",
    laptopUrl: $("setLaptopUrl").value.trim(),
    laptopToken: $("setLaptopToken").value.trim(),
  };
}

$("settingsBtn").addEventListener("click", openSettings);

$("saveSettings").addEventListener("click", () => {
  cfg = readForm();
  // Picking Claude with no key: fall back so the badge doesn't lie.
  if (cfg.brain === "claude" && !cfg.apiKey) addMsg("sys", "No API key yet, so I'm running offline commands.", false);
  settings.save(cfg);
  refreshBadge();
  checkLaptop();
});

$("testLaptop").addEventListener("click", async () => {
  const out = $("laptopResult");
  out.textContent = "Connecting…";
  try {
    const info = await laptop.ping(readForm());
    out.textContent = `Connected to ${info.name || "laptop Ultron"}${info.version ? ` v${info.version}` : ""}.`;
  } catch (err) {
    out.textContent = err.message;
  }
});

$("clearChat").addEventListener("click", () => {
  if (!confirm("Clear the chat, conversation memory and saved facts?")) return;
  history.clear();
  transcript.clear();
  notes.clear();
  log.innerHTML = "";
  dlg.close();
  addMsg("sys", "Memory wiped.", false);
});

// ---------- laptop status dot ----------

async function checkLaptop() {
  const dot = $("laptopDot");
  dot.className = "laptop-dot";
  if (!laptop.configured(cfg)) return;
  try {
    await laptop.ping(cfg);
    dot.classList.add("on");
    dot.title = "Laptop linked";
  } catch (err) {
    dot.classList.add("off");
    dot.title = err.message;
  }
}

// ---------- boot ----------

for (const e of transcript.get()) addMsg(e.role, e.text, false);
if (!transcript.get().length) {
  addMsg("sys", "Ultron phone online.", false);
  addMsg("bot", "I'm awake. Tap the core and speak, or type. Open Settings to add a Claude API key for my full brain.", false);
}
refreshBadge();
setState("idle", idleText());
checkLaptop();
setInterval(checkLaptop, 60000);

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
