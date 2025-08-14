import { ethers } from "hardhat";
import { LootBox } from "../typechain-types";

async function main() {
  console.log("Starting LootBox deployment to Sepolia...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy the LootBox contract
  const VRF_WRAPPER_ADDRESS = "0x195f15F2d49d693cEDc1F7c2d64f41c99E814831";
  console.log("Using VRF Wrapper:", VRF_WRAPPER_ADDRESS);
  
  const LootBoxFactory = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBoxFactory.deploy(VRF_WRAPPER_ADDRESS);
  
  await lootBox.waitForDeployment();
  
  const lootBoxAddress = await lootBox.getAddress();
  console.log("LootBox deployed to:", lootBoxAddress);
  console.log("Transaction hash:", lootBox.deploymentTransaction()?.hash);
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  const contract = lootBox as LootBox;
  const owner = await contract.owner();
  console.log("Contract owner:", owner);
  
  console.log("\nDeployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Fund the contract with LINK tokens for VRF");
  console.log("2. Create loot boxes using createLootBox()");
  console.log("3. Add rewards using addReward()");
  console.log("4. Test opening loot boxes");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
