import React, { useState, useEffect, useMemo } from 'react';
import { Flag, Car, MapPin, CheckCircle2, FastForward, Timer, Award, Sparkles } from 'lucide-react';
import { LapAnalysis } from '../../types/telemetry';
import { SearchableSelect } from '../common/SearchableSelect';
import { getManufacturers, getCarsByManufacturer, parseCarName } from '../../data/cars';
import { getTrackVenues, getLayoutsByVenue, parseTrackName } from '../../data/tracks';

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
  detectedCarName?: string;
  detectedTrackName?: string;
  onSave: (metadata: StintMetadataInput) => void;
  onSkip: () => void;
}

export const StintMetadataModal: React.FC<StintMetadataModalProps> = ({
  isOpen,
  stintNumber,
  durationSec,
  laps,
  detectedCarName,
  detectedTrackName,
  onSave,
  onSkip
}) => {
  // Infer detected car/track from props or lap items if available
  const autoCar = detectedCarName || laps.find(l => l.detectedCarName)?.detectedCarName;
  const autoTrack = detectedTrackName || laps.find(l => l.detectedTrackName)?.detectedTrackName;

  const defaultTitle = `Practice Stint #${stintNumber}`;
  const effectiveDefaultCar = autoCar || 'Formula Skip Barber 2000';
  const effectiveDefaultTrack = autoTrack || 'Lime Rock Full';

  const [title, setTitle] = useState(defaultTitle);
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [trackVenue, setTrackVenue] = useState('');
  const [trackLayout, setTrackLayout] = useState('');

  const allManufacturers = useMemo(() => getManufacturers(), []);
  const allTrackVenues = useMemo(() => getTrackVenues(), []);

  const availableCarModels = useMemo(() => {
    if (!carMake) return [];
    return getCarsByManufacturer(carMake);
  }, [carMake]);

  const availableTrackLayouts = useMemo(() => {
    if (!trackVenue) return [];
    return getLayoutsByVenue(trackVenue);
  }, [trackVenue]);

  // Sync defaults and auto-detection when modal opens or stintNumber changes
  useEffect(() => {
    if (isOpen) {
      setTitle(`Practice Stint #${stintNumber}`);

      // Auto-resolve Car
      const parsedCar = parseCarName(autoCar);
      if (parsedCar) {
        setCarMake(parsedCar.manufacturer);
        setCarModel(parsedCar.fullName);
      } else if (autoCar) {
        setCarMake('');
        setCarModel(autoCar);
      } else {
        setCarMake('Mazda');
        const mazdaCars = getCarsByManufacturer('Mazda');
        setCarModel(mazdaCars[0] || 'Mazda Formula Mazda 2015');
      }

      // Auto-resolve Track
      const parsedTrack = parseTrackName(autoTrack);
      if (parsedTrack) {
        setTrackVenue(parsedTrack.venue);
        setTrackLayout(parsedTrack.layout);
      } else if (autoTrack) {
        setTrackVenue('');
        setTrackLayout(autoTrack);
      } else {
        setTrackVenue('Lime Rock Park');
        setTrackLayout('Lime Rock Full');
      }
    }
  }, [isOpen, stintNumber, autoCar, autoTrack]);

  // Handle ESC key for quick skip
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

  const handleCarMakeChange = (newMake: string) => {
    setCarMake(newMake);
    const models = getCarsByManufacturer(newMake);
    if (models.length > 0) {
      setCarModel(models[0]);
    } else {
      setCarModel('');
    }
  };

  const handleTrackVenueChange = (newVenue: string) => {
    setTrackVenue(newVenue);
    const layouts = getLayoutsByVenue(newVenue);
    if (layouts.length > 0) {
      setTrackLayout(layouts[0]);
    } else {
      setTrackLayout('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim() || defaultTitle,
      carName: carModel.trim() || carMake.trim() || effectiveDefaultCar,
      trackName: trackLayout.trim() || trackVenue.trim() || effectiveDefaultTrack
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
      <div className="w-full max-w-xl bg-[#12121A] border border-[#2A2A3E] shadow-2xl p-6 relative overflow-visible hud-bracket">
        {/* Decorative Top Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00F0FF] via-[#E10600] to-amber-400" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
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
        <div className="grid grid-cols-3 gap-2.5 p-3 mb-4 bg-[#0D0D14] border border-[#20202E]">
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
            <label className="block text-xs font-tech font-bold uppercase tracking-wider text-slate-300 mb-1">
              Session / Stint Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle}
              className="w-full bg-[#181824] border border-[#2E2E42] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] transition-colors font-sans placeholder-slate-600"
              autoFocus
            />
          </div>

          {/* Car Used: Make -> Model */}
          <div className="p-3 bg-[#0E0E16] border border-[#222232] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-tech font-bold uppercase tracking-wider text-slate-200">
                <Car className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Car Used</span>
              </div>
              {autoCar && (
                <span className="flex items-center space-x-1 text-[9px] text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 border border-[#00F0FF]/30 uppercase font-mono tracking-tight" title={`Detected: ${autoCar}`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[180px]">Auto-detected: {autoCar}</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  1. Manufacturer
                </label>
                <SearchableSelect
                  options={allManufacturers}
                  value={carMake}
                  onChange={handleCarMakeChange}
                  placeholder="Select Make..."
                  searchPlaceholder="Search manufacturer..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  2. Car Model
                </label>
                <SearchableSelect
                  options={availableCarModels}
                  value={carModel}
                  onChange={setCarModel}
                  placeholder={carMake ? "Select Model..." : "Select Make first"}
                  searchPlaceholder="Search model..."
                  disabled={!carMake}
                  disabledTooltip="Please select a manufacturer first"
                />
              </div>
            </div>
          </div>

          {/* Track Name: Venue -> Layout */}
          <div className="p-3 bg-[#0E0E16] border border-[#222232] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-tech font-bold uppercase tracking-wider text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#E10600]" />
                <span>Track Name</span>
              </div>
              {autoTrack && (
                <span className="flex items-center space-x-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/30 uppercase font-mono tracking-tight" title={`Detected: ${autoTrack}`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[180px]">Auto-detected: {autoTrack}</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  1. Track Venue
                </label>
                <SearchableSelect
                  options={allTrackVenues}
                  value={trackVenue}
                  onChange={handleTrackVenueChange}
                  placeholder="Select Track..."
                  searchPlaceholder="Search track venue..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  2. Track Layout
                </label>
                <SearchableSelect
                  options={availableTrackLayouts}
                  value={trackLayout}
                  onChange={setTrackLayout}
                  placeholder={trackVenue ? "Select Layout..." : "Select Venue first"}
                  searchPlaceholder="Search layout..."
                  disabled={!trackVenue}
                  disabledTooltip="Please select a track venue first"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#232334] mt-4">
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
