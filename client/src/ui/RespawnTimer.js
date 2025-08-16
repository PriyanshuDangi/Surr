// Surr Game - Respawn Timer UI
// Step 8.3: Display respawn countdown timer for eliminated players

// Respawn timer state
let respawnContainer = null;
let respawnTimer = null;
let countdownInterval = null;
let isShowingTimer = false;

// Initialize respawn timer system
export function initRespawnTimer() {
  // Create respawn timer container
  respawnContainer = document.createElement('div');
  respawnContainer.id = 'respawnContainer';
  respawnContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2000;
    pointer-events: none;
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    background: rgba(0, 0, 0, 0.8);
    padding: 40px;
    border-radius: 15px;
    backdrop-filter: blur(10px);
    border: 2px solid #e74c3c;
    box-shadow: 0 8px 40px rgba(231, 76, 60, 0.3);
  `;
  
  // Create elimination message
  const eliminationMessage = document.createElement('div');
  eliminationMessage.id = 'eliminationMessage';
  eliminationMessage.style.cssText = `
    color: #e74c3c;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  `;
  eliminationMessage.textContent = '💀 You were eliminated!';
  
  // Create countdown timer
  respawnTimer = document.createElement('div');
  respawnTimer.id = 'respawnTimer';
  respawnTimer.style.cssText = `
    color: white;
    font-size: 48px;
    font-weight: bold;
    text-align: center;
    min-width: 100px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  `;
  
  // Create respawn message
  const respawnMessage = document.createElement('div');
  respawnMessage.id = 'respawnMessage';
  respawnMessage.style.cssText = `
    color: #95a5a6;
    font-size: 16px;
    text-align: center;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  `;
  respawnMessage.textContent = 'Respawning in...';
  
  // Add elements to container
  respawnContainer.appendChild(eliminationMessage);
  respawnContainer.appendChild(respawnMessage);
  respawnContainer.appendChild(respawnTimer);
  
  document.body.appendChild(respawnContainer);
  console.log('Respawn timer system initialized');
  return true;
}

// Show respawn countdown timer
export function showRespawnTimer(shooterName = null, duration = 5000) {
  if (isShowingTimer) {
    clearRespawnTimer();
  }
  
  isShowingTimer = true;
  
  // Update elimination message if shooter name provided
  const eliminationMessage = document.getElementById('eliminationMessage');
  if (eliminationMessage && shooterName) {
    eliminationMessage.textContent = `💀 Eliminated by ${shooterName}!`;
  }
  
  // Show container
  respawnContainer.style.display = 'flex';
  
  // Animate in
  setTimeout(() => {
    respawnContainer.style.opacity = '1';
    respawnContainer.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);
  
  // Start countdown
  let timeLeft = Math.ceil(duration / 1000);
  updateTimerDisplay(timeLeft);
  
  countdownInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);
    
    if (timeLeft <= 0) {
      hideRespawnTimer();
    }
  }, 1000);
  
  console.log(`⏱️ Respawn timer started: ${timeLeft} seconds`);
}

// Update timer display
function updateTimerDisplay(timeLeft) {
  if (respawnTimer) {
    respawnTimer.textContent = timeLeft.toString();
    
    // Add color animation for last 3 seconds
    if (timeLeft <= 3) {
      respawnTimer.style.color = '#e74c3c';
      respawnTimer.style.animation = 'pulse 1s ease-in-out';
    } else {
      respawnTimer.style.color = 'white';
      respawnTimer.style.animation = 'none';
    }
  }
}

// Hide respawn timer
export function hideRespawnTimer() {
  if (!isShowingTimer) return;
  
  clearRespawnTimer();
  
  // Animate out
  respawnContainer.style.opacity = '0';
  respawnContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
  
  setTimeout(() => {
    respawnContainer.style.display = 'none';
    isShowingTimer = false;
  }, 300);
  
  console.log('⏱️ Respawn timer hidden');
}

// Clear countdown interval
function clearRespawnTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

// Check if timer is currently showing
export function isRespawnTimerShowing() {
  return isShowingTimer;
}

// Add CSS animation for pulse effect
function addPulseAnimation() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

// Initialize animations on load
if (typeof document !== 'undefined') {
  addPulseAnimation();
}

// Cleanup function
export function disposeRespawnTimer() {
  clearRespawnTimer();
  
  if (respawnContainer && respawnContainer.parentNode) {
    respawnContainer.parentNode.removeChild(respawnContainer);
    respawnContainer = null;
  }
  
  respawnTimer = null;
  isShowingTimer = false;
  console.log('Respawn timer system disposed');
}
