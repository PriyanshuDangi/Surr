# Web3 Integration Implementation Plan

## Phase 1: Wallet Integration & ERC20 Token

### Step 1.1: Install Web3 Dependencies (Client)

**Objective**: Add required Web3 libraries to the client project.

**Actions**:
- Navigate to `client/` directory
- Install web3.js: `npm install web3`
- Install @metamask/detect-provider: `npm install @metamask/detect-provider`
- Update package.json to include these dependencies

**Test**: Run `npm install` successfully and verify web3 and MetaMask provider packages appear in package.json dependencies.
### Step 1.2: Create Web3 Manager Module

**Objective**: Set up centralized Web3 connection management.

**Actions**:
- Create `client/src/web3/` directory
- Create `client/src/web3/Web3Manager.js` file
- Create empty class structure with methods: `connectWallet()`, `getAccount()`, `isConnected()`
- Add error handling structure for wallet connection failures
- Export Web3Manager as default export

**Test**: Import Web3Manager in `main.js` without errors and instantiate the class successfully.

### Step 1.3: Implement Wallet Connection Logic

**Objective**: Enable MetaMask wallet connection functionality.

**Actions**:
- Import web3 and MetaMask provider detection in Web3Manager
- Implement `connectWallet()` method to prompt MetaMask connection
- Store connected account address in class property
- Add `getAccount()` method to return current connected address
- Add `isConnected()` method to check connection status
- Handle user rejection and no MetaMask scenarios

**Test**: Call `connectWallet()` method and verify MetaMask prompt appears. After connecting, `getAccount()` returns valid Ethereum address.

### Step 1.4: Update UI for Wallet Connection

**Objective**: Replace name input with wallet connection button.

**Actions**:
- Modify main menu HTML to replace name input field with "Connect Wallet" button
- Add wallet address display element (initially hidden)
- Update CSS to style wallet connection button
- Add event listener for wallet connection button click
- Show wallet address and enable "Join Game" button only after wallet connection

**Test**: Main menu shows "Connect Wallet" button. After clicking and connecting, wallet address displays and "Join Game" becomes enabled.
### Step 1.5: Integrate Wallet Address as Player ID

**Objective**: Use wallet address instead of player name for identification.

**Actions**:
- Update client SocketManager to send wallet address instead of player name
- Modify `joinGame` event to include wallet address as identifier
- Update UI to display truncated wallet addresses (first 6 + last 4 characters)
- Ensure wallet address is passed to all player-related network events

**Test**: Player successfully joins game using wallet address. Leaderboard shows truncated wallet addresses instead of names.

### Step 1.6: Update Server Player Management

**Objective**: Modify server to handle wallet addresses as player identifiers.

**Actions**:
- Update server-side Player class to use wallet address as ID instead of name
- Modify SocketHandler to accept wallet addresses in `joinGame` event
- Update GameState to track players by wallet address
- Ensure leaderboard uses wallet addresses for player identification
- Add wallet address validation (basic format check)

**Test**: Server accepts wallet addresses as player IDs. Multiple clients with different wallet addresses can join simultaneously.
### Step 1.7: Create ERC20 Token Contract

**Objective**: Deploy basic ERC20 token contract for game rewards.

**Actions**:
- Create `contracts/` directory in project root
- Create `contracts/SURRToken.sol` file
- Implement standard ERC20 contract using OpenZeppelin imports
- Set token name as "SURR Token", symbol as "SURR", decimals as 18
- Add `mint()` function with `onlyOwner` modifier
- Include initial supply minting to contract deployer

**Test**: Contract compiles successfully using Solidity compiler. Contract has correct name, symbol, and decimals.

### Step 1.8: Set Up Local Blockchain Development

**Objective**: Prepare local environment for contract testing.

**Actions**:
- Create a folder called contracts `mkdir contracts` 
- Install Hardhat in project /contracts: `npm install --save-dev hardhat`
- Initialize Hardhat project: `npx hardhat init`
- Install OpenZeppelin contracts: `npm install @openzeppelin/contracts`
- Configure `hardhat.config.js` for local network
- Create deployment script in `scripts/deploy.js`

**Test**: Run `npx hardhat compile` successfully. Local Hardhat network starts with `npx hardhat node`.
### Step 1.9: Deploy ERC20 Contract Locally

