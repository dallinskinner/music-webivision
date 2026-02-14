/**
 * Last.fm API Client
 * Documentation: https://www.last.fm/api
 */

import { env } from '../config/env';
import type {
  LastfmArtist,
  LastfmArtistSearchResponse,
  LastfmSimilarArtist,
  LastfmSimilarArtistsResponse,
} from './types';
import { APIError } from './types';

const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';
const TIMEOUT = 10000; // 10 seconds

/**
 * Make a request to the Last.fm API
 */
async function fetchLastfm<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL);
  url.searchParams.append('api_key', env.lastfm.apiKey);
  url.searchParams.append('format', 'json');

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
      throw new APIError(
        'lastfm',
        `HTTP_${response.status}`,
        `Last.fm API error: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Check for Last.fm error response
    if (data.error) {
      throw new APIError('lastfm', `LASTFM_${data.error}`, data.message);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError(
          'lastfm',
          'TIMEOUT',
          'Last.fm request timed out',
          error
        );
      }

      throw new APIError(
        'lastfm',
        'NETWORK_ERROR',
        `Network error: ${error.message}`,
        error
      );
    }

    throw new APIError(
      'lastfm',
      'UNKNOWN_ERROR',
      'An unknown error occurred',
      error
    );
  }
}

/**
 * Search for artists by name
 * Returns up to 10 results for autocomplete
 *
 * @param query - Artist search query
 * @returns Array of matching artists
 */
export async function searchArtists(query: string): Promise<LastfmArtist[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const data = await fetchLastfm<LastfmArtistSearchResponse>({
      method: 'artist.search',
      artist: query,
      limit: '10',
    });

    return data.results.artistmatches.artist || [];
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'lastfm',
      'SEARCH_ERROR',
      'Failed to search artists',
      error
    );
  }
}

/**
 * Get similar artists for a given artist
 *
 * @param artistName - Name of the artist
 * @param limit - Number of similar artists to return (default: 7)
 * @returns Array of similar artists sorted by match score
 */
export async function getSimilarArtists(
  artistName: string,
  limit = 7
): Promise<LastfmSimilarArtist[]> {
  if (!artistName.trim()) {
    throw new APIError(
      'lastfm',
      'INVALID_ARTIST',
      'Artist name cannot be empty'
    );
  }

  try {
    const data = await fetchLastfm<LastfmSimilarArtistsResponse>({
      method: 'artist.getsimilar',
      artist: artistName,
      limit: String(limit),
    });

    return data.similarartists.artist || [];
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'lastfm',
      'SIMILAR_ERROR',
      'Failed to get similar artists',
      error
    );
  }
}
