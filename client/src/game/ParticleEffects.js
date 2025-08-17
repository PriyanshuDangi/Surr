// Surr Game - Particle Effects System
// Enhanced visual effects for better game aesthetics

import * as THREE from 'three';
import { addObjectToScene, removeObjectFromScene } from './Scene.js';

// Particle system instances
let particleSystems = new Map();
let nextParticleId = 1;

// Particle presets for different effects
const PARTICLE_PRESETS = {
  speed: {
    particleCount: 20,
    spread: 2.0,
    speed: 5.0,
    life: 0.8,
    color: 0x4FC3F7,
    size: 0.3,
    opacity: 0.7
  },
  explosion: {
    particleCount: 50,
    spread: 8.0,
    speed: 12.0,
    life: 1.5,
    color: 0xFF5722,
    size: 0.8,
    opacity: 0.9
  },
  pickup: {
    particleCount: 15,
    spread: 1.5,
    speed: 3.0,
    life: 1.2,
    color: 0xFFD700,
    size: 0.4,
    opacity: 0.8
  }
};

// Particle system class
class ParticleSystem {
  constructor(config, position) {
    this.id = nextParticleId++;
    this.config = { ...config };
    this.position = new THREE.Vector3().copy(position);
    this.particles = [];
    this.group = new THREE.Group();
    
    // Create particle geometries and materials
    this.geometry = new THREE.SphereGeometry(this.config.size, 8, 6);
    this.material = new THREE.MeshBasicMaterial({
      color: this.config.color,
      transparent: true,
      opacity: this.config.opacity
    });
    
    this.createParticles();
    addObjectToScene(this.group);
    
    this.isActive = true;
    this.startTime = performance.now();
  }
  
  createParticles() {
    for (let i = 0; i < this.config.particleCount; i++) {
      const particle = new THREE.Mesh(this.geometry, this.material.clone());
      
      // Random position within spread
      const spread = this.config.spread;
      particle.position.set(
        this.position.x + (Math.random() - 0.5) * spread,
        this.position.y + (Math.random() - 0.5) * spread,
        this.position.z + (Math.random() - 0.5) * spread
      );
      
      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * this.config.speed,
        Math.random() * this.config.speed * 0.8,
        (Math.random() - 0.5) * this.config.speed
      );
      
      particle.userData = {
        velocity: velocity,
        life: this.config.life + (Math.random() - 0.5) * 0.5,
        maxLife: this.config.life + (Math.random() - 0.5) * 0.5,
        initialOpacity: this.config.opacity
      };
      
      this.particles.push(particle);
      this.group.add(particle);
    }
  }
  
  update(deltaTime) {
    if (!this.isActive) return false;
    
    let aliveParticles = 0;
    
    this.particles.forEach(particle => {
      const data = particle.userData;
      
      if (data.life > 0) {
        // Update position
        particle.position.add(data.velocity.clone().multiplyScalar(deltaTime));
        
        // Apply gravity
        data.velocity.y -= 9.8 * deltaTime;
        
        // Update life
        data.life -= deltaTime;
        
        // Update opacity based on life
        const lifeRatio = data.life / data.maxLife;
        particle.material.opacity = data.initialOpacity * lifeRatio;
        
        // Update scale based on life
        const scale = 0.5 + lifeRatio * 0.5;
        particle.scale.setScalar(scale);
        
        aliveParticles++;
        particle.visible = true;
      } else {
        particle.visible = false;
      }
    });
    
    // System is dead when no particles are alive
    if (aliveParticles === 0) {
      this.dispose();
      return false;
    }
    
    return true;
  }
  
  dispose() {
    this.isActive = false;
    removeObjectFromScene(this.group);
    
    // Dispose geometries and materials
    this.particles.forEach(particle => {
      if (particle.material) {
        particle.material.dispose();
      }
    });
    
    if (this.geometry) {
      this.geometry.dispose();
    }
    
    particleSystems.delete(this.id);
  }
}

// Initialize particle effects system
export function initParticleEffects() {
  console.log('Particle effects system initialized');
}

// Create a particle effect
export function createParticleEffect(type, position) {
  if (!PARTICLE_PRESETS[type]) {
    console.warn(`Unknown particle effect type: ${type}`);
    return null;
  }
  
  const config = PARTICLE_PRESETS[type];
  const particleSystem = new ParticleSystem(config, position);
  particleSystems.set(particleSystem.id, particleSystem);
  
  return particleSystem.id;
}

// Create speed trail effect for fast-moving players
export function createSpeedTrail(playerPosition) {
  return createParticleEffect('speed', playerPosition);
}

// Create explosion effect for missile hits
export function createExplosion(position) {
  return createParticleEffect('explosion', position);
}

// Create pickup collection effect
export function createPickupEffect(position) {
  return createParticleEffect('pickup', position);
}

// Update all particle systems
export function updateParticleEffects(deltaTime) {
  const systemsToRemove = [];
  
  particleSystems.forEach((system, id) => {
    if (!system.update(deltaTime)) {
      systemsToRemove.push(id);
    }
  });
  
  // Clean up finished systems
  systemsToRemove.forEach(id => {
    const system = particleSystems.get(id);
    if (system) {
      system.dispose();
    }
  });
}

// Dispose all particle systems
export function disposeParticleEffects() {
  particleSystems.forEach(system => {
    system.dispose();
  });
  particleSystems.clear();
  console.log('Particle effects system disposed');
}

// Get active particle system count (for debugging)
export function getActiveParticleCount() {
  return particleSystems.size;
}
