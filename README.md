# Nebula

Local-first AI chat powered by **Luna**. Monorepo: Next.js web app + shared packages.

## Structure

| Path | Description |
|------|-------------|
| [apps/web](apps/web) | Next.js 16 PWA (deploy to Vercel) |
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

## Requirements

- Node.js 20+
- An API key for your chosen provider (OpenAI, Anthropic, DeepSeek, Groq, Ollama, etc.) — configure in Settings
- [Tavily API key](https://tavily.com) — optional, for Tavily search

## Cloud sync (optional)

Set in `apps/web/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — production URL for magic links (e.g. `https://your-app.vercel.app`)

Apply [supabase/migrations/001_user_snapshots.sql](apps/web/supabase/migrations/001_user_snapshots.sql).
