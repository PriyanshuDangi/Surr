# Car Configuration Guide

## Overview
All car-related settings are centralized in `src/game/Player.js` under the `CAR_CONFIG` object. This makes it easy to adjust car behavior, appearance, and scale in one place.

## Quick Configuration Changes

### Change Car Size
```javascript
// In Player.js, modify:
SCALE: 2.5,  // Change this value (1.0 = original size, 2.0 = double size, etc.)
```

### Change Car Model
```javascript
// In Player.js, modify:
MODEL_PATH: '/assets/glb/your-car-model.glb',
```

### Change Player Colors
```javascript
// In Player.js, modify:
LOCAL_PLAYER_COLOR: 0x4CAF50,   // Green for local player
REMOTE_PLAYER_COLOR: 0xFF5722,  // Orange for remote players
```

### Adjust Movement Speed
```javascript
// In Player.js, modify:
MAX_SPEED: 15,      // Maximum movement speed
ACCELERATION: 25,   // How fast cars accelerate
TURN_SPEED: 3.5,    // How fast cars turn
```

### Configure Front Wheel Steering
```javascript
// In Player.js, modify:
FRONT_WHEEL: {
  MAX_STEERING_ANGLE: Math.PI / 6,  // 30 degrees max steering
  STEERING_SPEED: 8.0,              // How fast wheels turn when steering
  FRONT_THRESHOLD: 'auto',          // 'auto', 'high', or 'low'
}
```

### Fix Wrong Wheel Detection
If the wrong wheels are turning (back instead of front):

```javascript
// Try this first:
FRONT_THRESHOLD: 'low',  // Use wheels at lower Z coordinates as front

// If that doesn't work:
FRONT_THRESHOLD: 'high', // Use wheels at higher Z coordinates as front
```

## Advanced Usage

### Using the Scaling Helper Function
```javascript
import { createScaledCarConfig } from './game/Player.js';

// Create a configuration for smaller cars
const smallCarConfig = createScaledCarConfig(1.5);

// Create a configuration for larger cars  
const bigCarConfig = createScaledCarConfig(3.0);
```

## Important Notes

1. **Proportional Scaling**: When changing `SCALE`, the weapon positions and missile spawn points automatically scale proportionally.

2. **Ground Level**: All cars sit at `GROUND_LEVEL: 0`. The bounding box calculation ensures the car's bottom touches the ground regardless of the model's internal pivot point.

3. **Name Tags**: Positioned at `NAME_TAG_HEIGHT` units above each car. This scales proportionally with car size.

4. **Arena Boundaries**: Set by `ARENA_BOUNDARY` to prevent cars from going through arena walls.

## Configuration Properties

| Property | Description | Default Value |
|----------|-------------|---------------|
| `MODEL_PATH` | Path to the GLB car model | `/assets/glb/race.glb` |
| `SCALE` | Car model scale multiplier | `2.5` |
| `GROUND_LEVEL` | Y-position for ground plane | `0` |
| `NAME_TAG_HEIGHT` | Height of name tags above cars | `5` |
| `MAX_SPEED` | Maximum movement speed | `15` |
| `LOCAL_PLAYER_COLOR` | Color for local player | `0x4CAF50` (Green) |
| `REMOTE_PLAYER_COLOR` | Color for remote players | `0xFF5722` (Orange) |
| `FRONT_WHEEL.MAX_STEERING_ANGLE` | Maximum steering angle | `Math.PI / 6` (30°) |
| `FRONT_WHEEL.STEERING_SPEED` | Front wheel turning speed | `8.0` |
| `FRONT_WHEEL.FRONT_THRESHOLD` | Front wheel detection mode | `'auto'` |

For a complete list of all properties, see the `CAR_CONFIG` object in `src/game/Player.js`.
