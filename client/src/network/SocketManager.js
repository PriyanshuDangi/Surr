// Surr Game - Socket Manager
// Simple function-based socket connection with retry

import { io } from 'socket.io-client';

let socket = null;
let isConnected = false;

// Position broadcasting state for optimization
let lastSentData = null;
let lastTimeSent = 0;
const THROTTLE_INTERVAL = 50; // 50ms minimum interval between sends

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
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    isConnected = false;
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
  console.log('broadcastPlayerPosition', playerData);
  
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
