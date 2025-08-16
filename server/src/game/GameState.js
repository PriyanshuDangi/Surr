// Surr Game - Game State Manager
// Centralized game state management for tracking all players and game objects

export class GameState {
  constructor() {
    this.players = new Map();
    this.weaponBoxes = new Map();
    this.gameStarted = false;
    this.maxPlayers = 6; // As specified in requirements
    console.log('GameState initialized');
  }

  // Player management methods
  
  /**
   * Add a new player to the game
   * @param {string} playerId - Socket ID of the player
   * @param {string} playerName - Display name of the player
   * @returns {boolean} - Success status
   */
  addPlayer(playerId, playerName) {
    if (this.players.size >= this.maxPlayers) {
      console.log(`Cannot add player ${playerName}: Game is full`);
      return false;
    }

    if (this.players.has(playerId)) {
      console.log(`Player ${playerId} already exists`);
      return false;
    }

    const player = {
      id: playerId,
      name: playerName,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      score: 0,
      isAlive: true,
      weapon: null, // 'missile' or null
      joinedAt: Date.now()
    };

    this.players.set(playerId, player);
    console.log(`Player added: ${playerName} (${playerId})`);
    return true;
  }

  /**
   * Remove a player from the game
   * @param {string} playerId - Socket ID of the player
   * @returns {boolean} - Success status
   */
  removePlayer(playerId) {
    if (this.players.has(playerId)) {
      const player = this.players.get(playerId);
      this.players.delete(playerId);
      console.log(`Player removed: ${player.name} (${playerId})`);
      return true;
    }
    return false;
  }

  /**
   * Update player position and rotation
   * @param {string} playerId - Socket ID of the player
   * @param {object} position - New position {x, y, z}
   * @param {object} rotation - New rotation {x, y, z}
   * @returns {boolean} - Success status
   */
  updatePlayerPosition(playerId, position, rotation) {
    const player = this.players.get(playerId);
    if (player) {
      player.position = { ...position };
      player.rotation = { ...rotation };
      return true;
    }
    return false;
  }

  /**
   * Get player by ID
   * @param {string} playerId - Socket ID of the player
   * @returns {object|null} - Player object or null
   */
  getPlayer(playerId) {
    return this.players.get(playerId) || null;
  }

  /**
   * Get all players as array
   * @returns {Array} - Array of player objects
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Get current player count
   * @returns {number} - Number of connected players
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * Check if game can accept more players
   * @returns {boolean} - True if can accept more players
   */
  canAcceptPlayers() {
    return this.players.size < this.maxPlayers;
  }

  // Game state serialization methods

  /**
   * Get serialized game state for broadcasting
   * @returns {object} - Serialized game state
   */
  getGameStateForBroadcast() {
    return {
      players: this.getAllPlayers(),
      playerCount: this.getPlayerCount(),
      maxPlayers: this.maxPlayers,
      gameStarted: this.gameStarted,
      timestamp: Date.now()
    };
  }

  /**
   * Get leaderboard sorted by score
   * @returns {Array} - Sorted array of players by score
   */
  getLeaderboard() {
    return this.getAllPlayers()
      .sort((a, b) => b.score - a.score)
      .map(player => ({
        id: player.id,
        name: player.name,
        score: player.score,
        isAlive: player.isAlive
      }));
  }

  // Weapon and combat methods (placeholder for future phases)
  
  /**
   * Award points to a player
   * @param {string} playerId - Socket ID of the player
   * @param {number} points - Points to award
   */
  awardPoints(playerId, points = 1) {
    const player = this.players.get(playerId);
    if (player) {
      player.score += points;
      console.log(`Player ${player.name} awarded ${points} points. Total: ${player.score}`);
    }
  }

  /**
   * Reset game state
   */
  reset() {
    this.players.clear();
    this.weaponBoxes.clear();
    this.gameStarted = false;
    console.log('Game state reset');
  }
}

// Singleton pattern for global access
let gameStateInstance = null;

export function getGameState() {
  if (!gameStateInstance) {
    gameStateInstance = new GameState();
  }
  return gameStateInstance;
}
