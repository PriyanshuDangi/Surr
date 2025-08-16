// Surr Game - Game State Manager
// Function-based game state management

import { createPlayer, validatePlayerPosition, validatePlayerRotation, serializePlayer, validateWeapon } from './Player.js';

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

  // Use Player.js utility to create standardized player object
  const player = createPlayer(playerId, playerName);
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
  if (!player) {
    return false;
  }

  // Validate incoming data using Player.js utilities
  if (!validatePlayerPosition(position) || !validatePlayerRotation(rotation)) {
    console.log(`Invalid position/rotation data for player ${playerId}`);
    return false;
  }

  player.position = { ...position };
  player.rotation = { ...rotation };
  return true;
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
  // Serialize all players for network transmission
  const serializedPlayers = getAllPlayers().map(player => serializePlayer(player));
  
  return {
    players: serializedPlayers,
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

// Update player weapon status
export function updatePlayerWeapon(playerId, weapon) {
  const player = players.get(playerId);
  if (player && validateWeapon(weapon)) {
    player.weapon = weapon; // 'missile' or null
    return true;
  }
  return false;
}

// Set player alive status
export function setPlayerAliveStatus(playerId, isAlive) {
  const player = players.get(playerId);
  if (player) {
    player.isAlive = isAlive;
    if (!isAlive) {
      player.weapon = null; // Remove weapon when dead
    }
    return true;
  }
  return false;
}

// Get serialized player data for a specific player
export function getSerializedPlayer(playerId) {
  const player = players.get(playerId);
  return player ? serializePlayer(player) : null;
}

export function resetGameState() {
  players.clear();
  weaponBoxes.clear();
  gameStarted = false;
  console.log('Game state reset');
}