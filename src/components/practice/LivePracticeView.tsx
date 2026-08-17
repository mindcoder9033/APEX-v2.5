import React from 'react';
import { TelemetryFrame, LapAnalysis } from '../../types/telemetry';
import { analyzeLapTelemetry } from '../../engine/physicsEngine';
import { FrictionCirclePlot } from '../telemetry/FrictionCirclePlot';
import { TrackMapViewer } from '../telemetry/TrackMapViewer';
import { Radio, Square, WifiOff, CheckCircle2, Info } from 'lucide-react';

interface LivePracticeViewProps {
  isUdpConnected: boolean;
  liveFrame: TelemetryFrame | null;
  liveFramesBuffer: TelemetryFrame[];
  onFinishStint: (lap: LapAnalysis) => void;
}

export const LivePracticeView: React.FC<LivePracticeViewProps> = ({
  isUdpConnected,
  liveFrame,
  liveFramesBuffer,
  onFinishStint
}) => {
  const handleEndStint = () => {
    if (liveFramesBuffer.length < 20) return;
    const lapAnalysis = analyzeLapTelemetry(liveFramesBuffer);
    onFinishStint(lapAnalysis);
  };

  const hasLiveData = isUdpConnected && liveFrame !== null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0E] space-y-6">
      {/* Top Banner Status Strip */}
      <div className="p-5 rounded-2xl bg-[#12121A] border border-[#232332] flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            hasLiveData 
              ? 'bg-emerald-950/60 border-emerald-500/40' 
              : 'bg-[#181824] border-[#2E2E40]'
          }`}>
            {hasLiveData ? (
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            ) : (
              <WifiOff className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-racing font-bold text-white uppercase tracking-wider">
                Live Telemetry Ingest & Stint Recorder
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                hasLiveData
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#181822] text-slate-400 border-[#2A2A3C]'
              }`}>
                {hasLiveData ? '60Hz Ingest Active' : 'Waiting for Telemetry Packets'}
              </span>
            </div>
            <p className="text-xs text-[#8E8E9F] font-sans">
              {hasLiveData 
                ? 'Recording real-time Forza physics • Auto-segmented laps on completion'
                : 'UDP socket listening on 0.0.0.0:5300 (Bridge ws://localhost:5301)'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleEndStint}
            disabled={liveFramesBuffer.length < 20}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-racing font-bold tracking-wide transition-all shadow-lg ${
              liveFramesBuffer.length >= 20
                ? 'bg-[#E10600] hover:bg-[#FF1801] text-white shadow-red-950/60 active:scale-95 cursor-pointer'
                : 'bg-[#1C1C28] text-slate-500 border border-[#2A2A3C] cursor-not-allowed shadow-none'
            }`}
            title={liveFramesBuffer.length >= 20 ? 'Analyze and finish stint' : 'No recorded stint frames yet'}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Complete Stint & Open Debrief ({liveFramesBuffer.length} frames)</span>
          </button>
        </div>
      </div>

      {/* Disconnected UDP Setup Card */}
      {!hasLiveData && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#141420] via-[#101018] to-[#141420] border border-amber-500/30 shadow-lg space-y-4">
          <div className="flex items-center space-x-2.5 text-amber-400">
            <Info className="w-5 h-5" />
            <h3 className="text-sm font-racing font-bold uppercase tracking-wider">
              Connect Forza Motorsport Telemetry to Begin Live Practice
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl font-sans">
            APEX runs on live 60Hz vehicle telemetry from Forza Motorsport / Forza Horizon. To start streaming, go to <strong>Settings &gt; Gameplay / HUD &gt; Data Out</strong> in Forza:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#0C0C12] p-3.5 rounded-xl border border-[#202030]">
              <span className="text-slate-500 block text-[10px] font-tech uppercase tracking-wider font-semibold">Data Out</span>
              <strong className="text-emerald-400 text-sm font-hud font-bold">ON</strong>
            </div>
            <div className="bg-[#0C0C12] p-3.5 rounded-xl border border-[#202030]">
              <span className="text-slate-500 block text-[10px] font-tech uppercase tracking-wider font-semibold">Data Out IP Address</span>
              <strong className="text-[#00F0FF] text-sm font-mono block">192.168.1.41</strong>
              <span className="text-[9px] text-slate-400 font-sans">(or 127.0.0.1 for local PC)</span>
            </div>
            <div className="bg-[#0C0C12] p-3.5 rounded-xl border border-[#202030]">
              <span className="text-slate-500 block text-[10px] font-tech uppercase tracking-wider font-semibold">UDP Port</span>
              <strong className="text-amber-300 text-sm font-mono block">5300</strong>
            </div>
            <div className="bg-[#0C0C12] p-3.5 rounded-xl border border-[#202030]">
              <span className="text-slate-500 block text-[10px] font-tech uppercase tracking-wider font-semibold">Packet Format</span>
              <strong className="text-purple-300 text-sm font-hud-clean font-bold block">CarDash</strong>
            </div>
          </div>
        </div>
      )}

      {/* Primary Gauge Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Speedometer */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center relative overflow-hidden shadow-lg group hover:border-[#00F0FF]/30 transition-all">
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

        {/* Gear & RPM */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center shadow-lg group hover:border-amber-500/30 transition-all">
          <span className="text-[10px] font-tech font-bold text-[#8E8E9F] uppercase tracking-widest">Gear & RPM</span>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-5xl font-hud font-black text-amber-400 hud-glow-amber">
              {liveFrame ? (liveFrame.gear === 0 ? 'R' : liveFrame.gear === 11 ? 'N' : liveFrame.gear) : 'N'}
            </span>
            <span className="text-sm font-mono font-bold text-slate-300 tabular-nums">
              {liveFrame ? `${Math.round(liveFrame.rpm)} RPM` : '0 RPM'}
            </span>
          </div>
          <div className="w-full bg-[#1F1F2E] h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-gradient-to-r from-emerald-400 via-amber-400 to-[#E10600] h-full transition-all duration-75"
              style={{ width: `${Math.min(100, ((liveFrame?.rpm || 0) / 8000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Throttle & Brake Bars */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex flex-col justify-center space-y-3 shadow-lg">
          <div>
            <div className="flex justify-between text-[11px] font-tech font-bold uppercase tracking-wider mb-1">
              <span className="text-[#00FF66]">THROTTLE</span>
              <span className="text-white font-mono tabular-nums">{((liveFrame?.throttle || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-[#1E1E2C] h-2.5 rounded-full overflow-hidden">
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
            <div className="w-full bg-[#1E1E2C] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FF1801] h-full transition-all duration-75 shadow-[0_0_8px_rgba(255,24,1,0.4)]"
                style={{ width: `${(liveFrame?.brake || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Traction Budget & G-Forces */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center shadow-lg group hover:border-emerald-500/30 transition-all">
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
      </div>

      {/* Live Track & Friction Circle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FrictionCirclePlot
          frames={liveFramesBuffer}
          currentFrame={liveFrame}
        />
        <TrackMapViewer
          frames={liveFramesBuffer}
          currentDistance={liveFrame?.distance || 0}
        />
      </div>
    </div>
  );
};
