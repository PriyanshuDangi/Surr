// Surr Game - Missile Class
// Function-based missile management for client-side projectiles

import * as THREE from 'three';
import { addObjectToScene, removeObjectFromScene } from './Scene.js';
import { playerManager } from './Player.js';

// Missile state management
let missiles = new Map();
let nextMissileId = 1;

// Missile configuration
const MISSILE_SPEED = 25; // units per second
const MISSILE_LIFETIME = 5000; // 5 seconds in milliseconds
const MISSILE_LENGTH = 1.5;
const MISSILE_RADIUS = 0.1;

// Initialize missile system
export function initMissileSystem() {
  missiles.clear();
  nextMissileId = 1;
  console.log('Missile system initialized');
}

// Create a new missile
export function createMissile(shooterId, position, direction, isLocal = false, missileId = null) {
  // Generate missile ID if not provided (for local missiles)
  const id = missileId || `${shooterId}_${nextMissileId++}`;
  
  const missile = {
    id: id,
    shooterId: shooterId,
    position: new THREE.Vector3(position.x, position.y, position.z),
    direction: new THREE.Vector3(direction.x, direction.y, direction.z).normalize(),
    velocity: new THREE.Vector3().copy(direction).normalize().multiplyScalar(MISSILE_SPEED),
    isLocal: isLocal, // Only local missiles perform hit detection
    createdAt: Date.now(),
    mesh: null,
    isActive: true
  };
  
  // Create visual representation
  missile.mesh = createMissileVisual(missile);
  
  // Add to active missiles
  missiles.set(id, missile);
  
  console.log(`🚀 Created ${isLocal ? 'local' : 'remote'} missile ${id} from player ${shooterId}`);
  return missile;
}

// Create visual missile mesh
function createMissileVisual(missile) {
  // Create missile geometry (cylinder pointing forward)
  const missileGeometry = new THREE.CylinderGeometry(
    MISSILE_RADIUS * 0.7, // tip radius (smaller)
    MISSILE_RADIUS,       // base radius
    MISSILE_LENGTH,       // length
    8                     // segments
  );
  
  // Create missile material
  const missileMaterial = new THREE.MeshLambertMaterial({
    color: missile.isLocal ? 0xff4444 : 0xff8888, // Slightly different color for local vs remote
    emissive: missile.isLocal ? 0x220000 : 0x110000
  });
  
  const missileMesh = new THREE.Mesh(missileGeometry, missileMaterial);
  
  // Position missile
  missileMesh.position.copy(missile.position);
  
  // Orient missile to face direction of travel
  const forward = new THREE.Vector3(0, 1, 0); // Cylinder default orientation
  const quaternion = new THREE.Quaternion().setFromUnitVectors(forward, missile.direction);
  missileMesh.setRotationFromQuaternion(quaternion);
  
  // Add trail effect (simple glowing effect)
  missileMesh.castShadow = true;
  
  // Add to scene
  addObjectToScene(missileMesh);
  
  return missileMesh;
}

// Update all missiles
export function updateMissiles(deltaTime) {
  const currentTime = Date.now();
  const missilesToRemove = [];
  
  missiles.forEach((missile, missileId) => {
    if (!missile.isActive) {
      missilesToRemove.push(missileId);
      return;
    }
    
    // Check lifetime
    if (currentTime - missile.createdAt > MISSILE_LIFETIME) {
      console.log(`🕐 Missile ${missileId} expired after ${MISSILE_LIFETIME}ms`);
      missilesToRemove.push(missileId);
      return;
    }
    
    // Update position (deltaTime is already in seconds from GameEngine)
    const deltaPosition = missile.velocity.clone().multiplyScalar(deltaTime);
    missile.position.add(deltaPosition);
    
    // Update visual position
    if (missile.mesh) {
      missile.mesh.position.copy(missile.position);
    }
    
    // Check arena boundaries (simple box collision)
    if (isOutOfBounds(missile.position)) {
      console.log(`🏁 Missile ${missileId} hit arena boundary`);
      if (missile.isLocal) {
        createExplosionEffect(missile.position);
      }
      missilesToRemove.push(missileId);
      return;
    }
    
    // Step 7.3: Collision detection for LOCAL missiles only
    if (missile.isLocal) {
      const hitResult = checkMissilePlayerCollision(missile);
      if (hitResult) {
        console.log(`💥 LOCAL missile ${missileId} hit player ${hitResult.playerId}`);
        
        // Create explosion effect
        createExplosionEffect(missile.position);
        
        // Mark missile for removal
        missilesToRemove.push(missileId);
        
        // Call hit callback if set (will be used for server reporting)
        if (typeof missile.onHit === 'function') {
          missile.onHit(hitResult);
        }
        return;
      }
    }
  });
  
  // Remove expired/destroyed missiles
  missilesToRemove.forEach(missileId => {
    removeMissile(missileId);
  });
}

