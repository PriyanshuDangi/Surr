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
- **Arena**: 100x100 ground plane with visible boundary walls (center reference ball removed)
- **Camera**: Perspective camera with OrbitControls
- **Lighting**: Ambient + directional lighting
- **Renderer**: WebGL with shadow mapping

#### `game/Player.js` - Player State Management & Interpolation
**Purpose**: Client-side player representation with advanced networking features
```javascript
export class Player { /* Player instance with interpolation */ }
export class PlayerManager { /* Manages all players */ }
export const playerManager = /* Singleton instance */
```

**Key Features**:
- **Class-based Player objects** - Position, rotation, movement, visual mesh
- **PlayerManager singleton** - Centralized player lifecycle management
- **Client-side interpolation** - Smooth remote player movement (Step 5.3)
- **Local vs Remote separation** - Different update logic for each type
- **Network synchronization** - Handles server game state updates

**Interpolation System** (Step 5.3):
- **Buffer system**: Maintains 5 recent position updates per remote player
- **Linear interpolation**: 100ms delay for smooth movement between updates
- **Teleportation detection**: Handles large position jumps (>20 units)
- **Cleanup system**: Automatic buffer management and disconnection handling

**Player Lifecycle**:
- `createPlayer()` - Create player with mesh, nametag, interpolation buffer
- `syncWithGameState()` - Update all players from server data
- `updateInterpolation()` - Smooth remote player movement
- `removePlayer()` - Clean disposal with memory management

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

#### `ui/WelcomeScreen.js` - Player Join Interface (Step 5.4)
**Purpose**: Beautiful welcome screen for player name entry and game joining
```javascript
export function initWelcomeScreen() { /* ... */ }
export function handleJoinGame() { /* ... */ }
```

**Key Features**:
- **Modern UI design** - Fullscreen welcome interface with game branding
- **Name validation** - Real-time validation (2-16 characters)
- **Connection feedback** - Real-time server connection status
- **Join system** - Sends player name to server and handles responses
- **Error handling** - Graceful handling of join failures and timeouts

**State Management**:
- Tracks welcome screen visibility, player name, joining state
- Manages DOM elements and event listeners
- Stores server-assigned player ID for proper identification

#### `ui/Notifications.js` - Visual Feedback System (Step 5.4)
**Purpose**: Toast-style notifications for game events
```javascript
export function showNotification(message, type, duration) { /* ... */ }
export function showPlayerJoinedNotification(name) { /* ... */ }
```

**Key Features**:
- **Toast notifications** - Modern slide-in notifications with animations
- **Multiple types** - Success, error, info, join, leave notifications
- **Queue system** - Handles multiple notifications gracefully
- **Auto-dismiss** - Configurable duration with smooth fade-out

**Event Types**:
- Player join/leave events
- Connection status changes
- Welcome messages
- Error notifications

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

#### `network/SocketManager.js` - Advanced WebSocket Communication
**Purpose**: Sophisticated Socket.IO client with optimizations and callbacks
```javascript
export function initWebSocket() { /* ... */ }
export function broadcastPlayerPosition(data) { /* ... */ }
export function addConnectionCallback(callback) { /* ... */ }
```

**Key Features** (Steps 5.1-5.4):
- **Optimized position broadcasting** - Throttled updates with change detection
- **Connection callbacks** - UI integration for status updates
- **Game state handling** - Centralized server data processing
- **Join/leave system** - Player name-based joining with server responses
- **Weapon collection system** - Server-validated weapon pickup with immediate client feedback

**Position Broadcasting** (Step 5.1):
- **Throttling**: 50ms minimum interval between sends
- **Change detection**: Only sends meaningful position/rotation changes
- **Thresholds**: 0.1 units position, 0.05 radians rotation

**Network Optimizations**:
- **Delta compression** - Only send changes, not full state
- **Connection state tracking** - Real-time status monitoring
- **Retry logic** - Single reconnection attempt with timeout
- **Performance logging** - Statistics for debugging

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
- **No cooldowns**: Removed collection and firing cooldowns for immediate gameplay

### Networking

#### `network/SocketHandler.js` - Advanced Socket Event Management
**Purpose**: Handle all client-server communication with optimized broadcasting
```javascript
export function handleConnection(socket) { /* ... */ }
export function broadcastGameState() { /* ... */ }
export function handleJoinGame(socket, data) { /* ... */ }
```

**Key Features** (Steps 5.1-5.4):
- **Server tick system** - 20Hz game state broadcasting
- **Join/leave handling** - Complete player lifecycle management
- **Position synchronization** - Optimized player movement updates
- **Connection management** - Client tracking with metadata

