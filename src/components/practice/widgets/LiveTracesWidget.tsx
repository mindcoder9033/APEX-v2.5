import React, { useRef, useEffect } from 'react';
import { TelemetryFrame } from '../../../types/telemetry';
import { Activity, Gauge } from 'lucide-react';

interface LiveTracesWidgetProps {
  frames: TelemetryFrame[];
  currentFrame: TelemetryFrame | null;
}

export const LiveTracesWidget: React.FC<LiveTracesWidgetProps> = ({ frames, currentFrame }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear background
    ctx.fillStyle = '#0D0D14';
    ctx.fillRect(0, 0, w, h);

    // Keep rolling window of last 240 frames (~4-8 seconds depending on frame rate)
    const windowSize = 240;
    const displayFrames = frames.slice(-windowSize);

    if (displayFrames.length < 2) {
      ctx.fillStyle = '#6E6E82';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting live telemetry packets to draw traces...', w / 2, h / 2);
      return;
    }

    // Grid layout: 3 subdivisions (Speed, Pedals, Steer)
    const speedH = h * 0.42;
    const pedalH = h * 0.36;
    const steerH = h * 0.22;

    const ySpeed = 0;
    const yPedal = speedH;
    const ySteer = speedH + pedalH;

    // Background horizontal divider lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, yPedal);
    ctx.lineTo(w, yPedal);
    ctx.moveTo(0, ySteer);
    ctx.lineTo(w, ySteer);
    ctx.stroke();

    // Time-based vertical grid markers
    const totalPoints = displayFrames.length;
    const gridStep = 40;
    for (let i = 0; i < totalPoints; i += gridStep) {
      const x = (i / (windowSize - 1)) * w;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // --- Channel 1: Speed (0 - 300 km/h) ---
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SPEED (0-300 km/h)', 8, ySpeed + 12);

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < displayFrames.length; i++) {
      const f = displayFrames[i];
      const x = ((i + (windowSize - displayFrames.length)) / (windowSize - 1)) * w;
      const normSpeed = Math.min(300, Math.max(0, f.speedKph)) / 300;
      const y = ySpeed + speedH - 4 - normSpeed * (speedH - 18);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // --- Channel 2: Throttle & Brake Pedals (0 - 100%) ---
    ctx.fillStyle = 'rgba(0, 255, 102, 0.7)';
    ctx.fillText('THROTTLE', 8, yPedal + 12);
    ctx.fillStyle = 'rgba(255, 24, 1, 0.7)';
    ctx.fillText('BRAKE', 72, yPedal + 12);

    // Throttle trace (green)
    ctx.strokeStyle = '#00FF66';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < displayFrames.length; i++) {
      const f = displayFrames[i];
      const x = ((i + (windowSize - displayFrames.length)) / (windowSize - 1)) * w;
      const y = yPedal + pedalH - 4 - Math.min(1, Math.max(0, f.throttle)) * (pedalH - 18);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Brake trace (red)
    ctx.strokeStyle = '#FF1801';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < displayFrames.length; i++) {
      const f = displayFrames[i];
      const x = ((i + (windowSize - displayFrames.length)) / (windowSize - 1)) * w;
      const y = yPedal + pedalH - 4 - Math.min(1, Math.max(0, f.brake)) * (pedalH - 18);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // --- Channel 3: Steering Angle (-100% Left to +100% Right) ---
    ctx.fillStyle = 'rgba(234, 179, 8, 0.7)';
    ctx.fillText('STEERING (L / R)', 8, ySteer + 12);

    // Center zero line
    const midSteerY = ySteer + steerH / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, midSteerY);
    ctx.lineTo(w, midSteerY);
    ctx.stroke();

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < displayFrames.length; i++) {
      const f = displayFrames[i];
      const x = ((i + (windowSize - displayFrames.length)) / (windowSize - 1)) * w;
      // steering is -1.0 to +1.0
      const steerNorm = Math.min(1, Math.max(-1, f.steering));
      const y = midSteerY - (steerNorm * (steerH - 16) / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

  }, [frames]);

  return (
    <div className="p-5 bg-[#12121A] border border-[#232332] flex flex-col justify-between shadow-lg hud-bracket h-[290px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-xs font-racing font-bold text-white uppercase tracking-wider">
            Live Rolling Telemetry Traces
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <span className="text-[#00F0FF]">{currentFrame ? `${currentFrame.speedKph.toFixed(0)} km/h` : '0 km/h'}</span>
          <span className="text-[#00FF66]">T: {currentFrame ? `${(currentFrame.throttle * 100).toFixed(0)}%` : '0%'}</span>
          <span className="text-[#FF1801]">B: {currentFrame ? `${(currentFrame.brake * 100).toFixed(0)}%` : '0%'}</span>
          <span className="text-amber-400">S: {currentFrame ? `${(currentFrame.steering * 100).toFixed(0)}%` : '0%'}</span>
        </div>
      </div>
      <div className="flex-1 w-full bg-[#0D0D14] border border-[#20202E] overflow-hidden relative">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
