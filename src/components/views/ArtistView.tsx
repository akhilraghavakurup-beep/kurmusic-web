import React, { useEffect, useState } from 'react';
import { User, Play, Pause, Loader2 } from 'lucide-react';
import { Artist, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { usePlayerStore } from '../../stores/player-store';
import { AlbumCard } from '../cards/AlbumCard';
import { TrackRowActions } from '../common/TrackRowActions';

interface ArtistViewProps {
  artistId: string;
  onSelectAlbum: (id: string) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artistId, onSelectAlbum }) => {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    jioSaavnClient
      .getArtist(artistId)
      .then((data) => {
        if (mounted) {
          setArtist(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-purple-400 gap-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Loading artist profile...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Artist could not be loaded.</p>
      </div>
    );
  }

  const handlePlayTopSongs = () => {
    if (!artist.topSongs || artist.topSongs.length === 0) return;
    playTrack(artist.topSongs[0], artist.topSongs);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-8 space-y-10 pb-36 sm:pb-28 max-w-7xl mx-auto select-none">
      {/* Artist Hero Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-2xl bg-slate-900 shrink-0 border-2 border-purple-500/40">
          <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3 text-center sm:text-left min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/20 text-xs font-semibold text-purple-300 border border-purple-500/30">
            <User className="w-3.5 h-3.5" />
            <span>Verified Artist</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-display">
            {artist.name}
          </h1>
          {artist.followerCount && (
            <p className="text-xs sm:text-sm text-slate-400">
              {Number(artist.followerCount).toLocaleString()} monthly listeners
            </p>
          )}

          {artist.topSongs && artist.topSongs.length > 0 && (
            <div className="pt-2">
              <button
                onClick={handlePlayTopSongs}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xl shadow-purple-600/40 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>Play Popular</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Tracks Tracklist */}
      {artist.topSongs && artist.topSongs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xl font-bold text-white font-display">Popular Tracks</h3>
            <span className="text-xs text-slate-400 font-normal">
              Top {Math.min(artist.topSongs.length, 10)} songs
            </span>
          </div>

          <div className="space-y-1.5">
            {artist.topSongs.slice(0, 10).map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, artist.topSongs)}
                  className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-600/20 border-purple-500/40 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <span className="w-5 text-center text-xs text-slate-500 font-mono">
                      {idx + 1}
                    </span>

                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow shrink-0 bg-slate-900">
                      <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-current" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-purple-400' : 'text-white group-hover:text-purple-300'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{track.album || track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-4">
                    <TrackRowActions track={track} />
                    <span className="text-xs text-slate-400 font-mono w-10 text-right">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Discography / Albums */}
      {artist.topAlbums && artist.topAlbums.length > 0 && (
        <section className="space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-xl font-bold text-white font-display">Discography</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artist.topAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} onClick={() => onSelectAlbum(album.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
