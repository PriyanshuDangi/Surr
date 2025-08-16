// Surr Game - Server Player Functions
// Function-based server-side player utilities

// Create a new player object
export function createPlayer(id, name) {
  return {
    id,
    name,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    score: 0,
    isAlive: true,
    weapon: null,
    joinedAt: Date.now()
  };
}

// Validate player position data
export function validatePlayerPosition(position) {
  return position && 
         typeof position.x === 'number' && 
         typeof position.y === 'number' && 
         typeof position.z === 'number';
}

// Validate player rotation data
export function validatePlayerRotation(rotation) {
  return rotation && 
         typeof rotation.x === 'number' && 
         typeof rotation.y === 'number' && 
         typeof rotation.z === 'number';
}

// Serialize player data for network transmission
export function serializePlayer(player) {
  return {
    id: player.id,
    name: player.name,
    position: player.position,
    rotation: player.rotation,
    score: player.score,
    isAlive: player.isAlive,
    weapon: player.weapon
  };
}

// Validate player name
export function validatePlayerName(name) {
  return typeof name === 'string' && 
         name.trim().length > 0 && 
         name.trim().length <= 20;
}

// Validate weapon type
export function validateWeapon(weapon) {
  return weapon === null || weapon === 'missile';
}

// Update player position safely with validation
export function updatePlayerData(player, updates) {
  const updatedPlayer = { ...player };
  
  if (updates.position && validatePlayerPosition(updates.position)) {
    updatedPlayer.position = { ...updates.position };
  }
  
  if (updates.rotation && validatePlayerRotation(updates.rotation)) {
    updatedPlayer.rotation = { ...updates.rotation };
  }
  
  if (updates.weapon !== undefined && validateWeapon(updates.weapon)) {
    updatedPlayer.weapon = updates.weapon;
  }
  
  if (typeof updates.isAlive === 'boolean') {
    updatedPlayer.isAlive = updates.isAlive;
    // Remove weapon if player dies
    if (!updates.isAlive) {
      updatedPlayer.weapon = null;
    }
  }
  
  if (typeof updates.score === 'number' && updates.score >= 0) {
    updatedPlayer.score = updates.score;
  }
  
  return updatedPlayer;
}

// Check if position is within arena bounds
export function isPositionInBounds(position, arenaSize = 100) {
  const halfSize = arenaSize / 2;
  return position.x >= -halfSize && position.x <= halfSize &&
         position.z >= -halfSize && position.z <= halfSize;
}