# ⚡ Quick Start Guide

Get your Apple Guess Game running in 5 minutes!

## 🚀 Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up credentials (you'll be prompted to enter values)
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY

# 3. Compile contracts
npm run compile

# 4. Run tests (optional)
npm run test
```

## 🌐 Deploy to Sepolia

```bash
# Deploy the contract
npm run deploy:sepolia

# Save the contract address that appears in the output!
# Example: 0xABCD1234...
```

## 🎮 Play via Frontend

```bash
# 1. Start web server
cd frontend
python -m http.server 8000

# 2. Open browser
# Visit: http://localhost:8000

# 3. Connect wallet and enter contract address

# 4. Play the game!
```

## 🎯 Play via CLI

```bash
# Start a game (choose apple 0, 1, or 2)
npx hardhat --network sepolia task:start-game --apple 1

# Check time
npx hardhat --network sepolia task:time-remaining

# Reveal (after 10 seconds)
npx hardhat --network sepolia task:reveal --apple 1

# Play again
npx hardhat --network sepolia task:reset-game
```

## 📚 Need More Help?

See [README.md](README.md) for detailed documentation.
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step deployment.

---

**That's it! You're ready to play! 🍎🎉**

