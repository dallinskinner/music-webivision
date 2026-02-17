import { useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import { SearchBar } from './components/SearchBar'
import { YouTubePlayer } from './components/YouTubePlayer'
import { LoadingState } from './components/LoadingState'
import { usePlaylistBuilder } from './hooks/usePlaylistBuilder'
import { PlayerState } from './hooks/useYouTubePlayer'
import type { Track } from './api/types'
import { savePlaylist, loadPlaylist, clearPlaylist } from './utils/playlistStorage'
import { AuthButton } from './components/AuthButton'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [queueOpen, setQueueOpen] = useState(true)
  const [queue, setQueue] = useState<Track[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [currentArtistName, setCurrentArtistName] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { buildPlaylist, isLoading: isLoadingPlaylist } = usePlaylistBuilder()

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Load saved playlist on mount
  useEffect(() => {
    const savedPlaylist = loadPlaylist()

    if (savedPlaylist && savedPlaylist.queue.length > 0) {
      setQueue(savedPlaylist.queue)
      setCurrentTrackIndex(savedPlaylist.currentTrackIndex)
      setCurrentArtistName(savedPlaylist.artistName)

      // Set the current track but don't auto-play
      if (savedPlaylist.queue[savedPlaylist.currentTrackIndex]) {
        setCurrentTrack(savedPlaylist.queue[savedPlaylist.currentTrackIndex])
      }
    }
  }, [])

  // Save playlist whenever queue or current track changes
  useEffect(() => {
    if (queue.length > 0 && currentArtistName) {
      savePlaylist(queue, currentTrackIndex, currentArtistName)
    }
  }, [queue, currentTrackIndex, currentArtistName])

  // Update document title based on current artist
  useEffect(() => {
    document.title = currentArtistName
      ? `vidstream.exe ${currentArtistName}`
      : 'vidstream.exe'
  }, [currentArtistName])

  const playTrack = useCallback((track: Track, index: number) => {
    setCurrentTrack(track)
    setCurrentTrackIndex(index)
    setIsPlaying(true)
  }, [])

  const togglePlay = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(!isPlaying)
    }
  }, [currentTrack, isPlaying])

  const playNextTrack = useCallback(() => {
    if (queue.length === 0) return
    const nextIndex = (currentTrackIndex + 1) % queue.length
    playTrack(queue[nextIndex], nextIndex)
  }, [queue, currentTrackIndex, playTrack])

  const playPreviousTrack = useCallback(() => {
    if (queue.length === 0) return
    const prevIndex = currentTrackIndex === 0 ? queue.length - 1 : currentTrackIndex - 1
    playTrack(queue[prevIndex], prevIndex)
  }, [queue, currentTrackIndex, playTrack])

  const handleArtistSelect = useCallback(async (artistName: string) => {
    setApiError(null)
    setCurrentArtistName(artistName)

    try {
      const playlist = await buildPlaylist(artistName)
      setQueue(playlist)

      if (playlist.length > 0) {
        playTrack(playlist[0], 0)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to build playlist'
      setApiError(errorMessage)
      console.error('Playlist build error:', error)
    }
  }, [buildPlaylist, playTrack])

  const handlePlayerStateChange = useCallback((state: PlayerState) => {
    if (state === PlayerState.ENDED) {
      playNextTrack()
    } else if (state === PlayerState.PLAYING) {
      setIsPlaying(true)
    } else if (state === PlayerState.PAUSED) {
      setIsPlaying(false)
    }
  }, [playNextTrack])

  const handlePlayerError = useCallback(() => {
    console.error('YouTube player error, skipping to next track')
    playNextTrack()
  }, [playNextTrack])

  const handleEject = useCallback(() => {
    setQueue([])
    setCurrentTrack(null)
    setCurrentTrackIndex(0)
    setIsPlaying(false)
    setCurrentArtistName('')
    setApiError(null)
    clearPlaylist()
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const videoArea = document.querySelector('.video-area')

    if (!videoArea) return

    try {
      if (!document.fullscreenElement) {
        await videoArea.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }, [])

  return (
    <div className="app">
      {/* Scanline overlay for CRT effect */}
      <div className="scanlines"></div>
      <div className="noise"></div>

      {/* Loading overlay */}
      {isLoadingPlaylist && (
        <LoadingState
          message="INITIALIZING TRANSMISSION..."
          steps={[
            '> SCANNING ARTIST DATABASE...',
            '> LOCATING VIDEO TRANSMISSIONS...',
            '> COMPILING BROADCAST QUEUE...',
          ]}
        />
      )}

      {/* Primary toolbar — logo + auth */}
      <header className="toolbar-primary">
        <div className="logo">
          <span className="logo-bracket">[</span>
          <span className="logo-text">vidstream.exe</span>
          <span className="logo-bracket">]</span>
        </div>
        <AuthButton />
      </header>

      {/* Transport bar — controls, search, now playing, queue */}
      <nav className="toolbar-transport">
        <div className="controls">
          <button
            className="control-btn"
            onClick={playPreviousTrack}
            disabled={queue.length === 0}
          >
            <span>◄◄</span>
          </button>
          <button
            className="control-btn play-btn"
            onClick={togglePlay}
            disabled={!currentTrack}
          >
            <span>{isPlaying ? '▮▮' : '►'}</span>
          </button>
          <button
            className="control-btn"
            onClick={playNextTrack}
            disabled={queue.length === 0}
          >
            <span>►►</span>
          </button>
          <button
            className="control-btn fullscreen-btn"
            onClick={toggleFullscreen}
            disabled={!currentTrack}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <span>{isFullscreen ? '⊡' : '⊞'}</span>
          </button>
        </div>

        <div className="transport-divider"></div>

        <SearchBar
          key={currentArtistName}
          onArtistSelect={handleArtistSelect}
          disabled={isLoadingPlaylist}
        />

        <div className="transport-divider"></div>

        <div className="track-info">
          {currentTrack ? (
            <>
              <div className="track-artist">{currentTrack.artist}</div>
              <div className="track-divider">//</div>
              <div className="track-title">{currentTrack.title}</div>
            </>
          ) : (
            <div className="track-empty">NO_SIGNAL</div>
          )}
        </div>

        <button className="queue-toggle" onClick={() => setQueueOpen(!queueOpen)}>
          <span className="queue-icon">{queueOpen ? '▶' : '◀'}</span>
          <span className="queue-label">QUEUE</span>
        </button>
        <button
          className="control-btn eject-btn"
          onClick={handleEject}
          disabled={queue.length === 0 && !currentTrack}
          title="Eject"
        >
          <span>⏏</span>
        </button>
      </nav>

      {/* Error banner */}
      {apiError && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          <span className="error-message">{apiError}</span>
          <button className="error-dismiss" onClick={() => setApiError(null)}>
            DISMISS
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="main-container">
        {/* Video area */}
        <main className="video-area">
          {currentTrack ? (
            <YouTubePlayer
              videoId={currentTrack.videoId}
              isPlaying={isPlaying}
              onStateChange={handlePlayerStateChange}
              onError={handlePlayerError}
              autoplay={true}
            />
          ) : (
            <div className="no-signal">
              <div className="no-signal-content">
                <h2 className="no-signal-text">
                  <span className="glitch" data-text="SIGNAL_LOST">SIGNAL_LOST</span>
                </h2>
                <p className="no-signal-sub">SEARCH FOR AN ARTIST TO INITIATE BROADCAST</p>
              </div>
            </div>
          )}
        </main>

        {/* Queue sidebar */}
        <aside className={clsx('queue-sidebar', { 'open': queueOpen, 'closed': !queueOpen })}>
          <div className="queue-header">
            <span className="queue-title">&gt; TRANSMISSION_QUEUE</span>
            <span className="queue-count">[{queue.length}]</span>
          </div>
          <div className="queue-list">
            {queue.map((track, index) => (
              <div
                key={track.id}
                className={clsx('queue-item', { 'active': currentTrack?.id === track.id })}
                onClick={() => playTrack(track, index)}
              >
                <div className="queue-item-number">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="queue-item-content">
                  <div className="queue-item-artist">{track.artist}</div>
                  <div className="queue-item-title">{track.title}</div>
                </div>
                <div className="queue-item-duration">{track.duration}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
