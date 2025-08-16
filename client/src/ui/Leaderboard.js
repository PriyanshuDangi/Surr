// Surr Game - Leaderboard UI
// Step 9.3: Real-time leaderboard display with styling and local player highlighting

// Leaderboard state
let leaderboardContainer = null;
let leaderboardContent = null;
let isInitialized = false;
let currentLeaderboard = [];
let localPlayerId = null;

// Initialize leaderboard system
export function initLeaderboard() {
  if (isInitialized) return true;
  
  // Create leaderboard container
  leaderboardContainer = document.createElement('div');
  leaderboardContainer.id = 'leaderboard';
  leaderboardContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 280px;
    background: rgba(0, 0, 0, 0.85);
    border: 2px solid #4a90e2;
    border-radius: 12px;
    padding: 15px;
    font-family: 'Arial', sans-serif;
    z-index: 1000;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    color: white;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 15px;
    color: #4a90e2;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    border-bottom: 1px solid #4a90e2;
    padding-bottom: 8px;
  `;
  header.textContent = '🏆 LEADERBOARD';
  
  // Create content container
  leaderboardContent = document.createElement('div');
  leaderboardContent.id = 'leaderboardContent';
  leaderboardContent.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
  `;
  
  // Add empty state
  const emptyState = document.createElement('div');
  emptyState.style.cssText = `
    text-align: center;
    color: #95a5a6;
    font-style: italic;
    padding: 20px 0;
  `;
  emptyState.textContent = 'No players yet...';
  leaderboardContent.appendChild(emptyState);
  
  // Assemble leaderboard
  leaderboardContainer.appendChild(header);
  leaderboardContainer.appendChild(leaderboardContent);
  
  // Add to page
  document.body.appendChild(leaderboardContainer);
  
  // Add custom scrollbar styles
  addScrollbarStyles();
  
  isInitialized = true;
  console.log('Leaderboard system initialized');
  return true;
}

// Update leaderboard display
export function updateLeaderboard(leaderboardData, localPlayerIdParam = null) {
  if (!isInitialized || !leaderboardContent) {
    console.warn('Leaderboard not initialized');
    return;
  }
  
  // Update local player ID if provided
  if (localPlayerIdParam) {
    localPlayerId = localPlayerIdParam;
  }
  
  // Store current leaderboard
  currentLeaderboard = leaderboardData || [];
  
  // Clear current content
  leaderboardContent.innerHTML = '';
  
  if (currentLeaderboard.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.cssText = `
      text-align: center;
      color: #95a5a6;
      font-style: italic;
      padding: 20px 0;
    `;
    emptyState.textContent = 'No players yet...';
    leaderboardContent.appendChild(emptyState);
    return;
  }
  
  // Create entries for each player
  currentLeaderboard.forEach((player, index) => {
    const entry = createLeaderboardEntry(player, index + 1);
    leaderboardContent.appendChild(entry);
  });
  
  console.log(`📊 Leaderboard updated with ${currentLeaderboard.length} players`);
}

