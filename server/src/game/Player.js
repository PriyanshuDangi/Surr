// Surr Game - Server Player Functions
// Function-based server-side player utilities

// Create a new player object
export function createPlayer(id, name, walletAddress = null) {
  return {
    id,                    // This will be the wallet address for Web3 players, or socket.id for legacy
    name,                  // Display name (formatted wallet address or regular name)
    walletAddress,         // Full wallet address for Web3 integration
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    score: 0,              // Kills in current round (resets each round)
    isAlive: true,
    isActive: true,        // Whether player is connected (false when disconnected)
    weapon: null,
    joinedAt: Date.now()
  };
}

// Validate player position data
export function validatePlayerPosition(position) {
  return position && 
         typeof position.x === 'number' && 
         typeof position.y === 'number' && 
         typeof position.z === 'number';
}

// Validate player rotation data
export function validatePlayerRotation(rotation) {
  return rotation && 
         typeof rotation.x === 'number' && 
         typeof rotation.y === 'number' && 
         typeof rotation.z === 'number';
}

// Serialize player data for network transmission
export function serializePlayer(player) {
  return {
    id: player.id,               // Wallet address or socket ID
    name: player.name,           // Display name (formatted)
    walletAddress: player.walletAddress, // Full wallet address for Web3 operations
    position: player.position,
    rotation: player.rotation,
    score: player.score,         // Current round score
    isAlive: player.isAlive,
    isActive: player.isActive,   // Connection status
    weapon: player.weapon
  };
}

// Validate player name
export function validatePlayerName(name) {
  return typeof name === 'string' && 
         name.trim().length > 0 && 
         name.trim().length <= 20;
}

// Validate wallet address (basic Ethereum address format check)
export function validateWalletAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Basic Ethereum address validation
  // Must start with 0x, be 42 characters long, and contain only hex characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

// Format wallet address for display (first 6 + last 4 characters)
export function formatWalletAddress(address) {
  if (!validateWalletAddress(address)) {
    return address; // Return as-is if invalid
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Validate weapon type
export function validateWeapon(weapon) {
  return weapon === null || weapon === 'missile';
}

// Update player position safely with validation
export function updatePlayerData(player, updates) {
  const updatedPlayer = { ...player };
  
  if (updates.position && validatePlayerPosition(updates.position)) {
    updatedPlayer.position = { ...updates.position };
  }
  
  if (updates.rotation && validatePlayerRotation(updates.rotation)) {
    updatedPlayer.rotation = { ...updates.rotation };
  }
  
  if (updates.weapon !== undefined && validateWeapon(updates.weapon)) {
    updatedPlayer.weapon = updates.weapon;
  }
  
  if (typeof updates.isAlive === 'boolean') {
    updatedPlayer.isAlive = updates.isAlive;
    // Remove weapon if player dies
    if (!updates.isAlive) {
      updatedPlayer.weapon = null;
    }
  }
  
  if (typeof updates.score === 'number' && updates.score >= 0) {
    updatedPlayer.score = updates.score;
  }
  
  if (typeof updates.isActive === 'boolean') {
    updatedPlayer.isActive = updates.isActive;
  }
  
  return updatedPlayer;
}

// Check if position is within arena bounds
export function isPositionInBounds(position, arenaSize = 100) {
  const halfSize = arenaSize / 2;
  return position.x >= -halfSize && position.x <= halfSize &&
         position.z >= -halfSize && position.z <= halfSize;
}