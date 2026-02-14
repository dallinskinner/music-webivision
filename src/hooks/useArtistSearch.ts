/**
 * Hook for debounced artist search with Last.fm
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchArtists } from '../api/lastfm';
import type { LastfmArtist } from '../api/types';
import { debounce } from '../utils/debounce';

const DEBOUNCE_DELAY = 300; // milliseconds

interface UseArtistSearchResult {
  suggestions: LastfmArtist[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearSuggestions: () => void;
}

export function useArtistSearch(): UseArtistSearchResult {
  const [suggestions, setSuggestions] = useState<LastfmArtist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancel pending requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const performSearch = async (query: string) => {
    // Cancel previous request
    abortControllerRef.current?.abort();

    if (!query.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const results = await searchArtists(query);
      setSuggestions(results);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(performSearch, DEBOUNCE_DELAY),
    []
  );

  const search = useCallback(
    (query: string) => {
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    abortControllerRef.current?.abort();
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    search,
    clearSuggestions,
  };
}
