// Surr Game - Game Engine
// Function-based game controller that manages the game loop and coordination

import { initScene, updateScene, renderScene, disposeScene, getCamera } from './Scene.js';
import { initWebSocket, isSocketConnected, broadcastPlayerPosition, setGameStateCallback, addConnectionCallback, addDisconnectionCallback } from '../network/SocketManager.js';
import { playerManager } from './Player.js';
import { initControls, getInputState, isMoving, disposeControls } from './Controls.js';
import { initWelcomeScreen, updateConnectionStatus, hideWelcomeScreen, isWelcomeScreenShown, getPlayerName, getLocalPlayerId, handleDisconnection } from '../ui/WelcomeScreen.js';
import { initNotifications, showWelcomeNotification, showPlayerJoinedNotification, showPlayerLeftNotification, showConnectionNotification } from '../ui/Notifications.js';
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
    
    // Step 5.4: Initialize welcome screen
    initWelcomeScreen();
    
    // Step 5.4: Initialize notification system
    initNotifications();
    
    // Initialize websocket
    initWebSocket();
    
    // Step 5.4: Set up connection status callbacks
    addConnectionCallback(() => {
      updateConnectionStatus();
      showConnectionNotification('Connected to server', 'success');
    });
    addDisconnectionCallback((reason) => {
      handleDisconnection();
      showConnectionNotification(`Disconnected: ${reason}`, 'error');
    });
    
    // Step 5.2: Set up game state handler for multiplayer sync
    setGameStateCallback(handleGameStateUpdate);
    
    // Step 5.4: Set up player event callbacks for notifications
    playerManager.onPlayerJoined = showPlayerJoinedNotification;
    playerManager.onPlayerLeft = showPlayerLeftNotification;
    playerManager.onLocalPlayerJoined = showWelcomeNotification;
    
    // Don't create test player immediately - wait for user to join
    // createTestPlayer();
    
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
  
  // Step 5.3: Update interpolation for all remote players
  playerManager.updateInterpolation(deltaTime);
  
  updateScene(deltaTime);
  renderScene();

  stats.end();
  requestAnimationFrame(gameLoop);
}

// Process input and update local player movement (Step 4.3)
function processInput(deltaTime) {
  // Step 5.4: Don't process input if welcome screen is shown
  if (isWelcomeScreenShown()) {
    return;
  }
  
  const input = getInputState();
  const localPlayer = playerManager.getLocalPlayer();
  
  // Update local player movement if exists
  if (localPlayer) {
    localPlayer.updateMovement(input, deltaTime);
    
    // Update camera to follow local player
    updateCameraFollow(localPlayer, deltaTime);
    
    // Step 5.1: Optimized position broadcasting
    // Only broadcast when connected and there are meaningful changes
    if (isSocketConnected()) {
      const positionData = localPlayer.getPositionData();
      broadcastPlayerPosition(positionData);
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

// Step 5.2: Handle game state updates from server
function handleGameStateUpdate(gameState) {
  // Step 5.4: Sync players with local player ID for proper identification
  const localPlayerId = getLocalPlayerId();
  playerManager.syncWithGameState(gameState, localPlayerId);
}

// Step 5.4: Create local player when joining game
function createLocalPlayer() {
  const playerName = getPlayerName();
  if (playerName) {
    console.log('Creating local player:', playerName);
    const localPlayer = playerManager.createPlayer(
      'local-player', // This will be updated by server data
      playerName,
      { x: 0, y: 1, z: 0 },
      true // isLocal = true
    );
    console.log('Local player created:', localPlayer.name);
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
    
    // Note: Remote players will be created automatically when server sends game state
    // No need to create test remote player manually
    
    console.log('Test players created successfully');
    console.log('Local player (green cube):', testPlayer.name);
    console.log('Remote players will be created when server sends game state');
    
    return { testPlayer };
  } catch (error) {
    console.error('Failed to create test players:', error);
    return null;
  }
}

// Step 5.3: Export function for debugging interpolation in browser console
window.debugInterpolation = function() {
  const stats = playerManager.getInterpolationStats();
  console.log('📊 Interpolation Statistics:');
  console.table(stats);
  
  if (Object.keys(stats).length === 0) {
    console.log('No remote players found. Connect additional clients to test interpolation.');
  }
  
  return stats;
};