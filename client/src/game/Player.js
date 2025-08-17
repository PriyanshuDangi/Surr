// Surr Game - Player Class
// Class-based player management for client-side with Three.js integration

import * as THREE from 'three';
import { addObjectToScene, removeObjectFromScene } from './Scene.js';
import { createMissile, generateMissileId } from './Missile.js';
import { modelLoader } from '../utils/ModelLoader.js';

/**
 * Car Model Configuration - Centralized settings for easy adjustment
 * 
 * This configuration object contains all car-related settings in one place.
 * Modify these values to customize the car behavior, appearance, and scale.
 * 
 * TIPS FOR ADJUSTMENT:
 * - If you change SCALE, also adjust WEAPON_POSITION and MISSILE_SPAWN_OFFSET proportionally
 * - NAME_TAG_HEIGHT should be roughly 2-3x the car's height for good visibility
 * - ARENA_BOUNDARY should be smaller than the actual arena size to prevent wall clipping
 * - Colors use hexadecimal format (0x...) for Three.js materials
 */
const CAR_CONFIG = {
  // Model settings
  MODEL_PATH: '/assets/glb/race.glb',
  SCALE: 2.5,
  ROTATION_Y: Math.PI, // 180 degrees rotation
  
  // Positioning
  GROUND_LEVEL: 0,
  NAME_TAG_HEIGHT: 5,
  ARENA_BOUNDARY: 48, // Arena boundary limit
  
  // Movement settings
  MAX_SPEED: 15,
  ACCELERATION: 25,
  DECELERATION: 20,
  TURN_SPEED: 3.5,
  
  // Weapon settings
  WEAPON_POSITION: { x: 0, y: 1.5, z: -3.0 },
  MISSILE_SPAWN_OFFSET: { x: 0, y: 1.5, z: -3.5 },
  
  // Colors
  LOCAL_PLAYER_COLOR: 0x4CAF50,  // Green
  REMOTE_PLAYER_COLOR: 0xFF5722, // Orange
  
  // Fallback box dimensions (if GLB fails to load)
  FALLBACK_BOX_SIZE: { width: 2, height: 1, depth: 3 },
  
  // Name tag settings
  NAME_TAG_SCALE: { x: 4, y: 1, z: 1 }
};

// Player class for client-side player management
export class Player {
  constructor(id, name, position = { x: 0, y: 0, z: 0 }, isLocal = false) {
    // Core player properties
    this.id = id;
    this.name = name;
    this.isLocal = isLocal;
    
    // Position and movement properties
    this.position = new THREE.Vector3(position.x, position.y, position.z);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.speed = 0; // Current movement speed as a number
     
    // Movement configuration
    this.maxSpeed = CAR_CONFIG.MAX_SPEED; // Maximum speed
    this.acceleration = CAR_CONFIG.ACCELERATION; // Acceleration rate
    this.deceleration = CAR_CONFIG.DECELERATION; // Deceleration rate
    this.turnSpeed = CAR_CONFIG.TURN_SPEED; // Turning speed in radians per second
    
    // Movement state
    this.targetSpeed = 0; // Target speed for smooth acceleration
    this.direction = new THREE.Vector3(); // Movement direction vector
    
    // Game state properties
    this.score = 0;
    this.isAlive = true;
    this.weapon = null; // null or 'missile'
    this.lastFiredTime = 0; // Track when player last fired to prevent server sync override
    
    // Step 5.3: Interpolation system for remote players
    this.interpolationBuffer = [];
    this.maxBufferSize = 5; // Keep last 5 position updates
    this.interpolationDelay = 100; // 100ms delay for smooth interpolation
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    this.lastUpdateTime = 0;
    
    // Three.js mesh objects
    this.mesh = null;
    this.nameTag = null;
    this.weaponMesh = null;
    this.carModel = null; // Store the loaded car model
    
    // Initialize visual representation
    // Note: createMesh() is now called asynchronously in PlayerManager.createPlayer()
    this.createNameTag();
    
    console.log(`Player created: ${name} (${isLocal ? 'Local' : 'Remote'})`);
  }
  
