// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import "./interfaces/ILootBox.sol";

contract LootBox is ILootBox, Ownable, ReentrancyGuard, VRFV2PlusWrapperConsumerBase {
    uint256 private _lootBoxCounter;
    
    mapping(uint256 => LootBoxConfig) public lootBoxConfigs;
    mapping(uint256 => Reward[]) public rewards;
    mapping(uint256 => mapping(address => uint256)) public userOpenedCount;
    mapping(uint256 => uint256) public totalWeights;
    
    // VRF configuration
    uint32 private constant CALLBACK_GAS_LIMIT = 100000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    
    mapping(uint256 => address) private requestIdToUser;
    mapping(uint256 => uint256) private requestIdToLootBoxId;
    
    constructor(
        address _vrfWrapper
    ) VRFV2PlusWrapperConsumerBase(_vrfWrapper) Ownable(msg.sender) {}
    
    function createLootBox(
        string memory name,
        string memory description,
        uint256 price,
        uint256 maxSupply
    ) external onlyOwner returns (uint256) {
        uint256 lootBoxId = _lootBoxCounter++;
        
        lootBoxConfigs[lootBoxId] = LootBoxConfig({
            name: name,
            description: description,
            price: price,
            maxSupply: maxSupply,
            totalOpened: 0,
            isActive: true
        });
        
        emit LootBoxCreated(lootBoxId, name, price, maxSupply);
        return lootBoxId;
    }
    
    function addReward(
        uint256 lootBoxId,
        TokenType tokenType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 weight
    ) external onlyOwner {
        require(lootBoxId < _lootBoxCounter, "Invalid loot box ID");
        require(weight > 0, "Weight must be greater than 0");
        
        rewards[lootBoxId].push(Reward({
            tokenType: tokenType,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            amount: amount,
            weight: weight
        }));
        
        totalWeights[lootBoxId] += weight;
        
        emit RewardAdded(lootBoxId, tokenType, tokenAddress, tokenId, amount, weight);
    }
    
    function openLootBox(uint256 lootBoxId) external payable nonReentrant {
        LootBoxConfig storage config = lootBoxConfigs[lootBoxId];
        require(config.isActive, "Loot box is not active");
        require(msg.value >= config.price, "Insufficient payment");
        require(config.totalOpened < config.maxSupply, "Max supply reached");
        
        Reward[] storage rewardList = rewards[lootBoxId];
        require(rewardList.length > 0, "No rewards available");
        
        uint256 requestId = _requestRandomWords();
        requestIdToUser[requestId] = msg.sender;
        requestIdToLootBoxId[requestId] = lootBoxId;
        
        address[] memory rewardAddresses = new address[](1);
        uint256[] memory rewardIds = new uint256[](1);
        uint256[] memory rewardAmounts = new uint256[](1);
        
        rewardAddresses[0] = address(0);
        rewardIds[0] = 0;
        rewardAmounts[0] = 0;
        
        emit LootBoxOpened(msg.sender, lootBoxId, rewardAddresses, rewardIds, rewardAmounts);
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address user = requestIdToUser[requestId];
        uint256 lootBoxId = requestIdToLootBoxId[requestId];
        
        LootBoxConfig storage config = lootBoxConfigs[lootBoxId];
        Reward[] storage rewardList = rewards[lootBoxId];
        
        require(totalWeights[lootBoxId] > 0, "No rewards available");
        uint256 randomValue = randomWords[0] % totalWeights[lootBoxId];
        Reward memory selectedReward = _selectRewardWithRandom(lootBoxId, randomValue);
        
        _distributeReward(user, selectedReward);
        
        config.totalOpened++;
        userOpenedCount[lootBoxId][user]++;
        
        address[] memory rewardAddresses = new address[](1);
        uint256[] memory rewardIds = new uint256[](1);
        uint256[] memory rewardAmounts = new uint256[](1);
        
        rewardAddresses[0] = selectedReward.tokenAddress;
        rewardIds[0] = selectedReward.tokenId;
        rewardAmounts[0] = selectedReward.amount;
        
        emit LootBoxOpened(user, lootBoxId, rewardAddresses, rewardIds, rewardAmounts);
    }
    
    function _requestRandomWords() internal returns (uint256 requestId) {
        (uint256 requestId, ) = requestRandomness(
            CALLBACK_GAS_LIMIT,
            REQUEST_CONFIRMATIONS,
            NUM_WORDS,
            bytes("")
        );
        return requestId;
    }
    
    function _selectRewardWithRandom(uint256 lootBoxId, uint256 randomValue) internal view returns (Reward memory) {
        Reward[] storage rewardList = rewards[lootBoxId];
        
        uint256 cumulativeWeight = 0;
        for (uint256 i = 0; i < rewardList.length; i++) {
            cumulativeWeight += rewardList[i].weight;
            if (randomValue < cumulativeWeight) {
                return rewardList[i];
            }
        }
        
        return rewardList[rewardList.length - 1];
    }
    
    function _distributeReward(address recipient, Reward memory reward) internal {
        if (reward.tokenType == TokenType.ERC20) {
            IERC20(reward.tokenAddress).transfer(recipient, reward.amount);
        } else if (reward.tokenType == TokenType.ERC721) {
            IERC721(reward.tokenAddress).transferFrom(address(this), recipient, reward.tokenId);
        } else if (reward.tokenType == TokenType.ERC1155) {
            IERC1155(reward.tokenAddress).safeTransferFrom(address(this), recipient, reward.tokenId, reward.amount, "");
        }
    }
    
    function getLootBoxConfig(uint256 lootBoxId) external view returns (LootBoxConfig memory) {
        return lootBoxConfigs[lootBoxId];
    }
    
    function getRewards(uint256 lootBoxId) external view returns (Reward[] memory) {
        return rewards[lootBoxId];
    }
    
    function getTotalWeight(uint256 lootBoxId) external view returns (uint256) {
        return totalWeights[lootBoxId];
    }
    
    function withdrawTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }
    
    function withdrawNFT(address tokenAddress, uint256 tokenId, uint256 amount) external onlyOwner {
        IERC1155(tokenAddress).safeTransferFrom(address(this), owner(), tokenId, amount, "");
    }
    
    function setLootBoxActive(uint256 lootBoxId, bool isActive) external onlyOwner {
        require(lootBoxId < _lootBoxCounter, "Invalid loot box ID");
        lootBoxConfigs[lootBoxId].isActive = isActive;
        emit LootBoxUpdated(lootBoxId, lootBoxConfigs[lootBoxId].name, lootBoxConfigs[lootBoxId].price, lootBoxConfigs[lootBoxId].maxSupply, isActive);
    }
    
    function updateLootBoxPrice(uint256 lootBoxId, uint256 newPrice) external onlyOwner {
        require(lootBoxId < _lootBoxCounter, "Invalid loot box ID");
        lootBoxConfigs[lootBoxId].price = newPrice;
        emit LootBoxUpdated(lootBoxId, lootBoxConfigs[lootBoxId].name, newPrice, lootBoxConfigs[lootBoxId].maxSupply, lootBoxConfigs[lootBoxId].isActive);
    }
    
    receive() external payable {}
}
