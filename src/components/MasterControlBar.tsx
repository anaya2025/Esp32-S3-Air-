import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Radio, 
  Airplay, 
  Cast, 
  FileAudio, 
  Activity,
  Sliders,
  Link2
} from 'lucide-react';
import { PlaybackStatus, AudioSourceType, TrackMetadata } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface MasterControlBarProps {
  status: PlaybackStatus;
  source: AudioSourceType;
  track: TrackMetadata;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onScrollToEq: () => void;
}

export const MasterControlBar: React.FC<MasterControlBarProps> = ({
  status,
  source,
  track,
  volume,
  isMuted,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrevious,
  onVolumeChange,
  onToggleMute,
  onScrollToEq,
}) => {
  const isPlaying = status === 'playing';
  const isBuffering = status === 'buffering';

  const getSourceBadge = () => {
    switch (source) {
      case 'airplay':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
            <Airplay className="w-3 h-3" />
            AirPlay 2 Stream
          </span>
        );
      case 'dlna':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/80 text-purple-300 border border-purple-500/40">
            <Cast className="w-3 h-3" />
            DLNA / uPnP
          </span>
        );
      case 'local_file':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-500/40">
            <FileAudio className="w-3 h-3" />
            Local Audio
          </span>
        );
      case 'direct_url':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <Link2 className="w-3 h-3" />
            Direct Stream URL
          </span>
        );
      case 'radio':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <Radio className="w-3 h-3" />
            Internet Radio
          </span>
        );
    }
  };

  return (
    <section 
      id="master-control-bar"
      className="w-full bg-[#050508] border-b border-[#1b1e2a] px-4 py-4 sm:px-6 sm:py-5 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-5">
        
        {/* 1. Track Info & Active Source */}
        <div className="flex items-center gap-4 w-full lg:w-1/3 min-w-0">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0d0f16] border border-[#222738] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            {track.coverUrl ? (
              <img src={track.coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <Radio className={`w-7 h-7 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getSourceBadge()}
              <span className="text-[11px] font-mono text-neutral-400 bg-[#121520] px-2 py-0.5 rounded border border-[#202538]">
                {track.codec} {track.bitrate ? `${track.bitrate}k` : 'Lossless'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate tracking-tight">
              {track.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 truncate">
              {track.artist} {track.stationName ? `· ${track.stationName}` : ''}
            </p>
          </div>
        </div>

        {/* 2. Primary Control Buttons (Play/Pause, Stop, Next, Previous) */}
        <div className="flex flex-col items-center gap-2 w-full lg:w-1/3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Previous */}
            <button
              id="btn-previous-track"
              onClick={onPrevious}
              className="w-10 h-10 rounded-full bg-[#10131d] hover:bg-[#1a1f2e] border border-[#23293d] text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Previous Station / Track"
              aria-label="Previous"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause (Primary Material Floating Pill) */}
            {isPlaying ? (
              <button
                id="btn-pause"
                onClick={onPause}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform active:scale-95 cursor-pointer"
                title="Pause Audio Stream"
                aria-label="Pause"
              >
                <Pause className="w-6 h-6 fill-current text-neutral-950" />
              </button>
            ) : (
              <button
                id="btn-play"
                onClick={onPlay}
                disabled={isBuffering}
                className={`w-14 h-14 rounded-full ${
                  isBuffering 
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer'
                } flex items-center justify-center transition-all transform`}
                title="Play Audio Stream"
                aria-label="Play"
              >
                {isBuffering ? (
                  <Activity className="w-6 h-6 animate-spin text-emerald-400" />
                ) : (
                  <Play className="w-6 h-6 fill-current text-neutral-950 ml-0.5" />
                )}
              </button>
            )}

            {/* Stop */}
            <button
              id="btn-stop"
              onClick={onStop}
              className="w-10 h-10 rounded-full bg-[#10131d] hover:bg-[#1a1f2e] border border-[#23293d] text-neutral-300 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Stop Audio Stream"
              aria-label="Stop"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            {/* Next */}
            <button
              id="btn-next-track"
              onClick={onNext}
              className="w-10 h-10 rounded-full bg-[#10131d] hover:bg-[#1a1f2e] border border-[#23293d] text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Next Station / Track"
              aria-label="Next"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Status Text & DSP EQ Shortcut */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-emerald-400 animate-pulse' :
                isBuffering ? 'bg-amber-400 animate-ping' :
                'bg-neutral-600'
              }`} />
              <span className="uppercase text-neutral-400 text-[11px]">
                {status}
              </span>
            </span>
            <span className="text-neutral-700">|</span>
            <button
              onClick={onScrollToEq}
              className="text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px]"
            >
              <Sliders className="w-3 h-3" />
              DSP 3-Band EQ Active
            </button>
          </div>
        </div>

        {/* 3. Volume & Visualizer */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-1/3 justify-end">
          {/* Live Mini Spectrum Visualizer */}
          <div className="w-full sm:w-40 h-10 bg-[#0c0e16] border border-[#1b2030] rounded-xl px-2 py-1 flex items-center">
            <AudioVisualizer isPlaying={isPlaying} barCount={20} height={32} />
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-mute"
              onClick={onToggleMute}
              className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#151825]"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label="Toggle Mute"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              id="slider-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-24 sm:w-28 accent-emerald-500 cursor-pointer"
              aria-label="Volume Slider"
            />
            <span className="text-xs font-mono text-neutral-400 w-8 text-right">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};
