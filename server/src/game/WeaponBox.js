// Surr Game - Weapon Box Functions
// Function-based weapon pickup management

// Weapon box state
let weaponBoxes = new Map();
let nextBoxId = 1;

// Initialize weapon boxes
export function initWeaponBoxes() {
  weaponBoxes.clear();
  nextBoxId = 1;
  console.log('WeaponBox system initialized');
}

// Create a weapon box
export function createWeaponBox(position) {
  const box = {
    id: nextBoxId++,
    position,
    isAvailable: true,
    respawnTime: 15000, // 15 seconds
    lastCollected: null
  };
  
  weaponBoxes.set(box.id, box);
  return box;
}

// Collect a weapon box
export function collectWeaponBox(boxId) {
  const box = weaponBoxes.get(boxId);
  if (box && box.isAvailable) {
    box.isAvailable = false;
    box.lastCollected = Date.now();
    
    // Schedule respawn
    setTimeout(() => {
      respawnWeaponBox(boxId);
    }, box.respawnTime);
    
    return true;
  }
  return false;
}

// Respawn a weapon box
function respawnWeaponBox(boxId) {
  const box = weaponBoxes.get(boxId);
  if (box) {
    box.isAvailable = true;
    box.lastCollected = null;
    console.log(`Weapon box ${boxId} respawned`);
  }
}

// Get all weapon boxes
export function getAllWeaponBoxes() {
  return Array.from(weaponBoxes.values());
}

// Get available weapon boxes
export function getAvailableWeaponBoxes() {
  return getAllWeaponBoxes().filter(box => box.isAvailable);
}

// Remove weapon box
export function removeWeaponBox(boxId) {
  return weaponBoxes.delete(boxId);
}