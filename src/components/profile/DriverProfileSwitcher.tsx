import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit3, Check, Grid, UserCheck, Award } from 'lucide-react';
import { DriverProfile, ProfilesManifest } from '../../types/profile';
import { DriverHelmetAvatar } from './DriverHelmetAvatar';

interface DriverProfileSwitcherProps {
  manifest: ProfilesManifest;
  activeProfile: DriverProfile;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: () => void;
  onEditActiveProfile: () => void;
  onOpenGateway: () => void;
}

export const DriverProfileSwitcher: React.FC<DriverProfileSwitcherProps> = ({
  manifest,
  activeProfile,
  onSelectProfile,
  onCreateProfile,
  onEditActiveProfile,
  onOpenGateway
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const profiles = manifest.profiles || [];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Active Driver Pill Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Active Driver Profile • Click to Switch"
        className={`flex items-center space-x-2.5 px-3 py-1.5 bg-[#14141E] hover:bg-[#1C1C28] border transition-all active:scale-95 ${
          isOpen
            ? 'border-[#00F0FF]/60 shadow-md shadow-cyan-950/30'
            : 'border-[#262638] hover:border-slate-500'
        }`}
      >
        <DriverHelmetAvatar
          avatarId={activeProfile.avatarId}
          colorAccent={activeProfile.colorAccent}
          racingNumber={activeProfile.racingNumber}
          size="sm"
          showNumber={false}
        />

        <div className="flex flex-col items-start min-w-[70px] max-w-[130px]">
          <div className="flex items-center space-x-1.5 w-full">
            <span 
              className="font-mono text-[10px] font-bold px-1 py-0 border"
              style={{
                backgroundColor: `${activeProfile.colorAccent || '#E10600'}20`,
                borderColor: `${activeProfile.colorAccent || '#E10600'}50`,
                color: activeProfile.colorAccent || '#E10600'
              }}
            >
              #{activeProfile.racingNumber}
            </span>
            <span className="text-xs font-racing font-bold tracking-wide text-white truncate">
              {activeProfile.name}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 leading-none mt-0.5 flex items-center space-x-1">
            <Award className="w-2.5 h-2.5 text-amber-400 inline" />
            <span>{activeProfile.experienceLevel}</span>
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#101018]/98 backdrop-blur-md border border-[#2E2E42] shadow-2xl z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#14141E] border-b border-[#232332]">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-[11px] font-racing font-bold tracking-wider text-slate-200 uppercase">
                Driver Profiles
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#1C1C28] text-slate-400 border border-[#2A2A3C]">
              {profiles.length} {profiles.length === 1 ? 'Driver' : 'Drivers'}
            </span>
          </div>

          {/* Profiles List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-[#1A1A26]">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    onSelectProfile(profile.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-[#181826] text-white border-l-2 border-[#E10600]'
                      : 'hover:bg-[#151520] text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <DriverHelmetAvatar
                      avatarId={profile.avatarId}
                      colorAccent={profile.colorAccent}
                      racingNumber={profile.racingNumber}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-racing font-bold tracking-wide text-slate-100 truncate">
                          {profile.name}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {profile.experienceLevel} • {profile.coachTone === 'friendly_coach' ? 'Friendly' : 'Pro'}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <span className="shrink-0 flex items-center space-x-1 text-[#00F0FF] text-[10px] font-mono font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Menu Items */}
          <div className="p-2 bg-[#14141E] border-t border-[#232332] space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEditActiveProfile();
              }}
              className="w-full flex items-center space-x-2 px-3 py-1.5 bg-[#181824] hover:bg-[#202030] text-slate-300 hover:text-white text-xs font-mono transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Active Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onCreateProfile();
              }}
              className="w-full flex items-center space-x-2 px-3 py-1.5 bg-[#181824] hover:bg-[#202030] text-slate-300 hover:text-white text-xs font-mono transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Add New Driver Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenGateway();
              }}
              className="w-full flex items-center space-x-2 px-3 py-1.5 bg-[#181824] hover:bg-[#202030] text-slate-300 hover:text-white text-xs font-mono transition-colors"
            >
              <Grid className="w-3.5 h-3.5 text-purple-400" />
              <span>Open "Who is Driving?" Gateway</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
