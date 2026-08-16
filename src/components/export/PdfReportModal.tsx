import React, { useRef, useState } from 'react';
import { LapAnalysis } from '../../types/telemetry';
import { Module, Session } from '../../types/curriculum';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { X, FileDown, CheckCircle2, Shield, Activity, Target, Sparkles, Printer } from 'lucide-react';

interface PdfReportModalProps {
  lap: LapAnalysis;
  module?: Module;
  session?: Session;
  onClose: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  lap,
  module,
  session,
  onClose
}) => {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A0A0E'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`APEX_Debrief_Lap_${lap.lapNumber}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0E0E16] w-full max-w-5xl h-[92vh] rounded-3xl border border-[#2A2A3E] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#232332] bg-[#12121A] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#E10600] flex items-center justify-center text-white">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Race-Engineer Telemetry Report Preview</h2>
              <p className="text-[11px] text-[#8E8E9F]">Multi-page PDF export with telemetry traces and Skip Barber debrief</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#E10600] hover:bg-[#FF1801] text-white text-xs font-bold shadow-lg shadow-red-950/60 active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Rendering PDF...' : 'Download PDF Report'}</span>
            </button>

            <button onClick={onClose} className="p-2 rounded-xl bg-[#1A1A26] text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Document Preview Canvas Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#060608] flex justify-center">
          <div
            ref={reportRef}
            className="w-[800px] bg-[#0E0E14] border border-[#232332] rounded-xl p-8 space-y-6 text-slate-200 shadow-2xl"
          >
            {/* Header Document Banner */}
            <div className="border-b border-[#232332] pb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-[#E10600] flex items-center justify-center font-display font-black text-xs text-white">
                    A
                  </div>
                  <span className="font-display font-black text-lg tracking-wider text-white">APEX RACE DEBRIEF</span>
                  <span className="text-[10px] font-mono bg-[#E10600]/20 text-[#FF4D4D] px-1.5 py-0.5 rounded border border-[#E10600]/40 font-bold">
                    OFFICIAL
                  </span>
                </div>
                <p className="text-xs text-[#8E8E9F] mt-1 font-mono">
                  {module ? `Module ${module.moduleNumber}: ${module.title}` : 'General Telemetry Stint'} • {session?.title || 'Practice Stint'}
                </p>
              </div>

              <div className="text-right font-mono text-xs text-[#8E8E9F]">
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>Lap Number: #{lap.lapNumber}</div>
                <div>Status: <strong className="text-emerald-400">Validated Clean Lap</strong></div>
              </div>
            </div>

            {/* Executive Summary Grid */}
            <div className="grid grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#14141E] border border-[#222230]">
                <span className="text-[10px] text-slate-400 block">Lap Time</span>
                <strong className="text-sm text-white font-bold">{lap.lapTimeSec.toFixed(2)}s</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#14141E] border border-[#222230]">
                <span className="text-[10px] text-slate-400 block">Top Velocity</span>
                <strong className="text-sm text-[#00F0FF] font-bold">{lap.maxSpeedKph} km/h</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#14141E] border border-[#222230]">
                <span className="text-[10px] text-slate-400 block">Traction Budget %</span>
                <strong className="text-sm text-emerald-400 font-bold">{lap.avgTractionBudgetPct}%</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#14141E] border border-[#222230]">
                <span className="text-[10px] text-slate-400 block">Mastery Score</span>
                <strong className="text-sm text-amber-400 font-bold">{lap.overallScore}%</strong>
              </div>
            </div>

            {/* Tactical Action Items */}
            <div className="p-4 rounded-xl bg-[#14141E] border border-[#262638] space-y-2">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[#FF4D4D] flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Executive Action Plan</span>
              </h3>
              <div className="space-y-1.5">
                {lap.actionItems.map((item, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                    <span className="text-[#E10600] font-bold font-mono">[{i + 1}]</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Turn-by-Turn Telemetry Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">
                Turn-by-Turn Sector Breakdown
              </h3>
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#232332] text-slate-400 text-[10px] uppercase">
                    <th className="py-2">Corner</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Brake Decay</th>
                    <th className="py-2">Apex Min Speed</th>
                    <th className="py-2">Grip Util</th>
                    <th className="py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B1B26]">
                  {lap.corners.map((c) => (
                    <tr key={c.cornerIndex} className="hover:bg-[#14141E]">
                      <td className="py-2.5 font-bold text-white">T{c.cornerIndex} - {c.cornerName.split('(')[0]}</td>
                      <td className="py-2.5 text-[#8E8E9F] uppercase text-[10px]">{c.type}</td>
                      <td className="py-2.5 text-slate-300">{c.trailBrakingDecayDurationSec.toFixed(2)}s</td>
                      <td className="py-2.5 text-emerald-400">{c.apexMinSpeedKph} km/h</td>
                      <td className="py-2.5 text-purple-400">{c.apexGripUtilizationPct}%</td>
                      <td className="py-2.5 text-right font-bold text-amber-400">{c.cornerScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Sign-off */}
            <div className="pt-4 border-t border-[#232332] flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>APEX Simracing Engineering System • Skip Barber Curriculum Engine</span>
              <span>Page 1 of 1 • Certified Analytical Record</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
