import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the AppleGame contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the AppleGame contract
 *
 *   npx hardhat --network localhost task:start-game --apple 1
 *   npx hardhat --network localhost task:time-remaining
 *   (wait 10 seconds)
 *   npx hardhat --network localhost task:reveal --apple 1
 *   npx hardhat --network localhost task:reset-game
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the AppleGame contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the AppleGame contract
 *
 *   npx hardhat --network sepolia task:start-game --apple 1
 *   npx hardhat --network sepolia task:time-remaining
 *   (wait 10 seconds)
 *   npx hardhat --network sepolia task:reveal --apple 1
 *   npx hardhat --network sepolia task:reset-game
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:address", "Prints the AppleGame contract address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;

    const appleGame = await deployments.get("AppleGame");

    console.log("AppleGame address is " + appleGame.address);
  },
);

/**
 * Example:
 *   - npx hardhat --network localhost task:game-status
 *   - npx hardhat --network sepolia task:game-status
 */
task("task:game-status", "Check the current game status")
  .addOptionalParam("address", "Optionally specify the AppleGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const AppleGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("AppleGame");

    console.log(`AppleGame: ${AppleGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const appleGameContract = await ethers.getContractAt("AppleGame", AppleGameDeployment.address);

    const isActive = await appleGameContract.connect(signers[0]).isGameActive();
    const hasPlayed = await appleGameContract.connect(signers[0]).hasPlayed();

    console.log(`\n📊 Game Status:`);
    console.log(`  Player: ${signers[0].address}`);
    console.log(`  Game Active: ${isActive}`);
    console.log(`  Has Played: ${hasPlayed}`);

    if (isActive) {
      const timeRemaining = await appleGameContract.connect(signers[0]).getTimeRemaining();
      const startTime = await appleGameContract.connect(signers[0]).getGameStartTime();

      console.log(`  Start Time: ${startTime}`);
      console.log(`  Time Remaining: ${timeRemaining} seconds`);

      if (timeRemaining === 0n) {
        console.log(`  ✅ Ready to reveal!`);
      } else {
        console.log(`  ⏳ Please wait ${timeRemaining} seconds before revealing...`);
      }
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:start-game --apple 0
 *   - npx hardhat --network sepolia task:start-game --apple 1
 */
task("task:start-game", "Start a new game by choosing an apple (0=🍎, 1=🍏, 2=🍊)")
  .addOptionalParam("address", "Optionally specify the AppleGame contract address")
  .addParam("apple", "The apple choice (0, 1, or 2)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const appleChoice = parseInt(taskArguments.apple);
    if (!Number.isInteger(appleChoice) || appleChoice < 0 || appleChoice > 2) {
      throw new Error(`Argument --apple must be 0, 1, or 2`);
    }

    await fhevm.initializeCLIApi();

    const AppleGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("AppleGame");

    console.log(`AppleGame: ${AppleGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const appleGameContract = await ethers.getContractAt("AppleGame", AppleGameDeployment.address);

    const appleEmojis = ["🍎", "🍏", "🍊"];
    console.log(`\n🎮 Starting game with apple ${appleChoice} ${appleEmojis[appleChoice]}`);

    // Encrypt the apple choice
    const encryptedChoice = await fhevm
      .createEncryptedInput(AppleGameDeployment.address, signers[0].address)
      .add8(appleChoice)
      .encrypt();

    const tx = await appleGameContract
      .connect(signers[0])
      .startGame(encryptedChoice.handles[0], encryptedChoice.inputProof);

    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`\n✅ Game started! Your choice is encrypted on-chain.`);
    console.log(`⏳ Wait 10 seconds before revealing...`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:time-remaining
 *   - npx hardhat --network sepolia task:time-remaining
 */
task("task:time-remaining", "Check time remaining before reveal is allowed")
  .addOptionalParam("address", "Optionally specify the AppleGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const AppleGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("AppleGame");

    console.log(`AppleGame: ${AppleGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const appleGameContract = await ethers.getContractAt("AppleGame", AppleGameDeployment.address);

    const timeRemaining = await appleGameContract.connect(signers[0]).getTimeRemaining();

    if (timeRemaining === 0n) {
      console.log(`✅ Ready to reveal! Time's up!`);
    } else {
      console.log(`⏳ Time remaining: ${timeRemaining} seconds`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:reveal --apple 1
 *   - npx hardhat --network sepolia task:reveal --apple 1
 */
task("task:reveal", "Reveal by choosing a second apple and check if it matches")
  .addOptionalParam("address", "Optionally specify the AppleGame contract address")
  .addParam("apple", "The second apple choice (0, 1, or 2)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const appleChoice = parseInt(taskArguments.apple);
    if (!Number.isInteger(appleChoice) || appleChoice < 0 || appleChoice > 2) {
      throw new Error(`Argument --apple must be 0, 1, or 2`);
    }

    await fhevm.initializeCLIApi();

    const AppleGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("AppleGame");

    console.log(`AppleGame: ${AppleGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const appleGameContract = await ethers.getContractAt("AppleGame", AppleGameDeployment.address);

    const appleEmojis = ["🍎", "🍏", "🍊"];
    console.log(`\n🔍 Revealing with second choice: ${appleChoice} ${appleEmojis[appleChoice]}`);

    // Encrypt the second choice
    const encryptedSecondChoice = await fhevm
      .createEncryptedInput(AppleGameDeployment.address, signers[0].address)
      .add8(appleChoice)
      .encrypt();

    const tx = await appleGameContract
      .connect(signers[0])
      .revealAndCheck(encryptedSecondChoice.handles[0], encryptedSecondChoice.inputProof);

    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`\n✅ Game completed!`);
    console.log(`📊 The result is encrypted. Use the frontend to decrypt and see if you matched!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:reset-game
 *   - npx hardhat --network sepolia task:reset-game
 */
task("task:reset-game", "Reset the current game")
  .addOptionalParam("address", "Optionally specify the AppleGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const AppleGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("AppleGame");

    console.log(`AppleGame: ${AppleGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const appleGameContract = await ethers.getContractAt("AppleGame", AppleGameDeployment.address);

    const tx = await appleGameContract.connect(signers[0]).resetGame();

    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`\n🔄 Game reset! You can start a new game now.`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:accounts
 *   - npx hardhat --network sepolia task:accounts
 */
task("task:accounts", "Prints the list of accounts").setAction(async function (_taskArguments, hre) {
  const { ethers } = hre;
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

