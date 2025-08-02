// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node`.
//
// When running with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // We get the contract to deploy
  const EmployeeManagement = await ethers.getContractFactory("EmployeeManagement");
  const employeeManagement = await EmployeeManagement.deploy();

  await employeeManagement.waitForDeployment();

  console.log("EmployeeManagement deployed to:", await employeeManagement.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
