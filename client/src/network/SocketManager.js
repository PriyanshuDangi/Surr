// Surr Game - Socket Manager
// Simple function-based socket connection with retry

import { io } from 'socket.io-client';
import { createMissile } from '../game/Missile.js';

let socket = null;
let isConnected = false;

// Position broadcasting state for optimization
let lastSentData = null;
let lastTimeSent = 0;
const THROTTLE_INTERVAL = 50; // 50ms minimum interval between sends

// Step 5.2: Game state receiving tracking
let gameStateCallback = null;
let gameStateStats = {
  receivedCount: 0,
  lastLogTime: 0
};

// Step 5.4: Connection status callbacks
let connectionCallbacks = [];
let disconnectionCallbacks = [];

export function initWebSocket() {
  const serverUrl = 'http://localhost:5173';
  
  console.log('Connecting to server...');
  
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: 5000
  });

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    isConnected = true;
    
    // Step 5.4: Notify connection callbacks
    connectionCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Connection callback error:', error);
      }
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    isConnected = false;
    
    // Step 5.4: Notify disconnection callbacks
    disconnectionCallbacks.forEach(callback => {
      try {
        callback(reason);
      } catch (error) {
        console.error('Disconnection callback error:', error);
      }
    });
  });

  socket.on('connect_error', (error) => {
    console.error('Connection failed:', error);
    isConnected = false;
    
    // Retry once after 3 seconds
    setTimeout(() => {
      console.log('Retrying connection...');
      socket.connect();
    }, 3000);
  });

  // Step 5.2: Listen for game state updates from server
  socket.on('gameState', (gameState) => {
    handleGameState(gameState);
  });
  
  // Step 6.3: Listen for weapon pickup collection responses
  socket.on('weaponPickupResponse', (data) => {
    handleWeaponPickupResponse(data);
  });
  
  // Step 7.2: Listen for missile spawn events
  socket.on('missileSpawned', (data) => {
    handleMissileSpawned(data);
  });
  
  // Step 7.4: Listen for player elimination events
  socket.on('playerEliminated', (data) => {
    handlePlayerEliminated(data);
  });
  
  // Step 7.4: Listen for player respawn events
  socket.on('playerRespawned', (data) => {
    handlePlayerRespawned(data);
  });
}

export function getSocket() {
  return socket;
}

export function isSocketConnected() {
  return isConnected;
}

// Optimized position broadcasting - only send when there are meaningful changes
export function broadcastPlayerPosition(playerData) {
  // console.log('broadcastPlayerPosition', playerData);
  if (!socket || !isConnected) {
    return false;
  }

  const now = performance.now();
  
  // Check throttling - only send if 50ms have passed since last send
  if (now - lastTimeSent < THROTTLE_INTERVAL) {
    return false;
  }

  // Check if any meaningful data has changed
  const hasChanges = hasPositionChanged(playerData);
  // console.log('hasChanges', hasChanges);
  if (!hasChanges) {
    return false;
  }

  // Send the position update
  socket.emit('playerPosition', playerData);
  
  // Update tracking state
  lastSentData = { ...playerData };
  lastTimeSent = now;
  
  broadcastPlayerPosition.lastSentTime = now;
  
  return true;
}
broadcastPlayerPosition.lastLogTime = 0;
broadcastPlayerPosition.lastSentTime = 0;

// Check if position data has meaningful changes
function hasPositionChanged(newData) {
  if (!lastSentData) {
    return true; // First send
  }

  const POSITION_THRESHOLD = 0.1; // Minimum position change to trigger update
  const ROTATION_THRESHOLD = 0.05; // Minimum rotation change (radians)

  // Check position changes
  const positionChanged = 
    Math.abs(newData.position.x - lastSentData.position.x) > POSITION_THRESHOLD ||
    Math.abs(newData.position.y - lastSentData.position.y) > POSITION_THRESHOLD ||
    Math.abs(newData.position.z - lastSentData.position.z) > POSITION_THRESHOLD;

  // Check rotation changes
  const rotationChanged = 
    Math.abs(newData.rotation.x - lastSentData.rotation.x) > ROTATION_THRESHOLD ||
    Math.abs(newData.rotation.y - lastSentData.rotation.y) > ROTATION_THRESHOLD ||
    Math.abs(newData.rotation.z - lastSentData.rotation.z) > ROTATION_THRESHOLD;

  // Check state changes
  const weaponChanged = newData.weapon !== lastSentData.weapon;
  const aliveChanged = newData.isAlive !== lastSentData.isAlive;

  return positionChanged || rotationChanged || weaponChanged || aliveChanged;
}

// Reset broadcasting state (useful for cleanup or reconnection)
export function resetBroadcastState() {
  lastSentData = null;
  lastTimeSent = 0;
  console.log('Position broadcast state reset');
}

