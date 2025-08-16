// Surr Game - Socket Manager
// Simple function-based socket connection with retry

import { io } from 'socket.io-client';

let socket = null;
let isConnected = false;

export function initWebSocket() {
  const serverUrl = 'http://localhost:5173';
  
  console.log('Connecting to server...');
  
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: 5000
  });

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    isConnected = true;
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    isConnected = false;
  });

  socket.on('connect_error', (error) => {
    console.error('Connection failed:', error);
    isConnected = false;
    
    // Retry once after 3 seconds
    setTimeout(() => {
      console.log('Retrying connection...');
      socket.connect();
    }, 3000);
  });
}

export function getSocket() {
  return socket;
}

export function isSocketConnected() {
  return isConnected;
}
