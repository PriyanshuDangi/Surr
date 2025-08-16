// Surr Game - Game State Manager
// Function-based game state management

import { createPlayer, validatePlayerPosition, validatePlayerRotation, serializePlayer, validateWeapon } from './Player.js';
import { initWeaponBoxes, getWeaponBoxesForBroadcast, collectWeaponBox, cleanup as cleanupWeaponBoxes } from './WeaponBox.js';
import TokenMintService from '../web3/TokenMintService.js';
import FLOW_CONFIG from '../config/flow.js';

// Game state
let players = new Map();
let weaponBoxes = new Map();
let gameStarted = false;
const maxPlayers = 6;

// Round management
const ROUND_DURATION = FLOW_CONFIG.ROUND_DURATION; // 3 minutes in milliseconds
let currentRound = {
  number: 0,
  startTime: null,
  isActive: false
};

// Reward distribution system
let tokenMintService = null;
let rewardDistributionHistory = [];

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
  
  // Initialize token minting service
  if (!tokenMintService) {
    tokenMintService = new TokenMintService();
    console.log('TokenMintService instance created for reward distribution');
  }
  
  // Initialize weapon pickup system
  initWeaponBoxes();
  
  console.log('GameState initialized with weapon pickup system and reward distribution');
}

// Player management functions

export function addPlayer(playerId, playerName, walletAddress = null) {
  if (getActivePlayerCount() >= maxPlayers) {
    console.log(`Cannot add player ${playerName}: Game is full`);
    return { success: false, reason: 'Game is full' };
  }

  let isNewPlayer = false;
  let roundEvent = null;

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
  } else {
    // Create new player - always start with score 0, regardless of round state
    const player = createPlayer(playerId, playerName, walletAddress);
    player.score = 0; // Explicitly ensure new players start with 0 score
    players.set(playerId, player);
    isNewPlayer = true;
    
    if (currentRound.isActive) {
      console.log(`New player added mid-round: ${playerName} (${playerId}) - starting with 0 score, can earn rewards`);
    } else {
      console.log(`Player added: ${playerName} (${playerId})${walletAddress ? ` with wallet ${walletAddress}` : ''}`);
    }
  }
  
  // Start round if this is the first active player
  if (getActivePlayerCount() === 1 && !currentRound.isActive) {
    roundEvent = startNewRound();
  }
  
  // Get complete round state for new player synchronization
  const roundState = {
    round: {
      number: currentRound.number,
      isActive: currentRound.isActive,
      remainingTime: getRemainingTime(),
      startTime: currentRound.startTime
    },
    playerJoinedMidRound: currentRound.isActive && isNewPlayer,
    canEarnRewards: true, // Players can always earn rewards, even joining mid-round
    gameState: getGameStateForBroadcast()
  };
  
  return { 
    success: true, 
    roundEvent,
    roundState,
    isNewPlayer,
    joinedMidRound: currentRound.isActive && isNewPlayer
  };
}

