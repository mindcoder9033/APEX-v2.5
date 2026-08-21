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
  GripHorizontal
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
  onStartRecording: () => void;
  onRequestStopRecording: () => void;
  onResetRecording: () => void;
}

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
  onStartRecording,
  onRequestStopRecording,
  onResetRecording
}) => {
  const hasLiveData = isUdpConnected && liveFrame !== null;

  // View Customizer & Preset Layout State
  const [layout, setLayout] = useState<PracticeViewLayout>(() => loadPracticeViewLayout());
  const [isEditMode, setIsEditMode] = useState(false);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0E] space-y-6">
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
                ? `Recording active • Current Lap: #${recordedLapsCount + 1} (${activeLapBufferLength} frames) • Elapsed: ${formatTimer(recordingDurationSec)}`
                : hasLiveData 
                ? 'UDP 60Hz stream ready • Click Start Recording when ready to begin stint'
                : 'UDP socket listening on 0.0.0.0:5300 (Bridge ws://localhost:5301)'}
            </p>
          </div>
        </div>

        {/* Action Controls: Start Recording / Stop Recording / Reset */}
        <div className="flex items-center space-x-2.5">
          {isRecording && (
            <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 bg-[#0D0D14] border border-[#262638] mr-1">
              <div className="flex items-center space-x-1 text-slate-300 text-xs font-mono">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatTimer(recordingDurationSec)}</span>
              </div>
              <div className="h-3 w-px bg-[#262638]" />
              <div className="flex items-center space-x-1 text-slate-300 text-xs font-mono">
                <Award className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>{recordedLapsCount} {recordedLapsCount === 1 ? 'lap' : 'laps'}</span>
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
              title={isUdpConnected ? "Begin recording multi-lap stint" : "Waiting for active UDP telemetry to begin recording"}
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
