import { create } from 'zustand';
import { Track } from '../api/types';

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  tracks: Track[];
  createdAt: number;
}

export interface PlayRecord {
  track: Track;
  count: number;
  lastPlayed: number;
}

export interface LibraryState {
  likedTracks: Track[];
  playlists: CustomPlaylist[];
  recentTracks: Track[];
  playCounts: Record<string, PlayRecord>;
  totalMinutesListened: number;
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  createPlaylist: (name: string, description?: string) => string;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addRecent: (track: Track) => void;
  clearRecent: () => void;
  recordPlay: (track: Track) => void;
  getTopPlayedTracks: (limit?: number) => Track[];
}

const STORAGE_KEY = 'kurmusic_library';

const defaultSeedRewind: Record<string, PlayRecord> = {
  wBgCQQ_6: {
    track: {
      id: 'wBgCQQ_6',
      title: 'Illuminati',
      artist: 'Sushin Shyam, Dabzee',
      album: 'Aavesham',
      duration: 193,
      image: 'https://c.saavncdn.com/202/Aavesham-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250910150630-500x500.jpg',
      encryptedMediaUrl: 'ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDy4AJUV3zW12nH7q/z0LLO0mtlQEI+xyHP12xSNxdpYBkdjy+oQ7CrFBw7tS9a8Gtq',
      year: 2024,
      hasLyrics: true,
    },
    count: 24,
    lastPlayed: Date.now() - 3600000,
  },
  DUjOqjSk: {
    track: {
      id: 'DUjOqjSk',
      title: 'Kuthanthram',
      artist: 'Sushin Shyam, Vedan',
      album: 'Manjummel Boys',
      duration: 240,
      image: 'https://c.saavncdn.com/934/Manjummel-Boys-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250905071140-500x500.jpg',
      encryptedMediaUrl: 'ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyLeOfp7FaONIZB0cQvmiwvAs+36GiCzcedSh85B58ENd1ISJg9R/7ghw7tS9a8Gtq',
      year: 2024,
      hasLyrics: true,
    },
    count: 19,
    lastPlayed: Date.now() - 7200000,
  },
  ahQg3u9E: {
    track: {
      id: 'ahQg3u9E',
      title: 'Naa Ready',
      artist: 'Thalapathy Vijay, Anirudh Ravichander',
      album: 'Leo',
      duration: 248,
      image: 'https://c.saavncdn.com/415/Leo-Original-Motion-Picture-Soundtrack-English-2023-20231019170311-500x500.jpg',
      encryptedMediaUrl: 'ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyy5Mc1F8mZ/QlkSmsH1C7sSANVPXKK0fY5LDViob2w/TMiXEBX4o75xw7tS9a8Gtq',
      year: 2023,
      hasLyrics: true,
    },
    count: 16,
    lastPlayed: Date.now() - 14400000,
  },
  GUURlhr1: {
    track: {
      id: 'GUURlhr1',
      title: 'Aasa Kooda',
      artist: 'Sai Abhyankkar, Sai Smriti',
      album: 'Think Indie',
      duration: 215,
      image: 'https://c.saavncdn.com/772/Aasa-Kooda-From-Think-Indie-Tamil-2024-20251026074529-500x500.jpg',
      encryptedMediaUrl: 'ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyvIF+e0e4CLskqX0QEd9GXfk8O2sKESAWRBQdD2ABq+T3Pn08clP73Bw7tS9a8Gtq',
      year: 2024,
      hasLyrics: true,
    },
    count: 14,
    lastPlayed: Date.now() - 28800000,
  },
  or8LPjW6: {
    track: {
      id: 'or8LPjW6',
      title: 'Hukum - Thalaivar Alappara',
      artist: 'Anirudh Ravichander',
      album: 'Jailer',
      duration: 207,
      image: 'https://c.saavncdn.com/187/Jailer-Tamil-2023-20230728081443-500x500.jpg',
      encryptedMediaUrl: 'ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyCa9BqALWw+YYOsQ3AdSjkQm9SXuw3FNEiYiIUasbdqw22lsEKeQCxhw7tS9a8Gtq',
      year: 2023,
      hasLyrics: true,
    },
    count: 11,
    lastPlayed: Date.now() - 43200000,
  },
  CVeqCCYc: {
    track: {
      id: 'CVeqCCYc',
      title: 'Tauba Tauba',
      artist: 'Karan Aujla',
      album: 'Bad Newz',
      duration: 207,
      image: 'https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg',
      encryptedMediaUrl: 'ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyexyhGiurcXEpCNi8gBIelM0+/bASiAx59yNTLyuH4My32JGBcP+xKhw7tS9a8Gtq',
      year: 2024,
      hasLyrics: true,
    },
    count: 9,
    lastPlayed: Date.now() - 86400000,
  },
};

