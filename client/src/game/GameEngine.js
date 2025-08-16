// Surr Game - Game Engine
// Function-based game controller that manages the game loop and coordination

import { initScene, updateScene, renderScene, disposeScene, getCamera } from './Scene.js';
import { initWebSocket, isSocketConnected, broadcastPlayerPosition, setGameStateCallback, addConnectionCallback, addDisconnectionCallback, sendWeaponPickupCollection, sendMissileFire, sendMissileHit, setEliminationCallback, setRespawnCallback } from '../network/SocketManager.js';
import { playerManager } from './Player.js';
import { initControls, getInputState, isMoving, disposeControls } from './Controls.js';
import { initWelcomeScreen, updateConnectionStatus, hideWelcomeScreen, isWelcomeScreenShown, getPlayerName, getLocalPlayerId, handleDisconnection } from '../ui/WelcomeScreen.js';
import { initNotifications, showWelcomeNotification, showPlayerJoinedNotification, showPlayerLeftNotification, showConnectionNotification, showEliminationNotification, showKillNotification, showDeathNotification } from '../ui/Notifications.js';
import { initWeaponPickups, updateWeaponPickups, animateWeaponPickups, disposeWeaponPickups, checkWeaponPickupCollisions, attemptLocalPickupCollection } from './WeaponPickups.js';
import { initMissileSystem, updateMissiles, disposeMissileSystem, setMissileHitCallback } from './Missile.js';
import { initRespawnTimer, showRespawnTimer, hideRespawnTimer, disposeRespawnTimer } from '../ui/RespawnTimer.js';
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
    
    // Step 6.2: Initialize weapon pickup visualization system
    initWeaponPickups();
    
    // Step 7.1: Initialize missile system
    initMissileSystem();
    
    // Step 8.3: Initialize respawn timer system
    initRespawnTimer();
    
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
    
    // Step 8.3: Set up elimination and respawn callbacks
    setEliminationCallback(handlePlayerElimination);
    setRespawnCallback(handlePlayerRespawn);
    
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
  
  // Step 6.2: Animate weapon pickups
  animateWeaponPickups(deltaTime);
  
  // Step 7.1: Update missiles
  updateMissiles(deltaTime);
  
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
    
    // Step 6.3: Check for weapon pickup collisions (local player only)
    checkWeaponPickupCollision(localPlayer);
    
    // Step 7.2: Handle missile firing
    handleMissileFiring(localPlayer, input);
    
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

// Step 6.3: Weapon pickup collection state to prevent spam
let lastCollectedPickupId = null;
let lastCollectionTime = 0;
const COLLECTION_COOLDOWN = 500; // 500ms cooldown between collections

// Step 7.2: Missile firing state to prevent spam
let lastFireTime = 0;
const FIRE_COOLDOWN = 300; // 300ms cooldown between shots

// Step 6.3: Check for weapon pickup collision (local player only)
function checkWeaponPickupCollision(localPlayer) {
  // Only check collisions if connected to server
  if (!isSocketConnected()) {
    return;
  }
  
  // Check for collision with available weapon pickups
  const collisionData = checkWeaponPickupCollisions(localPlayer);
  
  if (collisionData) {
    const { pickupId } = collisionData;
    const currentTime = Date.now();
    
    // Prevent spam collection - only allow one collection per pickup with cooldown
    if (pickupId === lastCollectedPickupId && currentTime - lastCollectionTime < COLLECTION_COOLDOWN) {
      return;
    }
    
    // Attempt local collection for immediate responsive feedback
    const localSuccess = attemptLocalPickupCollection(collisionData);
    
    if (localSuccess) {
      // Update collection tracking
      lastCollectedPickupId = pickupId;
      lastCollectionTime = currentTime;
      
      // Send collection request to server for validation
      const serverSuccess = sendWeaponPickupCollection(pickupId);
      
      if (!serverSuccess) {
        console.log(`Failed to send pickup collection request to server for pickup ${pickupId}`);
        // Pickup will be restored by game state sync if server didn't receive the request
      }
    }
  }
}

