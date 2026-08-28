import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, Disc, Radio, Loader2, Music2, Play, Pause, Heart } from 'lucide-react';
import { HomeFeedSection, Track, Album, Playlist, Artist } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { useSettingsStore } from '../../stores/settings-store';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';
import { SongCard } from '../cards/SongCard';
import { AlbumCard } from '../cards/AlbumCard';
import { PlaylistCard } from '../cards/PlaylistCard';
import { ArtistCard } from '../cards/ArtistCard';

interface HomeViewProps {
  onSelectAlbum: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onSelectArtist: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectAlbum,
  onSelectPlaylist,
  onSelectArtist,
}) => {
  const { languages } = useSettingsStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  const [sections, setSections] = useState<HomeFeedSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMood, setActiveMood] = useState('All');

  const moods = [
    'All',
    '🔥 Trending',
    '❤️ Romance',
    '🎉 Party',
    '☕ Chill & Lo-Fi',
    '⚡ Workout',
    '📻 Retro 90s',
  ];

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    jioSaavnClient
      .getHomeFeed(languages.join(','))
      .then((data) => {
        if (mounted) {
          setSections(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Home feed error:', err);
        if (mounted) {
          setSections(jioSaavnClient.getFallbackSeedFeed());
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [languages]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Extract quick pick tracks from the first section
  const quickPicks: Track[] = (sections[0]?.items || [])
    .filter((i) => 'duration' in i)
    .slice(0, 6) as Track[];

  return (
    <div className="p-6 sm:p-8 space-y-10 pb-28 select-none">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-purple-900/40 to-pink-950/40 p-6 sm:p-10 border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-300 border border-purple-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lossless 320kbps Audio • CarPlay & Background Sync</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
            {getGreeting()}
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Stream high-fidelity music on your laptop or iPhone, with seamless background playback, CarPlay steering wheel controls, and lockscreen sync.
          </p>
        </div>
      </div>

      {/* Mood / Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {moods.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMood(m)}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shrink-0 ${
              activeMood === m
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Quick Play Grid (Spotify-style 6 shortcuts) */}
      {quickPicks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white font-display">Quick Picks</h3>
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

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-purple-400 gap-3">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Loading your music feed...</p>
        </div>
      ) : (
        sections.map((section) => (
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

            {/* Grid display */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {section.items.map((item, idx) => {
                if ('duration' in item) {
                  return (
                    <SongCard
                      key={`${item.id}-${idx}`}
                      track={item as Track}
                      queueContext={section.items.filter((i) => 'duration' in i) as Track[]}
                    />
                  );
                } else if ('name' in item) {
                  return (
                    <ArtistCard
                      key={`${item.id}-${idx}`}
                      artist={item as Artist}
                      onClick={() => onSelectArtist(item.id)}
                    />
                  );
                } else if ('songCount' in item && !('artist' in item)) {
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
        ))
      )}
    </div>
  );
};
