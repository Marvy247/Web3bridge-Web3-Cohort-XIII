import { ethers } from "hardhat";

async function main() {
  const Web3BridgeGarage = await ethers.getContractFactory("Web3BridgeGarage");
  const web3BridgeGarage = await Web3BridgeGarage.deploy();
  
  await web3BridgeGarage.waitForDeployment();
  
  console.log("Web3BridgeGarage contract deployed to:", await web3BridgeGarage.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
