/**
 * Hook for building shuffled playlists from artist and related artists
 */

import { useState, useCallback } from 'react';
import { getSimilarArtists } from '../api/lastfm';
import { searchMusicVideos, getVideoDetails, formatVideoAsTrack } from '../api/youtube';
import type { Track } from '../api/types';
import { shuffle } from '../utils/shuffle';

interface UsePlaylistBuilderResult {
  buildPlaylist: (artistName: string) => Promise<Track[]>;
  isLoading: boolean;
  error: string | null;
  progress: string;
}

export function usePlaylistBuilder(): UsePlaylistBuilderResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const buildPlaylist = useCallback(async (artistName: string): Promise<Track[]> => {
    setIsLoading(true);
    setError(null);
    setProgress('Searching Last.fm for similar artists...');

    try {
      // Step 1: Get similar artists from Last.fm
      const similarArtists = await getSimilarArtists(artistName, 7);

      setProgress('Finding music videos on YouTube...');

      // Step 2: Search YouTube for main artist (5 videos)
      const mainVideosResults = await searchMusicVideos(artistName, 5);

      // Step 3: Search YouTube for related artists (3 videos each)
      const relatedVideosPromises = similarArtists.map((artist) =>
        searchMusicVideos(artist.name, 3)
      );
      const relatedVideosResults = await Promise.all(relatedVideosPromises);

      // Combine all video IDs
      const allVideoIds = [
        ...mainVideosResults.map((v) => v.id.videoId),
        ...relatedVideosResults.flat().map((v) => v.id.videoId),
      ];

      if (allVideoIds.length === 0) {
        throw new Error('No videos found for this artist');
      }

      // Limit to 50 videos max (YouTube API batch limit)
      const limitedVideoIds = allVideoIds.slice(0, 50);

      setProgress('Fetching video details...');

      // Step 4: Batch fetch video details (durations, etc.)
      const videoDetails = await getVideoDetails(limitedVideoIds);

      setProgress('Building playlist...');

      // Step 5: Convert to Track format
      const tracks = videoDetails.map(formatVideoAsTrack);

      // Step 6: Shuffle the playlist
      const shuffledTracks = shuffle(tracks);

      setProgress('');
      return shuffledTracks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to build playlist';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    buildPlaylist,
    isLoading,
    error,
    progress,
  };
}
