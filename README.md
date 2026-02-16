# CYBER_MTV

A cyberpunk-themed music video player that integrates Last.fm and YouTube APIs to create shuffled playlists based on artist searches.

## Features

- Search for artists using Last.fm autocomplete
- Automatically builds playlists with videos from the selected artist and similar artists
- Shuffled video queue for continuous playback
- YouTube iframe player integration
- Google authentication via NextAuth
- Cyberpunk/CRT-inspired UI design

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [NextAuth v5](https://authjs.dev/) (Google provider, JWT sessions)
- [Turso (libSQL)](https://turso.tech/) for database
- [CSS Modules](https://nextjs.org/docs/app/building-your-application/styling/css-modules) for component-scoped styling
- [pnpm](https://pnpm.io/) for package management

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the following values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_LASTFM_API_KEY` | [Last.fm API key](https://www.last.fm/api/account/create) |
| `YOUTUBE_API_KEY` | [YouTube Data API v3 key](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_ID` | [Google OAuth client ID](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | Random secret for NextAuth (`openssl rand -base64 32`) |
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |

### 3. Run the Application

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## How to Use

1. Sign in with your Google account
2. Type an artist name in the search bar
3. Select an artist from the autocomplete dropdown
4. The app will find similar artists, search YouTube for music videos, and shuffle them into a playlist
5. Videos play automatically — use controls to play/pause or skip tracks
6. Click any video in the queue to play it immediately

## API Quota Considerations

**YouTube API Quota:**
- Daily limit: 10,000 units
- Each playlist build uses ~800 units
- Daily capacity: ~12 playlists

The app implements server-side caching to reduce API usage.

## Building for Production

```bash
pnpm build
pnpm start
```

## Linting & Formatting

```bash
pnpm lint
pnpm format
pnpm check
```
