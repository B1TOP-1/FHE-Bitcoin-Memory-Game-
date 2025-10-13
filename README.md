# ₿ Bitcoin Memory Game - FHE Encrypted

A fully homomorphic encrypted (FHE) Bitcoin memory game built with FHEVM and Zama's technology. Players encrypt their Bitcoin choices and reveal them after a waiting period to see if they match.

## 🎮 Game Overview

This is a decentralized application (dApp) where players:
1. **Choose a Bitcoin** (₿ Bitcoin 1, ₿ Bitcoin 2, or ₿ Bitcoin 3) and encrypt their choice
2. **Wait 10 seconds** for the reveal phase
3. **Reveal their choice** to see if it matches the first choice
4. **Play again** with a new encrypted choice

The game uses **Fully Homomorphic Encryption (FHE)** to keep player choices completely private until reveal time.

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 7.0.0
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Bitcoin Memory Game - FHE"
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Run the Hardhat vars setup
   npx hardhat vars setup
   ```

4. **Start local development**
   ```bash
   # Terminal 1: Start local blockchain
   npm run chain
   
   # Terminal 2: Deploy contracts
   npm run deploy:localhost
   
   # Terminal 3: Start frontend
   cd frontend
   npm run dev
   ```

## 🏗️ Project Structure

```
├── contracts/           # Smart contracts
│   └── AppleGame.sol   # Main game contract with FHE
├── frontend/           # React frontend application
│   ├── app.js         # Main application logic
│   ├── index.html     # HTML template
│   ├── styles.css     # Styling
│   └── package.json   # Frontend dependencies
├── scripts/           # Deployment and utility scripts
├── tasks/            # Hardhat tasks
├── deployments/       # Deployment artifacts
└── hardhat.config.ts  # Hardhat configuration
```

## 🔧 Available Scripts

### Backend (Hardhat)

```bash
# Development
npm run chain              # Start local blockchain
npm run deploy:localhost   # Deploy to localhost
npm run test              # Run tests
npm run compile           # Compile contracts
npm run lint              # Run linting

# Production
npm run deploy:sepolia     # Deploy to Sepolia testnet
npm run verify:sepolia    # Verify contracts on Etherscan
```

### Frontend

```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🌐 Networks

- **Hardhat Local**: `http://localhost:8545` (Chain ID: 31337)
- **Sepolia Testnet**: `https://sepolia.infura.io/v3/YOUR_API_KEY` (Chain ID: 11155111)

## 🔐 FHE Technology

This game leverages **Zama's FHEVM** for:
- **Private computations** on encrypted data
- **Zero-knowledge** game mechanics
- **Trustless** encrypted choices
- **Reveal-based** game mechanics

### Key Features:
- ✅ **Fully Encrypted Choices**: Player selections are encrypted using FHE
- ✅ **Time-based Reveals**: 10-second waiting period before reveal
- ✅ **Privacy Preserving**: No one can see your choice until reveal
- ✅ **Decentralized**: Runs on Ethereum with FHEVM

## 🎯 Game Mechanics

1. **Encryption Phase**: Player encrypts their Bitcoin choice (0, 1, or 2)
2. **Waiting Phase**: 10-second mandatory wait time
3. **Reveal Phase**: Player reveals their choice to check for matches
4. **Reset Phase**: Player can start a new game

## 🛠️ Development

### Smart Contract Features

- **FHE Integration**: Uses `@fhevm/solidity` for encrypted operations
- **Time-based Logic**: Enforces waiting periods between actions
- **Event Logging**: Comprehensive event system for frontend integration
- **Error Handling**: Robust error handling with custom errors
- **Bitcoin Theme**: All game elements themed around Bitcoin (₿)

### Frontend Features

- **Real FHE Encryption**: Uses `@zama-fhe/relayer-sdk` for actual FHE operations
- **Bitcoin-themed UI**: Clean, responsive interface with Bitcoin (₿) branding
- **Wallet Integration**: MetaMask and other wallet support
- **Real-time Updates**: Live game state updates
- **Countdown Animation**: Visual countdown during waiting period

## 📦 Dependencies

### Backend
- **Hardhat**: Ethereum development framework
- **FHEVM**: Fully homomorphic encryption for Ethereum
- **Ethers.js**: Ethereum library
- **TypeScript**: Type-safe development

### Frontend
- **Vite**: Fast build tool
- **Ethers.js**: Ethereum interaction
- **Zama FHE Relayer SDK**: FHE operations

## 🚀 Deployment

### Local Development
```bash
# Start local blockchain
npm run chain

# Deploy contracts
npm run deploy:localhost

# Start frontend
cd frontend && npm run dev
```

### Sepolia Testnet
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npm test

# Run coverage
npm run coverage
```

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [Quick Start](QUICKSTART.md) - Fast setup guide
- [Frontend README](frontend/README.md) - Frontend-specific documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama** for FHEVM technology
- **FHEVM** for fully homomorphic encryption on Ethereum
- **Hardhat** for the development framework
- **Ethers.js** for Ethereum interaction

## 🔗 Links

- [Zama Website](https://zama.ai/)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)

---

**Built with ❤️ using FHEVM and Zama's FHE technology for Bitcoin privacy**
