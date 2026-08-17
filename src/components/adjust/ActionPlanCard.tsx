import React from 'react';
import { Target, CheckCircle2, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';

interface ActionPlanCardProps {
  actionItems: string[];
  onStartNewStint?: () => void;
}

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({
  actionItems,
  onStartNewStint
}) => {
  return (
    <div className="p-6 bg-gradient-to-br from-[#181824] via-[#12121A] to-[#101016] border border-[#2D2D40] shadow-xl space-y-4 hud-bracket">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-[#E10600]/20 flex items-center justify-center border border-[#E10600]/40">
            <Lightbulb className="w-4 h-4 text-[#FF4D4D]" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-racing uppercase tracking-wider text-white">
              Stage 4: Tactical Action Plan for Next Stint
            </h3>
            <p className="text-xs text-[#8E8E9F] font-sans">Prioritized focal points to improve your lap time and consistency</p>
          </div>
        </div>

        {onStartNewStint && (
          <button
            onClick={onStartNewStint}
            className="chamfer-btn flex items-center space-x-2 px-4 py-2 bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-racing font-bold tracking-wide shadow-lg shadow-red-950/60 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Apply in Next Practice Stint</span>
          </button>
        )}
      </div>

      <div className="space-y-2.5 pt-2">
        {actionItems.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-[#14141E] border border-[#242436] flex items-start space-x-3 hover:border-[#383850] transition-colors"
          >
            <div className="w-5 h-5 bg-[#E10600] text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 tabular-nums">
              {idx + 1}
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
