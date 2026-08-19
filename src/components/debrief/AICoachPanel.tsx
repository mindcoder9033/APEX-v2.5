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
  Award, 
  ChevronRight, 
  ChevronDown, 
  Gauge, 
  Compass, 
  Layers, 
  Target, 
  Zap, 
  Info,
  Flame,
  Activity,
  Car
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
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COACH HEADER & PROFILE BANNER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/50 border border-slate-800/80 p-6 shadow-2xl backdrop-blur-xl">
        {/* Glow accents */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Overall Stint Grade & Persona */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/60 shadow-inner">
              <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-teal-300 to-emerald-400">
                {stintGrade}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                {overallScore}/100 Score
              </span>
              <div className="absolute -bottom-1 -right-1 p-1 bg-cyan-500 rounded-full text-slate-950 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Flame className="w-3 h-3 text-cyan-400" />
                  Skip Barber AI Coach
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentStint?.trackName || activeLap?.detectedTrackName || 'Track Analysis'} • {currentStint?.carName || activeLap?.detectedCarName || 'Telemetry Run'}
                </span>
                {currentStint && currentStint.totalLaps > 1 && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {currentStint.totalLaps} Laps Analyzed
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {driverProfileTag}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {driverProfileDescription}
              </p>
            </div>
          </div>

          {/* Right: Quick Stint Consistency Summary */}
          {stintConsistencySummary && (
            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 backdrop-blur-md">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Lap Delta Variance
                </div>
                <div className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  ±{stintConsistencySummary.lapDeltaStdDevSec}s
                  <span className={`text-[11px] font-medium px-1.5 py-0.2 rounded ${
                    stintConsistencySummary.paceTrend === 'improving' ? 'bg-emerald-500/20 text-emerald-300' :
                    stintConsistencySummary.paceTrend === 'fading' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {stintConsistencySummary.paceTrend.toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Marker variance: ±{stintConsistencySummary.brakingMarkerVarianceMeters}m
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5-Pillar Horizontal Meters */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {pillarScores.map((p) => {
            const isTop = p.score >= 88;
            const isLow = p.score < 75;
            return (
              <div 
                key={p.id} 
                className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 truncate" title={p.name}>
                    {p.name.split('&')[0].trim()}
                  </span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                    isTop ? 'bg-emerald-500/20 text-emerald-300' :
                    isLow ? 'bg-amber-500/20 text-amber-300' :
                    'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {p.grade} ({p.score})
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden my-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isTop ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                      isLow ? 'bg-gradient-to-r from-amber-500 to-rose-400' :
                      'bg-gradient-to-r from-cyan-500 to-blue-400'
                    }`}
                    style={{ width: `${p.score}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {p.bookChapter}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Full Debrief', count: null, icon: Layers },
            { id: 'strengths', label: 'What Went Right', count: whatWentRight.length, icon: CheckCircle2, color: 'text-emerald-400' },
            { id: 'weaknesses', label: 'Where You Left Time', count: whatWentWrong.length, icon: AlertTriangle, color: 'text-amber-400' },
            { id: 'drills', label: 'Skip Barber Drills', count: howToImprove.length, icon: Target, color: 'text-cyan-400' },
            { id: 'corners', label: 'Corner Matrix', count: cornerAnalyses.length, icon: Compass }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color || 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-800/80 text-slate-400'
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
      {/* 3. TAB PANELS CONTENT */}
      {/* ========================================================================= */}

      {/* OVERVIEW / EXECUTIVE SUMMARY TAB */}
      {(activeTab === 'overview' || activeTab === 'strengths') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            What You Did Right (Key Strengths)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whatWentRight.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-900/80 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl p-4 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Strength
                    </span>
                    {item.cornerName && (
                      <span className="text-xs font-semibold text-slate-400">
                        {item.cornerName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                  {item.metricEvidence && (
                    <div className="text-[11px] text-emerald-400/90 font-mono font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      {item.metricEvidence}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-400" />
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
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            Where You Left Time (Critical Mistakes & Time Loss)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whatWentWrong.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-4 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Time Loss
                    </span>
                    {item.cornerName && (
                      <span className="text-xs font-semibold text-slate-400">
                        {item.cornerName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                  {item.metricEvidence && (
                    <div className="text-[11px] text-amber-400/90 font-mono font-medium flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-amber-400" />
                      {item.metricEvidence}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-400" />
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
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Target className="w-4 h-4" />
            How To Improve Next Stint (Prescribed Skip Barber Drills)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {howToImprove.map((item, idx) => (
              <div 
                key={item.id}
                className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div className="absolute top-2 right-3 text-5xl font-black text-slate-800/40 pointer-events-none">
                  #{idx + 1}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Step {idx + 1} Drill
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 relative z-10">
                  <div className="text-[10px] text-cyan-300/80 font-medium flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
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
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Compass className="w-4 h-4 text-cyan-400" />
              Corner-by-Corner Skip Barber Telemetry Breakdown
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['all', 'Type 1', 'Type 2', 'Type 3'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    filterType === type 
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type === 'all' ? 'All Corners' : `${type}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredCorners.map((c) => {
              const isExpanded = expandedCornerIdx === c.cornerIndex;
              const isGood = c.score >= 85;
              const isNeedsWork = c.score < 75;

              return (
                <div 
                  key={c.cornerIndex}
                  className={`rounded-xl border transition-all ${
                    isExpanded 
                      ? 'bg-slate-900 border-cyan-500/40 shadow-lg' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Header Row */}
                  <div 
                    onClick={() => handleCornerClick(c.cornerIndex)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isGood ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        isNeedsWork ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {c.grade}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">
                            {c.cornerName}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                            c.priorityType.startsWith('Type 1') ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            c.priorityType.startsWith('Type 2') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}>
                            {c.priorityType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>Min Apex: <strong className="text-slate-200">{c.metrics.apexMinSpeedKph} km/h</strong></span>
                          <span>Trail Decay: <strong className="text-slate-200">{c.metrics.trailDecayMs}ms</strong></span>
                          <span>Coasting Pause: <strong className={c.metrics.coastingHesitationMs > 200 ? 'text-amber-400' : 'text-slate-200'}>{c.metrics.coastingHesitationMs}ms</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Throttle Unwind</div>
                          <div className="font-semibold text-slate-200">{c.metrics.throttleUnwindScore}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Grip Budget</div>
                          <div className="font-semibold text-slate-200">{c.metrics.gripUtilizationPct}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Balance</div>
                          <div className={`font-semibold uppercase ${
                            c.metrics.balance === 'neutral' ? 'text-emerald-400' :
                            c.metrics.balance === 'understeer' ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {c.metrics.balance}
                          </div>
                        </div>
                      </div>

                      <div className="text-slate-400 p-1">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detailed Breakdown */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* What went right */}
                      <div className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-3.5">
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          What Went Right
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {c.whatWentRight}
                        </p>
                      </div>

                      {/* What went wrong */}
                      <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-3.5">
                        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Where Time Was Lost
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {c.whatWentWrong}
                        </p>
                      </div>

                      {/* Skip Barber advice & quote */}
                      <div className="bg-slate-950/60 border border-cyan-500/20 rounded-xl p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            Skip Barber Prescription
                          </div>
                          <p className="text-slate-200 leading-relaxed font-medium">
                            {c.howToImprove}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-cyan-300/80 italic flex items-start gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
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
