import React from 'react';
import { Sliders, RotateCcw, Sparkles, Volume1, Waves } from 'lucide-react';
import { DspEqSettings, EqPresetId } from '../types';
import { EQ_PRESETS } from '../data/radioStations';
import { audioEngine } from '../services/audioEngine';

interface DspEqualizerTileProps {
  settings: DspEqSettings;
  onUpdateEq: (bass: number, mid: number, treble: number, presetId?: EqPresetId, preamp?: number) => void;
}

export const DspEqualizerTile: React.FC<DspEqualizerTileProps> = ({
  settings,
  onUpdateEq,
}) => {
  const curvePoints = audioEngine.calculateFrequencyResponse(
    settings.bass,
    settings.mid,
    settings.treble
  );

  // SVG dimensions for curve
  const svgWidth = 400;
  const svgHeight = 120;
  const minDb = -14;
  const maxDb = 14;

  const getX = (freq: number) => {
    // Logarithmic scale 20Hz -> 20000Hz
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const curLog = Math.log10(freq);
    return ((curLog - minLog) / (maxLog - minLog)) * svgWidth;
  };

  const getY = (db: number) => {
    // Linear dB mapping
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    return svgHeight - ((clamped - minDb) / (maxDb - minDb)) * svgHeight;
  };

  const pathD = curvePoints.reduce((acc, pt, idx) => {
    const x = getX(pt.freq);
    const y = getY(pt.db);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${svgWidth} ${getY(0)} L 0 ${getY(0)} Z`;

  const handleSliderChange = (band: 'bass' | 'mid' | 'treble', val: number) => {
    const newBass = band === 'bass' ? val : settings.bass;
    const newMid = band === 'mid' ? val : settings.mid;
    const newTreble = band === 'treble' ? val : settings.treble;
    onUpdateEq(newBass, newMid, newTreble, 'custom', settings.preampGain);
  };

  const handleSelectPreset = (presetId: EqPresetId) => {
    const preset = EQ_PRESETS.find(p => p.id === presetId);
    if (preset) {
      onUpdateEq(preset.bass, preset.mid, preset.treble, preset.id, settings.preampGain);
    }
  };

  const handleReset = () => {
    onUpdateEq(0, 0, 0, 'flat', 0);
  };

  return (
    <div id="tile-dsp-equalizer" className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              DSP 3-Band Parametric EQ
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                IIR Biquad
              </span>
            </h3>
            <p className="text-xs text-neutral-400">Real-time tone shaping on UDA1334A I2S DAC</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-md bg-[#12141f] border border-[#212538] transition-colors"
          title="Reset to Flat 0 dB"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Real-time Frequency Response Curve Plot */}
      <div className="w-full bg-[#050508] border border-[#171926] rounded-xl p-3 mb-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1">
          <div className="flex items-center gap-1 text-emerald-400">
            <Waves className="w-3 h-3" />
            <span>Response Curve (20Hz - 20kHz)</span>
          </div>
          <span>Biquad Direct Form II Transposed</span>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-24 overflow-visible">
          <defs>
            <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={getY(0)} x2={svgWidth} y2={getY(0)} stroke="#2a2e42" strokeDasharray="2,2" strokeWidth="1" />
          <line x1="0" y1={getY(6)} x2={svgWidth} y2={getY(6)} stroke="#1a1d2b" strokeDasharray="3,3" strokeWidth="1" />
          <line x1="0" y1={getY(-6)} x2={svgWidth} y2={getY(-6)} stroke="#1a1d2b" strokeDasharray="3,3" strokeWidth="1" />
          
          {/* Vertical frequency markers */}
          <line x1={getX(100)} y1="0" x2={getX(100)} y2={svgHeight} stroke="#1b1e2e" strokeWidth="1" />
          <line x1={getX(1000)} y1="0" x2={getX(1000)} y2={svgHeight} stroke="#1b1e2e" strokeWidth="1" />
          <line x1={getX(10000)} y1="0" x2={getX(10000)} y2={svgHeight} stroke="#1b1e2e" strokeWidth="1" />

          {/* Fill Area & Stroke */}
          <path d={areaD} fill="url(#eqGradient)" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Center points */}
          <circle cx={getX(100)} cy={getY(settings.bass)} r="4" fill="#34d399" />
          <circle cx={getX(1000)} cy={getY(settings.mid)} r="4" fill="#34d399" />
          <circle cx={getX(10000)} cy={getY(settings.treble)} r="4" fill="#34d399" />
        </svg>

        {/* Frequency Labels */}
        <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1 px-1">
          <span>20 Hz</span>
          <span className="text-neutral-400">100 Hz (Bass)</span>
          <span className="text-neutral-400">1 kHz (Mid)</span>
          <span className="text-neutral-400">10 kHz (Treble)</span>
          <span>20 kHz</span>
        </div>
      </div>

      {/* 3 Tactile Band Sliders */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Bass */}
        <div className="bg-[#05060a] border border-[#161926] rounded-xl p-3 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-semibold text-neutral-200">Bass</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {settings.bass > 0 ? `+${settings.bass}` : settings.bass} dB
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 mb-2">100 Hz · Low Shelf</span>
          <input
            id="slider-eq-bass"
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={settings.bass}
            onChange={(e) => handleSliderChange('bass', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
            aria-label="Bass Gain"
          />
          <div className="flex justify-between w-full text-[9px] font-mono text-neutral-600 mt-1">
            <span>-12dB</span>
            <span>0</span>
            <span>+12dB</span>
          </div>
        </div>

        {/* Mid */}
        <div className="bg-[#05060a] border border-[#161926] rounded-xl p-3 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-semibold text-neutral-200">Mid</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {settings.mid > 0 ? `+${settings.mid}` : settings.mid} dB
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 mb-2">1 kHz · Q=1.0 Peak</span>
          <input
            id="slider-eq-mid"
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={settings.mid}
            onChange={(e) => handleSliderChange('mid', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
            aria-label="Mid Gain"
          />
          <div className="flex justify-between w-full text-[9px] font-mono text-neutral-600 mt-1">
            <span>-12dB</span>
            <span>0</span>
            <span>+12dB</span>
          </div>
        </div>

        {/* Treble */}
        <div className="bg-[#05060a] border border-[#161926] rounded-xl p-3 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-semibold text-neutral-200">Treble</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {settings.treble > 0 ? `+${settings.treble}` : settings.treble} dB
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 mb-2">10 kHz · High Shelf</span>
          <input
            id="slider-eq-treble"
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={settings.treble}
            onChange={(e) => handleSliderChange('treble', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
            aria-label="Treble Gain"
          />
          <div className="flex justify-between w-full text-[9px] font-mono text-neutral-600 mt-1">
            <span>-12dB</span>
            <span>0</span>
            <span>+12dB</span>
          </div>
        </div>
      </div>

      {/* Preset Chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Acoustic Tone Presets
          </span>
          <span className="text-[11px] font-mono text-neutral-500">
            Active: <span className="text-emerald-400 font-semibold">{settings.preset.toUpperCase()}</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EQ_PRESETS.map((preset) => {
            const isSelected = settings.preset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-black font-semibold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-[#10131d] text-neutral-300 hover:text-white hover:bg-[#181d2c] border border-[#1f2438]'
                }`}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
