// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IPermit2.sol";

contract UniswapPermitSwapper {
    // Uniswap V3 SwapRouter address (varies by network)
    address public constant SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    
    struct PermitData {
        address token;
        address spender;
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    
    struct Permit2Data {
        IPermit2.PermitSingle permit;
        bytes signature;
    }
    
    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    error InsufficientOutput();
    error TransferFailed();
    error InvalidSignature();
    
    /// @notice Execute a Uniswap swap using ERC20 permit for approval
    /// @param params Swap parameters
    /// @param permitData ERC20 permit signature data
    /// @param deadline Deadline for the swap
    function swapWithPermit(
        SwapParams calldata params,
        PermitData calldata permitData,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        // Verify permit is for this contract and correct token
        require(permitData.token == params.tokenIn, "Invalid token");
        require(permitData.spender == address(this), "Invalid spender");
        require(permitData.deadline >= block.timestamp, "Permit expired");
        
        // Use permit to approve tokens
        try IERC20Permit(params.tokenIn).permit(
            msg.sender,
            address(this),
            permitData.value,
            permitData.deadline,
            permitData.v,
            permitData.r,
            permitData.s
        ) {
            // Permit succeeded
        } catch {
            revert InvalidSignature();
        }
        
        // Transfer tokens from user
        require(
            IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn),
            "Transfer failed"
        );
        
        // Execute the swap
        amountOut = _executeSwap(params, deadline);
        
        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut
        );
    }
    
    /// @notice Execute a Uniswap swap using Permit2 for approval
    /// @param params Swap parameters
    /// @param permit2Data Permit2 signature data
    /// @param deadline Deadline for the swap
    function swapWithPermit2(
        SwapParams calldata params,
        Permit2Data calldata permit2Data,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        // Transfer tokens using Permit2
        IPermit2.SignatureTransferDetails memory transferDetails = IPermit2
            .SignatureTransferDetails({
                to: address(this),
                requestedAmount: params.amountIn
            });
            
        IPermit2(PERMIT2).permitTransferFrom(
            IPermit2.PermitTransferFrom({
                permitted: permit2Data.permit.details,
                spender: address(this),
                nonce: permit2Data.permit.details.nonce,
                deadline: deadline
            }),
            transferDetails,
            msg.sender,
            permit2Data.signature
        );
        
        // Execute the swap
        amountOut = _executeSwap(params, deadline);
        
        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut
        );
    }
    
    /// @notice Internal function to execute the actual swap
    /// @param params Swap parameters
    /// @param deadline Deadline for the swap
    function _executeSwap(
        SwapParams calldata params,
        uint256 deadline
    ) internal returns (uint256 amountOut) {
        // Approve SwapRouter to spend tokens
        IERC20(params.tokenIn).approve(SWAP_ROUTER, params.amountIn);
        
        // Prepare swap parameters
        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: params.tokenIn,
                tokenOut: params.tokenOut,
                fee: params.fee,
                recipient: params.recipient,
                deadline: deadline,
                amountIn: params.amountIn,
                amountOutMinimum: params.amountOutMinimum,
                sqrtPriceLimitX96: params.sqrtPriceLimitX96
            });
        
        // Execute swap
        amountOut = ISwapRouter(SWAP_ROUTER).exactInputSingle(swapParams);
        
        if (amountOut < params.amountOutMinimum) {
            revert InsufficientOutput();
        }
        
        return amountOut;
    }
    
    /// @notice Execute a multi-hop swap using Permit2
    /// @param path Encoded path for multi-hop swap
    /// @param amountIn Amount of input tokens
    /// @param amountOutMinimum Minimum amount of output tokens
    /// @param permit2Data Permit2 signature data
    /// @param deadline Deadline for the swap
    function swapMultiHopWithPermit2(
        bytes calldata path,
        uint256 amountIn,
        uint256 amountOutMinimum,
        Permit2Data calldata permit2Data,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        // Extract tokenIn from path
        address tokenIn = address(uint160(uint256(bytes32(path[:20]))));
        
        // Transfer tokens using Permit2
        IPermit2.SignatureTransferDetails memory transferDetails = IPermit2
            .SignatureTransferDetails({
                to: address(this),
                requestedAmount: amountIn
            });
            
        IPermit2(PERMIT2).permitTransferFrom(
            IPermit2.PermitTransferFrom({
                permitted: permit2Data.permit.details,
                spender: address(this),
                nonce: permit2Data.permit.details.nonce,
                deadline: deadline
            }),
            transferDetails,
            msg.sender,
            permit2Data.signature
        );
        
        // Approve SwapRouter to spend tokens
        IERC20(tokenIn).approve(SWAP_ROUTER, amountIn);
        
        // Execute multi-hop swap
        ISwapRouter.ExactInputParams memory swapParams = ISwapRouter
            .ExactInputParams({
                path: path,
                recipient: msg.sender,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum
            });
        
        amountOut = ISwapRouter(SWAP_ROUTER).exactInput(swapParams);
        
        if (amountOut < amountOutMinimum) {
            revert InsufficientOutput();
        }
        
        emit SwapExecuted(
            msg.sender,
            tokenIn,
            address(uint160(uint256(bytes32(path[path.length-20:])))),
            amountIn,
            amountOut
        );
    }
    
    /// @notice Rescue any tokens accidentally sent to the contract
    /// @param token Token address to rescue
    /// @param to Address to send tokens to
    /// @param amount Amount of tokens to rescue
    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external {
        require(to != address(0), "Invalid recipient");
        IERC20(token).transfer(to, amount);
    }
}
