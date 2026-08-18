import React, { useState } from 'react';
import { CornerTelemetryAnalysis } from '../../types/telemetry';
import { ChevronDown, ChevronUp, Info, Sparkles, Layers } from 'lucide-react';

interface DiagnosticScorecardProps {
  corners: CornerTelemetryAnalysis[];
  onFocusCorner?: (startDist: number) => void;
}

export const DiagnosticScorecard: React.FC<DiagnosticScorecardProps> = ({
  corners,
  onFocusCorner
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(corners[0]?.cornerIndex || 1);
  const [selectedSector, setSelectedSector] = useState<'all' | 1 | 2 | 3>('all');

  const s1Corners = corners.filter(c => (c.sector || 1) === 1);
  const s2Corners = corners.filter(c => c.sector === 2);
  const s3Corners = corners.filter(c => c.sector === 3);

  const displayedCorners = selectedSector === 'all' 
    ? corners 
    : corners.filter(c => (c.sector || 1) === selectedSector);

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 font-mono">A ({score})</span>;
    if (score >= 80) return <span className="bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 font-mono">B ({score})</span>;
    if (score >= 70) return <span className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 font-mono">C ({score})</span>;
    return <span className="bg-red-950 text-red-300 border border-red-500/40 text-[10px] font-bold px-2 py-0.5 font-mono">D ({score})</span>;
  };

  const getSectorAvg = (cornerList: CornerTelemetryAnalysis[]) => {
    if (!cornerList.length) return '--';
    const avg = Math.round(cornerList.reduce((sum, c) => sum + c.cornerScore, 0) / cornerList.length);
    return `${avg}/100`;
  };

  return (
    <div className="bg-[#0E0E16] border border-[#232332] p-5 shadow-xl flex flex-col space-y-4 hud-bracket">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold font-racing uppercase tracking-wider text-white flex items-center space-x-2">
            <span className="w-2 h-2 diamond-pip bg-[#E10600]" />
            <span>Turn-by-Turn Telemetric Diagnosis & Skip Barber Debrief</span>
          </h3>
          <p className="text-xs text-[#8E8E9F] mt-0.5 font-sans">Automated physics scoring derived from 'Going Faster' principles</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-tech font-bold uppercase tracking-wider text-slate-400 bg-[#161622] px-2.5 py-1 border border-[#262638]">
            {corners.length} Turns Analyzed
          </span>
        </div>
      </div>

      {/* Sector Navigation Filters */}
      <div className="flex items-center space-x-2 pt-1 border-t border-[#1C1C2A] overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSector('all')}
          className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
            selectedSector === 'all'
              ? 'bg-[#E10600] text-white shadow-md shadow-red-950/50'
              : 'bg-[#14141E] text-slate-400 hover:text-white border border-[#222232]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Turns ({corners.length})</span>
        </button>

        <button
          onClick={() => setSelectedSector(1)}
          className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
            selectedSector === 1
              ? 'bg-[#00F0FF] text-black shadow-md shadow-cyan-950/50 font-black'
              : 'bg-[#14141E] text-slate-400 hover:text-white border border-[#222232]'
          }`}
        >
          <span>Sector 1 ({s1Corners.length})</span>
          <span className="text-[10px] font-mono opacity-80">[{getSectorAvg(s1Corners)}]</span>
        </button>

        <button
          onClick={() => setSelectedSector(2)}
          className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
            selectedSector === 2
              ? 'bg-amber-400 text-black shadow-md shadow-amber-950/50 font-black'
              : 'bg-[#14141E] text-slate-400 hover:text-white border border-[#222232]'
          }`}
        >
          <span>Sector 2 ({s2Corners.length})</span>
          <span className="text-[10px] font-mono opacity-80">[{getSectorAvg(s2Corners)}]</span>
        </button>

        <button
          onClick={() => setSelectedSector(3)}
          className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
            selectedSector === 3
              ? 'bg-emerald-400 text-black shadow-md shadow-emerald-950/50 font-black'
              : 'bg-[#14141E] text-slate-400 hover:text-white border border-[#222232]'
          }`}
        >
          <span>Sector 3 ({s3Corners.length})</span>
          <span className="text-[10px] font-mono opacity-80">[{getSectorAvg(s3Corners)}]</span>
        </button>
      </div>

      {/* Turn Cards List */}
      <div className="space-y-2">
        {displayedCorners.map((c) => {
          const isExpanded = expandedIndex === c.cornerIndex;
          const sectorColor = c.sector === 1 ? 'text-[#00F0FF]' : c.sector === 2 ? 'text-amber-400' : 'text-emerald-400';

          return (
            <div
              key={c.cornerIndex}
              className={`border transition-all ${
                isExpanded
                  ? 'bg-[#151522] border-[#E10600]/60 shadow-lg'
                  : 'bg-[#101018] border-[#1F1F2E] hover:border-[#2F2F44]'
              }`}
            >
              {/* Header Row */}
              <div
                onClick={() => {
                  setExpandedIndex(isExpanded ? null : c.cornerIndex);
                  if (onFocusCorner) onFocusCorner(c.startDistance);
                }}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-[#1E1E2C] flex items-center justify-center text-xs font-mono font-bold text-white border border-[#2D2D40] tabular-nums">
                    T{c.cornerIndex}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-200 font-tech uppercase tracking-wide">{c.cornerName}</h4>
                      {c.sector && (
                        <span className={`text-[9px] font-mono uppercase font-bold ${sectorColor}`}>
                          S{c.sector}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-tech text-[#7E7E92] uppercase font-semibold">{c.type.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Key Metrics Chips */}
                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div className="hidden md:block">
                    <span className="text-[10px] text-slate-500 font-tech uppercase tracking-wider block">Brake Decay</span>
                    <span className="text-slate-200 font-bold tabular-nums">{c.trailBrakingDecayDurationSec.toFixed(2)}s</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-tech uppercase tracking-wider block">Apex Speed</span>
                    <span className={`font-bold tabular-nums ${c.apexMinSpeedKph >= c.targetApexSpeedKph ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {c.apexMinSpeedKph} <span className="text-[10px] text-slate-500 font-tech">/ {c.targetApexSpeedKph} km/h</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-tech uppercase tracking-wider block">Grip Util</span>
                    <span className="text-purple-400 font-bold tabular-nums">{c.apexGripUtilizationPct}%</span>
                  </div>
                  <div>{getScoreBadge(c.cornerScore)}</div>
                  <button className="text-slate-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Diagnostic Deep-Dive */}
              {isExpanded && (
                <div className="p-4 pt-2 border-t border-[#232334] bg-[#0C0C14] space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-[#14141E] p-2.5 border border-[#222230]">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Braking Hit Time</span>
                      <strong className="text-white text-sm font-mono tabular-nums">{c.brakingHitRateMs} ms</strong>
                    </div>
                    <div className="bg-[#14141E] p-2.5 border border-[#222230]">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Trail-Brake Score</span>
                      <strong className="text-emerald-400 text-sm font-mono tabular-nums">{c.trailBrakingScore}/100</strong>
                    </div>
                    <div className="bg-[#14141E] p-2.5 border border-[#222230]">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Throttle Pickup Lag</span>
                      <strong className="text-cyan-400 text-sm font-mono tabular-nums">{c.throttlePickupHesitationMs} ms</strong>
                    </div>
                    <div className="bg-[#14141E] p-2.5 border border-[#222230]">
                      <span className="text-[10px] text-slate-400 font-tech uppercase tracking-wider font-semibold block">Vehicle Balance</span>
                      <strong className={`text-sm uppercase font-tech font-bold ${c.balanceCategory === 'neutral' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {c.balanceCategory}
                      </strong>
                    </div>
                  </div>

                  {/* Diagnosis & Advice Box */}
                  <div className="space-y-2">
                    <div className="p-3 bg-[#161622] border border-[#28283C] flex items-start space-x-2.5">
                      <Info className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-slate-200 font-tech uppercase tracking-wider block">Telemetry Observation:</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{c.diagnosis}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-[#221013] to-[#17141C] border border-[#E10600]/40 flex items-start space-x-2.5 shadow-md">
                      <Sparkles className="w-4 h-4 text-[#FF4D4D] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-[#FF4D4D] block uppercase font-racing tracking-wider">
                          Skip Barber Racing Advice:
                        </span>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed font-sans">{c.skipBarberAdvice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
