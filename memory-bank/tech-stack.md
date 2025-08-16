# Tech Stack

## Frontend

### JavaScript
Handles all client-side game logic, captures player input, and communicates with the server.

### Three.js
Renders the 3D game world, including the karts, arena, and projectiles.

### Cannon.js / cannon-es
Manages the 3D physics for vehicle movement and projectile collisions.

### Socket.IO (Client)
Establishes and manages the real-time, event-based communication link to the server.

### Vite
Acts as the modern build tool to bundle the code and speed up the development process.

## Backend

### Node.js
Provides the runtime environment to execute server-side JavaScript code.

### Express
A minimal web framework for Node.js used to structure the backend server and handle connections.

### Socket.IO (Server)
Listens for client connections and manages the real-time broadcasting of game state to all players.