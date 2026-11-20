// Phone actions Ultron can take. Each one is both a Claude tool (TOOL_DEFS) and
// a function the offline command parser can call directly (runAction).
//
// Browsers only let a page open the dialer, SMS, WhatsApp, etc. right after a real
// tap, so those actions show a card with a button instead of firing on their own.
// That also means Ultron can never call or message anyone without you tapping.

import { notes } from "./store.js";
import { laptop } from "./laptop.js";

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const enc = encodeURIComponent;

const str = (description) => ({ type: "string", description });
const obj = (properties, required = Object.keys(properties)) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

export const TOOL_DEFS = [
  {
    name: "call_phone",
    description: "Prepare a phone call. Pass a phone number, or a contact name if you don't know the number (the user then picks the contact).",
    input_schema: obj({ to: str("Phone number with country code if known, or a contact name") }),
  },
  {
    name: "send_sms",
    description: "Prepare a text message (SMS) for the user to send.",
    input_schema: obj({ to: str("Phone number or contact name"), message: str("Message text") }),
  },
  {
    name: "send_whatsapp",
    description: "Prepare a WhatsApp message. 'to' may be empty to let the user choose the chat in WhatsApp.",
    input_schema: obj({ to: str("Phone number with country code, digits only, or empty"), message: str("Message text") }, ["message"]),
  },
  {
    name: "send_email",
    description: "Prepare an email in the user's mail app.",
    input_schema: obj({ to: str("Email address, may be empty"), subject: str("Subject"), body: str("Body") }, ["subject", "body"]),
  },
  {
    name: "open_app",
    description: "Open an app or website on the phone: youtube, instagram, whatsapp, gmail, maps, spotify, x, facebook, telegram, linkedin, netflix, amazon, flipkart, github, chatgpt, calendar, drive, photos, or any https URL.",
    input_schema: obj({ target: str("App name or https URL") }),
  },
  {
    name: "play_media",
    description: "Search and play a song, video or podcast on YouTube or Spotify.",
    input_schema: obj({ query: str("What to play"), service: { type: "string", enum: ["youtube", "spotify"] } }, ["query"]),
  },
  {
    name: "navigate",
    description: "Start Google Maps directions to a place.",
    input_schema: obj({ destination: str("Place or address"), mode: { type: "string", enum: ["driving", "walking", "transit", "bicycling"] } }, ["destination"]),
  },
  {
    name: "open_search",
    description: "Open a Google search page on the phone (use when the user wants to see results themselves).",
    input_schema: obj({ query: str("Search query") }),
  },
  {
    name: "set_timer",
    description: "Start a countdown timer. Rings with sound, vibration and a notification while Ultron is open or in the background.",
    input_schema: obj({ seconds: { type: "integer", description: "Duration in seconds" }, label: str("Short label") }, ["seconds"]),
  },
  {
    name: "set_alarm",
    description: "Set an alarm for a clock time today or tomorrow (24h HH:MM). Rings like a timer; only works while Ultron stays open or in the background.",
    input_schema: obj({ time: str("24-hour time, e.g. 07:30"), label: str("Short label") }, ["time"]),
  },
  {
    name: "cancel_timers",
    description: "Cancel all running timers and alarms.",
    input_schema: obj({}),
  },
  {
    name: "device_status",
    description: "Get phone status: time, date, timezone, battery level and charging, network, running timers.",
    input_schema: obj({}),
  },
  {
    name: "get_location",
    description: "Get the phone's current GPS location.",
    input_schema: obj({}),
  },
  {
    name: "flashlight",
    description: "Turn the phone's flashlight (torch) on or off. Works on most Android phones in Chrome.",
    input_schema: obj({ on: { type: "boolean" } }),
  },
  {
    name: "vibrate",
    description: "Vibrate the phone for a number of milliseconds.",
    input_schema: obj({ ms: { type: "integer" } }),
  },
  {
    name: "copy_or_share",
    description: "Put text on a card the user can copy to clipboard or share to another app.",
    input_schema: obj({ text: str("Text to copy or share") }),
  },
  {
    name: "remember",
    description: "Save a fact about the user to long-term memory on the phone (preferences, names, numbers they tell you to remember).",
    input_schema: obj({ fact: str("The fact to remember") }),
  },
  {
    name: "recall",
    description: "List everything saved in long-term memory.",
    input_schema: obj({}),
  },
  {
    name: "forget",
    description: "Delete memories containing the given text.",
    input_schema: obj({ match: str("Text to match") }),
  },
  {
    name: "laptop_command",
    description: "Send a command or question to the user's laptop Ultron and get its reply. Use for anything that must happen on the laptop (open programs, files, system control, laptop-side automations).",
    input_schema: obj({ command: str("The command in plain language") }),
  },
];

