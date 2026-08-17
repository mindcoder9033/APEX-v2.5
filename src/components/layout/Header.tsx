import React, { useState, useEffect } from 'react';
import { Activity, Award, BarChart3, Radio, Maximize2, Minimize2 } from 'lucide-react';

export type AppView = 'curriculum' | 'practice' | 'debrief' | 'history';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isUdpConnected: boolean;
  isBridgeConnected?: boolean;
  totalMasteredModules: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  isUdpConnected,
  isBridgeConnected = false,
  totalMasteredModules
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed or was blocked by browser permissions:', err);
    }
  };

  return (
    <header className="h-16 bg-[#0E0E14] border-b border-[#232332] px-6 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 chamfer-btn-sm bg-gradient-to-br from-[#E10600] to-[#880400] flex items-center justify-center shadow-lg shadow-red-950/50 border border-red-500/40">
          <span className="font-racing font-bold text-xl text-white tracking-wider">A</span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-racing font-bold text-xl tracking-wider text-white">APEX</span>
            <span className="chamfer-badge bg-[#E10600]/20 text-[#FF4D4D] text-[10px] font-mono font-bold px-2 py-0.5 border border-[#E10600]/40">v2.5</span>
          </div>
          <p className="text-[11px] text-[#8E8E9F] font-medium tracking-tight font-sans">Analytical Simracing Coach • Skip Barber Curriculum</p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center space-x-1 bg-[#14141E] p-1 border border-[#232332]">
        <button
          onClick={() => setCurrentView('curriculum')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold transition-all ${
            currentView === 'curriculum'
              ? 'bg-[#E10600] text-white chamfer-tab shadow-md shadow-red-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1C28]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Curriculum Academy</span>
          {totalMasteredModules > 0 && (
            <span className="bg-white/20 text-[10px] px-1.5 py-0.5 font-mono font-bold">
              {totalMasteredModules}/14
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('practice')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold transition-all ${
            currentView === 'practice'
              ? 'bg-[#E10600] text-white chamfer-tab shadow-md shadow-red-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1C28]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Live Ingest & Practice</span>
          {isUdpConnected && (
            <span className="w-1.5 h-1.5 diamond-pip bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('debrief')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold transition-all ${
            currentView === 'debrief'
              ? 'bg-[#E10600] text-white chamfer-tab shadow-md shadow-red-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1C28]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Telemetry & Debrief</span>
        </button>

        <button
          onClick={() => setCurrentView('history')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold transition-all ${
            currentView === 'history'
              ? 'bg-[#E10600] text-white chamfer-tab shadow-md shadow-red-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1C28]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Driver History</span>
        </button>
      </nav>

      {/* Right Controls: Ingest Status & Actions */}
      <div className="flex items-center space-x-2.5">
        {/* UDP Connection Status Pill */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 border text-xs font-mono font-medium ${
          isUdpConnected
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : isBridgeConnected
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            : 'bg-[#181822] border-[#2A2A3C] text-slate-400'
        }`}>
          <div className={`w-2 h-2 diamond-pip ${
            isUdpConnected
              ? 'bg-emerald-400 animate-ping'
              : isBridgeConnected
              ? 'bg-amber-400 animate-pulse'
              : 'bg-slate-500'
          }`} />
          <span>
            {isUdpConnected
              ? 'Forza 60Hz Live'
              : isBridgeConnected
              ? 'Bridge Ready • Waiting for Forza'
              : 'Bridge Offline (Port 5300)'}
          </span>
        </div>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F11)'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className={`p-2 border text-xs transition-all flex items-center justify-center ${
            isFullscreen
              ? 'bg-[#E10600]/15 border-[#E10600]/40 text-[#FF5C5C] hover:bg-[#E10600]/25 shadow-sm shadow-red-950/40'
              : 'bg-[#14141E] border-[#232332] text-slate-400 hover:text-white hover:bg-[#1C1C28] hover:border-slate-600'
          }`}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 transition-transform active:scale-95" />
          ) : (
            <Maximize2 className="w-4 h-4 transition-transform active:scale-95" />
          )}
        </button>
      </div>
    </header>
  );
};

