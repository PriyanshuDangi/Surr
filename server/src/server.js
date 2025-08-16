// Surr Game - Server Entry Point
// Function-based server initialization

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocketHandler, handleConnection, cleanup } from './network/SocketHandler.js';
import { initGameState } from './game/GameState.js';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const PORT = config.port;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure middleware
app.use(cors({
  origin: config.corsOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '../../client/assets')));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Surr Game Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize game systems
initGameState();
initSocketHandler(io);

// Socket.IO connection handling
io.on('connection', handleConnection);

// Start the server
server.listen(PORT, () => {
  console.log(`Surr Game Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log('Socket.IO server ready');
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\nShutting down Surr Game Server...');
  cleanup();
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
});