# Surr Game - Implementation Plan

## Phase 1: Project Foundation & Setup

### Step 1.1: Initialize Project Structure
**Objective:** Create the basic project structure with separate client and server directories.

**Actions:**
- Create root directory `Surr/`
- Create `client/` directory for frontend code
- Create `server/` directory for backend code
- Create `client/assets/` directory for 3D models (car.glb only)
- Initialize `package.json` in both `client/` and `server/` directories
- Set up `.gitignore` files for both directories
- Use Node.js version 20 for both client and server

**Test:** Verify directory structure exists and both package.json files are properly initialized.

### Step 1.2: Install Client Dependencies
**Objective:** Install all required frontend packages.

**Actions:**
- Install Vite as dev dependency in `client/`
- Install Three.js as dependency in `client/`
- Install cannon-es (upgraded from legacy Cannon.js) as dependency in `client/`
- Install socket.io-client as dependency in `client/`
- Configure Vite config file for development server

**Test:** Run `npm install` successfully and verify all packages appear in `package.json`.

### Step 1.3: Install Server Dependencies
**Objective:** Install all required backend packages.

**Actions:**
- Install Node.js Express framework in `server/`
- Install Socket.IO server package in `server/`
- Install cors middleware for cross-origin requests
- Install nodemon as dev dependency for auto-restart during development
- Install prettier for code formatting and linting

**Test:** Run `npm install` successfully and verify all packages appear in `package.json`.

### Step 1.4: Create Basic File Structure
**Objective:** Set up modular file organization for both client and server.

**Actions:**
- In `client/src/`: Create `main.js`, `game/`, `network/`, `ui/`, `utils/` directories
- In `client/src/game/`: Create `GameEngine.js`, `Player.js`, `Scene.js`, `Controls.js` files
- In `client/src/network/`: Create `SocketManager.js` file
- In `client/src/ui/`: Create `UI.js`, `Leaderboard.js` files
- In `server/src/`: Create `server.js`, `game/`, `network/` directories  
- In `server/src/game/`: Create `GameState.js`, `Player.js`, `WeaponBox.js` files
- In `server/src/network/`: Create `SocketHandler.js` file

**Test:** Verify all directories and empty files are created with proper naming convention.

## Phase 2: Backend Foundation

### Step 2.1: Create Basic Express Server
**Objective:** Set up minimal Express server that serves static files.

**Actions:**
- Create basic Express server in `server/src/server.js`
- Configure CORS middleware for client connections
- Set up static file serving for client assets
- Configure server to listen on port 5173
- Add basic error handling and logging

**Test:** Start server with `node server.js` and verify it runs without errors on port 5173.

### Step 2.2: Integrate Socket.IO Server
**Objective:** Add real-time communication capabilities to the server.

**Actions:**
- Import and configure Socket.IO server in `server.js`
- Create basic connection event handler
- Add disconnect event handler with logging
- Create placeholder for game-specific socket events
- Test socket connection endpoint

**Test:** Server starts successfully and shows "Socket.IO server ready" message.

### Step 2.3: Create Modular Socket Handler
**Objective:** Separate socket logic into dedicated module.

**Actions:**
- Move socket event handling logic to `SocketHandler.js`
- Export socket handler as module from `SocketHandler.js`
- Import and use socket handler in main `server.js`
- Create separate methods for each socket event type
- Add basic logging for connection/disconnection events

**Test:** Server starts successfully and connection/disconnection events are logged properly.

### Step 2.4: Create Basic Game State Manager
**Objective:** Set up centralized game state management.

**Actions:**
- Create `GameState.js` class to manage overall game state
- Add methods to track connected players
- Add methods to manage player positions
- Add methods to handle player joining/leaving
- Create singleton pattern for game state access

**Test:** Create test script that instantiates GameState and verifies basic player management works.

## Phase 3: Frontend Foundation

### Step 3.1: Set Up Basic HTML Structure
**Objective:** Create minimal HTML page with game container.

**Actions:**
- Create `client/index.html` with basic structure
- Add canvas element for Three.js rendering
- Add basic CSS for full-screen game view, create a seprate css file for this
- Include div elements for UI overlays (leaderboard, controls info)
- Configure Vite to serve this HTML file

**Test:** Run `npm run dev` in client directory and verify HTML page loads in browser.

