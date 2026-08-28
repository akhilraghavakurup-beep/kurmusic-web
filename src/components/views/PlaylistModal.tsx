import React, { useState } from 'react';
import { X, Plus, ListMusic, Check } from 'lucide-react';
import { Track } from '../../api/types';
import { useLibraryStore } from '../../stores/library-store';

interface PlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ track, isOpen, onClose }) => {
  const { playlists, addToPlaylist, createPlaylist } = useLibraryStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    addToPlaylist(playlistId, track);
    setAddedId(playlistId);
    setTimeout(() => {
      setAddedId(null);
      onClose();
    }, 600);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newId = createPlaylist(newPlaylistName.trim());
    addToPlaylist(newId, track);
    setNewPlaylistName('');
    setShowCreateInput(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#120d2b] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Add to Playlist</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Preview */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
          <img src={track.image} alt={track.title} className="w-10 h-10 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-white truncate">{track.title}</h4>
            <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
          </div>
        </div>

        {/* Playlists List */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {playlists.map((pl) => {
            const hasSong = pl.tracks.some((t) => t.id === track.id);
            const isJustAdded = addedId === pl.id;

            return (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ListMusic className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-medium text-white truncate">{pl.name}</span>
                </div>
                {isJustAdded || hasSong ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[10px] text-slate-500">{pl.tracks.length} tracks</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Create New Playlist */}
        {showCreateInput ? (
          <form onSubmit={handleCreateNew} className="flex gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              autoFocus
              className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
            >
              Create
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowCreateInput(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-xs font-semibold text-purple-300 hover:text-white hover:border-purple-500 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        )}
      </div>
    </div>
  );
};
