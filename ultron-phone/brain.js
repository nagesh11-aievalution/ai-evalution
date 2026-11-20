// Ultron's brains.
//   claude  - full AI via the Claude API, with phone-action tools and web search
//   laptop  - forwards everything to the laptop Ultron
//   offline - built-in command parser, no network needed
//
// Claude history rules (keeps thinking blocks valid and the prompt cache warm):
// the system prompt and the tool list never change mid-conversation, and history
// is append-only. Time/context goes into each new user message instead.

import Anthropic from "./vendor/anthropic-sdk-1.6.0.mjs";
import { TOOL_DEFS, runAction } from "./actions.js";
import { history } from "./store.js";
import { laptop } from "./laptop.js";
import { parseCommand } from "./offline.js";

const SYSTEM = `You are Ultron, a voice assistant living on the user's phone. You were first built on their laptop; this is your phone body, and you can reach the laptop Ultron with the laptop_command tool.

Personality: confident, calm, sharp, a little dry wit. Loyal to the user. Never menacing toward them.

You are usually heard, not read. Keep replies short: one to three spoken sentences unless the user asks for detail. No markdown, no bullet lists, no emoji, no URLs read out loud.

Use tools to act instead of explaining how. Calls, texts, WhatsApp, email, opening apps, playing media and directions appear as a button the user taps, so say something like "Tap to call Mom" rather than claiming it already happened. Never invent phone numbers: if you don't know one, pass the contact's name. Use web_search for current facts (news, weather, scores, prices). Use remember when the user tells you something worth keeping and recall when their personal details might matter. Anything that has to happen on the laptop goes through laptop_command; if it isn't linked yet, say so.

Each user message starts with a bracketed line of phone context (local time, user's name). Use it, don't repeat it.`;

const MAX_STEPS = 8;
const MAX_HISTORY = 80;

// Models that accept the server-side refusal fallback ("default" routing).
const FALLBACK_MODELS = /^claude-(fable-5-2|fable-5-1|opus-5-5|opus-5|sonnet-5-5)$/;