### Step 3.2: Initialize Three.js Scene
**Objective:** Create basic 3D scene with camera and renderer.

**Actions:**
- Create `Scene.js` module to manage Three.js scene setup
- Initialize WebGL renderer with proper canvas targeting
- Set up perspective camera with appropriate FOV and position
- Add basic ambient and directional lighting
- Create method to handle window resizing
- Add basic ground plane geometry for reference

**Test:** Browser shows black screen with visible ground plane when page loads.

### Step 3.3: Create Game Engine Core
**Objective:** Set up main game loop and engine structure.

**Actions:**
- Create `GameEngine.js` as main game controller
- Implement game loop using requestAnimationFrame
- Add methods for initialization, update, and render cycles
- Integrate Scene.js into the game engine
- remove any fps code if manually added and use stats.js
- also add orbitcontrols to the scene

**Test:** Browser shows consistent frame rate counter and Three.js scene renders smoothly.

### Step 3.4: Set Up Socket Connection Manager
**Objective:** Create modular socket communication handler.

**Actions:**
- Create `SocketManager.js` to handle all client-server communication
- Add connection establishment with proper error handling
- Create event emitter pattern for socket events
- Add methods to send/receive player data
- Add connection status indicators

**Test:** Client successfully connects to server and connection status is displayed in console.

## Phase 4: Basic Player System

### Step 4.1: Create Player Class (Client)
**Objective:** Set up player representation on client side.

**Actions:**
- Create `Player.js` class for client-side player management
- Add properties for position, rotation, speed
- Add method to create basic cube geometry as placeholder kart
- Add method to update player position in scene
- Create separate instances for local player vs other players

**Test:** Browser shows a colored cube representing the player in the 3D scene.

### Step 4.2: Implement Basic Input Handling
**Objective:** Capture keyboard input for player movement.

**Actions:**
- Create `Controls.js` module for input management
- Add event listeners for keydown/keyup events (WASD, arrow keys, spacebar)
- Track input state in object (which keys are currently pressed)
- Create method to get current input state
- Add method to handle window focus/blur for input cleanup

**Test:** Console logs show correct key state changes when pressing movement keys.

### Step 4.3: Add Local Player Movement
**Objective:** Make player cube move based on keyboard input.

**Actions:**
- Integrate Controls.js into GameEngine update loop
- Add movement calculations to Player.js (forward/backward, turning)
- Implement basic speed and momentum for realistic movement
- Add camera follow logic to track player movement
- Ensure smooth interpolated movement

**Test:** Player cube moves around scene smoothly with WASD controls and camera follows.

### Step 4.4: Create Server-Side Player Management
**Objective:** Set up player data management on server.

**Actions:**
- Create server-side `Player.js` class to track player state
- Add properties for ID, name, position, rotation, score, isAlive, weapon (missile or null)
- Add methods to update position and validate player data
- Integrate player management with GameState.js
- Add method to serialize player data for network transmission

**Test:** Server can create, update, and manage multiple player instances in memory.

## Phase 5: Multiplayer Synchronization

### Step 5.1: Implement Position Broadcasting (Client to Server)
**Objective:** Send local player position to server continuously.

**Actions:**
- Add position update event to client SocketManager
- Send player position data to server only when position, rotation, or state changes
- Include position, rotation, and player state in updates (no speed needed)
- Add throttling to prevent excessive network traffic
- Add error handling for network issues

**Test:** Server console shows incoming position updates from connected client.

### Step 5.2: Implement Position Broadcasting (Server to All Clients)
**Objective:** Distribute all player positions to all connected clients.

**Actions:**
- Add game state broadcast event to server SocketHandler
- Broadcast current positions of all players to all clients
- Send updates at 20Hz tick rate
- Include all necessary game state data in broadcasts
- Add method to handle disconnecting players

**Test:** Multiple browser tabs can connect and see each other's movement in real-time.

### Step 5.3: Add Client-Side Interpolation
**Objective:** Smooth out network lag and jitter for other players.

**Actions:**
- Implement position interpolation for remote players in Player.js
- Add buffering system for incoming position updates
- Use linear interpolation between received positions
- Handle edge cases (large position jumps, disconnections)
- Maintain separate update logic for local vs remote players

