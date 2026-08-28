import React, { useEffect, useState } from 'react';
import { Play, Pause, Heart, Clock, ListMusic, Loader2, Trash2, Music2 } from 'lucide-react';
import { Playlist, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';
import { TrackRowActions } from '../common/TrackRowActions';

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
      .then(async (data) => {
        if (!mounted) return;
        if (data && data.songs && data.songs.length > 0) {
          setPlaylist(data);
          setLoading(false);
          return;
        }

        // Try getting it as an album
        const albumData = await jioSaavnClient.getAlbum(playlistId);
        if (!mounted) return;
        if (albumData && albumData.songs && albumData.songs.length > 0) {
          setPlaylist({
            id: albumData.id,
            title: albumData.title,
            subtitle: albumData.artist,
            image: albumData.image,
            songCount: albumData.songCount,
            songs: albumData.songs,
          });
          setLoading(false);
          return;
        }

        setPlaylist(null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setPlaylist(null);
        setLoading(false);
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
    <div className="p-4 sm:p-8 space-y-8 pb-36 sm:pb-28 max-w-7xl mx-auto select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 shrink-0 border border-white/10">
          <img src={playlist.image} alt={playlist.title} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3 text-center sm:text-left min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/20 text-xs font-semibold text-purple-300 border border-purple-500/30">
            <ListMusic className="w-3.5 h-3.5" />
            <span>Playlist</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display break-words">
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xl shadow-purple-600/40 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="w-5 sm:w-6 text-center">#</span>
            <span>Title</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-right mr-16">Actions</span>
            <Clock className="w-4 h-4 mr-1" />
          </div>
        </div>

        {playlist.songs?.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;

          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => playTrack(track, playlist.songs)}
              className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20 shadow-sm'
                  : 'hover:bg-white/5 text-slate-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-2">
                <span className="w-5 sm:w-6 text-center text-xs sm:text-sm font-mono text-slate-500 shrink-0">
                  {isCurrent && isPlaying ? (
                    <Music2 className="w-4 h-4 text-purple-400 animate-bounce mx-auto" />
                  ) : (
                    idx + 1
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                    {track.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <TrackRowActions track={track} />
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(playlistId, track.id);
                    }}
                    title="Remove from playlist"
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer rounded-full hover:bg-white/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs text-slate-400 font-mono w-10 text-right shrink-0">
                  {formatDuration(track.duration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
