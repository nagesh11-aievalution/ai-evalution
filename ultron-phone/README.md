# Ultron — phone build

Ultron's phone body: an installable web app (PWA) for Android and iPhone. No app store, no build step.

- **Voice in/out**: tap the red core, talk, and it talks back (the phone's own speech engines).
- **Three brains** (Settings → Brain):
  - **Claude**: full AI using your Claude API key, with web search and all phone actions.
  - **Laptop**: everything goes to the laptop Ultron; the phone is its voice and screen.
  - **Offline**: built-in command parser, works with no key and no internet.
- **Phone actions**: call, SMS, WhatsApp, email, open apps, play on YouTube/Spotify, Maps directions, Google search, timers and alarms, battery/time/network status, GPS location, flashlight (Android), vibrate, copy/share, long-term memory, and send commands to the laptop.

Calls, texts and app launches show a **button you tap**. Phones don't let a web page dial or message anyone without a tap, and that also means Ultron can never call anyone on its own.

## Files

| File | What it does |
|---|---|
| `index.html`, `styles.css` | UI: core orb, chat, settings sheet |
| `app.js` | Wires UI, voice loop, settings |
| `brain.js` | Claude tool loop, laptop mode, offline mode |
| `actions.js` | Every phone action (also the Claude tool definitions) |
| `offline.js` | Offline command parser ("call mom", "timer 5 minutes", …) |
| `laptop.js` | Phone side of the laptop link ([protocol](../laptop-bridge/PROTOCOL.md)) |
| `voice.js` | Speech recognition + text-to-speech |
| `store.js` | Settings, chat and memory in the phone's localStorage |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app + offline cache |
| `vendor/anthropic-sdk-1.6.0.mjs` | Official Anthropic TypeScript SDK, bundled for the browser |

## Put it on your phone

The mic and "install app" only work over **https** (or `localhost`). Pick one:

**A. GitHub Pages (easiest, free).** Repo → Settings → Pages → deploy from your branch, then open
`https://<your-user>.github.io/<repo>/ultron-phone/` on the phone.

**B. Serve it from the laptop over Tailscale.** Install Tailscale on laptop and phone, run the bridge
(see `../laptop-bridge/README.md`), then `tailscale serve --bg 8765`. Open
`https://<laptop-name>.<tailnet>.ts.net/app/` on the phone. This also sets up the laptop link.

**C. Quick test on the laptop only:** `cd ultron-phone && python -m http.server 8080`, open `http://localhost:8080`.

Then on the phone: Chrome menu → **Add to Home screen** / **Install app** (iPhone: Safari → Share → **Add to Home Screen**).

## First run

1. Open Settings (gear icon).
2. Brain → **Claude**, paste your API key from console.anthropic.com. The key stays on the phone and is sent only to Anthropic.
3. Model defaults to `claude-opus-5-5`; "Speed / depth" defaults to Fast, which suits voice.
4. Set your name, pick a voice and language (e.g. `en-IN`, `hi-IN`).
5. Optional: turn on **Hands-free** so it listens again after every reply.

## Limits worth knowing

- **Alarms/timers** ring only while Ultron is open or recently backgrounded. Use the Clock app for alarms you can't miss.
- **Flashlight** works in Chrome on most Android phones, not on iPhone. **Vibrate** also doesn't work on iPhone.
- **Contact names**: on Android Chrome you get a contact picker; elsewhere use numbers or let the app open its chooser.
- No wake word yet ("Hey Ultron" while the screen is off); browsers don't allow always-on listening.

## Updating

After changing files, bump `VERSION` in `sw.js` so installed phones fetch the new version.
To update the SDK: `npm i @anthropic-ai/sdk@<ver> esbuild`, bundle with
`npx esbuild entry.mjs --bundle --format=esm --platform=browser --minify` (entry re-exports `@anthropic-ai/sdk`),
replace the file in `vendor/` and update the import in `brain.js` and the list in `sw.js`.
