import React from 'react';
import { ListMusic, Play } from 'lucide-react';
import { Playlist } from '../../api/types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative p-3 rounded-2xl glass-card cursor-pointer flex flex-col"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-900 shadow-md">
        <img
          src={playlist.image}
          alt={playlist.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-600/50 transform hover:scale-110 transition-all">
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          </div>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-white truncate">{playlist.title}</h4>
      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 truncate">
        <ListMusic className="w-3 h-3 text-purple-400 shrink-0" />
        <span>{playlist.songCount ? `${playlist.songCount} songs` : 'Playlist'}</span>
      </div>
    </div>
  );
};
