// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint wad) external;
}

contract MockUniswapV2Router {
    address public WETH;
    
    constructor(address _WETH) {
        WETH = _WETH;
    }
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        require(deadline >= block.timestamp, "EXPIRED");
        
        // Transfer tokens from user
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);
        
        // Mint LP tokens (simplified)
        liquidity = (amountADesired + amountBDesired) / 2;
        
        return (amountADesired, amountBDesired, liquidity);
    }
    
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        require(deadline >= block.timestamp, "EXPIRED");
        
        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);
        
        // Mint LP tokens (simplified)
        liquidity = (amountTokenDesired + msg.value) / 2;
        
        return (amountTokenDesired, msg.value, liquidity);
    }
    
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public returns (uint amountA, uint amountB) {
        require(deadline >= block.timestamp, "EXPIRED");
        
        // Simplified calculation - return proportional amounts
        amountA = liquidity * 2;
        amountB = liquidity * 2;
        
        // Transfer tokens back to user
        IERC20(tokenA).transfer(to, amountA);
        IERC20(tokenB).transfer(to, amountB);
        
        return (amountA, amountB);
    }
    
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public returns (uint amountToken, uint amountETH) {
        require(deadline >= block.timestamp, "EXPIRED");
        
        // Simplified calculation
        amountToken = liquidity;
        amountETH = liquidity;
        
        // Transfer tokens and ETH back to user
        IERC20(token).transfer(to, amountToken);
        
        // For ETH, we would normally use WETH withdrawal
        // In this mock, we'll just simulate the transfer
        (bool success,) = to.call{value: amountETH}("");
        require(success, "ETH transfer failed");
        
        return (amountToken, amountETH);
    }
    
    receive() external payable {}
}
