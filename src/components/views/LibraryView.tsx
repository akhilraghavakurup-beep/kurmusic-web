import React, { useRef } from 'react';
import { Heart, ListMusic, History, Plus, Play, Sparkles, ChevronLeft, ChevronRight, Headphones } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store';
import { usePlayerStore } from '../../stores/player-store';
import { SongCard } from '../cards/SongCard';

interface LibraryViewProps {
  onSelectPlaylist: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectPlaylist }) => {
  const { likedTracks, playlists, recentTracks, createPlaylist, getTopPlayedTracks, totalMinutesListened } = useLibraryStore();
  const { playTrack } = usePlayerStore();

  const likedRef = useRef<HTMLDivElement>(null);
  const playlistsRef = useRef<HTMLDivElement>(null);
  const rewindRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);

  const topPlayed = getTopPlayedTracks(12);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleCreate = () => {
    const name = prompt('New Playlist Name:');
    if (name) {
      const id = createPlaylist(name);
      onSelectPlaylist(id);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-10 pb-28 select-none">
      {/* Top Banner with Kur Rewind Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-gradient-to-br from-purple-900/40 via-purple-950/20 to-slate-900 border border-purple-500/20 backdrop-blur-xl shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kur Rewind Stats</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Your Personal Music Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Track your favorite songs, curated playlists, and personal listening history.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Headphones className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <p className="text-2xl font-extrabold text-white leading-tight font-display">
                {totalMinutesListened}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Minutes Listened
              </p>
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* 1. Kur Rewind • Most Played (Horizontal Scrollable) */}
      {topPlayed.length > 0 && (
        <section className="space-y-4 relative group/shelf">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
              <h3 className="text-xl font-bold text-white font-display">
                Most Played • Kur Rewind
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                {topPlayed.length} tracks
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => playTrack(topPlayed[0], topPlayed)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play All</span>
              </button>
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
                <button
                  onClick={() => scrollContainer(rewindRef, 'left')}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollContainer(rewindRef, 'right')}
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
                key={`lib-rewind-${track.id}-${idx}`}
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

      {/* 2. Liked Songs (Horizontal Scrollable) */}
      <section className="space-y-4 relative group/shelf">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-current" />
            <h3 className="text-xl font-bold text-white font-display">
              Liked Songs
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
              {likedTracks.length}
            </span>
          </div>

          {likedTracks.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => playTrack(likedTracks[0], likedTracks)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-600/80 hover:bg-pink-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play All</span>
              </button>
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
                <button
                  onClick={() => scrollContainer(likedRef, 'left')}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollContainer(likedRef, 'right')}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {likedTracks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center text-slate-400 space-y-2">
            <Heart className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No liked songs yet</p>
            <p className="text-xs">Click the heart icon on any track to save it here.</p>
          </div>
        ) : (
          <div
            ref={likedRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
          >
            {likedTracks.map((track) => (
              <div key={track.id} className="w-36 sm:w-44 md:w-48 shrink-0 snap-start">
                <SongCard track={track} queueContext={likedTracks} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Custom Playlists (Horizontal Scrollable) */}
      <section className="space-y-4 relative group/shelf">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white font-display">
              Your Playlists
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              {playlists.length}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
            <button
              onClick={() => scrollContainer(playlistsRef, 'left')}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollContainer(playlistsRef, 'right')}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={playlistsRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
        >
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="w-36 sm:w-44 md:w-48 shrink-0 snap-start p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer group transition-all"
            >
              <div className="aspect-square w-full rounded-xl bg-slate-900 mb-3 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform overflow-hidden shadow-md">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                ) : (
                  <ListMusic className="w-10 h-10" />
                )}
              </div>
              <h4 className="text-sm font-semibold text-white truncate">{pl.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{pl.tracks.length} tracks</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recently Played (Horizontal Scrollable) */}
      {recentTracks.length > 0 && (
        <section className="space-y-4 relative group/shelf">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-bold text-white font-display">
                Recently Played
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                {recentTracks.length}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
              <button
                onClick={() => scrollContainer(recentRef, 'left')}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer(recentRef, 'right')}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={recentRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
          >
            {recentTracks.map((track) => (
              <div key={`recent-${track.id}`} className="w-36 sm:w-44 md:w-48 shrink-0 snap-start">
                <SongCard track={track} queueContext={recentTracks} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
