# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm format       # Prettier check
pnpm check        # Prettier write + ESLint fix
```

## Architecture

Next.js 15 App Router project (React 19, TypeScript) — a cyberpunk music video player that builds playlists from Last.fm similar artists and plays YouTube videos.

**Entry flow:** `app/layout.tsx` (SessionProvider) → `app/page.tsx` (client boundary) → `App.tsx` (main component with all player state)

**API layer:** Last.fm is called directly from the client (`src/api/lastfm.ts`). YouTube calls go through Next.js API routes (`app/api/youtube/`) to keep the API key server-side. Both have database-backed caching via Turso (libSQL).

**Key hooks in `src/hooks/`:**
- `usePlaylistBuilder` — orchestrates: similar artists → YouTube search → batch video details → shuffle
- `useArtistSearch` — debounced Last.fm artist search with AbortController
- `useYouTubePlayer` — manages YouTube iframe API lifecycle

**Auth:** NextAuth v5 beta with Google OAuth, JWT sessions, user records in Turso.

**Database:** Turso/libSQL with auto-created schema (`src/lib/db.ts`). Tables: `youtube_search_cache`, `youtube_video_cache`, `users`.

## Code Conventions

- **Formatting:** No semicolons, single quotes, trailing commas (Prettier)
- **CSS:** CSS Modules for components, global styles in `App.css` (cyberpunk CRT theme)
- **clsx:** Always use object syntax for conditional classes — `clsx('base', { 'active': isActive })` not `clsx('base', isActive && 'active')`. Enforced by custom ESLint rule (`eslint-rules/no-clsx-conditional-args.js`).
- **Path alias:** `@/*` maps to `src/*`
