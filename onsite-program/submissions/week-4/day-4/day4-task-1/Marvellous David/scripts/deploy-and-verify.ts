import { ethers, run } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("Deploying Web3BridgeGarage contract to Lisk Sepolia...");
  
  const Web3BridgeGarage = await ethers.getContractFactory("Web3BridgeGarage");
  const web3BridgeGarage = await Web3BridgeGarage.deploy();
  
  await web3BridgeGarage.waitForDeployment();
  
  const contractAddress = await web3BridgeGarage.getAddress();
  console.log("Web3BridgeGarage contract deployed to:", contractAddress);
  
  console.log("\nWaiting for block confirmations...");
  await web3BridgeGarage.deploymentTransaction()?.wait(5);
  
  console.log("\nVerifying contract on Lisk Sepolia block explorer...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
