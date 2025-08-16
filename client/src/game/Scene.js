// Surr Game - Scene Manager
// Function-based scene management for Three.js rendering

import * as THREE from 'three';

// Scene state
let canvas = null;
let scene = null;
let camera = null;
let renderer = null;
let groundPlane = null;
let arenaWalls = [];
let localCarTarget = null; // Target position for camera to follow

// Initialize the scene
export function initScene(canvasElement) {
  canvas = canvasElement;
  
  console.log('Scene initialized');
  
  setupRenderer();
  setupScene();
  setupCamera();
  setupLighting();
  setupArena();
  setupResizeHandler();
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x1a1a2e);
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  console.log('Renderer initialized');
}

function setupScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
  
  console.log('Scene created');
}

function setupCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  
  // Set initial camera position behind and above the spawn point
  camera.position.set(0, 15, 20);
  camera.lookAt(0, 0, 0);
  
  console.log('Camera initialized');
}

function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 50, 50);
  directionalLight.castShadow = true;
  
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0x4a90e2, 0.6, 100);
  pointLight.position.set(0, 30, 0);
  scene.add(pointLight);
  
  console.log('Lighting setup complete');
}

function setupArena() {
  // Create ground plane
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x2d5a87,
    transparent: true,
    opacity: 0.8
  });
  
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.receiveShadow = true;
  scene.add(groundPlane);

  createArenaWalls();
  
  console.log('Arena setup complete');
}

function createArenaWalls() {
  const wallHeight = 5;
  const wallThickness = 1;
  const arenaSize = 100;
  
  const wallMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x7f8c8d,
    transparent: true,
    opacity: 0.7
  });

  const wallPositions = [
    { x: 0, z: arenaSize/2, width: arenaSize, depth: wallThickness },
    { x: 0, z: -arenaSize/2, width: arenaSize, depth: wallThickness },
    { x: arenaSize/2, z: 0, width: wallThickness, depth: arenaSize },
    { x: -arenaSize/2, z: 0, width: wallThickness, depth: arenaSize }
  ];

  wallPositions.forEach(pos => {
    const wallGeometry = new THREE.BoxGeometry(pos.width, wallHeight, pos.depth);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(pos.x, wallHeight/2, pos.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    arenaWalls.push(wall);
    scene.add(wall);
  });
}

function setupResizeHandler() {
  window.addEventListener('resize', handleResize);
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Update the scene
export function updateScene(deltaTime) {
  // Update camera to follow local car
  if (localCarTarget) {
    updateCameraFollow();
  }
}

// Update camera to follow the local car
function updateCameraFollow() {
  if (!localCarTarget || !camera) return;
  
  // Camera follows behind and above the car
  const offset = new THREE.Vector3(0, 15, 20);
  const desiredPosition = localCarTarget.clone().add(offset);
  
  // Smooth camera movement
  camera.position.lerp(desiredPosition, 0.1);
  
  // Look at the car
  camera.lookAt(localCarTarget);
}

// Render the scene
export function renderScene() {
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Add object to scene
export function addObjectToScene(object) {
  if (scene) {
    scene.add(object);
  }
}

// Remove object from scene
export function removeObjectFromScene(object) {
  if (scene) {
    scene.remove(object);
  }
}

// Get scene reference
export function getScene() {
  return scene;
}

// Get camera reference
export function getCamera() {
  return camera;
}

// Set the target position for camera to follow (local car position)
export function setCameraTarget(position) {
  localCarTarget = position ? new THREE.Vector3(position.x, position.y, position.z) : null;
}

// Get current camera target
export function getCameraTarget() {
  return localCarTarget;
}

// Cleanup method
export function disposeScene() {
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (object.material.length) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  if (renderer) {
    renderer.dispose();
  }
  
  console.log('Scene disposed');
}