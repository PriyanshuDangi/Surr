// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Tournament is AccessControl, ReentrancyGuard {
    bytes32 public constant GAME_SERVER_ROLE = keccak256("GAME_SERVER_ROLE");
    
    struct TournamentData {
        uint256 id;
        uint256 startTime;
        uint256 duration;
        uint256 poolAmount;
        uint256 code; // 6-digit code
        uint256 maxParticipants;
        address creator;
        address[] participants;
        address[] winners;
        uint256 totalPrizePool;
        bool winnersSet;
        bool prizesClaimed;
        mapping(address => bool) isParticipant;
        mapping(address => bool) hasClaimedPrize;
    }
    
    IERC20 public immutable surrToken;
    uint256 public nextTournamentId;
    mapping(uint256 => TournamentData) public tournaments;
    mapping(uint256 => mapping(address => bool)) public tournamentParticipants;
    mapping(uint256 => mapping(address => bool)) public tournamentWinners;
    
    event TournamentCreated(
        uint256 indexed tournamentId,
        address indexed creator,
        uint256 startTime,
        uint256 duration,
        uint256 poolAmount,
        uint256 code,
        uint256 maxParticipants
    );
    
    event PlayerRegistered(
        uint256 indexed tournamentId,
        address indexed player,
        uint256 participantCount
    );
    
    event WinnersSet(
        uint256 indexed tournamentId,
        address[] winners,
        uint256 prizePerWinner
    );
    
    event PrizeClaimed(
        uint256 indexed tournamentId,
        address indexed winner,
        uint256 amount
    );
    
    constructor(address _surrToken) {
        surrToken = IERC20(_surrToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_SERVER_ROLE, msg.sender);
        nextTournamentId = 1;
    }
    
    modifier validTournament(uint256 tournamentId) {
        require(tournamentId > 0 && tournamentId < nextTournamentId, "Invalid tournament ID");
        _;
    }
    
    modifier tournamentExists(uint256 tournamentId) {
        require(tournaments[tournamentId].id != 0, "Tournament does not exist");
        _;
    }
    
    function createTournament(
        uint256 startTime,
        uint256 duration,
        uint256 poolAmount,
        uint256 maxParticipants
    ) external returns (uint256 tournamentId) {
        require(startTime > block.timestamp, "Start time must be in the future");
        require(duration > 0, "Duration must be greater than 0");
        require(poolAmount > 0, "Pool amount must be greater than 0");
        require(maxParticipants > 0, "Max participants must be greater than 0");
        
        tournamentId = nextTournamentId++;
        
        // Generate random 6-digit code
        uint256 code = _generateRandomCode(tournamentId);
        
        TournamentData storage tournament = tournaments[tournamentId];
        tournament.id = tournamentId;
        tournament.startTime = startTime;
        tournament.duration = duration;
        tournament.poolAmount = poolAmount;
        tournament.code = code;
        tournament.maxParticipants = maxParticipants;
        tournament.creator = msg.sender;
        tournament.winnersSet = false;
        tournament.prizesClaimed = false;
        
        emit TournamentCreated(
            tournamentId,
            msg.sender,
            startTime,
            duration,
            poolAmount,
            code,
            maxParticipants
        );
        
        return tournamentId;
    }
    
    function registerForTournament(uint256 tournamentId) 
        external 
        validTournament(tournamentId)
        tournamentExists(tournamentId)
        nonReentrant
    {
        TournamentData storage tournament = tournaments[tournamentId];
        
        require(block.timestamp < tournament.startTime, "Registration period has ended");
        require(tournament.participants.length < tournament.maxParticipants, "Tournament is full");
        require(!tournamentParticipants[tournamentId][msg.sender], "Already registered");
        
        // Transfer entry fee
        require(
            surrToken.transferFrom(msg.sender, address(this), tournament.poolAmount),
            "Failed to transfer entry fee"
        );
        
        tournament.participants.push(msg.sender);
        tournamentParticipants[tournamentId][msg.sender] = true;
        tournament.totalPrizePool += tournament.poolAmount;
        
        emit PlayerRegistered(tournamentId, msg.sender, tournament.participants.length);
    }
    
    function setWinners(uint256 tournamentId, address[] calldata winners)
        external
        onlyRole(GAME_SERVER_ROLE)
        validTournament(tournamentId)
        tournamentExists(tournamentId)
    {
        require(block.timestamp >= tournaments[tournamentId].startTime, "Tournament has not started");
        require(!tournaments[tournamentId].winnersSet, "Winners already set");
        require(winners.length > 0, "Must have at least one winner");
        
        // Validate all winners are participants
        for (uint256 i = 0; i < winners.length; i++) {
            require(tournamentParticipants[tournamentId][winners[i]], "Winner must be a participant");
            tournamentWinners[tournamentId][winners[i]] = true;
        }
        
        tournaments[tournamentId].winners = winners;
        tournaments[tournamentId].winnersSet = true;
        
        uint256 prizePerWinner = tournaments[tournamentId].totalPrizePool / winners.length;
        
        emit WinnersSet(tournamentId, winners, prizePerWinner);
    }
    
    function claimPrize(uint256 tournamentId)
        external
        validTournament(tournamentId)
        tournamentExists(tournamentId)
        nonReentrant
    {
        require(tournaments[tournamentId].winnersSet, "Winners not set yet");
        require(
            block.timestamp >= tournaments[tournamentId].startTime + tournaments[tournamentId].duration,
            "Tournament duration not finished"
        );
        require(tournamentWinners[tournamentId][msg.sender], "Not a winner");
        require(
            !tournaments[tournamentId].hasClaimedPrize[msg.sender],
            "Prize already claimed"
        );
        
        tournaments[tournamentId].hasClaimedPrize[msg.sender] = true;
        
        uint256 prizeAmount = tournaments[tournamentId].totalPrizePool / tournaments[tournamentId].winners.length;
        
        require(surrToken.transfer(msg.sender, prizeAmount), "Failed to transfer prize");
        
        emit PrizeClaimed(tournamentId, msg.sender, prizeAmount);
    }
    
    // View functions - Split into smaller functions to avoid stack too deep
    function getTournamentBasicInfo(uint256 tournamentId)
        external
        view
        validTournament(tournamentId)
        returns (
            uint256 id,
            uint256 startTime,
            uint256 duration,
            uint256 poolAmount,
            uint256 code,
            uint256 maxParticipants,
            address creator
        )
    {
        TournamentData storage tournament = tournaments[tournamentId];
        return (
            tournament.id,
            tournament.startTime,
            tournament.duration,
            tournament.poolAmount,
            tournament.code,
            tournament.maxParticipants,
            tournament.creator
        );
    }
    
    function getTournamentStatus(uint256 tournamentId)
        external
        view
        validTournament(tournamentId)
        returns (
            uint256 totalPrizePool,
            bool winnersSet,
            bool prizesClaimed,
            uint256 participantCount,
            uint256 winnerCount
        )
    {
        TournamentData storage tournament = tournaments[tournamentId];
        return (
            tournament.totalPrizePool,
            tournament.winnersSet,
            tournament.prizesClaimed,
            tournament.participants.length,
            tournament.winners.length
        );
    }
    
    function getTournamentParticipants(uint256 tournamentId)
        external
        view
        validTournament(tournamentId)
        returns (address[] memory)
    {
        return tournaments[tournamentId].participants;
    }
    
    function getTournamentWinners(uint256 tournamentId)
        external
        view
        validTournament(tournamentId)
        returns (address[] memory)
    {
        return tournaments[tournamentId].winners;
    }
    
    function isParticipant(uint256 tournamentId, address player)
        external
        view
        returns (bool)
    {
        return tournamentParticipants[tournamentId][player];
    }
    
    function isWinner(uint256 tournamentId, address player)
        external
        view
        returns (bool)
    {
        return tournamentWinners[tournamentId][player];
    }
    
    function hasClaimedPrize(uint256 tournamentId, address player)
        external
        view
        returns (bool)
    {
        return tournaments[tournamentId].hasClaimedPrize[player];
    }
    
    function canRegister(uint256 tournamentId, address player)
        external
        view
        validTournament(tournamentId)
        returns (bool)
    {
        return (
            block.timestamp < tournaments[tournamentId].startTime &&
            tournaments[tournamentId].participants.length < tournaments[tournamentId].maxParticipants &&
            !tournamentParticipants[tournamentId][player]
        );
    }
    
    function canClaimPrize(uint256 tournamentId, address player)
        external
        view
        validTournament(tournamentId)
        returns (bool)
    {
        return (
            tournaments[tournamentId].winnersSet &&
            block.timestamp >= tournaments[tournamentId].startTime + tournaments[tournamentId].duration &&
            tournamentWinners[tournamentId][player] &&
            !tournaments[tournamentId].hasClaimedPrize[player]
        );
    }
    
    // Internal functions
    function _generateRandomCode(uint256 tournamentId) internal view returns (uint256) {
        // Generate a pseudo-random 6-digit code (100000 to 999999)
        uint256 randomNum = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            tournamentId,
            msg.sender
        ))) % 900000;
        return randomNum + 100000;
    }
    
    // Emergency functions (admin only)
    function emergencyWithdraw(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(surrToken.transfer(msg.sender, amount), "Failed to withdraw");
    }
    
    function grantGameServerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(GAME_SERVER_ROLE, account);
    }
    
    function revokeGameServerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(GAME_SERVER_ROLE, account);
    }
}
