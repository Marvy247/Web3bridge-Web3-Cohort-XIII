import { ethers } from "hardhat";

async function main() {
  console.log("Deploying LootBox contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());

  const balance = await ethers.provider.getBalance(await deployer.getAddress());
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy mock tokens for testing
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20Factory.deploy("Mock Token", "MOCK", 18);
  console.log("MockERC20 deployed to:", await mockERC20.getAddress());

  const MockERC721Factory = await ethers.getContractFactory("MockERC721");
  const mockERC721 = await MockERC721Factory.deploy("Mock NFT", "MNFT");
  console.log("MockERC721 deployed to:", await mockERC721.getAddress());

  const MockERC1155Factory = await ethers.getContractFactory("MockERC1155");
  const mockERC1155 = await MockERC1155Factory.deploy("https://example.com/{id}.json");
  console.log("MockERC1155 deployed to:", await mockERC1155.getAddress());

  // Deploy LootBox contract
  const LootBoxFactory = await ethers.getContractFactory("LootBox");
  
  // Use a mock VRF wrapper address for deployment
  const vrfWrapperAddress = "0x0000000000000000000000000000000000000000";
  const lootBox = await LootBoxFactory.deploy(vrfWrapperAddress);
  
  await lootBox.waitForDeployment();
  console.log("LootBox deployed to:", await lootBox.getAddress());

  // Mint some tokens to the contract for rewards
  await mockERC20.mint(await lootBox.getAddress(), ethers.parseEther("1000"));
  await mockERC721.mint(await lootBox.getAddress());
  await mockERC1155.mint(await lootBox.getAddress(), 1, 100, "0x");

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("MockERC20:", await mockERC20.getAddress());
  console.log("MockERC721:", await mockERC721.getAddress());
  console.log("MockERC1155:", await mockERC1155.getAddress());
  console.log("LootBox:", await lootBox.getAddress());
  console.log("VRF Wrapper:", vrfWrapperAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
