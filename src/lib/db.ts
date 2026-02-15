import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { YouTubeSearchResult, YouTubeVideoDetails } from '../api/types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'cache.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS youtube_search_cache (
    query TEXT PRIMARY KEY,
    results TEXT NOT NULL,
    cached_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS youtube_video_cache (
    video_id TEXT PRIMARY KEY,
    details TEXT NOT NULL,
    cached_at INTEGER NOT NULL
  );
`);

export function getCachedSearch(
  query: string,
  maxResults: number,
): YouTubeSearchResult[] | null {
  const key = `${query}|${maxResults}`;
  const row = db
    .prepare('SELECT results, cached_at FROM youtube_search_cache WHERE query = ?')
    .get(key) as { results: string; cached_at: number } | undefined;

  if (!row) return null;
  if (Date.now() - row.cached_at > CACHE_TTL_MS) {
    db.prepare('DELETE FROM youtube_search_cache WHERE query = ?').run(key);
    return null;
  }

  return JSON.parse(row.results) as YouTubeSearchResult[];
}

export function setCachedSearch(
  query: string,
  maxResults: number,
  results: YouTubeSearchResult[],
): void {
  const key = `${query}|${maxResults}`;
  db.prepare(
    'INSERT OR REPLACE INTO youtube_search_cache (query, results, cached_at) VALUES (?, ?, ?)',
  ).run(key, JSON.stringify(results), Date.now());
}

export function getCachedVideos(
  videoIds: string[],
): { cached: YouTubeVideoDetails[]; uncachedIds: string[] } {
  const cached: YouTubeVideoDetails[] = [];
  const uncachedIds: string[] = [];
  const now = Date.now();

  const stmt = db.prepare(
    'SELECT details, cached_at FROM youtube_video_cache WHERE video_id = ?',
  );

  for (const id of videoIds) {
    const row = stmt.get(id) as { details: string; cached_at: number } | undefined;
    if (row && now - row.cached_at <= CACHE_TTL_MS) {
      cached.push(JSON.parse(row.details) as YouTubeVideoDetails);
    } else {
      uncachedIds.push(id);
    }
  }

  return { cached, uncachedIds };
}

export function setCachedVideos(videos: YouTubeVideoDetails[]): void {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO youtube_video_cache (video_id, details, cached_at) VALUES (?, ?, ?)',
  );
  const now = Date.now();

  const insertMany = db.transaction((items: YouTubeVideoDetails[]) => {
    for (const video of items) {
      stmt.run(video.id, JSON.stringify(video), now);
    }
  });

  insertMany(videos);
}
