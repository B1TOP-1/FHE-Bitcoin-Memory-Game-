import { ethers, fhevm } from "hardhat";
import "hardhat-deploy";
import hre from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { AppleGame } from "../types";

// Helper function to get apple emoji
function getAppleEmoji(choice: number): string {
  switch (choice) {
    case 0: return "🍎 (Red Apple)";
    case 1: return "🍏 (Green Apple)";
    case 2: return "🍊 (Orange)";
    default: return "❓ (Unknown)";
  }
}

async function main() {
  console.log("🍎 Apple Game - Sepolia Test Script");
  console.log("🍎 苹果游戏 - Sepolia 测试脚本");
  console.log("=".repeat(60));

  // Initialize FHEVM CLI API (required for Sepolia)
  await fhevm.initializeCLIApi();
  console.log("✓ FHEVM CLI API initialized");

  // Get contract address from deployment
  let contractAddress: string;
  let appleGameContract: AppleGame;
  
  try {
    const AppleGameDeployment = await hre.deployments.get("AppleGame");
    contractAddress = AppleGameDeployment.address;
    console.log("✓ Contract address from deployment:", contractAddress);
    appleGameContract = (await ethers.getContractAt("AppleGame", contractAddress)) as unknown as AppleGame;
  } catch (e) {
    // Fallback to hardcoded address if no deployment found
    contractAddress = "0x3C19c7C6fdce6696D7445331B34ceFEe5C5Cdc32";
    console.log("⚠️  Using hardcoded contract address:", contractAddress);
    appleGameContract = (await ethers.getContractAt("AppleGame", contractAddress)) as unknown as AppleGame;
  }

  // Get signers
  const signers = await ethers.getSigners();
  const alice = signers[0];
  console.log("👤 Player address:", alice.address);

  // Check balance
  const balance = await ethers.provider.getBalance(alice.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

  console.log("\n" + "=".repeat(60));
  console.log("📊 Check Game Status");
  console.log("=".repeat(60));

  // Check if game is active
  const isActive = await appleGameContract.isGameActive();
  console.log("Game active:", isActive);

  const hasPlayedBefore = await appleGameContract.hasPlayed();
  console.log("Has played:", hasPlayedBefore);

  if (isActive) {
    const timeRemaining = await appleGameContract.getTimeRemaining();
    console.log("⏰ Time remaining:", timeRemaining.toString(), "seconds");

    if (Number(timeRemaining) > 0) {
      console.log("\n⚠️  Game is active but waiting time not elapsed!");
      console.log(`Please wait ${timeRemaining} seconds before revealing.`);
      console.log("Or run: npx hardhat task:reset-game --network sepolia");
      return;
    }

    // Time elapsed, can reveal
    console.log("\n✓ Wait time elapsed, can reveal now!");
    console.log("\n" + "=".repeat(60));
    console.log("🎯 Revealing Second Choice");
    console.log("=".repeat(60));

    const secondChoice = 1; // 🍏 Green Apple
    console.log("Second choice:", secondChoice, "(🍏 Green Apple)");

    // Step 1: Create encrypted input
    console.log("\n🔐 Encrypting second choice...");
    const input = fhevm.createEncryptedInput(contractAddress, alice.address);

    // Step 2: Add the value to encrypt
    input.add8(secondChoice);

    // Step 3: Perform local encryption
    const encryptedInputs = await input.encrypt();
    console.log("✓ Encryption complete");

    // Step 4: Call the Solidity function
    const externalUint8Value = encryptedInputs.handles[0];
    const inputProof = encryptedInputs.inputProof;

    console.log("\n📝 Submitting reveal transaction...");
    const tx = await appleGameContract.connect(alice).revealAndCheck(externalUint8Value, inputProof);
    console.log("Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✓ Reveal complete! Gas used:", receipt?.gasUsed.toString());
    console.log("✓ 揭晓完成！已用 Gas：", receipt?.gasUsed.toString());

    // Using Relayer SDK's userDecryptEuint to decrypt the result
    console.log("\n🔓 Decrypting result using Relayer SDK...");
    console.log("🔓 使用 Relayer SDK 解密结果...");
    
    try {
      // Get the encrypted first choice from the contract
      const encryptedFirstChoice = await appleGameContract.getEncryptedFirstChoice();
      
      // Decrypt using Relayer SDK's userDecryptEuint method
      const decryptedFirstChoice = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedFirstChoice,
        contractAddress,
        alice as any
      );
      
      console.log("\n" + "=".repeat(60));
      console.log("🎯 Game Result / 游戏结果");
      console.log("=".repeat(60));
      console.log("First choice / 第一次选择:", decryptedFirstChoice, getAppleEmoji(Number(decryptedFirstChoice)));
      console.log("Second choice / 第二次选择:", secondChoice, getAppleEmoji(secondChoice));
      
      if (Number(decryptedFirstChoice) === secondChoice) {
        console.log("\n🎉 YOU WIN! Both choices match!");
        console.log("🎉 你赢了！两次选择匹配！");
      } else {
        console.log("\n😢 No match. Choices are different.");
        console.log("😢 不匹配。两次选择不同。");
      }
    } catch (error: any) {
      console.log("\n⚠️  Decryption failed:", error.message);
      console.log("⚠️  解密失败：", error.message);
      console.log("\n💡 This may be due to network issues or permission settings.");
      console.log("💡 这可能是由于网络问题或权限设置。");
    }

    return;
  }

  // No active game, start new one
  console.log("\n" + "=".repeat(60));
  console.log("🎮 Starting New Game");
  console.log("=".repeat(60));
  console.log("Apple choices:");
  console.log("  0 = 🍎 (Red Apple)");
  console.log("  1 = 🍏 (Green Apple)");
  console.log("  2 = 🍊 (Orange)");

  const firstChoice = 1; // 🍏 Green Apple
  console.log("\nFirst choice:", firstChoice, "(🍏 Green Apple)");

  // Step 1: Create encrypted input
  console.log("\n🔐 Encrypting first choice...");
  const input = fhevm.createEncryptedInput(contractAddress, alice.address);

  // Step 2: Add the value to encrypt
  input.add8(firstChoice);

  // Step 3: Perform local encryption
  const encryptedInputs = await input.encrypt();
  console.log("✓ Encryption complete");
  console.log("  Handle:", ethers.hexlify(encryptedInputs.handles[0]));

  // Step 4: Call the Solidity function
  const externalUint8Value = encryptedInputs.handles[0];
  const inputProof = encryptedInputs.inputProof;

  console.log("\n📝 Submitting start game transaction...");
  const tx = await appleGameContract.connect(alice).startGame(externalUint8Value, inputProof);
  console.log("Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✓ Game started! Gas used:", receipt?.gasUsed.toString());

  console.log("\n" + "=".repeat(60));
  console.log("⏰ Game Rules");
  console.log("=".repeat(60));
  console.log("1. First choice made (encrypted)");
  console.log("2. Wait 10 seconds");
  console.log("3. Make second choice to reveal");
  console.log("4. System compares both choices");

  const timeRemaining = await appleGameContract.getTimeRemaining();
  console.log("\n⏳ Time remaining:", timeRemaining.toString(), "seconds");

  console.log("\n💡 Next steps:");
  console.log("   Wait 10 seconds, then run this script again");
  console.log("   Or use: npx hardhat task:reveal --choice 1 --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
