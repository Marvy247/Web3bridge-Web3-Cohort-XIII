import { ethers, run } from "hardhat";

async function main() {
  const MarvellousToken = await ethers.getContractFactory("MarvellousToken");
  const marvellousToken = await MarvellousToken.deploy(1000000);

  await marvellousToken.waitForDeployment();

  console.log("MarvellousToken deployed to:", marvellousToken.target);

  // Verify the contract on Etherscan
  await run("verify:verify", {
    address: marvellousToken.target,
    constructorArguments: [1000000],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});