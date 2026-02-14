/**
 * Utility for saving/loading playlists from localStorage
 */

import type { Track } from '../api/types';

const STORAGE_KEY = 'cyber_mtv_playlist';

interface SavedPlaylist {
  queue: Track[];
  currentTrackIndex: number;
  artistName: string;
  timestamp: number;
}

/**
 * Save the current playlist to localStorage
 */
export function savePlaylist(
  queue: Track[],
  currentTrackIndex: number,
  artistName: string
): void {
  try {
    const data: SavedPlaylist = {
      queue,
      currentTrackIndex,
      artistName,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save playlist to localStorage:', error);
    // If localStorage is full, just ignore - not critical
  }
}

/**
 * Load the saved playlist from localStorage
 * Returns null if no playlist is saved or if it's too old (>7 days)
 */
export function loadPlaylist(): SavedPlaylist | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const data: SavedPlaylist = JSON.parse(stored);

    // Check if playlist is too old (7 days = 604800000ms)
    const age = Date.now() - data.timestamp;
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (age > MAX_AGE) {
      clearPlaylist();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load playlist from localStorage:', error);
    return null;
  }
}

/**
 * Clear the saved playlist from localStorage
 */
export function clearPlaylist(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear playlist from localStorage:', error);
  }
}
