// Surr Game - Client Configuration
// Environment-based URL configuration

// Constants for URLs and Ports
const DEFAULT_PORT = 5173;
const LOCALHOST_BASE = 'http://localhost';
const PRODUCTION_URL = 'https://surr.onrender.com';

// Load environment variable (for development)
const isDev = import.meta.env.MODE === 'development' || 
              import.meta.env.NODE_ENV === 'dev' || 
              import.meta.env.NODE_ENV === 'development';

// Server URLs for different environments
const config = {
  serverUrl: isDev 
    ? `${LOCALHOST_BASE}:${DEFAULT_PORT}`  // Development server
    : PRODUCTION_URL  // Production server (Render)
};

// Export configuration
export default config;

// Debug logging
console.log('Client Environment:', isDev ? 'Development' : 'Production');
console.log('Server URL:', config.serverUrl);
