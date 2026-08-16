import React, { useState, useEffect } from 'react';
import { TelemetryFrame, LapAnalysis } from '../../types/telemetry';
import { generateSyntheticLapFrames } from '../../engine/telemetrySimulator';
import { analyzeLapTelemetry } from '../../engine/physicsEngine';
import { FrictionCirclePlot } from '../telemetry/FrictionCirclePlot';
import { TrackMapViewer } from '../telemetry/TrackMapViewer';
import { Radio, Play, Square, Activity, Gauge, Sparkles, RefreshCw } from 'lucide-react';

interface LivePracticeViewProps {
  isUdpConnected: boolean;
  onFinishStint: (lap: LapAnalysis) => void;
}

export const LivePracticeView: React.FC<LivePracticeViewProps> = ({
  isUdpConnected,
  onFinishStint
}) => {
  const [isRecording, setIsRecording] = useState(true);
  const [liveFrame, setLiveFrame] = useState<TelemetryFrame | null>(null);
  const [liveFramesBuffer, setLiveFramesBuffer] = useState<TelemetryFrame[]>([]);
  const [liveLapTime, setLiveLapTime] = useState(0);

  // Simulated live 60Hz telemetry ticker when not connected to UDP
  useEffect(() => {
    if (!isRecording) return;

    let frameIdx = 0;
    const simFrames = generateSyntheticLapFrames(1, { drivingStyle: 'pro' });

    const interval = setInterval(() => {
      if (frameIdx >= simFrames.length) {
        frameIdx = 0;
      }
      const current = simFrames[frameIdx];
      setLiveFrame(current);
      setLiveFramesBuffer(prev => [...prev.slice(-300), current]);
      setLiveLapTime(prev => prev + 0.05);
      frameIdx += 3; // step forward
    }, 50);

    return () => clearInterval(interval);
  }, [isRecording]);

  const handleEndStint = () => {
    setIsRecording(false);
    const fullFrames = liveFramesBuffer.length > 50 ? liveFramesBuffer : generateSyntheticLapFrames(1);
    const lapAnalysis = analyzeLapTelemetry(fullFrames);
    onFinishStint(lapAnalysis);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0E] space-y-6">
      {/* Top Banner Status Strip */}
      <div className="p-5 rounded-2xl bg-[#12121A] border border-[#232332] flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Telemetry Ingest & Stint Recorder</h2>
              <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                60Hz Active
              </span>
            </div>
            <p className="text-xs text-[#8E8E9F]">Silent background recording during driving • Auto-segmented laps</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleEndStint}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-lg shadow-red-950/60 transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Complete Stint & Open Debrief</span>
          </button>
        </div>
      </div>

      {/* Primary Gauge Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Speedometer */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
          <span className="text-[10px] font-mono text-[#8E8E9F] uppercase">Current Speed</span>
          <div className="flex items-baseline space-x-1 my-2">
            <span className="text-4xl font-display font-black text-[#00F0FF]">
              {liveFrame ? liveFrame.speedKph.toFixed(0) : '165'}
            </span>
            <span className="text-xs font-mono text-slate-400">km/h</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {liveFrame ? `${liveFrame.speedMph.toFixed(0)} mph` : '102 mph'}
          </span>
        </div>

        {/* Gear & RPM */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center shadow-lg">
          <span className="text-[10px] font-mono text-[#8E8E9F] uppercase">Gear & RPM</span>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-4xl font-display font-black text-amber-400">
              {liveFrame?.gear ? liveFrame.gear : '4'}
            </span>
            <span className="text-sm font-mono text-slate-300">
              {liveFrame ? `${liveFrame.rpm} RPM` : '6200 RPM'}
            </span>
          </div>
          <div className="w-full bg-[#1F1F2E] h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-gradient-to-r from-emerald-400 via-amber-400 to-[#E10600] h-full"
              style={{ width: `${Math.min(100, ((liveFrame?.rpm || 6000) / 8000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Throttle & Brake Bars */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex flex-col justify-center space-y-3 shadow-lg">
          <div>
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className="text-[#00FF66]">THROTTLE</span>
              <span className="text-white font-bold">{((liveFrame?.throttle || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-[#1E1E2C] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#00FF66] h-full transition-all duration-75"
                style={{ width: `${(liveFrame?.throttle || 0) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className="text-[#FF1801]">BRAKE</span>
              <span className="text-white font-bold">{((liveFrame?.brake || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-[#1E1E2C] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FF1801] h-full transition-all duration-75"
                style={{ width: `${(liveFrame?.brake || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Traction Budget & G-Forces */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#232332] flex flex-col items-center justify-center shadow-lg">
          <span className="text-[10px] font-mono text-[#8E8E9F] uppercase">Traction Budget Utilization</span>
          <div className="flex items-baseline space-x-1 my-2">
            <span className="text-4xl font-display font-black text-emerald-400">
              {liveFrame ? liveFrame.tractionBudgetPct.toFixed(0) : '88'}%
            </span>
          </div>
          <span className="text-[10px] font-mono text-purple-300">
            Combined: {liveFrame ? `${liveFrame.combinedG.toFixed(2)}G` : '1.28G'} (Lat: {liveFrame?.latG.toFixed(2)}G)
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
          frames={liveFramesBuffer.length > 10 ? liveFramesBuffer : generateSyntheticLapFrames(1)}
          currentDistance={liveFrame?.distance || 1200}
        />
      </div>
    </div>
  );
};
