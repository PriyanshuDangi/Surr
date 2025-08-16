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
  console.log('Notification system initialized');
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
    element.style.cssText = getNotificationStyles(notification.type);
    element.textContent = notification.message;
    
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
    death: 'border-color: #c0392b; background: rgba(192, 57, 43, 0.15);'
  };
  
  return baseStyles + (typeStyles[type] || typeStyles.info);
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
