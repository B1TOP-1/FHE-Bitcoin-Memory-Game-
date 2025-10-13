// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Apple Guessing Game with FHE
/// @notice A game where players encrypt their apple choice, wait 10 seconds, then reveal to check if they match
/// @dev Uses FHEVM for fully homomorphic encryption to keep choices secret until reveal
contract AppleGame is SepoliaConfig {
    /// @notice Game state for each player
    struct GameSession {
        euint8 encryptedFirstChoice; // Encrypted first apple choice (0, 1, or 2)
        uint256 gameStartTime; // Timestamp when first choice was made
        bool gameActive; // Whether the game is currently active
        bool hasPlayed; // Whether player has completed a game
    }

    /// @notice Mapping from player address to their game session
    mapping(address => GameSession) public gameSessions;

    /// @notice Number of apples in the game (fixed at 3: 🍎 🍏 🍊)
    uint8 public constant NUM_APPLES = 3;

    /// @notice Required waiting time between choices (10 seconds)
    uint256 public constant WAIT_TIME = 10 seconds;

    /// @notice Emitted when a player starts a new game
    event GameStarted(address indexed player, uint256 startTime);

    /// @notice Emitted when a player completes a game
    event GameCompleted(address indexed player, bool isMatch, uint256 completionTime);

    /// @notice Emitted when a player resets their game
    event GameReset(address indexed player);

    /// @notice Error thrown when trying to start a game while one is already active
    error GameAlreadyActive();

    /// @notice Error thrown when trying to reveal before wait time has passed
    error WaitTimeNotElapsed();

    /// @notice Error thrown when trying to reveal without an active game
    error NoActiveGame();

    /// @notice Error thrown when apple choice is invalid (must be 0, 1, or 2)
    error InvalidAppleChoice();

    /// @notice Start a new game by making the first encrypted choice
    /// @param inputEuint8 The encrypted apple choice (0=🍎, 1=🍏, 2=🍊)
    /// @param inputProof The proof for the encrypted input
    function startGame(externalEuint8 inputEuint8, bytes calldata inputProof) external {
        if (gameSessions[msg.sender].gameActive) {
            revert GameAlreadyActive();
        }

        // Convert external encrypted input to internal encrypted type
        euint8 encryptedChoice = FHE.fromExternal(inputEuint8, inputProof);

        // Store the encrypted choice and game state
        gameSessions[msg.sender] = GameSession({
            encryptedFirstChoice: encryptedChoice,
            gameStartTime: block.timestamp,
            gameActive: true,
            hasPlayed: true
        });

        // Allow this contract and the player to access the encrypted value
        FHE.allowThis(encryptedChoice);
        FHE.allow(encryptedChoice, msg.sender);

        emit GameStarted(msg.sender, block.timestamp);
    }

    /// @notice Reveal by making the second choice and comparing with the first
    /// @param inputEuint8 The encrypted second apple choice
    /// @param inputProof The proof for the encrypted input
    /// @return encryptedResult Encrypted boolean indicating if choices match
    function revealAndCheck(
        externalEuint8 inputEuint8,
        bytes calldata inputProof
    ) external returns (euint8) {
        GameSession storage session = gameSessions[msg.sender];

        if (!session.gameActive) {
            revert NoActiveGame();
        }

        if (block.timestamp < session.gameStartTime + WAIT_TIME) {
            revert WaitTimeNotElapsed();
        }

        // Convert external encrypted input to internal encrypted type
        euint8 encryptedSecondChoice = FHE.fromExternal(inputEuint8, inputProof);

        // Perform encrypted comparison: does second choice equal first choice?
        ebool isMatch = FHE.eq(session.encryptedFirstChoice, encryptedSecondChoice);

        // Convert ebool to euint8 (1 for match, 0 for no match)
        euint8 result = FHE.asEuint8(isMatch);

        // Mark game as completed
        session.gameActive = false;

        // Allow the player to decrypt the result
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        emit GameCompleted(msg.sender, true, block.timestamp);

        return result;
    }

    /// @notice Reset the game to play again
    function resetGame() external {
        gameSessions[msg.sender].gameActive = false;

        emit GameReset(msg.sender);
    }

    /// @notice Get the time remaining before reveal is allowed
    /// @return timeRemaining Seconds remaining (0 if ready)
    function getTimeRemaining() external view returns (uint256) {
        GameSession storage session = gameSessions[msg.sender];

        if (!session.gameActive) {
            return 0;
        }

        uint256 elapsed = block.timestamp - session.gameStartTime;
        if (elapsed >= WAIT_TIME) {
            return 0;
        }

        return WAIT_TIME - elapsed;
    }

    /// @notice Check if player has an active game
    /// @return isActive Whether the game is active
    function isGameActive() external view returns (bool) {
        return gameSessions[msg.sender].gameActive;
    }

    /// @notice Get the player's encrypted first choice
    /// @return The encrypted first choice
    function getEncryptedFirstChoice() external view returns (euint8) {
        return gameSessions[msg.sender].encryptedFirstChoice;
    }

    /// @notice Get the game start time
    /// @return The timestamp when the game started
    function getGameStartTime() external view returns (uint256) {
        return gameSessions[msg.sender].gameStartTime;
    }

    /// @notice Check if player has ever played
    /// @return Whether the player has played before
    function hasPlayed() external view returns (bool) {
        return gameSessions[msg.sender].hasPlayed;
    }
}

