import React from 'react';
import { Award, Radio, Activity, BarChart3, Disc, LayoutDashboard } from 'lucide-react';
import { AppView } from './Header';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isCollapsed: boolean;
  setIsCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  totalMasteredModules: number;
  isUdpConnected: boolean;
  isRecording?: boolean;
  recordingDurationSec?: number;
  recordedLapsCount?: number;
  stintCount?: number;
}

interface NavItem {
  id: AppView;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  isCollapsed,
  setIsCollapsed,
  totalMasteredModules,
  isUdpConnected,
  isRecording = false,
  recordingDurationSec = 0,
  recordedLapsCount = 0,
  stintCount = 0,
}) => {
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'curriculum',
      label: 'Academy',
      shortLabel: 'Academy',
      icon: Award,
      badge: totalMasteredModules > 0 ? (
        <span className="bg-[#E10600]/20 text-[#FF5C5C] text-[10px] px-1.5 py-0.5 font-mono font-bold border border-[#E10600]/30">
          {totalMasteredModules}/14
        </span>
      ) : null,
    },
    {
      id: 'practice',
      label: 'Live Stint',
      shortLabel: 'Live Stint',
      icon: Radio,
      badge: isUdpConnected ? (
        <span className="flex items-center space-x-1 bg-emerald-950/40 text-emerald-400 text-[10px] px-1.5 py-0.5 font-mono font-semibold border border-emerald-500/30">
          <span className="w-1.5 h-1.5 diamond-pip bg-emerald-400 animate-pulse"></span>
          <span>60Hz</span>
        </span>
      ) : null,
    },
    {
      id: 'debrief',
      label: 'Analysis',
      shortLabel: 'Analysis',
      icon: Activity,
    },
    {
      id: 'history',
      label: 'Stint Records',
      shortLabel: 'Records',
      icon: BarChart3,
      badge: stintCount > 0 ? (
        <span className="bg-[#1C1C28] text-slate-400 text-[10px] px-1.5 py-0.5 font-mono font-semibold border border-[#2A2A3E]">
          {stintCount} {stintCount === 1 ? 'stint' : 'stints'}
        </span>
      ) : null,
    },
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={`relative flex flex-col bg-[#0E0E14] border-r border-[#232332] transition-all duration-300 ease-in-out shrink-0 select-none z-20 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Navigation Section */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <div key={item.id} className="relative group">
              <button
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center transition-all duration-150 relative ${
                  isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#181824] text-white border-l-4 border-[#E10600] shadow-sm shadow-red-950/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#14141E] border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-[#FF4D4D] scale-105' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span
                      className={`text-xs font-semibold tracking-wide truncate ${
                        isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <div className="shrink-0 ml-2">{item.badge}</div>
                )}

                {/* Collapsed active dot indicator */}
                {isCollapsed && isActive && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-3 bg-[#E10600]" />
                )}
              </button>

              {/* Hover Tooltip in Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex items-center space-x-2 bg-[#12121A] text-white text-xs font-semibold px-3 py-2 border border-[#2E2E42] shadow-2xl z-50 whitespace-nowrap pointer-events-none">
                  <span>{item.label}</span>
                  {item.badge && <div className="ml-1">{item.badge}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Recording Status Indicator (Shown when recording is active) */}
      {isRecording && (
        <div className={`px-2 py-2 border-t border-[#232332] bg-[#120808] ${isCollapsed ? 'text-center' : ''}`}>
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } px-2 py-1.5 bg-red-950/40 border border-red-600/40 text-red-400`}
            title={`Recording Active • ${formatDuration(recordingDurationSec)} • ${recordedLapsCount} laps`}
          >
            <div className="flex items-center space-x-2">
              <Disc className="w-3.5 h-3.5 text-red-500 animate-spin" />
              {!isCollapsed && (
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-red-300">
                  REC {formatDuration(recordingDurationSec)}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-red-400 font-bold">
                {recordedLapsCount} {recordedLapsCount === 1 ? 'lap' : 'laps'}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