// Create individual leaderboard entry
function createLeaderboardEntry(player, rank) {
  const isLocalPlayer = player.id === localPlayerId;
  const isDead = !player.isAlive;
  
  const entry = document.createElement('div');
  entry.className = 'leaderboard-entry';
  entry.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 6px;
    background: ${isLocalPlayer ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    border: ${isLocalPlayer ? '1px solid #4a90e2' : '1px solid transparent'};
    opacity: ${isDead ? '0.6' : '1.0'};
    transition: all 0.3s ease;
  `;
  
  // Left side: rank and name
  const leftSide = document.createElement('div');
  leftSide.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  `;
  
  // Rank badge
  const rankBadge = document.createElement('span');
  rankBadge.style.cssText = `
    background: ${getRankColor(rank)};
    color: white;
    font-weight: bold;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 12px;
    min-width: 20px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `;
  rankBadge.textContent = rank.toString();
  
  // Player name
  const playerName = document.createElement('span');
  playerName.style.cssText = `
    font-size: 14px;
    font-weight: ${isLocalPlayer ? 'bold' : 'normal'};
    color: ${isLocalPlayer ? '#4a90e2' : isDead ? '#95a5a6' : 'white'};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
  playerName.textContent = player.name;
  
  // Status indicator
  const statusIndicator = document.createElement('span');
  statusIndicator.style.cssText = `
    font-size: 12px;
    margin-left: 4px;
  `;
  
  if (isLocalPlayer) {
    statusIndicator.textContent = '👤';
    statusIndicator.title = 'You';
  } else if (isDead) {
    statusIndicator.textContent = '💀';
    statusIndicator.title = 'Eliminated';
  } else {
    statusIndicator.textContent = '🎮';
    statusIndicator.title = 'Alive';
  }
  
  leftSide.appendChild(rankBadge);
  leftSide.appendChild(playerName);
  leftSide.appendChild(statusIndicator);
  
  // Right side: score
  const score = document.createElement('span');
  score.style.cssText = `
    font-size: 16px;
    font-weight: bold;
    color: ${isLocalPlayer ? '#4a90e2' : '#f39c12'};
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  `;
  score.textContent = player.score.toString();
  
  entry.appendChild(leftSide);
  entry.appendChild(score);
  
  // Add hover effect
  entry.addEventListener('mouseenter', () => {
    if (!isLocalPlayer) {
      entry.style.background = 'rgba(255, 255, 255, 0.1)';
    }
  });
  
  entry.addEventListener('mouseleave', () => {
    if (!isLocalPlayer) {
      entry.style.background = 'rgba(255, 255, 255, 0.05)';
    }
  });
  
  return entry;
}

// Get rank-based color
function getRankColor(rank) {
  switch (rank) {
    case 1: return '#FFD700'; // Gold
    case 2: return '#C0C0C0'; // Silver
    case 3: return '#CD7F32'; // Bronze
    default: return '#95a5a6'; // Gray
  }
}

// Add custom scrollbar styles
function addScrollbarStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #leaderboardContent::-webkit-scrollbar {
      width: 6px;
    }
    
    #leaderboardContent::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
    
    #leaderboardContent::-webkit-scrollbar-thumb {
      background: #4a90e2;
      border-radius: 3px;
    }
    
    #leaderboardContent::-webkit-scrollbar-thumb:hover {
      background: #357abd;
    }
    
    .leaderboard-entry {
      transition: all 0.3s ease;
    }
    
    .leaderboard-entry:hover {
      transform: translateX(2px);
    }
  `;
  document.head.appendChild(style);
}

// Show leaderboard
export function showLeaderboard() {
  if (leaderboardContainer) {
    leaderboardContainer.style.display = 'block';
  }
}

// Hide leaderboard
export function hideLeaderboard() {
  if (leaderboardContainer) {
    leaderboardContainer.style.display = 'none';
  }
}

// Set local player ID for highlighting
export function setLocalPlayerId(playerId) {
  localPlayerId = playerId;
  // Refresh display if leaderboard is already populated
  if (currentLeaderboard.length > 0) {
    updateLeaderboard(currentLeaderboard, playerId);
  }
}

// Get current leaderboard data
export function getCurrentLeaderboard() {
  return [...currentLeaderboard];
}

// Check if leaderboard is initialized
export function isLeaderboardInitialized() {
  return isInitialized;
}

// Cleanup function
export function disposeLeaderboard() {
  if (leaderboardContainer && leaderboardContainer.parentNode) {
    leaderboardContainer.parentNode.removeChild(leaderboardContainer);
  }
  
  leaderboardContainer = null;
  leaderboardContent = null;
  currentLeaderboard = [];
  localPlayerId = null;
  isInitialized = false;
  console.log('Leaderboard system disposed');
}