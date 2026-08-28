import React from 'react';
import { 
  Download, 
  CheckCircle2, 
  Trash2, 
  HardDrive, 
  Play, 
  FileDown, 
  Clock, 
  Music,
  ArrowDownCircle
} from 'lucide-react';
import { useDownloadStore } from '../../stores/download-store';
import { usePlayerStore } from '../../stores/player-store';
import { SongCard } from '../cards/SongCard';

export const DownloadsView: React.FC = () => {
  const { 
    downloadedTracks, 
    downloadingIds, 
    deleteDownload, 
    clearAllDownloads, 
    saveFileToDevice 
  } = useDownloadStore();

  const { playTrack, currentTrack, isPlaying } = usePlayerStore();

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const totalSize = downloadedTracks.reduce((acc, t) => acc + (t.fileSize || 0), 0);

  const handlePlayAll = () => {
    if (downloadedTracks.length === 0) return;
    playTrack(downloadedTracks[0], downloadedTracks);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 pb-28 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-2">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Offline Storage • {downloadedTracks.length} tracks ({formatBytes(totalSize)})</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
            Offline Downloads
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tracks downloaded directly into browser storage for offline playback on mobile or laptop.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {downloadedTracks.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all"
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>Play All Offline</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Clear all offline downloaded songs?')) {
                    clearAllDownloads();
                  }
                }}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                title="Clear All Downloads"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Downloading Notification */}
      {downloadingIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3 animate-pulse">
          <ArrowDownCircle className="w-5 h-5 text-purple-400 animate-spin" />
          <span className="text-sm text-purple-300 font-medium">
            Downloading {downloadingIds.length} {downloadingIds.length === 1 ? 'track' : 'tracks'} for offline listening...
          </span>
        </div>
      )}

      {/* Downloads List */}
      {downloadedTracks.length === 0 ? (
        <div className="text-center py-24 text-slate-400 space-y-3">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600 mx-auto">
            <Download className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-200">No offline downloads yet</h4>
          <p className="text-xs sm:text-sm max-w-md mx-auto">
            Click the download icon on any song, album, or playlist to listen offline without internet connectivity.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {downloadedTracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, downloadedTracks)}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-purple-900/30 border border-purple-500/30 text-purple-300'
                    : 'glass-card hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                  <span className="w-6 text-center text-xs font-mono text-slate-500">
                    {idx + 1}
                  </span>

                  <img
                    src={track.image}
                    alt={track.title}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-900 shadow shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                      {track.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
                      <span>{track.artist}</span>
                      <span>•</span>
                      <span className="text-emerald-400 inline-flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        {formatBytes(track.fileSize)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveFileToDevice(track);
                    }}
                    title="Export / Save file to device"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDownload(track.id);
                    }}
                    title="Delete download"
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