  // Create car mesh from GLB model
  async createMesh() {
    try {
      console.log(`🚗 Loading car model for player: ${this.name}`);
      
      // Load the race car model
      const carModel = await modelLoader.loadModel(CAR_CONFIG.MODEL_PATH);
      this.carModel = carModel;
      
      // Create a container group for the car
      this.mesh = new THREE.Group();
      this.mesh.add(carModel.scene);
      
      // Set appropriate scale for the car model
      modelLoader.setModelScale(carModel, CAR_CONFIG.SCALE);
      
      // Set color based on player type
      const carColor = this.isLocal ? CAR_CONFIG.LOCAL_PLAYER_COLOR : CAR_CONFIG.REMOTE_PLAYER_COLOR;
      modelLoader.setModelColor(carModel, carColor);
      
      // Rotate the model if needed (some GLB models face different directions)
      carModel.scene.rotation.y = CAR_CONFIG.ROTATION_Y;
      
      // Calculate bounding box to position car properly on ground
      const box = new THREE.Box3().setFromObject(carModel.scene);
      const boxSize = box.getSize(new THREE.Vector3());
      const boxCenter = box.getCenter(new THREE.Vector3());
      
      // Adjust car position so bottom touches ground (y=0)
      // Move the car up by half its height minus the center offset
      carModel.scene.position.y = -box.min.y;
      
      console.log(`🚗 Car bounding box - Size: ${boxSize.x.toFixed(2)} x ${boxSize.y.toFixed(2)} x ${boxSize.z.toFixed(2)}`);
      console.log(`🚗 Car position adjustment: y = ${(-box.min.y).toFixed(2)}`);
      
      // Position and rotation
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
      
      // Enable shadows for the entire model
      this.mesh.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Store reference to this player instance on the mesh for collision detection
      this.mesh.userData.player = this;
      
      // Add to scene
      addObjectToScene(this.mesh);
      
      console.log(`✅ Car model loaded successfully for player: ${this.name}`);
      
    } catch (error) {
      console.error(`Failed to load car model for player ${this.name}, falling back to box geometry:`, error);
      
      // Fallback to box geometry if model loading fails
      this.createFallbackMesh();
    }
  }
  
  // Fallback mesh creation with box geometry
  createFallbackMesh() {
    // Create kart geometry - using box as fallback
    const kartGeometry = new THREE.BoxGeometry(
      CAR_CONFIG.FALLBACK_BOX_SIZE.width,
      CAR_CONFIG.FALLBACK_BOX_SIZE.height,
      CAR_CONFIG.FALLBACK_BOX_SIZE.depth
    );
    
    // Different colors for local vs remote players
    const kartMaterial = new THREE.MeshLambertMaterial({
      color: this.isLocal ? CAR_CONFIG.LOCAL_PLAYER_COLOR : CAR_CONFIG.REMOTE_PLAYER_COLOR,
      transparent: false
    });
    
    this.mesh = new THREE.Mesh(kartGeometry, kartMaterial);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Store reference to this player instance on the mesh for collision detection
    this.mesh.userData.player = this;
    
    // Add to scene
    addObjectToScene(this.mesh);
    
    console.log(`Fallback box mesh created for player: ${this.name}`);
  }
  
  // Create name tag above player
  createNameTag() {
    this.updateNameTagTexture();
  }
  
  // Update name tag texture 
  updateNameTagTexture() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    context.strokeStyle = this.isLocal ? '#4CAF50' : '#FF5722';
    context.lineWidth = 2;
    context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    // Draw player name
    context.fillStyle = 'white';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText(this.name, canvas.width / 2, canvas.height / 2 + 8);
    
