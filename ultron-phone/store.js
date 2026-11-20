// Tiny persistence layer. Everything lives in this phone's localStorage only.
// Every access is wrapped so the app still works in private mode / when storage is blocked.

const PREFIX = "ultron.";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep running in memory */
  }
}

export const DEFAULT_SETTINGS = {
  brain: "offline", // "claude" | "laptop" | "offline"
  apiKey: "",
  model: "claude-opus-5-5",
  effort: "low", // voice assistant: fast replies by default
  name: "",
  speak: true,
  handsFree: false,
  voiceURI: "",
  lang: navigator.language || "en-US",
  laptopUrl: "",
  laptopToken: "",
};

export const settings = {
  get() {
    return { ...DEFAULT_SETTINGS, ...read("settings", {}) };
  },
  save(next) {
    write("settings", next);
  },
};

// Claude conversation history (the exact API message array, kept append-only).
export const history = {
  get: () => read("history", []),
  save: (msgs) => write("history", msgs),
  clear: () => write("history", []),
};

// What the chat screen shows (so the log survives a reload).
export const transcript = {
  get: () => read("transcript", []),
  push(entry) {
    const all = read("transcript", []);
    all.push(entry);
    write("transcript", all.slice(-150));
  },
  clear: () => write("transcript", []),
};

// Long-term notes Ultron can remember about you.
export const notes = {
  all: () => read("notes", []),
  add(text) {
    const all = read("notes", []);
    all.push({ text, at: new Date().toISOString() });
    write("notes", all.slice(-200));
    return all.length;
  },
  remove(match) {
    const all = read("notes", []);
    const m = match.toLowerCase();
    const kept = all.filter((n) => !n.text.toLowerCase().includes(m));
    write("notes", kept);
    return all.length - kept.length;
  },
  clear: () => write("notes", []),
};
