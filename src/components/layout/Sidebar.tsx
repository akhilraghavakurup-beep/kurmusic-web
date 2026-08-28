import React from 'react';
import { 
  Home, 
  Search, 
  Library, 
  Heart, 
  ListPlus, 
  Download, 
  Settings, 
  Music2,
  Sparkles 
} from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store';
import { useDownloadStore } from '../../stores/download-store';

export type ActiveTab = 'home' | 'rewind' | 'search' | 'library' | 'liked' | 'downloads' | 'album' | 'artist' | 'playlist';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openSettings: () => void;
  onSelectPlaylist?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  onSelectPlaylist,
}) => {
  const { likedTracks, playlists, createPlaylist } = useLibraryStore();
  const { downloadedTracks } = useDownloadStore();

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name) {
      const id = createPlaylist(name);
      if (onSelectPlaylist) onSelectPlaylist(id);
    }
  };

  return (
    <aside className="w-64 h-full flex flex-col glass-panel border-r border-white/5 bg-[#0a0717]/90 shrink-0 select-none">
      {/* Brand Logo */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/40 group-hover:scale-105 transition-transform">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-wide text-white group-hover:text-purple-300 transition-colors">
              Kur Music
            </h1>
            <p className="text-[10px] text-purple-400 font-medium tracking-wider uppercase">
              Web Experience
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-3 py-2 space-y-1">
        <button
          onClick={() => setActiveTab('home')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'home'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('rewind')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'rewind'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span>Kur Rewind</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'search'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'library'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Library className="w-5 h-5" />
          <span>Your Library</span>
        </button>

        <button
          onClick={() => setActiveTab('downloads')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'downloads'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <Download className="w-5 h-5" />
            <span>Downloads</span>
          </div>
          {downloadedTracks.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {downloadedTracks.length}
            </span>
          )}
        </button>
      </div>

      {/* Playlists & Favorites Section */}
      <div className="mt-4 px-3 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Playlists</span>
          <button
            onClick={handleCreatePlaylist}
            title="Create Playlist"
            className="p-1 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <ListPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 overflow-y-auto flex-1 pr-1">
          <button
            onClick={() => setActiveTab('liked')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
              activeTab === 'liked'
                ? 'bg-purple-950/60 text-purple-300 font-semibold border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="truncate">Liked Songs</span>
            <span className="ml-auto text-xs text-slate-500">{likedTracks.length}</span>
          </button>

          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => {
                if (onSelectPlaylist) onSelectPlaylist(pl.id);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-purple-400 shrink-0">
                <Music2 className="w-3.5 h-3.5" />
              </div>
              <span className="truncate flex-1">{pl.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Footer */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={openSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-4 h-4 text-purple-400" />
          <span>Settings & Quality</span>
        </button>
      </div>
    </aside>
  );
};
