import React, { useState } from 'react';
import { Heart, ListMusic, History, Plus, Play, Music } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store';
import { usePlayerStore } from '../../stores/player-store';
import { SongCard } from '../cards/SongCard';

interface LibraryViewProps {
  onSelectPlaylist: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectPlaylist }) => {
  const { likedTracks, playlists, recentTracks, createPlaylist } = useLibraryStore();
  const { playTrack } = usePlayerStore();
  const [tab, setTab] = useState<'liked' | 'playlists' | 'recent'>('liked');

  const handleCreate = () => {
    const name = prompt('New Playlist Name:');
    if (name) {
      const id = createPlaylist(name);
      onSelectPlaylist(id);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 pb-28">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Your Library
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Liked tracks, custom playlists, and recent listening history
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setTab('liked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'liked'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Songs ({likedTracks.length})</span>
        </button>

        <button
          onClick={() => setTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'playlists'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setTab('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'recent'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Recently Played ({recentTracks.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'liked' && (
        likedTracks.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600 mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-200">No liked songs yet</h4>
            <p className="text-xs sm:text-sm">Click the heart icon on any song to save it here for fast access.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {likedTracks.map((track) => (
              <SongCard key={track.id} track={track} queueContext={likedTracks} />
            ))}
          </div>
        )
      )}

      {tab === 'playlists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="p-4 rounded-2xl glass-card cursor-pointer group"
            >
              <div className="aspect-square w-full rounded-xl bg-slate-800/80 mb-3 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform overflow-hidden">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                ) : (
                  <ListMusic className="w-12 h-12" />
                )}
              </div>
              <h4 className="text-sm font-semibold text-white truncate">{pl.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{pl.tracks.length} tracks</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'recent' && (
        recentTracks.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>No listening history yet. Start listening to build your queue!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recentTracks.map((track) => (
              <SongCard key={track.id} track={track} queueContext={recentTracks} />
            ))}
          </div>
        )
      )}
    </div>
  );
};