// ---------- helpers ----------

const digits = (s) => (s || "").replace(/[^\d+]/g, "");
const looksLikeNumber = (s) => digits(s).replace(/\D/g, "").length >= 5;

async function pickContactNumber(nameHint) {
  if (!("contacts" in navigator && "select" in navigator.contacts)) return null;
  const [c] = await navigator.contacts.select(["name", "tel"], { multiple: false });
  return c?.tel?.[0] ? { name: c.name?.[0] || nameHint, tel: c.tel[0] } : null;
}

// Card for "open this link/app" actions. If the target is a contact name, add a
// contact-picker step first (Android Chrome supports the Contacts Picker).
function linkCard(ui, { title, body, label, buildHref, to }) {
  if (!to || looksLikeNumber(to)) {
    const href = buildHref(digits(to || ""));
    ui.card({ title, body, buttons: [{ label, href }] });
    return { href };
  }
  const canPick = "contacts" in navigator;
  ui.card({
    title,
    body: `${body}\n(${to}: no number saved)`,
    buttons: canPick
      ? [{
          label: `Pick ${to} from contacts`,
          onClick: async () => {
            const c = await pickContactNumber(to);
            if (c) window.location.href = buildHref(digits(c.tel));
          },
        }]
      : [{ label: `${label} (choose contact)`, href: buildHref("") }],
  });
  return { needsContact: true };
}

const TAP = "A button is now on screen; the user must tap it (phones block this without a tap). Tell them briefly.";

// ---------- timers ----------

const timers = new Map();
let timerSeq = 0;

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.connect(g).connect(ctx.destination);
      const t = ctx.currentTime + i * 0.45;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.start(t);
      o.stop(t + 0.32);
    }
  } catch { /* no audio */ }
}

async function notify(title, body) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") await Notification.requestPermission();
    if (Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(title, { body, icon: "icons/icon-192.png", vibrate: [300, 150, 300], tag: "ultron-timer" });
    else new Notification(title, { body });
  } catch { /* notifications unavailable */ }
}

function startTimer(ms, label, ui) {
  const id = ++timerSeq;
  const endsAt = Date.now() + ms;
  // Ask for notification permission now so the alert can show later.
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
  const handle = setTimeout(() => {
    timers.delete(id);
    navigator.vibrate?.([400, 200, 400, 200, 400]);
    beep();
    notify("Ultron", label ? `${label}: time's up` : "Time's up");
    ui.alarm(label ? `${label}: time's up.` : "Time's up.");
  }, ms);
  timers.set(id, { handle, endsAt, label });
  return endsAt;
}

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(" ") || "0s";
}

// ---------- flashlight ----------

let torchStream = null;
async function setTorch(on) {
  if (!on) {
    torchStream?.getTracks().forEach((t) => t.stop());
    torchStream = null;
    return "Flashlight off.";
  }
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser can't control the flashlight.");
  torchStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  const track = torchStream.getVideoTracks()[0];
  const caps = track.getCapabilities?.() || {};
  if (!caps.torch) {
    track.stop();
    torchStream = null;
    throw new Error("This phone/browser doesn't expose the torch (works on most Android phones in Chrome, not on iPhone).");
  }
  await track.applyConstraints({ advanced: [{ torch: true }] });
  return "Flashlight on.";
}

// ---------- apps ----------

