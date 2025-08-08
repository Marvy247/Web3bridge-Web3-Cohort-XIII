import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MultiSigWallet", function () {
  let wallet: any;
  let factory: any;
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let owner3: SignerWithAddress;
  let owner4: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  beforeEach(async function () {
    [owner1, owner2, owner3, owner4, nonOwner] = await ethers.getSigners();
    
    const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
    wallet = await MultiSigWalletFactory.deploy(
      [owner1.address, owner2.address, owner3.address, owner4.address],
      3
    );
  });

  describe("Deployment", function () {
    it("Should set correct owners and required confirmations", async function () {
      const owners = await wallet.getOwners();
      expect(owners).to.deep.equal([
        owner1.address,
        owner2.address,
        owner3.address,
        owner4.address,
      ]);
      expect(await wallet.requiredConfirmations()).to.equal(3);
    });

    it("Should fail if owners is empty", async function () {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWalletFactory.deploy([], 1)
      ).to.be.revertedWith("Owners required");
    });

    it("Should fail if required confirmations is 0", async function () {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWalletFactory.deploy([owner1.address], 0)
      ).to.be.revertedWith("Invalid required confirmations");
    });
  });

  describe("Submit Transaction", function () {
    it("Should allow owners to submit transactions", async function () {
      await expect(
        wallet.submitTransaction(nonOwner.address, 100, "0x")
      ).to.emit(wallet, "SubmitTransaction")
        .withArgs(owner1.address, 0, nonOwner.address, 100, "0x");
    });

    it("Should not allow non-owners to submit transactions", async function () {
      await expect(
        wallet.connect(nonOwner).submitTransaction(nonOwner.address, 100, "0x")
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Confirm and Execute Transaction", function () {
    beforeEach(async function () {
      // Fund the wallet with some ether
      await owner1.sendTransaction({ 
        to: await wallet.getAddress(), 
        value: ethers.parseEther("1.0") 
      });
      
      await wallet.submitTransaction(nonOwner.address, 100, "0x");
    });

    it("Should execute transaction after required confirmations", async function () {
      await wallet.confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner3).confirmTransaction(0);

      await expect(wallet.executeTransaction(0))
        .to.emit(wallet, "ExecuteTransaction")
        .withArgs(owner1.address, 0);
    });

    it("Should not execute transaction without required confirmations", async function () {
      await wallet.confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.executeTransaction(0))
        .to.be.revertedWith("Cannot execute tx");
    });
  });

  describe("Factory Tests", function () {
    beforeEach(async function () {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWalletFactory");
      factory = await MultiSigWalletFactory.deploy();
    });

    it("Should create a new wallet", async function () {
      const owners = [owner1.address, owner2.address, owner3.address];
      
      const tx = await factory.createWallet(owners, 2);
      await tx.wait();
      
      const wallets = await factory.getWallets();
      expect(wallets.length).to.equal(1);
    });

    it("Should track multiple wallets", async function () {
      const owners1 = [owner1.address, owner2.address];
      const owners2 = [owner2.address, owner3.address];
      
      await factory.createWallet(owners1, 1);
      await factory.createWallet(owners2, 1);
      
      const wallets = await factory.getWallets();
      expect(wallets.length).to.equal(2);
    });
  });
});
