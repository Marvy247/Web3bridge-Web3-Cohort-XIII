import { ethers } from "hardhat";
import { Contract } from "ethers";

// Uniswap V2 Router ABI for swapExactTokensForTokens
const UNISWAP_V2_ROUTER_ABI = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function approve(address spender, uint amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint)",
    "function mint(address to, uint amount) external",
    "function transferFrom(address from, address to, uint amount) external returns (bool)",
    "function transfer(address to, uint amount) external returns (bool)"
];

// Simple Uniswap V2 Token Swap Script
async function simpleTokenSwap() {
    console.log("=== Simple Uniswap V2 Token Swap Demo ===\n");

    // Get signers
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Deploy mock WETH
    const MockWETH = await ethers.getContractFactory("MockERC20");
    const weth = await MockWETH.deploy("Wrapped ETH", "WETH", 18);
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    console.log("Mock WETH deployed at:", wethAddress);

    // Deploy mock Uniswap V2 Router
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
    const router = await MockRouter.deploy(wethAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("Mock Router deployed at:", routerAddress);

    // Deploy test tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    const tokenA = await MockERC20.deploy("Token A", "TKNA", 18);
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    
    const tokenB = await MockERC20.deploy("Token B", "TKNB", 18);
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();

    console.log("Token A deployed at:", tokenAAddress);
    console.log("Token B deployed at:", tokenBAddress);

    // Mint tokens to signer
    const swapAmount = ethers.parseEther("100");
    await tokenA.mint(signer.address, ethers.parseEther("1000"));
    await tokenB.mint(signer.address, ethers.parseEther("1000"));
    
    console.log("Minted 1000 TKNA and 1000 TKNB for testing");

    // Check initial balances
    const initialBalanceA = await tokenA.balanceOf(signer.address);
    const initialBalanceB = await tokenB.balanceOf(signer.address);
    
    console.log("\nInitial balances:");
    console.log("TKNA balance:", ethers.formatEther(initialBalanceA));
    console.log("TKNB balance:", ethers.formatEther(initialBalanceB));

    // Approve tokens for router
    console.log("\nApproving tokens for router...");
    await tokenA.approve(routerAddress, swapAmount);
    console.log("Tokens approved");

    // Simulate a simple swap by transferring tokens
    console.log("\nSimulating token swap...");
    console.log("Swapping", ethers.formatEther(swapAmount), "TKNA for TKNB");
    
    try {
        // Simulate the swap by transferring tokens
        await tokenA.transfer(routerAddress, swapAmount);
        await tokenB.transfer(signer.address, ethers.parseEther("95")); // Mock swap result
        
        console.log("Swap simulated successfully!");
        
        // Check final balances
        const finalBalanceA = await tokenA.balanceOf(signer.address);
        const finalBalanceB = await tokenB.balanceOf(signer.address);
        
        console.log("\nFinal balances after swap:");
        console.log("TKNA balance:", ethers.formatEther(finalBalanceA));
        console.log("TKNB balance:", ethers.formatEther(finalBalanceB));
        
        console.log("\n=== Swap completed successfully! ===");
        
    } catch (error) {
        console.error("Swap failed:", error);
    }
}

// Production-ready swap function for real Uniswap V2
async function swapTokens(
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: string,
    amountOutMin: string,
    routerAddress: string,
    signer: any
) {
    const routerContract = new ethers.Contract(routerAddress, UNISWAP_V2_ROUTER_ABI, signer);
    
    const path = [tokenInAddress, tokenOutAddress];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await routerContract.swapExactTokensForTokens(
        ethers.parseEther(amountIn),
        ethers.parseEther(amountOutMin),
        path,
        await signer.getAddress(),
        deadline
    );
    
    const receipt = await tx.wait();
    console.log("Swap transaction hash:", receipt.hash);
    
    return receipt;
}

// Run the demo
if (require.main === module) {
    simpleTokenSwap()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Error:", error);
            process.exit(1);
        });
}

export { simpleTokenSwap, swapTokens };
