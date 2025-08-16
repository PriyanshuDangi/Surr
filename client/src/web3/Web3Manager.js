import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

/**
 * Web3Manager - Centralized Web3 connection management
 * Handles MetaMask wallet connection and account management
 */
export default class Web3Manager {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.isWalletConnected = false;
    }

    /**
     * Connect to MetaMask wallet
     * @returns {Promise<string>} Connected account address
     * @throws {Error} If connection fails
     */
    async connectWallet() {
        try {
            // Try to detect MetaMask specifically
            let provider = await detectEthereumProvider();
            
            if (!provider) {
                throw new Error('MetaMask is required to play this game');
            }

            // If multiple wallets are detected, try to find MetaMask specifically
            if (provider !== window.ethereum && window.ethereum) {
                // Check if window.ethereum is MetaMask
                if (window.ethereum.isMetaMask) {
                    provider = window.ethereum;
                    console.log('Multiple wallets detected, using MetaMask');
                } 
                // Check if there are multiple providers and find MetaMask
                else if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
                    const metaMaskProvider = window.ethereum.providers.find(p => p.isMetaMask);
                    if (metaMaskProvider) {
                        provider = metaMaskProvider;
                        console.log('Multiple wallets detected, using MetaMask from providers array');
                    } else {
                        throw new Error('MetaMask is required to play this game');
                    }
                } else {
                    throw new Error('MetaMask is required to play this game');
                }
            }
            
            // Verify the final provider is MetaMask
            if (!provider.isMetaMask) {
                throw new Error('MetaMask is required to play this game');
            }

            // Initialize Web3 instance
            this.web3 = new Web3(provider);

            // Request account access
            const accounts = await provider.request({
                method: 'eth_requestAccounts',
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts returned from MetaMask');
            }

            // Store the connected account
            this.account = accounts[0];
            this.isWalletConnected = true;

            console.log('Wallet connected successfully:', this.account);

            // Set up event listeners
            this._setupEventListeners(provider);

            return this.account;

        } catch (error) {
            console.error('Failed to connect wallet:', error);
            
            // Use our error handling method for user-friendly messages
            const friendlyMessage = this._handleConnectionError(error);
            throw new Error(friendlyMessage);
        }
    }

    /**
     * Get the currently connected account address
     * @returns {string|null} Account address or null if not connected
     */
    getAccount() {
        return this.account;
    }

    /**
     * Check if wallet is currently connected
     * @returns {boolean} Connection status
     */
    isConnected() {
        return this.isWalletConnected && this.account !== null;
    }

    /**
     * Check if MetaMask is already connected (auto-connect on page load)
     * @returns {Promise<string|null>} Connected account address or null
     */
    async checkConnection() {
        try {
            let provider = await detectEthereumProvider();
            
            if (!provider) {
                return null;
            }

            // If multiple wallets are detected, try to find MetaMask specifically
            if (provider !== window.ethereum && window.ethereum) {
                if (window.ethereum.isMetaMask) {
                    provider = window.ethereum;
                } else if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
                    const metaMaskProvider = window.ethereum.providers.find(p => p.isMetaMask);
                    if (metaMaskProvider) {
                        provider = metaMaskProvider;
                    }
                }
            }

            // Only proceed if we have MetaMask
            if (!provider.isMetaMask) {
                return null;
            }

            this.web3 = new Web3(provider);

            // Check if already connected
            const accounts = await provider.request({
                method: 'eth_accounts',
            });

            if (accounts && accounts.length > 0) {
                this.account = accounts[0];
                this.isWalletConnected = true;
                
                // Set up event listeners
                this._setupEventListeners(provider);
                
                console.log('Auto-connected to wallet:', this.account);
                return this.account;
            }

            return null;
        } catch (error) {
            console.error('Error checking wallet connection:', error);
            return null;
        }
    }

    /**
     * Get the current network/chain ID
     * @returns {Promise<string|null>} Chain ID or null if not connected
     */
    async getChainId() {
        if (!this.web3) {
            return null;
        }

        try {
            const chainId = await this.web3.eth.getChainId();
            return chainId.toString();
        } catch (error) {
            console.error('Error getting chain ID:', error);
            return null;
        }
    }

    /**
     * Set up event listeners for wallet events
     * @param {Object} provider - Ethereum provider
     * @private
     */
    _setupEventListeners(provider) {
        // Listen for account changes
        provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // User disconnected wallet
                this.disconnect();
                console.log('Wallet disconnected');
            } else {
                // User switched accounts
                this.account = accounts[0];
                console.log('Account changed to:', this.account);
            }
        });

        // Listen for chain changes
        provider.on('chainChanged', (chainId) => {
            console.log('Chain changed to:', chainId);
            // Reload the page on chain change as recommended by MetaMask
            window.location.reload();
        });

        // Listen for disconnect events
        provider.on('disconnect', (error) => {
            console.log('Provider disconnected:', error);
            this.disconnect();
        });
    }

    /**
     * Handle wallet connection errors
     * @param {Error} error - The error that occurred
     * @returns {string} User-friendly error message
     */
    _handleConnectionError(error) {
        if (error.code === 4001) {
            return 'User rejected the connection request';
        } else if (error.code === -32002) {
            return 'Connection request already pending';
        } else if (error.message.includes('MetaMask is required to play this game')) {
            return 'MetaMask is required to play this game';
        } else if (error.message.includes('MetaMask not found among installed wallets')) {
            return 'MetaMask is required to play this game';
        } else if (error.message.includes('Selected provider is not MetaMask')) {
            return 'MetaMask is required to play this game';
        } else if (error.message.includes('No accounts returned')) {
            return 'No accounts available. Please unlock MetaMask and try again.';
        }
        return 'An unexpected error occurred while connecting to wallet';
    }

    /**
     * Disconnect wallet and reset state
     */
    disconnect() {
        this.web3 = null;
        this.account = null;
        this.isWalletConnected = false;
    }

    /**
     * Helper method to guide users to install MetaMask
     * @returns {string} Installation guidance message
     */
    getInstallationGuidance() {
        return 'MetaMask is required to play this game';
    }

    /**
     * Check if MetaMask is installed
     * @returns {boolean} True if MetaMask is detected
     */
    static isMetaMaskInstalled() {
        if (typeof window === 'undefined') return false;
        
        return !!(
            window.ethereum && 
            (window.ethereum.isMetaMask || 
             (window.ethereum.providers && 
              window.ethereum.providers.some(p => p.isMetaMask)))
        );
    }
}
