/**
 * Type definitions for API responses
 */

// ============================================================================
// Last.fm Types
// ============================================================================

export interface LastfmArtist {
  name: string;
  listeners: string;
  mbid: string;
  url: string;
  image: Array<{
    '#text': string;
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
  }>;
}

export interface LastfmArtistSearchResponse {
  results: {
    'opensearch:Query': {
      '#text': string;
      role: string;
      searchTerms: string;
      startPage: string;
    };
    'opensearch:totalResults': string;
    'opensearch:startIndex': string;
    'opensearch:itemsPerPage': string;
    artistmatches: {
      artist: LastfmArtist[];
    };
  };
}

export interface LastfmSimilarArtist {
  name: string;
  mbid: string;
  match: string;
  url: string;
  image: Array<{
    '#text': string;
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
  }>;
}

export interface LastfmSimilarArtistsResponse {
  similarartists: {
    artist: LastfmSimilarArtist[];
    '@attr': {
      artist: string;
    };
  };
}

// ============================================================================
// YouTube Types
// ============================================================================

export interface YouTubeSearchResult {
  kind: 'youtube#searchResult';
  etag: string;
  id: {
    kind: 'youtube#video';
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeSearchResponse {
  kind: 'youtube#searchListResponse';
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchResult[];
}

export interface YouTubeVideoDetails {
  kind: 'youtube#video';
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
    channelTitle: string;
    categoryId: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 format (e.g., "PT4M15S")
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
  };
}

export interface YouTubeVideosResponse {
  kind: 'youtube#videoListResponse';
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideoDetails[];
}

// ============================================================================
// Application Types
// ============================================================================

export interface Track {
  id: string;           // YouTube video ID
  artist: string;       // Artist name
  title: string;        // Video title
  videoId: string;      // YouTube video ID (same as id)
  duration: string;     // Formatted duration (e.g., "4:15")
  thumbnail: string;    // Thumbnail URL
  channelTitle: string; // YouTube channel name
}

// ============================================================================
// Error Types
// ============================================================================

export class APIError extends Error {
  constructor(
    public service: 'lastfm' | 'youtube',
    public code: string,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export interface ErrorResponse {
  error: {
    code: number;
    message: string;
    errors?: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
}
