// Surr Game - Game State Manager
// Function-based game state management

import { createPlayer, validatePlayerPosition, validatePlayerRotation, serializePlayer, validateWeapon } from './Player.js';
import { initWeaponBoxes, getWeaponBoxesForBroadcast, collectWeaponBox, cleanup as cleanupWeaponBoxes } from './WeaponBox.js';

// Game state
let players = new Map();
let weaponBoxes = new Map();
let gameStarted = false;
const maxPlayers = 6;

// Round management
const ROUND_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds
let currentRound = {
  number: 0,
  startTime: null,
  isActive: false
};

// Initialize game state
export function initGameState() {
  players.clear();
  weaponBoxes.clear();
  gameStarted = false;
  
  // Reset round state
  currentRound = {
    number: 0,
    startTime: null,
    isActive: false
  };
  
  // Initialize weapon pickup system
  initWeaponBoxes();
  
  console.log('GameState initialized with weapon pickup system');
}

// Player management functions

export function addPlayer(playerId, playerName, walletAddress = null) {
  if (getActivePlayerCount() >= maxPlayers) {
    console.log(`Cannot add player ${playerName}: Game is full`);
    return false;
  }

  // Check if player already exists (reactivate if inactive)
  if (players.has(playerId)) {
    const existingPlayer = players.get(playerId);
    const previousScore = existingPlayer.score;
    existingPlayer.isActive = true;
    
    // Only reset score if joining a new round, preserve score for same round reconnection
    if (!currentRound.isActive) {
      existingPlayer.score = 0;
      console.log(`Player reactivated for new round: ${playerName} (${playerId}) - score reset to 0`);
    } else {
      console.log(`Player reconnected mid-round: ${playerName} (${playerId}) - preserved score: ${previousScore}`);
    }
    
    // Start round if this is the first active player
    if (getActivePlayerCount() === 1 && !currentRound.isActive) {
      startNewRound();
    }
    return true;
  }

  // Create new player
  const player = createPlayer(playerId, playerName, walletAddress);
  players.set(playerId, player);
  console.log(`Player added: ${playerName} (${playerId})${walletAddress ? ` with wallet ${walletAddress}` : ''}`);
  
  // Start round if this is the first player
  if (getActivePlayerCount() === 1 && !currentRound.isActive) {
    startNewRound();
  }
  
  return true;
}

