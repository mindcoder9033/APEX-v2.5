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

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`[APEX Telemetry Bridge] Frontend UI client disconnected. Active WebSockets: ${connectedClients.size}`);
  });

  ws.on('error', (err) => {
    console.warn(`[APEX Telemetry Bridge] WebSocket client error:`, err.message);
  });
});

server.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🏎️  APEX TELEMETRY BRIDGE ONLINE`);
  console.log(`📡 WebSocket stream: ws://localhost:${WS_PORT}`);
  console.log(`====================================================`);
});

// Create UDP Socket for Forza telemetry ingestion
const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

let packetCount = 0;
let lastLogTime = Date.now();

udpSocket.on('error', (err) => {
  console.error(`[APEX UDP] Socket error:\n${err.stack}`);
});

udpSocket.on('message', (msg, rinfo) => {
  packetCount++;
  const now = Date.now();
  if (now - lastLogTime >= 5000) {
    const rate = (packetCount / ((now - lastLogTime) / 1000)).toFixed(1);
    console.log(`[APEX UDP Ingest] Ingesting Forza telemetry at ${rate} pkts/sec from ${rinfo.address}:${rinfo.port} (${msg.length} bytes)`);
    packetCount = 0;
    lastLogTime = now;
  }

  // Forward raw binary buffer to all connected WebSocket clients
  for (const client of connectedClients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(msg);
    }
  }
});

udpSocket.on('listening', () => {
  const address = udpSocket.address();
  const localIps = getLocalIpAddresses();
  console.log(`🎮 UDP Ingest Socket listening on 0.0.0.0:${address.port}`);
  console.log(`📌 Configure Forza Motorsport / Forza Horizon HUD Settings:`);
  console.log(`   - Data Out: ON`);
  console.log(`   - Data Out IP Address:`);
  localIps.forEach(ip => {
    console.log(`       * ${ip} (LAN / Xbox / Network / PC)`);
  });
  console.log(`       * 127.0.0.1 (Localhost / Steam)`);
  console.log(`   - Data Out IP Port: ${address.port}`);
  console.log(`   - Data Out Packet Format: CarDash`);
  console.log(`====================================================`);
});

udpSocket.bind(UDP_PORT, '0.0.0.0');

