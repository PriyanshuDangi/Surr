import * as fcl from '@onflow/fcl';
import * as types from '@onflow/types';
import dotenv from 'dotenv';
import FLOW_CONFIG from '../config/flow.js';

dotenv.config();

class FlowManager {
    constructor() {
        this.isInitialized = false;
        this.treasuryAddress = process.env.TREASURY_ADDRESS;
        this.treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
        
        if (!this.treasuryAddress || !this.treasuryPrivateKey) {
            console.warn('Treasury wallet configuration missing in .env file');
        }
    }

    /**
     * Initialize Flow testnet connection
     */
    async initialize() {
        try {
            // Configure FCL for Flow testnet
            fcl.config({
                'accessNode.api': FLOW_CONFIG.ACCESS_NODE,
                'flow.network': 'testnet',
                'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn'
            });

            this.isInitialized = true;
            console.log('✅ Flow testnet connection initialized');
            console.log(`🔗 Connected to: ${FLOW_CONFIG.ACCESS_NODE}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Flow connection:', error.message);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Verify treasury wallet balance
     */
    async getTreasuryBalance() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            if (!this.treasuryAddress) {
                throw new Error('Treasury address not configured');
            }

            // Get Flow balance using FCL
            const balance = await fcl.query({
                cadence: `
                    import FlowToken from 0x7e60df042a9c0868
                    
                    pub fun main(address: Address): UFix64 {
                        let account = getAccount(address)
                        let vaultRef = account
                            .getCapability(/public/flowTokenBalance)
                            .borrow<&FlowToken.Vault{FlowToken.Balance}>()
                            ?? panic("Could not borrow Balance reference to the Vault")
                        
                        return vaultRef.balance
                    }
                `,
                args: (arg, t) => [arg(this.treasuryAddress, t.Address)]
            });

            console.log(`💰 Treasury wallet balance: ${balance} FLOW`);
            return balance;
        } catch (error) {
            console.error('❌ Failed to get treasury balance:', error.message);
            return null;
        }
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.isInitialized;
    }

    /**
     * Get treasury wallet address
     */
    getTreasuryAddress() {
        return this.treasuryAddress;
    }

    /**
     * Get token contract address
     */
    getTokenContractAddress() {
        return FLOW_CONFIG.SURR_TOKEN_ADDRESS;
    }
}

export default FlowManager;
