// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PiggyBankAccount.sol";
import "./interfaces/IPiggyBankFactory.sol";

contract PiggyBankFactory is IPiggyBankFactory {
    address public immutable admin;
    address[] public allAccounts;
    mapping(address => address[]) public userAccounts;
    mapping(address => uint256) public accountCount;
    uint256 public totalBreakingFeesCollected;
    
    constructor() {
        admin = msg.sender;
    }

    function createSavingsAccount() external override returns (address) {
        PiggyBankAccount newAccount = new PiggyBankAccount(address(this), admin);
        address accountAddress = address(newAccount);
        
        userAccounts[msg.sender].push(accountAddress);
        allAccounts.push(accountAddress);
        accountCount[msg.sender]++;
        
        emit AccountCreated(msg.sender, accountAddress);
        
        return accountAddress;
    }

    function getUserAccounts(address user) external view override returns (address[] memory) {
        return userAccounts[user];
    }

    function getAccountCount(address user) external view override returns (uint256) {
        return accountCount[user];
    }

    function getAllAccounts() external view override returns (address[] memory) {
        return allAccounts;
    }

    function collectBreakingFee() external override {
        require(msg.sender == admin, "Only admin can collect fees");
        require(totalBreakingFeesCollected > 0, "No fees to collect");
        
        uint256 amount = totalBreakingFeesCollected;
        totalBreakingFeesCollected = 0;
        
        (bool success, ) = admin.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit BreakingFeeCollected(admin, amount);
    }

    function getAdmin() external view override returns (address) {
        return admin;
    }

    // Internal function to collect breaking fees from accounts
    function collectBreakingFeeFromAccount(uint256 amount) external {
        require(msg.sender == admin || isAccount(msg.sender), "Unauthorized");
        totalBreakingFeesCollected += amount;
    }

    // Helper function to check if address is a valid account
    function isAccount(address account) public view returns (bool) {
        for (uint256 i = 0; i < allAccounts.length; i++) {
            if (allAccounts[i] == account) {
                return true;
            }
        }
        return false;
    }

    // Helper function to get account details
    function getAccountDetails(address account) external view returns (
        address owner,
        uint256 totalBalance,
        uint256 activePlans,
        uint256 totalPlans
    ) {
        require(isAccount(account), "Invalid account");
        
        PiggyBankAccount accountContract = PiggyBankAccount(account);
        
        // Note: This would need to be implemented based on actual account structure
        // For now, returning placeholder values
        return (address(0), 0, 0, 0);
    }

    // Helper function to get factory statistics
    function getFactoryStats() external view returns (
        uint256 totalAccounts,
        uint256 totalUsers,
        uint256 totalFeesCollected
    ) {
        return (allAccounts.length, 0, totalBreakingFeesCollected);
    }
}
