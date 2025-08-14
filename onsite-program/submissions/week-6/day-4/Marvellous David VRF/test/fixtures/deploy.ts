import { ethers } from "hardhat";
import { LootBox, MockERC20, MockERC721, MockERC1155 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

export async function deployLootBoxFixture() {
  const [owner, user1, user2, vrfWrapper] = await ethers.getSigners();

  // Deploy mock tokens
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20Factory.deploy("Mock Token", "MOCK", 18);

  const MockERC721Factory = await ethers.getContractFactory("MockERC721");
  const mockERC721 = await MockERC721Factory.deploy("Mock NFT", "MNFT");

  const MockERC1155Factory = await ethers.getContractFactory("MockERC1155");
  const mockERC1155 = await MockERC1155Factory.deploy("https://example.com/{id}.json");

  // Deploy LootBox contract
  const LootBoxFactory = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBoxFactory.deploy(await vrfWrapper.getAddress());

  // Mint some tokens to the contract for rewards
  await mockERC20.mint(await lootBox.getAddress(), ethers.parseEther("1000"));
  await mockERC721.mint(await lootBox.getAddress());
  await mockERC1155.mint(await lootBox.getAddress(), 1, 100, "0x");

  return {
    lootBox,
    mockERC20,
    mockERC721,
    mockERC1155,
    owner,
    user1,
    user2,
    vrfWrapper,
  };
}

export async function createLootBoxWithRewards(
  lootBox: LootBox,
  mockERC20: MockERC20,
  mockERC721: MockERC721,
  mockERC1155: MockERC1155
) {
  // Create loot box
  await lootBox.createLootBox(
    "Epic Loot Box",
    "Contains epic rewards",
    ethers.parseEther("1"),
    1000
  );

  // Add ERC20 reward
  await lootBox.addReward(
    0,
    0, // ERC20
    await mockERC20.getAddress(),
    0,
    ethers.parseEther("10"),
    100
  );

  // Add ERC721 reward
  await lootBox.addReward(
    0,
    1, // ERC721
    await mockERC721.getAddress(),
    1,
    1,
    50
  );

  // Add ERC1155 reward
  await lootBox.addReward(
    0,
    2, // ERC1155
    await mockERC1155.getAddress(),
    1,
    5,
    25
  );

  return 0; // Return loot box ID
}
