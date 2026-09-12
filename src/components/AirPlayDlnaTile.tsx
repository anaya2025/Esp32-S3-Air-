import React, { useState } from 'react';
import { Airplay, Cast, Cpu, CheckCircle2, Wifi, Zap, Volume2, ShieldCheck } from 'lucide-react';
import { AirPlayDlnaState, AudioSourceType } from '../types';

interface AirPlayDlnaTileProps {
  state: AirPlayDlnaState;
  activeSource: AudioSourceType;
  onActivateSource: (source: AudioSourceType, clientName?: string) => void;
  onToggleService: (service: 'airplay' | 'dlna', enabled: boolean) => void;
}

export const AirPlayDlnaTile: React.FC<AirPlayDlnaTileProps> = ({
  state,
  activeSource,
  onActivateSource,
  onToggleService,
}) => {
  const [customClientName, setCustomClientName] = useState('');

  const isAirPlayActive = activeSource === 'airplay';
  const isDlnaActive = activeSource === 'dlna';

  return (
    <div id="tile-airplay-dlna" className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Airplay className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              AirPlay 2 &amp; DLNA/uPnP Receivers
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                24/7 Daemon
              </span>
            </h3>
            <p className="text-xs text-neutral-400">Always-listening audio renderers for iOS, macOS, Android &amp; PC</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Services Ready</span>
        </div>
      </div>

      {/* Services Grid (AirPlay 2 & DLNA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* AirPlay 2 Box */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isAirPlayActive 
            ? 'bg-[#091522] border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
            : 'bg-[#06070b] border-[#181b29]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Airplay className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Apple AirPlay 2</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              isAirPlayActive
                ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-400/30 font-semibold'
                : 'bg-[#121522] text-neutral-400'
            }`}>
              {isAirPlayActive ? '● STREAMING' : 'READY (24/7)'}
            </span>
          </div>

          <div className="text-xs space-y-1 text-neutral-300">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-neutral-500">Service Name:</span>
              <span className="text-white font-medium">{state.airplayName}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-neutral-500">RTSP / RAOP:</span>
              <span className="text-cyan-400">Port {state.airplayPort} / 7000</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-neutral-500">Active Client:</span>
              <span className="text-neutral-200">{state.airplayClient || 'None (Awaiting Cast)'}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#181c2d] flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 font-mono">ALAC Lossless 44.1kHz</span>
            <button
              onClick={() => onActivateSource('airplay', 'iPhone 15 Pro (AirPlay 2)')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
            >
              {isAirPlayActive ? 'Re-sync Stream' : 'Simulate Connect'}
            </button>
          </div>
        </div>

        {/* DLNA / uPnP Box */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isDlnaActive 
            ? 'bg-[#140b22] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
            : 'bg-[#06070b] border-[#181b29]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cast className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">DLNA / uPnP DMR</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              isDlnaActive
                ? 'bg-purple-900/60 text-purple-300 border border-purple-400/30 font-semibold'
                : 'bg-[#121522] text-neutral-400'
            }`}>
              {isDlnaActive ? '● STREAMING' : 'READY (24/7)'}
            </span>
          </div>

          <div className="text-xs space-y-1 text-neutral-300">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-neutral-500">Device Name:</span>
              <span className="text-white font-medium">{state.dlnaName}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-neutral-500">SSDP / AVTrans:</span>
              <span className="text-purple-400">Port 1900 / {state.dlnaPort}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-neutral-500">Active Controller:</span>
              <span className="text-neutral-200">{state.dlnaClient || 'None (Awaiting UPnP)'}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#181c2d] flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 font-mono">PCM / WAV / FLAC 24b</span>
            <button
              onClick={() => onActivateSource('dlna', 'BubbleUPnP / Audirvana')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
            >
              {isDlnaActive ? 'Re-sync Stream' : 'Simulate Connect'}
            </button>
          </div>
        </div>
      </div>

      {/* Hardware DAC UDA1334A I2S Status Bar */}
      <div className="bg-[#05060a] border border-[#181b28] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-neutral-200">Hardware I2S DAC: NXP UDA1334A</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Zero Jitter PLL Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-neutral-400">
          <div className="bg-[#0c0e16] p-2 rounded-lg border border-[#181c2b]">
            <span className="text-neutral-500 block text-[10px]">BCLK (Bit Clock)</span>
            <span className="text-white font-semibold">GPIO {state.i2sDac.bclkPin}</span>
          </div>
          <div className="bg-[#0c0e16] p-2 rounded-lg border border-[#181c2b]">
            <span className="text-neutral-500 block text-[10px]">WCLK / LRCK</span>
            <span className="text-white font-semibold">GPIO {state.i2sDac.wclkPin}</span>
          </div>
          <div className="bg-[#0c0e16] p-2 rounded-lg border border-[#181c2b]">
            <span className="text-neutral-500 block text-[10px]">DIN (Data In)</span>
            <span className="text-white font-semibold">GPIO {state.i2sDac.dataPin}</span>
          </div>
          <div className="bg-[#0c0e16] p-2 rounded-lg border border-[#181c2b]">
            <span className="text-neutral-500 block text-[10px]">DMA Underruns</span>
            <span className="text-emerald-400 font-semibold">{state.i2sDac.bufferUnderruns} (Clean)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
