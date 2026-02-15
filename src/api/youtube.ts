/**
 * YouTube API Client — proxied through Next.js API routes
 * All YouTube API calls go through /api/youtube/* to keep the API key server-side
 * and leverage SQLite caching to reduce quota usage.
 */

import type { YouTubeSearchResult, YouTubeVideoDetails, Track } from './types';
import { APIError } from './types';
import { formatDuration } from '../utils/formatDuration';

/**
 * Search for music videos by artist name
 *
 * @param artistName - Name of the artist
 * @param maxResults - Maximum number of videos to return (default: 5)
 * @returns Array of video search results
 */
export async function searchMusicVideos(
  artistName: string,
  maxResults = 5,
): Promise<YouTubeSearchResult[]> {
  if (!artistName.trim()) {
    throw new APIError('youtube', 'INVALID_QUERY', 'Artist name cannot be empty');
  }

  const params = new URLSearchParams({
    artist: artistName,
    maxResults: String(maxResults),
  });

  const response = await fetch(`/api/youtube/search?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new APIError(
      'youtube',
      `HTTP_${response.status}`,
      errorData?.error || `YouTube search failed: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return (data.items || []) as YouTubeSearchResult[];
}

/**
 * Get detailed information for multiple videos
 * Fetches duration and other metadata
 *
 * @param videoIds - Array of YouTube video IDs
 * @returns Array of video details
 */
export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetails[]> {
  if (videoIds.length === 0) {
    return [];
  }

  const params = new URLSearchParams({ ids: videoIds.join(',') });
  const response = await fetch(`/api/youtube/videos?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new APIError(
      'youtube',
      `HTTP_${response.status}`,
      errorData?.error || `YouTube video details failed: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return (data.items || []) as YouTubeVideoDetails[];
}

/**
 * Convert YouTube video details to Track format
 *
 * @param video - YouTube video details
 * @returns Formatted Track object
 */
export function formatVideoAsTrack(video: YouTubeVideoDetails): Track {
  return {
    id: video.id,
    videoId: video.id,
    artist: video.snippet.channelTitle,
    title: video.snippet.title,
    duration: formatDuration(video.contentDetails.duration),
    thumbnail:
      video.snippet.thumbnails.high?.url ||
      video.snippet.thumbnails.medium?.url ||
      video.snippet.thumbnails.default.url,
    channelTitle: video.snippet.channelTitle,
  };
}
