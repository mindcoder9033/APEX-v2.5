import React, { useState, useEffect } from 'react';
import { LapAnalysis } from '../../types/telemetry';
import { Module, Session } from '../../types/curriculum';
import { TelemetryTraces } from '../telemetry/TelemetryTraces';
import { FrictionCirclePlot } from '../telemetry/FrictionCirclePlot';
import { TrackMapViewer } from '../telemetry/TrackMapViewer';
import { DiagnosticScorecard } from './DiagnosticScorecard';
import { ActionPlanCard } from '../adjust/ActionPlanCard';
import { 
  Activity, FileDown, Radio, Award, Trash2, Clock, 
  Calendar, CheckCircle2, AlertCircle, ArrowRight, BookOpen, Play
} from 'lucide-react';

interface DebriefViewProps {
  savedLaps: LapAnalysis[];
  currentLap: LapAnalysis | null;
  onSelectLap: (lap: LapAnalysis) => void;
  onDeleteLap?: (lapId: string) => void;
  module?: Module;
  session?: Session;
  onOpenPdfModal: () => void;
  onNavigateToAcademy?: () => void;
  onNavigateToPractice?: () => void;
}

export const DebriefView: React.FC<DebriefViewProps> = ({
  savedLaps,
  currentLap,
  onSelectLap,
  onDeleteLap,
  module,
  session,
  onOpenPdfModal,
  onNavigateToAcademy,
  onNavigateToPractice
}) => {
  // Category tab state: 'academy' vs 'practice'
  const [activeCategory, setActiveCategory] = useState<'academy' | 'practice'>(() => {
    if (currentLap?.source === 'academy') return 'academy';
    const hasAcademy = savedLaps.some(l => l.source === 'academy');
    return hasAcademy ? 'academy' : 'practice';
  });

  const [cursorDist, setCursorDist] = useState<number>(850);

  // Filter laps by category
  const academyLaps = savedLaps.filter(l => l.source === 'academy');
  const practiceLaps = savedLaps.filter(l => l.source === 'practice' || !l.source);

  const displayedLaps = activeCategory === 'academy' ? academyLaps : practiceLaps;

  // Selected lap in the active view
  const selectedLap = currentLap && displayedLaps.some(l => l.lapId === currentLap.lapId)
    ? currentLap
    : displayedLaps.length > 0 
    ? displayedLaps[0] 
    : currentLap;

  // Sync cursor when selectedLap changes
  useEffect(() => {
    if (selectedLap?.frames && selectedLap.frames.length > 0) {
      setCursorDist(selectedLap.frames[Math.floor(selectedLap.frames.length / 2)]?.distance || 850);
    }
  }, [selectedLap?.lapId]);

  const closestFrame = selectedLap?.frames.find(f => Math.abs(f.distance - cursorDist) < 15) || selectedLap?.frames[0] || null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent Stint';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent Stint';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0E] overflow-hidden">
      {/* Top Header Category Switcher Bar */}
      <div className="px-6 py-3 border-b border-[#232332] bg-[#0E0E14] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E10600] to-[#880400] flex items-center justify-center font-display font-black text-white text-xs shadow-md shadow-red-950">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-racing font-bold tracking-wider text-white">
              Telemetry & Debrief Workspace
            </h1>
            <p className="text-[11px] text-[#8E8E9F] font-sans">
              Recorded vehicle stint telemetry, friction circles, and Skip Barber corner diagnostics
            </p>
          </div>
        </div>

        {/* Category Tabs: Academy vs Live Practice */}
        <div className="flex items-center space-x-1.5 bg-[#14141E] p-1 rounded-xl border border-[#262638]">
          <button
            onClick={() => {
              setActiveCategory('academy');
              if (academyLaps.length > 0) onSelectLap(academyLaps[0]);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === 'academy'
                ? 'bg-[#E10600] text-white shadow-md shadow-red-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1A28]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Curriculum Academy Stints</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              activeCategory === 'academy' ? 'bg-white/20 text-white' : 'bg-[#202030] text-slate-400'
            }`}>
              {academyLaps.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('practice');
              if (practiceLaps.length > 0) onSelectLap(practiceLaps[0]);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === 'practice'
                ? 'bg-[#E10600] text-white shadow-md shadow-red-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1A28]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Practice Stints</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              activeCategory === 'practice' ? 'bg-white/20 text-white' : 'bg-[#202030] text-slate-400'
            }`}>
              {practiceLaps.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Split View: Left Stint List, Right Debrief Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Vertical Stint List */}
        <div className="w-80 lg:w-96 border-r border-[#232332] bg-[#0E0E14] flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-[#232332] flex items-center justify-between">
            <h2 className="text-xs font-tech font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              {activeCategory === 'academy' ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-[#E10600]" />
                  <span>Academy Recorded Stints</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Practice Stints</span>
                </>
              )}
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              {displayedLaps.length} {displayedLaps.length === 1 ? 'Stint' : 'Stints'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {displayedLaps.length === 0 ? (
              <div className="p-6 text-center space-y-3 mt-8">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#161622] border border-[#262638] flex items-center justify-center text-slate-500">
                  {activeCategory === 'academy' ? <Award className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
                </div>
                <h3 className="text-xs font-bold text-slate-300">
                  No {activeCategory === 'academy' ? 'Academy' : 'Live Practice'} Stints Yet
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                  {activeCategory === 'academy'
                    ? 'Start a session in Curriculum Academy and complete a stint in Step 2 to view debrief telemetry.'
                    : 'Connect Forza Motorsport and complete a stint in the Live Ingest & Practice tab.'}
                </p>
                {activeCategory === 'academy' && onNavigateToAcademy && (
                  <button
                    onClick={onNavigateToAcademy}
                    className="px-3.5 py-1.5 rounded-lg bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-md shadow-red-950/50 cursor-pointer transition-all"
                  >
                    Go to Academy
                  </button>
                )}
                {activeCategory === 'practice' && onNavigateToPractice && (
                  <button
                    onClick={onNavigateToPractice}
                    className="px-3.5 py-1.5 rounded-lg bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-md shadow-red-950/50 cursor-pointer transition-all"
                  >
                    Go to Live Practice
                  </button>
                )}
              </div>
            ) : (
              displayedLaps.map((lap, idx) => {
                const isSelected = selectedLap?.lapId === lap.lapId;

                return (
                  <div
                    key={lap.lapId || idx}
                    onClick={() => onSelectLap(lap)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all relative overflow-hidden cursor-pointer group ${
                      isSelected
                        ? 'bg-[#181824] border-[#E10600] shadow-lg shadow-red-950/20'
                        : 'bg-[#12121A] border-[#222230] hover:bg-[#161622] hover:border-[#2D2D40]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E10600]" />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 pr-2">
                        {/* Stint Title / Module info */}
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          {lap.source === 'academy' && lap.moduleNumber ? (
                            <span className="text-[10px] font-mono font-bold text-[#FF4D4D] bg-[#E10600]/10 px-1.5 py-0.2 rounded border border-[#E10600]/30">
                              Mod {lap.moduleNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              Practice
                            </span>
                          )}
                          <span className="text-xs font-bold text-white truncate max-w-[140px] block" title={lap.sessionTitle || `Stint #${lap.lapNumber}`}>
                            {lap.sessionTitle || `Stint #${lap.lapNumber}`}
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center space-x-3 pt-1 text-[11px] font-mono">
                          <span className="text-white font-bold">{lap.lapTimeSec.toFixed(2)}s</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-400 font-bold">{lap.overallScore}% Grade</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-[#00F0FF]">{lap.maxSpeedKph} km/h</span>
                        </div>

                        {/* Timestamp */}
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 pt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(lap.recordedAt)}</span>
                        </div>
                      </div>

                      {/* Right Delete Action */}
                      <div className="flex flex-col items-end space-y-2 shrink-0">
                        {onDeleteLap && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLap(lap.lapId);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-[#201518] transition-colors"
                            title="Delete stint from history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Debrief Workspace for Selected Stint */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0A0A0E] space-y-6">
          {selectedLap ? (
            <>
              {/* Debrief Header Banner */}
              <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex items-center justify-between shadow-xl">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#E10600] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider tabular-nums">
                      {selectedLap.source === 'academy' ? 'Academy Stint Analysis' : 'Live Practice Stint'}
                    </span>
                    <span className="text-xs text-[#8E8E9F] font-tech uppercase tracking-wider font-semibold">
                      {selectedLap.moduleNumber ? `Module ${selectedLap.moduleNumber}: ${selectedLap.moduleTitle}` : 'Full Telemetry Debrief'}
                    </span>
                  </div>
                  <h2 className="text-xl font-racing font-bold text-white mt-1">
                    {selectedLap.sessionTitle ? selectedLap.sessionTitle : 'Skip Barber Telemetric Debrief & Corner Diagnosis'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    Recorded on {formatDate(selectedLap.recordedAt)} • Evaluating traction budget, trail-braking smoothness, and apex throttle synchronization.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={onOpenPdfModal}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E10600] to-[#B30400] hover:from-[#FF1801] hover:to-[#E10600] text-white text-xs font-racing font-bold tracking-wide shadow-lg shadow-red-950/60 active:scale-95 transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Generate Official PDF</span>
                  </button>
                </div>
              </div>

              {/* Summary KPI Strip */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                  <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Lap Time</span>
                  <strong className="text-base font-mono font-bold text-white tabular-nums">{selectedLap.lapTimeSec.toFixed(2)}s</strong>
                </div>
                <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                  <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Peak Velocity</span>
                  <strong className="text-base font-hud-clean font-bold text-[#00F0FF] tabular-nums">{selectedLap.maxSpeedKph} <span className="text-xs font-tech">km/h</span></strong>
                </div>
                <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                  <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Traction Budget %</span>
                  <strong className="text-base font-hud-clean font-bold text-emerald-400 tabular-nums">{selectedLap.avgTractionBudgetPct}%</strong>
                </div>
                <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                  <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Max Lateral G</span>
                  <strong className="text-base font-mono font-bold text-purple-400 tabular-nums">{selectedLap.peakLatG}G</strong>
                </div>
                <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                  <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Max Braking G</span>
                  <strong className="text-base font-mono font-bold text-[#FF1801] tabular-nums">{selectedLap.peakBrakingG}G</strong>
                </div>
                <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                  <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Mastery Grade</span>
                  <strong className="text-base font-hud-clean font-bold text-amber-400 tabular-nums">{selectedLap.overallScore}%</strong>
                </div>
              </div>

              {/* Synchronized Lap Telemetry */}
              <TelemetryTraces
                frames={selectedLap.frames}
                cursorDistance={cursorDist}
                onCursorChange={setCursorDist}
                height={280}
              />

              {/* G-G Friction Circle & Track Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FrictionCirclePlot frames={selectedLap.frames} currentFrame={closestFrame} />
                <TrackMapViewer frames={selectedLap.frames} currentDistance={cursorDist} />
              </div>

              {/* Turn-by-Turn Diagnostics */}
              <DiagnosticScorecard corners={selectedLap.corners} onFocusCorner={setCursorDist} />

              {/* Action Plan */}
              <ActionPlanCard actionItems={selectedLap.actionItems} />
            </>
          ) : (
            <div className="p-12 rounded-3xl bg-[#14141E] border border-[#232332] text-center space-y-4 shadow-2xl max-w-2xl mx-auto my-12">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1A1A28] border border-[#2D2D44] flex items-center justify-center">
                <Radio className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-white">No Stint Selected</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Select a stint from the left column or run a practice stint in Curriculum Academy or Live Ingest to generate full telemetric traces.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
