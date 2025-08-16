// Surr Game - Player Class
// Class-based player management for client-side with Three.js integration

import * as THREE from 'three';
import { addObjectToScene, removeObjectFromScene } from './Scene.js';

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
    this.maxSpeed = 15; // Maximum speed
    this.acceleration = 25; // Acceleration rate
    this.deceleration = 20; // Deceleration rate
    this.turnSpeed = 3.5; // Turning speed in radians per second
    
    // Movement state
    this.targetSpeed = 0; // Target speed for smooth acceleration
    this.direction = new THREE.Vector3(); // Movement direction vector
    
    // Game state properties
    this.score = 0;
    this.isAlive = true;
    this.weapon = null; // null or 'missile'
    
    // Step 5.3: Interpolation system for remote players
    this.interpolationBuffer = [];
    this.maxBufferSize = 5; // Keep last 5 position updates
    this.interpolationDelay = 100; // 100ms delay for smooth interpolation
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    this.lastUpdateTime = 0;
    
    // Three.js mesh object
    this.mesh = null;
    this.nameTag = null;
    
    // Initialize visual representation
    this.createMesh();
    this.createNameTag();
    
    console.log(`Player created: ${name} (${isLocal ? 'Local' : 'Remote'})`);
  }
  
  // Create basic cube geometry as placeholder kart
  createMesh() {
    // Create kart geometry - using box as placeholder for now
    const kartGeometry = new THREE.BoxGeometry(2, 1, 3);
    
    // Different colors for local vs remote players
    const kartMaterial = new THREE.MeshLambertMaterial({
      color: this.isLocal ? 0x4CAF50 : 0xFF5722, // Green for local, orange for remote
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
  }
  
  // Create name tag above player
  createNameTag() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    // Draw name tag
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText(this.name, canvas.width / 2, canvas.height / 2 + 8);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    this.nameTag = new THREE.Sprite(material);
    this.nameTag.scale.set(4, 1, 1);
    this.nameTag.position.copy(this.position);
    this.nameTag.position.y += 3; // Position above the kart
    
    addObjectToScene(this.nameTag);
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
        this.nameTag.position.y += 3;
      }
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
    this.position.y = 1;
    
    // Apply arena boundaries (100x100 arena)
    const boundary = 48; // Slightly smaller than arena size
    this.position.x = Math.max(-boundary, Math.min(boundary, this.position.x));
    this.position.z = Math.max(-boundary, Math.min(boundary, this.position.z));
    
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
    
    // Visual indication of weapon status (could add glow effect later)
    if (this.mesh) {
      const material = this.mesh.material;
      if (weapon === 'missile') {
        material.emissive.setHex(0x444444); // Slight glow when armed
      } else {
        material.emissive.setHex(0x000000); // No glow when unarmed
      }
    }
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
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
    
    if (this.nameTag) {
      removeObjectFromScene(this.nameTag);
      this.nameTag.material.map.dispose();
      this.nameTag.material.dispose();
      this.nameTag = null;
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
  createPlayer(id, name, position = { x: 0, y: 0, z: 0 }, isLocal = false) {
    const player = new Player(id, name, position, isLocal);
    this.players.set(id, player);
    
    if (isLocal) {
      this.localPlayer = player;
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
  syncWithGameState(gameState, localPlayerId = null) {
    if (!gameState || !gameState.players) {
      return;
    }

    const serverPlayerIds = new Set();

    // Update or create players from server data
    gameState.players.forEach(serverPlayer => {
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
        }
        existingPlayer.updateScore(serverPlayer.score);
        existingPlayer.updateWeapon(serverPlayer.weapon);
        existingPlayer.updateAliveStatus(serverPlayer.isAlive);
      } else {
        // Create new player
        const newPlayer = this.createPlayer(
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
    });

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