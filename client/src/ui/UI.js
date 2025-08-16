// Surr Game - UI Functions
// Function-based UI management

// Initialize UI
export function initUI() {
  console.log('UI initialized');
}

// Show connection status
export function showConnectionStatus(message, status = 'connecting') {
  const statusElement = document.getElementById('connectionStatus');
  const messageElement = document.getElementById('connectionMessage');
  
  if (statusElement && messageElement) {
    messageElement.textContent = message;
    statusElement.className = `ui-overlay status-${status}`;
    statusElement.classList.remove('hidden');
  }
}

// Hide connection status
export function hideConnectionStatus() {
  const statusElement = document.getElementById('connectionStatus');
  if (statusElement) {
    statusElement.classList.add('hidden');
  }
}

// Update UI element text
export function updateUIElement(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

// Show/hide UI element
export function toggleUIElement(elementId, show) {
  const element = document.getElementById(elementId);
  if (element) {
    if (show) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  }
}