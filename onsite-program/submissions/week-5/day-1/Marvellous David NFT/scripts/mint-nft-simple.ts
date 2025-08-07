import { ethers } from "ethers";

async function main() {
  const PRIVATE_KEY = "dc28a227753f7cb3c5955d363350c6d7b2050cdc79828dba983925a6b456cb05";
  const CONTRACT_ADDRESS = "0xF74C1Cf5B64f795822468e005DF7B79A1F662A94";
  const MINT_TO_ADDRESS = "0x1D72DB7feb21bf0A3C3D094401C7c56fA10ab013";

  // Create wallet from private key
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  
  // Connect to Sepolia network
  const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/public");
  const signer = wallet.connect(provider);
  
  console.log("Minting NFT to:", MINT_TO_ADDRESS);
  console.log("Using account:", signer.address);

  // Contract ABI for mintNFT function
  const contractABI = [
    "function mintNFT(address to) public returns (uint256)"
  ];

  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

  // Mint the NFT
  const tx = await contract.mintNFT(MINT_TO_ADDRESS);
  console.log("Transaction sent:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  
  // The mintNFT function returns the token ID
  const logs = receipt.logs;
  console.log("NFT successfully minted!");
  console.log("Transaction receipt:", receipt);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
