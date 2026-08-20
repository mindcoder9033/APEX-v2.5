import type { Plugin, ViteDevServer } from 'vite';
import * as dgram from 'dgram';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

export interface NetworkInterfaceInfo {
  directIps: string[];
  broadcastIps: string[];
  udpPort: number;
  secondaryUdpPort: number;
}

// Ensure Documents/APEX folder tree exists on the user's PC
const USER_HOME = os.homedir();
const APEX_DOCS_ROOT = path.join(USER_HOME, 'Documents', 'APEX');
export const APEX_STORAGE_DIRS = {
  root: APEX_DOCS_ROOT,
  profiles: path.join(APEX_DOCS_ROOT, 'Profiles'),
  stints: path.join(APEX_DOCS_ROOT, 'stints'),
  reports: path.join(APEX_DOCS_ROOT, 'reports'),
  raw_telemetry: path.join(APEX_DOCS_ROOT, 'raw_telemetry'),
  progress: path.join(APEX_DOCS_ROOT, 'progress')
};

export const PROFILES_MANIFEST_FILE = path.join(APEX_DOCS_ROOT, 'profiles_manifest.json');

export function getProfileDirs(profileId: string) {
  const safeId = (profileId || 'driver_default').replace(/[^a-zA-Z0-9_-]/g, '_');
  const profileRoot = path.join(APEX_STORAGE_DIRS.profiles, safeId);
  const dirs = {
    root: profileRoot,
    progress: path.join(profileRoot, 'progress'),
    stints: path.join(profileRoot, 'stints'),
    reports: path.join(profileRoot, 'reports')
  };

  try {
    Object.values(dirs).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  } catch (err: any) {
    console.warn(`[APEX Storage] Could not initialize profile dir (${safeId}):`, err?.message);
  }

  return dirs;
}

function loadOrInitProfilesManifest() {
  try {
    if (fs.existsSync(PROFILES_MANIFEST_FILE)) {
      const content = fs.readFileSync(PROFILES_MANIFEST_FILE, 'utf-8');
      const manifest = JSON.parse(content);
      if (manifest && Array.isArray(manifest.profiles) && manifest.profiles.length > 0) {
        return manifest;
      }
    }
  } catch (err) {
    console.warn('[APEX Storage] Failed to parse existing manifest:', err);
  }

  // Create initial manifest and migrate legacy data if available
  const defaultProfile = {
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

  const initialManifest = {
    version: '2.5',
    activeProfileId: 'driver_default',
    autoLoginLastDriver: false,
    profiles: [defaultProfile]
  };

  try {
    const defaultDirs = getProfileDirs('driver_default');

    // Migrate legacy progress.json if present
    const legacyProgress = path.join(APEX_STORAGE_DIRS.progress, 'progress.json');
    const targetProgress = path.join(defaultDirs.progress, 'progress.json');
    if (fs.existsSync(legacyProgress) && !fs.existsSync(targetProgress)) {
      fs.copyFileSync(legacyProgress, targetProgress);
      console.log('[APEX Storage] Migrated legacy progress to Profiles/driver_default/');
    }

    // Migrate legacy stints if present
    if (fs.existsSync(APEX_STORAGE_DIRS.stints)) {
      const legacyStintFiles = fs.readdirSync(APEX_STORAGE_DIRS.stints).filter(f => f.endsWith('.json'));
      for (const file of legacyStintFiles) {
        const srcPath = path.join(APEX_STORAGE_DIRS.stints, file);
        const dstPath = path.join(defaultDirs.stints, file);
        if (!fs.existsSync(dstPath)) {
          fs.copyFileSync(srcPath, dstPath);
        }
      }
      if (legacyStintFiles.length > 0) {
        console.log(`[APEX Storage] Migrated ${legacyStintFiles.length} legacy stints to Profiles/driver_default/`);
      }
    }

    // Migrate legacy reports if present
    if (fs.existsSync(APEX_STORAGE_DIRS.reports)) {
      const legacyReports = fs.readdirSync(APEX_STORAGE_DIRS.reports).filter(f => f.endsWith('.pdf'));
      for (const file of legacyReports) {
        const srcPath = path.join(APEX_STORAGE_DIRS.reports, file);
        const dstPath = path.join(defaultDirs.reports, file);
        if (!fs.existsSync(dstPath)) {
          fs.copyFileSync(srcPath, dstPath);
        }
      }
    }

    fs.writeFileSync(PROFILES_MANIFEST_FILE, JSON.stringify(initialManifest, null, 2), 'utf-8');
    console.log('[APEX Storage] Initialized profiles_manifest.json with Default Driver');
  } catch (err: any) {
    console.warn('[APEX Storage] Could not write initial profiles manifest:', err?.message);
  }

  return initialManifest;
}

function ensureStorageDirs() {
  try {
    Object.values(APEX_STORAGE_DIRS).forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    loadOrInitProfilesManifest();
  } catch (err: any) {
    console.warn('[APEX Storage] Could not initialize Documents/APEX folders:', err?.message);
  }
}

/**
 * Calculates subnet broadcast address from an IPv4 address and netmask.
 */
function calculateBroadcastIp(ip: string, netmask: string): string {
  try {
    const ipParts = ip.split('.').map(Number);
    const maskParts = netmask.split('.').map(Number);
    if (ipParts.length !== 4 || maskParts.length !== 4) return '255.255.255.255';

    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const maskInt = (maskParts[0] << 24) | (maskParts[1] << 16) | (maskParts[2] << 8) | maskParts[3];
    const broadcastInt = (ipInt & maskInt) | (~maskInt & 0xffffffff);

    return [
      (broadcastInt >>> 24) & 255,
      (broadcastInt >>> 16) & 255,
      (broadcastInt >>> 8) & 255,
      broadcastInt & 255
    ].join('.');
  } catch {
    return '255.255.255.255';
  }
}

/**
 * Discovers active non-internal IPv4 addresses and their subnet broadcast targets.
 */
export function getActiveNetworkInfo(udpPort = 5300, secondaryUdpPort = 20777): NetworkInterfaceInfo {
  const interfaces = os.networkInterfaces();
  const directIps: string[] = [];
  const broadcastIps = new Set<string>();

  for (const ifaceName of Object.keys(interfaces)) {
    for (const net of interfaces[ifaceName] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        directIps.push(net.address);
        if (net.netmask) {
          const bcast = calculateBroadcastIp(net.address, net.netmask);
          if (bcast) broadcastIps.add(bcast);
        }
      }
    }
  }

  // Always include global fallback broadcast
  broadcastIps.add('255.255.255.255');

  return {
    directIps: directIps.length > 0 ? directIps : ['127.0.0.1'],
    broadcastIps: Array.from(broadcastIps),
    udpPort,
    secondaryUdpPort
  };
}

