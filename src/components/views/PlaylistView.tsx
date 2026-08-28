import React, { useEffect, useState } from 'react';
import { Play, Pause, Heart, Clock, ListMusic, Loader2, Trash2 } from 'lucide-react';
import { Playlist, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';

interface PlaylistViewProps {
  playlistId: string;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId }) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { playlists, isLiked, toggleLike, removeFromPlaylist } = useLibraryStore();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Check if it is a local custom playlist first
    const customPl = playlists.find((p) => p.id === playlistId);
    if (customPl) {
      setPlaylist({
        id: customPl.id,
        title: customPl.name,
        subtitle: customPl.description,
        image: customPl.coverImage || 'https://placehold.co/500x500/161129/9333EA?text=Playlist',
        songCount: customPl.tracks.length,
        songs: customPl.tracks,
      });
      setLoading(false);
      return;
    }

    // Otherwise fetch from JioSaavn
    jioSaavnClient
      .getPlaylist(playlistId)
      .then((data) => {
        if (mounted) {
          setPlaylist(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [playlistId, playlists]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-purple-400 gap-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Playlist could not be loaded.</p>
      </div>
    );
  }

  const isCurrentPlaying =
    playlist.songs?.some((t) => t.id === currentTrack?.id) && isPlaying;

  const handlePlayPlaylist = () => {
    if (!playlist.songs || playlist.songs.length === 0) return;
    if (isCurrentPlaying) {
      togglePlay();
    } else {
      playTrack(playlist.songs[0], playlist.songs);
    }
  };

  const isCustom = playlistId.startsWith('pl_') || playlistId === 'favorites';

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 pb-28">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 shrink-0 border border-white/10">
          <img src={playlist.image} alt={playlist.title} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3 text-center sm:text-left min-w-0">
          <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">Playlist</p>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
            {playlist.title}
          </h1>
          {playlist.subtitle && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2">
              {playlist.subtitle}
            </p>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-400">
            <span>{playlist.songCount} tracks</span>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePlayPlaylist}
              className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xl shadow-purple-600/40 transform hover:scale-105 active:scale-95 transition-all"
            >
              {isCurrentPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  <span>Play All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist Table */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
          <span className="col-span-1">#</span>
          <span className="col-span-7 sm:col-span-8">Title</span>
          <span className="col-span-4 sm:col-span-3 text-right">
            <Clock className="w-4 h-4 ml-auto" />
          </span>
        </div>

        {playlist.songs?.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const liked = isLiked(track.id);

          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => playTrack(track, playlist.songs)}
              className={`group grid grid-cols-12 items-center px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20'
                  : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <div className="col-span-1 text-sm font-mono text-slate-500">{idx + 1}</div>

              <div className="col-span-7 sm:col-span-8 min-w-0 pr-2">
                <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                  {track.title}
                </h4>
                <p className="text-xs text-slate-400 truncate">{track.artist}</p>
              </div>

              <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-3 text-xs font-mono text-slate-400">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(track);
                  }}
                  className={`p-1 text-slate-400 hover:text-white ${liked ? 'text-pink-500' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                </button>
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(playlistId, track.id);
                    }}
                    title="Remove from playlist"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <span>{formatDuration(track.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
