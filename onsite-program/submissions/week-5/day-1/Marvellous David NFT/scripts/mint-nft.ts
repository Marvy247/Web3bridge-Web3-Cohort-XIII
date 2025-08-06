import { ethers } from "hardhat";

async function main() {
  // The address where the DudenNFT contract was deployed
  const contractAddress = "0xF74C1Cf5B64f795822468e005DF7B79A1F662A94";
  
  // The address to mint the NFT to
  const mintToAddress = "0x1D72DB7feb21bf0A3C3D094401C7c56fA10ab013";
  
  // Get the signer (deployer account)
  const [deployer] = await ethers.getSigners();
  
  console.log("Minting NFT to:", mintToAddress);
  console.log("Using deployer account:", deployer.address);
  
  // Get the contract instance
  const DudenNFT = await ethers.getContractFactory("DudenNFT");
  const dudenNFT = DudenNFT.attach(contractAddress);
  
  // Mint the NFT
  const tx = await dudenNFT.mintNFT(mintToAddress);
  console.log("Transaction hash:", tx.hash);
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  
  // Get the token ID
  const tokenId = await dudenNFT._tokenIdCounter();
  console.log("Next token ID will be:", tokenId.toString());
  console.log("Minted NFT with token ID:", (tokenId.toNumber() - 1).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
