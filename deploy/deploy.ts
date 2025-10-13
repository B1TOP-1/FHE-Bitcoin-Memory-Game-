import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`\n🍎 Deploying AppleGame contract...`);
  console.log(`Deployer: ${deployer}`);

  const deployedAppleGame = await deploy("AppleGame", {
    from: deployer,
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 3 : 1,
  });

  console.log(`\n✅ AppleGame contract deployed at: ${deployedAppleGame.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Transaction hash: ${deployedAppleGame.transactionHash}`);

  if (hre.network.name === "sepolia") {
    console.log(`\n📝 To verify the contract on Etherscan, run:`);
    console.log(`npx hardhat verify --network sepolia ${deployedAppleGame.address}`);
  }
};

export default func;
func.id = "deploy_appleGame";
func.tags = ["AppleGame"];

