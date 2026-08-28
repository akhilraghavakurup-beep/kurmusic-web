import { Track } from '../api/types';
import { usePlayerStore } from '../stores/player-store';
import { useSettingsStore } from '../stores/settings-store';
import { useLibraryStore } from '../stores/library-store';
import { decryptMediaUrl } from '../api/decrypt';

export class AudioManager {
  private audio: HTMLAudioElement;
  private currentTrack: Track | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    this.setupListeners();
    this.setupMediaSession();
  }

  private setupListeners() {
    this.audio.addEventListener('play', () => {
      usePlayerStore.getState()._setIsPlaying(true);
      usePlayerStore.getState()._setIsBuffering(false);
      this.updateMediaSessionState('playing');
    });

    this.audio.addEventListener('pause', () => {
      usePlayerStore.getState()._setIsPlaying(false);
      this.updateMediaSessionState('paused');
    });

    this.audio.addEventListener('waiting', () => {
      usePlayerStore.getState()._setIsBuffering(true);
    });

    this.audio.addEventListener('playing', () => {
      usePlayerStore.getState()._setIsBuffering(false);
    });

    this.audio.addEventListener('timeupdate', () => {
      usePlayerStore.getState()._setCurrentTime(this.audio.currentTime);
      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio.duration && Number.isFinite(this.audio.duration)) {
        usePlayerStore.getState()._setDuration(this.audio.duration);
        this.updateMediaSessionPosition();
      }
    });

    this.audio.addEventListener('ended', () => {
      usePlayerStore.getState().playNext();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback error encountered:', e, this.audio.error);
      usePlayerStore.getState()._setIsBuffering(false);
      usePlayerStore.getState()._setIsPlaying(false);
    });
  }

  private setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const nav = navigator.mediaSession;

    nav.setActionHandler('play', () => {
      this.play();
    });

    nav.setActionHandler('pause', () => {
      this.pause();
    });

    nav.setActionHandler('previoustrack', () => {
      usePlayerStore.getState().playPrevious();
    });

    nav.setActionHandler('nexttrack', () => {
      usePlayerStore.getState().playNext();
    });

    try {
      nav.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          this.seek(details.seekTime);
        }
      });
    } catch {
      // seekto not supported on some older browsers
    }

    try {
      nav.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.max(0, this.audio.currentTime - offset));
      });
    } catch {
      // ignore
    }

    try {
      nav.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.min(this.audio.duration || 0, this.audio.currentTime + offset));
      });
    } catch {
      // ignore
    }

    try {
      nav.setActionHandler('stop', () => {
        this.pause();
      });
    } catch {
      // ignore
    }
  }

  private updateMediaSessionMetadata(track: Track) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Kur Music',
        artwork: [
          { src: track.image, sizes: '96x96', type: 'image/jpeg' },
          { src: track.image, sizes: '128x128', type: 'image/jpeg' },
          { src: track.image, sizes: '192x192', type: 'image/jpeg' },
          { src: track.image, sizes: '256x256', type: 'image/jpeg' },
          { src: track.image, sizes: '384x384', type: 'image/jpeg' },
          { src: track.image, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    } catch (e) {
      console.warn('Failed to update MediaSession metadata:', e);
    }
  }

  private updateMediaSessionState(state: 'playing' | 'paused' | 'none') {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {
      // ignore
    }
  }

  private updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;

    try {
      if (
        this.audio.duration &&
        Number.isFinite(this.audio.duration) &&
        Number.isFinite(this.audio.currentTime)
      ) {
        navigator.mediaSession.setPositionState({
          duration: this.audio.duration,
          playbackRate: this.audio.playbackRate || 1,
          position: Math.min(this.audio.currentTime, this.audio.duration),
        });
      }
    } catch {
      // ignore
    }
  }

  async loadAndPlay(track: Track) {
    this.currentTrack = track;
    const quality = useSettingsStore.getState().audioQuality;

    let streamUrl = track.audioUrl;

    // Check offline CacheStorage first
    try {
      if ('caches' in window) {
        const cache = await caches.open('kurmusic_offline_v1');
        const cached = await cache.match(`/offline/${track.id}`);
        if (cached) {
          const blob = await cached.blob();
          streamUrl = URL.createObjectURL(blob);
        }
      }
    } catch (e) {
      console.warn('Offline cache lookup error:', e);
    }

    if (!streamUrl && track.encryptedMediaUrl) {
      const decrypted = decryptMediaUrl(track.encryptedMediaUrl, quality);
      if (decrypted) {
        streamUrl = decrypted;
      }
    }

    if (!streamUrl) {
      console.warn('No playable audio stream for track:', track.title);
      return;
    }

    this.updateMediaSessionMetadata(track);
    usePlayerStore.getState()._setIsBuffering(true);

    try {
      this.audio.src = streamUrl;
      this.audio.volume = usePlayerStore.getState().isMuted ? 0 : usePlayerStore.getState().volume;
      this.audio.load();
      await this.audio.play();
      useLibraryStore.getState().recordPlay(track);
    } catch (error) {
      console.error('Audio playback failed to start:', error);
      usePlayerStore.getState()._setIsBuffering(false);
      usePlayerStore.getState()._setIsPlaying(false);
    }
  }

  play() {
    if (this.audio.src) {
      this.audio.play().catch((err) => console.error('Audio play error:', err));
    }
  }

  pause() {
    this.audio.pause();
  }

  seek(seconds: number) {
    if (Number.isFinite(seconds)) {
      this.audio.currentTime = seconds;
    }
  }

  setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  getAudioElement(): HTMLAudioElement {
    return this.audio;
  }
}

export const audioManager = new AudioManager();
