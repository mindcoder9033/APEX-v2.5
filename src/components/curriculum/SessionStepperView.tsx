import React, { useState, useEffect, useRef } from 'react';
import { Module, Session, UserProgressState, ChallengeResult } from '../../types/curriculum';
import { LapAnalysis, TelemetryFrame } from '../../types/telemetry';
import { evaluateSessionChallenge, analyzeLapTelemetry } from '../../engine/physicsEngine';
import { TelemetryTraces } from '../telemetry/TelemetryTraces';
import { FrictionCirclePlot } from '../telemetry/FrictionCirclePlot';
import { TrackMapViewer } from '../telemetry/TrackMapViewer';
import { DiagnosticScorecard } from '../debrief/DiagnosticScorecard';
import { ActionPlanCard } from '../adjust/ActionPlanCard';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, BookOpen, Play, CheckCircle2, AlertCircle, Trophy, 
  ArrowRight, Activity, Target, Zap, Radio, Info,
  Car, MapPin, Flag, Sun, CloudRain, RotateCw, Square, WifiOff
} from 'lucide-react';

interface SessionStepperViewProps {
  module: Module;
  session: Session;
  progress: UserProgressState;
  isUdpConnected: boolean;
  liveFrame: TelemetryFrame | null;
  liveFramesBuffer: TelemetryFrame[];
  onBack: () => void;
  onChallengePassed: (result: ChallengeResult, nextSessionId: string | null) => void;
  onSaveLap: (lap: LapAnalysis) => void;
}

