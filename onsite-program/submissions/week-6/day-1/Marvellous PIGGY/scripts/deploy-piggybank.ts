import { ethers, run } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("🚀 Deploying PiggyBank contracts...");
  
  // Get the network
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Deploy PiggyBankFactory
  console.log("\n📦 Deploying PiggyBankFactory...");
  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const piggyBankFactory = await PiggyBankFactory.deploy();
  
  await piggyBankFactory.waitForDeployment();
  const factoryAddress = await piggyBankFactory.getAddress();
  console.log("✅ PiggyBankFactory deployed to:", factoryAddress);
  
  // Wait for confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await piggyBankFactory.deploymentTransaction()?.wait(5);
  
  // Verify contracts
  console.log("\n🔍 Verifying contracts on block explorer...");
  try {
    await run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [],
    });
    console.log("✅ PiggyBankFactory verified successfully!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
  
  // Create a test account to demonstrate functionality
  console.log("\n🏦 Creating test savings account...");
  try {
    const tx = await piggyBankFactory.createSavingsAccount();
    await tx.wait();
    console.log("✅ Test savings account created successfully!");
  } catch (error) {
    console.error("❌ Failed to create test account:", error);
  }
  
  // Summary
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log(`Network: ${network.name} (${network.chainId})`);
  console.log(`PiggyBankFactory: ${factoryAddress}`);
  console.log(`Web3BridgeGarage: 0x793310d9254D801EF86f829264F04940139e9297`);
  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
