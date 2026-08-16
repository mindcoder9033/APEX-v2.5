const dgram = require('dgram');
const http = require('http');
const { WebSocketServer } = require('ws');

const UDP_PORT = process.env.UDP_PORT ? parseInt(process.env.UDP_PORT) : 5300;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 5301;

// Create WebSocket server for frontend telemetry stream
const server = http.createServer();
const wss = new WebSocketServer({ server });

let connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  console.log(`[APEX Telemetry Server] Client connected. Active clients: ${connectedClients.size}`);

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`[APEX Telemetry Server] Client disconnected. Active clients: ${connectedClients.size}`);
  });
});

server.listen(WS_PORT, () => {
  console.log(`[APEX Telemetry Server] WebSocket stream listening on ws://localhost:${WS_PORT}`);
});

// Create UDP Socket for Forza telemetry ingestion
const udpSocket = dgram.createSocket('udp4');

let packetCount = 0;
let lastLogTime = Date.now();

udpSocket.on('error', (err) => {
  console.error(`[APEX UDP] Socket error:\n${err.stack}`);
  udpSocket.close();
});

udpSocket.on('message', (msg, rinfo) => {
  packetCount++;
  const now = Date.now();
  if (now - lastLogTime >= 5000) {
    const rate = (packetCount / ((now - lastLogTime) / 1000)).toFixed(1);
    console.log(`[APEX UDP Ingest] Ingesting Forza telemetry at ${rate} pkts/sec from ${rinfo.address}:${rinfo.port}`);
    packetCount = 0;
    lastLogTime = now;
  }

  // Forward raw binary buffer to all connected WebSocket clients
  for (const client of connectedClients) {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  }
});

udpSocket.on('listening', () => {
  const address = udpSocket.address();
  console.log(`[APEX UDP Engine] Listening for Forza Motorsport UDP telemetry on ${address.address}:${address.port}`);
});

udpSocket.bind(UDP_PORT);
