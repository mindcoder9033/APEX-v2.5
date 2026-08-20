import React, { useRef, useEffect, useMemo } from 'react';
import { TelemetryFrame } from '../../types/telemetry';
import { downsampleTelemetryLOD, LOD_PRESETS } from '../../engine/lodDownsampler';

interface FrictionCirclePlotProps {
  frames: TelemetryFrame[];
  currentFrame?: TelemetryFrame | null;
  maxG?: number; // default e.g. 1.5G
}

export const FrictionCirclePlot: React.FC<FrictionCirclePlotProps> = ({
  frames,
  currentFrame,
  maxG = 1.6
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({ width: 240, height: 240, dpr: 1 });

  // Downsample to LOD summary level for crisp, instant G-G plot without rendering 30,000 redundant points
  const renderFrames = useMemo(() => {
    if (!frames || frames.length === 0) return [];
    if (frames.length <= LOD_PRESETS.SUMMARY) return frames;
    return downsampleTelemetryLOD(frames, LOD_PRESETS.SUMMARY);
  }, [frames]);

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
      ctx.save();
      ctx.scale(dpr, dpr);

      const center = size / 2;
      const radius = size * 0.42;

      // Background
      ctx.fillStyle = '#0E0E16';
      ctx.fillRect(0, 0, size, size);

      // Coordinate grid circles (0.5G, 1.0G, 1.4G)
      const gSteps = [0.5, 1.0, 1.4];
      ctx.lineWidth = 1;

      gSteps.forEach((g) => {
        const r = (g / maxG) * radius;
        ctx.strokeStyle = g === 1.4 ? 'rgba(225, 6, 0, 0.5)' : 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(center, center, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = g === 1.4 ? '#FF4D4D' : '#6E6E82';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(`${g.toFixed(1)}G`, center + 3, center - r + 9);
      });

      // Cross axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(center, 10);
      ctx.lineTo(center, size - 10);
      ctx.moveTo(10, center);
      ctx.lineTo(size - 10, center);
      ctx.stroke();

      // Axis Labels
      ctx.fillStyle = '#8E8E9F';
      ctx.font = '8px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ACCEL (+Y)', center, 14);
      ctx.fillText('BRAKING (-Y)', center, size - 4);
      ctx.fillText('LEFT', 20, center - 4);
      ctx.fillText('RIGHT', size - 20, center - 4);

      // Plot frame points in G-G space
      if (renderFrames.length > 0) {
        for (let i = 0; i < renderFrames.length; i++) {
          const f = renderFrames[i];
          const px = center + (f.latG / maxG) * radius;
          const py = center - (f.lonG / maxG) * radius;

          const util = f.tractionBudgetPct;
          if (util > 95) {
            ctx.fillStyle = 'rgba(225, 6, 0, 0.5)'; // Peak Red
          } else if (util > 75) {
            ctx.fillStyle = 'rgba(0, 255, 102, 0.35)'; // High Green
          } else {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.18)'; // Low Cyan
          }

          ctx.fillRect(px - 1, py - 1, 2, 2);
        }
      }

      // Highlight current cursor frame
      if (currentFrame) {
        const cx = center + (currentFrame.latG / maxG) * radius;
        const cy = center - (currentFrame.lonG / maxG) * radius;

        // Glow pulse
        ctx.fillStyle = 'rgba(225, 6, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [frames, currentFrame, maxG]);

  return (
    <div className="bg-[#0E0E16] border border-[#232332] p-4 flex flex-col items-center shadow-lg hud-bracket">
      <div className="w-full flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-racing flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 diamond-pip bg-[#E10600]" />
          <span>Skip Barber G-G Friction Circle</span>
        </h4>
        <span className="text-[10px] font-tech font-bold uppercase tracking-wider text-[#8E8E9F]">Traction Budget</span>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full border border-[#1F1F2C]" />
      </div>

      <div className="w-full mt-3 pt-2 border-t border-[#20202E] flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-tech uppercase tracking-wider">Grip Util:</span>
        <strong className="text-emerald-400 font-hud-clean font-bold text-xs tabular-nums">
          {currentFrame ? `${currentFrame.tractionBudgetPct.toFixed(0)}%` : '85% (Avg)'}
        </strong>
      </div>
    </div>
  );
};
