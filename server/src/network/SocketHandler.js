// Surr Game - Socket Handler
// Manages all Socket.IO events and communication with clients

import { getGameState } from '../game/GameState.js';

export class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedClients = new Map();
    this.gameState = getGameState();
    console.log('SocketHandler initialized');
  }

  // Initialize socket event handlers
  handleConnection(socket) {
    console.log(`Client connected: ${socket.id}`);
    
    // Store client connection
    this.connectedClients.set(socket.id, {
      socket: socket,
      connected: true,
      playerName: null
    });

    // Send connection confirmation
    this.handleConnectionConfirmation(socket);
    
    // Set up event listeners
    this.setupEventListeners(socket);
  }

  // Handle connection confirmation
  handleConnectionConfirmation(socket) {
    socket.emit('connected', { 
      message: 'Connected to Surr Game Server', 
      clientId: socket.id 
    });
  }

  // Set up all socket event listeners
  setupEventListeners(socket) {
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
    
    // Handle join game requests
    socket.on('joinGame', (data) => {
      this.handleJoinGame(socket, data);
    });

    // Placeholder for future events
    // These will be implemented in later phases:
    // - playerPosition
    // - missileHit
    // - weaponboxCollected
  }

  // Handle player disconnection
  handleDisconnection(socket, reason) {
    console.log(`Client disconnected: ${socket.id} - Reason: ${reason}`);
    
    // Remove from game state
    this.gameState.removePlayer(socket.id);
    
    // Remove from connected clients
    this.connectedClients.delete(socket.id);
    
    // Broadcast updated game state to remaining clients
    this.broadcastGameState();
  }

  // Handle join game requests
  handleJoinGame(socket, data) {
    const playerName = data?.playerName || 'Unknown';
    console.log(`Player attempting to join: ${playerName}`);
    
    // Check if game can accept more players
    if (!this.gameState.canAcceptPlayers()) {
      socket.emit('joinGameResponse', {
        success: false,
        message: 'Game is full. Maximum 6 players allowed.',
        playerId: null
      });
      return;
    }
    
    // Add player to game state
    const success = this.gameState.addPlayer(socket.id, playerName);
    
    if (success) {
      // Update client info
      const clientInfo = this.connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.playerName = playerName;
      }
      
      // Acknowledge successful join
      socket.emit('joinGameResponse', {
        success: true,
        message: `Welcome ${playerName}!`,
        playerId: socket.id,
        playerCount: this.gameState.getPlayerCount(),
        maxPlayers: this.gameState.maxPlayers
      });
      
      // Broadcast updated game state to all clients
      this.broadcastGameState();
      
      // Send initial leaderboard
      this.broadcastLeaderboard();
    } else {
      socket.emit('joinGameResponse', {
        success: false,
        message: 'Failed to join game. Please try again.',
        playerId: null
      });
    }
  }

  // Get connected client count
  getConnectedCount() {
    return this.connectedClients.size;
  }

  // Broadcast message to all connected clients
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Broadcast message to all clients except sender
  broadcastToOthers(socketId, event, data) {
    this.io.to(socketId).broadcast.emit(event, data);
  }

  // Broadcast current game state to all clients
  broadcastGameState() {
    const gameState = this.gameState.getGameStateForBroadcast();
    this.broadcastToAll('gameState', gameState);
  }

  // Broadcast current leaderboard to all clients
  broadcastLeaderboard() {
    const leaderboard = this.gameState.getLeaderboard();
    this.broadcastToAll('leaderboardUpdate', { leaderboard });
  }

  // Create test script for game state validation
  createTestPlayer(playerName = 'TestPlayer') {
    const testId = `test_${Date.now()}`;
    return this.gameState.addPlayer(testId, playerName);
  }
}
