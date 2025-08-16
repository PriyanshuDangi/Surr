// Surr Game - Game Engine
// Function-based game controller that manages the game loop and coordination

import { initScene, updateScene, renderScene, disposeScene, getCamera } from './Scene.js';
import { initWebSocket, isSocketConnected } from '../network/SocketManager.js';
import { playerManager } from './Player.js';
import { initControls, getInputState, isMoving, disposeControls } from './Controls.js';
import Stats from 'stats.js';
import * as THREE from 'three';

// Game state
let canvas = null;
let isRunning = false;
let lastTime = 0;
let deltaTime = 0;
let stats = null;

// Camera follow state
let cameraOffset = new THREE.Vector3(0, 15, 20);
let cameraLookAtOffset = new THREE.Vector3(0, 0, 0);
let cameraFollowSpeed = 2.0;

// Initialize the game engine
export async function initGameEngine() {
  try {
    console.log('Initializing game engine...');
    
    // Get canvas element
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Setup Stats.js
    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.left = '0px';
    stats.dom.style.zIndex = '1001';
    document.body.appendChild(stats.dom);

    // Initialize scene
    initScene(canvas);

    // Initialize controls (Step 4.2)
    initControls();
    
    // Initialize websocket
    initWebSocket();
    
    // Create test local player to verify Player class functionality
    createTestPlayer();
    
    // Setup game loop
    setupGameLoop();
    
    console.log('Game engine initialization complete');
    return true;
  } catch (error) {
    console.error('Failed to initialize game engine:', error);
    return false;
  }
}

// Set up the main game loop
function setupGameLoop() {
  lastTime = performance.now();
  isRunning = true;
  
  gameLoop();
  console.log('Game loop started');
}

// Main game loop
function gameLoop(currentTime = performance.now()) {
  if (!isRunning) return;

  stats.begin();

  deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Process input (Step 4.2 integration)
  processInput(deltaTime);
  
  updateScene(deltaTime);
  renderScene();

  stats.end();
  requestAnimationFrame(gameLoop);
}

// Process input and update local player movement (Step 4.3)
function processInput(deltaTime) {
  const input = getInputState();
  const localPlayer = playerManager.getLocalPlayer();
  
  // Update local player movement if exists
  if (localPlayer) {
    localPlayer.updateMovement(input, deltaTime);
    
    // Update camera to follow local player
    updateCameraFollow(localPlayer, deltaTime);
    
    // Log movement state periodically for debugging
    if (isMoving() && localPlayer.speed > 0.1) {
      const now = performance.now();
      if (!processInput.lastLogTime || now - processInput.lastLogTime > 3000) {
        console.log('🚗 Player Movement:', {
          position: {
            x: localPlayer.position.x.toFixed(2),
            z: localPlayer.position.z.toFixed(2)
          },
          rotation: localPlayer.rotation.y.toFixed(2),
          speed: localPlayer.speed.toFixed(2)
        });
        processInput.lastLogTime = now;
      }
    }
  }
}
processInput.lastLogTime = 0;

// Update camera to follow local player (Step 4.3)
function updateCameraFollow(player, deltaTime) {
  const camera = getCamera();
  if (!camera) return;
  
  // Calculate target camera position behind and above the player
  const targetPosition = player.position.clone();
  const rotatedOffset = cameraOffset.clone();
  rotatedOffset.applyEuler(player.rotation);
  targetPosition.add(rotatedOffset);
  
  // Calculate target look-at position (slightly ahead of player)
  const targetLookAt = player.position.clone();
  const lookAtOffset = cameraLookAtOffset.clone();
  lookAtOffset.applyEuler(player.rotation);
  targetLookAt.add(lookAtOffset);
  
  // Smoothly interpolate camera position
  camera.position.lerp(targetPosition, cameraFollowSpeed * deltaTime);
  camera.lookAt(targetLookAt);
}

// Start the game engine
export function startGameEngine() {
  if (!isRunning) {
    console.log('Starting game engine...');
    setupGameLoop();
  }
}

// Stop the game engine
export function stopGameEngine() {
  console.log('Stopping game engine...');
  isRunning = false;
}

// Setup visibility change handling
export function setupVisibilityHandling() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('Pausing game engine...');
      isRunning = false;
    } else {
      console.log('Resuming game engine...');
      lastTime = performance.now();
      isRunning = true;
      gameLoop();
    }
  });
}

// Cleanup and dispose resources
export function disposeGameEngine() {
  console.log('Disposing game engine...');
  stopGameEngine();
  
  // Dispose controls (Step 4.2)
  disposeControls();
  
  // Dispose scene and stats
  disposeScene();

  if (stats && stats.dom && stats.dom.parentNode) {
    stats.dom.parentNode.removeChild(stats.dom);
  }
}

// Create test player for Step 4.1 verification
function createTestPlayer() {
  try {
    // Create a local test player at arena center
    const testPlayer = playerManager.createPlayer(
      'test-local-player',
      'TestPlayer',
      { x: 0, y: 1, z: 0 },
      true // isLocal = true
    );
    
    // Create a remote test player for comparison
    const remotePlayer = playerManager.createPlayer(
      'test-remote-player',
      'RemotePlayer',
      { x: 5, y: 1, z: 5 },
      false // isLocal = false
    );
    
    console.log('Test players created successfully');
    console.log('Local player (green cube):', testPlayer.name);
    console.log('Remote player (orange cube):', remotePlayer.name);
    
    return { testPlayer, remotePlayer };
  } catch (error) {
    console.error('Failed to create test players:', error);
    return null;
  }
}

// Get debug information
export function getDebugInfo() {
  const input = getInputState();
  return {
    deltaTime,
    isRunning,
    socketConnected: isSocketConnected(),
    playersCount: playerManager.getAllPlayers().length,
    localPlayer: playerManager.getLocalPlayer()?.name || 'None',
    inputState: {
      isMoving: isMoving(),
      activeInputs: Object.entries(input).filter(([key, value]) => value === true).map(([key]) => key)
    }
  };
}