import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying UniswapPermitSwapper to Lisk Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with the account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider?.getBalance(deployer.address)).toString());

  const UniswapPermitSwapper = await ethers.getContractFactory("UniswapPermitSwapper");
  const swapper = await UniswapPermitSwapper.deploy();

  await swapper.waitForDeployment();
  
  const contractAddress = await swapper.getAddress();
  console.log("✅ UniswapPermitSwapper deployed to:", contractAddress);
  console.log("🔗 View on Lisk Sepolia Explorer: https://sepolia-blockscout.lisk.com/address/", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
