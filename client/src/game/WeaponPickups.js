// Surr Game - Weapon Pickups Visualization
// Function-based weapon pickup rendering and management

import * as THREE from 'three';
import { addObjectToScene, removeObjectFromScene } from './Scene.js';

// Weapon pickup state
let weaponPickups = new Map();
let weaponPickupGroup = new THREE.Group();
let animationTime = 0;

// Initialize weapon pickup system
export function initWeaponPickups() {
  weaponPickups.clear();
  animationTime = 0;
  
  // Create weapon pickup group for organized scene management
  weaponPickupGroup = new THREE.Group();
  weaponPickupGroup.name = 'WeaponPickups';
  addObjectToScene(weaponPickupGroup);
  
  console.log('WeaponPickups visualization system initialized');
}

// Create visual representation for a weapon pickup
function createWeaponPickupMesh(pickupId, position) {
  // Create pickup container group
  const pickupGroup = new THREE.Group();
  pickupGroup.position.set(position.x, position.y, position.z);
  pickupGroup.userData = { pickupId, isAvailable: true };
  
  // Main pickup box (rotating)
  const boxGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: 0xff6b35,
    transparent: true,
    opacity: 0.9
  });
  
  const pickupBox = new THREE.Mesh(boxGeometry, boxMaterial);
  pickupBox.castShadow = true;
  pickupBox.receiveShadow = true;
  pickupBox.name = 'pickupBox';
  
  // Glow effect (larger, more transparent box)
  const glowGeometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
  const glowMaterial = new THREE.MeshLambertMaterial({
    color: 0xff6b35,
    transparent: true,
    opacity: 0.3
  });
  
  const glowBox = new THREE.Mesh(glowGeometry, glowMaterial);
  glowBox.name = 'glowBox';
  
  // Inner core (small bright sphere)
  const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const coreMaterial = new THREE.MeshLambertMaterial({
    color: 0xffff00,
    emissive: 0x444400
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.name = 'core';
  
  // Particle effect rings
  const ringGeometry = new THREE.RingGeometry(0.8, 1.0, 16);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6b35,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  
  const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
  ring1.rotation.x = Math.PI / 2;
  ring1.name = 'ring1';
  
  const ring2 = new THREE.Mesh(ringGeometry, ringMaterial.clone());
  ring2.rotation.z = Math.PI / 2;
  ring2.name = 'ring2';
  
  // Assemble pickup
  pickupGroup.add(pickupBox);
  pickupGroup.add(glowBox);
  pickupGroup.add(core);
  pickupGroup.add(ring1);
  pickupGroup.add(ring2);
  
  return pickupGroup;
}

// Update weapon pickups based on server data
export function updateWeaponPickups(weaponBoxData) {
  if (!weaponBoxData || !weaponBoxData.boxes) {
    return;
  }
  
  const serverPickups = weaponBoxData.boxes;
  
  // Update existing pickups and create new ones
  serverPickups.forEach(serverPickup => {
    let pickup = weaponPickups.get(serverPickup.id);
    
    if (!pickup) {
      // Create new pickup
      pickup = createWeaponPickupMesh(serverPickup.id, serverPickup.position);
      weaponPickups.set(serverPickup.id, pickup);
      weaponPickupGroup.add(pickup);
      console.log(`Created weapon pickup ${serverPickup.id} at position:`, serverPickup.position);
    }
    
    // Update availability state
    updatePickupAvailability(pickup, serverPickup.isAvailable);
  });
  
  // Remove pickups that no longer exist on server
  weaponPickups.forEach((pickup, pickupId) => {
    const serverPickup = serverPickups.find(p => p.id === pickupId);
    if (!serverPickup) {
      weaponPickupGroup.remove(pickup);
      weaponPickups.delete(pickupId);
      console.log(`Removed weapon pickup ${pickupId}`);
    }
  });
}

// Update pickup availability visual state
function updatePickupAvailability(pickup, isAvailable) {
  if (!pickup || !pickup.userData) return;
  
  const wasAvailable = pickup.userData.isAvailable;
  pickup.userData.isAvailable = isAvailable;
  
  // Update visual state if changed
  if (wasAvailable !== isAvailable) {
    pickup.visible = isAvailable;
    
    if (isAvailable) {
      // Reset opacity and scale for respawned pickup
      pickup.traverse((child) => {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = child.name === 'glowBox' ? 0.3 : 
                                   child.name === 'ring1' || child.name === 'ring2' ? 0.5 : 0.9;
        }
      });
      pickup.scale.set(1, 1, 1);
    }
  }
}

