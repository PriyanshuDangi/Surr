// Surr Game - Missile Class
// Function-based missile management for client-side projectiles

import * as THREE from 'three';
import { addObjectToScene, removeObjectFromScene } from './Scene.js';
import { playerManager } from './Player.js';

// Missile state management
let missiles = new Map();
let nextMissileId = 1;

// Missile configuration
const MISSILE_SPEED = 60; // units per second
const MISSILE_LIFETIME = 5000; // 5 seconds in milliseconds
const MISSILE_LENGTH = 1.5;
const MISSILE_RADIUS = 0.1;

// Collision detection configuration
const COLLISION_CONFIG = {
  // Available collision methods: 'bounding_box', 'sphere_box', 'raycast', 'distance'
  METHOD: 'bounding_box',
  
  // Fallback hit distance when meshes aren't available
  FALLBACK_HIT_DISTANCE: 2.0,
  
  // Bounding box padding (makes collision slightly more forgiving)
  BOUNDING_BOX_PADDING: 0.2,
  
  // Ray collision settings
  RAY_COLLISION_SEGMENTS: 5, // Number of points to check along missile path
  
  // Debug visualization
  DEBUG_SHOW_BOUNDS: false
};

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
  
  for (const player of players) {
    // Skip dead players and the shooter
    if (!player.isAlive || player.id === missile.shooterId) {
      continue;
    }
    
    // Use configured collision detection method
    const hitResult = detectCollision(missile, player);
    
    if (hitResult.hit) {
      return {
        playerId: player.id,
        playerName: player.name,
        hitPosition: hitResult.hitPosition || missile.position.clone(),
        missileId: missile.id,
        shooterId: missile.shooterId,
        distance: hitResult.distance,
        collisionMethod: COLLISION_CONFIG.METHOD
      };
    }
  }
  
  return null;
}

// Advanced collision detection dispatcher
function detectCollision(missile, player) {
  switch (COLLISION_CONFIG.METHOD) {
    case 'bounding_box':
      return checkBoundingBoxCollision(missile, player);
    case 'sphere_box':
      return checkSphereBoxCollision(missile, player);
    case 'raycast':
      return checkRaycastCollision(missile, player);
    case 'distance':
    default:
      return checkDistanceCollision(missile, player);
  }
}

// Method 1: Bounding Box Collision (AABB)
function checkBoundingBoxCollision(missile, player) {
  try {
    // Get missile bounding box
    const missileBounds = getMissileBoundingBox(missile);
    
    // Get player bounding box
    const playerBounds = getPlayerBoundingBox(player);
    
    if (!missileBounds || !playerBounds) {
      // Fallback to distance collision if bounds unavailable
      return checkDistanceCollision(missile, player);
    }
    
    // Check AABB intersection with padding
    const padding = COLLISION_CONFIG.BOUNDING_BOX_PADDING;
    
    const hit = (
      missileBounds.max.x + padding >= playerBounds.min.x &&
      missileBounds.min.x - padding <= playerBounds.max.x &&
      missileBounds.max.y + padding >= playerBounds.min.y &&
      missileBounds.min.y - padding <= playerBounds.max.y &&
      missileBounds.max.z + padding >= playerBounds.min.z &&
      missileBounds.min.z - padding <= playerBounds.max.z
    );
    
    return {
      hit: hit,
      distance: hit ? missile.position.distanceTo(player.position) : Number.MAX_VALUE,
      hitPosition: hit ? getBoxIntersectionPoint(missileBounds, playerBounds) : null
    };
    
  } catch (error) {
    console.warn('Bounding box collision failed, falling back to distance:', error);
    return checkDistanceCollision(missile, player);
  }
}

