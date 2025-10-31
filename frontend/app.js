import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { ethers } from 'ethers';

// Contract Configuration
const CONTRACT_ADDRESS = '0x3C19c7C6fdce6696D7445331B34ceFEe5C5Cdc32';
const SEPOLIA_CHAIN_ID = 11155111;

// Contract ABI (minimal - only what we need)
const CONTRACT_ABI = [
    "function startGame(bytes32 encryptedChoice, bytes calldata inputProof) external",
    "function revealAndCheck(bytes32 encryptedChoice, bytes calldata inputProof) external returns (uint256)",
    "function resetGame() external",
    "function isGameActive() external view returns (bool)",
    "function hasPlayed() external view returns (bool)",
    "function getTimeRemaining() external view returns (uint256)",
    "function getEncryptedFirstChoice() external view returns (uint256)",
    "function players(address) external view returns (uint256 firstChoice, uint256 startTime, bool hasPlayed)"
];

// Global State
let provider = null;
let signer = null;
let contract = null;
let fhevmInstance = null;
let userAddress = null;
let selectedChoice = null;
let countdownInterval = null;
let isProcessing = false; // 防止重复点击

// Helper function to get the correct Ethereum provider
function getEthereumProvider() {
    if (typeof window.ethereum === 'undefined') {
        return null;
    }
    
    // Handle multiple wallet providers (e.g., MetaMask + Coinbase Wallet)
    if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        // Prefer MetaMask if available
        return window.ethereum.providers.find(
            (p) => p.isMetaMask === true
        ) || window.ethereum.providers[0];
    }
    
    return window.ethereum;
}

// Global error handler to filter out third-party library errors
window.addEventListener('error', (event) => {
    // Filter out known third-party errors that don't affect functionality
    const errorMessage = event.message || '';
    const errorSource = event.filename || '';
    
    // Ignore errors from injected scripts (browser extensions, etc.)
    if (errorSource.includes('injected') || 
        errorSource.includes('contentScript') ||
        errorMessage.includes('indexOf') ||
        errorMessage.includes('_url')) {
        event.preventDefault(); // Prevent error from showing in console
        return false;
    }
    
    // Log other errors for debugging
    console.warn('Unhandled error:', event.error);
    return true;
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || String(event.reason || '');
    const errorStack = event.reason?.stack || '';
    
    // Filter out known third-party errors
    if (errorMessage.includes('indexOf') || 
        errorMessage.includes('_url') ||
        errorStack.includes('injected')) {
        event.preventDefault();
        return false;
    }
    
    console.warn('Unhandled promise rejection:', event.reason);
    return true;
});

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('₿ Bitcoin Game Frontend Initialized');
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this dApp!');
        return;
    }
    
    // Check if already connected
    const ethereum = getEthereumProvider();
    if (ethereum) {
        try {
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking accounts:', error);
            // Continue anyway, user can click connect button
        }
    }
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('revealBtn').addEventListener('click', revealChoice);
    document.getElementById('resetGameBtn').addEventListener('click', resetGame);
    
    // Bitcoin card selection for start game
    document.querySelectorAll('#startGameSection .bitcoin-card').forEach(card => {
        card.addEventListener('click', () => selectBitcoin(card, 'start'));
    });
    
    // Bitcoin card selection for reveal
    document.querySelectorAll('#revealSection .bitcoin-card').forEach(card => {
        card.addEventListener('click', () => selectBitcoin(card, 'reveal'));
    });
    
    // Listen for account changes (only if ethereum provider exists)
    if (typeof window.ethereum !== 'undefined') {
        try {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
        } catch (error) {
            console.warn('Failed to set up ethereum event listeners:', error);
        }
    }
}

