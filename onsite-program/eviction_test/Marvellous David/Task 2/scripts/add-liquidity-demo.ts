import { ethers } from "hardhat";
import { Contract } from "ethers";

// Uniswap V2 Router ABI (simplified for liquidity operations)
const UNISWAP_V2_ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function approve(address spender, uint amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint)",
    "function mint(address to, uint amount) external",
    "function decimals() external view returns (uint8)"
];

async function addLiquidityDemo() {
    console.log("=== Uniswap V2 Add Liquidity Demo ===\n");

    // Get signers
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Deploy a mock Uniswap V2 Router for testing (since we're on local network)
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
    const router = await MockRouter.deploy();
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
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("1000");
    
    await tokenA.mint(signer.address, amountA);
    await tokenB.mint(signer.address, amountB);
    
    console.log("Minted 1000 TKNA and 1000 TKNB to", signer.address);

    // Create router contract instance
    const routerContract = new ethers.Contract(routerAddress, UNISWAP_V2_ROUTER_ABI, signer);

    // Approve tokens for router
    console.log("Approving tokens for router...");
    await tokenA.approve(routerAddress, amountA);
    await tokenB.approve(routerAddress, amountB);
    console.log("Tokens approved");

    // Add liquidity
    console.log("Adding liquidity...");
    const liquidityAmountA = ethers.parseEther("100");
    const liquidityAmountB = ethers.parseEther("200");
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await routerContract.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        liquidityAmountA,
        liquidityAmountB,
        0, // amountAMin
        0, // amountBMin
        signer.address,
        deadline
    );

    const receipt = await tx.wait();
    console.log("Liquidity added successfully!");
    console.log("Transaction hash:", receipt.hash);

    // Check balances after adding liquidity
    const balanceA = await tokenA.balanceOf(signer.address);
    const balanceB = await tokenB.balanceOf(signer.address);
    
    console.log("\nFinal balances:");
    console.log("TKNA balance:", ethers.formatEther(balanceA));
    console.log("TKNB balance:", ethers.formatEther(balanceB));

    console.log("\n=== Demo completed successfully! ===");
}

// Create a simple Mock Router contract for testing
async function deployMockRouter() {
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
    return await MockRouter.deploy();
}

// Run the demo
if (require.main === module) {
    addLiquidityDemo()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Error:", error);
            process.exit(1);
        });
}

export { addLiquidityDemo };
