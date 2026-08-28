import React, { useEffect, useState } from 'react';
import { Play, Pause, Globe } from 'lucide-react';
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

  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return languages[0] || 'malayalam';
  });

  const [sections, setSections] = useState<HomeFeedSection[]>(() => {
    return jioSaavnClient.getCuratedFeedForLanguage(languages[0] || 'malayalam');
  });

  useEffect(() => {
    let mounted = true;
    // Set immediate cached/curated feed
    setSections(jioSaavnClient.getCuratedFeedForLanguage(selectedLanguage));

    // Load full real JioSaavn API feed
    jioSaavnClient
      .getHomeFeed(selectedLanguage)
      .then((data) => {
        if (mounted && data && data.length > 0) {
          setSections(data);
        }
      })
      .catch(() => {
        // Fallback already active
      });

    return () => {
      mounted = false;
    };
  }, [selectedLanguage]);

  const handleLanguageChange = (langId: string) => {
    setSelectedLanguage(langId);
    setLanguages([langId, ...languages.filter((l) => l !== langId)]);
  };

  const quickPicks: Track[] = (sections[0]?.items || [])
    .filter((i): i is Track => 'duration' in i)
    .slice(0, 6);

  return (
    <div className="p-6 sm:p-8 space-y-8 pb-28 select-none">
      {/* Clean Header & Simple Welcome */}
      <div className="space-y-1">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Good afternoon
        </h2>
        <p className="text-sm text-slate-400">
          Welcome to Kur Music. Pick your favorite music language to start listening.
        </p>
      </div>

      {/* Language Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>Select Language Feed</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isActive = selectedLanguage.toLowerCase() === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 scale-105'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{lang.emoji}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Play 6-Grid */}
      {quickPicks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white font-display capitalize">
            Quick Picks in {selectedLanguage}
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
