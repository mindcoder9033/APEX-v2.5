import React, { useRef, useEffect } from 'react';
import { TelemetryFrame, CornerTelemetryAnalysis } from '../../types/telemetry';
import { DEFAULT_TRACK_CORNERS } from '../../engine/physicsEngine';

interface TrackMapViewerProps {
  frames: TelemetryFrame[];
  currentDistance: number;
  corners?: CornerTelemetryAnalysis[];
  trackName?: string;
  onCornerSelect?: (cornerIndex: number) => void;
}

export const TrackMapViewer: React.FC<TrackMapViewerProps> = ({
  frames,
  currentDistance,
  corners,
  trackName = 'Circuit GPS Map',
  onCornerSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({ width: 240, height: 240, dpr: 1 });

  // Handle canvas sizing only on mount & container resize to prevent GPU buffer recreation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const size = Math.min(canvas.clientWidth, canvas.clientHeight) || 240;
      sizeRef.current = { width: size, height: size, dpr };
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Optimized draw loop using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const { width: size, dpr } = sizeRef.current;
      const w = size;
      const h = size;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = '#0E0E16';
      ctx.fillRect(0, 0, w, h);

      if (frames.length < 5) {
        ctx.fillStyle = '#6E6E82';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for track data...', w / 2, h / 2);
        ctx.restore();
        return;
      }

      // Find bounds of posX and posZ
      let minX = 99999, maxX = -99999, minZ = 99999, maxZ = -99999;
      // Subsample bounds search for high performance
      const boundsStep = Math.max(1, Math.floor(frames.length / 100));
      for (let i = 0; i < frames.length; i += boundsStep) {
        const f = frames[i];
        if (f.posX < minX) minX = f.posX;
        if (f.posX > maxX) maxX = f.posX;
        if (f.posZ < minZ) minZ = f.posZ;
        if (f.posZ > maxZ) maxZ = f.posZ;
      }

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

      const drawStep = Math.max(1, Math.floor(frames.length / 250));
      for (let i = 0; i < frames.length - drawStep; i += drawStep) {
        const f1 = frames[i];
        const f2 = frames[i + drawStep];

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

      // Draw Corner Markers
      const lastFrame = frames[frames.length - 1];
      const maxDist = (lastFrame && lastFrame.distance > 0) ? lastFrame.distance : 2414;

      if (corners && corners.length > 0) {
        corners.forEach((c) => {
          const cornerApexDist = c.apexDistance;
          const closest = frames.reduce((prev, curr) =>
            Math.abs(curr.distance - cornerApexDist) < Math.abs(prev.distance - cornerApexDist) ? curr : prev
          , frames[0]);

          if (closest) {
            const tx = transformX(closest.posX);
            const ty = transformY(closest.posZ);

            ctx.fillStyle = '#E10600';
            ctx.beginPath();
            ctx.arc(tx, ty, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 8px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`T${c.cornerIndex}`, tx, ty);
          }
        });
      } else {
        DEFAULT_TRACK_CORNERS.forEach((c) => {
          const cornerApexDist = c.apexPct * maxDist;
          const closest = frames.reduce((prev, curr) =>
            Math.abs(curr.distance - cornerApexDist) < Math.abs(prev.distance - cornerApexDist) ? curr : prev
          , frames[0]);

          if (closest) {
            const tx = transformX(closest.posX);
            const ty = transformY(closest.posZ);

            ctx.fillStyle = '#E10600';
            ctx.beginPath();
            ctx.arc(tx, ty, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 8px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`T${c.index}`, tx, ty);
          }
        });
      }

      // Draw Current Vehicle Position
      if (currentDistance >= 0 && frames.length > 0) {
        const currentPosFrame = frames.reduce((prev, curr) =>
          Math.abs(curr.distance - currentDistance) < Math.abs(prev.distance - currentDistance) ? curr : prev
        , frames[0]);

        if (currentPosFrame) {
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
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [frames, currentDistance, corners]);

  return (
    <div className="bg-[#0E0E16] border border-[#232332] p-4 flex flex-col items-center shadow-lg hud-bracket">
      <div className="w-full flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-racing flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 diamond-pip bg-[#00FF66]" />
          <span>Circuit GPS Map</span>
        </h4>
        <span className="text-[10px] font-tech font-bold uppercase tracking-wider text-slate-400 truncate max-w-[130px]" title={trackName}>
          {trackName}
        </span>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          onClick={(e) => {
            if (!onCornerSelect || !frames.length) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Find closest frame to click
            let closestFrame: TelemetryFrame | null = null;
            let minDist = Infinity;
            const lastFrame = frames[frames.length - 1];
            const maxDist = (lastFrame && lastFrame.distance > 0) ? lastFrame.distance : 2414;

            const padding = 28;
            let minX = 99999, maxX = -99999, minZ = 99999, maxZ = -99999;
            for (const f of frames) {
              if (f.posX < minX) minX = f.posX;
              if (f.posX > maxX) maxX = f.posX;
              if (f.posZ < minZ) minZ = f.posZ;
              if (f.posZ > maxZ) maxZ = f.posZ;
            }
            const scale = Math.min((rect.width - padding * 2) / (maxX - minX || 1), (rect.height - padding * 2) / (maxZ - minZ || 1));

            for (const f of frames) {
              const fx = padding + (f.posX - minX) * scale;
              const fy = padding + (f.posZ - minZ) * scale;
              const d = Math.hypot(fx - clickX, fy - clickY);
              if (d < minDist) {
                minDist = d;
                closestFrame = f;
              }
            }

            if (closestFrame && minDist < 30) {
              // Find matching corner index
              const clickDistance = closestFrame.distance;
              if (corners && corners.length > 0) {
                const cMatch = corners.reduce((prev, curr) =>
                  Math.abs(curr.apexDistance - clickDistance) < Math.abs(prev.apexDistance - clickDistance) ? curr : prev
                , corners[0]);
                if (cMatch) onCornerSelect(cMatch.cornerIndex);
              }
            }
          }}
        />
      </div>

      <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-[#1C1C28] text-[9px] text-[#6E6E82] font-mono">
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
          <span>Full Throttle</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
          <span>Coast/Turn</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF1801]" />
          <span>Trail Braking</span>
        </span>
      </div>
    </div>
  );
};
