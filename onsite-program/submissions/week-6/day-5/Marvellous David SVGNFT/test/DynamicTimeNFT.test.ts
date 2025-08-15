import { expect } from "chai";
import { ethers } from "hardhat";
import { DynamicTimeNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DynamicTimeNFT", function () {
  let dynamicTimeNFT: DynamicTimeNFT;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
    dynamicTimeNFT = await DynamicTimeNFT.deploy();
    await dynamicTimeNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await dynamicTimeNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await dynamicTimeNFT.name()).to.equal("DudeTimeNFT");
      expect(await dynamicTimeNFT.symbol()).to.equal("DTNFT");
    });
  });

  describe("Minting", function () {
    it("Should mint a new NFT", async function () {
      await dynamicTimeNFT.mintNFT("Test NFT", "A test dynamic NFT", "FF0000");
      
      expect(await dynamicTimeNFT.ownerOf(0)).to.equal(owner.address);
      expect(await dynamicTimeNFT.balanceOf(owner.address)).to.equal(1);
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(
        dynamicTimeNFT.mintNFT("Test NFT", "A test dynamic NFT", "FF0000")
      ).to.emit(dynamicTimeNFT, "Transfer")
       .withArgs(ethers.ZeroAddress, owner.address, 0);
    });
  });

  describe("Token URI", function () {
    beforeEach(async function () {
      await dynamicTimeNFT.mintNFT("Test NFT", "A test dynamic NFT", "FF0000");
    });

    it("Should return valid token URI", async function () {
      const tokenURI = await dynamicTimeNFT.tokenURI(0);
      expect(tokenURI).to.be.a("string");
      expect(tokenURI).to.include("data:application/json;base64,");
    });

    it("Should revert for non-existent token", async function () {
      await expect(dynamicTimeNFT.tokenURI(999))
        .to.be.revertedWith("Token does not exist");
    });
  });

  describe("Update Metadata", function () {
    beforeEach(async function () {
      await dynamicTimeNFT.mintNFT("Test NFT", "A test dynamic NFT", "FF0000");
    });

    it("Should update metadata", async function () {
      const initialTime = await dynamicTimeNFT.lastRenderTime(0);
      
      // Mine a new block to advance time
      await ethers.provider.send("evm_mine", []);
      
      await dynamicTimeNFT.updateMetadata(0);
      
      const newTime = await dynamicTimeNFT.lastRenderTime(0);
      expect(newTime).to.be.gt(initialTime);
    });

    it("Should revert for non-existent token", async function () {
      await expect(dynamicTimeNFT.updateMetadata(999))
        .to.be.revertedWith("Token does not exist");
    });
  });
});