    // Create or update texture
    if (this.nameTag) {
      // Update existing texture
      const texture = new THREE.CanvasTexture(canvas);
      this.nameTag.material.map = texture;
      this.nameTag.material.needsUpdate = true;
    } else {
      // Create new name tag
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      this.nameTag = new THREE.Sprite(material);
      this.nameTag.scale.set(
        CAR_CONFIG.NAME_TAG_SCALE.x,
        CAR_CONFIG.NAME_TAG_SCALE.y,
        CAR_CONFIG.NAME_TAG_SCALE.z
      );
      this.nameTag.position.copy(this.position);
      this.nameTag.position.y += CAR_CONFIG.NAME_TAG_HEIGHT; // Position above the car
      
      addObjectToScene(this.nameTag);
    }
  }
  
  // Update player position in scene
  updatePosition(position, rotation) {
    if (this.isLocal) {
      // Local player: direct update (no interpolation needed)
      this.position.set(position.x, position.y, position.z);
      this.rotation.set(rotation.x, rotation.y, rotation.z);
      
      // Update mesh position and rotation
      if (this.mesh) {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
      }
      
      // Update name tag position
      if (this.nameTag) {
        this.nameTag.position.copy(this.position);
        this.nameTag.position.y += CAR_CONFIG.NAME_TAG_HEIGHT;
      }
      
      // Update weapon position
      this.updateWeaponPosition();
    } else {
      // Remote player: add to interpolation buffer
      this.addPositionToBuffer(position, rotation);
    }
  }
  
  // Step 5.3: Add position update to interpolation buffer for remote players
  addPositionToBuffer(position, rotation) {
    const currentTime = performance.now();
    
    // Create position update entry
    const update = {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
      timestamp: currentTime
    };
    
    // Add to buffer
    this.interpolationBuffer.push(update);
    this.lastUpdateTime = currentTime;
    
    // Keep buffer size manageable
    if (this.interpolationBuffer.length > this.maxBufferSize) {
      this.interpolationBuffer.shift(); // Remove oldest entry
    }
    
    // Handle large position jumps (teleportation detection)
    if (this.interpolationBuffer.length >= 2) {
      const latest = this.interpolationBuffer[this.interpolationBuffer.length - 1];
      const previous = this.interpolationBuffer[this.interpolationBuffer.length - 2];
      
      const distance = Math.sqrt(
        Math.pow(latest.position.x - previous.position.x, 2) +
        Math.pow(latest.position.y - previous.position.y, 2) +
        Math.pow(latest.position.z - previous.position.z, 2)
      );
      
      // If player teleported (distance > 20 units), clear buffer and snap to new position
      if (distance > 20) {
        console.log(`Player ${this.name} teleported (distance: ${distance.toFixed(2)}), snapping to new position`);
        this.interpolationBuffer = [update];
        this.snapToPosition(latest);
      }
    }
  }
  
  // Step 5.3: Snap player to a specific position (for teleportation cases)
  snapToPosition(update) {
    this.position.set(update.position.x, update.position.y, update.position.z);
    this.rotation.set(update.rotation.x, update.rotation.y, update.rotation.z);
    
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
    }
    
    if (this.nameTag) {
      this.nameTag.position.copy(this.position);
      this.nameTag.position.y += 3;
    }
  }
  
  // Step 5.3: Update interpolated position for remote players
  updateInterpolation(deltaTime) {
    // Only interpolate for remote players
    if (this.isLocal || this.interpolationBuffer.length < 2) {
      return;
    }
    
    const currentTime = performance.now();
    const renderTime = currentTime - this.interpolationDelay;
    
    // Find the two position updates to interpolate between
    let fromUpdate = null;
    let toUpdate = null;
    
    for (let i = 0; i < this.interpolationBuffer.length - 1; i++) {
      if (this.interpolationBuffer[i].timestamp <= renderTime && 
          this.interpolationBuffer[i + 1].timestamp >= renderTime) {
        fromUpdate = this.interpolationBuffer[i];
        toUpdate = this.interpolationBuffer[i + 1];
        break;
      }
    }
    
    // Fallback: use the two most recent updates
    if (!fromUpdate || !toUpdate) {
      if (this.interpolationBuffer.length >= 2) {
        fromUpdate = this.interpolationBuffer[this.interpolationBuffer.length - 2];
        toUpdate = this.interpolationBuffer[this.interpolationBuffer.length - 1];
      } else {
        return;
      }
    }
    
    // Calculate interpolation factor
    const timeDiff = toUpdate.timestamp - fromUpdate.timestamp;
    const factor = timeDiff > 0 ? Math.min(1, (renderTime - fromUpdate.timestamp) / timeDiff) : 1;
    
    // Interpolate position
    this.position.x = fromUpdate.position.x + (toUpdate.position.x - fromUpdate.position.x) * factor;
    this.position.y = fromUpdate.position.y + (toUpdate.position.y - fromUpdate.position.y) * factor;
    this.position.z = fromUpdate.position.z + (toUpdate.position.z - fromUpdate.position.z) * factor;
    
    // Interpolate rotation (simple linear interpolation for euler angles)
    this.rotation.x = fromUpdate.rotation.x + (toUpdate.rotation.x - fromUpdate.rotation.x) * factor;
    this.rotation.y = fromUpdate.rotation.y + (toUpdate.rotation.y - fromUpdate.rotation.y) * factor;
    this.rotation.z = fromUpdate.rotation.z + (toUpdate.rotation.z - fromUpdate.rotation.z) * factor;
    
    // Update mesh position and rotation
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
    }
    
    // Update name tag position
    if (this.nameTag) {
      this.nameTag.position.copy(this.position);
      this.nameTag.position.y += 3;
    }
    
    // Update weapon position
    this.updateWeaponPosition();
    
    // Clean up old buffer entries
    this.cleanupInterpolationBuffer(renderTime);
  }
  
  // Step 5.3: Clean up old entries from interpolation buffer
  cleanupInterpolationBuffer(renderTime) {
    // Remove entries older than 1 second from render time
    const cutoffTime = renderTime - 1000;
    
    while (this.interpolationBuffer.length > 1 && 
           this.interpolationBuffer[0].timestamp < cutoffTime) {
      this.interpolationBuffer.shift();
    }
  }
  
  // Update player score
  updateScore(score) {
    this.score = score;
  }
  
  // Update player speed
  updateSpeed(speed) {
    this.speed = speed;
  }
  
  // Update player movement based on input (Step 4.3)
  updateMovement(inputState, deltaTime) {
    if (!this.isLocal || !this.isAlive) return;
    
    // Handle turning
    let turnDirection = 0;
    if (inputState.left) turnDirection += 1;  // Turn left (positive rotation)
    if (inputState.right) turnDirection -= 1; // Turn right (negative rotation)
    
    // Apply turning
    this.rotation.y += turnDirection * this.turnSpeed * deltaTime;
    
    // Handle forward/backward movement
    let moveDirection = 0;
    if (inputState.forward) moveDirection = 1;
    if (inputState.backward) moveDirection = -0.6; // Slower reverse
    
    // Set target speed based on input
    this.targetSpeed = moveDirection * this.maxSpeed;
    
    // Smooth acceleration/deceleration
    const speedDiff = this.targetSpeed - this.speed;
    const rate = speedDiff > 0 ? this.acceleration : this.deceleration;
    this.speed += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), rate * deltaTime);
    
    // Calculate movement direction based on rotation
    this.direction.set(0, 0, -1); // Forward direction
    this.direction.applyEuler(this.rotation);
    this.direction.normalize();
    
    // Apply movement
    const movement = this.direction.clone().multiplyScalar(this.speed * deltaTime);
    this.position.add(movement);
    
    // Keep player on ground level
    this.position.y = CAR_CONFIG.GROUND_LEVEL;
    
    // Apply arena boundaries
    this.position.x = Math.max(-CAR_CONFIG.ARENA_BOUNDARY, Math.min(CAR_CONFIG.ARENA_BOUNDARY, this.position.x));
    this.position.z = Math.max(-CAR_CONFIG.ARENA_BOUNDARY, Math.min(CAR_CONFIG.ARENA_BOUNDARY, this.position.z));
    
    // Update mesh position and rotation
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
    }
    
    // Update name tag position
    if (this.nameTag) {
      this.nameTag.position.copy(this.position);
      this.nameTag.position.y += 3;
    }
  }
  
  // Update weapon state
  updateWeapon(weapon) {
    this.weapon = weapon;
    
    // Visual indication of weapon status
    if (this.mesh) {
      const material = this.mesh.material;
      if (weapon === 'missile') {
        material?.emissive.setHex(0x444444); // Slight glow when armed
        this.createWeaponVisual(); // Create or show weapon visual
      } else {
        material?.emissive.setHex(0x000000); // No glow when unarmed
        this.hideWeaponVisual(); // Hide weapon visual instead of removing
      }
    }
  }
  
  // Create visual weapon in front of player
  createWeaponVisual() {
    if (this.weapon === 'missile') {
      if (!this.weaponMesh) {
        // Create missile visual only if it doesn't exist
        const missileGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
        const missileMaterial = new THREE.MeshLambertMaterial({
          color: 0xff0000,
          emissive: 0x220000
        });
        
        this.weaponMesh = new THREE.Mesh(missileGeometry, missileMaterial);
        
        // Position weapon relative to car (local coordinates)
        this.weaponMesh.position.set(
          CAR_CONFIG.WEAPON_POSITION.x,
          CAR_CONFIG.WEAPON_POSITION.y,
          CAR_CONFIG.WEAPON_POSITION.z
        );
        this.weaponMesh.rotation.x = Math.PI / 2; // Point forward horizontally
        
        // Make weapon a child of the car mesh so it moves with it automatically
        this.mesh.add(this.weaponMesh);
      } else {
        // Show existing weapon mesh
        this.weaponMesh.visible = true;
      }
    }
  }
  
  // Hide weapon visual instead of removing it
  hideWeaponVisual() {
    if (this.weaponMesh) {
      this.weaponMesh.visible = false;
    }
  }
  
  // Update weapon position relative to player (no longer needed - weapon is child of car)
  updateWeaponPosition() {
    // Weapon is now a child of the car mesh, so it moves automatically
    // No manual position updates needed
  }
  
  // Step 7.2: Fire missile (only for local player)
  fireMissile() {
    if (!this.isLocal) {
      console.log('Only local player can fire missiles');
      return null;
    }
    
    if (this.weapon !== 'missile') {
      console.log('Player does not have a missile to fire');
      return null;
    }
    
    // Calculate missile spawn position (in front of car)
    const spawnOffset = new THREE.Vector3(
      CAR_CONFIG.MISSILE_SPAWN_OFFSET.x,
      CAR_CONFIG.MISSILE_SPAWN_OFFSET.y,
      CAR_CONFIG.MISSILE_SPAWN_OFFSET.z
    );
    const worldSpawnOffset = spawnOffset.clone();
    worldSpawnOffset.applyEuler(this.rotation);
    
    const missilePosition = this.position.clone().add(worldSpawnOffset);
    
    // Calculate missile direction (forward direction of car)
    const missileDirection = new THREE.Vector3(0, 0, -1); // Forward in local space
    missileDirection.applyEuler(this.rotation);
    
    // Generate unique missile ID
    const missileId = generateMissileId(this.id);
    
    // Create local missile
    const missile = createMissile(
      this.id,           // shooter ID
      missilePosition,   // spawn position
      missileDirection,  // direction
      true,             // isLocal = true
      missileId         // missile ID
    );
    
    // Remove weapon from player
    this.lastFiredTime = Date.now();
    this.updateWeapon(null);
    
    console.log(`🚀 Player ${this.name} fired missile ${missileId}`);
    
    return {
      missileId: missileId,
      position: missilePosition,
      direction: missileDirection,
      shooterId: this.id
    };
  }
  
  // Update alive status
  updateAliveStatus(isAlive) {
    this.isAlive = isAlive;
    
    // Visual indication of elimination
    if (this.mesh) {
      this.mesh.visible = isAlive;
    }
    if (this.nameTag) {
      this.nameTag.visible = isAlive;
    }
  }
  
  // Get current position data for network sync
  getPositionData() {
    return {
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      rotation: {
        x: this.rotation.x,
        y: this.rotation.y,
        z: this.rotation.z
      },
      speed: this.speed,
      weapon: this.weapon,
      isAlive: this.isAlive
    };
  }
  
  // Step 5.3: Handle disconnection gracefully for interpolation
  handleDisconnection() {
    // Clear interpolation buffer when player disconnects
    this.interpolationBuffer = [];
    this.lastUpdateTime = 0;
    console.log(`Player ${this.name} disconnected, cleared interpolation buffer`);
  }
  
  // Cleanup method
  dispose() {
    // Clear interpolation data
    this.handleDisconnection();
    
    if (this.mesh) {
      removeObjectFromScene(this.mesh);
      
      // Dispose of car model resources if it's a loaded GLB model
      if (this.carModel) {
        this.mesh.traverse((node) => {
          if (node.isMesh) {
            if (node.geometry) {
              node.geometry.dispose();
            }
            if (node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach(mat => mat.dispose());
              } else {
                node.material.dispose();
              }
            }
          }
        });
        this.carModel = null;
      } else {
        // Dispose of fallback box geometry
        if (this.mesh.geometry) {
          this.mesh.geometry.dispose();
        }
        if (this.mesh.material) {
          this.mesh.material.dispose();
        }
      }
      
      this.mesh = null;
    }
    
    if (this.nameTag) {
      removeObjectFromScene(this.nameTag);
      this.nameTag.material.map.dispose();
      this.nameTag.material.dispose();
      this.nameTag = null;
    }
    
    if (this.weaponMesh) {
      // Properly dispose of weapon mesh resources
      if (this.weaponMesh.geometry) {
        this.weaponMesh.geometry.dispose();
      }
      if (this.weaponMesh.material) {
        this.weaponMesh.material.dispose();
      }
      // Weapon is child of car mesh, so it will be removed with the car
      this.weaponMesh = null;
    }
    
    console.log(`Player disposed: ${this.name}`);
  }
}

