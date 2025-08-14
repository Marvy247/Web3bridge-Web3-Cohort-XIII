// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface ILootBox {
    enum TokenType {
        ERC20,
        ERC721,
        ERC1155
    }

    struct Reward {
        TokenType tokenType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
        uint256 weight;
    }

    struct LootBoxConfig {
        string name;
        string description;
        uint256 price;
        uint256 maxSupply;
        uint256 totalOpened;
        bool isActive;
    }

    event LootBoxOpened(address indexed user, uint256 indexed lootBoxId, address[] rewardAddresses, uint256[] rewardIds, uint256[] rewardAmounts);
    event RewardAdded(uint256 indexed lootBoxId, TokenType indexed tokenType, address indexed tokenAddress, uint256 tokenId, uint256 amount, uint256 weight);
    event LootBoxCreated(uint256 indexed lootBoxId, string name, uint256 price, uint256 maxSupply);
    event LootBoxUpdated(uint256 indexed lootBoxId, string name, uint256 price, uint256 maxSupply, bool isActive);

    function createLootBox(
        string memory name,
        string memory description,
        uint256 price,
        uint256 maxSupply
    ) external returns (uint256);

    function addReward(
        uint256 lootBoxId,
        TokenType tokenType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 weight
    ) external;

    function openLootBox(uint256 lootBoxId) external payable;

    function getLootBoxConfig(uint256 lootBoxId) external view returns (LootBoxConfig memory);

    function getRewards(uint256 lootBoxId) external view returns (Reward[] memory);

    function getTotalWeight(uint256 lootBoxId) external view returns (uint256);

    function withdrawTokens(address tokenAddress, uint256 amount) external;

    function withdrawNFT(address tokenAddress, uint256 tokenId, uint256 amount) external;

    function setLootBoxActive(uint256 lootBoxId, bool isActive) external;

    function updateLootBoxPrice(uint256 lootBoxId, uint256 newPrice) external;
}