**Test:** Remote players move smoothly even with simulated network delay.

### Step 5.4: Handle Player Join/Leave Events
**Objective:** Properly manage players entering and leaving the game.

**Actions:**
- Add join game event that sends player name to server
- Create UI input field for player name entry
- Add logic to spawn/despawn player objects in scene
- Update game state when players connect/disconnect  
- Add visual feedback for players joining/leaving

**Test:** Players can join with custom names and appear/disappear correctly.

## Phase 6: Physics Integration

### Step 6.1: Set Up Cannon.js Physics World
**Objective:** Initialize physics simulation for realistic movement.

**Actions:**
- Create physics world in Scene.js with proper gravity settings
- Add 100x100 unit flat ground plane as static physics body
- Add visible walls around arena perimeter for boundaries
- Set up physics step timing in game loop
- Configure collision detection parameters
- Add debug renderer to visualize physics bodies

**Test:** Physics world runs without errors and debug renderer shows ground collision.

### Step 6.2: Add Physics Bodies for Players
**Objective:** Make players interact with physics system.

**Actions:**
- Create physics body for player kart (box or capsule shape)
- Synchronize Three.js mesh position with physics body
- Replace simple movement with physics-based forces
- Adjust mass, friction, and restitution for realistic kart behavior
- Add constraints to prevent tipping over
- Add collision detection between player karts
- Reference car implementation from Sketchbook project (Car.ts) using car.glb model

**Test:** Player kart has realistic acceleration, deceleration, and turning physics.

### Step 6.3: Implement Kart-Style Movement
**Objective:** Create satisfying arcade kart driving mechanics.

**Actions:**
- Add engine force for acceleration/braking
- Implement turning mechanics with proper steering angles
- Add drift/slide mechanics for arcade feel
- Balance speed, acceleration, and handling parameters
- Add particle effects for wheel dust/smoke

**Test:** Kart movement feels responsive and fun, similar to arcade kart games.

### Step 6.4: Synchronize Physics Across Network
**Objective:** Ensure physics consistency between clients.

**Actions:**
- Send physics-based positions instead of direct positions
- Add speed and angular velocity to network updates
- Implement client-side prediction for local player
- Add server reconciliation for position corrections
- Handle physics state synchronization edge cases

**Test:** Multiple clients maintain consistent physics behavior and positions.

## Phase 7: Arena Environment

### Step 7.1: Create Basic Arena Boundaries
**Objective:** Add walls to contain the playing area.

**Actions:**
- Add visible wall colliders around play area perimeter
- Create visual boundary indicators (walls or barriers)
- Set up physics collision for arena boundaries
- Add collision response to prevent players from escaping
- Configure appropriate arena size for gameplay

**Test:** Players cannot drive outside arena boundaries and collide realistically with walls.

### Step 7.2: Add Visual Arena Elements
**Objective:** Create an engaging visual environment.

**Actions:**
- Replace plain ground with textured surface
- Add basic arena decorations (barriers, ramps, obstacles)
- Set up appropriate lighting for the arena
- Add skybox or environment background
- Optimize rendering performance for multiple players

**Test:** Arena looks visually appealing and maintains 60fps with multiple players.

### Step 7.3: Place Strategic Elements
**Objective:** Add gameplay elements to the arena layout.

**Actions:**
- Add ramps and elevation changes for interesting gameplay
- Place cover objects and strategic positions
- Create open areas for combat and tight areas for escape
- Balance arena layout for fair gameplay
- Add physics colliders for all arena elements

**Test:** Arena provides interesting tactical gameplay opportunities and all collisions work.

### Step 7.4: Optimize Arena Performance
**Objective:** Ensure arena runs smoothly with all players and effects.

**Actions:**
- Implement level-of-detail (LOD) for distant objects
- Use efficient collision shapes for physics
- Optimize texture sizes and compression
- Implement frustum culling for non-visible objects
- Profile and optimize rendering performance

**Test:** Arena maintains stable framerate with maximum expected player count.

## Phase 8: Weapon System Foundation

### Step 8.1: Create Weapon Pickup System (Server)
**Objective:** Implement server-side weapon pickup management.

