// Surr Game - Model Loader Utility
// Utility for loading 3D models (GLB/GLTF) with Three.js

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class ModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.loadedModels = new Map(); // Cache for loaded models
  }

  // Load a GLB/GLTF model
  async loadModel(url) {
    // Check if model is already cached
    if (this.loadedModels.has(url)) {
      console.log(`Model already cached: ${url}`);
      return this.cloneModel(this.loadedModels.get(url));
    }

    console.log(`Loading model: ${url}`);
    
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          console.log(`✅ Model loaded successfully: ${url}`);
          console.log(`🚗 Model details:`, {
            animations: gltf.animations?.length || 0,
            scenes: gltf.scenes?.length || 0,
            meshes: gltf.scene.children?.length || 0
          });
          
          // Store the original model in cache
          this.loadedModels.set(url, gltf);
          
          // Return a clone for use
          resolve(this.cloneModel(gltf));
        },
        (progress) => {
          if (progress.total > 0) {
            const percentage = (progress.loaded / progress.total) * 100;
            console.log(`📥 Loading progress for ${url}: ${percentage.toFixed(1)}%`);
          } else {
            console.log(`📥 Loading ${url}... (${progress.loaded} bytes)`);
          }
        },
        (error) => {
          console.error(`❌ Failed to load model: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  // Clone a loaded model for reuse
  cloneModel(gltf) {
    const scene = gltf.scene.clone(true);
    
    // Ensure all materials are properly cloned
    scene.traverse((node) => {
      if (node.isMesh) {
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material = node.material.map(mat => mat.clone());
          } else {
            node.material = node.material.clone();
          }
        }
        
        // Enable shadows
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    return {
      scene: scene,
      animations: gltf.animations ? [...gltf.animations] : [],
      userData: gltf.userData ? { ...gltf.userData } : {}
    };
  }

  // Set material color for a model
  setModelColor(model, color) {
    if (!model || !model.scene) return;
    
    model.scene.traverse((node) => {
      if (node.isMesh && node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach(mat => {
            if (mat.color) {
              mat.color.setHex(color);
            }
          });
        } else {
          if (node.material.color) {
            node.material.color.setHex(color);
          }
        }
      }
    });
  }

  // Set model scale
  setModelScale(model, scale) {
    if (!model || !model.scene) return;
    
    if (typeof scale === 'number') {
      model.scene.scale.setScalar(scale);
    } else {
      model.scene.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
    }
  }

  // Clear cache
  clearCache() {
    this.loadedModels.clear();
    console.log('Model cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cachedModels: this.loadedModels.size,
      modelUrls: Array.from(this.loadedModels.keys())
    };
  }
}

// Export singleton instance
export const modelLoader = new ModelLoader();

// Export class for potential multiple instances
export { ModelLoader };
