import React, { useEffect, useState } from 'react';
import { Play, Pause, Heart, Clock, Disc, Loader2, Music2 } from 'lucide-react';
import { Album, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';
import { TrackRowActions } from '../common/TrackRowActions';

interface AlbumViewProps {
  albumId: string;
  onSelectArtist?: (id: string) => void;
}

export const AlbumView: React.FC<AlbumViewProps> = ({ albumId, onSelectArtist }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    jioSaavnClient
      .getAlbum(albumId)
      .then((data) => {
        if (mounted) {
          setAlbum(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [albumId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-purple-400 gap-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Loading album details...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Album could not be loaded.</p>
      </div>
    );
  }

  const isCurrentAlbumPlaying =
    album.songs?.some((t) => t.id === currentTrack?.id) && isPlaying;

  const handlePlayAlbum = () => {
    if (!album.songs || album.songs.length === 0) return;
    if (isCurrentAlbumPlaying) {
      togglePlay();
    } else {
      playTrack(album.songs[0], album.songs);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-36 sm:pb-28 max-w-7xl mx-auto select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
        <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 shrink-0 border border-white/10">
          <img src={album.image} alt={album.title} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3 text-center sm:text-left min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/20 text-xs font-semibold text-purple-300 border border-purple-500/30">
            <Disc className="w-3.5 h-3.5" />
            <span>Album</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display break-words">
            {album.title}
          </h1>
          <p
            onClick={() => album.artistId && onSelectArtist?.(album.artistId)}
            className={`text-sm sm:text-base text-slate-300 font-medium ${
              album.artistId ? 'hover:text-purple-400 cursor-pointer underline-offset-4 hover:underline' : ''
            }`}
          >
            {album.artist}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
            <span>{album.year || '2024'}</span>
            <span>•</span>
            <span>{album.songCount || album.songs?.length || 0} songs</span>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePlayAlbum}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xl shadow-purple-600/40 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isCurrentAlbumPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  <span>Play Album</span>
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

        {album.songs?.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;

          return (
            <div
              key={track.id}
              onClick={() => playTrack(track, album.songs)}
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
