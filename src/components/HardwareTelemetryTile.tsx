import React from 'react';
import { Cpu, Zap, Thermometer, Database, CheckCircle, Activity } from 'lucide-react';
import { HardwareTelemetry } from '../types';

interface HardwareTelemetryTileProps {
  telemetry: HardwareTelemetry;
}

export const HardwareTelemetryTile: React.FC<HardwareTelemetryTileProps> = ({
  telemetry,
}) => {
  const psramPercent = Math.round(
    ((telemetry.octalPsramTotal - telemetry.octalPsramFree) / telemetry.octalPsramTotal) * 100
  );
  const sramPercent = Math.round(
    ((telemetry.internalSramTotal - telemetry.internalSramFree) / telemetry.internalSramTotal) * 100
  );

  return (
    <div id="tile-hardware-telemetry" className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              ESP32-S3 N16R8 Hardware Telemetry
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                240MHz Dual Core
              </span>
            </h3>
            <p className="text-xs text-neutral-400">8MB Octal PSRAM + 16MB Flash real-time diagnostics</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-300 bg-[#12141f] px-2.5 py-1 rounded-md border border-[#222538]">
          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
          <span>{telemetry.coreTemperature}°C</span>
        </div>
      </div>

      {/* Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Octal PSRAM (8MB) */}
        <div className="p-3 rounded-xl bg-[#06070a] border border-[#181a27]">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-semibold text-white flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              8MB Octal PSRAM
            </span>
            <span className="font-mono text-emerald-400 font-bold">{psramPercent}%</span>
          </div>
          <div className="w-full bg-[#121522] h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${psramPercent}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-neutral-400">
            <span>Free: {(telemetry.octalPsramFree / 1024).toFixed(1)} MB</span>
            <span>Total: 8.0 MB</span>
          </div>
        </div>

        {/* Internal SRAM */}
        <div className="p-3 rounded-xl bg-[#06070a] border border-[#181a27]">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-semibold text-white flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Internal SRAM
            </span>
            <span className="font-mono text-cyan-400 font-bold">{sramPercent}%</span>
          </div>
          <div className="w-full bg-[#121522] h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${sramPercent}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-neutral-400">
            <span>Free: {telemetry.internalSramFree} KB</span>
            <span>Total: {telemetry.internalSramTotal} KB</span>
          </div>
        </div>

        {/* CPU Dual Core Load */}
        <div className="p-3 rounded-xl bg-[#06070a] border border-[#181a27]">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-semibold text-white flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              CPU Core Load
            </span>
            <span className="font-mono text-neutral-400 text-[11px]">240 MHz</span>
          </div>
          <div className="space-y-1 mt-1.5">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>Core 0 (Audio/DSP):</span>
              <span className="text-emerald-400 font-semibold">{telemetry.core0Load}%</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>Core 1 (Net/WiFi):</span>
              <span className="text-cyan-400 font-semibold">{telemetry.core1Load}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* FreeRTOS Tasks Table */}
      <div className="bg-[#05060a] border border-[#171a28] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white">FreeRTOS Real-Time Kernel Tasks</span>
          <span className="text-[10px] font-mono text-neutral-500">Tick: 1000 Hz · Preemptive</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          {telemetry.freeRtosTasks.map((t) => (
            <div key={t.name} className="bg-[#0b0d14] p-2 rounded-lg border border-[#181a26]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white font-semibold truncate">{t.name}</span>
                <span className="text-emerald-400">C{t.coreId}</span>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-500 mt-1">
                <span>Prio: {t.priority}</span>
                <span className="text-neutral-400">{t.state}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
