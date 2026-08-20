import React, { useState } from 'react';
import { Module, Session, UserProgressState, DriverLevel } from '../../types/curriculum';
import { DRIVER_LEVELS } from '../../data/skipBarberCurriculum';
import { 
  Lock, CheckCircle2, Award, Trophy, Play, 
  Target, Sparkles, Car, Shield
} from 'lucide-react';

interface CurriculumTreeProps {
  modules: Module[];
  progress: UserProgressState;
  onSelectSession: (module: Module, session: Session) => void;
  onStartGraduationTest: (module: Module) => void;
}

export const CurriculumTree: React.FC<CurriculumTreeProps> = ({
  modules,
  progress,
  onSelectSession,
  onStartGraduationTest
}) => {
  const [selectedDriverLevel, setSelectedDriverLevel] = useState<DriverLevel>(
    progress.selectedDriverLevel || 'Beginner'
  );

  // Filter modules by driver level
  const filteredModules = modules.filter(m => m.driverLevel === selectedDriverLevel);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    filteredModules[0]?.id || modules[0]?.id || 'mod-1'
  );

  const activeModule = filteredModules.find(m => m.id === selectedModuleId) || filteredModules[0] || modules[0];
  const isModuleUnlocked = (modId: string) => progress.unlockedModuleIds.includes(modId);
  const isModuleGraduated = (modId: string) => progress.graduatedModuleIds.includes(modId);
  const isSessionUnlocked = (sessId: string) => progress.unlockedSessionIds.includes(sessId);
  const isSessionCompleted = (sessId: string) => progress.completedSessionIds.includes(sessId);

  // Check if all sessions in active module are completed to enable graduation test
  const allSessionsInModuleCompleted = activeModule?.sessions.every(s => isSessionCompleted(s.id)) ?? false;

  const handleLevelChange = (lvl: DriverLevel) => {
    setSelectedDriverLevel(lvl);
    const firstMod = modules.find(m => m.driverLevel === lvl);
    if (firstMod) {
      setSelectedModuleId(firstMod.id);
    }
  };

  const getMedalBadge = (challengeId: string) => {
    const result = progress.challengeResults[challengeId];
    if (!result || !result.passed) return null;
    if (result.medal === 'gold') {
      return (
        <span className="flex items-center space-x-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
          <span>🥇 GOLD</span>
        </span>
      );
    }
    if (result.medal === 'silver') {
      return (
        <span className="flex items-center space-x-1 px-2 py-0.5 bg-slate-400/20 text-slate-200 border border-slate-400/40 text-[10px] font-mono font-bold">
          <span>🥈 SILVER</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 px-2 py-0.5 bg-amber-800/30 text-amber-500 border border-amber-800/40 text-[10px] font-mono font-bold">
        <span>🥉 BRONZE</span>
      </span>
    );
  };

  const graduatedCountInLevel = filteredModules.filter(m => isModuleGraduated(m.id)).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0E]">
      {/* Tier 1 Header: Driver Level Selection (Tabs positioned directly next to label) */}
      <div className="bg-[#0D0D14] border-b border-[#232332] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 shrink-0">
            <div className="p-1.5 bg-red-950/60 border border-[#E10600]/40 text-[#E10600]">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Academy Driver Level:
            </span>
          </div>

          {/* Driver Level Tabs grouped immediately next to label */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {DRIVER_LEVELS.map((lvl) => {
              const isSelected = lvl.id === selectedDriverLevel;
              const levelModules = modules.filter(m => m.driverLevel === lvl.id);
              const levelGraduated = levelModules.length > 0 && levelModules.every(m => isModuleGraduated(m.id));
              const isUnlocked = lvl.id === 'Beginner' || (progress.unlockedDriverLevels?.includes(lvl.id as DriverLevel) ?? false);

              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => handleLevelChange(lvl.id as DriverLevel)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#E10600] text-white border-red-500 shadow-md shadow-red-950/40'
                      : isUnlocked
                      ? 'bg-[#151520] hover:bg-[#1C1C2C] text-slate-300 border-[#2A2A3E]'
                      : 'bg-[#101018] text-slate-500 border-[#1B1B26] opacity-60'
                  }`}
                >
                  <span>{lvl.name}</span>
                  {levelGraduated && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  )}
                  {!isUnlocked && (
                    <Lock className="w-3 h-3 text-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level Stats Badge */}
        <div className="hidden sm:flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-mono font-bold text-slate-400 bg-[#161622] px-2.5 py-1 border border-[#262638] flex items-center space-x-1.5">
            <Award className="w-3.5 h-3.5 text-[#E10600]" />
            <span>{selectedDriverLevel} Progress:</span>
            <strong className="text-white">{graduatedCountInLevel}/{filteredModules.length} Passed</strong>
          </span>
        </div>
      </div>

      {/* Tier 2 Header: Sleek In-Tab Module Navigation Bar */}
      <div className="bg-[#101018] border-b border-[#232332] px-4 py-2 flex items-center justify-between shrink-0 overflow-x-auto select-none z-10 space-x-4">
        <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-x-auto py-0.5">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0 mr-1 hidden md:inline">
            Modules:
          </span>

          {filteredModules.map((m) => {
            const unlocked = isModuleUnlocked(m.id);
            const graduated = isModuleGraduated(m.id);
            const isSelected = m.id === selectedModuleId;
            const completedSessions = m.sessions.filter(s => isSessionCompleted(s.id)).length;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModuleId(m.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#181824] text-white border-[#E10600] shadow-sm shadow-red-950/40 border-b-2'
                    : unlocked
                    ? 'bg-[#14141E] text-slate-300 hover:text-white hover:bg-[#1A1A28] border-[#252538]'
                    : 'bg-[#0E0E14] text-slate-500 hover:text-slate-400 border-[#1B1B26] opacity-75'
                }`}
                title={m.title}
              >
                {/* Status Indicator Icon / Number */}
                <div className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold ${
                  graduated
                    ? 'text-emerald-400'
                    : unlocked
                    ? isSelected ? 'text-[#FF5C5C]' : 'text-slate-300'
                    : 'text-slate-600'
                }`}>
                  {graduated ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : !unlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  ) : (
                    <span>{m.moduleNumber}</span>
                  )}
                </div>

                {/* Module Title */}
                <span className={`font-semibold truncate max-w-[200px] ${
                  isSelected ? 'text-white' : unlocked ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  MOD {m.moduleNumber}: {m.title}
                </span>

                {/* Completion Progress Pill */}
                <span className={`text-[10px] px-1.5 py-0.2 border ${
                  graduated
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-bold'
                    : unlocked
                    ? isSelected
                      ? 'bg-[#E10600]/20 border-[#E10600]/40 text-[#FF7575]'
                      : 'bg-[#1A1A26] border-[#2D2D40] text-slate-400'
                    : 'bg-[#12121A] border-[#1E1E2A] text-slate-600'
                }`}>
                  {graduated ? 'Certified' : `${completedSessions}/${m.sessions.length}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Module Tagline / Indicator on wide screens */}
        {activeModule && (
          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-slate-400 shrink-0">
            <span className="text-slate-500">Active:</span>
            <span className="text-slate-200 font-semibold truncate max-w-[240px]">{activeModule.title}</span>
          </div>
        )}
      </div>

      {/* Main Module Detail & Sessions Progression View (Full Width) */}
      {activeModule && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0A0A0E]">
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Module Header Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161622] to-[#12121A] border border-[#2A2A3E] relative overflow-hidden shadow-xl hud-bracket">
              <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#E10600]/10 to-transparent pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="bg-[#E10600] text-white text-[11px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                    Module {activeModule.moduleNumber} • {activeModule.driverLevel}
                  </span>
                  <h1 className="text-base sm:text-xl font-display font-black text-white tracking-wide">
                    {activeModule.title}
                  </h1>
                </div>

                {isModuleGraduated(activeModule.id) && (
                  <span className="bg-emerald-950 text-emerald-300 text-[11px] font-bold px-2.5 py-1 border border-emerald-500/40 flex items-center space-x-1.5 shrink-0 shadow-sm">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>GRADUATED & CERTIFIED</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#FF4D4D] font-semibold mt-1.5">
                {activeModule.tagline}
              </p>
              <p className="text-xs text-[#A0A0B5] mt-1 max-w-4xl leading-relaxed">
                {activeModule.description}
              </p>
            </div>

            {/* Structured Sessions Progression List */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-display font-bold uppercase tracking-wider text-slate-200">
                    Curriculum Sessions & Challenge Gates
                  </h2>
                  <p className="text-xs text-[#8E8E9F]">Pass each session challenge to unlock subsequent sessions</p>
                </div>
                <div className="text-xs font-mono text-[#E10600] bg-[#E10600]/10 px-3 py-1 border border-[#E10600]/30 font-semibold">
                  5-Stage Loop: Teach → Practice → Analyze → Adjust → Challenge
                </div>
              </div>

              <div className="space-y-3.5">
                {activeModule.sessions.map((session, sIdx) => {
                  const unlocked = isSessionUnlocked(session.id);
                  const completed = isSessionCompleted(session.id);
                  const challengeResult = progress.challengeResults[session.challenge.id];
                  const bestScore = progress.sessionBestScores[session.id];

                  return (
                    <div
                      key={session.id}
                      className={`p-4 sm:p-5 border transition-all hud-bracket ${
                        completed
                          ? 'bg-[#12121C] border-emerald-900/40 hover:border-emerald-500/40'
                          : unlocked
                          ? 'bg-[#151522] border-[#2E2E42] hover:border-[#E10600] shadow-md shadow-black/40'
                          : 'bg-[#0E0E14] border-[#1C1C28] opacity-50'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start space-x-4">
                          {/* Step Number Badge */}
                          <div className={`w-10 h-10 flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                            completed
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                              : unlocked
                              ? 'bg-gradient-to-br from-[#E10600] to-[#990400] text-white shadow-md shadow-red-950'
                              : 'bg-[#1C1C28] text-slate-500'
                          }`}>
                            {completed ? <CheckCircle2 className="w-5 h-5" /> : `0${sIdx + 1}`}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-bold text-white">{session.title}</h3>
                              {getMedalBadge(session.challenge.id)}
                            </div>
                            <p className="text-xs text-slate-400">{session.subtitle}</p>

                            {/* Drill Goal & Car Setup Badges */}
                            <div className="pt-2 flex flex-wrap gap-2 items-center">
                              <div className="flex items-center space-x-1.5 bg-[#1C1C2C] px-2.5 py-1 text-[11px] text-slate-300 border border-[#2D2D42]">
                                <Target className="w-3.5 h-3.5 text-[#E10600]" />
                                <span className="font-medium text-white">Drill:</span>
                                <span className="text-slate-300">{session.drillGoal}</span>
                              </div>

                              <div className="flex items-center space-x-1.5 bg-[#171724] px-2.5 py-1 text-[11px] text-slate-300 border border-[#262638]">
                                <Car className="w-3.5 h-3.5 text-[#00F0FF]" />
                                <span className="font-mono text-white">{session.recommendedSetup.car}</span>
                                {session.recommendedSetup.altCar && (
                                  <span className="text-slate-400 font-mono text-[10px]">(Alt: {session.recommendedSetup.altCar})</span>
                                )}
                              </div>

                              <div className={`flex items-center space-x-1.5 px-2.5 py-1 text-[11px] border font-mono ${
                                challengeResult?.passed
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                              }`}>
                                <Trophy className="w-3 h-3 text-amber-400" />
                                <span>Challenge Target:</span>
                                <span className="font-bold">{session.challenge.name} ({session.challenge.operator === 'gte' ? '≥' : '≤'} {session.challenge.targetValue} {session.challenge.unit})</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Launch Action Button */}
                        <div className="flex items-center justify-end space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1F1F2E]">
                          {completed && bestScore && (
                            <div className="text-right mr-2">
                              <span className="text-[10px] text-slate-400 block font-mono">Best Score</span>
                              <span className="text-sm font-bold font-mono text-emerald-400">{bestScore}%</span>
                            </div>
                          )}

                          {unlocked ? (
                            <button
                              type="button"
                              onClick={() => onSelectSession(activeModule, session)}
                              className="chamfer-btn flex items-center space-x-2 px-4 py-2 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold tracking-wide shadow-lg shadow-red-950/60 border border-red-400/30 transition-all active:scale-95 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>{completed ? 'Re-Enter Coaching Loop' : 'Start Session'}</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-1.5 px-3 py-2 bg-[#14141E] text-slate-500 text-xs font-mono border border-[#232332]">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Graduation Exam Card */}
            <div className={`p-5 sm:p-6 border transition-all hud-bracket ${
              isModuleGraduated(activeModule.id)
                ? 'bg-gradient-to-r from-emerald-950/30 via-[#12121C] to-[#12121C] border-emerald-500/40'
                : allSessionsInModuleCompleted
                ? 'bg-gradient-to-r from-[#201518] via-[#161622] to-[#12121A] border-[#E10600] shadow-xl shadow-red-950/30'
                : 'bg-[#0E0E14] border-[#1C1C28] opacity-60'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${
                    isModuleGraduated(activeModule.id)
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/30'
                      : allSessionsInModuleCompleted
                      ? 'bg-[#E10600] text-white shadow-lg shadow-red-900/60 animate-pulse'
                      : 'bg-[#1E1E2C] text-slate-500'
                  }`}>
                    <Trophy className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 border border-amber-400/30">
                        Graduation Test
                      </span>
                      <h3 className="text-base font-display font-bold text-white">{activeModule.graduationTest.title}</h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl">{activeModule.graduationTest.examOverview}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] font-mono text-[#8E8E9F]">
                      <span>Track: <strong className="text-slate-200">{activeModule.graduationTest.trackName}</strong></span>
                      <span>Primary Car: <strong className="text-slate-200">{activeModule.graduationTest.carName}</strong></span>
                      <span>Required: <strong className="text-slate-200">{activeModule.graduationTest.requiredLaps} Consecutive Laps</strong></span>
                      <span>Passing Grade: <strong className="text-emerald-400">≥ {activeModule.graduationTest.passingScorePct}% (Silver)</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 md:pt-0 flex justify-end">
                  {isModuleGraduated(activeModule.id) ? (
                    <button
                      type="button"
                      onClick={() => onStartGraduationTest(activeModule)}
                      className="chamfer-btn flex items-center space-x-2 px-4 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-racing font-bold border border-emerald-500/50 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Retake Graduation Exam</span>
                    </button>
                  ) : allSessionsInModuleCompleted ? (
                    <button
                      type="button"
                      onClick={() => onStartGraduationTest(activeModule)}
                      className="chamfer-btn flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#E10600] to-[#B30400] hover:from-[#FF1801] hover:to-[#E10600] text-white text-xs font-racing font-bold tracking-wide shadow-xl shadow-red-900/60 border border-red-400/40 active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Take Graduation Exam</span>
                    </button>
                  ) : (
                    <div className="text-right">
                      <div className="flex items-center space-x-1.5 px-3 py-2 bg-[#14141E] text-slate-500 text-xs font-mono border border-[#232332]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Complete All Sessions First</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



