import React, { useState } from 'react';
import { 
  AICoachDebrief, 
  CornerCoachAdvice, 
  StintSession, 
  LapAnalysis 
} from '../../types/telemetry';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown, 
  Compass, 
  Layers, 
  Target, 
  Zap, 
  Flame,
  Activity,
  Car,
  ShieldAlert,
  Award
} from 'lucide-react';

interface AICoachPanelProps {
  debrief: AICoachDebrief;
  currentStint: StintSession | null;
  activeLap: LapAnalysis | null;
  onSelectCorner?: (cornerIndex: number) => void;
  selectedCornerIndex?: number | null;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  debrief,
  currentStint,
  activeLap,
  onSelectCorner,
  selectedCornerIndex = null
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'strengths' | 'weaknesses' | 'drills' | 'corners'>('overview');
  const [expandedCornerIdx, setExpandedCornerIdx] = useState<number | null>(selectedCornerIndex ?? null);
  const [filterType, setFilterType] = useState<'all' | 'Type 1' | 'Type 2' | 'Type 3'>('all');

  const { 
    stintGrade, 
    overallScore, 
    driverProfileTag, 
    driverProfileDescription, 
    pillarScores, 
    whatWentRight, 
    whatWentWrong, 
    howToImprove, 
    cornerAnalyses,
    stintConsistencySummary 
  } = debrief;

  const handleCornerClick = (cornerIdx: number) => {
    const newIdx = expandedCornerIdx === cornerIdx ? null : cornerIdx;
    setExpandedCornerIdx(newIdx);
    if (onSelectCorner) {
      onSelectCorner(cornerIdx);
    }
  };

  const filteredCorners = cornerAnalyses.filter(c => {
    if (filterType === 'all') return true;
    return c.priorityType.startsWith(filterType);
  });

