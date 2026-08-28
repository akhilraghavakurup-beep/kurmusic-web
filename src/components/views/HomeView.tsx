import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, Disc, Radio, Loader2, Music2 } from 'lucide-react';
import { HomeFeedSection, Track, Album, Playlist } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { useSettingsStore } from '../../stores/settings-store';
import { SongCard } from '../cards/SongCard';
import { AlbumCard } from '../cards/AlbumCard';
import { PlaylistCard } from '../cards/PlaylistCard';

interface HomeViewProps {
  onSelectAlbum: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onSelectArtist: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectAlbum,
  onSelectPlaylist,
}) => {
  const { languages } = useSettingsStore();
  const [sections, setSections] = useState<HomeFeedSection[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6 sm:p-8 space-y-10 pb-28">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-pink-900/40 p-6 sm:p-10 border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-300 border border-purple-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lossless Streaming & CarPlay Ready</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
            {getGreeting()}
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Stream high-fidelity music on your laptop or iPhone, with seamless background playback and lockscreen / CarPlay dashboard controls.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-purple-400 gap-3">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Loading your feed...</p>
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
