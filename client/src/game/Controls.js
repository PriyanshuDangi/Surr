// Surr Game - Controls Functions
// Function-based input handling

// Input state
let inputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  shoot: false
};

// Initialize controls
export function initControls() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  document.addEventListener('blur', clearInput);
  
  console.log('Controls initialized');
}

// Handle key press
function handleKeyDown(event) {
  switch(event.code) {
    case 'KeyW':
    case 'ArrowUp':
      inputState.forward = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      inputState.backward = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      inputState.left = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      inputState.right = true;
      break;
    case 'Space':
      inputState.shoot = true;
      event.preventDefault();
      break;
  }
}

// Handle key release
function handleKeyUp(event) {
  switch(event.code) {
    case 'KeyW':
    case 'ArrowUp':
      inputState.forward = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      inputState.backward = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      inputState.left = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      inputState.right = false;
      break;
    case 'Space':
      inputState.shoot = false;
      break;
  }
}

// Clear all input (on window blur)
function clearInput() {
  inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    shoot: false
  };
}

// Get current input state
export function getInputState() {
  return { ...inputState };
}

// Check if any movement key is pressed
export function isMoving() {
  return inputState.forward || inputState.backward || inputState.left || inputState.right;
}

// Dispose controls
export function disposeControls() {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
  document.removeEventListener('blur', clearInput);
  
  console.log('Controls disposed');
}