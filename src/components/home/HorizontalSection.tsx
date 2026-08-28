import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeFeedSection, Track, Album, Playlist, Artist } from '../../api/types';
import { SongCard } from '../cards/SongCard';
import { AlbumCard } from '../cards/AlbumCard';
import { PlaylistCard } from '../cards/PlaylistCard';
import { ArtistCard } from '../cards/ArtistCard';

interface HorizontalSectionProps {
  section: HomeFeedSection;
  onSelectAlbum: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onSelectArtist: (id: string) => void;
}

export const HorizontalSection: React.FC<HorizontalSectionProps> = ({
  section,
  onSelectAlbum,
  onSelectPlaylist,
  onSelectArtist,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -550 : 550;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rowRef.current) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeft.current = rowRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !rowRef.current) return;
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 6) {
      hasMoved.current = true;
      e.preventDefault();
    }
    rowRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    // Allow small timeout so onClickCapture can intercept click if dragged
    setTimeout(() => {
      hasMoved.current = false;
    }, 50);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const trackItems = section.items.filter((i): i is Track => 'duration' in i);

  return (
    <section className="space-y-3 relative group/shelf">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
            {section.title}
          </h3>
          {section.subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{section.subtitle}</p>
          )}
        </div>

        {/* Scroll Nav Buttons */}
        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover/shelf:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Row with Touch, Drag & Smooth Scroll (Scrollbar Hidden) */}
      <div
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClickCapture={handleClickCapture}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
        }}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
      >
        {section.items.map((item, idx) => {
          return (
            <div
              key={`${item.id}-${idx}`}
              className="w-36 sm:w-44 md:w-48 shrink-0 snap-start select-none"
            >
              {'duration' in item ? (
                <SongCard
                  track={item as Track}
                  queueContext={trackItems.length > 0 ? trackItems : undefined}
                />
              ) : 'followerCount' in item || 'role' in item ? (
                <ArtistCard
                  artist={item as Artist}
                  onClick={() => onSelectArtist(item.id)}
                />
              ) : 'songCount' in item && !('artist' in item) ? (
                <PlaylistCard
                  playlist={item as Playlist}
                  onClick={() => onSelectPlaylist(item.id)}
                />
              ) : (
                <AlbumCard
                  album={item as Album}
                  onClick={() => onSelectAlbum(item.id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
