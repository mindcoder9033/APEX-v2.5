import React, { useState } from 'react';
import { UserProgressState, Module } from '../../types/curriculum';
import { LapAnalysis, StintSession } from '../../types/telemetry';
import { 
  Trophy, Award, Activity, Clock, CheckCircle2, Flame, 
  Shield, Target, Zap, Gauge, Lock, Sparkles, Star, ChevronRight,
  Layers, MapPin, Car
} from 'lucide-react';

interface HistoryViewProps {
  progress: UserProgressState;
  modules: Module[];
  savedLaps: LapAnalysis[];
  savedStints?: StintSession[];
  onSelectLapForDebrief?: (lap: LapAnalysis) => void;
  onSelectStintForDebrief?: (stint: StintSession) => void;
}

interface MilestoneBadge {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isUnlocked: boolean;
  progressText?: string;
  accentColor: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  progress,
  modules,
  savedLaps,
  savedStints = [],
  onSelectLapForDebrief,
  onSelectStintForDebrief
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stints' | 'achievements'>('stints');

  const graduatedCount = progress.graduatedModuleIds.length;
  const completedSessionsCount = progress.completedSessionIds.length;
  const totalLaps = progress.totalLapsDriven + savedLaps.length;

  // Derive highest stats across recorded laps
  const highestSpeed = savedLaps.reduce((max, l) => Math.max(max, l.maxSpeedKph || 0), 0);
  const bestTraction = savedLaps.reduce((max, l) => Math.max(max, l.avgTractionBudgetPct || 0), 0);
  const highestScore = savedLaps.reduce((max, l) => Math.max(max, l.overallScore || 0), 0);

  // Dynamic Driver Milestone Badges
  const milestoneBadges: MilestoneBadge[] = [
    {
      id: 'first-contact',
      title: 'First Contact',
      category: 'Academy',
      description: 'Complete your first Skip Barber curriculum session.',
      icon: Zap,
      isUnlocked: completedSessionsCount >= 1,
      progressText: `${Math.min(completedSessionsCount, 1)}/1 Session`,
      accentColor: 'text-amber-400 border-amber-500/40 bg-amber-950/20'
    },
    {
      id: 'telemetry-pioneer',
      title: 'Telemetry Pioneer',
      category: 'Telemetry',
      description: 'Log at least 10 complete vehicle telemetry laps.',
      icon: Activity,
      isUnlocked: totalLaps >= 10,
      progressText: `${Math.min(totalLaps, 10)}/10 Laps`,
      accentColor: 'text-[#00F0FF] border-cyan-500/40 bg-cyan-950/20'
    },
    {
      id: 'speed-demon',
      title: 'Velocity Peak',
      category: 'Pace',
      description: 'Reach a peak vehicle speed of 200 km/h or higher.',
      icon: Gauge,
      isUnlocked: highestSpeed >= 200,
      progressText: `${Math.round(highestSpeed)} / 200 km/h`,
      accentColor: 'text-red-400 border-red-500/40 bg-red-950/20'
    },
    {
      id: 'traction-master',
      title: 'Traction Whisperer',
      category: 'Vehicle Dynamics',
      description: 'Sustain an average tire traction budget of 85% or higher on a lap.',
      icon: Flame,
      isUnlocked: bestTraction >= 85,
      progressText: `${Math.round(bestTraction)}% / 85%`,
      accentColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20'
    },
    {
      id: 'precision-apex',
      title: 'Precision Master',
      category: 'Coaching',
      description: 'Attain an overall driving diagnostic score of 90% or higher.',
      icon: Target,
      isUnlocked: highestScore >= 90,
      progressText: `${Math.round(highestScore)}% / 90%`,
      accentColor: 'text-purple-400 border-purple-500/40 bg-purple-950/20'
    },
    {
      id: 'halfway-pro',
      title: 'Skip Barber Scholar',
      category: 'Curriculum',
      description: 'Successfully pass and graduate 7 curriculum modules.',
      icon: Shield,
      isUnlocked: graduatedCount >= 7,
      progressText: `${graduatedCount}/7 Modules`,
      accentColor: 'text-blue-400 border-blue-500/40 bg-blue-950/20'
    },
    {
      id: 'centurion',
      title: 'Centurion Driver',
      category: 'Endurance',
      description: 'Log over 100 total telemetry laps across all tracks.',
      icon: Star,
      isUnlocked: totalLaps >= 100,
      progressText: `${Math.min(totalLaps, 100)}/100 Laps`,
      accentColor: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20'
    },
    {
      id: 'master-motorsport',
      title: 'Master of Motorsport',
      category: 'Mastery',
      description: 'Graduate all 14 Skip Barber textbook chapters with full certification.',
      icon: Trophy,
      isUnlocked: graduatedCount >= 14 && modules.length > 0 && graduatedCount >= modules.length,
      progressText: `${graduatedCount}/${modules.length} Modules`,
      accentColor: 'text-amber-300 border-amber-400/60 bg-amber-900/30'
    }
  ];

