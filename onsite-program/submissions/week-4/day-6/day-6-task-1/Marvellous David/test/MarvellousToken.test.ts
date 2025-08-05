import { expect } from "chai";
import { ethers } from "hardhat";
import { MarvellousToken } from "../typechain-types";

describe("MarvellousToken", function () {
  let token: MarvellousToken;
  let owner: any;
  let addr1: any;
  let addr2: any;
  const initialSupply = 1000;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const MarvellousToken = await ethers.getContractFactory("MarvellousToken");
    token = await MarvellousToken.deploy(initialSupply);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name", async function () {
      expect(await token.name()).to.equal("Marvellous Token");
    });

    it("Should set the correct symbol", async function () {
      expect(await token.symbol()).to.equal("MARV");
    });

    it("Should set the correct decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should set the correct total supply", async function () {
      const expectedSupply = ethers.parseEther(initialSupply.toString());
      expect(await token.totalSupply()).to.equal(expectedSupply);
    });

    it("Should assign the total supply to the owner", async function () {
      const expectedSupply = ethers.parseEther(initialSupply.toString());
      expect(await token.balanceOf(owner.address)).to.equal(expectedSupply);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens correctly", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(token.transfer(addr1.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
      
      expect(await token.balanceOf(owner.address)).to.equal(
        ethers.parseEther((initialSupply - 100).toString())
      );
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if sender has insufficient balance", async function () {
      const amount = ethers.parseEther((initialSupply + 1).toString());
      
      await expect(
        token.transfer(addr1.address, amount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should fail if transferring to zero address", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(
        token.transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });
  });

  describe("Approve and TransferFrom", function () {
    it("Should approve and emit Approval event", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(token.approve(addr1.address, amount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, amount);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
    });

    it("Should transferFrom correctly", async function () {
      const amount = ethers.parseEther("100");
      
      await token.approve(addr1.address, amount);
      
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      )
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr2.address, amount);
      
      expect(await token.balanceOf(owner.address)).to.equal(
        ethers.parseEther((initialSupply - 100).toString())
      );
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should fail transferFrom if allowance is insufficient", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    });

    it("Should fail transferFrom if balance is insufficient", async function () {
      const amount = ethers.parseEther((initialSupply + 1).toString());
      
      await token.approve(addr1.address, amount);
      
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should fail transferFrom from zero address", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(
        token.transferFrom(ethers.ZeroAddress, addr1.address, amount)
      ).to.be.revertedWith("ERC20: transfer from the zero address");
    });

    it("Should fail transferFrom to zero address", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(
        token.transferFrom(owner.address, ethers.ZeroAddress, amount)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero transfers correctly", async function () {
      await expect(token.transfer(addr1.address, 0))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, 0);
      
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should handle zero approvals correctly", async function () {
      await expect(token.approve(addr1.address, 0))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, 0);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should handle multiple transfers correctly", async function () {
      const amount1 = ethers.parseEther("100");
      const amount2 = ethers.parseEther("50");
      
      await token.transfer(addr1.address, amount1);
      await token.connect(addr1).transfer(addr2.address, amount2);
      
      expect(await token.balanceOf(owner.address)).to.equal(
        ethers.parseEther((initialSupply - 100).toString())
      );
      expect(await token.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("50")
      );
      expect(await token.balanceOf(addr2.address)).to.equal(amount2);
    });
  });
});
