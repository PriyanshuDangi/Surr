// Surr Game - Leaderboard Functions
// Function-based leaderboard management

// Update leaderboard display
export function updateLeaderboard(players) {
  const leaderboardContent = document.getElementById('leaderboardContent');
  if (!leaderboardContent) return;

  // Sort players by score
  const sortedPlayers = players.sort((a, b) => b.score - a.score);

  // Clear current content
  leaderboardContent.innerHTML = '';

  // Add each player
  sortedPlayers.forEach((player, index) => {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';
    
    const playerName = document.createElement('span');
    playerName.textContent = `${index + 1}. ${player.name}`;
    
    const playerScore = document.createElement('span');
    playerScore.textContent = player.score;
    
    entry.appendChild(playerName);
    entry.appendChild(playerScore);
    leaderboardContent.appendChild(entry);
  });
}

// Show leaderboard
export function showLeaderboard() {
  const leaderboard = document.getElementById('leaderboard');
  if (leaderboard) {
    leaderboard.classList.remove('hidden');
  }
}

// Hide leaderboard
export function hideLeaderboard() {
  const leaderboard = document.getElementById('leaderboard');
  if (leaderboard) {
    leaderboard.classList.add('hidden');
  }
}