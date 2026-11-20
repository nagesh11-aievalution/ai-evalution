// Offline brain: understands common phone commands without any AI or internet.
// Returns { tool, input, tapLine } for an action, or { reply } for plain talk.

const NUM_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fifteen: 15, twenty: 20, thirty: 30, "forty five": 45, sixty: 60 };

function toNumber(s) {
  const t = s.trim().toLowerCase();
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NUM_WORDS[t] ?? NaN;
}

function durationSeconds(text) {
  let total = 0;
  const re = /(\d+(?:\.\d+)?|an?|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|sixty)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/gi;
  let m;
  while ((m = re.exec(text))) {
    const n = toNumber(m[1]);
    const u = m[2].toLowerCase();
    if (Number.isNaN(n)) continue;
    total += u.startsWith("h") ? n * 3600 : u.startsWith("m") ? n * 60 : n;
  }
  return Math.round(total);
}

function clockTime(text) {
  const m = /(\d{1,2})(?::|\.)?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i.exec(text);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = (m[3] || "").toLowerCase().replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const clean = (s) => s.replace(/[.!?]+$/, "").trim();

const RULES = [
  // laptop first, so "tell laptop to call..." goes to the laptop
  [/^(?:tell|ask)\s+(?:the\s+|my\s+)?laptop\s+(?:to\s+)?(.+)$/i, (m) => ({ tool: "laptop_command", input: { command: clean(m[1]) } })],
  [/^laptop[,:]?\s+(.+)$/i, (m) => ({ tool: "laptop_command", input: { command: clean(m[1]) } })],

  [/^(?:call|dial|ring)\s+(.+)$/i, (m) => ({ tool: "call_phone", input: { to: clean(m[1]) }, tapLine: `Tap to call ${clean(m[1])}.` })],

  [/^(?:whatsapp|send (?:a )?whatsapp(?: message)? to)\s+(.+?)\s+(?:saying|that|:)\s+(.+)$/i,
    (m) => ({ tool: "send_whatsapp", input: { to: clean(m[1]), message: clean(m[2]) }, tapLine: "Tap to open WhatsApp." })],

  [/^(?:text|message|sms|send (?:a )?(?:text|message|sms) to)\s+(.+?)\s+(?:saying|that|:)\s+(.+)$/i,
    (m) => ({ tool: "send_sms", input: { to: clean(m[1]), message: clean(m[2]) }, tapLine: `Tap to send it to ${clean(m[1])}.` })],

  [/^(?:play)\s+(.+?)(?:\s+on\s+(youtube|spotify))?$/i,
    (m) => ({ tool: "play_media", input: { query: clean(m[1]), service: (m[2] || "youtube").toLowerCase() }, tapLine: "Tap play." })],

  [/^(?:navigate|directions|take me|drive|get directions)\s+(?:to\s+)?(.+)$/i,
    (m) => ({ tool: "navigate", input: { destination: clean(m[1]) }, tapLine: "Tap to start directions." })],

  [/^(?:search(?: for)?|google|look up)\s+(.+)$/i,
    (m) => ({ tool: "open_search", input: { query: clean(m[1]) }, tapLine: "Tap to see the results." })],

  [/\b(?:cancel|stop|clear)\b.*\b(?:timers?|alarms?)\b/i, () => ({ tool: "cancel_timers", input: {} })],

  [/\b(?:set\s+)?(?:a\s+)?timer\b|\bremind me in\b/i, (m, text) => {
    const sec = durationSeconds(text);
    if (!sec) return { reply: "How long should the timer be? Say something like five minutes." };
    const label = (/\bto\s+(.+)$/i.exec(text) || [])[1];
    return { tool: "set_timer", input: { seconds: sec, label: label ? clean(label) : "" } };
  }],

  [/\b(?:alarm|wake me(?: up)?)\b/i, (m, text) => {
    const t = clockTime(text.replace(/.*?\b(?:at|for)\b/i, ""));
    if (!t) return { reply: "What time? Say something like set an alarm for 6:30 am." };
    return { tool: "set_alarm", input: { time: t, label: "" } };
  }],

  [/\b(?:flash ?light|torch)\b.*\b(on|off)\b|\bturn\s+(on|off)\s+(?:the\s+)?(?:flash ?light|torch)\b/i,
    (m) => ({ tool: "flashlight", input: { on: (m[1] || m[2]).toLowerCase() === "on" } })],

  [/^(?:open|launch|start)\s+(.+)$/i, (m) => ({ tool: "open_app", input: { target: clean(m[1]) }, tapLine: `Tap to open ${clean(m[1])}.` })],
  [/\b(battery|charge|charging|status|what time|time is it|date|today)\b/i, () => ({ tool: "device_status", input: {} })],
  [/\b(where am i|my location|current location)\b/i, () => ({ tool: "get_location", input: {} })],

  [/^remember(?: that)?\s+(.+)$/i, (m) => ({ tool: "remember", input: { fact: clean(m[1]) } })],
  [/\bwhat do you (?:remember|know about me)\b/i, () => ({ tool: "recall", input: {} })],
  [/^forget\s+(.+)$/i, (m) => ({ tool: "forget", input: { match: clean(m[1]) } })],
  [/^vibrate\b/i, () => ({ tool: "vibrate", input: { ms: 500 } })],
];

export function parseCommand(raw) {
  const text = raw.trim().replace(/^(?:hey\s+)?ultron[,\s]+/i, "");
  for (const [re, build] of RULES) {
    const m = re.exec(text);
    if (m) return build(m, text);
  }
  if (/^(hi|hello|hey|yo|sup|what'?s up)\b/i.test(text)) {
    return { reply: "I'm here. Running in offline mode, so I handle phone commands. Add a Claude API key in Settings and I can do everything else." };
  }
  if (/\b(who are you|what are you)\b/i.test(text)) {
    return { reply: "I'm Ultron, your phone body. The laptop is my other half." };
  }
  if (/\b(help|what can you do)\b/i.test(text)) {
    return { reply: "Offline I can call, text, WhatsApp, open apps, play music, navigate, search, set timers and alarms, check battery, location and the flashlight, remember things, and pass commands to your laptop. With a Claude API key I can do all that and actually think." };
  }
  return { reply: "That needs my full brain. Add a Claude API key in Settings, or link the laptop and switch the brain to Laptop." };
}
