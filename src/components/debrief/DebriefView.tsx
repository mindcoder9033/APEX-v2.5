import React, { useState, useEffect, useMemo } from 'react';
import { LapAnalysis, StintSession } from '../../types/telemetry';
import { Module, Session } from '../../types/curriculum';
import { TelemetryTraces } from '../telemetry/TelemetryTraces';
import { FrictionCirclePlot } from '../telemetry/FrictionCirclePlot';
import { TrackMapViewer } from '../telemetry/TrackMapViewer';
import { DiagnosticScorecard } from './DiagnosticScorecard';
import { ActionPlanCard } from '../adjust/ActionPlanCard';
import { AICoachPanel } from './AICoachPanel';
import { generateAICoachDebrief } from '../../engine/aiCoachEngine';
import { generateOfficialPdf, generateStintOfficialPdf } from '../../utils/pdfGenerator';
import { 
  Activity, FileDown, Radio, Award, Trash2, Clock, 
  Calendar, CheckCircle2, AlertCircle, ArrowRight, BookOpen, Play, Loader2,
  Car, MapPin, Star, Layers, X, Sparkles, Shield, BarChart3, Check, Bot, LineChart
} from 'lucide-react';

interface DebriefViewProps {
  savedStints: StintSession[];
  currentStint: StintSession | null;
  onSelectStint: (stint: StintSession) => void;
  onDeleteStint?: (stintId: string) => void;
  onDeleteLapFromStint?: (stintId: string, lapIndex: number) => void;
  // Legacy / fallback props
  savedLaps?: LapAnalysis[];
  currentLap?: LapAnalysis | null;
  onSelectLap?: (lap: LapAnalysis) => void;
  onDeleteLap?: (lapId: string) => void;
  module?: Module;
  session?: Session;
  onOpenPdfModal?: () => void;
  onNavigateToAcademy?: () => void;
  onNavigateToPractice?: () => void;
}

