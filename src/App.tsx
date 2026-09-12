/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AudioSourceType, 
  PlaybackStatus, 
  TrackMetadata, 
  DspEqSettings, 
  WiFiConfig, 
  AirPlayDlnaState, 
  OtaState, 
  HardwareTelemetry,
  RadioStation,
  EqPresetId 
} from './types';
import { RADIO_STATIONS, EQ_PRESETS } from './data/radioStations';
import { audioEngine } from './services/audioEngine';
import { HeaderIntro } from './components/HeaderIntro';
import { MasterControlBar } from './components/MasterControlBar';
import { UnifiedAudioSourceTile } from './components/UnifiedAudioSourceTile';
import { DspEqualizerTile } from './components/DspEqualizerTile';
import { AirPlayDlnaTile } from './components/AirPlayDlnaTile';
import { CodecEngineTile } from './components/CodecEngineTile';
import { OtaManagerTile } from './components/OtaManagerTile';
import { HardwareTelemetryTile } from './components/HardwareTelemetryTile';
import { FirmwareHubModal } from './components/FirmwareHubModal';
import { WiFiStartupModal } from './components/WiFiStartupModal';

export default function App() {
  // 1. Playback & Track State
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('stopped');
  const [activeSource, setActiveSource] = useState<AudioSourceType>('radio');
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [stationsList, setStationsList] = useState<RadioStation[]>(RADIO_STATIONS);
  const [activeDirectUrl, setActiveDirectUrl] = useState<string>('');
  
  // Wi-Fi Startup Modal only (hidden from main UI after setup)
  const [isWifiSetupOpen, setIsWifiSetupOpen] = useState<boolean>(false);
  
  const [trackInfo, setTrackInfo] = useState<TrackMetadata>({
    title: RADIO_STATIONS[0].name,
    artist: RADIO_STATIONS[0].genre,
    stationName: RADIO_STATIONS[0].country,
    codec: RADIO_STATIONS[0].codec,
    bitrate: RADIO_STATIONS[0].bitrate,
    sampleRate: 44100,
    bitDepth: 16,
  });

  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 2. DSP 3-Band Parametric EQ State
  const [dspSettings, setDspSettings] = useState<DspEqSettings>({
    bass: 0,
    mid: 0,
    treble: 0,
    preset: 'flat',
    preampGain: 0,
    loudnessCompensation: false,
    stereoWidth: 100,
  });

  // 3. Wi-Fi & Live .local Configuration State
  const [wifiConfig, setWifiConfig] = useState<WiFiConfig>({
    mode: 'STA',
    apSSID: 'ESP32-HiFi-Audio-Setup',
    apPassword: '',
    apIP: '192.168.4.1',
    staSSID: 'Home-Fiber-5G-2.4G',
    staPassword: '••••••••',
    staConnected: true,
    staIP: '192.168.1.145',
    staGateway: '192.168.1.1',
    staSubnet: '255.255.255.0',
    staDNS: '1.1.1.1',
    staRSSI: -52,
    useStaticIP: false,
    mdnsHostname: 'espmusic.local',
    autoReconnect: true,
  });

  // 4. AirPlay 2 & DLNA State
  const [airplayDlna, setAirplayDlna] = useState<AirPlayDlnaState>({
    airplayEnabled: true,
    airplayName: 'ESP32 Hi-Fi Streamer',
    airplayStatus: 'ready',
    airplayClient: null,
    airplayPort: 5000,
    airplayVolumeSync: true,
    dlnaEnabled: true,
    dlnaName: 'ESP32-S3 UDA1334A Renderer',
    dlnaStatus: 'ready',
    dlnaClient: null,
    dlnaPort: 49152,
    i2sDac: {
      chip: 'UDA1334A',
      bclkPin: 4,
      wclkPin: 5,
      dataPin: 6,
      sampleRate: 44100,
      bitDepth: 16,
      dmaBufferSize: 512,
      dmaBufferCount: 8,
      bufferUnderruns: 0,
      mclkInternalPll: true,
    },
  });

  // 5. OTA System State
  const [otaState, setOtaState] = useState<OtaState>({
    currentPartition: 'ota_0',
    nextPartition: 'ota_1',
    appVersion: 'v2.4.1-s3-n16r8',
    hardwareVersion: 'ESP32-S3-WROOM-1-N16R8',
    buildTimestamp: '2026-09-11 20:00:00 UTC',
    status: 'idle',
    progress: 0,
    writeSpeedKbps: 185,
    transferredBytes: 0,
    totalBytes: 2457600,
    md5Verified: true,
    sha256Hash: 'a9f4c3b2e1d0876543210fedcba9876543210fedcba9876543210fedcba98765',
    autoRollback: true,
    statusMessage: 'Partitions healthy. Ready for OTA update.',
  });

  // 6. Hardware Telemetry State
  const [telemetry, setTelemetry] = useState<HardwareTelemetry>({
    chip: 'ESP32-S3-WROOM-1-N16R8',
    cpuFreqMhz: 240,
    core0Load: 24,
    core1Load: 18,
    internalSramTotal: 512,
    internalSramFree: 384,
    octalPsramTotal: 8192,
    octalPsramFree: 6420,
    flashTotalMb: 16,
    flashUsedMb: 3.8,
    coreTemperature: 42.4,
    uptimeSeconds: 86420,
    freeRtosTasks: [
      { name: 'AudioI2STask', state: 'Running', priority: 22, stackFreeKb: 4.2, coreId: 0 },
      { name: 'AirPlayRtpTask', state: 'Blocked', priority: 18, stackFreeKb: 8.5, coreId: 1 },
      { name: 'UpnpDmrTask', state: 'Blocked', priority: 14, stackFreeKb: 6.0, coreId: 1 },
      { name: 'WebServerTask', state: 'Ready', priority: 5, stackFreeKb: 7.8, coreId: 1 },
    ],
  });

  // 7. Modals
  const [isFirmwareHubOpen, setIsFirmwareHubOpen] = useState<boolean>(false);

  // Initialize Web Audio Engine once
  useEffect(() => {
    audioEngine.init({
      onStatusChange: (status) => setPlaybackStatus(status),
      onError: (msg) => console.warn('AudioEngine warning:', msg),
    });
  }, []);

  // Periodic Telemetry Fluctuation for real hardware feel
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        core0Load: Math.floor(20 + Math.random() * 15),
        core1Load: Math.floor(12 + Math.random() * 10),
        coreTemperature: parseFloat((42.0 + Math.random() * 1.5).toFixed(1)),
        uptimeSeconds: prev.uptimeSeconds + 3,
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Playback Handlers
  const handlePlayStation = (station: RadioStation) => {
    setActiveSource('radio');
    setTrackInfo({
      title: station.name,
      artist: station.genre,
      stationName: station.country,
      codec: station.codec,
      bitrate: station.bitrate,
      sampleRate: 44100,
      bitDepth: 16,
    });
    audioEngine.playStream(station.streamUrl);
  };

  const handlePlay = () => {
    if (playbackStatus === 'paused') {
      audioEngine.resume();
    } else {
      const cur = stationsList[currentStationIndex];
      handlePlayStation(cur);
    }
  };

  const handlePause = () => {
    audioEngine.pause();
  };

  const handleStop = () => {
    audioEngine.stop();
  };

  const handleNext = () => {
    const nextIdx = (currentStationIndex + 1) % stationsList.length;
    setCurrentStationIndex(nextIdx);
    handlePlayStation(stationsList[nextIdx]);
  };

  const handlePrevious = () => {
    const prevIdx = (currentStationIndex - 1 + stationsList.length) % stationsList.length;
    setCurrentStationIndex(prevIdx);
    handlePlayStation(stationsList[prevIdx]);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMute(nextMute);
  };

  // DSP EQ Handler
  const handleUpdateEq = (
    bass: number, 
    mid: number, 
    treble: number, 
    presetId: EqPresetId = 'custom', 
    preamp: number = 0
  ) => {
    setDspSettings((prev) => ({
      ...prev,
      bass,
      mid,
      treble,
      preset: presetId,
      preampGain: preamp,
    }));
    audioEngine.setEq(bass, mid, treble, preamp);
  };

  // Direct HTTP/HTTPS Stream URL Handler
  const handlePlayDirectUrl = (url: string, customTitle?: string) => {
    setActiveSource('direct_url');
    setActiveDirectUrl(url);

    // Auto-detect codec from file extension or stream path
    const cleanUrl = url.split('?')[0].toLowerCase();
    let detectedCodec: 'MP3' | 'AAC' | 'FLAC' | 'WAV' | 'OPUS' = 'MP3';
    let detectedBitrate = 192;

    if (cleanUrl.endsWith('.flac')) {
      detectedCodec = 'FLAC';
      detectedBitrate = 1411;
    } else if (cleanUrl.endsWith('.aac') || cleanUrl.endsWith('.m4a')) {
      detectedCodec = 'AAC';
      detectedBitrate = 256;
    } else if (cleanUrl.endsWith('.opus') || cleanUrl.endsWith('.ogg')) {
      detectedCodec = 'OPUS';
      detectedBitrate = 160;
    } else if (cleanUrl.endsWith('.wav')) {
      detectedCodec = 'WAV';
      detectedBitrate = 1411;
    }

    try {
      const parsed = new URL(url);
      const hostLabel = parsed.hostname;
      const pathLabel = parsed.pathname.split('/').filter(Boolean).pop() || 'Live Stream';

      setTrackInfo({
        title: customTitle || decodeURIComponent(pathLabel),
        artist: `Direct Stream (${hostLabel})`,
        stationName: parsed.protocol === 'https:' ? 'Secure HTTPS Stream' : 'HTTP Audio Stream',
        codec: detectedCodec,
        bitrate: detectedBitrate,
        sampleRate: 44100,
        bitDepth: 16,
      });
    } catch {
      setTrackInfo({
        title: customTitle || 'Direct Web Audio Stream',
        artist: 'HTTP / HTTPS Direct Link',
        stationName: 'Direct I2S DMA Sink',
        codec: detectedCodec,
        bitrate: detectedBitrate,
        sampleRate: 44100,
        bitDepth: 16,
      });
    }

    audioEngine.playStream(url);
  };

  // Local File Audition Handler
  const handlePlayLocalFile = (file: File) => {
    setActiveSource('local_file');
    const ext = file.name.split('.').pop()?.toUpperCase() || 'WAV';
    setTrackInfo({
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local Audio File (Audition)',
      stationName: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      codec: (ext === 'MP3' || ext === 'FLAC' || ext === 'AAC' || ext === 'OPUS') ? ext : 'WAV',
      bitrate: 320,
      sampleRate: 48000,
      bitDepth: 24,
    });
    audioEngine.playLocalFile(file);
  };

  // AirPlay / DLNA stream trigger
  const handleActivateSource = (source: AudioSourceType, clientName?: string) => {
    setActiveSource(source);
    if (source === 'airplay') {
      setAirplayDlna((prev) => ({ ...prev, airplayClient: clientName || 'Apple Device' }));
      setTrackInfo({
        title: 'Lossless AirPlay 2 Audio Stream',
        artist: clientName || 'iPhone 15 Pro',
        stationName: 'Apple Lossless ALAC',
        codec: 'ALAC',
        bitrate: 1411,
        sampleRate: 44100,
        bitDepth: 16,
      });
      audioEngine.playStream(stationsList[0].streamUrl);
    } else if (source === 'dlna') {
      setAirplayDlna((prev) => ({ ...prev, dlnaClient: clientName || 'Audirvana / BubbleUPnP' }));
      setTrackInfo({
        title: 'Hi-Res DLNA / UPnP Audio Stream',
        artist: clientName || 'BubbleUPnP Renderer',
        stationName: 'Direct PCM 24-bit',
        codec: 'FLAC',
        bitrate: 2304,
        sampleRate: 96000,
        bitDepth: 24,
      });
      audioEngine.playStream(stationsList[3].streamUrl);
    }
  };

  // OTA Flashing Simulation
  const handleStartOta = (fileOrUrl: File | string, mode: 'file' | 'url') => {
    setOtaState((prev) => ({
      ...prev,
      status: 'flashing',
      progress: 0,
      statusMessage: `Erasing sector at ${prev.nextPartition}... streaming chunks`,
    }));

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setOtaState((prev) => ({
        ...prev,
        progress: Math.min(100, currentProgress),
        transferredBytes: Math.round((currentProgress / 100) * prev.totalBytes),
        statusMessage: currentProgress < 100 
          ? `Writing firmware blocks to ${prev.nextPartition} (${currentProgress}%)...`
          : 'Verifying SHA-256 hash & setting boot partition...',
      }));

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setOtaState((prev) => ({
            ...prev,
            status: 'rebooting',
            statusMessage: 'OTA Flash Successful! Switching partition & restarting ESP32-S3...',
          }));

          setTimeout(() => {
            setOtaState((prev) => ({
              ...prev,
              status: 'idle',
              currentPartition: prev.nextPartition,
              nextPartition: prev.currentPartition === 'ota_0' ? 'ota_1' : 'ota_0',
              appVersion: 'v2.4.2-s3-n16r8 (Updated)',
              progress: 0,
              statusMessage: 'Firmware updated successfully! Running from new partition.',
            }));
          }, 2000);
        }, 800);
      }
    }, 300);
  };

  const handleScrollToEq = () => {
    const eqEl = document.getElementById('tile-dsp-equalizer');
    eqEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenWifiModal = () => {
    setIsWifiSetupOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      
      {/* 1. Header & Intro with Active Server Icons (Server, AirPlay, DLNA) */}
      <HeaderIntro
        wifiConfig={wifiConfig}
        telemetry={telemetry}
        airplayDlna={airplayDlna}
        onOpenFirmwareHub={() => setIsFirmwareHubOpen(true)}
        onOpenWifiModal={handleOpenWifiModal}
      />

      {/* 2. Master Audio Playback Control Bar */}
      <MasterControlBar
        status={playbackStatus}
        source={activeSource}
        track={trackInfo}
        volume={volume}
        isMuted={isMuted}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onScrollToEq={handleScrollToEq}
      />

      {/* 3. Fully Organized Professional Grade Bento Grid (Clean & Non-Messy) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        
        {/* Row 1: Unified Audio Source Hub (Proper Dropdown) & DSP 3-Band Parametric EQ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tile 1: Unified Audio Sources (Web Radios + Hi-Fi Test Audio + Direct Link + Local File) */}
          <UnifiedAudioSourceTile
            currentStation={stationsList[currentStationIndex] || null}
            activeSource={activeSource}
            isPlaying={playbackStatus === 'playing'}
            onSelectStation={(st) => {
              const idx = stationsList.findIndex((s) => s.id === st.id);
              if (idx !== -1) {
                setCurrentStationIndex(idx);
              } else {
                setStationsList((prev) => [st, ...prev]);
                setCurrentStationIndex(0);
              }
              handlePlayStation(st);
            }}
            onPlayDirectUrl={handlePlayDirectUrl}
            onPlayLocalFile={handlePlayLocalFile}
            onTogglePlay={playbackStatus === 'playing' ? handlePause : handlePlay}
            onAddCustomStation={(st) => {
              setStationsList((prev) => [st, ...prev]);
              setCurrentStationIndex(0);
            }}
            activeDirectUrl={activeDirectUrl}
          />

          {/* Tile 2: DSP 3-Band Parametric EQ & Presets */}
          <DspEqualizerTile
            settings={dspSettings}
            onUpdateEq={handleUpdateEq}
          />
        </div>

        {/* Row 2: 24/7 AirPlay 2 & DLNA/uPnP Receivers + Multi-Codec Hardware Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tile 3: AirPlay 2 & DLNA/uPnP Daemon */}
          <AirPlayDlnaTile
            state={airplayDlna}
            activeSource={activeSource}
            onActivateSource={handleActivateSource}
            onToggleService={(svc, enabled) => {
              setAirplayDlna((prev) => ({
                ...prev,
                [svc === 'airplay' ? 'airplayEnabled' : 'dlnaEnabled']: enabled,
              }));
            }}
          />

          {/* Tile 4: Multi-Codec Hardware Pipeline (.wav, .mp3, .aac, .flac, .opus) */}
          <CodecEngineTile
            onPlayLocalFile={handlePlayLocalFile}
            activeCodec={trackInfo.codec}
          />
        </div>

        {/* Row 3: Dual-Bank Robust OTA System + ESP32-S3 Hardware Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tile 5: Dual-Bank OTA Firmware Updater */}
          <OtaManagerTile
            otaState={otaState}
            onStartOta={handleStartOta}
            onOpenFirmwareHub={() => setIsFirmwareHubOpen(true)}
          />

          {/* Tile 6: ESP32-S3 N16R8 Hardware Telemetry */}
          <HardwareTelemetryTile
            telemetry={telemetry}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-[#050508] border-t border-[#141724] py-4 px-6 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ESP32-S3-WROOM-1-N16R8 · I2S DAC UDA1334A · ESP-IDF v5.1 Architecture
          </span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">mDNS: http://{wifiConfig.mdnsHostname}</span>
            <button
              onClick={() => setIsFirmwareHubOpen(true)}
              className="text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Firmware Source Files
            </button>
          </div>
        </div>
      </footer>

      {/* Wi-Fi Setup Modal (Only at startup or when opened from top bar; NOT in main UI) */}
      <WiFiStartupModal
        isOpen={isWifiSetupOpen}
        onClose={() => setIsWifiSetupOpen(false)}
        config={wifiConfig}
        onSaveWifi={(newCfg) => setWifiConfig((prev) => ({ ...prev, ...newCfg }))}
        onSwitchMode={(mode) => setWifiConfig((prev) => ({ ...prev, mode }))}
      />

      {/* Production ESP-IDF Firmware Hub Modal */}
      <FirmwareHubModal
        isOpen={isFirmwareHubOpen}
        onClose={() => setIsFirmwareHubOpen(false)}
      />

    </div>
  );
}
