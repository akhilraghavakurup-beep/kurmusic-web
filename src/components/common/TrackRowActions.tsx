import React, { useState, useRef, useEffect } from 'react';
import { Heart, ListPlus, FolderPlus, Check, Plus } from 'lucide-react';
import { Track } from '../../api/types';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';

interface TrackRowActionsProps {
  track: Track;
  showLike?: boolean;
}

export const TrackRowActions: React.FC<TrackRowActionsProps> = ({
  track,
  showLike = true,
}) => {
  const { addToQueue } = usePlayerStore();
  const { isLiked, toggleLike, playlists, addToPlaylist, createPlaylist } = useLibraryStore();

  const [queueAdded, setQueueAdded] = useState(false);
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const [addedToPlaylistId, setAddedToPlaylistId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const liked = isLiked(track.id);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPlaylistMenuOpen(false);
      }
    };
    if (playlistMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [playlistMenuOpen]);

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    setQueueAdded(true);
    setTimeout(() => setQueueAdded(false), 1500);
  };

  const handleTogglePlaylistMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylistMenuOpen((prev) => !prev);
  };

  const handleSelectPlaylist = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    addToPlaylist(playlistId, track);
    setAddedToPlaylistId(playlistId);
    setTimeout(() => {
      setAddedToPlaylistId(null);
      setPlaylistMenuOpen(false);
    }, 1000);
  };

  const handleCreateAndAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt('Enter new playlist name:');
    if (name && name.trim()) {
      const newId = createPlaylist(name.trim());
      addToPlaylist(newId, track);
      setAddedToPlaylistId(newId);
      setTimeout(() => {
        setAddedToPlaylistId(null);
        setPlaylistMenuOpen(false);
      }, 1000);
    }
  };

  return (
    <div className="relative flex items-center gap-1 shrink-0" ref={menuRef}>
      {/* 1. Add to Queue Button */}
      <button
        onClick={handleAddToQueue}
        title={queueAdded ? 'Added to queue!' : 'Add to queue'}
        aria-label="Add track to queue"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          queueAdded
            ? 'text-emerald-400 bg-emerald-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        {queueAdded ? (
          <Check className="w-4 h-4" />
        ) : (
          <ListPlus className="w-4 h-4" />
        )}
      </button>

      {/* 2. Add to Playlist Button */}
      <button
        onClick={handleTogglePlaylistMenu}
        title="Add to playlist"
        aria-label="Add track to playlist"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          playlistMenuOpen
            ? 'text-purple-400 bg-purple-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <FolderPlus className="w-4 h-4" />
      </button>

      {/* 3. Like Button */}
      {showLike && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          title={liked ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            liked
              ? 'text-pink-500 hover:text-pink-400'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* Playlist Dropdown Menu */}
      {playlistMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 w-52 bg-[#120e24] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 p-2 text-left animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
            Add to Playlist
          </div>

          <div className="max-h-48 overflow-y-auto py-1 space-y-0.5 scrollbar-none">
            {playlists.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 italic">No playlists yet</div>
            ) : (
              playlists.map((pl) => {
                const isAdded = addedToPlaylistId === pl.id;
                const alreadyHas = pl.tracks.some((t) => t.id === track.id);

                return (
                  <button
                    key={pl.id}
                    onClick={(e) => handleSelectPlaylist(e, pl.id)}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-purple-600/30 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="truncate flex-1 pr-2">{pl.name}</span>
                    {isAdded ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : alreadyHas ? (
                      <span className="text-[10px] text-purple-300 font-semibold shrink-0">In List</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-1 mt-1 border-t border-white/10">
            <button
              onClick={handleCreateAndAdd}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Playlist...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
