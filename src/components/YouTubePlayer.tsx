/**
 * YouTube iframe player component
 */

import { useEffect, useCallback, useRef } from 'react';
import { useYouTubePlayer, PlayerState } from '../hooks/useYouTubePlayer';
import styles from './YouTubePlayer.module.css';

interface YouTubePlayerProps {
  videoId: string;
  onStateChange?: (state: PlayerState) => void;
  onError?: () => void;
  onReady?: () => void;
  autoplay?: boolean;
}

const PLAYER_ID = 'youtube-player';

export function YouTubePlayer({
  videoId,
  onStateChange,
  onError,
  onReady,
  autoplay = true,
}: YouTubePlayerProps) {
  const previousVideoIdRef = useRef<string | null>(null);

  const handleError = useCallback(
    (errorCode: number) => {
      console.error('YouTube player error:', errorCode);
      onError?.();
    },
    [onError]
  );

  const { isReady, loadVideo, play } = useYouTubePlayer(PLAYER_ID, {
    onStateChange,
    onError: handleError,
    onReady,
  });

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

  return (
    <div className={styles.youtubePlayerContainer}>
      <div id={PLAYER_ID} className={styles.youtubePlayer}></div>
    </div>
  );
}
