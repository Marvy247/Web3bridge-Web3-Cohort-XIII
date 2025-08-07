import { expect } from "chai";
import { ethers } from "hardhat";
import { Web3BridgeFactory } from "../typechain-types";

describe("Web3BridgeFactory", function () {
  let factory: Web3BridgeFactory;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const Web3BridgeFactory = await ethers.getContractFactory("Web3BridgeFactory");
    factory = await Web3BridgeFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await factory.getAddress()).to.be.properAddress;
    });

    it("Should have zero initial contracts", async function () {
      expect(await factory.getTokenCount()).to.equal(0);
      expect(await factory.getGarageCount()).to.equal(0);
    });
  });

  describe("Token Deployment", function () {
    it("Should deploy a new token", async function () {
      const tx = await factory.deployToken(1000, "Test Token", "TEST");
      await tx.wait();

      expect(await factory.getTokenCount()).to.equal(1);
      
      const userTokens = await factory.getUserTokens(owner.address);
      expect(userTokens.length).to.equal(1);
      
      const tokenAddress = userTokens[0];
      const token = await ethers.getContractAt("MarvellousToken", tokenAddress);
      
      expect(await token.name()).to.equal("Marvellous Token");
      expect(await token.symbol()).to.equal("MARV");
      expect(await token.totalSupply()).to.equal(1000 * 10**18);
    });

    it("Should track multiple tokens for same user", async function () {
      await factory.deployToken(1000, "Token1", "TK1");
      await factory.deployToken(2000, "Token2", "TK2");
      
      const userTokens = await factory.getUserTokens(owner.address);
      expect(userTokens.length).to.equal(2);
    });

    it("Should emit TokenDeployed event", async function () {
      await expect(factory.deployToken(1000, "Test Token", "TEST"))
        .to.emit(factory, "TokenDeployed")
        .withArgs(await factory.getUserTokens(owner.address).then(addrs => addrs[0]), "Test Token", "TEST", 1000, owner.address);
    });
  });

  describe("Garage Access Deployment", function () {
    it("Should deploy a new garage access contract", async function () {
      const tx = await factory.deployGarageAccess();
      await tx.wait();

      expect(await factory.getGarageCount()).to.equal(1);
      
      const userGarages = await factory.getUserGarages(owner.address);
      expect(userGarages.length).to.equal(1);
      
      const garageAddress = userGarages[0];
      const garage = await ethers.getContractAt("Web3BridgeGarageAccess", garageAddress);
      
      expect(await garage.getEmployeeCount()).to.equal(0);
    });

    it("Should track multiple garage contracts for same user", async function () {
      await factory.deployGarageAccess();
      await factory.deployGarageAccess();
      
      const userGarages = await factory.getUserGarages(owner.address);
      expect(userGarages.length).to.equal(2);
    });

    it("Should emit GarageAccessDeployed event", async function () {
      await expect(factory.deployGarageAccess())
        .to.emit(factory, "GarageAccessDeployed");
    });
  });

  describe("Batch Deployment", function () {
    it("Should deploy both token and garage in one transaction", async function () {
      const tx = await factory.deployBatch(1000, "Batch Token", "BATCH");
      await tx.wait();

      expect(await factory.getTokenCount()).to.equal(1);
      expect(await factory.getGarageCount()).to.equal(1);
      
      const userTokens = await factory.getUserTokens(owner.address);
      const userGarages = await factory.getUserGarages(owner.address);
      
      expect(userTokens.length).to.equal(1);
      expect(userGarages.length).to.equal(1);
    });

    it("Should emit BatchDeployed event", async function () {
      await expect(factory.deployBatch(1000, "Batch Token", "BATCH"))
        .to.emit(factory, "BatchDeployed");
    });
  });

  describe("Contract Tracking", function () {
    beforeEach(async function () {
      await factory.deployToken(1000, "Token1", "TK1");
      await factory.deployGarageAccess();
      await factory.connect(addr1).deployToken(500, "Token2", "TK2");
    });

    it("Should track contracts by user", async function () {
      const ownerTokens = await factory.getUserTokens(owner.address);
      const ownerGarages = await factory.getUserGarages(owner.address);
      const addr1Tokens = await factory.getUserTokens(addr1.address);
      
      expect(ownerTokens.length).to.equal(1);
      expect(ownerGarages.length).to.equal(1);
      expect(addr1Tokens.length).to.equal(1);
    });

    it("Should return all deployed contracts", async function () {
      const allTokens = await factory.getAllTokens();
      const allGarages = await factory.getAllGarages();
      
      expect(allTokens.length).to.equal(2);
      expect(allGarages.length).to.equal(1);
    });

    it("Should verify factory contracts", async function () {
      const allTokens = await factory.getAllTokens();
      const allGarages = await factory.getAllGarages();
      
      expect(await factory.isFactoryToken(allTokens[0])).to.be.true;
      expect(await factory.isFactoryToken(allTokens[1])).to.be.true;
      expect(await factory.isFactoryGarage(allGarages[0])).to.be.true;
      
      expect(await factory.isFactoryToken(owner.address)).to.be.false;
      expect(await factory.isFactoryGarage(owner.address)).to.be.false;
    });

    it("Should get token details", async function () {
      const allTokens = await factory.getAllTokens();
      const tokenDetails = await factory.getTokenDetails(allTokens[0]);
      
      expect(tokenDetails.name).to.equal("Marvellous Token");
      expect(tokenDetails.symbol).to.equal("MARV");
      expect(tokenDetails.decimals).to.equal(18);
      expect(tokenDetails.totalSupply).to.equal(1000 * 10**18);
    });
  });
});
