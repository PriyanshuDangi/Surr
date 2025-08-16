// Surr Game - Player Functions
// Function-based player management

// Player state
let players = new Map();

// Create a new player
export function createPlayer(id, name, position = { x: 0, y: 0, z: 0 }) {
  const player = {
    id,
    name,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    score: 0,
    isAlive: true,
    weapon: null
  };
  
  players.set(id, player);
  console.log('Player created:', name);
  return player;
}

// Get player by ID
export function getPlayer(id) {
  return players.get(id);
}

// Get all players
export function getAllPlayers() {
  return Array.from(players.values());
}

// Update player position
export function updatePlayerPosition(id, position, rotation) {
  const player = players.get(id);
  if (player) {
    player.position = position;
    player.rotation = rotation;
  }
}

// Update player score
export function updatePlayerScore(id, score) {
  const player = players.get(id);
  if (player) {
    player.score = score;
  }
}

// Remove player
export function removePlayer(id) {
  const player = players.get(id);
  if (player) {
    console.log('Player removed:', player.name);
    players.delete(id);
  }
}

// Clear all players
export function clearAllPlayers() {
  players.clear();
}