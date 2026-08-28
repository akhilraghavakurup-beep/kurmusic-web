import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { BottomPlayer } from './components/layout/BottomPlayer';
import { MobilePlayer } from './components/player/MobilePlayer';
import { QueueDrawer } from './components/player/QueueDrawer';
import { LyricsModal } from './components/player/LyricsModal';
import { HomeView } from './components/views/HomeView';
import { RewindView } from './components/views/RewindView';
import { SearchView } from './components/views/SearchView';
import { AlbumView } from './components/views/AlbumView';
import { ArtistView } from './components/views/ArtistView';
import { PlaylistView } from './components/views/PlaylistView';
import { LibraryView } from './components/views/LibraryView';
import { DownloadsView } from './components/views/DownloadsView';
import { SettingsModal } from './components/views/SettingsModal';
import { usePlayerStore } from './stores/player-store';
import { Home, Search, Library, Download, SlidersHorizontal, Play, Pause, Heart, Sparkles } from 'lucide-react';
import { useLibraryStore } from './stores/library-store';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [historyStack, setHistoryStack] = useState<ActiveTab[]>(['home']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { currentTrack, isPlaying, togglePlay, setMobilePlayerOpen } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  const navigateTo = (tab: ActiveTab) => {
    setHistoryStack((prev) => [...prev, tab]);
    setActiveTab(tab);
  };

  const handleGoBack = () => {
    if (historyStack.length > 1) {
      const next = [...historyStack];
      next.pop(); // remove current
      const prev = next[next.length - 1];
      setHistoryStack(next);
      setActiveTab(prev);
    }
  };

  const handleSelectAlbum = (id: string) => {
    setSelectedAlbumId(id);
    navigateTo('album');
  };

  const handleSelectArtist = (id: string) => {
    setSelectedArtistId(id);
    navigateTo('artist');
  };

  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    navigateTo('playlist');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        usePlayerStore.getState().playNext();
      } else if (e.code === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        usePlayerStore.getState().playPrevious();
      } else if (e.key.toLowerCase() === 'm') {
        usePlayerStore.getState().toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  return (
    <div className="flex h-screen w-screen bg-[#080612] text-slate-100 overflow-hidden font-sans select-none">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigateTo}
          openSettings={() => setIsSettingsOpen(true)}
          onSelectPlaylist={handleSelectPlaylist}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-gradient-to-b from-[#110d29]/40 to-[#080612]">
        <TopNav
          activeTab={activeTab}
          setActiveTab={navigateTo}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          openSettings={() => setIsSettingsOpen(true)}
          canGoBack={historyStack.length > 1}
          onGoBack={handleGoBack}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto min-h-0 relative">
          {activeTab === 'home' && (
            <HomeView
              onSelectAlbum={handleSelectAlbum}
              onSelectPlaylist={handleSelectPlaylist}
              onSelectArtist={handleSelectArtist}
            />
          )}

          {activeTab === 'rewind' && (
            <RewindView
              onSelectAlbum={handleSelectAlbum}
              onSelectArtist={handleSelectArtist}
            />
          )}

          {activeTab === 'search' && (
            <SearchView
              query={searchQuery}
              onSearchSelect={setSearchQuery}
              onSelectAlbum={handleSelectAlbum}
              onSelectPlaylist={handleSelectPlaylist}
              onSelectArtist={handleSelectArtist}
            />
          )}

          {activeTab === 'album' && selectedAlbumId && (
            <AlbumView
              albumId={selectedAlbumId}
              onSelectArtist={handleSelectArtist}
            />
          )}

          {activeTab === 'artist' && selectedArtistId && (
            <ArtistView
              artistId={selectedArtistId}
              onSelectAlbum={handleSelectAlbum}
            />
          )}

          {activeTab === 'playlist' && selectedPlaylistId && (
            <PlaylistView playlistId={selectedPlaylistId} />
          )}

          {(activeTab === 'library' || activeTab === 'liked') && (
            <LibraryView onSelectPlaylist={handleSelectPlaylist} />
          )}

          {activeTab === 'downloads' && (
            <DownloadsView />
          )}
        </main>
      </div>

      {/* Slide-out Queue Drawer */}
      <QueueDrawer />

      {/* Lyrics Modal */}
      <LyricsModal />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Expandable Mobile Fullscreen Player */}
      <MobilePlayer />

      {/* Mobile Floating Mini Player (docked above bottom nav on phones) */}
      {currentTrack && (
        <div 
          onClick={() => setMobilePlayerOpen(true)}
          className="md:hidden fixed bottom-16 left-2 right-2 z-40 bg-[#16112d]/95 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl flex items-center justify-between shadow-2xl cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="w-10 h-10 rounded-xl object-cover bg-slate-900 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-semibold text-white truncate">
                {currentTrack.title}
              </h5>
              <p className="text-[10px] text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(currentTrack);
              }}
              className="p-2 text-slate-400"
            >
              <Heart className={`w-4 h-4 ${isLiked(currentTrack.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/40"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0717]/95 border-t border-white/10 backdrop-blur-2xl z-40 flex items-center justify-between px-1 select-none">
        <button
          onClick={() => navigateTo('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 min-w-0 transition-colors ${
            activeTab === 'home' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">Home</span>
        </button>

        <button
          onClick={() => navigateTo('rewind')}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 min-w-0 transition-colors ${
            activeTab === 'rewind' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">Rewind</span>
        </button>

        <button
          onClick={() => navigateTo('search')}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 min-w-0 transition-colors ${
            activeTab === 'search' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">Search</span>
        </button>

        <button
          onClick={() => navigateTo('library')}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 min-w-0 transition-colors ${
            activeTab === 'library' || activeTab === 'liked' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Library className="w-5 h-5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">Library</span>
        </button>

        <button
          onClick={() => navigateTo('downloads')}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 min-w-0 transition-colors ${
            activeTab === 'downloads' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Download className="w-5 h-5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">Downloads</span>
        </button>
      </nav>

      {/* Desktop Persistent Bottom Player */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40">
        <BottomPlayer />
      </div>
    </div>
  );
};
