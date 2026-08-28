import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search as SearchIcon, 
  Loader2, 
  Music2, 
  Disc, 
  User, 
  ListMusic, 
  Play, 
  Pause, 
  Clock, 
  Heart, 
  History, 
  X, 
  Trash2 
} from 'lucide-react';
import { SearchResults, Track } from '../../api/types';
import { jioSaavnClient } from '../../api/jiosaavn-client';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';
import { AlbumCard } from '../cards/AlbumCard';
import { ArtistCard } from '../cards/ArtistCard';
import { PlaylistCard } from '../cards/PlaylistCard';
import { TrackRowActions } from '../common/TrackRowActions';

interface SearchViewProps {
  query: string;
  onSearchSelect?: (query: string) => void;
  onSelectAlbum: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onSelectArtist: (id: string) => void;
}

type FilterCategory = 'all' | 'songs' | 'albums' | 'artists' | 'playlists';

const RECENT_SEARCHES_KEY = 'kurmusic_recent_searches';

export const SearchView: React.FC<SearchViewProps> = ({
  query,
  onSearchSelect,
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

  // Load previous searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  const saveRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  const handleSelectRecentSearch = (term: string) => {
    if (onSearchSelect) {
      onSearchSelect(term);
    }
    const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (input) {
      input.value = term;
      input.dispatchEvent(new Event('input', { bubbles: true }));
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
            // Save successful search query to previous searches
            if (
              data.tracks.length > 0 ||
              data.albums.length > 0 ||
              data.artists.length > 0 ||
              data.playlists.length > 0
            ) {
              saveRecentSearch(query);
            }
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
  }, [query, saveRecentSearch]);

  const categories: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: `Songs (${results.tracks.length})` },
    { id: 'albums', label: `Albums (${results.albums.length})` },
    { id: 'artists', label: `Artists (${results.artists.length})` },
    { id: 'playlists', label: `Playlists (${results.playlists.length})` },
  ];

  const hasAnyResults =
    results.tracks.length > 0 ||
    results.albums.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-36 sm:pb-28 select-none max-w-7xl mx-auto">
      {/* Category Filter Pills */}
      {query.trim() && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
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
        /* Previous Searches Section */
        recentSearches.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-display">
                <History className="w-5 h-5 text-purple-400" />
                <span>Previous Searches</span>
              </h3>
              <button
                onClick={clearAllRecentSearches}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {recentSearches.map((term) => (
                <div
                  key={term}
                  onClick={() => handleSelectRecentSearch(term)}
                  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm text-slate-200 hover:text-white border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5 text-purple-400/80 shrink-0" />
                  <span className="font-medium">{term}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(term);
                    }}
                    title="Remove from history"
                    className="p-0.5 rounded-full hover:bg-white/20 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 space-y-3">
            <SearchIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-lg font-bold text-slate-200 font-display">Search Kur Music</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Search for your favorite songs, artists, albums, or playlists. Your previous searches will appear here.
            </p>
          </div>
        )
      ) : !hasAnyResults ? (
        <div className="text-center py-24 text-slate-400 space-y-2">
          <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <h4 className="text-lg font-bold text-slate-200">No results found</h4>
          <p className="text-sm">We couldn't find any songs matching "{query}". Try a different spelling or keyword.</p>
        </div>
      ) : (
        /* Vertical Results Listing for High Visibility */
        <div className="space-y-10">
          {/* Vertical Songs Listing */}
          {(filter === 'all' || filter === 'songs') && results.tracks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                  <Music2 className="w-5 h-5 text-purple-400" />
                  <span>Songs</span>
                  <span className="text-xs text-slate-400 font-normal">({results.tracks.length})</span>
                </h3>
              </div>

              <div className="space-y-1.5">
                {results.tracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const liked = isLiked(track.id);

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, results.tracks)}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-purple-600/20 border-purple-500/40 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        {/* Index */}
                        <span className="w-5 text-center text-xs text-slate-500 font-mono">
                          {idx + 1}
                        </span>

                        {/* Thumbnail with overlay play button */}
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

                        {/* Track info */}
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isCurrent ? 'text-purple-400' : 'text-white group-hover:text-purple-300'
                            }`}
                          >
                            {track.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</p>
                        </div>
                      </div>

                      {/* Album & Actions */}
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0 ml-4">
                        <span className="hidden md:inline-block text-xs text-slate-400 truncate max-w-xs">
                          {track.album}
                        </span>

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

          {/* Vertical Albums Grid */}
          {(filter === 'all' || filter === 'albums') && results.albums.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                  <Disc className="w-5 h-5 text-purple-400" />
                  <span>Albums</span>
                  <span className="text-xs text-slate-400 font-normal">({results.albums.length})</span>
                </h3>
              </div>
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

          {/* Vertical Artists Grid */}
          {(filter === 'all' || filter === 'artists') && results.artists.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                  <User className="w-5 h-5 text-purple-400" />
                  <span>Artists</span>
                  <span className="text-xs text-slate-400 font-normal">({results.artists.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

          {/* Vertical Playlists Grid */}
          {(filter === 'all' || filter === 'playlists') && results.playlists.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                  <ListMusic className="w-5 h-5 text-purple-400" />
                  <span>Playlists</span>
                  <span className="text-xs text-slate-400 font-normal">({results.playlists.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