  return (
    <div className="space-y-4 font-sans text-[#F3F4F6]">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COACH HEADER & PROFILE BANNER (APEX HUD BRACKET STYLE) */}
      {/* ========================================================================= */}
      <div className="bg-[#0E0E16] border border-[#232332] p-5 shadow-xl hud-bracket">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Left: Overall Stint Grade & Persona */}
          <div className="flex items-center gap-4">
            {/* Sharp Score Box */}
            <div className="relative flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 bg-[#14141E] border border-[#2A2A3E]">
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00F0FF]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#00F0FF]" />
              <span className="text-3xl font-racing font-bold text-[#00F0FF] tracking-tight">
                {stintGrade}
              </span>
              <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-[#8E8E9F] mt-0.5">
                {overallScore}/100 Score
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-tech font-bold uppercase tracking-wider bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
                  <span className="w-1.5 h-1.5 diamond-pip bg-[#00F0FF]" />
                  Skip Barber AI Coach
                </span>
                <span className="text-xs text-[#8E8E9F] font-tech font-semibold">
                  {currentStint?.trackName || activeLap?.detectedTrackName || 'Track Telemetry'} • {currentStint?.carName || activeLap?.detectedCarName || 'Vehicle Profile'}
                </span>
                {currentStint && currentStint.totalLaps > 1 && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#181826] text-slate-300 border border-[#262638]">
                    {currentStint.totalLaps} Laps Analyzed
                  </span>
                )}
              </div>
              <h2 className="text-lg font-racing font-bold text-white flex items-center gap-2">
                {driverProfileTag}
              </h2>
              <p className="text-xs text-[#8E8E9F] mt-1 max-w-2xl leading-relaxed">
                {driverProfileDescription}
              </p>
            </div>
          </div>

          {/* Right: Quick Stint Consistency Summary */}
          {stintConsistencySummary && (
            <div className="flex items-center gap-3 bg-[#14141E] border border-[#232332] p-3.5 hud-bracket-cyan">
              <div className="p-2.5 bg-[#1C1C2C] text-[#00F0FF] border border-[#2A2A3E]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-tech font-bold text-[#8E8E9F] uppercase tracking-wider">
                  Lap Delta Variance
                </div>
                <div className="text-base font-mono font-bold text-white flex items-center gap-2">
                  ±{stintConsistencySummary.lapDeltaStdDevSec}s
                  <span className={`text-[10px] font-tech font-bold px-1.5 py-0.5 uppercase border ${
                    stintConsistencySummary.paceTrend === 'improving' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                    stintConsistencySummary.paceTrend === 'fading' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                    'bg-[#1C1C2C] text-slate-300 border-[#2A2A3E]'
                  }`}>
                    {stintConsistencySummary.paceTrend}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#8E8E9F]">
                  Marker variance: ±{stintConsistencySummary.brakingMarkerVarianceMeters}m
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5-Pillar Score Meters (APEX HUD Strips) */}
        <div className="mt-5 pt-4 border-t border-[#1C1C2A] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {pillarScores.map((p) => {
            const isTop = p.score >= 88;
            const isLow = p.score < 75;
            return (
              <div 
                key={p.id} 
                className="bg-[#12121A] border border-[#20202E] p-3 flex flex-col justify-between hover:border-[#2C2C3E] transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-tech font-bold uppercase tracking-wider text-slate-300 truncate" title={p.name}>
                    {p.name.split('&')[0].trim()}
                  </span>
                  <span className={`font-mono font-bold px-1.5 py-0.2 text-[11px] border ${
                    isTop ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                    isLow ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                    'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {p.grade} ({p.score})
                  </span>
                </div>
                {/* Progress bar with sharp 0px corners */}
                <div className="w-full bg-[#1A1A26] h-1.5 overflow-hidden my-1">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isTop ? 'bg-[#00FF66]' :
                      isLow ? 'bg-amber-400' :
                      'bg-[#00F0FF]'
                    }`}
                    style={{ width: `${p.score}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#8E8E9F] font-mono mt-0.5">
                  {p.bookChapter}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS (CHAMFERED TACTICAL TABS) */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-[#232332] pb-1">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {[
            { id: 'overview', label: 'Full Debrief', count: null, icon: Layers },
            { id: 'strengths', label: 'What Went Right', count: whatWentRight.length, icon: CheckCircle2, color: 'text-emerald-400' },
            { id: 'weaknesses', label: 'Where You Left Time', count: whatWentWrong.length, icon: AlertTriangle, color: 'text-amber-400' },
            { id: 'drills', label: 'Skip Barber Drills', count: howToImprove.length, icon: Target, color: 'text-[#00F0FF]' },
            { id: 'corners', label: 'Corner Matrix', count: cornerAnalyses.length, icon: Compass }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#E10600] text-white shadow-md shadow-red-950/60' 
                    : 'bg-[#14141E] text-slate-400 hover:text-white border border-[#222232]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color || 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-[#1A1A28] text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB PANELS CONTENT (SHARP RECTANGULAR CARDS) */}
      {/* ========================================================================= */}

      {/* OVERVIEW / STRENGTHS TAB */}
      {(activeTab === 'overview' || activeTab === 'strengths') && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-racing font-bold uppercase tracking-wider text-emerald-400">
            <span className="w-2 h-2 diamond-pip bg-emerald-400" />
            <span>What You Did Right (Key Strengths)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {whatWentRight.map((item) => (
              <div 
                key={item.id}
                className="bg-[#12121A] border-l-2 border-l-emerald-500 border border-[#222230] p-4 flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      Strength
                    </span>
                    {item.cornerName && (
                      <span className="text-xs font-tech font-bold text-slate-400">
                        {item.cornerName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-racing font-bold text-white mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1F1F2C] space-y-1">
                  {item.metricEvidence && (
                    <div className="text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      {item.metricEvidence}
                    </div>
                  )}
                  <div className="text-[10px] text-[#8E8E9F] flex items-center gap-1.5 font-sans">
                    <BookOpen className="w-3 h-3 text-[#8E8E9F]" />
                    {item.bookCitation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WEAKNESSES / TIME LOSS TAB */}
      {(activeTab === 'overview' || activeTab === 'weaknesses') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2 text-xs font-racing font-bold uppercase tracking-wider text-amber-400">
            <span className="w-2 h-2 diamond-pip bg-amber-400" />
            <span>Where You Left Time (Critical Mistakes & Time Loss)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {whatWentWrong.map((item) => (
              <div 
                key={item.id}
                className="bg-[#12121A] border-l-2 border-l-amber-500 border border-[#222230] p-4 flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/40">
                      Time Loss
                    </span>
                    {item.cornerName && (
                      <span className="text-xs font-tech font-bold text-slate-400">
                        {item.cornerName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-racing font-bold text-white mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1F1F2C] space-y-1">
                  {item.metricEvidence && (
                    <div className="text-[11px] text-amber-400 font-mono font-medium flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-amber-400" />
                      {item.metricEvidence}
                    </div>
                  )}
                  <div className="text-[10px] text-[#8E8E9F] flex items-center gap-1.5 font-sans">
                    <BookOpen className="w-3 h-3 text-[#8E8E9F]" />
                    {item.bookCitation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRILLS / HOW TO IMPROVE TAB */}
      {(activeTab === 'overview' || activeTab === 'drills') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2 text-xs font-racing font-bold uppercase tracking-wider text-[#00F0FF]">
            <span className="w-2 h-2 diamond-pip bg-[#00F0FF]" />
            <span>How To Improve Next Stint (Prescribed Skip Barber Drills)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {howToImprove.map((item, idx) => (
              <div 
                key={item.id}
                className="relative bg-[#12121A] border-l-2 border-l-[#00F0FF] border border-[#222230] p-4 flex flex-col justify-between shadow-md"
              >
                <div className="absolute top-2 right-3 text-4xl font-racing font-black text-[#1E1E2C] select-none pointer-events-none">
                  #{idx + 1}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      Step {idx + 1} Drill
                    </span>
                  </div>
                  <h4 className="text-sm font-racing font-bold text-white mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1F1F2C] relative z-10">
                  <div className="text-[10px] text-cyan-300 font-sans flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#00F0FF]" />
                    {item.bookCitation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CORNER MATRIX TAB (Detailed Turn-by-Turn Matrix) */}
      {(activeTab === 'overview' || activeTab === 'corners') && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-racing font-bold uppercase tracking-wider text-white">
              <span className="w-2 h-2 diamond-pip bg-[#E10600]" />
              <span>Corner-by-Corner Skip Barber Telemetry Breakdown</span>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1 bg-[#14141E] p-1 border border-[#232332]">
              {(['all', 'Type 1', 'Type 2', 'Type 3'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 text-[11px] font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    filterType === type 
                      ? 'bg-[#E10600] text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'all' ? 'All Corners' : `${type}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredCorners.map((c) => {
              const isExpanded = expandedCornerIdx === c.cornerIndex;
              const isGood = c.score >= 85;
              const isNeedsWork = c.score < 75;

              return (
                <div 
                  key={c.cornerIndex}
                  className={`border transition-all ${
                    isExpanded 
                      ? 'bg-[#141420] border-[#00F0FF]/60 shadow-lg' 
                      : 'bg-[#101018] border-[#20202E] hover:border-[#2A2A3E]'
                  }`}
                >
                  {/* Header Row */}
                  <div 
                    onClick={() => handleCornerClick(c.cornerIndex)}
                    className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center font-mono font-bold text-xs border ${
                        isGood ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                        isNeedsWork ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                        'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {c.grade}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-racing font-bold text-white">
                            {c.cornerName}
                          </span>
                          <span className={`text-[10px] font-tech font-bold uppercase tracking-wider px-2 py-0.2 border ${
                            c.priorityType.startsWith('Type 1') ? 'bg-indigo-950 text-indigo-300 border-indigo-500/40' :
                            c.priorityType.startsWith('Type 2') ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                            'bg-teal-950 text-teal-300 border-teal-500/40'
                          }`}>
                            {c.priorityType}
                          </span>
                        </div>
                        <div className="text-xs text-[#8E8E9F] font-mono flex items-center gap-3 mt-0.5">
                          <span>Min Apex: <strong className="text-white font-bold">{c.metrics.apexMinSpeedKph} km/h</strong></span>
                          <span>Trail Decay: <strong className="text-white font-bold">{c.metrics.trailDecayMs}ms</strong></span>
                          <span>Coasting: <strong className={c.metrics.coastingHesitationMs > 200 ? 'text-amber-400 font-bold' : 'text-white'}>{c.metrics.coastingHesitationMs}ms</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-5 text-xs text-[#8E8E9F] font-mono">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-tech text-[#8E8E9F]">Throttle Unwind</div>
                          <div className="font-bold text-white">{c.metrics.throttleUnwindScore}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-tech text-[#8E8E9F]">Grip Budget</div>
                          <div className="font-bold text-white">{c.metrics.gripUtilizationPct}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-tech text-[#8E8E9F]">Balance</div>
                          <div className={`font-bold uppercase ${
                            c.metrics.balance === 'neutral' ? 'text-emerald-400' :
                            c.metrics.balance === 'understeer' ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {c.metrics.balance}
                          </div>
                        </div>
                      </div>

                      <div className="text-slate-400 p-1">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-[#00F0FF]" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detailed Breakdown */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#1C1C2A] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                      {/* What went right */}
                      <div className="bg-[#0E0E16] border-l-2 border-l-emerald-500 border border-[#20202E] p-3">
                        <div className="text-[10px] font-tech font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          What Went Right
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {c.whatWentRight}
                        </p>
                      </div>

                      {/* What went wrong */}
                      <div className="bg-[#0E0E16] border-l-2 border-l-amber-500 border border-[#20202E] p-3">
                        <div className="text-[10px] font-tech font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Where Time Was Lost
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {c.whatWentWrong}
                        </p>
                      </div>

                      {/* Skip Barber advice & quote */}
                      <div className="bg-[#0E0E16] border-l-2 border-l-[#00F0FF] border border-[#20202E] p-3 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-tech font-bold text-[#00F0FF] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            Skip Barber Prescription
                          </div>
                          <p className="text-slate-200 leading-relaxed font-medium">
                            {c.howToImprove}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-[#1A1A26] text-[10px] text-cyan-300 font-sans italic flex items-start gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#00F0FF] flex-shrink-0 mt-0.5" />
                          <span>{c.bookCitation}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
