import React, { useState } from 'react';
import { Wifi, Lock, Unlock, RefreshCw, Globe, Check, AlertCircle, Server, Shield } from 'lucide-react';
import { WiFiConfig, WiFiNetwork } from '../types';

interface WiFiManagerTileProps {
  config: WiFiConfig;
  onSaveWifi: (config: Partial<WiFiConfig>) => void;
  onSwitchMode: (mode: 'AP' | 'STA' | 'AP_STA') => void;
}

const SAMPLE_SCANNED_NETWORKS: WiFiNetwork[] = [
  { ssid: 'Home-Fiber-5G-2.4G', rssi: -48, secure: true, channel: 6 },
  { ssid: 'LivingRoom-HiFi-Net', rssi: -55, secure: true, channel: 1 },
  { ssid: 'Studio-Audio-Pro', rssi: -62, secure: true, channel: 11 },
  { ssid: 'Guest_Open_Wifi', rssi: -78, secure: false, channel: 6 },
  { ssid: 'Neighbor_Net_Ext', rssi: -84, secure: true, channel: 9 },
];

export const WiFiManagerTile: React.FC<WiFiManagerTileProps> = ({
  config,
  onSaveWifi,
  onSwitchMode,
}) => {
  const [selectedSSID, setSelectedSSID] = useState(config.staSSID || 'Home-Fiber-5G-2.4G');
  const [password, setPassword] = useState(config.staPassword || '••••••••');
  const [hostname, setHostname] = useState(config.mdnsHostname.replace('.local', ''));
  const [isScanning, setIsScanning] = useState(false);
  const [scannedList, setScannedList] = useState<WiFiNetwork[]>(SAMPLE_SCANNED_NETWORKS);
  const [connectingProgress, setConnectingProgress] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedList(SAMPLE_SCANNED_NETWORKS);
    }, 1200);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setConnectingProgress(true);
    setConnectionSuccess(false);

    setTimeout(() => {
      setConnectingProgress(false);
      setConnectionSuccess(true);
      onSaveWifi({
        staSSID: selectedSSID,
        staPassword: password,
        mdnsHostname: `${hostname}.local`,
        staConnected: true,
        mode: 'STA',
      });
      setTimeout(() => setConnectionSuccess(false), 3000);
    }, 1500);
  };

  const getSignalBars = (rssi: number) => {
    if (rssi > -60) return 'text-emerald-400';
    if (rssi > -75) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div id="tile-wifi-manager" className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Wi-Fi Setup &amp; Live .local Server
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                mDNS Active
              </span>
            </h3>
            <p className="text-xs text-neutral-400">Captive AP startup fallback + zero-conf .local discovery</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-[#07080d] p-0.5 rounded-lg border border-[#1a1e2f] text-xs font-mono">
          <button
            onClick={() => onSwitchMode('STA')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              config.mode === 'STA'
                ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            STA Mode
          </button>
          <button
            onClick={() => onSwitchMode('AP')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              config.mode === 'AP'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            AP Portal
          </button>
        </div>
      </div>

      {/* Active Connection Banner */}
      <div className="bg-[#05060a] border border-[#171a28] rounded-xl p-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center">
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Live Local Host:</span>
              <a 
                href={`http://${config.mdnsHostname}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                http://{config.mdnsHostname}
              </a>
            </div>
            <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
              IP: <span className="text-neutral-200">{config.staIP}</span> · Gateway: {config.staGateway} · RSSI: {config.staRSSI} dBm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Home Wi-Fi Saved
          </span>
        </div>
      </div>

      {/* Scanned Networks & AP Form */}
      <form onSubmit={handleConnect} className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-neutral-300 flex items-center gap-1">
              Select Scanned 2.4GHz Wi-Fi Network
            </label>
            <button
              type="button"
              onClick={handleScan}
              disabled={isScanning}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Re-scan'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-1">
            {scannedList.map((net) => (
              <button
                type="button"
                key={net.ssid}
                onClick={() => setSelectedSSID(net.ssid)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                  selectedSSID === net.ssid
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-white font-medium'
                    : 'bg-[#06070b] border-[#181a27] text-neutral-300 hover:border-[#2a2f44]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {net.secure ? <Lock className="w-3 h-3 text-neutral-500" /> : <Unlock className="w-3 h-3 text-amber-500" />}
                  <span className="truncate">{net.ssid}</span>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ml-1 ${getSignalBars(net.rssi)}`}>
                  {net.rssi} dBm
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* SSID & Password & Hostname Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Target SSID</label>
            <input
              type="text"
              required
              value={selectedSSID}
              onChange={(e) => setSelectedSSID(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#07080d] border border-[#1e2233] text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Wi-Fi WPA2/3 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter passphrase"
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#07080d] border border-[#1e2233] text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">mDNS Hostname</label>
            <div className="flex items-center">
              <input
                type="text"
                required
                value={hostname}
                onChange={(e) => setHostname(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full px-2.5 py-1.5 rounded-l-lg bg-[#07080d] border border-r-0 border-[#1e2233] text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="px-2 py-1.5 bg-[#12141f] border border-[#1e2233] rounded-r-lg text-xs font-mono text-neutral-400">
                .local
              </span>
            </div>
          </div>
        </div>

        {/* Submit & Status Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>NVS Non-Volatile Memory saves configuration across reboots</span>
          </div>

          <button
            type="submit"
            disabled={connectingProgress}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {connectingProgress ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Handshaking with Router...</span>
              </>
            ) : connectionSuccess ? (
              <>
                <Check className="w-3 h-3" />
                <span>Connected &amp; Saved!</span>
              </>
            ) : (
              <span>Save &amp; Connect Live</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
