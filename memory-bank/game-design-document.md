# Surr - Game Design Document (v1.0)

## 1. Game Overview

**Game Title:** Surr  
**Concept:** A fast-paced, online multiplayer arena kart game where players compete to eliminate each other using power-ups and skillful driving.
**Target Audience:** Casual to mid-core players who enjoy competitive, quick-session multiplayer games.  
**Platform:** Web browser (PC)  
**Core Loop:** Join a game → Drive around the arena → Collect weapon pickups → Shoot other players → Score points → Respawn and repeat until the match ends.

## 2. Gameplay Mechanics

### Player Controls

#### Movement:
- **W** or **Up Arrow:** Accelerate
- **S** or **Down Arrow:** Brake / Reverse
- **A** or **Left Arrow:** Turn Left
- **D** or **Right Arrow:** Turn Right

#### Actions:
- **Spacebar:** Fire equipped weapon

### Combat System

**Weapons:** Players can collect weapon pickups scattered around the arena.
- **Missile:** A projectile that travels in a straight line from the front of the player's kart.

**Weapon Collection:**
- Weapon pickups spawn at random locations in the arena
- Players drive over pickups to collect them
- Each pickup provides one missile shot
- Players can hold multiple missiles

**Missile Mechanics:**
- **Firing:** Press spacebar to shoot equipped missile
- **Trajectory:** Missile travels in a straight line from the shooter's current position and direction
- **Speed:** Fixed missile speed for consistent gameplay
- **Lifecycle:** Managed entirely on the shooter's client side
- **Duration:** Missiles have a maximum travel distance/time before disappearing or it disappears if it hits any player or wall 

**Damage & Elimination:**
- A single missile hit will instantly eliminate an opponent
- Upon elimination, the player who fired the missile is awarded 1 point
- The eliminated player will respawn at a random location in the arena after 5 seconds
- Hit detection is reported by the shooter's client to the server

**Missile Management:**
- **Client-side (Shooter):** Manages missile creation, movement, collision detection, and lifecycle
- **Server-side:** Receives hit notifications from shooters and manages player eliminations
- **Multiplayer Sync:** Server broadcasts missile positions to all players for real-time visualization

### Scoring & Leaderboard

- The game will feature a real-time leaderboard visible to all players.
- The leaderboard will display each player's name and their current score (number of eliminations).
- The list will be sorted in descending order of score.

## 3. Technical Stack

### Frontend:
- **Rendering:** Three.js
- **Physics:** Cannon.js (or Cannon-es for a more modern version)
- **Language:** JavaScript
- **Build Tool:** Vite

### Backend:
- **Server:** Node.js with Express
- **Real-time Communication:** Socket.IO

### Assets:
- **Car Model:** A single .glb file for the player kart.

## 4. Game Assets

### 3D Models:
- **kart.glb:** A low-poly, stylized racing kart.
<!-- - **missile.glb:** A simple missile model. -->
<!-- - **arena.glb:** A simple arena with basic obstacles, ramps, and boundaries. -->
missile.glb - create a simple poly missile 
arena.glb - for now have a simple flat ground 

### UI Elements:
- Leaderboard display.
- Score/Kill notifications.
- "Join Game" button and player name input field.
- Weapon pickup icon.

## 5. Multiplayer Architecture (Client-Server)

**No server-side rendering is required** - the server only manages game state position, direction of all the clients. 

### Server-Side (Node.js + Socket.IO)

**Responsibilities:**
- Manage player connections and disconnections.
- **Receive and maintain player positions** from frontend clients.
- **Maintain weapon state for each client** (missile or null).
- **Maintain death state for each player** (alive/dead with respawn timer).
- **Maintain weaponbox state** - spawn locations and collection status.
- **Handle weaponbox collection** - remove collected boxes and broadcast updates.
- **Refresh weaponbox state every 15 seconds** - respawn new weapon pickups.
- **Maintain the leaderboard** and update it on every kill/elimination.
- Handle player inputs for movement and shooting.
- **Receive missile hit notifications from shooters and manage player eliminations.**
- **Broadcast missile positions to all players for real-time visualization.**
- **Broadcast updated game state to all clients** at a regular interval (tick rate), including current player positions, weapon states, death states, weaponbox states, and leaderboard.
- Manage the leaderboard.

**Socket Events (Server listening for):**
- `connection:` A new player joins.
- `joinGame:` Player provides their name and is added to the game session.
- `playerInput:` Receives a player's movement and action inputs.
- `playerPosition:` Receives updated player position from frontend.
- `missileHit:` Receives missile hit notification from shooter client.
- `weaponboxCollected:` Receives weaponbox collection notification from player.
- `disconnect:` A player leaves the game.

**Socket Events (Server broadcasting):**
- `gameState:` Broadcasts current positions of all players and game objects.
- `leaderboardUpdate:` Broadcasts updated leaderboard after each kill.
- `playerEliminated:` Broadcasts elimination notification to all players.

### Client-Side (JavaScript + Socket.IO)

**Responsibilities:**
- Render the game world, karts, and projectiles using Three.js.
- Capture player input and send it to the server.
- **Send player position updates to the server** as they move.
- Receive game state updates from the server and interpolate positions to smooth out movement.
- Display the UI, including the real-time leaderboard updates.

**Socket Events (Client listening for):**
- `connect:` Successfully connected to the server.
- `gameState:` Receives the updated state of all players and objects from the server.
- `leaderboardUpdate:` Receives updated leaderboard from server.
- `playerEliminated:` Receives notification that a player was eliminated, along with the killer's ID.

**Socket Events (Client sending):**
- `playerPosition:` Sends current player position to server.
- `playerInput:` Sends movement and action inputs to server.
- `missileHit:` Sends missile hit notification to server when collision detected.

