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

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.ensureAudioInDom());
      } else {
        this.ensureAudioInDom();
      }
    }

    this.setupListeners();
    this.setupMediaSession();
  }

  private ensureAudioInDom() {
    if (typeof document !== 'undefined' && document.body) {
      if (!document.getElementById('kurmusic-audio-element')) {
        this.audio.id = 'kurmusic-audio-element';
        this.audio.style.display = 'none';
        document.body.appendChild(this.audio);
      }
    }
  }

  private setupListeners() {
    this.audio.addEventListener('play', () => {
      usePlayerStore.getState()._setIsPlaying(true);
      usePlayerStore.getState()._setIsBuffering(false);
      this.updateMediaSessionState('playing');
      if (this.currentTrack) {
        this.updateMediaSessionMetadata(this.currentTrack);
      }
    });

    this.audio.addEventListener('playing', () => {
      usePlayerStore.getState()._setIsBuffering(false);
      this.updateMediaSessionState('playing');
      if (this.currentTrack) {
        this.updateMediaSessionMetadata(this.currentTrack);
      }
    });

    this.audio.addEventListener('pause', () => {
      usePlayerStore.getState()._setIsPlaying(false);
      this.updateMediaSessionState('paused');
    });

    this.audio.addEventListener('waiting', () => {
      usePlayerStore.getState()._setIsBuffering(true);
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
      this.updateMediaSessionState('none');
    });
  }

  private setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const nav = navigator.mediaSession;

    try {
      nav.setActionHandler('play', () => {
        this.play();
      });
    } catch {}

    try {
      nav.setActionHandler('pause', () => {
        this.pause();
      });
    } catch {}

    try {
      nav.setActionHandler('previoustrack', () => {
        usePlayerStore.getState().playPrevious();
      });
    } catch {}

    try {
      nav.setActionHandler('nexttrack', () => {
        usePlayerStore.getState().playNext();
      });
    } catch {}

    try {
      nav.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          this.seek(details.seekTime);
        }
      });
    } catch {}

    try {
      nav.setActionHandler('stop', () => {
        this.pause();
      });
    } catch {}
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  private updateMediaSessionMetadata(track: Track) {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;

    try {
      const cleanTitle = this.decodeHtmlEntities(track.title || 'Kur Music');
      const cleanArtist = this.decodeHtmlEntities(track.artist || 'Kur Music');
      const cleanAlbum = this.decodeHtmlEntities(track.album || 'Kur Music');

      const img = track.image;
      const absoluteImg = img && img.startsWith('http')
        ? img
        : typeof window !== 'undefined'
        ? new URL(img || '/icon-512.png', window.location.href).href
        : '';

      const fallback512 = typeof window !== 'undefined' ? `${window.location.origin}/icon-512.png` : '';
      const fallback192 = typeof window !== 'undefined' ? `${window.location.origin}/icon-192.png` : '';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: cleanTitle,
        artist: cleanArtist,
        album: cleanAlbum,
        artwork: [
          ...(absoluteImg
            ? [
                { src: absoluteImg, sizes: '96x96' },
                { src: absoluteImg, sizes: '128x128' },
                { src: absoluteImg, sizes: '192x192' },
                { src: absoluteImg, sizes: '256x256' },
                { src: absoluteImg, sizes: '384x384' },
                { src: absoluteImg, sizes: '512x512' },
              ]
            : []),
          ...(fallback512 ? [{ src: fallback512, sizes: '512x512', type: 'image/png' }] : []),
          ...(fallback192 ? [{ src: fallback192, sizes: '192x192', type: 'image/png' }] : []),
        ],
      });
      navigator.mediaSession.playbackState = 'playing';
    } catch (e) {
      console.warn('Failed to update MediaSession metadata:', e);
    }
  }

  private updateMediaSessionState(state: 'playing' | 'paused' | 'none') {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {}
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

    this.ensureAudioInDom();
    usePlayerStore.getState()._setIsBuffering(true);

    try {
      this.audio.src = streamUrl;
      this.audio.volume = usePlayerStore.getState().isMuted ? 0 : usePlayerStore.getState().volume;
      await this.audio.play();
      this.updateMediaSessionMetadata(track);
      this.updateMediaSessionState('playing');
      this.updateMediaSessionPosition();
      useLibraryStore.getState().recordPlay(track);
    } catch (error) {
      console.error('Audio playback failed to start:', error);
      usePlayerStore.getState()._setIsBuffering(false);
      usePlayerStore.getState()._setIsPlaying(false);
      this.updateMediaSessionState('none');
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
