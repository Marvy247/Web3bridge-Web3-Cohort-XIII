// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MarvellousToken.sol";
import "./Web3BridgeGarageAccess.sol";

contract Web3BridgeFactory {
    // Events
    event TokenDeployed(address indexed tokenAddress, string name, string symbol, uint256 initialSupply, address indexed owner);
    event GarageAccessDeployed(address indexed garageAddress, address indexed owner);
    event BatchDeployed(address indexed tokenAddress, address indexed garageAddress, address indexed owner);

    // Track deployed contracts
    mapping(address => address[]) public userDeployedTokens;
    mapping(address => address[]) public userDeployedGarages;
    
    // All deployed contracts
    address[] public allTokens;
    address[] public allGarages;

    // Deploy a new MarvellousToken
    function deployToken(
        uint256 _initialSupply,
        string memory _name,
        string memory _symbol
    ) external returns (address) {
        MarvellousToken token = new MarvellousToken(_initialSupply);
        
        // Update mappings
        userDeployedTokens[msg.sender].push(address(token));
        allTokens.push(address(token));
        
        emit TokenDeployed(address(token), _name, _symbol, _initialSupply, msg.sender);
        return address(token);
    }

    // Deploy a new Web3BridgeGarageAccess
    function deployGarageAccess() external returns (address) {
        Web3BridgeGarageAccess garage = new Web3BridgeGarageAccess();
        
        // Update mappings
        userDeployedGarages[msg.sender].push(address(garage));
        allGarages.push(address(garage));
        
        emit GarageAccessDeployed(address(garage), msg.sender);
        return address(garage);
    }

    // Deploy both token and garage in one transaction
    function deployBatch(
        uint256 _initialSupply,
        string memory _name,
        string memory _symbol
    ) external returns (address tokenAddress, address garageAddress) {
        // Deploy token
        MarvellousToken token = new MarvellousToken(_initialSupply);
        tokenAddress = address(token);
        
        // Deploy garage
        Web3BridgeGarageAccess garage = new Web3BridgeGarageAccess();
        garageAddress = address(garage);
        
        // Update mappings
        userDeployedTokens[msg.sender].push(tokenAddress);
        userDeployedGarages[msg.sender].push(garageAddress);
        allTokens.push(tokenAddress);
        allGarages.push(garageAddress);
        
        emit BatchDeployed(tokenAddress, garageAddress, msg.sender);
    }

    // Get all tokens deployed by a user
    function getUserTokens(address _user) external view returns (address[] memory) {
        return userDeployedTokens[_user];
    }

    // Get all garage access contracts deployed by a user
    function getUserGarages(address _user) external view returns (address[] memory) {
        return userDeployedGarages[_user];
    }

    // Get all deployed tokens
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    // Get all deployed garage access contracts
    function getAllGarages() external view returns (address[] memory) {
        return allGarages;
    }

    // Get total number of tokens deployed
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    // Get total number of garage access contracts deployed
    function getGarageCount() external view returns (uint256) {
        return allGarages.length;
    }

    // Get deployment details for a specific token
    function getTokenDetails(address _tokenAddress) external view returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply
    ) {
        MarvellousToken token = MarvellousToken(_tokenAddress);
        return (
            token.name(),
            token.symbol(),
            token.decimals(),
            token.totalSupply()
        );
    }

    // Check if an address is a token deployed by this factory
    function isFactoryToken(address _tokenAddress) external view returns (bool) {
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (allTokens[i] == _tokenAddress) {
                return true;
            }
        }
        return false;
    }

    // Check if an address is a garage access contract deployed by this factory
    function isFactoryGarage(address _garageAddress) external view returns (bool) {
        for (uint256 i = 0; i < allGarages.length; i++) {
            if (allGarages[i] == _garageAddress) {
                return true;
            }
        }
        return false;
    }
}