**Actions:**
- Create `WeaponBox.js` class to manage weapon pickups
- Add methods to spawn pickups at random arena locations
- Implement 15-second respawn timer for collected pickups
- Add collision detection for pickup collection
- Place 9 weapon pickups at predefined equidistant locations
- Use simple box geometry for weapon pickup visualization
- Track weapon pickup states in game state

**Test:** Server spawns weapon pickups and handles collection/respawn timing correctly.

### Step 8.2: Visualize Weapon Pickups (Client)
**Objective:** Display weapon pickups in the game world.

**Actions:**
- Create visual representation for weapon pickups (rotating box/sphere)
- Add pickup objects to Three.js scene based on server data
- Implement collection animation when pickup is obtained
- Add particle effects or glow for pickup visibility
- Update pickup display based on server state

**Test:** Weapon pickups are visible in game world and animate when collected.

### Step 8.3: Implement Pickup Collection
**Objective:** Allow players to collect weapon pickups.

**Actions:**
- Add collision detection between player and pickups on client
- Send pickup collection event to server when collision occurs
- Update player weapon state when pickup is collected
- Add visual/audio feedback for successful collection
- Handle network latency for pickup collection conflicts

**Test:** Players can collect weapon pickups and receive visual feedback.

### Step 8.4: Create Player Weapon State
**Objective:** Track which weapons each player currently has.

**Actions:**
- Add weapon inventory to both client and server Player classes
- Implement if the player has a weapon now or not
- Synchronize weapon state across all clients
- During respawning the player will have no weapon

**Test:** Player weapon count updates correctly and is visible to all players.

## Phase 9: Missile Combat System

### Step 9.1: Create Missile Class (Client)
**Objective:** Implement client-side missile projectiles.

**Actions:**
- Create `Missile.js` class for projectile management
- Add physics body for missile with appropriate collision shape
- Implement straight-line trajectory from shooter position
- Add visual representation (simple geometry or 3D model)
- Set missile speed and lifetime parameters

**Test:** Missiles spawn and travel in straight lines when fired by local player.

### Step 9.2: Implement Missile Firing
**Objective:** Allow players to shoot missiles with spacebar.

**Actions:**
- Add missile firing logic to player input handling
- Check for available missiles before firing
- Create missile at player position with correct direction
- Reduce player missile count when firing
- Add firing cooldown to prevent rapid-fire exploit

**Test:** Player can fire missiles using spacebar and missile count decreases correctly.

### Step 9.3: Add Missile Collision Detection
**Objective:** Detect when missiles hit players or walls.

**Actions:**
- Implement collision detection between missiles and players
- Add collision with arena walls and obstacles
- Create explosion effect when missile hits target
- Remove missile from scene upon collision
- Prepare hit data for server notification

**Test:** Missiles explode on contact with players and walls, with visual effects.

### Step 9.4: Implement Hit Reporting
**Objective:** Report missile hits to server for elimination processing.

**Actions:**
- Send missile hit event to server when collision detected
- Include shooter ID, target ID, and hit position in event
- Server accepts hit reports without validation (client authoritative)
- Handle network latency for hit confirmation

**Test:** Server receives and processes hit reports from shooting clients.

## Phase 10: Player Elimination & Respawning

### Step 10.1: Implement Player Elimination (Server)
**Objective:** Handle player elimination when hit by missiles.

**Actions:**
- Process missile hit events from clients
- Accept hit reports without server-side validation
- Award points to shooter and eliminate target
- Set elimination timer (5 seconds) for respawn
- Broadcast elimination event to all clients

**Test:** Players are eliminated when hit and points are awarded correctly.

### Step 10.2: Add Respawn System
**Objective:** Respawn eliminated players after delay.

**Actions:**
- Implement 5-second respawn timer on server
- Choose random spawn location for respawning player
- Reset player state (weapons, position) on respawn
- Broadcast respawn event to all clients
- Ensure spawn locations are safe (not occupied)

**Test:** Eliminated players respawn after 5 seconds at random locations.

### Step 10.3: Handle Client-Side Elimination
**Objective:** Display elimination effects and manage eliminated state.

**Actions:**
- Show elimination animation when player is hit
- Display respawn countdown timer for eliminated player
- Hide/show player objects based on elimination state
- Add visual effects for elimination (explosion, particles)
- Handle camera behavior during elimination period

**Test:** Players see elimination effects and countdown timer works correctly.

