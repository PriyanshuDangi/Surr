// Surr Game - Main Entry Point
// This file initializes the game and starts the main game loop

import { GameEngine } from './game/GameEngine.js';

console.log('Surr Game - Client Starting...');

// Initialize the game once DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing game...');
  
  try {
    // Initialize Game Engine
    const gameEngine = new GameEngine();
    const success = await gameEngine.init();
    
    if (success) {
      console.log('Game engine initialized successfully');
      // Setup visibility change handling for performance
      gameEngine.setupVisibilityHandling();
    } else {
      console.error('Failed to initialize game engine');
    }
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});
