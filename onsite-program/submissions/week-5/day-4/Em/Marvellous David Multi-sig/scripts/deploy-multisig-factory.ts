import { ethers } from "hardhat";
import { MultiSigWalletFactory__factory } from "../typechain-types";

async function main() {
  console.log("🚀 Starting MultiSigWalletFactory deployment to Lisk Sepolia...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy MultiSigWalletFactory
  console.log("📦 Deploying MultiSigWalletFactory...");
  const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWalletFactory");
  const factory = await MultiSigWalletFactory.deploy();
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("✅ MultiSigWalletFactory deployed successfully!");
  console.log("📋 Contract Address:", factoryAddress);
  console.log("🔗 Lisk Sepolia Explorer: https://sepolia-blockscout.lisk.com/address/" + factoryAddress);
  
  // Verify contract on Lisk Sepolia (if etherscan API key is available)
  console.log("\n🔍 Waiting for block confirmations...");
  await factory.deploymentTransaction()?.wait(5);
  
  console.log("\n📝 Deployment Summary:");
  console.log("======================");
  console.log("Network: Lisk Sepolia");
  console.log("Chain ID: 4202");
  console.log("Contract: MultiSigWalletFactory");
  console.log("Address:", factoryAddress);
  console.log("Deployer:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
