import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2, Music2, Disc, User, ListMusic } from 'lucide-react';
import { SearchResults, Track, Album, Artist, Playlist } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { SongCard } from '../cards/SongCard';
import { AlbumCard } from '../cards/AlbumCard';
import { ArtistCard } from '../cards/ArtistCard';
import { PlaylistCard } from '../cards/PlaylistCard';

interface SearchViewProps {
  query: string;
  onSelectAlbum: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onSelectArtist: (id: string) => void;
}

type FilterCategory = 'all' | 'songs' | 'albums' | 'artists' | 'playlists';

export const SearchView: React.FC<SearchViewProps> = ({
  query,
  onSelectAlbum,
  onSelectPlaylist,
  onSelectArtist,
}) => {
  const [results, setResults] = useState<SearchResults>({
    tracks: [],
    albums: [],
    artists: [],
    playlists: [],
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tracks: [], albums: [], artists: [], playlists: [] });
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const timer = setTimeout(() => {
      jioSaavnClient
        .search(query)
        .then((data) => {
          if (mounted) {
            setResults(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) setLoading(false);
        });
    }, 350);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const hasAnyResults =
    results.tracks.length > 0 ||
    results.albums.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0;

  const quickSearches = [
    'Arijit Singh',
    'Anirudh Ravichander',
    'Shreya Ghoshal',
    'Sid Sriram',
    'Diljit Dosanjh',
    'Taylor Swift',
    'Weeknd',
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 pb-28">
      {/* Category Filter Chips */}
      {query.trim() && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(['all', 'songs', 'albums', 'artists', 'playlists'] as FilterCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-purple-400 gap-3">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Searching catalog...</p>
        </div>
      ) : !query.trim() ? (
        /* Empty State: Suggestions */
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white font-display">Popular Searches</h3>
          <div className="flex flex-wrap gap-2.5">
            {quickSearches.map((s) => (
              <button
                key={s}
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) {
                    input.value = s;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-slate-300 hover:text-white border border-white/5 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : !hasAnyResults ? (
        <div className="text-center py-24 text-slate-400 space-y-2">
          <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <h4 className="text-lg font-bold text-slate-200">No results found</h4>
          <p className="text-sm">We couldn't find any songs matching "{query}". Try a different spelling or keyword.</p>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-10">
          {/* Songs */}
          {(filter === 'all' || filter === 'songs') && results.tracks.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music2 className="w-4 h-4 text-purple-400" />
                <span>Songs</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.tracks.map((track) => (
                  <SongCard key={track.id} track={track} queueContext={results.tracks} />
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {(filter === 'all' || filter === 'albums') && results.albums.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Disc className="w-4 h-4 text-purple-400" />
                <span>Albums</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onClick={() => onSelectAlbum(album.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {(filter === 'all' || filter === 'artists') && results.artists.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                <span>Artists</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onClick={() => onSelectArtist(artist.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {(filter === 'all' || filter === 'playlists') && results.playlists.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-purple-400" />
                <span>Playlists</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.playlists.map((pl) => (
                  <PlaylistCard
                    key={pl.id}
                    playlist={pl}
                    onClick={() => onSelectPlaylist(pl.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
