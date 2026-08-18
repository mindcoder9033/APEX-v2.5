import type { Plugin, ViteDevServer } from 'vite';
import * as dgram from 'dgram';
import * as os from 'os';
import { WebSocketServer, WebSocket } from 'ws';

export interface NetworkInterfaceInfo {
  directIps: string[];
  broadcastIps: string[];
  udpPort: number;
  secondaryUdpPort: number;
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
 * Custom Vite Plugin to automatically run the UDP Ingestion socket and WebSocket bridge
 * inside the Vite dev server process.
 */
export function telemetryPlugin(udpPort = 5300, secondaryUdpPort = 20777): Plugin {
  return {
    name: 'apex-telemetry-bridge',
    configureServer(server: ViteDevServer) {
      const connectedClients = new Set<WebSocket>();
      let primaryUdp: dgram.Socket | null = null;
      let secondaryUdp: dgram.Socket | null = null;
      let wss: WebSocketServer | null = null;
      let packetCount = 0;
      let lastLogTime = Date.now();
      let hasLoggedFirstPacket = false;

      const networkInfo = getActiveNetworkInfo(udpPort, secondaryUdpPort);

      // 1. Setup REST endpoint for network info: /api/network-info
      server.middlewares.use('/api/network-info', (_req, res) => {
        const freshNetworkInfo = getActiveNetworkInfo(udpPort, secondaryUdpPort);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(freshNetworkInfo));
      });

      // 2. Setup WebSocket Server attached to Vite's HTTP server + dedicated port 5301
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
              timestamp: Date.now()
            }));
          } catch (_) {}
          ws.on('close', () => connectedClients.delete(ws));
        });
        standaloneWss.on('error', () => {});
      } catch (_) {}

      wss.on('connection', (ws) => {
        connectedClients.add(ws);

        // Send initial metadata greeting
        const greeting = JSON.stringify({
          type: 'APEX_BRIDGE_INFO',
          network: getActiveNetworkInfo(udpPort, secondaryUdpPort),
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


      // 3. UDP Packet Forwarding Handler
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

        // Relay raw telemetry binary buffer to all connected WebSockets
        for (const client of connectedClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
          }
        }
      };

      // 4. Start Primary UDP Socket (5300)
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
          console.log(`\n🏎️  APEX TELEMETRY BRIDGE EMBEDDED IN VITE`);
          console.log(`🎮 UDP Ingest Socket listening on 0.0.0.0:${udpPort} (Broadcast Enabled)`);
          console.log(`📡 WebSocket bridge path: /telemetry-bridge`);
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

      // 5. Start Secondary Fallback UDP Socket (20777)
      try {
        secondaryUdp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        secondaryUdp.on('message', handlePacket);
        secondaryUdp.on('error', () => {});
        secondaryUdp.on('listening', () => {
          try { secondaryUdp?.setBroadcast(true); } catch (_) {}
        });
        secondaryUdp.bind(secondaryUdpPort, '0.0.0.0');
      } catch (_) {}

      // 6. Graceful cleanup on server close
      server.httpServer?.on('close', () => {
        try { primaryUdp?.close(); } catch (_) {}
        try { secondaryUdp?.close(); } catch (_) {}
        try { wss?.close(); } catch (_) {}
        try { standaloneWss?.close(); } catch (_) {}
        connectedClients.clear();
      });

    }
  };
}
