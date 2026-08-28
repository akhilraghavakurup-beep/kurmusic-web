import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Loader2, Music2, Disc, User, ListMusic, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchResults } from '../../api/types';
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

  const songsRef = useRef<HTMLDivElement>(null);
  const albumsRef = useRef<HTMLDivElement>(null);
  const artistsRef = useRef<HTMLDivElement>(null);
  const playlistsRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

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

  const categories: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: `Songs (${results.tracks.length})` },
    { id: 'albums', label: `Albums (${results.albums.length})` },
    { id: 'artists', label: `Artists (${results.artists.length})` },
    { id: 'playlists', label: `Playlists (${results.playlists.length})` },
  ];

  const quickSearches = [
    'Aavesham',
    'Manjummel Boys',
    'Premalu',
    'Anirudh Ravichander',
    'Sushin Shyam',
    'Leo',
    'Jailer',
    'Illuminati',
    'Kuthanthram',
  ];

  const hasAnyResults =
    results.tracks.length > 0 ||
    results.albums.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0;

  return (
    <div className="p-6 sm:p-8 space-y-8 pb-28 select-none">
      {/* Category Pills */}
      {query.trim() && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
                filter === c.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-white/20'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-purple-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Searching Kur Music catalog...</p>
        </div>
      ) : !query.trim() ? (
        <div className="space-y-4">
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
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-slate-300 hover:text-white border border-white/5 transition-all cursor-pointer"
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
        /* Results Section (Horizontal Shelves) */
        <div className="space-y-10">
          {/* Songs (Horizontal Scrollable) */}
          {(filter === 'all' || filter === 'songs') && results.tracks.length > 0 && (
            <section className="space-y-4 relative group/shelf">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                  <Music2 className="w-4 h-4 text-purple-400" />
                  <span>Songs</span>
                  <span className="text-xs text-slate-400 font-normal">({results.tracks.length})</span>
                </h3>
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
                  <button
                    onClick={() => scrollContainer(songsRef, 'left')}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollContainer(songsRef, 'right')}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div
                ref={songsRef}
                className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
              >
                {results.tracks.map((track) => (
                  <div key={track.id} className="w-36 sm:w-44 md:w-48 shrink-0 snap-start">
                    <SongCard track={track} queueContext={results.tracks} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums (Horizontal Scrollable) */}
          {(filter === 'all' || filter === 'albums') && results.albums.length > 0 && (
            <section className="space-y-4 relative group/shelf">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                  <Disc className="w-4 h-4 text-purple-400" />
                  <span>Albums</span>
                  <span className="text-xs text-slate-400 font-normal">({results.albums.length})</span>
                </h3>
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
                  <button
                    onClick={() => scrollContainer(albumsRef, 'left')}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollContainer(albumsRef, 'right')}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div
                ref={albumsRef}
                className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
              >
                {results.albums.map((album) => (
                  <div key={album.id} className="w-36 sm:w-44 md:w-48 shrink-0 snap-start">
                    <AlbumCard
                      album={album}
                      onClick={() => onSelectAlbum(album.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Artists (Horizontal Scrollable) */}
          {(filter === 'all' || filter === 'artists') && results.artists.length > 0 && (
            <section className="space-y-4 relative group/shelf">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Artists</span>
                  <span className="text-xs text-slate-400 font-normal">({results.artists.length})</span>
                </h3>
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
                  <button
                    onClick={() => scrollContainer(artistsRef, 'left')}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollContainer(artistsRef, 'right')}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div
                ref={artistsRef}
                className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
              >
                {results.artists.map((artist) => (
                  <div key={artist.id} className="w-32 sm:w-36 md:w-40 shrink-0 snap-start">
                    <ArtistCard
                      artist={artist}
                      onClick={() => onSelectArtist(artist.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Playlists (Horizontal Scrollable) */}
          {(filter === 'all' || filter === 'playlists') && results.playlists.length > 0 && (
            <section className="space-y-4 relative group/shelf">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                  <ListMusic className="w-4 h-4 text-purple-400" />
                  <span>Playlists</span>
                  <span className="text-xs text-slate-400 font-normal">({results.playlists.length})</span>
                </h3>
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
                {results.playlists.map((pl) => (
                  <div key={pl.id} className="w-36 sm:w-44 md:w-48 shrink-0 snap-start">
                    <PlaylistCard
                      playlist={pl}
                      onClick={() => onSelectPlaylist(pl.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
