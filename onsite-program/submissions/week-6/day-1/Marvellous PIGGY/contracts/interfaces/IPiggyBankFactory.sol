// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyBankFactory {
    event AccountCreated(address indexed user, address indexed account);
    event BreakingFeeCollected(address indexed admin, uint256 amount);

    function createSavingsAccount() external returns (address);
    function getUserAccounts(address user) external view returns (address[] memory);
    function getAccountCount(address user) external view returns (uint256);
    function getAllAccounts() external view returns (address[] memory);
    function collectBreakingFee() external;
    function getAdmin() external view returns (address);
}
