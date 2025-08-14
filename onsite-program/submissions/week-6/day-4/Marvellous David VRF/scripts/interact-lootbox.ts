import { ethers } from "hardhat";
import { LootBox, MockERC20, MockERC721, MockERC1155 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// Helper function to format token amounts
const formatToken = (amount: bigint, decimals: number = 18) => {
  return ethers.formatUnits(amount, decimals);
};

// Helper function to parse token amounts
const parseToken = (amount: string, decimals: number = 18) => {
  return ethers.parseUnits(amount, decimals);
};

async function main() {
  console.log("🎮 Starting LootBox Interaction Script...\n");
  
  // Get accounts
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("📋 Accounts:");
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  
  // Contract addresses - Update these with your deployed addresses
  const lootBoxAddress = "YOUR_LOOTBOX_ADDRESS_HERE";
  const mockERC20Address = "YOUR_MOCK_ERC20_ADDRESS_HERE";
  const mockERC721Address = "YOUR_MOCK_ERC721_ADDRESS_HERE";
  const mockERC1155Address = "YOUR_MOCK_ERC1155_ADDRESS_HERE";
  
  // Get contract instances
  const lootBox: LootBox = await ethers.getContractAt("LootBox", lootBoxAddress);
  const mockERC20: MockERC20 = await ethers.getContractAt("MockERC20", mockERC20Address);
  const mockERC721: MockERC721 = await ethers.getContractAt("MockERC721", mockERC721Address);
  const mockERC1155: MockERC1155 = await ethers.getContractAt("MockERC1155", mockERC1155Address);
  
  console.log("\n📦 Contract Addresses:");
  console.log("LootBox:", await lootBox.getAddress());
  console.log("MockERC20:", await mockERC20.getAddress());
  console.log("MockERC721:", await mockERC721.getAddress());
  console.log("MockERC1155:", await mockERC1155.getAddress());
  
  // 1. Check initial state
  console.log("\n📊 Initial State Check:");
  const totalSupply = await lootBox.totalSupply();
  console.log("Total NFTs minted:", totalSupply.toString());
  
  const maxSupply = await lootBox.maxSupply();
  console.log("Max supply:", maxSupply.toString());
  
  const owner = await lootBox.owner();
  console.log("Contract owner:", owner);
  
  // 2. Create a new loot box
  console.log("\n🎁 Creating new loot box...");
  const lootBoxName = "Epic Treasure Chest";
  const lootBoxDescription = "Contains epic rewards from the blockchain realm!";
  const lootBoxPrice = ethers.parseEther("0.01"); // 0.01 ETH
  const lootBoxMaxSupply = 100;
  
  const createTx = await lootBox.createLootBox(
    lootBoxName,
    lootBoxDescription,
    lootBoxPrice,
    lootBoxMaxSupply
  );
  await createTx.wait();
  
  const lootBoxId = 0; // First loot box created
  console.log("✅ Loot box created with ID:", lootBoxId);
  
  // 3. Get loot box details
  console.log("\n📋 Loot Box Details:");
  const config = await lootBox.getLootBoxConfig(lootBoxId);
  console.log("Name:", config.name);
  console.log("Description:", config.description);
  console.log("Price:", formatToken(config.price), "ETH");
  console.log("Max Supply:", config.maxSupply.toString());
  console.log("Total Opened:", config.totalOpened.toString());
  console.log("Is Active:", config.isActive);
  
  // 4. Add rewards to the loot box
  console.log("\n💎 Adding rewards to loot box...");
  
  // Add ERC20 reward
  const erc20RewardTx = await lootBox.addReward(
    lootBoxId,
    0, // TokenType.ERC20
    mockERC20Address,
    0, // tokenId (not used for ERC20)
    parseToken("100"), // 100 tokens
    50 // weight (50% chance)
  );
  await erc20RewardTx.wait();
  console.log("✅ Added ERC20 reward: 100 tokens");
  
  // Add ERC721 reward
  const erc721RewardTx = await lootBox.addReward(
    lootBoxId,
    1, // TokenType.ERC721
    mockERC721Address,
    1, // tokenId
    1, // amount
    30 // weight (30% chance)
  );
  await erc721RewardTx.wait();
  console.log("✅ Added ERC721 reward: NFT #1");
  
  // Add ERC1155 reward
  const erc1155RewardTx = await lootBox.addReward(
    lootBoxId,
    2, // TokenType.ERC1155
    mockERC1155Address,
    1, // tokenId
    5, // amount
    20 // weight (20% chance)
  );
  await erc1155RewardTx.wait();
  console.log("✅ Added ERC1155 reward: 5 tokens");
  
  // 5. Check rewards
  console.log("\n🎯 Available Rewards:");
  const rewards = await lootBox.getRewards(lootBoxId);
  const totalWeight = await lootBox.getTotalWeight(lootBoxId);
  console.log("Total rewards:", rewards.length);
  console.log("Total weight:", totalWeight.toString());
  
  for (let i = 0; i < rewards.length; i++) {
    const reward = rewards[i];
    console.log(`\nReward ${i + 1}:`);
    console.log("  Type:", reward.tokenType === 0 ? "ERC20" : reward.tokenType === 1 ? "ERC721" : "ERC1155");
    console.log("  Address:", reward.tokenAddress);
    console.log("  Token ID:", reward.tokenId.toString());
    console.log("  Amount:", reward.amount.toString());
    console.log("  Weight:", reward.weight.toString());
    console.log("  Probability:", (Number(reward.weight) / Number(totalWeight) * 100).toFixed(2) + "%");
  }
  
  // 6. Fund the loot box with tokens
  console.log("\n💰 Funding loot box with tokens...");
  
  // Mint some tokens to the loot box contract
  const mintERC20Tx = await mockERC20.mint(await lootBox.getAddress(), parseToken("10000"));
  await mintERC20Tx.wait();
  console.log("✅ Minted 10,000 ERC20 tokens to loot box");
  
  const mintERC721Tx = await mockERC721.mint(await lootBox.getAddress(), 1);
  await mintERC721Tx.wait();
  console.log("✅ Minted ERC721 NFT #1 to loot box");
  
  const mintERC1155Tx = await mockERC1155.mint(await lootBox.getAddress(), 1, 100, "0x");
  await mintERC1155Tx.wait();
  console.log("✅ Minted 100 ERC1155 tokens to loot box");
  
  // 7. Test opening loot boxes
  console.log("\n🎲 Testing loot box opening...");
  
  // Check balances before opening
  console.log("\n💼 User1 balances before opening:");
  const user1ERC20BalanceBefore = await mockERC20.balanceOf(user1.address);
  const user1ERC721BalanceBefore = await mockERC721.balanceOf(user1.address);
  const user1ERC1155BalanceBefore = await mockERC1155.balanceOf(user1.address, 1);
  
  console.log("ERC20:", formatToken(user1ERC20BalanceBefore));
  console.log("ERC721:", user1ERC721BalanceBefore.toString());
  console.log("ERC1155:", user1ERC1155BalanceBefore.toString());
  
  // Open loot box
  console.log("\n🎯 User1 opening loot box...");
  const openTx = await lootBox.connect(user1).openLootBox(lootBoxId, { value: lootBoxPrice });
  const openReceipt = await openTx.wait();
  console.log("✅ Loot box opened! Transaction hash:", openReceipt?.hash);
  
  // Check balances after opening
  console.log("\n💼 User1 balances after opening:");
  const user1ERC20BalanceAfter = await mockERC20.balanceOf(user1.address);
  const user1ERC721BalanceAfter = await mockERC721.balanceOf(user1.address);
  const user1ERC1155BalanceAfter = await mockERC1155.balanceOf(user1.address, 1);
  
  console.log("ERC20:", formatToken(user1ERC20BalanceAfter));
  console.log("ERC721:", user1ERC721BalanceAfter.toString());
  console.log("ERC1155:", user1ERC1155BalanceAfter.toString());
  
  // Calculate rewards received
  const erc20Received = user1ERC20BalanceAfter - user1ERC20BalanceBefore;
  const erc721Received = user1ERC721BalanceAfter - user1ERC721BalanceBefore;
  const erc1155Received = user1ERC1155BalanceAfter - user1ERC1155BalanceBefore;
  
  console.log("\n🎁 Rewards received:");
  console.log("ERC20 tokens:", formatToken(erc20Received));
  console.log("ERC721 NFTs:", erc721Received.toString());
  console.log("ERC1155 tokens:", erc1155Received.toString());
  
  // 8. Check updated state
  console.log("\n📊 Updated State:");
  const updatedConfig = await lootBox.getLootBoxConfig(lootBoxId);
  console.log("Total opened:", updatedConfig.totalOpened.toString());
  
  const userOpenedCount = await lootBox.userOpenedCount(lootBoxId, user1.address);
  console.log("User1 opened count:", userOpenedCount.toString());
  
  // 9. Test multiple openings
  console.log("\n🔄 Testing multiple openings...");
  for (let i = 0; i < 3; i++) {
    console.log(`\nOpening #${i + 2}...`);
    const openTx = await lootBox.connect(user2).openLootBox(lootBoxId, { value: lootBoxPrice });
    await openTx.wait();
    console.log("✅ Opened!");
  }
  
  // 10. Check final state
  console.log("\n🏁 Final State:");
  const finalConfig = await lootBox.getLootBoxConfig(lootBoxId);
  console.log("Final total opened:", finalConfig.totalOpened.toString());
  console.log("Remaining supply:", (finalConfig.maxSupply - finalConfig.totalOpened).toString());
  
  // 11. Withdraw funds (owner only)
  console.log("\n💸 Withdrawing funds...");
  const contractBalance = await ethers.provider.getBalance(await lootBox.getAddress());
  console.log("Contract ETH balance:", formatToken(contractBalance), "ETH");
  
  if (contractBalance > 0n) {
    const withdrawTx = await lootBox.connect(deployer).withdrawTokens(mockERC20Address, parseToken("1000"));
    await withdrawTx.wait();
    console.log("✅ Withdrew 1000 ERC20 tokens");
  }
  
  console.log("\n🎉 LootBox interaction script completed successfully!");
  console.log("\n📋 Summary:");
  console.log("- Created loot box:", lootBoxName);
  console.log("- Added", rewards.length, "different reward types");
  console.log("- Total opened:", finalConfig.totalOpened.toString());
  console.log("- Contract balance:", formatToken(await ethers.provider.getBalance(await lootBox.getAddress())), "ETH");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