// Method 2: Sphere-Box Collision
function checkSphereBoxCollision(missile, player) {
  try {
    const playerBounds = getPlayerBoundingBox(player);
    
    if (!playerBounds) {
      return checkDistanceCollision(missile, player);
    }
    
    // Treat missile as a sphere
    const missileRadius = MISSILE_RADIUS * 2; // Slightly larger for better gameplay
    const missileCenter = missile.position;
    
    // Find closest point on player bounding box to missile center
    const closestPoint = new THREE.Vector3(
      Math.max(playerBounds.min.x, Math.min(missileCenter.x, playerBounds.max.x)),
      Math.max(playerBounds.min.y, Math.min(missileCenter.y, playerBounds.max.y)),
      Math.max(playerBounds.min.z, Math.min(missileCenter.z, playerBounds.max.z))
    );
    
    // Check if distance to closest point is within missile radius
    const distance = missileCenter.distanceTo(closestPoint);
    const hit = distance <= missileRadius + COLLISION_CONFIG.BOUNDING_BOX_PADDING;
    
    return {
      hit: hit,
      distance: distance,
      hitPosition: hit ? closestPoint : null
    };
    
  } catch (error) {
    console.warn('Sphere-box collision failed, falling back to distance:', error);
    return checkDistanceCollision(missile, player);
  }
}

// Method 3: Raycast Collision
function checkRaycastCollision(missile, player) {
  try {
    if (!player.mesh) {
      return checkDistanceCollision(missile, player);
    }
    
    // Create raycaster from missile position in missile direction
    const raycaster = new THREE.Raycaster(
      missile.position,
      missile.direction,
      0,
      MISSILE_LENGTH * 1.5 // Check slightly ahead of missile
    );
    
    // Get all meshes from player (car model might have multiple parts)
    const playerMeshes = [];
    player.mesh.traverse((child) => {
      if (child.isMesh) {
        playerMeshes.push(child);
      }
    });
    
    if (playerMeshes.length === 0) {
      return checkDistanceCollision(missile, player);
    }
    
    // Check for intersections
    const intersects = raycaster.intersectObjects(playerMeshes, false);
    
    if (intersects.length > 0) {
      const firstHit = intersects[0];
      return {
        hit: true,
        distance: firstHit.distance,
        hitPosition: firstHit.point
      };
    }
    
    return { hit: false, distance: Number.MAX_VALUE, hitPosition: null };
    
  } catch (error) {
    console.warn('Raycast collision failed, falling back to distance:', error);
    return checkDistanceCollision(missile, player);
  }
}

// Method 4: Distance Collision (original method, kept as fallback)
function checkDistanceCollision(missile, player) {
  const distance = missile.position.distanceTo(player.position);
  const hit = distance <= COLLISION_CONFIG.FALLBACK_HIT_DISTANCE;
  
  return {
    hit: hit,
    distance: distance,
    hitPosition: hit ? missile.position.clone() : null
  };
}

// Helper function to get missile bounding box
function getMissileBoundingBox(missile) {
  if (!missile.mesh) {
    // Create approximate bounding box from missile properties
    const halfLength = MISSILE_LENGTH / 2;
    const radius = MISSILE_RADIUS;
    
    return new THREE.Box3(
      new THREE.Vector3(
        missile.position.x - radius,
        missile.position.y - radius,
        missile.position.z - halfLength
      ),
      new THREE.Vector3(
        missile.position.x + radius,
        missile.position.y + radius,
        missile.position.z + halfLength
      )
    );
  }
  
  // Get actual bounding box from mesh
  const box = new THREE.Box3().setFromObject(missile.mesh);
  return box;
}

// Helper function to get player bounding box
function getPlayerBoundingBox(player) {
  if (!player.mesh) {
    // Create approximate bounding box from player position
    // Using fallback car dimensions from Player.js
    const width = 2;
    const height = 1;
    const depth = 3;
    
    return new THREE.Box3(
      new THREE.Vector3(
        player.position.x - width/2,
        player.position.y,
        player.position.z - depth/2
      ),
      new THREE.Vector3(
        player.position.x + width/2,
        player.position.y + height,
        player.position.z + depth/2
      )
    );
  }
  
  // Get actual bounding box from mesh
  const box = new THREE.Box3().setFromObject(player.mesh);
  return box;
}