**Objective**: Deploy token contract to local blockchain for testing.

**Actions**:
- Write deployment script for SURRToken contract
- Deploy contract to local Hardhat network
- Save contract address and ABI to client-accessible location
- Mint initial token supply to deployer address
- Verify contract deployment and token balance

**Test**: Contract deploys successfully to local network. Deployer address has initial token balance. Contract address and ABI are accessible.

### Step 1.10: Create Token Integration Module

**Objective**: Set up client-side token contract interaction.

**Actions**:
- Create `client/src/web3/TokenManager.js` file
- Import contract ABI and address from deployment
- Add methods: `getBalance()`, `getTokenContract()`
- Integrate TokenManager with Web3Manager
- Add error handling for contract interactions

**Test**: TokenManager successfully connects to deployed contract. `getBalance()` returns correct token balance for connected wallet.

## Phase 2: Continuous Gameplay & Kill-to-Earn

### Step 2.1: Implement Smart Round Management System

**Objective**: Create round-based gameplay that starts when first player connects and manages player states properly.

**Actions**:
- Add round management properties to GameState class:
  - `currentRound` (object): tracks round state, start time, participants
  - `roundDuration` (3 minutes constant)
  - `isRoundActive` (boolean): indicates if round is running
- Create `startNewRound()` method triggered when first player connects
- Add `endCurrentRound()` method that processes rewards and resets
- Implement `getRemainingTime()` method to calculate time left
- Add logic to prevent new rounds when no players connected
- Track only `score` in Player class (no lifetime scoring in Phase 2)

**Test**: Round starts when first player joins. No round runs when server is empty. Round timer counts down correctly.

### Step 2.2: Enhanced Player State Management

**Objective**: Implement proper player state tracking with active/inactive status for round-based gameplay.

**Actions**:
- Add `isActive` property to server Player class (separate from `isAlive`)
- Modify `removePlayer()` in GameState to set `isActive: false` instead of deleting
- Update `addPlayer()` to reactivate existing players and reset `score` to 0
- Filter inactive players from UI broadcasts and leaderboard display
- Whoever has kills will get the round rewards
- Maintain player data structure for potential reconnection within same round

**Test**: Players can disconnect/reconnect seamlessly. Inactive players don't appear in UI but server maintains their data. Round kills preserved for reward distribution.

### Step 2.3: Round Kill Tracking System

**Objective**: Track kill counts for current round only (no lifetime tracking in Phase 2).

**Actions**:
- Add `score` property to Player class (resets each round)
- Modify missile hit processing to increment `score` for current round
- Reset all players' `score` to 0 when new round starts
- Use `score` for reward calculations and leaderboard display
- Remove any existing `score` updates (will be handled in Phase 3)
- Display only current round performance in UI

**Test**: Round kills track correctly for current round. All players start each round with 0 kills. Only round kills are displayed and used for rewards.

### Step 2.4: Round Timer Broadcasting & UI

**Objective**: Display synchronized round timer to all connected clients.

**Actions**:
- Include `remainingTime` and `roundNumber` in server gameState broadcasts
- Add round timer display to client UI (MM:SS format)
- Create visual countdown indicators for last 30 seconds
- Show round status: "Waiting for players", "Round X in progress", "Round ended"
- Handle timer synchronization across clients joining mid-round
- Display round transition messages

**Test**: All clients show synchronized timer. New players see correct remaining time when joining active round.

### Step 2.5: Install Flow Testnet Web3 Dependencies

**Objective**: Set up server-side blockchain integration for Flow testnet.

**Actions**:
- Navigate to `server/` directory
- Install web3.js: `npm install web3`
- Install Flow-specific dependencies: `npm install @onflow/fcl @onflow/types`
- Install dotenv for environment variables: `npm install dotenv`
- Create `.env` file in server directory with Flow testnet configuration
- Add `.env` to `.gitignore` file

**Test**: Backend dependencies install successfully. Flow testnet connection can be established.

### Step 2.6: Configure Flow Testnet Integration

**Objective**: Set up Flow testnet connection and treasury wallet.

**Actions**:
- Create `server/src/web3/` directory
- Create `server/src/web3/FlowManager.js` file for Flow blockchain connection
- Add Flow testnet RPC URL and treasury wallet details to `.env`
- Add SURR token contract address constant (updateable)
- Implement Flow testnet connection initialization
- Add method to verify treasury wallet balance

