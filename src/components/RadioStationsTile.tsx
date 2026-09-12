import React, { useState } from 'react';
import { Radio, Play, Pause, Plus, ExternalLink, Sparkles, Music2, Check } from 'lucide-react';
import { RadioStation } from '../types';

interface RadioStationsTileProps {
  stations: RadioStation[];
  currentStationId: string | null;
  isPlaying: boolean;
  onSelectStation: (station: RadioStation) => void;
  onAddCustomStation: (station: RadioStation) => void;
}

export const RadioStationsTile: React.FC<RadioStationsTileProps> = ({
  stations,
  currentStationId,
  isPlaying,
  onSelectStation,
  onAddCustomStation,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customBitrate, setCustomBitrate] = useState('128');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customUrl) return;

    const newStation: RadioStation = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      genre: customGenre.trim() || 'Custom Stream',
      country: 'Live Stream',
      streamUrl: customUrl.trim(),
      bitrate: parseInt(customBitrate, 10) || 128,
      codec: customUrl.includes('.aac') ? 'AAC' : customUrl.includes('.flac') ? 'FLAC' : 'MP3',
      description: 'User-configured live audio stream for ESP32-S3 playback.',
    };

    onAddCustomStation(newStation);
    onSelectStation(newStation);
    setShowAddModal(false);
    setCustomName('');
    setCustomGenre('');
    setCustomUrl('');
  };

  return (
    <div id="tile-radio-stations" className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Mixed Web Radio Stations
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                Live Streams
              </span>
            </h3>
            <p className="text-xs text-neutral-400">Low-latency audio streaming direct to I2S DAC</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-md bg-[#10141f] border border-emerald-500/30 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Stream</span>
        </button>
      </div>

      {/* Stations List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
        {stations.map((st) => {
          const isCurrent = currentStationId === st.id;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={st.id}
              onClick={() => onSelectStation(st)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                isCurrent
                  ? 'bg-[#101524] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-[#06070a] border-[#181a27] hover:border-[#2b3046] hover:bg-[#0c0e16]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isThisPlaying
                      ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : 'bg-[#12141f] text-neutral-400 group-hover:text-white group-hover:bg-[#1c2032]'
                  }`}
                >
                  {isThisPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-emerald-300' : 'text-neutral-200'}`}>
                      {st.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {st.genre}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 text-right">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131622] text-neutral-300 border border-[#202538]">
                  {st.codec} {st.bitrate}k
                </span>
                {isThisPlaying && (
                  <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Stream Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b0d14] border border-[#21263a] rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2033] mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Add Custom Audio Stream
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-[#141824]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Station / Stream Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Favorite Jazz Stream"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#07080d] border border-[#20253a] text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Genre / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Synthwave / Lossless"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#07080d] border border-[#20253a] text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Stream URL (Direct MP3, AAC, or FLAC URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/stream.mp3"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#07080d] border border-[#20253a] text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Bitrate (kbps)
                </label>
                <select
                  value={customBitrate}
                  onChange={(e) => setCustomBitrate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#07080d] border border-[#20253a] text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="64">64 kbps (Low Bandwidth)</option>
                  <option value="128">128 kbps (Standard High-Quality)</option>
                  <option value="192">192 kbps (Studio Quality)</option>
                  <option value="256">256 kbps (HQ Lossy)</option>
                  <option value="320">320 kbps (Maximum MP3)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white bg-[#141824]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Save &amp; Play
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