/**
 * Reads request body into a Buffer
 */
function readRequestBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Custom Vite Plugin to run UDP Ingestion socket, WebSocket bridge,
 * and PC disk storage API inside the Vite dev server.
 */
export function telemetryPlugin(udpPort = 5300, secondaryUdpPort = 20777): Plugin {
  return {
    name: 'apex-telemetry-bridge',
    configureServer(server: ViteDevServer) {
      ensureStorageDirs();

      const connectedClients = new Set<WebSocket>();
      let primaryUdp: dgram.Socket | null = null;
      let secondaryUdp: dgram.Socket | null = null;
      let wss: WebSocketServer | null = null;
      let packetCount = 0;
      let lastLogTime = Date.now();
      let hasLoggedFirstPacket = false;

      // Raw UDP binary stream recording state
      let isRecording = false;
      let recordFileStream: fs.WriteStream | null = null;
      let recordFilePath: string | null = null;
      let recordFileName: string | null = null;
      let recordStartTime = 0;
      let recordPacketCount = 0;
      let recordBytesWritten = 0;

      const networkInfo = getActiveNetworkInfo(udpPort, secondaryUdpPort);

      // --- 1. REST ENDPOINTS ---

      // 1.1 Network Info: /api/network-info
      server.middlewares.use('/api/network-info', (_req, res) => {
        const freshNetworkInfo = getActiveNetworkInfo(udpPort, secondaryUdpPort);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(freshNetworkInfo));
      });

      // 1.2 Profiles Manifest API: /api/storage/profiles
      server.middlewares.use('/api/storage/profiles', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const url = req.url || '';

        // GET - Load profiles manifest
        if (req.method === 'GET') {
          try {
            const manifest = loadOrInitProfilesManifest();
            return res.end(JSON.stringify({ success: true, manifest }));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        // POST - Update manifest or save/create profile
        if (req.method === 'POST') {
          try {
            const bodyBuffer = await readRequestBody(req);
            const payload = JSON.parse(bodyBuffer.toString('utf-8'));

            let currentManifest = loadOrInitProfilesManifest();

            if (payload && payload.profiles && Array.isArray(payload.profiles)) {
              // Full manifest update
              currentManifest = {
                ...currentManifest,
                ...payload,
                version: '2.5'
              };
            } else if (payload && payload.id) {
              // Single profile upsert
              const existingIdx = currentManifest.profiles.findIndex((p: any) => p.id === payload.id);
              if (existingIdx >= 0) {
                currentManifest.profiles[existingIdx] = { ...currentManifest.profiles[existingIdx], ...payload };
              } else {
                currentManifest.profiles.push(payload);
              }
            }

            // Ensure profile directory structures exist for all registered profiles
            currentManifest.profiles.forEach((p: any) => {
              getProfileDirs(p.id);
            });

            fs.writeFileSync(PROFILES_MANIFEST_FILE, JSON.stringify(currentManifest, null, 2), 'utf-8');
            return res.end(JSON.stringify({ success: true, manifest: currentManifest }));
          } catch (err: any) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        // DELETE - Delete a profile
        if (req.method === 'DELETE') {
          try {
            const parsedUrl = new URL(url, 'http://localhost');
            const profileId = parsedUrl.searchParams.get('id');
            if (!profileId) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: 'Missing profile id' }));
            }

            const currentManifest = loadOrInitProfilesManifest();
            if (currentManifest.profiles.length <= 1) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: 'Cannot delete the only remaining profile' }));
            }

            const remainingProfiles = currentManifest.profiles.filter((p: any) => p.id !== profileId);
            let activeProfileId = currentManifest.activeProfileId;
            if (activeProfileId === profileId) {
              activeProfileId = remainingProfiles[0].id;
            }

            const updatedManifest = {
              ...currentManifest,
              activeProfileId,
              profiles: remainingProfiles
            };

            fs.writeFileSync(PROFILES_MANIFEST_FILE, JSON.stringify(updatedManifest, null, 2), 'utf-8');

            // Move or rename deleted profile folder
            try {
              const profileDir = path.join(APEX_STORAGE_DIRS.profiles, profileId);
              if (fs.existsSync(profileDir)) {
                const deletedDir = path.join(APEX_STORAGE_DIRS.profiles, `${profileId}_deleted_${Date.now()}`);
                fs.renameSync(profileDir, deletedDir);
              }
            } catch (fsErr) {
              console.warn('[APEX Storage] Could not archive deleted profile dir:', fsErr);
            }

            return res.end(JSON.stringify({ success: true, manifest: updatedManifest }));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // 1.3 Storage Info: /api/storage/info
      server.middlewares.use('/api/storage/info', (req, res) => {
        try {
          const parsedUrl = new URL(req.url || '', 'http://localhost');
          const manifest = loadOrInitProfilesManifest();
          const targetProfileId = parsedUrl.searchParams.get('profileId') || manifest.activeProfileId || 'driver_default';
          const pDirs = getProfileDirs(targetProfileId);

          const stintCount = fs.existsSync(pDirs.stints) ? fs.readdirSync(pDirs.stints).length : 0;
          const reportCount = fs.existsSync(pDirs.reports) ? fs.readdirSync(pDirs.reports).length : 0;
          const rawCount = fs.existsSync(APEX_STORAGE_DIRS.raw_telemetry) ? fs.readdirSync(APEX_STORAGE_DIRS.raw_telemetry).length : 0;

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            success: true,
            storageRoot: APEX_STORAGE_DIRS.root,
            activeProfileId: targetProfileId,
            profilesCount: manifest.profiles.length,
            directories: {
              ...APEX_STORAGE_DIRS,
              profileRoot: pDirs.root,
              stints: pDirs.stints,
              reports: pDirs.reports,
              progress: pDirs.progress
            },
            stats: {
              stints: stintCount,
              reports: reportCount,
              rawLogs: rawCount
            }
          }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // 1.4 Driver Progress API: /api/storage/progress
      server.middlewares.use('/api/storage/progress', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const parsedUrl = new URL(req.url || '', 'http://localhost');
        const manifest = loadOrInitProfilesManifest();
        const targetProfileId = parsedUrl.searchParams.get('profileId') || manifest.activeProfileId || 'driver_default';
        const pDirs = getProfileDirs(targetProfileId);
        const progressFile = path.join(pDirs.progress, 'progress.json');

        if (req.method === 'GET') {
          try {
            if (fs.existsSync(progressFile)) {
              const data = fs.readFileSync(progressFile, 'utf-8');
              return res.end(data);
            }
            return res.end(JSON.stringify({ exists: false }));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        if (req.method === 'POST') {
          try {
            const bodyBuffer = await readRequestBody(req);
            const content = bodyBuffer.toString('utf-8');
            // Validate JSON
            JSON.parse(content);
            fs.writeFileSync(progressFile, content, 'utf-8');
            return res.end(JSON.stringify({ success: true, profileId: targetProfileId, savedAt: Date.now() }));
          } catch (err: any) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // 1.5 Stints History API: /api/storage/stints
      server.middlewares.use('/api/storage/stints', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const url = req.url || '';
        const parsedUrl = new URL(url, 'http://localhost');
        const manifest = loadOrInitProfilesManifest();
        const targetProfileId = parsedUrl.searchParams.get('profileId') || manifest.activeProfileId || 'driver_default';
        const pDirs = getProfileDirs(targetProfileId);

        // GET all stints for this profile
        if (req.method === 'GET') {
          try {
            const files = fs.readdirSync(pDirs.stints).filter(f => f.endsWith('.json'));
            const stints: any[] = [];
            for (const file of files) {
              try {
                const filePath = path.join(pDirs.stints, file);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const parsed = JSON.parse(fileContent);
                stints.push(parsed);
              } catch (_) {}
            }
            // Sort by timestamp descending
            stints.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            return res.end(JSON.stringify({ success: true, profileId: targetProfileId, stints, count: stints.length }));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        // POST - Save or update a stint
        if (req.method === 'POST') {
          try {
            const bodyBuffer = await readRequestBody(req);
            const stint = JSON.parse(bodyBuffer.toString('utf-8'));
            const stintId = stint.stintId || stint.id || `stint_${Date.now()}`;
            const safeTrack = (stint.trackName || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `stint_${stintId}_${safeTrack}.json`;
            const filePath = path.join(pDirs.stints, fileName);

            fs.writeFileSync(filePath, JSON.stringify(stint, null, 2), 'utf-8');
            return res.end(JSON.stringify({ success: true, profileId: targetProfileId, stintId, fileName, path: filePath }));
          } catch (err: any) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        // DELETE - Delete a stint by id
        if (req.method === 'DELETE') {
          try {
            const stintId = parsedUrl.searchParams.get('id');
            if (!stintId) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: 'Missing stint id' }));
            }

            const files = fs.readdirSync(pDirs.stints);
            let deleted = false;
            for (const file of files) {
              if (file.includes(stintId)) {
                fs.unlinkSync(path.join(pDirs.stints, file));
                deleted = true;
              }
            }
            return res.end(JSON.stringify({ success: true, profileId: targetProfileId, deleted }));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // 1.6 PDF Reports API: /api/storage/reports
      server.middlewares.use('/api/storage/reports', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const parsedUrl = new URL(req.url || '', 'http://localhost');
        const manifest = loadOrInitProfilesManifest();
        const targetProfileId = parsedUrl.searchParams.get('profileId') || manifest.activeProfileId || 'driver_default';
        const pDirs = getProfileDirs(targetProfileId);

        if (req.method === 'GET') {
          try {
            const files = fs.readdirSync(pDirs.reports)
              .filter(f => f.endsWith('.pdf'))
              .map(fileName => {
                const filePath = path.join(pDirs.reports, fileName);
                const stat = fs.statSync(filePath);
                return {
                  fileName,
                  sizeBytes: stat.size,
                  createdAt: stat.birthtimeMs || stat.mtimeMs,
                  path: filePath
                };
              });
            files.sort((a, b) => b.createdAt - a.createdAt);
            return res.end(JSON.stringify({ success: true, profileId: targetProfileId, reports: files }));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        if (req.method === 'POST') {
          try {
            const bodyBuffer = await readRequestBody(req);
            const payload = JSON.parse(bodyBuffer.toString('utf-8'));
            const { fileName, base64Data } = payload;
            if (!fileName || !base64Data) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: 'Missing fileName or base64Data' }));
            }

            const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
            const filePath = path.join(pDirs.reports, cleanFileName);
            const binaryData = Buffer.from(base64Data.replace(/^data:application\/pdf;base64,/, ''), 'base64');

            fs.writeFileSync(filePath, binaryData);
            console.log(`📄 [APEX PDF Storage] Report saved to PC (${targetProfileId}): ${filePath} (${(binaryData.length / 1024).toFixed(1)} KB)`);

            return res.end(JSON.stringify({
              success: true,
              profileId: targetProfileId,
              fileName: cleanFileName,
              filePath,
              sizeBytes: binaryData.length
            }));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // 1.6 Raw UDP Telemetry Recording API: /api/telemetry/record
      server.middlewares.use('/api/telemetry/record', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const url = req.url || '';

        // Status check: GET /api/telemetry/record or /api/telemetry/record/status
        if (req.method === 'GET' || url.endsWith('/status')) {
          const durationSec = isRecording ? Math.floor((Date.now() - recordStartTime) / 1000) : 0;
          return res.end(JSON.stringify({
            isRecording,
            fileName: recordFileName,
            filePath: recordFilePath,
            durationSec,
            packetCount: recordPacketCount,
            bytesWritten: recordBytesWritten
          }));
        }

        // Start recording: POST /api/telemetry/record/start
        if (req.method === 'POST' && url.includes('/start')) {
          if (isRecording) {
            return res.end(JSON.stringify({
              success: true,
              message: 'Already recording',
              fileName: recordFileName,
              filePath: recordFilePath
            }));
          }

          const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
          recordFileName = `telemetry_${timestampStr}.bin`;
          recordFilePath = path.join(APEX_STORAGE_DIRS.raw_telemetry, recordFileName);
          recordFileStream = fs.createWriteStream(recordFilePath, { flags: 'a' });
          recordStartTime = Date.now();
          recordPacketCount = 0;
          recordBytesWritten = 0;
          isRecording = true;

          console.log(`🔴 [APEX UDP Recorder] Started raw UDP stream capture to: ${recordFilePath}`);
          return res.end(JSON.stringify({
            success: true,
            isRecording: true,
            fileName: recordFileName,
            filePath: recordFilePath,
            startTime: recordStartTime
          }));
        }

        // Stop recording: POST /api/telemetry/record/stop
        if (req.method === 'POST' && url.includes('/stop')) {
          if (!isRecording) {
            return res.end(JSON.stringify({ success: true, message: 'Not currently recording' }));
          }

          const durationMs = Date.now() - recordStartTime;
          const finalPackets = recordPacketCount;
          const finalBytes = recordBytesWritten;
          const savedPath = recordFilePath;
          const savedName = recordFileName;

          if (recordFileStream) {
            recordFileStream.end();
            recordFileStream = null;
          }

          isRecording = false;
          recordFilePath = null;
          recordFileName = null;

          console.log(`⏹️ [APEX UDP Recorder] Stopped capture. Saved ${finalPackets} packets (${(finalBytes / 1024).toFixed(1)} KB) to ${savedPath}`);
          return res.end(JSON.stringify({
            success: true,
            isRecording: false,
            fileName: savedName,
            filePath: savedPath,
            packetCount: finalPackets,
            bytesWritten: finalBytes,
            durationSec: Math.floor(durationMs / 1000)
          }));
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });


      // --- 2. WEBSOCKET SERVER ---
      wss = new WebSocketServer({ noServer: true });
      let standaloneWss: WebSocketServer | null = null;

      try {
        standaloneWss = new WebSocketServer({ port: 5301 });
        standaloneWss.on('connection', (ws) => {
          connectedClients.add(ws);
          try {
            ws.send(JSON.stringify({
              type: 'APEX_BRIDGE_INFO',
              network: getActiveNetworkInfo(udpPort, secondaryUdpPort),
              storage: {
                root: APEX_STORAGE_DIRS.root,
                stints: APEX_STORAGE_DIRS.stints,
                reports: APEX_STORAGE_DIRS.reports,
                rawTelemetry: APEX_STORAGE_DIRS.raw_telemetry
              },
              timestamp: Date.now()
            }));
          } catch (_) {}
          ws.on('close', () => connectedClients.delete(ws));
        });
        standaloneWss.on('error', () => {});
      } catch (_) {}

      wss.on('connection', (ws) => {
        connectedClients.add(ws);

        // Send initial metadata greeting with storage info
        const greeting = JSON.stringify({
          type: 'APEX_BRIDGE_INFO',
          network: getActiveNetworkInfo(udpPort, secondaryUdpPort),
          storage: {
            root: APEX_STORAGE_DIRS.root,
            stints: APEX_STORAGE_DIRS.stints,
            reports: APEX_STORAGE_DIRS.reports,
            rawTelemetry: APEX_STORAGE_DIRS.raw_telemetry
          },
          timestamp: Date.now()
        });
        ws.send(greeting);

        ws.on('close', () => {
          connectedClients.delete(ws);
        });

        ws.on('error', (err) => {
          console.warn('[APEX Telemetry Bridge] WebSocket error:', err.message);
        });
      });

      if (server.httpServer) {
        server.httpServer.on('upgrade', (req, socket, head) => {
          const pathname = req.url ? new URL(req.url, 'http://localhost').pathname : '';
          if (pathname === '/telemetry-bridge') {
            wss?.handleUpgrade(req, socket, head, (ws) => {
              wss?.emit('connection', ws, req);
            });
          }
        });
      }


      // --- 3. UDP PACKET INGEST & RECORDER ---
      const handlePacket = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
        packetCount++;
        if (!hasLoggedFirstPacket) {
          hasLoggedFirstPacket = true;
          console.log(`\n🎉 [APEX UDP Ingest] Live Forza telemetry stream received from ${rinfo.address}:${rinfo.port} (${msg.length} bytes)!`);
        }

        const now = Date.now();
        if (now - lastLogTime >= 4000) {
          const rate = (packetCount / ((now - lastLogTime) / 1000)).toFixed(1);
          console.log(`[APEX UDP Ingest] Relaying Forza telemetry at ${rate} pkts/sec to ${connectedClients.size} UI client(s)`);
          packetCount = 0;
          lastLogTime = now;
        }

        // Write raw binary packet to active recording stream if enabled
        if (isRecording && recordFileStream) {
          try {
            // Write 8-byte frame header: [Uint32 length (4B), Uint32 deltaMs (4B)]
            const header = Buffer.alloc(8);
            header.writeUInt32LE(msg.length, 0);
            header.writeUInt32LE(Math.max(0, now - recordStartTime), 4);
            recordFileStream.write(header);
            recordFileStream.write(msg);
            recordPacketCount++;
            recordBytesWritten += (8 + msg.length);
          } catch (writeErr: any) {
            console.warn('[APEX UDP Recorder] Write error:', writeErr.message);
          }
        }

        // Relay raw telemetry binary buffer to all connected WebSockets
        for (const client of connectedClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
          }
        }
      };

      // --- 4. START UDP SOCKETS ---
      try {
        primaryUdp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        primaryUdp.on('message', handlePacket);
        primaryUdp.on('error', (err) => {
          console.error(`[APEX UDP] Primary Socket (${udpPort}) error:`, err.message);
        });
        primaryUdp.on('listening', () => {
          try {
            primaryUdp?.setBroadcast(true);
          } catch (e: any) {
            console.warn(`[APEX UDP] Could not enable broadcast on port ${udpPort}:`, e?.message);
          }
          console.log(`\n🏎️  APEX TELEMETRY BRIDGE & PC DISK STORAGE EMBEDDED IN VITE`);
          console.log(`🎮 UDP Ingest Socket listening on 0.0.0.0:${udpPort} (Broadcast Enabled)`);
          console.log(`📡 WebSocket bridge path: /telemetry-bridge`);
          console.log(`💾 PC Storage Directory: ${APEX_STORAGE_DIRS.root}`);
          console.log(`📌 Forza HUD Data Out IP Target:`);
          networkInfo.directIps.forEach((ip) => {
            console.log(`   - Direct IP: ${ip}`);
          });
          networkInfo.broadcastIps.forEach((bcast) => {
            console.log(`   - Subnet Broadcast (Recommended): ${bcast}`);
          });
          console.log(`   - Data Out Port: ${udpPort}\n`);
        });

        primaryUdp.bind(udpPort, '0.0.0.0');
      } catch (err: any) {
        console.warn(`[APEX UDP] Could not bind port ${udpPort}:`, err?.message);
      }

      // Secondary Fallback UDP Socket (20777)
      try {
        secondaryUdp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        secondaryUdp.on('message', handlePacket);
        secondaryUdp.on('error', () => {});
        secondaryUdp.on('listening', () => {
          try { secondaryUdp?.setBroadcast(true); } catch (_) {}
        });
        secondaryUdp.bind(secondaryUdpPort, '0.0.0.0');
      } catch (_) {}

      // Graceful cleanup on server close
      server.httpServer?.on('close', () => {
        if (recordFileStream) {
          try { recordFileStream.end(); } catch (_) {}
        }
        try { primaryUdp?.close(); } catch (_) {}
        try { secondaryUdp?.close(); } catch (_) {}
        try { wss?.close(); } catch (_) {}
        try { standaloneWss?.close(); } catch (_) {}
        connectedClients.clear();
      });

    }
  };
}