**Test**: Server connects to Flow testnet successfully. Treasury wallet is accessible and balance is readable.

### Step 2.7: Create Flow Token Minting Service

**Objective**: Enable server to mint SURR tokens to player wallets on Flow testnet.

**Actions**:
- Create `server/src/web3/TokenMintService.js` file
- Import SURR token contract interface and address constant
- Implement `mintTokens(playerAddress, amount)` method using mint function
- Add batch minting capability for multiple players
- Include transaction error handling and retry logic
- Log all minting transactions for debugging

**Test**: Server can successfully mint SURR tokens to test addresses on Flow testnet.

### Step 2.8: Reward Calculation & Distribution System

**Objective**: Calculate and distribute token rewards based on round kills only.

**Actions**:
- Define reward rate constant (e.g., 100 tokens per kill)
- Add contract address constant (easily updateable for deployment)
- Create `calculateRoundRewards()` method in GameState using `score`
- Integrate TokenMintService into round end processing
- Distribute rewards only to players with `score > 0`
- Track successful/failed reward distributions
- Add reward summary logging for each round
- Clear all `score` after reward distribution

**Test**: Players receive correct token amounts (score × reward rate) at round end. Round resets with all kills back to 0.

### Step 2.9: Client Reward Notifications

**Objective**: Display token reward notifications to players.

**Actions**:
- Add reward notification UI component to client
- Listen for `roundRewards` events from server
- Display notification showing tokens earned for round kills
- Add visual effects and animations for reward notifications
- Show round kills and tokens earned (no lifetime stats)
- Include link/reference to view transaction on Flow testnet explorer
- Clear round performance display after notification

**Test**: Players see attractive notifications when receiving tokens. Notifications show correct round kills and token amounts only.

### Step 2.10: Round State Synchronization

**Objective**: Ensure seamless player experience when joining ongoing rounds.

**Actions**:
- Send complete round state to new players on connection
- Initialize joining players with `score: 0` regardless of round progress
- Allow players to earn rewards even if joining mid-round
- Display appropriate UI state for round-in-progress vs waiting
- Handle edge case of players joining during round transition
- Ensure round rewards are distributed to all participants who earned kills

**Test**: Players joining mid-round see correct timer, start with 0 kills, and can earn rewards. UI clearly indicates round status.

## Project Context Integration Notes

### Current Architecture Overview
- **Backend**: Node.js server using Socket.IO for real-time communication
- **Frontend**: Vanilla JavaScript client with 3D game rendering
- **Game State**: Function-based game state management in `server/src/game/GameState.js`
- **Player Management**: Existing player object structure with wallet address support
- **Networking**: Real-time position updates, weapon pickups, missile firing/hits
- **Current Scoring**: `score` property exists but will be replaced with `score` for Phase 2

### Key Integration Points
1. **Player State Management**: 
   - Current `Player.js` already supports `walletAddress` property
   - Need to add `score` and `isActive` properties
   - Existing validation functions can be extended
   - Remove dependency on existing `score` property for Phase 2

2. **Game State Broadcasting**: 
   - Current `getGameStateForBroadcast()` function needs round timer info
   - Existing tick system (20Hz) will handle round timer updates
   - Filter inactive players in broadcast data
   - Display only `score` in game state

3. **Leaderboard Integration**: 
   - Current `Leaderboard.js` shows `score` and `isAlive` status
   - Replace with `score` display and round timer
   - Show only current round performance (no lifetime stats)

4. **Reward Distribution**: 
   - Replace existing `awardPoints()` with round kill tracking
   - Integrate reward distribution with round end logic
   - Use wallet addresses from player objects for token minting
   - Clear `score` after each round completion

### Flow Testnet Specific Details
- **Chain**: Flow Testnet
- **Token Standard**: ERC20-compatible (using current SurrToken.sol)
- **Minting Function**: `mint(address to, uint256 amount)` from existing contract
- **Treasury Management**: Server wallet with MINTER_ROLE for automated distribution
- **Transaction Monitoring**: Log all mint transactions for tracking and debugging

