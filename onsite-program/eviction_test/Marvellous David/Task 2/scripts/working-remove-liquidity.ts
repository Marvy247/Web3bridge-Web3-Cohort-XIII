import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting Remove Liquidity Demo\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Using account:", signer.address);

  // Deploy mock tokens
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TKNA", 18);
  const tokenB = await MockERC20.deploy("Token B", "TKNB", 18);
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();

  console.log("\n🪙 Deployed tokens:");
  console.log("   Token A:", await tokenA.getAddress());
  console.log("   Token B:", await tokenB.getAddress());

  // Deploy mock router with WETH address
  const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
  const router = await MockRouter.deploy("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  await router.waitForDeployment();
  console.log("\n📍 Router deployed at:", await router.getAddress());

  // Deploy mock LP token
  const MockPair = await ethers.getContractFactory("MockERC20");
  const lpToken = await MockPair.deploy("LP Token", "LP-TKN", 18);
  await lpToken.waitForDeployment();
  console.log("🏊 LP Token deployed at:", await lpToken.getAddress());

  // Mint tokens
  const amount = ethers.parseEther("1000");
  await tokenA.mint(signer.address, amount);
  await tokenB.mint(signer.address, amount);
  await lpToken.mint(signer.address, ethers.parseEther("100"));

  console.log("\n💰 Initial balances:");
  console.log("   Token A:", ethers.formatEther(await tokenA.balanceOf(signer.address)));
  console.log("   Token B:", ethers.formatEther(await tokenB.balanceOf(signer.address)));
  console.log("   LP Tokens:", ethers.formatEther(await lpToken.balanceOf(signer.address)));

  // Approve router to spend LP tokens
  await lpToken.approve(await router.getAddress(), ethers.parseEther("100"));
  console.log("\n✅ Approved router to spend LP tokens");

  // Remove liquidity
  console.log("\n🔄 Removing liquidity...");
  const tx = await router.removeLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    ethers.parseEther("50"),
    ethers.parseEther("40"),
    ethers.parseEther("40"),
    signer.address,
    Math.floor(Date.now() / 1000) + 3600
  );

  await tx.wait();
  console.log("✅ Liquidity removed!");

  console.log("\n💰 Final balances:");
  console.log("   Token A:", ethers.formatEther(await tokenA.balanceOf(signer.address)));
  console.log("   Token B:", ethers.formatEther(await tokenB.balanceOf(signer.address)));
  console.log("   LP Tokens:", ethers.formatEther(await lpToken.balanceOf(signer.address)));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
