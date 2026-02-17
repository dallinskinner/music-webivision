/**
 * YouTube iframe player component
 */

import { useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useYouTubePlayer, PlayerState } from '../hooks/useYouTubePlayer';
import styles from './YouTubePlayer.module.css';

export interface YouTubePlayerHandle {
  getCurrentTime: () => number
}

interface YouTubePlayerProps {
  videoId: string;
  isPlaying?: boolean;
  onStateChange?: (state: PlayerState) => void;
  onError?: () => void;
  onReady?: () => void;
  autoplay?: boolean;
}

const PLAYER_ID = 'youtube-player';

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(function YouTubePlayer({
  videoId,
  isPlaying,
  onStateChange,
  onError,
  onReady,
  autoplay = true,
}, ref) {
  const previousVideoIdRef = useRef<string | null>(null);

  const handleError = useCallback(
    (errorCode: number) => {
      console.error('YouTube player error:', errorCode);
      onError?.();
    },
    [onError]
  );

  const { isReady, loadVideo, play, pause, getCurrentTime } = useYouTubePlayer(PLAYER_ID, {
    onStateChange,
    onError: handleError,
    onReady,
  });

  useImperativeHandle(ref, () => ({
    getCurrentTime,
  }), [getCurrentTime]);

  // Load video when videoId changes
  useEffect(() => {
    // Only load if the videoId actually changed and player is ready
    if (isReady && videoId && previousVideoIdRef.current !== videoId) {
      previousVideoIdRef.current = videoId;
      loadVideo(videoId);

      if (autoplay) {
        // Small delay to ensure video is loaded
        setTimeout(() => {
          play();
        }, 100);
      }
    }
  }, [videoId, isReady, loadVideo, play, autoplay]);

  // Sync play/pause state from parent
  useEffect(() => {
    if (!isReady || isPlaying === undefined) return;

    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, isReady, play, pause]);

  return (
    <div className={styles.youtubePlayerContainer}>
      <div id={PLAYER_ID} className={styles.youtubePlayer}></div>
    </div>
  );
})