### Configuration Constants
```javascript
// Example configuration for easy updates
const FLOW_CONFIG = {
  TESTNET_RPC: 'https://rest-testnet.onflow.org',
  SURR_TOKEN_ADDRESS: '0x...', // Updateable constant
  REWARD_RATE: 100, // Tokens per kill
  ROUND_DURATION: 180000, // 3 minutes in milliseconds
  MIN_PLAYERS_FOR_ROUND: 1 // Start round with first player
};
```
## Phase 3: Lifetime Kills Contract
### Step 3.1: Create Lifetime Kills Smart Contract
**Objective**: Deploy contract to track permanent player statistics.
**Actions**:
- Create contracts/LifetimeKills.sol file
Implement contract with totalKills mapping and addKills() function
Add getKills() view function for reading player stats
Include onlyOwner modifier for kill updates
Set contract owner to server wallet address

**Test**: Contract compiles successfully. Owner can call addKills() and getKills() returns correct values.
### Step 3.2: Deploy Lifetime Kills Contract
**Objective**: Deploy statistics contract to local blockchain.
**Actions**:
- Add LifetimeKills to deployment script
Deploy contract with server wallet as owner
Save contract address and ABI for server access
Verify contract owner is set correctly
Test basic contract functionality

**Test**: Contract deploys successfully. Server wallet is confirmed as owner. Basic functions work correctly.
### Step 3.3: Create Backend Statistics Service
**Objective**: Enable server to update lifetime kills on blockchain.
**Actions**:
- Create server/src/web3/StatsService.js file
Import LifetimeKills contract ABI and address
Implement updateLifetimeKills(playerAddress, kills) method
Add batch update functionality for multiple players
Include transaction error handling and retry logic

**Test**: Server can successfully call contract to update lifetime kills. Kills accumulate correctly over multiple updates.
### Step 3.4: Integrate Stats Updates with Round End
**Objective**: Update blockchain statistics when rounds complete.
**Actions**:
- Import StatsService into GameState
Add lifetime kills update to round end processing
Update stats after reward distribution
Log successful stats updates
Handle failed blockchain transactions gracefully

**Test**: Player lifetime kills update on blockchain at round end. Stats persist across multiple rounds.
### Step 3.5: Add Lifetime Stats Display
**Objective**: Show player lifetime statistics in game UI.
**Actions**:
- Create client-side stats service to read from blockchain
Add lifetime kills display to player profile/leaderboard
Query blockchain for player stats on connection
Update stats display after each round
Add loading states for blockchain queries

**Test**: Client displays correct lifetime kills for connected player. Stats update after round completion.
### Step 3.6: Create Leaderboard Integration
**Objective**: Show lifetime statistics in game leaderboard.
**Actions**:
- Modify leaderboard to include lifetime kills column
Query lifetime stats for all connected players
Cache stats to reduce blockchain queries
Update lifetime stats periodically
Sort leaderboard by round kills and lifetime kills options

**Test**: Leaderboard shows both round kills and lifetime kills. Data is accurate and updates correctly.
### Step 3.7: Add Stats Persistence
**Objective**: Ensure stats survive server restarts and disconnections.
**Actions**:
- Verify stats persist when players disconnect and reconnect
Test stats accuracy after server restart
Add stats validation against blockchain data
Handle edge cases (network failures, contract unavailable)
Add stats recovery mechanisms

**Test**: Player stats remain accurate across disconnections and server restarts. Blockchain data is authoritative.
### Step 3.8: Optimize Stats Performance
**Objective**: Reduce blockchain query load and improve response times.
**Actions**:
- Implement client-side caching for lifetime stats
Batch multiple stats queries when possible
Add background stats updates to reduce UI blocking
Cache frequently accessed player stats on server
Add performance monitoring for blockchain interactions

**Test**: Stats load quickly without blocking gameplay. Blockchain queries are minimized while maintaining accuracy.
## Phase 4: Tournament Contract
### Step 4.1: Create Tournament Smart Contract
**Objective**: Deploy contract to manage tournament entry fees and prize pools.
**Actions**:
- Create contracts/Tournament.sol file
Implement tournament struct with id, entryFee, prizePool, and participants
Add createTournament() function with onlyOwner modifier
Implement joinTournament() function with ERC20 token transfer
Add distributePrize() function for winner payouts

