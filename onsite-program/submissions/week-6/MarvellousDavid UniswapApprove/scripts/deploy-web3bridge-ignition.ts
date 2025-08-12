import { ignition } from "hardhat";
import Web3BridgeGarageModule from "../ignition/modules/Web3BridgeGarageModule";

async function main() {
  console.log("Deploying Web3BridgeGarage contract to Lisk Sepolia...");

  // Deploy the contract using Ignition
  const { web3BridgeGarage } = await ignition.deploy(Web3BridgeGarageModule);

  const contractAddress = await web3BridgeGarage.getAddress();
  console.log("Web3BridgeGarage contract deployed to:", contractAddress);

  console.log("\nWaiting for block confirmations...");
  // @ts-ignore
  await web3BridgeGarage.deploymentTransaction()?.wait(5);

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
