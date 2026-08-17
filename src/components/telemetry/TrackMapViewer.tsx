import React, { useRef, useEffect } from 'react';
import { TelemetryFrame } from '../../types/telemetry';
import { DEFAULT_TRACK_CORNERS } from '../../engine/physicsEngine';

interface TrackMapViewerProps {
  frames: TelemetryFrame[];
  currentDistance: number;
  onCornerSelect?: (cornerIndex: number) => void;
}

export const TrackMapViewer: React.FC<TrackMapViewerProps> = ({
  frames,
  currentDistance,
  onCornerSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(canvas.clientWidth, canvas.clientHeight) || 240;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const w = size;
    const h = size;

    // Background
    ctx.fillStyle = '#0E0E16';
    ctx.fillRect(0, 0, w, h);

    if (frames.length < 5) {
      ctx.fillStyle = '#6E6E82';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for track data...', w / 2, h / 2);
      return;
    }

    // Find bounds of posX and posZ
    let minX = 99999, maxX = -99999, minZ = 99999, maxZ = -99999;
    frames.forEach(f => {
      if (f.posX < minX) minX = f.posX;
      if (f.posX > maxX) maxX = f.posX;
      if (f.posZ < minZ) minZ = f.posZ;
      if (f.posZ > maxZ) maxZ = f.posZ;
    });

    const rangeX = (maxX - minX) || 1;
    const rangeZ = (maxZ - minZ) || 1;
    const padding = 28;
    const scale = Math.min((w - padding * 2) / rangeX, (h - padding * 2) / rangeZ);

    const transformX = (x: number) => padding + (x - minX) * scale;
    const transformY = (z: number) => padding + (z - minZ) * scale;

    // Draw Track Line with Speed / Braking Color Heatmap
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < frames.length - 1; i++) {
      const f1 = frames[i];
      const f2 = frames[i + 1];

      // Red for heavy braking, Green for full throttle, Cyan for cruising
      if (f1.brake > 0.4) {
        ctx.strokeStyle = '#FF1801';
      } else if (f1.throttle > 0.7) {
        ctx.strokeStyle = '#00FF66';
      } else {
        ctx.strokeStyle = '#00F0FF';
      }

      ctx.beginPath();
      ctx.moveTo(transformX(f1.posX), transformY(f1.posZ));
      ctx.lineTo(transformX(f2.posX), transformY(f2.posZ));
      ctx.stroke();
    }

    // Draw Turn Markers
    const maxDist = frames[frames.length - 1].distance || 3800;
    DEFAULT_TRACK_CORNERS.forEach((c) => {
      const cornerApexDist = c.apexPct * maxDist;
      const closest = frames.reduce((prev, curr) =>
        Math.abs(curr.distance - cornerApexDist) < Math.abs(prev.distance - cornerApexDist) ? curr : prev
      );

      const tx = transformX(closest.posX);
      const ty = transformY(closest.posZ);

      // Badge
      ctx.fillStyle = '#E10600';
      ctx.beginPath();
      ctx.arc(tx, ty, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`T${c.index}`, tx, ty);
    });

    // Draw Current Vehicle Position
    if (currentDistance >= 0) {
      const currentPosFrame = frames.reduce((prev, curr) =>
        Math.abs(curr.distance - currentDistance) < Math.abs(prev.distance - currentDistance) ? curr : prev
      );

      const vx = transformX(currentPosFrame.posX);
      const vy = transformY(currentPosFrame.posZ);

      // Glow effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(vx, vy, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(vx, vy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [frames, currentDistance]);

  return (
    <div className="bg-[#0E0E16] rounded-2xl border border-[#232332] p-4 flex flex-col items-center shadow-lg">
      <div className="w-full flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-racing flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
          <span>Circuit GPS Map</span>
        </h4>
        <span className="text-[10px] font-tech font-bold uppercase tracking-wider text-slate-400">Watkins Glen GP</span>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full rounded-xl" />
      </div>

      <div className="w-full mt-3 pt-2 border-t border-[#20202E] flex items-center justify-around text-[11px] font-tech font-semibold tracking-wide">
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#FF1801]" />
          <span className="text-slate-400">Braking</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
          <span className="text-slate-400">Throttle</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
          <span className="text-slate-400">Coast/Turn</span>
        </span>
      </div>
    </div>
  );
};