// Step 7.2: Handle missile firing input
function handleMissileFiring(localPlayer, input) {
  // Only process firing if connected to server
  if (!isSocketConnected()) {
    return;
  }
  
  // Check if spacebar is pressed
  if (input.shoot) {
    const currentTime = Date.now();
    
    // Prevent spam firing with cooldown
    if (currentTime - lastFireTime < FIRE_COOLDOWN) {
      return;
    }
    
    // Attempt to fire missile
    const missileData = localPlayer.fireMissile();
    
    if (missileData) {
      // Update fire tracking
      lastFireTime = currentTime;
      
      // Set up hit callback for this local missile (Step 7.3)
      setMissileHitCallback(missileData.missileId, (hitResult) => {
        handleMissileHit(hitResult);
      });
      
      // Send missile fire event to server for broadcasting
      const serverSuccess = sendMissileFire(missileData);
      
      if (!serverSuccess) {
        console.log(`Failed to send missile fire event to server for missile ${missileData.missileId}`);
      }
    }
  }
}

// Step 7.4: Handle missile hit and report to server
function handleMissileHit(hitResult) {
  console.log(`🎯 Missile hit detected:`, hitResult);
  console.log(`💥 Player ${hitResult.playerName} hit by missile ${hitResult.missileId} from player ${hitResult.shooterId}`);
  
  // Send hit report to server for elimination processing
  const serverSuccess = sendMissileHit(hitResult);
  
  if (!serverSuccess) {
    console.log(`Failed to send missile hit report to server for missile ${hitResult.missileId}`);
  }
}

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
  
  // Dispose weapon pickups (Step 6.2)
  disposeWeaponPickups();
  
  // Dispose missile system (Step 7.1)
  disposeMissileSystem();
  
  // Dispose respawn timer (Step 8.3)
  disposeRespawnTimer();
  
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
  
  // Step 6.2: Update weapon pickups from server data
  if (gameState.weaponBoxes) {
    updateWeaponPickups(gameState.weaponBoxes);
  }
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

// Step 8.3: Handle player elimination events
function handlePlayerElimination(data) {
  const { shooterId, targetId, hitPosition } = data;
  const localPlayerId = getLocalPlayerId();
  
  // Get player names for better UX
  const shooter = playerManager.getPlayer(shooterId);
  const target = playerManager.getPlayer(targetId);
  
  const shooterName = shooter ? shooter.name : 'Unknown';
  const targetName = target ? target.name : 'Unknown';
  
  console.log(`💀 Elimination: ${targetName} eliminated by ${shooterName}`);
  
  // Step 8.4: Show appropriate notifications based on local player involvement
  const isLocalPlayerInvolved = (targetId === localPlayerId) || (shooterId === localPlayerId);
  
  if (targetId === localPlayerId) {
    // Local player was eliminated
    showRespawnTimer(shooterName, 5000);
    showDeathNotification(shooterName);
    console.log('💀 You were eliminated! Showing respawn timer...');
  } else if (shooterId === localPlayerId) {
    // Local player got a kill
    showKillNotification(targetName);
    console.log(`🎯 You eliminated ${targetName}!`);
  } else {
    // Show general elimination notification
    showEliminationNotification(shooterName, targetName, false);
  }
  
  // TODO: Add explosion effects at hit position
  // TODO: Add screen shake for local player if affected
}

// Step 8.3: Handle player respawn events
function handlePlayerRespawn(data) {
  const { playerId, spawnPosition } = data;
  const localPlayerId = getLocalPlayerId();
  
  // Hide respawn timer if local player respawned
  if (playerId === localPlayerId) {
    hideRespawnTimer();
    console.log('✨ You have respawned!');
  }
  
  const player = playerManager.getPlayer(playerId);
  const playerName = player ? player.name : 'Unknown';
  
  console.log(`✨ Player respawned: ${playerName} at position (${spawnPosition.x}, ${spawnPosition.z})`);
  
  // TODO: Add respawn effects (particles, flash, etc.)
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