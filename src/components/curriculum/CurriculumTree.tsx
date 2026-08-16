import React, { useState } from 'react';
import { Module, Session, UserProgressState } from '../../types/curriculum';
import { 
  Lock, CheckCircle2, ChevronRight, Award, Trophy, Play, 
  BookOpen, Target, Sparkles, Activity, AlertCircle 
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
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || 'mod-1');

  const activeModule = modules.find(m => m.id === selectedModuleId) || modules[0];
  const isModuleUnlocked = (modId: string) => progress.unlockedModuleIds.includes(modId);
  const isModuleGraduated = (modId: string) => progress.graduatedModuleIds.includes(modId);
  const isSessionUnlocked = (sessId: string) => progress.unlockedSessionIds.includes(sessId);
  const isSessionCompleted = (sessId: string) => progress.completedSessionIds.includes(sessId);

  // Check if all sessions in active module are completed to enable graduation test
  const allSessionsInModuleCompleted = activeModule.sessions.every(s => isSessionCompleted(s.id));

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0A0A0E]">
      {/* Left Module Sidebar List */}
      <div className="w-80 border-r border-[#232332] bg-[#0E0E14] flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-[#232332]">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm tracking-wide text-white uppercase flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#E10600]" />
              <span>Skip Barber Chapters</span>
            </h2>
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-[#161622] px-2 py-0.5 rounded border border-[#262638]">
              {progress.graduatedModuleIds.length}/{modules.length} Passed
            </span>
          </div>
          <p className="text-[11px] text-[#8E8E9F] mt-1">Complete sessions & challenges to advance</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {modules.map((m) => {
            const unlocked = isModuleUnlocked(m.id);
            const graduated = isModuleGraduated(m.id);
            const isSelected = m.id === selectedModuleId;
            const completedSessions = m.sessions.filter(s => isSessionCompleted(s.id)).length;

            return (
              <button
                key={m.id}
                onClick={() => setSelectedModuleId(m.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#181824] border-[#E10600] shadow-lg shadow-red-950/20'
                    : unlocked
                    ? 'bg-[#12121A] border-[#222230] hover:bg-[#161622] hover:border-[#2D2D40]'
                    : 'bg-[#0E0E14]/60 border-[#1A1A26] opacity-60'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E10600]" />
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                      graduated
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : unlocked
                        ? isSelected ? 'bg-[#E10600] text-white' : 'bg-[#222232] text-slate-300'
                        : 'bg-[#181822] text-slate-500'
                    }`}>
                      {graduated ? <CheckCircle2 className="w-3.5 h-3.5" /> : m.moduleNumber}
                    </div>
                    <div>
                      <h3 className={`text-xs font-bold truncate max-w-[160px] ${
                        isSelected ? 'text-white' : unlocked ? 'text-slate-200' : 'text-slate-500'
                      }`}>
                        {m.title}
                      </h3>
                      <p className="text-[10px] text-[#7E7E92] truncate max-w-[160px]">{m.bookChapter}</p>
                    </div>
                  </div>

                  <div>
                    {!unlocked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    ) : graduated ? (
                      <Trophy className="w-4 h-4 text-amber-400" />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        {completedSessions}/{m.sessions.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar inside module card */}
                {unlocked && (
                  <div className="mt-2.5 w-full bg-[#1F1F2E] h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        graduated ? 'bg-emerald-400' : 'bg-[#E10600]'
                      }`}
                      style={{ width: `${(completedSessions / m.sessions.length) * 100}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Module Detail & Sessions Progression View */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col space-y-6">
        {/* Module Header Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#161622] to-[#12121A] border border-[#2A2A3E] relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-[#E10600]/10 to-transparent pointer-events-none" />

          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-[#E10600] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Module {activeModule.moduleNumber}
            </span>
            <span className="text-xs text-[#8E8E9F] font-mono">{activeModule.bookChapter}</span>
            {isModuleGraduated(activeModule.id) && (
              <span className="bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center space-x-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>GRADUATED & CERTIFIED</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-display font-black text-white tracking-wide">{activeModule.title}</h1>
          <p className="text-sm text-[#FF4D4D] font-medium mt-0.5">{activeModule.tagline}</p>
          <p className="text-xs text-[#A0A0B5] mt-3 max-w-3xl leading-relaxed">{activeModule.description}</p>
        </div>

        {/* Structured Sessions Progression List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-display font-bold uppercase tracking-wider text-slate-200">
                Curriculum Sessions & Challenge Gates
              </h2>
              <p className="text-xs text-[#8E8E9F]">Pass each session challenge to unlock subsequent sessions</p>
            </div>
            <div className="text-xs font-mono text-[#E10600] bg-[#E10600]/10 px-3 py-1 rounded-lg border border-[#E10600]/30 font-semibold">
              5-Stage Loop: Teach → Practice → Analyze → Adjust → Challenge
            </div>
          </div>

          <div className="space-y-4">
            {activeModule.sessions.map((session, sIdx) => {
              const unlocked = isSessionUnlocked(session.id);
              const completed = isSessionCompleted(session.id);
              const challengeResult = progress.challengeResults[session.challenge.id];
              const bestScore = progress.sessionBestScores[session.id];

              return (
                <div
                  key={session.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    completed
                      ? 'bg-[#12121C] border-emerald-900/40 hover:border-emerald-500/40'
                      : unlocked
                      ? 'bg-[#151522] border-[#2E2E42] hover:border-[#E10600] shadow-md shadow-black/40'
                      : 'bg-[#0E0E14] border-[#1C1C28] opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Step Number Badge */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 ${
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
                          <span className="text-[10px] font-mono text-[#8E8E9F] bg-[#1E1E2C] px-2 py-0.5 rounded">
                            {session.bookReference}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{session.subtitle}</p>

                        {/* Drill Goal & Challenge Preview */}
                        <div className="pt-2 flex flex-wrap gap-2 items-center">
                          <div className="flex items-center space-x-1.5 bg-[#1C1C2C] px-2.5 py-1 rounded-md text-[11px] text-slate-300 border border-[#2D2D42]">
                            <Target className="w-3.5 h-3.5 text-[#E10600]" />
                            <span className="font-medium text-white">Drill:</span>
                            <span className="text-slate-300">{session.drillGoal}</span>
                          </div>

                          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] border font-mono ${
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
                    <div className="flex items-center space-x-3 shrink-0">
                      {completed && bestScore && (
                        <div className="text-right mr-2">
                          <span className="text-[10px] text-slate-400 block font-mono">Best Score</span>
                          <span className="text-sm font-bold font-mono text-emerald-400">{bestScore}%</span>
                        </div>
                      )}

                      {unlocked ? (
                        <button
                          onClick={() => onSelectSession(activeModule, session)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-lg shadow-red-950/60 border border-red-400/30 transition-all active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{completed ? 'Re-Enter Coaching Loop' : 'Start Session'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#14141E] text-slate-500 text-xs font-mono border border-[#232332]">
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
        <div className={`p-6 rounded-2xl border transition-all ${
          isModuleGraduated(activeModule.id)
            ? 'bg-gradient-to-r from-emerald-950/30 via-[#12121C] to-[#12121C] border-emerald-500/40'
            : allSessionsInModuleCompleted
            ? 'bg-gradient-to-r from-[#201518] via-[#161622] to-[#12121A] border-[#E10600] shadow-xl shadow-red-950/30'
            : 'bg-[#0E0E14] border-[#1C1C28] opacity-60'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
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
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    Graduation Test
                  </span>
                  <h3 className="text-base font-display font-bold text-white">{activeModule.graduationTest.title}</h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">{activeModule.graduationTest.examOverview}</p>
                <div className="flex items-center space-x-4 mt-2 text-[11px] font-mono text-[#8E8E9F]">
                  <span>Track: <strong className="text-slate-200">{activeModule.graduationTest.trackName}</strong></span>
                  <span>Required: <strong className="text-slate-200">{activeModule.graduationTest.requiredLaps} Consecutive Laps</strong></span>
                  <span>Passing Grade: <strong className="text-emerald-400">≥ {activeModule.graduationTest.passingScorePct}%</strong></span>
                </div>
              </div>
            </div>

            <div>
              {isModuleGraduated(activeModule.id) ? (
                <button
                  onClick={() => onStartGraduationTest(activeModule)}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-500/50"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Retake Graduation Exam</span>
                </button>
              ) : allSessionsInModuleCompleted ? (
                <button
                  onClick={() => onStartGraduationTest(activeModule)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E10600] to-[#B30400] hover:from-[#FF1801] hover:to-[#E10600] text-white text-xs font-bold shadow-xl shadow-red-900/60 border border-red-400/40 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Take Graduation Exam</span>
                </button>
              ) : (
                <div className="text-right">
                  <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#14141E] text-slate-500 text-xs font-mono border border-[#232332]">
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
  );
};
