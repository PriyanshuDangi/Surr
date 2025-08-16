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
  setPlayerAliveStatus,
  handleWeaponPickupCollection,
  awardPoints
} from '../game/GameState.js';

// Connected clients state
let connectedClients = new Map();
let io = null;

// Step 5.2: Server tick system for broadcasting game state
let gameTickInterval = null;
const TICK_RATE = 20; // 20Hz = 50ms intervals
const TICK_INTERVAL = 1000 / TICK_RATE;
let lastGameStateBroadcast = 0;
let pendingGameStateBroadcast = true;

// Initialize socket handler
export function initSocketHandler(ioInstance) {
  io = ioInstance;
  console.log('SocketHandler initialized');
  
  // Step 5.2: Start server tick for game state broadcasting
  startServerTick();
}

// Step 5.2: Server tick system functions
function startServerTick() {
  if (gameTickInterval) {
    clearInterval(gameTickInterval);
  }

  
  
  gameTickInterval = setInterval(() => {
    // Only broadcast if there are connected players
    if (connectedClients.size > 0 && Date.now() - lastGameStateBroadcast > TICK_INTERVAL && pendingGameStateBroadcast) {
      broadcastGameState();
      pendingGameStateBroadcast = false;
      lastGameStateBroadcast = Date.now();
    }
  }, TICK_INTERVAL);
  
  console.log(`🎯 Server tick started at ${TICK_RATE}Hz (${TICK_INTERVAL}ms intervals)`);
}

function stopServerTick() {
  if (gameTickInterval) {
    clearInterval(gameTickInterval);
    gameTickInterval = null;
    console.log('🛑 Server tick stopped');
  }
}

// Cleanup function for graceful shutdown
export function cleanup() {
  stopServerTick();
  connectedClients.clear();
  console.log('SocketHandler cleanup completed');
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

  // Handle weapon pickup collection
  socket.on('weaponPickupCollection', (data) => {
    handleWeaponPickupCollectionEvent(socket, data);
  });

  // Step 7.2: Handle missile firing
  socket.on('missileFire', (data) => {
    handleMissileFireEvent(socket, data);
  });

  // Step 7.4: Handle missile hit reports
  socket.on('missileHit', (data) => {
    handleMissileHitEvent(socket, data);
  });
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

  pendingGameStateBroadcast = true;
  
  if (now - handlePlayerPosition.lastLogTime > 5000) { // Log every 5 seconds
    console.log(`📍 Position updates received: ${handlePlayerPosition.updateCount} in last 5s from ${getPlayerCount()} players`);
    handlePlayerPosition.lastLogTime = now;
    handlePlayerPosition.updateCount = 0;
  }
}

// Handle weapon pickup collection events
function handleWeaponPickupCollectionEvent(socket, data) {
  const playerId = socket.id;
  const { weaponBoxId } = data || {};
  
  if (!weaponBoxId) {
    console.log(`Invalid weapon pickup data from player ${playerId}`);
    socket.emit('weaponPickupResponse', {
      success: false,
      reason: 'Invalid weapon box ID'
    });
    return;
  }
  
  // Attempt to collect the weapon pickup
  const result = handleWeaponPickupCollection(playerId, weaponBoxId);
  
  // Send response to the requesting client
  socket.emit('weaponPickupResponse', {
    success: result.success,
    reason: result.reason || null,
    weapon: result.weapon || null,
    weaponBoxId: weaponBoxId
  });
  
  // If collection was successful, broadcast updated game state
  if (result.success) {
    broadcastGameState();
  }
}

// Step 7.2: Handle missile fire events
function handleMissileFireEvent(socket, data) {
  const playerId = socket.id;
  const { missileId, shooterId, position, direction } = data || {};
  
  // Validate incoming data
  if (!missileId || !shooterId || !position || !direction) {
    console.log(`Invalid missile fire data from player ${playerId}`);
    return;
  }
  
  // Validate that the shooter is the player sending the event
  if (shooterId !== playerId) {
    console.log(`Player ${playerId} attempted to fire missile for another player ${shooterId}`);
    return;
  }
  
  console.log(`🚀 Player ${playerId} fired missile ${missileId}`);
  
  // Update player weapon state (remove weapon when fired)
  updatePlayerWeapon(playerId, null);
  
  // Broadcast missile to all clients for visual synchronization
  const missileData = {
    missileId,
    shooterId,
    position,
    direction,
    timestamp: Date.now()
  };
  
  // broadcastToAll('missileSpawned', missileData);
  broadcastToAllExceptSender('missileSpawned', socket, missileData);
  
  // Broadcast updated game state (player no longer has weapon)
  broadcastGameState();
}

// Step 7.4: Handle missile hit events and process eliminations
function handleMissileHitEvent(socket, data) {
  const reporterId = socket.id;
  const { missileId, shooterId, targetId, hitPosition } = data || {};
  
  // Validate incoming data
  if (!missileId || !shooterId || !targetId || !hitPosition) {
    console.log(`Invalid missile hit data from player ${reporterId}`);
    return;
  }
  
  // Validate that the reporter is the shooter (only shooter can report hits from their missiles)
  if (shooterId !== reporterId) {
    console.log(`Player ${reporterId} attempted to report hit for missile from ${shooterId}`);
    return;
  }
  
  console.log(`💥 Missile hit reported: ${missileId} from ${shooterId} hit ${targetId}`);
  
  // Process elimination (server accepts hit reports without validation - client authoritative)
  
  // Award points to shooter (1 point per elimination)
  awardPoints(shooterId, 1);
  
  // Eliminate target player (set as not alive, remove weapon)
  setPlayerAliveStatus(targetId, false);
  updatePlayerWeapon(targetId, null);
  
  // Broadcast elimination event to all clients
  const eliminationData = {
    missileId,
    shooterId,
    targetId,
    hitPosition,
    timestamp: Date.now()
  };
  
  broadcastToAll('playerEliminated', eliminationData);
  broadcastToAllExceptSender('playerEliminated', socket, eliminationData);
  
  // Schedule respawn after 5 seconds
  setTimeout(() => {
    respawnPlayer(targetId);
  }, 5000);
  
  // Broadcast updated game state and leaderboard
  broadcastGameState();
  broadcastLeaderboard();
  
  console.log(`🎯 Player ${targetId} eliminated by ${shooterId}. Respawning in 5 seconds.`);
}

