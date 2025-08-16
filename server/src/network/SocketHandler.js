// Surr Game - Socket Handler Functions
// Function-based socket event management

import { 
  addPlayer, 
  removePlayer, 
  canAcceptPlayers, 
  getPlayerCount, 
  getGameStateForBroadcast, 
  getLeaderboard 
} from '../game/GameState.js';

// Connected clients state
let connectedClients = new Map();
let io = null;

// Initialize socket handler
export function initSocketHandler(ioInstance) {
  io = ioInstance;
  console.log('SocketHandler initialized');
}

// Handle new client connection
export function handleConnection(socket) {
  console.log(`Client connected: ${socket.id}`);
  
  // Store client connection
  connectedClients.set(socket.id, {
    socket: socket,
    connected: true,
    playerName: null
  });

  // Send connection confirmation
  socket.emit('connected', { 
    message: 'Connected to Surr Game Server', 
    clientId: socket.id 
  });
  
  // Set up event listeners
  setupEventListeners(socket);
}

// Set up socket event listeners
function setupEventListeners(socket) {
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    handleDisconnection(socket, reason);
  });
  
  // Handle join game requests
  socket.on('joinGame', (data) => {
    handleJoinGame(socket, data);
  });

  // Placeholder for future events:
  // - playerPosition
  // - missileHit  
  // - weaponboxCollected
}

// Handle player disconnection
function handleDisconnection(socket, reason) {
  console.log(`Client disconnected: ${socket.id} - Reason: ${reason}`);
  
  // Remove from game state
  removePlayer(socket.id);
  
  // Remove from connected clients
  connectedClients.delete(socket.id);
  
  // Broadcast updated game state
  broadcastGameState();
}

// Handle join game requests
function handleJoinGame(socket, data) {
  const playerName = data?.playerName || 'Unknown';
  console.log(`Player attempting to join: ${playerName}`);
  
  // Check if game can accept more players
  if (!canAcceptPlayers()) {
    socket.emit('joinGameResponse', {
      success: false,
      message: 'Game is full. Maximum 6 players allowed.',
      playerId: null
    });
    return;
  }
  
  // Add player to game state
  const success = addPlayer(socket.id, playerName);
  
  if (success) {
    // Update client info
    const clientInfo = connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.playerName = playerName;
    }
    
    // Acknowledge successful join
    socket.emit('joinGameResponse', {
      success: true,
      message: `Welcome ${playerName}!`,
      playerId: socket.id,
      playerCount: getPlayerCount(),
      maxPlayers: 6
    });
    
    // Broadcast updates
    broadcastGameState();
    broadcastLeaderboard();
  } else {
    socket.emit('joinGameResponse', {
      success: false,
      message: 'Failed to join game. Please try again.',
      playerId: null
    });
  }
}

// Broadcast functions
export function broadcastToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

export function broadcastGameState() {
  const gameState = getGameStateForBroadcast();
  broadcastToAll('gameState', gameState);
}

export function broadcastLeaderboard() {
  const leaderboard = getLeaderboard();
  broadcastToAll('leaderboardUpdate', { leaderboard });
}

// Get connected client count
export function getConnectedCount() {
  return connectedClients.size;
}