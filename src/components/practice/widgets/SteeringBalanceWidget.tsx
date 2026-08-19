import React from 'react';
import { TelemetryFrame } from '../../../types/telemetry';
import { Compass, MoveHorizontal, AlertTriangle } from 'lucide-react';

interface SteeringBalanceWidgetProps {
  currentFrame: TelemetryFrame | null;
}

export const SteeringBalanceWidget: React.FC<SteeringBalanceWidgetProps> = ({ currentFrame }) => {
  const steerVal = currentFrame ? currentFrame.steering : 0; // -1 to +1
  const steerPct = Math.round(steerVal * 100);
  const slipDiff = currentFrame ? currentFrame.slipAngleDifferential : 0;
  const avgSlip = currentFrame ? currentFrame.avgSlipAngleDeg : 0;

  // Determine balance status based on slip differential
  let balanceType: 'neutral' | 'understeer' | 'oversteer' = 'neutral';
  let balanceLabel = 'BALANCED / NEUTRAL';
  let balanceColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';

  if (slipDiff > 1.2) {
    balanceType = 'understeer';
    balanceLabel = `UNDERSTEER (+${slipDiff.toFixed(1)}°)`;
    balanceColor = 'text-amber-400 border-amber-500/40 bg-amber-950/40';
  } else if (slipDiff < -1.2) {
    balanceType = 'oversteer';
    balanceLabel = `OVERSTEER (${slipDiff.toFixed(1)}°)`;
    balanceColor = 'text-[#FF1801] border-red-500/40 bg-red-950/40';
  }

  // Steer bar position percentage (0% = full left, 50% = center, 100% = full right)
  const steerMarkerPct = 50 + (steerVal * 50);

  return (
    <div className="p-6 bg-[#12121A] border border-[#232332] flex flex-col justify-between shadow-lg hud-bracket group hover:border-[#00F0FF]/30 transition-all min-h-[170px]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-tech font-bold text-[#8E8E9F] uppercase tracking-widest flex items-center space-x-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Steering & Vehicle Balance</span>
        </span>
        <span className={`chamfer-badge text-[9px] font-mono font-bold px-2 py-0.5 border ${balanceColor}`}>
          {balanceLabel}
        </span>
      </div>

      {/* Steering Rack Bar Visualizer */}
      <div className="my-3 space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-slate-400">LEFT 100%</span>
          <span className="text-white font-bold">{steerPct > 0 ? `+${steerPct}% R` : steerPct < 0 ? `${steerPct}% L` : 'CENTER'}</span>
          <span className="text-slate-400">RIGHT 100%</span>
        </div>
        <div className="relative h-3 w-full bg-[#181824] border border-[#2B2B3C] overflow-hidden">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500 z-10" />
          {/* Fill indicator */}
          <div
            className={`absolute top-0 bottom-0 transition-all duration-75 ${
              steerVal < 0
                ? 'right-1/2 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                : 'left-1/2 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
            }`}
            style={{
              width: `${Math.abs(steerVal) * 50}%`
            }}
          />
          {/* Pointer indicator */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md z-20 transition-all duration-75 -translate-x-1/2"
            style={{ left: `${Math.max(0, Math.min(100, steerMarkerPct))}%` }}
          />
        </div>
      </div>

      {/* Slip and Balance Micro-stats */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1F1F2C] text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span>Avg Slip Angle:</span>
          <span className="text-white font-bold">{avgSlip.toFixed(1)}°</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Slip Differential:</span>
          <span className={slipDiff > 1.2 ? 'text-amber-400 font-bold' : slipDiff < -1.2 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
            {slipDiff > 0 ? `+${slipDiff.toFixed(2)}°` : `${slipDiff.toFixed(2)}°`}
          </span>
        </div>
      </div>
    </div>
  );
};
