// Voice in (speech-to-text) and voice out (text-to-speech) using the phone's built-in engines.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const canListen = !!SR;
export const canSpeak = "speechSynthesis" in window;

export class Listener {
  constructor({ onInterim, onFinal, onEnd, onError }) {
    this.cb = { onInterim, onFinal, onEnd, onError };
    this.rec = null;
    this.active = false;
  }

  start(lang) {
    if (!SR) {
      this.cb.onError?.("Voice input isn't supported in this browser. Use Chrome on Android or Safari on iPhone.");
      return;
    }
    this.stop();
    const rec = new SR();
    rec.lang = lang || navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      this.cb.onInterim?.(finalText + interim);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      const msg = e.error === "not-allowed"
        ? "Microphone permission is blocked. Allow the mic for this site in browser settings."
        : `Voice error: ${e.error}`;
      this.cb.onError?.(msg);
    };
    rec.onend = () => {
      this.active = false;
      this.rec = null;
      const text = finalText.trim();
      if (text) this.cb.onFinal?.(text);
      this.cb.onEnd?.(!!text);
    };
    this.rec = rec;
    this.active = true;
    try {
      rec.start();
    } catch (err) {
      this.active = false;
      this.cb.onError?.(String(err));
    }
  }

  stop() {
    if (this.rec) {
      try { this.rec.stop(); } catch { /* already stopped */ }
    }
  }
}

export function listVoices() {
  if (!canSpeak) return [];
  return speechSynthesis.getVoices();
}

export function onVoicesChanged(fn) {
  if (canSpeak) speechSynthesis.addEventListener?.("voiceschanged", fn);
}

// Strip things that sound bad when read aloud.
function speakable(text) {
  return text
    .replace(/```[\s\S]*?```/g, " (code on screen) ")
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/[*_#`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let unlocked = false;
// iOS only lets a page speak after a user tap; call this from a tap handler once.
export function unlockSpeech() {
  if (!canSpeak || unlocked) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}

export function speak(text, { voiceURI, lang } = {}) {
  return new Promise((resolve) => {
    const clean = speakable(text);
    if (!canSpeak || !clean) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    const voices = speechSynthesis.getVoices();
    const v = voices.find((x) => x.voiceURI === voiceURI)
      || voices.find((x) => lang && x.lang === lang)
      || null;
    if (v) u.voice = v;
    u.lang = v?.lang || lang || "en-US";
    u.pitch = 0.75; // a little deeper, a little more Ultron
    u.rate = 1.02;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}
