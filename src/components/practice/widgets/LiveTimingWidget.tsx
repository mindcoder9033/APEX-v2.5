import React from 'react';
import { Timer, Award, Flag, Clock } from 'lucide-react';

interface LiveTimingWidgetProps {
  isRecording: boolean;
  recordingDurationSec: number;
  recordedLapsCount: number;
  activeLapBufferLength: number;
}

export const LiveTimingWidget: React.FC<LiveTimingWidgetProps> = ({
  isRecording,
  recordingDurationSec,
  recordedLapsCount,
  activeLapBufferLength
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const ms = Math.floor((totalSec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatMinSec = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 bg-[#12121A] border border-[#232332] flex flex-col justify-between shadow-lg hud-bracket group hover:border-[#00F0FF]/30 transition-all min-h-[170px]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-tech font-bold text-[#8E8E9F] uppercase tracking-widest flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>Live Stint Timing</span>
        </span>
        <span className={`chamfer-badge text-[9px] font-mono font-bold px-2 py-0.5 border ${
          isRecording
            ? 'bg-red-950/80 text-red-300 border-red-500/50 animate-pulse'
            : 'bg-[#181824] text-slate-400 border-[#2A2A3C]'
        }`}>
          {isRecording ? `LAP #${recordedLapsCount + 1}` : 'IDLE / READY'}
        </span>
      </div>

      <div className="my-2 flex flex-col items-center justify-center">
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-hud font-black text-white hud-glow-cyan tabular-nums">
            {formatMinSec(recordingDurationSec)}
          </span>
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">ELAPSED</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 mt-0.5">
          {isRecording ? `${activeLapBufferLength} buffer packets` : 'Waiting for stint start'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F1F2C] text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-1">
            <Flag className="w-3 h-3 text-amber-400" />
            <span>Laps:</span>
          </span>
          <span className="text-white font-bold">{recordedLapsCount}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-1">
            <Timer className="w-3 h-3 text-emerald-400" />
            <span>Telemetry:</span>
          </span>
          <span className="text-emerald-400 font-bold">{isRecording ? 'RECORDING' : 'READY'}</span>
        </div>
      </div>
    </div>
  );
};
