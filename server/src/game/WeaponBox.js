// Surr Game - Weapon Box Functions
// Function-based weapon pickup management

// Weapon box state
let weaponBoxes = new Map();
let globalRespawnTimer = null;
let nextRespawnTime = null;
const RESPAWN_INTERVAL = 15000; // 15 seconds global respawn

// Predefined weapon pickup positions (9 equidistant locations)
const WEAPON_POSITIONS = [
  { x: 0, y: 1, z: 0 },       // Center
  { x: 30, y: 1, z: 0 },      // East
  { x: -30, y: 1, z: 0 },     // West
  { x: 0, y: 1, z: 30 },      // North
  { x: 0, y: 1, z: -30 },     // South
  { x: 21, y: 1, z: 21 },     // Northeast
  { x: -21, y: 1, z: 21 },    // Northwest
  { x: 21, y: 1, z: -21 },    // Southeast
  { x: -21, y: 1, z: -21 }    // Southwest
];

// Initialize weapon boxes system
export function initWeaponBoxes() {
  weaponBoxes.clear();
  
  // Stop any existing respawn timer
  if (globalRespawnTimer) {
    clearInterval(globalRespawnTimer);
    globalRespawnTimer = null;
  }
  
  // Create 9 weapon boxes at predefined positions
  WEAPON_POSITIONS.forEach((position, index) => {
    const box = {
      id: index + 1,
      position,
      isAvailable: true,
      lastCollected: null
    };
    weaponBoxes.set(box.id, box);
  });
  
  // Start global respawn timer
  startGlobalRespawnTimer();
  
  console.log(`WeaponBox system initialized with ${weaponBoxes.size} pickup locations`);
  console.log('Global respawn timer started - ALL boxes respawn every 15 seconds');
}

// Start global respawn timer that respawns ALL boxes simultaneously
function startGlobalRespawnTimer() {
  if (globalRespawnTimer) {
    clearInterval(globalRespawnTimer);
  }
  
  globalRespawnTimer = setInterval(() => {
    respawnAllWeaponBoxes();
  }, RESPAWN_INTERVAL);
  
  nextRespawnTime = Date.now() + RESPAWN_INTERVAL;
  console.log('🔄 Global weapon box respawn timer started');
}

// Respawn ALL weapon boxes simultaneously
function respawnAllWeaponBoxes() {
  let respawnedCount = 0;
  
  weaponBoxes.forEach((box) => {
    if (!box.isAvailable) {
      box.isAvailable = true;
      box.lastCollected = null;
      respawnedCount++;
    }
  });
  
  nextRespawnTime = Date.now() + RESPAWN_INTERVAL;
  
  if (respawnedCount > 0) {
    console.log(`🎁 ${respawnedCount} weapon boxes respawned globally`);
  }
}

// Collect a weapon box (validate player doesn't already have weapon)
export function collectWeaponBox(boxId, playerId, playerHasWeapon = false) {
  const box = weaponBoxes.get(boxId);
  
  if (!box) {
    console.log(`Weapon box ${boxId} does not exist`);
    return { success: false, reason: 'Box not found' };
  }
  
  if (!box.isAvailable) {
    console.log(`Weapon box ${boxId} is not available`);
    return { success: false, reason: 'Box not available' };
  }
  
  if (playerHasWeapon) {
    console.log(`Player ${playerId} already has a weapon`);
    return { success: false, reason: 'Player already has weapon' };
  }
  
  // Collect the weapon box
  box.isAvailable = false;
  box.lastCollected = Date.now();
  
  console.log(`✅ Player ${playerId} collected weapon box ${boxId}`);
  return { success: true, weapon: 'missile' };
}

// Get all weapon boxes with their current states
export function getAllWeaponBoxes() {
  return Array.from(weaponBoxes.values());
}

// Get only available weapon boxes
export function getAvailableWeaponBoxes() {
  return getAllWeaponBoxes().filter(box => box.isAvailable);
}

// Get weapon boxes data for broadcast to clients
export function getWeaponBoxesForBroadcast() {
  return {
    boxes: getAllWeaponBoxes().map(box => ({
      id: box.id,
      position: box.position,
      isAvailable: box.isAvailable
    })),
    nextRespawnTime: nextRespawnTime,
    respawnInterval: RESPAWN_INTERVAL
  };
}

// Get time until next global respawn
export function getTimeUntilRespawn() {
  if (!nextRespawnTime) return 0;
  return Math.max(0, nextRespawnTime - Date.now());
}

// Cleanup function for graceful shutdown
export function cleanup() {
  if (globalRespawnTimer) {
    clearInterval(globalRespawnTimer);
    globalRespawnTimer = null;
  }
  weaponBoxes.clear();
  console.log('WeaponBox system cleaned up');
}