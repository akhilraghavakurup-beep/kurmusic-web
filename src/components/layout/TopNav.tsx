import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Settings, 
  SlidersHorizontal,
  X 
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openSettings: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  openSettings,
  canGoBack,
  onGoBack,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    setSearchQuery(val);
    if (val.trim() && activeTab !== 'search') {
      setActiveTab('search');
    }
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#0a0717]/60 backdrop-blur-md sticky top-0 z-30 shrink-0">
      {/* Navigation history arrows */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGoBack}
          disabled={!canGoBack}
          aria-label="Go back"
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            canGoBack
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-white/5 text-slate-600 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Global Interactive Search Input */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search songs, albums, artists, or playlists..."
            className="w-full pl-10 pr-10 py-2 rounded-full bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-purple-500/60 text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                setSearchQuery('');
              }}
              aria-label="Clear search"
              className="absolute right-3 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={openSettings}
          title="Audio Quality & Proxy Settings"
          aria-label="Open settings"
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
