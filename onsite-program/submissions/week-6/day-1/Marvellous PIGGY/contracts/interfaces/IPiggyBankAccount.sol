// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyBankAccount {
    struct SavingsPlan {
        address owner;
        address tokenAddress;
        uint256 amount;
        uint256 lockPeriod;
        uint256 startTime;
        bool isActive;
    }

    event Deposit(address indexed user, address indexed tokenAddress, uint256 amount, uint256 lockPeriod);
    event Withdrawal(address indexed user, address indexed tokenAddress, uint256 amount, uint256 penalty);
    event SavingsPlanCreated(address indexed user, uint256 indexed planId, uint256 lockPeriod);

    function deposit(address tokenAddress, uint256 amount, uint256 lockPeriod) external payable;
    function withdraw(uint256 planId, uint256 amount) external;
    function getUserBalance(address user, address tokenAddress) external view returns (uint256);
    function getUserPlans(address user) external view returns (uint256[] memory);
    function getPlanDetails(uint256 planId) external view returns (SavingsPlan memory);
    function getTotalBalance(address user) external view returns (uint256);
}
