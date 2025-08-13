import { ethers } from "hardhat";
import { DAONFT, TokenGatedDAO } from "../typechain-types";

async function main() {
  console.log("Deploying Marvellous David DAO System...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy DAONFT
  console.log("\nDeploying DAONFT...");
  const DAONFTFactory = await ethers.getContractFactory("contracts/DAONFT.sol:DAONFT");
  const daoNFT = await DAONFTFactory.deploy(
    "Marvellous David DAO",
    "MDD",
    "ipfs://QmYourBaseURI/"
  );
  await daoNFT.waitForDeployment();
  console.log("DAONFT deployed to:", await daoNFT.getAddress());

  // Deploy TokenGatedDAO
  console.log("\nDeploying TokenGatedDAO...");
  const TokenGatedDAOFactory = await ethers.getContractFactory("contracts/TokenGatedDAO.sol:TokenGatedDAO");
  const tokenGatedDAO = await TokenGatedDAOFactory.deploy(await daoNFT.getAddress());
  await tokenGatedDAO.waitForDeployment();
  console.log("TokenGatedDAO deployed to:", await tokenGatedDAO.getAddress());

  // Verify deployment
  console.log("\n=== Deployment Summary ===");
  console.log("DAONFT Address:", await daoNFT.getAddress());
  console.log("TokenGatedDAO Address:", await tokenGatedDAO.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
