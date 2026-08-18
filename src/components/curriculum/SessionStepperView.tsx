import React, { useState, useEffect, useRef } from 'react';
import { Module, Session, UserProgressState, ChallengeResult, ChallengeAttempt } from '../../types/curriculum';
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
  Car, MapPin, Flag, Sun, CloudRain, RotateCw, Square, WifiOff,
  History, ChevronDown, ChevronUp, Eye, Sparkles
} from 'lucide-react';

interface SessionStepperViewProps {
  module: Module;
  session: Session;
  progress: UserProgressState;
  isUdpConnected: boolean;
  liveFrame: TelemetryFrame | null;
  liveFramesBuffer: TelemetryFrame[];
  onBack: () => void;
  onChallengePassed: (result: ChallengeResult, nextSessionId: string | null, attempt?: ChallengeAttempt) => void;
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
  
  // Step 2 Practice Stint Recording State
  const [sessionLaps, setSessionLaps] = useState<LapAnalysis[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFrames, setRecordedFrames] = useState<TelemetryFrame[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [lastSavedStintLap, setLastSavedStintLap] = useState<LapAnalysis | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // Step 5 Dedicated Challenge Recording & Attempt State
  const [isChallengeRecording, setIsChallengeRecording] = useState(false);
  const [challengeRecordedFrames, setChallengeRecordedFrames] = useState<TelemetryFrame[]>([]);
  const [challengeRecordingSeconds, setChallengeRecordingSeconds] = useState(0);
  const challengeTimerRef = useRef<any>(null);

  // Selected attempt for detailed telemetry inspection inside Step 5
  const sessionAttempts: ChallengeAttempt[] = progress.challengeAttempts?.[session.id] || [];
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState<boolean>(false);

  const activeChallengeResult = progress.challengeResults[session.challenge.id] || null;

  // Capture incoming live frames when Step 2 practice recording is active
  useEffect(() => {
    if (isRecording && liveFrame) {
      setRecordedFrames(prev => [...prev, liveFrame]);
    }
  }, [isRecording, liveFrame]);

  // Practice recording timer
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

  // Capture incoming live frames when Step 5 challenge recording is active
  useEffect(() => {
    if (isChallengeRecording && liveFrame) {
      setChallengeRecordedFrames(prev => [...prev, liveFrame]);
    }
  }, [isChallengeRecording, liveFrame]);

  // Challenge recording timer
  useEffect(() => {
    if (isChallengeRecording) {
      challengeTimerRef.current = setInterval(() => {
        setChallengeRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
    }
    return () => {
      if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
    };
  }, [isChallengeRecording]);

  // Practice Handlers (Step 2)
  const handleStartRecording = () => {
    setRecordedFrames(liveFrame ? [liveFrame] : []);
    setRecordingSeconds(0);
    setLastSavedStintLap(null);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
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
        sessionTitle: `${session.title} (Practice)`,
        recordedAt: new Date().toISOString()
      };
      setSessionLaps(prev => [...prev, analyzedLap]);
      setLastSavedStintLap(analyzedLap);
      onSaveLap(analyzedLap);
    }
  };

  const handleResetRecording = () => {
    setIsRecording(false);
    setRecordedFrames([]);
    setRecordingSeconds(0);
    setLastSavedStintLap(null);
  };

  // Step 5 Dedicated Challenge Handlers
  const handleStartChallengeRecording = () => {
    setChallengeRecordedFrames(liveFrame ? [liveFrame] : []);
    setChallengeRecordingSeconds(0);
    setIsChallengeRecording(true);
  };

  const handleResetChallengeRecording = () => {
    setIsChallengeRecording(false);
    setChallengeRecordedFrames([]);
    setChallengeRecordingSeconds(0);
  };

  const handleStopChallengeRecording = () => {
    setIsChallengeRecording(false);
    const framesToAnalyze = challengeRecordedFrames.length >= 20 
      ? challengeRecordedFrames 
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
        sessionTitle: `${session.title} (Official Challenge Attempt #${sessionAttempts.length + 1})`,
        recordedAt: new Date().toISOString()
      };

      // Evaluate challenge strictly using this challenge stint telemetry
      const challengeLaps = [analyzedLap];
      const result = evaluateSessionChallenge(session.challenge, challengeLaps);

      const newAttempt: ChallengeAttempt = {
        id: `att-${session.id}-${Date.now()}`,
        attemptNumber: sessionAttempts.length + 1,
        timestamp: new Date().toISOString(),
        result,
        laps: challengeLaps
      };

      setSelectedAttemptId(newAttempt.id);
      onSaveLap(analyzedLap);

      if (result.passed) {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 }
        });
      }

      // Find next session in module
      const currentIdx = module.sessions.findIndex(s => s.id === session.id);
      const nextSession = module.sessions[currentIdx + 1] || null;

      onChallengePassed(result, nextSession ? nextSession.id : null, newAttempt);
    }
  };

  const currentLap = sessionLaps.length > 0 
    ? sessionLaps[sessionLaps.length - 1] 
    : lastSavedStintLap;

  // Selected attempt laps for deep inspection
  const selectedAttempt = sessionAttempts.find(a => a.id === selectedAttemptId) || sessionAttempts[sessionAttempts.length - 1] || null;
  const inspectedLap = selectedAttempt?.laps[0] || null;
  const closestFrame = (inspectedLap || currentLap)?.frames.find(f => Math.abs(f.distance - cursorDist) < 15) || (inspectedLap || currentLap)?.frames[0] || null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getMedalBadge = (medal?: string) => {
    if (medal === 'gold') {
      return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold">🥇 GOLD MEDAL</span>;
    }
    if (medal === 'silver') {
      return <span className="px-2 py-0.5 bg-slate-400/20 text-slate-200 border border-slate-400/40 text-[11px] font-mono font-bold">🥈 SILVER MEDAL</span>;
    }
    if (medal === 'bronze') {
      return <span className="px-2 py-0.5 bg-amber-800/30 text-amber-500 border border-amber-800/40 text-[11px] font-mono font-bold">🥉 BRONZE MEDAL</span>;
    }
    return <span className="px-2 py-0.5 bg-red-950/40 text-red-400 border border-red-900/40 text-[11px] font-mono font-bold">❌ FAILED</span>;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0E] overflow-hidden">
      {/* Top Session Breadcrumb Bar */}
      <div className="px-6 py-3.5 border-b border-[#232332] bg-[#0E0E14] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#181824] hover:bg-[#222232] text-slate-300 hover:text-white border border-[#2B2B3E] transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#E10600]" />
            <span>Curriculum Modules</span>
          </button>

          <div className="h-5 w-[1px] bg-[#2A2A3C]" />

          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-[#E10600] text-white flex items-center justify-center font-display font-black text-xs shadow-md shadow-red-950/60">
              {module.moduleNumber}.{session.sessionNumber}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF2E2E]">
                Module {module.moduleNumber}: {module.title}
              </span>
              <h1 className="text-sm font-bold text-white tracking-wide">{session.title}</h1>
            </div>
          </div>
        </div>

        {/* 5-Stage Step Navigation Pills */}
        <div className="flex items-center space-x-1.5 bg-[#12121A] p-1 border border-[#252535]">
          {[
            { id: 'teach', label: '1. Teach (Target)', icon: BookOpen },
            { id: 'practice', label: '2. Practice (Ingest)', icon: Play },
            { id: 'analyze', label: '3. Analyze (Debrief)', icon: Activity },
            { id: 'adjust', label: '4. Adjust (Plan)', icon: Zap },
            { id: 'challenge', label: '5. Challenge (Pass/Unlock)', icon: Trophy }
          ].map((stage) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id as any)}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-[#E10600] text-white shadow-md shadow-red-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-[#1C1C28]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stepper Stage View */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0A0A0E]">
        {/* STAGE 1: TEACH */}
        {activeStage === 'teach' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Book Reference Strip */}
            <div className="p-4 bg-[#14141E] border-l-4 border-l-[#E10600] border border-[#232332] flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-[#E10600]" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8E8E9F] tracking-wider block">Official Curriculum Literature</span>
                  <strong className="text-sm font-semibold text-white">{session.bookReference}</strong>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-[#1A1A28] px-2.5 py-1 border border-[#2A2A3E]">
                Skip Barber Racing School
              </span>
            </div>

            {/* Theory Summary */}
            <div className="p-6 bg-[#14141E] border border-[#262638] space-y-4 shadow-xl hud-bracket">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Info className="w-4 h-4 text-[#E10600]" />
                <span>Core Theory & Physical Mechanics</span>
              </h2>
              <ul className="space-y-2.5">
                {session.theorySummary.map((theory, idx) => (
                  <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start space-x-2.5">
                    <span className="text-[#E10600] font-bold font-mono">0{idx + 1}.</span>
                    <span>{theory}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Principles Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session.keyPrinciples.map((kp, kIdx) => (
                <div key={kIdx} className="p-5 bg-[#12121C] border border-[#232334] space-y-2 hud-bracket">
                  <span className="text-xs font-bold text-white font-display uppercase tracking-wide flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{kp.title}</span>
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{kp.explanation}</p>
                </div>
              ))}
            </div>

            {/* Target Metrics */}
            <div className="p-6 bg-[#14141E] border border-[#262638] space-y-4 shadow-xl hud-bracket">
              <div className="flex items-center space-x-2 text-white text-xs font-mono font-bold uppercase tracking-wider">
                <Target className="w-4 h-4 text-[#00F0FF]" />
                <span>Telemetric Target Criteria for this Session</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.targetMetrics.map((tm, tmIdx) => (
                  <div key={tmIdx} className="p-4 bg-[#101018] border border-[#222234] flex items-center justify-between">
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
                className="chamfer-btn flex items-center space-x-2 px-6 py-3 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold tracking-wide shadow-lg shadow-red-950/60 transition-all active:scale-95 cursor-pointer"
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
              <div className="p-6 bg-[#14141E] border border-[#262638] space-y-4 shadow-xl hud-bracket">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#00F0FF] text-xs font-mono font-bold uppercase tracking-wider">
                    <Flag className="w-4 h-4 text-[#00F0FF]" />
                    <span>Recommended Forza Motorsport Event Setup</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-[#1A1A28] px-2.5 py-1 border border-[#2A2A3E]">
                    Free Play / Test Drive Setup
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                    <div className="p-2 bg-red-950/40 text-[#E10600] border border-red-900/30">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Car Model</span>
                      <strong className="text-xs text-white font-semibold truncate block" title={session.recommendedSetup.car}>
                        {session.recommendedSetup.car}
                      </strong>
                      {session.recommendedSetup.altCar && (
                        <span className="text-[10px] text-slate-400 font-mono block truncate" title={session.recommendedSetup.altCar}>
                          Alt: {session.recommendedSetup.altCar}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                    <div className="p-2 bg-cyan-950/40 text-[#00F0FF] border border-cyan-900/30">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Track & Layout</span>
                      <strong className="text-xs text-white font-semibold truncate block" title={session.recommendedSetup.track}>
                        {session.recommendedSetup.track}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                    <div className="p-2 bg-purple-950/40 text-purple-400 border border-purple-900/30">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Game Type</span>
                      <strong className="text-xs text-white font-semibold block">
                        {session.recommendedSetup.gameType}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                    <div className="p-2 bg-amber-950/40 text-amber-400 border border-amber-900/30">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Time of Day</span>
                      <strong className="text-xs text-white font-semibold block">
                        {session.recommendedSetup.timeOfDay}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                    <div className="p-2 bg-blue-950/40 text-blue-400 border border-blue-900/30">
                      <CloudRain className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">Weather</span>
                      <strong className="text-xs text-white font-semibold block">
                        {session.recommendedSetup.weather}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#0F0F17] border border-[#222232] flex items-start space-x-3">
                    <div className="p-2 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
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
                  <div className="p-3 bg-[#101018] border border-[#222232] text-xs text-slate-300 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{session.recommendedSetup.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Practice Ingest HUD & Controls */}
            <div className="p-6 bg-[#14141E] border border-[#262638] space-y-5 shadow-xl hud-bracket">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                    Live Telemetry Ingestion & Stint Recording
                  </h3>
                  <p className="text-xs text-[#8E8E9F]">
                    Launch Forza Motorsport, drive the recommended setup, and click record to capture telemetry
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isUdpConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs font-mono text-slate-300">
                    {isUdpConnected ? 'UDP 5300 Telemetry Active' : 'Waiting for Telemetry Feed'}
                  </span>
                </div>
              </div>

              {/* Recording Status & Action Buttons */}
              <div className="p-4 bg-[#0E0E14] border border-[#222232] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 font-mono text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Duration:</span>
                    <strong className="text-white text-sm tabular-nums">{formatTime(recordingSeconds)}</strong>
                  </div>
                  <div className="h-4 w-[1px] bg-[#222232]" />
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Frames Captured:</span>
                    <strong className="text-[#00F0FF] text-sm tabular-nums">{recordedFrames.length}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      disabled={!isUdpConnected}
                      className={`chamfer-btn flex items-center space-x-2 px-5 py-2.5 text-xs font-racing font-bold tracking-wide transition-all ${
                        isUdpConnected
                          ? 'bg-[#E10600] hover:bg-[#FF1801] text-white shadow-lg shadow-red-950/60 active:scale-95 cursor-pointer'
                          : 'bg-[#1C1C28] text-slate-500 border border-[#2A2A3C] cursor-not-allowed shadow-none'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Recording Stint</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="chamfer-btn flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-racing font-bold tracking-wide shadow-lg shadow-amber-950/60 active:scale-95 cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop & Analyze Stint</span>
                    </button>
                  )}

                  <button
                    onClick={handleResetRecording}
                    disabled={isRecording || recordedFrames.length === 0}
                    className="px-3.5 py-2.5 bg-[#181824] hover:bg-[#222232] text-slate-400 hover:text-white border border-[#28283C] text-xs font-mono transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Last Saved Stint Result */}
              {lastSavedStintLap && (
                <div className="p-4 bg-[#101018] border border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Stint Telemetry Successfully Ingested & Evaluated</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Grade: {lastSavedStintLap.overallScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-[#0C0C12] p-2.5 border border-[#202030]">
                      <span className="text-slate-400 block text-[10px]">Lap Time:</span>
                      <strong className="text-white text-sm">{lastSavedStintLap.lapTimeSec.toFixed(2)}s</strong>
                    </div>
                    <div className="bg-[#0C0C12] p-2.5 border border-[#202030]">
                      <span className="text-slate-400 block text-[10px]">Top Speed:</span>
                      <strong className="text-[#00F0FF] text-sm">{lastSavedStintLap.maxSpeedKph} km/h</strong>
                    </div>
                    <div className="bg-[#0C0C12] p-2.5 border border-[#202030]">
                      <span className="text-slate-400 block text-[10px]">Traction Budget:</span>
                      <strong className="text-emerald-400 text-sm">{lastSavedStintLap.avgTractionBudgetPct}%</strong>
                    </div>
                    <div className="bg-[#0C0C12] p-2.5 border border-[#202030]">
                      <span className="text-slate-400 block text-[10px]">Peak Lateral G:</span>
                      <strong className="text-purple-400 text-sm">{lastSavedStintLap.peakLatG}G</strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setActiveStage('analyze')}
                      className="chamfer-btn flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-racing font-bold shadow-lg shadow-emerald-950/60 active:scale-95 cursor-pointer transition-all"
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
                  <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                    <span className="text-[10px] text-slate-400 font-mono block">Lap Time</span>
                    <strong className="text-base font-mono font-bold text-white tabular-nums">{currentLap.lapTimeSec.toFixed(2)}s</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                    <span className="text-[10px] text-slate-400 font-mono block">Top Speed</span>
                    <strong className="text-base font-hud-clean font-bold text-[#00F0FF] tabular-nums">{currentLap.maxSpeedKph} km/h</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                    <span className="text-[10px] text-slate-400 font-mono block">Traction Budget</span>
                    <strong className="text-base font-hud-clean font-bold text-emerald-400 tabular-nums">{currentLap.avgTractionBudgetPct}%</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                    <span className="text-[10px] text-slate-400 font-mono block">Peak Lat G</span>
                    <strong className="text-base font-mono font-bold text-purple-400 tabular-nums">{currentLap.peakLatG}G</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                    <span className="text-[10px] text-slate-400 font-mono block">Peak Braking G</span>
                    <strong className="text-base font-mono font-bold text-[#FF1801] tabular-nums">{currentLap.peakBrakingG}G</strong>
                  </div>
                  <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                    <span className="text-[10px] text-slate-400 font-mono block">Mastery Grade</span>
                    <strong className="text-base font-hud-clean font-bold text-amber-400 tabular-nums">{currentLap.overallScore}%</strong>
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
                    className="chamfer-btn flex items-center space-x-2 px-6 py-2.5 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold tracking-wide shadow-lg shadow-red-950/60 transition-all cursor-pointer"
                  >
                    <span>Proceed to Step 4: Adjust Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 bg-[#14141E] border border-[#232332] text-center space-y-4 shadow-2xl hud-bracket">
                <div className="w-16 h-16 mx-auto bg-[#1A1A28] border border-[#2D2D44] flex items-center justify-center">
                  <Radio className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white font-racing">No Stint Telemetry Recorded For This Session Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Go to Step 2 (Practice), click "Start Recording Stint", drive your laps in Forza Motorsport, and stop the recording to generate full telemetric traces and corner diagnostics.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveStage('practice')}
                    className="chamfer-btn px-5 py-2.5 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold shadow-lg shadow-red-950/60 cursor-pointer"
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
                className="chamfer-btn flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-[#E10600] hover:from-amber-400 hover:to-[#FF1801] text-white text-xs font-racing font-bold tracking-wide shadow-lg shadow-red-950/60 transition-all cursor-pointer"
              >
                <span>Proceed to Step 5: Challenge Gate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 5: CHALLENGE (DEDICATED TELEMETRY RECORDER & MULTI-ATTEMPT TRACKER) */}
        {activeStage === 'challenge' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Main Challenge Briefing Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-[#1A1520] via-[#12121A] to-[#0E0E14] border border-amber-500/40 shadow-2xl space-y-5 hud-bracket">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Trophy className="w-5 h-5" />
                  <span>Session Official Challenge Gate</span>
                </div>
                {activeChallengeResult && activeChallengeResult.passed && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400">Current Session Record:</span>
                    {getMedalBadge(activeChallengeResult.medal)}
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-display font-bold text-white">{session.challenge.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{session.challenge.description}</p>

              {/* Baseline & Medal Targets Matrix */}
              <div className="p-4 bg-[#14141E] border border-[#242436] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <div>
                  <span className="text-xs text-slate-400 block">Baseline Target</span>
                  <strong className="text-sm text-white">
                    {session.challenge.operator === 'gte' ? '≥' : '≤'} {session.challenge.targetValue} {session.challenge.unit}
                  </strong>
                </div>
                {session.challenge.medals && (
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="px-2 py-0.5 bg-amber-800/30 text-amber-500 border border-amber-800/40">
                      🥉 Bronze: {session.challenge.operator === 'gte' ? '≥' : '≤'} {session.challenge.medals.bronze}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-400/20 text-slate-200 border border-slate-400/40 font-bold">
                      🥈 Silver: {session.challenge.operator === 'gte' ? '≥' : '≤'} {session.challenge.medals.silver}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      🥇 Gold: {session.challenge.operator === 'gte' ? '≥' : '≤'} {session.challenge.medals.gold}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-400 block">Consecutive Laps</span>
                  <strong className="text-sm text-amber-300">{session.challenge.requiredLaps} Laps</strong>
                </div>
              </div>

              {/* DEDICATED CHALLENGE TELEMETRY RECORDER */}
              <div className="p-5 bg-[#0C0C12] border border-[#26263A] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isChallengeRecording ? 'bg-red-500 animate-ping' : isUdpConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      {isChallengeRecording ? 'Recording Challenge Stint...' : 'Challenge Telemetry Recorder'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Attempts Recorded: <strong className="text-white">{sessionAttempts.length}</strong>
                  </span>
                </div>

                <div className="p-4 bg-[#14141E] border border-[#20202E] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Stint Timer:</span>
                      <strong className={`text-sm tabular-nums ${isChallengeRecording ? 'text-amber-400' : 'text-white'}`}>
                        {formatTime(challengeRecordingSeconds)}
                      </strong>
                    </div>
                    <div className="h-4 w-[1px] bg-[#222232]" />
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Frames Captured:</span>
                      <strong className="text-[#00F0FF] text-sm tabular-nums">{challengeRecordedFrames.length}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {!isChallengeRecording ? (
                      <button
                        onClick={handleStartChallengeRecording}
                        disabled={!isUdpConnected}
                        className={`chamfer-btn flex items-center space-x-2 px-5 py-2.5 text-xs font-racing font-bold tracking-wide transition-all ${
                          isUdpConnected
                            ? 'bg-gradient-to-r from-amber-500 to-[#E10600] hover:from-amber-400 hover:to-[#FF1801] text-white shadow-xl shadow-red-950/60 active:scale-95 cursor-pointer'
                            : 'bg-[#1C1C28] text-slate-500 border border-[#2A2A3C] cursor-not-allowed shadow-none'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Start Official Challenge Attempt #{sessionAttempts.length + 1}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStopChallengeRecording}
                        className="chamfer-btn flex items-center space-x-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-racing font-bold tracking-wide shadow-lg shadow-amber-950/60 active:scale-95 cursor-pointer animate-pulse"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop & Evaluate Challenge Stint</span>
                      </button>
                    )}

                    <button
                      onClick={handleResetChallengeRecording}
                      disabled={isChallengeRecording || challengeRecordedFrames.length === 0}
                      className="px-3.5 py-2.5 bg-[#181824] hover:bg-[#222232] text-slate-400 hover:text-white border border-[#28283C] text-xs font-mono transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* LATEST ATTEMPT RESULT BANNER */}
              {selectedAttempt && (
                <div className={`p-5 border ${
                  selectedAttempt.result.passed
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/50 text-red-300'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      {selectedAttempt.result.passed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <AlertCircle className="w-6 h-6 text-red-400" />}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white font-racing">
                            Attempt #{selectedAttempt.attemptNumber}: {selectedAttempt.result.passed ? 'PASSED' : 'NOT MET'}
                          </h4>
                          {getMedalBadge(selectedAttempt.result.medal)}
                        </div>
                        <p className="text-xs text-slate-200 font-sans mt-0.5">{selectedAttempt.result.notes}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowTelemetryDrawer(!showTelemetryDrawer)}
                      className="chamfer-btn flex items-center space-x-1.5 px-3 py-1.5 bg-[#161622] hover:bg-[#1E1E2E] text-slate-200 text-xs font-mono border border-[#2D2D42] cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>{showTelemetryDrawer ? 'Hide Attempt Telemetry' : 'Inspect Attempt Telemetry'}</span>
                      {showTelemetryDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* EXPANDABLE TELEMETRY DRAWER FOR ATTEMPT */}
            {showTelemetryDrawer && inspectedLap && (
              <div className="p-6 bg-[#14141E] border border-[#28283C] space-y-6 shadow-2xl hud-bracket animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#222232] pb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#00F0FF]" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Telemetric Diagnostics — Attempt #{selectedAttempt?.attemptNumber}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Lap Time: <strong className="text-white">{inspectedLap.lapTimeSec.toFixed(2)}s</strong> • Overall Score: <strong className="text-amber-400">{inspectedLap.overallScore}%</strong>
                  </span>
                </div>

                <TelemetryTraces
                  frames={inspectedLap.frames}
                  cursorDistance={cursorDist}
                  onCursorChange={setCursorDist}
                  height={240}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FrictionCirclePlot frames={inspectedLap.frames} currentFrame={closestFrame} />
                  <TrackMapViewer frames={inspectedLap.frames} currentDistance={cursorDist} />
                </div>

                <DiagnosticScorecard corners={inspectedLap.corners} onFocusCorner={setCursorDist} />
              </div>
            )}

            {/* ATTEMPTS HISTORY LOG TABLE */}
            {sessionAttempts.length > 0 && (
              <div className="p-6 bg-[#14141E] border border-[#262638] space-y-4 shadow-xl hud-bracket">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-white text-xs font-mono font-bold uppercase tracking-wider">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Challenge Attempts History Log ({sessionAttempts.length} Total)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Highest Medal Retained
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#232334] text-slate-400 uppercase text-[10px] bg-[#0E0E14]">
                        <th className="p-3">Attempt</th>
                        <th className="p-3">Recorded Time</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Achieved Value</th>
                        <th className="p-3">Medal Result</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C28]">
                      {sessionAttempts.map((att) => {
                        const isSelected = att.id === selectedAttemptId;
                        return (
                          <tr
                            key={att.id}
                            className={`transition-colors ${
                              isSelected ? 'bg-[#1C1C2C]' : 'hover:bg-[#12121A]'
                            }`}
                          >
                            <td className="p-3 font-bold text-white">
                              Attempt #{att.attemptNumber}
                            </td>
                            <td className="p-3 text-slate-400">
                              {new Date(att.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-3 font-bold text-amber-300">
                              {att.result.score}%
                            </td>
                            <td className="p-3 text-slate-200">
                              {att.result.achievedValue} {session.challenge.unit}
                            </td>
                            <td className="p-3">
                              {getMedalBadge(att.result.medal)}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedAttemptId(att.id);
                                  setShowTelemetryDrawer(true);
                                }}
                                className="px-2.5 py-1 bg-[#181824] hover:bg-[#252538] text-slate-300 hover:text-white border border-[#2E2E42] text-[11px] font-mono transition-all cursor-pointer"
                              >
                                Inspect Telemetry
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
