import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { UniswapPermitSwapper, MockERC20 } from "../typechain-types";
import { parseEther } from "ethers";

describe("UniswapPermitSwapper Integration Tests", function () {
  let swapper: UniswapPermitSwapper;
  let tokenIn: MockERC20;
  let tokenOut: MockERC20;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;

  const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

  beforeEach(async function () {
    [owner, user, recipient] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenIn = await MockERC20.deploy("Token In", "TIN", 18);
    tokenOut = await MockERC20.deploy("Token Out", "TOUT", 18);

    const UniswapPermitSwapper = await ethers.getContractFactory("UniswapPermitSwapper");
    swapper = await UniswapPermitSwapper.deploy();

    await tokenIn.mint(await user.getAddress(), parseEther("1000"));
  });

  describe("Integration Tests", function () {
    it("Should handle token rescue correctly", async function () {
      const amount = parseEther("100");
      
      await tokenIn.mint(await swapper.getAddress(), amount);
      
      await expect(
        swapper.rescueTokens(await tokenIn.getAddress(), await recipient.getAddress(), amount)
      ).to.not.be.reverted;
      
      expect(await tokenIn.balanceOf(await recipient.getAddress())).to.equal(amount);
    });
  });
});
