import { Web3 } from 'web3';
import dotenv from 'dotenv';
import FLOW_CONFIG from '../config/flow.js';

dotenv.config();

// Basic ERC20 ABI with mint function
const ERC20_MINT_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

class TokenMintService {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.treasuryAccount = null;
        this.isInitialized = false;
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    /**
     * Initialize the minting service
     */
    async initialize() {
        try {
            // Initialize Web3 with Flow EVM testnet
            this.web3 = new Web3(FLOW_CONFIG.TESTNET_RPC);
            
            // Set up treasury account
            if (!process.env.TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY === 'your_treasury_private_key_here') {
                console.warn('⚠️  Treasury private key not configured - using placeholder mode');
                console.warn('   To enable minting, update TREASURY_PRIVATE_KEY in .env file');
                this.treasuryAccount = { address: 'NOT_CONFIGURED' };
            } else {
                try {
                    this.treasuryAccount = this.web3.eth.accounts.privateKeyToAccount(process.env.TREASURY_PRIVATE_KEY);
                    this.web3.eth.accounts.wallet.add(this.treasuryAccount);
                } catch (error) {
                    throw new Error(`Invalid treasury private key format: ${error.message}`);
                }
            }

            // Initialize contract
            this.contract = new this.web3.eth.Contract(ERC20_MINT_ABI, FLOW_CONFIG.SURR_TOKEN_ADDRESS);

            this.isInitialized = true;
            console.log('✅ TokenMintService initialized successfully');
            console.log(`🔗 Connected to Flow EVM: ${FLOW_CONFIG.TESTNET_RPC}`);
            console.log(`💰 Treasury address: ${this.treasuryAccount.address}`);
            console.log(`🎯 Token contract: ${FLOW_CONFIG.SURR_TOKEN_ADDRESS}`);

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize TokenMintService:', error.message);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Mint tokens to a single player address
     * @param {string} playerAddress - The player's wallet address
     * @param {number} amount - Amount of tokens to mint (in token units, not wei)
     */
    async mintTokens(playerAddress, amount) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.isInitialized) {
            throw new Error('TokenMintService not initialized');
        }

        if (this.treasuryAccount.address === 'NOT_CONFIGURED') {
            throw new Error('Treasury private key not configured - cannot mint tokens');
        }

        const amountWei = this.web3.utils.toWei(amount.toString(), 'ether');
        let lastError = null;

        // Retry logic
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`🏗️  Attempt ${attempt}/${this.retryAttempts}: Minting ${amount} SURR to ${playerAddress}`);

                // Estimate gas
                const gasEstimate = await this.contract.methods.mint(playerAddress, amountWei).estimateGas({
                    from: this.treasuryAccount.address
                });

                // Send transaction
                const transaction = {
                    from: this.treasuryAccount.address,
                    to: FLOW_CONFIG.SURR_TOKEN_ADDRESS,
                    data: this.contract.methods.mint(playerAddress, amountWei).encodeABI(),
                    gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
                    gasPrice: await this.web3.eth.getGasPrice()
                };

                const signedTx = await this.web3.eth.accounts.signTransaction(transaction, process.env.TREASURY_PRIVATE_KEY);
                const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

                console.log(`✅ Minting successful!`);
                console.log(`   📄 Transaction: ${receipt.transactionHash}`);
                console.log(`   ⛽ Gas used: ${receipt.gasUsed}`);
                console.log(`   🎯 Block: ${receipt.blockNumber}`);

                return {
                    success: true,
                    transactionHash: receipt.transactionHash,
                    gasUsed: receipt.gasUsed,
                    blockNumber: receipt.blockNumber,
                    amount: amount,
                    recipient: playerAddress
                };

            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt}/${this.retryAttempts} failed:`, error.message);

                if (attempt < this.retryAttempts) {
                    console.log(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
                    await this.delay(this.retryDelay);
                }
            }
        }

        // All attempts failed
        console.error(`💥 All minting attempts failed for ${playerAddress}`);
        throw new Error(`Failed to mint tokens after ${this.retryAttempts} attempts: ${lastError.message}`);
    }

    /**
     * Mint tokens to multiple players in batch
     * @param {Array} mintRequests - Array of {address, amount} objects
     */
    async batchMintTokens(mintRequests) {
        console.log(`🚀 Starting batch mint for ${mintRequests.length} players`);
        
        const results = [];
        const errors = [];

        for (let i = 0; i < mintRequests.length; i++) {
            const { address, amount } = mintRequests[i];
            try {
                console.log(`📦 Processing ${i + 1}/${mintRequests.length}: ${address}`);
                const result = await this.mintTokens(address, amount);
                results.push(result);
                
                // Small delay between transactions to avoid nonce issues
                if (i < mintRequests.length - 1) {
                    await this.delay(1000);
                }
            } catch (error) {
                console.error(`❌ Batch mint failed for ${address}:`, error.message);
                errors.push({ address, amount, error: error.message });
            }
        }

        console.log(`🏁 Batch mint completed:`);
        console.log(`   ✅ Successful: ${results.length}`);
        console.log(`   ❌ Failed: ${errors.length}`);

        return {
            successful: results,
            failed: errors,
            summary: {
                total: mintRequests.length,
                successful: results.length,
                failed: errors.length
            }
        };
    }

    /**
     * Get token balance for an address
     * @param {string} address - Wallet address to check
     */
    async getBalance(address) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const balanceWei = await this.contract.methods.balanceOf(address).call();
            const balance = this.web3.utils.fromWei(balanceWei, 'ether');
            return parseFloat(balance);
        } catch (error) {
            console.error(`❌ Failed to get balance for ${address}:`, error.message);
            return null;
        }
    }

    /**
     * Get total token supply
     */
    async getTotalSupply() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const totalSupplyWei = await this.contract.methods.totalSupply().call();
            const totalSupply = this.web3.utils.fromWei(totalSupplyWei, 'ether');
            return parseFloat(totalSupply);
        } catch (error) {
            console.error('❌ Failed to get total supply:', error.message);
            return null;
        }
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            treasuryAddress: this.treasuryAccount?.address || null,
            tokenContract: FLOW_CONFIG.SURR_TOKEN_ADDRESS,
            rpcEndpoint: FLOW_CONFIG.TESTNET_RPC
        };
    }
}

export default TokenMintService;
