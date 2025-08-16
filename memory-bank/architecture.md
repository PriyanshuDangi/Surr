# Surr Game Architecture Documentation

## Overview
Surr uses a **function-based architecture** with clear separation between client and server. This document explains the purpose and functionality of each file for future developers.

## Architecture Principles

### Function-Based Design
- **No classes** - all modules export functions
- **Module-level state** - variables declared at module scope
- **Direct imports** - import only the functions you need
- **Stateless where possible** - functions receive and return data

### Client-Server Separation
- **Client**: Rendering, input, client-side physics, UI
- **Server**: Game state, player management, networking
- **Communication**: Socket.IO for real-time updates

---

## Client Architecture (`/client/src/`)

### Entry Point
**`main.js`** - Application bootstrap
```javascript
// Simple entry point that initializes the game engine
import { initGameEngine, setupVisibilityHandling } from './game/GameEngine.js';
```
- Initializes the game engine
- Sets up visibility handling for performance
- **No complex initialization** - just function calls

### Core Game Systems

#### `game/GameEngine.js` - Main Game Loop Manager
**Purpose**: Manages the core game loop and coordinates all systems
```javascript
export function initGameEngine() { /* ... */ }
export function startGameEngine() { /* ... */ }
export function getDeltaTime() { /* ... */ }
```

**Key Functions**:
- `initGameEngine()` - Sets up scene, stats, and socket connection
- `startGameEngine()`/`stopGameEngine()` - Control game loop
- `setupVisibilityHandling()` - Pause when tab not visible
- `getDeltaTime()` - Get frame time for smooth animations

**State Management**:
- `scene` - Three.js scene instance
- `stats` - Performance monitoring
- `lastTime` - For delta time calculation
- `isRunning` - Game loop state

#### `game/Scene.js` - 3D Rendering & Scene Management
**Purpose**: Manages Three.js scene, camera, lighting, and arena
```javascript
export function initScene() { /* ... */ }
export function updateScene(deltaTime) { /* ... */ }
export function getCamera() { /* ... */ }
```

**Key Functions**:
- `initScene()` - Creates renderer, camera, lighting, arena
- `updateScene(deltaTime)` - Updates controls and animations
- `renderScene()` - Renders the frame
- `addObject()`/`removeObject()` - Scene graph management

**Scene Components**:
- **Arena**: 100x100 ground plane with visible boundary walls
- **Camera**: Perspective camera with OrbitControls
- **Lighting**: Ambient + directional lighting
- **Renderer**: WebGL with shadow mapping

#### `game/Player.js` - Player State Management
**Purpose**: Client-side player representation and management
```javascript
export function createPlayer(id, name, position) { /* ... */ }
export function updatePlayerPosition(id, position, rotation) { /* ... */ }
```

**Key Functions**:
- `createPlayer()` - Create new player object
- `getPlayer()`/`getAllPlayers()` - Access player data
- `updatePlayerPosition()` - Update player transform
- `removePlayer()` - Clean up player

**State Storage**:
- Uses `Map<string, object>` for efficient player lookup
- Each player has: id, name, position, rotation, score, isAlive, weapon

#### `game/Controls.js` - Input Handling
**Purpose**: Keyboard/mouse input processing
```javascript
export function initControls() { /* ... */ }
export function getInputState() { /* ... */ }
```

**Key Functions**:
- `initControls()` - Set up event listeners
- `getInputState()` - Get current input state
- `isMoving()` - Check if player is providing input
- `disposeControls()` - Clean up event listeners

**Input State**:
- Tracks WASD keys, mouse movement, special keys
- Returns normalized input values for smooth movement

### User Interface

#### `ui/UI.js` - General UI Utilities
**Purpose**: Common UI functions and connection status
```javascript
export function showConnectionStatus(status) { /* ... */ }
export function updateUIElement(id, content) { /* ... */ }
```

**Key Functions**:
- `initUI()` - Initialize UI elements
- `showConnectionStatus()` - Display connection state
- `updateUIElement()` - Generic DOM updates

#### `ui/Leaderboard.js` - Leaderboard Display
**Purpose**: Real-time leaderboard updates
```javascript
export function updateLeaderboard(players) { /* ... */ }
export function showLeaderboard() { /* ... */ }
```

**Key Functions**:
- `initLeaderboard()` - Set up leaderboard container
- `updateLeaderboard()` - Update with latest scores
- `showLeaderboard()`/`hideLeaderboard()` - Visibility control

### Networking

#### `network/SocketManager.js` - WebSocket Communication
**Purpose**: Simple Socket.IO client wrapper
```javascript
export function initWebSocket() { /* ... */ }
export function getSocket() { /* ... */ }
```

**Key Functions**:
- `initWebSocket()` - Connect to server with retry logic
- `getSocket()` - Get socket instance for sending messages
- `isSocketConnected()` - Check connection status

**Features**:
- **Simple connection** - no complex reconnection logic
- **Single retry** - attempts reconnection once on error
- **Connection status** - tracks connected state

---

## Server Architecture (`/server/src/`)

### Entry Point
**`server.js`** - Server Bootstrap
```javascript
import { initGameState } from './game/GameState.js';
import { initSocketHandler, handleConnection } from './network/SocketHandler.js';
```
- Express server setup with CORS
- Socket.IO initialization
- Game system initialization
- **Function-based startup** - no class instantiation