// Connect Wallet
async function connectWallet() {
    try {
        showLoading('Connecting wallet...');
        
        // Get the correct Ethereum provider
        const ethereum = getEthereumProvider();
        if (!ethereum) {
            throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
        }
        
        // Request account access
        const accounts = await ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please unlock MetaMask and try again.');
        }
        
        userAddress = accounts[0];
        
        // Setup provider and signer
        provider = new ethers.BrowserProvider(ethereum);
        signer = await provider.getSigner();
        
        // Check network and auto-switch if needed
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
            try {
                // Try to switch to Sepolia
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
                });
                // Wait a moment for the switch to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (switchError) {
                // If Sepolia is not added, add it
                if (switchError.code === 4902) {
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0xaa36a7',
                            chainName: 'Sepolia Test Network',
                            rpcUrls: ['https://sepolia.infura.io/v3/'],
                            nativeCurrency: {
                                name: 'SepoliaETH',
                                symbol: 'SepoliaETH',
                                decimals: 18
                            },
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                        }]
                    });
                } else {
                    throw new Error('Please switch to Sepolia Testnet manually');
                }
            }
        }
        
        // Initialize contract
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Initialize FHEVM with Relayer SDK
        await initializeFHEVM();
        
        // Get balance
        const balance = await provider.getBalance(userAddress);
        const balanceInEth = ethers.formatEther(balance);
        
        // Update UI
        document.getElementById('walletAddress').textContent = 
            `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        document.getElementById('walletBalance').textContent = 
            parseFloat(balanceInEth).toFixed(4);
        document.getElementById('networkName').textContent = 'Sepolia';
        
        document.getElementById('connectWallet').classList.add('hidden');
        document.getElementById('walletInfo').classList.remove('hidden');
        
        // Load game status
        await updateGameStatus();
        
        hideLoading();
    } catch (error) {
        console.error('Connection error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to connect wallet';
        if (error.code === 4001) {
            errorMessage = 'Wallet connection rejected. Please approve the connection request.';
        } else if (error.code === -32002) {
            errorMessage = 'Wallet connection request already pending. Please check your wallet.';
        } else if (error.message) {
            errorMessage = `Failed to connect: ${error.message}`;
        } else if (error.error && error.error.message) {
            errorMessage = `Failed to connect: ${error.error.message}`;
        }
        
        alert(errorMessage);
        hideLoading();
    }
}

// Initialize FHEVM with Relayer SDK
async function initializeFHEVM() {
    try {
        // Step 1: Initialize the SDK (loads WASM)
        await initSDK();
        
        // Step 2: Create instance with Sepolia config
        const ethereum = getEthereumProvider();
        if (!ethereum) {
            throw new Error('Ethereum provider not available');
        }
        
        const config = {
            ...SepoliaConfig,
            network: ethereum,
            contractAddress: CONTRACT_ADDRESS,
            publicKey: undefined // Will be fetched automatically
        };
        
        fhevmInstance = await createInstance(config);
        
        console.log('✓ FHEVM Relayer SDK initialized successfully');
    } catch (error) {
        console.error('FHEVM initialization error:', error);
        throw error;
    }
}

// Handle Account Changes
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected
        location.reload();
    } else if (accounts[0] !== userAddress) {
        // User switched accounts
        location.reload();
    }
}

// Select Bitcoin
function selectBitcoin(card, section) {
    const choice = parseInt(card.dataset.choice);
    const sectionId = section === 'start' ? 'startGameSection' : 'revealSection';
    
    // Remove previous selection
    document.querySelectorAll(`#${sectionId} .bitcoin-card`).forEach(c => {
        c.classList.remove('selected');
    });
    
    // Add selection
    card.classList.add('selected');
    selectedChoice = choice;
    
    // Enable button
    const buttonId = section === 'start' ? 'startGameBtn' : 'revealBtn';
    document.getElementById(buttonId).disabled = false;
}

