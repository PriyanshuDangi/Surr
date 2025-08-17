import * as THREE from 'three';

// Ground plane reference for disposal
let groundPlane = null;

/**
 * Creates a ground plane with specified configuration
 * @param {Object} config - Ground configuration
 * @param {number} config.size - Size of the ground plane (default: 100)
 * @param {number} config.boxSize - Box size for texture repeat (default: 1)
 * @param {number} config.piece - Piece multiplier for texture repeat (default: 1)
 * @returns {THREE.Mesh} The created ground plane mesh
 */
export function createGroundPlane(config = {}) {
  const {
    size = 100,
    boxSize = 1,
    piece = 1
  } = config;

  // Create ground plane geometry
  const groundGeometry = new THREE.PlaneGeometry(size, size);
  
  // Load texture
  const loader = new THREE.TextureLoader();
  const texture = loader.load('/assets/images/stone_silver.png');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(piece * boxSize, piece * boxSize);
  texture.anisotropy = 16;
  texture.encoding = THREE.sRGBEncoding;
  
  // Create ground material with texture
  const groundMaterial = new THREE.MeshPhongMaterial({ 
    map: texture, 
    shininess: 2, 
    color: '#fff' 
  });
  
  // Create ground mesh
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
  groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  groundPlane.receiveShadow = true;
  
  return groundPlane;
}

/**
 * Disposes of the ground plane and cleans up resources
 */
export function disposeGroundPlane() {
  if (groundPlane) {
    if (groundPlane.geometry) {
      groundPlane.geometry.dispose();
    }
    if (groundPlane.material) {
      // Dispose texture if it exists
      if (groundPlane.material.map) {
        groundPlane.material.map.dispose();
      }
      groundPlane.material.dispose();
    }
    groundPlane = null;
  }
}

/**
 * Gets the current ground plane reference
 * @returns {THREE.Mesh|null} The ground plane mesh or null if not created
 */
export function getGroundPlane() {
  return groundPlane;
}

/**
 * Updates the ground plane color
 * @param {number} color - The new color (hex value)
 */
export function setGroundColor(color) {
  if (groundPlane && groundPlane.material) {
    groundPlane.material.color.setHex(color);
  }
}

/**
 * Updates the ground plane opacity
 * @param {number} opacity - The new opacity (0-1)
 */
export function setGroundOpacity(opacity) {
  if (groundPlane && groundPlane.material) {
    groundPlane.material.opacity = opacity;
  }
}