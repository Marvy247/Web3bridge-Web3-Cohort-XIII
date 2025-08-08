import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Creating a new multisig wallet using the factory...");
  
  // Get the factory contract
  const factoryAddress = "0xF74C1Cf5B64f795822468e005DF7B79A1F662A94";
  const factory = await ethers.getContractAt("MultiSigWalletFactory", factoryAddress);
  
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Creating wallet with account:", deployer.address);
  
  // Define wallet parameters with proper checksum addresses
  const owners = [
    deployer.address,
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Example owner 2
    "0x3C44CdDdB6a900fa2b585dd299a03c8f4294CE2B"  // Example owner 3
  ];
  const requiredConfirmations = 2; // 2 out of 3 owners needed
  
  console.log("👥 Wallet owners:", owners);
  console.log("🔐 Required confirmations:", requiredConfirmations);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Create the wallet
  console.log("\n📦 Creating new multisig wallet...");
  const tx = await factory.createWallet(owners, requiredConfirmations);
  
  console.log("⏳ Transaction hash:", tx.hash);
  console.log("🔗 View on explorer: https://sepolia-blockscout.lisk.com/tx/" + tx.hash);
  
  // Wait for confirmation
  const receipt = await tx.wait();
  
  // Find the WalletCreated event
  const events = receipt?.logs?.filter((log: any) => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === "WalletCreated";
    } catch {
      return false;
    }
  });
  
  let walletAddress: string;
  if (events && events.length > 0) {
    const event = factory.interface.parseLog(events[0]);
    walletAddress = event?.args?.wallet;
    console.log("\n✅ Wallet created successfully!");
    console.log("📋 New wallet address:", walletAddress);
    console.log("🔗 View wallet on explorer: https://sepolia-blockscout.lisk.com/address/" + walletAddress);
  } else {
    console.log("\n⚠️ Wallet created but couldn't extract address from events");
    // Get the last wallet from the factory
    const count = await factory.getWalletsCount();
    const wallets = await factory.getWallets();
    walletAddress = wallets[wallets.length - 1];
    console.log("📋 New wallet address:", walletAddress);
  }
  
  // Get wallet count
  const walletCount = await factory.getWalletsCount();
  console.log("\n📊 Total wallets created by factory:", walletCount.toString());
  
  console.log("\n📝 Summary:");
  console.log("============");
  console.log("Factory Address:", factoryAddress);
  console.log("New Wallet Address:", walletAddress);
  console.log("Owners:", owners.length);
  console.log("Required Confirmations:", requiredConfirmations);
  
  return walletAddress;
}

main()
  .then((walletAddress) => {
    console.log("\n🎉 Process completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error creating wallet:", error);
    process.exit(1);
  });
