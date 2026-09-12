import React, { useState, useRef } from 'react';
import { 
  HardDriveDownload, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  FileCode, 
  ExternalLink,
  UploadCloud,
  Cpu,
  Github,
  GitBranch
} from 'lucide-react';
import { OtaState, PartitionInfo } from '../types';
import { DEFAULT_PARTITIONS } from '../data/radioStations';

interface OtaManagerTileProps {
  otaState: OtaState;
  onStartOta: (file: File | string, mode: 'file' | 'url') => void;
  onOpenFirmwareHub?: () => void;
}

export const OtaManagerTile: React.FC<OtaManagerTileProps> = ({
  otaState,
  onStartOta,
  onOpenFirmwareHub,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('https://firmware.espmusic.local/releases/s3-n16r8-v2.4.2.bin');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [showPartitionTable, setShowPartitionTable] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFileName(file.name);
    onStartOta(file, 'file');
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (remoteUrl.trim()) {
      onStartOta(remoteUrl.trim(), 'url');
    }
  };

  const isFlashing = otaState.status === 'flashing' || otaState.status === 'verifying';
  const isRebooting = otaState.status === 'rebooting';

  return (
    <div id="tile-ota-manager" className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <HardDriveDownload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Dual-Bank Robust OTA Firmware Updater
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                Rollback Safe
              </span>
            </h3>
            <p className="text-xs text-neutral-400">Fail-safe dual 4MB partition switching with MD5/SHA256 verification</p>
          </div>
        </div>

        <button
          onClick={() => setShowPartitionTable(!showPartitionTable)}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-md bg-[#12141f] border border-[#212538] transition-colors cursor-pointer"
        >
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>{showPartitionTable ? 'Hide Partitions' : 'Flash Map (16MB)'}</span>
        </button>
      </div>

      {/* Dual Partition Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Active Boot Slot */}
        <div className="p-3.5 rounded-xl bg-[#06080d] border border-emerald-500/40">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-white font-mono">{otaState.currentPartition.toUpperCase()} (Active)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              RUNNING
            </span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 space-y-0.5">
            <div className="flex justify-between">
              <span>App Version:</span>
              <span className="text-white font-semibold">{otaState.appVersion}</span>
            </div>
            <div className="flex justify-between">
              <span>Offset:</span>
              <span className="text-neutral-300">0x020000 (4096 KB)</span>
            </div>
            <div className="flex justify-between">
              <span>Rollback State:</span>
              <span className="text-emerald-400">Validated (Cancel Rollback)</span>
            </div>
          </div>
        </div>

        {/* Next OTA Target Slot */}
        <div className="p-3.5 rounded-xl bg-[#06080d] border border-[#1e2336]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs font-bold text-white font-mono">{otaState.nextPartition.toUpperCase()} (Target)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131724] text-cyan-300 border border-[#222940]">
              READY FOR FLASH
            </span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Target Partition:</span>
              <span className="text-cyan-300 font-semibold">{otaState.nextPartition}</span>
            </div>
            <div className="flex justify-between">
              <span>Offset:</span>
              <span className="text-neutral-300">0x420000 (4096 KB)</span>
            </div>
            <div className="flex justify-between">
              <span>Integrity Guard:</span>
              <span className="text-neutral-300">SHA-256 Block Signature</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flashing Progress Bar if Active */}
      {(isFlashing || isRebooting) && (
        <div className="bg-[#05060b] border border-emerald-500/50 rounded-xl p-4 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="flex items-center justify-between mb-2 text-xs font-mono">
            <span className="text-white font-semibold flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              {otaState.statusMessage}
            </span>
            <span className="text-emerald-400 font-bold">{otaState.progress}%</span>
          </div>

          <div className="w-full bg-[#121522] h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${otaState.progress}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-neutral-400">
            <span>Speed: {otaState.writeSpeedKbps} KB/s</span>
            <span>Written: {(otaState.transferredBytes / 1024).toFixed(0)} / {(otaState.totalBytes / 1024).toFixed(0)} KB</span>
            <span>Target: {otaState.nextPartition}</span>
          </div>
        </div>
      )}

      {/* Firmware Upload & URL Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Upload .bin File */}
        <div
          onClick={() => !isFlashing && fileInputRef.current?.click()}
          className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isFlashing 
              ? 'opacity-50 cursor-not-allowed bg-[#07080c] border-[#181a24]' 
              : 'bg-[#06070a] border-[#202538] hover:border-emerald-500/40 hover:bg-[#090b12]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <UploadCloud className="w-6 h-6 text-emerald-400 mb-1.5" />
          <span className="text-xs font-bold text-white">Upload Firmware Binary (.bin)</span>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            {selectedFileName || 'Click to select esp32-s3-music.bin'}
          </span>
        </div>

        {/* Remote URL OTA Form */}
        <form onSubmit={handleUrlSubmit} className="p-3.5 rounded-xl bg-[#06070a] border border-[#1a1e2f] flex flex-col justify-between">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Remote Server OTA URL
            </label>
            <input
              type="url"
              required
              disabled={isFlashing}
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0a0c13] border border-[#21263c] text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isFlashing}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
            >
              Fetch &amp; Flash URL
            </button>
          </div>
        </form>
      </div>

      {/* GitHub Repo Build & CI/CD Banner */}
      <div className="p-3.5 rounded-xl bg-[#070912] border border-emerald-500/20 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Github className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              Build via GitHub Repository
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                Actions CI Ready
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Automated compilation pipeline (<code className="text-emerald-400 font-mono">.github/workflows/build-firmware.yml</code>) compiles ESP-IDF v5 &amp; pushes verified binary releases.
            </p>
          </div>
        </div>

        {onOpenFirmwareHub && (
          <button
            type="button"
            onClick={onOpenFirmwareHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-emerald-300 hover:text-white bg-[#0e1322] hover:bg-[#161d33] border border-emerald-500/30 transition-all cursor-pointer shrink-0"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Repo Files</span>
          </button>
        )}
      </div>

      {/* 16MB Partition Table Inspector Modal / Accordion */}
      {showPartitionTable && (
        <div className="bg-[#05060a] border border-[#1a1d2d] rounded-xl p-3 mt-2 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white font-mono">partitions_16mb.csv (Production Layout)</span>
            <span className="text-[10px] font-mono text-neutral-500">Dual 4MB OTA + SPIFFS Web Server</span>
          </div>

          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[#181a27] text-neutral-500 text-[10px]">
                <th className="pb-1">Name</th>
                <th className="pb-1">Type</th>
                <th className="pb-1">SubType</th>
                <th className="pb-1">Offset</th>
                <th className="pb-1">Size</th>
                <th className="pb-1">Description / Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131520] text-neutral-300">
              {DEFAULT_PARTITIONS.map((p) => (
                <tr key={p.name} className={p.name === otaState.currentPartition ? 'bg-emerald-950/20 text-emerald-300' : ''}>
                  <td className="py-1 font-bold">{p.name}</td>
                  <td className="py-1 text-neutral-400">{p.type}</td>
                  <td className="py-1 text-neutral-400">{p.subtype}</td>
                  <td className="py-1">{p.offset}</td>
                  <td className="py-1 text-white">{p.size}</td>
                  <td className="py-1 text-neutral-400">{p.flags}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
