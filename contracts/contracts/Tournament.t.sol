// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "./Tournament.sol";
import "./SurrToken.sol";

contract TournamentTest is Test {
    Tournament public tournament;
    SurrToken public surrToken;
    
    address public admin = address(0x1);
    address public gameServer = address(0x2);
    address public player1 = address(0x3);
    address public player2 = address(0x4);
    address public player3 = address(0x5);
    address public creator = address(0x6);
    
    uint256 constant ENTRY_FEE = 100 * 10**18; // 100 tokens
    uint256 constant MAX_PARTICIPANTS = 10;
    uint256 constant TOURNAMENT_DURATION = 3600; // 1 hour
    
    function setUp() public {
        // Deploy contracts
        vm.startPrank(admin);
        surrToken = new SurrToken();
        tournament = new Tournament(address(surrToken));
        
        // Grant game server role
        tournament.grantGameServerRole(gameServer);
        vm.stopPrank();
        
        // Mint tokens to players
        vm.startPrank(admin);
        surrToken.mint(player1, 1000 * 10**18);
        surrToken.mint(player2, 1000 * 10**18);
        surrToken.mint(player3, 1000 * 10**18);
        surrToken.mint(creator, 1000 * 10**18);
        vm.stopPrank();
        
        // Approve tournament contract to spend tokens
        vm.prank(player1);
        surrToken.approve(address(tournament), type(uint256).max);
        vm.prank(player2);
        surrToken.approve(address(tournament), type(uint256).max);
        vm.prank(player3);
        surrToken.approve(address(tournament), type(uint256).max);
        vm.prank(creator);
        surrToken.approve(address(tournament), type(uint256).max);
    }
    
    function testCreateTournament() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        // Check tournament was created correctly
        (
            uint256 id,
            uint256 _startTime,
            uint256 duration,
            uint256 poolAmount,
            uint256 code,
            uint256 maxParticipants,
            address _creator
        ) = tournament.getTournamentBasicInfo(tournamentId);
        
        (
            uint256 totalPrizePool,
            bool winnersSet,
            bool prizesClaimed,
            uint256 participantCount,
            uint256 winnerCount
        ) = tournament.getTournamentStatus(tournamentId);
        
        assertEq(id, 1);
        assertEq(_startTime, startTime);
        assertEq(duration, TOURNAMENT_DURATION);
        assertEq(poolAmount, ENTRY_FEE);
        assertGe(code, 100000);
        assertLe(code, 999999);
        assertEq(maxParticipants, MAX_PARTICIPANTS);
        assertEq(_creator, creator);
        assertEq(participantCount, 0);
        assertEq(winnerCount, 0);
        assertEq(totalPrizePool, 0);
        assertFalse(winnersSet);
        assertFalse(prizesClaimed);
    }
    
    function testCreateTournamentInvalidStartTime() public {
        uint256 pastTime = block.timestamp - 100;
        
        vm.prank(creator);
        vm.expectRevert("Start time must be in the future");
        tournament.createTournament(
            pastTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
    }
    
    function testRegisterForTournament() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        uint256 balanceBefore = surrToken.balanceOf(player1);
        
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        
        uint256 balanceAfter = surrToken.balanceOf(player1);
        
        // Check balance was deducted
        assertEq(balanceBefore - balanceAfter, ENTRY_FEE);
        
        // Check player is registered
        assertTrue(tournament.isParticipant(tournamentId, player1));
        
        address[] memory participants = tournament.getTournamentParticipants(tournamentId);
        assertEq(participants.length, 1);
        assertEq(participants[0], player1);
    }
    
    function testRegisterAfterStartTime() public {
        uint256 startTime = block.timestamp + 100;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        // Move time past start time
        vm.warp(startTime + 1);
        
        vm.prank(player1);
        vm.expectRevert("Registration period has ended");
        tournament.registerForTournament(tournamentId);
    }
    
    function testRegisterTwice() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        
        vm.prank(player1);
        vm.expectRevert("Already registered");
        tournament.registerForTournament(tournamentId);
    }
    
    function testSetWinners() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        // Register players
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        vm.prank(player2);
        tournament.registerForTournament(tournamentId);
        
        // Move time to start
        vm.warp(startTime);
        
        address[] memory winners = new address[](1);
        winners[0] = player1;
        
        vm.prank(gameServer);
        tournament.setWinners(tournamentId, winners);
        
        // Check winners were set
        assertTrue(tournament.isWinner(tournamentId, player1));
        assertFalse(tournament.isWinner(tournamentId, player2));
        
        address[] memory tournamentWinners = tournament.getTournamentWinners(tournamentId);
        assertEq(tournamentWinners.length, 1);
        assertEq(tournamentWinners[0], player1);
    }
    
    function testSetWinnersBeforeStart() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        
        address[] memory winners = new address[](1);
        winners[0] = player1;
        
        vm.prank(gameServer);
        vm.expectRevert("Tournament has not started");
        tournament.setWinners(tournamentId, winners);
    }
    
    function testSetWinnersNonParticipant() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        
        vm.warp(startTime);
        
        address[] memory winners = new address[](1);
        winners[0] = player2; // player2 didn't register
        
        vm.prank(gameServer);
        vm.expectRevert("Winner must be a participant");
        tournament.setWinners(tournamentId, winners);
    }
    
    function testClaimPrize() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        // Register players
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        vm.prank(player2);
        tournament.registerForTournament(tournamentId);
        
        // Start tournament
        vm.warp(startTime);
        
        // Set winners
        address[] memory winners = new address[](1);
        winners[0] = player1;
        
        vm.prank(gameServer);
        tournament.setWinners(tournamentId, winners);
        
        // Move to end of tournament
        vm.warp(startTime + TOURNAMENT_DURATION);
        
        uint256 balanceBefore = surrToken.balanceOf(player1);
        
        vm.prank(player1);
        tournament.claimPrize(tournamentId);
        
        uint256 balanceAfter = surrToken.balanceOf(player1);
        
        // Should receive full prize pool (2 * ENTRY_FEE)
        assertEq(balanceAfter - balanceBefore, 2 * ENTRY_FEE);
        
        // Check prize is marked as claimed
        assertTrue(tournament.hasClaimedPrize(tournamentId, player1));
    }
    
    function testClaimPrizeMultipleWinners() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        // Register players
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        vm.prank(player2);
        tournament.registerForTournament(tournamentId);
        
        vm.warp(startTime);
        
        // Set multiple winners
        address[] memory winners = new address[](2);
        winners[0] = player1;
        winners[1] = player2;
        
        vm.prank(gameServer);
        tournament.setWinners(tournamentId, winners);
        
        vm.warp(startTime + TOURNAMENT_DURATION);
        
        uint256 balance1Before = surrToken.balanceOf(player1);
        uint256 balance2Before = surrToken.balanceOf(player2);
        
        vm.prank(player1);
        tournament.claimPrize(tournamentId);
        
        vm.prank(player2);
        tournament.claimPrize(tournamentId);
        
        uint256 balance1After = surrToken.balanceOf(player1);
        uint256 balance2After = surrToken.balanceOf(player2);
        
        // Each should receive half the prize pool
        assertEq(balance1After - balance1Before, ENTRY_FEE);
        assertEq(balance2After - balance2Before, ENTRY_FEE);
    }
    
    function testClaimPrizeBeforeTournamentEnd() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        
        vm.warp(startTime);
        
        address[] memory winners = new address[](1);
        winners[0] = player1;
        
        vm.prank(gameServer);
        tournament.setWinners(tournamentId, winners);
        
        // Try to claim before tournament ends
        vm.prank(player1);
        vm.expectRevert("Tournament duration not finished");
        tournament.claimPrize(tournamentId);
    }
    
    function testClaimPrizeTwice() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        
        vm.warp(startTime);
        
        address[] memory winners = new address[](1);
        winners[0] = player1;
        
        vm.prank(gameServer);
        tournament.setWinners(tournamentId, winners);
        
        vm.warp(startTime + TOURNAMENT_DURATION);
        
        vm.prank(player1);
        tournament.claimPrize(tournamentId);
        
        vm.prank(player1);
        vm.expectRevert("Prize already claimed");
        tournament.claimPrize(tournamentId);
    }
    
    function testCanRegister() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        // Should be able to register before start
        assertTrue(tournament.canRegister(tournamentId, player1));
        
        // Register player1
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        
        // Player1 should no longer be able to register
        assertFalse(tournament.canRegister(tournamentId, player1));
        
        // Player2 should still be able to register
        assertTrue(tournament.canRegister(tournamentId, player2));
        
        // After start time, no one should be able to register
        vm.warp(startTime + 1);
        assertFalse(tournament.canRegister(tournamentId, player2));
    }
    
    function testCanClaimPrize() public {
        uint256 startTime = block.timestamp + 1000;
        
        vm.prank(creator);
        uint256 tournamentId = tournament.createTournament(
            startTime,
            TOURNAMENT_DURATION,
            ENTRY_FEE,
            MAX_PARTICIPANTS
        );
        
        vm.prank(player1);
        tournament.registerForTournament(tournamentId);
        
        // Should not be able to claim before winners are set
        assertFalse(tournament.canClaimPrize(tournamentId, player1));
        
        vm.warp(startTime);
        
        address[] memory winners = new address[](1);
        winners[0] = player1;
        
        vm.prank(gameServer);
        tournament.setWinners(tournamentId, winners);
        
        // Should not be able to claim before tournament ends
        assertFalse(tournament.canClaimPrize(tournamentId, player1));
        
        vm.warp(startTime + TOURNAMENT_DURATION);
        
        // Should be able to claim after tournament ends
        assertTrue(tournament.canClaimPrize(tournamentId, player1));
        
        vm.prank(player1);
        tournament.claimPrize(tournamentId);
        
        // Should not be able to claim after already claimed
        assertFalse(tournament.canClaimPrize(tournamentId, player1));
    }
}
