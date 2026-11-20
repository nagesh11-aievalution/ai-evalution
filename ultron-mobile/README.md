# ULTRON MOBILE

An independent Android AI assistant. Kotlin, Jetpack Compose, MVVM + Clean Architecture, Hilt.
It does not depend on the Windows ULTRON; a PC link may be added later as an optional feature.

**Version:** 0.1.0 · **Current phase:** 1 (foundation)

## Open it on Windows

Requirements: **Android Studio** (Ladybug 2024.2 or newer; it bundles JDK 17+), **Android SDK Platform 35**, and for a real phone, **USB debugging** turned on.

```powershell
# 1. Get the code
git clone https://github.com/nagesh11-aievalution/ai-evalution.git
cd ai-evalution
git checkout claude/phone-ultron-build-i10tkz

# 2. Check your tools
java -version                                  # needs 17 or newer (or use Android Studio's bundled JDK, below)
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" version

# 3. If `java` is missing, use Android Studio's bundled JDK for this terminal
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# 4. Build, test, install (phone plugged in with USB debugging on)
cd ultron-mobile
.\gradlew.bat testDebugUnitTest
.\gradlew.bat assembleDebug
.\gradlew.bat installDebug
```

The debug APK lands in `ultron-mobile\app\build\outputs\apk\debug\app-debug.apk`.
Or open the `ultron-mobile` folder in Android Studio (**File → Open**) and press **Run**.
Android Studio writes `local.properties` with your SDK path automatically.

**No PC needed:** every push builds the APK on GitHub Actions. Open the repo's **Actions** tab, click the latest **ULTRON MOBILE build** run, and download **ultron-mobile-debug-apk**.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Phase plan and status: [docs/ROADMAP.md](docs/ROADMAP.md).