export function removePlayer(playerId) {
  if (players.has(playerId)) {
    const player = players.get(playerId);
    player.isActive = false; // Set inactive instead of deleting
    console.log(`Player set inactive: ${player.name} (${playerId})`);
    
    // End round if no active players remain
    if (getActivePlayerCount() === 0 && currentRound.isActive) {
      endCurrentRound().then(events => {
        // Events will be handled by the server tick system
        console.log(`Round ended with ${events.length} events`);
      }).catch(error => {
        console.error('Error ending round:', error);
      });
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
  
  // Return round start event data for broadcasting
  return {
    type: 'roundStarted',
    roundNumber: currentRound.number,
    playerCount: getActivePlayerCount(),
    message: `Round ${currentRound.number} has started!`
  };
}

export async function endCurrentRound() {
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
  
  // Calculate and distribute rewards
  const rewardResult = await calculateAndDistributeRoundRewards();
  
  // Clear all player scores after reward distribution
  clearAllPlayerScores();
  
  // Create events array to return multiple events
  const events = [];
  
  // Add round end event
  events.push({
    type: 'roundEnded',
    roundNumber: currentRound.number,
    summary: roundSummary,
    eligiblePlayers: eligiblePlayers.length,
    message: eligiblePlayers.length > 0 
      ? `Round ${currentRound.number} ended! ${eligiblePlayers.length} players earned rewards.`
      : `Round ${currentRound.number} ended. No rewards earned this round.`
  });
  
  // Add reward events for successful distributions
  if (rewardResult && rewardResult.distribution.successful.length > 0) {
    events.push({
      type: 'roundRewards',
      roundNumber: currentRound.number,
      rewards: rewardResult.distribution.successful.map(reward => ({
        playerId: reward.playerId,
        playerName: reward.playerName,
        walletAddress: reward.walletAddress,
        roundKills: reward.kills,
        tokensEarned: reward.tokensToMint,
        transactionHash: reward.transactionHash,
        blockNumber: reward.blockNumber
      })),
      summary: {
        totalPlayers: rewardResult.summary.successfulDistributions,
        totalTokens: rewardResult.summary.totalTokensDistributed,
        totalKills: rewardResult.summary.totalKills
      }
    });
  }
  
  return events;
}

export function getRemainingTime() {
  if (!currentRound.isActive || !currentRound.startTime) {
    return 0;
  }
  
  const elapsed = Date.now() - currentRound.startTime;
  const remaining = Math.max(0, ROUND_DURATION - elapsed);
  return remaining;
}

export async function checkRoundTimer() {
  const events = [];
  
  if (currentRound.isActive && getRemainingTime() <= 0) {
    try {
      const endEvents = await endCurrentRound();
      if (endEvents && Array.isArray(endEvents)) {
        events.push(...endEvents);
      }
      
      // Start new round if players are still active
      if (getActivePlayerCount() > 0) {
        const startEvent = startNewRound();
        if (startEvent) events.push(startEvent);
      }
    } catch (error) {
      console.error('Error in round timer:', error);
    }
  }
  
  return events;
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

// Step 2.10: Get complete round synchronization data for joining players
export function getRoundSynchronizationData() {
  const roundState = {
    round: {
      number: currentRound.number,
      isActive: currentRound.isActive,
      remainingTime: getRemainingTime(),
      startTime: currentRound.startTime,
      duration: ROUND_DURATION
    },
    gameState: getGameStateForBroadcast(),
    playerCount: getActivePlayerCount(),
    roundSummary: currentRound.isActive ? null : getRoundPerformanceSummary(),
    status: currentRound.isActive ? 'round-in-progress' : 'waiting-for-players'
  };
  
  return roundState;
}

// Step 2.10: Handle edge case when players join during round transition
export function isRoundTransitioning() {
  // Check if we're in the brief moment between round end and start
  const remainingTime = getRemainingTime();
  return currentRound.isActive && remainingTime <= 100; // Last 100ms of round
}

// Step 2.10: Get appropriate UI state message for joining players
export function getJoinMessage(joinedMidRound, roundState) {
  if (!roundState.round.isActive) {
    return {
      type: 'waiting',
      message: 'Waiting for round to start...',
      canPlay: true
    };
  }
  
  if (joinedMidRound) {
    const remainingMinutes = Math.ceil(roundState.round.remainingTime / 60000);
    return {
      type: 'mid-round-join',
      message: `Joined Round ${roundState.round.number} in progress! ${remainingMinutes}min remaining. You can still earn rewards!`,
      canPlay: true,
      earnRewards: true
    };
  }
  
  return {
    type: 'round-active',
    message: `Round ${roundState.round.number} in progress`,
    canPlay: true,
    earnRewards: true
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

// Reward Distribution System Functions

/**
 * Calculate round rewards for all eligible players
 * @returns {Array} Array of reward calculations
 */
export function calculateRoundRewards() {
  const eligiblePlayers = getPlayersEligibleForRewards();
  const rewardCalculations = [];
  
  console.log(`🧮 Calculating rewards for ${eligiblePlayers.length} eligible players...`);
  
  for (const player of eligiblePlayers) {
    if (!player.walletAddress) {
      console.warn(`⚠️  Player ${player.name} has no wallet address - skipping reward`);
      continue;
    }
    
    const tokensToMint = player.score * FLOW_CONFIG.REWARD_RATE;
    
    rewardCalculations.push({
      playerId: player.id,
      playerName: player.name,
      walletAddress: player.walletAddress,
      kills: player.score,
      tokensToMint,
      isActive: player.isActive
    });
    
    console.log(`💰 ${player.name}: ${player.score} kills × ${FLOW_CONFIG.REWARD_RATE} = ${tokensToMint} SURR tokens`);
  }
  
  return rewardCalculations;
}

/**
 * Distribute rewards to players using TokenMintService
 * @param {Array} rewardCalculations - Array of reward calculations
 * @returns {Object} Distribution results
 */
export async function distributeRewards(rewardCalculations) {
  if (!tokenMintService) {
    console.error('❌ TokenMintService not initialized');
    return { successful: [], failed: rewardCalculations.map(r => ({ ...r, error: 'Service not initialized' })) };
  }
  
  if (rewardCalculations.length === 0) {
    console.log('💰 No rewards to distribute this round');
    return { successful: [], failed: [] };
  }
  
  console.log(`🚀 Starting reward distribution for ${rewardCalculations.length} players...`);
  
  // Prepare batch mint requests
  const mintRequests = rewardCalculations.map(reward => ({
    address: reward.walletAddress,
    amount: reward.tokensToMint
  }));
  
  try {
    // Use batch minting for efficiency
    const batchResult = await tokenMintService.batchMintTokens(mintRequests);
    
    // Map results back to player information
    const successful = batchResult.successful.map((result, index) => ({
      ...rewardCalculations.find(r => r.walletAddress === result.recipient),
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed,
      blockNumber: result.blockNumber
    }));
    
    const failed = batchResult.failed.map(failure => {
      const reward = rewardCalculations.find(r => r.walletAddress === failure.address);
      return {
        ...reward,
        error: failure.error
      };
    });
    
    // Log distribution summary
    console.log(`🏁 Reward distribution completed:`);
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      const totalTokens = successful.reduce((sum, r) => sum + r.tokensToMint, 0);
      console.log(`   💰 Total tokens distributed: ${totalTokens} SURR`);
    }
    
    return { successful, failed };
    
  } catch (error) {
    console.error('❌ Batch reward distribution failed:', error.message);
    return { 
      successful: [], 
      failed: rewardCalculations.map(r => ({ ...r, error: error.message }))
    };
  }
}

/**
 * Calculate and distribute round rewards (main function)
 * @returns {Object} Complete reward distribution results
 */
export async function calculateAndDistributeRoundRewards() {
  const roundNumber = currentRound.number;
  const timestamp = Date.now();
  
  console.log(`💰 Starting reward calculation and distribution for Round ${roundNumber}...`);
  
  // Calculate rewards
  const rewardCalculations = calculateRoundRewards();
  
  if (rewardCalculations.length === 0) {
    const result = {
      roundNumber,
      timestamp,
      calculations: [],
      distribution: { successful: [], failed: [] },
      summary: {
        totalPlayers: 0,
        totalKills: 0,
        totalTokensDistributed: 0,
        successfulDistributions: 0,
        failedDistributions: 0
      }
    };
    
    rewardDistributionHistory.push(result);
    return result;
  }
  
  // Distribute rewards
  const distribution = await distributeRewards(rewardCalculations);
  
  // Calculate summary
  const totalKills = rewardCalculations.reduce((sum, r) => sum + r.kills, 0);
  const totalTokensDistributed = distribution.successful.reduce((sum, r) => sum + r.tokensToMint, 0);
  
  const result = {
    roundNumber,
    timestamp,
    calculations: rewardCalculations,
    distribution,
    summary: {
      totalPlayers: rewardCalculations.length,
      totalKills,
      totalTokensDistributed,
      successfulDistributions: distribution.successful.length,
      failedDistributions: distribution.failed.length
    }
  };
  
  // Store in history
  rewardDistributionHistory.push(result);
  
  // Log final summary
  console.log(`🎯 Round ${roundNumber} reward summary:`);
  console.log(`   👥 Players: ${result.summary.totalPlayers}`);
  console.log(`   🔫 Kills: ${result.summary.totalKills}`);
  console.log(`   💰 Tokens distributed: ${result.summary.totalTokensDistributed} SURR`);
  console.log(`   ✅ Successful: ${result.summary.successfulDistributions}`);
  console.log(`   ❌ Failed: ${result.summary.failedDistributions}`);
  
  return result;
}

/**
 * Clear all player scores after reward distribution
 */
export function clearAllPlayerScores() {
  let clearedCount = 0;
  getAllPlayers().forEach(player => {
    if (player.score > 0) {
      player.score = 0;
      clearedCount++;
    }
  });
  
  console.log(`🧹 Cleared scores for ${clearedCount} players after reward distribution`);
}

/**
 * Get reward distribution history
 * @param {number} limit - Number of recent rounds to return
 * @returns {Array} Array of reward distribution results
 */
export function getRewardDistributionHistory(limit = 10) {
  return rewardDistributionHistory.slice(-limit);
}

/**
 * Get reward system status
 * @returns {Object} Current status of reward system
 */
export function getRewardSystemStatus() {
  return {
    tokenMintService: {
      initialized: tokenMintService !== null,
      status: tokenMintService ? tokenMintService.getStatus() : null
    },
    config: {
      rewardRate: FLOW_CONFIG.REWARD_RATE,
      roundDuration: FLOW_CONFIG.ROUND_DURATION,
      minPlayersForRound: FLOW_CONFIG.MIN_PLAYERS_FOR_ROUND
    },
    history: {
      totalRounds: rewardDistributionHistory.length,
      recentRounds: getRewardDistributionHistory(5)
    }
  };
}