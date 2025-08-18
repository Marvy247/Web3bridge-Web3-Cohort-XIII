// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { NOT_STARTED, STARTED, FINISHED }
    
    struct Player {
        address playerAddress;
        string name;
        uint256 score;
        Color color;
        bool hasRegistered;
        uint256 position;
    }
    
    struct Game {
        uint256 gameId;
        address[] players;
        mapping(address => Player) playerDetails;
        uint256 stakeAmount;
        address winner;
        GameState state;
        address currentTurn;
        uint256 lastDiceRoll;
        IERC20 token;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    
    uint256 public gameCounter;
    IERC20 public gameToken;
    
    event PlayerRegistered(uint256 indexed gameId, address indexed player, string name, Color color);
    event GameStarted(uint256 indexed gameId, address[] players, uint256 stakeAmount);
    event DiceRolled(uint256 indexed gameId, address indexed player, uint256 diceValue);
    event PlayerMoved(uint256 indexed gameId, address indexed player, uint256 newPosition);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prize);
    
    modifier onlyRegisteredPlayer(uint256 gameId) {
        require(games[gameId].playerDetails[msg.sender].hasRegistered, "Not registered");
        _;
    }
    
    modifier gameNotStarted(uint256 gameId) {
        require(games[gameId].state == GameState.NOT_STARTED, "Game already started");
        _;
    }
    
    modifier gameStarted(uint256 gameId) {
        require(games[gameId].state == GameState.STARTED, "Game not started");
        _;
    }
    
    modifier gameNotFinished(uint256 gameId) {
        require(games[gameId].state != GameState.FINISHED, "Game finished");
        _;
    }
    
    modifier playersTurn(uint256 gameId) {
        require(games[gameId].currentTurn == msg.sender, "Not your turn");
        _;
    }
    
    constructor(address _tokenAddress) {
        gameToken = IERC20(_tokenAddress);
    }
    
    function createGame(uint256 stakeAmount) external returns (uint256) {
        require(stakeAmount > 0, "Stake must be greater than 0");
        
        gameCounter++;
        uint256 newGameId = gameCounter;
        
        games[newGameId].gameId = newGameId;
        games[newGameId].stakeAmount = stakeAmount;
        games[newGameId].state = GameState.NOT_STARTED;
        games[newGameId].token = gameToken;
        
        return newGameId;
    }
    
    function registerPlayer(uint256 gameId, string memory name, Color color) external gameNotStarted(gameId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(!games[gameId].playerDetails[msg.sender].hasRegistered, "Already registered");
        require(games[gameId].players.length < 4, "Maximum players reached");
        
        for (uint i = 0; i < games[gameId].players.length; i++) {
            require(games[gameId].playerDetails[games[gameId].players[i]].color != color, "Color already taken");
        }
        
        games[gameId].playerDetails[msg.sender] = Player({
            playerAddress: msg.sender,
            name: name,
            score: 0,
            color: color,
            hasRegistered: true,
            position: 0
        });
        
        games[gameId].players.push(msg.sender);
        playerGames[msg.sender].push(gameId);
        
        emit PlayerRegistered(gameId, msg.sender, name, color);
    }
    
    function startGame(uint256 gameId) external gameNotStarted(gameId) {
        require(games[gameId].players.length >= 2, "Minimum 2 players required");
        require(games[gameId].players.length <= 4, "Maximum 4 players allowed");
        
        uint256 totalStake = games[gameId].stakeAmount * games[gameId].players.length;
        
        for (uint i = 0; i < games[gameId].players.length; i++) {
            address player = games[gameId].players[i];
            require(gameToken.transferFrom(player, address(this), games[gameId].stakeAmount), "Stake transfer failed");
        }
        
        games[gameId].state = GameState.STARTED;
        games[gameId].currentTurn = games[gameId].players[0];
        
        emit GameStarted(gameId, games[gameId].players, games[gameId].stakeAmount);
    }
    
    function rollDice(uint256 gameId) external view gameStarted(gameId) playersTurn(gameId) gameNotFinished(gameId) returns (uint256) {
        return _generateRandomNumber();
    }
    
    function movePlayer(uint256 gameId, uint256 diceValue) external gameStarted(gameId) playersTurn(gameId) gameNotFinished(gameId) {
        require(diceValue >= 1 && diceValue <= 6, "Invalid dice value");
        
        Player storage player = games[gameId].playerDetails[msg.sender];
        player.position += diceValue;
        
        if (player.position >= 50) {
            player.position = 50;
            games[gameId].winner = msg.sender;
            games[gameId].state = GameState.FINISHED;
            
            uint256 prize = games[gameId].stakeAmount * games[gameId].players.length;
            require(gameToken.transfer(msg.sender, prize), "Prize transfer failed");
            
            emit GameFinished(gameId, msg.sender, prize);
        }
        
        emit PlayerMoved(gameId, msg.sender, player.position);
        
        _nextTurn(gameId);
    }
    
    function _generateRandomNumber() private view returns (uint256) {
        return (uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 6) + 1;
    }
    
    function _nextTurn(uint256 gameId) private {
        address[] memory players = games[gameId].players;
        address current = games[gameId].currentTurn;
        
        for (uint i = 0; i < players.length; i++) {
            if (players[i] == current) {
                uint nextIndex = (i + 1) % players.length;
                games[gameId].currentTurn = players[nextIndex];
                break;
            }
        }
    }
    
    function getGameDetails(uint256 gameId) external view returns (
        uint256 id,
        address[] memory players,
        uint256 stakeAmount,
        address winner,
        GameState state,
        address currentTurn
    ) {
        Game storage game = games[gameId];
        return (game.gameId, game.players, game.stakeAmount, game.winner, game.state, game.currentTurn);
    }
    
    function getPlayerDetails(uint256 gameId, address player) external view returns (
        string memory name,
        uint256 score,
        Color color,
        bool hasRegistered,
        uint256 position
    ) {
        Player storage p = games[gameId].playerDetails[player];
        return (p.name, p.score, p.color, p.hasRegistered, p.position);
    }
    
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    function getCurrentPlayerTurn(uint256 gameId) external view returns (address) {
        return games[gameId].currentTurn;
    }
    
    function getDiceRoll(uint256 gameId) external view returns (uint256) {
        return games[gameId].lastDiceRoll;
    }
}
