import { create } from 'zustand';
import { Track } from '../api/types';
import { audioManager } from '../audio/audio-manager';
import { useLibraryStore } from './library-store';

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  queueIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;
  isMobilePlayerOpen: boolean;

  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (timeInSeconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  setQueueOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setMobilePlayerOpen: (open: boolean) => void;

  // Internal updater methods
  _setIsPlaying: (playing: boolean) => void;
  _setCurrentTime: (time: number) => void;
  _setDuration: (dur: number) => void;
  _setIsBuffering: (buffering: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  history: [],
  queueIndex: -1,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  repeatMode: 'off',
  isShuffled: false,
  isQueueOpen: false,
  isLyricsOpen: false,
  isMobilePlayerOpen: false,

  playTrack: (track: Track, newQueue?: Track[]) => {
    let queue = newQueue ? [...newQueue] : get().queue;
    let index = queue.findIndex((t) => t.id === track.id);

    if (index === -1) {
      queue = [track, ...queue];
      index = 0;
    }

    set((state) => ({
      currentTrack: track,
      queue,
      queueIndex: index,
      currentTime: 0,
      duration: track.duration || 0,
      history: state.currentTrack ? [state.currentTrack, ...state.history].slice(0, 30) : state.history,
    }));

    // Record in history
    useLibraryStore.getState().addRecent(track);

    // Start audio playback
    audioManager.loadAndPlay(track);
  },

  togglePlay: () => {
    const { isPlaying, currentTrack, queue } = get();
    if (!currentTrack && queue.length > 0) {
      get().playTrack(queue[0]);
      return;
    }
    if (isPlaying) {
      audioManager.pause();
    } else {
      audioManager.play();
    }
  },

  playNext: () => {
    const { queue, queueIndex, repeatMode, isShuffled } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      audioManager.seek(0);
      audioManager.play();
      return;
    }

    let nextIndex = queueIndex + 1;
    if (isShuffled && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === queueIndex);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        audioManager.pause();
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      set({ queueIndex: nextIndex, currentTrack: nextTrack });
      useLibraryStore.getState().addRecent(nextTrack);
      audioManager.loadAndPlay(nextTrack);
    }
  },

  playPrevious: () => {
    const { queue, queueIndex, currentTime, history } = get();
    if (currentTime > 3) {
      // Restart current song if played more than 3 seconds
      audioManager.seek(0);
      return;
    }

    if (history.length > 0) {
      const prev = history[0];
      set((state) => ({ history: state.history.slice(1) }));
      get().playTrack(prev);
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      set({ queueIndex: prevIndex, currentTrack: prevTrack });
      audioManager.loadAndPlay(prevTrack);
    }
  },

  seek: (time: number) => {
    set({ currentTime: time });
    audioManager.seek(time);
  },

  setVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ volume: clamped, isMuted: clamped === 0 });
    audioManager.setVolume(clamped);
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    if (isMuted) {
      set({ isMuted: false });
      audioManager.setVolume(volume || 0.5);
    } else {
      set({ isMuted: true });
      audioManager.setVolume(0);
    }
  },

  toggleRepeat: () => {
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const nextMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
      return { repeatMode: nextMode };
    });
  },

  toggleShuffle: () => {
    set((state) => ({ isShuffled: !state.isShuffled }));
  },

  addToQueue: (track: Track) => {
    set((state) => {
      if (state.queue.some((t) => t.id === track.id)) return state;
      return { queue: [...state.queue, track] };
    });
  },

  removeFromQueue: (index: number) => {
    set((state) => {
      const queue = state.queue.filter((_, i) => i !== index);
      let queueIndex = state.queueIndex;
      if (index < queueIndex) queueIndex--;
      return { queue, queueIndex };
    });
  },

  clearQueue: () => {
    set((state) => ({
      queue: state.currentTrack ? [state.currentTrack] : [],
      queueIndex: state.currentTrack ? 0 : -1,
    }));
  },

  reorderQueue: (startIndex: number, endIndex: number) => {
    set((state) => {
      const result = Array.from(state.queue);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { queue: result };
    });
  },

  setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),
  setLyricsOpen: (isLyricsOpen) => set({ isLyricsOpen }),
  setMobilePlayerOpen: (isMobilePlayerOpen) => set({ isMobilePlayerOpen }),

  _setIsPlaying: (isPlaying) => set({ isPlaying }),
  _setCurrentTime: (currentTime) => set({ currentTime }),
  _setDuration: (duration) => set({ duration }),
  _setIsBuffering: (isBuffering) => set({ isBuffering }),
}));
