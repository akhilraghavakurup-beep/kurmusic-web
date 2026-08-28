import { create } from 'zustand';
import { Track } from '../api/types';
import { decryptMediaUrl } from '../api/decrypt';
import { useSettingsStore } from './settings-store';

export interface DownloadedTrack extends Track {
  downloadedAt: number;
  blobUrl?: string;
  fileSize?: number;
}

export interface DownloadState {
  downloadedTracks: DownloadedTrack[];
  downloadingIds: string[];
  isDownloaded: (trackId: string) => boolean;
  downloadTrack: (track: Track) => Promise<void>;
  deleteDownload: (trackId: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  saveFileToDevice: (track: Track) => Promise<void>;
}

const CACHE_NAME = 'kurmusic_offline_v1';
const METADATA_KEY = 'kurmusic_offline_metadata';

const loadSavedMetadata = (): DownloadedTrack[] => {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load downloaded tracks metadata:', e);
  }
  return [];
};

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloadedTracks: loadSavedMetadata(),
  downloadingIds: [],

  isDownloaded: (trackId: string) => {
    return get().downloadedTracks.some((t) => t.id === trackId);
  },

  downloadTrack: async (track: Track) => {
    const { downloadingIds, isDownloaded } = get();
    if (isDownloaded(track.id) || downloadingIds.includes(track.id)) return;

    set((state) => ({ downloadingIds: [...state.downloadingIds, track.id] }));

    try {
      const quality = useSettingsStore.getState().audioQuality;
      let streamUrl = track.audioUrl;
      if (track.encryptedMediaUrl) {
        const decrypted = decryptMediaUrl(track.encryptedMediaUrl, quality);
        if (decrypted) streamUrl = decrypted;
      }

      if (!streamUrl) throw new Error('No audio URL found for download');

      const res = await fetch(streamUrl);
      if (!res.ok) throw new Error(`Download HTTP failed: ${res.status}`);

      const blob = await res.blob();
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = `/offline/${track.id}`;
      await cache.put(cacheKey, new Response(blob));

      const downloadedTrack: DownloadedTrack = {
        ...track,
        downloadedAt: Date.now(),
        fileSize: blob.size,
        audioUrl: cacheKey, // Can be resolved via Cache
      };

      set((state) => {
        const next = [downloadedTrack, ...state.downloadedTracks.filter((t) => t.id !== track.id)];
        localStorage.setItem(METADATA_KEY, JSON.stringify(next));
        return {
          downloadedTracks: next,
          downloadingIds: state.downloadingIds.filter((id) => id !== track.id),
        };
      });
    } catch (err) {
      console.error('Failed to download track offline:', err);
      set((state) => ({
        downloadingIds: state.downloadingIds.filter((id) => id !== track.id),
      }));
      alert(`Could not download "${track.title}". Please try again.`);
    }
  },

  saveFileToDevice: async (track: Track) => {
    try {
      const quality = useSettingsStore.getState().audioQuality;
      let streamUrl = track.audioUrl;
      if (track.encryptedMediaUrl) {
        const decrypted = decryptMediaUrl(track.encryptedMediaUrl, quality);
        if (decrypted) streamUrl = decrypted;
      }

      if (!streamUrl) throw new Error('No audio URL found');

      const res = await fetch(streamUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title} - ${track.artist}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to save file to device:', err);
      alert('Unable to save file to device directly.');
    }
  },

  deleteDownload: async (trackId: string) => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(`/offline/${trackId}`);

      set((state) => {
        const next = state.downloadedTracks.filter((t) => t.id !== trackId);
        localStorage.setItem(METADATA_KEY, JSON.stringify(next));
        return { downloadedTracks: next };
      });
    } catch (err) {
      console.error('Error deleting offline download:', err);
    }
  },

  clearAllDownloads: async () => {
    try {
      await caches.delete(CACHE_NAME);
      localStorage.removeItem(METADATA_KEY);
      set({ downloadedTracks: [] });
    } catch (err) {
      console.error('Error clearing downloads cache:', err);
    }
  },
}));
