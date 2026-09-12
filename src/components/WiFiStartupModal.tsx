import React, { useState } from 'react';
import { 
  Wifi, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Globe, 
  Check, 
  AlertCircle, 
  Server, 
  Shield,
  X,
  Radio,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { WiFiConfig, WiFiNetwork } from '../types';

interface WiFiStartupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WiFiConfig;
  onSaveWifi: (config: Partial<WiFiConfig>) => void;
  onSwitchMode: (mode: 'AP' | 'STA' | 'AP_STA') => void;
  isInitialStartup?: boolean;
}

const SAMPLE_SCANNED_NETWORKS: WiFiNetwork[] = [
  { ssid: 'Home-Fiber-5G-2.4G', rssi: -48, secure: true, channel: 6 },
  { ssid: 'LivingRoom-HiFi-Net', rssi: -55, secure: true, channel: 1 },
  { ssid: 'Studio-Audio-Pro', rssi: -62, secure: true, channel: 11 },
  { ssid: 'Guest_Open_Wifi', rssi: -78, secure: false, channel: 6 },
  { ssid: 'Neighbor_Net_Ext', rssi: -84, secure: true, channel: 9 },
];

export const WiFiStartupModal: React.FC<WiFiStartupModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveWifi,
  onSwitchMode,
  isInitialStartup = false,
}) => {
  const [selectedSSID, setSelectedSSID] = useState(config.staSSID || 'Home-Fiber-5G-2.4G');
  const [password, setPassword] = useState(config.staPassword || '••••••••');
  const [hostname, setHostname] = useState(config.mdnsHostname.replace('.local', ''));
  const [isScanning, setIsScanning] = useState(false);
  const [scannedList, setScannedList] = useState<WiFiNetwork[]>(SAMPLE_SCANNED_NETWORKS);
  const [connectingProgress, setConnectingProgress] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  if (!isOpen) return null;

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedList(SAMPLE_SCANNED_NETWORKS);
    }, 1000);
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
      setTimeout(() => {
        setConnectionSuccess(false);
        onClose();
      }, 1200);
    }, 1200);
  };

  const getSignalBars = (rssi: number) => {
    if (rssi > -60) return 'text-emerald-400';
    if (rssi > -75) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="modal-wifi-startup"
        className="bg-[#090b12] border border-[#202538] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#181d2e] bg-[#07080f]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {isInitialStartup ? 'ESP32-S3 Wi-Fi Startup Wizard' : 'Wi-Fi & Network Configuration'}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  {config.mode === 'STA' ? 'Home Wi-Fi' : 'Captive AP'}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Configure network credentials once at startup. Main dashboard stays clean thereafter.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1a1f30] transition-colors cursor-pointer"
            title="Close Wi-Fi Setup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between bg-[#05060a] p-1.5 rounded-xl border border-[#1b2032]">
            <div className="text-xs text-neutral-400 px-2 font-mono">Operating Mode:</div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSwitchMode('STA')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  config.mode === 'STA'
                    ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                STA (Connect to Home Router)
              </button>
              <button
                type="button"
                onClick={() => onSwitchMode('AP')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  config.mode === 'AP'
                    ? 'bg-amber-500 text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                AP (Standalone Hotspot)
              </button>
            </div>
          </div>

          {/* Scanned Networks Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Select Available 2.4 GHz Network
              </span>
              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-[#101422] border border-emerald-500/20 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Rescan'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {scannedList.map((net) => {
                const isSelected = selectedSSID === net.ssid;
                return (
                  <button
                    key={net.ssid}
                    type="button"
                    onClick={() => setSelectedSSID(net.ssid)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-white font-medium'
                        : 'bg-[#06070c] border-[#181d2c] text-neutral-300 hover:border-[#2a3048] hover:bg-[#0c0e18]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wifi className={`w-3.5 h-3.5 ${getSignalBars(net.rssi)}`} />
                      <span>{net.ssid}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                      <span>{net.rssi} dBm</span>
                      {net.secure ? <Lock className="w-3 h-3 text-neutral-400" /> : <Unlock className="w-3 h-3 text-neutral-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Selected Wi-Fi SSID
                </label>
                <input
                  type="text"
                  value={selectedSSID}
                  onChange={(e) => setSelectedSSID(e.target.value)}
                  placeholder="Network SSID"
                  className="w-full px-3 py-2 rounded-xl bg-[#06070c] border border-[#1e2336] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  WPA2/WPA3 Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Wi-Fi Password"
                  className="w-full px-3 py-2 rounded-xl bg-[#06070c] border border-[#1e2336] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* mDNS Hostname */}
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1 flex items-center justify-between">
                <span>mDNS Zero-Config Local Hostname</span>
                <span className="text-[10px] text-emerald-400 font-mono">http://{hostname}.local</span>
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="espmusic"
                  className="flex-1 px-3 py-2 rounded-l-xl bg-[#06070c] border border-r-0 border-[#1e2336] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="px-3 py-2 bg-[#101422] border border-[#1e2336] text-xs font-mono text-neutral-400 rounded-r-xl">
                  .local
                </span>
              </div>
            </div>

            {/* Status Messages */}
            {connectionSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Wi-Fi Credentials Saved! Streamer connected to {selectedSSID}. Entering Music Dashboard...</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#181d2e] gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono text-neutral-400 hover:text-white bg-[#0f121d] hover:bg-[#161a2b] border border-[#202538] transition-colors cursor-pointer"
              >
                Skip / Continue with Current Settings
              </button>

              <button
                type="submit"
                disabled={connectingProgress}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
              >
                {connectingProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting to Wi-Fi...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save &amp; Start Listening</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
