import React, { useRef, useEffect, useState } from 'react';
import { TelemetryFrame } from '../../types/telemetry';

interface TelemetryTracesProps {
  frames: TelemetryFrame[];
  comparisonFrames?: TelemetryFrame[];
  cursorDistance: number;
  onCursorChange?: (distance: number) => void;
  height?: number;
}

export const TelemetryTraces: React.FC<TelemetryTracesProps> = ({
  frames,
  comparisonFrames,
  cursorDistance,
  onCursorChange,
  height = 320
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverFrame, setHoverFrame] = useState<TelemetryFrame | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear background
    ctx.fillStyle = '#0E0E16';
    ctx.fillRect(0, 0, w, h);

    if (frames.length < 2) {
      ctx.fillStyle = '#6E6E82';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No telemetry frames recorded for this lap.', w / 2, h / 2);
      return;
    }

    const maxDist = frames[frames.length - 1].distance || 3800;

    // Subdivided channels layout
    const speedH = h * 0.40;
    const pedalH = h * 0.35;
    const steerH = h * 0.25;

    const ySpeed = 0;
    const yPedal = speedH;
    const ySteer = speedH + pedalH;

    // Grid lines & labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal separators
    ctx.beginPath();
    ctx.moveTo(0, yPedal);
    ctx.lineTo(w, yPedal);
    ctx.moveTo(0, ySteer);
    ctx.lineTo(w, ySteer);
    ctx.stroke();

    // Distance grid lines
    const distStep = 500;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    for (let d = distStep; d < maxDist; d += distStep) {
      const x = (d / maxDist) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillText(`${d}m`, x + 3, h - 4);
    }

    // Channel 1: Speed (0 - 280 km/h)
    ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.fillText('SPEED (km/h)', 8, ySpeed + 14);

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const x = (f.distance / maxDist) * w;
      const y = ySpeed + speedH - (Math.min(280, f.speedKph) / 280) * (speedH - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Comparison lap speed if available (dashed gray)
    if (comparisonFrames && comparisonFrames.length > 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < comparisonFrames.length; i++) {
        const f = comparisonFrames[i];
        const x = (f.distance / maxDist) * w;
        const y = ySpeed + speedH - (Math.min(280, f.speedKph) / 280) * (speedH - 20) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Channel 2: Throttle (Green) & Brake (F1 Red)
    ctx.fillStyle = '#00FF66';
    ctx.fillText('THROTTLE (0-100%)', 8, yPedal + 14);
    ctx.fillStyle = '#FF1801';
    ctx.fillText('BRAKE (0-100%)', 140, yPedal + 14);

    // Draw Throttle
    ctx.strokeStyle = '#00FF66';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const x = (f.distance / maxDist) * w;
      const y = yPedal + pedalH - f.throttle * (pedalH - 22) - 8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Brake (Filled red trace)
    ctx.strokeStyle = '#FF1801';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const x = (f.distance / maxDist) * w;
      const y = yPedal + pedalH - f.brake * (pedalH - 22) - 8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Channel 3: Steering Angle (-1.0 to +1.0)
    ctx.fillStyle = '#FFAA00';
    ctx.fillText('STEERING LOCK (L / R)', 8, ySteer + 14);

    // Center baseline for steering
    const midSteerY = ySteer + steerH / 2;
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, midSteerY);
    ctx.lineTo(w, midSteerY);
    ctx.stroke();

    ctx.strokeStyle = '#FFAA00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const x = (f.distance / maxDist) * w;
      const y = midSteerY - f.steering * (steerH / 2 - 10);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Scrub cursor line
    if (cursorDistance >= 0 && cursorDistance <= maxDist) {
      const cursorX = (cursorDistance / maxDist) * w;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Find closest frame to cursor
      const closest = frames.reduce((prev, curr) => 
        Math.abs(curr.distance - cursorDistance) < Math.abs(prev.distance - cursorDistance) ? curr : prev
      );
      setHoverFrame(closest);
    }
  }, [frames, comparisonFrames, cursorDistance, height]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxDist = frames[frames.length - 1].distance || 3800;
    const dist = (x / rect.width) * maxDist;
    if (onCursorChange) {
      onCursorChange(Math.max(0, Math.min(maxDist, dist)));
    }
  };

  return (
    <div className="bg-[#0E0E16] rounded-2xl border border-[#232332] p-4 flex flex-col space-y-2 relative shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-racing font-bold text-white uppercase tracking-wider text-xs">Synchronized Lap Telemetry</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-[11px] text-[#00F0FF] tabular-nums font-semibold">Speed: {hoverFrame?.speedKph.toFixed(0) || '0'} km/h</span>
          <span className="font-mono text-[11px] text-[#00FF66] tabular-nums font-semibold">Thr: {((hoverFrame?.throttle || 0) * 100).toFixed(0)}%</span>
          <span className="font-mono text-[11px] text-[#FF1801] tabular-nums font-semibold">Brk: {((hoverFrame?.brake || 0) * 100).toFixed(0)}%</span>
          <span className="font-mono text-[11px] text-[#FFAA00] tabular-nums font-semibold">Steer: {((hoverFrame?.steering || 0) * 100).toFixed(0)}%</span>
          <span className="font-mono text-[11px] text-purple-400 tabular-nums font-semibold">LatG: {hoverFrame?.latG.toFixed(2) || '0.00'}G</span>
        </div>
        <div className="text-[11px] font-mono text-[#8E8E9F] tabular-nums">
          Dist: <strong className="text-white font-mono">{cursorDistance.toFixed(0)}m</strong>
        </div>
      </div>

      <div className="relative w-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          className="w-full rounded-xl border border-[#1F1F2C]"
          style={{ height: `${height}px` }}
        />
      </div>
    </div>
  );
};
