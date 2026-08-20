import React from 'react';
import { HELMET_PRESETS, HelmetPreset } from '../../types/profile';

interface DriverHelmetAvatarProps {
  avatarId?: string;
  colorAccent?: string;
  racingNumber?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showNumber?: boolean;
}

export const DriverHelmetAvatar: React.FC<DriverHelmetAvatarProps> = ({
  avatarId = 'helmet_red',
  colorAccent,
  racingNumber = '01',
  size = 'md',
  className = '',
  showNumber = true
}) => {
  const preset: HelmetPreset = HELMET_PRESETS.find(p => p.id === avatarId) || HELMET_PRESETS[0];
  const primaryColor = colorAccent || preset.primaryColor;
  const visorColor = preset.visorColor;
  const accentColor = preset.accentColor;

  const sizeDimensions = {
    sm: { width: 32, height: 32, fontSize: '8px' },
    md: { width: 44, height: 44, fontSize: '10px' },
    lg: { width: 64, height: 64, fontSize: '13px' },
    xl: { width: 96, height: 96, fontSize: '18px' }
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: sizeDimensions.width, height: sizeDimensions.height }}
      title={`${preset.name} Helmet #${racingNumber}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`helmet-shell-${avatarId}-${primaryColor.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
            <stop offset="70%" stopColor={primaryColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0B0B10" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`visor-gloss-${avatarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={visorColor} stopOpacity="0.9" />
            <stop offset="50%" stopColor="#1E293B" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`reflection-${avatarId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Helmet Shell Silhouette (Motorsport Full-Face Shape) */}
        <path
          d="M 50 10 C 26 10 14 26 14 50 C 14 68 22 84 40 88 L 62 88 C 82 86 86 70 86 50 C 86 26 74 10 50 10 Z"
          fill={`url(#helmet-shell-${avatarId}-${primaryColor.replace('#', '')})`}
          stroke="#1F2937"
          strokeWidth="2.5"
        />

        {/* Top Aero Winglet / Crown Ridge */}
        <path
          d="M 38 12 C 45 16 55 16 62 12 C 58 10 42 10 38 12 Z"
          fill={accentColor}
          opacity="0.8"
        />

        {/* Racing Livery Accent Side Stripes */}
        <path
          d="M 20 42 C 28 32 40 24 60 22 C 72 21 80 28 82 36"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M 18 52 C 22 45 32 38 48 36"
          stroke={primaryColor}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Visor Opening Base Mask */}
        <path
          d="M 28 44 C 36 38 64 38 74 44 C 77 47 78 58 74 62 C 64 68 36 68 28 62 C 24 58 25 47 28 44 Z"
          fill="#0F172A"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Reflective Iridium / Tinted Visor Shield */}
        <path
          d="M 30 46 C 37 41 63 41 72 46 C 75 49 75 56 72 60 C 63 65 37 65 30 60 C 27 56 27 49 30 46 Z"
          fill={`url(#visor-gloss-${avatarId})`}
        />

        {/* Visor Glare & Highlight Line */}
        <path
          d="M 34 47 C 42 44 58 44 68 47"
          stroke={`url(#reflection-${avatarId})`}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Visor Pivot Points (Left & Right Screws) */}
        <circle cx="26" cy="53" r="2.5" fill="#64748B" stroke="#0F172A" strokeWidth="1" />
        <circle cx="76" cy="53" r="2.5" fill="#64748B" stroke="#0F172A" strokeWidth="1" />

        {/* Chin Bar Ventilation Grille */}
        <line x1="44" y1="76" x2="56" y2="76" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="46" y1="80" x2="54" y2="80" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Racing Number Badge Overlay */}
      {showNumber && racingNumber && (
        <span
          className="absolute -bottom-1 -right-1 font-mono font-black px-1 py-0.2 bg-[#0E0E14] text-white border border-[#2A2A3C] shadow-md tracking-tighter"
          style={{
            fontSize: sizeDimensions.fontSize,
            borderColor: primaryColor,
            color: primaryColor === '#00F0FF' ? '#00F0FF' : '#FFFFFF'
          }}
        >
          #{racingNumber}
        </span>
      )}
    </div>
  );
};
