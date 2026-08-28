import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Volume2, 
  Globe, 
  ShieldCheck, 
  Server, 
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { AudioQuality } from '../../api/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    audioQuality,
    setAudioQuality,
    languages,
    toggleLanguage,
    customProxy,
    setCustomProxy,
  } = useSettingsStore();

  const [proxyInput, setProxyInput] = useState(customProxy);
  const [proxySaved, setProxySaved] = useState(false);

  if (!isOpen) return null;

  const qualityOptions: { id: AudioQuality; title: string; desc: string }[] = [
    { id: '320kbps', title: 'Extreme (320 kbps)', desc: 'Lossless audio streaming quality. Best for Wi-Fi and cars.' },
    { id: '160kbps', title: 'High (160 kbps)', desc: 'Balanced high definition sound with lower data usage.' },
    { id: '96kbps', title: 'Normal (96 kbps)', desc: 'Fast loading on slower mobile networks and data saving.' },
  ];

  const allLanguages = [
    { id: 'hindi', label: 'Hindi' },
    { id: 'english', label: 'English' },
    { id: 'malayalam', label: 'Malayalam' },
    { id: 'tamil', label: 'Tamil' },
    { id: 'telugu', label: 'Telugu' },
    { id: 'punjabi', label: 'Punjabi' },
    { id: 'bengali', label: 'Bengali' },
    { id: 'kannada', label: 'Kannada' },
    { id: 'marathi', label: 'Marathi' },
    { id: 'gujarati', label: 'Gujarati' },
  ];

  const handleSaveProxy = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomProxy(proxyInput.trim());
    setProxySaved(true);
    setTimeout(() => setProxySaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] bg-[#0f0b24] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">App Settings</h3>
              <p className="text-xs text-slate-400">Audio quality, languages, and API routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Audio Quality */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>Streaming Audio Quality</span>
            </h4>
            <div className="space-y-2">
              {qualityOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setAudioQuality(opt.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    audioQuality === opt.id
                      ? 'bg-purple-950/60 border-purple-500/50 text-white shadow-lg shadow-purple-950/40'
                      : 'glass-card text-slate-300 hover:bg-white/5 border-white/5'
                  }`}
                >
                  <div>
                    <h5 className="text-sm font-semibold">{opt.title}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {audioQuality === opt.id && (
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Music & Discovery Languages</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allLanguages.map((l) => {
                const selected = languages.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLanguage(l.id)}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      selected
                        ? 'bg-purple-600/30 border-purple-500/60 text-purple-200 shadow'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CORS Proxy Configuration */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>Custom API / CORS Proxy (Optional)</span>
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Direct audio streams from Akamai CDN need no proxy. For metadata (search & home feed), you can specify your own free Cloudflare Worker or CORS proxy endpoint:
            </p>
            <form onSubmit={handleSaveProxy} className="flex gap-2">
              <input
                type="text"
                value={proxyInput}
                onChange={(e) => setProxyInput(e.target.value)}
                placeholder="e.g. https://my-proxy.workers.dev"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/60 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all shrink-0"
              >
                {proxySaved ? 'Saved!' : 'Save'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
