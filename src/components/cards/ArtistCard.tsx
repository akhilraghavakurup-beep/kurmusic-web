import React from 'react';
import { User } from 'lucide-react';
import { Artist } from '../../api/types';

interface ArtistCardProps {
  artist: Artist;
  onClick: () => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group p-4 rounded-2xl glass-card cursor-pointer flex flex-col items-center text-center"
    >
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden mb-3.5 bg-slate-900 border-2 border-transparent group-hover:border-purple-500/60 shadow-lg shadow-purple-900/10 transition-all duration-300">
        <img
          src={artist.image}
          alt={artist.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <h4 className="text-sm font-semibold text-white truncate w-full group-hover:text-purple-400 transition-colors">
        {artist.name}
      </h4>
      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
        <User className="w-3 h-3 text-purple-400" />
        <span>Artist</span>
      </p>
    </div>
  );
};
