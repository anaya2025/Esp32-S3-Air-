import React, { useRef, useState } from 'react';
import { FileAudio, UploadCloud, CheckCircle2, Play, Cpu, Layers, Disc3 } from 'lucide-react';
import { TrackMetadata } from '../types';

interface CodecEngineTileProps {
  onPlayLocalFile: (file: File) => void;
  activeCodec: string;
}

const SUPPORTED_CODECS = [
  {
    name: 'WAV',
    ext: '.wav',
    title: 'Uncompressed PCM',
    specs: '16 / 24 / 32-bit · Up to 192 kHz',
    decoder: 'Direct I2S DMA Stream (Zero CPU overhead)',
    features: ['Bit-perfect studio fidelity', 'Zero latency', 'UDA1334A native format'],
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
  },
  {
    name: 'MP3',
    ext: '.mp3',
    title: 'MPEG-1/2 Audio Layer III',
    specs: '32 – 320 kbps · VBR & CBR',
    decoder: 'Helix MP3 Fixed-Point Decoder (Optimized for S3)',
    features: ['ID3v2 metadata parsing', 'Fractional frame sync', 'FreeRTOS dual-task decode'],
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20'
  },
  {
    name: 'AAC',
    ext: '.aac, .m4a',
    title: 'Advanced Audio Coding',
    specs: 'AAC-LC & HE-AAC v1/v2 · Up to 320 kbps',
    decoder: 'Fraunhofer FDK / Helix AAC Engine',
    features: ['ADTS & ADIF containers', 'SBR spectral band replica', 'High compression efficiency'],
    color: 'border-blue-500/40 text-blue-400 bg-blue-950/20'
  },
  {
    name: 'FLAC',
    ext: '.flac',
    title: 'Free Lossless Audio Codec',
    specs: '16 / 24-bit Lossless · Up to 96 kHz',
    decoder: 'libFLAC C library running in 8MB Octal PSRAM',
    features: ['100% bit-exact reproduction', 'Vorbis comment tags', 'Dynamic sub-frame buffering'],
    color: 'border-purple-500/40 text-purple-400 bg-purple-950/20'
  },
  {
    name: 'OPUS',
    ext: '.opus, .ogg',
    title: 'Interactive Speech & Music',
    specs: '6 – 510 kbps · SILK & CELT hybrid',
    decoder: 'libopus fixed-point with XTensa SIMD acceleration',
    features: ['Ultra-low latency (<20ms)', 'Adaptive bitrate', 'Modern streaming standard'],
    color: 'border-amber-500/40 text-amber-400 bg-amber-950/20'
  }
];

export const CodecEngineTile: React.FC<CodecEngineTileProps> = ({
  onPlayLocalFile,
  activeCodec,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setSelectedFileName(file.name);
    onPlayLocalFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="tile-codec-engine" className="bg-[#090a0f] border border-[#1a1d2b] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161824] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileAudio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Multi-Codec Hardware Pipeline
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                WAV · MP3 · AAC · FLAC · OPUS
              </span>
            </h3>
            <p className="text-xs text-neutral-400">Decoded in 8MB Octal PSRAM ring buffer &amp; streamed to UDA1334A</p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          DSP Ringbuffer: 2048 KB
        </span>
      </div>

      {/* Codec Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-4">
        {SUPPORTED_CODECS.map((c) => {
          const isActive = activeCodec.toUpperCase() === c.name;
          return (
            <div
              key={c.name}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[#101726] border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'bg-[#06070a] border-[#181a27]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
                    {c.name}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">{c.ext}</span>
                </div>
                <h4 className="text-[11px] font-medium text-neutral-300 mb-1">{c.title}</h4>
                <p className="text-[10px] font-mono text-neutral-500 mb-2">{c.specs}</p>
              </div>

              <div className="pt-2 border-t border-[#161824] text-[10px] text-neutral-400">
                <span className="text-neutral-500 block">Library:</span>
                <span className="text-neutral-300 font-mono text-[9px] truncate block">{c.decoder}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drag and Drop Local Audio Audition Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
          dragOver 
            ? 'bg-emerald-950/30 border-emerald-400' 
            : 'bg-[#05060a] border-[#202538] hover:border-emerald-500/40 hover:bg-[#090b12]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.aac,.flac,.opus,.ogg,.m4a"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Test &amp; Audition Local Codec Audio File
            </span>
            <span className="text-[11px] text-neutral-400">
              Drag &amp; drop any <code className="text-emerald-400">.wav</code>, <code className="text-cyan-400">.mp3</code>, <code className="text-blue-400">.aac</code>, <code className="text-purple-400">.flac</code>, or <code className="text-amber-400">.opus</code> file to play live through DSP EQ
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {selectedFileName ? (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/40 flex items-center gap-1.5">
              <Disc3 className="w-3.5 h-3.5 animate-spin" />
              {selectedFileName}
            </span>
          ) : (
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-[#121624] border border-[#232a42] hover:bg-[#1a2033] transition-colors cursor-pointer"
            >
              Browse Audio Files
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