const APPS = {
  youtube: "https://www.youtube.com/",
  instagram: "https://www.instagram.com/",
  whatsapp: "https://web.whatsapp.com/",
  gmail: "https://mail.google.com/",
  mail: "https://mail.google.com/",
  maps: "https://www.google.com/maps",
  "google maps": "https://www.google.com/maps",
  spotify: "https://open.spotify.com/",
  x: "https://x.com/",
  twitter: "https://x.com/",
  facebook: "https://www.facebook.com/",
  telegram: "https://t.me/",
  linkedin: "https://www.linkedin.com/",
  netflix: "https://www.netflix.com/",
  amazon: "https://www.amazon.in/",
  flipkart: "https://www.flipkart.com/",
  github: "https://github.com/",
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/",
  calendar: "https://calendar.google.com/",
  drive: "https://drive.google.com/",
  photos: "https://photos.google.com/",
  google: "https://www.google.com/",
};
if (/Android/.test(navigator.userAgent)) APPS.whatsapp = "https://wa.me/";

function resolveApp(target) {
  const t = (target || "").trim();
  if (/^https:\/\//i.test(t)) return t;
  const key = t.toLowerCase().replace(/^the\s+/, "").replace(/\s+app$/, "");
  return APPS[key] || null;
}

// ---------- main dispatcher ----------

// ui: { card({title, body, buttons}), alarm(text), settings() }
// Returns a short text result (what Claude / the offline brain reports back).
export async function runAction(name, input = {}, ui) {
  switch (name) {
    case "call_phone": {
      linkCard(ui, { title: "Call", body: input.to, label: "Call now", to: input.to, buildHref: (n) => `tel:${n}` });
      return `Call card ready for ${input.to}. ${TAP}`;
    }
    case "send_sms": {
      const sep = isIOS ? "&" : "?";
      linkCard(ui, {
        title: "Text message", body: `To ${input.to}:\n${input.message}`, label: "Open in Messages", to: input.to,
        buildHref: (n) => `sms:${n}${sep}body=${enc(input.message)}`,
      });
      return `SMS draft ready for ${input.to}. ${TAP}`;
    }
    case "send_whatsapp": {
      const n = digits(input.to).replace(/^\+/, "");
      const href = `https://wa.me/${n}?text=${enc(input.message)}`;
      ui.card({ title: "WhatsApp", body: `${input.to ? `To ${input.to}:\n` : ""}${input.message}`, buttons: [{ label: "Open WhatsApp", href }] });
      return `WhatsApp draft ready. ${TAP}`;
    }
    case "send_email": {
      const href = `mailto:${enc(input.to || "")}?subject=${enc(input.subject)}&body=${enc(input.body)}`;
      ui.card({ title: "Email", body: `${input.to ? `To ${input.to}\n` : ""}Subject: ${input.subject}\n\n${input.body}`, buttons: [{ label: "Open mail app", href }] });
      return `Email draft ready. ${TAP}`;
    }
    case "open_app": {
      const href = resolveApp(input.target);
      if (!href) {
        const s = `https://www.google.com/search?q=${enc(input.target + " app")}`;
        ui.card({ title: "Open", body: `I don't have a link for "${input.target}".`, buttons: [{ label: "Search for it", href: s }] });
        return `Unknown app "${input.target}"; showed a search button instead. Known apps: ${Object.keys(APPS).join(", ")}.`;
      }
      ui.card({ title: "Open", body: input.target, buttons: [{ label: `Open ${input.target}`, href }] });
      return `Open button for ${input.target} is on screen. ${TAP}`;
    }
    case "play_media": {
      const svc = input.service || "youtube";
      const href = svc === "spotify"
        ? `https://open.spotify.com/search/${enc(input.query)}`
        : `https://www.youtube.com/results?search_query=${enc(input.query)}`;
      ui.card({ title: svc === "spotify" ? "Spotify" : "YouTube", body: input.query, buttons: [{ label: "Play", href }] });
      return `Play button for "${input.query}" on ${svc} is on screen. ${TAP}`;
    }
    case "navigate": {
      const mode = input.mode || "driving";
      const href = `https://www.google.com/maps/dir/?api=1&destination=${enc(input.destination)}&travelmode=${mode}`;
      ui.card({ title: "Directions", body: `${input.destination} (${mode})`, buttons: [{ label: "Start in Maps", href }] });
      return `Directions to ${input.destination} ready. ${TAP}`;
    }
    case "open_search": {
      const href = `https://www.google.com/search?q=${enc(input.query)}`;
      ui.card({ title: "Search", body: input.query, buttons: [{ label: "Open results", href }] });
      return `Search button ready. ${TAP}`;
    }
    case "set_timer": {
      const sec = Math.max(1, Math.round(Number(input.seconds) || 0));
      startTimer(sec * 1000, input.label, ui);
      return `Timer set for ${fmtDuration(sec)}${input.label ? ` (${input.label})` : ""}.`;
    }
    case "set_alarm": {
      const m = /^(\d{1,2}):(\d{2})$/.exec((input.time || "").trim());
      if (!m) return `Couldn't read the time "${input.time}". Use HH:MM.`;
      const at = new Date();
      at.setHours(Number(m[1]), Number(m[2]), 0, 0);
      if (at <= new Date()) at.setDate(at.getDate() + 1);
      startTimer(at - Date.now(), input.label || `Alarm ${input.time}`, ui);
      const when = at.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
      return `Alarm set for ${when}. It only rings while Ultron is open or in the background, so for important alarms use the Clock app.`;
    }
    case "cancel_timers": {
      const n = timers.size;
      timers.forEach((t) => clearTimeout(t.handle));
      timers.clear();
      return n ? `Cancelled ${n} timer(s).` : "No timers were running.";
    }
    case "device_status": {
      const now = new Date();
      const parts = [
        `Time: ${now.toLocaleString([], { dateStyle: "full", timeStyle: "short" })}`,
        `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        `Online: ${navigator.onLine ? "yes" : "no"}`,
      ];
      const conn = navigator.connection;
      if (conn?.effectiveType) parts.push(`Network: ${conn.effectiveType}${conn.type ? ` (${conn.type})` : ""}`);
      if (navigator.getBattery) {
        const b = await navigator.getBattery();
        parts.push(`Battery: ${Math.round(b.level * 100)}%${b.charging ? " (charging)" : ""}`);
      } else {
        parts.push("Battery: not available in this browser");
      }
      const running = [...timers.values()].map((t) => `${t.label || "timer"} in ${fmtDuration(Math.max(0, Math.round((t.endsAt - Date.now()) / 1000)))}`);
      parts.push(`Timers: ${running.length ? running.join(", ") : "none"}`);
      return parts.join("\n");
    }
    case "get_location": {
      if (!navigator.geolocation) return "Location isn't available in this browser.";
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 }),
      ).catch((e) => ({ error: e.message || "denied" }));
      if (pos.error) return `Couldn't get location: ${pos.error}`;
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const href = `https://www.google.com/maps?q=${lat},${lng}`;
      ui.card({ title: "You are here", body: `${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(accuracy)} m)`, buttons: [{ label: "Open in Maps", href }] });
      return `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}, accuracy ${Math.round(accuracy)} m.`;
    }
    case "flashlight":
      return setTorch(!!input.on);
    case "vibrate": {
      const ok = navigator.vibrate?.(Math.min(5000, Math.max(50, Number(input.ms) || 400)));
      return ok ? "Vibrated." : "This phone/browser doesn't allow vibration (iPhone doesn't).";
    }
    case "copy_or_share": {
      const buttons = [{ label: "Copy", onClick: () => navigator.clipboard?.writeText(input.text) }];
      if (navigator.share) buttons.push({ label: "Share", onClick: () => navigator.share({ text: input.text }).catch(() => {}) });
      ui.card({ title: "Text", body: input.text, buttons });
      return `Copy/share card is on screen. ${TAP}`;
    }
    case "remember": {
      const n = notes.add(input.fact);
      return `Saved. ${n} memories stored.`;
    }
    case "recall": {
      const all = notes.all();
      return all.length ? all.map((n, i) => `${i + 1}. ${n.text}`).join("\n") : "Memory is empty.";
    }
    case "forget": {
      const n = notes.remove(input.match);
      return n ? `Forgot ${n} memor${n === 1 ? "y" : "ies"}.` : "Nothing matched.";
    }
    case "laptop_command": {
      const cfg = ui.settings();
      if (!laptop.configured(cfg)) return "The laptop isn't linked yet. The user can add it in Settings → Laptop link.";
      const reply = await laptop.send(cfg, input.command);
      return `Laptop replied: ${reply}`;
    }
    default:
      return `Unknown action: ${name}`;
  }
}