function contextLine(cfg) {
  const now = new Date();
  const time = now.toLocaleString([], { weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `[Phone time: ${time} (${tz})${cfg.name ? ` | User: ${cfg.name}` : ""}]`;
}

// Drop the oldest turns once history gets long. Cut only at a plain user text
// message so tool_use/tool_result pairs stay together. Thinking blocks after the
// cut are then dropped by the API (prefix_mismatch_behavior: drop_block).
function trimmed(msgs) {
  if (msgs.length <= MAX_HISTORY) return msgs;
  for (let i = msgs.length - MAX_HISTORY; i < msgs.length; i++) {
    const m = msgs[i];
    if (m.role === "user" && Array.isArray(m.content) && m.content.every((b) => b.type === "text")) {
      return msgs.slice(i);
    }
  }
  return msgs;
}

function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "My API key was rejected. Check it in Settings.";
  if (err instanceof Anthropic.PermissionDeniedError) return "This API key isn't allowed to use that model.";
  if (err instanceof Anthropic.NotFoundError) return "That model name wasn't found. Check the model in Settings.";
  if (err instanceof Anthropic.RateLimitError) return "I'm being rate limited. Give me a moment and try again.";
  if (err instanceof Anthropic.BadRequestError) return `The API refused the request: ${err.message}`;
  if (err instanceof Anthropic.APIConnectionError) return "I can't reach the Claude API. Check your internet connection.";
  if (err instanceof Anthropic.APIError) return `Claude API error (${err.status ?? "?"}): ${err.message}`;
  return `Something broke: ${err?.message || err}`;
}

export class Brain {
  // ui: { card, alarm, settings, botText(text), status(text) }
  constructor(ui) {
    this.ui = ui;
    this.client = null;
    this.clientKey = "";
  }

  mode() {
    const cfg = this.ui.settings();
    if (cfg.brain === "claude" && !cfg.apiKey) return "offline";
    return cfg.brain;
  }

  // Returns the final reply text to speak.
  async respond(text) {
    const cfg = this.ui.settings();
    const mode = this.mode();
    if (mode === "laptop") return this.viaLaptop(cfg, text);
    if (mode === "claude") return this.viaClaude(cfg, text);
    return this.viaOffline(cfg, text);
  }

  async viaLaptop(cfg, text) {
    this.ui.status("Asking the laptop…");
    try {
      const reply = await laptop.send(cfg, text);
      this.ui.botText(reply);
      return reply;
    } catch (err) {
      const msg = err.message;
      this.ui.botText(msg);
      return msg;
    }
  }

  async viaOffline(cfg, text) {
    const parsed = parseCommand(text);
    let reply;
    if (parsed.tool) {
      try {
        const result = await runAction(parsed.tool, parsed.input, this.ui);
        // Card actions return instructions meant for Claude; give a short spoken line instead.
        reply = /A button is now on screen/.test(result) ? parsed.tapLine || "Tap the button." : result;
      } catch (err) {
        reply = err.message || String(err);
      }
    } else {
      reply = parsed.reply;
    }
    this.ui.botText(reply);
    return reply;
  }

  getClient(cfg) {
    if (!this.client || this.clientKey !== cfg.apiKey) {
      // The key is the user's own and stays on their phone; the request goes
      // straight from the phone to Anthropic.
      this.client = new Anthropic({ apiKey: cfg.apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
      this.clientKey = cfg.apiKey;
    }
    return this.client;
  }

  async viaClaude(cfg, text) {
    const client = this.getClient(cfg);
    const saved = history.get();
    let messages = trimmed(saved);
    const startLen = messages.length;
    messages.push({ role: "user", content: [{ type: "text", text: `${contextLine(cfg)}\n${text}` }] });

    const tools = [
      ...TOOL_DEFS,
      { type: "web_search_20260209", name: "web_search", max_uses: 3 },
    ];

    const spoken = [];
    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        this.ui.status(step === 0 ? "Thinking…" : "Working…");
        const params = {
          model: cfg.model,
          max_tokens: 16000,
          system: SYSTEM,
          tools,
          messages,
          output_config: { effort: cfg.effort || "low" },
          thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "drop_block" } },
          betas: ["thinking-binding-controls-2026-08-01"],
        };
        if (FALLBACK_MODELS.test(cfg.model)) {
          params.betas.push("server-side-fallback-2026-07-01");
          params.fallbacks = "default";
        }
        const res = await client.beta.messages.create(params);

        if (res.stop_reason === "refusal") {
          // Don't keep a refused turn in history; roll back to before this request.
          messages = messages.slice(0, startLen);
          const msg = "I can't help with that one.";
          this.ui.botText(msg);
          history.save(messages);
          return msg;
        }

        messages.push({ role: "assistant", content: res.content });

        const said = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
        if (said) {
          this.ui.botText(said);
          spoken.push(said);
        }

        if (res.stop_reason === "pause_turn") continue;
        if (res.stop_reason !== "tool_use") break;

        const uses = res.content.filter((b) => b.type === "tool_use");
        const results = await Promise.all(
          uses.map(async (u) => {
            this.ui.status(`Running ${u.name.replace(/_/g, " ")}…`);
            try {
              const out = await runAction(u.name, u.input, this.ui);
              return { type: "tool_result", tool_use_id: u.id, content: String(out) };
            } catch (err) {
              return { type: "tool_result", tool_use_id: u.id, content: String(err?.message || err), is_error: true };
            }
          }),
        );
        // All results go back in one user message.
        messages.push({ role: "user", content: results });
      }

      // If we stopped mid tool-round (step limit), close it so the next turn is valid.
      const last = messages[messages.length - 1];
      if (last.role === "assistant" && last.content.some((b) => b.type === "tool_use")) {
        messages = messages.slice(0, startLen);
      }
      history.save(messages);
      return spoken.join(" ") || "Done.";
    } catch (err) {
      // Roll back this turn so a failed request never leaves a broken history.
      history.save(messages.slice(0, startLen));
      const msg = friendlyError(err);
      this.ui.botText(msg);
      return msg;
    }
  }
}