// Animate weapon pickups (floating, rotating, pulsing)
export function animateWeaponPickups(deltaTime) {
  animationTime += deltaTime * 0.001; // Convert to seconds
  
  weaponPickups.forEach((pickup) => {
    if (!pickup.userData.isAvailable) return;
    
    // Store the original ground position if not already stored
    if (pickup.userData.originalY === undefined) {
      pickup.userData.originalY = pickup.position.y;
    }
    
    // Floating animation - keep anchored to ground level
    pickup.position.y = pickup.userData.originalY + Math.sin(animationTime * 2 + pickup.userData.pickupId) * 0.3;
    
    // Rotation animation
    const pickupBox = pickup.getObjectByName('pickupBox');
    const core = pickup.getObjectByName('core');
    const ring1 = pickup.getObjectByName('ring1');
    const ring2 = pickup.getObjectByName('ring2');
    
    if (pickupBox) {
      pickupBox.rotation.y += deltaTime * 0.002;
      pickupBox.rotation.x += deltaTime * 0.001;
    }
    
    if (core) {
      core.rotation.y += deltaTime * 0.004;
    }
    
    if (ring1) {
      ring1.rotation.z += deltaTime * 0.003;
    }
    
    if (ring2) {
      ring2.rotation.y += deltaTime * 0.0025;
    }
    
    // Pulsing glow effect
    const glowBox = pickup.getObjectByName('glowBox');
    if (glowBox && glowBox.material) {
      const pulseIntensity = 0.3 + Math.sin(animationTime * 3 + pickup.userData.pickupId) * 0.15;
      glowBox.material.opacity = pulseIntensity;
      
      // Scale pulsing
      const scaleMultiplier = 1 + Math.sin(animationTime * 2.5 + pickup.userData.pickupId) * 0.1;
      glowBox.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
    }
  });
}

// Hide pickup immediately for responsive local feedback
export function hidePickupLocally(pickupId) {
  const pickup = weaponPickups.get(pickupId);
  if (pickup) {
    pickup.visible = false;
    pickup.userData.isAvailable = false;
    console.log(`Locally hidden weapon pickup ${pickupId} for responsive feedback`);
  }
}

// Show pickup (for respawning)
export function showPickup(pickupId) {
  const pickup = weaponPickups.get(pickupId);
  if (pickup) {
    pickup.visible = true;
    pickup.userData.isAvailable = true;
    console.log(`Weapon pickup ${pickupId} is now visible`);
  }
}

// Get pickup position for collision detection
export function getPickupPosition(pickupId) {
  const pickup = weaponPickups.get(pickupId);
  return pickup ? pickup.position.clone() : null;
}

// Get all available pickup positions for collision detection
export function getAvailablePickupPositions() {
  const positions = [];
  weaponPickups.forEach((pickup, pickupId) => {
    if (pickup.userData.isAvailable) {
      positions.push({
        id: pickupId,
        position: pickup.position.clone()
      });
    }
  });
  return positions;
}

// Check if pickup is available
export function isPickupAvailable(pickupId) {
  const pickup = weaponPickups.get(pickupId);
  return pickup ? pickup.userData.isAvailable : false;
}

// Check collision between local player and weapon pickups
export function checkWeaponPickupCollisions(localPlayer) {
  if (!localPlayer || localPlayer.weapon !== null) {
    // Player already has a weapon, no collection allowed
    return null;
  }
  
  const playerPosition = localPlayer.position;
  const collectionDistance = 2.5; // Distance required to collect pickup
  
  // Check collision with each available pickup
  for (const [pickupId, pickup] of weaponPickups) {
    if (!pickup.userData.isAvailable) continue;
    
    const pickupPosition = pickup.position;
    const distance = playerPosition.distanceTo(pickupPosition);
    
    if (distance <= collectionDistance) {
      return {
        pickupId: pickupId,
        pickup: pickup,
        distance: distance
      };
    }
  }
  
  return null;
}

// Attempt to collect a weapon pickup locally (immediate feedback)
export function attemptLocalPickupCollection(collisionData) {
  if (!collisionData || !collisionData.pickup) {
    return false;
  }
  
  const { pickupId, pickup } = collisionData;
  
  // Immediately hide pickup for responsive feedback
  hidePickupLocally(pickupId);
  
  console.log(`🎯 Locally collected weapon pickup ${pickupId} (responsive feedback)`);
  return true;
}

// Get pickup count for debugging
export function getPickupCount() {
  return weaponPickups.size;
}

// Cleanup function
export function disposeWeaponPickups() {
  weaponPickups.forEach((pickup) => {
    pickup.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (child.material.length) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  });
  
  weaponPickups.clear();
  
  if (weaponPickupGroup) {
    removeObjectFromScene(weaponPickupGroup);
  }
  
  console.log('WeaponPickups disposed');
}
