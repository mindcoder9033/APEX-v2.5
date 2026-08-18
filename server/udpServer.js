const dgram = require('dgram');
const http = require('http');
const os = require('os');
const { WebSocketServer } = require('ws');

const UDP_PORT = process.env.UDP_PORT ? parseInt(process.env.UDP_PORT) : 5300;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 5301;

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

// Create WebSocket server for frontend telemetry stream
const server = http.createServer();
const wss = new WebSocketServer({ server });

let connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  console.log(`[APEX Telemetry Bridge] Frontend UI client connected. Active WebSockets: ${connectedClients.size}`);

  // Send initial network metadata greeting to frontend
  try {
    const localIps = getLocalIpAddresses();
    ws.send(JSON.stringify({
      type: 'APEX_BRIDGE_INFO',
      network: {
        directIps: localIps.length > 0 ? localIps : ['127.0.0.1'],
        broadcastIps: ['192.168.1.255', '255.255.255.255'],
        udpPort: UDP_PORT,
        secondaryUdpPort: 20777
      },
      timestamp: Date.now()
    }));
  } catch (_) {}

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`[APEX Telemetry Bridge] Frontend UI client disconnected. Active WebSockets: ${connectedClients.size}`);
  });

  ws.on('error', (err) => {
    console.warn(`[APEX Telemetry Bridge] WebSocket client error:`, err.message);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ [APEX Telemetry Bridge] Port ${WS_PORT} is already in use by another running instance.`);
  } else {
    console.error(`[APEX Telemetry Bridge] Server error:`, err);
  }
});

server.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🏎️  APEX TELEMETRY BRIDGE ONLINE (Standalone)`);
  console.log(`📡 WebSocket stream: ws://localhost:${WS_PORT}`);
  console.log(`====================================================`);
});


// Create UDP Socket for Forza telemetry ingestion (Port 5300 + Broadcast support)
const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
const altUdpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

let packetCount = 0;
let lastLogTime = Date.now();
let hasReceivedFirstPacket = false;

function handlePacket(msg, rinfo) {
  packetCount++;
  if (!hasReceivedFirstPacket) {
    hasReceivedFirstPacket = true;
    console.log(`\n🎉 [APEX UDP Ingest] SUCCESS! Live Forza telemetry packet received from ${rinfo.address}:${rinfo.port} (${msg.length} bytes)!`);
  }

  const now = Date.now();
  if (now - lastLogTime >= 4000) {
    const rate = (packetCount / ((now - lastLogTime) / 1000)).toFixed(1);
    console.log(`[APEX UDP Ingest] Ingesting Forza telemetry at ${rate} pkts/sec from ${rinfo.address}:${rinfo.port}`);
    packetCount = 0;
    lastLogTime = now;
  }

  // Forward raw binary buffer to all connected WebSocket clients
  for (const client of connectedClients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(msg);
    }
  }
}

udpSocket.on('error', (err) => {
  console.error(`[APEX UDP] Primary Socket (5300) error:\n${err.stack}`);
});

udpSocket.on('message', handlePacket);

udpSocket.on('listening', () => {
  try {
    udpSocket.setBroadcast(true);
  } catch (e) {
    console.warn(`[APEX UDP] Could not enable broadcast: ${e.message}`);
  }
  const address = udpSocket.address();
  const localIps = getLocalIpAddresses();
  console.log(`🎮 UDP Ingest Socket listening on 0.0.0.0:${address.port} (Broadcast Enabled)`);
  console.log(`📌 Configure Forza Motorsport / Forza Horizon HUD Settings:`);
  console.log(`   - Data Out: ON`);
  console.log(`   - Data Out IP Address:`);
  localIps.forEach(ip => {
    console.log(`       * ${ip} (Direct PC IP)`);
  });
  console.log(`       * 192.168.1.255 (Subnet Broadcast - Recommended for Xbox)`);
  console.log(`       * 255.255.255.255 (Global Broadcast)`);
  console.log(`   - Data Out IP Port: ${address.port}`);
  console.log(`   - Data Out Packet Format: CarDash`);
  console.log(`====================================================`);
});

altUdpSocket.on('error', () => {});
altUdpSocket.on('message', handlePacket);
altUdpSocket.on('listening', () => {
  try { altUdpSocket.setBroadcast(true); } catch (_) {}
  console.log(`🎮 Secondary UDP Ingest Socket listening on 0.0.0.0:20777`);
});

udpSocket.bind(UDP_PORT, '0.0.0.0');
try {
  altUdpSocket.bind(20777, '0.0.0.0');
} catch (_) {}

