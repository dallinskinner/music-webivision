import { NextRequest, NextResponse } from 'next/server';
import { getCachedSearch, setCachedSearch } from '../../../../lib/db';
import type { YouTubeSearchResponse } from '../../../../api/types';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const artist = searchParams.get('artist');
  const maxResults = parseInt(searchParams.get('maxResults') || '5', 10);

  if (!artist?.trim()) {
    return NextResponse.json({ error: 'artist parameter is required' }, { status: 400 });
  }

  const query = `"${artist}" official music video`;

  // Check cache first
  const cached = getCachedSearch(query, maxResults);
  if (cached) {
    return NextResponse.json({ items: cached, fromCache: true });
  }

  // Cache miss — call YouTube API
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  const url = new URL(`${YOUTUBE_BASE_URL}/search`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('order', 'relevance');

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    return NextResponse.json(
      { error: errorData?.error?.message || `YouTube API error: ${response.statusText}` },
      { status: response.status },
    );
  }

  const data: YouTubeSearchResponse = await response.json();
  const items = data.items || [];

  // Cache the results
  setCachedSearch(query, maxResults, items);

  return NextResponse.json({ items, fromCache: false });
}
