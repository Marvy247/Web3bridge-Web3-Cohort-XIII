// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


contract aLottery {
    address public owner;
    address[] public players;
    address public recentWinner;
    uint256 public entryFee = 0.01 ether;
    uint256 public maxPlayers = 10;
    
   
    event PlayerJoined(address indexed player, uint256 indexed round);
    event WinnerSelected(address indexed winner, uint256 indexed prize, uint256 indexed round);
    event LotteryReset(uint256 indexed newRound);
    
    
    uint256 public lotteryRound = 1;
    
   
    mapping(address => bool) public hasEntered;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    

    function enterLottery() public payable {
        require(msg.value == entryFee, "Must send exactly 0.01 ETH");
        require(players.length < maxPlayers, "Lottery is full");
        require(!hasEntered[msg.sender], "Already entered this round");
        
        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        
        emit PlayerJoined(msg.sender, lotteryRound);
        

        if (players.length == maxPlayers) {
            _selectWinner();
        }
    }
    

    function _selectWinner() private {
        require(players.length == maxPlayers, "Not enough players");
        
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.difficulty, players))
        ) % players.length;
        
        address winner = players[randomIndex];
        recentWinner = winner;
        
        uint256 prize = address(this).balance;
        
        // Emit event before reset
        emit WinnerSelected(winner, prize, lotteryRound);
        
        // Transfer before reset
        (bool success, ) = winner.call{value: prize}("");
        require(success, "Transfer failed");
        
        _resetLottery();
    }
    

    function _resetLottery() private {

        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        delete players;
        lotteryRound++;
        
        emit LotteryReset(lotteryRound);
    }
    

    function getPlayersCount() public view returns (uint256) {
        return players.length;
    }
    

    function getPlayers() public view returns (address[] memory) {
        return players;
    }
    

    function getPrizePool() public view returns (uint256) {
        return address(this).balance;
    }
    

    function emergencyReset() public onlyOwner {
        _resetLottery();
    }
    

    receive() external payable {
        revert("Use enterLottery function to participate");
    }
}
