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
- Install Hardhat in project root: `npm install --save-dev hardhat`
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
### ### Step 2.1: Implement Server Game Timer

**Objective**: Create continuous 3-minute game rounds with automatic reset.

**Actions**:
- Add `roundEndTime` property to GameState class
- Create `startNewRound()` method that sets 3-minute timer
- Add `getRemainingTime()` method to calculate time left
- Implement timer check in main server loop
- Add round reset logic that clears scores and restarts timer

**Test**: Server starts with 3-minute countdown. Timer automatically resets to 3 minutes when reaching zero.
### ### Step 2.2: Add Round Timer Broadcasting

**Objective**: Send remaining round time to all clients.

**Actions**:
- Include remaining time in server gameState broadcasts
- Add timer display to client UI
- Update timer display every second on client
- Add visual indicators for round ending (countdown, color changes)
- Handle timer synchronization across clients

**Test**: All clients display synchronized countdown timer. Timer resets to 3:00 when round ends.
### ### Step 2.3: Track Kills Per Round

**Objective**: Count player kills separately for each round.

**Actions**:
- Add `roundKills` property to server Player class
- Modify missile hit processing to increment round kills instead of total score
- Reset round kills to zero when new round starts
- Keep separate permanent score for leaderboard display
- Update leaderboard to show round kills and total score

**Test**: Player round kills increment with each elimination. Round kills reset to zero when timer restarts.
### ### Step 2.4: Create Reward Calculation System

**Objective**: Calculate token rewards based on round performance.

**Actions**:
- Define reward rate (e.g., 10 tokens per kill)
- Create `calculateRewards()` method in GameState
- Add reward calculation at round end for all players with kills
- Store pending rewards for each player
- Add reward notification system for players

**Test**: Server calculates correct rewards (kills × reward rate) at round end for each player.
### Step 2.5: Install Backend Web3 Dependencies
**Objective**: Add server-side blockchain interaction capabilities.
**Actions**:
- Navigate to `server/` directory
- Install web3.js: `npm install web3`
- Install dotenv for environment variables: `npm install dotenv`
- Create `.env` file in server directory
- Add `.env` to `.gitignore` file

**Test**: Backend dependencies install successfully. .env file exists and is gitignored.
### Step 2.6: Create Backend Wallet Manager
**Objective**: Set up server-side wallet for token distribution.
**Actions**:
- Create `server/src/web3/` directory
- Create `server/src/web3/WalletManager.js` file
- Add treasury wallet private key to `.env` file (use Hardhat test account)
- Implement wallet connection to local blockchain
- Add method to get wallet balance and address

**Test**: Server connects to blockchain using treasury wallet. Wallet address and balance are retrievable.
### Step 2.7: Create Token Distribution Service
**Objective**: Enable server to send tokens to players.
**Actions**:
- Create server/src/web3/RewardService.js file
Import token contract ABI and address
Implement distributeRewards(playerAddress, amount) method
Add batch reward distribution for multiple players
Include error handling for failed transactions

**Test**: Server can successfully send tokens from treasury wallet to test addresses.
### Step 2.8: Integrate Reward Distribution with Round End
**Objective**: Automatically distribute tokens when rounds end.
**Actions**:
- Import RewardService into GameState
Add reward distribution call to round end logic
Send tokens to each player based on their round kills
Log successful and failed reward transactions
Add player notification for received rewards

**Test**: Players receive tokens automatically when round ends. Token balances increase correctly based on kills.
### Step 2.9: Add Reward Notifications to Client
**Objective**: Show players when they receive token rewards.
**Actions**:
- Add reward notification UI element
Listen for reward events from server
Display notification with token amount received
Add visual effects for reward notifications
Update client token balance display after rewards

**Test**: Players see notification when receiving rewards. Client shows updated token balance.
### Step 2.10: Handle Join-in-Progress Players
**Objective**: Allow players to join ongoing rounds seamlessly.
**Actions**:
- Update client to handle joining mid-round
Show current round timer when joining in progress
Initialize new player with zero round kills
Add them to current round reward eligibility
Update UI to indicate round is in progress

**Test**: Player can join game while round is active. Timer shows correct remaining time and player can earn rewards.
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