# Nebula Android — local build (no EAS cloud)

Personal sideload APK built entirely on your machine.

## Prerequisites

- Node.js 20+
- JDK 17 (Android Studio or standalone)
- Android SDK at **`C:\Android\Sdk`** (configured in `apps/mobile/android-sdk.path`, gitignored)
- USB debugging enabled on your phone (or an emulator)

## Install dependencies

From the monorepo root:

```bash
npm install
```

## Environment

Create `apps/mobile/.env` (or use root `.env.local` with Expo public vars):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

API keys (DeepSeek, Tavily) are **not** in env files — enter them in **Settings** on device; they are stored in Android Keystore via `expo-secure-store`.

## Supabase redirect URL

In Supabase Dashboard → Authentication → URL configuration, add:

```text
nebula://auth/callback
```

Keep your web URLs (`https://your-domain/auth/callback`, `http://localhost:3000/auth/callback`) if you still use the browser app.

## Android SDK path

This machine uses `C:\Android\Sdk`. The path is stored in `apps/mobile/android-sdk.path` (not committed). To change it, edit that file or copy from `android-sdk.path.example`.

npm scripts set `ANDROID_HOME` / `ANDROID_SDK_ROOT` automatically via `scripts/run-with-android-sdk.mjs`.

## Development (device / emulator)

From repo root:

```bash
npm run android -w @nebula/mobile
```

Or from `apps/mobile`:

```bash
npm run android
```

This runs `prebuild` if needed and installs a debug build.

## Release APK (local Gradle)

One-time native project generation:

```bash
npm run prebuild:android -w @nebula/mobile
```

Build release APK:

```bash
npm run gradle:release -w @nebula/mobile
```

APK path:

```text
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

On Windows PowerShell:

```powershell
cd apps\mobile\android
.\gradlew.bat assembleRelease
```

### Signing (personal use)

Debug builds use the debug keystore. For a signed release you own, create a keystore and configure `android/app/build.gradle` `signingConfigs.release` (standard Android docs). This repo does not commit keystore files.

## Optional: EAS CLI local only

If you use EAS CLI, **only** local builds — no cloud workers:

```bash
eas build --local --platform android
```

Do not rely on default `eas.json` cloud profiles unless you add them yourself.

## Troubleshooting

- **Magic link does not open app** — confirm `nebula://auth/callback` is in Supabase redirect URLs and you open the link on the same device.
- **Gradle / SDK errors** — open `apps/mobile/android` in Android Studio once to sync SDK components.
- **Metro cannot resolve `@nebula/core`** — run `npm install` from repo root; `metro.config.js` watches the monorepo root.
