import React, { useState, useRef, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  Plus, 
  Sparkles, 
  Link2, 
  FileAudio, 
  ChevronDown, 
  Search, 
  Check, 
  ExternalLink,
  Volume2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  Upload
} from 'lucide-react';
import { RadioStation, AudioSourceType } from '../types';
import { RADIO_STATIONS, TEST_AUDIO_STREAMS } from '../data/radioStations';

interface UnifiedAudioSourceTileProps {
  currentStation: RadioStation | null;
  activeSource: AudioSourceType;
  isPlaying: boolean;
  onSelectStation: (station: RadioStation) => void;
  onPlayDirectUrl: (url: string, customTitle?: string) => void;
  onPlayLocalFile: (file: File) => void;
  onTogglePlay: () => void;
  onAddCustomStation: (station: RadioStation) => void;
  activeDirectUrl?: string;
}

type FilterCategory = 'all' | 'radios' | 'test_audio' | 'direct_url' | 'local_file';

export const UnifiedAudioSourceTile: React.FC<UnifiedAudioSourceTileProps> = ({
  currentStation,
  activeSource,
  isPlaying,
  onSelectStation,
  onPlayDirectUrl,
  onPlayLocalFile,
  onTogglePlay,
  onAddCustomStation,
  activeDirectUrl = '',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Direct Link states
  const [directUrlInput, setDirectUrlInput] = useState(activeDirectUrl || '');
  const [directUrlLabel, setDirectUrlLabel] = useState('');
  const [directUrlError, setDirectUrlError] = useState<string | null>(null);

  // Custom Stream Add Modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationGenre, setNewStationGenre] = useState('');
  const [newStationUrl, setNewStationUrl] = useState('');
  const [newStationBitrate, setNewStationBitrate] = useState('128');

  // Custom stations stored locally
  const [customStations, setCustomStations] = useState<RadioStation[]>([]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered stations and test streams
  const allWebRadios = [...RADIO_STATIONS, ...customStations];
  const allTestStreams = TEST_AUDIO_STREAMS;

  const matchesSearch = (st: RadioStation) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.genre.toLowerCase().includes(q) ||
      st.country.toLowerCase().includes(q) ||
      st.codec.toLowerCase().includes(q)
    );
  };

  const filteredWebRadios = (selectedCategory === 'all' || selectedCategory === 'radios')
    ? allWebRadios.filter(matchesSearch)
    : [];

  const filteredTestStreams = (selectedCategory === 'all' || selectedCategory === 'test_audio')
    ? allTestStreams.filter(matchesSearch)
    : [];

  const handleSelectRadio = (st: RadioStation) => {
    onSelectStation(st);
    setIsDropdownOpen(false);
  };

  const handleDirectUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = directUrlInput.trim();
    if (!trimmed) {
      setDirectUrlError('Please enter a valid HTTP or HTTPS stream URL.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setDirectUrlError('Stream URL must start with http:// or https://');
      return;
    }
    setDirectUrlError(null);
    onPlayDirectUrl(trimmed, directUrlLabel.trim() || undefined);
    setIsDropdownOpen(false);
  };

  const handleAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName || !newStationUrl) return;

    const newStation: RadioStation = {
      id: `custom-${Date.now()}`,
      name: newStationName.trim(),
      genre: newStationGenre.trim() || 'Custom Stream',
      country: 'Live Stream',
      streamUrl: newStationUrl.trim(),
      bitrate: parseInt(newStationBitrate, 10) || 128,
      codec: newStationUrl.includes('.aac') ? 'AAC' : newStationUrl.includes('.flac') ? 'FLAC' : 'MP3',
      description: 'User-configured live audio stream for ESP32-S3 playback.',
    };

    setCustomStations((prev) => [newStation, ...prev]);
    onAddCustomStation(newStation);
    onSelectStation(newStation);
    setShowAddCustomModal(false);
    setNewStationName('');
    setNewStationGenre('');
    setNewStationUrl('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPlayLocalFile(file);
      setIsDropdownOpen(false);
    }
  };

  // Determine current active item title & badge for dropdown display
  const getDropdownButtonDisplay = () => {
    if (activeSource === 'direct_url') {
      return {
        icon: <Link2 className="w-4 h-4 text-emerald-400" />,
        badge: 'Direct Stream URL',
        badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
        title: directUrlLabel || activeDirectUrl.replace(/^https?:\/\//, '') || 'Direct Web Audio Link',
        subtitle: 'I2S Direct Sink Streaming',
      };
    }
    if (activeSource === 'local_file') {
      return {
        icon: <FileAudio className="w-4 h-4 text-purple-400" />,
        badge: 'Local Audio File',
        badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
        title: 'Hardware Codec Audition',
        subtitle: 'PCM / FLAC / MP3 / AAC / OPUS',
      };
    }
    if (currentStation) {
      const isTestAudio = allTestStreams.some((t) => t.id === currentStation.id);
      return {
        icon: isTestAudio ? <Sparkles className="w-4 h-4 text-cyan-400" /> : <Radio className="w-4 h-4 text-emerald-400" />,
        badge: isTestAudio ? 'Hi-Fi Test Audio' : 'Web Radio',
        badgeColor: isTestAudio ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
        title: currentStation.name,
        subtitle: `${currentStation.genre} · ${currentStation.bitrate} kbps ${currentStation.codec}`,
      };
    }
    return {
      icon: <Radio className="w-4 h-4 text-emerald-400" />,
      badge: 'Select Audio Source',
      badgeColor: 'bg-[#151928] text-neutral-300 border-[#262c45]',
      title: 'Choose Radio or Test Stream',
      subtitle: 'Browse all streams in clean dropdown',
    };
  };

  const activeDisplay = getDropdownButtonDisplay();

  return (
    <div 
      id="tile-unified-audio-source" 
      className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Audio Source &amp; Stream Hub
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                Unified Dropdown
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Web Radios, Lossless Test Audios, Direct Links &amp; Local Files merged cleanly
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCustomModal(true)}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-md bg-[#10141f] border border-emerald-500/30 hover:border-emerald-500/60 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Radio</span>
        </button>
      </div>

      {/* PROPER ORGANIZED DROPDOWN SELECTOR */}
      <div className="relative mb-4" ref={dropdownRef}>
        <div className="text-[11px] font-mono text-neutral-400 mb-1.5 flex items-center justify-between">
          <span>Active Audio Source Selection:</span>
          <span className="text-[10px] text-emerald-400">Click below to change station / stream</span>
        </div>

        {/* Dropdown Button */}
        <button
          id="btn-toggle-source-dropdown"
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[#06070c] border border-[#23283c] hover:border-emerald-500/50 hover:bg-[#0c0e18] transition-all cursor-pointer shadow-inner text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#121624] border border-[#20263c] flex items-center justify-center shrink-0">
              {activeDisplay.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white truncate max-w-[280px] sm:max-w-md">
                  {activeDisplay.title}
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${activeDisplay.badgeColor}`}>
                  {activeDisplay.badge}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {activeDisplay.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-2 shrink-0">
            {isPlaying && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
          </div>
        </button>

        {/* ORGANIZED DROPDOWN MENU */}
        {isDropdownOpen && (
          <div 
            id="menu-source-dropdown"
            className="absolute left-0 right-0 top-full mt-2 z-40 bg-[#080a13] border border-[#242a42] rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
          >
            {/* Search & Category Filter Header */}
            <div className="p-3 border-b border-[#181d2e] bg-[#05060b] space-y-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter stations, test streams, or genres..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0d16] border border-[#1c2234] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs font-mono scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'bg-[#101422] text-neutral-400 hover:text-white border border-[#1b2034]'
                  }`}
                >
                  All Sources ({allWebRadios.length + allTestStreams.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('radios')}
                  className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === 'radios'
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'bg-[#101422] text-neutral-400 hover:text-white border border-[#1b2034]'
                  }`}
                >
                  📻 Web Radios ({allWebRadios.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('test_audio')}
                  className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === 'test_audio'
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'bg-[#101422] text-neutral-400 hover:text-white border border-[#1b2034]'
                  }`}
                >
                  🧪 Hi-Fi Test Audio ({allTestStreams.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('direct_url')}
                  className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === 'direct_url'
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'bg-[#101422] text-neutral-400 hover:text-white border border-[#1b2034]'
                  }`}
                >
                  🔗 Direct Link
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('local_file')}
                  className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === 'local_file'
                      ? 'bg-purple-500 text-black font-semibold'
                      : 'bg-[#101422] text-neutral-400 hover:text-white border border-[#1b2034]'
                  }`}
                >
                  📁 Local File
                </button>
              </div>
            </div>

            {/* Scrollable Items List */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-3">
              {/* Category: Web Radios */}
              {filteredWebRadios.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-emerald-400" />
                    Worldwide Web Radios
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredWebRadios.map((st) => {
                      const isSelected = activeSource === 'radio' && currentStation?.id === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleSelectRadio(st)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/50 border border-emerald-500/50 text-white font-medium'
                              : 'hover:bg-[#121625] text-neutral-300 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                              {st.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                              {st.genre} · {st.country}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-[#0a0d18] border border-[#1a2136] text-neutral-400">
                              {st.bitrate}k {st.codec}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category: Hi-Fi Test Audio Streams */}
              {filteredTestStreams.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Hi-Fi Acoustic Test Audios
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredTestStreams.map((st) => {
                      const isSelected = activeSource === 'radio' && currentStation?.id === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleSelectRadio(st)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/50 border border-cyan-500/50 text-white font-medium'
                              : 'hover:bg-[#121625] text-neutral-300 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-medium text-cyan-200 truncate flex items-center gap-1.5">
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />}
                              {st.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                              {st.genre}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                              {st.bitrate}k {st.codec}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Action Shortcuts inside dropdown */}
              <div className="pt-2 border-t border-[#181d2e] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('direct_url');
                    setIsDropdownOpen(false);
                  }}
                  className="p-2 rounded-lg bg-[#0e1220] hover:bg-[#151b30] border border-[#202740] text-left text-xs text-emerald-300 flex items-center gap-2 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Paste Direct URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="p-2 rounded-lg bg-[#0e1220] hover:bg-[#151b30] border border-[#202740] text-left text-xs text-purple-300 flex items-center gap-2 cursor-pointer"
                >
                  <FileAudio className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Audition Local File</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE VIEW CARD: CLEAN & UNCLUTTERED */}
      {selectedCategory === 'direct_url' || activeSource === 'direct_url' ? (
        /* Direct URL Player Card */
        <div className="p-3.5 rounded-xl bg-[#06070d] border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              Direct HTTP / HTTPS Audio Link Player
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Icecast / Shoutcast / MP3 / FLAC / HLS</span>
          </div>

          <form onSubmit={handleDirectUrlSubmit} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={directUrlInput}
                onChange={(e) => {
                  setDirectUrlInput(e.target.value);
                  if (directUrlError) setDirectUrlError(null);
                }}
                placeholder="Paste direct stream URL: https://example.com/live.mp3"
                className="flex-1 px-3 py-2 rounded-xl bg-[#0a0d16] border border-[#20263a] text-xs text-emerald-300 font-mono placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={directUrlLabel}
                onChange={(e) => setDirectUrlLabel(e.target.value)}
                placeholder="Custom Label (optional)"
                className="w-full sm:w-44 px-3 py-2 rounded-xl bg-[#0a0d16] border border-[#20263a] text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                Play Stream
              </button>
            </div>

            {directUrlError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {directUrlError}
              </p>
            )}
          </form>

          {/* Quick presets for direct URL */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] font-mono text-neutral-400">
            <span>Quick Test Links:</span>
            {allTestStreams.slice(0, 3).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setDirectUrlInput(t.streamUrl);
                  setDirectUrlLabel(t.name);
                  onPlayDirectUrl(t.streamUrl, t.name);
                }}
                className="px-2 py-0.5 rounded bg-[#101422] hover:bg-[#181f33] border border-[#1e2538] hover:border-emerald-500/40 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                {t.name.split(' ')[0]} ({t.codec})
              </button>
            ))}
          </div>
        </div>
      ) : selectedCategory === 'local_file' || activeSource === 'local_file' ? (
        /* Local File Audition Card */
        <div className="p-3.5 rounded-xl bg-[#06070d] border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5 text-purple-400" />
              Hardware Multi-Codec Local Audition
            </span>
            <span className="text-[10px] font-mono text-purple-300">WAV · MP3 · FLAC · AAC · OPUS</span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-5 border-2 border-dashed border-[#23293e] hover:border-purple-500/50 rounded-xl bg-[#0a0c14] hover:bg-[#0e111d] text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <Upload className="w-6 h-6 text-purple-400" />
            <div className="text-xs font-semibold text-neutral-200">
              Click or drag an audio file to test hardware decoding
            </div>
            <p className="text-[11px] text-neutral-500">
              Streams directly through the ESP32-S3 DMA buffer into UDA1334A DAC
            </p>
          </div>
        </div>
      ) : (
        /* Clean Station Now Playing Details Card */
        <div className="p-3.5 rounded-xl bg-[#06070d] border border-[#171a28] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#121624] to-[#181e33] border border-[#202740] flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {currentStation?.name || 'SomaFM Groove Salad'}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101422] text-neutral-300 border border-[#1e2538]">
                  {currentStation?.codec || 'MP3'} · {currentStation?.bitrate || 128} kbps
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {currentStation?.genre || 'Ambient / Chillout'} · {currentStation?.country || 'USA'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.flac,.aac,.opus,.ogg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Add Custom Station Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#090b12] border border-[#202538] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#181d2e] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Custom Web Radio Stream
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Station Name</label>
                <input
                  type="text"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  placeholder="e.g. Jazz24 FM Seattle"
                  className="w-full px-3 py-2 rounded-xl bg-[#06070c] border border-[#1e2336] text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Genre / Style</label>
                <input
                  type="text"
                  value={newStationGenre}
                  onChange={(e) => setNewStationGenre(e.target.value)}
                  placeholder="e.g. Classic Jazz / Bebop"
                  className="w-full px-3 py-2 rounded-xl bg-[#06070c] border border-[#1e2336] text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Direct Stream URL (HTTP/HTTPS)</label>
                <input
                  type="url"
                  value={newStationUrl}
                  onChange={(e) => setNewStationUrl(e.target.value)}
                  placeholder="https://live.example.com/stream.mp3"
                  className="w-full px-3 py-2 rounded-xl bg-[#06070c] border border-[#1e2336] text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Bitrate (kbps)</label>
                <select
                  value={newStationBitrate}
                  onChange={(e) => setNewStationBitrate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#06070c] border border-[#1e2336] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="128">128 kbps (Standard)</option>
                  <option value="192">192 kbps (High Quality)</option>
                  <option value="256">256 kbps (Very High)</option>
                  <option value="320">320 kbps (Maximum MP3)</option>
                  <option value="1411">1411 kbps (Lossless CD / FLAC)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#181d2e]">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 cursor-pointer"
                >
                  Add &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
