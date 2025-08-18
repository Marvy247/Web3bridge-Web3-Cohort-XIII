import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("aLottery", function () {
  let lottery: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  const ENTRY_FEE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("aLottery");
    lottery = await Lottery.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lottery.owner()).to.equal(owner.address);
    });

    it("Should have correct entry fee", async function () {
      expect(await lottery.entryFee()).to.equal(ENTRY_FEE);
    });

    it("Should have correct max players", async function () {
      expect(await lottery.maxPlayers()).to.equal(10);
    });
  });

  describe("Entering Lottery", function () {
    it("Should allow user to enter with exact fee", async function () {
      await expect(
        lottery.connect(addr1).enterLottery({ value: ENTRY_FEE })
      ).to.not.be.reverted;
    });

    it("Should revert if not exact fee", async function () {
      await expect(
        lottery.connect(addr1).enterLottery({ value: ethers.parseEther("0.02") })
      ).to.be.revertedWith("Must send exactly 0.01 ETH");
    });

    it("Should track players correctly", async function () {
      await lottery.connect(addr1).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayersCount()).to.equal(1);
      expect(await lottery.players(0)).to.equal(addr1.address);
    });

    it("Should prevent duplicate entry", async function () {
      await lottery.connect(addr1).enterLottery({ value: ENTRY_FEE });
      await expect(
        lottery.connect(addr1).enterLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("Already entered this round");
    });

    it("Should emit PlayerJoined event", async function () {
      await expect(lottery.connect(addr1).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(addr1.address, 1);
    });
  });

  describe("Winner Selection", function () {
    it("Should select winner after 10 players", async function () {
      // Add 9 players first
      for (let i = 0; i < 9; i++) {
        await lottery.connect(addrs[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayersCount()).to.equal(9);
      
      // Add 10th player which should trigger winner selection
      await lottery.connect(addrs[9]).enterLottery({ value: ENTRY_FEE });
      
      expect(await lottery.getPlayersCount()).to.equal(0); // Should be reset
      expect(await lottery.recentWinner()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should transfer prize pool to winner", async function () {
      const prizePool = ENTRY_FEE * 10n;
      
      // Add 9 players first
      for (let i = 0; i < 9; i++) {
        await lottery.connect(addrs[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      const winnerAddress = await addrs[3].getAddress();
      const initialBalance = await ethers.provider.getBalance(winnerAddress);
      
      // Add 10th player to trigger winner selection
      await lottery.connect(addrs[9]).enterLottery({ value: ENTRY_FEE });
      
      // Check if one of the players received the prize
      let winnerFound = false;
      for (let i = 0; i < 10; i++) {
        const balance = await ethers.provider.getBalance(addrs[i].address);
        if (balance > initialBalance) {
          winnerFound = true;
          break;
        }
      }
      expect(winnerFound).to.be.true;
    });

    it("Should emit WinnerSelected event", async function () {
      // Add 9 players first
      for (let i = 0; i < 9; i++) {
        await lottery.connect(addrs[i]).enterLottery({ value: ENTRY_FEE });
      }

      // Add 10th player which should trigger winner selection and emit event
      await expect(lottery.connect(addrs[9]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "WinnerSelected");
    });
  });

  describe("Lottery Reset", function () {
    it("Should reset lottery after winner selection", async function () {
      // Add 10 players and select winner
      for (let i = 0; i < 10; i++) {
        await lottery.connect(addrs[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.lotteryRound()).to.equal(2);
      expect(await lottery.getPlayersCount()).to.equal(0);
    });

    it("Should allow new round after reset", async function () {
      // Complete first round
      for (let i = 0; i < 10; i++) {
        await lottery.connect(addrs[i]).enterLottery({ value: ENTRY_FEE });
      }

      // Start new round
      await lottery.connect(addr1).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayersCount()).to.equal(1);
      expect(await lottery.lotteryRound()).to.equal(2);
    });
  });

  describe("Security", function () {
    it("Should prevent emergency reset by non-owner", async function () {
      await expect(
        lottery.connect(addr1).emergencyReset()
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should allow emergency reset by owner", async function () {
      await expect(lottery.connect(owner).emergencyReset()).to.not.be.reverted;
    });
  });
});
