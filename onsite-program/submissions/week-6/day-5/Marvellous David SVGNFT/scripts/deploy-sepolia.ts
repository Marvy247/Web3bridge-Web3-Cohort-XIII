import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const targetAddress = "0x1D72DB7feb21bf0A3C3D094401C7c56fA10ab013";

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
  const dynamicTimeNFT = await DynamicTimeNFT.deploy();

  await dynamicTimeNFT.waitForDeployment();
  const contractAddress = await dynamicTimeNFT.getAddress();

  console.log("DynamicTimeNFT deployed to:", contractAddress);

  // Mint NFT to target address
  console.log("Minting NFT to:", targetAddress);
  const mintTx = await dynamicTimeNFT.mintNFT(
    "Dude Time NFT",
    "A dynamic NFT that evolves with time",
    "00FF00"
  );
  
  await mintTx.wait();
  console.log("NFT minted successfully!");
  console.log("Transaction hash:", mintTx.hash);

  // Transfer the NFT to the target address
  const tokenId = 0; // First minted token
  console.log("Transferring NFT to target address...");
  const transferTx = await dynamicTimeNFT.transferFrom(deployer.address, targetAddress, tokenId);
  await transferTx.wait();
  
  console.log(`NFT ${tokenId} transferred to ${targetAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
