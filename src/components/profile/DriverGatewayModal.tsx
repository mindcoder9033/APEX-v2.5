import React, { useState } from 'react';
import { Plus, Check, Edit3, Award, Clock, ArrowRight, ShieldCheck, Flag } from 'lucide-react';
import { DriverProfile, ProfilesManifest } from '../../types/profile';
import { DriverHelmetAvatar } from './DriverHelmetAvatar';

interface DriverGatewayModalProps {
  isOpen: boolean;
  manifest: ProfilesManifest;
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: () => void;
  onEditProfile: (profile: DriverProfile) => void;
  onToggleAutoLogin: (autoLogin: boolean) => void;
  onClose?: () => void;
}

export const DriverGatewayModal: React.FC<DriverGatewayModalProps> = ({
  isOpen,
  manifest,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onEditProfile,
  onToggleAutoLogin,
  onClose
}) => {
  const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null);

  if (!isOpen) return null;

  const profiles = manifest.profiles || [];
  const autoLogin = manifest.autoLoginLastDriver;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080C]/95 backdrop-blur-xl p-4 sm:p-8 select-none animate-fade-in overflow-y-auto">
      {/* Background Graphic Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#E10600 1px, transparent 1px), radial-gradient(#00F0FF 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px'
        }}
      />

      <div className="relative w-full max-w-4xl bg-[#101018] border border-[#262638] shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Gateway Top Branding */}
        <div className="px-8 pt-8 pb-6 border-b border-[#20202E] bg-gradient-to-b from-[#161622] to-[#101018] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 chamfer-btn bg-gradient-to-br from-[#E10600] to-[#880400] flex items-center justify-center shadow-lg shadow-red-950/60 border border-red-500/50 shrink-0">
              <span className="font-racing font-bold text-2xl text-white">A</span>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-racing font-bold tracking-wider text-white uppercase">
                  Who is Driving?
                </h1>
                <span className="chamfer-badge bg-[#E10600]/20 text-[#FF4D4D] text-[10px] font-mono font-bold px-2 py-0.5 border border-[#E10600]/40">
                  APEX v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Select your driver profile to mount isolated telemetry, academy progress, and debrief archives.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onCreateProfile}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1C1C28] hover:bg-[#28283C] border border-[#2E2E42] hover:border-[#00F0FF]/60 text-slate-200 hover:text-white text-xs font-mono font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>New Driver</span>
            </button>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 max-h-[55vh] overflow-y-auto">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const isHovered = hoveredProfileId === profile.id;

            return (
              <div
                key={profile.id}
                onMouseEnter={() => setHoveredProfileId(profile.id)}
                onMouseLeave={() => setHoveredProfileId(null)}
                className={`relative group bg-[#14141E] border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${
                  isActive
                    ? 'border-[#E10600] shadow-xl shadow-red-950/40 ring-1 ring-[#E10600]/50'
                    : 'border-[#232332] hover:border-slate-500 hover:bg-[#181824]'
                }`}
                onClick={() => onSelectProfile(profile.id)}
              >
                {/* Top Accent Strip */}
                <div 
                  className="h-1 w-full"
                  style={{ backgroundColor: profile.colorAccent || '#E10600' }}
                />

                {/* Profile Card Body */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <DriverHelmetAvatar
                      avatarId={profile.avatarId}
                      colorAccent={profile.colorAccent}
                      racingNumber={profile.racingNumber}
                      size="lg"
                    />

                    <div className="flex flex-col items-end space-y-1">
                      {isActive && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-[#E10600]/20 border border-[#E10600]/50 text-[#FF5C5C] text-[9px] font-mono font-bold uppercase tracking-wider">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      )}
                      
                      <button
                        type="button"
                        title="Edit Driver Profile"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProfile(profile);
                        }}
                        className="p-1.5 text-slate-500 hover:text-white bg-[#1C1C28] hover:bg-[#28283C] border border-[#2A2A3C] transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Driver Name & Info */}
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-racing font-bold tracking-wide text-white truncate">
                        {profile.name}
                      </h3>
                      <span 
                        className="font-mono text-xs font-bold px-1.5 py-0.2 border"
                        style={{
                          backgroundColor: `${profile.colorAccent || '#E10600'}15`,
                          borderColor: `${profile.colorAccent || '#E10600'}40`,
                          color: profile.colorAccent || '#E10600'
                        }}
                      >
                        #{profile.racingNumber}
                      </span>
                    </div>

                    {profile.nickname ? (
                      <p className="text-xs text-slate-400 font-mono italic truncate">
                        "{profile.nickname}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 font-mono">
                        {profile.isDefault ? 'Standard Default Profile' : 'Custom Driver Profile'}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-[#20202E] text-[11px] font-mono text-slate-400">
                      <span className="flex items-center space-x-1 text-slate-300">
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{profile.experienceLevel}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-slate-400 truncate">
                        <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{formatDate(profile.lastActiveAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Select / Enter Button Banner */}
                <div className={`px-5 py-2.5 border-t text-xs font-mono font-bold flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-[#E10600]/15 border-[#E10600]/40 text-[#FF7070]'
                    : 'bg-[#181824] border-[#232332] text-slate-400 group-hover:text-white group-hover:bg-[#1E1E2C]'
                }`}>
                  <span>{isActive ? 'Current Driver' : 'Drive with this profile'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}

          {/* Add New Driver Card */}
          <div
            onClick={onCreateProfile}
            className="group bg-[#12121A]/60 hover:bg-[#181824] border-2 border-dashed border-[#2A2A3C] hover:border-[#00F0FF]/60 transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-[#1C1C28] group-hover:bg-[#00F0FF]/15 border border-[#2E2E42] group-hover:border-[#00F0FF]/40 flex items-center justify-center text-slate-400 group-hover:text-[#00F0FF] transition-colors mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-racing font-bold text-sm text-slate-200 group-hover:text-white tracking-wide uppercase">
              Add New Driver
            </span>
            <span className="text-xs text-slate-500 font-mono mt-1 max-w-[180px]">
              Create a fresh profile with separate stats and progression
            </span>
          </div>
        </div>

        {/* Gateway Footer Controls */}
        <div className="px-8 py-4 bg-[#14141E] border-t border-[#232332] flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-mono text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={(e) => onToggleAutoLogin(e.target.checked)}
              className="w-4 h-4 bg-[#181824] border border-[#2E2E42] text-[#E10600] rounded-none focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Remember last driver on launch (Auto-login directly to Workspace)</span>
            </span>
          </label>

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[#E10600] hover:bg-[#C00500] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md shadow-red-950/50 active:scale-95"
          >
            <Flag className="w-4 h-4" />
            <span>Enter Cockpit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