export const SessionStepperView: React.FC<SessionStepperViewProps> = ({
  module,
  session,
  progress,
  isUdpConnected,
  liveFrame,
  liveFramesBuffer,
  onBack,
  onChallengePassed,
  onSaveLap
}) => {
  const [activeStage, setActiveStage] = useState<'teach' | 'practice' | 'analyze' | 'adjust' | 'challenge'>('teach');
  const [cursorDist, setCursorDist] = useState<number>(850);
  const [sessionLaps, setSessionLaps] = useState<LapAnalysis[]>([]);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(
    progress.challengeResults[session.challenge.id] || null
  );

  // Manual Stint Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFrames, setRecordedFrames] = useState<TelemetryFrame[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [lastSavedStintLap, setLastSavedStintLap] = useState<LapAnalysis | null>(null);

  // Ref to track live buffer snapshot when recording starts
  const recordingTimerRef = useRef<any>(null);

  // Capture incoming live frames when recording is active
  useEffect(() => {
    if (isRecording && liveFrame) {
      setRecordedFrames(prev => [...prev, liveFrame]);
    }
  }, [isRecording, liveFrame]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setRecordedFrames(liveFrame ? [liveFrame] : []);
    setRecordingSeconds(0);
    setLastSavedStintLap(null);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Use recorded frames if available; fallback to current buffer if frames were accumulating
    const framesToAnalyze = recordedFrames.length >= 20 
      ? recordedFrames 
      : liveFramesBuffer.length >= 20 
      ? liveFramesBuffer 
      : [];

    if (framesToAnalyze.length >= 20) {
      const baseLap = analyzeLapTelemetry(framesToAnalyze);
      const analyzedLap: LapAnalysis = {
        ...baseLap,
        source: 'academy',
        moduleNumber: module.moduleNumber,
        moduleTitle: module.title,
        sessionId: session.id,
        sessionTitle: session.title,
        recordedAt: new Date().toISOString()
      };
      setSessionLaps(prev => [...prev, analyzedLap]);
      setLastSavedStintLap(analyzedLap);
      onSaveLap(analyzedLap);
    }
  };

  const currentLap = sessionLaps.length > 0 
    ? sessionLaps[sessionLaps.length - 1] 
    : lastSavedStintLap;

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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasLiveData = isUdpConnected && liveFrame !== null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0E] overflow-hidden">
      {/* Top Header & Breadcrumb Bar */}
      <div className="px-6 py-4 border-b border-[#232332] bg-[#0E0E14] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#181824] hover:bg-[#222232] text-slate-300 hover:text-white border border-[#2B2B3E] transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#E10600]" />
            <span>Curriculum Modules</span>
          </button>

          <div className="h-5 w-[1px] bg-[#2A2A3C]" />

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E10600] to-[#880400] flex items-center justify-center font-display font-black text-white text-xs shadow-md shadow-red-950">
              {module.moduleNumber}.{session.sessionNumber}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold text-[#E10600] uppercase tracking-wider">
                  Module {module.moduleNumber}: {module.title}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] text-[#8E8E9F] font-mono">{session.bookReference}</span>
              </div>
              <h1 className="text-sm font-bold text-white tracking-wide">{session.title}</h1>
            </div>
          </div>
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#14141E] border border-[#232332] text-xs font-mono">
            <span className="text-[#8E8E9F]">Stint Laps:</span>
            <strong className="text-emerald-400 font-bold">{sessionLaps.length}</strong>
          </div>
          {progress.completedSessionIds.includes(session.id) && (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Session Completed</span>
            </span>
          )}
        </div>
      </div>

      {/* 5-Stage Stepper Navigation Bar */}
      <div className="px-6 py-2.5 bg-[#12121A] border-b border-[#20202E] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 overflow-x-auto">
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#E10600] text-white shadow-md shadow-red-950/60 border border-red-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1A28] border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-[#8E8E9F]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Skip Barber 5-Stage Coaching Framework</span>
        </div>
      </div>

      {/* Main Workspace Stage Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0A0A0E]">
        {/* STAGE 1: TEACH */}
        {activeStage === 'teach' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-[#14141E] border border-[#262638] space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-[#E10600] text-xs font-mono font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Skip Barber Theoretical Foundation</span>
              </div>
              <h2 className="text-xl font-bold text-white">{session.subtitle}</h2>

              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                {session.theorySummary.map((para, pIdx) => (
                  <p key={pIdx} className="bg-[#101018] p-4 rounded-xl border border-[#1E1E2C]">{para}</p>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {session.keyPrinciples.map((kp, kpIdx) => (
                  <div key={kpIdx} className="p-4 rounded-xl bg-[#181826] border border-[#2D2D40]">
                    <h3 className="text-xs font-bold text-[#FF4D4D] uppercase tracking-wider font-mono">{kp.title}</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{kp.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Metrics */}
            <div className="p-6 rounded-2xl bg-[#14141E] border border-[#262638] space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-white text-xs font-mono font-bold uppercase tracking-wider">
                <Target className="w-4 h-4 text-[#00F0FF]" />
                <span>Telemetric Target Criteria for this Session</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.targetMetrics.map((tm, tmIdx) => (
                  <div key={tmIdx} className="p-4 rounded-xl bg-[#101018] border border-[#222234] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block">{tm.label}</span>
                      <span className="text-[11px] text-[#8E8E9F]">{tm.hint}</span>
                    </div>
                    <span className="text-base font-mono font-bold text-emerald-400">{tm.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveStage('practice')}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-lg shadow-red-950/60 transition-all active:scale-95 cursor-pointer"
              >
                <span>Proceed to Step 2: Practice & Ingest</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: PRACTICE */}
        {activeStage === 'practice' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Recommended Forza Event Setup Briefing */}
            {session.recommendedSetup && (
              <div className="p-6 rounded-2xl bg-[#14141E] border border-[#262638] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#00F0FF] text-xs font-mono font-bold uppercase tracking-wider">
                    <Flag className="w-4 h-4 text-[#00F0FF]" />
                    <span>Recommended Forza Motorsport Event Setup</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-[#1A1A28] px-2.5 py-1 rounded-full border border-[#2A2A3E]">
                    Free Play / Test Drive Setup
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

            {/* Live Telemetry Ingest & Stint Recording Control */}
            <div className="p-6 rounded-2xl bg-[#14141E] border border-[#262638] space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isRecording 
                      ? 'bg-red-950/60 border-red-500/60' 
                      : hasLiveData 
                      ? 'bg-emerald-950/60 border-emerald-500/40' 
                      : 'bg-[#181824] border-[#2E2E40]'
                  }`}>
                    {isRecording ? (
                      <Radio className="w-5 h-5 text-[#FF1801] animate-ping" />
                    ) : hasLiveData ? (
                      <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Practice Telemetry Ingestion & Stint Recorder
                      </h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isRecording
                          ? 'bg-red-950 text-red-300 border-red-500/50 animate-pulse'
                          : hasLiveData
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#181822] text-slate-400 border-[#2A2A3C]'
                      }`}>
                        {isRecording ? `RECORDING STINT (${formatTime(recordingSeconds)})` : hasLiveData ? '60Hz UDP Connected' : 'Waiting for Telemetry'}
                      </span>
                    </div>
                    <p className="text-xs text-[#8E8E9F]">
                      {isRecording 
                        ? `Recording telemetry frames: ${recordedFrames.length} captured`
                        : 'Port 5300 listening. Click "Start Recording Stint" when ready to drive.'}
                    </p>
                  </div>
                </div>

                {/* Stint Recording Action Buttons */}
                <div>
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E10600] to-[#B30400] hover:from-[#FF1801] hover:to-[#E10600] text-white text-xs font-bold tracking-wide shadow-xl shadow-red-950/60 border border-red-400/40 active:scale-95 cursor-pointer transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Recording Stint</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold tracking-wide shadow-xl shadow-red-950/60 border border-red-400/50 active:scale-95 cursor-pointer transition-all"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Recording Stint ({recordedFrames.length} frames)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Live Gauges Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#0F0F17] border border-[#222232] flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-[#8E8E9F] uppercase tracking-widest">Speed</span>
                  <div className="flex items-baseline space-x-1 my-1">
                    <span className="text-3xl font-mono font-black text-[#00F0FF]">
                      {liveFrame ? liveFrame.speedKph.toFixed(0) : '0'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">km/h</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {liveFrame ? `${liveFrame.speedMph.toFixed(0)} mph` : '0 mph'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#0F0F17] border border-[#222232] flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-[#8E8E9F] uppercase tracking-widest">Gear & RPM</span>
                  <div className="flex items-baseline space-x-1.5 my-1">
                    <span className="text-3xl font-mono font-black text-amber-400">
                      {liveFrame ? (liveFrame.gear === 0 ? 'R' : liveFrame.gear === 11 ? 'N' : liveFrame.gear) : 'N'}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {liveFrame ? `${Math.round(liveFrame.rpm)}` : '0'}
                    </span>
                  </div>
                  <div className="w-full bg-[#1F1F2E] h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-gradient-to-r from-emerald-400 via-amber-400 to-[#E10600] h-full"
                      style={{ width: `${Math.min(100, ((liveFrame?.rpm || 0) / 8000) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0F0F17] border border-[#222232] flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-[#8E8E9F] uppercase tracking-widest">Traction Usage</span>
                  <span className="text-3xl font-mono font-black text-emerald-400 my-1">
                    {liveFrame ? `${liveFrame.tractionBudgetPct.toFixed(0)}%` : '0%'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Peak Budget</span>
                </div>

                <div className="p-4 rounded-xl bg-[#0F0F17] border border-[#222232] flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-[#8E8E9F] uppercase tracking-widest">Lateral G</span>
                  <span className="text-3xl font-mono font-black text-purple-400 my-1">
                    {liveFrame ? `${Math.abs(liveFrame.latG).toFixed(2)}G` : '0.00G'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Cornering Load</span>
                </div>
              </div>

              {/* Stint Recorded Success Banner */}
              {lastSavedStintLap && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#121820] to-[#12121C] border border-emerald-500/50 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-wider">
                        Stint Telemetry Successfully Captured & Saved
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                      Lap Grade: {lastSavedStintLap.overallScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-1">
                    <div className="bg-[#0C0C12] p-2.5 rounded-xl border border-[#202030]">
                      <span className="text-slate-400 block text-[10px]">Lap Time:</span>
                      <strong className="text-white text-sm">{lastSavedStintLap.lapTimeSec.toFixed(2)}s</strong>
                    </div>
                    <div className="bg-[#0C0C12] p-2.5 rounded-xl border border-[#202030]">
                      <span className="text-slate-400 block text-[10px]">Max Velocity:</span>
                      <strong className="text-[#00F0FF] text-sm">{lastSavedStintLap.maxSpeedKph} km/h</strong>
                    </div>
                    <div className="bg-[#0C0C12] p-2.5 rounded-xl border border-[#202030]">
                      <span className="text-slate-400 block text-[10px]">Traction Budget:</span>
                      <strong className="text-emerald-400 text-sm">{lastSavedStintLap.avgTractionBudgetPct}%</strong>
                    </div>
                    <div className="bg-[#0C0C12] p-2.5 rounded-xl border border-[#202030]">
                      <span className="text-slate-400 block text-[10px]">Peak Lateral G:</span>
                      <strong className="text-purple-400 text-sm">{lastSavedStintLap.peakLatG}G</strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setActiveStage('analyze')}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 active:scale-95 cursor-pointer transition-all"
                    >
                      <span>Proceed to Step 3: Analyze Telemetry</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAGE 3: ANALYZE */}
        {activeStage === 'analyze' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {currentLap ? (
              <>
                {/* Summary Stats Strip */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                    <span className="text-[10px] text-slate-400 font-mono block">Lap Time</span>
                    <strong className="text-base font-mono font-bold text-white">{currentLap.lapTimeSec.toFixed(2)}s</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                    <span className="text-[10px] text-slate-400 font-mono block">Top Speed</span>
                    <strong className="text-base font-mono font-bold text-[#00F0FF]">{currentLap.maxSpeedKph} km/h</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                    <span className="text-[10px] text-slate-400 font-mono block">Traction Budget</span>
                    <strong className="text-base font-mono font-bold text-emerald-400">{currentLap.avgTractionBudgetPct}%</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                    <span className="text-[10px] text-slate-400 font-mono block">Peak Lat G</span>
                    <strong className="text-base font-mono font-bold text-purple-400">{currentLap.peakLatG}G</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                    <span className="text-[10px] text-slate-400 font-mono block">Peak Braking G</span>
                    <strong className="text-base font-mono font-bold text-[#FF1801]">{currentLap.peakBrakingG}G</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 rounded-xl border border-[#232332]">
                    <span className="text-[10px] text-slate-400 font-mono block">Mastery Grade</span>
                    <strong className="text-base font-mono font-bold text-amber-400">{currentLap.overallScore}%</strong>
                  </div>
                </div>

                {/* Synchronized Telemetry Traces */}
                <TelemetryTraces
                  frames={currentLap.frames}
                  cursorDistance={cursorDist}
                  onCursorChange={setCursorDist}
                  height={270}
                />

                {/* G-G Friction Circle & Circuit Map Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FrictionCirclePlot frames={currentLap.frames} currentFrame={closestFrame} />
                  <TrackMapViewer frames={currentLap.frames} currentDistance={cursorDist} />
                </div>

                {/* Turn-by-Turn Scorecard */}
                <DiagnosticScorecard corners={currentLap.corners} onFocusCorner={setCursorDist} />

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveStage('adjust')}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-lg shadow-red-950/60 transition-all cursor-pointer"
                  >
                    <span>Proceed to Step 4: Adjust Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 rounded-3xl bg-[#14141E] border border-[#232332] text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1A1A28] border border-[#2D2D44] flex items-center justify-center">
                  <Radio className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white">No Stint Telemetry Recorded For This Session Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Go to Step 2 (Practice), click "Start Recording Stint", drive your laps in Forza Motorsport, and stop the recording to generate full telemetric traces and corner diagnostics.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveStage('practice')}
                    className="px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-lg shadow-red-950/60 cursor-pointer"
                  >
                    Go to Step 2: Practice & Record
                  </button>
                </div>
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

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveStage('challenge')}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#E10600] hover:from-amber-400 hover:to-[#FF1801] text-white text-xs font-bold shadow-lg shadow-red-950/60 transition-all cursor-pointer"
              >
                <span>Proceed to Step 5: Challenge Gate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 5: CHALLENGE */}
        {activeStage === 'challenge' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1A1520] via-[#12121A] to-[#0E0E14] border border-amber-500/40 shadow-2xl space-y-5">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Trophy className="w-5 h-5" />
                <span>Session Challenge Gate</span>
              </div>

              <h3 className="text-2xl font-display font-bold text-white">{session.challenge.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{session.challenge.description}</p>

              <div className="p-4 rounded-2xl bg-[#14141E] border border-[#242436] flex items-center justify-between font-mono">
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
                <div className={`p-4 rounded-2xl border ${
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
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold transition-all ${
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
  );
};
