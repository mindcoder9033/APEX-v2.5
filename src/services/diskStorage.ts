import { UserProgressState } from '../types/curriculum';
import { StintSession } from '../types/telemetry';
import { DriverProfile, ProfilesManifest } from '../types/profile';

export interface StorageInfo {
  success: boolean;
  storageRoot: string;
  activeProfileId?: string;
  profilesCount?: number;
  directories: {
    root: string;
    profiles?: string;
    profileRoot?: string;
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
 * Fetch profiles manifest from PC disk (~/Documents/APEX/profiles_manifest.json)
 */
export async function getProfilesManifest(): Promise<ProfilesManifest | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/profiles`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.manifest) {
      return data.manifest as ProfilesManifest;
    }
    return null;
  } catch (err) {
    console.warn('[Disk Storage] Failed to get profiles manifest from disk:', err);
    return null;
  }
}

/**
 * Save profiles manifest or individual profile to PC disk
 */
export async function saveProfilesManifest(manifest: ProfilesManifest | DriverProfile): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest)
    });
    return res.ok;
  } catch (err) {
    console.warn('[Disk Storage] Failed to save profiles manifest to disk:', err);
    return false;
  }
}

/**
 * Delete a profile from PC disk
 */
export async function deleteProfileFromDisk(profileId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/storage/profiles?id=${encodeURIComponent(profileId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('[Disk Storage] Failed to delete profile from disk:', err);
    return false;
  }
}

/**
 * Fetch local PC storage status and paths
 */
export async function getStorageInfo(profileId?: string): Promise<StorageInfo | null> {
  try {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    const res = await fetch(`${BASE_URL}/api/storage/info${query}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[Disk Storage] Failed to get storage info:', err);
    return null;
  }
}

/**
 * Load user progress state from PC disk (~/Documents/APEX/Profiles/[profileId]/progress/progress.json)
 */
export async function loadProgressFromDisk(profileId?: string): Promise<UserProgressState | null> {
  try {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    const res = await fetch(`${BASE_URL}/api/storage/progress${query}`);
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
 * Save user progress state directly to PC disk (~/Documents/APEX/Profiles/[profileId]/progress/progress.json)
 */
export async function saveProgressToDisk(state: UserProgressState, profileId?: string): Promise<boolean> {
  try {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    const res = await fetch(`${BASE_URL}/api/storage/progress${query}`, {
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
 * Load all saved stints from PC disk (~/Documents/APEX/Profiles/[profileId]/stints/*.json)
 */
export async function loadStintsFromDisk(profileId?: string): Promise<StintSession[]> {
  try {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    const res = await fetch(`${BASE_URL}/api/storage/stints${query}`);
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
 * Save a stint session to PC disk (~/Documents/APEX/Profiles/[profileId]/stints/stint_<id>_<track>.json)
 */
export async function saveStintToDisk(stint: StintSession, profileId?: string): Promise<boolean> {
  try {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    const res = await fetch(`${BASE_URL}/api/storage/stints${query}`, {
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
export async function deleteStintFromDisk(stintId: string, profileId?: string): Promise<boolean> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.set('id', stintId);
    if (profileId) queryParams.set('profileId', profileId);

    const res = await fetch(`${BASE_URL}/api/storage/stints?${queryParams.toString()}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('[Disk Storage] Failed to delete stint from disk:', err);
    return false;
  }
}

/**
 * Save PDF report directly to PC disk (~/Documents/APEX/Profiles/[profileId]/reports/<fileName>.pdf)
 */
export async function savePdfReportToDisk(fileName: string, base64Data: string, profileId?: string): Promise<{ success: boolean; filePath?: string }> {
  try {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    const res = await fetch(`${BASE_URL}/api/storage/reports${query}`, {
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
export async function getReportsList(profileId?: string): Promise<PdfReportInfo[]> {
  try {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    const res = await fetch(`${BASE_URL}/api/storage/reports${query}`);
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
