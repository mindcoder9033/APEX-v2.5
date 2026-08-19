import React from 'react';
import { TelemetryFrame } from '../../../types/telemetry';
import { Disc, Layers } from 'lucide-react';

interface TireSuspensionWidgetProps {
  currentFrame: TelemetryFrame | null;
}

export const TireSuspensionWidget: React.FC<TireSuspensionWidgetProps> = ({ currentFrame }) => {
  // Forza temperature values are in Fahrenheit, convert to Celsius and Fahrenheit
  const getTempDisplay = (tempF?: number) => {
    if (!tempF || tempF <= 0) return { c: 85, f: 185, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' };
    const c = Math.round(((tempF - 32) * 5) / 9);
    const f = Math.round(tempF);
    
    // Thermal color bands (racing tire optimal range ~80C-100C / 175F-212F)
    if (c < 70) return { c, f, color: 'text-[#00F0FF]', bg: 'bg-cyan-950/40 border-cyan-500/30' }; // Cold
    if (c <= 100) return { c, f, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' }; // Optimal
    if (c <= 115) return { c, f, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' }; // Hot
    return { c, f, color: 'text-[#FF1801]', bg: 'bg-red-950/50 border-red-500/40' }; // Overheating
  };

  const getSuspensionPct = (travelNorm?: number) => {
    if (travelNorm === undefined || travelNorm === null) return 50;
    // travel is 0.0 (fully extended) to 1.0 (fully compressed)
    return Math.min(100, Math.max(0, Math.round(travelNorm * 100)));
  };

  const flTemp = getTempDisplay(currentFrame?.tireTempFL);
  const frTemp = getTempDisplay(currentFrame?.tireTempFR);
  const rlTemp = getTempDisplay(currentFrame?.tireTempRL);
  const rrTemp = getTempDisplay(currentFrame?.tireTempRR);

  const flSusp = getSuspensionPct(currentFrame?.suspensionTravelFL);
  const frSusp = getSuspensionPct(currentFrame?.suspensionTravelFR);
  const rlSusp = getSuspensionPct(currentFrame?.suspensionTravelRL);
  const rrSusp = getSuspensionPct(currentFrame?.suspensionTravelRR);

  return (
    <div className="p-5 bg-[#12121A] border border-[#232332] flex flex-col justify-between shadow-lg hud-bracket min-h-[290px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-racing font-bold text-white uppercase tracking-wider">
            4-Wheel Tire Thermals & Damper Travel
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
            <span>Cold</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Opt (80-100°C)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#FF1801]" />
            <span>Hot</span>
          </span>
        </div>
      </div>

      {/* Chassis Top-Down 4-Corner Layout */}
      <div className="grid grid-cols-2 gap-4 flex-1 py-1">
        {/* FRONT LEFT */}
        <div className={`p-3 border flex flex-col justify-between ${flTemp.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-tech font-bold text-slate-300 uppercase">FRONT LEFT</span>
            <Disc className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="my-1.5 flex items-baseline space-x-2">
            <span className={`text-2xl font-hud font-black tabular-nums ${flTemp.color}`}>
              {currentFrame ? `${flTemp.c}°C` : '--°C'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {currentFrame ? `${flTemp.f}°F` : '--°F'}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
              <span>SUSP TRAVEL</span>
              <span className="text-white font-bold">{flSusp}%</span>
            </div>
            <div className="w-full bg-[#181824] h-1.5 border border-[#2B2B3C] overflow-hidden">
              <div className="bg-purple-400 h-full transition-all duration-75" style={{ width: `${flSusp}%` }} />
            </div>
          </div>
        </div>

        {/* FRONT RIGHT */}
        <div className={`p-3 border flex flex-col justify-between ${frTemp.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-tech font-bold text-slate-300 uppercase">FRONT RIGHT</span>
            <Disc className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="my-1.5 flex items-baseline space-x-2">
            <span className={`text-2xl font-hud font-black tabular-nums ${frTemp.color}`}>
              {currentFrame ? `${frTemp.c}°C` : '--°C'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {currentFrame ? `${frTemp.f}°F` : '--°F'}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
              <span>SUSP TRAVEL</span>
              <span className="text-white font-bold">{frSusp}%</span>
            </div>
            <div className="w-full bg-[#181824] h-1.5 border border-[#2B2B3C] overflow-hidden">
              <div className="bg-purple-400 h-full transition-all duration-75" style={{ width: `${frSusp}%` }} />
            </div>
          </div>
        </div>

        {/* REAR LEFT */}
        <div className={`p-3 border flex flex-col justify-between ${rlTemp.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-tech font-bold text-slate-300 uppercase">REAR LEFT</span>
            <Disc className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="my-1.5 flex items-baseline space-x-2">
            <span className={`text-2xl font-hud font-black tabular-nums ${rlTemp.color}`}>
              {currentFrame ? `${rlTemp.c}°C` : '--°C'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {currentFrame ? `${rlTemp.f}°F` : '--°F'}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
              <span>SUSP TRAVEL</span>
              <span className="text-white font-bold">{rlSusp}%</span>
            </div>
            <div className="w-full bg-[#181824] h-1.5 border border-[#2B2B3C] overflow-hidden">
              <div className="bg-purple-400 h-full transition-all duration-75" style={{ width: `${rlSusp}%` }} />
            </div>
          </div>
        </div>

        {/* REAR RIGHT */}
        <div className={`p-3 border flex flex-col justify-between ${rrTemp.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-tech font-bold text-slate-300 uppercase">REAR RIGHT</span>
            <Disc className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="my-1.5 flex items-baseline space-x-2">
            <span className={`text-2xl font-hud font-black tabular-nums ${rrTemp.color}`}>
              {currentFrame ? `${rrTemp.c}°C` : '--°C'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {currentFrame ? `${rrTemp.f}°F` : '--°F'}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
              <span>SUSP TRAVEL</span>
              <span className="text-white font-bold">{rrSusp}%</span>
            </div>
            <div className="w-full bg-[#181824] h-1.5 border border-[#2B2B3C] overflow-hidden">
              <div className="bg-purple-400 h-full transition-all duration-75" style={{ width: `${rrSusp}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
