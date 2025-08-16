// Surr Game - Socket Handler Functions
// Function-based socket event management

import { 
  addPlayer, 
  removePlayer, 
  canAcceptPlayers, 
  getPlayerCount, 
  getGameStateForBroadcast, 
  getLeaderboard,
  updatePlayerPosition,
  updatePlayerWeapon,
  setPlayerAliveStatus
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

  // Step 5.1: Handle optimized player position updates
  socket.on('playerPosition', (data) => {
    handlePlayerPosition(socket, data);
  });

  // Placeholder for future events:
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

// Step 5.1: Handle optimized player position updates
function handlePlayerPosition(socket, data) {
  console.log('handlePlayerPosition', data);
  const playerId = socket.id;
  
  // Validate incoming data structure
  if (!data || !data.position || !data.rotation) {
    console.log(`Invalid position data from player ${playerId}`);
    return;
  }
  
  // Update player position in game state
  const positionUpdated = updatePlayerPosition(playerId, data.position, data.rotation);
  
  if (positionUpdated) {
    // Update weapon state if provided
    if (data.weapon !== undefined) {
      updatePlayerWeapon(playerId, data.weapon);
    }
    
    // Update alive status if provided
    if (data.isAlive !== undefined) {
      setPlayerAliveStatus(playerId, data.isAlive);
    }
    
    // Note: We don't broadcast every position update immediately
    // The server will broadcast game state at its own tick rate (20Hz)
    // This reduces server load and network traffic
  }
  
  // Log position updates periodically for debugging (throttled)
  if (!handlePlayerPosition.lastLogTime) {
    handlePlayerPosition.lastLogTime = 0;
    handlePlayerPosition.updateCount = 0;
  }
  
  handlePlayerPosition.updateCount++;
  const now = Date.now();
  
  if (now - handlePlayerPosition.lastLogTime > 5000) { // Log every 5 seconds
    console.log(`📍 Position updates received: ${handlePlayerPosition.updateCount} in last 5s from ${getPlayerCount()} players`);
    handlePlayerPosition.lastLogTime = now;
    handlePlayerPosition.updateCount = 0;
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