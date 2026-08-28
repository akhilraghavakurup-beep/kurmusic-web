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

export interface LibraryState {
  likedTracks: Track[];
  playlists: CustomPlaylist[];
  recentTracks: Track[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  createPlaylist: (name: string, description?: string) => string;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addRecent: (track: Track) => void;
  clearRecent: () => void;
}

const STORAGE_KEY = 'kurmusic_library';

const loadSavedLibrary = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
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
  };
};

const initial = loadSavedLibrary();

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedTracks: initial.likedTracks || [],
  playlists: initial.playlists || [],
  recentTracks: initial.recentTracks || [],

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
}));
