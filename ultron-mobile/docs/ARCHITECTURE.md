# Architecture

Single `:app` module for now, split into layers by package. The layers can be pulled into separate Gradle modules once they grow.

```
com.ultron.mobile
├── UltronApp.kt                 Hilt application
├── MainActivity.kt              Single activity, hosts Compose
├── di/                          Hilt modules: bind domain interfaces → implementations
├── domain/                      Pure Kotlin, no Android imports
│   ├── models/                  AssistantState, SystemStatus, …
│   ├── interfaces/              Contracts the rest of the app depends on (DeviceStatusProvider, …)
│   └── usecases/                (Phase 4+) task planning, memory retrieval, …
├── data/                        Android/IO implementations of domain interfaces
│   ├── device/                  AndroidDeviceStatusProvider
│   ├── database/                (Phase 5) Room
│   ├── repository/              (Phase 5) memory + conversation repositories
│   └── preferences/             (Phase 4) settings + encrypted API keys (Android Keystore)
├── core/                        (Phase 3+) engines
│   ├── voice/                   speech-to-text, text-to-speech, voice state machine
│   ├── ai/                      provider abstraction, prompts, context, tool calling
│   ├── tools/                   tool registry + Android actions
│   ├── memory/                  memory engine
│   └── security/                key storage, confirmation policy for sensitive actions
├── automation/                  (Phase 6) intents, AccessibilityService (opt-in), workflows
├── notifications/               (Phase 6) notification listener (opt-in)
├── features/                    One package per screen: Screen + ViewModel + components
│   └── home/
└── ui/theme/                    Black/red design system
```

Packages marked with a phase are created when that phase lands, so the tree never holds empty placeholder code.

## Rules

- `domain` never imports Android or data classes. `features` talks only to `domain` interfaces.
- Each ViewModel exposes one immutable `StateFlow<UiState>`.
- Implementations are bound in `di/`, so tests swap in fakes (see `HomeViewModelTest`).
- No API keys in the APK. The user enters keys in Settings, and they're stored encrypted with the Android Keystore (Phase 4).
- Sensitive actions (calls, messages, purchases, deleting data, anything done through accessibility) need explicit user confirmation.

## Build and CI

- Gradle 8.11.1 (wrapper), AGP 8.7.3, Kotlin 2.1.0, KSP, Compose BOM 2024.12.01, Hilt 2.54.
- `compileSdk`/`targetSdk` 35, `minSdk` 26 (Android 8.0).
- `.github/workflows/ultron-mobile.yml` runs unit tests, lint and `assembleDebug` on every push touching `ultron-mobile/`, then uploads the APK.