  const unlockedMilestonesCount = milestoneBadges.filter(b => b.isUnlocked).length;
  const totalAchievementsCount = graduatedCount + unlockedMilestonesCount;
  const maxPossibleAchievements = modules.length + milestoneBadges.length;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0E] space-y-6">
      {/* Top Banner Stats Grid (Pinned Globally) */}
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
            <strong className="text-2xl font-hud font-black text-white tabular-nums">{totalLaps}</strong>
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

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex items-center justify-between border-b border-[#232332] pb-1">
        <div className="flex items-center space-x-2">
          {/* Tab 1: Recorded practice stints & debrief records */}
          <button
            onClick={() => setActiveSubTab('stints')}
            className={`flex items-center space-x-2.5 px-5 py-2.5 text-xs font-racing font-bold tracking-wider transition-all uppercase ${
              activeSubTab === 'stints'
                ? 'bg-[#E10600] text-white chamfer-tab shadow-lg shadow-red-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161622] border border-transparent'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Recorded Practice Stints & Debrief Records</span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
              activeSubTab === 'stints' ? 'bg-black/30 text-white' : 'bg-[#1F1F2C] text-slate-400'
            }`}>
              {savedLaps.length}
            </span>
          </button>

          {/* Tab 2: Achievements */}
          <button
            onClick={() => setActiveSubTab('achievements')}
            className={`flex items-center space-x-2.5 px-5 py-2.5 text-xs font-racing font-bold tracking-wider transition-all uppercase ${
              activeSubTab === 'achievements'
                ? 'bg-[#E10600] text-white chamfer-tab shadow-lg shadow-red-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161622] border border-transparent'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Achievements</span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
              activeSubTab === 'achievements' ? 'bg-black/30 text-white' : 'bg-[#1F1F2C] text-amber-400'
            }`}>
              {totalAchievementsCount} / {maxPossibleAchievements}
            </span>
          </button>
        </div>

        <span className="text-[11px] font-tech text-slate-500 hidden md:inline">
          {activeSubTab === 'stints' ? 'CHRONOLOGICAL TELEMETRY ARCHIVE' : 'CAREER CERTIFICATIONS & HONORS'}
        </span>
      </div>

      {/* Sub-Tab 1 Content: Recorded Practice Stints & Debrief Records */}
      {activeSubTab === 'stints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-racing font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#00F0FF]" />
              <span>Historical Stints & Telemetry Records</span>
            </h3>
            <span className="text-xs text-[#8E8E9F] font-tech">
              Showing {(savedStints && savedStints.length > 0) ? savedStints.length : savedLaps.length} recorded telemetry {(savedStints && savedStints.length > 0) ? (savedStints.length === 1 ? 'stint' : 'stints') : (savedLaps.length === 1 ? 'stint' : 'stints')}
            </span>
          </div>

          {(savedStints && savedStints.length > 0) ? (
            <div className="space-y-2.5">
              {savedStints.map((stint, idx) => {
                const lapCount = stint.laps ? stint.laps.length : stint.totalLaps || 1;
                const formatTime = (sec?: number) => {
                  if (!sec || isNaN(sec)) return '--:--.---';
                  const mins = Math.floor(sec / 60);
                  const rem = (sec % 60).toFixed(2);
                  return `${mins}:${rem.padStart(5, '0')}`;
                };

                return (
                  <div
                    key={stint.stintId || idx}
                    className="p-4 bg-[#12121A] border border-[#20202E] hover:border-[#E10600] transition-all flex flex-wrap items-center justify-between gap-4 hud-bracket group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#E10600]/20 text-[#FF4D4D] font-mono font-bold flex items-center justify-center text-xs border border-[#E10600]/40 tabular-nums">
                        #{stint.stintNumber || savedStints.length - idx}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white font-racing">
                            {stint.title || `Stint #${stint.stintNumber || idx + 1}`}
                          </h4>
                          <span className={`text-[9px] px-1.5 py-0.2 font-mono uppercase font-bold ${
                            stint.source === 'academy' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                          }`}>
                            {stint.source === 'academy' ? 'Academy' : 'Practice'}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 font-mono uppercase font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center space-x-1">
                            <Layers className="w-2.5 h-2.5" />
                            <span>{lapCount} {lapCount === 1 ? 'Lap' : 'Laps'}</span>
                          </span>
                        </div>
                        <div className="text-[10px] font-tech uppercase tracking-wider text-[#8E8E9F] flex items-center space-x-2 mt-1">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-2.5 h-2.5 text-[#E10600]" />
                            <span>{stint.trackName || 'Lime Rock Park'}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Car className="w-2.5 h-2.5 text-slate-500" />
                            <span>{stint.carName || 'Formula 2000'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-tech uppercase tracking-wider">Best Lap</span>
                        <strong className="text-emerald-400 font-mono font-bold text-sm tabular-nums">
                          {formatTime(stint.bestLapTimeSec)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-tech uppercase tracking-wider">Avg Grade</span>
                        <strong className="text-amber-400 font-hud-clean font-bold text-sm tabular-nums">
                          {Math.round(stint.avgScore || 0)}%
                        </strong>
                      </div>
                      <button
                        onClick={() => {
                          if (onSelectStintForDebrief) {
                            onSelectStintForDebrief(stint);
                          } else if (onSelectLapForDebrief && stint.laps?.[0]) {
                            onSelectLapForDebrief(stint.laps[0]);
                          }
                        }}
                        className="chamfer-btn-sm px-4 py-2 bg-[#1F1F2C] group-hover:bg-[#E10600] text-slate-200 group-hover:text-white text-xs font-racing font-bold tracking-wide border border-[#2D2D3E] transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <span>Open Debrief</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : savedLaps.length === 0 ? (
            <div className="p-12 bg-[#12121A] border border-[#20202E] text-center space-y-3 hud-bracket">
              <Activity className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <h4 className="text-sm font-racing font-bold text-slate-300">No telemetry stints recorded yet</h4>
              <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
                Drive laps in the Academy Curriculum sessions or in Live Ingest & Practice to automatically record vehicle telemetry.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedLaps.map((lap, idx) => (
                <div
                  key={lap.lapId || idx}
                  className="p-4 bg-[#12121A] border border-[#20202E] hover:border-[#E10600] transition-all flex items-center justify-between hud-bracket group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-9 h-9 bg-[#E10600]/20 text-[#FF4D4D] font-mono font-bold flex items-center justify-center text-xs border border-[#E10600]/40 tabular-nums">
                      #{lap.lapNumber || idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white font-racing">
                          {lap.sessionTitle || lap.moduleTitle || 'Watkins Glen'} • Lap #{lap.lapNumber || idx + 1}
                        </h4>
                        <span className={`text-[9px] px-1.5 py-0.2 font-mono uppercase font-bold ${
                          lap.source === 'academy' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40' : 'bg-blue-950/60 text-blue-400 border border-blue-500/40'
                        }`}>
                          {lap.source === 'academy' ? 'Academy' : 'Practice'}
                        </span>
                      </div>
                      <span className="text-[10px] font-tech uppercase tracking-wider text-[#8E8E9F] block mt-0.5">
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
                      onClick={() => onSelectLapForDebrief && onSelectLapForDebrief(lap)}
                      className="chamfer-btn-sm px-4 py-2 bg-[#1F1F2C] group-hover:bg-[#E10600] text-slate-200 group-hover:text-white text-xs font-racing font-bold tracking-wide border border-[#2D2D3E] transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Open Debrief</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2 Content: Achievements */}
      {activeSubTab === 'achievements' && (
        <div className="space-y-8">
          {/* Driver Milestones & Badges Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-racing font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Driver Milestone Badges ({unlockedMilestonesCount}/{milestoneBadges.length})</span>
              </h3>
              <span className="text-xs text-[#8E8E9F] font-tech">
                Unlock honors through academy mastery, corner precision, and telemetry milestones
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {milestoneBadges.map((badge) => {
                const IconComponent = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`p-4 border transition-all flex flex-col justify-between hud-bracket ${
                      badge.isUnlocked
                        ? `${badge.accentColor} shadow-md`
                        : 'bg-[#0E0E14] border-[#1C1C28] opacity-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`w-9 h-9 flex items-center justify-center border ${
                          badge.isUnlocked ? badge.accentColor : 'bg-[#161622] border-[#252536] text-slate-600'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className={`text-[9px] font-tech font-bold uppercase px-2 py-0.5 border ${
                          badge.isUnlocked ? 'border-amber-400/40 text-amber-300 bg-amber-950/40' : 'border-slate-800 text-slate-600 bg-slate-900/40'
                        }`}>
                          {badge.category}
                        </span>
                      </div>

                      <h4 className={`text-xs font-racing font-bold ${badge.isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                        {badge.title}
                      </h4>
                      <p className="text-[11px] text-[#8E8E9F] font-sans mt-1 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">{badge.progressText}</span>
                      <span className={`font-bold uppercase tracking-wider ${
                        badge.isUnlocked ? 'text-emerald-400 flex items-center space-x-1' : 'text-slate-600 flex items-center space-x-1'
                      }`}>
                        {badge.isUnlocked ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>UNLOCKED</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>LOCKED</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skip Barber Chapter Certifications Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-racing font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Skip Barber Chapter Certifications ({graduatedCount}/{modules.length})</span>
              </h3>
              <span className="text-xs text-[#8E8E9F] font-tech">
                Pass Graduation Exams to earn module certifications
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {modules.map((m) => {
                const isGrad = progress.graduatedModuleIds.includes(m.id);

                return (
                  <div
                    key={m.id}
                    className={`p-4 border flex items-center space-x-3 transition-all hud-bracket ${
                      isGrad
                        ? 'bg-gradient-to-br from-amber-950/20 to-[#14141E] border-amber-500/40 shadow-lg'
                        : 'bg-[#0E0E14] border-[#1C1C28] opacity-50'
                    }`}
                  >
                    <div className={`w-9 h-9 flex items-center justify-center font-bold text-xs shrink-0 ${
                      isGrad ? 'bg-amber-400 text-black font-hud shadow-md shadow-amber-950' : 'bg-[#1C1C26] text-slate-500 font-mono'
                    }`}>
                      {isGrad ? <Trophy className="w-4 h-4" /> : m.moduleNumber}
                    </div>
                    <div className="truncate">
                      <h4 className={`text-xs font-bold truncate ${isGrad ? 'text-white' : 'text-slate-500'}`}>
                        {m.title}
                      </h4>
                      <span className={`text-[10px] font-tech font-bold uppercase tracking-wider ${
                        isGrad ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {isGrad ? 'CERTIFIED' : 'IN PROGRESS'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
