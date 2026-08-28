import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Mic2,
  Maximize2,
  Heart,
  Loader2,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';

export const BottomPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isQueueOpen,
    isLyricsOpen,
    queue,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    setQueueOpen,
    setLyricsOpen,
    setMobilePlayerOpen,
  } = usePlayerStore();

  const { isLiked, toggleLike } = useLibraryStore();

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      {/* Desktop & Tablet Bottom Player Bar */}
      <footer className="h-20 sm:h-22 px-4 sm:px-6 bg-[#0a0717]/95 border-t border-white/10 backdrop-blur-2xl flex items-center justify-between z-40 sticky bottom-0 select-none shadow-2xl">
        {/* Left: Track Details */}
        <div className="flex items-center gap-3 w-1/4 min-w-[180px] max-w-[300px]">
          <div
            onClick={() => setMobilePlayerOpen(true)}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-md cursor-pointer group"
          >
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={() => setMobilePlayerOpen(true)}
              className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
            >
              {currentTrack.title}
            </h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">{currentTrack.artist}</p>
          </div>

          <button
            onClick={() => toggleLike(currentTrack)}
            aria-label={liked ? "Remove from favorites" : "Add to favorites"}
            className={`p-2 rounded-full transition-colors ${
              liked ? 'text-pink-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex flex-col items-center max-w-xl w-2/4 px-4">
          <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              title="Shuffle"
              aria-label="Shuffle"
              className={`p-1.5 rounded-full transition-colors ${
                isShuffled ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={playPrevious}
              title="Previous (CarPlay / Lockscreen synced)"
              aria-label="Previous track"
              className="p-1.5 text-slate-300 hover:text-white active:scale-95 transition-all"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={togglePlay}
              disabled={isBuffering}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              {isBuffering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              title="Next (CarPlay / Lockscreen synced)"
              aria-label="Next track"
              className="p-1.5 text-slate-300 hover:text-white active:scale-95 transition-all"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              title={`Repeat: ${repeatMode}`}
              aria-label={`Repeat mode: ${repeatMode}`}
              className={`p-1.5 rounded-full transition-colors ${
                repeatMode !== 'off' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Scrubber Bar */}
          <div className="w-full flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span className="w-9 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 group flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime || 0}
                onChange={handleSeek}
                aria-label="Track progress"
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/15 accent-purple-500 group-hover:h-2 transition-all"
              />
            </div>
            <span className="w-9">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Drawer Toggles */}
        <div className="hidden sm:flex items-center justify-end gap-3 w-1/4 min-w-[180px]">
          {/* Lyrics toggle */}
          <button
            onClick={() => setLyricsOpen(!isLyricsOpen)}
            title="Lyrics"
            aria-label="Toggle lyrics"
            className={`p-2 rounded-xl transition-all ${
              isLyricsOpen
                ? 'bg-purple-600/30 text-purple-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Queue toggle */}
          <button
            onClick={() => setQueueOpen(!isQueueOpen)}
            title="Queue"
            aria-label="Toggle queue"
            className={`relative p-2 rounded-xl transition-all ${
              isQueueOpen
                ? 'bg-purple-600/30 text-purple-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 1 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500" />
            )}
          </button>

          {/* Volume icon & slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="text-slate-400 hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume slider"
              className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer bg-white/20 accent-purple-500"
            />
          </div>

          {/* Expand to mobile/fullscreen */}
          <button
            onClick={() => setMobilePlayerOpen(true)}
            title="Full Player"
            aria-label="Expand player"
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </>
  );
};
