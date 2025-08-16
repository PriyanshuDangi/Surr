// Surr Game - Server Configuration
// Environment-based configuration

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants for URLs and Ports
const DEFAULT_PORT = 5173;
const DEV_CLIENT_PORT = 3000;
const LOCALHOST_BASE = 'http://localhost';
const LOCALHOST_IP = 'http://127.0.0.1';
const PRODUCTION_URL = 'https://surr-nine.vercel.app';

// Determine environment
const isDev = process.env.NODE_ENV === 'dev' || 
              process.env.NODE_ENV === 'development';

// Configuration based on environment
const config = {
  port: process.env.PORT || DEFAULT_PORT,
  
  // CORS origins
  corsOrigins: isDev 
    ? [
        `${LOCALHOST_BASE}:${DEV_CLIENT_PORT}`,
        `${LOCALHOST_BASE}:${DEFAULT_PORT}`,
        `${LOCALHOST_IP}:${DEV_CLIENT_PORT}`,
        `${LOCALHOST_IP}:${DEFAULT_PORT}`
      ]  // Development
    : [
        PRODUCTION_URL,  // Production Vercel URL
        `${LOCALHOST_BASE}:${DEV_CLIENT_PORT}`,
        `${LOCALHOST_BASE}:${DEFAULT_PORT}`,
        `${LOCALHOST_IP}:${DEV_CLIENT_PORT}`,
        `${LOCALHOST_IP}:${DEFAULT_PORT}`,
        process.env.CORS_ORIGIN  // Additional origin from env
      ].filter(Boolean),  // Remove any undefined values
  
  // Client URL for Socket.IO CORS
  clientUrl: isDev 
    ? `${LOCALHOST_BASE}:${DEV_CLIENT_PORT}`  // Development client
    : PRODUCTION_URL  // Production client (Vercel)
};

// Debug logging
console.log('Server Environment:', isDev ? 'Development' : 'Production');
console.log('CORS Origins:', config.corsOrigins);
console.log('Client URL:', config.clientUrl);
console.log('Server Port:', config.port);

export default config;
