// Step 2.9: Reward Notification Integration
// Connects socket events to reward notifications

import { setRewardNotificationCallback } from '../network/SocketManager.js';
import { showRewardNotification } from './Notifications.js';

// Initialize reward notification integration
export function initRewardNotifications() {
  console.log('🎉 Initializing reward notification integration...');
  
  // Set up callback to handle reward events from server
  setRewardNotificationCallback(handleRewardEvent);
  
  console.log('✅ Reward notification integration initialized');
}

// Handle reward events from server
function handleRewardEvent(rewardEventData) {
  console.log('🎯 Processing reward event:', rewardEventData);
  
  const { rewards, summary, roundNumber } = rewardEventData;
  
  if (!rewards || rewards.length === 0) {
    console.log('No rewards to display for this round');
    return;
  }
  
  // Get current player ID (this would need to be set when player joins)
  const currentPlayerId = getCurrentPlayerId();
  
  // Find rewards for current player
  const playerRewards = rewards.filter(reward => 
    reward.playerId === currentPlayerId || 
    reward.walletAddress === getCurrentPlayerWallet()
  );
  
  if (playerRewards.length === 0) {
    console.log('No rewards for current player');
    return;
  }
  
  // Show notification for each reward (usually just one per player)
  playerRewards.forEach(reward => {
    showRewardNotification({
      tokensEarned: reward.tokensEarned,
      roundKills: reward.roundKills,
      transactionHash: reward.transactionHash,
      playerName: reward.playerName,
      roundNumber: roundNumber
    });
    
    console.log(`🎉 Displaying reward notification: ${reward.tokensEarned} SURR for ${reward.roundKills} kills`);
  });
}

// Get current player ID (this should be integrated with actual player management)
function getCurrentPlayerId() {
  // This would be set when the player joins the game
  // For now, return a placeholder
  return window.currentPlayerId || null;
}

// Get current player wallet address
function getCurrentPlayerWallet() {
  // This would be set when the player connects their wallet
  // For now, return a placeholder
  return window.currentPlayerWallet || null;
}

// Set current player ID (to be called when player joins)
export function setCurrentPlayerId(playerId) {
  window.currentPlayerId = playerId;
  console.log(`🎮 Current player ID set: ${playerId}`);
}

// Set current player wallet (to be called when wallet connects)
export function setCurrentPlayerWallet(walletAddress) {
  window.currentPlayerWallet = walletAddress;
  console.log(`💰 Current player wallet set: ${walletAddress}`);
}

// Test function to simulate reward notification
export function testRewardNotification() {
  const testRewardData = {
    tokensEarned: 250,
    roundKills: 3,
    transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
    playerName: 'Test Player',
    roundNumber: 1
  };
  
  console.log('🧪 Testing reward notification...');
  showRewardNotification(testRewardData);
}
