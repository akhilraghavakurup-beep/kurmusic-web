import React from 'react';
import { Play, Pause, Heart, MoreVertical } from 'lucide-react';
import { Track } from '../../api/types';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';

interface SongCardProps {
  track: Track;
  queueContext?: Track[];
}

export const SongCard: React.FC<SongCardProps> = ({ track, queueContext }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  const isCurrent = currentTrack?.id === track.id;
  const liked = isLiked(track.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queueContext);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative p-3 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col ${
        isCurrent
          ? 'bg-purple-950/40 border border-purple-500/40 shadow-lg shadow-purple-500/10'
          : 'glass-card hover:bg-white/5'
      }`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-900/60 shadow-md">
        <img
          src={track.image}
          alt={track.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Hover play button */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={handlePlayClick}
            aria-label={isCurrent && isPlaying ? "Pause song" : "Play song"}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/50 transform hover:scale-110 active:scale-95 transition-all"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Favorite heart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all ${
            liked
              ? 'text-pink-500 bg-black/50 opacity-100'
              : 'text-white/70 bg-black/40 opacity-0 group-hover:opacity-100 hover:text-pink-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
        </button>
      </div>

      <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>
        {track.title}
      </h4>
      <p className="text-xs text-slate-400 truncate mt-1">{track.artist}</p>
    </div>
  );
};
