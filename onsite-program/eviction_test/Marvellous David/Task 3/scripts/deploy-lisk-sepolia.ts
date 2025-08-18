import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying Ludo Game contracts to Lisk Sepolia...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider!.getBalance(deployer.address)), "ETH");

  // Deploy LudoToken
  console.log("\n📦 Deploying LudoToken...");
  const LudoToken = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoToken.deploy();
  await ludoToken.waitForDeployment();
  const ludoTokenAddress = await ludoToken.getAddress();
  console.log("✅ LudoToken deployed to:", ludoTokenAddress);
  console.log("🔗 Lisk Sepolia Explorer: https://sepolia-blockscout.lisk.com/address/" + ludoTokenAddress);

  // Deploy LudoGame
  console.log("\n📦 Deploying LudoGame...");
  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(ludoTokenAddress);
  await ludoGame.waitForDeployment();
  const ludoGameAddress = await ludoGame.getAddress();
  console.log("✅ LudoGame deployed to:", ludoGameAddress);
  console.log("🔗 Lisk Sepolia Explorer: https://sepolia-blockscout.lisk.com/address/" + ludoGameAddress);

  // Verify contracts on Lisk Sepolia Blockscout
  console.log("\n📋 Deployment Summary:");
  console.log("=====================================");
  console.log("Network: Lisk Sepolia");
  console.log("LudoToken Address:", ludoTokenAddress);
  console.log("LudoGame Address:", ludoGameAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("=====================================");

  // Save deployment addresses for frontend
  const deploymentInfo = {
    network: "lisk-sepolia",
    ludoToken: ludoTokenAddress,
    ludoGame: ludoGameAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  console.log("\n💾 Saving deployment info...");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contracts (optional - requires API key)
  console.log("\n🔍 To verify contracts on Lisk Sepolia Blockscout:");
  console.log(`npx hardhat verify --network liskSepolia ${ludoTokenAddress}`);
  console.log(`npx hardhat verify --network liskSepolia ${ludoGameAddress} ${ludoTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
