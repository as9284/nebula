# Nebula mobile vs web — feature parity

| Feature | Web (`apps/web`) | Android (`apps/mobile`) |
|--------|------------------|-------------------------|
| Luna chat (stream) | Yes | Yes — direct DeepSeek API |
| Stop / regenerate | Yes | Yes (regenerate via chat flow) |
| Web search (builtin / Tavily) | Via BFF | Direct from device |
| Slash commands | Yes | Yes |
| Orbit (tasks, notes, projects, links) | Modal | Screen + confirm delete |
| Solaris (weather) | Yes | Yes — Open-Meteo |
| Hyperlane (short links) | Yes — is.gd | Yes — is.gd direct |
| Sandbox panel | Side panel | Modal screen |
| Settings (Luna controls, theme, search) | Yes | Core settings (theme, search provider) |
| API keys | localStorage | **SecureStore** (not in backup/sync) |
| Backup export/import | Download / file picker | Share sheet / document picker |
| Cloud sync (Supabase) | Yes | Yes |
| Magic link auth | Server callback route | `nebula://` deep link |
| PWA | Yes | N/A (native app) |

## Acceptable v1 deltas

- Markdown tables/code blocks may render more simply on mobile.
- No backdrop blur on overlays (solid overlay color instead).
- Message edit/copy/regenerate UI simplified vs web sidebar actions.
- Geist font via `@expo-google-fonts/geist` (close match to web).

## Shared code

- `@nebula/core` — types, prompts, search, stream API, backup schema, constellations logic
- `@nebula/theme` — color tokens from web `globals.css`
