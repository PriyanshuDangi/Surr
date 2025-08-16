// Flow Testnet Configuration
const FLOW_CONFIG = {
  // Flow Network Settings
  TESTNET_RPC: 'https://testnet.evm.nodes.onflow.org',
  ACCESS_NODE: 'https://evm-testnet.flowscan.io',
  
  // Contract Configuration
  SURR_TOKEN_ADDRESS: '0xDE8c68317AB8699A37E208Ef6EE7Ef8E173707E1', // Update when contract is deployed
  
  // Game Configuration
  REWARD_RATE: 100, // Tokens per kill
  ROUND_DURATION: 180000, // 3 minutes in milliseconds
  MIN_PLAYERS_FOR_ROUND: 1, // Start round with first player
  
  // Environment
  // NODE_ENV: process.env.NODE_ENV || 'development'
};

export default FLOW_CONFIG;
