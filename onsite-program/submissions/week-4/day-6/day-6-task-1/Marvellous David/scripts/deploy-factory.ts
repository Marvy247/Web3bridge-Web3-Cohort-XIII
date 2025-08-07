import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Web3BridgeFactory...");

  const Web3BridgeFactory = await ethers.getContractFactory("Web3BridgeFactory");
  const factory = await Web3BridgeFactory.deploy();

  await factory.waitForDeployment();

  console.log("Web3BridgeFactory deployed to:", await factory.getAddress());
  console.log("Factory deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
