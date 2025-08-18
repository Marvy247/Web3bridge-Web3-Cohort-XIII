import { ethers } from "hardhat";
import { Contract } from "ethers";

// Uniswap V2 Router ABI (simplified for liquidity operations)
const UNISWAP_V2_ROUTER_ABI = [
    "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
    "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function approve(address spender, uint amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint)",
    "function mint(address to, uint amount) external",
    "function decimals() external view returns (uint8)"
];

async function removeLiquidityDemo() {
    console.log("=== Uniswap V2 Remove Liquidity Demo ===\n");

    // Get signers
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Deploy a mock Uniswap V2 Router for testing (since we're on local network)
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
    const router = await MockRouter.deploy("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
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

    // Deploy mock LP token
    const MockPair = await ethers.getContractFactory("MockERC20");
    const lpToken = await MockPair.deploy("LP Token", "LP-TKN", 18);
    await lpToken.waitForDeployment();
    const lpTokenAddress = await lpToken.getAddress();
    console.log("LP Token deployed at:", lpTokenAddress);

    // Mint tokens to signer
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("1000");
    const lpAmount = ethers.parseEther("100");
    
    await tokenA.mint(signer.address, amountA);
    await tokenB.mint(signer.address, amountB);
    await lpToken.mint(signer.address, lpAmount);
    
    console.log("Minted 1000 TKNA, 1000 TKNB, and 100 LP tokens to", signer.address);

    // Create router contract instance
    const routerContract = new ethers.Contract(routerAddress, UNISWAP_V2_ROUTER_ABI, signer);

    // Check initial balances
    const initialBalanceA = await tokenA.balanceOf(signer.address);
    const initialBalanceB = await tokenB.balanceOf(signer.address);
    const initialLpBalance = await lpToken.balanceOf(signer.address);
    
    console.log("\nInitial balances:");
    console.log("TKNA balance:", ethers.formatEther(initialBalanceA));
    console.log("TKNB balance:", ethers.formatEther(initialBalanceB));
    console.log("LP Token balance:", ethers.formatEther(initialLpBalance));

    // Approve router to spend LP tokens
    console.log("\nApproving LP tokens for router...");
    await lpToken.approve(routerAddress, lpAmount);
    console.log("LP tokens approved");

    // Remove liquidity
    console.log("\nRemoving liquidity...");
    const liquidityToRemove = ethers.parseEther("50");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await routerContract.removeLiquidity(
        tokenAAddress,
        tokenBAddress,
        liquidityToRemove,
        0, // amountAMin
        0, // amountBMin
        signer.address,
        deadline
    );

    const receipt = await tx.wait();
    console.log("Liquidity removed successfully!");
    console.log("Transaction hash:", receipt.hash);

    // Check final balances
    const finalBalanceA = await tokenA.balanceOf(signer.address);
    const finalBalanceB = await tokenB.balanceOf(signer.address);
    const finalLpBalance = await lpToken.balanceOf(signer.address);
    
    console.log("\nFinal balances:");
    console.log("TKNA balance:", ethers.formatEther(finalBalanceA));
    console.log("TKNB balance:", ethers.formatEther(finalBalanceB));
    console.log("LP Token balance:", ethers.formatEther(finalLpBalance));

    console.log("\n=== Demo completed successfully! ===");
}

// Run the demo
if (require.main === module) {
    removeLiquidityDemo()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Error:", error);
            process.exit(1);
        });
}

export { removeLiquidityDemo };
