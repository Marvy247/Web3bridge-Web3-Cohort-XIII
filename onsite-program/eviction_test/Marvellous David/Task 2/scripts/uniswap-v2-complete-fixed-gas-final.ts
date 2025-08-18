import { ethers } from "hardhat";
import { Contract } from "ethers";

// Uniswap V2 addresses for different networks
const ADDRESSES = {
    mainnet: {
        router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    },
    sepolia: {
        router: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
        factory: "0xB7f907f7A9D1D4d4e5C5f9E6D8C7B5A3F1E8D9C",
        weth: "0xfFf9976782d46CC05630D1A6eB71fE7B7bD2db24"
    }
};

// Complete Uniswap V2 Router ABI
const UNISWAP_V2_ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
    "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function approve(address spender, uint amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint)",
    "function decimals() external view returns (uint8)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)"
];

class UniswapV2Interactor {
    private router: Contract;
    private signer: any;

    constructor(signer: any) {
        this.signer = signer;
        this.router = new ethers.Contract(
            "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
            UNISWAP_V2_ROUTER_ABI,
            signer
        );
    }

    async getTokenContract(address: string): Promise<Contract> {
        return new ethers.Contract(address, ERC20_ABI, this.signer);
    }

    async approveToken(tokenAddress: string, amount: string): Promise<void> {
        const token = await this.getTokenContract(tokenAddress);
        const tx = await token.approve(await this.router.getAddress(), amount, {
            gasLimit: 100000
        });
        await tx.wait();
        console.log("Approval successful");
    }

    async addLiquidity(
        tokenA: string,
        tokenB: string,
        amountADesired: string,
        amountBDesired: string
    ): Promise<any> {
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        
        console.log(`Adding liquidity: ${amountADesired} ${tokenA} + ${amountBDesired} ${tokenB}`);
        
        const tx = await this.router.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            "0",
            "0",
            this.signer.address,
            deadline,
            {
                gasLimit: 500000
            }
        );

        const receipt = await tx.wait();
        console.log("Liquidity added successfully!");
        return receipt;
    }

    async swapExactTokensForTokens(
        amountIn: string,
        amountOutMin: string,
        path: string[]
    ): Promise<any> {
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

        console.log(`Swapping ${amountIn} of ${path[0]} for ${path[path.length - 1]}`);
        
        const tx = await this.router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            this.signer.address,
            deadline,
            {
                gasLimit: 300000
            }
        );

        const receipt = await tx.wait();
        console.log("Swap completed successfully!");
        return receipt;
    }

    async getAmountsOut(amountIn: string, path: string[]): Promise<string[]> {
        const amounts = await this.router.getAmountsOut(amountIn, path);
        return amounts.map((amount: any) => amount.toString());
    }
}

async function demonstrateAllFunctions() {
    const [signer] = await ethers.getSigners();
    const interactor = new UniswapV2Interactor(signer);

    console.log("=== Uniswap V2 Complete Interaction Demo ===\n");

    // Deploy test tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    const tokenA = await MockERC20.deploy("Token A", "TKNA", 18);
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    
    const tokenB = await MockERC20.deploy("Token B", "TKNB", 18);
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();

    // Mint tokens
    await tokenA.mint(signer.address, ethers.parseEther("1000"));
    await tokenB.mint(signer.address, ethers.parseEther("1000"));

    console.log("Token A deployed at:", tokenAAddress);
    console.log("Token B deployed at:", tokenBAddress);

    // Approve tokens
    await interactor.approveToken(tokenAAddress, ethers.parseEther("1000").toString());
    await interactor.approveToken(tokenBAddress, ethers.parseEther("1000").toString());

    // Get token info
    const tokenAContract = await interactor.getTokenContract(tokenAAddress);
    const tokenBContract = await interactor.getTokenContract(tokenBAddress);
    
    const [nameA, nameB] = await Promise.all([
        tokenAContract.name(),
        tokenBContract.name()
    ]);
    console.log("Token A:", nameA);
    console.log("Token B:", nameB);

    // Add liquidity
    await interactor.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        ethers.parseEther("100").toString(),
        ethers.parseEther("200").toString()
    );

    // Get amounts out
    const amountsOut = await interactor.getAmountsOut(
        ethers.parseEther("10").toString(),
        [tokenAAddress, tokenBAddress]
    );
    console.log("Amounts out:", amountsOut);

    // Swap tokens
    await interactor.swapExactTokensForTokens(
        ethers.parseEther("1").toString(),
        ethers.parseEther("0.5").toString(),
        [tokenAAddress, tokenBAddress]
    );

    console.log("\n=== Demo completed successfully! ===");
}

// Run the demo
if (require.main === module) {
    demonstrateAllFunctions()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { UniswapV2Interactor };
