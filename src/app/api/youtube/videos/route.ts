import { NextRequest, NextResponse } from 'next/server';
import { getCachedVideos, setCachedVideos } from '../../../../lib/db';
import type { YouTubeVideoDetails, YouTubeVideosResponse } from '../../../../api/types';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const BATCH_SIZE = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const idsParam = searchParams.get('ids');

  if (!idsParam?.trim()) {
    return NextResponse.json({ error: 'ids parameter is required' }, { status: 400 });
  }

  const videoIds = idsParam.split(',').filter(Boolean);
  if (videoIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Check cache — only fetch uncached IDs from YouTube
  const { cached, uncachedIds } = getCachedVideos(videoIds);

  if (uncachedIds.length === 0) {
    return NextResponse.json({ items: cached, fromCache: true });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  // Batch uncached IDs into groups of 50
  const freshVideos: YouTubeVideoDetails[] = [];

  for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
    const batch = uncachedIds.slice(i, i + BATCH_SIZE);

    const url = new URL(`${YOUTUBE_BASE_URL}/videos`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', batch.join(','));

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.error?.message || `YouTube API error: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data: YouTubeVideosResponse = await response.json();
    if (data.items) {
      freshVideos.push(...data.items);
    }
  }

  // Cache newly fetched videos
  if (freshVideos.length > 0) {
    setCachedVideos(freshVideos);
  }

  const allItems = [...cached, ...freshVideos];
  return NextResponse.json({
    items: allItems,
    fromCache: uncachedIds.length === 0,
  });
}
