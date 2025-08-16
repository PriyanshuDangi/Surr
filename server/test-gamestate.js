// Test script for GameState functionality
// Run this with: node test-gamestate.js

import { getGameState } from './src/game/GameState.js';

console.log('=== GameState Test Script ===\n');

// Get game state instance
const gameState = getGameState();

console.log('1. Testing player addition:');
console.log('Adding Player1:', gameState.addPlayer('test1', 'Player1'));
console.log('Adding Player2:', gameState.addPlayer('test2', 'Player2'));
console.log('Adding duplicate Player1:', gameState.addPlayer('test1', 'Player1')); // Should fail

console.log('\n2. Current player count:', gameState.getPlayerCount());
console.log('Can accept more players:', gameState.canAcceptPlayers());

console.log('\n3. Testing position update:');
console.log('Update Player1 position:', gameState.updatePlayerPosition('test1', {x: 10, y: 0, z: 5}, {x: 0, y: 1.5, z: 0}));

console.log('\n4. Testing point system:');
gameState.awardPoints('test1', 5);
gameState.awardPoints('test2', 3);

console.log('\n5. Current leaderboard:');
console.log(JSON.stringify(gameState.getLeaderboard(), null, 2));

console.log('\n6. Game state for broadcast:');
console.log(JSON.stringify(gameState.getGameStateForBroadcast(), null, 2));

console.log('\n7. Testing player removal:');
console.log('Remove Player1:', gameState.removePlayer('test1'));
console.log('Final player count:', gameState.getPlayerCount());

console.log('\n=== Test Complete ===');
