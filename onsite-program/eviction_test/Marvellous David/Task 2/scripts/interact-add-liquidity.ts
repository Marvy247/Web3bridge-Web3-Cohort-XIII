import { ethers } from "hardhat";
import { Contract } from "ethers";

// Uniswap V2 Router ABI
const UNISWAP_V2_ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function factory() external pure returns (address)",
    "function WETH() external pure returns (address)",
    "function getLiquidityBalance(address user, address tokenA, address tokenB) external view returns (uint256)",
    "function getPoolBalances(address tokenA, address tokenB) external view returns (uint256 tokenABalance, uint256 tokenBBalance)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function approve(address spender, uint amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint)",
    "function mint(address to, uint amount) external",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)"
];

class UniswapV2AddLiquidityInteractor {
    private router: Contract;
    private signer: any;

    constructor(signer: any, routerAddress: string) {
        this.signer = signer;
        this.router = new ethers.Contract(routerAddress, UNISWAP_V2_ROUTER_ABI, signer);
    }

    async getTokenContract(address: string): Promise<Contract> {
        return new ethers.Contract(address, ERC20_ABI, this.signer);
    }

    async approveToken(tokenAddress: string, amount: string): Promise<void> {
        const token = await this.getTokenContract(tokenAddress);
        const tx = await token.approve(await this.router.getAddress(), amount);
        await tx.wait();
        console.log(`✅ Approval successful for ${amount} tokens`);
    }

    async addLiquidity(
        tokenA: string,
        tokenB: string,
        amountADesired: string,
        amountBDesired: string,
        amountAMin: string = "0",
        amountBMin: string = "0"
    ): Promise<any> {
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        
        console.log(`\n🔄 Adding liquidity:`);
        console.log(`   Token A: ${amountADesired} tokens`);
        console.log(`   Token B: ${amountBDesired} tokens`);
        
        const tx = await this.router.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            this.signer.address,
            deadline
        );

        const receipt = await tx.wait();
        console.log("✅ Liquidity added successfully!");
        
        // Parse the receipt for liquidity details
        const logs = receipt.logs;
        for (const log of logs) {
            try {
                const parsed = this.router.interface.parseLog(log);
                if (parsed && parsed.name === "LiquidityAdded") {
                    console.log(`   Amount A: ${parsed.args.amountA.toString()}`);
                    console.log(`   Amount B: ${parsed.args.amountB.toString()}`);
                    console.log(`   Liquidity: ${parsed.args.liquidity.toString()}`);
                }
            } catch (e) {
                // Continue if log can't be parsed
            }
        }
        
        return receipt;
    }

    async addLiquidityETH(
        token: string,
        amountTokenDesired: string,
        amountTokenMin: string = "0",
        amountETHMin: string = "0"
    ): Promise<any> {
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        const ethAmount = ethers.parseEther("1"); // 1 ETH
        
        console.log(`\n🔄 Adding liquidity with ETH:`);
        console.log(`   Token: ${amountTokenDesired} tokens`);
        console.log(`   ETH: ${ethAmount.toString()} wei`);
        
        const tx = await this.router.addLiquidityETH(
            token,
            amountTokenDesired,
            amountTokenMin,
            amountETHMin,
            this.signer.address,
            deadline,
            { value: ethAmount }
        );

        const receipt = await tx.wait();
        console.log("✅ Liquidity with ETH added successfully!");
        return receipt;
    }

    async getLiquidityBalance(user: string, tokenA: string, tokenB: string): Promise<string> {
        const balance = await this.router.getLiquidityBalance(user, tokenA, tokenB);
        return balance.toString();
    }

    async getPoolBalances(tokenA: string, tokenB: string): Promise<{tokenABalance: string, tokenBBalance: string}> {
        const balances = await this.router.getPoolBalances(tokenA, tokenB);
        return {
            tokenABalance: balances.tokenABalance.toString(),
            tokenBBalance: balances.tokenBBalance.toString()
        };
    }

    async getTokenInfo(tokenAddress: string): Promise<{name: string, symbol: string, balance: string}> {
        const token = await this.getTokenContract(tokenAddress);
        const [name, symbol, balance] = await Promise.all([
            token.name(),
            token.symbol(),
            token.balanceOf(this.signer.address)
        ]);
        return { name, symbol, balance: balance.toString() };
    }
}

