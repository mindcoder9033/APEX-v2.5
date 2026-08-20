import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Award, User, Hash, Sparkles, Volume2, ShieldAlert } from 'lucide-react';
import { 
  DriverProfile, 
  DriverExperienceLevel, 
  CoachTone, 
  HELMET_PRESETS, 
  ACCENT_COLOR_PRESETS 
} from '../../types/profile';
import { DriverHelmetAvatar } from './DriverHelmetAvatar';

interface DriverProfileModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  profileToEdit?: DriverProfile | null;
  canDelete?: boolean;
  onClose: () => void;
  onSave: (profileData: {
    id?: string;
    name: string;
    racingNumber: string;
    nickname?: string;
    avatarId: string;
    colorAccent: string;
    experienceLevel: DriverExperienceLevel;
    coachTone: CoachTone;
  }) => void;
  onDelete?: (profileId: string) => void;
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  isOpen,
  mode,
  profileToEdit,
  canDelete = false,
  onClose,
  onSave,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [racingNumber, setRacingNumber] = useState('01');
  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState('helmet_red');
  const [colorAccent, setColorAccent] = useState('#E10600');
  const [experienceLevel, setExperienceLevel] = useState<DriverExperienceLevel>('Beginner');
  const [coachTone, setCoachTone] = useState<CoachTone>('friendly_coach');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      setErrorMsg(null);
      if (mode === 'edit' && profileToEdit) {
        setName(profileToEdit.name);
        setRacingNumber(profileToEdit.racingNumber);
        setNickname(profileToEdit.nickname || '');
        setAvatarId(profileToEdit.avatarId);
        setColorAccent(profileToEdit.colorAccent);
        setExperienceLevel(profileToEdit.experienceLevel);
        setCoachTone(profileToEdit.coachTone);
      } else {
        setName('');
        setRacingNumber(String(Math.floor(Math.random() * 89) + 10));
        setNickname('');
        setAvatarId('helmet_red');
        setColorAccent('#E10600');
        setExperienceLevel('Beginner');
        setCoachTone('friendly_coach');
      }
    }
  }, [isOpen, mode, profileToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Driver name is required.');
      return;
    }
    const cleanNumber = (racingNumber.trim() || '01').replace(/[^0-9]/g, '').slice(0, 3);
    
    onSave({
      id: profileToEdit?.id,
      name: name.trim(),
      racingNumber: cleanNumber || '01',
      nickname: nickname.trim(),
      avatarId,
      colorAccent,
      experienceLevel,
      coachTone
    });
    onClose();
  };

  const handleDelete = () => {
    if (profileToEdit && onDelete) {
      onDelete(profileToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-[#101018] border border-[#2A2A3C] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#14141E] border-b border-[#232332]">
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-8 border-l-4"
              style={{ borderColor: colorAccent }}
            />
            <div>
              <h2 className="text-base font-racing font-bold tracking-wider text-white uppercase">
                {mode === 'create' ? 'Create New Driver Profile' : 'Edit Driver Profile'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {mode === 'create' ? 'Initialize an isolated workspace & telemetry sandbox' : `Customizing #${racingNumber} ${name || 'Driver'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-[#1C1C28] hover:bg-[#28283C] border border-[#2E2E42] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="px-4 py-2.5 bg-red-950/60 border border-red-500/60 text-red-200 text-xs font-mono">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Live Profile Card Preview Banner */}
          <div className="p-4 bg-[#14141E] border border-[#232332] flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DriverHelmetAvatar
                avatarId={avatarId}
                colorAccent={colorAccent}
                racingNumber={racingNumber || '01'}
                size="lg"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-racing font-bold tracking-wide text-white">
                    {name.trim() || 'Driver Name'}
                  </span>
                  <span 
                    className="font-mono font-bold text-xs px-2 py-0.5 border"
                    style={{ 
                      backgroundColor: `${colorAccent}20`,
                      borderColor: `${colorAccent}60`,
                      color: colorAccent
                    }}
                  >
                    #{racingNumber || '01'}
                  </span>
                </div>
                {nickname && (
                  <p className="text-xs text-slate-400 font-mono italic">"{nickname}"</p>
                )}
                <div className="flex items-center space-x-3 mt-1.5 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-300">{experienceLevel}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300">
                      {coachTone === 'friendly_coach' ? 'Friendly Coach' : 'Pro Race Engineer'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Input Grid: Name, Number, Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Driver Name *</span>
              </label>
              <input
                type="text"
                required
                maxLength={32}
                placeholder="e.g. Alex Turner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#181824] border border-[#2E2E42] focus:border-[#00F0FF] text-white px-3 py-2 text-sm font-sans outline-none transition-colors placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>Racing #</span>
              </label>
              <input
                type="text"
                maxLength={3}
                placeholder="e.g. 77"
                value={racingNumber}
                onChange={(e) => setRacingNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-[#181824] border border-[#2E2E42] focus:border-amber-400 text-white px-3 py-2 text-sm font-mono text-center font-bold outline-none transition-colors"
              />
            </div>
          </div>

          {/* Helmet Livery Style Selection */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E10600]" />
              <span>Select Helmet Livery Preset</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {HELMET_PRESETS.map((preset) => {
                const isSelected = avatarId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarId(preset.id);
                      setColorAccent(preset.primaryColor);
                    }}
                    className={`flex items-center space-x-3 p-2.5 border transition-all text-left ${
                      isSelected
                        ? 'bg-[#1C1C28] border-white shadow-md'
                        : 'bg-[#14141E] hover:bg-[#181824] border-[#262638] text-slate-400'
                    }`}
                  >
                    <DriverHelmetAvatar
                      avatarId={preset.id}
                      colorAccent={preset.primaryColor}
                      racingNumber={racingNumber || '01'}
                      size="sm"
                      showNumber={false}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{preset.theme}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Palette */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
              Livery Accent & Badge Color
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLOR_PRESETS.map((col) => {
                const isSelected = colorAccent.toLowerCase() === col.hex.toLowerCase();
                return (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setColorAccent(col.hex)}
                    title={col.label}
                    className={`w-8 h-8 rounded-none border-2 flex items-center justify-center transition-transform ${
                      isSelected ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Level & Coach Tone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#232332]">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Experience Level</span>
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as DriverExperienceLevel)}
                className="w-full bg-[#181824] border border-[#2E2E42] focus:border-[#00F0FF] text-white px-3 py-2 text-xs font-mono outline-none"
              >
                <option value="Beginner">Beginner (Module 1-4 Foundation)</option>
                <option value="Novice">Novice (Advanced Vehicle Dynamics)</option>
                <option value="Intermediate">Intermediate (Apex Optimization)</option>
                <option value="Advanced">Advanced (High-G Limit Handling)</option>
                <option value="Expert">Expert (Full Skip Barber Mastery)</option>
              </select>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Sets starting curriculum module unlocks for this driver.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Coach Voice Tone</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCoachTone('friendly_coach')}
                  className={`px-3 py-2 border text-xs font-mono font-semibold transition-colors text-center ${
                    coachTone === 'friendly_coach'
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                      : 'bg-[#181824] border-[#2E2E42] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Friendly Coach
                </button>
                <button
                  type="button"
                  onClick={() => setCoachTone('pro_engineer')}
                  className={`px-3 py-2 border text-xs font-mono font-semibold transition-colors text-center ${
                    coachTone === 'pro_engineer'
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-[#181824] border-[#2E2E42] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pro Engineer
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Adjusts terminology and feedback strictness in PDF debriefs.
              </p>
            </div>
          </div>

          {/* Delete Danger Section (Edit mode only) */}
          {mode === 'edit' && canDelete && profileToEdit && !profileToEdit.isDefault && (
            <div className="pt-4 border-t border-red-950/50">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-2 text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete this driver profile...</span>
                </button>
              ) : (
                <div className="p-3 bg-red-950/40 border border-red-600/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-red-200 text-xs font-mono">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Confirm deletion of "{profileToEdit.name}"? This removes its progress and stint history.</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1 bg-[#181824] border border-[#2E2E42] text-xs font-mono text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-[#14141E] border-t border-[#232332]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#181824] hover:bg-[#202030] border border-[#2E2E42] text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-5 py-2 bg-[#E10600] hover:bg-[#C00500] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md shadow-red-950/50 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{mode === 'create' ? 'Create Profile' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
