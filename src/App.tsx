import React, { useState, useEffect, useRef } from 'react';
import { Header, AppView } from './components/layout/Header';
import { CurriculumTree } from './components/curriculum/CurriculumTree';
import { SessionStepperView } from './components/curriculum/SessionStepperView';
import { GraduationExamView } from './components/challenge/GraduationExamView';
import { LivePracticeView } from './components/practice/LivePracticeView';
import { DebriefView } from './components/debrief/DebriefView';
import { HistoryView } from './components/history/HistoryView';
import { StintMetadataModal, StintMetadataInput } from './components/practice/StintMetadataModal';
import { SKIP_BARBER_MODULES } from './data/skipBarberCurriculum';
import { 
  loadUserProgress, saveUserProgress, loadLapHistory, saveLapHistory,
  loadStintHistory, saveStintHistory,
  recordChallengeCompletion, recordGraduationCompletion 
} from './db/storage';
import { Module, Session, UserProgressState, ChallengeResult, GraduationResult } from './types/curriculum';
import { LapAnalysis, StintSession, TelemetryFrame } from './types/telemetry';
import { analyzeLapTelemetry } from './engine/physicsEngine';
import { parseForzaBuffer, convertPacketToTelemetryFrame } from './engine/forzaParser';
import { resolveForzaCar } from './data/carMapping';
import { detectTrackFromFrames } from './engine/trackDetector';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('curriculum');
  const [progress, setProgress] = useState<UserProgressState>(loadUserProgress);
  const [stintHistory, setStintHistory] = useState<StintSession[]>(loadStintHistory);
  const [savedLaps, setSavedLaps] = useState<LapAnalysis[]>(loadLapHistory);

  // Active session and graduation state for Curriculum Academy
  const [activeSessionSelection, setActiveSessionSelection] = useState<{ module: Module; session: Session } | null>(null);
  const [graduatingModule, setGraduatingModule] = useState<Module | null>(null);

  // Current active Stint & Lap for Debrief
  const [currentStint, setCurrentStint] = useState<StintSession | null>(() => {
    const initialStints = loadStintHistory();
    return initialStints.length > 0 ? initialStints[0] : null;
  });

  const [currentLap, setCurrentLap] = useState<LapAnalysis | null>(() => {
    const initialStints = loadStintHistory();
    if (initialStints.length > 0 && initialStints[0].laps.length > 0) {
      return initialStints[0].laps[0];
    }
    const initialLaps = loadLapHistory();
    return initialLaps.length > 0 ? initialLaps[0] : null;
  });

  // UDP Live Telemetry state
  const [isBridgeConnected, setIsBridgeConnected] = useState(false);
  const [isUdpConnected, setIsUdpConnected] = useState(false);
  const [liveFrame, setLiveFrame] = useState<TelemetryFrame | null>(null);
  const [liveFramesBuffer, setLiveFramesBuffer] = useState<TelemetryFrame[]>([]);
  const [networkInfo, setNetworkInfo] = useState<{
    directIps: string[];
    broadcastIps: string[];
    udpPort: number;
    secondaryUdpPort: number;
  } | null>(null);

  // Multi-Lap Stint Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isRewinding, setIsRewinding] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDurationSec, setRecordingDurationSec] = useState<number>(0);
  const [activeStintLaps, setActiveStintLaps] = useState<LapAnalysis[]>([]);
  const [activeLapBufferLength, setActiveLapBufferLength] = useState<number>(0);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Synchronous refs for the high-frequency 60Hz WebSocket callback
  const isRecordingRef = useRef(false);
  const currentLapBufferRef = useRef<TelemetryFrame[]>([]);
  const activeStintLapsRef = useRef<LapAnalysis[]>([]);
  const currentLapNumRef = useRef<number | null>(null);
  const wasCurrentLapRewoundRef = useRef(false);
  const lastPacketTimestampRef = useRef<number | null>(null);
  const lastDistanceTraveledRef = useRef<number | null>(null);
  const rewindDebounceTimerRef = useRef<any>(null);

  // High-frequency live buffer and frame refs for throttled UI dispatching
  const latestLiveFrameRef = useRef<TelemetryFrame | null>(null);
  const liveFramesWindowRef = useRef<TelemetryFrame[]>([]);
  const hasNewDataRef = useRef(false);

  // Keep refs synced with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    activeStintLapsRef.current = activeStintLaps;
  }, [activeStintLaps]);

  // Throttled UI State Dispatcher: Caps React state re-renders to ~20Hz (50ms)
  // while preserving full 60Hz raw stream fidelity in memory refs for physics analysis.
  useEffect(() => {
    let animId: number;
    let lastFlushTime = 0;
    const FLUSH_INTERVAL_MS = 50; // ~20Hz UI refresh rate

    const flushLoop = (time: number) => {
      if (time - lastFlushTime >= FLUSH_INTERVAL_MS) {
        if (hasNewDataRef.current) {
          if (latestLiveFrameRef.current) {
            setLiveFrame(latestLiveFrameRef.current);
          }
          setLiveFramesBuffer([...liveFramesWindowRef.current]);
          if (isRecordingRef.current) {
            setActiveLapBufferLength(currentLapBufferRef.current.length);
          }
          hasNewDataRef.current = false;
        }
        lastFlushTime = time;
      }
      animId = requestAnimationFrame(flushLoop);
    };

    animId = requestAnimationFrame(flushLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Live recording timer ticker
  useEffect(() => {
    let timer: any = null;
    if (isRecording && recordingStartTime) {
      timer = setInterval(() => {
        setRecordingDurationSec(Math.max(0, Math.floor((Date.now() - recordingStartTime) / 1000)));
      }, 500);
    } else {
      setRecordingDurationSec(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, recordingStartTime]);

  // Connect to local Node.js UDP WebSocket bridge with resilient auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let packetWatchdogTimer: any = null;
    let isMounted = true;
    let currentAttemptUrlIdx = 0;

    // Fetch initial network info from Vite API endpoint
    const fetchNetworkInfo = () => {
      fetch('/api/network-info')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && isMounted) setNetworkInfo(data);
        })
        .catch(() => {});
    };

    fetchNetworkInfo();

    const connectBridge = () => {
      if (!isMounted) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const hostname = window.location.hostname || 'localhost';

        // Candidates: 1. Embedded Vite bridge path, 2. Standalone fallback port 5301
        const candidateUrls = [
          `${protocol}//${host}/telemetry-bridge`,
          `ws://${hostname}:5301`
        ];

        const targetUrl = candidateUrls[currentAttemptUrlIdx % candidateUrls.length];
        ws = new WebSocket(targetUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          if (!isMounted) return;
          setIsBridgeConnected(true);
          console.log(`[APEX] Connected to live Forza UDP stream bridge at ${targetUrl}`);
          fetchNetworkInfo();
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;

          // Handle initial JSON config/network greeting message
          if (typeof event.data === 'string') {
            try {
              const meta = JSON.parse(event.data);
              if (meta && meta.type === 'APEX_BRIDGE_INFO' && meta.network) {
                setNetworkInfo(meta.network);
              }
            } catch (_) {}
            return;
          }

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
                const rawDist = packet.distanceTraveledMeters;
                const ts = packet.timestampMs;

                // --- Forza Rewind Detection & Real-Time Buffer Rollback ---
                const isTimeRewound = lastPacketTimestampRef.current !== null && ts < (lastPacketTimestampRef.current - 80);
                const isDistRewound = lastDistanceTraveledRef.current !== null && rawDist < (lastDistanceTraveledRef.current - 1.5) && rawDist >= 0;
                const isLapRewound = currentLapNumRef.current !== null && packet.lapNumber < currentLapNumRef.current;

                const isRewindDetected = isTimeRewound || isDistRewound || isLapRewound;

                if (isRewindDetected) {
                  setIsRewinding(true);
                  wasCurrentLapRewoundRef.current = true;
                  if (rewindDebounceTimerRef.current) clearTimeout(rewindDebounceTimerRef.current);
                  rewindDebounceTimerRef.current = setTimeout(() => {
                    if (isMounted) setIsRewinding(false);
                  }, 650);

                  // 1. Multi-lap boundary rewind: pop the previous completed lap and restore its raw frames
                  if (isLapRewound && activeStintLapsRef.current.length > 0) {
                    const prevLap = activeStintLapsRef.current[activeStintLapsRef.current.length - 1];
                    activeStintLapsRef.current = activeStintLapsRef.current.slice(0, -1);
                    setActiveStintLaps([...activeStintLapsRef.current]);
                    if (prevLap && prevLap.frames && prevLap.frames.length > 0) {
                      currentLapBufferRef.current = [...prevLap.frames, ...currentLapBufferRef.current];
                    }
                    currentLapNumRef.current = packet.lapNumber;
                  }

                  // 2. Truncate recording buffer back to the rewound timestamp point
                  if (isRecordingRef.current) {
                    const buf = currentLapBufferRef.current;
                    if (buf.length > 0) {
                      let cutIdx = -1;
                      for (let i = buf.length - 1; i >= 0; i--) {
                        if (buf[i].timestamp <= ts) {
                          cutIdx = i;
                          break;
                        }
                      }
                      if (cutIdx >= 0) {
                        currentLapBufferRef.current = buf.slice(0, cutIdx + 1);
                      } else {
                        currentLapBufferRef.current = [];
                      }
                    }
                  }

                  // 3. Also trim live frames window to eliminate reverse-playback zig-zags
                  liveFramesWindowRef.current = liveFramesWindowRef.current.filter(f => f.timestamp <= ts);
                }

                lastPacketTimestampRef.current = ts;
                lastDistanceTraveledRef.current = rawDist;
                
                // Store in high-frequency refs without triggering synchronous React re-renders
                latestLiveFrameRef.current = frame;
                if (isRecordingRef.current) {
                  const windowBuf = liveFramesWindowRef.current;
                  windowBuf.push(frame);
                  if (windowBuf.length > 250) {
                    windowBuf.splice(0, windowBuf.length - 250);
                  }
                }
                hasNewDataRef.current = true;

                // Active Stint Recording Logic: full 60Hz precision
                if (isRecordingRef.current) {
                  currentLapBufferRef.current.push(frame);

                  // Automatic lap segmentation when lapNumber advances
                  if (
                    currentLapNumRef.current !== null && 
                    packet.lapNumber > currentLapNumRef.current && 
                    currentLapBufferRef.current.length >= 30
                  ) {
                    const completedLap = analyzeLapTelemetry(
                      currentLapBufferRef.current,
                      3800,
                      wasCurrentLapRewoundRef.current,
                      packet.lastLapTimeSeconds > 0 ? packet.lastLapTimeSeconds : undefined
                    );
                    const lapNumber = activeStintLapsRef.current.length + 1;
                    const analyzedLap: LapAnalysis = {
                      ...completedLap,
                      lapNumber,
                      source: 'practice',
                      recordedAt: new Date().toISOString()
                    };
                    
                    activeStintLapsRef.current = [...activeStintLapsRef.current, analyzedLap];
                    setActiveStintLaps([...activeStintLapsRef.current]);
                    currentLapBufferRef.current = [frame];
                    wasCurrentLapRewoundRef.current = false;
                  }
                  currentLapNumRef.current = packet.lapNumber;
                }
              }
            }
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsBridgeConnected(false);
          setIsUdpConnected(false);
          setIsRewinding(false);
          setLiveFrame(null);
          latestLiveFrameRef.current = null;
          liveFramesWindowRef.current = [];
          setLiveFramesBuffer([]);
          currentAttemptUrlIdx++;
          reconnectTimer = setTimeout(connectBridge, 2000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsBridgeConnected(false);
          setIsUdpConnected(false);
          setIsRewinding(false);
          setLiveFrame(null);
          latestLiveFrameRef.current = null;
          liveFramesWindowRef.current = [];
          setLiveFramesBuffer([]);
          try { ws?.close(); } catch (_) {}
        };
      } catch (e) {
        if (!isMounted) return;
        setIsBridgeConnected(false);
        setIsUdpConnected(false);
        setIsRewinding(false);
        setLiveFrame(null);
        latestLiveFrameRef.current = null;
        liveFramesWindowRef.current = [];
        setLiveFramesBuffer([]);
        currentAttemptUrlIdx++;
        reconnectTimer = setTimeout(connectBridge, 2000);
      }
    };

    connectBridge();


    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (packetWatchdogTimer) clearTimeout(packetWatchdogTimer);
      if (rewindDebounceTimerRef.current) clearTimeout(rewindDebounceTimerRef.current);
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
    };
  }, []);

  // --- Stint Recording Handlers ---
  const handleStartRecording = () => {
    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingStartTime(Date.now());
    setActiveStintLaps([]);
    activeStintLapsRef.current = [];
    currentLapBufferRef.current = [];
    liveFramesWindowRef.current = [];
    setLiveFramesBuffer([]);
    setActiveLapBufferLength(0);
    currentLapNumRef.current = null;
    wasCurrentLapRewoundRef.current = false;
    lastPacketTimestampRef.current = null;
    lastDistanceTraveledRef.current = null;
  };

  const handleRequestStopRecording = () => {
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveStint = (metadata: StintMetadataInput) => {
    const finalLaps: LapAnalysis[] = [...activeStintLapsRef.current];
    const trailingBuffer = currentLapBufferRef.current;

    // If there is a trailing in-progress lap with sufficient frames (>= 30) or if 0 laps completed so far
    if (trailingBuffer.length >= 30 || (finalLaps.length === 0 && trailingBuffer.length >= 15)) {
      const trailingLap = analyzeLapTelemetry(
        trailingBuffer,
        3800,
        wasCurrentLapRewoundRef.current
      );
      finalLaps.push({
        ...trailingLap,
        lapNumber: finalLaps.length + 1,
        source: 'practice',
        recordedAt: new Date().toISOString()
      });
    } else if (finalLaps.length === 0) {
      // Fallback if stopped with minimal data
      const fallbackFrames = liveFramesBuffer.length >= 20 ? liveFramesBuffer : [];
      const fallbackLap = analyzeLapTelemetry(
        fallbackFrames,
        3800,
        wasCurrentLapRewoundRef.current
      );
      finalLaps.push({
        ...fallbackLap,
        lapNumber: 1,
        source: 'practice',
        recordedAt: new Date().toISOString()
      });
    }

    const durationSec = recordingStartTime 
      ? Math.max(1, Math.round((Date.now() - recordingStartTime) / 1000))
      : finalLaps.reduce((acc, l) => acc + l.lapTimeSec, 0);

    const bestLapTimeSec = finalLaps.reduce((best, l) => 
      (best === 0 || l.lapTimeSec < best) ? l.lapTimeSec : best
    , 0);

    const avgScore = finalLaps.length > 0 
      ? finalLaps.reduce((sum, l) => sum + (l.overallScore || 0), 0) / finalLaps.length 
      : 75;

    const hasAnyRewind = finalLaps.some(l => l.wasRewound);
    const stintId = `stint-${Date.now()}`;
    const stintNumber = stintHistory.length + 1;

    const newStint: StintSession = {
      stintId,
      stintNumber,
      title: metadata.title || `Practice Stint #${stintNumber}`,
      carName: metadata.carName || 'Formula Skip Barber 2000',
      trackName: metadata.trackName || 'Lime Rock Park - Full Circuit',
      source: 'practice',
      recordedAt: new Date().toISOString(),
      durationSec,
      totalLaps: finalLaps.length,
      bestLapTimeSec,
      avgScore,
      wasRewound: hasAnyRewind,
      laps: finalLaps.map(l => ({ ...l, stintId }))
    };

    const updatedStints = [newStint, ...stintHistory.filter(s => s.stintId !== stintId)];
    setStintHistory(updatedStints);
    saveStintHistory(updatedStints);

    setCurrentStint(newStint);
    if (newStint.laps.length > 0) {
      setCurrentLap(newStint.laps[0]);
    }

    // Reset recording state and clear all live ingest buffers to clean empty state
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecordingStartTime(null);
    setRecordingDurationSec(0);
    setActiveStintLaps([]);
    activeStintLapsRef.current = [];
    currentLapBufferRef.current = [];
    liveFramesWindowRef.current = [];
    setLiveFramesBuffer([]);
    setActiveLapBufferLength(0);
    setIsSaveModalOpen(false);

    // Smoothly transition to debrief
    setCurrentView('debrief');
  };

  const handleSkipAndSaveStint = () => {
    const nextStintNum = stintHistory.length + 1;
    const allFrames = [
      ...activeStintLaps.flatMap(l => l.frames || []),
      ...currentLapBufferRef.current,
      ...liveFramesBuffer
    ];
    const sampleFrame = allFrames.find(f => f.carOrdinal !== undefined && f.carOrdinal > 0);
    const detectedCar = sampleFrame
      ? resolveForzaCar(sampleFrame.carOrdinal, sampleFrame.carClass, sampleFrame.carPI)
      : (activeStintLaps.find(l => l.detectedCarName)?.detectedCarName || 'Formula Skip Barber 2000');
    
    const detectedTrackResult = detectTrackFromFrames(allFrames);
    const detectedTrack = detectedTrackResult !== 'Unknown Track'
      ? detectedTrackResult
      : (activeStintLaps.find(l => l.detectedTrackName)?.detectedTrackName || 'Lime Rock Park - Full Circuit');

    handleConfirmSaveStint({
      title: `Practice Stint #${nextStintNum}`,
      carName: detectedCar,
      trackName: detectedTrack
    });
  };

  const handleResetRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecordingStartTime(null);
    setRecordingDurationSec(0);
    setActiveStintLaps([]);
    activeStintLapsRef.current = [];
    currentLapBufferRef.current = [];
    liveFramesWindowRef.current = [];
    setLiveFramesBuffer([]);
    setActiveLapBufferLength(0);
    setIsSaveModalOpen(false);
  };

  const handleDeleteStint = (stintId: string) => {
    const updated = stintHistory.filter(s => s.stintId !== stintId);
    setStintHistory(updated);
    saveStintHistory(updated);
    if (currentStint?.stintId === stintId) {
      setCurrentStint(updated.length > 0 ? updated[0] : null);
      setCurrentLap(updated.length > 0 && updated[0].laps.length > 0 ? updated[0].laps[0] : null);
    }
  };

  const handleDeleteLapFromStint = (stintId: string, lapIndex: number) => {
    setStintHistory(prev => {
      const stintIndex = prev.findIndex(s => s.stintId === stintId);
      if (stintIndex === -1) return prev;

      const targetStint = prev[stintIndex];
      if (!targetStint.laps || targetStint.laps.length <= 1) return prev;

      const lapToDelete = targetStint.laps[lapIndex];
      const remainingLaps = targetStint.laps
        .filter((_, idx) => idx !== lapIndex)
        .map((l, idx) => ({ ...l, lapNumber: idx + 1 }));

      const bestLapTimeSec = Math.min(...remainingLaps.map(l => l.lapTimeSec));
      const avgScore = Math.round(remainingLaps.reduce((acc, l) => acc + (l.overallScore || 0), 0) / remainingLaps.length);
      const durationSec = remainingLaps.reduce((acc, l) => acc + l.lapTimeSec, 0);

      const updatedStint: StintSession = {
        ...targetStint,
        totalLaps: remainingLaps.length,
        bestLapTimeSec,
        avgScore,
        durationSec,
        laps: remainingLaps
      };

      const updatedStints = [...prev];
      updatedStints[stintIndex] = updatedStint;
      saveStintHistory(updatedStints);

      // Update currentStint and currentLap if active
      if (currentStint?.stintId === stintId) {
        setCurrentStint(updatedStint);
        const newSelectedIdx = Math.min(lapIndex, remainingLaps.length - 1);
        setCurrentLap(remainingLaps[newSelectedIdx]);
      }

      // Also remove from savedLaps if lapId matched
      if (lapToDelete?.lapId) {
        setSavedLaps(prevLaps => {
          const filteredLaps = prevLaps.filter(l => l.lapId !== lapToDelete.lapId);
          saveLapHistory(filteredLaps);
          return filteredLaps;
        });
      }

      return updatedStints;
    });
  };

  // --- Academy Lap Handlers ---
  const handleSaveAcademyStint = (stint: StintSession) => {
    setStintHistory(prev => {
      const filtered = prev.filter(s => s.stintId !== stint.stintId);
      const updated = [stint, ...filtered];
      saveStintHistory(updated);
      return updated;
    });
    setCurrentStint(stint);

    if (stint.laps && stint.laps.length > 0) {
      const bestLap = stint.laps.reduce((best, l) => (best.lapTimeSec < l.lapTimeSec ? best : l), stint.laps[0]);
      setCurrentLap(bestLap);
      setSavedLaps(prev => {
        const filtered = prev.filter(l => !stint.laps.some(sl => sl.lapId === l.lapId));
        const updated = [...stint.laps, ...filtered];
        saveLapHistory(updated);
        return updated;
      });
    }
  };

  const handleSaveLap = (lap: LapAnalysis) => {
    setCurrentLap(lap);
    setSavedLaps(prev => {
      const filtered = prev.filter(l => l.lapId !== lap.lapId);
      const updated = [lap, ...filtered];
      saveLapHistory(updated);
      return updated;
    });

    // Also wrap in a StintSession for Academy debrief
    const acadStintId = `stint-acad-${lap.lapId}`;
    const acadStint: StintSession = {
      stintId: acadStintId,
      stintNumber: stintHistory.length + 1,
      title: lap.sessionTitle || `Module ${lap.moduleNumber || 1} Academy Session`,
      carName: 'Formula Skip Barber 2000',
      trackName: 'Lime Rock Park - Full Circuit',
      source: 'academy',
      recordedAt: lap.recordedAt || new Date().toISOString(),
      durationSec: lap.lapTimeSec || 60,
      totalLaps: 1,
      bestLapTimeSec: lap.lapTimeSec,
      avgScore: lap.overallScore,
      laps: [{ ...lap, stintId: acadStintId }],
      moduleNumber: lap.moduleNumber,
      moduleTitle: lap.moduleTitle,
      sessionId: lap.sessionId,
      sessionTitle: lap.sessionTitle
    };

    setStintHistory(prev => {
      const filtered = prev.filter(s => s.stintId !== acadStintId);
      const updated = [acadStint, ...filtered];
      saveStintHistory(updated);
      return updated;
    });
    setCurrentStint(acadStint);
  };

  const handleChallengePassed = (
    result: ChallengeResult,
    nextSessionId: string | null,
    attempt?: import('./types/curriculum').ChallengeAttempt
  ) => {
    if (!activeSessionSelection) return;
    const updated = recordChallengeCompletion(
      progress,
      activeSessionSelection.session.id,
      nextSessionId,
      result,
      attempt
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
        }}
        isUdpConnected={isUdpConnected}
        isBridgeConnected={isBridgeConnected}
        totalMasteredModules={progress.graduatedModuleIds.length}
        networkInfo={networkInfo}
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
              onSaveStint={handleSaveAcademyStint}
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
            isRecording={isRecording}
            isRewinding={isRewinding}
            recordingDurationSec={recordingDurationSec}
            recordedLapsCount={activeStintLaps.length}
            activeLapBufferLength={activeLapBufferLength}
            onStartRecording={handleStartRecording}
            onRequestStopRecording={handleRequestStopRecording}
            onResetRecording={handleResetRecording}
          />
        )}

        {currentView === 'debrief' && (
          <DebriefView
            savedStints={stintHistory}
            currentStint={currentStint}
            onSelectStint={(stint) => {
              setCurrentStint(stint);
              if (stint.laps.length > 0) {
                setCurrentLap(stint.laps[0]);
              }
            }}
            onDeleteStint={handleDeleteStint}
            onDeleteLapFromStint={handleDeleteLapFromStint}
            savedLaps={savedLaps}
            currentLap={currentLap}
            onSelectLap={setCurrentLap}
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
            savedStints={stintHistory}
            onSelectLapForDebrief={(lap) => {
              setCurrentLap(lap);
              setCurrentView('debrief');
            }}
            onSelectStintForDebrief={(stint) => {
              setCurrentStint(stint);
              if (stint.laps.length > 0) {
                setCurrentLap(stint.laps[0]);
              }
              setCurrentView('debrief');
            }}
          />
        )}
      </main>

      {/* Save Stint Metadata Modal */}
      {(() => {
        const candidateFrames = [
          ...activeStintLaps.flatMap(l => l.frames || []),
          ...currentLapBufferRef.current,
          ...liveFramesBuffer
        ];
        const sampleFrame = candidateFrames.find(f => f.carOrdinal !== undefined && f.carOrdinal > 0);
        const resolvedCar = sampleFrame
          ? resolveForzaCar(sampleFrame.carOrdinal, sampleFrame.carClass, sampleFrame.carPI)
          : activeStintLaps.find(l => l.detectedCarName)?.detectedCarName;
        const resolvedTrack = detectTrackFromFrames(candidateFrames);
        const detectedTrack = resolvedTrack !== 'Unknown Track'
          ? resolvedTrack
          : activeStintLaps.find(l => l.detectedTrackName)?.detectedTrackName;

        return (
          <StintMetadataModal
            isOpen={isSaveModalOpen}
            stintNumber={stintHistory.length + 1}
            durationSec={recordingDurationSec}
            detectedCarName={resolvedCar}
            detectedTrackName={detectedTrack}
            laps={
              activeStintLaps.length > 0
                ? activeStintLaps
                : [analyzeLapTelemetry(currentLapBufferRef.current.length >= 20 ? currentLapBufferRef.current : liveFramesBuffer)]
            }
            onSave={handleConfirmSaveStint}
            onSkip={handleSkipAndSaveStint}
          />
        );
      })()}
    </div>
  );
}

export default App;

