import { UserProgressState, ChallengeResult, GraduationResult } from '../types/curriculum';
import { LapAnalysis, StintSession } from '../types/telemetry';
import { DriverProfile, ProfilesManifest, DEFAULT_DRIVER_PROFILE, INITIAL_PROFILES_MANIFEST } from '../types/profile';
import { adaptiveDownsampleFrames, rebindLapToTrack } from '../engine/physicsEngine';
import { getTrackCorners } from '../data/trackCorners';
import { PracticeViewLayout, DEFAULT_PRACTICE_LAYOUT } from '../types/widgets';
import { downsampleTelemetryLOD, LOD_PRESETS } from '../engine/lodDownsampler';
import {
  loadProgressFromDisk,
  saveProgressToDisk,
  loadStintsFromDisk,
  saveStintToDisk,
  getProfilesManifest,
  saveProfilesManifest as saveProfilesManifestToDisk,
  deleteProfileFromDisk
} from '../services/diskStorage';

// Storage Keys
const STORAGE_KEY_PROFILES_MANIFEST = 'apex_profiles_manifest_v2_5';
const STORAGE_KEY_LEGACY_PROGRESS = 'apex_user_progress_v2_5';
const STORAGE_KEY_LEGACY_SESSIONS = 'apex_saved_sessions_v2_5';
const STORAGE_KEY_LEGACY_STINTS = 'apex_saved_stints_v2_5';
const STORAGE_KEY_LEGACY_LAYOUT = 'apex_practice_layout_v2_5';

function getStorageKeyProgress(profileId: string) {
  return `apex_user_progress_v2_5_${profileId}`;
}

function getStorageKeyStints(profileId: string) {
  return `apex_saved_stints_v2_5_${profileId}`;
}

function getStorageKeySessions(profileId: string) {
  return `apex_saved_sessions_v2_5_${profileId}`;
}

function getStorageKeyLayout(profileId: string) {
  return `apex_practice_layout_v2_5_${profileId}`;
}

export const INITIAL_PROGRESS_STATE: UserProgressState = {
  selectedDriverLevel: 'Beginner',
  unlockedDriverLevels: ['Beginner'],
  unlockedModuleIds: ['mod-1'],
  unlockedSessionIds: ['s-1-1'],
  completedSessionIds: [],
  graduatedModuleIds: [],
  sessionBestScores: {},
  challengeResults: {},
  graduationResults: {},
  totalLapsDriven: 0,
  totalTimeMinutes: 0
};

// ==========================================
// 1. PROFILES MANIFEST MANAGEMENT
// ==========================================

/**
 * Loads the profiles manifest from localStorage with automatic legacy migration.
 */
export function loadProfilesManifest(): ProfilesManifest {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES_MANIFEST);
    if (raw) {
      const parsed: ProfilesManifest = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
        return parsed;
      }
    }

    // Auto-migration: check if legacy progress or stints exist
    const legacyProgressRaw = localStorage.getItem(STORAGE_KEY_LEGACY_PROGRESS);
    const legacyStintsRaw = localStorage.getItem(STORAGE_KEY_LEGACY_STINTS);
    const legacyLayoutRaw = localStorage.getItem(STORAGE_KEY_LEGACY_LAYOUT);

    if (legacyProgressRaw || legacyStintsRaw) {
      // Migrate legacy keys to default driver keys
      if (legacyProgressRaw) {
        localStorage.setItem(getStorageKeyProgress('driver_default'), legacyProgressRaw);
      }
      if (legacyStintsRaw) {
        localStorage.setItem(getStorageKeyStints('driver_default'), legacyStintsRaw);
      }
      if (legacyLayoutRaw) {
        localStorage.setItem(getStorageKeyLayout('driver_default'), legacyLayoutRaw);
      }
    }

    const initial = { ...INITIAL_PROFILES_MANIFEST };
    localStorage.setItem(STORAGE_KEY_PROFILES_MANIFEST, JSON.stringify(initial));
    return initial;
  } catch (e) {
    console.error('Error loading profiles manifest:', e);
    return INITIAL_PROFILES_MANIFEST;
  }
}

/**
 * Persists profiles manifest to localStorage and PC disk
 */
export function saveProfilesManifest(manifest: ProfilesManifest): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES_MANIFEST, JSON.stringify(manifest));
    saveProfilesManifestToDisk(manifest).catch((err) => {
      console.warn('[APEX Storage] Failed to sync profiles manifest to PC disk:', err);
    });
  } catch (e) {
    console.error('Error saving profiles manifest:', e);
  }
}

