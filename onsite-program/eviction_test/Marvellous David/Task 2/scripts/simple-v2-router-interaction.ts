import { ethers } from "hardhat";
import { Contract } from "ethers";

// Simple ABI for basic interactions
const ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

const ERC20_ABI = [
    "function approve(address spender, uint amount) external returns (bool)",
    "function mint(address to, uint amount) external",
    "function balanceOf(address account) external view returns (uint)"
];

// Simple script to interact with v2 router functions
async function simpleV2RouterInteraction() {
    console.log("=== Simple V2 Router Interaction Demo ===\n");

    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Deploy mock router
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
    const router = await MockRouter.deploy(ethers.ZeroAddress); // Mock WETH
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("Mock V2 Router:", routerAddress);

    // Deploy test tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    const tokenA = await MockERC20.deploy("Token A", "TKNA", 18);
    await tokenA.waitForDeployment();
    const tokenB = await MockERC20.deploy("Token B", "TKNB", 18);
    await tokenB.waitForDeployment();
    
    const tokenAAddress = await tokenA.getAddress();
    const tokenBAddress = await tokenB.getAddress();
    
    console.log("Token A:", tokenAAddress);
    console.log("Token B:", tokenBAddress);

    // Create router contract instance
    const routerContract = new ethers.Contract(routerAddress, ROUTER_ABI, signer);

    // 1. Add Liquidity Demo
    console.log("\n--- 1. Adding Liquidity ---");
    
    // Mint tokens for liquidity
    const liquidityAmountA = ethers.parseEther("1000");
    const liquidityAmountB = ethers.parseEther("1000");
    
    await tokenA.mint(signer.address, liquidityAmountA);
    await tokenB.mint(signer.address, liquidityAmountB);
    
    // Approve router
    await tokenA.approve(routerAddress, liquidityAmountA);
    await tokenB.approve(routerAddress, liquidityAmountB);
    
    // Add liquidity
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const addLiquidityTx = await routerContract.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        liquidityAmountA,
        liquidityAmountB,
        0, // amountAMin
        0, // amountBMin
        signer.address,
        deadline
    );
    
    console.log("Liquidity added! Tx:", await addLiquidityTx.wait());

    // 2. Simple Swap Demo
    console.log("\n--- 2. Simple Token Swap ---");
    
    // Mint more tokens for swapping
    const swapAmount = ethers.parseEther("100");
    await tokenA.mint(signer.address, swapAmount);
    await tokenA.approve(routerAddress, swapAmount);
    
    // Mock swap (in real scenario, this would use actual liquidity)
    console.log("Simulating swap of 100 TKNA for TKNB...");
    console.log("In production, this would use actual Uniswap V2 router");

    // 3. Remove Liquidity Demo
    console.log("\n--- 3. Removing Liquidity ---");
    
    const liquidityToRemove = ethers.parseEther("100");
    const removeLiquidityTx = await routerContract.removeLiquidity(
        tokenAAddress,
        tokenBAddress,
        liquidityToRemove,
        0, // amountAMin
        0, // amountBMin
        signer.address,
        deadline
    );
    
    console.log("Liquidity removed! Tx:", await removeLiquidityTx.wait());

    // Check final balances
    const finalBalanceA = await tokenA.balanceOf(signer.address);
    const finalBalanceB = await tokenB.balanceOf(signer.address);
    
    console.log("\n--- Final Results ---");
    console.log("Final TKNA balance:", ethers.formatEther(finalBalanceA));
    console.log("Final TKNB balance:", ethers.formatEther(finalBalanceB));
    console.log("\n=== V2 Router Interaction Complete! ===");
}

// Helper function for quick liquidity addition
async function addLiquidityQuick(
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string,
    routerAddress: string,
    signer: any
) {
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
    
    const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, signer);
    const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, signer);
    
    const amountADesired = ethers.parseEther(amountA);
    const amountBDesired = ethers.parseEther(amountB);
    
    await tokenAContract.approve(routerAddress, amountADesired);
    await tokenBContract.approve(routerAddress, amountBDesired);
    
    const deadline = Math.floor(Date.now() / 1000) + 300;
    
    const tx = await router.addLiquidity(
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        0,
        0,
        await signer.getAddress(),
        deadline
    );
    
    return await tx.wait();
}

// Run the script
if (require.main === module) {
    simpleV2RouterInteraction()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Error:", error);
            process.exit(1);
        });
}

export { simpleV2RouterInteraction, addLiquidityQuick };
