// Surr Game - Notification System
// Step 5.4: Visual feedback for player join/leave events

// Notification system state
let notificationContainer = null;
let notificationQueue = [];
let isProcessingQueue = false;

// Initialize notification system
export function initNotifications() {
  // Create notification container
  notificationContainer = document.createElement('div');
  notificationContainer.id = 'notificationContainer';
  notificationContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1500;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  `;
  
  document.body.appendChild(notificationContainer);
  
  // Inject CSS for reward notifications
  injectRewardNotificationCSS();
  
  console.log('Notification system initialized with reward styles');
  return true;
}

// Show a notification
export function showNotification(message, type = 'info', duration = 4000) {
  const notification = {
    message,
    type,
    duration,
    id: Date.now() + Math.random()
  };
  
  notificationQueue.push(notification);
  
  if (!isProcessingQueue) {
    processNotificationQueue();
  }
}

// Process notification queue
async function processNotificationQueue() {
  if (isProcessingQueue || notificationQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (notificationQueue.length > 0) {
    const notification = notificationQueue.shift();
    await displayNotification(notification);
  }
  
  isProcessingQueue = false;
}

// Display a single notification
function displayNotification(notification) {
  return new Promise((resolve) => {
    // Create notification element
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    
    if (notification.enhanced && notification.type === 'reward') {
      // Create enhanced reward notification
      element.innerHTML = createRewardNotificationHTML(notification.rewardData);
      element.style.cssText = getRewardNotificationStyles();
    } else {
      // Standard notification
      element.style.cssText = getNotificationStyles(notification.type);
      element.textContent = notification.message;
    }
    
    // Add to container
    notificationContainer.appendChild(element);
    
    // Animate in
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) scale(1)';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(-20px) scale(0.9)';
      
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        resolve();
      }, 300);
    }, notification.duration);
  });
}

// Get styles for notification type
function getNotificationStyles(type) {
  const baseStyles = `
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    border: 2px solid;
  `;
  
  const typeStyles = {
    info: 'border-color: #4a90e2; background: rgba(74, 144, 226, 0.1);',
    success: 'border-color: #2ecc71; background: rgba(46, 204, 113, 0.1);',
    warning: 'border-color: #f39c12; background: rgba(243, 156, 18, 0.1);',
    error: 'border-color: #e74c3c; background: rgba(231, 76, 60, 0.1);',
    join: 'border-color: #2ecc71; background: rgba(46, 204, 113, 0.1);',
    leave: 'border-color: #f39c12; background: rgba(243, 156, 18, 0.1);',
    elimination: 'border-color: #9b59b6; background: rgba(155, 89, 182, 0.1);',
    'elimination-personal': 'border-color: #e74c3c; background: rgba(231, 76, 60, 0.2);',
    kill: 'border-color: #27ae60; background: rgba(39, 174, 96, 0.15);',
    death: 'border-color: #c0392b; background: rgba(192, 57, 43, 0.15);',
    reward: 'border-color: #f1c40f; background: linear-gradient(135deg, rgba(241, 196, 15, 0.2), rgba(230, 126, 34, 0.1)); box-shadow: 0 0 20px rgba(241, 196, 15, 0.3);'
  };
  
  return baseStyles + (typeStyles[type] || typeStyles.info);
}

// Create HTML content for reward notifications
function createRewardNotificationHTML(rewardData) {
  const { tokensEarned, roundKills, transactionHash, playerName } = rewardData;
  
  // Generate Flow testnet explorer link
  const explorerLink = transactionHash 
    ? `https://evm-testnet.flowscan.io/tx/${transactionHash}`
    : null;
  
  return `
    <div class="reward-notification-content">
      <div class="reward-header">
        <span class="reward-icon">🎉</span>
        <span class="reward-title">Round Rewards Earned!</span>
      </div>
      <div class="reward-details">
        <div class="reward-line">
          <span class="reward-label">Round Kills:</span>
          <span class="reward-value">${roundKills}</span>
        </div>
        <div class="reward-line highlight">
          <span class="reward-label">SURR Tokens:</span>
          <span class="reward-value">${tokensEarned}</span>
        </div>
      </div>
      ${transactionHash ? `
        <div class="reward-transaction">
          <a href="${explorerLink}" target="_blank" class="transaction-link">
            View on Flow Explorer →
          </a>
        </div>
      ` : ''}
    </div>
  `;
}

