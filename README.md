# Nebula

Local-first AI chat powered by **Luna**. Modern ChatGPT-style UX with portfolio-minimal visuals.

## Features

- **Luna chat** — streaming markdown, threads, stop/regenerate/edit/copy
- **Orbit** — tasks, notes, projects via natural language (inline cards)
- **Solaris** — weather via Open-Meteo
- **Hyperlane** — URL shortening
- **Web search** — automatic when Luna needs fresh info (built-in or Tavily)
- **Local data** — conversations in IndexedDB; settings in localStorage
- **Export/import** — full backup JSON + memories-only
- **Cloud sync** — optional Supabase backup of chats, memories, Orbit, and settings (not API keys)
- **PWA** — installable, offline-ready shell

## Requirements

- Node.js 20+
- [DeepSeek API key](https://platform.deepseek.com) — model `deepseek-v4-flash`
- [Tavily API key](https://tavily.com) — optional, for higher-quality web search

Keys are entered in **Settings** and stored in your browser only. They are sent to Next.js API routes which proxy requests — never committed to the repo.

### Cloud sync (optional)

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL from Supabase dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key

In **Settings → Account**, sign in with a **magic link** email. Data syncs automatically (debounced) when chats, memories, or Orbit data change. API keys are never uploaded.

**Supabase Auth setup** (dashboard → Authentication → URL configuration):

- Site URL: `http://localhost:3000` (and your production URL)
- Redirect URLs: `http://localhost:3000/auth/callback`, `https://your-domain/auth/callback`

Apply the schema from `supabase/migrations/001_user_snapshots.sql` (Supabase SQL editor or MCP `apply_migration`).

## Getting started

```bash
npm install
cp .env.example .env.local   # optional, for cloud sync
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), add API keys in Settings, and start chatting.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fas9284%2Fnebula)

Or manually:

```bash
npm run build
```

Push to GitHub and import into [Vercel](https://vercel.com). API keys stay client-side. For cloud sync, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |

## Architecture

- **Next.js 16** App Router + Tailwind v4
- **Zustand** persist — IndexedDB (Luna, Orbit), localStorage (settings, Solaris, Hyperlane)
- **BFF routes** — `/api/chat/stream`, `/api/search`, `/api/ai/text`, `/api/shorten`
- **Supabase** — magic-link auth, `user_snapshots` JSON backup per user (RLS)
- **Constellation handlers** — Luna tool commands (fenced blocks) from [project-starfield](https://github.com/as9284/project-starfield), adapted for unified web chat

## License

MIT
