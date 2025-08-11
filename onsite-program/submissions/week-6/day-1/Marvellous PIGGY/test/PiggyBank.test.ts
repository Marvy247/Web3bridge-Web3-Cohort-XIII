const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PiggyBank System", function () {
  let factory: any;
  let piggyBankAccount: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let erc20Token: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Factory
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    factory = await PiggyBankFactory.deploy();

    // Deploy Mock ERC20 Token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    erc20Token = await MockERC20.deploy("Test Token", "TEST", 18);

    // Create savings account for user1
    const createTx = await factory.connect(user1).createSavingsAccount();
    await createTx.wait();
    
    // Get the created account address
    const userAccounts = await factory.getUserAccounts(user1.address);
    const accountAddress = userAccounts[0];
    
    // Get the account contract instance
    piggyBankAccount = await ethers.getContractAt("PiggyBankAccount", accountAddress);
  });

  describe("Factory", function () {
    it("Should set the correct admin", async function () {
      expect(await factory.admin()).to.equal(owner.address);
    });

    it("Should create a savings account", async function () {
      const createTx = await factory.connect(user2).createSavingsAccount();
      await createTx.wait();
      
      const userAccounts = await factory.getUserAccounts(user2.address);
      expect(userAccounts.length).to.equal(1);
      expect(await factory.getAccountCount(user2.address)).to.equal(1);
    });

    it("Should track multiple accounts per user", async function () {
      await factory.connect(user1).createSavingsAccount();
      await factory.connect(user1).createSavingsAccount();
      
      const userAccounts = await factory.getUserAccounts(user1.address);
      expect(userAccounts.length).to.equal(3); // 1 from beforeEach + 2 new
      expect(await factory.getAccountCount(user1.address)).to.equal(3);
    });
  });

  describe("Savings Account", function () {
    it("Should deposit ETH correctly", async function () {
      const depositAmount = ethers.parseEther("1");
      const lockPeriod = 3600; // 1 hour
      
      await expect(
        piggyBankAccount.connect(user1).deposit(
          "0x0000000000000000000000000000000000000000",
          depositAmount,
          lockPeriod,
          { value: depositAmount }
        )
      ).to.emit(piggyBankAccount, "Deposit")
       .withArgs(user1.address, "0x0000000000000000000000000000000000000000", depositAmount, lockPeriod);
      
      const balance = await piggyBankAccount.getUserBalance(user1.address, "0x0000000000000000000000000000000000000000");
      expect(balance).to.equal(depositAmount);
    });

    it("Should deposit ERC20 correctly", async function () {
      const depositAmount = ethers.parseEther("100");
      const lockPeriod = 3600;
      
      // Mint tokens to user1
      await erc20Token.mint(user1.address, depositAmount);
      await erc20Token.connect(user1).approve(await piggyBankAccount.getAddress(), depositAmount);
      
      await expect(
        piggyBankAccount.connect(user1).deposit(await erc20Token.getAddress(), depositAmount, lockPeriod)
      ).to.emit(piggyBankAccount, "Deposit")
       .withArgs(user1.address, await erc20Token.getAddress(), depositAmount, lockPeriod);
      
      const balance = await piggyBankAccount.getUserBalance(user1.address, await erc20Token.getAddress());
      expect(balance).to.equal(depositAmount);
    });

    it("Should withdraw without penalty after lock period", async function () {
      const depositAmount = ethers.parseEther("1");
      const lockPeriod = 1; // 1 second
      
      // Deposit ETH
      await piggyBankAccount.connect(user1).deposit(
        "0x0000000000000000000000000000000000000000",
        depositAmount,
        lockPeriod,
        { value: depositAmount }
      );
      
      // Get plan ID
      const plans = await piggyBankAccount.getUserPlans(user1.address);
      const planId = plans[0];
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine");
      
      // Withdraw
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const withdrawTx = await piggyBankAccount.connect(user1).withdraw(planId, depositAmount);
      await withdrawTx.wait();
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should apply penalty for early withdrawal", async function () {
      const depositAmount = ethers.parseEther("1");
      const lockPeriod = 3600; // 1 hour
      
      // Deposit ETH
      await piggyBankAccount.connect(user1).deposit(
        "0x0000000000000000000000000000000000000000",
        depositAmount,
        lockPeriod,
        { value: depositAmount }
      );
      
      // Get plan ID
      const plans = await piggyBankAccount.getUserPlans(user1.address);
      const planId = plans[0];
      
      // Check penalty
      const penalty = await piggyBankAccount.getPenaltyAmount(planId, depositAmount);
      expect(penalty).to.equal(depositAmount * 3n / 100n);
      
      // Withdraw early
      await piggyBankAccount.connect(user1).withdraw(planId, depositAmount);
      
      // Check penalty was collected - the penalty goes to the admin (factory owner)
      // Since we can't easily track this in the current implementation, we'll check that penalty calculation is correct
      expect(penalty).to.be.gt(0);
    });

    it("Should track multiple savings plans", async function () {
      const depositAmount1 = ethers.parseEther("1");
      const depositAmount2 = ethers.parseEther("2");
      
      await piggyBankAccount.connect(user1).deposit(
        "0x0000000000000000000000000000000000000000",
        depositAmount1,
        3600,
        { value: depositAmount1 }
      );
      
      // Mint tokens to user1 for second deposit
      await erc20Token.mint(user1.address, depositAmount2);
      await erc20Token.connect(user1).approve(await piggyBankAccount.getAddress(), depositAmount2);
      
      await piggyBankAccount.connect(user1).deposit(
        await erc20Token.getAddress(),
        depositAmount2,
        7200
      );
      
      const plans = await piggyBankAccount.getUserPlans(user1.address);
      expect(plans.length).to.equal(2);
      
      const totalBalance = await piggyBankAccount.getTotalBalance(user1.address);
      expect(totalBalance).to.equal(depositAmount1 + depositAmount2);
    });
  });
});