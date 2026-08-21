import React, { useState } from 'react';
import { TelemetryFrame } from '../../types/telemetry';
import { FrictionCirclePlot } from '../telemetry/FrictionCirclePlot';
import { TrackMapViewer } from '../telemetry/TrackMapViewer';
import { detectTrackFromFrames } from '../../engine/trackDetector';
import {
  DriverLevelPreset,
  WidgetId,
  WidgetConfig,
  PracticeViewLayout,
  PRESET_LAYOUTS,
  WIDGET_CATALOG
} from '../../types/widgets';
import { loadPracticeViewLayout, savePracticeViewLayout } from '../../db/storage';
import { ViewCustomizerControls } from './ViewCustomizerControls';
import { LiveTracesWidget } from './widgets/LiveTracesWidget';
import { SteeringBalanceWidget } from './widgets/SteeringBalanceWidget';
import { TireSuspensionWidget } from './widgets/TireSuspensionWidget';
import { LiveTimingWidget } from './widgets/LiveTimingWidget';
import {
  Radio,
  Square,
  WifiOff,
  Play,
  RotateCcw,
  CircleDot,
  Timer,
  Award,
  Rewind,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  X,
  GripHorizontal,
  Target,
  Flag,
  Plus,
  Infinity as InfinityIcon
} from 'lucide-react';

import { TelemetryWaitingOverlay } from '../telemetry/TelemetryWaitingOverlay';
import { NetworkInterfaceInfo } from '../../types/telemetry';

interface LivePracticeViewProps {
  isUdpConnected: boolean;
  liveFrame: TelemetryFrame | null;
  liveFramesBuffer: TelemetryFrame[];
  isRecording: boolean;
  isRewinding?: boolean;
  recordingDurationSec: number;
  recordedLapsCount: number;
  activeLapBufferLength: number;
  networkInfo?: NetworkInterfaceInfo | null;
  targetLaps: number | null;
  onSetTargetLaps: (laps: number | null) => void;
  onExtendTargetLaps: (additionalLaps: number) => void;
  isStintTargetReached: boolean;
  onStartRecording: () => void;
  onRequestStopRecording: () => void;
  onResetRecording: () => void;
}

const PRESET_LAP_OPTIONS = [1, 3, 5, 10];