// Step 8.2: Generate random spawn position
function generateRandomSpawnPosition() {
  const arenaSize = 40; // Slightly smaller than full arena to avoid spawning too close to edges
  const spawnPositions = [
    { x: 0, y: 1, z: 0 },           // Center
    { x: 15, y: 1, z: 15 },         // Northeast
    { x: -15, y: 1, z: 15 },        // Northwest  
    { x: 15, y: 1, z: -15 },        // Southeast
    { x: -15, y: 1, z: -15 },       // Southwest
    { x: 20, y: 1, z: 0 },          // East
    { x: -20, y: 1, z: 0 },         // West
    { x: 0, y: 1, z: 20 },          // North
    { x: 0, y: 1, z: -20 }          // South
  ];
  
  // Return random spawn position
  return spawnPositions[Math.floor(Math.random() * spawnPositions.length)];
}

// Step 8.2: Check if spawn position is safe (not occupied by another player)
function isSpawnPositionSafe(position, playerId) {
  const safeDistance = 5; // Minimum distance from other players
  
  // Get all other alive players
  const gameState = getGameStateForBroadcast();
  const otherPlayers = gameState.players.filter(p => p.id !== playerId && p.isAlive);
  
  // Check distance from each other player
  for (const player of otherPlayers) {
    const distance = Math.sqrt(
      Math.pow(position.x - player.position.x, 2) +
      Math.pow(position.z - player.position.z, 2)
    );
    
    if (distance < safeDistance) {
      return false;
    }
  }
  
  return true;
}

// Step 8.2: Find safe spawn position
function findSafeSpawnPosition(playerId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const position = generateRandomSpawnPosition();
    if (isSpawnPositionSafe(position, playerId)) {
      return position;
    }
  }
  
  // If no safe position found, return center position
  console.log(`Warning: Could not find safe spawn position for player ${playerId}, using center`);
  return { x: 0, y: 1, z: 0 };
}

// Step 8.2: Respawn eliminated player with random position
function respawnPlayer(playerId) {
  // Check if player is still connected
  if (!connectedClients.has(playerId)) {
    console.log(`Cannot respawn player ${playerId} - not connected`);
    return;
  }
  
  // Generate safe spawn position
  const spawnPosition = findSafeSpawnPosition(playerId);
  
  // Reset player state
  setPlayerAliveStatus(playerId, true);
  updatePlayerWeapon(playerId, null);
  updatePlayerPosition(playerId, spawnPosition, { x: 0, y: 0, z: 0 });
  
  // Broadcast respawn event with spawn position
  const respawnData = {
    playerId,
    spawnPosition,
    timestamp: Date.now()
  };
  
  broadcastToAll('playerRespawned', respawnData);
  broadcastGameState();
  
  console.log(`✨ Player ${playerId} respawned at position (${spawnPosition.x}, ${spawnPosition.z})`);
}

// Broadcast functions
export function broadcastToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

export function broadcastToAllExceptSender(event, socket, data) {
  if (socket) {
    socket.broadcast.emit(event, data);
  }
}

export function broadcastGameState() {
  const gameState = getGameStateForBroadcast();
  broadcastToAll('gameState', gameState);
  
  // Step 5.2: Log broadcast statistics periodically
  if (!broadcastGameState.lastLogTime) {
    broadcastGameState.lastLogTime = 0;
    broadcastGameState.broadcastCount = 0;
  }
  
  broadcastGameState.broadcastCount++;
  const now = Date.now();
  
  if (now - broadcastGameState.lastLogTime > 10000) { // Log every 10 seconds
    const playersData = gameState.players || [];
    console.log(`📢 Game state broadcasts: ${broadcastGameState.broadcastCount} in last 10s | Players: ${playersData.length} | Clients: ${connectedClients.size}`);
    broadcastGameState.lastLogTime = now;
    broadcastGameState.broadcastCount = 0;
  }
}

// Step 9.4: Leaderboard broadcast throttling
let lastLeaderboardBroadcast = 0;
const LEADERBOARD_THROTTLE_INTERVAL = 1000; // 1 second minimum between broadcasts

export function broadcastLeaderboard() {
  const now = Date.now();
  
  // Throttle leaderboard broadcasts to avoid spam
  if (now - lastLeaderboardBroadcast < LEADERBOARD_THROTTLE_INTERVAL) {
    console.log('📊 Leaderboard broadcast throttled');
    return;
  }
  
  const leaderboard = getLeaderboard();
  broadcastToAll('leaderboardUpdate', { leaderboard });
  lastLeaderboardBroadcast = now;
  
  console.log(`📊 Leaderboard broadcasted with ${leaderboard.length} players`);
}

// Get connected client count
export function getConnectedCount() {
  return connectedClients.size;
}