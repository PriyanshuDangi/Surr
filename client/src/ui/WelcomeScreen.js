// Surr Game - Welcome Screen Functions
// Updated for Web3 Integration: Handle wallet connection and joining game

import { getSocket, isSocketConnected } from '../network/SocketManager.js';
import Web3Manager from '../web3/Web3Manager.js';

// Welcome screen state
let isWelcomeScreenVisible = true;
let walletAddress = '';
let isJoining = false;
let localPlayerId = null;

// Web3 Manager instance
let web3Manager = null;

// DOM elements
let welcomeScreen = null;
let connectWalletButton = null;
let walletAddressDisplay = null;
let walletAddressElement = null;
let joinButton = null;
let connectionInfo = null;
let errorMessage = null;
let successMessage = null;

// Initialize welcome screen
export function initWelcomeScreen() {
  // Initialize Web3Manager
  web3Manager = new Web3Manager();
  
  // Get DOM elements
  welcomeScreen = document.getElementById('welcomeScreen');
  connectWalletButton = document.getElementById('connectWalletButton');
  walletAddressDisplay = document.getElementById('walletAddressDisplay');
  walletAddressElement = document.getElementById('walletAddress');
  joinButton = document.getElementById('joinGameButton');
  connectionInfo = document.getElementById('connectionInfo');
  errorMessage = document.getElementById('joinErrorMessage');
  successMessage = document.getElementById('joinSuccessMessage');

  if (!welcomeScreen || !connectWalletButton || !joinButton) {
    console.error('Welcome screen elements not found');
    return false;
  }

  // Set up event listeners
  setupEventListeners();
  
  // Check for existing wallet connection
  checkExistingConnection();
  
  // Update UI based on connection status
  updateConnectionStatus();
  
  console.log('Welcome screen initialized with Web3 support');
  return true;
}

// Set up event listeners
function setupEventListeners() {
  // Connect wallet button click
  connectWalletButton.addEventListener('click', handleConnectWallet);
  
  // Join button click
  joinButton.addEventListener('click', handleJoinGame);
}

// Check for existing wallet connection
async function checkExistingConnection() {
  try {
    const existingAccount = await web3Manager.checkConnection();
    if (existingAccount) {
      handleWalletConnected(existingAccount);
    }
  } catch (error) {
    console.error('Error checking existing connection:', error);
  }
}

// Handle connect wallet button click
async function handleConnectWallet() {
  if (connectWalletButton.disabled) {
    return;
  }
  
  console.log('Attempting to connect wallet...');
  
  // Set connecting state
  connectWalletButton.disabled = true;
  connectWalletButton.textContent = '🔄 Connecting...';
  
  // Clear previous messages
  hideMessage(errorMessage);
  hideMessage(successMessage);
  
  try {
    const account = await web3Manager.connectWallet();
    handleWalletConnected(account);
  } catch (error) {
    handleWalletError(error.message);
  }
}

// Handle successful wallet connection
function handleWalletConnected(account) {
  walletAddress = account;
  
  // Update UI
  connectWalletButton.style.display = 'none';
  walletAddressDisplay.classList.remove('hidden');
  walletAddressElement.textContent = formatAddress(account);
  
  // Update join button state
  updateJoinButtonState();
  
  console.log('Wallet connected successfully:', account);
  showMessage(successMessage, 'Wallet connected successfully!');
}

// Handle wallet connection errors
function handleWalletError(message) {
  console.error('Wallet connection error:', message);
  
  // Reset button state
  connectWalletButton.disabled = false;
  
  // Check if this is a MetaMask installation issue
  if (message.includes('MetaMask is required to play this game') || 
      !Web3Manager.isMetaMaskInstalled()) {
    
    // Show install guidance
    const guidance = web3Manager.getInstallationGuidance();
    
    // Show simple message
    showMessage(errorMessage, guidance);
    
  } else {
    // Show error message
    showMessage(errorMessage, message);
  }
  
  // Reset button text for all cases
  connectWalletButton.textContent = '🦊 Connect MetaMask';
}

// Format wallet address for display (first 6 + last 4 characters)
function formatAddress(address) {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Update join button state based on wallet and connection status
function updateJoinButtonState() {
  const isWalletConnected = web3Manager && web3Manager.isConnected();
  const canJoin = isWalletConnected && isSocketConnected() && !isJoining;
  
  joinButton.disabled = !canJoin;
  
  // Update button text based on state
  if (isJoining) {
    joinButton.textContent = 'Joining...';
  } else if (!isSocketConnected()) {
    joinButton.textContent = 'Connecting to Server...';
  } else if (!isWalletConnected) {
    joinButton.textContent = 'Connect Wallet First';
  } else {
    joinButton.textContent = 'Join Game';
  }
}

// Handle join game button click
function handleJoinGame() {
  const isWalletConnected = web3Manager && web3Manager.isConnected();
  
  if (isJoining || !isSocketConnected() || !isWalletConnected) {
    return;
  }
  
  console.log(`Attempting to join game with wallet: ${walletAddress}`);
  
  // Set joining state
  isJoining = true;
  joinButton.disabled = true;
  joinButton.textContent = 'Joining...';
  connectWalletButton.disabled = true;
  
  // Clear previous messages
  hideMessage(errorMessage);
  hideMessage(successMessage);
  
  // Send join request to server with wallet address
  const socket = getSocket();
  if (socket) {
    socket.emit('joinGame', { 
      walletAddress: walletAddress,
      playerName: formatAddress(walletAddress) // Use formatted address as display name
    });
    
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
  connectWalletButton.disabled = false;
  
  // Update UI
  showMessage(errorMessage, message);
  updateJoinButtonState(); // Revalidate
}

// Update connection status display
export function updateConnectionStatus() {
  if (!connectionInfo) return;
  
  if (isSocketConnected()) {
    hideMessage(connectionInfo);
    
    // Update join button state if we have elements initialized
    if (joinButton && !isJoining) {
      updateJoinButtonState();
    }
  } else {
    showMessage(connectionInfo, 'Connecting to server...');
    
    // Disable join button when not connected
    if (joinButton) {
      updateJoinButtonState();
    }
  }
}

// Show welcome screen
export function showWelcomeScreen() {
  if (welcomeScreen) {
    welcomeScreen.classList.remove('hidden');
    isWelcomeScreenVisible = true;
    
    // Update button states
    updateJoinButtonState();
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

// Get connected wallet address (replaces getPlayerName)
export function getWalletAddress() {
  return walletAddress;
}

// Get formatted wallet address for display (replaces getPlayerName for compatibility)
export function getPlayerName() {
  return walletAddress ? formatAddress(walletAddress) : '';
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
  
  if (connectWalletButton) {
    connectWalletButton.disabled = false;
  }
  
  showMessage(errorMessage, 'Disconnected from server. Please try again.');
  updateConnectionStatus();
  showWelcomeScreen();
}
