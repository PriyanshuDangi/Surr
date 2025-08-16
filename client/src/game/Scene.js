// Surr Game - Scene Manager
// Manages Three.js scene setup, lighting, camera, and rendering

import * as THREE from 'three';

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.groundPlane = null;
    this.arenaWalls = [];
    
    console.log('Scene initialized');
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLighting();
    this.setupArena();
    this.setupResizeHandler();
  }

  setupRenderer() {
    // Initialize WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x1a1a2e);
    
    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    console.log('Renderer initialized');
  }

  setupScene() {
    // Create Three.js scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
    
    console.log('Scene created');
  }

  setupCamera() {
    // Set up perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    
    // Position camera above and behind for initial overview
    this.camera.position.set(0, 25, 30);
    this.camera.lookAt(0, 0, 0);
    
    console.log('Camera initialized');
  }

  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    this.scene.add(directionalLight);

    // Additional point light for dynamic lighting
    const pointLight = new THREE.PointLight(0x4a90e2, 0.6, 100);
    pointLight.position.set(0, 30, 0);
    this.scene.add(pointLight);
    
    console.log('Lighting setup complete');
  }

  setupArena() {
    // Create ground plane (100x100 units as specified)
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x2d5a87,
      transparent: true,
      opacity: 0.8
    });
    
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);

    // Create visible arena walls
    this.createArenaWalls();
    
    // Add some basic reference objects
    this.addReferenceObjects();
    
    console.log('Arena setup complete');
  }

  createArenaWalls() {
    const wallHeight = 5;
    const wallThickness = 1;
    const arenaSize = 100;
    
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x7f8c8d,
      transparent: true,
      opacity: 0.7
    });

    // Create 4 walls around the arena perimeter
    const wallPositions = [
      { x: 0, z: arenaSize/2, width: arenaSize, depth: wallThickness }, // Front wall
      { x: 0, z: -arenaSize/2, width: arenaSize, depth: wallThickness }, // Back wall
      { x: arenaSize/2, z: 0, width: wallThickness, depth: arenaSize }, // Right wall
      { x: -arenaSize/2, z: 0, width: wallThickness, depth: arenaSize } // Left wall
    ];

    wallPositions.forEach(pos => {
      const wallGeometry = new THREE.BoxGeometry(pos.width, wallHeight, pos.depth);
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos.x, wallHeight/2, pos.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.arenaWalls.push(wall);
      this.scene.add(wall);
    });
  }

  addReferenceObjects() {
    // Add a simple center marker
    const centerGeometry = new THREE.SphereGeometry(1, 16, 16);
    const centerMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
    centerSphere.position.set(0, 1, 0);
    centerSphere.castShadow = true;
    this.scene.add(centerSphere);
  }

  setupResizeHandler() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // Render the scene
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // Get camera for external manipulation
  getCamera() {
    return this.camera;
  }

  // Get scene for adding objects
  getScene() {
    return this.scene;
  }

  // Get renderer for stats
  getRenderer() {
    return this.renderer;
  }

  // Add object to scene
  addObject(object) {
    this.scene.add(object);
  }

  // Remove object from scene
  removeObject(object) {
    this.scene.remove(object);
  }

  // Update method for any animations
  update(deltaTime) {
    // No animations for now - keeping it simple
  }

  // Cleanup method
  dispose() {
    // Clean up geometries and materials
    this.scene.traverse((object) => {
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

    this.renderer.dispose();
    console.log('Scene disposed');
  }
}
