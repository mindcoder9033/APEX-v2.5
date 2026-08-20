export type DriverExperienceLevel = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Expert';
export type CoachTone = 'friendly_coach' | 'pro_engineer';

export interface DriverProfile {
  id: string;                    // e.g. "driver_alex_turner"
  name: string;                  // e.g. "Alex Turner"
  racingNumber: string;          // e.g. "77"
  nickname?: string;             // e.g. "Apex Predator"
  avatarId: string;              // e.g. 'helmet_red', 'helmet_cyan', etc.
  colorAccent: string;           // Hex color e.g. '#E10600', '#00F0FF'
  experienceLevel: DriverExperienceLevel;
  coachTone: CoachTone;
  createdAt: string;             // ISO Date
  lastActiveAt: string;          // ISO Date
  isDefault?: boolean;
}

export interface ProfilesManifest {
  version: '2.5';
  activeProfileId: string;
  autoLoginLastDriver: boolean;
  profiles: DriverProfile[];
}

export interface HelmetPreset {
  id: string;
  name: string;
  primaryColor: string;
  visorColor: string;
  accentColor: string;
  theme: string;
}

export const HELMET_PRESETS: HelmetPreset[] = [
  { id: 'helmet_red', name: 'Scuderia Red', primaryColor: '#E10600', visorColor: '#00F0FF', accentColor: '#FFFFFF', theme: 'Racing Heritage' },
  { id: 'helmet_cyan', name: 'Cyber Neon', primaryColor: '#00F0FF', visorColor: '#FF0055', accentColor: '#0E0E14', theme: 'Telemetry Pulse' },
  { id: 'helmet_amber', name: 'Speed Orange', primaryColor: '#F59E0B', visorColor: '#10B981', accentColor: '#1E1E2E', theme: 'Endurance Pro' },
  { id: 'helmet_emerald', name: 'British Green', primaryColor: '#10B981', visorColor: '#F59E0B', accentColor: '#FFFFFF', theme: 'Apex Classic' },
  { id: 'helmet_purple', name: 'Hyper Violet', primaryColor: '#8B5CF6', visorColor: '#00F0FF', accentColor: '#EC4899', theme: 'Night Attack' },
  { id: 'helmet_stealth', name: 'Carbon Stealth', primaryColor: '#334155', visorColor: '#E10600', accentColor: '#64748B', theme: 'Black Series' },
  { id: 'helmet_gold', name: 'Championship Gold', primaryColor: '#EAB308', visorColor: '#3B82F6', accentColor: '#000000', theme: 'Podium Winner' },
  { id: 'helmet_blue', name: 'Monaco Azure', primaryColor: '#2563EB', visorColor: '#F97316', accentColor: '#FFFFFF', theme: 'Grand Prix' }
];

export const ACCENT_COLOR_PRESETS: { label: string; hex: string }[] = [
  { label: 'Scuderia Red', hex: '#E10600' },
  { label: 'Apex Cyan', hex: '#00F0FF' },
  { label: 'Telemetry Emerald', hex: '#10B981' },
  { label: 'Sector Amber', hex: '#F59E0B' },
  { label: 'Hyper Violet', hex: '#8B5CF6' },
  { label: 'Monaco Blue', hex: '#2563EB' },
  { label: 'Hot Pink', hex: '#EC4899' },
  { label: 'Carbon Slate', hex: '#64748B' }
];

export const DEFAULT_DRIVER_PROFILE: DriverProfile = {
  id: 'driver_default',
  name: 'Default Driver',
  racingNumber: '01',
  nickname: 'Apex Driver',
  avatarId: 'helmet_red',
  colorAccent: '#E10600',
  experienceLevel: 'Beginner',
  coachTone: 'friendly_coach',
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  isDefault: true
};

export const INITIAL_PROFILES_MANIFEST: ProfilesManifest = {
  version: '2.5',
  activeProfileId: 'driver_default',
  autoLoginLastDriver: false,
  profiles: [DEFAULT_DRIVER_PROFILE]
};
