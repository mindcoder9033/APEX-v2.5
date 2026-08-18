import { UserProgressState, ChallengeResult, GraduationResult } from '../types/curriculum';
import { LapAnalysis, StintSession } from '../types/telemetry';
import { adaptiveDownsampleFrames } from '../engine/physicsEngine';

const STORAGE_KEY_PROGRESS = 'apex_user_progress_v2_5';
const STORAGE_KEY_SESSIONS = 'apex_saved_sessions_v2_5';
const STORAGE_KEY_STINTS = 'apex_saved_stints_v2_5';

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

export function loadUserProgress(): UserProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!raw) return INITIAL_PROGRESS_STATE;
    const parsed = JSON.parse(raw);
    return { ...INITIAL_PROGRESS_STATE, ...parsed };
  } catch (e) {
    console.error('Error loading progress state:', e);
    return INITIAL_PROGRESS_STATE;
  }
}

export function saveUserProgress(state: UserProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving progress state:', e);
  }
}

/**
 * Sanitizes a StintSession by downsampling frames and stripping heavyweight data for older history
 */
function sanitizeStintSession(stint: StintSession, isHistorical: boolean = false): StintSession {
  return {
    ...stint,
    laps: stint.laps.map(lap => ({
      ...lap,
      // For older history (> 5 stints back), preserve only summary corner metrics and compact frames
      frames: isHistorical 
        ? adaptiveDownsampleFrames(lap.frames, 300)
        : adaptiveDownsampleFrames(lap.frames, 800)
    }))
  };
}

export function saveStintHistory(stints: StintSession[]): void {
  try {
    const sanitized = stints.slice(0, 50).map((s, idx) => sanitizeStintSession(s, idx >= 5));
    localStorage.setItem(STORAGE_KEY_STINTS, JSON.stringify(sanitized));

    // Update flattened lap summary
    const flattenedLaps = sanitized.flatMap(s => s.laps).slice(0, 100);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(flattenedLaps));
  } catch (e) {
    console.warn('Storage quota warning when saving stint history, attempting FIFO purge:', e);
    try {
      // Graceful fallback: keep top 10 most recent stints with reduced frame count
      const compact = stints.slice(0, 10).map(s => sanitizeStintSession(s, true));
      localStorage.setItem(STORAGE_KEY_STINTS, JSON.stringify(compact));
      const compactLaps = compact.flatMap(s => s.laps).slice(0, 30);
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(compactLaps));
    } catch (fallbackError) {
      console.error('Failed to save stint history even after purge:', fallbackError);
    }
  }
}

export function loadStintHistory(): StintSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STINTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s, idx) => sanitizeStintSession(s, idx >= 5));
      }
    }
    
    // Migration: If no stints exist yet, check legacy single lap history and convert
    const legacyLaps = loadLapHistory();
    if (legacyLaps.length > 0) {
      const migratedStints: StintSession[] = legacyLaps.map((lap, idx) => ({
        stintId: lap.stintId || `stint-legacy-${lap.lapId}`,
        stintNumber: legacyLaps.length - idx,
        title: lap.sessionTitle || (lap.source === 'academy' ? `Academy Session #${lap.moduleNumber || 1}` : `Practice Run #${legacyLaps.length - idx}`),
        carName: 'Formula Skip Barber 2000',
        trackName: 'Lime Rock Park - Full Circuit',
        source: lap.source || 'practice',
        recordedAt: lap.recordedAt || new Date().toISOString(),
        durationSec: lap.lapTimeSec || 60,
        totalLaps: 1,
        bestLapTimeSec: lap.lapTimeSec || 0,
        avgScore: lap.overallScore || 75,
        laps: [lap],
        moduleNumber: lap.moduleNumber,
        moduleTitle: lap.moduleTitle,
        sessionId: lap.sessionId,
        sessionTitle: lap.sessionTitle
      }));
      saveStintHistory(migratedStints);
      return migratedStints;
    }
    return [];
  } catch (e) {
    console.error('Error loading stint history:', e);
    return [];
  }
}

export function saveLapHistory(laps: LapAnalysis[]): void {
  try {
    const sanitized = laps.slice(0, 50).map(lap => ({
      ...lap,
      frames: adaptiveDownsampleFrames(lap.frames, 500)
    }));
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Storage quota warning when saving lap history, attempting compact save:', e);
    try {
      const compact = laps.slice(0, 15).map(lap => ({
        ...lap,
        frames: adaptiveDownsampleFrames(lap.frames, 200)
      }));
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(compact));
    } catch (err) {
      console.error('Failed to save lap history:', err);
    }
  }
}

export function loadLapHistory(): LapAnalysis[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading lap history:', e);
    return [];
  }
}

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
  attempt?: import('../types/curriculum').ChallengeAttempt
): UserProgressState {
  const existingResult = currentProgress.challengeResults[result.challengeId];
  const existingAttempts = currentProgress.challengeAttempts?.[sessionId] || [];

  // High-water mark for medals
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

  saveUserProgress(updated);
  return updated;
}

export function recordGraduationCompletion(
  currentProgress: UserProgressState,
  moduleId: string,
  nextModuleId: string | null,
  firstSessionOfNextModuleId: string | null,
  result: GraduationResult
): UserProgressState {
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
    // Level unlock progression
    if (moduleId === 'mod-4') {
      const currentLevels = updated.unlockedDriverLevels || ['Beginner'];
      if (!currentLevels.includes('Novice')) {
        updated.unlockedDriverLevels = [...currentLevels, 'Novice'];
      }
    }
  }

  saveUserProgress(updated);
  return updated;
}