/**
 * Loads manifest from PC disk (~/Documents/APEX/profiles_manifest.json) with fallback to localStorage
 */
export async function loadProfilesManifestFromDisk(): Promise<ProfilesManifest> {
  try {
    const diskManifest = await getProfilesManifest();
    if (diskManifest && Array.isArray(diskManifest.profiles) && diskManifest.profiles.length > 0) {
      localStorage.setItem(STORAGE_KEY_PROFILES_MANIFEST, JSON.stringify(diskManifest));
      return diskManifest;
    }
  } catch (e) {
    console.warn('[APEX Storage] Could not hydrate profiles manifest from disk:', e);
  }
  return loadProfilesManifest();
}

/**
 * Helper to retrieve the current active driver profile
 */
export function getActiveProfile(manifestInput?: ProfilesManifest): DriverProfile {
  const manifest = manifestInput || loadProfilesManifest();
  const active = manifest.profiles.find(p => p.id === manifest.activeProfileId);
  return active || manifest.profiles[0] || DEFAULT_DRIVER_PROFILE;
}

/**
 * Switches the active profile ID and updates lastActiveAt timestamp
 */
export function setActiveProfileId(profileId: string): ProfilesManifest {
  const manifest = loadProfilesManifest();
  const target = manifest.profiles.find(p => p.id === profileId);
  if (!target) return manifest;

  const now = new Date().toISOString();
  const updatedProfiles = manifest.profiles.map(p => 
    p.id === profileId ? { ...p, lastActiveAt: now } : p
  );

  const updatedManifest: ProfilesManifest = {
    ...manifest,
    activeProfileId: profileId,
    profiles: updatedProfiles
  };

  saveProfilesManifest(updatedManifest);
  return updatedManifest;
}

/**
 * Creates a new driver profile with dedicated initial state
 */
