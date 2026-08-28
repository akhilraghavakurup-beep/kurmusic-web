import { create } from 'zustand';
import { AudioQuality } from '../api/types';
import { jioSaavnClient } from '../api/jiosaavn-client';

export interface SettingsState {
  languages: string[];
  audioQuality: AudioQuality;
  customProxy: string;
  accentColor: string;
  setAudioQuality: (quality: AudioQuality) => void;
  setLanguages: (languages: string[]) => void;
  toggleLanguage: (lang: string) => void;
  setCustomProxy: (proxy: string) => void;
  setAccentColor: (color: string) => void;
}

const STORAGE_KEY = 'kurmusic_settings';

const loadSavedSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {
    languages: ['malayalam', 'tamil', 'telugu', 'hindi', 'punjabi', 'english'],
    audioQuality: '320kbps' as AudioQuality,
    customProxy: '',
    accentColor: '#9333EA',
  };
};

const initial = loadSavedSettings();
if (initial.customProxy) {
  jioSaavnClient.setProxy(initial.customProxy);
}

export const useSettingsStore = create<SettingsState>((set) => ({
  languages: initial.languages,
  audioQuality: initial.audioQuality,
  customProxy: initial.customProxy,
  accentColor: initial.accentColor,

  setAudioQuality: (audioQuality) =>
    set((state) => {
      const next = { ...state, audioQuality };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { audioQuality };
    }),

  setLanguages: (languages) =>
    set((state) => {
      const next = { ...state, languages };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { languages };
    }),

  toggleLanguage: (lang) =>
    set((state) => {
      const exists = state.languages.includes(lang);
      const languages = exists
        ? state.languages.length > 1
          ? state.languages.filter((l) => l !== lang)
          : state.languages
        : [...state.languages, lang];
      const next = { ...state, languages };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { languages };
    }),

  setCustomProxy: (customProxy) => {
    jioSaavnClient.setProxy(customProxy);
    set((state) => {
      const next = { ...state, customProxy };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { customProxy };
    });
  },

  setAccentColor: (accentColor) =>
    set((state) => {
      const next = { ...state, accentColor };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { accentColor };
    }),
}));
