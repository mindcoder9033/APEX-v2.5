import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/layout/Header';
import { CurriculumTree } from './components/curriculum/CurriculumTree';
import { SessionStepperView } from './components/curriculum/SessionStepperView';
import { GraduationExamView } from './components/challenge/GraduationExamView';
import { LivePracticeView } from './components/practice/LivePracticeView';
import { DebriefView } from './components/debrief/DebriefView';
import { HistoryView } from './components/history/HistoryView';
import { SKIP_BARBER_MODULES } from './data/skipBarberCurriculum';
import { 
  loadUserProgress, saveUserProgress, loadLapHistory, saveLapHistory, 
  recordChallengeCompletion, recordGraduationCompletion 
} from './db/storage';
import { Module, Session, UserProgressState, ChallengeResult, GraduationResult } from './types/curriculum';
import { LapAnalysis, TelemetryFrame } from './types/telemetry';
import { analyzeLapTelemetry } from './engine/physicsEngine';
import { parseForzaBuffer, convertPacketToTelemetryFrame } from './engine/forzaParser';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('curriculum');
  const [progress, setProgress] = useState<UserProgressState>(loadUserProgress);
  const [savedLaps, setSavedLaps] = useState<LapAnalysis[]>(loadLapHistory);

  // Active session and graduation state for Curriculum Academy
  const [activeSessionSelection, setActiveSessionSelection] = useState<{ module: Module; session: Session } | null>(null);
  const [graduatingModule, setGraduatingModule] = useState<Module | null>(null);

  // Latest active lap analysis (null if no laps recorded yet)
  const [currentLap, setCurrentLap] = useState<LapAnalysis | null>(() => {
    const initialLaps = loadLapHistory();
    return initialLaps.length > 0 ? initialLaps[0] : null;
  });

  // UDP Live Telemetry state
  const [isBridgeConnected, setIsBridgeConnected] = useState(false);
  const [isUdpConnected, setIsUdpConnected] = useState(false);
  const [liveFrame, setLiveFrame] = useState<TelemetryFrame | null>(null);
  const [liveFramesBuffer, setLiveFramesBuffer] = useState<TelemetryFrame[]>([]);

  // Connect to local Node.js UDP WebSocket bridge with resilient auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let lapBuffer: TelemetryFrame[] = [];
    let currentLapNum: number | null = null;
    let reconnectTimer: any = null;
    let packetWatchdogTimer: any = null;
    let isMounted = true;

    const connectBridge = () => {
      if (!isMounted) return;
      try {
        const host = window.location.hostname || 'localhost';
        ws = new WebSocket(`ws://${host}:5301`);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          if (!isMounted) return;
          setIsBridgeConnected(true);
          console.log('[APEX] Connected to live Forza UDP stream bridge.');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          if (event.data instanceof ArrayBuffer) {
            const packet = parseForzaBuffer(event.data);
            if (packet) {
              setIsUdpConnected(true);
              
              // Reset watchdog timer: if no packets for 3 seconds, mark streaming as paused/idle
              if (packetWatchdogTimer) clearTimeout(packetWatchdogTimer);
              packetWatchdogTimer = setTimeout(() => {
                if (isMounted) setIsUdpConnected(false);
              }, 3000);

              if (packet.isRaceOn || packet.currentEngineRpm > 0) {
                const distance = packet.distanceTraveledMeters > 0 
                  ? packet.distanceTraveledMeters % 3500 
                  : 0;
                const frame = convertPacketToTelemetryFrame(packet, distance);
                
                setLiveFrame(frame);
                setLiveFramesBuffer(prev => [...prev.slice(-300), frame]);

                // Automatic lap segmentation when lapNumber advances
                if (currentLapNum !== null && packet.lapNumber > currentLapNum && lapBuffer.length > 50) {
                  const completedLap = analyzeLapTelemetry(lapBuffer);
                  handleSaveLap(completedLap);
                  lapBuffer = [frame];
                } else if (packet.isRaceOn) {
                  lapBuffer.push(frame);
                }
                currentLapNum = packet.lapNumber;
              }
            }
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsBridgeConnected(false);
          setIsUdpConnected(false);
          setLiveFrame(null);
          reconnectTimer = setTimeout(connectBridge, 2000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsBridgeConnected(false);
          setIsUdpConnected(false);
          setLiveFrame(null);
          try { ws?.close(); } catch (_) {}
        };
      } catch (e) {
        if (!isMounted) return;
        setIsBridgeConnected(false);
        setIsUdpConnected(false);
        setLiveFrame(null);
        reconnectTimer = setTimeout(connectBridge, 2000);
      }
    };

    connectBridge();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (packetWatchdogTimer) clearTimeout(packetWatchdogTimer);
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
    };
  }, []);

  const handleSaveLap = (lap: LapAnalysis) => {
    setCurrentLap(lap);
    setSavedLaps(prev => {
      // Avoid duplicate by lapId if already exists
      const filtered = prev.filter(l => l.lapId !== lap.lapId);
      const updated = [lap, ...filtered];
      saveLapHistory(updated);
      return updated;
    });
  };

  const handleDeleteLap = (lapId: string) => {
    setSavedLaps(prev => {
      const updated = prev.filter(l => l.lapId !== lapId);
      saveLapHistory(updated);
      if (currentLap?.lapId === lapId) {
        setCurrentLap(updated.length > 0 ? updated[0] : null);
      }
      return updated;
    });
  };

  const handleChallengePassed = (result: ChallengeResult, nextSessionId: string | null) => {
    if (!activeSessionSelection) return;
    const updated = recordChallengeCompletion(
      progress,
      activeSessionSelection.session.id,
      nextSessionId,
      result
    );
    setProgress(updated);
  };

  const handleGraduationPassed = (
    result: GraduationResult,
    nextModuleId: string | null,
    firstSessionOfNextId: string | null
  ) => {
    if (!graduatingModule) return;
    const updated = recordGraduationCompletion(
      progress,
      graduatingModule.id,
      nextModuleId,
      firstSessionOfNextId,
      result
    );
    setProgress(updated);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0A0A0E] text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Application Header */}
      <Header
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          // If navigating explicitly to another main view tab, keep or reset subselection smoothly
        }}
        isUdpConnected={isUdpConnected}
        isBridgeConnected={isBridgeConnected}
        totalMasteredModules={progress.graduatedModuleIds.length}
      />

      {/* Main View Container */}
      <main className="flex-1 flex overflow-hidden">
        {currentView === 'curriculum' && (
          activeSessionSelection ? (
            <SessionStepperView
              module={activeSessionSelection.module}
              session={activeSessionSelection.session}
              progress={progress}
              isUdpConnected={isUdpConnected}
              liveFrame={liveFrame}
              liveFramesBuffer={liveFramesBuffer}
              onBack={() => setActiveSessionSelection(null)}
              onChallengePassed={handleChallengePassed}
              onSaveLap={handleSaveLap}
            />
          ) : graduatingModule ? (
            <GraduationExamView
              module={graduatingModule}
              nextModule={
                SKIP_BARBER_MODULES.find(m => m.moduleNumber === graduatingModule.moduleNumber + 1) || null
              }
              progress={progress}
              onBack={() => setGraduatingModule(null)}
              onGraduationPassed={handleGraduationPassed}
            />
          ) : (
            <CurriculumTree
              modules={SKIP_BARBER_MODULES}
              progress={progress}
              onSelectSession={(module, session) => {
                setGraduatingModule(null);
                setActiveSessionSelection({ module, session });
              }}
              onStartGraduationTest={(module) => {
                setActiveSessionSelection(null);
                setGraduatingModule(module);
              }}
            />
          )
        )}

        {currentView === 'practice' && (
          <LivePracticeView
            isUdpConnected={isUdpConnected}
            liveFrame={liveFrame}
            liveFramesBuffer={liveFramesBuffer}
            onFinishStint={(lap) => {
              handleSaveLap(lap);
              setCurrentView('debrief');
            }}
          />
        )}

        {currentView === 'debrief' && (
          <DebriefView
            savedLaps={savedLaps}
            currentLap={currentLap}
            onSelectLap={setCurrentLap}
            onDeleteLap={handleDeleteLap}
            module={activeSessionSelection?.module}
            session={activeSessionSelection?.session}
            onNavigateToAcademy={() => setCurrentView('curriculum')}
            onNavigateToPractice={() => setCurrentView('practice')}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            progress={progress}
            modules={SKIP_BARBER_MODULES}
            savedLaps={savedLaps}
            onSelectLapForDebrief={(lap) => {
              setCurrentLap(lap);
              setCurrentView('debrief');
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;

