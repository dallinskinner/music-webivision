/**
 * Hook for managing YouTube iframe player
 * Documentation: https://developers.google.com/youtube/iframe_api_reference
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Re-export PlayerState from YT namespace
export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type PlayerState = (typeof PlayerState)[keyof typeof PlayerState];

interface UseYouTubePlayerOptions {
  onReady?: () => void;
  onStateChange?: (state: PlayerState) => void;
  onError?: (error: number) => void;
}

interface UseYouTubePlayerResult {
  playerRef: React.MutableRefObject<YT.Player | null>;
  isReady: boolean;
  loadVideo: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

let isAPILoading = false;
let isAPIReady = false;

/**
 * Load YouTube iframe API script
 */
function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (isAPIReady) {
      resolve();
      return;
    }

    if (isAPILoading) {
      // Wait for existing load
      const checkReady = setInterval(() => {
        if (isAPIReady) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      return;
    }

    isAPILoading = true;

    window.onYouTubeIframeAPIReady = () => {
      isAPIReady = true;
      isAPILoading = false;
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
}

/**
 * Hook for managing YouTube player instance
 */
export function useYouTubePlayer(
  elementId: string,
  options: UseYouTubePlayerOptions = {}
): UseYouTubePlayerResult {
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Store callbacks in refs so they don't trigger re-initialization
  const onReadyRef = useRef(options.onReady);
  const onStateChangeRef = useRef(options.onStateChange);
  const onErrorRef = useRef(options.onError);

  // Update refs when callbacks change
  useEffect(() => {
    onReadyRef.current = options.onReady;
    onStateChangeRef.current = options.onStateChange;
    onErrorRef.current = options.onError;
  }, [options.onReady, options.onStateChange, options.onError]);

  useEffect(() => {
    let mounted = true;

    const initPlayer = async () => {
      await loadYouTubeAPI();

      if (!mounted) return;

      playerRef.current = new window.YT.Player(elementId, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0, // Hide default controls (we use custom controls)
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            onReadyRef.current?.();
          },
          onStateChange: (event) => {
            onStateChangeRef.current?.(event.data as PlayerState);
          },
          onError: (event) => {
            onErrorRef.current?.(event.data);
          },
        },
      });
    };

    initPlayer();

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        setIsReady(false);
      }
    };
  }, [elementId]);

  const loadVideo = useCallback((videoId: string) => {
    if (playerRef.current && isReady) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [isReady]);

  const play = useCallback(() => {
    if (playerRef.current && isReady) {
      playerRef.current.playVideo();
    }
  }, [isReady]);

  const pause = useCallback(() => {
    if (playerRef.current && isReady) {
      playerRef.current.pauseVideo();
    }
  }, [isReady]);

  const getCurrentTime = useCallback((): number => {
    if (playerRef.current && isReady) {
      return playerRef.current.getCurrentTime();
    }
    return 0;
  }, [isReady]);

  const getDuration = useCallback((): number => {
    if (playerRef.current && isReady) {
      return playerRef.current.getDuration();
    }
    return 0;
  }, [isReady]);

  return {
    playerRef,
    isReady,
    loadVideo,
    play,
    pause,
    getCurrentTime,
    getDuration,
  };
}
