# Surr - Web3 Integration Design Document

This document outlines the design and implementation plan for integrating Web3 features into the Surr game. The phases are designed to be completed sequentially, building upon the existing game structure.

## Phase 1: Wallet Integration & ERC20 Token

**Objective**: Integrate Web3 wallet authentication as the primary login method and deploy the game's core ERC20 token for rewards.

### 1. Components

**Frontend (Client):**
- Web3.js library integration
- UI for "Connect Wallet" button
- Logic to handle wallet connection, display connected address, and manage session state

**Backend (Server):**
- Endpoint to verify player authentication (optional, can be handled client-side initially)

**Smart Contract (Solidity):**
- An ERC20 contract for the in-game currency (e.g., SURRToken)

### 2. Flow & Logic

- **User Visits Game**: The initial screen presents a "Connect Wallet" button instead of a name input field
- **Connect Wallet**: User clicks the button, triggering a MetaMask (or other provider) prompt to connect their wallet
- **Authentication**: Once connected, the frontend retrieves the user's wallet address. This address becomes their unique player identifier
- **Session Management**: The client stores the connection state. All subsequent server communication from the client will include the wallet address. The "Join Game" button becomes active only after a wallet is connected
- **ERC20 Deployment**: Separately, deploy a standard ERC20 contract to a testnet (e.g., Sepolia). This token will be used for rewards. Mint an initial supply to a treasury wallet you control

### 3. Technical Details

**ERC20 Contract (SURRToken.sol):**
- Standard OpenZeppelin ERC20 implementation
- Fields: name, symbol, decimals
- `mint(address to, uint256 amount)` function should be `onlyOwner` to control supply
## Phase 2: Continuous Gameplay & Kill-to-Earn

**Objective**: Refactor the game loop to be a continuous 3-minute match that players can join at any time. Implement a backend service to reward players with SURRToken for each kill.

### 1. Components

**Backend (Server):**
- **Game Loop Timer**: A persistent server-side timer that resets the game state every 3 minutes
- **Kill Tracking**: Logic to securely track kills associated with a player's wallet address
- **Reward Service**: A service that interacts with the SURRToken contract to distribute rewards. This service must securely manage the private key of the treasury wallet

**Frontend (Client):**
- UI to display the remaining time in the current match
- Logic to handle joining a game that is already in progress

### 2. Flow & Logic

**Server State**: The server maintains a global game timer. When the timer reaches zero, it:
- Calculates rewards for the completed round
- Broadcasts a "Round Over" event
- Resets the leaderboard and game state
- Restarts the 3-minute timer

**Player Joins**: A player connects and joins the game. The server adds them to the current, ongoing match.

**Player Gets a Kill**: The existing `missileHit` event is processed by the server. The server now increments a kill count for the shooter's wallet address for the current round.

**Round End & Payout**:
- When the timer ends, the server iterates through the list of players who made kills
- For each kill, the backend's reward service calls the `transfer` function of the SURRToken contract to send tokens from the treasury wallet to the player's wallet
- **Example**: If the reward is 10 tokens per kill and a player got 3 kills, the backend calls `SURRToken.transfer(playerAddress, 30 * 10**18)`

### 3. Technical Details

**Backend:**
- Use web3.js library for backend-to-blockchain interaction
- Store the treasury wallet's private key securely in an environment variable (.env file)
- The server's GameState will need a global `roundEndTime` property
## Phase 3: Lifetime Kills Contract

**Objective**: Create a smart contract to store a player's total kills, creating a persistent, on-chain record of their lifetime achievements.

### 1. Components

**Smart Contract (Solidity):**
- A contract (LifetimeKills) to store kill counts

**Backend (Server):**
- Service to interact with the LifetimeKills contract after each game

### 2. Flow & Logic

- **Contract Deployment**: Deploy the LifetimeKills contract. The owner of the contract will be the backend wallet address, giving it permission to update kills
- **Game End**: At the end of each 3-minute round, after calculating rewards, the backend service will also update the lifetime kills
- **Update Kills**: The backend calls the `addKills` function on the LifetimeKills contract for each player who participated, passing their wallet address and the number of kills they made in that round

### 3. Technical Details

