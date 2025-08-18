import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame } from "../typechain-types/contracts/LudoGame.sol/LudoGame";
import { LudoToken } from "../typechain-types/contracts/LudoToken";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import "@nomicfoundation/hardhat-chai-matchers";

describe("LudoGame", function () {
  let ludoGame: LudoGame;
  let ludoToken: LudoToken;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;
  let player4: SignerWithAddress;

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    const LudoToken = await ethers.getContractFactory("LudoToken");
    ludoToken = await LudoToken.deploy();
    await ludoToken.waitForDeployment();

    const LudoGame = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGame.deploy(await ludoToken.getAddress());
    await ludoGame.waitForDeployment();

    await ludoToken.transfer(player1.address, ethers.parseEther("1000"));
    await ludoToken.transfer(player2.address, ethers.parseEther("1000"));
    await ludoToken.transfer(player3.address, ethers.parseEther("1000"));
    await ludoToken.transfer(player4.address, ethers.parseEther("1000"));
  });

  describe("Game Creation", function () {
    it("Should create a new game", async function () {
      const stakeAmount = ethers.parseEther("10");
      await expect(ludoGame.createGame(stakeAmount))
        .to.not.be.reverted;
      
      const gameDetails = await ludoGame.getGameDetails(1);
      expect(gameDetails.id).to.equal(1);
      expect(gameDetails.stakeAmount).to.equal(stakeAmount);
      expect(gameDetails.state).to.equal(0); // NOT_STARTED
    });

    it("Should fail to create game with zero stake", async function () {
      await expect(ludoGame.createGame(0))
        .to.be.revertedWith("Stake must be greater than 0");
    });
  });

  describe("Player Registration", function () {
    let gameId: bigint;

    beforeEach(async function () {
      gameId = 1n;
      await ludoGame.createGame(ethers.parseEther("10"));
    });

    it("Should register a player", async function () {
      await expect(ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0))
        .to.emit(ludoGame, "PlayerRegistered")
        .withArgs(gameId, player1.address, "Player1", 0);
    });

    it("Should fail to register with empty name", async function () {
      await expect(ludoGame.connect(player1).registerPlayer(gameId, "", 0))
        .to.be.revertedWith("Name cannot be empty");
    });

    it("Should fail to register twice", async function () {
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await expect(ludoGame.connect(player1).registerPlayer(gameId, "Player1", 1))
        .to.be.revertedWith("Already registered");
    });

    it("Should fail to register with duplicate color", async function () {
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await expect(ludoGame.connect(player2).registerPlayer(gameId, "Player2", 0))
        .to.be.revertedWith("Color already taken");
    });

    it("Should fail to register more than 4 players", async function () {
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Player2", 1);
      await ludoGame.connect(player3).registerPlayer(gameId, "Player3", 2);
      await ludoGame.connect(player4).registerPlayer(gameId, "Player4", 3);
      
      const [player5] = await ethers.getSigners();
      await expect(ludoGame.connect(player5).registerPlayer(gameId, "Player5", 0))
        .to.be.revertedWith("Maximum players reached");
    });
  });

  describe("Game Start", function () {
    let gameId: bigint;

    beforeEach(async function () {
      gameId = 1n;
      await ludoGame.createGame(ethers.parseEther("10"));
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Player2", 1);
    });

    it("Should start game successfully", async function () {
      await ludoToken.connect(player1).approve(ludoGame.getAddress(), ethers.parseEther("10"));
      await ludoToken.connect(player2).approve(ludoGame.getAddress(), ethers.parseEther("10"));

      await expect(ludoGame.startGame(gameId))
        .to.emit(ludoGame, "GameStarted")
        .withArgs(gameId, [player1.address, player2.address], ethers.parseEther("10"));
    });

    it("Should fail to start game with insufficient players", async function () {
      await expect(ludoGame.startGame(gameId))
        .to.be.revertedWith("Minimum 2 players required");
    });

    it("Should fail to start game without token approval", async function () {
      await ludoToken.connect(player1).approve(ludoGame.getAddress(), ethers.parseEther("10"));
      
      await expect(ludoGame.startGame(gameId))
        .to.be.revertedWith("Stake transfer failed");
    });
  });

  describe("Game Play", function () {
    let gameId: bigint;

    beforeEach(async function () {
      gameId = 1n;
      await ludoGame.createGame(ethers.parseEther("10"));
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Player2", 1);
      
      await ludoToken.connect(player1).approve(ludoGame.getAddress(), ethers.parseEther("10"));
      await ludoToken.connect(player2).approve(ludoGame.getAddress(), ethers.parseEther("10"));
      
      await ludoGame.startGame(gameId);
    });

    it("Should roll dice successfully", async function () {
      const diceValue = await ludoGame.connect(player1).rollDice(gameId);
      expect(diceValue).to.be.greaterThan(0).and.lessThan(7);
    });

    it("Should move player successfully", async function () {
      const diceValue = 5;
      
      await expect(ludoGame.connect(player1).movePlayer(gameId, diceValue))
        .to.emit(ludoGame, "PlayerMoved")
        .withArgs(gameId, player1.address, diceValue);
    });

    it("Should fail to move with invalid dice value", async function () {
      await expect(ludoGame.connect(player1).movePlayer(gameId, 7))
        .to.be.revertedWith("Invalid dice value");
    });

    it("Should fail to move when not player's turn", async function () {
      await expect(ludoGame.connect(player2).movePlayer(gameId, 5))
        .to.be.revertedWith("Not your turn");
    });

    it("Should finish game when player reaches 50", async function () {
      // Create a new game for this test
      const stakeAmount = ethers.parseEther("10");
      const newGameId = await ludoGame.createGame.staticCall(stakeAmount);
      await ludoGame.createGame(stakeAmount);
      
      // Register 2 players
      await ludoGame.connect(player1).registerPlayer(newGameId, "Player1", 0); // RED
      await ludoGame.connect(player2).registerPlayer(newGameId, "Player2", 1); // GREEN
      
      // Approve tokens for both players
      await ludoToken.connect(player1).approve(ludoGame.getAddress(), ethers.parseEther("100"));
      await ludoToken.connect(player2).approve(ludoGame.getAddress(), ethers.parseEther("100"));
      
      // Start the game
      await ludoGame.startGame(newGameId);
      
      // Move player1 to position 50
      let currentPlayer: any = player1;
      let position = 0;
      
      while (position < 50) {
        const diceValue = Math.min(6, 50 - position);
        await ludoGame.connect(currentPlayer).movePlayer(newGameId, diceValue);
        
        const playerDetails = await ludoGame.getPlayerDetails(newGameId, currentPlayer.address);
        position = Number(playerDetails.position);
        
        if (position >= 50) {
          break;
        }
        
        // Switch to next player
        const gameDetails = await ludoGame.getGameDetails(newGameId);
        const nextPlayerAddress = gameDetails.currentTurn;
        
        // Find the signer for the next player
        if (nextPlayerAddress === player1.address) {
          currentPlayer = player1;
        } else {
          currentPlayer = player2;
        }
      }
      
      // Verify game finished
      const gameDetails = await ludoGame.getGameDetails(newGameId);
      expect(gameDetails.winner).to.not.equal(ethers.ZeroAddress);
      expect(gameDetails.state).to.equal(2); // FINISHED
    });
  });

  describe("Game Queries", function () {
    let gameId: bigint;

    beforeEach(async function () {
      gameId = 1n;
      await ludoGame.createGame(ethers.parseEther("10"));
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
    });

    it("Should get game details", async function () {
      const gameDetails = await ludoGame.getGameDetails(gameId);
      expect(gameDetails.id).to.equal(gameId);
      expect(gameDetails.players).to.include(player1.address);
    });

    it("Should get player details", async function () {
      const playerDetails = await ludoGame.getPlayerDetails(gameId, player1.address);
      expect(playerDetails.name).to.equal("Player1");
      expect(playerDetails.color).to.equal(0);
      expect(playerDetails.hasRegistered).to.be.true;
    });

    it("Should get player games", async function () {
      const playerGames = await ludoGame.getPlayerGames(player1.address);
      expect(playerGames).to.include(gameId);
    });
  });
});
