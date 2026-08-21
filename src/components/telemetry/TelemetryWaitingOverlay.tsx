import React, { useState } from 'react';
import { Radio, Copy, Check, Square, RotateCcw, AlertTriangle } from 'lucide-react';
import { NetworkInterfaceInfo } from '../../types/telemetry';

interface TelemetryWaitingOverlayProps {
  networkInfo?: NetworkInterfaceInfo | null;
  isRecording?: boolean;
  recordingDurationSec?: number;
  recordedLapsCount?: number;
  onRequestStopRecording?: () => void;
  onResetRecording?: () => void;
  compact?: boolean;
}

export const TelemetryWaitingOverlay: React.FC<TelemetryWaitingOverlayProps> = ({
  networkInfo,
  isRecording = false,
  recordingDurationSec = 0,
  recordedLapsCount = 0,
  onRequestStopRecording,
  onResetRecording,
  compact = false
}) => {
  const [copiedIp, setCopiedIp] = useState(false);

  const udpPort = networkInfo?.udpPort || 5300;
  const primaryIp = networkInfo?.directIps?.[0] || '127.0.0.1';

  const handleCopyIp = () => {
    navigator.clipboard.writeText(primaryIp);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center bg-[#07070A]/92 backdrop-blur-md border border-[#1E1E2C] select-none p-6 text-center overflow-hidden ${
      compact ? 'min-h-[220px]' : 'min-h-[380px]'
    }`}>
      {/* Background Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E1E32_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Pulsing Radar Ring Container */}
      <div className="relative flex items-center justify-center mb-5">
        <div className="absolute w-20 h-20 rounded-full border border-amber-500/20 animate-ping pointer-events-none" />
        <div className="absolute w-14 h-14 rounded-full border border-amber-500/40 animate-pulse pointer-events-none" />
        <div className="relative w-12 h-12 rounded-full bg-[#161622] border border-amber-500/60 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.25)]">
          <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
      </div>

      {/* Main Status Header */}
      <div className="z-10 max-w-md">
        <h3 className="text-lg md:text-xl font-racing font-bold tracking-wider text-slate-100 uppercase">
          Waiting for telemetry on port <span className="text-amber-400">{udpPort}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1 font-mono tracking-wide">
          Launch Forza Motorsport / Horizon or ensure Data Out is active.
        </p>

        {/* Local IP Address Pill with Copy Button */}
        <div className="mt-4 inline-flex items-center space-x-2 px-3.5 py-1.5 bg-[#12121B] border border-[#2A2A3E] rounded-full shadow-inner">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Target IP:
          </span>
          <span className="font-mono text-xs font-bold text-[#00F0FF] tracking-wider">
            {primaryIp}
          </span>
          <button
            onClick={handleCopyIp}
            className="p-1 hover:bg-[#1E1E2E] rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy IP Address"
          >
            {copiedIp ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Active Stint Paused Notice & Controls (if recording was active when connection dropped) */}
      {isRecording && (
        <div className="z-10 mt-6 max-w-md w-full bg-[#181116]/90 border border-amber-500/40 p-3.5 shadow-lg flex flex-col items-center space-y-3 animate-fade-in">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-racing font-bold uppercase tracking-wider">
              Recording Paused — Telemetry Suspended
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono text-slate-300">
            <div>
              <span className="text-slate-500">Duration: </span>
              <span className="font-bold text-amber-300">{formatTimer(recordingDurationSec)}</span>
            </div>
            <div>
              <span className="text-slate-500">Laps: </span>
              <span className="font-bold text-amber-300">{recordedLapsCount}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-sans leading-tight">
            Stream will resume automatically when packets arrive. You can also save captured laps or reset now.
          </p>

          <div className="flex items-center space-x-2 pt-1">
            {onRequestStopRecording && (
              <button
                onClick={onRequestStopRecording}
                className="chamfer-btn flex items-center space-x-1.5 px-3 py-1.5 text-xs font-racing font-bold tracking-wider bg-[#E10600] hover:bg-[#FF1801] text-white cursor-pointer transition-all"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Save Captured Laps</span>
              </button>
            )}

            {onResetRecording && (
              <button
                onClick={onResetRecording}
                className="chamfer-btn flex items-center space-x-1.5 px-3 py-1.5 text-xs font-racing font-semibold tracking-wider bg-[#222232] hover:bg-[#2C2C40] text-slate-300 hover:text-white border border-[#33334A] cursor-pointer transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
