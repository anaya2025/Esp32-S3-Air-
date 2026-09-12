export type AudioSourceType = 'radio' | 'airplay' | 'dlna' | 'local_file' | 'direct_url';

export type PlaybackStatus = 'playing' | 'paused' | 'stopped' | 'buffering';

export interface TrackMetadata {
  title: string;
  artist: string;
  album?: string;
  stationName?: string;
  codec: 'MP3' | 'AAC' | 'FLAC' | 'WAV' | 'OPUS' | 'ALAC' | 'PCM';
  bitrate: number; // in kbps
  sampleRate: number; // in Hz (e.g., 44100, 48000, 96000)
  bitDepth: number; // 16, 24, 32 bit
  duration?: number; // in seconds, if available
  currentTime?: number;
  coverUrl?: string;
}

export type EqPresetId = 
  | 'flat' 
  | 'bass_boost' 
  | 'rock' 
  | 'jazz' 
  | 'vocal' 
  | 'electronic' 
  | 'acoustic' 
  | 'classical' 
  | 'custom';

export interface EqPreset {
  id: EqPresetId;
  name: string;
  bass: number;    // -12 to +12 dB (Low Shelf @ 100 Hz)
  mid: number;     // -12 to +12 dB (Peaking @ 1000 Hz, Q=1.0)
  treble: number;  // -12 to +12 dB (High Shelf @ 10000 Hz)
  description: string;
}

export interface DspEqSettings {
  bass: number;
  mid: number;
  treble: number;
  preset: EqPresetId;
  preampGain: number; // -6 to +6 dB
  loudnessCompensation: boolean;
  stereoWidth: number; // 0 to 100%
}

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  country: string;
  streamUrl: string;
  bitrate: number;
  codec: 'MP3' | 'AAC' | 'FLAC' | 'OPUS';
  logoUrl?: string;
  description: string;
}

export interface WiFiNetwork {
  ssid: string;
  rssi: number; // dBm, e.g. -55
  secure: boolean;
  channel: number;
}

export interface WiFiConfig {
  mode: 'AP' | 'STA' | 'AP_STA';
  apSSID: string;
  apPassword: string;
  apIP: string;
  staSSID: string;
  staPassword: string;
  staConnected: boolean;
  staIP: string;
  staGateway: string;
  staSubnet: string;
  staDNS: string;
  staRSSI: number;
  useStaticIP: boolean;
  mdnsHostname: string; // e.g. 'espmusic.local'
  autoReconnect: boolean;
}

export interface AirPlayDlnaState {
  airplayEnabled: boolean;
  airplayName: string;
  airplayStatus: 'idle' | 'ready' | 'streaming';
  airplayClient: string | null;
  airplayPort: number;
  airplayVolumeSync: boolean;

  dlnaEnabled: boolean;
  dlnaName: string;
  dlnaStatus: 'idle' | 'ready' | 'streaming';
  dlnaClient: string | null;
  dlnaPort: number;

  i2sDac: {
    chip: 'UDA1334A';
    bclkPin: number;   // GPIO 4
    wclkPin: number;   // GPIO 5 (LRCK)
    dataPin: number;   // GPIO 6 (DIN)
    sampleRate: number;
    bitDepth: number;
    dmaBufferSize: number;
    dmaBufferCount: number;
    bufferUnderruns: number;
    mclkInternalPll: boolean;
  };
}

export interface PartitionInfo {
  name: string;
  type: string;
  subtype: string;
  offset: string;
  size: string;
  flags: string;
  active: boolean;
}

export interface OtaState {
  currentPartition: 'ota_0' | 'ota_1';
  nextPartition: 'ota_0' | 'ota_1';
  appVersion: string;
  hardwareVersion: string;
  buildTimestamp: string;
  status: 'idle' | 'verifying' | 'flashing' | 'rebooting' | 'success' | 'failed';
  progress: number; // 0 - 100
  writeSpeedKbps: number;
  transferredBytes: number;
  totalBytes: number;
  md5Verified: boolean;
  sha256Hash: string;
  autoRollback: boolean;
  statusMessage: string;
}

export interface HardwareTelemetry {
  chip: 'ESP32-S3-WROOM-1-N16R8';
  cpuFreqMhz: number;
  core0Load: number; // %
  core1Load: number; // %
  internalSramTotal: number; // in KB
  internalSramFree: number; // in KB
  octalPsramTotal: number; // in KB (8192 KB)
  octalPsramFree: number; // in KB
  flashTotalMb: number; // 16 MB
  flashUsedMb: number;
  coreTemperature: number; // Celsius
  uptimeSeconds: number;
  freeRtosTasks: Array<{
    name: string;
    state: 'Running' | 'Ready' | 'Blocked' | 'Suspended';
    priority: number;
    stackFreeKb: number;
    coreId: number;
  }>;
}
