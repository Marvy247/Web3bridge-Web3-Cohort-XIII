import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Ludo Game contracts...");

  // Deploy LudoToken
  const LudoToken = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoToken.deploy();
  await ludoToken.waitForDeployment();
  console.log("LudoToken deployed to:", await ludoToken.getAddress());

  // Deploy LudoGame
  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(await ludoToken.getAddress());
  await ludoGame.waitForDeployment();
  console.log("LudoGame deployed to:", await ludoGame.getAddress());

  // Verify contracts on Etherscan (if on testnet/mainnet)
  console.log("\nDeployment Summary:");
  console.log("LudoToken:", await ludoToken.getAddress());
  console.log("LudoGame:", await ludoGame.getAddress());
  console.log("Token used in LudoGame:", await ludoToken.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
