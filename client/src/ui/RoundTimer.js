// Surr Game - Round Timer UI
// Real-time round timer display with status indicators

// Round timer state
let timerContainer = null;
let timerDisplay = null;
let statusDisplay = null;
let isInitialized = false;
let currentRoundInfo = null;

// Initialize round timer system
export function initRoundTimer() {
  if (isInitialized) return true;
  
  // Create timer container
  timerContainer = document.createElement('div');
  timerContainer.id = 'roundTimer';
  timerContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    border: 2px solid #4a90e2;
    border-radius: 12px;
    padding: 15px 20px;
    font-family: 'Arial', sans-serif;
    z-index: 1000;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    color: white;
    text-align: center;
    min-width: 200px;
  `;
  
  // Create status display
  statusDisplay = document.createElement('div');
  statusDisplay.style.cssText = `
    font-size: 12px;
    font-weight: normal;
    color: #95a5a6;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 1px;
  `;
  statusDisplay.textContent = 'WAITING FOR PLAYERS';
  
  // Create timer display
  timerDisplay = document.createElement('div');
  timerDisplay.style.cssText = `
    font-size: 24px;
    font-weight: bold;
    color: #4a90e2;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    font-family: 'Courier New', monospace;
  `;
  timerDisplay.textContent = '--:--';
  
  // Assemble timer
  timerContainer.appendChild(statusDisplay);
  timerContainer.appendChild(timerDisplay);
  
  // Add to page
  document.body.appendChild(timerContainer);
  
  isInitialized = true;
  console.log('Round timer system initialized');
  return true;
}

// Update round timer display
export function updateRoundTimer(roundInfo) {
  if (!isInitialized || !timerContainer || !roundInfo) {
    return;
  }
  
  currentRoundInfo = roundInfo;
  
  // Update status
  let status = '';
  let timerText = '--:--';
  let timerColor = '#4a90e2';
  let borderColor = '#4a90e2';
  
  if (!roundInfo.isActive) {
    status = 'WAITING FOR PLAYERS';
    timerText = '--:--';
    timerColor = '#95a5a6';
    borderColor = '#95a5a6';
  } else {
    status = `ROUND ${roundInfo.number} IN PROGRESS`;
    
    // Convert remaining time to MM:SS format
    const totalSeconds = Math.max(0, Math.ceil(roundInfo.remainingTime / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Color coding based on time remaining
    if (totalSeconds <= 30) {
      // Last 30 seconds - red/urgent
      timerColor = '#e74c3c';
      borderColor = '#e74c3c';
      
      // Add pulsing animation for last 10 seconds
      if (totalSeconds <= 10) {
        timerContainer.style.animation = 'pulse 1s infinite';
      } else {
        timerContainer.style.animation = 'none';
      }
    } else if (totalSeconds <= 60) {
      // Last minute - orange/warning
      timerColor = '#f39c12';
      borderColor = '#f39c12';
      timerContainer.style.animation = 'none';
    } else {
      // Normal time - blue
      timerColor = '#4a90e2';
      borderColor = '#4a90e2';
      timerContainer.style.animation = 'none';
    }
  }
  
  // Update displays
  statusDisplay.textContent = status;
  timerDisplay.textContent = timerText;
  timerDisplay.style.color = timerColor;
  timerContainer.style.borderColor = borderColor;
  
  // Add CSS for pulse animation if not already added
  if (!document.getElementById('roundTimerStyles')) {
    addTimerStyles();
  }
}

// Add CSS styles for animations
function addTimerStyles() {
  const style = document.createElement('style');
  style.id = 'roundTimerStyles';
  style.textContent = `
    @keyframes pulse {
      0% { transform: translateX(-50%) scale(1); opacity: 1; }
      50% { transform: translateX(-50%) scale(1.05); opacity: 0.8; }
      100% { transform: translateX(-50%) scale(1); opacity: 1; }
    }
    
    #roundTimer {
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    #roundTimer:hover {
      box-shadow: 0 8px 32px rgba(74, 144, 226, 0.2);
    }
  `;
  document.head.appendChild(style);
}

// Show round transition message
export function showRoundTransition(message, duration = 3000) {
  if (!isInitialized) return;
  
  // Create transition overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    border: 3px solid #4a90e2;
    border-radius: 15px;
    padding: 30px 40px;
    font-family: 'Arial', sans-serif;
    font-size: 24px;
    font-weight: bold;
    color: #4a90e2;
    text-align: center;
    z-index: 2000;
    backdrop-filter: blur(15px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    animation: roundTransitionIn 0.5s ease-out;
  `;
  overlay.textContent = message;
  
  // Add transition animation CSS
  if (!document.getElementById('roundTransitionStyles')) {
    const transitionStyle = document.createElement('style');
    transitionStyle.id = 'roundTransitionStyles';
    transitionStyle.textContent = `
      @keyframes roundTransitionIn {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
      
      @keyframes roundTransitionOut {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      }
    `;
    document.head.appendChild(transitionStyle);
  }
  
  document.body.appendChild(overlay);
  
  // Remove after duration
  setTimeout(() => {
    overlay.style.animation = 'roundTransitionOut 0.5s ease-in forwards';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 500);
  }, duration);
}

// Show timer
export function showRoundTimer() {
  if (timerContainer) {
    timerContainer.style.display = 'block';
  }
}

// Hide timer
export function hideRoundTimer() {
  if (timerContainer) {
    timerContainer.style.display = 'none';
  }
}

// Get current round info
export function getCurrentRoundInfo() {
  return currentRoundInfo ? { ...currentRoundInfo } : null;
}

// Check if timer is initialized
export function isRoundTimerInitialized() {
  return isInitialized;
}

// Cleanup function
export function disposeRoundTimer() {
  if (timerContainer && timerContainer.parentNode) {
    timerContainer.parentNode.removeChild(timerContainer);
  }
  
  // Remove styles
  const styles = document.getElementById('roundTimerStyles');
  if (styles && styles.parentNode) {
    styles.parentNode.removeChild(styles);
  }
  
  const transitionStyles = document.getElementById('roundTransitionStyles');
  if (transitionStyles && transitionStyles.parentNode) {
    transitionStyles.parentNode.removeChild(transitionStyles);
  }
  
  timerContainer = null;
  timerDisplay = null;
  statusDisplay = null;
  currentRoundInfo = null;
  isInitialized = false;
  console.log('Round timer system disposed');
}