// Player manager for handling multiple players
export class PlayerManager {
  constructor() {
    this.players = new Map();
    this.localPlayer = null;
  }
  
  // Create a new player
  async createPlayer(id, name, position = { x: 0, y: 0, z: 0 }, isLocal = false) {
    const player = new Player(id, name, position, isLocal);
    this.players.set(id, player);
    
    if (isLocal) {
      this.localPlayer = player;
    }
    
    // Wait for the mesh to be created (async model loading)
    try {
      await player.createMesh();
      console.log(`Player mesh created successfully: ${name}`);
    } catch (error) {
      console.error(`Failed to create player mesh for ${name}:`, error);
      // Player will already have fallback mesh from createMesh error handling
    }
    
    return player;
  }
  
  // Get player by ID
  getPlayer(id) {
    return this.players.get(id);
  }
  
  // Get local player
  getLocalPlayer() {
    return this.localPlayer;
  }
  
  // Get all players
  getAllPlayers() {
    return Array.from(this.players.values());
  }
  
  // Remove player
  removePlayer(id) {
    const player = this.players.get(id);
    if (player) {
      player.dispose();
      this.players.delete(id);
      
      if (player === this.localPlayer) {
        this.localPlayer = null;
      }
    }
  }
  
  // Clear all players
  clearAllPlayers() {
    this.players.forEach(player => player.dispose());
    this.players.clear();
    this.localPlayer = null;
  }
  
