import React, { useEffect, useState } from 'react';
import { Play, Pause, Heart, Clock, Disc, Loader2, Music2 } from 'lucide-react';
import { Album, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';

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
    <div className="p-6 sm:p-8 space-y-8 pb-28">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 shrink-0 border border-white/10">
          <img src={album.image} alt={album.title} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3 text-center sm:text-left min-w-0">
          <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">Album</p>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
            {album.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-300">
            <span className="font-semibold text-white">{album.artist}</span>
            {album.year && <span>• {album.year}</span>}
            <span>• {album.songCount} songs</span>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePlayAlbum}
              className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xl shadow-purple-600/40 transform hover:scale-105 active:scale-95 transition-all"
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
      <div className="space-y-2">
        <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
          <span className="col-span-1">#</span>
          <span className="col-span-7 sm:col-span-8">Title</span>
          <span className="col-span-4 sm:col-span-3 text-right">
            <Clock className="w-4 h-4 ml-auto" />
          </span>
        </div>

        {album.songs?.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const liked = isLiked(track.id);

          return (
            <div
              key={track.id}
              onClick={() => playTrack(track, album.songs)}
              className={`group grid grid-cols-12 items-center px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20'
                  : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <div className="col-span-1 text-sm font-mono text-slate-500">
                {isCurrent && isPlaying ? (
                  <div className="w-4 h-4 flex items-center justify-center text-purple-400">
                    <Music2 className="w-4 h-4 animate-bounce" />
                  </div>
                ) : (
                  idx + 1
                )}
              </div>

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
                <span>{formatDuration(track.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
