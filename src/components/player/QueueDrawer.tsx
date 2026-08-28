import React from 'react';
import { X, Play, Trash2, GripVertical, Music } from 'lucide-react';
import { usePlayerStore } from '../../stores/player-store';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setQueueOpen,
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  if (!isQueueOpen) return null;

  return (
    <aside className="fixed right-0 top-0 bottom-20 sm:bottom-22 w-full sm:w-96 z-40 bg-[#0c091d]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-base">Play Queue</h3>
          <p className="text-xs text-purple-400 font-medium">
            {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 1 && (
            <button
              onClick={clearQueue}
              title="Clear Queue"
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setQueueOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Now Playing Highlight */}
      {currentTrack && (
        <div className="p-4 bg-purple-950/40 border-b border-purple-500/20">
          <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold mb-2">
            Now Playing
          </p>
          <div className="flex items-center gap-3">
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-xl object-cover shadow"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white truncate">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Up Next List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
          Up Next
        </p>

        {queue.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;

          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => playTrack(track)}
              className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
                  : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <span className="w-5 text-center text-xs font-mono text-slate-500">
                {idx + 1}
              </span>

              <img
                src={track.image}
                alt={track.title}
                className="w-10 h-10 rounded-lg object-cover bg-slate-900 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <h5 className={`text-sm font-medium truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                  {track.title}
                </h5>
                <p className="text-xs text-slate-400 truncate">{track.artist}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromQueue(idx);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-400 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
