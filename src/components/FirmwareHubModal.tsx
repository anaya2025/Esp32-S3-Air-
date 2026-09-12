import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Settings, 
  Cpu, 
  X, 
  ExternalLink,
  Layers,
  Terminal,
  GitBranch,
  Github,
  Zap
} from 'lucide-react';
import { ESP_IDF_FIRMWARE_FILES, FirmwareFile } from '../data/espIdfFirmware';

interface FirmwareHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirmwareHubModal: React.FC<FirmwareHubModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedFlashCmd, setCopiedFlashCmd] = useState(false);

  if (!isOpen) return null;

  const currentFile = ESP_IDF_FIRMWARE_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFlashCmd = () => {
    navigator.clipboard.writeText('esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 write_flash 0x0 merged.bin');
    setCopiedFlashCmd(true);
    setTimeout(() => setCopiedFlashCmd(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename.replace('/', '_');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMergedBin = () => {
    const link = document.createElement('a');
    link.href = '/merged.bin';
    link.download = 'merged.bin';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    // Generate an aggregate project bundle file containing all source files
    let bundle = `# ==============================================================================
# ESP32-S3 N16R8 Hi-Fi Music Streamer - Complete Production Firmware Bundle
# Hardware: ESP32-S3-WROOM-1-N16R8 (16MB Flash, 8MB Octal PSRAM) + UDA1334A DAC
# Target: ESP-IDF v5.1+
# ==============================================================================

`;
    ESP_IDF_FIRMWARE_FILES.forEach((f) => {
      bundle += `\n/* ==================== FILE: ${f.filename} ==================== */\n`;
      bundle += f.content;
      bundle += `\n\n`;
    });

    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esp32_s3_hifi_firmware_bundle.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#090b12] border border-[#22273d] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1b2033] flex items-center justify-between bg-[#06070c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Production ESP-IDF v5 Firmware Source Hub
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  ESP32-S3 N16R8
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                100% Production-Grade C/C++ Source Files, Partitions, Kconfig, &amp; Hardware Pinout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMergedBin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 transition-all shadow-sm cursor-pointer"
              title="Download 1-click single binary for fresh flash (0x0)"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>merged.bin (Fresh Flash)</span>
            </button>
            <button
              onClick={handleDownloadAll}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-all shadow-sm cursor-pointer"
              title="Download full project bundle"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#161a29] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Fresh Flash Command Strip */}
        <div className="bg-[#05060a] border-b border-[#161a28] px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-300 overflow-x-auto font-mono">
            <span className="text-emerald-400 font-semibold shrink-0">Fresh Flash (0x0):</span>
            <code className="text-neutral-300 bg-[#0c0f18] px-2 py-0.5 rounded border border-[#1f253d] select-all whitespace-nowrap text-[11px]">
              esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 write_flash 0x0 merged.bin
            </code>
          </div>
          <button
            onClick={handleCopyFlashCmd}
            className="self-end sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131726] hover:bg-[#1c2237] text-neutral-200 text-[11px] font-mono border border-[#242b45] transition-colors cursor-pointer shrink-0"
          >
            {copiedFlashCmd ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-neutral-400" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Body: Sidebar File Explorer + Code Editor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: File Tree */}
          <div className="w-full md:w-64 bg-[#05060a] border-r border-[#1a1f33] p-3 overflow-y-auto shrink-0">
            <div className="text-[11px] font-mono text-neutral-500 uppercase px-2 mb-2 tracking-wider">
              Project Manifest
            </div>
            <div className="space-y-1">
              {ESP_IDF_FIRMWARE_FILES.map((file, idx) => {
                const isSelected = idx === selectedFileIndex;
                return (
                  <button
                    key={file.filename}
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-[#101320]'
                    }`}
                  >
                    {file.filename.endsWith('.csv') ? (
                      <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : file.filename.endsWith('.defaults') ? (
                      <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : file.filename.endsWith('.md') ? (
                      <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    ) : file.filename.endsWith('.py') ? (
                      <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : file.filename.includes('.github') || file.filename.endsWith('.yml') ? (
                      <Github className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : file.filename.includes('CMakeLists') ? (
                      <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate">{file.filename}</span>
                  </button>
                );
              })}
            </div>

            {/* GitHub Repo Build Info */}
            <div className="mt-5 p-3 rounded-xl bg-[#080b14] border border-emerald-500/20 text-[11px] text-neutral-300">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
                <Github className="w-3.5 h-3.5 text-emerald-400" />
                Build via GitHub Repo
              </div>
              <p className="text-[10px] text-neutral-400 leading-normal mb-2">
                Push to any GitHub repository to trigger the automated CI action (<code className="text-emerald-400 font-mono">.github/workflows/build-firmware.yml</code>) which builds ESP-IDF v5 &amp; Web UI artifacts automatically.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-[#04060c] p-1.5 rounded border border-[#161a28]">
                <GitBranch className="w-3 h-3 shrink-0" />
                <span>git push origin main</span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-[#080a12] border border-[#181d2e] text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5 text-white font-semibold mb-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Local IDF Build Command
              </div>
              <code className="block bg-[#040508] p-2 rounded text-emerald-400 font-mono text-[10px] break-all border border-[#161a28]">
                idf.py set-target esp32s3<br />
                idf.py build flash monitor
              </code>
            </div>
          </div>

          {/* Right Area: Code Viewer */}
          <div className="flex-1 flex flex-col bg-[#030407] overflow-hidden">
            {/* Action Bar for currently viewed file */}
            <div className="px-4 py-2.5 bg-[#06080e] border-b border-[#181d2e] flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-white">
                  {currentFile.filename}
                </span>
                <span className="text-[11px] text-neutral-500 ml-2 hidden sm:inline">
                  — {currentFile.description}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono bg-[#121624] hover:bg-[#1a2034] text-neutral-200 border border-[#232a42] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy File</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#121624] transition-colors cursor-pointer"
                  title="Save this file"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code Body */}
            <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-neutral-300 leading-relaxed bg-[#030407] select-text">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