const loadSavedLibrary = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        likedTracks: parsed.likedTracks || [],
        playlists: parsed.playlists || [],
        recentTracks: parsed.recentTracks || [],
        playCounts: parsed.playCounts || defaultSeedRewind,
        totalMinutesListened: parsed.totalMinutesListened || 185,
      };
    }
  } catch (e) {
    console.error('Failed to load library:', e);
  }
  return {
    likedTracks: [],
    playlists: [
      {
        id: 'favorites',
        name: 'My Favorites',
        description: 'Your favorite tracks',
        tracks: [],
        createdAt: Date.now(),
      },
    ],
    recentTracks: [],
    playCounts: defaultSeedRewind,
    totalMinutesListened: 185,
  };
};

const initial = loadSavedLibrary();

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedTracks: initial.likedTracks || [],
  playlists: initial.playlists || [],
  recentTracks: initial.recentTracks || [],
  playCounts: initial.playCounts || defaultSeedRewind,
  totalMinutesListened: initial.totalMinutesListened || 185,

  isLiked: (trackId: string) => {
    return get().likedTracks.some((t) => t.id === trackId);
  },

  toggleLike: (track: Track) =>
    set((state) => {
      const exists = state.likedTracks.some((t) => t.id === track.id);
      const likedTracks = exists
        ? state.likedTracks.filter((t) => t.id !== track.id)
        : [track, ...state.likedTracks];

      const next = { ...state, likedTracks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { likedTracks };
    }),

  createPlaylist: (name: string, description?: string) => {
    const newId = 'pl_' + Date.now();
    set((state) => {
      const newPlaylist: CustomPlaylist = {
        id: newId,
        name: name.trim() || 'New Playlist',
        description: description?.trim(),
        tracks: [],
        createdAt: Date.now(),
      };
      const playlists = [...state.playlists, newPlaylist];
      const next = { ...state, playlists };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { playlists };
    });
    return newId;
  },

  addToPlaylist: (playlistId: string, track: Track) =>
    set((state) => {
      const playlists = state.playlists.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.tracks.some((t) => t.id === track.id)) return pl;
          return {
            ...pl,
            tracks: [...pl.tracks, track],
            coverImage: pl.coverImage || track.image,
          };
        }
        return pl;
      });
      const next = { ...state, playlists };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { playlists };
    }),

  removeFromPlaylist: (playlistId: string, trackId: string) =>
    set((state) => {
      const playlists = state.playlists.map((pl) => {
        if (pl.id === playlistId) {
          return {
            ...pl,
            tracks: pl.tracks.filter((t) => t.id !== trackId),
          };
        }
        return pl;
      });
      const next = { ...state, playlists };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { playlists };
    }),

  deletePlaylist: (playlistId: string) =>
    set((state) => {
      const playlists = state.playlists.filter((pl) => pl.id !== playlistId);
      const next = { ...state, playlists };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { playlists };
    }),

  addRecent: (track: Track) =>
    set((state) => {
      const filtered = state.recentTracks.filter((t) => t.id !== track.id);
      const recentTracks = [track, ...filtered].slice(0, 50); // Keep last 50
      const next = { ...state, recentTracks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { recentTracks };
    }),

  clearRecent: () =>
    set((state) => {
      const next = { ...state, recentTracks: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { recentTracks: [] };
    }),

  recordPlay: (track: Track) =>
    set((state) => {
      const existing = state.playCounts[track.id];
      const count = (existing?.count || 0) + 1;
      const playCounts = {
        ...state.playCounts,
        [track.id]: {
          track,
          count,
          lastPlayed: Date.now(),
        },
      };

      const addedMinutes = Math.max(1, Math.round((track.duration || 210) / 60));
      const totalMinutesListened = (state.totalMinutesListened || 0) + addedMinutes;

      // Also update recent tracks
      const filtered = state.recentTracks.filter((t) => t.id !== track.id);
      const recentTracks = [track, ...filtered].slice(0, 50);

      const next = {
        ...state,
        playCounts,
        totalMinutesListened,
        recentTracks,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { playCounts, totalMinutesListened, recentTracks };
    }),

  getTopPlayedTracks: (limit = 12) => {
    const list = Object.values(get().playCounts || {});
    list.sort((a, b) => b.count - a.count);
    return list.slice(0, limit).map((item) => item.track);
  },
}));