**Broadcasting System** (Step 5.2):
- **20Hz tick rate** - 50ms intervals for smooth updates
- **Conditional broadcasting** - Only when players are connected
- **State packaging** - Efficient game state serialization
- **Performance logging** - Broadcast statistics and monitoring

**Event Handling**:
- **Connection/Disconnection** - Player lifecycle with cleanup
- **Join Game** - Name-based joining with validation and responses
- **Player Position** - Optimized position updates with throttling
- **Future events** - Ready for missileHit, weaponboxCollected

**State Management**:
- `connectedClients` - Map with socket metadata (playerName, connected state)
- **Server tick interval** - Managed broadcasting lifecycle
- **Client authoritative** - Trusts client position data for performance

---

## Data Flow Architecture

### Client → Server (Enhanced in Phase 5)
1. **Connection**: Client connects via Socket.IO with retry logic
2. **Join Game**: Send player name, receive player ID and welcome message
3. **Position Updates**: Optimized throttled updates (50ms intervals, change detection)
4. **Hit Reports**: Client reports missile hits (no validation) [Future]
5. **Weapon Collection**: Client reports pickup collection [Future]

### Server → Client (Enhanced in Phase 5)
1. **Connection Confirmation**: Welcome message with client ID
2. **Game State Broadcasts**: 20Hz server tick with all player data
3. **Join Responses**: Success/failure feedback for join attempts
4. **Leaderboard Updates**: Score changes and rankings [Future]
5. **Weapon Box Updates**: Availability status [Future]

### Advanced State Synchronization (Phase 5)
- **Client-side interpolation** - Smooth remote player movement with 100ms delay
- **Optimized networking** - Throttled updates with change detection thresholds
- **Event-driven updates** - Position changes only when meaningful
- **Server tick system** - 20Hz broadcasting for consistent updates
- **Player lifecycle** - Complete join/leave handling with visual feedback
- **Connection management** - Real-time status tracking and UI updates

### Network Optimization Features
- **Position throttling** - 50ms minimum intervals, change detection
- **Interpolation buffering** - 5-update buffer per remote player
- **Teleportation handling** - Large jump detection (>20 units)
- **Memory management** - Automatic buffer cleanup and player disposal
- **Cooldown removal** - Eliminated firing and collection cooldowns for responsive gameplay

---

## File Dependencies

### Client Dependency Graph (Updated Phase 5)
```
main.js
├── GameEngine.js
│   ├── Scene.js (Three.js, OrbitControls)
│   ├── SocketManager.js (Socket.IO with optimizations)
│   ├── Player.js (with interpolation)
│   ├── Controls.js
│   ├── WelcomeScreen.js (Step 5.4)
│   ├── Notifications.js (Step 5.4)
│   └── Stats.js
├── tests/
│   ├── interpolation-test.js (Step 5.3)
│   └── join-leave-test.js (Step 5.4)
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

### Network Optimizations (Enhanced Phase 5)
- **Optimized position broadcasting**: 50ms throttling with change detection
- **Client-side interpolation**: Smooth remote player movement
- **Server tick system**: 20Hz broadcasting for consistent updates
- **Change-based updates**: Only send meaningful position/rotation changes
- **Connection callbacks**: Real-time UI status updates
- **Memory management**: Automatic cleanup of disconnected players
- **Buffer management**: Efficient interpolation buffer handling

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

---

## Phase 5 Testing & Debug Tools

### Browser Console Functions
- **`window.debugInterpolation()`** - Display interpolation statistics for all remote players
- **`window.testInterpolation()`** - Run automated interpolation buffer tests
- **`window.testJoinLeave()`** - Validate join/leave system functionality

### Testing Files
- **`tests/interpolation-test.js`** - Comprehensive interpolation system validation
- **`tests/join-leave-test.js`** - Player lifecycle and UI validation tests

### Debug Information
- **Interpolation stats**: Buffer size, last update times, time since updates
- **Network stats**: Position broadcast counts, game state receives
- **Player tracking**: Join/leave events with console logging
- **Connection monitoring**: Real-time status in welcome screen

### Performance Monitoring
- **Stats.js integration**: FPS and frame time monitoring
- **Network throttling**: Position update frequency tracking
- **Memory management**: Player disposal and buffer cleanup logging
- **Server tick statistics**: Broadcast frequency and player counts

This enhanced architecture provides a robust foundation for the multiplayer kart game with advanced networking features, smooth client-side interpolation, and comprehensive player lifecycle management.