**Test**: Contract compiles successfully. Tournament creation and joining functions work with test tokens.
### Step 4.2: Deploy Tournament Contract
**Objective**: Deploy tournament management to local blockchain.
**Actions**:
- Add Tournament contract to deployment script
Deploy with server wallet as owner
Set SURRToken contract address in Tournament constructor
Save Tournament contract address and ABI
Verify tournament creation functionality

**Test**: Tournament contract deploys successfully. Can create tournaments and verify entry requirements.
### Step 4.3: Create Backend Tournament Service
**Objective**: Enable server to manage tournaments through smart contract.
**Actions**:
- Create server/src/web3/TournamentService.js file
Import Tournament contract ABI and address
Implement createTournament(entryFee) method
Add distributePrize(tournamentId, winners[]) method
Include tournament state management

**Test**: Server can create tournaments and distribute prizes. Contract state updates correctly.
### Step 4.4: Add Tournament UI Components
**Objective**: Create frontend interface for tournament participation.
**Actions**:
- Create client/src/ui/Tournament.js component
Add tournament list display showing active tournaments
Implement "Join Tournament" button with entry fee display
Add tournament status indicators (joining, active, completed)
Show current participants and prize pool

**Test**: Tournament UI displays correctly. Players can see available tournaments and entry requirements.
### Step 4.5: Implement Token Approval Flow
**Objective**: Handle ERC20 token allowance for tournament entry.
**Actions**:
- Add token approval check before tournament joining
Implement approveTokens(amount) method in TokenManager
Show approval transaction prompt to user
Handle approval confirmation before tournament entry
Add approval status indicators in UI

**Test**: Players can approve tokens for tournament contract. Approval transaction completes before tournament entry.
### Step 4.6: Implement Tournament Joining
**Objective**: Allow players to enter tournaments with token payment.
**Actions**:
- Add joinTournament(tournamentId) method to TournamentService (client)
Implement tournament entry transaction flow
Handle successful and failed tournament entries
Update UI to show player's tournament participation
Add transaction confirmation handling

**Test**: Players can successfully join tournaments. Entry fee is deducted and player is added to participant list.
### Step 4.7: Create Tournament Gameplay Mode
**Objective**: Implement special tournament matches with winner tracking.
**Actions**:
- Add tournament mode flag to server GameState
Create tournament-specific match logic
Track tournament participants separately from regular players
Implement tournament winner determination (highest kills)
Add tournament match timer and completion logic

**Test**: Tournament matches run separately from regular games. Winners are determined correctly based on kills.
### Step 4.8: Implement Prize Distribution
**Objective**: Automatically distribute tournament prizes to winners.
**Actions**:
- Add automatic prize distribution at tournament end
Calculate prize shares for winners (single winner or split)
Call contract distributePrize() method with winner addresses
Handle prize distribution transaction confirmations
Add winner notification system

**Test**: Tournament prizes are distributed correctly to winners. Token balances update with prize amounts.
### Step 4.9: Add Tournament History
**Objective**: Track completed tournaments and results.
**Actions**:
- Store tournament results on server
Display tournament history in UI
Show past winners and prize amounts
Add personal tournament statistics for players
Create tournament leaderboards

**Test**: Players can view tournament history and their past performance. Results are accurate and persistent.
### Step 4.10: Handle Tournament Edge Cases
**Objective**: Manage tournament failures and edge cases gracefully.
**Actions**:
- Handle tournaments with no participants (refund system)
Manage tournament cancellations
Add timeout handling for tournament entry period
Handle ties in tournament results
Implement emergency tournament recovery procedures

**Test**: Tournament system handles edge cases without losing player funds. All scenarios resolve correctly.
## Phase 5: Car NFTs
### Step 5.1: Create Car NFT Smart Contract
**Objective**: Deploy ERC721 contract for unique car ownership.
**Actions**:
- Create contracts/SurrCars.sol file
Implement ERC721 contract using OpenZeppelin imports
Add safeMint(to, tokenId, uri) function with onlyOwner modifier
Implement tokenURI() override for metadata
Add enumerable extension for owner token listing

**Test**: Contract compiles successfully. NFTs can be minted and metadata URIs are set correctly.
### Step 5.2: Design Car Metadata Schema
**Objective**: Create standardized metadata format for car NFTs.
**Actions**:
- Design JSON metadata schema with name, description, image, model_url fields
Create sample metadata files for different car types
Host metadata files on accessible URL (local server for testing)
Add attributes for car stats (speed, handling, special abilities)
Validate metadata format against ERC721 standards