### Game State Management

#### `game/GameState.js` - Centralized State Manager
**Purpose**: Manages all players and game objects
```javascript
export function addPlayer(id, name) { /* ... */ }
export function getGameStateForBroadcast() { /* ... */ }
```

**Key Functions**:
- `addPlayer()`/`removePlayer()` - Player lifecycle
- `updatePlayerPosition()` - Position synchronization
- `getGameStateForBroadcast()` - Serialize for network
- `getLeaderboard()` - Sorted scores
- `awardPoints()` - Score management

**State Storage**:
- `players` - Map of all connected players
- `weaponBoxes` - Map of weapon pickups
- `maxPlayers` - 6 player limit

#### `game/Player.js` - Player Utilities
**Purpose**: Player object creation and validation
```javascript
export function createPlayer(id, name) { /* ... */ }
export function validatePlayerPosition(position) { /* ... */ }
```

**Key Functions**:
- `createPlayer()` - Create standardized player object
- `validatePlayerPosition()`/`validatePlayerRotation()` - Input validation
- `serializePlayer()` - Prepare for network transmission

#### `game/WeaponBox.js` - Weapon Pickup System
**Purpose**: Weapon pickup spawning and collection
```javascript
export function createWeaponBox(position) { /* ... */ }
export function collectWeaponBox(id) { /* ... */ }
```

**Key Functions**:
- `initWeaponBoxes()` - Reset weapon box state
- `createWeaponBox()` - Spawn at predefined locations
- `collectWeaponBox()` - Handle pickup with respawn timer
- `getAvailableWeaponBoxes()` - Get collectable boxes

**Features**:
- **Auto-respawn**: 15-second timer using setTimeout
- **9 predefined locations** - equidistant placement
- **Availability tracking** - prevents double collection

### Networking

#### `network/SocketHandler.js` - Socket Event Management
**Purpose**: Handle all client-server communication
```javascript
export function handleConnection(socket) { /* ... */ }
export function broadcastGameState() { /* ... */ }
```

**Key Functions**:
- `initSocketHandler()` - Initialize with Socket.IO instance
- `handleConnection()` - New client connection setup
- `broadcastGameState()` - Send updates to all clients
- `broadcastLeaderboard()` - Send score updates

**Event Handling**:
- **Connection/Disconnection** - Player lifecycle
- **Join Game** - Name-based joining with validation
- **Future events** - playerPosition, missileHit, weaponboxCollected

**State Management**:
- `connectedClients` - Map of socket connections
- **No server-side validation** - client authoritative approach

---

## Data Flow Architecture

### Client → Server
1. **Connection**: Client connects via Socket.IO
2. **Join Game**: Send player name, receive player ID
3. **Position Updates**: Send position/rotation changes only
4. **Hit Reports**: Client reports missile hits (no validation)
5. **Weapon Collection**: Client reports pickup collection

### Server → Client
1. **Connection Confirmation**: Welcome message with client ID
2. **Game State Broadcasts**: Player positions, counts, status
3. **Leaderboard Updates**: Score changes and rankings
4. **Weapon Box Updates**: Availability status

### State Synchronization
- **Event-driven updates** - only send changes, not continuous data
- **Client authoritative** - server trusts client hit detection
- **Broadcast patterns** - state changes sent to all clients
- **No interpolation** - simple position updates

---

## File Dependencies

### Client Dependency Graph
```
main.js
├── GameEngine.js
│   ├── Scene.js (Three.js, OrbitControls)
│   ├── SocketManager.js (Socket.IO)
│   └── Stats.js
├── Player.js
├── Controls.js
├── UI.js
└── Leaderboard.js
```

### Server Dependency Graph
```
server.js
├── GameState.js
├── Player.js
├── WeaponBox.js
└── SocketHandler.js
    └── GameState.js (imports functions)
```

---

## Performance Considerations

### Client Optimizations
- **Function-based**: No class instantiation overhead
- **Module state**: Efficient variable access
- **OrbitControls**: Smooth camera interaction
- **Stats.js**: Professional performance monitoring
- **Visibility API**: Pause when tab hidden

### Server Optimizations
- **Map storage**: O(1) player lookup
- **Event-driven**: No unnecessary polling
- **Minimal validation**: Trust client for performance
- **Direct function calls**: No method dispatch overhead

### Network Optimizations
- **Change-based updates**: Only send position changes
- **No velocity sync**: Client handles movement prediction
- **Batch broadcasts**: Single update to all clients
- **Simple protocol**: Minimal message structure

---

## Development Guidelines

### Adding New Features
1. **Choose appropriate module** - don't create new files unnecessarily
2. **Export functions** - maintain function-based pattern
3. **Module-level state** - avoid global variables
4. **Clear function names** - describe what function does
5. **Minimal parameters** - keep function signatures simple

### Testing Approach
- **Unit test functions** - easier than testing classes
- **Mock module state** - reset between tests
- **Integration tests** - test client-server communication
- **Performance tests** - monitor FPS and bandwidth

### Debugging Tips
- **Console logging** - extensive logging in place
- **Stats.js overlay** - real-time performance data
- **Network tab** - monitor Socket.IO messages
- **Function call stack** - easier to trace than class methods

This architecture provides a solid foundation for the multiplayer kart game while maintaining simplicity and performance.
