// Surr Game - Server Entry Point
// Main server file that initializes Express and Socket.IO

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SocketHandler } from './network/SocketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const PORT = 5173;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure CORS middleware for client connections
app.use(cors({
  origin: "http://localhost:3000", // Client will run on port 3000
  methods: ["GET", "POST"],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files for client assets
app.use('/assets', express.static(path.join(__dirname, '../../client/assets')));

// Basic route for health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Surr Game Server is running' });
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize Socket Handler
const socketHandler = new SocketHandler(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// Start the server
server.listen(PORT, () => {
  console.log(`Surr Game Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log('Socket.IO server ready');
});
