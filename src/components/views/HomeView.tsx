import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Globe, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeFeedSection, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { useSettingsStore } from '../../stores/settings-store';
import { usePlayerStore } from '../../stores/player-store';
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

  const quickPicksRef = useRef<HTMLDivElement>(null);

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
      const scrollAmount = direction === 'left' ? -350 : 350;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Collect quick picks across all selected languages
  const quickPicks: Track[] = sections
    .flatMap((s) => s.items.filter((i): i is Track => 'duration' in i))
    .slice(0, 10);

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-36 sm:pb-28 max-w-7xl mx-auto select-none">
      {/* Clean Header & Simple Welcome */}
      <div className="space-y-1">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Good afternoon
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
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
        <section className="space-y-3 relative group/shelf">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
              Quick Picks
            </h3>
            <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
              <button
                onClick={() => scrollContainer(quickPicksRef, 'left')}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer(quickPicksRef, 'right')}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={quickPicksRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
          >
            {quickPicks.map((track) => (
              <div
                key={track.id}
                className="w-36 sm:w-44 md:w-48 shrink-0 snap-start select-none"
              >
                <SongCard track={track} queueContext={quickPicks} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Horizontal Shelves / Carousels (New Releases First) */}
      <div className="space-y-8">
        {[...sections]
          .sort((a, b) => {
            const aIsNew = a.id.includes('new_albums') || a.title.toLowerCase().includes('new release');
            const bIsNew = b.id.includes('new_albums') || b.title.toLowerCase().includes('new release');
            if (aIsNew && !bIsNew) return -1;
            if (!aIsNew && bIsNew) return 1;
            return 0;
          })
          .map((section) => (
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