export const DebriefView: React.FC<DebriefViewProps> = ({
  savedStints,
  currentStint,
  onSelectStint,
  onDeleteStint,
  onDeleteLapFromStint,
  savedLaps = [],
  currentLap = null,
  onSelectLap,
  onDeleteLap,
  module,
  session,
  onOpenPdfModal,
  onNavigateToAcademy,
  onNavigateToPractice
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLapIndex, setSelectedLapIndex] = useState<number>(0);

  // Category tab state: 'academy' vs 'practice'
  const [activeCategory, setActiveCategory] = useState<'academy' | 'practice'>(() => {
    if (currentStint?.source === 'academy') return 'academy';
    const hasAcademy = savedStints.some(s => s.source === 'academy');
    return hasAcademy ? 'academy' : 'practice';
  });

  const [cursorDist, setCursorDist] = useState<number>(850);

  // Filter stints by category
  const academyStints = savedStints.filter(s => s.source === 'academy');
  const practiceStints = savedStints.filter(s => s.source === 'practice' || !s.source);
  const displayedStints = activeCategory === 'academy' ? academyStints : practiceStints;

  // Selected stint in the active view
  const activeSelectedStint = currentStint && displayedStints.some(s => s.stintId === currentStint.stintId)
    ? currentStint
    : displayedStints.length > 0
    ? displayedStints[0]
    : null;

  // Find the index of the fastest / best lap in activeSelectedStint
  const bestLapIndex = activeSelectedStint?.laps ? activeSelectedStint.laps.reduce((bestIdx, curLap, idx, arr) => {
    return curLap.lapTimeSec < arr[bestIdx].lapTimeSec ? idx : bestIdx;
  }, 0) : 0;

  // Reset selectedLapIndex when activeSelectedStint changes
  useEffect(() => {
    if (activeSelectedStint?.laps && activeSelectedStint.laps.length > 0) {
      setSelectedLapIndex(bestLapIndex);
    } else {
      setSelectedLapIndex(0);
    }
  }, [activeSelectedStint?.stintId]);

  // Handle opening PDF export
  const handleOpenPdfGeneration = () => {
    if (!activeSelectedStint || isGeneratingPdf) return;
    if (activeSelectedStint.laps && activeSelectedStint.laps.length > 1) {
      setShowExportModal(true);
    } else if (activeSelectedStint.laps && activeSelectedStint.laps.length === 1) {
      handleDownloadSingleLapPdf();
    }
  };

  const handleDownloadStintPdf = async () => {
    if (!activeSelectedStint || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateStintOfficialPdf(activeSelectedStint, module, session);
      setShowExportModal(false);
    } catch (err) {
      console.error('Failed to generate Stint PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadSingleLapPdf = async () => {
    const lapToExport = activeSelectedStint?.laps?.[selectedLapIndex] || selectedLap;
    if (!lapToExport || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateOfficialPdf(lapToExport, module, session, activeSelectedStint || undefined);
      setShowExportModal(false);
    } catch (err) {
      console.error('Failed to generate Single Lap PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Lap deletion state & auto-timeout
  const [confirmingDeleteLapIdx, setConfirmingDeleteLapIdx] = useState<number | null>(null);

  useEffect(() => {
    if (confirmingDeleteLapIdx !== null) {
      const timer = setTimeout(() => {
        setConfirmingDeleteLapIdx(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmingDeleteLapIdx]);

  const handleDeleteLapClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    if (confirmingDeleteLapIdx === idx) {
      if (onDeleteLapFromStint && activeSelectedStint) {
        onDeleteLapFromStint(activeSelectedStint.stintId, idx);
        setConfirmingDeleteLapIdx(null);
        if (selectedLapIndex >= idx && selectedLapIndex > 0) {
          setSelectedLapIndex(prev => prev - 1);
        }
      }
    } else {
      setConfirmingDeleteLapIdx(idx);
    }
  };

  // Selected lap inside the active stint
  const selectedLap: LapAnalysis | null = activeSelectedStint?.laps?.[selectedLapIndex] || activeSelectedStint?.laps?.[0] || currentLap || null;

  // Workspace sub-view mode: 'coach' | 'telemetry' | 'both'
  const [workspaceMode, setWorkspaceMode] = useState<'coach' | 'telemetry' | 'both'>('coach');
  const [focusedCornerIndex, setFocusedCornerIndex] = useState<number | null>(null);

  // Generate 100% local Skip Barber AI Coach Debrief
  const aiCoachDebrief = useMemo(() => {
    return generateAICoachDebrief(activeSelectedStint, selectedLap);
  }, [activeSelectedStint, selectedLap]);

  const handleFocusCornerFromCoach = (cornerIdx: number) => {
    setFocusedCornerIndex(cornerIdx);
    const targetCorner = selectedLap?.corners?.find(c => c.cornerIndex === cornerIdx);
    if (targetCorner) {
      setCursorDist(targetCorner.apexDistance);
    }
  };

  // Sync cursor when selectedLap changes
  useEffect(() => {
    if (selectedLap?.frames && selectedLap.frames.length > 0) {
      setCursorDist(selectedLap.frames[Math.floor(selectedLap.frames.length / 2)]?.distance || 850);
    }
  }, [selectedLap?.lapId, selectedLapIndex]);

  const closestFrame = selectedLap?.frames?.find(f => Math.abs(f.distance - cursorDist) < 15) || selectedLap?.frames?.[0] || null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent Stint';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent Stint';
    }
  };

  const formatLapTime = (sec?: number) => {
    if (!sec || isNaN(sec)) return '--:--.---';
    const mins = Math.floor(sec / 60);
    const remainder = (sec % 60).toFixed(3);
    return `${mins}:${remainder.padStart(6, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0E] overflow-hidden">
      {/* Top Header Category Switcher Bar */}
      <div className="px-6 py-3 border-b border-[#232332] bg-[#0E0E14] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#E10600] to-[#880400] flex items-center justify-center font-display font-black text-white text-xs shadow-md shadow-red-950">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-racing font-bold tracking-wider text-white">
              Telemetry & Debrief Workspace
            </h1>
            <p className="text-[11px] text-[#8E8E9F] font-sans">
              Recorded multi-lap vehicle stints, telemetry traces, friction circles, and Skip Barber corner diagnostics
            </p>
          </div>
        </div>

        {/* Category Tabs: Academy vs Live Practice */}
        <div className="flex items-center space-x-1.5 bg-[#14141E] p-1 border border-[#262638]">
          <button
            onClick={() => {
              setActiveCategory('academy');
              if (academyStints.length > 0) onSelectStint(academyStints[0]);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === 'academy'
                ? 'bg-[#E10600] text-white chamfer-tab shadow-md shadow-red-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1A28]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Curriculum Academy Stints</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 font-bold ${
              activeCategory === 'academy' ? 'bg-white/20 text-white' : 'bg-[#202030] text-slate-400'
            }`}>
              {academyStints.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('practice');
              if (practiceStints.length > 0) onSelectStint(practiceStints[0]);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === 'practice'
                ? 'bg-[#E10600] text-white chamfer-tab shadow-md shadow-red-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1A28]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Practice Stints</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 font-bold ${
              activeCategory === 'practice' ? 'bg-white/20 text-white' : 'bg-[#202030] text-slate-400'
            }`}>
              {practiceStints.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Split View: Left Stint List, Right Debrief Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Vertical Stint List */}
        <div className="w-80 lg:w-96 border-r border-[#232332] bg-[#0E0E14] flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-[#232332] flex items-center justify-between">
            <h2 className="text-xs font-tech font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              {activeCategory === 'academy' ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-[#E10600]" />
                  <span>Academy Recorded Stints</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Practice Stints</span>
                </>
              )}
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              {displayedStints.length} {displayedStints.length === 1 ? 'Stint' : 'Stints'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {displayedStints.length === 0 ? (
              <div className="p-6 text-center space-y-3 mt-8">
                <div className="w-12 h-12 mx-auto bg-[#161622] border border-[#262638] flex items-center justify-center text-slate-500">
                  {activeCategory === 'academy' ? <Award className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
                </div>
                <h3 className="text-xs font-bold text-slate-300">
                  No {activeCategory === 'academy' ? 'Academy' : 'Live Practice'} Stints Yet
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                  {activeCategory === 'academy'
                    ? 'Start a session in Curriculum Academy and complete a stint in Step 2 to view debrief telemetry.'
                    : 'Connect Forza Motorsport, start recording, and complete a stint in the Live Ingest & Practice tab.'}
                </p>
                {activeCategory === 'academy' && onNavigateToAcademy && (
                  <button
                    onClick={onNavigateToAcademy}
                    className="chamfer-btn px-4 py-2 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold shadow-md shadow-red-950/50 cursor-pointer transition-all"
                  >
                    Go to Academy
                  </button>
                )}
                {activeCategory === 'practice' && onNavigateToPractice && (
                  <button
                    onClick={onNavigateToPractice}
                    className="chamfer-btn px-4 py-2 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold shadow-md shadow-red-950/50 cursor-pointer transition-all"
                  >
                    Go to Live Practice
                  </button>
                )}
              </div>
            ) : (
              displayedStints.map((stint, idx) => {
                const isSelected = activeSelectedStint?.stintId === stint.stintId;
                const lapCount = stint.laps ? stint.laps.length : stint.totalLaps || 1;

                return (
                  <div
                    key={stint.stintId || idx}
                    onClick={() => onSelectStint(stint)}
                    className={`w-full text-left p-3.5 border transition-all relative overflow-hidden cursor-pointer group ${
                      isSelected
                        ? 'bg-[#181824] border-[#E10600] shadow-lg shadow-red-950/20'
                        : 'bg-[#12121A] border-[#222230] hover:bg-[#161622] hover:border-[#2D2D40]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E10600]" />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 min-w-0 pr-2">
                        {/* Stint Title / Module info + Lap Count Badge */}
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          {stint.source === 'academy' && stint.moduleNumber ? (
                            <span className="text-[10px] font-mono font-bold text-[#FF4D4D] bg-[#E10600]/10 px-1.5 py-0.5 border border-[#E10600]/30">
                              Mod {stint.moduleNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-500/30">
                              Practice
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 border border-[#00F0FF]/30 flex items-center space-x-1">
                            <Layers className="w-2.5 h-2.5" />
                            <span>{lapCount} {lapCount === 1 ? 'Lap' : 'Laps'}</span>
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[140px] block" title={stint.title || `Stint #${stint.stintNumber}`}>
                            {stint.title || `Stint #${stint.stintNumber}`}
                          </span>
                        </div>

                        {/* Car & Track Details */}
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2 truncate">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-2.5 h-2.5 text-[#E10600]" />
                            <span className="truncate max-w-[100px]">{stint.trackName || 'Lime Rock Park'}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Car className="w-2.5 h-2.5 text-slate-500" />
                            <span className="truncate max-w-[90px]">{stint.carName || 'Formula 2000'}</span>
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center space-x-2.5 pt-0.5 text-[11px] font-mono">
                          <span className="text-emerald-400 font-bold">Best: {formatLapTime(stint.bestLapTimeSec)}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-400 font-bold">{Math.round(stint.avgScore || 0)}% Score</span>
                        </div>

                        {/* Timestamp */}
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 pt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(stint.recordedAt)}</span>
                        </div>
                      </div>

                      {/* Right Delete Action */}
                      <div className="flex flex-col items-end space-y-2 shrink-0">
                        {onDeleteStint && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteStint(stint.stintId);
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-[#201518] transition-colors cursor-pointer"
                            title="Delete stint from history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Debrief Workspace for Selected Stint */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0A0A0E] space-y-6">
          {activeSelectedStint && selectedLap ? (
            <>
              {/* Debrief Header Banner */}
              <div className="p-6 bg-[#12121A] border border-[#232332] flex flex-wrap items-center justify-between gap-4 shadow-xl hud-bracket">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="bg-[#E10600] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 uppercase tracking-wider tabular-nums">
                      {activeSelectedStint.source === 'academy' ? 'Academy Stint Analysis' : 'Live Practice Stint'}
                    </span>
                    <span className="text-xs text-[#8E8E9F] font-tech uppercase tracking-wider font-semibold">
                      {activeSelectedStint.moduleNumber ? `Module ${activeSelectedStint.moduleNumber}: ${activeSelectedStint.moduleTitle}` : 'Multi-Lap Telemetry Debrief'}
                    </span>
                    <span className="text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 border border-[#00F0FF]/30">
                      {activeSelectedStint.laps.length} {activeSelectedStint.laps.length === 1 ? 'Lap Driven' : 'Laps Driven'}
                    </span>
                  </div>
                  <h2 className="text-xl font-racing font-bold text-white mt-1">
                    {activeSelectedStint.title || 'Skip Barber Telemetric Debrief & Corner Diagnosis'}
                  </h2>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1 font-sans flex-wrap">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-[#E10600]" />
                      <span className="text-slate-300 font-medium">{activeSelectedStint.trackName}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Car className="w-3 h-3 text-[#00F0FF]" />
                      <span className="text-slate-300 font-medium">{activeSelectedStint.carName}</span>
                    </span>
                    <span>•</span>
                    <span>{formatDate(activeSelectedStint.recordedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Mode Switcher: AI Coach vs Telemetry Traces vs Split View */}
                  <div className="flex items-center bg-[#14141E] p-1 border border-[#262638]">
                    <button
                      onClick={() => setWorkspaceMode('coach')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        workspaceMode === 'coach'
                          ? 'bg-[#00F0FF] text-black shadow-md shadow-cyan-950/40 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>AI Coach</span>
                    </button>
                    <button
                      onClick={() => setWorkspaceMode('telemetry')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        workspaceMode === 'telemetry'
                          ? 'bg-[#E10600] text-white shadow-md shadow-red-950/40 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LineChart className="w-3.5 h-3.5" />
                      <span>Telemetry Traces</span>
                    </button>
                    <button
                      onClick={() => setWorkspaceMode('both')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        workspaceMode === 'both'
                          ? 'bg-[#222234] text-white border border-[#3A3A52] font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Split View</span>
                    </button>
                  </div>

                  <button
                    onClick={handleOpenPdfGeneration}
                    disabled={isGeneratingPdf}
                    className="chamfer-btn flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#E10600] to-[#B30400] hover:from-[#FF1801] hover:to-[#E10600] disabled:opacity-80 disabled:cursor-wait text-white text-xs font-racing font-bold tracking-wide shadow-lg shadow-red-950/60 active:scale-95 transition-all cursor-pointer"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>{isGeneratingPdf ? 'Generating PDF...' : activeSelectedStint.laps.length > 1 ? `Generate PDF (${activeSelectedStint.laps.length} Laps)` : 'Generate Official PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Multi-Lap Switcher Pill Bar (Visible when Stint has 1 or more laps) */}
              <div className="p-3 bg-[#12121A] border border-[#232332] flex items-center justify-between flex-wrap gap-2 shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-tech font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 pl-1">
                    <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>Select Lap to Inspect:</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                  {activeSelectedStint.laps.map((lap, idx) => {
                    const isSelected = selectedLapIndex === idx;
                    const isBest = idx === bestLapIndex;
                    const isConfirming = confirmingDeleteLapIdx === idx;

                    return (
                      <div
                        key={lap.lapId || idx}
                        onClick={() => {
                          setSelectedLapIndex(idx);
                          if (confirmingDeleteLapIdx !== null && confirmingDeleteLapIdx !== idx) {
                            setConfirmingDeleteLapIdx(null);
                          }
                        }}
                        className={`chamfer-tab flex items-center space-x-1.5 px-3 py-1.5 text-xs font-racing font-bold tracking-wider transition-all cursor-pointer border select-none ${
                          isSelected
                            ? 'bg-[#E10600] text-white border-red-500 shadow-md shadow-red-950/50'
                            : 'bg-[#181824] text-slate-300 hover:text-white hover:bg-[#222234] border-[#2A2A3E]'
                        }`}
                      >
                        {isBest && (
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        )}
                        <span>Lap {lap.lapNumber || idx + 1}</span>
                        <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-black/30 text-white' : 'bg-black/20 text-slate-400'
                        }`}>
                          {formatLapTime(lap.lapTimeSec)}
                        </span>
                        {lap.wasRewound && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500/50 uppercase tracking-wide">
                            Rewound
                          </span>
                        )}
                        {isBest && (
                          <span className="text-[10px] font-sans uppercase font-bold text-amber-300">
                            (Best)
                          </span>
                        )}

                        {/* Inline Delete Button (Active when 2 or more laps exist) */}
                        {activeSelectedStint.laps.length > 1 && onDeleteLapFromStint && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteLapClick(e, idx)}
                            title={isConfirming ? 'Click again to confirm lap removal' : `Remove Lap ${lap.lapNumber || idx + 1} from stint`}
                            className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                              isConfirming
                                ? 'bg-red-950 text-red-200 border border-red-500 shadow-md animate-pulse'
                                : isSelected
                                ? 'bg-black/30 text-white/70 hover:text-white hover:bg-black/60'
                                : 'bg-black/20 text-slate-400 hover:text-red-400 hover:bg-red-950/40'
                            }`}
                          >
                            {isConfirming ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-red-400" />
                                <span>Confirm?</span>
                              </>
                            ) : (
                              <Trash2 className="w-2.5 h-2.5" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1. SKIP BARBER AI COACH VIEW */}
              {(workspaceMode === 'coach' || workspaceMode === 'both') && (
                <div className="p-1">
                  <AICoachPanel
                    debrief={aiCoachDebrief}
                    currentStint={activeSelectedStint}
                    activeLap={selectedLap}
                    onSelectCorner={handleFocusCornerFromCoach}
                    selectedCornerIndex={focusedCornerIndex}
                  />
                </div>
              )}

              {/* 2. RAW TELEMETRY & TRACES VIEW */}
              {(workspaceMode === 'telemetry' || workspaceMode === 'both') && (
                <div className="space-y-4 pt-2">
                  {workspaceMode === 'both' && (
                    <div className="border-t border-slate-800 pt-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <LineChart className="w-4 h-4 text-[#00F0FF]" />
                      Synchronized Telemetry Traces & Vehicle Dynamics
                    </div>
                  )}

                  {/* Summary KPI Strip for Current Selected Lap */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Lap Time</span>
                        {selectedLap.wasRewound && (
                          <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1 border border-amber-500/40">REWOUND</span>
                        )}
                      </div>
                      <strong className="text-base font-mono font-bold text-white tabular-nums">{formatLapTime(selectedLap.lapTimeSec)}</strong>
                    </div>
                    <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Peak Velocity</span>
                      <strong className="text-base font-hud-clean font-bold text-[#00F0FF] tabular-nums">{selectedLap.maxSpeedKph} <span className="text-xs font-tech">km/h</span></strong>
                    </div>
                    <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Traction Budget %</span>
                      <strong className="text-base font-hud-clean font-bold text-emerald-400 tabular-nums">{selectedLap.avgTractionBudgetPct}%</strong>
                    </div>
                    <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Max Lateral G</span>
                      <strong className="text-base font-mono font-bold text-purple-400 tabular-nums">{selectedLap.peakLatG}G</strong>
                    </div>
                    <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Max Braking G</span>
                      <strong className="text-base font-mono font-bold text-[#FF1801] tabular-nums">{selectedLap.peakBrakingG}G</strong>
                    </div>
                    <div className="bg-[#14141E] p-3.5 border border-[#232332] hud-bracket">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Mastery Grade</span>
                      <strong className="text-base font-hud-clean font-bold text-amber-400 tabular-nums">{selectedLap.overallScore}%</strong>
                    </div>
                  </div>

                  {/* Synchronized Lap Telemetry */}
                  <TelemetryTraces
                    frames={selectedLap.frames}
                    cursorDistance={cursorDist}
                    onCursorChange={setCursorDist}
                    height={280}
                  />

                  {/* G-G Friction Circle & Track Map */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FrictionCirclePlot frames={selectedLap.frames} currentFrame={closestFrame} />
                    <TrackMapViewer frames={selectedLap.frames} currentDistance={cursorDist} />
                  </div>

                  {/* Turn-by-Turn Diagnostics */}
                  <DiagnosticScorecard corners={selectedLap.corners} onFocusCorner={setCursorDist} />

                  {/* Action Plan */}
                  <ActionPlanCard actionItems={selectedLap.actionItems} />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[450px]">
              <div className="p-10 bg-[#12121A] border border-[#232332] text-center space-y-4 shadow-2xl max-w-lg mx-auto hud-bracket">
                <div className="w-16 h-16 mx-auto bg-[#181826] border border-[#2A2A3E] flex items-center justify-center">
                  <Radio className="w-8 h-8 text-slate-500 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white font-racing">No Stint Selected or Recorded</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {activeCategory === 'academy'
                    ? 'Start a session in Curriculum Academy and record a stint in Step 2 to view Skip Barber telemetric debriefing.'
                    : 'Connect Forza Motorsport, start recording, and complete a live practice stint to view real-time vehicle telemetry analytics.'}
                </p>
                <div className="pt-2 flex items-center justify-center space-x-3">
                  {activeCategory === 'academy' && onNavigateToAcademy && (
                    <button
                      onClick={onNavigateToAcademy}
                      className="chamfer-btn px-4 py-2 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold shadow-lg shadow-red-950/50 cursor-pointer transition-all"
                    >
                      Go to Curriculum Academy
                    </button>
                  )}
                  {activeCategory === 'practice' && onNavigateToPractice && (
                    <button
                      onClick={onNavigateToPractice}
                      className="chamfer-btn px-4 py-2 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold shadow-lg shadow-red-950/50 cursor-pointer transition-all"
                    >
                      Go to Live Practice
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* APEX PDF Export Choice Modal */}
      {showExportModal && activeSelectedStint && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E0E16] w-full max-w-2xl border border-[#2A2A3E] shadow-2xl flex flex-col overflow-hidden hud-bracket animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#232332] bg-[#12121A] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-[#E10600] to-[#900] flex items-center justify-center text-white shadow-lg shadow-red-950/50">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-racing tracking-wide flex items-center space-x-2">
                    <span>SELECT PDF EXPORT FORMAT</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#E10600]/20 text-[#FF4D4D] border border-[#E10600]/40 rounded uppercase font-bold">
                      {activeSelectedStint.laps.length} Laps Available
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Choose between a consolidated multi-lap stint dossier or an individual lap debrief
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isGeneratingPdf && setShowExportModal(false)}
                disabled={isGeneratingPdf}
                className="p-1.5 border border-[#2A2A3E] bg-[#181824] text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Two Choice Cards */}
            <div className="p-6 space-y-4 bg-[#0B0B12]">
              {/* Option 1: Consolidated Stint Dossier (Primary / Recommended) */}
              <div className="p-5 bg-[#141420] border-2 border-[#E10600]/70 hover:border-[#E10600] transition-all shadow-xl shadow-red-950/20 relative group">
                <div className="absolute top-3 right-3 flex items-center space-x-1.5 px-2.5 py-1 bg-[#E10600] text-white text-[10px] font-racing font-bold tracking-wider uppercase shadow">
                  <Sparkles className="w-3 h-3" />
                  <span>Recommended</span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded bg-[#E10600]/15 border border-[#E10600]/40 flex items-center justify-center text-[#FF4D4D] shrink-0 mt-0.5">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pr-24">
                    <h3 className="text-sm font-racing font-bold text-white tracking-wide">
                      Consolidated Stint Report (All {activeSelectedStint.laps.length} Laps)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                      Generates the comprehensive 11-page dossier consolidating all {activeSelectedStint.laps.length} recorded laps, dedicated AI Coach analysis, best vs. average telemetry trace overlays, sector splits, and stint consistency index.
                    </p>

                    {/* Metric badges strip */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] font-mono">
                      <span className="px-2 py-0.5 bg-[#1D1D2C] text-slate-300 border border-[#2C2C40]">
                        📊 {activeSelectedStint.laps.length} Laps Analyzed
                      </span>
                      <span className="px-2 py-0.5 bg-[#1D1D2C] text-red-400 border border-[#2C2C40]">
                        ★ Best: {formatLapTime(activeSelectedStint.bestLapTimeSec || activeSelectedStint.laps[bestLapIndex]?.lapTimeSec || 0)}
                      </span>
                      <span className="px-2 py-0.5 bg-[#1D1D2C] text-emerald-400 border border-[#2C2C40]">
                        ✓ Stint Score: {activeSelectedStint.avgScore || 85}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#232334] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-sans flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Full Skip Barber Stint Dossier</span>
                  </span>

                  <button
                    onClick={handleDownloadStintPdf}
                    disabled={isGeneratingPdf}
                    className="chamfer-btn flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#E10600] to-[#B30400] hover:from-[#FF1801] hover:to-[#E10600] text-white text-xs font-racing font-bold tracking-wide shadow-lg shadow-red-950/60 active:scale-95 disabled:opacity-75 disabled:cursor-wait cursor-pointer transition-all"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>{isGeneratingPdf ? 'Rendering PDF...' : `Download Stint Report (${activeSelectedStint.laps.length} Laps)`}</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Selected Lap Report Only */}
              <div className="p-5 bg-[#12121C] border border-[#28283C] hover:border-slate-500 transition-all">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded bg-[#1C1C2C] border border-[#32324A] flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-racing font-bold text-slate-200 tracking-wide">
                      Single Lap Debrief (Lap #{selectedLap ? (selectedLap.lapNumber || selectedLapIndex + 1) : (selectedLapIndex + 1)} Only)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                      Generates the standard 11-page deep-dive report with dedicated AI Coach analysis focused strictly on the currently inspected Lap #{selectedLap ? (selectedLap.lapNumber || selectedLapIndex + 1) : (selectedLapIndex + 1)} ({selectedLap ? formatLapTime(selectedLap.lapTimeSec) : '--:--'}).
                    </p>

                    {/* Metric badges strip */}
                    {selectedLap && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] font-mono">
                        <span className="px-2 py-0.5 bg-[#1A1A26] text-slate-300 border border-[#28283A]">
                          ⏱ Lap Time: {formatLapTime(selectedLap.lapTimeSec)}
                        </span>
                        <span className="px-2 py-0.5 bg-[#1A1A26] text-amber-400 border border-[#28283A]">
                          🏆 Technique: {selectedLap.overallScore}%
                        </span>
                        <span className="px-2 py-0.5 bg-[#1A1A26] text-blue-400 border border-[#28283A]">
                          🏎 Top Speed: {selectedLap.maxSpeedKph} km/h
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#202030] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-sans">
                    Single Lap Telemetry & Corner Notes
                  </span>

                  <button
                    onClick={handleDownloadSingleLapPdf}
                    disabled={isGeneratingPdf}
                    className="chamfer-btn flex items-center space-x-2 px-4 py-2 bg-[#1E1E2E] hover:bg-[#2A2A3E] text-slate-200 hover:text-white text-xs font-racing font-bold tracking-wide border border-[#3A3A52] active:scale-95 disabled:opacity-75 disabled:cursor-wait cursor-pointer transition-all"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    <span>Download Lap #{selectedLap ? (selectedLap.lapNumber || selectedLapIndex + 1) : (selectedLapIndex + 1)} Only</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#232332] bg-[#12121A] flex items-center justify-between text-xs text-slate-400 font-sans">
              <span>Both options generate high-DPI vector PDF dossiers formatted for A4 printing.</span>
              <button
                onClick={() => !isGeneratingPdf && setShowExportModal(false)}
                disabled={isGeneratingPdf}
                className="px-4 py-1.5 bg-transparent hover:bg-[#1E1E2C] text-slate-300 text-xs font-racing font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
