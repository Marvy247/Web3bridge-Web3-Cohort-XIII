import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DAONFT", function () {
  let daonft: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const DAONFTFactory = await ethers.getContractFactory("contracts/DAONFT.sol:DAONFT");
    daonft = await DAONFTFactory.deploy(
      "DAO Membership NFT",
      "DAONFT",
      "https://api.example.com/metadata/"
    );
    await daonft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await daonft.name()).to.equal("DAO Membership NFT");
      expect(await daonft.symbol()).to.equal("DAONFT");
    });

    it("Should set the right owner", async function () {
      expect(await daonft.owner()).to.equal(owner.address);
    });

    it("Should set the right base URI", async function () {
      expect(await daonft.baseURI()).to.equal("https://api.example.com/metadata/");
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      await expect(daonft.mint(addr1.address))
        .to.emit(daonft, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 1);

      expect(await daonft.balanceOf(addr1.address)).to.equal(1);
      expect(await daonft.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        daonft.connect(addr1).mint(addr2.address)
      ).to.be.revertedWithCustomError(daonft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Role Management", function () {
    beforeEach(async function () {
      await daonft.mint(addr1.address);
    });

    it("Should check roles correctly", async function () {
      const MEMBER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MEMBER"));
      const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
      const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER"));
      const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN"));

      expect(await daonft.hasRoleForAddress(MEMBER_ROLE, addr1.address)).to.be.true;
      expect(await daonft.hasRoleForAddress(VOTER_ROLE, addr1.address)).to.be.true;
      expect(await daonft.hasRoleForAddress(PROPOSER_ROLE, addr1.address)).to.be.true;
      expect(await daonft.hasRoleForAddress(ADMIN_ROLE, addr1.address)).to.be.true;
      expect(await daonft.hasRoleForAddress(VOTER_ROLE, addr2.address)).to.be.false;
    });

    it("Should grant default roles to new token holders", async function () {
      const MEMBER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MEMBER"));
      
      await daonft.mint(addr2.address);
      
      expect(await daonft.hasRoleForAddress(MEMBER_ROLE, addr2.address)).to.be.true;
    });

    it("Should check roles for multiple tokens owned by same address", async function () {
      const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
      
      await daonft.mint(addr1.address); // Second token
      expect(await daonft.hasRoleForAddress(VOTER_ROLE, addr1.address)).to.be.true;
    });

    it("Should return false for non-existent roles", async function () {
      const NON_EXISTENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("NON_EXISTENT"));
      
      expect(await daonft.hasRoleForAddress(NON_EXISTENT_ROLE, addr1.address)).to.be.false;
    });
  });

  describe("Base URI Management", function () {
    it("Should update base URI by owner", async function () {
      const newBaseURI = "https://new-api.example.com/metadata/";
      await daonft.setBaseURI(newBaseURI);
      expect(await daonft.baseURI()).to.equal(newBaseURI);
    });

    it("Should not allow non-owner to update base URI", async function () {
      await expect(
        daonft.connect(addr1).setBaseURI("https://new-api.example.com/metadata/")
      ).to.be.revertedWithCustomError(daonft, "OwnableUnauthorizedAccount");
    });
  });
});