// Get enhanced styles for reward notifications
function getRewardNotificationStyles() {
  return `
    background: linear-gradient(135deg, rgba(241, 196, 15, 0.95), rgba(230, 126, 34, 0.9));
    color: #2c3e50;
    padding: 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(241, 196, 15, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
    pointer-events: auto;
    border: 2px solid #f1c40f;
    min-width: 280px;
    max-width: 400px;
    animation: rewardPulse 2s ease-in-out infinite alternate;
  `;
}

// Inject CSS styles for reward notifications
function injectRewardNotificationCSS() {
  const styleId = 'reward-notification-styles';
  
  // Check if styles already injected
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes rewardPulse {
      0% { box-shadow: 0 8px 32px rgba(241, 196, 15, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1); }
      100% { box-shadow: 0 8px 32px rgba(241, 196, 15, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2); }
    }
    
    @keyframes rewardShine {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    
    .reward-notification-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .reward-header {
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid rgba(44, 62, 80, 0.2);
      padding-bottom: 8px;
    }
    
    .reward-icon {
      font-size: 24px;
      animation: bounce 1s ease-in-out infinite alternate;
    }
    
    .reward-title {
      font-size: 16px;
      font-weight: 700;
      color: #2c3e50;
    }
    
    .reward-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .reward-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }
    
    .reward-line.highlight {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 12px;
      border-radius: 6px;
      margin: 4px -12px;
      font-weight: 700;
    }
    
    .reward-label {
      color: #34495e;
      font-weight: 600;
    }
    
    .reward-value {
      color: #2c3e50;
      font-weight: 700;
      font-size: 16px;
    }
    
    .reward-transaction {
      border-top: 1px solid rgba(44, 62, 80, 0.2);
      padding-top: 8px;
      text-align: center;
    }
    
    .transaction-link {
      color: #2c3e50;
      text-decoration: none;
      font-weight: 600;
      font-size: 12px;
      padding: 6px 12px;
      border: 1px solid rgba(44, 62, 80, 0.3);
      border-radius: 20px;
      transition: all 0.3s ease;
      display: inline-block;
      background: rgba(255, 255, 255, 0.1);
    }
    
    .transaction-link:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-3px); }
    }
  `;
  
  document.head.appendChild(style);
}

// Specific notification functions for game events
export function showPlayerJoinedNotification(playerName) {
  showNotification(`🎮 ${playerName} joined the game`, 'join', 3000);
}

export function showPlayerLeftNotification(playerName) {
  showNotification(`👋 ${playerName} left the game`, 'leave', 3000);
}

export function showWelcomeNotification(playerName) {
  showNotification(`Welcome to Surr, ${playerName}!`, 'success', 4000);
}

export function showConnectionNotification(message, type = 'info') {
  showNotification(message, type, 3000);
}

// Step 8.4: Elimination notifications
export function showEliminationNotification(shooterName, targetName, isLocalPlayerInvolved = false) {
  const message = `💀 ${shooterName} eliminated ${targetName}`;
  const type = isLocalPlayerInvolved ? 'elimination-personal' : 'elimination';
  showNotification(message, type, 4000);
}

export function showKillNotification(targetName) {
  showNotification(`🎯 You eliminated ${targetName}!`, 'kill', 3000);
}

export function showDeathNotification(shooterName) {
  showNotification(`💀 You were eliminated by ${shooterName}`, 'death', 4000);
}

// Step 2.9: Reward notifications
export function showRewardNotification(rewardData) {
  const { tokensEarned, roundKills, transactionHash, playerName } = rewardData;
  
  // Create enhanced reward notification element
  const notification = {
    message: `🎉 Round Rewards Earned!`,
    type: 'reward',
    duration: 8000, // Longer duration for reward notifications
    id: Date.now() + Math.random(),
    enhanced: true,
    rewardData
  };
  
  notificationQueue.push(notification);
  
  if (!isProcessingQueue) {
    processNotificationQueue();
  }
}

// Cleanup function
export function disposeNotifications() {
  if (notificationContainer && notificationContainer.parentNode) {
    notificationContainer.parentNode.removeChild(notificationContainer);
    notificationContainer = null;
  }
  notificationQueue = [];
  isProcessingQueue = false;
  console.log('Notification system disposed');
}
