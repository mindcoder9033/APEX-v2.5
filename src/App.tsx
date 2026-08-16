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
import { generateSyntheticLapFrames } from './engine/telemetrySimulator';
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

  // Latest active lap analysis
  const [currentLap, setCurrentLap] = useState<LapAnalysis>(() => {
    const initialLaps = loadLapHistory();
    if (initialLaps.length > 0) return initialLaps[0];
    const frames = generateSyntheticLapFrames(1, { drivingStyle: 'pro' });
    return analyzeLapTelemetry(frames);
  });

  // UDP Live Telemetry state
  const [isUdpConnected, setIsUdpConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Connect to local Node.js UDP WebSocket bridge if active
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:5301');
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        setIsUdpConnected(true);
        console.log('[APEX] Connected to live Forza UDP stream bridge.');
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const packet = parseForzaBuffer(event.data);
          if (packet && packet.isRaceOn) {
            // Live packet received
          }
        }
      };

      ws.onclose = () => {
        setIsUdpConnected(false);
      };

      ws.onerror = () => {
        setIsUdpConnected(false);
      };
    } catch (e) {
      setIsUdpConnected(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleSaveLap = (lap: LapAnalysis) => {
    setCurrentLap(lap);
    const updated = [lap, ...savedLaps];
    setSavedLaps(updated);
    saveLapHistory(updated);
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

  const handleQuickSimulateDrill = () => {
    setIsSimulating(true);
    const frames = generateSyntheticLapFrames(savedLaps.length + 1, { drivingStyle: 'pro' });
    const lap = analyzeLapTelemetry(frames);
    handleSaveLap(lap);
    setCurrentView('debrief');
    setIsSimulating(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0A0A0E] text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Application Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        isUdpConnected={isUdpConnected}
        isSimulating={isSimulating}
        onOpenSimulator={handleQuickSimulateDrill}
        onExportPdf={() => setIsPdfModalOpen(true)}
        totalMasteredModules={progress.graduatedModuleIds.length}
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
      {isPdfModalOpen && (
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
