import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Mic2,
  ListMusic,
  Moon,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';
import { useSettingsStore } from '../../stores/settings-store';

export const MobilePlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    isShuffled,
    isMobilePlayerOpen,
    setMobilePlayerOpen,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    toggleRepeat,
    toggleShuffle,
    setLyricsOpen,
    setQueueOpen,
  } = usePlayerStore();

  const { isLiked, toggleLike } = useLibraryStore();
  const { audioQuality, setAudioQuality } = useSettingsStore();
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  if (!isMobilePlayerOpen || !currentTrack) return null;

  const liked = isLiked(currentTrack.id);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const setSleepTimer = (minutes: number) => {
    if (sleepTimerRemaining) {
      setSleepTimerRemaining(null);
      alert('Sleep timer cancelled');
      return;
    }
    setSleepTimerRemaining(minutes);
    alert(`Sleep timer set for ${minutes} minutes`);
    setTimeout(() => {
      usePlayerStore.getState().togglePlay();
      setSleepTimerRemaining(null);
    }, minutes * 60 * 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080612] flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Dynamic Ambient Background Blur */}
      <div 
        className="absolute inset-0 opacity-25 filter blur-[90px] scale-125 pointer-events-none transition-all duration-700"
        style={{
          backgroundImage: `url(${currentTrack.image})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Header with dismiss button */}
      <header className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
        <button
          onClick={() => setMobilePlayerOpen(false)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-[11px] uppercase tracking-widest text-purple-400 font-semibold">
            Now Playing
          </p>
          <p className="text-xs text-slate-300 font-medium truncate max-w-[200px]">
            {currentTrack.album || 'Kur Music'}
          </p>
        </div>

        {/* Audio Quality Badge */}
        <button
          onClick={() => {
            const next = audioQuality === '320kbps' ? '160kbps' : audioQuality === '160kbps' ? '96kbps' : '320kbps';
            setAudioQuality(next);
          }}
          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[10px] font-mono text-purple-300 border border-purple-500/30"
        >
          {audioQuality}
        </button>
      </header>

      {/* Center: Large Album Artwork with Vinyl spin effect */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 border border-white/10 group">
          <img
            src={currentTrack.image}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="relative z-10 px-6 sm:px-10 pb-12 space-y-6">
        {/* Title & Heart Button */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate font-display">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-slate-400 truncate mt-1">
              {currentTrack.artist}
            </p>
          </div>

          <button
            onClick={() => toggleLike(currentTrack)}
            className={`p-3 rounded-full bg-white/5 active:scale-90 transition-transform ${
              liked ? 'text-pink-500' : 'text-slate-400'
            }`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Scrubber Slider */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime || 0}
            onChange={handleSeek}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-purple-500"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls (CarPlay / Lockscreen synced) */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleShuffle}
            className={`p-3 ${isShuffled ? 'text-purple-400' : 'text-slate-400'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={playPrevious}
            className="p-3 text-white active:scale-90 transition-transform"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/50 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-3 text-white active:scale-90 transition-transform"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-3 ${repeatMode !== 'off' ? 'text-purple-400' : 'text-slate-400'}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Extra Bottom Actions: Lyrics, Sleep Timer, Queue */}
        <div className="flex items-center justify-around pt-2 border-t border-white/10 text-slate-400">
          <button
            onClick={() => {
              setMobilePlayerOpen(false);
              setLyricsOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs hover:text-white"
          >
            <Mic2 className="w-4 h-4 text-purple-400" />
            <span>Lyrics</span>
          </button>

          <button
            onClick={() => setSleepTimer(30)}
            className="flex items-center gap-1.5 text-xs hover:text-white"
          >
            <Moon className="w-4 h-4 text-purple-400" />
            <span>{sleepTimerRemaining ? `${sleepTimerRemaining}m` : 'Timer'}</span>
          </button>

          <button
            onClick={() => {
              setMobilePlayerOpen(false);
              setQueueOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs hover:text-white"
          >
            <ListMusic className="w-4 h-4 text-purple-400" />
            <span>Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