### Step 10.4: Add Elimination Notifications
**Objective:** Show kill/death notifications to players.

**Actions:**
- Create notification system for eliminations
- Display "Player X eliminated Player Y" messages
- Add personal kill/death notifications for local player
- Style notifications with appropriate colors and timing
- Handle multiple rapid eliminations without UI overlap

**Test:** All players see elimination notifications with correct player names.

## Phase 11: Scoring & Leaderboard

### Step 11.1: Implement Scoring System (Server)
**Objective:** Track and manage player scores.

**Actions:**
- Add score tracking to server-side Player class
- Award points for successful eliminations
- Store scores persistently during game session
- Add methods to sort players by score
- Handle score resets when players disconnect

**Test:** Server correctly tracks and updates player scores after eliminations.

### Step 11.2: Create Leaderboard Data Structure
**Objective:** Organize and format leaderboard information.

**Actions:**
- Create method to generate sorted leaderboard data
- Include player name, score, and ranking in leaderboard
- Update leaderboard after each elimination
- Broadcast leaderboard updates to all clients
- Handle tied scores appropriately

**Test:** Server generates correct leaderboard data sorted by score.

### Step 11.3: Display Leaderboard UI (Client)
**Objective:** Show real-time leaderboard to players.

**Actions:**
- Create `Leaderboard.js` component for UI display
- Style leaderboard with appropriate fonts and colors
- Position leaderboard in corner of screen
- Update display when leaderboard data changes
- Highlight local player's position in leaderboard

**Test:** Leaderboard appears on screen and updates in real-time during gameplay.

### Step 11.4: Add Score Persistence
**Objective:** Maintain scores throughout game session.

**Actions:**
- Ensure scores persist when players temporarily disconnect
- Handle score state during respawning
- Add score display next to player names in game world
- Create end-of-round summary (future feature placeholder)
- Optimize leaderboard update frequency

**Test:** Player scores persist correctly through disconnections and respawns.

## Phase 12: UI & User Experience

### Step 12.1: Create Main Menu
**Objective:** Add game entry point with name input.

**Actions:**
- Create main menu screen before game starts
- Add input field for player name entry
- Add "Join Game" button to connect to server
- Style menu with game theme and branding
- Add basic form validation for player names

**Test:** Players can enter name and join game through main menu.

### Step 12.2: Add Game HUD
**Objective:** Display important game information during play.

**Actions:**
- Create heads-up display showing missile count
- Add health/status indicators
- Display current score for local player
- Add minimap placeholder for future implementation
- Position HUD elements for optimal visibility

**Test:** HUD displays correct information and updates during gameplay.

### Step 12.3: Add Visual Feedback Systems
**Objective:** Provide clear feedback for player actions.

**Actions:**
- Add crosshair or targeting indicator
- Create hit markers for successful missile hits
- Add damage/elimination visual effects
- Implement screen shake for impacts
- Add particle systems for various game events

**Test:** All player actions have clear visual feedback.

### Step 12.4: Implement Settings & Controls Info
**Objective:** Help players understand game controls.

**Actions:**
- Add controls instruction overlay (toggle with key press)
- Create settings menu for graphics/audio options
- Add pause/resume functionality for settings access
- Display connection status and ping information
- Add option to change player name during session

**Test:** Players can access controls info and basic settings.

## Phase 13: Performance & Optimization

### Step 13.1: Client Performance Optimization
**Objective:** Ensure smooth gameplay on various devices.

**Actions:**
- Profile rendering performance and identify bottlenecks
- Implement object pooling for missiles and effects
- Optimize Three.js material usage and geometry
- Add performance monitoring and FPS display
- Implement adaptive quality settings based on performance

**Test:** Game maintains stable 60fps with maximum player count and effects.

### Step 13.2: Network Optimization
**Objective:** Minimize bandwidth usage and latency.

**Actions:**
- Optimize network update frequency based on importance
- Implement delta compression for position updates
- Add client-side prediction to reduce perceived lag
- Optimize message size and frequency
- Add network quality indicators

**Test:** Game runs smoothly with simulated network delay and packet loss.

### Step 13.3: Memory Management
**Objective:** Prevent memory leaks and optimize resource usage.

