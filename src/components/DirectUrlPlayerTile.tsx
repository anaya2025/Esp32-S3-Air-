import React, { useState } from 'react';
import { 
  Link2, 
  Play, 
  Sparkles, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ExternalLink,
  History,
  RotateCcw
} from 'lucide-react';

interface DirectUrlPlayerTileProps {
  onPlayDirectUrl: (url: string, customTitle?: string) => void;
  activeUrl?: string;
}

interface PresetUrl {
  name: string;
  url: string;
  type: string;
  bitrate: string;
}

const PRESET_SAMPLE_URLS: PresetUrl[] = [
  {
    name: 'BBC Radio 1 Direct HLS/AAC',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    type: 'AAC / Live Stream',
    bitrate: '128 kbps',
  },
  {
    name: 'KEXP 90.3 FM Seattle (Lossless CD FLAC/MP3)',
    url: 'https://kexp.streamguys1.com/kexp160.mp3',
    type: 'MP3 / Alternative',
    bitrate: '160 kbps',
  },
  {
    name: 'Worldwide FM London (Eclectic & Jazz)',
    url: 'https://worldwidefm.out.airtime.pro/worldwidefm_a',
    type: 'MP3 / Worldwide',
    bitrate: '192 kbps',
  },
  {
    name: 'FIP Radio France (High Quality Stereo)',
    url: 'https://stream.radiofrance.fr/fip/fip.m3u8?id=radiofrance',
    type: 'HLS / Eclectic',
    bitrate: '192 kbps',
  },
  {
    name: 'Linn Classical (Lossless 24/96 / 320k)',
    url: 'https://radio.linn.co.uk:8003/autodj',
    type: 'MP3 / Audiophile',
    bitrate: '320 kbps',
  },
  {
    name: 'WNYC 93.9 FM New York NPR Direct',
    url: 'https://fm939.wnyc.org/wnycfm-web',
    type: 'AAC / News & Music',
    bitrate: '128 kbps',
  }
];

export const DirectUrlPlayerTile: React.FC<DirectUrlPlayerTileProps> = ({
  onPlayDirectUrl,
  activeUrl,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [streamName, setStreamName] = useState('');
  const [recentUrls, setRecentUrls] = useState<string[]>([
    'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    'https://kexp.streamguys1.com/kexp160.mp3',
    'https://radio.linn.co.uk:8003/autodj'
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a valid HTTP or HTTPS stream URL.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMsg('Stream URL must start with http:// or https://');
      return;
    }

    setErrorMsg(null);
    onPlayDirectUrl(trimmed, streamName.trim() || undefined);

    // Save to recent
    setRecentUrls((prev) => {
      const filtered = prev.filter((u) => u !== trimmed);
      return [trimmed, ...filtered].slice(0, 5);
    });
  };

  const handleSelectPreset = (p: PresetUrl) => {
    setInputUrl(p.url);
    setStreamName(p.name);
    setErrorMsg(null);
    onPlayDirectUrl(p.url, p.name);

    setRecentUrls((prev) => {
      const filtered = prev.filter((u) => u !== p.url);
      return [p.url, ...filtered].slice(0, 5);
    });
  };

  return (
    <div 
      id="tile-direct-url-player" 
      className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Direct HTTP / HTTPS Link Stream Player
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                Any Web Audio Link
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Stream any remote MP3, AAC, FLAC, OGG/OPUS, M3U8, or Icecast/Shoutcast URL directly through the ESP32-S3 I2S DSP pipeline
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/30 hidden sm:inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          I2S DMA Direct Sink
        </span>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Stream URL Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <Link2 className="w-4 h-4" />
            </div>
            <input
              id="input-direct-stream-url"
              type="url"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Paste direct stream URL: https://example.com/live.mp3 or http://..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#06070b] border border-[#21263c] text-xs font-mono text-emerald-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          {/* Optional Name Tag */}
          <div className="w-full sm:w-52">
            <input
              type="text"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="Label (optional)"
              className="w-full px-3 py-2.5 rounded-xl bg-[#06070b] border border-[#21263c] text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Play Button */}
          <button
            id="btn-play-direct-url"
            type="submit"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Stream</span>
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-500/30 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </form>

      {/* Verified Hi-Fi Preset Samples */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Quick One-Click Test Links (BBC, KEXP, Linn Audiophile &amp; More)
          </span>
          <span className="text-[10px] font-mono text-neutral-500">Verified Direct HTTP/HTTPS Streams</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESET_SAMPLE_URLS.map((p) => {
            const isSelected = activeUrl === p.url;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-[#05060a] border-[#181a28] hover:border-emerald-500/40 hover:bg-[#0a0c14]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white truncate max-w-[190px]">
                    {p.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-1">
                  <span className="text-emerald-400/80">{p.type}</span>
                  <span className="bg-[#0e1018] px-1.5 py-0.5 rounded text-neutral-400 border border-[#1b2030]">
                    {p.bitrate}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent History Chips */}
      {recentUrls.length > 0 && (
        <div className="pt-3 border-t border-[#151724] flex items-center gap-2 flex-wrap text-xs">
          <span className="text-neutral-500 font-mono text-[11px] flex items-center gap-1">
            <History className="w-3 h-3 text-neutral-400" />
            Recent Links:
          </span>
          {recentUrls.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                setInputUrl(u);
                onPlayDirectUrl(u);
              }}
              className="px-2.5 py-1 rounded-md bg-[#0a0c13] hover:bg-[#121622] border border-[#1e2336] hover:border-emerald-500/40 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors truncate max-w-[260px] cursor-pointer"
              title={u}
            >
              {u.replace(/^https?:\/\//, '')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
