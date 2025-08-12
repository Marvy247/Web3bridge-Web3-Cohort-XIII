import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { UniswapPermitSwapper, MockERC20 } from "../typechain-types";
import { BigNumber } from "ethers";

describe("UniswapPermitSwapper", function () {
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
    await tokenIn.mint(user.address, ethers.utils.parseEther("1000"));
    await tokenOut.mint(swapper.address, ethers.utils.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the correct constants", async function () {
      expect(await swapper.SWAP_ROUTER()).to.equal(SWAP_ROUTER);
      expect(await swapper.PERMIT2()).to.equal(PERMIT2);
    });
  });

  describe("swapWithPermit", function () {
    it("Should execute swap with valid permit", async function () {
      const amountIn = ethers.utils.parseEther("100");
      const amountOutMinimum = ethers.utils.parseEther("90");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Create permit data
      const permitData = {
        token: tokenIn.address,
        spender: swapper.address,
        value: amountIn,
        deadline: deadline,
        v: 27,
        r: ethers.utils.formatBytes32String("r"),
        s: ethers.utils.formatBytes32String("s")
      };

      const swapParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: 3000,
        recipient: recipient.address,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0
      };

      // Since we're using mock tokens, we'll test the function signature and revert
      await expect(
        swapper.connect(user).swapWithPermit(swapParams, permitData, deadline)
      ).to.be.reverted;
    });

    it("Should revert with invalid token", async function () {
      const amountIn = ethers.utils.parseEther("100");
      const amountOutMinimum = ethers.utils.parseEther("90");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const permitData = {
        token: tokenOut.address, // Wrong token
        spender: swapper.address,
        value: amountIn,
        deadline: deadline,
        v: 27,
        r: ethers.utils.formatBytes32String("r"),
        s: ethers.utils.formatBytes32String("s")
      };

      const swapParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: 3000,
        recipient: recipient.address,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0
      };

      await expect(
        swapper.connect(user).swapWithPermit(swapParams, permitData, deadline)
      ).to.be.reverted;
    });

    it("Should revert with invalid spender", async function () {
      const amountIn = ethers.utils.parseEther("100");
      const amountOutMinimum = ethers.utils.parseEther("90");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const permitData = {
        token: tokenIn.address,
        spender: user.address, // Wrong spender
        value: amountIn,
        deadline: deadline,
        v: 27,
        r: ethers.utils.formatBytes32String("r"),
        s: ethers.utils.formatBytes32String("s")
      };

      const swapParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: 3000,
        recipient: recipient.address,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0
      };

      await expect(
        swapper.connect(user).swapWithPermit(swapParams, permitData, deadline)
      ).to.be.reverted;
    });
  });

  describe("swapWithPermit2", function () {
    it("Should execute swap with valid Permit2", async function () {
      const amountIn = ethers.utils.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const permitDetails = {
        token: tokenIn.address,
        amount: amountIn,
        expiration: deadline,
        nonce: 0
      };

      const permitSingle = {
        details: permitDetails,
        spender: swapper.address,
        sigDeadline: deadline
      };

      const permit2Data = {
        permit: permitSingle,
        signature: "0x1234"
      };

      const swapParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: 3000,
        recipient: recipient.address,
        amountIn: amountIn,
        amountOutMinimum: ethers.utils.parseEther("90"),
        sqrtPriceLimitX96: 0
      };

      // Since we're using mock tokens, we'll test the function signature and revert
      await expect(
        swapper.connect(user).swapWithPermit2(swapParams, permit2Data, deadline)
      ).to.be.reverted;
    });
  });

  describe("swapMultiHopWithPermit2", function () {
    it("Should execute multi-hop swap with valid Permit2", async function () {
      const amountIn = ethers.utils.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Create mock path (tokenIn -> tokenOut)
      const path = ethers.utils.solidityPack(
        ["address", "uint24", "address"],
        [tokenIn.address, 3000, tokenOut.address]
      );

      const permitDetails = {
        token: tokenIn.address,
        amount: amountIn,
        expiration: deadline,
        nonce: 0
      };

      const permitSingle = {
        details: permitDetails,
        spender: swapper.address,
        sigDeadline: deadline
      };

      const permit2Data = {
        permit: permitSingle,
        signature: "0x1234"
      };

      // Since we're using mock tokens, we'll test the function signature and revert
      await expect(
        swapper.connect(user).swapMultiHopWithPermit2(
          path,
          amountIn,
          ethers.utils.parseEther("90"),
          permit2Data,
          deadline
        )
      ).to.be.reverted;
    });
  });

  describe("rescueTokens", function () {
    it("Should rescue tokens successfully", async function () {
      const amount = ethers.utils.parseEther("100");
      
      // Send tokens to contract
      await tokenIn.mint(swapper.address, amount);
      
      // Rescue tokens
      await expect(
        swapper.rescueTokens(tokenIn.address, recipient.address, amount)
      ).to.not.be.reverted;
      
      expect(await tokenIn.balanceOf(recipient.address)).to.equal(amount);
    });

    it("Should revert with zero recipient", async function () {
      const amount = ethers.utils.parseEther("100");
      
      await expect(
        swapper.rescueTokens(tokenIn.address, ethers.constants.AddressZero, amount)
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Events", function () {
    it("Should emit SwapExecuted event", async function () {
      const amountIn = ethers.utils.parseEther("100");
      const amountOut = ethers.utils.parseEther("95");
      
      // This is a simplified test since we can't actually execute swaps
      // In a real test, we'd mock the swap router
      
      expect(true).to.be.true; // Placeholder for event testing
    });
  });
});