  // Update player position (for network sync)
  updatePlayerPosition(id, position, rotation) {
    const player = this.players.get(id);
    if (player) {
      player.updatePosition(position, rotation);
    }
  }
  
  // Step 5.3: Update interpolation for all remote players
  updateInterpolation(deltaTime) {
    this.players.forEach(player => {
      if (!player.isLocal) {
        player.updateInterpolation(deltaTime);
      }
    });
  }
  
  // Step 5.3: Get interpolation statistics for debugging
  getInterpolationStats() {
    const stats = {};
    this.players.forEach((player, id) => {
      if (!player.isLocal) {
        stats[id] = {
          name: player.name,
          bufferSize: player.interpolationBuffer.length,
          lastUpdateTime: player.lastUpdateTime,
          timeSinceLastUpdate: performance.now() - player.lastUpdateTime
        };
      }
    });
    return stats;
  }
  
  // Update player score
  updatePlayerScore(id, score) {
    const player = this.players.get(id);
    if (player) {
      player.updateScore(score);
    }
  }

  // Step 5.2: Sync players with server game state
  async syncWithGameState(gameState, localPlayerId = null) {
    if (!gameState || !gameState.players) {
      return;
    }

    const serverPlayerIds = new Set();

    // Update or create players from server data
    for (const serverPlayer of gameState.players) {
      serverPlayerIds.add(serverPlayer.id);
      
      const existingPlayer = this.players.get(serverPlayer.id);
      
      // Step 5.4: Determine if this is the local player
      const isLocalPlayer = localPlayerId ? serverPlayer.id === localPlayerId : 
                           (this.localPlayer && serverPlayer.id === this.localPlayer.id);
      
      if (existingPlayer) {
        // Update existing player
        if (!isLocalPlayer) {
          // Only update position for remote players (local player is managed by client input)
          existingPlayer.updatePosition(serverPlayer.position, serverPlayer.rotation);
          // Update weapon state for remote players
          existingPlayer.updateWeapon(serverPlayer.weapon);
        } else {
          // For local player, only update weapon if server state is authoritative
          // (like when collecting weapons or respawning)
          const timeSinceFired = Date.now() - existingPlayer.lastFiredTime;
          const recentlyFired = timeSinceFired < 1000; // 1 second protection after firing
          
          if (serverPlayer.weapon !== existingPlayer.weapon) {
            // Only update if server says we should have a weapon but we don't,
            // or if server says we shouldn't have a weapon and we're dead/respawning
            // BUT don't override if we recently fired a missile
            if ((serverPlayer.weapon === 'missile' && !recentlyFired) || !serverPlayer.isAlive) {
              existingPlayer.updateWeapon(serverPlayer.weapon);
            }
          }
        }
        existingPlayer.updateScore(serverPlayer.score);
        existingPlayer.updateAliveStatus(serverPlayer.isAlive);
      } else {
        // Create new player
        const newPlayer = await this.createPlayer(
          serverPlayer.id,
          serverPlayer.name,
          serverPlayer.position,
          isLocalPlayer
        );
        
        if (isLocalPlayer) {
          console.log(`✨ Local player joined: ${serverPlayer.name}`);
          this.localPlayer = newPlayer;
          // Trigger welcome notification through callback
          if (this.onLocalPlayerJoined) {
            this.onLocalPlayerJoined(serverPlayer.name);
          }
        } else {
          console.log(`✨ Remote player joined: ${serverPlayer.name}`);
          // Trigger join notification through callback
          if (this.onPlayerJoined) {
            this.onPlayerJoined(serverPlayer.name);
          }
        }
      }
    }

    // Remove players that are no longer on server (disconnected)
    const playersToRemove = [];
    this.players.forEach((player, id) => {
      if (!serverPlayerIds.has(id)) {
        playersToRemove.push(id);
      }
    });

    playersToRemove.forEach(id => {
      const player = this.players.get(id);
      const isLocal = player === this.localPlayer;
      console.log(`👋 ${isLocal ? 'Local' : 'Remote'} player left: ${player ? player.name : id}`);
      
      // Trigger leave notification through callback
      if (player && !isLocal && this.onPlayerLeft) {
        this.onPlayerLeft(player.name);
      }
      
      // Handle disconnection before removal (Step 5.3)
      if (player && !player.isLocal) {
        player.handleDisconnection();
      }
      
      this.removePlayer(id);
    });
  }
}