export function createDriverProfile(data: {
  name: string;
  racingNumber?: string;
  nickname?: string;
  avatarId?: string;
  colorAccent?: string;
  experienceLevel?: import('../types/profile').DriverExperienceLevel;
  coachTone?: import('../types/profile').CoachTone;
}): { manifest: ProfilesManifest; newProfile: DriverProfile } {
  const manifest = loadProfilesManifest();
  const slug = `driver_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}_${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  const newProfile: DriverProfile = {
    id: slug,
    name: data.name.trim() || 'New Driver',
    racingNumber: data.racingNumber?.trim() || '01',
    nickname: data.nickname?.trim() || '',
    avatarId: data.avatarId || 'helmet_red',
    colorAccent: data.colorAccent || '#E10600',
    experienceLevel: data.experienceLevel || 'Beginner',
    coachTone: data.coachTone || 'friendly_coach',
    createdAt: now,
    lastActiveAt: now,
    isDefault: false
  };

  // Initialize driver progress state according to experience level preset
  const initialProg: UserProgressState = {
    ...INITIAL_PROGRESS_STATE,
    selectedDriverLevel: newProfile.experienceLevel
  };

  // Set unlocked levels if preset is advanced
  if (newProfile.experienceLevel === 'Novice') {
    initialProg.unlockedDriverLevels = ['Beginner', 'Novice'];
  } else if (newProfile.experienceLevel === 'Intermediate') {
    initialProg.unlockedDriverLevels = ['Beginner', 'Novice', 'Intermediate'];
  } else if (newProfile.experienceLevel === 'Advanced') {
    initialProg.unlockedDriverLevels = ['Beginner', 'Novice', 'Intermediate', 'Advanced'];
  } else if (newProfile.experienceLevel === 'Expert') {
    initialProg.unlockedDriverLevels = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'];
  }

  saveUserProgress(initialProg, slug);
  saveStintHistory([], slug);

  const updatedManifest: ProfilesManifest = {
    ...manifest,
    activeProfileId: slug,
    profiles: [...manifest.profiles, newProfile]
  };

  saveProfilesManifest(updatedManifest);
  return { manifest: updatedManifest, newProfile };
}

/**
 * Updates an existing driver profile's metadata
 */
export function updateDriverProfile(profileId: string, updates: Partial<DriverProfile>): ProfilesManifest {
  const manifest = loadProfilesManifest();
  const updatedProfiles = manifest.profiles.map(p => 
    p.id === profileId ? { ...p, ...updates, id: p.id, lastActiveAt: new Date().toISOString() } : p
  );

  const updatedManifest: ProfilesManifest = {
    ...manifest,
    profiles: updatedProfiles
  };

  saveProfilesManifest(updatedManifest);
  return updatedManifest;
}

/**
 * Deletes a driver profile (safeguarded: prevents deleting the only remaining profile)
 */
export function deleteDriverProfile(profileId: string): ProfilesManifest {
  const manifest = loadProfilesManifest();
  if (manifest.profiles.length <= 1) {
    return manifest; // Cannot delete the only profile
  }

  const remaining = manifest.profiles.filter(p => p.id !== profileId);
  let nextActiveId = manifest.activeProfileId;
  if (nextActiveId === profileId) {
    nextActiveId = remaining[0].id;
  }

  const updatedManifest: ProfilesManifest = {
    ...manifest,
    activeProfileId: nextActiveId,
    profiles: remaining
  };

  // Clear localStorage keys
  try {
    localStorage.removeItem(getStorageKeyProgress(profileId));
    localStorage.removeItem(getStorageKeyStints(profileId));
    localStorage.removeItem(getStorageKeySessions(profileId));
    localStorage.removeItem(getStorageKeyLayout(profileId));
  } catch (_) {}

  // Delete from disk API asynchronously
  deleteProfileFromDisk(profileId).catch(err => {
    console.warn(`[APEX Storage] Could not delete profile folder ${profileId} from disk:`, err);
  });

  saveProfilesManifest(updatedManifest);
  return updatedManifest;
}

// ==========================================
// 2. USER PROGRESS (ACADEMY CURRICULUM)
// ==========================================

export function loadUserProgress(profileId?: string): UserProgressState {
  try {
    const targetId = profileId || getActiveProfile().id;
    const key = getStorageKeyProgress(targetId);
    let raw = localStorage.getItem(key);
    
    // Fallback: check legacy un-scoped key for default profile
    if (!raw && targetId === 'driver_default') {
      raw = localStorage.getItem(STORAGE_KEY_LEGACY_PROGRESS);
    }

    if (!raw) return INITIAL_PROGRESS_STATE;
    const parsed = JSON.parse(raw);
    return { ...INITIAL_PROGRESS_STATE, ...parsed };
  } catch (e) {
    console.error('Error loading progress state:', e);
    return INITIAL_PROGRESS_STATE;
  }
}

/**
 * Loads progress from PC disk (~/Documents/APEX/Profiles/[profileId]/progress/progress.json)
 */
export async function loadUserProgressFromDisk(profileId?: string): Promise<UserProgressState> {
  const targetId = profileId || getActiveProfile().id;
  try {
    const diskProgress = await loadProgressFromDisk(targetId);
    if (diskProgress) {
      localStorage.setItem(getStorageKeyProgress(targetId), JSON.stringify(diskProgress));
      return { ...INITIAL_PROGRESS_STATE, ...diskProgress };
    }
  } catch (e) {
    console.warn(`[APEX Storage] Could not hydrate progress from disk (${targetId}):`, e);
  }
  return loadUserProgress(targetId);
}

export function saveUserProgress(state: UserProgressState, profileId?: string): void {
  const targetId = profileId || getActiveProfile().id;
  try {
    localStorage.setItem(getStorageKeyProgress(targetId), JSON.stringify(state));
    // Asynchronously sync to local PC disk under profile
    saveProgressToDisk(state, targetId).catch((err) => {
      console.warn(`[APEX Storage] Failed to sync progress to PC disk (${targetId}):`, err);
    });
  } catch (e) {
    console.error('Error saving progress state:', e);
  }
}

// ==========================================
// 3. STINT SESSIONS & TELEMETRY HISTORY
// ==========================================

/**
 * Sanitizes a StintSession by downsampling frames and stripping heavyweight data for older history
 */
function sanitizeStintSession(stint: StintSession, isHistorical: boolean = false): StintSession {
  return {
    ...stint,
    laps: (stint.laps || []).map(lap => ({
      ...lap,
      frames: isHistorical 
        ? downsampleTelemetryLOD(lap.frames || [], LOD_PRESETS.SUMMARY)
        : downsampleTelemetryLOD(lap.frames || [], LOD_PRESETS.GRAPH_MED),
      compactBuffer: undefined
    }))
  };
}

export function saveStintHistory(stints: StintSession[], profileId?: string): void {
  const targetId = profileId || getActiveProfile().id;
  try {
    // 1. Sync full high-fidelity stints directly to PC disk for this profile
    stints.forEach((stint) => {
      saveStintToDisk(stint, targetId).catch((err) => {
        console.warn(`[APEX Storage] Could not save stint ${stint.stintId} to PC disk (${targetId}):`, err);
      });
    });

    // 2. Save compact copy in localStorage for immediate client-side queries
    const sanitized = stints.slice(0, 50).map((s, idx) => sanitizeStintSession(s, idx >= 5));
    localStorage.setItem(getStorageKeyStints(targetId), JSON.stringify(sanitized));

    // Update flattened lap summary
    const flattenedLaps = sanitized.flatMap(s => s.laps || []).slice(0, 100);
    localStorage.setItem(getStorageKeySessions(targetId), JSON.stringify(flattenedLaps));
  } catch (e) {
    console.warn('Storage quota warning when saving stint history to localStorage, attempting FIFO purge:', e);
    try {
      const compact = stints.slice(0, 10).map(s => sanitizeStintSession(s, true));
      localStorage.setItem(getStorageKeyStints(targetId), JSON.stringify(compact));
      const compactLaps = compact.flatMap(s => s.laps || []).slice(0, 30);
      localStorage.setItem(getStorageKeySessions(targetId), JSON.stringify(compactLaps));
    } catch (fallbackError) {
      console.error('Failed to save stint history to localStorage even after purge:', fallbackError);
    }
  }
}

/**
 * Loads all stints from PC disk (~/Documents/APEX/Profiles/[profileId]/stints/*.json)
 */
export async function loadStintHistoryFromDisk(profileId?: string): Promise<StintSession[]> {
  const targetId = profileId || getActiveProfile().id;
  try {
    const diskStints = await loadStintsFromDisk(targetId);
    if (diskStints && diskStints.length > 0) {
      try {
        const sanitized = diskStints.slice(0, 50).map((s, idx) => sanitizeStintSession(s, idx >= 5));
        localStorage.setItem(getStorageKeyStints(targetId), JSON.stringify(sanitized));
      } catch (_) {}
      return diskStints;
    }
  } catch (e) {
    console.warn(`[APEX Storage] Could not hydrate stints from disk (${targetId}):`, e);
  }
  return loadStintHistory(targetId);
}

export function loadStintHistory(profileId?: string): StintSession[] {
  const targetId = profileId || getActiveProfile().id;
  try {
    let raw = localStorage.getItem(getStorageKeyStints(targetId));
    
    // Fallback: check legacy un-scoped key for default profile
    if (!raw && targetId === 'driver_default') {
      raw = localStorage.getItem(STORAGE_KEY_LEGACY_STINTS);
    }

    if (raw) {
      const parsed: StintSession[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let hasRepaired = false;
        
        const processedStints = parsed.map((s, idx) => {
          if (!s.laps || s.laps.length === 0) {
            return sanitizeStintSession(s, idx >= 5);
          }

          const canonicalCornerDefs = getTrackCorners(s.trackName);
          if (canonicalCornerDefs && canonicalCornerDefs.length > 0) {
            const needsCornerHeal = s.laps.some(
              lap => !lap.corners || lap.corners.length !== canonicalCornerDefs.length
            );

            if (needsCornerHeal) {
              hasRepaired = true;
              const healedLaps = s.laps.map(lap => rebindLapToTrack(lap, s.trackName));
              return sanitizeStintSession({
                ...s,
                laps: healedLaps
              }, idx >= 5);
            }
          }

          return sanitizeStintSession(s, idx >= 5);
        });

        if (hasRepaired) {
          saveStintHistory(processedStints, targetId);
        }

        return processedStints;
      }
    }
    
    return [];
  } catch (e) {
    console.error('Error loading stint history:', e);
    return [];
  }
}

export function saveLapHistory(laps: LapAnalysis[], profileId?: string): void {
  const targetId = profileId || getActiveProfile().id;
  try {
    const sanitized = laps.slice(0, 50).map(lap => ({
      ...lap,
      frames: adaptiveDownsampleFrames(lap.frames || [], 500)
    }));
    localStorage.setItem(getStorageKeySessions(targetId), JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Storage quota warning when saving lap history, attempting compact save:', e);
    try {
      const compact = laps.slice(0, 15).map(lap => ({
        ...lap,
        frames: adaptiveDownsampleFrames(lap.frames || [], 200)
      }));
      localStorage.setItem(getStorageKeySessions(targetId), JSON.stringify(compact));
    } catch (err) {
      console.error('Failed to save lap history:', err);
    }
  }
}

export function loadLapHistory(profileId?: string): LapAnalysis[] {
  const targetId = profileId || getActiveProfile().id;
  try {
    let raw = localStorage.getItem(getStorageKeySessions(targetId));
    if (!raw && targetId === 'driver_default') {
      raw = localStorage.getItem(STORAGE_KEY_LEGACY_SESSIONS);
    }
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading lap history:', e);
    return [];
  }
}

// ==========================================
// 4. CHALLENGE & GRADUATION COMPLETIONS
// ==========================================

const MEDAL_RANK: Record<string, number> = {
  gold: 3,
  silver: 2,
  bronze: 1,
  none: 0
};

export function recordChallengeCompletion(
  currentProgress: UserProgressState,
  sessionId: string,
  nextSessionId: string | null,
  result: ChallengeResult,
  attempt?: import('../types/curriculum').ChallengeAttempt,
  profileId?: string
): UserProgressState {
  const targetId = profileId || getActiveProfile().id;
  const existingResult = currentProgress.challengeResults[result.challengeId];
  const existingAttempts = currentProgress.challengeAttempts?.[sessionId] || [];

  let bestResult = result;
  if (existingResult && existingResult.passed) {
    const existingRank = MEDAL_RANK[existingResult.medal || 'none'] || 0;
    const newRank = MEDAL_RANK[result.medal || 'none'] || 0;
    if (existingRank > newRank) {
      bestResult = {
        ...existingResult,
        lapsCount: Math.max(existingResult.lapsCount, result.lapsCount)
      };
    }
  }

  const updatedAttempts = attempt ? [...existingAttempts, attempt] : existingAttempts;

  const updated: UserProgressState = {
    ...currentProgress,
    challengeResults: {
      ...currentProgress.challengeResults,
      [result.challengeId]: bestResult
    },
    challengeAttempts: {
      ...(currentProgress.challengeAttempts || {}),
      [sessionId]: updatedAttempts
    },
    completedSessionIds: result.passed
      ? Array.from(new Set([...currentProgress.completedSessionIds, sessionId]))
      : currentProgress.completedSessionIds,
    sessionBestScores: {
      ...currentProgress.sessionBestScores,
      [sessionId]: Math.max(currentProgress.sessionBestScores[sessionId] || 0, result.score)
    },
    totalLapsDriven: currentProgress.totalLapsDriven + result.lapsCount
  };

  if (result.passed && nextSessionId && !updated.unlockedSessionIds.includes(nextSessionId)) {
    updated.unlockedSessionIds = [...updated.unlockedSessionIds, nextSessionId];
  }

  saveUserProgress(updated, targetId);
  return updated;
}

export function recordGraduationCompletion(
  currentProgress: UserProgressState,
  moduleId: string,
  nextModuleId: string | null,
  firstSessionOfNextModuleId: string | null,
  result: GraduationResult,
  profileId?: string
): UserProgressState {
  const targetId = profileId || getActiveProfile().id;
  const updated: UserProgressState = {
    ...currentProgress,
    graduationResults: {
      ...currentProgress.graduationResults,
      [result.testId]: result
    }
  };

  if (result.passed) {
    updated.graduatedModuleIds = Array.from(new Set([...updated.graduatedModuleIds, moduleId]));
    if (nextModuleId && !updated.unlockedModuleIds.includes(nextModuleId)) {
      updated.unlockedModuleIds = [...updated.unlockedModuleIds, nextModuleId];
    }
    if (firstSessionOfNextModuleId && !updated.unlockedSessionIds.includes(firstSessionOfNextModuleId)) {
      updated.unlockedSessionIds = [...updated.unlockedSessionIds, firstSessionOfNextModuleId];
    }
    if (moduleId === 'mod-4') {
      const currentLevels = updated.unlockedDriverLevels || ['Beginner'];
      if (!currentLevels.includes('Novice')) {
        updated.unlockedDriverLevels = [...currentLevels, 'Novice'];
      }
    }
  }

  saveUserProgress(updated, targetId);
  return updated;
}

// ==========================================
// 5. PRACTICE VIEW LAYOUT
// ==========================================

export function loadPracticeViewLayout(profileId?: string): PracticeViewLayout {
  const targetId = profileId || getActiveProfile().id;
  try {
    let raw = localStorage.getItem(getStorageKeyLayout(targetId));
    if (!raw && targetId === 'driver_default') {
      raw = localStorage.getItem(STORAGE_KEY_LEGACY_LAYOUT);
    }
    if (!raw) return DEFAULT_PRACTICE_LAYOUT;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.preset && Array.isArray(parsed.widgets)) {
      return parsed;
    }
    return DEFAULT_PRACTICE_LAYOUT;
  } catch (e) {
    console.error('Error loading practice view layout:', e);
    return DEFAULT_PRACTICE_LAYOUT;
  }
}

export function savePracticeViewLayout(layout: PracticeViewLayout, profileId?: string): void {
  const targetId = profileId || getActiveProfile().id;
  try {
    localStorage.setItem(getStorageKeyLayout(targetId), JSON.stringify(layout));
  } catch (e) {
    console.error('Error saving practice view layout:', e);
  }
}
