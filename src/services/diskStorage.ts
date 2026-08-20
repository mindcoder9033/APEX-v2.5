import { UserProgressState } from '../types/curriculum';
import { StintSession } from '../types/telemetry';

export interface StorageInfo {
  success: boolean;
  storageRoot: string;
  directories: {
    root: string;
    stints: string;
    reports: string;
    raw_telemetry: string;
    progress: string;
  };
  stats: {
    stints: number;
    reports: number;
    rawLogs: number;
  };
}

export interface RecordingStatus {
  isRecording: boolean;
  fileName: string | null;
  filePath: string | null;
  durationSec: number;
  packetCount: number;
  bytesWritten: number;
}

export interface PdfReportInfo {
  fileName: string;
  sizeBytes: number;
  createdAt: number;
  path: string;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Fetch local PC storage status and paths
 */
export async function getStorageInfo(): Promise<StorageInfo | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/info`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[Disk Storage] Failed to get storage info:', err);
    return null;
  }
}

/**
 * Load user progress state from PC disk (~/Documents/APEX/progress/progress.json)
 */
export async function loadProgressFromDisk(): Promise<UserProgressState | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/progress`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data === 'object' && !('exists' in data && data.exists === false)) {
      return data as UserProgressState;
    }
    return null;
  } catch (err) {
    console.warn('[Disk Storage] Failed to load progress from disk:', err);
    return null;
  }
}

/**
 * Save user progress state directly to PC disk (~/Documents/APEX/progress/progress.json)
 */
export async function saveProgressToDisk(state: UserProgressState): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    return res.ok;
  } catch (err) {
    console.warn('[Disk Storage] Failed to save progress to disk:', err);
    return false;
  }
}

/**
 * Load all saved stints from PC disk (~/Documents/APEX/stints/*.json)
 */
export async function loadStintsFromDisk(): Promise<StintSession[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/stints`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.success && Array.isArray(data.stints)) {
      return data.stints as StintSession[];
    }
    return [];
  } catch (err) {
    console.warn('[Disk Storage] Failed to load stints from disk:', err);
    return [];
  }
}

/**
 * Save a stint session to PC disk (~/Documents/APEX/stints/stint_<id>_<track>.json)
 */
export async function saveStintToDisk(stint: StintSession): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/stints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stint)
    });
    return res.ok;
  } catch (err) {
    console.warn('[Disk Storage] Failed to save stint to disk:', err);
    return false;
  }
}

/**
 * Delete a stint session from PC disk
 */
export async function deleteStintFromDisk(stintId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/stints?id=${encodeURIComponent(stintId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('[Disk Storage] Failed to delete stint from disk:', err);
    return false;
  }
}

/**
 * Save PDF report directly to PC disk (~/Documents/APEX/reports/<fileName>.pdf)
 */
export async function savePdfReportToDisk(fileName: string, base64Data: string): Promise<{ success: boolean; filePath?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, base64Data })
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, filePath: data.filePath };
  } catch (err) {
    console.warn('[Disk Storage] Failed to save PDF report to disk:', err);
    return { success: false };
  }
}

/**
 * Fetch list of generated PDF reports on PC
 */
export async function getReportsList(): Promise<PdfReportInfo[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/reports`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.reports || [];
  } catch (err) {
    return [];
  }
}

/**
 * Start raw UDP binary streaming capture on PC disk (~/Documents/APEX/raw_telemetry/*.bin)
 */
export async function startRawUdpRecording(): Promise<{ success: boolean; fileName?: string; filePath?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/telemetry/record/start`, { method: 'POST' });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (err) {
    console.warn('[Disk Storage] Failed to start raw UDP recording:', err);
    return { success: false };
  }
}

/**
 * Stop raw UDP recording on PC disk
 */
export async function stopRawUdpRecording(): Promise<RecordingStatus & { success: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/api/telemetry/record/stop`, { method: 'POST' });
    if (!res.ok) return { success: false, isRecording: false, fileName: null, filePath: null, durationSec: 0, packetCount: 0, bytesWritten: 0 };
    return await res.json();
  } catch (err) {
    console.warn('[Disk Storage] Failed to stop raw UDP recording:', err);
    return { success: false, isRecording: false, fileName: null, filePath: null, durationSec: 0, packetCount: 0, bytesWritten: 0 };
  }
}

/**
 * Query live raw UDP recording status
 */
export async function getRecordingStatus(): Promise<RecordingStatus | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/telemetry/record/status`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
