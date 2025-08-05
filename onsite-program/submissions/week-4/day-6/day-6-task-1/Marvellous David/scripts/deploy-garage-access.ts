import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Web3BridgeGarageAccess = await ethers.getContractFactory("Web3BridgeGarageAccess");
  const contract = await Web3BridgeGarageAccess.deploy();
  await contract.waitForDeployment();

  console.log("Web3BridgeGarageAccess deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
