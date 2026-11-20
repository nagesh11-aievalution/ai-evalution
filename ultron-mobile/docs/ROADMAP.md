# Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Project foundation | **Built**: CI green, waiting for on-phone check |
| 2 | Minimalist UI: chat, history, memory, settings screens, navigation | Not started |
| 3 | Voice: speech-to-text, text-to-speech, interruptible playback, voice states | Not started |
| 4 | AI engine: provider abstraction (Claude, OpenAI, Gemini, local), encrypted keys, tool calling, fallback | Not started |
| 5 | Memory: Room, conversation history, approved long-term memory, edit/delete, summarization, backup | Not started |
| 6 | Android automation: apps, calls/SMS with confirmation, alarms/reminders, settings, notifications, opt-in accessibility | Not started |
| 7 | Multi-step task planning and execution | Not started |
| 8 | Offline intelligence: on-device intent parsing and commands | Not started |
| 9 | Security and performance hardening | Not started |
| 10 | Signed release APK | Not started |

## Phase 1 acceptance criteria

- [x] `testDebugUnitTest` passes (SystemStatus formatting, HomeViewModel load/refresh/error).
- [x] `lintDebug` passes.
- [x] `assembleDebug` produces an APK in CI.
- [ ] On a phone: app installs, opens to a black screen with the animated red core; the status panel shows real device, Android version, battery, network and microphone state; **Allow microphone** opens the system permission dialog and the panel updates afterwards.

The last item needs a real device and is checked by the user.
