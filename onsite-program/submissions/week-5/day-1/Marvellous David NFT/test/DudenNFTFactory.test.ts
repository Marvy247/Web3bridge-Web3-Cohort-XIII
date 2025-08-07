import { expect } from "chai";
import { ethers } from "hardhat";

describe("DudenNFTFactory", function () {
  let factory: any;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const Factory = await ethers.getContractFactory("DudenNFTFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with zero collections", async function () {
      expect(await factory.totalCollections()).to.equal(0);
    });
  });

  describe("Collection Creation", function () {
    it("Should create a new collection", async function () {
      const tx = await factory.createCollection();
      await tx.wait();
      
      expect(await factory.totalCollections()).to.equal(1);
      
      const collections = await factory.getUserCollections(owner.address);
      expect(collections.length).to.equal(1);
    });

    it("Should create multiple collections", async function () {
      const count = 3;
      const tx = await factory.createMultipleCollections(count);
      await tx.wait();
      
      expect(await factory.totalCollections()).to.equal(count);
      expect(await factory.getUserCollectionCount(owner.address)).to.equal(count);
    });

    it("Should track collections by user", async function () {
      await factory.connect(addr1).createCollection();
      await factory.connect(addr1).createCollection();
      
      expect(await factory.getUserCollectionCount(addr1.address)).to.equal(2);
      expect(await factory.getUserCollectionCount(owner.address)).to.equal(0);
    });

    it("Should emit CollectionCreated event", async function () {
      const tx = await factory.createCollection();
      const receipt = await tx.wait();
      
      const event = receipt?.logs?.find((log: any) => log.fragment?.name === "CollectionCreated");
      expect(event).to.not.be.undefined;
    });
  });

  describe("Collection Queries", function () {
    beforeEach(async function () {
      await factory.createCollection();
      await factory.createCollection();
    });

    it("Should get all collections", async function () {
      const collections = await factory.getAllCollections();
      expect(collections.length).to.equal(2);
    });

    it("Should get collection details", async function () {
      const details = await factory.getCollectionDetails(0);
      expect(details.collectionAddress).to.be.properAddress;
      expect(details.creator).to.equal(owner.address);
      expect(details.name).to.equal("DudenNFT");
      expect(details.symbol).to.equal("DUDE");
    });

    it("Should get user collections", async function () {
      const collections = await factory.getUserCollections(owner.address);
      expect(collections.length).to.equal(2);
    });
  });
});
