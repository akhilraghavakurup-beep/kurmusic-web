import React, { useEffect, useState } from 'react';
import { Play, Pause, Globe, Check } from 'lucide-react';
import { HomeFeedSection, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { useSettingsStore } from '../../stores/settings-store';
import { usePlayerStore } from '../../stores/player-store';
import { HorizontalSection } from '../home/HorizontalSection';

interface HomeViewProps {
  onSelectAlbum: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onSelectArtist: (id: string) => void;
}

const AVAILABLE_LANGUAGES = [
  { id: 'malayalam', label: 'Malayalam', emoji: '🌴' },
  { id: 'tamil', label: 'Tamil', emoji: '🔥' },
  { id: 'telugu', label: 'Telugu', emoji: '⚡' },
  { id: 'hindi', label: 'Hindi', emoji: '💖' },
  { id: 'punjabi', label: 'Punjabi', emoji: '🎸' },
  { id: 'english', label: 'English', emoji: '🌍' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectAlbum,
  onSelectPlaylist,
  onSelectArtist,
}) => {
  const { languages, setLanguages } = useSettingsStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  // Multi-language selection state initialized from store (defaults to Malayalam & Tamil)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
    return languages && languages.length > 0 ? languages : ['malayalam', 'tamil'];
  });

  const [sections, setSections] = useState<HomeFeedSection[]>(() => {
    return jioSaavnClient.getCuratedMultiLanguageFeed(languages && languages.length > 0 ? languages : ['malayalam', 'tamil']);
  });

  useEffect(() => {
    let mounted = true;

    const refreshFeed = () => {
      jioSaavnClient
        .getMultiLanguageHomeFeed(selectedLanguages)
        .then((data) => {
          if (mounted && data && data.length > 0) {
            setSections(data);
          }
        })
        .catch(() => {});
    };

    // Instant local curated feed
    setSections(jioSaavnClient.getCuratedMultiLanguageFeed(selectedLanguages));
    refreshFeed();

    // Auto-refresh feed periodically every 3 minutes for new releases
    const interval = setInterval(refreshFeed, 180000);

    // Auto-refresh when tab gains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshFeed();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [selectedLanguages]);

  // Clicking a selected language deselects it; clicking an unselected language selects it
  const handleToggleLanguage = (langId: string) => {
    let next: string[];
    if (selectedLanguages.includes(langId)) {
      // If already selected, deselect it
      next = selectedLanguages.filter((id) => id !== langId);
      // If none selected, default to this one so the feed is never empty
      if (next.length === 0) {
        next = [langId];
      }
    } else {
      // If not selected, add it
      next = [...selectedLanguages, langId];
    }
    setSelectedLanguages(next);
    setLanguages(next);
  };

  // Collect quick picks across all selected languages
  const quickPicks: Track[] = sections
    .flatMap((s) => s.items.filter((i): i is Track => 'duration' in i))
    .slice(0, 6);

  const selectedLabels = AVAILABLE_LANGUAGES
    .filter((l) => selectedLanguages.includes(l.id))
    .map((l) => l.label)
    .join(', ');

  return (
    <div className="p-6 sm:p-8 space-y-8 pb-28 select-none">
      {/* Clean Header & Simple Welcome */}
      <div className="space-y-1">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Good afternoon
        </h2>
        <p className="text-sm text-slate-400">
          Welcome to Kur Music. Pick your favorite music languages to start listening.
        </p>
      </div>

      {/* Multi-Language Filter Chips */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>Languages ({selectedLanguages.length} selected)</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Tap a selected language to deselect
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguages.includes(lang.id);
            return (
              <button
                key={lang.id}
                onClick={() => handleToggleLanguage(lang.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-1 ring-white/20 scale-105'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{lang.emoji}</span>
                <span>{lang.label}</span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Play 6-Grid */}
      {quickPicks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white font-display">
            Quick Picks {selectedLabels ? `(${selectedLabels})` : ''}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickPicks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, quickPicks)}
                  className="group flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-white/5 transition-all"
                >
                  <img
                    src={track.image}
                    alt={track.title}
                    className="w-14 h-14 rounded-lg object-cover bg-slate-900 shadow shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {track.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) togglePlay();
                      else playTrack(track, quickPicks);
                    }}
                    className={`mr-2 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 transition-all ${
                      isCurrent
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Horizontal Shelves / Carousels */}
      <div className="space-y-8">
        {sections.map((section) => (
          <HorizontalSection
            key={section.id}
            section={section}
            onSelectAlbum={onSelectAlbum}
            onSelectPlaylist={onSelectPlaylist}
            onSelectArtist={onSelectArtist}
          />
        ))}
      </div>
    </div>
  );
};