async function demonstrateAddLiquidity() {
    console.log("🚀 Starting Uniswap V2 Add Liquidity Demo\n");
    
    const [signer] = await ethers.getSigners();
    console.log(`📍 Using account: ${signer.address}`);
    
    // Deploy MockUniswapV2Router
    const MockUniswapV2Router = await ethers.getContractFactory("MockUniswapV2Router");
    const router = await MockUniswapV2Router.deploy();
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log(`📍 Router deployed at: ${routerAddress}`);
    
    // Create interactor instance
    const interactor = new UniswapV2AddLiquidityInteractor(signer, routerAddress);
    
    // Deploy test tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    console.log("\n🪙 Deploying test tokens...");
    const tokenA = await MockERC20.deploy("Token A", "TKNA", 18);
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    
    const tokenB = await MockERC20.deploy("Token B", "TKNB", 18);
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    
    console.log(`   Token A: ${tokenAAddress}`);
    console.log(`   Token B: ${tokenBAddress}`);
    
    // Mint tokens to signer
    console.log("\n💰 Minting tokens to signer...");
    await tokenA.mint(signer.address, ethers.parseEther("1000"));
    await tokenB.mint(signer.address, ethers.parseEther("1000"));
    
    // Get token info
    const tokenAInfo = await interactor.getTokenInfo(tokenAAddress);
    const tokenBInfo = await interactor.getTokenInfo(tokenBAddress);
    
    console.log(`   ${tokenAInfo.name} (${tokenAInfo.symbol}): ${tokenAInfo.balance}`);
    console.log(`   ${tokenBInfo.name} (${tokenBInfo.symbol}): ${tokenBInfo.balance}`);
    
    // Approve tokens for router
    console.log("\n✅ Approving tokens for router...");
    await interactor.approveToken(tokenAAddress, ethers.parseEther("100").toString());
    await interactor.approveToken(tokenBAddress, ethers.parseEther("100").toString());
    
    // Add liquidity
    console.log("\n🔄 Adding liquidity...");
    await interactor.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        ethers.parseEther("50").toString(),  // 50 Token A
        ethers.parseEther("50").toString(),  // 50 Token B
        ethers.parseEther("45").toString(),  // Min 45 Token A
        ethers.parseEther("45").toString()   // Min 45 Token B
    );
    
    // Check liquidity balance
    const liquidityBalance = await interactor.getLiquidityBalance(
        signer.address,
        tokenAAddress,
        tokenBAddress
    );
    console.log(`\n💧 Liquidity tokens received: ${liquidityBalance}`);
    
    // Check pool balances
    const poolBalances = await interactor.getPoolBalances(tokenAAddress, tokenBAddress);
    console.log(`\n🏊 Pool balances:`);
    console.log(`   Token A: ${poolBalances.tokenABalance}`);
    console.log(`   Token B: ${poolBalances.tokenBBalance}`);
    
    // Demonstrate add liquidity with ETH
    console.log("\n💰 Adding liquidity with ETH...");
    await interactor.addLiquidityETH(
        tokenAAddress,
        ethers.parseEther("25").toString(),  // 25 Token A
        ethers.parseEther("20").toString(),  // Min 20 Token A
        ethers.parseEther("0.5").toString()  // Min 0.5 ETH
    );
    
    console.log("\n✅ Demo completed successfully!");
}

// Main execution
if (require.main === module) {
    demonstrateAddLiquidity()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { UniswapV2AddLiquidityInteractor };
