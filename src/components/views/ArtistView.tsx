import React, { useEffect, useState } from 'react';
import { User, Play, Pause, Heart, Loader2 } from 'lucide-react';
import { Artist, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { usePlayerStore } from '../../stores/player-store';
import { SongCard } from '../cards/SongCard';
import { AlbumCard } from '../cards/AlbumCard';

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

  return (
    <div className="p-6 sm:p-8 space-y-10 pb-28">
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xl shadow-purple-600/40 transform hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>Play Popular</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Tracks */}
      {artist.topSongs && artist.topSongs.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">Popular Tracks</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artist.topSongs.slice(0, 10).map((track) => (
              <SongCard key={track.id} track={track} queueContext={artist.topSongs} />
            ))}
          </div>
        </section>
      )}

      {/* Discography / Albums */}
      {artist.topAlbums && artist.topAlbums.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">Discography</h3>
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
