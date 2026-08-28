import React, { useState, useEffect } from 'react';
import { X, Mic2, Loader2 } from 'lucide-react';
import { usePlayerStore } from '../../stores/player-store';
import { jioSaavnClient } from '../../api/jiosaavn-client';

export const LyricsModal: React.FC = () => {
  const { isLyricsOpen, setLyricsOpen, currentTrack } = usePlayerStore();
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLyricsOpen || !currentTrack) return;

    let mounted = true;
    setLoading(true);
    setLyrics(null);

    jioSaavnClient
      .getLyrics(currentTrack.id)
      .then((data) => {
        if (mounted) {
          setLyrics(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLyrics(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isLyricsOpen, currentTrack]);

  if (!isLyricsOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0f0b24] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white truncate max-w-sm">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          <button
            onClick={() => setLyricsOpen(false)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6 pr-2 text-center select-text">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-purple-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Fetching lyrics...</p>
            </div>
          ) : lyrics ? (
            <div className="space-y-4 text-base sm:text-lg text-slate-200 font-medium leading-relaxed whitespace-pre-line font-sans">
              {lyrics}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Mic2 className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">No lyrics available</p>
              <p className="text-xs text-slate-500 mt-1">Lyrics have not been released for this track yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
