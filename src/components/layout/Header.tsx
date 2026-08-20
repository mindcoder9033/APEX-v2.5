import React, { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2, Clock, Wifi, Award, Radio, Activity, BarChart3, LayoutDashboard } from 'lucide-react';

export type AppView = 'dashboard' | 'curriculum' | 'practice' | 'debrief' | 'history';

export interface NetworkInfo {
  directIps: string[];
  broadcastIps: string[];
  udpPort: number;
  secondaryUdpPort: number;
}

interface HeaderProps {
  currentView: AppView;
  setCurrentView?: (view: AppView) => void;
  isSidebarCollapsed?: boolean;
  setIsSidebarCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isUdpConnected: boolean;
  isBridgeConnected?: boolean;
  totalMasteredModules?: number;
  networkInfo?: NetworkInfo | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  isSidebarCollapsed = false,
  setIsSidebarCollapsed,
  isUdpConnected,
  isBridgeConnected = false,
  networkInfo
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false;
  });

  const [timeStr, setTimeStr] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  useEffect(() => {
    const updateClock = () => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const directIpsList = networkInfo?.directIps && networkInfo.directIps.length > 0
    ? networkInfo.directIps
    : ['192.168.1.35'];

  const broadcastIpsList = networkInfo?.broadcastIps && networkInfo.broadcastIps.length > 0
    ? networkInfo.broadcastIps
    : ['192.168.1.255', '255.255.255.255'];

  const udpPort = networkInfo?.udpPort || 5300;

  return (
    <header className="h-16 bg-[#0E0E14] border-b border-[#232332] px-6 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand Logo & Sidebar Toggle */}
      <div className="flex items-center space-x-4">
        {setIsSidebarCollapsed && (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="p-2 bg-[#14141E] hover:bg-[#1C1C28] border border-[#232332] text-slate-400 hover:text-white transition-all active:scale-95"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-slate-300" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-300" />
            )}
          </button>
        )}

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 chamfer-btn-sm bg-gradient-to-br from-[#E10600] to-[#880400] flex items-center justify-center shadow-lg shadow-red-950/50 border border-red-500/40">
            <span className="font-racing font-bold text-xl text-white tracking-wider">A</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-racing font-bold text-xl tracking-wider text-white">APEX</span>
              <span className="chamfer-badge bg-[#E10600]/20 text-[#FF4D4D] text-[10px] font-mono font-bold px-2 py-0.5 border border-[#E10600]/40">v2.5</span>
            </div>
            <p className="text-[11px] text-[#8E8E9F] font-medium tracking-tight font-sans">Analytical Simracing Coach</p>
          </div>
        </div>
      </div>


      {/* Right Controls: Ingest Status, Network Info & Actions */}
      <div className="flex items-center space-x-2.5">
        {/* UDP Connection Status Pill */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 border text-xs font-mono font-medium ${isUdpConnected
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
          : isBridgeConnected
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            : 'bg-[#181822] border-[#2A2A3C] text-slate-400'
          }`}>
          <div className={`w-2 h-2 diamond-pip ${isUdpConnected
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

        {/* Network IP & Port Helper Hover Tooltip */}
        <div className="relative group">
          <button
            type="button"
            aria-label="Forza Telemetry Network Info"
            className="w-8 h-8 flex items-center justify-center bg-[#14141E] hover:bg-[#1C1C28] border border-[#232332] hover:border-amber-500/60 text-amber-400 font-mono font-bold text-sm transition-all shadow-sm cursor-help active:scale-95"
          >
            !
          </button>

          {/* Hover Tooltip Card */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#101018]/95 backdrop-blur-md border border-[#2E2E42] shadow-2xl p-4 hidden group-hover:block z-50 transition-all pointer-events-none">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#232332]">
              <div className="flex items-center space-x-2">
                <Wifi className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="text-[11px] font-racing font-bold tracking-wider text-slate-200 uppercase">
                  Forza Telemetry Config
                </span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${isBridgeConnected
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/60 border-red-500/50 text-red-300'
                }`}>
                {isBridgeConnected ? 'BRIDGE ONLINE' : 'BRIDGE STANDBY'}
              </span>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">Direct Laptop IP:</span>
                <span className="text-white font-bold text-xs bg-[#181824] px-1.5 py-0.5 border border-[#28283C] inline-block mt-0.5">
                  {directIpsList.join(' • ')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">
                  Subnet Broadcast IP <span className="text-emerald-400">(Recommended)</span>:
                </span>
                <span className="text-emerald-300 font-bold text-xs bg-emerald-950/30 px-1.5 py-0.5 border border-emerald-600/40 inline-block mt-0.5">
                  {broadcastIpsList.join(' • ')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-300 border-t border-[#1C1C28]">
                <span>Data Out Port: <strong className="text-amber-400 font-mono text-xs">{udpPort}</strong></span>
                <span>Format: <strong className="text-slate-200 font-mono">CarDash</strong></span>
              </div>

              <div className="pt-2 text-[10px] font-sans text-slate-400 leading-snug border-t border-[#1C1C28]">
                💡 <span className="text-slate-300">Pro Tip:</span> Set Forza Data Out IP to your <strong className="text-emerald-300">Broadcast IP</strong> ({broadcastIpsList[0] || '192.168.1.255'}). You will never have to re-enter settings when your Wi-Fi IP changes!
              </div>
            </div>
          </div>
        </div>

        {/* 12-Hour Real-Time Clock */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14141E] border border-[#232332] text-xs font-mono font-medium text-slate-200 shadow-sm" title="System Local Time">
          <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="tabular-nums tracking-wide">{timeStr}</span>
        </div>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F11)'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className={`p-2 border text-xs transition-all flex items-center justify-center ${isFullscreen
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