**Test**: Metadata JSON files are valid and accessible. Schema includes all required car information.
### Step 5.3: Deploy Car NFT Contract
**Objective**: Deploy car NFT system to blockchain.
**Actions**:
- Add SurrCars contract to deployment script
Deploy contract with server wallet as owner
Mint initial car NFTs for testing (3-5 different car types)
Save contract address and ABI for client access
Verify NFT minting and metadata retrieval

**Test**: Car NFT contract deploys successfully. Initial NFTs exist with correct metadata URIs.
### Step 5.4: Create Client NFT Manager
**Objective**: Enable client to interact with car NFT contract.
**Actions**:
- Create client/src/web3/NFTManager.js file
Import SurrCars contract ABI and address
Implement getOwnedCars(address) method
Add getCarMetadata(tokenId) method
Include error handling for contract interactions

**Test**: Client can query owned NFTs for connected wallet. Metadata loads correctly for each owned car.
### Step 5.5: Add Car Selection UI
**Objective**: Create garage/hangar interface for car selection.
**Actions**:
- Create client/src/ui/Garage.js component
Display owned car NFTs with images and names
Implement car selection mechanism
Add "Equip" button for chosen car
Show currently equipped car indicator

**Test**: Garage UI displays owned cars correctly. Players can select and equip different cars.
### Step 5.6: Integrate Car Models with Gameplay
**Objective**: Load different 3D models based on equipped NFT.
**Actions**:
- Extend car.glb asset system to support multiple car models
Map NFT token IDs to corresponding 3D model files
Update Player class to store equipped car information
Modify scene rendering to load correct car model per player
Add fallback to default car for players without NFTs

**Test**: Players with NFTs display different car models in-game. Other players see the correct models.
### Step 5.7: Add Car Selection to Join Game
**Objective**: Send equipped car information when joining games.
**Actions**:
- Query player's NFTs when connecting wallet
Add car selection step before joining game
Send equipped car token ID with joinGame event
Update server to track player's equipped car
Broadcast car information to other clients

**Test**: Equipped car information is sent to server and synchronized across all clients.
### Step 5.8: Implement Car Minting System
**Objective**: Allow players to acquire new car NFTs.
**Actions**:
- Add mint function to server TournamentService (as rewards) or separate mint service
Create minting UI with available car types
Implement minting transaction flow
Add minting costs (either tokens or tournament rewards)
Handle minting transaction confirmations

**Test**: Players can mint new car NFTs through the game interface. New NFTs appear in garage immediately.
### Step 5.9: Add Car Statistics System
**Objective**: Make different car NFTs affect gameplay mechanics.
**Actions**:
- Define car stats in metadata (speed multiplier, handling, special abilities)
Parse car statistics from NFT metadata
Apply stat modifications to player physics
Display car stats in garage UI
Balance different car types for fair gameplay

**Test**: Different car NFTs provide distinct gameplay advantages. Stats are visible and applied correctly.
### Step 5.10: Optimize NFT Performance
**Objective**: Ensure NFT system doesn't impact game performance.
**Actions**:
- Cache NFT metadata to reduce blockchain queries
Preload car models to prevent in-game loading delays
Optimize NFT ownership queries
Add loading states for NFT-related operations
Handle blockchain connectivity issues gracefully

**Test**: NFT system operates smoothly without affecting gameplay performance. All features work offline after initial load.

## Success Criteria

Upon completion of this Web3 integration implementation:

- Players authenticate using MetaMask wallets instead of usernames
- ERC20 tokens are automatically distributed for kills at round end
- Lifetime kill statistics are permanently stored on blockchain
- Players can create and join tournaments with token entry fees
- Car NFTs provide unique visual appearances and gameplay benefits
- All Web3 features work on local blockchain for development
- Smart contracts are secure and handle edge cases appropriately
- Game performance remains smooth with Web3 integration active

## Future Enhancements (Not Included in Base Implementation)

- Mainnet/testnet deployment with real tokens
- NFT marketplace for trading cars
- Staking mechanisms for passive token earning
- DAO governance for game parameters
- Cross-chain compatibility
- Advanced tournament formats (brackets, leagues)
- Seasonal NFT drops and special events
- Token utility expansion (upgrades, customization)