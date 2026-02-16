import { createClient, type Client } from '@libsql/client';
import crypto from 'crypto';
import type { YouTubeSearchResult, YouTubeVideoDetails } from '../api/types';

export interface DbUser {
  id: string;
  google_id: string;
  email: string;
  name: string | null;
  image: string | null;
  created_at: number;
  updated_at: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let client: Client;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getClient()
      .batch([
        `CREATE TABLE IF NOT EXISTS youtube_search_cache (
          query TEXT PRIMARY KEY,
          results TEXT NOT NULL,
          cached_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS youtube_video_cache (
          video_id TEXT PRIMARY KEY,
          details TEXT NOT NULL,
          cached_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          google_id TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          name TEXT,
          image TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
      ])
      .then(() => undefined);
  }
  return schemaReady;
}

export async function getCachedSearch(
  query: string,
  maxResults: number,
): Promise<YouTubeSearchResult[] | null> {
  await ensureSchema();
  const key = `${query}|${maxResults}`;
  const result = await getClient().execute({
    sql: 'SELECT results, cached_at FROM youtube_search_cache WHERE query = ?',
    args: [key],
  });

  const row = result.rows[0];
  if (!row) return null;

  if (Date.now() - (row.cached_at as number) > CACHE_TTL_MS) {
    await getClient().execute({
      sql: 'DELETE FROM youtube_search_cache WHERE query = ?',
      args: [key],
    });
    return null;
  }

  return JSON.parse(row.results as string) as YouTubeSearchResult[];
}

export async function setCachedSearch(
  query: string,
  maxResults: number,
  results: YouTubeSearchResult[],
): Promise<void> {
  await ensureSchema();
  const key = `${query}|${maxResults}`;
  await getClient().execute({
    sql: 'INSERT OR REPLACE INTO youtube_search_cache (query, results, cached_at) VALUES (?, ?, ?)',
    args: [key, JSON.stringify(results), Date.now()],
  });
}

export async function getCachedVideos(
  videoIds: string[],
): Promise<{ cached: YouTubeVideoDetails[]; uncachedIds: string[] }> {
  await ensureSchema();
  const cached: YouTubeVideoDetails[] = [];
  const uncachedIds: string[] = [];
  const now = Date.now();
  const db = getClient();

  for (const id of videoIds) {
    const result = await db.execute({
      sql: 'SELECT details, cached_at FROM youtube_video_cache WHERE video_id = ?',
      args: [id],
    });
    const row = result.rows[0];
    if (row && now - (row.cached_at as number) <= CACHE_TTL_MS) {
      cached.push(JSON.parse(row.details as string) as YouTubeVideoDetails);
    } else {
      uncachedIds.push(id);
    }
  }

  return { cached, uncachedIds };
}

export async function setCachedVideos(videos: YouTubeVideoDetails[]): Promise<void> {
  await ensureSchema();
  const now = Date.now();
  await getClient().batch(
    videos.map((video) => ({
      sql: 'INSERT OR REPLACE INTO youtube_video_cache (video_id, details, cached_at) VALUES (?, ?, ?)',
      args: [video.id, JSON.stringify(video), now],
    })),
  );
}

export async function findUserByGoogleId(googleId: string): Promise<DbUser | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM users WHERE google_id = ?',
    args: [googleId],
  });
  const row = result.rows[0];
  if (!row) return undefined;
  return row as unknown as DbUser;
}

export async function createUser(profile: {
  google_id: string;
  email: string;
  name: string | null;
  image: string | null;
}): Promise<DbUser> {
  await ensureSchema();
  const now = Date.now();
  const id = crypto.randomUUID();
  await getClient().execute({
    sql: 'INSERT INTO users (id, google_id, email, name, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, profile.google_id, profile.email, profile.name, profile.image, now, now],
  });
  return { id, ...profile, created_at: now, updated_at: now };
}

export async function updateUser(
  id: string,
  profile: { email: string; name: string | null; image: string | null },
): Promise<void> {
  await ensureSchema();
  await getClient().execute({
    sql: 'UPDATE users SET email = ?, name = ?, image = ?, updated_at = ? WHERE id = ?',
    args: [profile.email, profile.name, profile.image, Date.now(), id],
  });
}
