/**
 * YouTube Data API v3 Client
 * Documentation: https://developers.google.com/youtube/v3/docs
 */

import { env } from '../config/env';
import type {
  YouTubeSearchResponse,
  YouTubeSearchResult,
  YouTubeVideoDetails,
  YouTubeVideosResponse,
  Track,
} from './types';
import { APIError } from './types';
import { formatDuration } from '../utils/formatDuration';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const TIMEOUT = 10000; // 10 seconds

/**
 * Make a request to the YouTube API
 */
async function fetchYouTube<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('key', env.youtube.apiKey);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      if (errorData?.error) {
        throw new APIError(
          'youtube',
          errorData.error.code?.toString() || 'UNKNOWN',
          errorData.error.message || 'YouTube API error',
          errorData
        );
      }

      throw new APIError(
        'youtube',
        `HTTP_${response.status}`,
        `YouTube API error: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError(
          'youtube',
          'TIMEOUT',
          'YouTube request timed out',
          error
        );
      }

      throw new APIError(
        'youtube',
        'NETWORK_ERROR',
        `Network error: ${error.message}`,
        error
      );
    }

    throw new APIError(
      'youtube',
      'UNKNOWN_ERROR',
      'An unknown error occurred',
      error
    );
  }
}

/**
 * Search for music videos by artist name
 *
 * @param artistName - Name of the artist
 * @param maxResults - Maximum number of videos to return (default: 5)
 * @returns Array of video search results
 */
export async function searchMusicVideos(
  artistName: string,
  maxResults = 5
): Promise<YouTubeSearchResult[]> {
  if (!artistName.trim()) {
    throw new APIError(
      'youtube',
      'INVALID_QUERY',
      'Artist name cannot be empty'
    );
  }

  try {
    const data = await fetchYouTube<YouTubeSearchResponse>('/search', {
      part: 'snippet',
      q: `${artistName} official music video`,
      type: 'video',
      videoCategoryId: '10', // Music category
      maxResults: String(maxResults),
      order: 'relevance',
    });

    return data.items || [];
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'youtube',
      'SEARCH_ERROR',
      'Failed to search music videos',
      error
    );
  }
}

/**
 * Get detailed information for multiple videos
 * Fetches duration and other metadata
 * Automatically batches requests if more than 50 IDs are provided
 *
 * @param videoIds - Array of YouTube video IDs
 * @returns Array of video details
 */
export async function getVideoDetails(
  videoIds: string[]
): Promise<YouTubeVideoDetails[]> {
  if (videoIds.length === 0) {
    return [];
  }

  // YouTube API allows max 50 IDs per request - batch if needed
  const BATCH_SIZE = 50;

  if (videoIds.length <= BATCH_SIZE) {
    // Single request
    try {
      const data = await fetchYouTube<YouTubeVideosResponse>('/videos', {
        part: 'snippet,contentDetails',
        id: videoIds.join(','),
      });

      return data.items || [];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        'youtube',
        'DETAILS_ERROR',
        'Failed to get video details',
        error
      );
    }
  }

  // Multiple batches needed
  const batches: string[][] = [];
  for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
    batches.push(videoIds.slice(i, i + BATCH_SIZE));
  }

  try {
    const batchResults = await Promise.all(
      batches.map(async (batch) => {
        const data = await fetchYouTube<YouTubeVideosResponse>('/videos', {
          part: 'snippet,contentDetails',
          id: batch.join(','),
        });
        return data.items || [];
      })
    );

    // Flatten results from all batches
    return batchResults.flat();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'youtube',
      'DETAILS_ERROR',
      'Failed to get video details',
      error
    );
  }
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
