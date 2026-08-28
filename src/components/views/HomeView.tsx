import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Globe, Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeFeedSection, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { useSettingsStore } from '../../stores/settings-store';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';
import { HorizontalSection } from '../home/HorizontalSection';
import { SongCard } from '../cards/SongCard';

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
  const { getTopPlayedTracks, totalMinutesListened } = useLibraryStore();

  const quickPicksRef = useRef<HTMLDivElement>(null);
  const rewindRef = useRef<HTMLDivElement>(null);

  // Multi-language selection state initialized from store (defaults to Malayalam & Tamil)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
    return languages && languages.length > 0 ? languages : ['malayalam', 'tamil'];
  });

  const [sections, setSections] = useState<HomeFeedSection[]>(() => {
    return jioSaavnClient.getCuratedMultiLanguageFeed(
      languages && languages.length > 0 ? languages : ['malayalam', 'tamil']
    );
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
      next = selectedLanguages.filter((id) => id !== langId);
      if (next.length === 0) {
        next = [langId];
      }
    } else {
      next = [...selectedLanguages, langId];
    }
    setSelectedLanguages(next);
    setLanguages(next);
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Collect quick picks across all selected languages
  const quickPicks: Track[] = sections
    .flatMap((s) => s.items.filter((i): i is Track => 'duration' in i))
    .slice(0, 10);

  // Top played tracks from Kur Rewind
  const topPlayed = getTopPlayedTracks(10);

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

      {/* Horizontal Quick Picks Shelf */}
      {quickPicks.length > 0 && (
        <section className="space-y-3 relative group/quick">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-display">
              Quick Picks {selectedLabels ? `(${selectedLabels})` : ''}
            </h3>
            <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover/quick:opacity-100 transition-opacity">
              <button
                onClick={() => scrollContainer(quickPicksRef, 'left')}
                aria-label="Scroll left"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer(quickPicksRef, 'right')}
                aria-label="Scroll right"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={quickPicksRef}
            className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
          >
            {quickPicks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, quickPicks)}
                  className="w-64 sm:w-72 shrink-0 snap-start group flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-white/5 transition-all shadow-sm"
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
                    className={`mr-2 w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 transition-all ${
                      isCurrent
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Most Played • Kur Rewind Horizontal Carousel */}
      {topPlayed.length > 0 && (
        <section className="space-y-3 relative group/rewind">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Kur Rewind
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
                  Most Played
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your personal favorites • {totalMinutesListened} minutes of music listened
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => playTrack(topPlayed[0], topPlayed)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Daily Mix</span>
              </button>
              <div className="hidden sm:flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/rewind:opacity-100 transition-opacity">
                <button
                  onClick={() => scrollContainer(rewindRef, 'left')}
                  aria-label="Scroll left"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollContainer(rewindRef, 'right')}
                  aria-label="Scroll right"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={rewindRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
          >
            {topPlayed.map((track, idx) => (
              <div
                key={`rewind-${track.id}-${idx}`}
                className="w-36 sm:w-44 md:w-48 shrink-0 snap-start relative group/card"
              >
                <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-extrabold text-purple-300 border border-purple-500/30 shadow-md">
                  #{idx + 1}
                </div>
                <SongCard track={track} queueContext={topPlayed} />
              </div>
            ))}
          </div>
        </section>
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
