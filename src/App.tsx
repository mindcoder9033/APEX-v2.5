import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/layout/Header';
import { CurriculumTree } from './components/curriculum/CurriculumTree';
import { SessionDetailModal } from './components/curriculum/SessionDetailModal';
import { GraduationExamModal } from './components/challenge/GraduationExamModal';
import { LivePracticeView } from './components/practice/LivePracticeView';
import { DebriefView } from './components/debrief/DebriefView';
import { HistoryView } from './components/history/HistoryView';
import { PdfReportModal } from './components/export/PdfReportModal';
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

  // Active session and graduation modals
  const [activeSessionSelection, setActiveSessionSelection] = useState<{ module: Module; session: Session } | null>(null);
  const [graduatingModule, setGraduatingModule] = useState<Module | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Latest active lap analysis (null if no laps recorded yet)
  const [currentLap, setCurrentLap] = useState<LapAnalysis | null>(() => {
    const initialLaps = loadLapHistory();
    return initialLaps.length > 0 ? initialLaps[0] : null;
  });

  // UDP Live Telemetry state
  const [isUdpConnected, setIsUdpConnected] = useState(false);
  const [liveFrame, setLiveFrame] = useState<TelemetryFrame | null>(null);
  const [liveFramesBuffer, setLiveFramesBuffer] = useState<TelemetryFrame[]>([]);

  // Connect to local Node.js UDP WebSocket bridge with resilient auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let lapBuffer: TelemetryFrame[] = [];
    let currentLapNum: number | null = null;
    let reconnectTimer: any = null;
    let isMounted = true;

    const connectBridge = () => {
      if (!isMounted) return;
      try {
        const host = window.location.hostname || 'localhost';
        ws = new WebSocket(`ws://${host}:5301`);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          if (!isMounted) return;
          setIsUdpConnected(true);
          console.log('[APEX] Connected to live Forza UDP stream bridge.');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          if (event.data instanceof ArrayBuffer) {
            const packet = parseForzaBuffer(event.data);
            if (packet && packet.isRaceOn) {
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
              } else {
                lapBuffer.push(frame);
              }
              currentLapNum = packet.lapNumber;
            }
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsUdpConnected(false);
          setLiveFrame(null);
          reconnectTimer = setTimeout(connectBridge, 2000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsUdpConnected(false);
          setLiveFrame(null);
          try { ws?.close(); } catch (_) {}
        };
      } catch (e) {
        if (!isMounted) return;
        setIsUdpConnected(false);
        setLiveFrame(null);
        reconnectTimer = setTimeout(connectBridge, 2000);
      }
    };

    connectBridge();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
    };
  }, []);

  const handleSaveLap = (lap: LapAnalysis) => {
    setCurrentLap(lap);
    setSavedLaps(prev => {
      const updated = [lap, ...prev];
      saveLapHistory(updated);
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
        setCurrentView={setCurrentView}
        isUdpConnected={isUdpConnected}
        onExportPdf={() => setIsPdfModalOpen(true)}
        totalMasteredModules={progress.graduatedModuleIds.length}
        hasActiveLap={currentLap !== null}
      />

      {/* Main View Container */}
      <main className="flex-1 flex overflow-hidden">
        {currentView === 'curriculum' && (
          <CurriculumTree
            modules={SKIP_BARBER_MODULES}
            progress={progress}
            onSelectSession={(module, session) => setActiveSessionSelection({ module, session })}
            onStartGraduationTest={(module) => setGraduatingModule(module)}
          />
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
            lap={currentLap}
            module={activeSessionSelection?.module}
            session={activeSessionSelection?.session}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
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

      {/* 5-Stage Coaching Loop Session Detail Modal */}
      {activeSessionSelection && (
        <SessionDetailModal
          module={activeSessionSelection.module}
          session={activeSessionSelection.session}
          progress={progress}
          onClose={() => setActiveSessionSelection(null)}
          onChallengePassed={handleChallengePassed}
          onSaveLap={handleSaveLap}
        />
      )}

      {/* Module Graduation Exam Modal */}
      {graduatingModule && (
        <GraduationExamModal
          module={graduatingModule}
          nextModule={
            SKIP_BARBER_MODULES.find(m => m.moduleNumber === graduatingModule.moduleNumber + 1) || null
          }
          progress={progress}
          onClose={() => setGraduatingModule(null)}
          onGraduationPassed={handleGraduationPassed}
        />
      )}

      {/* Race Engineer PDF Export Modal */}
      {isPdfModalOpen && currentLap && (
        <PdfReportModal
          lap={currentLap}
          module={activeSessionSelection?.module}
          session={activeSessionSelection?.session}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
