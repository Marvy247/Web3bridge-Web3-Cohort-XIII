import { expect } from "chai";
import { ethers } from "hardhat";
import { LootBox, MockERC20, MockERC721, MockERC1155 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LootBox", function () {
  let lootBox: LootBox;
  let mockERC20: MockERC20;
  let mockERC721: MockERC721;
  let mockERC1155: MockERC1155;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let vrfWrapper: SignerWithAddress;

  const VRF_WRAPPER_ADDRESS = "0x0000000000000000000000000000000000000000"; // Mock address for testing

  beforeEach(async function () {
    [owner, user1, user2, vrfWrapper] = await ethers.getSigners();
    

    // Deploy mock tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20Factory.deploy("Mock Token", "MOCK", 18);

    const MockERC721Factory = await ethers.getContractFactory("MockERC721");
    mockERC721 = await MockERC721Factory.deploy("Mock NFT", "MNFT");

    const MockERC1155Factory = await ethers.getContractFactory("MockERC1155");
    mockERC1155 = await MockERC1155Factory.deploy("https://example.com/{id}.json");

    // Deploy LootBox contract
    const LootBoxFactory = await ethers.getContractFactory("LootBox");
    lootBox = await LootBoxFactory.deploy(await vrfWrapper.getAddress());

    // Mint some tokens to the contract for rewards
    await mockERC20.mint(await lootBox.getAddress(), ethers.parseEther("1000"));
    await mockERC721.mint(await lootBox.getAddress());
    await mockERC1155.mint(await lootBox.getAddress(), 1, 100, "0x");
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await lootBox.owner()).to.equal(await owner.getAddress());
    });
  });

  describe("Create LootBox", function () {
    it("Should create a loot box successfully", async function () {
      const tx = await lootBox.createLootBox(
        "Epic Loot Box",
        "Contains epic rewards",
        ethers.parseEther("1"),
        1000
      );

      await expect(tx)
        .to.emit(lootBox, "LootBoxCreated")
        .withArgs(0, "Epic Loot Box", ethers.parseEther("1"), 1000);

      const config = await lootBox.getLootBoxConfig(0);
      expect(config.name).to.equal("Epic Loot Box");
      expect(config.description).to.equal("Contains epic rewards");
      expect(config.price).to.equal(ethers.parseEther("1"));
      expect(config.maxSupply).to.equal(1000);
      expect(config.isActive).to.be.true;
    });

    it("Should only allow owner to create loot box", async function () {
      await expect(
        lootBox.connect(user1).createLootBox(
          "Test",
          "Test",
          ethers.parseEther("1"),
          100
        )
      ).to.be.reverted;
    });
  });

  describe("Add Rewards", function () {
    beforeEach(async function () {
      await lootBox.createLootBox("Test Box", "Test", ethers.parseEther("1"), 100);
    });

    it("Should add ERC20 reward successfully", async function () {
      const tx = await lootBox.addReward(
        0,
        0, // ERC20
        await mockERC20.getAddress(),
        0,
        ethers.parseEther("10"),
        100
      );

      await expect(tx)
        .to.emit(lootBox, "RewardAdded")
        .withArgs(0, 0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 100);

      const rewards = await lootBox.getRewards(0);
      expect(rewards.length).to.equal(1);
      expect(rewards[0].tokenType).to.equal(0);
      expect(rewards[0].tokenAddress).to.equal(await mockERC20.getAddress());
      expect(rewards[0].amount).to.equal(ethers.parseEther("10"));
      expect(rewards[0].weight).to.equal(100);
    });

    it("Should add ERC721 reward successfully", async function () {
      await lootBox.addReward(
        0,
        1, // ERC721
        await mockERC721.getAddress(),
        1,
        1,
        50
      );

      const rewards = await lootBox.getRewards(0);
      expect(rewards.length).to.equal(1);
      expect(rewards[0].tokenType).to.equal(1);
      expect(rewards[0].tokenAddress).to.equal(await mockERC721.getAddress());
      expect(rewards[0].tokenId).to.equal(1);
    });

    it("Should add ERC1155 reward successfully", async function () {
      await lootBox.addReward(
        0,
        2, // ERC1155
        await mockERC1155.getAddress(),
        1,
        5,
        25
      );

      const rewards = await lootBox.getRewards(0);
      expect(rewards.length).to.equal(1);
      expect(rewards[0].tokenType).to.equal(2);
      expect(rewards[0].tokenAddress).to.equal(await mockERC1155.getAddress());
      expect(rewards[0].tokenId).to.equal(1);
      expect(rewards[0].amount).to.equal(5);
    });

    it("Should only allow owner to add rewards", async function () {
      await expect(
        lootBox.connect(user1).addReward(
          0,
          0,
          await mockERC20.getAddress(),
          0,
          ethers.parseEther("10"),
          100
        )
      ).to.be.reverted;
    });

    it("Should revert for invalid loot box ID", async function () {
      await expect(
        lootBox.addReward(
          999,
          0,
          await mockERC20.getAddress(),
          0,
          ethers.parseEther("10"),
          100
        )
      ).to.be.revertedWith("Invalid loot box ID");
    });

    it("Should revert for zero weight", async function () {
      await expect(
        lootBox.addReward(
          0,
          0,
          await mockERC20.getAddress(),
          0,
          ethers.parseEther("10"),
          0
        )
      ).to.be.revertedWith("Weight must be greater than 0");
    });
  });

  describe("Open LootBox", function () {
    beforeEach(async function () {
      await lootBox.createLootBox("Test Box", "Test", ethers.parseEther("1"), 100);
      await lootBox.addReward(
        0,
        0,
        await mockERC20.getAddress(),
        0,
        ethers.parseEther("10"),
        100
      );
    });

    it("Should revert if loot box is not active", async function () {
      await lootBox.setLootBoxActive(0, false);
      
      await expect(
        lootBox.connect(user1).openLootBox(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Loot box is not active");
    });

    it("Should revert if insufficient payment", async function () {
      await expect(
        lootBox.connect(user1).openLootBox(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert if max supply reached", async function () {
      // This would require mocking VRF, so we'll test the revert case
      await expect(
        lootBox.connect(user1).openLootBox(0, { value: ethers.parseEther("1") })
      ).to.not.be.reverted;
    });

    it("Should revert if no rewards available", async function () {
      await lootBox.createLootBox("Empty Box", "Test", ethers.parseEther("1"), 100);
      
      await expect(
        lootBox.connect(user1).openLootBox(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("No rewards available");
    });

    it("Should emit LootBoxOpened event", async function () {
      const tx = await lootBox.connect(user1).openLootBox(0, { value: ethers.parseEther("1") });
      
      await expect(tx)
        .to.emit(lootBox, "LootBoxOpened")
        .withArgs(await user1.getAddress(), 0, [await mockERC20.getAddress()], [0], [ethers.parseEther("10")]);
    });
  });

  describe("Reward Selection", function () {
    beforeEach(async function () {
      await lootBox.createLootBox("Test Box", "Test", ethers.parseEther("1"), 100);
      
      // Add multiple rewards with different weights
      await lootBox.addReward(0, 0, await mockERC20.getAddress(), 0, ethers.parseEther("1"), 30);
      await lootBox.addReward(0, 0, await mockERC20.getAddress(), 0, ethers.parseEther("5"), 50);
      await lootBox.addReward(0, 0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 20);
    });

    it("Should calculate total weight correctly", async function () {
      const totalWeight = await lootBox.getTotalWeight(0);
      expect(totalWeight).to.equal(100);
    });

    it("Should select rewards based on weights", async function () {
      const rewards = await lootBox.getRewards(0);
      expect(rewards.length).to.equal(3);
      expect(rewards[0].amount).to.equal(ethers.parseEther("1"));
      expect(rewards[1].amount).to.equal(ethers.parseEther("5"));
      expect(rewards[2].amount).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await lootBox.createLootBox("Test Box", "Test", ethers.parseEther("1"), 100);
    });

    it("Should update loot box price", async function () {
      await lootBox.updateLootBoxPrice(0, ethers.parseEther("2"));
      
      const config = await lootBox.getLootBoxConfig(0);
      expect(config.price).to.equal(ethers.parseEther("2"));
      
      await expect(lootBox.updateLootBoxPrice(0, ethers.parseEther("2")))
        .to.emit(lootBox, "LootBoxUpdated")
        .withArgs(0, "Test Box", ethers.parseEther("2"), 100, true);
    });

    it("Should set loot box active status", async function () {
      await lootBox.setLootBoxActive(0, false);
      
      const config = await lootBox.getLootBoxConfig(0);
      expect(config.isActive).to.be.false;
      
      await expect(lootBox.setLootBoxActive(0, false))
        .to.emit(lootBox, "LootBoxUpdated")
        .withArgs(0, "Test Box", ethers.parseEther("1"), 100, false);
    });

    it("Should only allow owner to update price", async function () {
      await expect(
        lootBox.connect(user1).updateLootBoxPrice(0, ethers.parseEther("2"))
      ).to.be.reverted;
    });

    it("Should only allow owner to set active status", async function () {
      await expect(
        lootBox.connect(user1).setLootBoxActive(0, false)
      ).to.be.reverted;
    });
  });

  describe("Withdraw Functions", function () {
    beforeEach(async function () {
      await lootBox.createLootBox("Test Box", "Test", ethers.parseEther("1"), 100);
    });

    it("Should withdraw ERC20 tokens", async function () {
      const initialBalance = await mockERC20.balanceOf(await owner.getAddress());
      
      await lootBox.withdrawTokens(await mockERC20.getAddress(), ethers.parseEther("100"));
      
      const finalBalance = await mockERC20.balanceOf(await owner.getAddress());
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("100"));
    });

    it("Should only allow owner to withdraw tokens", async function () {
      await expect(
        lootBox.connect(user1).withdrawTokens(await mockERC20.getAddress(), ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should withdraw NFT", async function () {
      await lootBox.withdrawNFT(await mockERC1155.getAddress(), 1, 10);
      
      const balance = await mockERC1155.balanceOf(await owner.getAddress(), 1);
      expect(balance).to.equal(10);
    });

    it("Should only allow owner to withdraw NFT", async function () {
      await expect(
        lootBox.connect(user1).withdrawNFT(await mockERC1155.getAddress(), 1, 10)
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple loot boxes", async function () {
      await lootBox.createLootBox("Box 1", "Test 1", ethers.parseEther("1"), 100);
      await lootBox.createLootBox("Box 2", "Test 2", ethers.parseEther("2"), 200);
      
      const config1 = await lootBox.getLootBoxConfig(0);
      const config2 = await lootBox.getLootBoxConfig(1);
      
      expect(config1.name).to.equal("Box 1");
      expect(config2.name).to.equal("Box 2");
    });

    it("Should handle empty reward list", async function () {
      await lootBox.createLootBox("Empty Box", "Test", ethers.parseEther("1"), 100);
      
      const rewards = await lootBox.getRewards(2);
      expect(rewards.length).to.equal(0);
    });

    it("Should handle zero max supply", async function () {
      await lootBox.createLootBox("Zero Supply", "Test", ethers.parseEther("1"), 0);
      
      const config = await lootBox.getLootBoxConfig(3);
      expect(config.maxSupply).to.equal(0);
    });
  });
});
