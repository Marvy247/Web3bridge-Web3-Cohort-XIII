import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC7432, ERC7432__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ERC7432", function () {
  let erc7432: ERC7432;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let tokenAddress: string;

  const MEMBER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MEMBER"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN"));

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    tokenAddress = "0x1234567890123456789012345678901234567890";

    const ERC7432Factory = await ethers.getContractFactory("ERC7432");
    erc7432 = await ERC7432Factory.deploy();
  });

  describe("Role Management", function () {
    it("Should grant role successfully", async function () {
      const expirationDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      const revocable = true;
      const data = "0x1234";

      await erc7432.grantRole(
        MEMBER_ROLE,
        tokenAddress,
        1,
        addr1.address,
        expirationDate,
        revocable,
        data
      );

      expect(await erc7432.hasRole(MEMBER_ROLE, tokenAddress, 1, addr1.address)).to.be.true;
    });

    it("Should revert when granting role to zero address", async function () {
      const expirationDate = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        erc7432.grantRole(
          MEMBER_ROLE,
          tokenAddress,
          1,
          ethers.ZeroAddress,
          expirationDate,
          true,
          "0x"
        )
      ).to.be.revertedWith("ERC7432: user is zero address");
    });

    it("Should revert when expiration date is in the past", async function () {
      const expirationDate = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      
      await expect(
        erc7432.grantRole(
          MEMBER_ROLE,
          tokenAddress,
          1,
          addr1.address,
          expirationDate,
          true,
          "0x"
        )
      ).to.be.revertedWith("ERC7432: expiration date must be in future");
    });

    it("Should revoke role successfully", async function () {
      const expirationDate = Math.floor(Date.now() / 1000) + 86400;
      
      await erc7432.grantRole(
        MEMBER_ROLE,
        tokenAddress,
        1,
        addr1.address,
        expirationDate,
        true,
        "0x"
      );

      expect(await erc7432.hasRole(MEMBER_ROLE, tokenAddress, 1, addr1.address)).to.be.true;

      await erc7432.revokeRole(MEMBER_ROLE, tokenAddress, 1, addr1.address);

      expect(await erc7432.hasRole(MEMBER_ROLE, tokenAddress, 1, addr1.address)).to.be.false;
    });

    it("Should revert when revoking non-existent role", async function () {
      await expect(
        erc7432.revokeRole(MEMBER_ROLE, tokenAddress, 1, addr1.address)
      ).to.be.revertedWith("ERC7432: role not granted");
    });

    it("Should return correct role data", async function () {
      const expirationDate = Math.floor(Date.now() / 1000) + 86400;
      const revocable = false;
      const data = "0x5678";

      await erc7432.grantRole(
        ADMIN_ROLE,
        tokenAddress,
        1,
        addr1.address,
        expirationDate,
        revocable,
        data
      );

      const [expDate, rev, roleData] = await erc7432.roleData(
        ADMIN_ROLE,
        tokenAddress,
        1,
        addr1.address
      );

      expect(expDate).to.equal(expirationDate);
      expect(rev).to.equal(revocable);
      expect(roleData).to.equal(data);
    });

    it("Should return false for expired roles", async function () {
      const expirationDate = Math.floor(Date.now() / 1000) + 1; // 1 second from now
      
      await erc7432.grantRole(
        MEMBER_ROLE,
        tokenAddress,
        1,
        addr1.address,
        expirationDate,
        true,
        "0x"
      );

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(await erc7432.hasRole(MEMBER_ROLE, tokenAddress, 1, addr1.address)).to.be.false;
    });

    it("Should emit RoleGranted event", async function () {
      const expirationDate = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        erc7432.grantRole(
          MEMBER_ROLE,
          tokenAddress,
          1,
          addr1.address,
          expirationDate,
          true,
          "0x1234"
        )
      ).to.emit(erc7432, "RoleGranted")
        .withArgs(
          MEMBER_ROLE,
          tokenAddress,
          1,
          addr1.address,
          expirationDate,
          true,
          "0x1234"
        );
    });

    it("Should emit RoleRevoked event", async function () {
      const expirationDate = Math.floor(Date.now() / 1000) + 86400;
      
      await erc7432.grantRole(
        MEMBER_ROLE,
        tokenAddress,
        1,
        addr1.address,
        expirationDate,
        true,
        "0x"
      );

      await expect(
        erc7432.revokeRole(MEMBER_ROLE, tokenAddress, 1, addr1.address)
      ).to.emit(erc7432, "RoleRevoked")
        .withArgs(MEMBER_ROLE, tokenAddress, 1, addr1.address);
    });
  });
});
