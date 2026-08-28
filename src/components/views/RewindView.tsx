import React from 'react';
import { Sparkles, Play, Headphones, Flame, Trophy, Music, Clock } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store';
import { usePlayerStore } from '../../stores/player-store';
import { Track } from '../../api/types';

interface RewindViewProps {
  onSelectAlbum?: (id: string) => void;
  onSelectArtist?: (id: string) => void;
}

export const RewindView: React.FC<RewindViewProps> = () => {
  const { getTopPlayedTracks, totalMinutesListened, playCounts } = useLibraryStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const topTracks = getTopPlayedTracks(20);
  const totalPlays = Object.values(playCounts || {}).reduce((acc, cur) => acc + (cur.count || 0), 0);

  // Group top artists from play history
  const artistCounts: Record<string, { count: number; image?: string }> = {};
  Object.values(playCounts || {}).forEach(({ track, count }) => {
    const primaryArtist = track.artist.split(',')[0].trim();
    if (!artistCounts[primaryArtist]) {
      artistCounts[primaryArtist] = { count: 0, image: track.image };
    }
    artistCounts[primaryArtist].count += count;
  });

  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayDailyMix = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-10 pb-28 select-none max-w-7xl mx-auto">
      {/* Hero Analytics Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/60 via-pink-900/30 to-[#0d0a1f] border border-purple-500/30 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kur Rewind</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Your Personal Rewind
            </h2>
            <p className="text-sm text-slate-300 max-w-lg">
              Every beat, repeat, and favorite track you stream powers your personalized listening analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
              <Headphones className="w-8 h-8 text-purple-400 shrink-0" />
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-display">
                  {totalMinutesListened}
                </p>
                <p className="text-[11px] text-slate-300 font-medium">Minutes Listened</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
              <Flame className="w-8 h-8 text-pink-400 shrink-0" />
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-display">
                  {totalPlays}
                </p>
                <p className="text-[11px] text-slate-300 font-medium">Total Streams</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Mix Launcher */}
        {topTracks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">Your Daily Rewind Mix</h4>
              <p className="text-xs text-slate-400">Queue up all your top played tracks in one click</p>
            </div>
            <button
              onClick={handlePlayDailyMix}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Daily Mix</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Artists Row */}
      {topArtists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-bold text-white font-display">Your Top Artists</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topArtists.map(([artistName, data], idx) => (
              <div
                key={artistName}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center flex flex-col items-center gap-2 group hover:bg-white/10 transition-all"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg bg-slate-900 border-2 border-purple-500/30 group-hover:scale-105 transition-transform">
                  <img
                    src={data.image || 'https://placehold.co/500x500/161129/9333EA?text=Artist'}
                    alt={artistName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-purple-600 text-white text-[11px] font-extrabold flex items-center justify-center shadow">
                    #{idx + 1}
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white truncate max-w-full">{artistName}</h4>
                <span className="text-[11px] text-slate-400">{data.count} plays</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Most Played Tracks Vertical Ranked List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white font-display">Most Played Songs</h3>
          </div>
          <span className="text-xs text-slate-400">{topTracks.length} ranked tracks</span>
        </div>

        {topTracks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/5">
            <Headphones className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-200">No stream history yet</p>
            <p className="text-xs">Start playing songs on Kur Music to generate your personal Rewind chart!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const count = playCounts[track.id]?.count || 1;

              return (
                <div
                  key={`rewind-list-${track.id}`}
                  onClick={() => playTrack(track, topTracks)}
                  className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-600/20 border-purple-500/40 shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Rank Badge */}
                    <span
                      className={`w-7 text-center font-extrabold text-sm ${
                        idx === 0
                          ? 'text-amber-400 text-base'
                          : idx === 1
                          ? 'text-slate-300 text-base'
                          : idx === 2
                          ? 'text-amber-600 text-base'
                          : 'text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Artwork with play overlay */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow shrink-0 bg-slate-900">
                      <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 h-full bg-purple-400 animate-pulse" />
                            <span className="w-0.5 h-2/3 bg-purple-400 animate-pulse" />
                            <span className="w-0.5 h-full bg-purple-400 animate-pulse" />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Title & Artist */}
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-purple-400' : 'text-white group-hover:text-purple-300'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>

                  {/* Play count & duration */}
                  <div className="flex items-center gap-6 shrink-0 text-right ml-4">
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20">
                      {count} plays
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
