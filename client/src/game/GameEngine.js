// Surr Game - Game Engine
// Main game controller that manages the game loop, initialization, and coordination between systems

import { Scene } from './Scene.js';
import { initWebSocket, getSocket, isSocketConnected } from '../network/SocketManager.js';
import Stats from 'stats.js';

export class GameEngine {
  constructor() {
    this.canvas = null;
    this.scene = null;
    this.isRunning = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // Performance monitoring with Stats.js
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    
    console.log('GameEngine initialized');
  }

  // Initialize the game engine
  async init() {
    try {
      console.log('Initializing game engine...');
      
      // Get canvas element
      this.canvas = document.getElementById('gameCanvas');
      if (!this.canvas) {
        throw new Error('Canvas element not found');
      }

      // Add Stats.js to the page
      this.stats.dom.style.position = 'absolute';
      this.stats.dom.style.top = '0px';
      this.stats.dom.style.left = '0px';
      this.stats.dom.style.zIndex = '1001';
      document.body.appendChild(this.stats.dom);

      // Initialize scene
      this.scene = new Scene(this.canvas);

      // Initialize websocket
      initWebSocket();
      
      // Setup game loop
      this.setupGameLoop();
      
      console.log('Game engine initialization complete');
      return true;
    } catch (error) {
      console.error('Failed to initialize game engine:', error);
      return false;
    }
  }

  // Set up the main game loop
  setupGameLoop() {
    this.lastTime = performance.now();
    this.isRunning = true;
    
    // Start the game loop
    this.gameLoop();
    console.log('Game loop started');
  }



  // Main game loop using requestAnimationFrame
  gameLoop = (currentTime = performance.now()) => {
    if (!this.isRunning) return;

    // Stats.js begin frame measurement
    this.stats.begin();

    // Calculate delta time
    this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update game systems
    this.update(this.deltaTime);

    // Render the scene
    this.render();

    // Stats.js end frame measurement
    this.stats.end();

    // Continue the loop
    requestAnimationFrame(this.gameLoop);
  }

  // Update all game systems
  update(deltaTime) {
    // Update scene animations
    if (this.scene) {
      this.scene.update(deltaTime);
    }

    // Future: Update physics, players, weapons, etc.
    // These will be implemented in later phases
  }

  // Render the current frame
  render() {
    if (this.scene) {
      this.scene.render();
    }
  }



  // Start the game engine
  start() {
    if (!this.isRunning) {
      console.log('Starting game engine...');
      this.setupGameLoop();
    }
  }

  // Stop the game engine
  stop() {
    console.log('Stopping game engine...');
    this.isRunning = false;
  }

  // Resume the game engine
  resume() {
    if (!this.isRunning) {
      console.log('Resuming game engine...');
      this.lastTime = performance.now();
      this.isRunning = true;
      this.gameLoop();
    }
  }

  // Pause the game engine
  pause() {
    console.log('Pausing game engine...');
    this.isRunning = false;
  }



  // Get delta time
  getDeltaTime() {
    return this.deltaTime;
  }

  // Get scene reference
  getScene() {
    return this.scene;
  }

  // Handle window focus/blur for performance
  handleVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  // Setup visibility change handling
  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }



  // Cleanup and dispose resources
  dispose() {
    console.log('Disposing game engine...');
    this.stop();
    
    if (this.scene) {
      this.scene.dispose();
    }



    // Remove Stats.js display
    if (this.stats && this.stats.dom && this.stats.dom.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
    }

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // Debug information
  getDebugInfo() {
    return {
      deltaTime: this.deltaTime,
      isRunning: this.isRunning,
      socketConnected: isSocketConnected()
    };
  }
}