// Export singleton instance for global use
export const playerManager = new PlayerManager();

// Export car configuration for use in other modules
export { CAR_CONFIG };

/**
 * Helper function to create a scaled version of the car configuration
 * Useful when you want to experiment with different car sizes
 * 
 * @param {number} newScale - The new scale factor for the car
 * @returns {object} A new configuration object with scaled values
 * 
 * Example:
 * const smallCarConfig = createScaledCarConfig(1.5);
 * const bigCarConfig = createScaledCarConfig(3.0);
 */
export function createScaledCarConfig(newScale) {
  const scaleFactor = newScale / CAR_CONFIG.SCALE;
  
  return {
    ...CAR_CONFIG,
    SCALE: newScale,
    NAME_TAG_HEIGHT: CAR_CONFIG.NAME_TAG_HEIGHT * scaleFactor,
    WEAPON_POSITION: {
      x: CAR_CONFIG.WEAPON_POSITION.x * scaleFactor,
      y: CAR_CONFIG.WEAPON_POSITION.y * scaleFactor,
      z: CAR_CONFIG.WEAPON_POSITION.z * scaleFactor
    },
    MISSILE_SPAWN_OFFSET: {
      x: CAR_CONFIG.MISSILE_SPAWN_OFFSET.x * scaleFactor,
      y: CAR_CONFIG.MISSILE_SPAWN_OFFSET.y * scaleFactor,
      z: CAR_CONFIG.MISSILE_SPAWN_OFFSET.z * scaleFactor
    }
  };
}