**Actions:**
- Implement proper cleanup for disconnected players
- Remove unused objects from Three.js scene
- Clean up physics bodies when objects are destroyed
- Monitor memory usage and implement garbage collection triggers
- Optimize asset loading and unloading

**Test:** Game memory usage remains stable during extended play sessions.

### Step 13.4: Server Scalability
**Objective:** Prepare server for multiple concurrent games.

**Actions:**
- Optimize game state updates for efficiency
- Implement connection limits and queuing
- Add basic room/lobby system foundation
- Profile server performance under load
- Implement graceful degradation under high load

**Test:** Server handles maximum expected concurrent players without performance issues.

## Phase 14: Testing & Validation

### Step 14.1: Automated Testing Setup
**Objective:** Create test suite for core functionality.

**Actions:**
- Set up Jest testing framework for server-side logic
- Create unit tests for game state management
- Add integration tests for socket communication
- Test physics calculations and collision detection
- Implement automated testing for player synchronization

**Test:** All automated tests pass consistently.

### Step 14.2: Multi-Client Testing
**Objective:** Verify multiplayer functionality works correctly.

**Actions:**
- Test with maximum expected player count (6 players)
- Verify synchronization across multiple clients
- Test edge cases (rapid connection/disconnection)
- Validate leaderboard accuracy across clients
- Test network recovery and reconnection

**Test:** Multiple clients can play together without synchronization issues.

### Step 14.3: Stress Testing
**Objective:** Identify breaking points and limits.

**Actions:**
- Test server performance under maximum load
- Identify client framerate limits with many players
- Test network bandwidth usage under load
- Validate memory usage during extended sessions
- Test rapid-fire gameplay scenarios

**Test:** System handles stress testing without crashes or severe performance degradation.

### Step 14.4: Browser Compatibility
**Objective:** Ensure game works across different browsers.

**Actions:**
- Test on Chrome, Firefox, Safari, and Edge
- Verify WebGL compatibility across browsers
- Test socket connection stability across browsers
- Validate input handling differences
- Test mobile browser compatibility (if applicable)

**Test:** Game functions correctly on all major browsers.

## Phase 15: Documentation & Deployment

### Step 15.1: Code Documentation
**Objective:** Document codebase for maintenance and expansion.

**Actions:**
- Add JSDoc comments to all public methods
- Create architecture documentation explaining system design
- Document network protocol and message formats
- Add troubleshooting guide for common issues
- Create developer setup instructions

**Test:** Documentation is complete and helps new developers understand the codebase.

### Step 15.2: Local Development Setup
**Objective:** Ensure smooth local development experience.

**Actions:**
- Configure development build scripts for client (Vite)
- Set up local environment variables for server configuration  
- Add development-ready error handling and logging
- Configure local HTTP and WebSocket connections
- Add basic health check endpoints for development
- Use prettier for consistent code formatting

**Test:** Game builds and runs successfully in local development environment.

### Step 15.3: User Guide Creation
**Objective:** Help players understand how to play the game.

**Actions:**
- Create simple tutorial or onboarding flow
- Write clear instructions for game controls
- Add tips for effective gameplay strategies
- Create FAQ for common player questions
- Add contact information for bug reports

**Test:** New players can successfully learn and play the game using the provided guide.

### Step 15.4: Final Integration Testing
**Objective:** Verify all systems work together correctly.

**Actions:**
- Conduct end-to-end testing of complete game flow
- Verify all features work in production environment
- Test with real network conditions and latency
- Validate performance under realistic usage conditions
- Confirm all edge cases are handled appropriately

**Test:** Complete game experience works smoothly from start to finish.

---

## Success Criteria

Upon completion of this implementation plan:

- Players can join the game with custom names through a simple UI
- Multiple players can drive karts around a physics-based arena
- Players can collect weapon pickups and fire missiles at each other
- Hit detection results in player elimination and respawning
- Real-time leaderboard displays current scores
- Game runs smoothly with acceptable performance across multiple clients
- All major browsers support the game
- Code is modular, documented, and maintainable

## Future Enhancements (Not Included in Base Implementation)

- Multiple weapon types (rockets, mines, shields)
- Power-ups (speed boost, armor, invisibility)  
- Multiple arena layouts
- Game modes (team deathmatch, capture the flag)
- Player customization (kart colors, skins)
- Spectator mode
- Tournament/ranking system
- Mobile device support