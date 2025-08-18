import { ethers } from "hardhat";

async function main() {
  console.log("Deploying aLottery contract to Lisk Sepolia...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const Lottery = await ethers.getContractFactory("aLottery");
  
  // Deploy with default constructor (no parameters)
  const lottery = await Lottery.deploy();
  
  console.log("Waiting for deployment...");
  await lottery.waitForDeployment();
  
  const contractAddress = await lottery.getAddress();
  console.log("aLottery deployed to:", contractAddress);
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  console.log("Contract address:", contractAddress);
  console.log("Explorer URL: https://sepolia-blockscout.lisk.com/address/" + contractAddress);
  
  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
