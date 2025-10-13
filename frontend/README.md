# 🍎 Apple Guessing Game - Frontend

A decentralized guessing game powered by **Zama FHEVM** with **real Fully Homomorphic Encryption (FHE)**.

## 🔐 Features

- **Real FHE Encryption**: Uses `fhevmjs` for client-side encryption
- **Privacy-Preserving**: Your choices are encrypted end-to-end
- **MetaMask Integration**: Connect with your Ethereum wallet
- **Sepolia Testnet**: Deployed on Ethereum Sepolia
- **Beautiful UI**: Modern, responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MetaMask browser extension
- Sepolia ETH (get from faucet)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 🎮 How to Use

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask
2. **Switch to Sepolia**: Make sure you're on Sepolia Testnet
3. **Start Game**: 
   - Select your first apple (🍎/🍏/🍊)
   - Click "Start Game"
   - Your choice is encrypted with FHE
4. **Wait 10 Seconds**: Countdown timer will show
5. **Reveal**: 
   - Select your second apple
   - Click "Reveal"
   - Contract compares encrypted choices
6. **Result**: Check transaction log for outcome

## 🔧 Configuration

Edit `app.js` to change:

```javascript
const CONTRACT_ADDRESS = '0x3C19c7C6fdce6696D7445331B34ceFEe5C5Cdc32';
const SEPOLIA_CHAIN_ID = 11155111;
```

## 📚 Technology Stack

- **fhevmjs**: Zama's FHE encryption library for browsers
- **ethers.js**: Ethereum interaction
- **Vite**: Fast build tool
- **Vanilla JS**: No framework overhead

## 🔒 Security

- All choices are encrypted client-side using Zama's TFHE
- Private keys never leave your browser
- Contract cannot see your choices in plaintext
- Results are encrypted on-chain

## 📖 Documentation

- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [fhevmjs Documentation](https://docs.zama.ai/fhevm/getting_started/frontend)
- [Contract Source](../contracts/AppleGame.sol)

## 🆘 Troubleshooting

### "Please install MetaMask"
- Install MetaMask browser extension

### "Please switch to Sepolia Testnet"
- In MetaMask, switch network to Sepolia
- Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

### "FHEVM initialization failed"
- Check internet connection
- Verify contract address is correct
- Make sure you're on Sepolia network

### Transaction Failed
- Ensure you have enough Sepolia ETH
- Check if game is in correct state
- Try resetting the game

## 📄 License

MIT License - see LICENSE file

## 🙏 Credits

Built with ❤️ using [Zama FHEVM](https://www.zama.ai/)

