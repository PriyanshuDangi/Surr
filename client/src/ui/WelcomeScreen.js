// Surr Game - Welcome Screen Functions
// Step 5.4: Handle player name entry and joining game

import { getSocket, isSocketConnected } from '../network/SocketManager.js';

// Welcome screen state
let isWelcomeScreenVisible = true;
let playerName = '';
let isJoining = false;
let localPlayerId = null;

// DOM elements
let welcomeScreen = null;
let nameInput = null;
let joinButton = null;
let connectionInfo = null;
let errorMessage = null;
let successMessage = null;

// Initialize welcome screen
export function initWelcomeScreen() {
  // Get DOM elements
  welcomeScreen = document.getElementById('welcomeScreen');
  nameInput = document.getElementById('playerNameInput');
  joinButton = document.getElementById('joinGameButton');
  connectionInfo = document.getElementById('connectionInfo');
  errorMessage = document.getElementById('joinErrorMessage');
  successMessage = document.getElementById('joinSuccessMessage');

  if (!welcomeScreen || !nameInput || !joinButton) {
    console.error('Welcome screen elements not found');
    return false;
  }

  // Set up event listeners
  setupEventListeners();
  
  // Update UI based on connection status
  updateConnectionStatus();
  
  console.log('Welcome screen initialized');
  return true;
}

// Set up event listeners
function setupEventListeners() {
  // Name input validation
  nameInput.addEventListener('input', handleNameInput);
  nameInput.addEventListener('keypress', handleKeyPress);
  
  // Join button click
  joinButton.addEventListener('click', handleJoinGame);
  
  // Focus name input
  nameInput.focus();
}

// Handle name input changes
function handleNameInput(event) {
  const value = event.target.value.trim();
  playerName = value;
  
  // Validate name and update button state
  const isValidName = value.length >= 2 && value.length <= 16;
  const canJoin = isValidName && isSocketConnected() && !isJoining;
  
  joinButton.disabled = !canJoin;
  
  // Update button text based on state
  if (isJoining) {
    joinButton.textContent = 'Joining...';
  } else if (!isSocketConnected()) {
    joinButton.textContent = 'Connecting...';
  } else if (!isValidName) {
    joinButton.textContent = 'Enter Name (2-16 chars)';
  } else {
    joinButton.textContent = 'Join Game';
  }
  
  // Clear previous messages
  hideMessage(errorMessage);
  hideMessage(successMessage);
}

// Handle key press in name input
function handleKeyPress(event) {
  if (event.key === 'Enter' && !joinButton.disabled) {
    handleJoinGame();
  }
}

// Handle join game button click
function handleJoinGame() {
  if (isJoining || !isSocketConnected() || playerName.length < 2) {
    return;
  }
  
  console.log(`Attempting to join game with name: ${playerName}`);
  
  // Set joining state
  isJoining = true;
  joinButton.disabled = true;
  joinButton.textContent = 'Joining...';
  nameInput.disabled = true;
  
  // Clear previous messages
  hideMessage(errorMessage);
  hideMessage(successMessage);
  
  // Send join request to server
  const socket = getSocket();
  if (socket) {
    socket.emit('joinGame', { playerName: playerName });
    
    // Set up response listeners
    setupJoinResponseListeners(socket);
  } else {
    handleJoinError('Connection lost. Please refresh and try again.');
  }
}

// Set up listeners for join response
function setupJoinResponseListeners(socket) {
  // Listen for join response (one-time listener)
  socket.once('joinGameResponse', handleJoinResponse);
  
  // Timeout after 10 seconds
  setTimeout(() => {
    if (isJoining) {
      handleJoinError('Join request timed out. Please try again.');
    }
  }, 10000);
}

// Handle join response from server
function handleJoinResponse(response) {
  console.log('Join response received:', response);
  
  if (response.success) {
    // Store local player ID for identification
    localPlayerId = response.playerId;
    
    // Successful join
    showMessage(successMessage, response.message || 'Successfully joined game!');
    
    // Hide welcome screen after a short delay
    setTimeout(() => {
      hideWelcomeScreen();
    }, 1500);
    
  } else {
    // Join failed
    handleJoinError(response.message || 'Failed to join game. Please try again.');
  }
}

// Handle join errors
function handleJoinError(message) {
  console.error('Join error:', message);
  
  // Reset joining state
  isJoining = false;
  nameInput.disabled = false;
  
  // Update UI
  showMessage(errorMessage, message);
  handleNameInput({ target: nameInput }); // Revalidate
}

// Update connection status display
export function updateConnectionStatus() {
  if (!connectionInfo) return;
  
  if (isSocketConnected()) {
    hideMessage(connectionInfo);
    
    // Enable name input if we have a valid name
    if (nameInput && !isJoining) {
      handleNameInput({ target: nameInput });
    }
  } else {
    showMessage(connectionInfo, 'Connecting to server...');
    
    // Disable join button when not connected
    if (joinButton) {
      joinButton.disabled = true;
      joinButton.textContent = 'Connecting...';
    }
  }
}

// Show welcome screen
export function showWelcomeScreen() {
  if (welcomeScreen) {
    welcomeScreen.classList.remove('hidden');
    isWelcomeScreenVisible = true;
    
    // Focus name input
    if (nameInput) {
      nameInput.focus();
    }
  }
}

// Hide welcome screen
export function hideWelcomeScreen() {
  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden');
    isWelcomeScreenVisible = false;
    console.log('Welcome screen hidden - entering game');
  }
}

// Check if welcome screen is visible
export function isWelcomeScreenShown() {
  return isWelcomeScreenVisible;
}

// Get entered player name
export function getPlayerName() {
  return playerName;
}

// Get local player ID (assigned by server)
export function getLocalPlayerId() {
  return localPlayerId;
}

// Utility functions for message display
function showMessage(element, message) {
  if (element) {
    element.textContent = message;
    element.classList.remove('hidden');
  }
}

function hideMessage(element) {
  if (element) {
    element.classList.add('hidden');
  }
}

// Handle disconnection - show welcome screen again
export function handleDisconnection() {
  isJoining = false;
  
  if (nameInput) {
    nameInput.disabled = false;
  }
  
  showMessage(errorMessage, 'Disconnected from server. Please try again.');
  updateConnectionStatus();
  showWelcomeScreen();
}
