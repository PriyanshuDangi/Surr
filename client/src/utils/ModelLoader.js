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

  // Set material color for a model (simple single-color approach)
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

  // Advanced race car coloring system - colors different parts differently
  setRaceCarColors(model, isLocal, partConfig) {
    if (!model || !model.scene) return;
    
    console.log(`🎨 Applying race car colors for ${isLocal ? 'local' : 'remote'} player`);
    
    let coloredParts = {
      tires: 0,
      body: 0,
      wings: 0,
      details: 0,
      glass: 0,
      other: 0
    };
    
    model.scene.traverse((node) => {
      if (node.isMesh && node.material) {
        const nodeName = node.name.toLowerCase();
        const partInfo = this.identifyCarPart(nodeName, partConfig);
        
        console.log(`🔧 Processing part: "${node.name}" → ${partInfo.type}`);
        
        // Apply appropriate material and color based on part type
        this.applyCarPartMaterial(node, partInfo, isLocal);
        
        // Count colored parts for debugging
        coloredParts[partInfo.type]++;
      }
    });
    
    console.log('🎨 Colored parts summary:', coloredParts);
  }
  
  // Identify what type of car part a mesh represents
  identifyCarPart(nodeName, partConfig) {
    // Check tires/wheels first (most specific)
    if (partConfig.TIRES.NAMES.some(name => nodeName.includes(name.toLowerCase()))) {
      return {
        type: 'tires',
        config: partConfig.TIRES,
        color: partConfig.TIRES.COLOR,
        materialType: partConfig.TIRES.MATERIAL_TYPE
      };
    }
    
    // Check wings/spoilers
    if (partConfig.WINGS.NAMES.some(name => nodeName.includes(name.toLowerCase()))) {
      return {
        type: 'wings',
        config: partConfig.WINGS,
        materialType: partConfig.WINGS.MATERIAL_TYPE
      };
    }
    
    // Check glass parts
    if (partConfig.GLASS.NAMES.some(name => nodeName.includes(name.toLowerCase()))) {
      return {
        type: 'glass',
        config: partConfig.GLASS,
        color: partConfig.GLASS.COLOR,
        materialType: partConfig.GLASS.MATERIAL_TYPE,
        opacity: partConfig.GLASS.OPACITY
      };
    }
    
    // Check detail parts
    if (partConfig.DETAILS.NAMES.some(name => nodeName.includes(name.toLowerCase()))) {
      return {
        type: 'details',
        config: partConfig.DETAILS,
        color: partConfig.DETAILS.COLOR,
        materialType: partConfig.DETAILS.MATERIAL_TYPE
      };
    }
    
    // Check body parts
    if (partConfig.BODY.NAMES.some(name => nodeName.includes(name.toLowerCase()))) {
      return {
        type: 'body',
        config: partConfig.BODY,
        materialType: partConfig.BODY.MATERIAL_TYPE
      };
    }
    
    // Default fallback
    return {
      type: 'other',
      config: partConfig.DEFAULT,
      materialType: partConfig.DEFAULT.MATERIAL_TYPE
    };
  }
  
  // Apply appropriate material and coloring to a car part
  applyCarPartMaterial(node, partInfo, isLocal) {
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    
    materials.forEach(material => {
      // Determine the color to use
      let color;
      if (partInfo.color !== undefined) {
        // Fixed color (like tires, details, glass)
        color = partInfo.color;
      } else if (partInfo.config.LOCAL_COLOR !== undefined) {
        // Team-based color (like body, wings)
        color = isLocal ? partInfo.config.LOCAL_COLOR : partInfo.config.REMOTE_COLOR;
      } else {
        // Fallback to default team colors
        color = isLocal ? partInfo.config.LOCAL_COLOR || 0x4CAF50 : partInfo.config.REMOTE_COLOR || 0xFF5722;
      }
      
      // Apply the color
      if (material.color) {
        material.color.setHex(color);
      }
      
      // Enhanced material properties for better visuals
      switch (partInfo.materialType) {
        case 'metallic':
          if (material.metalness !== undefined) material.metalness = 0.9;
          if (material.roughness !== undefined) material.roughness = 0.1;
          if (material.emissive !== undefined) material.emissive.setHex(0x111111);
          if (material.envMapIntensity !== undefined) material.envMapIntensity = 1.0;
          break;
          
        case 'matte':
          if (material.metalness !== undefined) material.metalness = 0.0;
          if (material.roughness !== undefined) material.roughness = 1.0;
          if (material.emissive !== undefined) material.emissive.setHex(0x000000);
          break;
          
        case 'plastic':
          if (material.metalness !== undefined) material.metalness = 0.0;
          if (material.roughness !== undefined) material.roughness = 0.3;
          if (material.clearcoat !== undefined) material.clearcoat = 0.8;
          if (material.clearcoatRoughness !== undefined) material.clearcoatRoughness = 0.1;
          break;
          
        case 'glass':
          if (material.metalness !== undefined) material.metalness = 0.0;
          if (material.roughness !== undefined) material.roughness = 0.0;
          if (material.transparent !== undefined) {
            material.transparent = true;
            material.opacity = partInfo.opacity || 0.7;
          }
          if (material.transmission !== undefined) material.transmission = 0.9;
          if (material.ior !== undefined) material.ior = 1.5;
          break;
          
        default: // 'standard'
          if (material.metalness !== undefined) material.metalness = 0.4;
          if (material.roughness !== undefined) material.roughness = 0.4;
          if (material.emissive !== undefined) material.emissive.setHex(0x050505);
          break;
      }
      
      // Ensure the material updates
      material.needsUpdate = true;
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
