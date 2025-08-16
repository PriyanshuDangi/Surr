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