// Step 6.3: Send weapon pickup collection event to server
export function sendWeaponPickupCollection(weaponBoxId) {
  if (!socket || !isConnected) {
    console.log('Cannot send weapon pickup collection - not connected to server');
    return false;
  }
  
  const collectionData = {
    weaponBoxId: weaponBoxId,
    timestamp: Date.now()
  };
  
  socket.emit('weaponPickupCollection', collectionData);
  console.log(`📤 Sent weapon pickup collection request for box ${weaponBoxId}`);
  return true;
}

// Step 7.2: Send missile fire event to server
export function sendMissileFire(missileData) {
  if (!socket || !isConnected) {
    console.log('Cannot send missile fire - not connected to server');
    return false;
  }
  
  const fireData = {
    missileId: missileData.missileId,
    shooterId: missileData.shooterId,
    position: missileData.position,
    direction: missileData.direction,
    timestamp: Date.now()
  };
  
  socket.emit('missileFire', fireData);
  console.log(`🚀 Sent missile fire event for missile ${missileData.missileId}`);
  return true;
}

// Step 7.4: Send missile hit report to server
export function sendMissileHit(hitData) {
  if (!socket || !isConnected) {
    console.log('Cannot send missile hit - not connected to server');
    return false;
  }
  
  const hitReport = {
    missileId: hitData.missileId,
    shooterId: hitData.shooterId,
    targetId: hitData.playerId,
    hitPosition: hitData.hitPosition,
    timestamp: Date.now()
  };
  
  socket.emit('missileHit', hitReport);
  console.log(`💥 Sent missile hit report: ${hitData.missileId} hit player ${hitData.playerId}`);
  return true;
}

// Step 5.2: Game state receiving functions
export function setGameStateCallback(callback) {
  gameStateCallback = callback;
}

function handleGameState(gameState) {
  console.log('handleGameState', gameState);
  gameStateStats.receivedCount++;
  const now = performance.now();
  
  // Call the registered callback if available
  if (gameStateCallback) {
    gameStateCallback(gameState);
  }
  
  // Log receiving statistics periodically
  if (now - gameStateStats.lastLogTime > 5000) { // Log every 5 seconds
    const playersCount = gameState.players ? gameState.players.length : 0;
    console.log(`📨 Game state received: ${gameStateStats.receivedCount} updates in last 5s | Players: ${playersCount}`);
    gameStateStats.lastLogTime = now;
    gameStateStats.receivedCount = 0;
  }
}

// Step 6.3: Handle weapon pickup collection response from server
function handleWeaponPickupResponse(data) {
  const { success, reason, weapon, weaponBoxId } = data;
  
  if (success) {
    console.log(`✅ Weapon pickup collection confirmed by server: ${weapon} from box ${weaponBoxId}`);
    // The player weapon state will be updated via game state broadcast
  } else {
    console.log(`❌ Weapon pickup collection failed: ${reason} (box ${weaponBoxId})`);
    // The pickup will be shown again via game state sync if collection failed
  }
}

// Step 7.2: Handle missile spawn events from server
function handleMissileSpawned(data) {
  const { missileId, shooterId, position, direction } = data;
  
  console.log(`🚀 Received missile spawn: ${missileId} from player ${shooterId}`);
  
  // Create remote missile (not local, so no hit detection)
  createMissile(
    shooterId,        // shooter ID
    position,         // spawn position
    direction,        // direction
    false,           // isLocal = false (remote missile, visual only)
    missileId        // missile ID from server
  );
}

// Step 7.4: Handle player elimination events from server
function handlePlayerEliminated(data) {
  const { shooterId, targetId, hitPosition } = data;
  
  console.log(`💀 Player elimination: ${targetId} eliminated by ${shooterId}`);
  
  // Player state will be updated via game state broadcast
  // The elimination is mainly for visual/audio feedback
}

// Step 7.4: Handle player respawn events from server
function handlePlayerRespawned(data) {
  const { playerId } = data;
  
  console.log(`✨ Player respawned: ${playerId}`);
  
  // Player state will be updated via game state broadcast
  // The respawn is mainly for visual/audio feedback
}

// Get game state receiving statistics
export function getGameStateStats() {
  return { ...gameStateStats };
}

// Step 5.4: Connection status callback management
export function addConnectionCallback(callback) {
  connectionCallbacks.push(callback);
}

export function addDisconnectionCallback(callback) {
  disconnectionCallbacks.push(callback);
}

export function removeConnectionCallback(callback) {
  const index = connectionCallbacks.indexOf(callback);
  if (index > -1) {
    connectionCallbacks.splice(index, 1);
  }
}

export function removeDisconnectionCallback(callback) {
  const index = disconnectionCallbacks.indexOf(callback);
  if (index > -1) {
    disconnectionCallbacks.splice(index, 1);
  }
}
