// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IPiggyBankAccount.sol";

contract PiggyBankAccount is IPiggyBankAccount {
    using SafeERC20 for IERC20;

    address public factory;
    address public admin;
    
    uint256 public constant BREAKING_FEE_PERCENTAGE = 3; // 3% fee
    uint256 public constant FEE_DENOMINATOR = 100;
    
    uint256 private _planIdCounter;
    mapping(uint256 => SavingsPlan) public savingsPlans;
    mapping(address => uint256[]) public userPlans;
    mapping(address => mapping(address => uint256)) public userTokenBalances; // user => token => balance
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call");
        _;
    }

    constructor(address _factory, address _admin) {
        factory = _factory;
        admin = _admin;
    }

    function deposit(address tokenAddress, uint256 amount, uint256 lockPeriod) external payable override {
        require(amount > 0, "Amount must be greater than 0");
        require(lockPeriod > 0, "Lock period must be greater than 0");

        if (tokenAddress == address(0)) {
            // ETH deposit
            require(msg.value == amount, "ETH amount mismatch");
            userTokenBalances[msg.sender][address(0)] += amount;
        } else {
            // ERC20 deposit
            require(msg.value == 0, "Cannot send ETH with ERC20");
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
            userTokenBalances[msg.sender][tokenAddress] += amount;
        }

        uint256 planId = _planIdCounter++;
        savingsPlans[planId] = SavingsPlan({
            owner: msg.sender,
            tokenAddress: tokenAddress,
            amount: amount,
            lockPeriod: lockPeriod,
            startTime: block.timestamp,
            isActive: true
        });

        userPlans[msg.sender].push(planId);

        emit Deposit(msg.sender, tokenAddress, amount, lockPeriod);
        emit SavingsPlanCreated(msg.sender, planId, lockPeriod);
    }

    function withdraw(uint256 planId, uint256 amount) external override {
        require(savingsPlans[planId].isActive, "Plan is not active");
        require(savingsPlans[planId].owner == msg.sender, "Not plan owner");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= savingsPlans[planId].amount, "Insufficient balance");

        SavingsPlan storage plan = savingsPlans[planId];
        uint256 penalty = 0;
        uint256 withdrawAmount = amount;

        // Check if withdrawing before lock period
        if (block.timestamp < plan.startTime + plan.lockPeriod) {
            penalty = (amount * BREAKING_FEE_PERCENTAGE) / FEE_DENOMINATOR;
            withdrawAmount = amount - penalty;
            
            // Transfer penalty to factory admin
            if (plan.tokenAddress == address(0)) {
                (bool success, ) = admin.call{value: penalty}("");
                require(success, "ETH transfer failed");
            } else {
                IERC20(plan.tokenAddress).safeTransfer(admin, penalty);
            }
        }

        plan.amount -= amount;
        userTokenBalances[msg.sender][plan.tokenAddress] -= amount;

        if (plan.amount == 0) {
            plan.isActive = false;
        }

        // Transfer remaining amount to user
        if (plan.tokenAddress == address(0)) {
            (bool success, ) = msg.sender.call{value: withdrawAmount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(plan.tokenAddress).safeTransfer(msg.sender, withdrawAmount);
        }

        emit Withdrawal(msg.sender, plan.tokenAddress, withdrawAmount, penalty);
    }

    function getUserBalance(address user, address tokenAddress) external view override returns (uint256) {
        return userTokenBalances[user][tokenAddress];
    }

    function getUserPlans(address user) external view override returns (uint256[] memory) {
        return userPlans[user];
    }

    function getPlanDetails(uint256 planId) external view override returns (SavingsPlan memory) {
        return savingsPlans[planId];
    }

    function getTotalBalance(address user) external view override returns (uint256) {
        uint256 totalBalance = 0;
        uint256[] memory plans = userPlans[user];
        
        for (uint256 i = 0; i < plans.length; i++) {
            if (savingsPlans[plans[i]].isActive) {
                totalBalance += savingsPlans[plans[i]].amount;
            }
        }
        
        return totalBalance;
    }

    // Helper function to get active plans count
    function getActivePlansCount(address user) external view returns (uint256) {
        uint256 count = 0;
        uint256[] memory plans = userPlans[user];
        
        for (uint256 i = 0; i < plans.length; i++) {
            if (savingsPlans[plans[i]].isActive) {
                count++;
            }
        }
        
        return count;
    }

    // Helper function to check if withdrawal will incur penalty
    function willIncurPenalty(uint256 planId) external view returns (bool) {
        SavingsPlan memory plan = savingsPlans[planId];
        return block.timestamp < plan.startTime + plan.lockPeriod;
    }

    // Helper function to get penalty amount
    function getPenaltyAmount(uint256 planId, uint256 amount) external view returns (uint256) {
        SavingsPlan memory plan = savingsPlans[planId];
        if (block.timestamp < plan.startTime + plan.lockPeriod) {
            return (amount * BREAKING_FEE_PERCENTAGE) / FEE_DENOMINATOR;
        }
        return 0;
    }
}
