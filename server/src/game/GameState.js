// Surr Game - Game State Manager
// Function-based game state management

// Game state
let players = new Map();
let weaponBoxes = new Map();
let gameStarted = false;
const maxPlayers = 6;

// Initialize game state
export function initGameState() {
  players.clear();
  weaponBoxes.clear();
  gameStarted = false;
  console.log('GameState initialized');
}

// Player management functions

export function addPlayer(playerId, playerName) {
  if (players.size >= maxPlayers) {
    console.log(`Cannot add player ${playerName}: Game is full`);
    return false;
  }

  if (players.has(playerId)) {
    console.log(`Player ${playerId} already exists`);
    return false;
  }

  const player = {
    id: playerId,
    name: playerName,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    score: 0,
    isAlive: true,
    weapon: null,
    joinedAt: Date.now()
  };

  players.set(playerId, player);
  console.log(`Player added: ${playerName} (${playerId})`);
  return true;
}

export function removePlayer(playerId) {
  if (players.has(playerId)) {
    const player = players.get(playerId);
    players.delete(playerId);
    console.log(`Player removed: ${player.name} (${playerId})`);
    return true;
  }
  return false;
}

export function updatePlayerPosition(playerId, position, rotation) {
  const player = players.get(playerId);
  if (player) {
    player.position = { ...position };
    player.rotation = { ...rotation };
    return true;
  }
  return false;
}

export function getPlayer(playerId) {
  return players.get(playerId) || null;
}

export function getAllPlayers() {
  return Array.from(players.values());
}

export function getPlayerCount() {
  return players.size;
}

export function canAcceptPlayers() {
  return players.size < maxPlayers;
}

// Game state functions

export function getGameStateForBroadcast() {
  return {
    players: getAllPlayers(),
    playerCount: getPlayerCount(),
    maxPlayers,
    gameStarted,
    timestamp: Date.now()
  };
}

export function getLeaderboard() {
  return getAllPlayers()
    .sort((a, b) => b.score - a.score)
    .map(player => ({
      id: player.id,
      name: player.name,
      score: player.score,
      isAlive: player.isAlive
    }));
}

export function awardPoints(playerId, points = 1) {
  const player = players.get(playerId);
  if (player) {
    player.score += points;
    console.log(`Player ${player.name} awarded ${points} points. Total: ${player.score}`);
  }
}

export function resetGameState() {
  players.clear();
  weaponBoxes.clear();
  gameStarted = false;
  console.log('Game state reset');
}