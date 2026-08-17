import React, { useState, useEffect } from 'react';
import { Flag, Car, MapPin, CheckCircle2, FastForward, Timer, Award } from 'lucide-react';
import { LapAnalysis } from '../../types/telemetry';

export interface StintMetadataInput {
  title: string;
  carName: string;
  trackName: string;
}

interface StintMetadataModalProps {
  isOpen: boolean;
  stintNumber: number;
  durationSec: number;
  laps: LapAnalysis[];
  onSave: (metadata: StintMetadataInput) => void;
  onSkip: () => void;
}

export const StintMetadataModal: React.FC<StintMetadataModalProps> = ({
  isOpen,
  stintNumber,
  durationSec,
  laps,
  onSave,
  onSkip
}) => {
  const defaultTitle = `Practice Stint #${stintNumber}`;
  const defaultCar = 'Formula Skip Barber 2000';
  const defaultTrack = 'Lime Rock Park - Full Circuit';

  const [title, setTitle] = useState(defaultTitle);
  const [carName, setCarName] = useState(defaultCar);
  const [trackName, setTrackName] = useState(defaultTrack);

  // Sync defaults when modal opens or stintNumber changes
  useEffect(() => {
    if (isOpen) {
      setTitle(`Practice Stint #${stintNumber}`);
      setCarName('Formula Skip Barber 2000');
      setTrackName('Lime Rock Park - Full Circuit');
    }
  }, [isOpen, stintNumber]);

  // Handle ESC key for quick skip and ENTER for save
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSkip]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim() || defaultTitle,
      carName: carName.trim() || defaultCar,
      trackName: trackName.trim() || defaultTrack
    });
  };

  const bestLap = laps.reduce((best, cur) => 
    (!best || cur.lapTimeSec < best.lapTimeSec) ? cur : best
  , laps[0]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const formatLapTime = (sec?: number) => {
    if (!sec || isNaN(sec)) return '--:--.---';
    const mins = Math.floor(sec / 60);
    const remainder = (sec % 60).toFixed(3);
    return `${mins}:${remainder.padStart(6, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#12121A] border border-[#2A2A3E] shadow-2xl p-6 relative overflow-hidden hud-bracket">
        {/* Decorative Top Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00F0FF] via-[#E10600] to-amber-400" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#E10600]/15 border border-[#E10600]/40 flex items-center justify-center text-[#E10600]">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-racing font-bold text-white uppercase tracking-wider">
                Complete Stint & Save Debrief
              </h2>
              <p className="text-xs text-[#8E8E9F] font-sans">
                Review telemetry metadata or skip to apply default telemetry tags
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stint Stat Highlights */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 mb-5 bg-[#0D0D14] border border-[#20202E]">
          <div className="flex flex-col">
            <span className="text-[10px] font-tech text-[#8E8E9F] uppercase">Laps Recorded</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Award className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-sm font-hud font-bold text-white">
                {laps.length} {laps.length === 1 ? 'Lap' : 'Laps'}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-tech text-[#8E8E9F] uppercase">Total Duration</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-mono font-bold text-slate-200">
                {formatDuration(durationSec)}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-tech text-[#8E8E9F] uppercase">Best Lap</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatLapTime(bestLap?.lapTimeSec)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-tech font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Session / Stint Title
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={defaultTitle}
                className="w-full bg-[#181824] border border-[#2E2E42] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00F0FF] transition-colors font-sans placeholder-slate-600"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-tech font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Car className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Car Used</span>
              </label>
              <input
                type="text"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                placeholder={defaultCar}
                className="w-full bg-[#181824] border border-[#2E2E42] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] transition-colors font-sans placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-tech font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E10600]" />
                <span>Track Name</span>
              </label>
              <input
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder={defaultTrack}
                className="w-full bg-[#181824] border border-[#2E2E42] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] transition-colors font-sans placeholder-slate-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#232334] mt-6">
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 text-xs font-racing text-slate-400 hover:text-white hover:bg-[#1C1C2A] border border-[#2E2E42] transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Apply defaults and proceed immediately (ESC)"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Skip & Use Defaults</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-racing font-bold tracking-wide bg-[#E10600] hover:bg-[#FF1801] text-white shadow-lg shadow-red-950/60 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Open Debrief</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
