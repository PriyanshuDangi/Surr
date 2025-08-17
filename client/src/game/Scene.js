// Surr Game - Scene Manager
// Function-based scene management for Three.js rendering

import * as THREE from 'three';
import { createGroundPlane, disposeGroundPlane } from './components/Ground.js';

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
    alpha: false,
    powerPreference: 'high-performance'
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Enhanced sky gradient background
  renderer.setClearColor(0x4FC3F7); // Brighter sky blue
  
  // Enhanced shadow settings
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Enhanced rendering settings
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  console.log('Enhanced renderer initialized');
}

function setupScene() {
  scene = new THREE.Scene();
  
  // Enhanced fog with better visibility
  scene.fog = new THREE.Fog(0x4FC3F7, 80, 300); // Brighter fog, longer distance
  
  // Add background skybox effect
  const skyColor = new THREE.Color(0x4FC3F7);
  const groundColor = new THREE.Color(0x81C784);
  scene.background = skyColor;
  
  console.log('Enhanced scene created');
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
  // Enhanced ambient lighting for vibrant look
  const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
  scene.add(ambientLight);

  // Main sun light - brighter and warmer
  const directionalLight = new THREE.DirectionalLight(0xFFF8DC, 1.8);
  directionalLight.position.set(60, 80, 40);
  directionalLight.castShadow = true;
  
  // Enhanced shadow quality
  directionalLight.shadow.mapSize.width = 4096;
  directionalLight.shadow.mapSize.height = 4096;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 300;
  directionalLight.shadow.camera.left = -150;
  directionalLight.shadow.camera.right = 150;
  directionalLight.shadow.camera.top = 150;
  directionalLight.shadow.camera.bottom = -150;
  directionalLight.shadow.bias = -0.0001;
  
  scene.add(directionalLight);

  // Dynamic colored point lights for atmosphere
  const pointLight1 = new THREE.PointLight(0xFF6B35, 1.2, 100);
  pointLight1.position.set(40, 25, 40);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0x4ECDC4, 1.0, 100);
  pointLight2.position.set(-40, 25, -40);
  scene.add(pointLight2);
  
  // Rim lighting for better object definition
  const rimLight = new THREE.DirectionalLight(0xE1F5FE, 0.8);
  rimLight.position.set(-50, 30, -50);
  scene.add(rimLight);
  
  // Hemisphere light for realistic sky illumination
  const hemisphereLight = new THREE.HemisphereLight(0x4FC3F7, 0x81C784, 0.5);
  scene.add(hemisphereLight);
  
  console.log('Advanced lighting system initialized');
}

function setupArena() {
  // Create ground plane using Ground.js module
  groundPlane = createGroundPlane({
    size: 100,
    boxSize: 4,
    piece: 5
  });
  scene.add(groundPlane);

  createArenaWalls();
  
  console.log('Arena setup complete');
}

function createArenaWalls() {
  const wallHeight = 5;
  const wallThickness = 1;
  const arenaSize = 100;
  
  const wallMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x546E7A,
    transparent: true,
    opacity: 0.8,
    shininess: 30,
    specular: 0x445566
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
  // Dispose ground plane
  disposeGroundPlane();
  
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