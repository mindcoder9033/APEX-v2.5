import React, { useState } from 'react';
import { Module, UserProgressState, GraduationResult } from '../../types/curriculum';
import { LapAnalysis } from '../../types/telemetry';
import { evaluateGraduationTest } from '../../engine/physicsEngine';
import { loadLapHistory } from '../../db/storage';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, Trophy, Award, CheckCircle2, AlertCircle, Play, Sparkles, ArrowRight, Radio, Info,
  Car, MapPin, Flag, Sun, CloudRain, RotateCw
} from 'lucide-react';

interface GraduationExamViewProps {
  module: Module;
  nextModule: Module | null;
  progress: UserProgressState;
  onBack: () => void;
  onGraduationPassed: (result: GraduationResult, nextModuleId: string | null, firstSessionOfNextId: string | null) => void;
}

export const GraduationExamView: React.FC<GraduationExamViewProps> = ({
  module,
  nextModule,
  progress,
  onBack,
  onGraduationPassed
}) => {
  const test = module.graduationTest;
  const historyLaps = loadLapHistory();
  const [examLaps, setExamLaps] = useState<LapAnalysis[]>(historyLaps.slice(0, test.requiredLaps));
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [gradResult, setGradResult] = useState<GraduationResult | null>(
    progress.graduationResults[test.id] || null
  );

  const handleRunExam = () => {
    if (historyLaps.length < test.requiredLaps) return;
    setIsEvaluating(true);

    setTimeout(() => {
      const qualifyingLaps = historyLaps.slice(0, test.requiredLaps);
      setExamLaps(qualifyingLaps);

      const result = evaluateGraduationTest(test, qualifyingLaps);
      setGradResult(result);
      setIsEvaluating(false);

      if (result.passed) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 }
        });

        const firstNextSessionId = nextModule?.sessions[0]?.id || null;
        onGraduationPassed(result, nextModule?.id || null, firstNextSessionId);
      }
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0E] overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="px-6 py-4 border-b border-[#232332] bg-[#0E0E14] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#181824] hover:bg-[#222232] text-slate-300 hover:text-white border border-[#2B2B3E] transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Curriculum Modules</span>
          </button>

          <div className="h-5 w-[1px] bg-[#2A2A3C]" />

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-400 text-black flex items-center justify-center font-display font-black text-xs shadow-md shadow-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Academy Graduation Exam • Module {module.moduleNumber}
              </span>
              <h1 className="text-sm font-bold text-white tracking-wide">{test.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {progress.graduatedModuleIds.includes(module.id) && (
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Module Certified</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0A0A0E]">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Exam Requirements Card */}
          <div className="p-6 bg-[#14141E] border border-[#262638] space-y-4 shadow-xl hud-bracket">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Exam Overview & Circuit Specifications</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{test.examOverview}</p>

            {/* Recommended Setup Grid */}
            {test.recommendedSetup && (
              <div className="pt-2">
                <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Required Event Configuration</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#0F0F17] border border-[#20202E] flex items-start space-x-3">
                    <div className="p-2 bg-red-950/40 text-[#E10600]">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Car</span>
                      <strong className="text-xs text-white font-semibold truncate block" title={test.recommendedSetup.car}>
                        {test.recommendedSetup.car}
                      </strong>
                      {test.recommendedSetup.altCar && (
                        <span className="text-[10px] text-slate-400 font-mono block truncate" title={test.recommendedSetup.altCar}>
                          Alt: {test.recommendedSetup.altCar}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-[#0F0F17] border border-[#20202E] flex items-start space-x-3">
                    <div className="p-2 bg-cyan-950/40 text-[#00F0FF]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Track</span>
                      <strong className="text-xs text-white font-semibold truncate block" title={test.recommendedSetup.track}>
                        {test.recommendedSetup.track}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0F0F17] border border-[#20202E] flex items-start space-x-3">
                    <div className="p-2 bg-purple-950/40 text-purple-400">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Game Type</span>
                      <strong className="text-xs text-white font-semibold block">
                        {test.recommendedSetup.gameType}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0F0F17] border border-[#20202E] flex items-start space-x-3">
                    <div className="p-2 bg-amber-950/40 text-amber-400">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Time</span>
                      <strong className="text-xs text-white font-semibold block">
                        {test.recommendedSetup.timeOfDay}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0F0F17] border border-[#20202E] flex items-start space-x-3">
                    <div className="p-2 bg-blue-950/40 text-blue-400">
                      <CloudRain className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Weather</span>
                      <strong className="text-xs text-white font-semibold block">
                        {test.recommendedSetup.weather}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0F0F17] border border-[#20202E] flex items-start space-x-3">
                    <div className="p-2 bg-emerald-950/40 text-emerald-400">
                      <RotateCw className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Laps & Grid</span>
                      <strong className="text-xs text-white font-semibold block">
                        {test.recommendedSetup.laps} Laps • {test.recommendedSetup.drivatars === 0 ? 'Solo' : `${test.recommendedSetup.drivatars} Drivatars`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
              <div className="bg-[#101018] p-3 border border-[#222234]">
                <span className="text-[10px] text-slate-400 block">Required Benchmark</span>
                <strong className="text-amber-300 text-sm">{test.requiredLaps} Consecutive Laps</strong>
              </div>
              <div className="bg-[#101018] p-3 border border-[#222234]">
                <span className="text-[10px] text-slate-400 block">Passing Mastery Grade</span>
                <strong className="text-emerald-400 text-sm">≥ {test.passingScorePct}%</strong>
              </div>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Evaluation Criteria</h3>
            {test.requirements.map((req, rIdx) => (
              <div key={rIdx} className="p-4 bg-[#12121A] border border-[#20202E] flex items-center justify-between shadow-md hud-bracket">
                <div>
                  <span className="text-xs font-bold text-white block">{req.title}</span>
                  <span className="text-[11px] text-slate-400 font-sans">{req.description}</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-3 py-1 border border-amber-400/30">
                  {req.targetText}
                </span>
              </div>
            ))}
          </div>

          {/* Exam Result Status */}
          {gradResult && (
            <div className={`p-6 border hud-bracket ${
              gradResult.passed
                ? 'bg-gradient-to-r from-emerald-950/50 to-[#121814] border-emerald-500/50 text-emerald-200 shadow-xl'
                : 'bg-gradient-to-r from-red-950/50 to-[#181214] border-red-500/50 text-red-200'
            }`}>
              <div className="flex items-center space-x-4">
                {gradResult.passed ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <AlertCircle className="w-8 h-8 text-red-400" />}
                <div>
                  <h3 className="text-base font-bold text-white font-racing">
                    {gradResult.passed ? 'CONGRATULATIONS! MODULE GRADUATION PASSED' : 'GRADUATION ATTEMPT FAILED'}
                  </h3>
                  <p className="text-xs mt-0.5 font-sans">
                    Achieved an overall score of <strong className="font-mono text-sm">{gradResult.scorePct}%</strong> (Passing benchmark: ≥ {test.passingScorePct}%).
                  </p>
                </div>
              </div>

              {gradResult.passed && module.id === 'mod-4' && (
                <div className="mt-4 p-3 bg-amber-950/40 border border-amber-500/50 flex items-center space-x-3">
                  <Award className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <strong className="text-xs font-bold text-amber-300 block font-racing">APEX BEGINNER DRIVER LICENSE CERTIFIED!</strong>
                    <span className="text-[11px] text-slate-300 font-sans">You have graduated the entire Beginner Driver Level. Novice Driver Level (Trail-Braking & Weight Transfer) is now unlocked!</span>
                  </div>
                </div>
              )}

              {gradResult.passed && nextModule && (
                <div className="mt-4 pt-3 border-t border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-300 font-sans">
                    Unlocked Next Chapter: <strong>Module {nextModule.moduleNumber}: {nextModule.title}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="p-5 bg-[#12121A] border border-[#232332] flex items-center justify-between shadow-xl hud-bracket">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span>Recorded Laps Available in Telemetry History:</span>
              <strong className={historyLaps.length >= test.requiredLaps ? 'text-emerald-400' : 'text-amber-400'}>
                {historyLaps.length} / {test.requiredLaps}
              </strong>
            </div>

            <button
              onClick={handleRunExam}
              disabled={isEvaluating || historyLaps.length < test.requiredLaps}
              className={`chamfer-btn flex items-center space-x-2 px-6 py-3 text-xs font-racing font-bold tracking-wide transition-all ${
                historyLaps.length >= test.requiredLaps
                  ? 'bg-gradient-to-r from-amber-500 to-[#E10600] hover:from-amber-400 hover:to-[#FF1801] text-white shadow-xl shadow-red-950/60 active:scale-95 cursor-pointer'
                  : 'bg-[#1C1C28] text-slate-500 border border-[#2A2A3C] cursor-not-allowed shadow-none'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>{isEvaluating ? 'Evaluating Exam Telemetry...' : 'Evaluate Real Stint Telemetry'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