// Check if missile is out of arena bounds
function isOutOfBounds(position) {
  const arenaSize = 50; // Half-size of arena (100x100 arena)
  return Math.abs(position.x) > arenaSize || 
         Math.abs(position.z) > arenaSize ||
         position.y < -5 || position.y > 20;
}

// Remove missile from the system
export function removeMissile(missileId) {
  const missile = missiles.get(missileId);
  if (missile) {
    // Remove visual representation
    if (missile.mesh) {
      removeObjectFromScene(missile.mesh);
      missile.mesh.geometry.dispose();
      missile.mesh.material.dispose();
      missile.mesh = null;
    }
    
    // Remove from active missiles
    missiles.delete(missileId);
    console.log(`🗑️ Removed missile ${missileId}`);
  }
}

// Get missile by ID
export function getMissile(missileId) {
  return missiles.get(missileId);
}

// Get all active missiles
export function getAllMissiles() {
  return Array.from(missiles.values());
}

// Get only local missiles (for hit detection)
export function getLocalMissiles() {
  return getAllMissiles().filter(missile => missile.isLocal);
}

// Get missile count for debugging
export function getMissileCount() {
  return missiles.size;
}

// Generate next missile ID for local missiles
export function generateMissileId(shooterId) {
  return `${shooterId}_${nextMissileId++}`;
}

// Destroy missile (for hit detection)
export function destroyMissile(missileId) {
  const missile = missiles.get(missileId);
  if (missile) {
    missile.isActive = false;
    // Visual removal will happen in next update cycle
    console.log(`💥 Destroyed missile ${missileId}`);
    return true;
  }
  return false;
}

// Cleanup all missiles
export function disposeMissileSystem() {
  missiles.forEach((missile, missileId) => {
    removeMissile(missileId);
  });
  missiles.clear();
  console.log('Missile system disposed');
}

// Step 7.3: Check collision between missile and all players
function checkMissilePlayerCollision(missile) {
  const players = playerManager.getAllPlayers();
  const hitDistance = 2.0; // Distance required for hit
  
  for (const player of players) {
    // Skip dead players
    if (!player.isAlive) {
      continue;
    }
    
    // Calculate distance between missile and player
    const distance = missile.position.distanceTo(player.position);
    
    if (distance <= hitDistance) {
      return {
        playerId: player.id,
        playerName: player.name,
        hitPosition: missile.position.clone(),
        missileId: missile.id,
        shooterId: missile.shooterId,
        distance: distance
      };
    }
  }
  
  return null;
}

// Step 7.3: Create explosion effect at position
function createExplosionEffect(position) {
  // Create simple explosion effect (expanding sphere)
  const explosionGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const explosionMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4444,
    transparent: true,
    opacity: 0.8
  });
  
  const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
  explosion.position.copy(position);
  
  addObjectToScene(explosion);
  
  // Animate explosion (scale up and fade out)
  const startTime = Date.now();
  const duration = 500; // 500ms explosion duration
  
  function animateExplosion() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Scale up
    const scale = 1 + progress * 3;
    explosion.scale.set(scale, scale, scale);
    
    // Fade out
    explosion.material.opacity = 0.8 * (1 - progress);
    
    if (progress < 1) {
      requestAnimationFrame(animateExplosion);
    } else {
      // Remove explosion
      removeObjectFromScene(explosion);
      explosion.geometry.dispose();
      explosion.material.dispose();
    }
  }
  
  animateExplosion();
  console.log('💥 Created explosion effect at position:', position);
}

// Set hit callback for a missile (used for server reporting)
export function setMissileHitCallback(missileId, callback) {
  const missile = missiles.get(missileId);
  if (missile) {
    missile.onHit = callback;
    return true;
  }
  return false;
}

// Debug function to get missile info
export function getMissileDebugInfo() {
  const info = {
    totalMissiles: missiles.size,
    localMissiles: getLocalMissiles().length,
    remoteMissiles: getAllMissiles().filter(m => !m.isLocal).length
  };
  return info;
}
