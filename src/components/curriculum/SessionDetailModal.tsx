import React, { useState } from 'react';
import { Module, Session, UserProgressState, ChallengeResult } from '../../types/curriculum';
import { LapAnalysis, TelemetryFrame } from '../../types/telemetry';
import { evaluateSessionChallenge } from '../../engine/physicsEngine';
import { analyzeLapTelemetry } from '../../engine/physicsEngine';
import { TelemetryTraces } from '../telemetry/TelemetryTraces';
import { FrictionCirclePlot } from '../telemetry/FrictionCirclePlot';
import { TrackMapViewer } from '../telemetry/TrackMapViewer';
import { DiagnosticScorecard } from '../debrief/DiagnosticScorecard';
import { ActionPlanCard } from '../adjust/ActionPlanCard';
import confetti from 'canvas-confetti';
import { 
  X, BookOpen, Play, CheckCircle2, AlertCircle, Trophy, 
  ArrowRight, Activity, Target, Zap, ShieldCheck, RefreshCw, Radio, Info,
  Car, MapPin, Flag, Sun, CloudRain, RotateCw, Users
} from 'lucide-react';

interface SessionDetailModalProps {
  module: Module;
  session: Session;
  progress: UserProgressState;
  onClose: () => void;
  onChallengePassed: (result: ChallengeResult, nextSessionId: string | null) => void;
  onSaveLap: (lap: LapAnalysis) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  module,
  session,
  progress,
  onClose,
  onChallengePassed,
  onSaveLap
}) => {
  const [activeStage, setActiveStage] = useState<'teach' | 'practice' | 'analyze' | 'adjust' | 'challenge'>('teach');
  const [cursorDist, setCursorDist] = useState<number>(850);
  const [sessionLaps, setSessionLaps] = useState<LapAnalysis[]>([]);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(
    progress.challengeResults[session.challenge.id] || null
  );

  const currentLap = sessionLaps.length > 0 ? sessionLaps[sessionLaps.length - 1] : null;
  const closestFrame = currentLap?.frames.find(f => Math.abs(f.distance - cursorDist) < 15) || currentLap?.frames[0] || null;

  const handleEvaluateChallenge = () => {
    const result = evaluateSessionChallenge(session.challenge, sessionLaps);
    setChallengeResult(result);

    if (result.passed) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Find next session in module
      const currentIdx = module.sessions.findIndex(s => s.id === session.id);
      const nextSession = module.sessions[currentIdx + 1] || null;

      onChallengePassed(result, nextSession ? nextSession.id : null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0E0E16] w-full max-w-6xl h-[90vh] rounded-3xl border border-[#2B2B3E] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#232332] bg-[#12121A] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E10600] flex items-center justify-center font-display font-black text-white text-sm shadow-md shadow-red-950">
              {module.moduleNumber}.{session.sessionNumber}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold text-[#E10600] uppercase tracking-wider">
                  Module {module.moduleNumber}: {module.title}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-[#8E8E9F] font-mono">{session.bookReference}</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-wide">{session.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1A1A26] text-slate-400 hover:text-white hover:bg-[#252538] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Stage Coaching Loop Tab Bar */}
        <div className="px-6 py-2 bg-[#101018] border-b border-[#20202E] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1">
            {[
              { key: 'teach', label: '1. Teach (Target)', icon: BookOpen },
              { key: 'practice', label: '2. Practice (Ingest)', icon: Play },
              { key: 'analyze', label: '3. Analyze (Debrief)', icon: Activity },
              { key: 'adjust', label: '4. Adjust (Plan)', icon: Zap },
              { key: 'challenge', label: '5. Challenge (Pass/Unlock)', icon: Trophy },
            ].map((stage) => {
              const Icon = stage.icon;
              const isActive = activeStage === stage.key;
              return (
                <button
                  key={stage.key}
                  onClick={() => setActiveStage(stage.key as any)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#E10600] text-white shadow-md shadow-red-950/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#181824]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{stage.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-[#8E8E9F]">
            Laps in Stint: <strong className="text-white">{sessionLaps.length}</strong>
          </div>
        </div>

        {/* Stage Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0A0A0E]">
          {/* STAGE 1: TEACH */}
          {activeStage === 'teach' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-[#14141E] border border-[#262638] space-y-4">
                <div className="flex items-center space-x-2 text-[#E10600] text-xs font-mono font-bold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>Skip Barber Theoretical Foundation</span>
                </div>
                <h3 className="text-lg font-bold text-white">{session.subtitle}</h3>

                <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
                  {session.theorySummary.map((para, pIdx) => (
                    <p key={pIdx} className="bg-[#101018] p-3 rounded-xl border border-[#1E1E2C]">{para}</p>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {session.keyPrinciples.map((kp, kpIdx) => (
                    <div key={kpIdx} className="p-3.5 rounded-xl bg-[#181826] border border-[#2D2D40]">
                      <h4 className="text-xs font-bold text-[#FF4D4D]">{kp.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">{kp.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Metrics */}
              <div className="p-6 rounded-2xl bg-[#14141E] border border-[#262638] space-y-4">
                <div className="flex items-center space-x-2 text-white text-xs font-mono font-bold uppercase tracking-wider">
                  <Target className="w-4 h-4 text-[#00F0FF]" />
                  <span>Telemetric Target Criteria</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {session.targetMetrics.map((tm, tmIdx) => (
                    <div key={tmIdx} className="p-4 rounded-xl bg-[#101018] border border-[#222234] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">{tm.label}</span>
                        <span className="text-[11px] text-[#8E8E9F]">{tm.hint}</span>
                      </div>
                      <span className="text-base font-mono font-bold text-emerald-400">{tm.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveStage('practice')}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-lg shadow-red-950/60 transition-all"
                >
                  <span>Proceed to Practice & Ingest</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: PRACTICE */}
          {activeStage === 'practice' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Recommended Forza Event Setup Briefing */}
              {session.recommendedSetup && (
                <div className="p-6 rounded-2xl bg-[#14141E] border border-[#262638] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[#00F0FF] text-xs font-mono font-bold uppercase tracking-wider">
                      <Flag className="w-4 h-4 text-[#00F0FF]" />
                      <span>Recommended Forza Motorsport Event Setup</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-[#1A1A28] px-2 py-0.5 rounded-full border border-[#2A2A3E]">
                      Free Play / Test Drive Setup
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Car */}
                    <div className="p-3.5 rounded-xl bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-red-950/40 text-[#E10600] border border-red-900/30">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Car Model</span>
                        <strong className="text-xs text-white font-semibold truncate block" title={session.recommendedSetup.car}>
                          {session.recommendedSetup.car}
                        </strong>
                      </div>
                    </div>

                    {/* Track */}
                    <div className="p-3.5 rounded-xl bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-cyan-950/40 text-[#00F0FF] border border-cyan-900/30">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Track & Layout</span>
                        <strong className="text-xs text-white font-semibold truncate block" title={session.recommendedSetup.track}>
                          {session.recommendedSetup.track}
                        </strong>
                      </div>
                    </div>

                    {/* Game Type */}
                    <div className="p-3.5 rounded-xl bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-purple-950/40 text-purple-400 border border-purple-900/30">
                        <Flag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Game Type</span>
                        <strong className="text-xs text-white font-semibold block">
                          {session.recommendedSetup.gameType}
                        </strong>
                      </div>
                    </div>

                    {/* Time of Day */}
                    <div className="p-3.5 rounded-xl bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-900/30">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Time of Day</span>
                        <strong className="text-xs text-white font-semibold block">
                          {session.recommendedSetup.timeOfDay}
                        </strong>
                      </div>
                    </div>

                    {/* Weather */}
                    <div className="p-3.5 rounded-xl bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-900/30">
                        <CloudRain className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Weather</span>
                        <strong className="text-xs text-white font-semibold block">
                          {session.recommendedSetup.weather}
                        </strong>
                      </div>
                    </div>

                    {/* Laps & Drivatars */}
                    <div className="p-3.5 rounded-xl bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
                        <RotateCw className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Stint Laps & Field</span>
                        <strong className="text-xs text-white font-semibold block">
                          {session.recommendedSetup.laps} Laps • {session.recommendedSetup.drivatars === 0 ? 'Solo' : `${session.recommendedSetup.drivatars} Drivatars`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {session.recommendedSetup.notes && (
                    <div className="p-3 rounded-xl bg-[#101018] border border-[#222232] text-xs text-slate-300 flex items-start space-x-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{session.recommendedSetup.notes}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-6 rounded-2xl bg-[#14141E] border border-[#262638] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#00FF66] text-xs font-mono font-bold uppercase tracking-wider">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Live 60Hz Telemetry Ingest & Stint Practice</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Listening on UDP 0.0.0.0:5300</span>
                </div>

                <div className="p-5 rounded-xl bg-[#0D0D14] border border-[#1E1E2C] space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-sm font-bold text-white">Live Telemetry Ingestion Active</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Start Forza Motorsport on your PC or Xbox with telemetry forwarding enabled to <code className="bg-[#1A1A28] px-1.5 py-0.5 rounded text-[#00F0FF]">127.0.0.1:5300</code>. Drive your practice laps; APEX automatically segments laps and logs 60Hz physics in the background.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#101018] border border-[#222232] space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Session Practice Directive</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Focus on executing the technique taught in Stage 1: <strong className="text-white">{session.title}</strong>. Complete consecutive laps with the recommended car/track to populate live analytical scoring.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: ANALYZE */}
          {activeStage === 'analyze' && (
            <div className="space-y-6">
              {currentLap ? (
                <>
                  {/* Summary Stats Strip */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="bg-[#14141E] p-3 rounded-xl border border-[#232332]">
                      <span className="text-[10px] text-slate-400 font-mono block">Lap Time</span>
                      <strong className="text-base font-mono font-bold text-white">{currentLap.lapTimeSec.toFixed(2)}s</strong>
                    </div>
                    <div className="bg-[#14141E] p-3 rounded-xl border border-[#232332]">
                      <span className="text-[10px] text-slate-400 font-mono block">Top Speed</span>
                      <strong className="text-base font-mono font-bold text-[#00F0FF]">{currentLap.maxSpeedKph} km/h</strong>
                    </div>
                    <div className="bg-[#14141E] p-3 rounded-xl border border-[#232332]">
                      <span className="text-[10px] text-slate-400 font-mono block">Traction Budget</span>
                      <strong className="text-base font-mono font-bold text-emerald-400">{currentLap.avgTractionBudgetPct}%</strong>
                    </div>
                    <div className="bg-[#14141E] p-3 rounded-xl border border-[#232332]">
                      <span className="text-[10px] text-slate-400 font-mono block">Peak Lat G</span>
                      <strong className="text-base font-mono font-bold text-purple-400">{currentLap.peakLatG}G</strong>
                    </div>
                    <div className="bg-[#14141E] p-3 rounded-xl border border-[#232332]">
                      <span className="text-[10px] text-slate-400 font-mono block">Peak Braking G</span>
                      <strong className="text-base font-mono font-bold text-[#FF1801]">{currentLap.peakBrakingG}G</strong>
                    </div>
                    <div className="bg-[#14141E] p-3 rounded-xl border border-[#232332]">
                      <span className="text-[10px] text-slate-400 font-mono block">Overall Lap Grade</span>
                      <strong className="text-base font-mono font-bold text-amber-400">{currentLap.overallScore}%</strong>
                    </div>
                  </div>

                  {/* Synchronized Telemetry Traces */}
                  <TelemetryTraces
                    frames={currentLap.frames}
                    cursorDistance={cursorDist}
                    onCursorChange={setCursorDist}
                    height={260}
                  />

                  {/* G-G Friction Circle & Circuit Map Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FrictionCirclePlot frames={currentLap.frames} currentFrame={closestFrame} />
                    <TrackMapViewer frames={currentLap.frames} currentDistance={cursorDist} />
                  </div>

                  {/* Turn-by-Turn Scorecard */}
                  <DiagnosticScorecard corners={currentLap.corners} onFocusCorner={setCursorDist} />
                </>
              ) : (
                <div className="p-8 rounded-2xl bg-[#14141E] border border-[#232332] text-center space-y-3">
                  <Radio className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                  <h3 className="text-base font-bold text-white">No Practice Laps Recorded Yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Drive a stint in Forza Motorsport with UDP output enabled to generate telemetry traces and turn diagnostics.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STAGE 4: ADJUST */}
          {activeStage === 'adjust' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <ActionPlanCard
                actionItems={currentLap?.actionItems || [
                  'Practice progressive brake pressure ramp-up before corner entry.',
                  'Smoothly trail off brake pressure to prevent front-tire overload at turn-in.',
                  'Synchronize steering unwinding with throttle application out of corner exit.'
                ]}
                onStartNewStint={() => setActiveStage('practice')}
              />
            </div>
          )}

          {/* STAGE 5: CHALLENGE */}
          {activeStage === 'challenge' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1A1520] via-[#12121A] to-[#0E0E14] border border-amber-500/40 shadow-2xl space-y-4">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Trophy className="w-5 h-5" />
                  <span>Session Challenge Gate</span>
                </div>

                <h3 className="text-xl font-display font-bold text-white">{session.challenge.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{session.challenge.description}</p>

                <div className="p-4 rounded-xl bg-[#14141E] border border-[#242436] flex items-center justify-between font-mono">
                  <div>
                    <span className="text-xs text-slate-400 block">Required Target</span>
                    <strong className="text-sm text-white">
                      {session.challenge.operator === 'gte' ? '≥' : '≤'} {session.challenge.targetValue} {session.challenge.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Consecutive Laps</span>
                    <strong className="text-sm text-amber-300">{session.challenge.requiredLaps} Laps</strong>
                  </div>
                </div>

                {/* Challenge Result Status */}
                {challengeResult && (
                  <div className={`p-4 rounded-xl border ${
                    challengeResult.passed
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/40 border-red-500/50 text-red-300'
                  }`}>
                    <div className="flex items-center space-x-2 font-bold text-sm">
                      {challengeResult.passed ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span>{challengeResult.passed ? 'CHALLENGE PASSED!' : 'CHALLENGE ATTEMPT FAILED'}</span>
                    </div>
                    <p className="text-xs mt-1 text-slate-200">{challengeResult.notes}</p>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-400">
                    Recorded Laps in Stint: <strong className="text-white">{sessionLaps.length}</strong>
                  </span>

                  <button
                    onClick={handleEvaluateChallenge}
                    disabled={sessionLaps.length === 0}
                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      sessionLaps.length > 0
                        ? 'bg-gradient-to-r from-amber-500 to-[#E10600] hover:from-amber-400 hover:to-[#FF1801] text-white shadow-xl shadow-red-950/60 active:scale-95 cursor-pointer'
                        : 'bg-[#1C1C28] text-slate-500 border border-[#2A2A3C] cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Evaluate Challenge from Stint Telemetry</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
