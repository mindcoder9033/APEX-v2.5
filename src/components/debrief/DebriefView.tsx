import React, { useState } from 'react';
import { LapAnalysis } from '../../types/telemetry';
import { Module, Session } from '../../types/curriculum';
import { TelemetryTraces } from '../telemetry/TelemetryTraces';
import { FrictionCirclePlot } from '../telemetry/FrictionCirclePlot';
import { TrackMapViewer } from '../telemetry/TrackMapViewer';
import { DiagnosticScorecard } from './DiagnosticScorecard';
import { ActionPlanCard } from '../adjust/ActionPlanCard';
import { Activity, FileDown, Radio, AlertCircle, Compass } from 'lucide-react';

interface DebriefViewProps {
  lap: LapAnalysis | null;
  module?: Module;
  session?: Session;
  onOpenPdfModal: () => void;
}

export const DebriefView: React.FC<DebriefViewProps> = ({
  lap,
  module,
  session,
  onOpenPdfModal
}) => {
  const [cursorDist, setCursorDist] = useState<number>(850);

  if (!lap) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0E] flex items-center justify-center">
        <div className="max-w-xl w-full p-8 rounded-3xl bg-[#12121A] border border-[#232332] text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1A1A28] border border-[#2D2D44] flex items-center justify-center text-slate-400">
            <Radio className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-white">No Telemetry Stints Recorded Yet</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Synthetic telemetry simulation is disabled. To view corner diagnostics, friction circle plots, and AI debriefing, launch Forza Motorsport with UDP output enabled.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D0D14] border border-[#1E1E2C] text-left text-xs font-mono space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">UDP Broadcast Target:</span>
              <span className="text-emerald-400 font-bold">127.0.0.1:5300</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">WebSocket Local Bridge:</span>
              <span className="text-[#00F0FF]">ws://localhost:5301</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Packet Format:</span>
              <span className="text-purple-300">CarDash (324 Bytes)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Once you complete a lap or end a practice stint, the full telemetric breakdown will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  const closestFrame = lap.frames.find(f => Math.abs(f.distance - cursorDist) < 15) || lap.frames[0] || null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0E] space-y-6">
      {/* Debrief Header Banner */}
      <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex items-center justify-between shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E10600] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Debrief Session #{lap.lapNumber}
            </span>
            <span className="text-xs text-[#8E8E9F] font-mono">
              {module ? `Module ${module.moduleNumber}: ${module.title}` : 'Full Lap Analytical Report'}
            </span>
          </div>
          <h1 className="text-xl font-display font-black text-white mt-1">
            Skip Barber Telemetric Debrief & Corner Diagnosis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated analysis evaluating traction budget, trail-braking smoothness, and apex throttle synchronization.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenPdfModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E10600] to-[#B30400] hover:from-[#FF1801] hover:to-[#E10600] text-white text-xs font-bold shadow-lg shadow-red-950/60 active:scale-95 transition-all"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate Official PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
          <span className="text-[10px] text-slate-400 font-mono block">Lap Time</span>
          <strong className="text-base font-mono font-bold text-white">{lap.lapTimeSec.toFixed(2)}s</strong>
        </div>
        <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
          <span className="text-[10px] text-slate-400 font-mono block">Peak Velocity</span>
          <strong className="text-base font-mono font-bold text-[#00F0FF]">{lap.maxSpeedKph} km/h</strong>
        </div>
        <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
          <span className="text-[10px] text-slate-400 font-mono block">Traction Budget %</span>
          <strong className="text-base font-mono font-bold text-emerald-400">{lap.avgTractionBudgetPct}%</strong>
        </div>
        <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
          <span className="text-[10px] text-slate-400 font-mono block">Max Lateral G</span>
          <strong className="text-base font-mono font-bold text-purple-400">{lap.peakLatG}G</strong>
        </div>
        <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
          <span className="text-[10px] text-slate-400 font-mono block">Max Braking G</span>
          <strong className="text-base font-mono font-bold text-[#FF1801]">{lap.peakBrakingG}G</strong>
        </div>
        <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
          <span className="text-[10px] text-slate-400 font-mono block">Mastery Grade</span>
          <strong className="text-base font-mono font-bold text-amber-400">{lap.overallScore}%</strong>
        </div>
      </div>

      {/* Synchronized Lap Telemetry */}
      <TelemetryTraces
        frames={lap.frames}
        cursorDistance={cursorDist}
        onCursorChange={setCursorDist}
        height={280}
      />

      {/* G-G Friction Circle & Track Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FrictionCirclePlot frames={lap.frames} currentFrame={closestFrame} />
        <TrackMapViewer frames={lap.frames} currentDistance={cursorDist} />
      </div>

      {/* Turn-by-Turn Diagnostics */}
      <DiagnosticScorecard corners={lap.corners} onFocusCorner={setCursorDist} />

      {/* Action Plan */}
      <ActionPlanCard actionItems={lap.actionItems} />
    </div>
  );
};
