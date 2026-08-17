import { UserProgressState, ChallengeResult, GraduationResult } from '../types/curriculum';
import { LapAnalysis, StintSession } from '../types/telemetry';

const STORAGE_KEY_PROGRESS = 'apex_user_progress_v2_5';
const STORAGE_KEY_SESSIONS = 'apex_saved_sessions_v2_5';
const STORAGE_KEY_STINTS = 'apex_saved_stints_v2_5';

export const INITIAL_PROGRESS_STATE: UserProgressState = {
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

export function saveStintHistory(stints: StintSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STINTS, JSON.stringify(stints.slice(0, 100)));
    // Also update flattened lap history for any components that reference it
    const flattenedLaps = stints.flatMap(s => s.laps);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(flattenedLaps.slice(0, 200)));
  } catch (e) {
    console.error('Error saving stint history:', e);
  }
}

export function loadStintHistory(): StintSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STINTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(laps.slice(0, 100)));
  } catch (e) {
    console.error('Error saving lap history:', e);
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

export function recordChallengeCompletion(
  currentProgress: UserProgressState,
  sessionId: string,
  nextSessionId: string | null,
  result: ChallengeResult
): UserProgressState {
  const updated: UserProgressState = {
    ...currentProgress,
    challengeResults: {
      ...currentProgress.challengeResults,
      [result.challengeId]: result
    },
    completedSessionIds: Array.from(new Set([...currentProgress.completedSessionIds, sessionId])),
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
  }

  saveUserProgress(updated);
  return updated;
}