// Start Game
async function startGame() {
    if (selectedChoice === null) {
        alert('Please select a Bitcoin first!');
        return;
    }
    
    // 防止重复点击
    if (isProcessing) {
        console.log('Game is already processing, please wait...');
        return;
    }
    
    isProcessing = true;
    
    try {
        // Check if there's already an active game
        console.log('[DEBUG] Checking if game is active...');
        showInlineLoading('startGame', '🔍 Checking game status...');
        
        const isActive = await contract.isGameActive();
        console.log('[DEBUG] Game active:', isActive);
        
        if (isActive) {
            console.log('[DEBUG] Active game detected, attempting reset...');
            showInlineLoading('startGame', '🔄 Resetting previous game...');
            
            try {
                const resetTx = await contract.resetGame();
                console.log('[DEBUG] Reset transaction submitted:', resetTx.hash);
                
                showInlineLoading('startGame', '⏳ Waiting for reset confirmation...');
                const receipt = await resetTx.wait();
                console.log('[DEBUG] Reset transaction confirmed in block:', receipt.blockNumber);
                
                // Wait a moment for state to update
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (resetError) {
                console.error('[DEBUG] Reset failed:', resetError);
                hideInlineLoading('startGame');
                throw new Error(`Failed to reset game: ${resetError.message}`);
            }
        } else {
            console.log('[DEBUG] No active game found, proceeding with new game');
        }
        
        showInlineLoading('startGame', '🔐 Encrypting data...');
        
        // Create encrypted input using Relayer SDK
        const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
        input.add8(selectedChoice);
        
        const encryptedInput = await input.encrypt();
        
        const encryptedChoice = encryptedInput.handles[0];
        const inputProof = encryptedInput.inputProof;
        
        console.log('Encrypted handle:', ethers.hexlify(encryptedChoice));
        
        // Submit transaction
        showInlineLoading('startGame', '📤 Submitting transaction...');
        
        const tx = await contract.startGame(encryptedChoice, inputProof);
        
        showInlineLoading('startGame', '⏳ Waiting for block confirmation...');
        const receipt = await tx.wait();
        
        showInlineLoading('startGame', '✅ Game started!');
        
        // Wait a moment to show success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        hideInlineLoading('startGame');
        
        // 现在开始10秒倒计时，让用户等待选择第二个比特币
        console.log('[DEBUG] Starting 10-second countdown before second choice...');
        // 只显示等待动画，不显示第二个横向循环动画
        showWaitingSection(10);
        
        // Reset selection
        selectedChoice = null;
        document.querySelectorAll('#startGameSection .bitcoin-card').forEach(c => {
            c.classList.remove('selected');
        });
        document.getElementById('startGameBtn').disabled = true;
        
        // Update game status
        await updateGameStatus();
    } catch (error) {
        console.error('Start game error:', error);
        
        // Show user-friendly error message
        if (error.message.includes('0x91c183df')) {
            alert('You already have an active game. Please click "Reset Game" first or wait for it to complete.');
        } else {
            alert(`Failed to start game: ${error.message}`);
        }
        
        hideInlineLoading('startGame');
    } finally {
        // 重置处理状态
        isProcessing = false;
    }
}

// Reveal Choice
async function revealChoice() {
    if (selectedChoice === null) {
        alert('Please select a Bitcoin first!');
        return;
    }
    
    // 防止重复点击
    if (isProcessing) {
        console.log('Game is already processing, please wait...');
        return;
    }
    
    isProcessing = true;
    
    try {
        showInlineLoading('reveal', '🔐 Encrypting second choice...');
        
        // Create encrypted input using Relayer SDK
        const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
        input.add8(selectedChoice);
        
        const encryptedInput = await input.encrypt();
        
        const encryptedChoice = encryptedInput.handles[0];
        const inputProof = encryptedInput.inputProof;
        
        // Submit transaction
        showInlineLoading('reveal', '📤 Submitting reveal transaction...');
        
        const tx = await contract.revealAndCheck(encryptedChoice, inputProof);
        
        showInlineLoading('reveal', '⏳ Waiting for block confirmation...');
        const receipt = await tx.wait();
        
        // Store the second choice for result display
        const secondChoice = selectedChoice;
        
        // Decrypt the first choice to show the result
        showInlineLoading('reveal', '🔓 Decrypting first choice...');
        
        try {
            const decryptedFirstChoice = await decryptFirstChoice();
            
            console.log('[Decrypted] First choice:', decryptedFirstChoice);
            
            showInlineLoading('reveal', '🎯 Comparing results...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Compare and show result
            const isMatch = Number(decryptedFirstChoice) === secondChoice;
            showGameResult(isMatch, Number(decryptedFirstChoice), secondChoice);
        } catch (decryptError) {
            console.error('Decryption error:', decryptError);
            hideInlineLoading('reveal');
            alert(`⚠️ Decryption failed: ${decryptError.message}`);
        }
        
        // Reset selection
        selectedChoice = null;
        document.querySelectorAll('#revealSection .bitcoin-card').forEach(c => {
            c.classList.remove('selected');
        });
        document.getElementById('revealBtn').disabled = true;
        
        // Update game status
        await updateGameStatus();
        
        hideInlineLoading('reveal');
    } catch (error) {
        console.error('Reveal error:', error);
        alert(`Failed to reveal: ${error.message}`);
        hideInlineLoading('reveal');
    } finally {
        // 重置处理状态
        isProcessing = false;
    }
}

// Reset Game
async function resetGame() {
    try {
        showLoading('Resetting game...');
        
        const tx = await contract.resetGame();
        
        showLoading('Waiting for confirmation...');
        const receipt = await tx.wait();
        
        // Update game status
        await updateGameStatus();
        
        hideLoading();
    } catch (error) {
        console.error('Reset error:', error);
        alert(`Failed to reset: ${error.message}`);
        hideLoading();
    }
}

// Decrypt First Choice using Relayer SDK
async function decryptFirstChoice() {
    try {
        // Get encrypted first choice from contract
        const encryptedFirstChoice = await contract.getEncryptedFirstChoice();
        
        console.log('[Decryption] Encrypted first choice handle:', encryptedFirstChoice);
        console.log('[解密] 加密的第一次选择句柄:', encryptedFirstChoice);
        
        // Convert BigNumber to hex string if needed
        const handleStr = typeof encryptedFirstChoice === 'bigint' || encryptedFirstChoice._isBigNumber
            ? '0x' + encryptedFirstChoice.toString(16).padStart(64, '0')
            : encryptedFirstChoice;
        
        console.log('[Decryption] Handle string:', handleStr);
        
        // Generate keypair for decryption
        const keypair = fhevmInstance.generateKeypair();
        
        // Create EIP-712 signature request (following official docs)
        const durationDays = '10'; // String format as per docs
        const startTimeStamp = Math.floor(Date.now() / 1000).toString();
        
        // CRITICAL: Convert addresses to proper checksum format to avoid "Bad address checksum" error
        const contractAddresses = [ethers.getAddress(CONTRACT_ADDRESS)];
        const checksumUserAddress = ethers.getAddress(userAddress);
        
        console.log('[Decryption] Using checksum addresses:', {
            contract: contractAddresses[0],
            user: checksumUserAddress
        });
        
        const eip712 = fhevmInstance.createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimeStamp,
            durationDays
        );
        
        console.log('[Decryption] Requesting signature...');
        const signer = await provider.getSigner();
        // Use correct EIP-712 type name from official docs
        const signature = await signer.signTypedData(
            eip712.domain,
            { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
            eip712.message
        );
        
        console.log('[Decryption] Calling userDecrypt...');
        // Use Relayer SDK's userDecrypt method (following official docs)
        const decryptedValues = await fhevmInstance.userDecrypt(
            [{ handle: handleStr, contractAddress: contractAddresses[0] }],
            keypair.privateKey,
            keypair.publicKey,
            signature.replace('0x', ''), // Remove 0x prefix as per docs
            contractAddresses,
            checksumUserAddress, // Use checksum address
            startTimeStamp,
            durationDays
        );
        
        const decryptedValue = decryptedValues[handleStr];
        console.log('[Decryption] Decrypted value:', decryptedValue);
        console.log('[解密] 解密值:', decryptedValue);
        
        return Number(decryptedValue);
    } catch (error) {
        console.error('[Decryption Error]:', error);
        console.error('[解密错误]:', error);
        throw new Error(`Failed to decrypt: ${error.message}`);
    }
}

// Show Game Result with beautiful UI
function showGameResult(isMatch, firstChoice, secondChoice) {
    const cryptoEmojis = ['₿', '₿', '₿'];
    const cryptoNames = ['Bitcoin', 'Bitcoin', 'Bitcoin'];
    const cryptoColors = ['#f7931a', '#f7931a', '#f7931a'];
    
    // Create result modal
    const resultModal = document.createElement('div');
    resultModal.className = 'result-modal';
    resultModal.innerHTML = `
        <div class="result-content">
            <div class="result-header ${isMatch ? 'match' : 'no-match'}">
                <div class="result-icon">${isMatch ? '🎉' : '😅'}</div>
                <h2>${isMatch ? 'Perfect Match!' : 'No Match'}</h2>
                <p class="result-subtitle">${isMatch ? 'Your memory is excellent! 🧠✨' : 'Better luck next time!'}</p>
            </div>
            
            <div class="result-comparison">
                <div class="choice-card first-choice">
                    <div class="choice-label">First Choice (Decrypted)</div>
                    <div class="crypto-display" style="background: ${cryptoColors[firstChoice]}">
                        <div class="crypto-icon">${cryptoEmojis[firstChoice]}</div>
                        <div class="crypto-name">${cryptoNames[firstChoice]}</div>
                    </div>
                </div>
                
                <div class="vs-divider">
                    <div class="vs-line"></div>
                    <div class="vs-text">VS</div>
                    <div class="vs-line"></div>
                </div>
                
                <div class="choice-card second-choice">
                    <div class="choice-label">Second Choice</div>
                    <div class="crypto-display" style="background: ${cryptoColors[secondChoice]}">
                        <div class="crypto-icon">${cryptoEmojis[secondChoice]}</div>
                        <div class="crypto-name">${cryptoNames[secondChoice]}</div>
                    </div>
                </div>
            </div>
            
            <div class="result-actions">
                <button class="btn btn-primary" id="continueBtn">Continue</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(resultModal);
    
    // Add event listener for continue button
    const continueBtn = resultModal.querySelector('#continueBtn');
    continueBtn.addEventListener('click', closeResultModal);
    
    // Add click outside to close
    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) {
            closeResultModal();
        }
    });
    
    // Add ESC key to close
    const handleEscKey = (e) => {
        if (e.key === 'Escape') {
            closeResultModal();
            document.removeEventListener('keydown', handleEscKey);
        }
    };
    document.addEventListener('keydown', handleEscKey);
    
    // Add animation
    setTimeout(() => {
        resultModal.classList.add('show');
    }, 100);
}

// Close result modal
function closeResultModal() {
    const modal = document.querySelector('.result-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            // Reset game state and return to main page
            updateGameStatus();
        }, 300);
    }
}

// Update Game Status
async function updateGameStatus() {
    try {
        const isActive = await contract.isGameActive();
        const hasPlayed = await contract.hasPlayed();
        const timeRemaining = await contract.getTimeRemaining();
        
        // Update status display
        document.getElementById('isActive').textContent = isActive ? '✅ Yes' : '❌ No';
        document.getElementById('hasPlayed').textContent = hasPlayed ? '✅ Yes' : '❌ No';
        document.getElementById('timeRemaining').textContent = `${timeRemaining.toString()}s`;
        
        // Show/hide sections based on game state
        if (isActive) {
            if (Number(timeRemaining) > 0) {
                // Waiting period
                showWaitingSection(Number(timeRemaining));
            } else {
                // Can reveal
                showRevealSection();
            }
        } else {
            // Can start new game
            showStartSection();
        }
        
        console.log('Game status updated:', { isActive, hasPlayed, timeRemaining: timeRemaining.toString() });
    } catch (error) {
        console.error('Failed to update game status:', error);
    }
}

// Show Start Section
function showStartSection() {
    document.getElementById('startGameSection').classList.remove('hidden');
    document.getElementById('revealSection').classList.add('hidden');
    document.getElementById('waitingSection').classList.add('hidden');
    
    // Clean up any shuffle animations
    const shuffleContainer = document.querySelector('.shuffle-container');
    if (shuffleContainer) {
        shuffleContainer.remove();
    }
    
    // Restore countdown display
    const countdownContainer = document.querySelector('.countdown-container');
    if (countdownContainer) {
        countdownContainer.style.display = 'block';
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // Reset Bitcoin wheel position
    resetBitcoinWheelPosition();
}

// Show Reveal Section
function showRevealSection() {
    document.getElementById('startGameSection').classList.add('hidden');
    document.getElementById('revealSection').classList.remove('hidden');
    document.getElementById('waitingSection').classList.add('hidden');
    
    // Clean up any shuffle animations
    const shuffleContainer = document.querySelector('.shuffle-container');
    if (shuffleContainer) {
        shuffleContainer.remove();
    }
    
    // Restore countdown display
    const countdownContainer = document.querySelector('.countdown-container');
    if (countdownContainer) {
        countdownContainer.style.display = 'block';
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Show Waiting Section with Bitcoin animation
function showWaitingSection(seconds) {
    document.getElementById('startGameSection').classList.add('hidden');
    document.getElementById('revealSection').classList.add('hidden');
    document.getElementById('waitingSection').classList.remove('hidden');
    
    // Hide countdown and show Bitcoin animation
    const countdownContainer = document.querySelector('.countdown-container');
    if (countdownContainer) {
        countdownContainer.style.display = 'none';
    }
    
    // Start Bitcoin wheel animation during encryption (只显示一次动画)
    startBitcoinEncryptionAnimation();
    
    // Auto transition after 10 seconds
    setTimeout(async () => {
        await updateGameStatus();
    }, 10000); // 10 seconds of animation
}

// Start Bitcoin encryption animation with 4 cards
function startBitcoinEncryptionAnimation() {
    const waitingSection = document.getElementById('waitingSection');
    
    // Remove any existing animation container
    const existingContainer = document.querySelector('.bitcoin-encryption-animation');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Create Bitcoin animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'bitcoin-encryption-animation';
    animationContainer.innerHTML = `
        <div class="encryption-title">🔐 Encrypting Your Choice...</div>
        <div class="bitcoin-animation-wheel">
            <div class="bitcoin-animation-track">
                <div class="bitcoin-animation-card">
                    <div class="bitcoin-icon">₿</div>
                    <div class="bitcoin-label">Bitcoin</div>
                </div>
                <div class="bitcoin-animation-card">
                    <div class="bitcoin-icon">₿</div>
                    <div class="bitcoin-label">Bitcoin</div>
                </div>
                <div class="bitcoin-animation-card">
                    <div class="bitcoin-icon">₿</div>
                    <div class="bitcoin-label">Bitcoin</div>
                </div>
                <div class="bitcoin-animation-card">
                    <div class="bitcoin-icon">₿</div>
                    <div class="bitcoin-label">Bitcoin</div>
                </div>
            </div>
        </div>
        <div class="encryption-progress">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="encryption-timer" id="encryptionTimer">10</div>
        </div>
    `;
    
    waitingSection.appendChild(animationContainer);
    
    // Start the animation
    const track = animationContainer.querySelector('.bitcoin-animation-track');
    track.style.animation = 'bitcoinEncryptionRotate 2s linear infinite';
    
    // Start countdown timer
    let timeLeft = 10;
    const timerElement = document.getElementById('encryptionTimer');
    const progressFill = animationContainer.querySelector('.progress-fill');
    
    const timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        progressFill.style.width = `${(10 - timeLeft) * 10}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Stop animation
            track.style.animation = 'none';
        }
    }, 1000);
}

