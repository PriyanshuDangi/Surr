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
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    // Game state properties
    this.score = 0;
    this.isAlive = true;
    this.weapon = null; // null or 'missile'
    
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
    // Update internal position and rotation
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
  }
  
  // Update player score
  updateScore(score) {
    this.score = score;
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
      }
    };
  }
  
  // Cleanup method
  dispose() {
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
  
  // Update player score
  updatePlayerScore(id, score) {
    const player = this.players.get(id);
    if (player) {
      player.updateScore(score);
    }
  }
}

// Export singleton instance for global use
export const playerManager = new PlayerManager();