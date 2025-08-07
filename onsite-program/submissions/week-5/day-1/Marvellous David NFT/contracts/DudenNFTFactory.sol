// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DudenNFT.sol";

contract DudenNFTFactory {
    // Array to store all deployed NFT collections
    DudenNFT[] public deployedCollections;
    
    // Events
    event CollectionCreated(
        address indexed collectionAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 timestamp
    );
    
    // Mapping to track collections created by specific addresses
    mapping(address => DudenNFT[]) public userCollections;
    
    // Total number of collections created
    uint256 public totalCollections;
    
    /**
     * @dev Creates a new DudenNFT collection
     * @return collectionAddress The address of the newly created collection
     */
    function createCollection() external returns (address collectionAddress) {
        // Deploy new DudenNFT contract
        DudenNFT newCollection = new DudenNFT();
        
        // Store collection details
        deployedCollections.push(newCollection);
        userCollections[msg.sender].push(newCollection);
        totalCollections++;
        
        // Emit event
        emit CollectionCreated(
            address(newCollection),
            msg.sender,
            "DUDE",
            "DDE",
            block.timestamp
        );
        
        return address(newCollection);
    }
    
    /**
     * @dev Creates multiple collections at once
     * @param count Number of collections to create
     * @return collectionAddresses Array of addresses for the created collections
     */
    function createMultipleCollections(uint256 count) external returns (address[] memory collectionAddresses) {
        require(count > 0 && count <= 10, "Invalid count");
        
        collectionAddresses = new address[](count);
        
        for (uint256 i = 0; i < count; i++) {
            DudenNFT newCollection = new DudenNFT();
            deployedCollections.push(newCollection);
            userCollections[msg.sender].push(newCollection);
            totalCollections++;
            
            collectionAddresses[i] = address(newCollection);
            
            emit CollectionCreated(
                address(newCollection),
                msg.sender,
                "DUDE",
                "DDE",
                block.timestamp
            );
        }
    }
    
    /**
     * @dev Get all collections created by a specific user
     * @param user Address of the user
     * @return collections Array of collection addresses
     */
    function getUserCollections(address user) external view returns (address[] memory collections) {
        DudenNFT[] storage userColls = userCollections[user];
        collections = new address[](userColls.length);
        
        for (uint256 i = 0; i < userColls.length; i++) {
            collections[i] = address(userColls[i]);
        }
    }
    
    /**
     * @dev Get all deployed collections
     * @return collections Array of all collection addresses
     */
    function getAllCollections() external view returns (address[] memory collections) {
        collections = new address[](deployedCollections.length);
        
        for (uint256 i = 0; i < deployedCollections.length; i++) {
            collections[i] = address(deployedCollections[i]);
        }
    }
    
    /**
     * @dev Get total collections created by a user
     * @param user Address of the user
     * @return count Number of collections created by the user
     */
    function getUserCollectionCount(address user) external view returns (uint256 count) {
        return userCollections[user].length;
    }
    
    /**
     * @dev Get collection details
     * @param collectionIndex Index of the collection
     * @return collectionAddress Address of the collection
     * @return creator Address of the creator
     * @return name Name of the collection
     * @return symbol Symbol of the collection
     */
    function getCollectionDetails(uint256 collectionIndex) 
        external 
        view 
        returns (
            address collectionAddress,
            address creator,
            string memory name,
            string memory symbol
        ) 
    {
        require(collectionIndex < deployedCollections.length, "Invalid index");
        
        DudenNFT collection = deployedCollections[collectionIndex];
        collectionAddress = address(collection);
        creator = collection.owner();
        name = collection.name();
        symbol = collection.symbol();
    }
}
