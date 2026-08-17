import React from 'react';
import { UserProgressState, Module } from '../../types/curriculum';
import { LapAnalysis } from '../../types/telemetry';
import { Trophy, Award, Activity, Clock, CheckCircle2, Flame, Shield, Target } from 'lucide-react';

interface HistoryViewProps {
  progress: UserProgressState;
  modules: Module[];
  savedLaps: LapAnalysis[];
  onSelectLapForDebrief: (lap: LapAnalysis) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  progress,
  modules,
  savedLaps,
  onSelectLapForDebrief
}) => {
  const graduatedCount = progress.graduatedModuleIds.length;
  const completedSessionsCount = progress.completedSessionIds.length;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0E] space-y-8">
      {/* Top Banner Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-[#12121A] border border-[#232332] flex items-center space-x-4 shadow-lg hud-bracket">
          <div className="w-12 h-12 bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8E8E9F] font-tech uppercase tracking-wider font-semibold block">Certified Modules</span>
            <strong className="text-2xl font-hud font-black text-white tabular-nums">{graduatedCount} <span className="text-xs text-slate-500 font-mono font-normal">/ {modules.length}</span></strong>
          </div>
        </div>

        <div className="p-5 bg-[#12121A] border border-[#232332] flex items-center space-x-4 shadow-lg hud-bracket">
          <div className="w-12 h-12 bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8E8E9F] font-tech uppercase tracking-wider font-semibold block">Passed Sessions</span>
            <strong className="text-2xl font-hud font-black text-white tabular-nums">{completedSessionsCount}</strong>
          </div>
        </div>

        <div className="p-5 bg-[#12121A] border border-[#232332] flex items-center space-x-4 shadow-lg hud-bracket">
          <div className="w-12 h-12 bg-[#E10600]/20 border border-[#E10600]/40 flex items-center justify-center text-[#FF4D4D]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8E8E9F] font-tech uppercase tracking-wider font-semibold block">Total Telemetry Laps</span>
            <strong className="text-2xl font-hud font-black text-white tabular-nums">{progress.totalLapsDriven + savedLaps.length}</strong>
          </div>
        </div>

        <div className="p-5 bg-[#12121A] border border-[#232332] flex items-center space-x-4 shadow-lg hud-bracket">
          <div className="w-12 h-12 bg-purple-400/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8E8E9F] font-tech uppercase tracking-wider font-semibold block">Academy Rank</span>
            <strong className="text-lg font-racing font-bold text-purple-300">
              {graduatedCount >= 14 ? 'Master Race Driver' : graduatedCount >= 7 ? 'Advanced Racer' : graduatedCount >= 3 ? 'Intermediate' : 'Academy Cadet'}
            </strong>
          </div>
        </div>
      </div>

      {/* Module Badges Showcase */}
      <div className="space-y-3">
        <h3 className="text-sm font-racing font-bold uppercase tracking-wider text-white flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Skip Barber Chapter Certifications</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map((m) => {
            const isGrad = progress.graduatedModuleIds.includes(m.id);

            return (
              <div
                key={m.id}
                className={`p-4 border flex items-center space-x-3 transition-all ${
                  isGrad
                    ? 'bg-gradient-to-br from-amber-950/20 to-[#14141E] border-amber-500/40 shadow-lg'
                    : 'bg-[#0E0E14] border-[#1C1C28] opacity-50'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center font-bold text-xs shrink-0 ${
                  isGrad ? 'bg-amber-400 text-black font-hud' : 'bg-[#1C1C26] text-slate-500 font-mono'
                }`}>
                  {isGrad ? <Trophy className="w-4 h-4" /> : m.moduleNumber}
                </div>
                <div className="truncate">
                  <h4 className={`text-xs font-bold truncate ${isGrad ? 'text-white' : 'text-slate-500'}`}>
                    {m.title}
                  </h4>
                  <span className="text-[10px] font-tech font-bold uppercase tracking-wider text-slate-400">
                    {isGrad ? 'CERTIFIED' : 'IN PROGRESS'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Telemetry Stints & Laps */}
      <div className="space-y-3">
        <h3 className="text-sm font-racing font-bold uppercase tracking-wider text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#00F0FF]" />
          <span>Recorded Practice Stints & Debrief Records</span>
        </h3>

        {savedLaps.length === 0 ? (
          <div className="p-8 bg-[#12121A] border border-[#20202E] text-center text-xs text-slate-400 font-sans">
            No saved practice stints yet. Complete sessions or practice laps to build your telemetry history.
          </div>
        ) : (
          <div className="space-y-2">
            {savedLaps.map((lap, idx) => (
              <div
                key={lap.lapId || idx}
                className="p-4 bg-[#12121A] border border-[#20202E] hover:border-[#E10600] transition-all flex items-center justify-between hud-bracket"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-[#E10600]/20 text-[#FF4D4D] font-mono font-bold flex items-center justify-center text-xs border border-[#E10600]/40 tabular-nums">
                    #{lap.lapNumber}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-racing">Watkins Glen Practice Lap</h4>
                    <span className="text-[10px] font-tech uppercase tracking-wider text-[#8E8E9F]">
                      Traction Budget: <strong className="text-emerald-400 font-mono">{lap.avgTractionBudgetPct}%</strong> • Top Speed: <strong className="text-[#00F0FF] font-mono">{lap.maxSpeedKph} km/h</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-tech uppercase tracking-wider">Lap Time</span>
                    <strong className="text-emerald-400 font-mono font-bold text-sm tabular-nums">{lap.lapTimeSec.toFixed(2)}s</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-tech uppercase tracking-wider">Overall Score</span>
                    <strong className="text-amber-400 font-hud-clean font-bold text-sm tabular-nums">{lap.overallScore}%</strong>
                  </div>
                  <button
                    onClick={() => onSelectLapForDebrief(lap)}
                    className="chamfer-btn-sm px-4 py-2 bg-[#1F1F2C] hover:bg-[#E10600] text-slate-200 hover:text-white text-xs font-racing font-bold tracking-wide border border-[#2D2D3E] transition-all"
                  >
                    Open Debrief
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