export const LivePracticeView: React.FC<LivePracticeViewProps> = ({
  isUdpConnected,
  liveFrame,
  liveFramesBuffer,
  isRecording,
  isRewinding = false,
  recordingDurationSec,
  recordedLapsCount,
  activeLapBufferLength,
  networkInfo = null,
  targetLaps,
  onSetTargetLaps,
  onExtendTargetLaps,
  isStintTargetReached,
  onStartRecording,
  onRequestStopRecording,
  onResetRecording
}) => {
  const hasLiveData = isUdpConnected && liveFrame !== null;

  // View Customizer & Preset Layout State
  const [layout, setLayout] = useState<PracticeViewLayout>(() => loadPracticeViewLayout());
  const [isEditMode, setIsEditMode] = useState(false);

  // Custom Lap Target Input State
  const [isCustomTargetOpen, setIsCustomTargetOpen] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCustomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInputValue, 10);
    if (!isNaN(val) && val > 0 && val <= 99) {
      onSetTargetLaps(val);
      setIsCustomTargetOpen(false);
      setCustomInputValue('');
    }
  };

  // Layout Modification Handlers
  const handleSelectPreset = (preset: DriverLevelPreset) => {
    const updated: PracticeViewLayout = {
      preset,
      isCustom: false,
      widgets: [...PRESET_LAYOUTS[preset]]
    };
    setLayout(updated);
    savePracticeViewLayout(updated);
  };

  const handleResetPreset = () => {
    const updated: PracticeViewLayout = {
      preset: layout.preset,
      isCustom: false,
      widgets: [...PRESET_LAYOUTS[layout.preset]]
    };
    setLayout(updated);
    savePracticeViewLayout(updated);
  };

  const handleAddWidget = (widgetId: WidgetId) => {
    if (layout.widgets.some(w => w.id === widgetId)) return;
    const defaultSpan = WIDGET_CATALOG[widgetId]?.defaultSpan || 1;
    const updated: PracticeViewLayout = {
      ...layout,
      isCustom: true,
      widgets: [...layout.widgets, { id: widgetId, span: defaultSpan }]
    };
    setLayout(updated);
    savePracticeViewLayout(updated);
  };

  const handleRemoveWidget = (index: number) => {
    const newWidgets = layout.widgets.filter((_, i) => i !== index);
    const updated: PracticeViewLayout = {
      ...layout,
      isCustom: true,
      widgets: newWidgets
    };
    setLayout(updated);
    savePracticeViewLayout(updated);
  };

  const handleMoveWidget = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layout.widgets.length) return;

    const newWidgets = [...layout.widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;

    const updated: PracticeViewLayout = {
      ...layout,
      isCustom: true,
      widgets: newWidgets
    };
    setLayout(updated);
    savePracticeViewLayout(updated);
  };

  const handleToggleSpan = (index: number) => {
    const newWidgets = layout.widgets.map((w, i) => {
      if (i === index) {
        return { ...w, span: (w.span === 1 ? 2 : 1) as 1 | 2 };
      }
      return w;
    });

    const updated: PracticeViewLayout = {
      ...layout,
      isCustom: true,
      widgets: newWidgets
    };
    setLayout(updated);
    savePracticeViewLayout(updated);
  };

  // Render individual widget component by ID
  const renderWidgetContent = (widgetId: WidgetId) => {
    switch (widgetId) {
      case 'speedometer':
        return (
          <div className="p-6 bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center relative overflow-hidden shadow-lg group hover:border-[#00F0FF]/30 transition-all hud-bracket h-full min-h-[170px]">
            <span className="text-[10px] font-tech font-bold text-[#8E8E9F] uppercase tracking-widest">Current Speed</span>
            <div className="flex items-baseline space-x-1.5 my-2">
              <span className="text-5xl font-hud font-black text-[#00F0FF] hud-glow-cyan tabular-nums tracking-tight">
                {liveFrame ? liveFrame.speedKph.toFixed(0) : '0'}
              </span>
              <span className="text-xs font-tech font-bold text-slate-400 uppercase tracking-wider">km/h</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {liveFrame ? `${liveFrame.speedMph.toFixed(0)} mph` : '0 mph'}
            </span>
          </div>
        );

      case 'gearRpm':
        return (
          <div className="p-6 bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center shadow-lg group hover:border-amber-500/30 transition-all hud-bracket h-full min-h-[170px]">
            <span className="text-[10px] font-tech font-bold text-[#8E8E9F] uppercase tracking-widest">Gear & RPM</span>
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-5xl font-hud font-black text-amber-400 hud-glow-amber">
                {liveFrame ? (liveFrame.gear === 0 ? 'R' : liveFrame.gear === 11 ? 'N' : liveFrame.gear) : 'N'}
              </span>
              <span className="text-sm font-mono font-bold text-slate-300 tabular-nums">
                {liveFrame ? `${Math.round(liveFrame.rpm)} RPM` : '0 RPM'}
              </span>
            </div>
            <div className="w-full bg-[#1F1F2E] h-2 border border-[#2D2D3E] overflow-hidden mt-1">
              <div
                className="bg-gradient-to-r from-emerald-400 via-amber-400 to-[#E10600] h-full transition-all duration-75"
                style={{ width: `${Math.min(100, ((liveFrame?.rpm || 0) / 8000) * 100)}%` }}
              />
            </div>
          </div>
        );

      case 'pedals':
        return (
          <div className="p-6 bg-[#12121A] border border-[#232332] flex flex-col justify-center space-y-3 shadow-lg hud-bracket h-full min-h-[170px]">
            <div>
              <div className="flex justify-between text-[11px] font-tech font-bold uppercase tracking-wider mb-1">
                <span className="text-[#00FF66]">THROTTLE</span>
                <span className="text-white font-mono tabular-nums">{((liveFrame?.throttle || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#1E1E2C] h-2 border border-[#252535] overflow-hidden">
                <div
                  className="bg-[#00FF66] h-full transition-all duration-75 shadow-[0_0_8px_rgba(0,255,102,0.4)]"
                  style={{ width: `${(liveFrame?.throttle || 0) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-tech font-bold uppercase tracking-wider mb-1">
                <span className="text-[#FF1801]">BRAKE</span>
                <span className="text-white font-mono tabular-nums">{((liveFrame?.brake || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#1E1E2C] h-2 border border-[#252535] overflow-hidden">
                <div
                  className="bg-[#FF1801] h-full transition-all duration-75 shadow-[0_0_8px_rgba(255,24,1,0.4)]"
                  style={{ width: `${(liveFrame?.brake || 0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );

      case 'tractionBudget':
        return (
          <div className="p-6 bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center shadow-lg group hover:border-emerald-500/30 transition-all hud-bracket h-full min-h-[170px]">
            <span className="text-[10px] font-tech font-bold text-[#8E8E9F] uppercase tracking-widest">Traction Budget Utilization</span>
            <div className="flex items-baseline space-x-1 my-2">
              <span className="text-5xl font-hud font-black text-emerald-400 hud-glow-green tabular-nums">
                {liveFrame ? liveFrame.tractionBudgetPct.toFixed(0) : '0'}%
              </span>
            </div>
            <span className="text-[11px] font-mono text-purple-300 tabular-nums">
              Combined: {liveFrame ? `${liveFrame.combinedG.toFixed(2)}G` : '0.00G'} (Lat: {liveFrame ? `${liveFrame.latG.toFixed(2)}G` : '0.00G'})
            </span>
          </div>
        );

      case 'liveTiming':
        return (
          <LiveTimingWidget
            isRecording={isRecording}
            recordingDurationSec={recordingDurationSec}
            recordedLapsCount={recordedLapsCount}
            activeLapBufferLength={activeLapBufferLength}
            targetLaps={targetLaps}
          />
        );

      case 'steeringBalance':
        return <SteeringBalanceWidget currentFrame={liveFrame} />;

      case 'frictionCircle':
        return (
          <FrictionCirclePlot
            frames={liveFramesBuffer}
            currentFrame={liveFrame}
          />
        );

      case 'trackMap':
        return (
          <TrackMapViewer
            frames={liveFramesBuffer}
            currentDistance={liveFrame?.distance || 0}
            trackName={detectTrackFromFrames(liveFramesBuffer) !== 'Unknown Track' ? detectTrackFromFrames(liveFramesBuffer) : undefined}
          />
        );

      case 'telemetryTraces':
        return (
          <LiveTracesWidget
            frames={liveFramesBuffer}
            currentFrame={liveFrame}
          />
        );

      case 'tireSuspension':
        return <TireSuspensionWidget currentFrame={liveFrame} />;

      default:
        return null;
    }
  };

  const isPresetSelected = (val: number) => targetLaps === val;
  const isUnlimited = targetLaps === null;
  const isCustomActive = targetLaps !== null && !PRESET_LAP_OPTIONS.includes(targetLaps);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0E] space-y-6 relative">
      {/* Checkered Flag Stint Completion Celebration Banner */}
      {isStintTargetReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative p-8 max-w-lg w-full mx-4 bg-[#12121A] border-2 border-amber-400/80 shadow-[0_0_50px_rgba(251,191,36,0.3)] hud-bracket text-center">
            <div className="flex items-center justify-center space-x-2 text-amber-400 mb-3 animate-bounce">
              <Flag className="w-8 h-8 fill-current" />
              <span className="text-3xl font-racing font-black tracking-widest uppercase text-white">
                STINT COMPLETE
              </span>
              <Flag className="w-8 h-8 fill-current" />
            </div>

            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-amber-400 to-transparent my-3" />

            <h3 className="text-lg font-hud font-bold text-amber-300 tracking-wider">
              TARGET OF {recordedLapsCount} {recordedLapsCount === 1 ? 'LAP' : 'LAPS'} ACHIEVED!
            </h3>

            <p className="text-xs font-mono text-slate-400 mt-2">
              Telemetry recording & session timer locked • Stint Duration: {formatTimer(recordingDurationSec)}
            </p>

            <div className="mt-6 flex items-center justify-center space-x-2 text-xs font-mono text-[#00F0FF] animate-pulse">
              <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
              <span>Launching Session Debrief & Save Modal...</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Status Strip */}
      <div className="p-5 bg-[#12121A] border border-[#232332] flex flex-wrap items-center justify-between gap-4 shadow-xl hud-bracket">
        <div className="flex items-center space-x-3">
          <div className={`w-11 h-11 flex items-center justify-center border transition-colors ${
            isRewinding
              ? 'bg-amber-950/90 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : isRecording
              ? 'bg-red-950/80 border-[#E10600]/80 shadow-[0_0_15px_rgba(225,6,0,0.3)]'
              : hasLiveData 
              ? 'bg-emerald-950/60 border-emerald-500/40' 
              : 'bg-[#181824] border-[#2E2E40]'
          }`}>
            {isRewinding ? (
              <Rewind className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : isRecording ? (
              <CircleDot className="w-5 h-5 text-[#FF1801] animate-pulse" />
            ) : hasLiveData ? (
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            ) : (
              <WifiOff className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-sm font-racing font-bold text-white uppercase tracking-wider">
                Live Telemetry Ingest & Stint Recorder
              </h2>
              {isRewinding && (
                <span className="chamfer-badge text-[10px] font-mono font-bold px-2.5 py-0.5 border bg-amber-950/90 text-amber-300 border-amber-500/60 flex items-center space-x-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
                  <Rewind className="w-3 h-3 text-amber-400" />
                  <span>REWINDING BUFFER</span>
                </span>
              )}
              {isRecording && !isRewinding ? (
                <span className="chamfer-badge text-[10px] font-mono font-bold px-2.5 py-0.5 border bg-red-950/90 text-red-300 border-[#E10600]/60 flex items-center space-x-1.5 shadow-[0_0_10px_rgba(225,6,0,0.25)] animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E10600]" />
                  <span>RECORDING STINT</span>
                </span>
              ) : !isRecording && (
                <span className={`chamfer-badge text-[10px] font-mono font-bold px-2.5 py-0.5 border ${
                  hasLiveData
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-[#181824] text-slate-400 border-[#2A2A3C]'
                }`}>
                  {hasLiveData ? '60Hz Ingest Active' : 'Waiting for Telemetry Packets'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8E8E9F] font-sans mt-0.5">
              {isRewinding
                ? `Rewind detected • Rolling buffer back to synchronized state • Frames: ${activeLapBufferLength}`
                : isRecording 
                ? `Recording active • Current Lap: #${recordedLapsCount + 1}${targetLaps ? ` of ${targetLaps}` : ''} (${activeLapBufferLength} frames) • Elapsed: ${formatTimer(recordingDurationSec)}`
                : hasLiveData 
                ? (targetLaps ? `UDP 60Hz stream ready • Target: ${targetLaps} laps set • Click Start Recording to begin` : 'UDP 60Hz stream ready • Unlimited stint • Click Start Recording to begin')
                : 'UDP socket listening on 0.0.0.0:5300 (Bridge ws://localhost:5301)'}
            </p>
          </div>
        </div>

        {/* Action Controls: Target Lap Selector + Start/Stop Recording + Reset */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Lap Selector (Idle vs Active recording) */}
          {!isRecording ? (
            <div className="flex items-center space-x-1.5 bg-[#0D0D14] border border-[#232332] p-1 chamfer-badge">
              <span className="text-[10px] font-tech font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center space-x-1">
                <Target className="w-3 h-3 text-[#00F0FF]" />
                <span className="hidden md:inline">Target:</span>
              </span>

              {PRESET_LAP_OPTIONS.map((num) => {
                const active = isPresetSelected(num);
                return (
                  <button
                    key={num}
                    onClick={() => {
                      onSetTargetLaps(num);
                      setIsCustomTargetOpen(false);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono font-bold transition-all border ${
                      active
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/60 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-[#14141E] text-slate-400 border-transparent hover:text-white hover:bg-[#1C1C2A]'
                    }`}
                  >
                    {num}L
                  </button>
                );
              })}

              {/* Unlimited button */}
              <button
                onClick={() => {
                  onSetTargetLaps(null);
                  setIsCustomTargetOpen(false);
                }}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold transition-all border flex items-center space-x-1 ${
                  isUnlimited
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/60 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'bg-[#14141E] text-slate-400 border-transparent hover:text-white hover:bg-[#1C1C2A]'
                }`}
                title="Continuous recording until manually stopped"
              >
                <InfinityIcon className="w-3 h-3" />
                <span>Open</span>
              </button>

              {/* Custom Lap Input Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsCustomTargetOpen(!isCustomTargetOpen)}
                  className={`px-2 py-1 text-[11px] font-mono font-bold transition-all border ${
                    isCustomActive
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : 'bg-[#14141E] text-slate-400 border-transparent hover:text-white hover:bg-[#1C1C2A]'
                  }`}
                  title="Enter custom lap target"
                >
                  {isCustomActive ? `${targetLaps}L*` : 'Custom'}
                </button>

                {isCustomTargetOpen && (
                  <form
                    onSubmit={handleCustomInputSubmit}
                    className="absolute right-0 top-full mt-2 z-40 bg-[#12121A] border border-[#00F0FF]/60 p-2 shadow-2xl flex items-center space-x-1.5 w-40"
                  >
                    <input
                      type="number"
                      min={1}
                      max={99}
                      autoFocus
                      placeholder="e.g. 7"
                      value={customInputValue}
                      onChange={(e) => setCustomInputValue(e.target.value)}
                      className="w-16 bg-[#0D0D14] border border-[#2B2B3D] text-white text-xs font-mono px-2 py-1 focus:outline-none focus:border-[#00F0FF]"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 bg-[#00F0FF] text-black font-racing font-bold text-xs hover:bg-cyan-300 cursor-pointer"
                    >
                      Set
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomTargetOpen(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* Active Stint Target Status & Mid-Stint Modifiers */
            <div className="flex items-center space-x-2 bg-[#0D0D14] border border-[#2B2B3D] px-3 py-1.5">
              <div className="flex items-center space-x-2 text-xs font-mono">
                <Target className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="text-slate-300 font-bold">
                  {targetLaps ? `Lap ${recordedLapsCount + 1}/${targetLaps}` : `Lap ${recordedLapsCount + 1} (Unlimited)`}
                </span>
              </div>

              {/* Progress bar if target is set */}
              {targetLaps && (
                <div className="w-16 bg-[#1A1A26] h-1.5 border border-[#2D2D3E] overflow-hidden">
                  <div
                    className="bg-[#00F0FF] h-full transition-all duration-300 shadow-[0_0_6px_rgba(0,240,255,0.5)]"
                    style={{ width: `${Math.min(100, (recordedLapsCount / targetLaps) * 100)}%` }}
                  />
                </div>
              )}

              {/* Mid-Stint Lap Extender Quick Buttons */}
              <div className="flex items-center space-x-1 pl-2 border-l border-[#262638]">
                <button
                  onClick={() => onExtendTargetLaps(1)}
                  className="px-1.5 py-0.5 bg-[#181826] hover:bg-[#252538] text-[10px] font-mono text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 flex items-center space-x-0.5 cursor-pointer"
                  title="Extend stint target by 1 lap"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>1L</span>
                </button>
                <button
                  onClick={() => onExtendTargetLaps(2)}
                  className="px-1.5 py-0.5 bg-[#181826] hover:bg-[#252538] text-[10px] font-mono text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 flex items-center space-x-0.5 cursor-pointer"
                  title="Extend stint target by 2 laps"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>2L</span>
                </button>
                {targetLaps !== null && (
                  <button
                    onClick={() => onSetTargetLaps(null)}
                    className="px-1.5 py-0.5 bg-[#181826] hover:bg-[#252538] text-[10px] font-mono text-slate-300 border border-slate-700 hover:border-slate-500 flex items-center space-x-0.5 cursor-pointer"
                    title="Remove limit and switch to open unlimited stint"
                  >
                    <InfinityIcon className="w-2.5 h-2.5" />
                    <span>∞</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {isRecording && (
            <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 bg-[#0D0D14] border border-[#262638] mr-1">
              <div className="flex items-center space-x-1 text-slate-300 text-xs font-mono">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatTimer(recordingDurationSec)}</span>
              </div>
              <div className="h-3 w-px bg-[#262638]" />
              <div className="flex items-center space-x-1 text-slate-300 text-xs font-mono">
                <Award className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>
                  {recordedLapsCount} {recordedLapsCount === 1 ? 'lap' : 'laps'}
                  {targetLaps ? ` / ${targetLaps}` : ''}
                </span>
              </div>
            </div>
          )}

          {!isRecording ? (
            <button
              onClick={onStartRecording}
              disabled={!isUdpConnected}
              className={`chamfer-btn flex items-center space-x-2 px-5 py-2.5 text-xs font-racing font-bold tracking-wider transition-all border ${
                isUdpConnected
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 active:scale-95 cursor-pointer border-emerald-400/40'
                  : 'bg-[#121E17] text-emerald-700/60 border-[#1B2F23] cursor-not-allowed opacity-60'
              }`}
              title={isUdpConnected ? `Begin recording ${targetLaps ? `${targetLaps}-lap` : 'continuous'} stint` : "Waiting for active UDP telemetry to begin recording"}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={onRequestStopRecording}
              className="chamfer-btn flex items-center space-x-2 px-5 py-2.5 text-xs font-racing font-bold tracking-wider bg-[#E10600] hover:bg-[#FF1801] text-white shadow-lg shadow-red-950/60 active:scale-95 transition-all cursor-pointer border border-red-500/50"
              title="Finish stint, enter session details, and open Debrief"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Recording & Debrief</span>
            </button>
          )}

          <button
            onClick={onResetRecording}
            disabled={!isRecording && activeLapBufferLength === 0 && recordedLapsCount === 0}
            className={`chamfer-btn flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-racing font-semibold tracking-wide transition-all border ${
              isRecording || activeLapBufferLength > 0 || recordedLapsCount > 0
                ? 'bg-[#181824] hover:bg-[#222234] text-slate-300 hover:text-white border-[#2E2E42] cursor-pointer'
                : 'bg-[#12121A] text-slate-600 border-[#1E1E2A] cursor-not-allowed opacity-50'
            }`}
            title="Discard current recording buffer without saving"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {!isUdpConnected ? (
        <div className="flex-1 flex flex-col min-h-[460px] my-auto justify-center">
          <TelemetryWaitingOverlay
            networkInfo={networkInfo}
            isRecording={isRecording}
            recordingDurationSec={recordingDurationSec}
            recordedLapsCount={recordedLapsCount}
            onRequestStopRecording={onRequestStopRecording}
            onResetRecording={onResetRecording}
          />
        </div>
      ) : (
        <>
          {/* View Presets & Interactive Customizer Bar */}
          <ViewCustomizerControls
            layout={layout}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            onSelectPreset={handleSelectPreset}
            onResetPreset={handleResetPreset}
            onAddWidget={handleAddWidget}
          />

          {/* Dynamic Telemetry Widget Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
        {layout.widgets.map((widgetConfig, idx) => {
          const meta = WIDGET_CATALOG[widgetConfig.id];
          const spanClass = widgetConfig.span === 2
            ? 'col-span-1 md:col-span-2 lg:col-span-2'
            : 'col-span-1';

          return (
            <div
              key={`${widgetConfig.id}-${idx}`}
              className={`relative flex flex-col transition-all ${spanClass} ${
                isEditMode
                  ? 'ring-2 ring-[#00F0FF]/60 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                  : ''
              }`}
            >
              {/* Edit Mode Card Control Toolbar */}
              {isEditMode && (
                <div className="z-30 bg-[#0E0E16] border border-[#00F0FF]/80 px-3 py-1.5 flex items-center justify-between text-xs font-mono shadow-lg mb-1">
                  <div className="flex items-center space-x-2 text-white font-racing font-bold truncate">
                    <GripHorizontal className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="truncate">{meta?.title || widgetConfig.id}</span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Move Left */}
                    <button
                      onClick={() => handleMoveWidget(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-[#202030] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Right */}
                    <button
                      onClick={() => handleMoveWidget(idx, 'right')}
                      disabled={idx === layout.widgets.length - 1}
                      className="p-1 hover:bg-[#202030] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Width Toggle */}
                    <button
                      onClick={() => handleToggleSpan(idx)}
                      className="p-1 hover:bg-[#202030] text-amber-400 hover:text-amber-300 cursor-pointer"
                      title={widgetConfig.span === 1 ? 'Expand to Full Width (2 Cols)' : 'Shrink to Half Width (1 Col)'}
                    >
                      {widgetConfig.span === 1 ? (
                        <Maximize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Minimize2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Remove Widget */}
                    <button
                      onClick={() => handleRemoveWidget(idx)}
                      className="p-1 hover:bg-red-950 text-red-400 hover:text-red-300 cursor-pointer"
                      title="Remove Widget from Cockpit"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Widget Card */}
              <div className="flex-1 flex flex-col">
                {renderWidgetContent(widgetConfig.id)}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
};
