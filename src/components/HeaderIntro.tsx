import React from 'react';
import { 
  Wifi, 
  Cpu, 
  Code2, 
  Radio, 
  Server,
  Airplay,
  Cast,
  Volume2,
  Settings
} from 'lucide-react';
import { WiFiConfig, HardwareTelemetry, AirPlayDlnaState } from '../types';

interface HeaderIntroProps {
  wifiConfig: WiFiConfig;
  telemetry: HardwareTelemetry;
  airplayDlna: AirPlayDlnaState;
  onOpenFirmwareHub: () => void;
  onOpenWifiModal: () => void;
}

export const HeaderIntro: React.FC<HeaderIntroProps> = ({
  wifiConfig,
  telemetry,
  airplayDlna,
  onOpenFirmwareHub,
  onOpenWifiModal,
}) => {
  return (
    <header className="w-full bg-[#050507] border-b border-[#181920] px-4 py-3 sm:px-6 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Hardware Specs */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-900/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ESP32-S3 Hi-Fi Music Streamer
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                N16R8 · 8MB PSRAM
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                DAC UDA1334A
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Production-grade AirPlay 2 &amp; DLNA 24/7 Server · Multi-Codec DSP Engine · Dual OTA
            </p>
          </div>
        </div>

        {/* Right: Active Server Icons & Status Badges (Server, Airplay, DLNA, Wi-Fi) */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          
          {/* 1. Active Web / Stream Server Icon */}
          <div 
            id="badge-active-server"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e121d] border border-emerald-500/40 text-xs font-mono text-neutral-200 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            title="ESP-IDF Embedded Web & Stream Server is Active on Port 80 / 443"
          >
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 text-[10px] hidden sm:inline">Server:</span>
              <span className="text-emerald-400 font-semibold text-xs">:80</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* 2. Active AirPlay 2 Daemon Icon */}
          <div 
            id="badge-active-airplay"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
              airplayDlna.airplayEnabled
                ? 'bg-[#091522] border-cyan-500/40 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                : 'bg-[#0e1017] border-[#1f2330] text-neutral-500'
            }`}
            title={`Apple AirPlay 2 Daemon on Port ${airplayDlna.airplayPort} (${airplayDlna.airplayStatus})`}
          >
            <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Airplay className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 text-[10px] hidden sm:inline">AirPlay:</span>
              <span className="text-cyan-400 font-semibold text-xs">:{airplayDlna.airplayPort}</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>

          {/* 3. Active DLNA / UPnP Daemon Icon */}
          <div 
            id="badge-active-dlna"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
              airplayDlna.dlnaEnabled
                ? 'bg-[#0d1024] border-indigo-500/40 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                : 'bg-[#0e1017] border-[#1f2330] text-neutral-500'
            }`}
            title={`DLNA / UPnP Media Renderer on Port ${airplayDlna.dlnaPort} (${airplayDlna.dlnaStatus})`}
          >
            <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cast className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 text-[10px] hidden sm:inline">DLNA:</span>
              <span className="text-indigo-400 font-semibold text-xs">:{airplayDlna.dlnaPort}</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            </div>
          </div>

          {/* 4. Wi-Fi Status / Setup Trigger (Click to open Startup Wi-Fi dialog) */}
          <button
            id="btn-open-wifi-setup"
            onClick={onOpenWifiModal}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0e1017] border border-[#1f2330] hover:border-emerald-500/50 text-xs font-mono text-neutral-200 transition-colors cursor-pointer"
            title="Click to view or change Wi-Fi settings"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {wifiConfig.mode === 'STA' && wifiConfig.staConnected ? (
                <>
                  <span className="text-emerald-400 font-semibold">{wifiConfig.mdnsHostname}</span>
                  <span className="text-neutral-500 hidden lg:inline"> ({wifiConfig.staIP})</span>
                </>
              ) : (
                <span className="text-amber-400 font-semibold">AP: {wifiConfig.apSSID}</span>
              )}
            </span>
            <Settings className="w-3 h-3 text-neutral-500 hover:text-white ml-1" />
          </button>

          {/* 5. Production Firmware Code Hub Button */}
          <button
            id="btn-open-firmware-hub"
            onClick={onOpenFirmwareHub}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer shrink-0"
            title="Open Complete Production ESP-IDF v5 C/C++ Codebase & Wiring Schematic"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">ESP-IDF Source</span>
          </button>
        </div>
      </div>
    </header>
  );
};
