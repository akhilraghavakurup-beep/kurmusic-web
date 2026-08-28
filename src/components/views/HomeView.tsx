import React, { useEffect, useState } from "react";
import { Sparkles, Loader2, Play, Pause, Globe } from "lucide-react";
import { HomeFeedSection, Track, Album, Playlist, Artist } from "../../api/types";
import { jioSaavnClient } from "../../api/jiosaavn-client";
import { useSettingsStore } from "../../stores/settings-store";
import { usePlayerStore } from "../../stores/player-store";
import { SongCard } from "../cards/SongCard";
import { AlbumCard } from "../cards/AlbumCard";
import { PlaylistCard } from "../cards/PlaylistCard";
import { ArtistCard } from "../cards/ArtistCard";

interface HomeViewProps {
  onSelectAlbum: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onSelectArtist: (id: string) => void;
}

const AVAILABLE_LANGUAGES = [
  { id: "malayalam", label: "Malayalam", emoji: "🌴" },
  { id: "tamil", label: "Tamil", emoji: "🔥" },
  { id: "telugu", label: "Telugu", emoji: "⚡" },
  { id: "hindi", label: "Hindi", emoji: "💖" },
  { id: "punjabi", label: "Punjabi", emoji: "🎸" },
  { id: "english", label: "English", emoji: "🌍" },
];

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectAlbum,
  onSelectPlaylist,
  onSelectArtist,
}) => {
  const { languages, toggleLanguage, setLanguages } = useSettingsStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  // Active primary language defaults to user preferred or malayalam
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return languages[0] || "malayalam";
  });

  // Initialize with instant local curated feed so ZERO loading delay
  const [sections, setSections] = useState<HomeFeedSection[]>(() => {
    return jioSaavnClient.getCuratedFeedForLanguage(languages[0] || "malayalam");
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Instantly set language-curated feed so user never waits
    setSections(jioSaavnClient.getCuratedFeedForLanguage(selectedLanguage));

    // In background, revalidate with live API
    jioSaavnClient
      .getHomeFeed(selectedLanguage)
      .then((data) => {
        if (mounted && data && data.length > 0) {
          setSections(data);
        }
      })
      .catch(() => {
        // Fallback already rendered, do nothing
      });

    return () => {
      mounted = false;
    };
  }, [selectedLanguage]);

  const handleLanguageChange = (langId: string) => {
    setSelectedLanguage(langId);
    setLanguages([langId, ...languages.filter((l) => l !== langId)]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const quickPicks: Track[] = (sections[0]?.items || [])
    .filter((i): i is Track => "duration" in i)
    .slice(0, 6);

  return (
    <div className="p-6 sm:p-8 space-y-9 pb-28 select-none">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-purple-900/40 to-pink-950/40 p-6 sm:p-10 border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-300 border border-purple-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lossless 320kbps Audio • Instant Language Feeds • CarPlay & Lockscreen Sync</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
            {getGreeting()}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Stream high-fidelity songs on iPhone or laptop with background playback, offline downloads, and car steering wheel controls.
          </p>
        </div>
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
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40 scale-105"
                    : "bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
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
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 hover:scale-105"
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

      {/* Feed Sections */}
      {sections.map((section) => (
        <section key={section.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight font-display">
                {section.title}
              </h3>
              {section.subtitle && (
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{section.subtitle}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {section.items.map((item, idx) => {
              if ("duration" in item) {
                return (
                  <SongCard
                    key={`${item.id}-${idx}`}
                    track={item as Track}
                    queueContext={section.items.filter((i): i is Track => "duration" in i)}
                  />
                );
              } else if ("followerCount" in item || "role" in item) {
                return (
                  <ArtistCard
                    key={`${item.id}-${idx}`}
                    artist={item as Artist}
                    onClick={() => onSelectArtist(item.id)}
                  />
                );
              } else if ("songCount" in item && !("artist" in item)) {
                return (
                  <PlaylistCard
                    key={`${item.id}-${idx}`}
                    playlist={item as Playlist}
                    onClick={() => onSelectPlaylist(item.id)}
                  />
                );
              } else {
                return (
                  <AlbumCard
                    key={`${item.id}-${idx}`}
                    album={item as Album}
                    onClick={() => onSelectAlbum(item.id)}
                  />
                );
              }
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
