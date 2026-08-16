import React, { useState } from 'react';
import { Module, UserProgressState, GraduationResult } from '../../types/curriculum';
import { LapAnalysis } from '../../types/telemetry';
import { evaluateGraduationTest } from '../../engine/physicsEngine';
import { loadLapHistory } from '../../db/storage';
import confetti from 'canvas-confetti';
import { X, Trophy, Award, CheckCircle2, AlertCircle, Play, Sparkles, ArrowRight, Radio, Info } from 'lucide-react';

interface GraduationExamModalProps {
  module: Module;
  nextModule: Module | null;
  progress: UserProgressState;
  onClose: () => void;
  onGraduationPassed: (result: GraduationResult, nextModuleId: string | null, firstSessionOfNextId: string | null) => void;
}

export const GraduationExamModal: React.FC<GraduationExamModalProps> = ({
  module,
  nextModule,
  progress,
  onClose,
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0E0E16] w-full max-w-4xl rounded-3xl border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-[#232332] bg-gradient-to-r from-[#18141F] to-[#12121A] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-display font-black shadow-lg shadow-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Academy Graduation Exam • Module {module.moduleNumber}
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide">{test.title}</h2>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-[#1A1A26] text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Exam Requirements Card */}
          <div className="p-5 rounded-2xl bg-[#14141E] border border-[#242436] space-y-3">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">Exam Overview & Circuit Specifications</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{test.examOverview}</p>

            <div className="grid grid-cols-3 gap-3 pt-2 font-mono text-xs">
              <div className="bg-[#101018] p-3 rounded-xl border border-[#222234]">
                <span className="text-[10px] text-slate-400 block">Designated Track</span>
                <strong className="text-white">{test.trackName}</strong>
              </div>
              <div className="bg-[#101018] p-3 rounded-xl border border-[#222234]">
                <span className="text-[10px] text-slate-400 block">Required Benchmark</span>
                <strong className="text-amber-300">{test.requiredLaps} Consecutive Laps</strong>
              </div>
              <div className="bg-[#101018] p-3 rounded-xl border border-[#222234]">
                <span className="text-[10px] text-slate-400 block">Passing Mastery Grade</span>
                <strong className="text-emerald-400">≥ {test.passingScorePct}%</strong>
              </div>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Evaluation Criteria</h4>
            {test.requirements.map((req, rIdx) => (
              <div key={rIdx} className="p-3.5 rounded-xl bg-[#12121A] border border-[#20202E] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{req.title}</span>
                  <span className="text-[11px] text-slate-400">{req.description}</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/30">
                  {req.targetText}
                </span>
              </div>
            ))}
          </div>

          {/* Exam Result Status */}
          {gradResult && (
            <div className={`p-5 rounded-2xl border ${
              gradResult.passed
                ? 'bg-gradient-to-r from-emerald-950/50 to-[#121814] border-emerald-500/50 text-emerald-200 shadow-xl'
                : 'bg-gradient-to-r from-red-950/50 to-[#181214] border-red-500/50 text-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                {gradResult.passed ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <AlertCircle className="w-8 h-8 text-red-400" />}
                <div>
                  <h3 className="text-base font-bold text-white">
                    {gradResult.passed ? 'CONGRATULATIONS! MODULE GRADUATION PASSED' : 'GRADUATION ATTEMPT FAILED'}
                  </h3>
                  <p className="text-xs mt-0.5">
                    Achieved an overall score of <strong className="font-mono text-sm">{gradResult.scorePct}%</strong> (Passing benchmark: ≥ {test.passingScorePct}%).
                  </p>
                </div>
              </div>

              {gradResult.passed && nextModule && (
                <div className="mt-4 pt-3 border-t border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-300">
                    Unlocked Next Chapter: <strong>Module {nextModule.moduleNumber}: {nextModule.title}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#232332] bg-[#12121A] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span>Recorded Laps Available:</span>
            <strong className={historyLaps.length >= test.requiredLaps ? 'text-emerald-400' : 'text-amber-400'}>
              {historyLaps.length} / {test.requiredLaps}
            </strong>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="text-xs text-slate-400 hover:text-white font-medium px-3 py-2">
              Close
            </button>

            <button
              onClick={handleRunExam}
              disabled={isEvaluating || historyLaps.length < test.requiredLaps}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                historyLaps.length >= test.requiredLaps
                  ? 'bg-gradient-to-r from-amber-500 to-[#E10600] hover:from-amber-400 hover:to-[#FF1801] text-white shadow-xl shadow-red-950/60 active:scale-95 cursor-pointer'
                  : 'bg-[#1C1C28] text-slate-500 border border-[#2A2A3C] cursor-not-allowed shadow-none'
              }`}
              title={historyLaps.length >= test.requiredLaps ? 'Evaluate exam' : `Drive ${test.requiredLaps} laps in Forza with UDP enabled`}
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