// Helper function to find intersection point between two bounding boxes
function getBoxIntersectionPoint(box1, box2) {
  // Calculate the center point of the intersection
  const intersection = new THREE.Box3();
  intersection.min.x = Math.max(box1.min.x, box2.min.x);
  intersection.min.y = Math.max(box1.min.y, box2.min.y);
  intersection.min.z = Math.max(box1.min.z, box2.min.z);
  intersection.max.x = Math.min(box1.max.x, box2.max.x);
  intersection.max.y = Math.min(box1.max.y, box2.max.y);
  intersection.max.z = Math.min(box1.max.z, box2.max.z);
  
  return intersection.getCenter(new THREE.Vector3());
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
    remoteMissiles: getAllMissiles().filter(m => !m.isLocal).length,
    collisionMethod: COLLISION_CONFIG.METHOD,
    collisionConfig: COLLISION_CONFIG
  };
  return info;
}

// Utility function to change collision detection method
export function setCollisionMethod(method) {
  const validMethods = ['bounding_box', 'sphere_box', 'raycast', 'distance'];
  
  if (!validMethods.includes(method)) {
    console.error(`Invalid collision method: ${method}. Valid methods: ${validMethods.join(', ')}`);
    return false;
  }
  
  const oldMethod = COLLISION_CONFIG.METHOD;
  COLLISION_CONFIG.METHOD = method;
  
  console.log(`🎯 Collision detection method changed from '${oldMethod}' to '${method}'`);
  return true;
}

// Utility function to get current collision method
export function getCollisionMethod() {
  return COLLISION_CONFIG.METHOD;
}

// Utility function to configure collision settings
export function configureCollision(config) {
  if (config.method) setCollisionMethod(config.method);
  if (config.fallbackDistance) COLLISION_CONFIG.FALLBACK_HIT_DISTANCE = config.fallbackDistance;
  if (config.boundingBoxPadding) COLLISION_CONFIG.BOUNDING_BOX_PADDING = config.boundingBoxPadding;
  if (config.raySegments) COLLISION_CONFIG.RAY_COLLISION_SEGMENTS = config.raySegments;
  if (config.debugBounds !== undefined) COLLISION_CONFIG.DEBUG_SHOW_BOUNDS = config.debugBounds;
  
  console.log('🎯 Collision configuration updated:', COLLISION_CONFIG);
}

// Export collision configuration for external access
export { COLLISION_CONFIG };

// Browser console debug functions (if running in browser)
if (typeof window !== 'undefined') {
  // Debug function to test different collision methods
  window.testCollisionMethod = function(method) {
    if (setCollisionMethod(method)) {
      console.log(`🧪 Now testing collision method: ${method}`);
      console.log('💡 Fire some missiles to see the difference!');
      console.log('📊 Use getMissileDebugInfo() to see collision stats');
    }
  };
  
  // Debug function to show collision configuration
  window.showCollisionConfig = function() {
    console.log('🎯 Current Collision Configuration:');
    console.table(COLLISION_CONFIG);
    console.log('💡 Available methods: bounding_box, sphere_box, raycast, distance');
    console.log('💡 Change method with: testCollisionMethod("bounding_box")');
  };
  
  // Debug function to compare collision methods
  window.compareCollisionMethods = function() {
    console.log('🎯 Collision Method Comparison:');
    console.log('📦 bounding_box: Most accurate for box-shaped objects, good performance');
    console.log('🔮 sphere_box: Good for projectiles, treats missile as sphere vs player box');
    console.log('🎯 raycast: Most precise, uses actual mesh geometry, higher performance cost');
    console.log('📏 distance: Simple distance check, fastest but least accurate');
    console.log('');
    console.log('💡 Current method:', COLLISION_CONFIG.METHOD);
    console.log('💡 Test a method: testCollisionMethod("raycast")');
  };
}
