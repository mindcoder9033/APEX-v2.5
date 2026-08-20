import React from 'react';
import { 
  Award, Radio, Activity, Clock, Trophy, Gauge, 
  MapPin, ChevronRight, Zap
} from 'lucide-react';
import { UserProgressState, Module, Session } from '../../types/curriculum';
import { LapAnalysis, StintSession, TelemetryFrame } from '../../types/telemetry';

interface DashboardViewProps {
  progress: UserProgressState;
  modules: Module[];
  savedLaps: LapAnalysis[];
  savedStints: StintSession[];
  isUdpConnected: boolean;
  isBridgeConnected?: boolean;
  liveFrame?: TelemetryFrame | null;
  onNavigateToAcademy: (module?: Module, session?: Session) => void;
  onNavigateToPractice: () => void;
  onNavigateToDebrief: (stint?: StintSession, lap?: LapAnalysis) => void;
  onNavigateToHistory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  modules,
  savedLaps,
  savedStints,
  isUdpConnected,
  isBridgeConnected = false,
  liveFrame,
  onNavigateToAcademy,
  onNavigateToPractice,
  onNavigateToDebrief,
  onNavigateToHistory
}) => {
  // Collect all laps across stints and standalone saved laps
  const allStintLaps = savedStints.flatMap((s) => s.laps || []);
  const allLaps = [...allStintLaps, ...savedLaps];
  const totalLapsCount = progress.totalLapsDriven + allLaps.length;

  // Calculate total track time
  const totalDurationSec = savedStints.reduce((acc, s) => acc + (s.durationSec || 0), 0) +
    savedLaps.reduce((acc, l) => acc + (l.lapTimeSec || 0), 0);

  const formatHoursMinutes = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatLapTime = (sec?: number) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '--:--.---';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  // Driver Level derivation
  const graduatedCount = progress.graduatedModuleIds.length;
  const driverLevel = 
    graduatedCount >= 14 ? 'Grandmaster' :
    graduatedCount >= 10 ? 'Expert' :
    graduatedCount >= 6  ? 'Advanced' :
    graduatedCount >= 3  ? 'Intermediate' :
    graduatedCount >= 1  ? 'Novice' : 'Rookie';

  // Find next unfinished module and session
  let nextModule: Module | null = null;
  let nextSession: Session | null = null;

  for (const mod of modules) {
    const isModuleGraduated = progress.graduatedModuleIds.includes(mod.id);
    if (!isModuleGraduated) {
      const unfinished = mod.sessions.find(s => !progress.completedSessionIds.includes(s.id));
      if (unfinished) {
        nextModule = mod;
        nextSession = unfinished;
        break;
      }
      if (!nextModule) {
        nextModule = mod;
      }
    }
  }

  // Fallback to first module if all completed or default
  if (!nextModule && modules.length > 0) {
    nextModule = modules[0];
    nextSession = modules[0].sessions[0] || null;
  }

  // Group personal bests by track
  const trackBestMap: { [track: string]: { bestLap: LapAnalysis; count: number } } = {};
  allLaps.forEach((lap) => {
    const track = lap.detectedTrackName || 'Unknown Track';
    if (track === 'Unknown Track') return;
    if (!trackBestMap[track] || lap.lapTimeSec < trackBestMap[track].bestLap.lapTimeSec) {
      trackBestMap[track] = {
        bestLap: lap,
        count: (trackBestMap[track]?.count || 0) + 1
      };
    } else {
      trackBestMap[track].count += 1;
    }
  });

  const trackPBs = Object.entries(trackBestMap).slice(0, 4);

  // Recent stints (last 4)
  const recentStints = [...savedStints].slice(0, 4);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0A0E] text-slate-100 p-6 space-y-6 select-none font-sans">
      {/* 1. Hero & Driver Status Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#12121B] via-[#101018] to-[#160B0B] border border-[#232332] p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <span className="chamfer-badge bg-[#E10600]/20 text-[#FF4D4D] text-xs font-mono font-bold px-2.5 py-0.5 border border-[#E10600]/40">
                DRIVER COCKPIT
              </span>
              <span className="text-xs font-mono text-slate-400">
                Rank: <strong className="text-slate-200 uppercase">{driverLevel}</strong>
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-racing font-bold tracking-wide text-white">
              Analytical Telemetry & Driver Hub
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Real-time telemetry ingestion, Skip Barber racing curriculum tracking, and physics-driven debrief diagnostics.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToPractice()}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950/40 active:scale-95 chamfer-btn-sm"
            >
              <Radio className="w-4 h-4" />
              <span>Start Live Stint</span>
            </button>

            {nextModule && (
              <button
                onClick={() => onNavigateToAcademy(nextModule || undefined, nextSession || undefined)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#E10600] hover:bg-[#FF1801] text-white font-semibold text-xs transition-all shadow-lg shadow-red-950/40 active:scale-95 chamfer-btn-sm"
              >
                <Award className="w-4 h-4" />
                <span>Resume Academy</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Track Time */}
        <div className="bg-[#12121A] border border-[#232332] p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Track Time</span>
            <span className="text-xl font-racing font-bold text-white tracking-wide mt-1 block">
              {formatHoursMinutes(totalDurationSec)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
              Across {savedStints.length} stints & challenges
            </span>
          </div>
          <div className="w-10 h-10 bg-[#181824] border border-[#2A2A3E] flex items-center justify-center text-[#00F0FF]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Laps Driven */}
        <div className="bg-[#12121A] border border-[#232332] p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Laps Driven</span>
            <span className="text-xl font-racing font-bold text-white tracking-wide mt-1 block">
              {totalLapsCount} <span className="text-xs font-normal text-slate-400">laps</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 mt-0.5 block">
              {allLaps.length} telemetry logs saved
            </span>
          </div>
          <div className="w-10 h-10 bg-[#181824] border border-[#2A2A3E] flex items-center justify-center text-emerald-400">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        {/* Academy Mastery */}
        <div className="bg-[#12121A] border border-[#232332] p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Academy Mastery</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-racing font-bold text-[#FF4D4D]">
                {graduatedCount}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 14 Modules</span>
            </div>
            <div className="w-28 bg-[#1E1E2C] h-1.5 mt-2">
              <div
                className="bg-[#E10600] h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (graduatedCount / 14) * 100)}%` }}
              />
            </div>
          </div>
          <div className="w-10 h-10 bg-[#181824] border border-[#2A2A3E] flex items-center justify-center text-[#FF5C5C]">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Live UDP Connection Telemetry Status */}
        <div className="bg-[#12121A] border border-[#232332] p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Ingest Bridge</span>
            <span className={`text-base font-racing font-bold tracking-wide mt-1 block ${
              isUdpConnected ? 'text-emerald-400' : isBridgeConnected ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {isUdpConnected ? '60Hz Connected' : isBridgeConnected ? 'Bridge Standby' : 'Bridge Offline'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
              {isUdpConnected && liveFrame
                ? `${Math.round(liveFrame.speedKph)} km/h • Gear ${liveFrame.gear}`
                : 'Port 5300 CarDash'}
            </span>
          </div>
          <div className={`w-10 h-10 border flex items-center justify-center ${
            isUdpConnected 
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' 
              : 'bg-[#181824] border-[#2A2A3E] text-slate-400'
          }`}>
            <Radio className={`w-5 h-5 ${isUdpConnected ? 'animate-pulse' : ''}`} />
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (2 cols span): Next Up Academy + Track Records */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Academy Session Card */}
          {nextModule && (
            <div className="bg-[#12121A] border border-[#232332] p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232332]">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-[#FF5C5C]" />
                  <span className="text-xs font-racing font-bold uppercase tracking-wider text-slate-200">
                    Next Academy Session
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#E10600]/20 text-[#FF5C5C] px-2 py-0.5 border border-[#E10600]/30">
                  MODULE {nextModule.moduleNumber} / 14
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-racing font-bold text-white">
                    {nextModule.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {nextModule.description}
                  </p>
                </div>

                {nextSession && (
                  <div className="bg-[#181824] border border-[#26263A] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase">
                          Active Target:
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {nextSession.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {nextSession.drillGoal || nextSession.subtitle}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigateToAcademy(nextModule || undefined, nextSession || undefined)}
                      className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-semibold transition-all active:scale-95"
                    >
                      <span>Launch Session</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Track Personal Bests & Circuit Records */}
          <div className="bg-[#12121A] border border-[#232332] p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232332]">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-racing font-bold uppercase tracking-wider text-slate-200">
                  Track Personal Bests
                </span>
              </div>
              <button
                onClick={() => onNavigateToHistory()}
                className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <span>View All History</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {trackPBs.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                No personal bests recorded yet. Start a Live Stint or Academy session to log telemetry.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trackPBs.map(([trackName, data]) => (
                  <div
                    key={trackName}
                    className="bg-[#161622] border border-[#26263A] p-3.5 space-y-2 hover:border-[#383854] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                        <span className="text-xs font-bold text-slate-200 truncate font-mono">
                          {trackName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-[#1C1C2A] px-1.5 py-0.5">
                        {data.count} {data.count === 1 ? 'lap' : 'laps'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-sm font-racing font-bold text-amber-300">
                        {formatLapTime(data.bestLap.lapTimeSec)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                        {data.bestLap.detectedCarName || 'Car telemetry'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recent Stints Activity Log */}
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#232332] p-5 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232332]">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-racing font-bold uppercase tracking-wider text-slate-200">
                    Recent Stints
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToDebrief()}
                  className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  <span>Debrief</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {recentStints.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  No recorded stints available yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentStints.map((stint, index) => {
                    const bestLap = stint.laps.reduce((best, l) => 
                      !best || l.lapTimeSec < best.lapTimeSec ? l : best
                    , stint.laps[0]);

                    return (
                      <div
                        key={stint.stintId || index}
                        className="bg-[#181824] border border-[#26263A] p-3 hover:border-slate-500 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-200 truncate">
                              {stint.trackName || 'Circuit Stint'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({stint.laps.length} {stint.laps.length === 1 ? 'lap' : 'laps'})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                            <span>Best: <strong className="text-emerald-400">{formatLapTime(bestLap?.lapTimeSec || stint.bestLapTimeSec)}</strong></span>
                            <span>•</span>
                            <span>{new Date(stint.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateToDebrief(stint, bestLap)}
                          className="shrink-0 px-2.5 py-1 bg-[#1F1F30] hover:bg-[#E10600] text-slate-300 hover:text-white text-[11px] font-mono font-semibold transition-all"
                          title="Open in Analysis"
                        >
                          Analyze
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick telemetry helper callout */}
            <div className="mt-4 p-3 bg-[#151520] border border-[#232332] text-[11px] text-slate-400 font-mono space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Sim Pro-Tip</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug font-sans">
                Review throttle smoothness & trail-braking pressure profiles in the <strong>Analysis</strong> tab to identify corner exit time gains.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
