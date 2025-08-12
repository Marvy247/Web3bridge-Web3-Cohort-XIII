import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { UniswapPermitSwapper, MockERC20 } from "../typechain-types";
import { parseEther } from "ethers";

describe("UniswapPermitSwapper Unit Tests", function () {
  let swapper: UniswapPermitSwapper;
  let tokenIn: MockERC20;
  let tokenOut: MockERC20;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;

  const SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

  beforeEach(async function () {
    // Get signers
    [owner, user, recipient] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenIn = await MockERC20.deploy("Token In", "TKNIN", 18);
    tokenOut = await MockERC20.deploy("Token Out", "TKNOUT", 18);

    // Deploy the swapper contract
    const UniswapPermitSwapper = await ethers.getContractFactory("UniswapPermitSwapper");
    swapper = await UniswapPermitSwapper.deploy();

    // Mint tokens to user
    await tokenIn.mint(user.address, parseEther("1000"));
    await tokenOut.mint(swapper.target, parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the correct constants", async function () {
      expect(await swapper.SWAP_ROUTER()).to.equal(SWAP_ROUTER);
      expect(await swapper.PERMIT2()).to.equal(PERMIT2);
    });
  });

  describe("swapWithPermit", function () {
    it("Should revert with invalid token", async function () {
      const amountIn = parseEther("100");
      const amountOutMinimum = parseEther("90");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const permitData = {
        token: await tokenOut.getAddress(),
        spender: await swapper.getAddress(),
        value: amountIn,
        deadline: deadline,
        v: 27,
        r: ethers.zeroPadBytes("0x1234", 32),
        s: ethers.zeroPadBytes("0x5678", 32)
      };

      const swapParams = {
        tokenIn: await tokenIn.getAddress(),
        tokenOut: await tokenOut.getAddress(),
        fee: 3000,
        recipient: await recipient.getAddress(),
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0
      };

      await expect(
        swapper.connect(user).swapWithPermit(swapParams, permitData, deadline)
      ).to.be.reverted;
    });

    it("Should revert with invalid spender", async function () {
      const amountIn = parseEther("100");
      const amountOutMinimum = parseEther("90");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const permitData = {
        token: await tokenIn.getAddress(),
        spender: await user.getAddress(),
        value: amountIn,
        deadline: deadline,
        v: 27,
        r: ethers.zeroPadBytes("0x1234", 32),
        s: ethers.zeroPadBytes("0x5678", 32)
      };

      const swapParams = {
        tokenIn: await tokenIn.getAddress(),
        tokenOut: await tokenOut.getAddress(),
        fee: 3000,
        recipient: await recipient.getAddress(),
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0
      };

      await expect(
        swapper.connect(user).swapWithPermit(swapParams, permitData, deadline)
      ).to.be.reverted;
    });
  });

  describe("rescueTokens", function () {
    it("Should rescue tokens successfully", async function () {
      const amount = parseEther("100");
      
      // Send tokens to contract
      await tokenIn.mint(await swapper.getAddress(), amount);
      
      // Rescue tokens
      await expect(
        swapper.rescueTokens(await tokenIn.getAddress(), await recipient.getAddress(), amount)
      ).to.not.be.reverted;
      
      expect(await tokenIn.balanceOf(await recipient.getAddress())).to.equal(amount);
    });

    it("Should revert with zero recipient", async function () {
      const amount = parseEther("100");
      
      await expect(
        swapper.rescueTokens(await tokenIn.getAddress(), ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Invalid recipient");
    });
  });
});
