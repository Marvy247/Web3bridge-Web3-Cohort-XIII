import { ethers } from "hardhat";
import { Web3BridgeFactory } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const FACTORY_ADDRESS = "0xa119EC566d257a8f7772E5259B3ef5BC8f146A61";
  
  console.log("Interacting with Web3BridgeFactory...");
  console.log("Deployer address:", deployer.address);

  const factory = await ethers.getContractAt("Web3BridgeFactory", FACTORY_ADDRESS) as Web3BridgeFactory;

  // Deploy a new token
  console.log("\n1. Deploying new token...");
  const tokenTx = await factory.deployToken(
    1000000, // 1 million tokens
    "Web3Bridge Token",
    "W3B"
  );
  const tokenReceipt = await tokenTx.wait();
  console.log("Token deployed successfully!");

  // Deploy a new garage access contract
  console.log("\n2. Deploying new garage access contract...");
  const garageTx = await factory.deployGarageAccess();
  const garageReceipt = await garageTx.wait();
  console.log("Garage access contract deployed successfully!");

  // Deploy both in batch
  console.log("\n3. Deploying both token and garage in batch...");
  const batchTx = await factory.deployBatch(
    500000, // 500k tokens
    "Batch Token",
    "BATCH"
  );
  const batchReceipt = await batchTx.wait();
  console.log("Batch deployment completed!");

  // Query deployed contracts
  console.log("\n4. Querying deployed contracts...");
  
  const userTokens = await factory.getUserTokens(deployer.address);
  const userGarages = await factory.getUserGarages(deployer.address);
  const allTokens = await factory.getAllTokens();
  const allGarages = await factory.getAllGarages();

  console.log(`User deployed tokens: ${userTokens.length}`);
  console.log(`User deployed garages: ${userGarages.length}`);
  console.log(`Total tokens deployed: ${allTokens.length}`);
  console.log(`Total garages deployed: ${allGarages.length}`);

  // Display token details
  console.log("\n5. Token details:");
  for (let i = 0; i < userTokens.length; i++) {
    const tokenAddress = userTokens[i];
    const details = await factory.getTokenDetails(tokenAddress);
    console.log(`Token ${i + 1}: ${tokenAddress}`);
    console.log(`  Name: ${details.name}`);
    console.log(`  Symbol: ${details.symbol}`);
    console.log(`  Decimals: ${details.decimals}`);
    console.log(`  Total Supply: ${details.totalSupply.toString()}`);
  }

  // Verify factory contracts
  console.log("\n6. Verifying factory contracts...");
  for (const token of userTokens) {
    const isFactory = await factory.isFactoryToken(token);
    console.log(`Token ${token} is factory deployed: ${isFactory}`);
  }
  for (const garage of userGarages) {
    const isFactory = await factory.isFactoryGarage(garage);
    console.log(`Garage ${garage} is factory deployed: ${isFactory}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
