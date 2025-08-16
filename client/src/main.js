// Surr Game - Main Entry Point
// This file initializes the game and starts the main game loop

import { Scene } from './game/Scene.js';

console.log('Surr Game - Client Starting...');

// Initialize the game once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing game...');
  
  // Get canvas element
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  try {
    // Initialize Three.js scene
    const scene = new Scene(canvas);
    console.log('Scene initialized successfully');
    
    // Start basic render loop
    function gameLoop() {
      scene.update(0.016); // Approximate 60fps delta time
      scene.render();
      requestAnimationFrame(gameLoop);
    }
    
    // Start the game loop
    gameLoop();
    console.log('Game loop started');
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});
