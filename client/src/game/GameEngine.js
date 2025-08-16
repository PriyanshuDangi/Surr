// Surr Game - Game Engine
// Function-based game controller that manages the game loop and coordination

import { initScene, updateScene, renderScene, disposeScene } from './Scene.js';
import { initWebSocket, isSocketConnected } from '../network/SocketManager.js';
import Stats from 'stats.js';

// Game state
let canvas = null;
let isRunning = false;
let lastTime = 0;
let deltaTime = 0;
let stats = null;

// Initialize the game engine
export async function initGameEngine() {
  try {
    console.log('Initializing game engine...');
    
    // Get canvas element
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Setup Stats.js
    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.left = '0px';
    stats.dom.style.zIndex = '1001';
    document.body.appendChild(stats.dom);

    // Initialize scene
    initScene(canvas);

    // Initialize websocket
    initWebSocket();
    
    // Setup game loop
    setupGameLoop();
    
    console.log('Game engine initialization complete');
    return true;
  } catch (error) {
    console.error('Failed to initialize game engine:', error);
    return false;
  }
}

// Set up the main game loop
function setupGameLoop() {
  lastTime = performance.now();
  isRunning = true;
  
  gameLoop();
  console.log('Game loop started');
}

// Main game loop
function gameLoop(currentTime = performance.now()) {
  if (!isRunning) return;

  stats.begin();

  deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  updateScene(deltaTime);
  renderScene();

  stats.end();
  requestAnimationFrame(gameLoop);
}

// Start the game engine
export function startGameEngine() {
  if (!isRunning) {
    console.log('Starting game engine...');
    setupGameLoop();
  }
}

// Stop the game engine
export function stopGameEngine() {
  console.log('Stopping game engine...');
  isRunning = false;
}

// Setup visibility change handling
export function setupVisibilityHandling() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('Pausing game engine...');
      isRunning = false;
    } else {
      console.log('Resuming game engine...');
      lastTime = performance.now();
      isRunning = true;
      gameLoop();
    }
  });
}

// Cleanup and dispose resources
export function disposeGameEngine() {
  console.log('Disposing game engine...');
  stopGameEngine();
  
  disposeScene();

  if (stats && stats.dom && stats.dom.parentNode) {
    stats.dom.parentNode.removeChild(stats.dom);
  }
}

// Get debug information
export function getDebugInfo() {
  return {
    deltaTime,
    isRunning,
    socketConnected: isSocketConnected()
  };
}