**LifetimeKills.sol Contract:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LifetimeKills {
    address public owner;
    mapping(address => uint256) public totalKills;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addKills(address player, uint256 kills) external onlyOwner {
        totalKills[player] += kills;
    }

    function getKills(address player) external view returns (uint256) {
        return totalKills[player];
    }
}
```

**Backend**: The server will need the address and ABI of the deployed LifetimeKills contract.
## Phase 4: Tournament Contract

**Objective**: Allow players to enter tournaments by pooling SURRToken. The contract will manage the prize pool and distribute it to the winner(s).

### 1. Components

**Smart Contract (Solidity):**
- A Tournament contract to manage prize pools and payouts

**Frontend (Client):**
- UI for viewing, joining, and seeing the status of tournaments

**Backend (Server):**
- Service to create tournaments and report the winner(s) to the contract

### 2. Flow & Logic

**Tournament Creation (Backend)**: An admin or automated process on the backend calls `createTournament` on the contract, defining an entry fee.

**Player Joins (Frontend)**:
- A player clicks "Join Tournament" in the UI
- The frontend first prompts the player to approve the Tournament contract to spend their SURRToken. This is a one-time transaction
- The frontend then calls the `joinTournament` function on the contract. The contract uses `transferFrom` to pull the entry fee from the player's wallet into the prize pool

**Gameplay**: Players who joined the tournament play a special match.

**Report Winner (Backend)**: After the match, the backend server (acting as the owner/oracle) calls the `distributePrize` function on the contract, providing the wallet address(es) of the winner(s).

**Payout**: The contract divides the total prize pool equally among the provided winner addresses and transfers the tokens.

### 3. Technical Details

**Tournament.sol Contract:**
- `mapping(uint256 => TournamentData) public tournaments;` to store tournament info
- `createTournament(uint256 entryFee)`: An `onlyOwner` function to start a new tournament
- `joinTournament(uint256 tournamentId)`: Public function for players to join. Requires prior ERC20 approval
- `distributePrize(uint256 tournamentId, address[] calldata winners)`: An `onlyOwner` function to end the tournament and pay the winners
## Phase 5: Car NFTs

**Objective**: Deploy an NFT contract for unique in-game cars. Allow players to mint/buy these NFTs and equip them in-game.

### 1. Components

**Smart Contract (Solidity):**
- An ERC721 contract (SurrCars) for the car NFTs

**Frontend (Client):**
- A "Garage" or "Hangar" UI where players can view their owned car NFTs
- Logic to check a player's wallet for car NFTs and allow them to select one
- Logic to load the corresponding 3D model for the selected NFT

**Backend (Server):**
- (Optional for V1) A marketplace backend if you want to facilitate sales

### 2. Flow & Logic

**NFT Deployment**: Deploy a standard ERC721 contract. Each token ID will correspond to a specific car model. Metadata (pointing to the car model file, stats, etc.) should be managed via an off-chain or IPFS URI.

**Minting**: Create a mint function for players to buy new car NFTs, or airdrop them initially.

**Player Connects (Frontend)**: When a player connects their wallet, the client:
- Queries the SurrCars contract to see which NFTs that address owns (`balanceOf` and `tokenOfOwnerByIndex`)
- Displays the owned cars in the UI

**Car Selection**: The player selects a car from their collection. The client stores this choice.

**Join Game**: When the player joins a game, the client sends their selected car's token ID to the server. The client then loads the appropriate `car.glb` model for that NFT. All other players receive this information and render the correct model for that player.

### 3. Technical Details

**SurrCars.sol Contract:**
- Use OpenZeppelin's ERC721 and ERC721URIStorage contracts
- `safeMint(address to, string memory uri)`: An `onlyOwner` function to mint a new car NFT and assign its metadata URI
- `tokenURI(uint256 tokenId)`: Returns the metadata URI for a given car

**Metadata Standard**: Use a JSON file for metadata, e.g.:

```json
{
  "name": "Cyber Speeder",
  "description": "A futuristic racing kart.",
  "image": "https://your-cdn.com/cars/cyber-speeder.png",
  "model_url": "https://your-cdn.com/cars/cyber-speeder.glb"
}
```




