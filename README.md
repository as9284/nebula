# Nebula

Local-first AI chat powered by **Luna**. Monorepo: Next.js web app + Expo Android.

## Structure

| Path | Description |
|------|-------------|
| [apps/web](apps/web) | Next.js 16 PWA (deploy to Vercel) |
| [apps/mobile](apps/mobile) | Expo Android app (local APK) |
| [packages/core](packages/core) | Shared logic (AI, search, backup, types) |
| [packages/theme](packages/theme) | Design tokens (dark/light) |

## Web

```bash
npm install
cp .env.example apps/web/.env.local   # optional Supabase
npm run dev:web
```

Open http://localhost:3000

### Vercel

In the Vercel project, set **Root Directory** to `apps/web`.  
[apps/web/vercel.json](apps/web/vercel.json) runs `npm install` from the monorepo root so workspace packages (`@nebula/core`, `@nebula/theme`) resolve on every deploy.

## Android

See [apps/mobile/docs/BUILD.md](apps/mobile/docs/BUILD.md) for local APK builds (no EAS cloud).

```bash
npm install
npm run android -w @nebula/mobile
```

SDK path: `C:\Android\Sdk` via `apps/mobile/android-sdk.path` (see [BUILD.md](apps/mobile/docs/BUILD.md)).

API keys are entered in **Settings** on the device (Android Keystore). Add `nebula://auth/callback` to Supabase redirect URLs for magic link sign-in.

## Requirements

- Node.js 20+
- [DeepSeek API key](https://platform.deepseek.com)
- [Tavily API key](https://tavily.com) — optional, for Tavily search

## Cloud sync (optional)

Set in `apps/web/.env.local` or `apps/mobile/.env`:

- `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — web production URL for magic links

Apply [supabase/migrations/001_user_snapshots.sql](apps/web/supabase/migrations/001_user_snapshots.sql).