// 删除第二个横向循环动画函数 - 只保留第一个动画

// Show Inline Loading for specific section
function showInlineLoading(sectionId, message) {
    const loadingElement = document.getElementById(`${sectionId}Loading`);
    if (loadingElement) {
        const textElement = loadingElement.querySelector('.inline-loading-text');
        if (textElement) {
            textElement.textContent = message;
        }
        loadingElement.classList.add('show');
    }
}

// Hide Inline Loading for specific section
function hideInlineLoading(sectionId) {
    const loadingElement = document.getElementById(`${sectionId}Loading`);
    if (loadingElement) {
        loadingElement.classList.remove('show');
    }
}

// Show Loading
function showLoading(message = 'Processing...') {
    document.getElementById('loadingText').textContent = message;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

// Hide Loading
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// 10秒倒计时动画
function startCountdownAnimation(duration = 10) {
    return new Promise((resolve) => {
        const countdownOverlay = document.getElementById('countdownOverlay');
        const countdownNumber = document.getElementById('countdownNumber');
        const countdownMessage = document.getElementById('countdownMessage');
        const countdownProgressBar = document.getElementById('countdownProgressBar');
        
                // 显示倒计时覆盖层
                countdownOverlay.classList.remove('hidden');
                
                // 更新标题为等待第二个选择
                const countdownTitle = document.querySelector('.countdown-title');
                if (countdownTitle) {
                    countdownTitle.textContent = '₿ Bitcoin Position Shuffling';
                }
                
                let timeLeft = duration;
                const messages = [
                    'First Bitcoin choice encrypted successfully!',
                    'Shuffling Bitcoin positions...',
                    'Mixing up the order for privacy...',
                    'Randomizing Bitcoin locations...',
                    'Scrambling position data...',
                    'Securing position privacy...',
                    'Almost done shuffling...',
                    'Finalizing position mix...',
                    'Ready for your second Bitcoin!',
                    'Choose your second Bitcoin now!'
                ];
        
        const updateCountdown = () => {
            countdownNumber.textContent = timeLeft;
            countdownMessage.textContent = messages[duration - timeLeft] || messages[messages.length - 1];
            
            // 更新进度条
            const progress = ((duration - timeLeft) / duration) * 100;
            countdownProgressBar.style.width = `${progress}%`;
            
            if (timeLeft <= 0) {
                // 倒计时完成
                countdownNumber.textContent = 'GO!';
                countdownMessage.textContent = 'Bitcoin positions shuffled!';
                countdownOverlay.classList.add('countdown-complete');
                
                // 1秒后隐藏倒计时
                setTimeout(() => {
                    countdownOverlay.classList.add('hidden');
                    countdownOverlay.classList.remove('countdown-complete');
                    resolve();
                }, 1000);
            } else {
                timeLeft--;
                setTimeout(updateCountdown, 1000);
            }
        };
        
        updateCountdown();
    });
}

// 显示倒计时动画
function showCountdown() {
    document.getElementById('countdownOverlay').classList.remove('hidden');
}

// 隐藏倒计时动画
function hideCountdown() {
    document.getElementById('countdownOverlay').classList.add('hidden');
}


// Bitcoin Wheel Rotation Logic
let bitcoinWheelAnimation = null;
let bitcoinWheelPosition = 0;
let bitcoinWheelSpeed = 2;
let isBitcoinWheelSpinning = false;

// Start Bitcoin Wheel Rotation
function startBitcoinWheelRotation() {
    if (isBitcoinWheelSpinning) return;
    
    isBitcoinWheelSpinning = true;
    const wheelTrack = document.getElementById('bitcoinWheelTrack');
    if (!wheelTrack) return;
    
    function animate() {
        if (!isBitcoinWheelSpinning) return;
        
        bitcoinWheelPosition += bitcoinWheelSpeed;
        
        // Reset position for infinite loop (3 cards * 200px each = 600px)
        if (bitcoinWheelPosition >= 600) {
            bitcoinWheelPosition = 0;
        }
        
        wheelTrack.style.transform = `translateX(-${bitcoinWheelPosition}px)`;
        bitcoinWheelAnimation = requestAnimationFrame(animate);
    }
    
    animate();
}

// Stop Bitcoin Wheel Rotation
function stopBitcoinWheelRotation() {
    isBitcoinWheelSpinning = false;
    if (bitcoinWheelAnimation) {
        cancelAnimationFrame(bitcoinWheelAnimation);
        bitcoinWheelAnimation = null;
    }
}

// Reset Bitcoin Wheel Position
function resetBitcoinWheelPosition() {
    stopBitcoinWheelRotation();
    bitcoinWheelPosition = 0;
    const wheelTrack = document.getElementById('bitcoinWheelTrack');
    if (wheelTrack) {
        wheelTrack.style.transform = 'translateX(0px)';
    }
}

// Auto-start Bitcoin wheel when game starts
function autoStartBitcoinWheel() {
    // Start rotation immediately
    startBitcoinWheelRotation();
    
    // Stop after 10 seconds (encryption time)
    setTimeout(() => {
        stopBitcoinWheelRotation();
    }, 10000);
}