export function removePlayer(playerId) {
  if (players.has(playerId)) {
    const player = players.get(playerId);
    player.isActive = false; // Set inactive instead of deleting
    console.log(`Player set inactive: ${player.name} (${playerId})`);
    
    // End round if no active players remain
    if (getActivePlayerCount() === 0 && currentRound.isActive) {
      endCurrentRound();
    }
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

export function getActivePlayerCount() {
  return getAllPlayers().filter(player => player.isActive).length;
}

export function canAcceptPlayers() {
  return getActivePlayerCount() < maxPlayers;
}

// Game state functions

export function getGameStateForBroadcast() {
  // Serialize only active players for network transmission
  const activePlayers = getAllPlayers()
    .filter(player => player.isActive)
    .map(player => serializePlayer(player));
  
  // Include weapon pickup data
  const weaponBoxData = getWeaponBoxesForBroadcast();
  
  return {
    players: activePlayers,
    playerCount: getActivePlayerCount(),
    maxPlayers,
    gameStarted,
    weaponBoxes: weaponBoxData,
    round: {
      number: currentRound.number,
      isActive: currentRound.isActive,
      remainingTime: getRemainingTime()
    },
    timestamp: Date.now()
  };
}

export function getLeaderboard() {
  return getAllPlayers()
    .filter(player => player.isActive)
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
  if (player && player.isActive) {
    player.score += points;
    console.log(`🎯 Player ${player.name} awarded ${points} round kill(s). Round score: ${player.score}`);
    return true;
  }
  return false;
}

// Get round performance summary
export function getRoundPerformanceSummary() {
  const activePlayers = getAllPlayers().filter(p => p.isActive);
  const totalKills = activePlayers.reduce((sum, p) => sum + p.score, 0);
  const playersWithKills = activePlayers.filter(p => p.score > 0).length;
  
  return {
    totalPlayers: activePlayers.length,
    playersWithKills,
    totalKills,
    averageKills: activePlayers.length > 0 ? (totalKills / activePlayers.length).toFixed(1) : 0,
    topScore: activePlayers.length > 0 ? Math.max(...activePlayers.map(p => p.score)) : 0
  };
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

// Handle weapon pickup collection
export function handleWeaponPickupCollection(playerId, weaponBoxId) {
  const player = players.get(playerId);
  if (!player) {
    return { success: false, reason: 'Player not found' };
  }
  
  // Check if player already has a weapon
  const playerHasWeapon = player.weapon !== null;
  
  // Attempt to collect the weapon box
  const result = collectWeaponBox(weaponBoxId, playerId, playerHasWeapon);
  
  if (result.success) {
    // Update player weapon state
    player.weapon = result.weapon;
    console.log(`Player ${player.name} collected weapon: ${result.weapon}`);
  }
  
  return result;
}

export function resetGameState() {
  players.clear();
  weaponBoxes.clear();
  gameStarted = false;
  
  // Reset round state
  currentRound = {
    number: 0,
    startTime: null,
    isActive: false
  };
  
  // Clean up weapon box system
  cleanupWeaponBoxes();
  
  console.log('Game state reset');
}

// Round management functions

export function startNewRound() {
  currentRound.number += 1;
  currentRound.startTime = Date.now();
  currentRound.isActive = true;
  
  // Reset all active players' scores
  let resetCount = 0;
  getAllPlayers().forEach(player => {
    if (player.isActive) {
      player.score = 0;
      resetCount++;
    }
  });
  
  console.log(`🎮 Round ${currentRound.number} started with ${getActivePlayerCount()} active players - ${resetCount} scores reset to 0`);
}

export function endCurrentRound() {
  if (!currentRound.isActive) return;
  
  currentRound.isActive = false;
  console.log(`🏁 Round ${currentRound.number} ended`);
  
  // Log round performance and players eligible for rewards
  const roundSummary = getRoundPerformanceSummary();
  const eligiblePlayers = getPlayersEligibleForRewards();
  
  console.log(`📊 Round ${currentRound.number} summary: ${roundSummary.totalKills} total kills by ${roundSummary.playersWithKills}/${roundSummary.totalPlayers} players (avg: ${roundSummary.averageKills}, top: ${roundSummary.topScore})`);
  
  if (eligiblePlayers.length > 0) {
    console.log(`💰 Players eligible for rewards: ${eligiblePlayers.map(p => `${p.name} (${p.score} kills)`).join(', ')}`);
  } else {
    console.log(`💰 No players eligible for rewards this round`);
  }
  
  // TODO: Calculate and distribute rewards in Phase 2.8
}

export function getRemainingTime() {
  if (!currentRound.isActive || !currentRound.startTime) {
    return 0;
  }
  
  const elapsed = Date.now() - currentRound.startTime;
  const remaining = Math.max(0, ROUND_DURATION - elapsed);
  return remaining;
}

export function checkRoundTimer() {
  if (currentRound.isActive && getRemainingTime() <= 0) {
    endCurrentRound();
    
    // Start new round if players are still active
    if (getActivePlayerCount() > 0) {
      startNewRound();
    }
  }
}

export function getCurrentRound() {
  return { ...currentRound };
}

// Get all players eligible for rewards (including inactive players with kills)
export function getPlayersEligibleForRewards() {
  return getAllPlayers()
    .filter(player => player.score > 0) // Anyone with kills gets rewards, regardless of active status
    .sort((a, b) => b.score - a.score)
    .map(player => ({
      id: player.id,
      name: player.name,
      walletAddress: player.walletAddress,
      score: player.score,
      isActive: player.isActive
    }));
}

// Get summary of player states for debugging
export function getPlayerStateSummary() {
  const allPlayers = getAllPlayers();
  const activeCount = allPlayers.filter(p => p.isActive).length;
  const inactiveCount = allPlayers.filter(p => !p.isActive).length;
  const playersWithKills = allPlayers.filter(p => p.score > 0).length;
  
  return {
    total: allPlayers.length,
    active: activeCount,
    inactive: inactiveCount,
    withKills: playersWithKills,
    round: {
      number: currentRound.number,
      isActive: currentRound.isActive,
      remainingTime: getRemainingTime()
    }
  };
}

// Validate round kill tracking system
export function validateRoundKillSystem() {
  const issues = [];
  const allPlayers = getAllPlayers();
  
  // Check if any players have negative scores
  const negativeScores = allPlayers.filter(p => p.score < 0);
  if (negativeScores.length > 0) {
    issues.push(`Players with negative scores: ${negativeScores.map(p => p.name).join(', ')}`);
  }
  
  // Check if inactive players are properly filtered from leaderboard
  const leaderboard = getLeaderboard();
  const inactiveInLeaderboard = leaderboard.filter(p => {
    const player = players.get(p.id);
    return player && !player.isActive;
  });
  if (inactiveInLeaderboard.length > 0) {
    issues.push(`Inactive players in leaderboard: ${inactiveInLeaderboard.map(p => p.name).join(', ')}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    summary: getPlayerStateSummary()
  };
}