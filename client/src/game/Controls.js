// Surr Game - Controls Module
// Enhanced input handling system for Step 4.2

// Input state tracking object
let inputState = {
  // Movement controls
  forward: false,    // W or ArrowUp
  backward: false,   // S or ArrowDown  
  left: false,       // A or ArrowLeft
  right: false,      // D or ArrowRight
  
  // Action controls
  shoot: false,      // Spacebar
  
  // Additional state tracking
  keys: new Set(),   // Track all currently pressed keys
  lastInputTime: 0   // Timestamp of last input change
};

// Key mapping for easier reference
const KEY_MAPPINGS = {
  // Movement keys
  'KeyW': 'forward',
  'ArrowUp': 'forward',
  'KeyS': 'backward', 
  'ArrowDown': 'backward',
  'KeyA': 'left',
  'ArrowLeft': 'left',
  'KeyD': 'right',
  'ArrowRight': 'right',
  
  // Action keys
  'Space': 'shoot'
};

// Initialize controls with enhanced logging
export function initControls() {
  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // Handle window focus/blur for input cleanup
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
  
  // Prevent default behavior for game keys
  document.addEventListener('keydown', preventDefaultForGameKeys);
  
  // console.log('Controls initialized with key mappings:', Object.keys(KEY_MAPPINGS));
  // console.log('Supported controls: WASD/Arrow keys for movement, Spacebar to shoot');
}

// Handle key press with enhanced logging
function handleKeyDown(event) {
  const keyCode = event.code;
  const action = KEY_MAPPINGS[keyCode];
  
  // Only process keys we care about
  if (!action) return;
  
  // Prevent repeat events from held keys
  if (inputState.keys.has(keyCode)) return;
  
  // Update state
  const wasPressed = inputState[action];
  inputState[action] = true;
  inputState.keys.add(keyCode);
  inputState.lastInputTime = performance.now();
  
  // Log state change for testing (Step 4.2 requirement)
  if (!wasPressed) {
    // console.log(`🎮 Key pressed: ${keyCode} → ${action} = true`);
    logCurrentInputState();
  }
}

// Handle key release with enhanced logging  
function handleKeyUp(event) {
  const keyCode = event.code;
  const action = KEY_MAPPINGS[keyCode];
  
  // Only process keys we care about
  if (!action) return;
  
  // Update state
  const wasPressed = inputState[action];
  inputState[action] = false;
  inputState.keys.delete(keyCode);
  inputState.lastInputTime = performance.now();
  
  // Log state change for testing (Step 4.2 requirement)
  if (wasPressed) {
    // console.log(`🎮 Key released: ${keyCode} → ${action} = false`);
    logCurrentInputState();
  }
}

// Prevent default behavior for game keys
function preventDefaultForGameKeys(event) {
  if (KEY_MAPPINGS[event.code]) {
    event.preventDefault();
  }
}

// Handle window losing focus
function handleWindowBlur() {
  // console.log('🎮 Window lost focus - clearing all input state');
  clearAllInput();
}

// Handle window gaining focus
function handleWindowFocus() {
  // console.log('🎮 Window gained focus - input ready');
}

// Clear all input state
function clearAllInput() {
  const hadInput = Object.values(inputState).some(val => val === true);
  
  inputState.forward = false;
  inputState.backward = false;
  inputState.left = false;
  inputState.right = false;
  inputState.shoot = false;
  inputState.keys.clear();
  inputState.lastInputTime = performance.now();
  
  if (hadInput) {
    // console.log('🎮 All input cleared');
    logCurrentInputState();
  }
}

// Log current input state for debugging (Step 4.2 requirement)
function logCurrentInputState() {
  const activeKeys = [];
  if (inputState.forward) activeKeys.push('forward');
  if (inputState.backward) activeKeys.push('backward');
  if (inputState.left) activeKeys.push('left');
  if (inputState.right) activeKeys.push('right');
  if (inputState.shoot) activeKeys.push('shoot');
  
  // console.log(`🎮 Input State: [${activeKeys.join(', ') || 'none'}] | Keys: ${inputState.keys.size}`);
}

// Get current input state (immutable copy)
export function getInputState() {
  return {
    forward: inputState.forward,
    backward: inputState.backward,
    left: inputState.left,
    right: inputState.right,
    shoot: inputState.shoot,
    lastInputTime: inputState.lastInputTime
  };
}

// Get raw input state reference (for performance-critical code)
export function getInputStateRef() {
  return inputState;
}

// Check if any movement key is pressed
export function isMoving() {
  return inputState.forward || inputState.backward || inputState.left || inputState.right;
}

// Check if any key is currently pressed
export function hasAnyInput() {
  return inputState.keys.size > 0;
}

// Get time since last input change
export function getTimeSinceLastInput() {
  return performance.now() - inputState.lastInputTime;
}

// Get list of currently pressed key codes
export function getPressedKeys() {
  return Array.from(inputState.keys);
}

// Manual input state override (for testing)
export function setInputState(newState) {
  Object.assign(inputState, newState);
  inputState.lastInputTime = performance.now();
  // console.log('🎮 Input state manually updated:', newState);
}

// Dispose controls and cleanup
export function disposeControls() {
  // Remove all event listeners
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
  document.removeEventListener('keydown', preventDefaultForGameKeys);
  window.removeEventListener('blur', handleWindowBlur);
  window.removeEventListener('focus', handleWindowFocus);
  
  // Clear state
  clearAllInput();
  
  console.log('🎮 Controls disposed and cleaned up');
}

// Initialize controls automatically when module loads
// This ensures controls are ready as soon as the module is imported
export function autoInitControls() {
  if (typeof document !== 'undefined') {
    initControls();
  }
}